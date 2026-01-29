# iFrame Embedding Guide

This document explains how to embed the preschool vocabulary platform in a mobile app using iframes with query parameters.

## Query Parameters

### Navigation Control

#### Hide Navigation (`hideNav`)

Hide all navigation bars (bottom nav for child view, top header & tabs for parent view).

**Values:** `true` or `1`

**Examples:**

```
https://yourapp.com/?hideNav=true
https://yourapp.com/parent?hideNav=1
```

### Route/View Control

#### Child View Routes (`view` or `tab`)

Control which view/tab is displayed in the child interface.

**Available values:**

- `home` - Home view with word of the day, stories, and categories
- `learn` - Learning view with all categories
- `games` - Games view with all available games
- `rewards` - Rewards and achievements view
- `profile` - Child profile view

**Examples:**

```
https://yourapp.com/?view=learn
https://yourapp.com/?tab=games
https://yourapp.com/?view=rewards&hideNav=true
```

#### Parent Dashboard Routes (`tab` or `view`)

Control which tab is displayed in the parent dashboard.

**Available values:**

- `overview` - Overview dashboard (default)
- `progress` - Progress tracking view
- `missions` - App missions view
- `offline` - Offline missions view
- `insights` - Learning insights view
- `settings` - Settings view

**Examples:**

```
https://yourapp.com/parent?tab=progress
https://yourapp.com/parent?view=insights
https://yourapp.com/parent?tab=settings&hideNav=true
```

## Complete iFrame Embedding Examples

### Child Interface - Full Navigation

```html
<iframe
  src="https://yourapp.com/"
  width="100%"
  height="100%"
  frameborder="0"
></iframe>
```

### Child Interface - Specific View Without Navigation

```html
<!-- Learn view only, no navigation -->
<iframe
  src="https://yourapp.com/?view=learn&hideNav=true"
  width="100%"
  height="100%"
  frameborder="0"
></iframe>

<!-- Games view only, no navigation -->
<iframe
  src="https://yourapp.com/?view=games&hideNav=1"
  width="100%"
  height="100%"
  frameborder="0"
></iframe>
```

### Parent Dashboard - Full Navigation

```html
<iframe
  src="https://yourapp.com/parent"
  width="100%"
  height="100%"
  frameborder="0"
></iframe>
```

### Parent Dashboard - Specific Tab Without Navigation

```html
<!-- Progress view only, no navigation -->
<iframe
  src="https://yourapp.com/parent?tab=progress&hideNav=true"
  width="100%"
  height="100%"
  frameborder="0"
></iframe>

<!-- Settings view only, no navigation -->
<iframe
  src="https://yourapp.com/parent?tab=settings&hideNav=1"
  width="100%"
  height="100%"
  frameborder="0"
></iframe>
```

## Mobile App Integration Tips

### React Native WebView Example

```javascript
import { WebView } from 'react-native-webview';

// Child view with navigation hidden
<WebView
  source={{ uri: 'https://yourapp.com/?view=learn&hideNav=true' }}
  style={{ flex: 1 }}
/>

// Parent view with navigation visible
<WebView
  source={{ uri: 'https://yourapp.com/parent?tab=progress' }}
  style={{ flex: 1 }}
/>
```

### Flutter WebView Example

```dart
import 'package:webview_flutter/webview_flutter.dart';

WebView(
  initialUrl: 'https://yourapp.com/?view=games&hideNav=true',
  javascriptMode: JavascriptMode.unrestricted,
)
```

### Swift (iOS) WKWebView Example

```swift
import WebKit

let url = URL(string: "https://yourapp.com/?view=learn&hideNav=true")!
let request = URLRequest(url: url)
webView.load(request)
```

### Kotlin (Android) WebView Example

```kotlin
import android.webkit.WebView

webView.loadUrl("https://yourapp.com/?view=games&hideNav=true")
```

## Use Cases

### Single-Purpose Screens

When you want to embed only specific functionality:

- Learning screen only: `/?view=learn&hideNav=true`
- Games only: `/?view=games&hideNav=true`
- Progress tracking only: `/parent?tab=progress&hideNav=true`

### Controlled Navigation

When your mobile app provides its own navigation:

- Use `hideNav=true` to hide the web interface navigation
- Control the active view via the `view` or `tab` parameter
- Update the iframe URL when users navigate in your app

### Full Web Experience

When you want the complete web interface:

- Omit `hideNav` parameter
- Optionally set initial view with `view` or `tab`
- Let users navigate within the iframe using the built-in navigation

## Notes

- All query parameters are optional
- Parameter names are case-sensitive
- Multiple parameters can be combined using `&`
- Both `view` and `tab` parameters work interchangeably for route control
- The `hideNav` parameter accepts `true` or `1` as valid values
