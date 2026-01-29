# Quick Start: Testing Mobile App Integration

## 1. Start the Backend

```bash
cd backend
python main.py
```

Backend should be running on `http://localhost:8000`

## 2. Start the Frontend

```bash
cd preschool-vocabulary-platform
npm run dev
```

Frontend should be running on `http://localhost:3000`

## 3. Open the Test Simulator

Open your browser to:

```
http://localhost:3000/test-iframe.html
```

## 4. Test the Integration

### Using the UI:

1. Wait for "Ready" status indicator (green)
2. Click "📸 Object Detection: elephant" button
3. Watch the message log for communication
4. Check the iframe for XP updates in ProfileHeader

### Using Keyboard Shortcuts:

- Press `1` - Learn "elephant"
- Press `2` - Learn "cat"
- Press `3` - Learn "car"
- Press `r` - Sync progress

### Custom Word Testing:

1. Enter a word in the "Custom Word" input (e.g., "dog", "sun", "car")
2. Adjust confidence slider (0-1)
3. Select source (Object Detection or Physical Activity)
4. Click "Send" button

## 5. What to Observe

### In the Test Simulator:

- ✅ Status changes from "Loading..." to "Ready"
- ✅ Message log shows SENT and RECEIVED messages
- ✅ Notifications appear for progress updates

### In the Iframe (Website):

- ✅ ProfileHeader XP increases by 10 (first time only)
- ✅ Words Learned count increases
- ✅ Level increases after 100 XP
- ✅ Stars appear on word cards showing exposure count

### In Browser Console:

```
[IframeBridge] Initialized and sent READY message
[IframeBridge] Received message: {type: "WORD_LEARNED", word: "elephant", ...}
[HomePage] Received WORD_LEARNED from app: ...
[HomePage] Word learning recorded: {success: true, xp_awarded: 10, ...}
Refreshing child data...
Updated child stats: {level: 1, xp: 10, wordsLearned: 1, ...}
[IframeBridge] Sending to app: {type: "PROGRESS_UPDATED", ...}
```

### In Backend Console:

```
INFO:     127.0.0.1 - "POST /api/vocabulary/external/word-learned HTTP/1.1" 200 OK
```

## 6. Verify Database Changes

Run the progress check script:

```bash
cd backend
python check_progress.py
```

You should see:

- Increased `exposure_count` for the word
- Increased `xp` for the child
- Increased `words_learned` count
- Increased `visual_exposures` (for object detection)

## 7. Test Different Scenarios

### First Time Learning (Awards XP):

1. Click "elephant" button
2. Check ProfileHeader: +10 XP, Words Learned +1
3. Expected: `xp_awarded: 10` in response

### Second Time (No XP):

1. Click "elephant" button again
2. Check ProfileHeader: XP stays same, exposure count increases
3. Expected: `xp_awarded: 0` in response

### Level Up:

1. Learn 10 different words (cat, dog, car, sun, tree, ball, book, apple, house, flower)
2. Check ProfileHeader: Level should increase from 1 to 2 at 100 XP
3. Expected: Level badge shows "Lv.2"

## 8. Common Issues

### Issue: "Iframe not ready yet!"

**Solution:** Wait a few seconds for the iframe to load and send READY message

### Issue: "Word 'xyz' not found in vocabulary"

**Solution:** Use words that exist in the database (check backend/seed_words.py for list)

### Issue: No XP awarded

**Solution:** Expected behavior - XP is only awarded the first time you learn a word

### Issue: Messages not appearing in log

**Solution:** Check browser console for errors, ensure iframe loaded properly

## 9. Available Words

These words are seeded in the database:

**Animals:** elephant, cat, dog, bird, fish
**Food:** apple, banana, carrot, bread, milk
**Nature:** tree, flower, sun, cloud, rain
**Colors:** red, blue, green, yellow, orange
**Vehicles:** car, bus, train, bike, plane

## 10. Next Steps

Once basic testing works:

1. **Test React Native WebView** using the example in MOBILE_APP_INTEGRATION.md
2. **Implement actual object detection** in your mobile app
3. **Add image upload** for detected objects (optional enhancement)
4. **Configure production origins** for security
5. **Add authentication** token passing between app and website
6. **Deploy** and test in production environment

## Debugging Tips

### Enable Debug Mode:

Open browser DevTools console to see all iframe bridge messages

### Check Network Tab:

Look for POST requests to `/api/vocabulary/external/word-learned`

### Check Backend Logs:

Backend prints SQL queries and API requests

### Test Message Format:

Use the custom word input to test different message structures

### Clear Browser Cache:

If changes don't appear, try hard refresh (Cmd+Shift+R / Ctrl+Shift+F5)

## Support

If you encounter issues:

1. Check browser console for JavaScript errors
2. Check backend terminal for Python errors
3. Review MOBILE_APP_INTEGRATION.md for detailed API docs
4. Check that all words exist in the database
5. Verify backend is running and accessible
