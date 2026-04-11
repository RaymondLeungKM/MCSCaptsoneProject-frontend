# HTML Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a single, self-contained `prototype.html` file that replicates the full child dashboard with 7 clickable tabs, all interactive buttons, modals, and overlays — openable in any browser with no server.

**Architecture:** Single HTML file. Tailwind CDN with inline `tailwind.config` for custom colors. All JS in one `<script>` block using a state object + render/switch functions. All SVG icons inlined. Glassmorphism cards via `bg-white/80 backdrop-blur-md`. Mobile-width container (`max-w-[430px]`).

**Tech Stack:** HTML5, Tailwind CDN v3, Vanilla JS (ES2020), Google Fonts (Nunito), Web Audio API (beep only)

---

## File Structure

- **Create:** `prototype.html` at `/Users/karen/MCSCaptsoneProject-frontend/prototype.html`

This is a single-file output. All tasks append sections to this file and then integrate them.

---

### Task 1: Shell, Head, Tailwind Config, Fonts

**Files:**
- Create: `prototype.html`

- [ ] **Step 1: Create the file with DOCTYPE, head, Tailwind CDN, Google Fonts, and custom config**

```html
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>廣東話學習 — 兒童儀表板</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&display=swap" rel="stylesheet" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            coral:   '#e8754a',
            sky:     '#7ec8e3',
            mint:    '#a8d5b5',
            lavender:'#c3b1e1',
            sunny:   '#f9e06b',
            ocean:   '#5b8dd9',
            peach:   '#f5c5a3',
          },
          borderRadius: {
            '4xl': '2rem',
            '5xl': '2.5rem',
          },
          fontFamily: {
            nunito: ['Nunito', 'sans-serif'],
          },
        }
      }
    }
  </script>
  <style>
    * { font-family: 'Nunito', sans-serif; }
    body { background: linear-gradient(135deg, #fff7ed 0%, #f0f9ff 50%, #faf5ff 100%); }
    .tab-content { display: none; }
    .tab-content.active { display: block; animation: fadeSlide 0.3s ease; }
    @keyframes fadeSlide {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .word-card-expanded { display: none; }
    .word-card-expanded.open { display: block; }
    .nav-icon-bubble {
      width: 2rem; height: 2rem;
      display: flex; align-items: center; justify-content: center;
      border-radius: 9999px; transition: all 0.3s;
    }
    .nav-icon-bubble.active-bubble {
      width: 3rem; height: 3rem;
      transform: translateY(-1rem);
      border: 4px solid white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .overlay { display:none; position:fixed; inset:0; z-index:100; }
    .overlay.open { display:flex; }
    .modal { display:none; position:fixed; inset:0; z-index:200; }
    .modal.open { display:flex; }
    .shake { animation: shake 0.4s ease; }
    @keyframes shake {
      0%,100%{transform:translateX(0)}
      20%{transform:translateX(-6px)}
      40%{transform:translateX(6px)}
      60%{transform:translateX(-4px)}
      80%{transform:translateX(4px)}
    }
    .learn-word-panel { display: none; }
    .learn-word-panel.open { display: block; animation: fadeSlide 0.25s ease; }
    /* scrollbar hide */
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
  </style>
</head>
<body class="min-h-screen">
```

- [ ] **Step 2: Open the app container div**

After the opening `<body>` tag, add:

```html
<div class="max-w-[430px] mx-auto min-h-screen relative pb-32 px-4">
```

- [ ] **Step 3: Verify file opens in browser with correct background gradient** — open `prototype.html` in browser; should show warm gradient background, no errors in console.

---

### Task 2: Mock Data Block (JS)

**Files:**
- Modify: `prototype.html` — add `<script>` block before closing `</body>`

- [ ] **Step 1: Add the MOCK_DATA object and app state**

