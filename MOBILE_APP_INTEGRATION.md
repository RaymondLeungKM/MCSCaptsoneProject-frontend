# Mobile App Integration Guide

This guide explains how to integrate the preschool vocabulary platform website as an iframe in your mobile app and communicate with it.

## Overview

The website supports iframe embedding and provides a bidirectional communication API using the `postMessage` API. This allows the mobile app to:

- Send word learning events from object detection
- Synchronize user/child IDs
- Receive progress updates
- Control the view/tab displayed
- Authenticate users via token parameter

---

## Authentication for Mobile Apps

### Token-Based Authentication (Bypassing Login Page)

Mobile apps can authenticate users directly without requiring them to log in again on the website. The website accepts authentication tokens via URL parameters.

#### Supported Token Parameters

- `token` - JWT access token
- `session_token` - Alternative token parameter name
- `auth_token` - Alternative token parameter name

#### Usage

```javascript
// After user logs in to mobile app, open iframe with token
const jwtToken = await mobileAppLogin(email, password);
const iframeUrl = `https://your-domain.com?token=${jwtToken}&hideNav=true&view=home`;

// The website will automatically:
// 1. Extract the token from URL
// 2. Store it in localStorage
// 3. Remove it from URL (for security)
// 4. Authenticate all subsequent API calls
```

#### Implementation Details

The frontend automatically:

1. Checks for `token`, `session_token`, or `auth_token` in URL parameters on page load
2. Stores the token in `localStorage` under `auth_token` key
3. Removes the token from the URL for security
4. Includes the token in `Authorization: Bearer <token>` header for all API requests

This means once a user is authenticated via token parameter, all backend API calls will be automatically authenticated.

---

### Mobile App Registration Flow

When a user creates an account through your mobile app:

**Backend Endpoint:** `POST /api/v1/auth/register`

**Request:**

```json
{
  "email": "parent@example.com",
  "password": "securePassword123",
  "full_name": "John Doe"
}
```

**Response:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "user-uuid",
    "email": "parent@example.com",
    "full_name": "John Doe",
    "role": "parent",
    "is_active": true,
    "created_at": "2026-02-07T10:30:00Z"
  }
}
```

**Key Points:**

- Registration returns `access_token` immediately - no need for separate login
- Store this token in your mobile app
- Use this token to authenticate iframe and API calls
- Token is a JWT (JSON Web Token) valid for authenticated requests

**Example Flow:**

```javascript
// 1. User registers in mobile app
const response = await fetch(
  "https://api.your-domain.com/api/v1/auth/register",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: email,
      password: password,
      full_name: fullName,
    }),
  },
);

const data = await response.json();
const token = data.access_token;

// 2. Store token in mobile app
await SecureStore.setItemAsync("auth_token", token);

// 3. Open iframe with token
const iframeUrl = `https://your-domain.com?token=${token}&hideNav=true`;
loadIframe(iframeUrl);
```

---

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

## Backend API Endpoints

### 1. Image Upload (New!)

**POST `/api/v1/uploads/upload-image`**

Upload an image file directly from mobile device (e.g., camera photo).

**Request:**

- Content-Type: `multipart/form-data`
- Authentication: Required (Bearer token in Authorization header)
- File field name: `file`
- Supported formats: JPG, JPEG, PNG, GIF, WEBP
- Max size: 10MB

**Example (JavaScript/React Native):**

```javascript
// Upload image from camera
async function uploadImage(imageUri) {
  const formData = new FormData();
  formData.append("file", {
    uri: imageUri,
    type: "image/jpeg",
    name: "photo.jpg",
  });

  const response = await fetch(
    "https://api.your-domain.com/api/v1/uploads/upload-image",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      body: formData,
    },
  );

  return await response.json();
}
```

**Response:**

```json
{
  "success": true,
  "image_url": "https://api.your-domain.com/uploads/images/abc123.jpg",
  "filename": "abc123.jpg",
  "size": 123456,
  "content_type": "image/jpeg"
}
```

**Usage Flow:**

1. Mobile app captures photo with camera
2. Mobile app uploads file to this endpoint
3. Endpoint returns `image_url`
4. Mobile app uses `image_url` with `/vocabulary/external/word-learned` endpoint

---

### 2. Word Learning from External Sources

**POST `/api/v1/vocabulary/external/word-learned`**

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
  "image_url": "https://...", // Optional - use URL from upload endpoint
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
- If word doesn't exist in vocabulary, it will be created automatically in the "general" category

---

## Complete Mobile Object Detection Flow

Here's the complete flow for object detection with image upload:

```javascript
// 1. Capture photo from mobile camera
const imageUri = await capturePhoto();

// 2. Upload image to get URL
const uploadResult = await uploadImage(imageUri);
const imageUrl = uploadResult.image_url;

// 3. Perform object detection (locally or via cloud service)
const detectionResult = await detectObject(imageUri);

// 4. Record word learning with backend
const response = await fetch(
  "https://api.your-domain.com/api/v1/vocabulary/external/word-learned",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      word: detectionResult.label,
      child_id: currentChildId,
      timestamp: new Date().toISOString(),
      source: "object_detection",
      confidence: detectionResult.confidence,
      image_url: imageUrl, // URL from step 2
      metadata: {
        detectionModel: "yolov8",
        processingTime: detectionResult.processingTime,
      },
    }),
  },
);

const result = await response.json();

// 5. Update UI with results
showReward(`+${result.xp_awarded} XP!`);
updateProgress(result.level, result.total_xp);
```

---

## User Authentication Synchronization

**Recommended Approach:** Use the Token-Based Authentication (see top of document).

The platform supports shared JWT token authentication between mobile app and website:

1. Mobile app authenticates with backend (login or register)
2. Backend returns JWT token
3. Mobile app passes token to website via URL parameter: `?token={jwtToken}`
4. Website automatically stores and uses token for all API calls

```javascript
// After mobile app authentication
const iframeUrl = `https://your-domain.com?token=${jwtToken}&view=home&hideNav=true`;
```

**Alternative (postMessage):**

If you can't use URL parameters, you can send authentication info via postMessage:

```javascript
iframe.contentWindow.postMessage(
  {
    type: "SET_USER",
    userId: userId,
    childId: childId,
  },
  "*",
);
```

**Note:** The postMessage approach requires the iframe to already be loaded and authenticated separately. The URL token parameter approach is simpler and more secure.

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
