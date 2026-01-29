# Mobile App Integration - Implementation Summary

## Overview

Implemented full bidirectional communication between the website (embedded as iframe) and mobile app for object detection and user synchronization.

## Files Created

### 1. `/lib/iframe-bridge.ts`

- **Purpose:** Communication bridge for iframe ↔ mobile app messaging
- **Features:**
  - Singleton pattern for global access
  - Event-based listener system
  - Automatic READY notification on load
  - Type-safe message interfaces
  - Security: Origin validation support
  - Detects if running in iframe context

### 2. `/app/api/vocabulary/external/word-learned/route.ts`

- **Purpose:** Next.js API route to forward external learning events to backend
- **Features:**
  - Accepts word learning from mobile app
  - Forwards to FastAPI backend with authentication
  - Returns updated progress data

### 3. `/backend/app/schemas/vocabulary.py` (Modified)

- **Added:** `ExternalWordLearning` schema
- **Fields:**
  - `word`: The learned word (required)
  - `word_id`: Optional word UUID
  - `child_id`: Child who learned the word (required)
  - `timestamp`: When word was learned
  - `source`: Learning source (object_detection, physical_activity)
  - `confidence`: Detection confidence (0-1)
  - `image_url`: Optional image URL
  - `metadata`: Additional data

### 4. `/backend/app/api/endpoints/vocabulary.py` (Modified)

- **Added:** `POST /external/word-learned` endpoint
- **Logic:**
  - Finds word by ID or case-insensitive text search
  - Creates/updates WordProgress record
  - Awards 10 XP on first exposure only
  - Updates child aggregate stats (XP, level, words_learned)
  - Tracks modality-specific exposure (visual, kinesthetic)
  - Returns comprehensive progress update

### 5. `/app/page.tsx` (Modified)

- **Added:** Iframe bridge integration
- **Features:**
  - Listens for `WORD_LEARNED` events from mobile app
  - Sends `PROGRESS_UPDATED` events to mobile app
  - Handles `SET_USER` for child synchronization
  - Supports `SYNC_PROGRESS` requests
  - Sends progress updates after word completion

### 6. `/MOBILE_APP_INTEGRATION.md`

- **Purpose:** Complete developer documentation
- **Contents:**
  - API reference for all message types
  - Example code (vanilla JS, React Native)
  - Security considerations
  - Backend endpoint documentation
  - Troubleshooting guide
  - Testing instructions

### 7. `/public/test-iframe.html`

- **Purpose:** Interactive testing tool for iframe integration
- **Features:**
  - Simulates mobile app environment
  - Quick buttons for object detection tests
  - Custom word input
  - Live message logging
  - Visual status indicators
  - Keyboard shortcuts (1=elephant, 2=cat, 3=car, r=sync)

## Message Types

### From Mobile App → Website

1. **SET_USER**

   ```javascript
   { type: 'SET_USER', userId: string, childId?: string }
   ```

2. **WORD_LEARNED**

   ```javascript
   {
     type: 'WORD_LEARNED',
     word: string,
     wordId?: string,
     timestamp: string,
     source: 'object_detection' | 'physical_activity',
     confidence?: number,
     imageUrl?: string,
     metadata?: object
   }
   ```

3. **SYNC_PROGRESS**
   ```javascript
   { type: 'SYNC_PROGRESS', childId: string }
   ```

### From Website → Mobile App

1. **READY**

   ```javascript
   {
     type: "READY";
   }
   ```

2. **WORD_COMPLETED**

   ```javascript
   {
     type: 'WORD_COMPLETED',
     wordId: string,
     word: string,
     xp: number,
     level: number,
     wordsLearned: number
   }
   ```

3. **PROGRESS_UPDATED**

   ```javascript
   {
     type: 'PROGRESS_UPDATED',
     childId: string,
     xp: number,
     level: number,
     wordsLearned: number,
     todayProgress: number
   }
   ```

4. **REQUEST_AUTH**
   ```javascript
   {
     type: "REQUEST_AUTH";
   }
   ```

## Backend Endpoint

### POST `/api/vocabulary/external/word-learned`

