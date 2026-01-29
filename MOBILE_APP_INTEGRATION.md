# Mobile App Integration Guide

This guide explains how to integrate the preschool vocabulary platform website as an iframe in your mobile app and communicate with it.

## Overview

The website supports iframe embedding and provides a bidirectional communication API using the `postMessage` API. This allows the mobile app to:

- Send word learning events from object detection
- Synchronize user/child IDs
- Receive progress updates
- Control the view/tab displayed

## Embedding the Website

### Basic Iframe Setup

```html
<iframe
  id="vocab-iframe"
  src="https://your-domain.com?hideNav=true&view=home"
  width="100%"
  height="100%"
  allow="microphone"
></iframe>
```

### URL Parameters

- `view` or `tab`: Set initial view (`home`, `learn`, `games`, `rewards`, `profile`)
- `hideNav`: Set to `true` or `1` to hide bottom navigation (useful for mobile apps)

Example: `https://your-domain.com?view=learn&hideNav=true`

## Communication API

### Messages FROM Mobile App TO Website

The mobile app sends messages to the iframe using `postMessage`:

```javascript
const iframe = document.getElementById("vocab-iframe");
iframe.contentWindow.postMessage(message, "*");
```

#### 1. Set User/Child ID

Synchronize the authenticated user and child between the app and website.

```javascript
iframe.contentWindow.postMessage(
  {
    type: "SET_USER",
    userId: "user-uuid",
    childId: "child-uuid", // Optional
  },
  "*",
);
```

**Response:** Website will select the specified child profile.

---

#### 2. Word Learned (Object Detection)

Notify the website when a child learns a word through object detection in the mobile app.

```javascript
iframe.contentWindow.postMessage(
  {
    type: "WORD_LEARNED",
    wordId: "word-uuid", // Optional, if you know the word ID
    word: "elephant", // Required: the word text
    timestamp: "2026-01-28T10:30:00Z", // ISO 8601 timestamp
    source: "object_detection", // 'object_detection' | 'physical_activity'
    confidence: 0.95, // Optional: detection confidence (0-1)
    imageUrl: "https://...", // Optional: URL of the detected image
    metadata: {
      // Optional: additional data
      detectionModel: "yolov8",
      processingTime: 150,
    },
  },
  "*",
);
```

**Backend Processing:**

