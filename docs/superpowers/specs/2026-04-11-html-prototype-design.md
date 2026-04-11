# HTML Prototype Design — Child Dashboard
**Date:** 2026-04-11  
**Output:** A single, self-contained `prototype.html` file in the project root  
**Goal:** Figma-like clickable prototype of the child-facing dashboard, usable for UX testing without a running server

---

## 1. Technology Stack

| Concern | Choice | Reason |
|---|---|---|
| CSS framework | Tailwind CDN (`cdn.tailwindcss.com`) + inline `tailwind.config` | Mirrors exact class names used in React components |
| Fonts | Google Fonts: Nunito (800/900 weight) | Closest web-safe match to app's title font |
| Interactivity | Vanilla JS (ES2020, no libraries) | Zero dependencies; opens in any browser |
| Icons | Inline SVG paths copied from Lucide icon set | Matches icon library used in the app |
| Colors | Custom Tailwind config extending the default palette | Mirrors `globals.css` custom tokens |

---

## 2. Color Palette (from `globals.css`)

| Token | Hex approximation | Used for |
|---|---|---|
| `coral` | `#e8754a` | Primary CTA, active states |
| `sky` | `#7ec8e3` | Accent, level badge |
| `mint` | `#a8d5b5` | Secondary, nature category |
| `lavender` | `#c3b1e1` | Family category, muted |
| `sunny` | `#f9e06b` | Highlights, XP badges |
| `white/80` + `backdrop-blur` | — | Glassmorphism cards |

---

## 3. Layout

- **Container:** `max-w-[430px] mx-auto` centered — simulates a mobile phone screen
- **Background:** warm gradient `from-orange-50 via-sky-50 to-purple-50`
- **Header:** `ProfileHeader` bar pinned to top with avatar + XP bar + stats
- **Main:** `pb-32 px-4 space-y-8` with fade-in transition on each tab switch
- **Bottom nav:** Fixed `ChildNavigation` bar with 7 tabs; active tab icon pops up with `-translate-y-4` colored bubble

---

## 4. Tab Content

### 4a. Home Tab (default)
- **ProfileHeader card**: Avatar (initials fallback "小明"), name "你好，小明！", Lv.5 badge (sky blue), XP bar 65/100, streak 🔥7, words learned ⭐42
- **DailyWordsViewer**: 5 Cantonese word flashcards in a collapsible list. Each card shows:
  - Word in Traditional Chinese (large, font-black)
  - Jyutping romanization (smaller, slate-400)
  - Definition in Cantonese
  - 🔊 audio button (visual only — plays a tone via Web Audio API)
  - ✅ mastery toggle (updates UI state)
  - +10 XP badge on first exposure

### 4b. Learn Tab
- 8 color-coded category tiles in a 2-column grid
- Each tile: icon emoji, Cantonese name, English name, word count badge
- Click → animated slide-in panel showing 4 word cards for that category
- Word cards: image placeholder (colored emoji box), Chinese character, jyutping, definition
- Back button returns to category grid

### 4c. Games Tab
- 3 game cards (Quiz 🎯 purple, Word Builder 🔤 green, Speaking 🎤 orange)
- Each card: icon box, name, description, play ▶ button
- **Quiz game** click → fullscreen overlay showing:
  - Audio prompt icon + question "聽一聽，選出正確的圖片！"
  - 4 image choice buttons; clicking correct answer shows ✅ + XP toast; wrong shows ❌ shake
  - Close ✕ button
- **Word Builder / Speaking** → simple overlay with game name, a progress state, and close button

### 4d. Stories Tab
- Story generator panel: text input ("輸入故事主題..."), 生成故事 button with loading spinner simulation (2s then shows a sample story card)
- Horizontal scrolling story shelf with 3 story cards showing: emoji cover, title, duration, completed badge
- Click story card → modal reader with:
  - Story title + close button
  - 3 pages of sample Cantonese text
  - Previous / Next page buttons
  - Progress dots at the bottom
  - 🔊 Read Aloud button (visual only)

### 4e. Community Tab
- Two sub-tabs: "我的相片詞彙" | "社區詞彙"
- Grid of word image cards (colored emoji placeholder boxes) with Cantonese word + jyutping
- Tap card → word detail popover

### 4f. Rewards / Profile Tabs
- "即將推出！" coming-soon screen: bouncing 🚧 icon, heading, subtitle — exactly as in `app/child/page.tsx`

---

## 5. Mock Data (Backend Field Names)