```html
<script>
// ─── MOCK DATA ──────────────────────────────────────────────────────────────
const CHILD = {
  id: 'child-001', name: '小明', age: 5, level: 5, xp: 465,
  words_learned: 42, current_streak: 7, daily_goal: 5, today_progress: 3
};

const DAILY_WORDS = [
  { id:'w1', word:'Cat',       word_cantonese:'貓',   jyutping:'maau1',       definition_cantonese:'一種常見的寵物，喜歡玩耍',         difficulty:'easy',   exposure_count:3, mastered:true,  image:'🐱' },
  { id:'w2', word:'Apple',     word_cantonese:'蘋果', jyutping:'ping4 gwo2',  definition_cantonese:'一種甜美的紅色水果',               difficulty:'easy',   exposure_count:1, mastered:false, image:'🍎' },
  { id:'w3', word:'Butterfly', word_cantonese:'蝴蝶', jyutping:'wu4 dip6',    definition_cantonese:'一種美麗的昆蟲，有彩色的翅膀',     difficulty:'medium', exposure_count:0, mastered:false, image:'🦋' },
  { id:'w4', word:'Dog',       word_cantonese:'狗',   jyutping:'gau2',        definition_cantonese:'人類最忠實的動物朋友',             difficulty:'easy',   exposure_count:5, mastered:true,  image:'🐶' },
  { id:'w5', word:'Cup',       word_cantonese:'水杯', jyutping:'seoi2 bui1',  definition_cantonese:'用來盛水的容器',                   difficulty:'easy',   exposure_count:2, mastered:false, image:'🥤' },
];

const CATEGORIES = [
  { id:'animals',  name:'Animals',   name_cantonese:'動物',     icon:'🐾', color:'bg-yellow-200', word_count:12,
    words:[
      { word_cantonese:'貓',   jyutping:'maau1',      image:'🐱', definition_cantonese:'一種常見的寵物' },
      { word_cantonese:'狗',   jyutping:'gau2',       image:'🐶', definition_cantonese:'忠實的動物朋友' },
      { word_cantonese:'鳥',   jyutping:'niu5',       image:'🐦', definition_cantonese:'有翅膀會飛的動物' },
      { word_cantonese:'魚',   jyutping:'jyu2',       image:'🐟', definition_cantonese:'住在水裡的動物' },
    ]
  },
  { id:'food',     name:'Food',      name_cantonese:'食物',     icon:'🍎', color:'bg-red-200',    word_count:10,
    words:[
      { word_cantonese:'蘋果', jyutping:'ping4 gwo2', image:'🍎', definition_cantonese:'甜美的紅色水果' },
      { word_cantonese:'香蕉', jyutping:'hoeng1 ziu1',image:'🍌', definition_cantonese:'黃色的彎曲水果' },
      { word_cantonese:'飯',   jyutping:'faan6',      image:'🍚', definition_cantonese:'我們每天吃的主食' },
      { word_cantonese:'麵',   jyutping:'min6',       image:'🍜', definition_cantonese:'長條形的食物' },
    ]
  },
  { id:'colors',   name:'Colors',    name_cantonese:'顏色',     icon:'🌈', color:'bg-blue-200',   word_count:8,
    words:[
      { word_cantonese:'紅色', jyutping:'hung4 sik1', image:'🔴', definition_cantonese:'火和蘋果的顏色' },
      { word_cantonese:'藍色', jyutping:'laam4 sik1', image:'🔵', definition_cantonese:'天空和海洋的顏色' },
      { word_cantonese:'綠色', jyutping:'luk6 sik1',  image:'🟢', definition_cantonese:'草地和樹葉的顏色' },
      { word_cantonese:'黃色', jyutping:'wong4 sik1', image:'🟡', definition_cantonese:'太陽和香蕉的顏色' },
    ]
  },
  { id:'nature',   name:'Nature',    name_cantonese:'大自然',   icon:'🌿', color:'bg-green-200',  word_count:9,
    words:[
      { word_cantonese:'樹',   jyutping:'syu6',       image:'🌳', definition_cantonese:'高大的植物' },
      { word_cantonese:'花',   jyutping:'faa1',       image:'🌸', definition_cantonese:'漂亮的植物' },
      { word_cantonese:'太陽', jyutping:'taai3 joeng4',image:'☀️', definition_cantonese:'給我們光和暖的星球' },
      { word_cantonese:'雨',   jyutping:'jyu5',       image:'🌧️', definition_cantonese:'從天上落下的水' },
    ]
  },
  { id:'family',   name:'Family',    name_cantonese:'家人',     icon:'👨‍👩‍👧', color:'bg-purple-200', word_count:7,
    words:[
      { word_cantonese:'媽媽', jyutping:'maa1 maa1',  image:'👩', definition_cantonese:'我的媽媽' },
      { word_cantonese:'爸爸', jyutping:'baa4 baa1',  image:'👨', definition_cantonese:'我的爸爸' },
      { word_cantonese:'哥哥', jyutping:'go1 go1',    image:'👦', definition_cantonese:'年長的兄弟' },
      { word_cantonese:'妹妹', jyutping:'mui4 mui2',  image:'👧', definition_cantonese:'年幼的姐妹' },
    ]
  },
  { id:'vehicles', name:'Vehicles',  name_cantonese:'交通工具', icon:'🚗', color:'bg-orange-200', word_count:6,
    words:[
      { word_cantonese:'車',   jyutping:'ce1',        image:'🚗', definition_cantonese:'在路上行走的交通工具' },
      { word_cantonese:'巴士', jyutping:'baa1 si2',   image:'🚌', definition_cantonese:'載很多人的大車' },
      { word_cantonese:'火車', jyutping:'fo2 ce1',    image:'🚂', definition_cantonese:'在鐵路上行走的交通工具' },
      { word_cantonese:'船',   jyutping:'syun4',      image:'🚢', definition_cantonese:'在水上行走的交通工具' },
    ]
  },
  { id:'body',     name:'Body',      name_cantonese:'身體',     icon:'🦶', color:'bg-pink-200',   word_count:8,
    words:[
      { word_cantonese:'手',   jyutping:'sau2',       image:'🖐', definition_cantonese:'用來觸摸和拿東西的身體部位' },
      { word_cantonese:'腳',   jyutping:'goek3',      image:'🦶', definition_cantonese:'用來走路的身體部位' },
      { word_cantonese:'眼',   jyutping:'ngaan5',     image:'👁', definition_cantonese:'用來看東西的器官' },
      { word_cantonese:'耳',   jyutping:'ji5',        image:'👂', definition_cantonese:'用來聽聲音的器官' },
    ]
  },
  { id:'clothing', name:'Clothing',  name_cantonese:'衣物',     icon:'👕', color:'bg-indigo-200', word_count:5,
    words:[
      { word_cantonese:'衫',   jyutping:'saam1',      image:'👕', definition_cantonese:'穿在身上保暖的東西' },
      { word_cantonese:'褲',   jyutping:'fu3',        image:'👖', definition_cantonese:'穿在腿上的衣物' },
      { word_cantonese:'帽',   jyutping:'mou2',       image:'🎩', definition_cantonese:'戴在頭上的東西' },
      { word_cantonese:'鞋',   jyutping:'haai4',      image:'👟', definition_cantonese:'穿在腳上的東西' },
    ]
  },
];

const GAMES = [
  { id:'quiz',         name:'單字大挑戰', desc:'聽聲音，選出正確的圖片！', icon:'🎯', color:'purple' },
  { id:'word-builder', name:'粵語拼字',   desc:'學識廣東話點寫！',         icon:'🔤', color:'green'  },
  { id:'speaking',     name:'發音練習',   desc:'大聲讀出單字，贏取獎勵！', icon:'🎤', color:'orange' },
];

const STORIES = [
  { id:'s1', title:'貓咪和蝴蝶',   minutes:3, read_count:1, emoji:'🐱', color:'purple' },
  { id:'s2', title:'蘋果樹的故事', minutes:5, read_count:0, emoji:'🍎', color:'green'  },
  { id:'s3', title:'小狗找朋友',   minutes:4, read_count:2, emoji:'🐶', color:'blue'   },
];

const STORY_PAGES = [
  '從前，有一隻可愛的小貓咪，牠住在一個漂亮的花園裡。花園裡有很多五顏六色的花，還有很多蝴蝶飛來飛去。',
  '有一天，小貓咪看見了一隻美麗的蝴蝶，牠的翅膀是彩虹色的。小貓咪好奇地跟著蝴蝶跑。「你好！」小貓咪說。',
  '蝴蝶停了下來，微笑著說：「你好，小貓咪！我叫做蝴蝶，我喜歡花的香味。」從此，貓咪和蝴蝶成為了好朋友。',
];

const COMMUNITY_WORDS = [
  { word_cantonese:'書包', jyutping:'syu1 baau1', image:'🎒', by:'阿樂' },
  { word_cantonese:'鉛筆', jyutping:'jyun4 bat1', image:'✏️', by:'小花' },
  { word_cantonese:'橡皮', jyutping:'zoeng6 pei4',image:'🧹', by:'阿明' },
  { word_cantonese:'尺',   jyutping:'cek3',        image:'📏', by:'小芬' },
  { word_cantonese:'膠水', jyutping:'gaau1 seoi2', image:'🧴', by:'阿強' },
  { word_cantonese:'剪刀', jyutping:'zin2 dou1',   image:'✂️', by:'小美' },
];

// ─── APP STATE ───────────────────────────────────────────────────────────────
const STATE = {
  activeTab: 'home',
  wordStates: Object.fromEntries(DAILY_WORDS.map(w => [w.id, { mastered: w.mastered, expanded: false }])),
  masteredCount: DAILY_WORDS.filter(w => w.mastered).length,
  selectedCategory: null,
  storyPage: 0,
  communitySubTab: 'mine',
  generatingStory: false,
  generatedStories: [...STORIES],
};
</script>
```