- Finds the word in the vocabulary database (by `wordId` or case-insensitive `word` text)
- Creates or updates word progress for the child
- Awards 10 XP on first exposure (subsequent exposures don't award XP)
- Updates child's aggregate stats (words learned, XP, level)
- Increments appropriate modality counter (visual for object detection, kinesthetic for physical activities)

**Response:** Website sends `PROGRESS_UPDATED` message back to app.

---

#### 3. Sync Progress

Request the website to refresh and sync the child's progress data.

```javascript
iframe.contentWindow.postMessage(
  {
    type: "SYNC_PROGRESS",
    childId: "child-uuid",
  },
  "*",
);
```

**Response:** Website refreshes data and sends `PROGRESS_UPDATED` message.

---

### Messages FROM Website TO Mobile App

The website sends messages to the parent window (mobile app). Listen for these messages:

```javascript
window.addEventListener("message", (event) => {
  // In production, validate event.origin for security
  // if (event.origin !== 'https://your-domain.com') return;

  const message = event.data;

  switch (message.type) {
    case "READY":
      // Website iframe has loaded and is ready
      console.log("Vocabulary platform ready");
      break;

    case "WORD_COMPLETED":
      // Child completed learning a word in the website
      console.log("Word completed:", message);
      // { type, wordId, word, xp, level, wordsLearned }
      updateLocalProgress(message);
      break;

    case "PROGRESS_UPDATED":
      // Child's progress has been updated
      console.log("Progress updated:", message);
      // { type, childId, xp, level, wordsLearned, todayProgress }
      syncProgressToApp(message);
      break;

    case "REQUEST_AUTH":
      // Website needs authentication
      sendAuthToWebsite();
      break;
  }
});
```

#### Message Types

**1. READY**

```javascript
{
  type: "READY";
}
```

Sent when the iframe has loaded and initialized.

**2. WORD_COMPLETED**

```javascript
{
  type: 'WORD_COMPLETED',
  wordId: 'word-uuid',
  word: 'elephant',
  xp: 110,              // Total XP after completion
  level: 2,             // Current level
  wordsLearned: 11      // Total words learned
}
```

Sent when a child completes learning a word through the website (Word of the Day, Learn view, etc.).

**3. PROGRESS_UPDATED**

```javascript
{
  type: 'PROGRESS_UPDATED',
  childId: 'child-uuid',
  xp: 110,
  level: 2,
  wordsLearned: 11,
  todayProgress: 3
}
```

Sent when progress is updated (after word completion, external word learning, or sync request).

**4. REQUEST_AUTH**

```javascript
{
  type: "REQUEST_AUTH";
}
```

Sent when the website needs user authentication (respond with `SET_USER` message).

---

## Backend API Endpoint

### POST `/api/vocabulary/external/word-learned`

Record word learning from external sources (mobile app).

**Request Body:**

```json
{
  "word": "elephant",
  "word_id": "word-uuid", // Optional
  "child_id": "child-uuid", // Required
  "timestamp": "2026-01-28T10:30:00Z",
  "source": "object_detection", // Required
  "confidence": 0.95, // Optional (0-1)
  "image_url": "https://...", // Optional
  "metadata": {} // Optional
}
```

**Response:**

```json
{
  "success": true,
  "word": "elephant",
  "word_id": "word-uuid",
  "child_id": "child-uuid",
  "exposure_count": 1,
  "xp_awarded": 10,
  "total_xp": 110,
  "level": 2,
  "words_learned": 11,
  "source": "object_detection",
  "timestamp": "2026-01-28T10:30:00Z"
}
```

**Notes:**

- XP (10 points) is only awarded on the **first exposure** to a word
- Subsequent exposures increase the exposure count but don't award XP
- Progress is tracked with modality-specific counters (visual, auditory, kinesthetic)

---

## User Authentication Synchronization

### Option 1: Shared JWT Token

If the mobile app and website share the same authentication backend:

1. Mobile app authenticates with backend
2. Mobile app gets JWT token
3. Mobile app passes token to website via URL parameter or postMessage
4. Website uses token for API calls

```javascript
// URL parameter approach
const iframeUrl = `https://your-domain.com?token=${jwtToken}&childId=${childId}`;

// Or postMessage approach
iframe.contentWindow.postMessage(
  {
    type: "SET_USER",
    userId: userId,
    childId: childId,
  },
  "*",
);
```

### Option 2: Separate Authentication

If using separate authentication systems:

1. Mobile app authenticates user
2. Mobile app creates/links user in website's backend
3. Mobile app passes user/child IDs to website
4. Website authenticates with its own system

---

## Example: Object Detection Flow

```javascript
// 1. Mobile app performs object detection
const detectionResult = await detectObject(imageData);

// 2. Send to website
iframe.contentWindow.postMessage(
  {
    type: "WORD_LEARNED",
    word: detectionResult.label, // e.g., "elephant"
    timestamp: new Date().toISOString(),
    source: "object_detection",
    confidence: detectionResult.confidence,
    imageUrl: detectionResult.imageUrl,
  },
  "*",
);

// 3. Listen for progress update
window.addEventListener("message", (event) => {
  if (event.data.type === "PROGRESS_UPDATED") {
    // Update mobile app UI with new XP, level, etc.
    updateProgressBar(event.data.xp, event.data.level);
    showToast(`+${event.data.xp} XP! Level ${event.data.level}`);
  }
});
```

---

## Security Considerations

### Production Setup

1. **Validate Origins:**

```javascript
// In website (iframe-bridge.ts)
if (event.origin !== "https://your-mobile-app.com") return;

// In mobile app
if (event.origin !== "https://your-vocab-website.com") return;
```

2. **Set Allowed Origin:**

```javascript
// In mobile app iframe setup
iframeBridge.setAllowedOrigin("https://your-vocab-website.com");
```

3. **Use HTTPS:**
   Always use HTTPS in production for both mobile app and website.

4. **Token Security:**
   Don't pass sensitive tokens via URL parameters. Use postMessage instead.

---

## React Native Example

```javascript
import React, { useRef, useEffect } from "react";
import { WebView } from "react-native-webview";

function VocabularyWebView({ childId, onProgressUpdate }) {
  const webviewRef = useRef(null);

  useEffect(() => {
    // Send child ID when component mounts
    sendMessage({
      type: "SET_USER",
      childId: childId,
    });
  }, [childId]);

  const sendMessage = (message) => {
    webviewRef.current?.postMessage(JSON.stringify(message));
  };

  const handleMessage = (event) => {
    const message = JSON.parse(event.nativeEvent.data);

    if (message.type === "PROGRESS_UPDATED") {
      onProgressUpdate(message);
    }
  };

  const handleObjectDetection = (word, confidence, imageUrl) => {
    sendMessage({
      type: "WORD_LEARNED",
      word: word,
      timestamp: new Date().toISOString(),
      source: "object_detection",
      confidence: confidence,
      imageUrl: imageUrl,
    });
  };

  return (
    <WebView
      ref={webviewRef}
      source={{ uri: "https://your-domain.com?hideNav=true" }}
      onMessage={handleMessage}
      javaScriptEnabled={true}
      mediaPlaybackRequiresUserAction={false}
    />
  );
}
```

---

## Testing

### Local Testing

1. Start the backend server:

```bash
cd backend
python main.py
```

2. Start the Next.js frontend:

```bash
cd preschool-vocabulary-platform
npm run dev
```

3. Open in iframe test page:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Iframe Test</title>
  </head>
  <body>
    <iframe
      id="vocab"
      src="http://localhost:3000?hideNav=true"
      width="100%"
      height="800px"
    ></iframe>

    <script>
      const iframe = document.getElementById("vocab");

      // Listen for messages from iframe
      window.addEventListener("message", (e) => {
        console.log("Received from iframe:", e.data);
      });

      // Send test message after iframe loads
      setTimeout(() => {
        iframe.contentWindow.postMessage(
          {
            type: "WORD_LEARNED",
            word: "elephant",
            timestamp: new Date().toISOString(),
            source: "object_detection",
            confidence: 0.95,
          },
          "*",
        );
      }, 3000);
    </script>
  </body>
</html>
```

---

## Troubleshooting

### Issue: Messages not being received

**Solution:** Check that:

1. Iframe has loaded (wait for `READY` message)
2. Origin validation is not blocking messages (use `'*'` for testing)
3. Messages are properly formatted JSON

### Issue: Word not found in database

**Solution:**

- Check that the word exists in the vocabulary database
- Word matching is case-insensitive
- Ensure `word` field contains the exact word text (e.g., "elephant", not "elephants")

### Issue: XP not awarded

**Solution:**

- XP is only awarded on **first exposure** (when `exposure_count` goes from 0 to 1)
- Check the response: `xp_awarded` field shows how much XP was awarded (0 or 10)
- Subsequent practices of the same word don't award XP (by design)

---

## Support

For issues or questions:

- Check browser console for error messages
- Enable debug logging: `iframeBridge` logs all messages with `[IframeBridge]` prefix
- Check network tab for API call failures