### Child Profile (`children` table)
```json
{
  "id": "child-001",
  "name": "小明",
  "avatar": "",
  "age": 5,
  "level": 5,
  "xp": 465,
  "words_learned": 42,
  "current_streak": 7,
  "daily_goal": 5,
  "today_progress": 3
}
```

### Words (`words` table — 5 daily words)
```json
[
  { "id": "w1", "word": "Cat", "word_cantonese": "貓", "jyutping": "maau1", "definition_cantonese": "一種常見的寵物，喜歡玩耍", "difficulty": "easy", "exposure_count": 3, "image_url": "🐱" },
  { "id": "w2", "word": "Apple", "word_cantonese": "蘋果", "jyutping": "ping4 gwo2", "definition_cantonese": "一種甜美的紅色水果", "difficulty": "easy", "exposure_count": 1, "image_url": "🍎" },
  { "id": "w3", "word": "Butterfly", "word_cantonese": "蝴蝶", "jyutping": "wu4 dip6", "definition_cantonese": "一種美麗的昆蟲，有彩色的翅膀", "difficulty": "medium", "exposure_count": 0, "image_url": "🦋" },
  { "id": "w4", "word": "Dog", "word_cantonese": "狗", "jyutping": "gau2", "definition_cantonese": "人類最忠實的動物朋友", "difficulty": "easy", "exposure_count": 5, "image_url": "🐶" },
  { "id": "w5", "word": "Cup", "word_cantonese": "水杯", "jyutping": "seoi2 bui1", "definition_cantonese": "用來盛水的容器", "difficulty": "easy", "exposure_count": 2, "image_url": "🥤" }
]
```

### Categories (`categories` table — 8)
```json
[
  { "id": "animals", "name": "Animals", "name_cantonese": "動物", "icon": "🐾", "color": "bg-sunny", "word_count": 12 },
  { "id": "food", "name": "Food", "name_cantonese": "食物", "icon": "🍎", "color": "bg-coral", "word_count": 10 },
  { "id": "colors", "name": "Colors", "name_cantonese": "顏色", "icon": "🌈", "color": "bg-sky", "word_count": 8 },
  { "id": "nature", "name": "Nature", "name_cantonese": "大自然", "icon": "🌿", "color": "bg-mint", "word_count": 9 },
  { "id": "family", "name": "Family", "name_cantonese": "家人", "icon": "👨‍👩‍👧", "color": "bg-lavender", "word_count": 7 },
  { "id": "vehicles", "name": "Vehicles", "name_cantonese": "交通工具", "icon": "🚗", "color": "bg-amber-400", "word_count": 6 },
  { "id": "body", "name": "Body", "name_cantonese": "身體", "icon": "🦶", "color": "bg-rose-400", "word_count": 8 },
  { "id": "clothing", "name": "Clothing", "name_cantonese": "衣物", "icon": "👕", "color": "bg-pink-400", "word_count": 5 }
]
```

### Generated Stories (`generated_stories` table — 3)
```json
[
  { "id": "s1", "title": "貓咪和蝴蝶", "reading_time_minutes": 3, "read_count": 1, "color": "purple" },
  { "id": "s2", "title": "蘋果樹的故事", "reading_time_minutes": 5, "read_count": 0, "color": "green" },
  { "id": "s3", "title": "小狗找朋友", "reading_time_minutes": 4, "read_count": 2, "color": "blue" }
]
```

---

## 6. Interactions (JS)

| Trigger | Action |
|---|---|
| Bottom nav tap | Switch `activeTab`; fade-out/fade-in content |
| Word card 🔊 tap | Play short beep via `AudioContext` (no server needed) |
| Word card ✅ tap | Toggle mastered state; update counter in ProfileHeader |
| Category tile tap | Slide-in word list panel |
| Back button in Learn | Slide-out back to category grid |
| Game card Play tap | Open fullscreen game overlay |
| Quiz answer tap | Show correct/incorrect feedback; close after 1.5s on correct |
| Generate Story button | Show 2s spinner → append new story card |
| Story card tap | Open story reader modal |
| Story modal prev/next | Navigate story pages |
| Story modal close | Close modal |
| Community sub-tab tap | Switch word grid content |

---

## 7. File Output

**Path:** `/Users/karen/MCSCaptsoneProject-frontend/prototype.html`  
**Size estimate:** ~600–800 lines  
**Dependencies:** CDN only (Tailwind, Google Fonts) — works offline after first load caches CDN

---

## 8. Out of Scope

- Actual audio playback (beyond a beep tone)
- Real API calls to backend
- Authentication flow
- Parent dashboard
- Adaptive learning logic