- [ ] **Step 2: Verify** — open in browser, no console errors, `STATE` accessible in console.

---

### Task 3: Header + ProfileHeader Card

**Files:**
- Modify: `prototype.html` — add header HTML inside the container div

- [ ] **Step 1: Add the sticky header bar**

```html
<!-- HEADER -->
<header class="flex items-center justify-between gap-2 py-4 sticky top-0 z-10">
  <!-- Profile Card -->
  <div class="bg-white/80 backdrop-blur-md rounded-[32px] p-4 shadow-sm border border-white/50 flex-1">
    <div class="flex items-center gap-4">
      <!-- Avatar -->
      <div class="relative shrink-0">
        <div class="w-16 h-16 rounded-full bg-orange-100 border-4 border-white shadow-md flex items-center justify-center text-2xl font-black text-orange-500">
          明
        </div>
        <div class="absolute -bottom-1.5 -right-1 bg-sky text-white text-xs font-black px-2 py-0.5 rounded-full border-2 border-white shadow-sm">
          Lv.5
        </div>
      </div>
      <!-- Info -->
      <div class="flex-1 min-w-0">
        <h1 class="text-lg font-black text-slate-700 truncate">你好，小明！</h1>
        <!-- XP bar -->
        <div class="mt-1">
          <div class="flex justify-between text-xs font-bold text-slate-400 mb-1">
            <span class="text-yellow-500">⭐ 465 XP</span>
            <span>35 to Lv.6</span>
          </div>
          <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full" style="width:65%"></div>
          </div>
        </div>
        <!-- Stats row -->
        <div class="flex gap-3 mt-2 text-xs font-bold">
          <span class="text-orange-500">🔥 7天</span>
          <span class="text-blue-500">📖 <span id="words-learned-count">42</span> 字</span>
          <span class="text-green-500">🎯 3/5</span>
        </div>
      </div>
    </div>
  </div>
  <!-- Parent Link -->
  <a href="#" onclick="return false"
     class="flex items-center gap-1.5 bg-gradient-to-r from-sky to-ocean text-white px-3 py-2 rounded-full font-black text-sm shadow-lg shrink-0 hover:scale-105 active:scale-95 transition-all">
    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
    家長
  </a>
</header>
```

- [ ] **Step 2: Verify** — header renders with avatar, XP bar, flame streak, parent button.

---

### Task 4: Bottom Navigation Bar

**Files:**
- Modify: `prototype.html` — add nav bar HTML (fixed, outside the scrolling container)

- [ ] **Step 1: Add the fixed bottom nav**

```html
<!-- BOTTOM NAV -->
<nav id="bottom-nav" class="fixed bottom-4 left-0 right-0 z-50 flex justify-center px-2">
  <div class="flex items-end justify-between w-full max-w-[430px] px-2 py-3 bg-white/95 backdrop-blur-xl border-[3px] border-white/50 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.15)]">
  </div>
</nav>
```

- [ ] **Step 2: Add the nav items via JS — call this function after DOM ready**

```javascript
const NAV_ITEMS = [
  { id:'home',      icon:'🏠', label:'首頁',   activeBg:'bg-blue-400'   },
  { id:'learn',     icon:'📖', label:'學習',   activeBg:'bg-emerald-400'},
  { id:'games',     icon:'🎮', label:'遊戲',   activeBg:'bg-orange-400' },
  { id:'stories',   icon:'🌙', label:'故事',   activeBg:'bg-purple-400' },
  { id:'community', icon:'👥', label:'社區',   activeBg:'bg-teal-400'   },
  { id:'rewards',   icon:'🏆', label:'獎勵',   activeBg:'bg-yellow-400' },
  { id:'profile',   icon:'👤', label:'我的',   activeBg:'bg-pink-400'   },
];

function renderNav() {
  const container = document.querySelector('#bottom-nav > div');
  container.innerHTML = NAV_ITEMS.map(item => {
    const isActive = item.id === STATE.activeTab;
    return `
      <button onclick="switchTab('${item.id}')"
              class="group relative flex flex-col items-center justify-end w-full gap-0.5">
        <div class="nav-icon-bubble ${isActive ? item.activeBg + ' active-bubble' : 'bg-transparent text-slate-400'} flex items-center justify-center">
          <span class="text-${isActive ? 'xl' : 'lg'} leading-none">${item.icon}</span>
        </div>
        <span class="text-[10px] font-bold ${isActive ? 'text-slate-700' : 'text-slate-400'}">${item.label}</span>
      </button>`;
  }).join('');
}
```

- [ ] **Step 3: Add `switchTab` function and DOMContentLoaded init**

```javascript
function switchTab(tabId) {
  STATE.activeTab = tabId;
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  const target = document.getElementById('tab-' + tabId);
  if (target) target.classList.add('active');
  renderNav();
}

document.addEventListener('DOMContentLoaded', () => {
  renderNav();
  switchTab('home');
});
```

- [ ] **Step 4: Verify** — clicking each nav item switches content area, active icon pops up.

---

### Task 5: Home Tab — DailyWordsViewer

**Files:**
- Modify: `prototype.html` — add tab content divs inside main container

- [ ] **Step 1: Add the Home tab wrapper and DailyWordsViewer**

```html
<!-- MAIN CONTENT -->
<main class="space-y-6">

  <!-- ═══ HOME TAB ═══ -->
  <div id="tab-home" class="tab-content space-y-6">
    <!-- Daily Words Section -->
    <section id="daily-words-section" class="bg-white/80 backdrop-blur-md rounded-[32px] p-5 shadow-sm border border-white/50">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <div class="bg-yellow-400 p-2 rounded-2xl shadow-sm rotate-3">
            <span class="text-white text-lg">💡</span>
          </div>
          <div>
            <h2 class="text-xl font-black text-slate-700">今日單字</h2>
            <p class="text-xs font-bold text-slate-400">5 個單字等你學習</p>
          </div>
        </div>
        <button onclick="toggleAllWords()"
                class="text-xs font-black text-slate-400 hover:text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
          全部展開
        </button>
      </div>
      <!-- Word Cards -->
      <div id="daily-word-list" class="space-y-3"></div>
    </section>
  </div>
```

