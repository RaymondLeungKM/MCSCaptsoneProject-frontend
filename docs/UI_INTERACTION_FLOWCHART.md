# Complete UI Interaction Flowchart
> Generated: April 2026 | Covers: Frontend `/app` + Backend `/api/v1` endpoints

---

```mermaid
flowchart TD

    %% ─────────────────────────────────────────────
    %% ENTRY POINT
    %% ─────────────────────────────────────────────
    START(["`**App Loads**
    Browser opens`"]) --> TOKEN_CHECK

    TOKEN_CHECK{"`Auth token in
    localStorage?`"}

    TOKEN_CHECK -->|No token| LOGIN_PAGE
    TOKEN_CHECK -->|Token exists| VERIFY_USER

    VERIFY_USER["`**GET** /api/v1/users/me
    → Verify JWT token`"]

    VERIFY_USER -->|401 Expired/Invalid| LOGIN_PAGE
    VERIFY_USER -->|200 OK — user loaded| CONSENT_CHECK

    CONSENT_CHECK{"`user.consent_given
    === false?`"}
    CONSENT_CHECK -->|Yes — first time| PRIVACY_MODAL
    CONSENT_CHECK -->|No — already done| ROUTE_CHECK

    %% ─────────────────────────────────────────────
    %% PRIVACY CONSENT MODAL
    %% ─────────────────────────────────────────────
    subgraph CONSENT_FLOW["🔒 Privacy Consent Modal (Blocks App)"]
        PRIVACY_MODAL["`**PrivacyConsentModal**
        Checkboxes:
        ☐ Camera permission
        ☐ Microphone permission
        ☐ Analytics tracking
        ☐ Community word sharing`"]

        CONSENT_SUBMIT["`User ticks boxes
        → clicks **Submit**`"]

        CONSENT_API["`**PATCH** /api/v1/users/me/consent
        Body: { consent_camera, consent_microphone,
        consent_analytics, community_sharing_enabled }`"]

        CONSENT_REFRESH["`**GET** /api/v1/users/me
        → refreshUser() → update context`"]

        PRIVACY_MODAL --> CONSENT_SUBMIT --> CONSENT_API --> CONSENT_REFRESH --> ROUTE_CHECK
    end

    ROUTE_CHECK --> LOGIN_PAGE
    ROUTE_CHECK --> PARENT_DASHBOARD
    ROUTE_CHECK --> CHILD_DASHBOARD

    %% ─────────────────────────────────────────────
    %% AUTHENTICATION PAGES
    %% ─────────────────────────────────────────────
    subgraph AUTH_PAGES["🔐 Authentication — /login & /register"]

        LOGIN_PAGE["`**/login**
        Email field
        Password field`"]

        LOGIN_BTN["`User fills form
        → clicks **Login**`"]

        LOGIN_API["`**POST** /api/v1/auth/login
        Body: { email, password }`"]

        LOGIN_OK["`200 OK
        { access_token, token_type }
        → localStorage.setItem('auth_token')`"]

        LOGIN_FAIL["`401 Unauthorized
        → Show error:
        'Incorrect email or password'`"]

        LOGIN_PAGE --> LOGIN_BTN --> LOGIN_API
        LOGIN_API -->|Success| LOGIN_OK
        LOGIN_API -->|Fail| LOGIN_FAIL
        LOGIN_FAIL --> LOGIN_PAGE
        LOGIN_OK --> PARENT_DASHBOARD

        %% Register link
        LOGIN_PAGE -->|"Click 'Register' link"| REGISTER_PAGE

        REGISTER_PAGE["`**/register**
        Full Name field
        Email field
        Password field (min 6 chars)
        Confirm Password field`"]

        REGISTER_BTN["`User fills form
        → clicks **Register**`"]

        REGISTER_API["`**POST** /api/v1/auth/register
        Body: { email, full_name, password }`"]

        REGISTER_OK["`201 Created
        { access_token, token_type, user }
        → localStorage.setItem('auth_token')
        → router.push('/')`"]

        REGISTER_FAIL["`400 Bad Request
        → Show error:
        'Email already registered'`"]

        REGISTER_PAGE --> REGISTER_BTN --> REGISTER_API
        REGISTER_API -->|Success| REGISTER_OK
        REGISTER_API -->|Fail| REGISTER_FAIL
        REGISTER_FAIL --> REGISTER_PAGE
        REGISTER_OK --> CHILD_DASHBOARD

        REGISTER_PAGE -->|"Click 'Login' link"| LOGIN_PAGE
    end

    %% ─────────────────────────────────────────────
    %% CREATE CHILD PAGE
    %% ─────────────────────────────────────────────
    subgraph CREATE_CHILD_PAGE["👶 Create Child Profile — /create-child"]
        CC_FORM["`**/create-child**
        ① Child Name (text input)
        ② Age (dropdown: 2–12)
        ③ Learning Style:
           👀 Visual / 👂 Auditory
           🏃 Kinesthetic / ✨ Mixed
        ④ Avatar (6 emoji choices:
           👦 👧 🧑 🐻 🐰 🦁)`"]

        CC_SUBMIT["`User fills form
        → clicks **完成設定** (Complete Setup)`"]

        CC_API["`**POST** /api/v1/children/
        Body: { name, age, avatar,
        learning_style,
        language_preference: 'cantonese' }`"]

        CC_OK["`201 Created → ChildResponse
        { id, name, avatar, age, level, xp }
        → router.push('/parent')`"]

        CC_FAIL["`Error → Show error message
        → Stay on form`"]

        CC_FORM --> CC_SUBMIT --> CC_API
        CC_API -->|Success| CC_OK
        CC_API -->|Error| CC_FAIL
        CC_FAIL --> CC_FORM
        CC_OK --> PARENT_DASHBOARD
    end

    %% ─────────────────────────────────────────────
    %% PARENT DASHBOARD
    %% ─────────────────────────────────────────────
    subgraph PARENT_DASHBOARD["👨‍👩‍👧 Parent Dashboard — /parent"]

        P_LOAD["`**Page Load**
        **GET** /api/v1/children/
        → Load all children
        → Default to first child`"]

        P_NO_CHILD{"`Children
        exist?`"}

        P_LOAD --> P_NO_CHILD

        P_CREATE_BTN["`Button: 'Create Child Profile'
        → router.push('/create-child')`"]
        P_NO_CHILD -->|No children| P_CREATE_BTN
        P_CREATE_BTN --> CREATE_CHILD_PAGE

        P_NO_CHILD -->|Children found| P_TABS

        P_TABS["`**Tabbed Interface**
        (sticky header + nav bar)`"]

        %% Tab: Overview
        P_TABS -->|"Click 概覽 (Overview)"| TAB_OV
        TAB_OV["`**概覽 (Overview) Tab**
        **GET** /api/v1/parent-dashboard/{childId}/summary
        ↳ Today's words learned
        ↳ Total XP, current streak
        ↳ Daily goal progress bar
        ↳ Recent word cards`"]

        %% Tab: Progress
        P_TABS -->|"Click 進度 (Progress)"| TAB_PR
        TAB_PR["`**進度 (Progress) Tab**
        **GET** /api/v1/progress/{childId}/stats
        **GET** /api/v1/vocabulary/
        ↳ Word mastery list
        ↳ Category breakdown
        ↳ Mastered / Seen / New counts`"]

        %% Tab: Charts
        P_TABS -->|"Click 圖表 (Charts)"| TAB_CH
        TAB_CH["`**圖表 (Charts / Analytics) Tab**
        **GET** /api/v1/parent-dashboard/{childId}/charts?period=week|month|all
        ↳ Recharts graphs: daily words, XP over time
        ↳ Category heatmap
        ↳ Period selector: Week / Month / All`"]

        %% Tab: Missions
        P_TABS -->|"Click 任務 (Missions)"| TAB_MI
        TAB_MI["`**任務 (Daily Missions) Tab**
        **GET** /api/v1/missions/daily/{childId}
        ↳ List of daily digital missions
        ↳ Mission progress, completion status`"]

        %% Tab: Offline
        P_TABS -->|"Click 離線 (Offline)"| TAB_OF
        TAB_OF["`**離線 (Offline Missions) Tab**
        **GET** /api/v1/missions/offline/{childId}
        ↳ Real-world activity cards
        ↳ e.g. 'Find 3 red objects outside'`"]

        %% Tab: Insights
        P_TABS -->|"Click 分析 (Insights)"| TAB_IN
        TAB_IN["`**分析 (Insights) Tab**
        **GET** /api/v1/parent-dashboard/{childId}/insights
        ↳ AI-generated learning recommendations
        ↳ Alerts (missed goals, categories to review)`"]

        TAB_IN -->|"Click 'Mark as Read'"| MARK_READ
        MARK_READ["`**PATCH** /api/v1/parent-dashboard/{childId}/insights/{insightId}
        Body: { is_read: true, is_dismissed: false }
        → Removes from list`"]

        TAB_IN -->|"Click 'Dismiss'"| DISMISS_INS
        DISMISS_INS["`**PATCH** /api/v1/parent-dashboard/{childId}/insights/{insightId}
        Body: { is_dismissed: true }
        → Hides insight permanently`"]

        %% Tab: Settings
        P_TABS -->|"Click 設定 (Settings)"| TAB_SE
        TAB_SE["`**設定 (Settings) Tab**
        Shows child profile card:
        Name, Age, Avatar, Learning Style`"]

        TAB_SE -->|"Click Edit Child"| EDIT_CHILD
        EDIT_CHILD["`**PATCH** /api/v1/children/{childId}
        Body: { name?, age?, avatar?,
        learning_style?, daily_goal? }
        → Updates profile`"]

        TAB_SE -->|"Click Delete Child"| DEL_CHILD
        DEL_CHILD["`**DELETE** /api/v1/children/{childId}
        → 204 No Content
        → Child + all data removed`"]

        %% Header Buttons
        P_HEADER_CHILD["`Button: **兒童模式** (Child Mode)
        → router.push('/child')`"]
        P_HEADER_CHILD --> CHILD_DASHBOARD

        P_LOGOUT["`Button: **Logout**
        → clearAuthToken()
        from localStorage
        → window.location = '/login'`"]
        P_LOGOUT --> LOGIN_PAGE
    end

    %% ─────────────────────────────────────────────
    %% CHILD DASHBOARD
    %% ─────────────────────────────────────────────
    subgraph CHILD_DASHBOARD["🧒 Child Dashboard — /child"]

        C_LOAD["`**Page Load**
        **GET** /api/v1/children/ → select child
        **POST** /api/v1/progress/session
        Body: { child_id, start_time }
        → sessionId stored in ref`"]

        C_LOAD --> C_NAV

        C_NAV["`**Bottom Navigation Bar**
        7 tabs`"]

        %% ── HOME TAB ──────────────────────────────
        C_NAV -->|"Tap 首頁 (Home)"| HOME_TAB
        subgraph HOME_TAB["🏠 Home Tab (首頁)"]
            H_PROFILE["`**ProfileHeader**
            **GET** /api/v1/children/{childId}
            **GET** /api/v1/progress/{childId}/stats
            Shows: avatar, name, level badge,
            XP progress bar, streak fire 🔥`"]

            H_DAILY["`**DailyWordsViewer**
            **GET** /api/v1/bedtime-stories/daily-words/{childId}
            Shows: today's word cards
            (Cantonese, jyutping, image, audio)`"]

            H_DAILY --> H_WORD_CLICK

            H_WORD_CLICK["`User taps a **word card**`"]
            H_WORD_CLICK --> WORD_MODAL

            H_PROFILE & H_DAILY --> H_PROFILE
        end

        %% ── LEARN TAB ─────────────────────────────
        C_NAV -->|"Tap 學習 (Learn)"| LEARN_TAB
        subgraph LEARN_TAB["📚 Learn Tab (學習)"]
            L_CATS["`**CategoryGrid**
            **GET** /api/v1/categories/
            Shows: grid of category cards
            (Animals 🐾, Food 🍎, Colors 🎨...)`"]

            L_CATS -->|"Tap a category card"| L_WORDS

            L_WORDS["`**Word List**
            **GET** /api/v1/vocabulary/?category={id}&limit=50
            Shows: word cards with
            ✅ mastery badge, +XP indicator`"]

            L_WORDS -->|"Tap ▶ Play audio"| L_AUDIO
            L_AUDIO["`Play word audio from
            word.audio_url (Cantonese)
            word.audio_url_english (English)`"]

            L_WORDS -->|"Tap word card"| WORD_MODAL
        end

        %% ── WORD DETAIL MODAL (shared) ────────────
        WORD_MODAL["`**WordDetailModal** (Full-screen overlay)
        Shows: image, Chinese character,
        jyutping, English translation,
        example sentence, audio button
        ──────────────────────────────────
        **POST** /api/v1/vocabulary/{wordId}/progress/{childId}
        Body: { exposure_count: +1, total_attempts: +1,
        correct_attempts: +1 if correct }
        Response: { xp_earned, mastered flag }
        Auto-mastery: success_rate ≥ 80% AND attempts ≥ 3`"]

        %% ── GAMES TAB ─────────────────────────────
        C_NAV -->|"Tap 遊戲 (Games)"| GAMES_TAB
        subgraph GAMES_TAB["🎮 Games Tab (遊戲)"]
            G_LIST["`**GamesList**
            **GET** /api/v1/games/
            Shows: 3 game cards`"]

            %% Quiz Game
            G_LIST -->|"Tap 🎯 Quiz Game"| QUIZ
            subgraph QUIZ["🎯 Quiz Game"]
                Q_LOAD["`**Load words**
                **GET** /api/v1/vocabulary/
                **GET** /api/v1/bedtime-stories/daily-words/{childId}`"]
                Q_PLAY["`**10 Rounds**
                Hear Cantonese audio clip
                → Select correct image from 4 choices
                → Instant right/wrong feedback`"]
                Q_END["`**Round Complete** — Show score, stars ⭐
                **POST** /api/v1/games/{gameId}/play
                Body: { child_id, score, max_score,
                duration_seconds, words_seen,
                words_correct, stars }
                Response: { xp_earned }`"]
                Q_LOAD --> Q_PLAY --> Q_END
            end

            %% Word Builder
            G_LIST -->|"Tap 🔤 Word Builder"| WB
            subgraph WB["🔤 Word Builder Game"]
                WB_LOAD["`**Load daily words**
                **GET** /api/v1/bedtime-stories/daily-words/{childId}
                **GET** /api/v1/vocabulary/captured/{childId}`"]
                WB_PLAY["`**10 Rounds**
                See word image + English
                → Drag Chinese characters
                into correct order`"]
                WB_END["`**Score + XP**
                **POST** /api/v1/games/{gameId}/play
                Body: { child_id, score, stars... }`"]
                WB_LOAD --> WB_PLAY --> WB_END
            end

            %% Speaking Game
            G_LIST -->|"Tap 🎤 Speaking Game"| SPK
            subgraph SPK["🎤 Speaking Game"]
                SPK_LOAD["`**Load vocabulary**
                **GET** /api/v1/vocabulary/`"]
                SPK_PLAY["`**10 Rounds**
                See word → Press mic button
                → Speak word aloud
                → Browser SpeechRecognition API
                → Score pronunciation accuracy`"]
                SPK_END["`**Accuracy score + XP**
                **POST** /api/v1/games/{gameId}/play
                Body: { child_id, score, stars... }`"]
                SPK_LOAD --> SPK_PLAY --> SPK_END
            end

            Q_END & WB_END & SPK_END --> G_CLOSE
            G_CLOSE["`Game modal closes
            → Return to Games list
            ↳ XP added to profile`"]
        end

        %% ── STORIES TAB ───────────────────────────
        C_NAV -->|"Tap 故事 (Stories)"| STORIES_TAB
        subgraph STORIES_TAB["🌙 Stories Tab (故事)"]
            ST_LOAD["`**Page Load**
            **GET** /api/v1/bedtime-stories/daily-words/{childId}
            **GET** /api/v1/bedtime-stories/list/{childId}?limit=20
            Shows: list of past generated stories`"]

            ST_GEN_BTN["`Button: **生成故事** (Generate Story)
            Tapping shows loading spinner`"]

            ST_GEN_API["`**POST** /api/v1/bedtime-stories/generate
            Body: { child_id,
            words: [...today's words] }
            ⏳ Takes 10–30 seconds (Ollama LLM)`"]

            ST_GEN_OK["`201 Created — Story in response:
            { title, content_cantonese,
            audio_url, reading_time_minutes }
            → New story card added at top of list`"]

            ST_GEN_FAIL["`400 Error:
            'No words learned today'
            or AI generation failed
            → Show error message`"]

            ST_LOAD --> ST_GEN_BTN --> ST_GEN_API
            ST_GEN_API -->|Success| ST_GEN_OK
            ST_GEN_API -->|Fail| ST_GEN_FAIL

            ST_LIST["`**Story List**
            Shows: title, reading time, completion badge`"]

            ST_LIST -->|"Tap ▶ Play audio"| ST_AUDIO
            ST_AUDIO["`Play story audio from
            story.audio_url`"]

            ST_LIST -->|"Tap 📖 Read"| ST_READ
            ST_READ["`**GET** /api/v1/bedtime-stories/{childId}/{storyId}
            → Fetch full story content`"]
            ST_READ --> STORY_READER

            STORY_READER["`**BedtimeStoryReader Modal**
            Full-screen immersive view:
            Bilingual text (Cantonese + English)
            Scroll through story pages
            Audio playback control
            Close button → back to list`"]
        end

        %% ── COMMUNITY TAB ─────────────────────────
        C_NAV -->|"Tap 社區 (Community)"| COMM_TAB
        subgraph COMM_TAB["👥 Community Tab (社區)"]
            COMM_SUBTABS["`Two sub-tabs`"]

            COMM_SUBTABS -->|"Tap 我的相片 (My Photos)"| MY_WORDS
            MY_WORDS["`**My Captured Words**
            **GET** /api/v1/vocabulary/captured/{childId}?limit=50
            Shows: camera-captured word cards
            (images taken from mobile app)`"]

            COMM_SUBTABS -->|"Tap 社區詞彙 (Community)"| SHARED_WORDS
            SHARED_WORDS["`**Community Vocabulary**
            **GET** /api/v1/vocabulary/community?limit=50
            Shows: anonymized word cards
            shared by other children
            (child_id stripped for privacy)`"]
        end

        %% ── COMING SOON TABS ──────────────────────
        C_NAV -->|"Tap 獎勵 (Rewards)"| REWARDS_SOON
        REWARDS_SOON["`**Coming Soon 🚧**
        '即將推出！'
        Placeholder with construction icon`"]

        C_NAV -->|"Tap 我的 (Profile)"| PROFILE_SOON
        PROFILE_SOON["`**Coming Soon 🚧**
        '即將推出！'
        Placeholder with construction icon`"]

        %% ── PAGE EXIT ─────────────────────────────
        C_EXIT["`**Page Unload / Cleanup**
        **PATCH** /api/v1/progress/session/{sessionId}
        Body: { end_time, words_encountered: [],
        activities_completed: [],
        engagement_level: 'medium' }
        → Session closed in DB`"]

        C_PARENT_BTN["`Button: **家長中心** (Parent Center)
        → router.push('/parent')`"]
        C_PARENT_BTN --> PARENT_DASHBOARD
        C_PARENT_BTN --> C_EXIT

        C_LOGOUT["`Button: **Logout**
        → clearAuthToken()
        → window.location = '/login'`"]
        C_LOGOUT --> LOGIN_PAGE
    end

    %% ─────────────────────────────────────────────
    %% MOBILE APP INTEGRATION (External)
    %% ─────────────────────────────────────────────
    subgraph MOBILE["📱 Mobile App Integration (External)"]
        MOB_CAPTURE["`Mobile app captures object via camera
        Runs object detection (YOLO / Gemini API)
        Identified word in Cantonese`"]

        MOB_UPLOAD["`**POST** /api/v1/vocabulary/external/word-learned
        multipart/form-data:
        { word, child_id, timestamp, source,
        confidence, image (file), metadata }
        → No auth required
        ⏳ Async AI enhancement scheduled`"]

        MOB_OK["`Response: { xp_awarded, level_up,
        total_xp, exposure_count }
        → Shown to child in mobile UI`"]

        MOB_CAPTURE --> MOB_UPLOAD --> MOB_OK
        MOB_OK -.->|"Word appears in"| MY_WORDS
    end

    %% ─────────────────────────────────────────────
    %% CROSS-PAGE NAVIGATION SUMMARY
    %% ─────────────────────────────────────────────
    P_HEADER_CHILD -.->|"Switch to child mode"| CHILD_DASHBOARD
    C_PARENT_BTN -.->|"Switch to parent mode"| PARENT_DASHBOARD
    P_CREATE_BTN -.->|"No children yet"| CREATE_CHILD_PAGE
    CC_OK -.->|"After child created"| PARENT_DASHBOARD

    %% ─────────────────────────────────────────────
    %% STYLING
    %% ─────────────────────────────────────────────
    classDef page fill:#dbeafe,stroke:#3b82f6,stroke-width:2px,color:#1e3a8a
    classDef api fill:#dcfce7,stroke:#22c55e,stroke-width:1.5px,color:#14532d
    classDef action fill:#fef9c3,stroke:#eab308,stroke-width:1.5px,color:#713f12
    classDef error fill:#fee2e2,stroke:#ef4444,stroke-width:1.5px,color:#7f1d1d
    classDef modal fill:#f3e8ff,stroke:#a855f7,stroke-width:1.5px,color:#581c87
    classDef coming fill:#f1f5f9,stroke:#94a3b8,stroke-width:1px,color:#475569

    class LOGIN_PAGE,REGISTER_PAGE,PARENT_DASHBOARD,CHILD_DASHBOARD,CREATE_CHILD_PAGE page
    class LOGIN_API,REGISTER_API,CONSENT_API,CC_API,VERIFY_USER,MARK_READ,DISMISS_INS,EDIT_CHILD,DEL_CHILD,Q_END,WB_END,SPK_END,ST_GEN_API,ST_READ,MOB_UPLOAD api
    class LOGIN_BTN,REGISTER_BTN,CC_SUBMIT,ST_GEN_BTN,H_WORD_CLICK action
    class LOGIN_FAIL,REGISTER_FAIL,CC_FAIL,ST_GEN_FAIL error
    class WORD_MODAL,STORY_READER,PRIVACY_MODAL modal
    class REWARDS_SOON,PROFILE_SOON coming
```

---

## Quick Reference: API Endpoints by Flow

| User Action | HTTP Method | Endpoint | Auth |
|---|---|---|---|
| Register parent | POST | `/api/v1/auth/register` | ❌ |
| Login parent | POST | `/api/v1/auth/login` | ❌ |
| Verify session | GET | `/api/v1/users/me` | ✅ |
| Submit consent | PATCH | `/api/v1/users/me/consent` | ✅ |
| Create child | POST | `/api/v1/children/` | ✅ |
| List children | GET | `/api/v1/children/` | ✅ |
| Get child profile | GET | `/api/v1/children/{id}` | ✅ |
| Update child | PATCH | `/api/v1/children/{id}` | ✅ |
| Delete child | DELETE | `/api/v1/children/{id}` | ✅ |
| Dashboard summary | GET | `/api/v1/parent-dashboard/{id}/summary` | ✅ |
| Progress stats | GET | `/api/v1/progress/{id}/stats` | ✅ |
| Analytics charts | GET | `/api/v1/parent-dashboard/{id}/charts` | ✅ |
| Daily missions | GET | `/api/v1/missions/daily/{id}` | ✅ |
| Offline missions | GET | `/api/v1/missions/offline/{id}` | ✅ |
| Learning insights | GET | `/api/v1/parent-dashboard/{id}/insights` | ✅ |
| Mark insight read | PATCH | `/api/v1/parent-dashboard/{id}/insights/{insightId}` | ✅ |
| List categories | GET | `/api/v1/categories/` | ✅ |
| Get vocabulary | GET | `/api/v1/vocabulary/` | ✅ |
| Get daily words | GET | `/api/v1/bedtime-stories/daily-words/{id}` | ✅ |
| Update word progress | POST | `/api/v1/vocabulary/{wordId}/progress/{childId}` | ✅ |
| Start game session | GET | `/api/v1/games/` | ✅ |
| Record game result | POST | `/api/v1/games/{gameId}/play` | ✅ |
| Generate AI story | POST | `/api/v1/bedtime-stories/generate` | ✅ |
| List stories | GET | `/api/v1/bedtime-stories/list/{id}` | ✅ |
| Read full story | GET | `/api/v1/bedtime-stories/{id}/{storyId}` | ✅ |
| My captured words | GET | `/api/v1/vocabulary/captured/{id}` | ✅ |
| Community words | GET | `/api/v1/vocabulary/community` | ✅ |
| Start learning session | POST | `/api/v1/progress/session` | ✅ |
| End learning session | PATCH | `/api/v1/progress/session/{sessionId}` | ✅ |
| Mobile word capture | POST | `/api/v1/vocabulary/external/word-learned` | ❌ |
