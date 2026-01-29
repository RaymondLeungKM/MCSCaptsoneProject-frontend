# Troubleshooting: "Failed to record word learning" Error

## Problem

You're seeing the error: `Failed to record word learning` when testing the iframe integration.

## Root Cause

This error occurs when the API request fails. There are several possible reasons:

### 1. **You're Not Logged In** ⚠️ (Most Common)

The iframe needs to have an authenticated session to record word learning.

**Solution:**

1. Open `http://localhost:3000` in a new tab
2. Log in with your account
3. Keep that tab open
4. Now go to `http://localhost:3000/test-iframe.html`
5. The iframe should now be authenticated
6. Try sending a word learning event again

**Why this happens:** The Next.js API route requires an `access_token` cookie for authentication. This cookie is only set after you log in.

---

### 2. **Backend Not Running**

The backend server might not be running or accessible.

**Check:**

```bash
# Check if backend is running
curl http://localhost:8000/health

# Should return something like: {"status":"ok"}
```

**Solution:**

```bash
cd backend
python main.py
```

---

### 3. **Word Not in Database**

The word you're trying to learn might not exist in the vocabulary database.

**Check:**
Look at the detailed error message in the browser console (now improved):

```
[API Route] Backend error: {
  status: 404,
  error: { detail: "Word 'xyz' not found in vocabulary" }
}
```

**Solution:**
Use words from the seeded database:

- **Animals:** elephant, cat, dog, bird, fish
- **Food:** apple, banana, carrot, bread, milk
- **Nature:** tree, flower, sun, cloud, rain
- **Colors:** red, blue, green, yellow, orange
- **Vehicles:** car, bus, train, bike, plane

---

### 4. **Child Not Found**

The selected child might not exist or be accessible.

**Check console for:**

```
[HomePage] No selected child, cannot record word learning
```

**Solution:**

1. Ensure you've created a child profile
2. Make sure you're logged in
3. Check that the iframe has loaded and selected a child

---

### 5. **CORS or Network Issues**

The frontend might not be able to reach the backend.

**Check browser console Network tab:**

1. Open DevTools → Network tab
2. Send a word learning event
3. Look for request to `/api/vocabulary/external/word-learned`
4. Check the status code and response

**Common status codes:**

- `401` - Not authenticated (login required)
- `404` - Word or child not found
- `500` - Server error (check backend logs)

---

## Diagnostic Steps

### Step 1: Check Browser Console

Open DevTools console and look for:

```
[API Route] Received external word learning request: { word: "elephant", ... }
[API Route] No access token found in cookies  ← LOGIN REQUIRED!
```

or

```
[API Route] Backend error: { status: 404, error: { detail: "Word 'xyz' not found" } }
```

### Step 2: Check Network Tab

1. DevTools → Network tab
2. Send word learning event
3. Find request to `/api/vocabulary/external/word-learned`
4. Click on it to see:
   - Request headers (should have cookies)
   - Request payload
   - Response data

### Step 3: Check Backend Logs

In your backend terminal, you should see:

```
INFO:     127.0.0.1 - "POST /api/vocabulary/external/word-learned HTTP/1.1" 200 OK
```

If you see `401`, `404`, or `500`, check the error details above the log line.

### Step 4: Verify Authentication

```javascript
// In browser console of the iframe (not the test page)
document.cookie;
// Should include 'access_token=...'
```

---

## Quick Fix Checklist

- [ ] Backend is running (`python main.py` in backend folder)
- [ ] Frontend is running (`npm run dev` in preschool-vocabulary-platform folder)
- [ ] You're logged in to `http://localhost:3000` in another tab
- [ ] You've created at least one child profile
- [ ] The word exists in the database (use seeded words)
- [ ] The iframe shows "Ready" status (green)
- [ ] Browser console shows no CORS errors

---

## Still Not Working?

### Enable Detailed Logging

The code has been updated with comprehensive logging. Check your console for:

**Frontend (page.tsx):**

```
[HomePage] Received WORD_LEARNED from app: { word: "elephant", ... }
[HomePage] Failed to record word learning: 401 Unauthorized - No access token
```

**API Route:**

```
[API Route] Received external word learning request: ...
[API Route] No access token found in cookies
```

**Backend:**

```
INFO: POST /api/vocabulary/external/word-learned
ERROR: Child not found
```

### Test Direct Backend Call

Try calling the backend directly:

```bash
# Get your access token from browser cookies
# Then test the endpoint:
curl -X POST http://localhost:8000/api/vocabulary/external/word-learned \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "word": "elephant",
    "child_id": "YOUR_CHILD_ID",
    "timestamp": "2026-01-28T10:00:00Z",
    "source": "object_detection"
  }'
```

### Check Database

```bash
cd backend
python check_progress.py
```

This will show all children and their progress, helping you verify:

- Children exist
- Child IDs are correct
- Words are in the database

---

## The Most Common Solution

**90% of the time, this error is because you're not logged in.**

**Fix:**

1. Open `http://localhost:3000` → Log in
2. Keep that tab open
3. Refresh `http://localhost:3000/test-iframe.html`
4. Try again

The iframe will inherit the authentication cookies from the main site.

---

## For Production

When deploying:

1. **Set CORS properly** in backend
2. **Configure allowed origins** in iframe-bridge.ts
3. **Use HTTPS** for both app and website
4. **Implement proper authentication** flow for mobile app
5. **Handle token expiration** gracefully

See [MOBILE_APP_INTEGRATION.md](MOBILE_APP_INTEGRATION.md) for production setup details.