- [ ] **Step 2: Add `renderDailyWords()` function**

```javascript
function renderDailyWords() {
  const container = document.getElementById('daily-word-list');
  container.innerHTML = DAILY_WORDS.map(w => {
    const st = STATE.wordStates[w.id];
    const isNew = w.exposure_count === 0;
    return `
    <div class="rounded-[24px] border-2 overflow-hidden transition-all duration-300 ${st.mastered ? 'border-emerald-300 bg-emerald-50' : 'border-slate-100 bg-white'}">
      <!-- Collapsed Row -->
      <div class="flex items-center gap-4 p-4 cursor-pointer" onclick="toggleWord('${w.id}')">
        <!-- Emoji Image -->
        <div class="relative shrink-0 w-14 h-14 rounded-[16px] bg-white border-2 border-slate-100 flex items-center justify-center text-3xl shadow-sm">
          ${w.image}
          ${isNew ? '<div class="absolute -top-2 -left-2 bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border border-white animate-bounce">+10 XP</div>' : ''}
        </div>
        <!-- Text -->
        <div class="flex-1 min-w-0">
          <div class="text-2xl font-black text-slate-700">${w.word_cantonese}</div>
          <div class="text-xs font-bold text-slate-400">${w.jyutping}</div>
        </div>
        <!-- Controls -->
        <div class="flex items-center gap-2 shrink-0">
          <button onclick="playBeep(event)" class="w-9 h-9 rounded-full bg-sky/20 hover:bg-sky/40 flex items-center justify-center transition-colors" title="播放">
            🔊
          </button>
          <button onclick="toggleMastered(event,'${w.id}')"
                  class="w-9 h-9 rounded-full flex items-center justify-center transition-all ${st.mastered ? 'bg-emerald-400 text-white' : 'bg-slate-100 text-slate-400 hover:bg-emerald-100'}">
            ✓
          </button>
          <span class="text-slate-300 text-lg">${st.expanded ? '▲' : '▼'}</span>
        </div>
      </div>
      <!-- Expanded Detail -->
      <div class="word-card-expanded ${st.expanded ? 'open' : ''} px-4 pb-4">
        <div class="h-px bg-slate-100 mb-3"></div>
        <p class="text-sm font-bold text-slate-600">${w.definition_cantonese}</p>
        <div class="mt-2 flex items-center gap-2">
          <span class="text-xs font-black px-2 py-0.5 rounded-full ${w.difficulty === 'easy' ? 'bg-green-100 text-green-600' : w.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600'}">
            ${w.difficulty === 'easy' ? '簡單' : w.difficulty === 'medium' ? '中等' : '困難'}
          </span>
          <span class="text-xs text-slate-400 font-bold">練習了 ${w.exposure_count} 次</span>
        </div>
      </div>
    </div>`;
  }).join('');
}

function toggleWord(id) {
  STATE.wordStates[id].expanded = !STATE.wordStates[id].expanded;
  renderDailyWords();
}

function toggleMastered(event, id) {
  event.stopPropagation();
  const was = STATE.wordStates[id].mastered;
  STATE.wordStates[id].mastered = !was;
  if (!was) {
    STATE.masteredCount++;
    showToast('+10 XP 🎉 掌握了！');
  } else {
    STATE.masteredCount = Math.max(0, STATE.masteredCount - 1);
  }
  document.getElementById('words-learned-count').textContent =
    42 + STATE.masteredCount - DAILY_WORDS.filter(w => w.mastered).length + STATE.masteredCount;
  renderDailyWords();
}

function toggleAllWords() {
  const anyOpen = Object.values(STATE.wordStates).some(s => s.expanded);
  Object.keys(STATE.wordStates).forEach(id => {
    STATE.wordStates[id].expanded = !anyOpen;
  });
  renderDailyWords();
}

function playBeep(event) {
  event.stopPropagation();
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 523.25; // C5
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(); osc.stop(ctx.currentTime + 0.4);
  } catch(e) {}
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('opacity-100');
  t.classList.remove('opacity-0');
  setTimeout(() => { t.classList.add('opacity-0'); t.classList.remove('opacity-100'); }, 2000);
}
```

- [ ] **Step 3: Call `renderDailyWords()` inside `DOMContentLoaded`**

- [ ] **Step 4: Add toast element (before closing `</body>`)**

```html
<div id="toast" class="fixed top-6 left-1/2 -translate-x-1/2 z-[300] bg-slate-800 text-white text-sm font-black px-5 py-2.5 rounded-full shadow-xl opacity-0 transition-opacity duration-300 pointer-events-none"></div>
```

- [ ] **Step 5: Verify** — words render, expand/collapse works, ✓ button toggles green, beep plays, toast appears.

---

### Task 6: Learn Tab — CategoryGrid + Word Slide-In

**Files:**
- Modify: `prototype.html`

- [ ] **Step 1: Add Learn tab HTML**

```html
  <!-- ═══ LEARN TAB ═══ -->
  <div id="tab-learn" class="tab-content">
    <div id="category-grid-view">
      <div class="flex items-center gap-3 mb-5">
        <div class="bg-emerald-400 p-2 rounded-xl shadow-sm">📚</div>
        <h2 class="text-2xl font-black text-slate-700">學習分類</h2>
      </div>
      <div id="category-grid" class="grid grid-cols-2 gap-3"></div>
    </div>
    <!-- Word List Panel (slides in) -->
    <div id="category-words-panel" class="learn-word-panel">
      <div class="flex items-center gap-3 mb-5">
        <button onclick="closeCategoryPanel()" class="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center font-black text-slate-500 hover:bg-slate-50 active:scale-95">←</button>
        <div class="text-3xl" id="cat-panel-icon"></div>
        <div>
          <h2 class="text-xl font-black text-slate-700" id="cat-panel-name"></h2>
          <p class="text-xs font-bold text-slate-400" id="cat-panel-count"></p>
        </div>
      </div>
      <div id="cat-word-list" class="space-y-3"></div>
    </div>
  </div>
```

