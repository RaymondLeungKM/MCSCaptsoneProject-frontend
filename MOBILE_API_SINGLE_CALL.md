# Simplified Mobile API Integration - Single API Call

## Overview

The mobile app can now upload images and record word learning in **ONE API call** instead of two separate calls. This simplifies the integration and reduces network overhead.

## Single API Call Approach (Recommended)

### POST `/api/v1/vocabulary/external/word-learned`

Record word learning from external sources with optional direct image upload.

**Request Type:** `multipart/form-data`

**Form Fields:**

- `word` (required): The word text
- `child_id` (required): UUID of the child
- `timestamp` (required): ISO 8601 timestamp
- `source` (required): Source identifier (e.g., "object_detection", "physical_activity")
- `word_id` (optional): Word ID if known
- `confidence` (optional): Detection confidence (0.0-1.0)
- `image_url` (optional): Image URL if already hosted elsewhere
- `image` (optional): **Image file upload** (JPG, PNG, GIF, WEBP, max 10MB)
- `metadata` (optional): Additional metadata as JSON string

### Complete Example (React Native)

```javascript
async function recordWordWithImage(
  imageUri,
  detectedWord,
  childId,
  confidence,
) {
  const formData = new FormData();

  // Add required fields
  formData.append("word", detectedWord);
  formData.append("child_id", childId);
  formData.append("timestamp", new Date().toISOString());
  formData.append("source", "object_detection");

  // Add optional fields
  if (confidence) {
    formData.append("confidence", String(confidence));
  }

  // Add image file directly from camera
  formData.append("image", {
    uri: imageUri,
    type: "image/jpeg",
    name: "detected-object.jpg",
  });

  // Optional metadata
  formData.append(
    "metadata",
    JSON.stringify({
      detectionModel: "yolov8",
      deviceType: "mobile",
      appVersion: "1.0.0",
    }),
  );

  try {
    const response = await fetch(
      "https://api.your-domain.com/api/v1/vocabulary/external/word-learned",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          // Don't set Content-Type - let fetch set it with boundary
        },
        body: formData,
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Failed to record word learning:", error);
    throw error;
  }
}
```

### Response

```json
{
  "success": true,
  "word": "Elephant",
  "word_id": "word-uuid-123",
  "child_id": "child-uuid-456",
  "exposure_count": 1,
  "xp_awarded": 10,
  "total_xp": 110,
  "level": 2,
  "words_learned": 11,
  "source": "object_detection",
  "timestamp": "2026-02-07T10:30:00Z",
  "level_up": false,
  "word_created": false,
  "word_data": {
    "id": "word-uuid-123",
    "word": "Elephant",
    "definition": "A large animal with a trunk",
    "example": "I saw an elephant.",
    "image_url": "https://api.your-domain.com/uploads/images/abc123.jpg",
    "category": "animals",
    "difficulty": "easy"
  }
}
```

## Complete Object Detection Flow

```javascript
import { launchCamera } from "react-native-image-picker";
import * as tf from "@tensorflow/tfjs";

async function detectAndLearnWord(childId) {
  // 1. Capture photo
  const result = await launchCamera({
    mediaType: "photo",
    quality: 0.8,
  });

  if (result.didCancel) return;

  const imageUri = result.assets[0].uri;

  // 2. Run object detection
  const detections = await runObjectDetection(imageUri);

  if (detections.length === 0) {
    showToast("No objects detected");
    return;
  }

  const topDetection = detections[0];

  // 3. Record word learning with image in ONE API call
  try {
    const result = await recordWordWithImage(
      imageUri,
      topDetection.label,
      childId,
      topDetection.confidence,
    );

    // 4. Show results
    showSuccessAnimation();
    showToast(`Great! You found a ${result.word}! +${result.xp_awarded} XP`);

    if (result.level_up) {
      showLevelUpModal(result.level);
    }

    // Update UI with new stats
    updateChildProgress({
      xp: result.total_xp,
      level: result.level,
      wordsLearned: result.words_learned,
    });
  } catch (error) {
    showErrorToast("Failed to record word. Please try again.");
  }
}
```

## Advantages of Single API Call

✅ **Simpler Code** - No need to manage two API calls  
✅ **Faster** - Reduces network round trips from 2 to 1  
✅ **Atomic Operation** - Image and word learning recorded together  
✅ **Better Error Handling** - Single point of failure  
✅ **Less Data Transfer** - Image uploaded once, not referenced twice

## Alternative: Two-Step Approach (Still Supported)

If you prefer to upload images separately (e.g., for image processing before word detection), you can still use:

1. `POST /api/v1/uploads/upload-image` - Upload image, get URL
2. `POST /api/v1/vocabulary/external/word-learned` - Pass `image_url` field (JSON body instead of form-data)

See main MOBILE_APP_INTEGRATION.md for details on this approach.

## Important Notes

- **Image or URL**: Provide either `image` (file upload) OR `image_url` (string), not both
- **File upload takes precedence**: If both provided, file upload is used
- **Authentication**: Requires Bearer token in Authorization header
- **File size limit**: 10MB maximum
- **Supported formats**: JPG, JPEG, PNG, GIF, WEBP
- **XP Rewards**: 10 XP awarded on first exposure to a word only
- **Word Creation**: If word doesn't exist, it's automatically created in "general" category

## Error Handling

```javascript
try {
  const result = await recordWordWithImage(...);
  // Success
} catch (error) {
  if (error.message.includes('404')) {
    // Child not found
    showError("Child profile not found");
  } else if (error.message.includes('400')) {
    // Invalid request (bad file type, missing fields, etc.)
    showError("Invalid request. Please check your input.");
  } else if (error.message.includes('413')) {
    // File too large
    showError("Image file is too large (max 10MB)");
  } else {
    // Other errors
    showError("Something went wrong. Please try again.");
  }
}
```

## Testing with cURL

```bash
curl -X POST "http://localhost:8000/api/v1/vocabulary/external/word-learned" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "word=elephant" \
  -F "child_id=your-child-uuid" \
  -F "timestamp=2026-02-07T10:30:00Z" \
  -F "source=object_detection" \
  -F "confidence=0.95" \
  -F "image=@/path/to/your/image.jpg" \
  -F 'metadata={"detectionModel":"yolov8"}'
```

## Related Documentation

- See `MOBILE_APP_INTEGRATION.md` for complete integration guide
- See `API_INTEGRATION.md` for general API documentation
- See `/docs` endpoint on backend for interactive API documentation