**Request:**

```json
{
  "word": "elephant",
  "word_id": "uuid",
  "child_id": "uuid",
  "timestamp": "2026-01-28T10:30:00Z",
  "source": "object_detection",
  "confidence": 0.95,
  "image_url": "https://...",
  "metadata": {}
}
```

**Response:**

```json
{
  "success": true,
  "word": "elephant",
  "word_id": "uuid",
  "child_id": "uuid",
  "exposure_count": 1,
  "xp_awarded": 10,
  "total_xp": 110,
  "level": 2,
  "words_learned": 11,
  "source": "object_detection",
  "timestamp": "2026-01-28T10:30:00Z"
}
```

## XP & Progress Logic

- **First Exposure:** Awards 10 XP, increments words_learned, updates today_progress
- **Subsequent Exposures:** Increments exposure_count only (no XP)
- **Level Up:** Every 100 XP = 1 level
- **Modality Tracking:**
  - object_detection → visual_exposures++
  - physical_activity → kinesthetic_exposures++

## Testing

### 1. Test with Simulator

```bash
# Start backend
cd backend
python main.py

# Start frontend (separate terminal)
cd preschool-vocabulary-platform
npm run dev

# Open test page
open http://localhost:3000/test-iframe.html
```

### 2. Click buttons or use keyboard shortcuts:

- `1` = Learn "elephant"
- `2` = Learn "cat"
- `3` = Learn "car"
- `r` = Sync progress

### 3. Watch logs for:

- ✅ READY message received
- ✅ WORD_LEARNED sent to iframe
- ✅ PROGRESS_UPDATED received from iframe
- ✅ XP updates in ProfileHeader

## Security Notes

### Development

- Uses wildcard origin (`'*'`) for testing
- Console logs all messages

### Production Setup

```javascript
// In iframe-bridge.ts
iframeBridge.setAllowedOrigin("https://your-mobile-app.com");

// In mobile app
if (event.origin !== "https://your-vocab-website.com") return;
```

## React Native Integration Example

```javascript
import { WebView } from "react-native-webview";

function VocabWebView() {
  const webviewRef = useRef(null);

  const handleObjectDetection = (word, confidence) => {
    webviewRef.current?.postMessage(
      JSON.stringify({
        type: "WORD_LEARNED",
        word,
        timestamp: new Date().toISOString(),
        source: "object_detection",
        confidence,
      }),
    );
  };

  return (
    <WebView
      ref={webviewRef}
      source={{ uri: "https://your-domain.com?hideNav=true" }}
      onMessage={(event) => {
        const msg = JSON.parse(event.nativeEvent.data);
        if (msg.type === "PROGRESS_UPDATED") {
          updateLocalProgress(msg);
        }
      }}
    />
  );
}
```

## URL Parameters for Iframe

- `?hideNav=true` - Hide bottom navigation
- `?view=home` - Set initial view (home, learn, games, rewards, profile)
- Example: `https://domain.com?hideNav=true&view=learn`

## Next Steps

1. **Test with real mobile app** using the test simulator
2. **Set production origins** for security
3. **Add authentication token** passing if needed
4. **Implement image upload** for detected objects (optional)
5. **Add analytics** tracking for external word learning events
6. **Consider offline support** with message queuing

## Benefits

✅ **Bidirectional Communication:** App ↔ Website sync  
✅ **Progress Synchronization:** Real-time XP and level updates  
✅ **Object Detection Integration:** Mobile camera → word learning  
✅ **Flexible Architecture:** Supports multiple learning sources  
✅ **Type Safety:** TypeScript interfaces for all messages  
✅ **Easy Testing:** Interactive simulator included  
✅ **Comprehensive Docs:** Complete integration guide  
✅ **Security Ready:** Origin validation support

## Troubleshooting

**Issue:** Messages not received  
**Fix:** Check iframe loaded (wait for READY), verify origin validation

**Issue:** Word not found  
**Fix:** Ensure word exists in database, check spelling (case-insensitive)

**Issue:** No XP awarded  
**Fix:** XP only awarded on first exposure (check `exposure_count`)