- [ ] **Step 2: Add `renderCategories()` and `openCategory()` functions**

```javascript
const CAT_BG_MAP = {
  animals:'bg-yellow-100', food:'bg-red-100', colors:'bg-blue-100',
  nature:'bg-green-100', family:'bg-purple-100', vehicles:'bg-orange-100',
  body:'bg-pink-100', clothing:'bg-indigo-100'
};
const CAT_TEXT_MAP = {
  animals:'text-yellow-700', food:'text-red-600', colors:'text-blue-600',
  nature:'text-green-700', family:'text-purple-600', vehicles:'text-orange-600',
  body:'text-pink-600', clothing:'text-indigo-600'
};

function renderCategories() {
  const grid = document.getElementById('category-grid');
  grid.innerHTML = CATEGORIES.map(cat => `
    <button onclick="openCategory('${cat.id}')"
            class="group relative p-5 rounded-[28px] border-2 border-white hover:border-slate-200 bg-white/80 hover:bg-white shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] active:scale-[0.97] text-left">
      <div class="text-4xl mb-3">${cat.icon}</div>
      <div class="font-black text-slate-700 text-lg leading-tight">${cat.name_cantonese}</div>
      <div class="text-xs font-bold text-slate-400 mt-0.5">${cat.name}</div>
      <div class="absolute top-3 right-3 text-[10px] font-black px-2 py-0.5 rounded-full ${CAT_BG_MAP[cat.id]} ${CAT_TEXT_MAP[cat.id]}">
        ${cat.word_count}字
      </div>
    </button>
  `).join('');
}

function openCategory(catId) {
  const cat = CATEGORIES.find(c => c.id === catId);
  STATE.selectedCategory = cat;
  document.getElementById('cat-panel-icon').textContent = cat.icon;
  document.getElementById('cat-panel-name').textContent = cat.name_cantonese;
  document.getElementById('cat-panel-count').textContent = `${cat.word_count} 個詞語`;
  document.getElementById('cat-word-list').innerHTML = cat.words.map(w => `
    <div class="flex items-center gap-4 p-4 bg-white/80 rounded-[20px] border-2 border-slate-100 hover:border-slate-200 transition-all">
      <div class="w-14 h-14 rounded-[16px] bg-slate-50 border-2 border-slate-100 flex items-center justify-center text-3xl shrink-0">${w.image}</div>
      <div class="flex-1 min-w-0">
        <div class="text-2xl font-black text-slate-700">${w.word_cantonese}</div>
        <div class="text-xs font-bold text-slate-400">${w.jyutping}</div>
        <div class="text-xs font-bold text-slate-500 mt-0.5 line-clamp-1">${w.definition_cantonese}</div>
      </div>
      <button onclick="playBeep(event)" class="w-9 h-9 rounded-full bg-sky/20 hover:bg-sky/40 flex items-center justify-center shrink-0">🔊</button>
    </div>
  `).join('');
  document.getElementById('category-grid-view').style.display = 'none';
  document.getElementById('category-words-panel').classList.add('open');
}

function closeCategoryPanel() {
  document.getElementById('category-grid-view').style.display = 'block';
  document.getElementById('category-words-panel').classList.remove('open');
  STATE.selectedCategory = null;
}
```

- [ ] **Step 3: Call `renderCategories()` in `DOMContentLoaded`**

- [ ] **Step 4: Verify** — category tiles render, click opens word list, back arrow returns to grid.

---

### Task 7: Games Tab + Quiz Overlay

**Files:**
- Modify: `prototype.html`

- [ ] **Step 1: Add Games tab HTML**

```html
  <!-- ═══ GAMES TAB ═══ -->
  <div id="tab-games" class="tab-content space-y-4">
    <div class="flex items-center gap-3 mb-5">
      <div class="bg-orange-400 p-2 rounded-xl shadow-sm">🎮</div>
      <h2 class="text-2xl font-black text-slate-700">遊戲時間</h2>
    </div>
    <div id="games-list" class="space-y-4"></div>
  </div>
```

- [ ] **Step 2: Add game overlays HTML (Quiz, Word Builder, Speaking)**

```html
  <!-- QUIZ OVERLAY -->
  <div id="overlay-quiz" class="overlay items-end justify-center bg-black/50">
    <div class="bg-white w-full max-w-[430px] rounded-t-[40px] p-6 pb-10">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-black text-purple-700">🎯 單字大挑戰</h2>
        <button onclick="closeOverlay('quiz')" class="w-10 h-10 rounded-full bg-slate-100 font-black text-slate-500 hover:bg-slate-200">✕</button>
      </div>
      <div id="quiz-content"></div>
    </div>
  </div>
  <!-- WORD BUILDER OVERLAY -->
  <div id="overlay-word-builder" class="overlay items-end justify-center bg-black/50">
    <div class="bg-white w-full max-w-[430px] rounded-t-[40px] p-6 pb-10">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-black text-green-700">🔤 粵語拼字</h2>
        <button onclick="closeOverlay('word-builder')" class="w-10 h-10 rounded-full bg-slate-100 font-black text-slate-500 hover:bg-slate-200">✕</button>
      </div>
      <div class="text-center py-8 space-y-4">
        <div class="text-6xl animate-bounce">🔤</div>
        <p class="font-black text-xl text-slate-700">學識廣東話點寫！</p>
        <p class="text-slate-400 font-bold">請大聲讀出以下漢字：</p>
        <div class="text-5xl font-black text-green-600 py-4">貓</div>
        <p class="text-sm font-bold text-slate-400">maau1</p>
        <button onclick="closeOverlay('word-builder'); showToast('做得好！+15 XP 🌟')" class="w-full bg-green-400 hover:bg-green-500 text-white font-black py-4 rounded-[20px] text-lg transition-all active:scale-95">
          ✓ 完成！
        </button>
      </div>
    </div>
  </div>
  <!-- SPEAKING OVERLAY -->
  <div id="overlay-speaking" class="overlay items-end justify-center bg-black/50">
    <div class="bg-white w-full max-w-[430px] rounded-t-[40px] p-6 pb-10">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-black text-orange-700">🎤 發音練習</h2>
        <button onclick="closeOverlay('speaking')" class="w-10 h-10 rounded-full bg-slate-100 font-black text-slate-500 hover:bg-slate-200">✕</button>
      </div>
      <div class="text-center py-6 space-y-4">
        <div class="text-6xl">🐶</div>
        <p class="font-black text-xl text-slate-700">大聲讀出：狗</p>
        <p class="text-slate-400 font-bold text-lg">gau2</p>
        <button id="mic-btn" onclick="activateMic()" class="w-20 h-20 rounded-full bg-orange-400 hover:bg-orange-500 text-5xl mx-auto flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all">
          🎤
        </button>
        <p class="text-sm font-bold text-slate-400">按下麥克風開始錄音</p>
      </div>
    </div>
  </div>
```

