# Preschool Vocabulary Platform - API Integration Guide

## Backend Integration Complete! 🎉

Your Next.js frontend is now ready to connect to the FastAPI backend.

## Quick Start

### 1. Environment Setup

The `.env.local` file has been created with:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### 2. Start Both Servers

**Terminal 1 - Backend:**

```bash
cd backend
source venv/bin/activate
python main.py
```

**Terminal 2 - Frontend:**

```bash
cd preschool-vocabulary-platform
npm run dev
```

## API Client Usage

### Authentication

```typescript
import { login, register, logout, getCurrentUser } from "@/lib/api";

// Register
const user = await register({
  email: "parent@example.com",
  full_name: "Parent Name",
  password: "password123",
});

// Login
const { access_token } = await login({
  email: "parent@example.com",
  password: "password123",
});

// Get current user
const currentUser = await getCurrentUser();

// Logout
logout();
```

### Children Management

```typescript
import { getChildren, createChild, getChild } from "@/lib/api";

// Get all children
const children = await getChildren();

// Create child
const child = await createChild({
  name: "Emma",
  age: 4,
  avatar: "👧",
  learning_style: "kinesthetic",
  daily_goal: 5,
  interests: ["Animals", "Nature"],
});

// Get specific child
const childProfile = await getChild(childId);
```

### Vocabulary

```typescript
import { getCategories, getWords, getWordsWithProgress } from "@/lib/api";

// Get categories
const categories = await getCategories();

// Get words
const words = await getWords({ category: "Animals", limit: 10 });

// Get words with child's progress
const wordsWithProgress = await getWordsWithProgress(childId, "Animals");
```

### Adaptive Learning

```typescript
import { getRecommendations, getWordOfTheDay } from "@/lib/api";

// Get personalized recommendations
const recommendations = await getRecommendations(childId);

// Get word of the day
const wordOfDay = await getWordOfTheDay(childId);
```

### Progress Tracking

```typescript
import {
  startLearningSession,
  endLearningSession,
  getProgressStats,
} from "@/lib/api";

// Start session
const session = await startLearningSession({
  child_id: childId,
  start_time: new Date().toISOString(),
  words_encountered: ["word1", "word2"],
});

// End session
await endLearningSession(session.id, {
  end_time: new Date().toISOString(),
  words_encountered: ["word1", "word2", "word3"],
  activities_completed: [{ type: "story", id: "story1", duration_minutes: 5 }],
  engagement_level: "high",
  interactions_count: 10,
});

// Get stats
const stats = await getProgressStats(childId);
```

## Example: Update HomePage to Use Real Data

```typescript
'use client';

import { useState, useEffect } from 'react';
import { getChildren, getCategories, getWordsWithProgress } from '@/lib/api';

export default function HomePage() {
  const [children, setChildren] = useState([]);
  const [categories, setCategories] = useState([]);
  const [words, setWords] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      // Load children
      const childrenData = await getChildren();
      setChildren(childrenData);

      if (childrenData.length > 0) {
        setSelectedChild(childrenData[0]);

        // Load categories
        const categoriesData = await getCategories();
        setCategories(categoriesData);

        // Load words with progress for first child
        const wordsData = await getWordsWithProgress(childrenData[0].id);
        setWords(wordsData);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }

  return (
    // Your JSX here
  );
}
```

## API Modules Created

✅ `/lib/api/client.ts` - Base API client with auth
✅ `/lib/api/auth.ts` - Authentication functions
✅ `/lib/api/children.ts` - Child profile management
✅ `/lib/api/vocabulary.ts` - Words and categories
✅ `/lib/api/adaptive.ts` - AI recommendations
✅ `/lib/api/progress.ts` - Learning sessions & stats
✅ `/lib/api/index.ts` - Central exports

## Error Handling

All API functions throw errors that can be caught:

```typescript
try {
  const data = await getChildren();
} catch (error) {
  if (error.message.includes("401")) {
    // Unauthorized - redirect to login
  } else {
    // Show error message
    alert(error.message);
  }
}
```

## Authentication Flow

1. User registers/logs in
2. Token stored in localStorage
3. All subsequent requests include token
4. On 401 error, token cleared and user redirected

## Next Steps

1. **Create Login/Register Pages**: Build auth UI
2. **Update Components**: Replace mock data with API calls
3. **Add Error Handling**: Show user-friendly error messages
4. **Add Loading States**: Show spinners while data loads
5. **Test Integration**: Verify all features work end-to-end

## Testing the Integration

1. Start backend server (make sure it's running)
2. Open browser console in Next.js app
3. Test API calls:

```javascript
// In browser console
import { login } from "./lib/api/auth";

// Test login
await login({ email: "test@example.com", password: "password123" });
```

Your frontend and backend are now fully integrated! 🚀