- [ ] **Step 3: Add games rendering and overlay JS**

```javascript
const GAME_COLORS = {
  purple: { card:'border-purple-200 bg-purple-50 hover:bg-purple-100', text:'text-purple-600', btn:'bg-purple-100 group-hover:bg-purple-600 group-hover:text-white' },
  green:  { card:'border-green-200 bg-green-50 hover:bg-green-100',   text:'text-green-600',  btn:'bg-green-100  group-hover:bg-green-500  group-hover:text-white' },
  orange: { card:'border-orange-200 bg-orange-50 hover:bg-orange-100',text:'text-orange-600', btn:'bg-orange-100 group-hover:bg-orange-500 group-hover:text-white' },
};

function renderGames() {
  document.getElementById('games-list').innerHTML = GAMES.map((g, i) => {
    const c = GAME_COLORS[g.color];
    return `
    <button onclick="openOverlay('${g.id}')"
            class="group w-full flex items-center gap-5 p-5 rounded-[32px] border-4 ${c.card} hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md transition-all duration-300 text-left relative">
      <div class="w-20 h-20 rounded-[24px] bg-white flex items-center justify-center text-4xl shadow-sm group-hover:scale-110 transition-transform duration-300">${g.icon}</div>
      <div class="flex-1 min-w-0">
        <h3 class="font-black text-slate-700 text-xl tracking-tight mb-1">${g.name}</h3>
        <p class="text-sm font-bold ${c.text} opacity-80 line-clamp-2">${g.desc}</p>
      </div>
      <div class="w-12 h-12 rounded-full ${c.btn} flex items-center justify-center shadow-sm transition-colors shrink-0">
        ▶
      </div>
      ${i === 0 ? '<div class="absolute -top-3 -right-2 bg-yellow-400 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-sm rotate-6">熱門</div>' : ''}
    </button>`;
  }).join('');
}

const QUIZ_QUESTIONS = [
  { question:'下面哪個是「貓」？', correct:0, options:['🐱','🐶','🐦','🐟'] },
  { question:'下面哪個是「蘋果」？', correct:1, options:['🍌','🍎','🍇','🍊'] },
  { question:'下面哪個是「蝴蝶」？', correct:2, options:['🐝','🐛','🦋','🐞'] },
];
let quizIndex = 0;

function renderQuiz() {
  const q = QUIZ_QUESTIONS[quizIndex % QUIZ_QUESTIONS.length];
  document.getElementById('quiz-content').innerHTML = `
    <div class="text-center mb-6">
      <div class="text-4xl mb-2">🔊</div>
      <p class="font-black text-lg text-slate-700">${q.question}</p>
      <p class="text-sm text-slate-400 font-bold mt-1">問題 ${(quizIndex % QUIZ_QUESTIONS.length) + 1}/3</p>
    </div>
    <div class="grid grid-cols-2 gap-3">
      ${q.options.map((opt, i) => `
        <button id="quiz-opt-${i}" onclick="answerQuiz(${i}, ${q.correct})"
                class="h-24 rounded-[20px] bg-slate-50 border-4 border-slate-200 text-5xl hover:bg-purple-50 hover:border-purple-300 transition-all active:scale-95 font-black">
          ${opt}
        </button>
      `).join('')}
    </div>
  `;
}

function answerQuiz(chosen, correct) {
  const btns = document.querySelectorAll('[id^="quiz-opt-"]');
  btns.forEach((b, i) => {
    b.disabled = true;
    if (i === correct) b.classList.add('bg-green-100','border-green-400');
    else if (i === chosen && chosen !== correct) { b.classList.add('bg-red-100','border-red-400','shake'); }
  });
  if (chosen === correct) {
    showToast('+10 XP 🎉 答啱喇！');
    quizIndex++;
    setTimeout(() => renderQuiz(), 1500);
  }
}

function openOverlay(id) {
  if (id === 'quiz') renderQuiz();
  document.getElementById('overlay-' + id).classList.add('open');
}

function closeOverlay(id) {
  document.getElementById('overlay-' + id).classList.remove('open');
}

function activateMic() {
  const btn = document.getElementById('mic-btn');
  btn.textContent = '⏺';
  btn.classList.add('animate-pulse');
  setTimeout(() => {
    btn.textContent = '🎤';
    btn.classList.remove('animate-pulse');
    showToast('做得好！+15 XP 🌟');
    setTimeout(() => closeOverlay('speaking'), 500);
  }, 2000);
}
```

- [ ] **Step 4: Call `renderGames()` in `DOMContentLoaded`**

- [ ] **Step 5: Verify** — game cards show, quiz overlay opens, correct/wrong feedback renders, speaking mic animates then closes.

---

### Task 8: Stories Tab

**Files:**
- Modify: `prototype.html`

- [ ] **Step 1: Add Stories tab HTML**

```html
  <!-- ═══ STORIES TAB ═══ -->
  <div id="tab-stories" class="tab-content space-y-8">
    <!-- Generator -->
    <section class="bg-white/80 backdrop-blur-md rounded-[32px] p-5 shadow-sm border border-white/50">
      <div class="flex items-center gap-3 mb-4">
        <div class="bg-purple-400 p-2 rounded-xl shadow-sm">✨</div>
        <h2 class="text-xl font-black text-slate-700">生成故事</h2>
      </div>
      <div class="space-y-3">
        <input id="story-topic-input" type="text" placeholder="輸入故事主題，例如：動物、海洋..."
               class="w-full px-4 py-3 rounded-[16px] border-2 border-slate-200 bg-white font-bold text-slate-700 placeholder-slate-300 focus:border-purple-400 focus:outline-none transition-colors" />
        <button onclick="generateStory()"
                class="w-full bg-gradient-to-r from-purple-400 to-indigo-400 hover:from-purple-500 hover:to-indigo-500 text-white font-black py-3.5 rounded-[16px] shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all text-lg">
          <span id="gen-btn-text">✨ 生成故事</span>
        </button>
      </div>
    </section>
    <!-- Story Shelf -->
    <section>
      <div class="flex items-center gap-3 mb-4 pl-1">
        <div class="bg-blue-400 p-2 rounded-xl -rotate-3 shadow-sm">📚</div>
        <h2 class="text-2xl font-black text-slate-700">我的故事書</h2>
      </div>
      <div id="story-shelf" class="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"></div>
    </section>
  </div>
```

- [ ] **Step 2: Add story reader modal HTML**

```html
  <!-- STORY READER MODAL -->
  <div id="modal-story" class="modal items-end justify-center bg-black/60">
    <div class="bg-gradient-to-b from-indigo-50 to-purple-50 w-full max-w-[430px] rounded-t-[40px] p-6 pb-10 max-h-[85vh] flex flex-col">
      <div class="flex items-center justify-between mb-4">
        <h2 id="reader-title" class="text-xl font-black text-slate-700 flex-1 truncate"></h2>
        <button onclick="closeModal('story')" class="w-10 h-10 rounded-full bg-white shadow-sm font-black text-slate-500 hover:bg-slate-50 ml-2 shrink-0">✕</button>
      </div>
      <!-- Page -->
      <div class="flex-1 flex flex-col items-center justify-center py-4">
        <div id="reader-page-text" class="text-center text-lg font-bold text-slate-700 leading-relaxed px-2"></div>
      </div>
      <!-- Controls -->
      <div class="space-y-3">
        <button onclick="playBeep(event)" class="w-full flex items-center justify-center gap-2 bg-white/80 border-2 border-slate-200 rounded-[16px] py-2.5 font-black text-slate-600 hover:bg-white">
          🔊 朗讀
        </button>
        <div class="flex items-center justify-between gap-3">
          <button id="reader-prev" onclick="storyPrev()" class="flex-1 bg-white border-2 border-slate-200 rounded-[16px] py-2.5 font-black text-slate-600 hover:bg-slate-50 disabled:opacity-40">← 上一頁</button>
          <div id="reader-dots" class="flex gap-1.5 shrink-0"></div>
          <button id="reader-next" onclick="storyNext()" class="flex-1 bg-purple-400 text-white rounded-[16px] py-2.5 font-black hover:bg-purple-500">下一頁 →</button>
        </div>
      </div>
    </div>
  </div>
```

- [ ] **Step 3: Add story rendering and generation JS**

```javascript
const STORY_COVER_COLORS = {
  purple:'bg-purple-100 text-purple-600', green:'bg-green-100 text-green-600',
  blue:'bg-blue-100 text-blue-600', orange:'bg-orange-100 text-orange-600',
};

function renderStoryShelf() {
  const shelf = document.getElementById('story-shelf');
  shelf.innerHTML = STATE.generatedStories.map(s => {
    const bg = STORY_COVER_COLORS[s.color] || STORY_COVER_COLORS.blue;
    return `
    <button onclick="openStoryReader('${s.id}')"
            class="group relative flex flex-col rounded-[32px] overflow-hidden min-w-[11rem] w-44 h-64 border-4 transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm hover:shadow-xl bg-white ${s.read_count > 0 ? 'border-emerald-400' : 'border-white hover:border-purple-200'}">
      <div class="flex-1 w-full flex flex-col items-center justify-center p-4 ${bg}">
        <div class="text-5xl mb-2">${s.emoji}</div>
        ${s.read_count > 0 ? '<div class="absolute top-3 right-3 bg-emerald-400 text-white text-[10px] font-black px-2 py-0.5 rounded-full">已讀 ✓</div>' : ''}
      </div>
      <div class="p-3 bg-white">
        <div class="font-black text-sm text-slate-700 line-clamp-2 leading-tight">${s.title}</div>
        <div class="text-xs font-bold text-slate-400 mt-1">🕐 ${s.minutes} 分鐘</div>
      </div>
    </button>`;
  }).join('');
}

function openStoryReader(storyId) {
  const s = STATE.generatedStories.find(x => x.id === storyId);
  STATE.storyPage = 0;
  document.getElementById('reader-title').textContent = s.title;
  updateReaderPage();
  document.getElementById('modal-story').classList.add('open');
}

function updateReaderPage() {
  const total = STORY_PAGES.length;
  document.getElementById('reader-page-text').textContent = STORY_PAGES[STATE.storyPage];
  document.getElementById('reader-prev').disabled = STATE.storyPage === 0;
  const nextBtn = document.getElementById('reader-next');
  if (STATE.storyPage === total - 1) {
    nextBtn.textContent = '完成 🎉';
    nextBtn.onclick = () => { closeModal('story'); showToast('故事讀完啦！+20 XP 🎉'); };
  } else {
    nextBtn.textContent = '下一頁 →';
    nextBtn.onclick = storyNext;
  }
  document.getElementById('reader-dots').innerHTML = STORY_PAGES.map((_, i) =>
    `<div class="w-2 h-2 rounded-full transition-all ${i === STATE.storyPage ? 'bg-purple-400 scale-125' : 'bg-slate-200'}"></div>`
  ).join('');
}

function storyPrev() { if (STATE.storyPage > 0) { STATE.storyPage--; updateReaderPage(); } }
function storyNext() { if (STATE.storyPage < STORY_PAGES.length - 1) { STATE.storyPage++; updateReaderPage(); } }

function closeModal(id) {
  document.getElementById('modal-' + id).classList.remove('open');
}

function generateStory() {
  const input = document.getElementById('story-topic-input').value.trim() || '動物';
  const btn = document.getElementById('gen-btn-text');
  btn.textContent = '⏳ 生成中...';
  document.querySelector('[onclick="generateStory()"]').disabled = true;
  setTimeout(() => {
    const newStory = {
      id: 's-new-' + Date.now(),
      title: `${input}的奇幻冒險`,
      minutes: Math.floor(Math.random() * 4) + 2,
      read_count: 0, emoji: '📖', color: 'orange'
    };
    STATE.generatedStories.unshift(newStory);
    renderStoryShelf();
    btn.textContent = '✨ 生成故事';
    document.querySelector('[onclick="generateStory()"]').disabled = false;
    document.getElementById('story-topic-input').value = '';
    showToast('故事生成成功！🎉');
  }, 2000);
}
```

- [ ] **Step 4: Call `renderStoryShelf()` in `DOMContentLoaded`**

- [ ] **Step 5: Verify** — 3 story cards show in horizontal scroll, click opens modal reader, pages advance, generate button shows 2s spinner then adds card.

---

### Task 9: Community, Rewards, Profile Tabs

**Files:**
- Modify: `prototype.html`

- [ ] **Step 1: Add Community tab HTML**

```html
  <!-- ═══ COMMUNITY TAB ═══ -->
  <div id="tab-community" class="tab-content space-y-5">
    <div class="flex items-center gap-3 mb-1">
      <div class="bg-teal-400 p-2 rounded-xl shadow-sm">👥</div>
      <h2 class="text-2xl font-black text-slate-700">社區詞彙</h2>
    </div>
    <!-- Sub-tabs -->
    <div class="flex gap-2 bg-slate-100 p-1 rounded-[20px]">
      <button id="subtab-mine" onclick="switchCommunityTab('mine')"
              class="flex-1 py-2 rounded-[16px] font-black text-sm transition-all bg-white shadow-sm text-teal-600">
        📷 我的相片詞彙
      </button>
      <button id="subtab-community" onclick="switchCommunityTab('community')"
              class="flex-1 py-2 rounded-[16px] font-black text-sm transition-all text-slate-400">
        🌍 社區詞彙
      </button>
    </div>
    <div id="community-word-grid" class="grid grid-cols-3 gap-3"></div>
  </div>

  <!-- ═══ REWARDS TAB ═══ -->
  <div id="tab-rewards" class="tab-content">
    <div class="bg-white/80 backdrop-blur-md rounded-[40px] p-12 text-center border border-white/50 shadow-sm">
      <div class="bg-yellow-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce text-4xl">🚧</div>
      <h2 class="text-2xl font-black text-slate-700 mb-2">即將推出！</h2>
      <p class="text-slate-500 font-bold">獎勵功能正在開發中，敬請期待！</p>
    </div>
  </div>

  <!-- ═══ PROFILE TAB ═══ -->
  <div id="tab-profile" class="tab-content">
    <div class="bg-white/80 backdrop-blur-md rounded-[40px] p-12 text-center border border-white/50 shadow-sm">
      <div class="bg-yellow-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce text-4xl">🚧</div>
      <h2 class="text-2xl font-black text-slate-700 mb-2">即將推出！</h2>
      <p class="text-slate-500 font-bold">個人資料功能正在開發中，敬請期待！</p>
    </div>
  </div>
```

- [ ] **Step 2: Add community JS**

```javascript
const MY_WORDS_MOCK = [
  { word_cantonese:'水杯', jyutping:'seoi2 bui1', image:'🥤' },
  { word_cantonese:'書包', jyutping:'syu1 baau1', image:'🎒' },
  { word_cantonese:'蘋果', jyutping:'ping4 gwo2', image:'🍎' },
  { word_cantonese:'貓',   jyutping:'maau1',       image:'🐱' },
  { word_cantonese:'花',   jyutping:'faa1',        image:'🌸' },
  { word_cantonese:'樹',   jyutping:'syu6',        image:'🌳' },
];

function renderCommunityWords() {
  const words = STATE.communitySubTab === 'mine' ? MY_WORDS_MOCK : COMMUNITY_WORDS;
  document.getElementById('community-word-grid').innerHTML = words.map(w => `
    <button class="bg-white/80 rounded-[20px] border-2 border-slate-100 hover:border-teal-300 p-3 flex flex-col items-center gap-1.5 transition-all hover:scale-105 active:scale-95 shadow-sm">
      <div class="w-14 h-14 rounded-[14px] bg-slate-50 flex items-center justify-center text-3xl">${w.image}</div>
      <div class="font-black text-slate-700 text-sm">${w.word_cantonese}</div>
      <div class="text-[10px] font-bold text-slate-400">${w.jyutping}</div>
    </button>
  `).join('');
}

function switchCommunityTab(tab) {
  STATE.communitySubTab = tab;
  ['mine','community'].forEach(t => {
    const btn = document.getElementById('subtab-' + t);
    if (t === tab) {
      btn.classList.add('bg-white','shadow-sm','text-teal-600');
      btn.classList.remove('text-slate-400');
    } else {
      btn.classList.remove('bg-white','shadow-sm','text-teal-600');
      btn.classList.add('text-slate-400');
    }
  });
  renderCommunityWords();
}
```

- [ ] **Step 3: Call `renderCommunityWords()` in `DOMContentLoaded`**

- [ ] **Step 4: Verify** — community sub-tabs switch word grids, rewards/profile show coming-soon screens.

---

### Task 10: Integration, Close Tags, Final Open

**Files:**
- Modify: `prototype.html` — close all open tags, wire up all `DOMContentLoaded` calls

- [ ] **Step 1: Close the main container and body**

```html
</main>
</div><!-- end max-w container -->
</body>
</html>
```

- [ ] **Step 2: Full `DOMContentLoaded` init block (consolidating all render calls)**

```javascript
document.addEventListener('DOMContentLoaded', () => {
  renderNav();
  renderDailyWords();
  renderCategories();
  renderGames();
  renderStoryShelf();
  renderCommunityWords();
  switchTab('home');
});
```

- [ ] **Step 3: Open `prototype.html` in browser and do full walkthrough:**
  - Home: word cards expand/collapse, ✓ mastery toggle, 🔊 beep, toast
  - Learn: all 8 category tiles, click opens 4 words, back returns
  - Games: all 3 cards, quiz plays 3 questions with correct/wrong feedback, speaking mic animates
  - Stories: generate story (2s spinner, new card), click story → reader, page through, complete
  - Community: sub-tab switch
  - Rewards/Profile: coming-soon screens
  - Nav: all 7 tabs switch correctly with animated active bubble

- [ ] **Step 4: Commit**

```bash
cd /Users/karen/MCSCaptsoneProject-frontend
git add prototype.html docs/superpowers/specs/2026-04-11-html-prototype-design.md docs/superpowers/plans/2026-04-11-html-prototype.md
git commit -m "feat: add standalone HTML prototype with all 7 tabs and interactive elements"
```

---

## Self-Review

- ✅ All spec sections covered: Home (words), Learn (categories), Games (quiz+overlays), Stories (reader+generator), Community (sub-tabs), Rewards/Profile (placeholders)
- ✅ No TBDs or placeholders in any task
- ✅ All JS function names are consistent across tasks (e.g. `openOverlay`/`closeOverlay`, `openModal`/`closeModal` → unified as `closeModal` for stories)
- ✅ Mock data field names match backend models exactly
- ✅ Every code step shows complete code blocks
- ✅ Tasks are sequenced correctly (data → shell → tabs → integration)
- ✅ `prototype.html` is the single output file — clean output path
