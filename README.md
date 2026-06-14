# Preschool Vocabulary Learning Platform

## 🎯 Overview

A comprehensive, research-based vocabulary learning platform designed specifically for preschool children (ages 3-5). Built on proven learning science principles to maximize vocabulary acquisition through meaningful interactions, repeated exposure, and multisensory engagement.

## 🧠 Research-Based Learning Principles

This platform is built on established research in early childhood vocabulary development:

### Core Learning Principles

1. **Conversational Turns (Two-Way Interaction)**
   - Children learn best through active participation, not passive listening
   - Dialogic reading with pause-and-ask questions
   - Parent-child conversation prompts

2. **Repeated Exposure (6-12 Encounters)**
   - Research shows children need 6-12 exposures to internalize new words
   - Exposure tracking system monitors each word encounter
   - Adaptive algorithm ensures optimal repetition

3. **Contextual Learning**
   - Words presented in meaningful stories and real-life situations
   - Multiple contexts for each word (e.g., "apple" at breakfast, store, story)
   - Offline missions connect digital learning to daily routines

4. **Multisensory Engagement**
   - Visual: Colorful images, icons, and animations
   - Auditory: Speech synthesis with adjustable speed
   - Kinesthetic: Physical actions and gestures for each word
   - Combined approach proven to double retention rates

## ✨ Key Features

### For Children

#### 1. Interactive Dialogic Story Reader

- **Pause-and-ask questions** during stories
- **Open-ended, recall, prediction, and connection** prompts
- **Physical action cues** integrated into narratives
- Auto-play with voice synthesis
- Progress tracking through story pages

#### 2. Kinesthetic Learning Games

**Act It Out (Charades)**

- Children perform physical actions for each word
- Encourages parent participation
- Links words to body movements for deeper encoding

**Move & Learn**

- Movement-based word practice
- Gesture vocabulary for motor memory

**Word Hunt (Scavenger Hunt)**

- Real-world object finding
- Bridges digital and physical learning
- Requires active exploration

#### 3. Traditional Learning Activities

- Word matching games
- "I Spy" visual search
- Pronunciation practice with speech feedback
- Category-based exploration

#### 4. Word of the Day

- Daily featured vocabulary
- Multiple exposures across activities
- Progress tracking

### For Parents/Teachers

#### 1. Offline Missions System

Real-world conversation prompts for:

- **Mealtime** conversations
- **Bedtime** routines
- **Shopping** trips
- **Outdoor** exploration
- **Playtime** activities

Each mission includes:

- Target words to practice
- Context-specific conversation starters
- Completion tracking
- Parent notes

#### 2. Learning Insights Dashboard

**Active vs Passive Vocabulary Tracking**

- Words child can use confidently (expressive)
- Words child recognizes (receptive)
- Research-based distinction

**Exposure Analytics**

- Tracks 6-12 exposure benchmark
- Identifies words needing more practice
- Visual progress indicators

**Personalized Recommendations**

- Adaptive learning algorithm suggests next activities
- Based on learning style, interests, and progress
- Time-optimized sessions

#### 3. Learning Style Profiles

- **Kinesthetic**: Movement-based activities
- **Visual**: Image and color-focused
- **Auditory**: Sound and speech emphasis
- **Mixed**: Balanced approach

Activity recommendations adapt to detected learning style.

#### 4. Engagement Analytics

- Session duration tracking
- Active participation metrics
- Engagement level indicators
- Multi-sensory activity tracking

## 🔧 Technical Implementation

### Technology Stack

- **Framework**: Next.js 16 (React)
- **Styling**: Tailwind CSS with custom preschool-friendly design tokens
- **Speech**: Web Speech API with custom synthesis service
- **State Management**: React hooks
- **TypeScript**: Full type safety

### Key Components

#### Data Models (`lib/types.ts`)

```typescript
- Word: Enhanced with physical actions, contexts, related words
- ChildProfile: Learning style, attention span, preferences
- Story: Dialogic prompts, physical actions
- OfflineMission: Real-world conversation prompts
- LearningSession: Tracks active vs passive engagement
```

#### Adaptive Learning Engine (`lib/adaptive-learning.ts`)

- Word prioritization algorithm
- Activity recommendation system
- Engagement analysis
- Level-up detection
- Parent insights generation

#### Speech Service (`lib/speech.ts`)

- Cross-browser compatibility (Chrome, Safari, Edge)
- Synchronous execution for user gesture compliance
- Voice preference system
- Error handling and logging

### Speech Synthesis Fix

**Problem**: Chrome requires synchronous `speechSynthesis.speak()` calls within user gesture context.

**Solution**: Removed async/await to maintain direct connection to click events, enabling speech to work reliably across all browsers.

## 📊 Research Evidence

### Vocabulary Acquisition

- **6-12 exposures** needed for retention (Hart & Risley, 1995)
- **Dialogic reading** increases vocabulary 3x vs. regular reading (Whitehurst et al., 1988)
- **Parent-child conversations** most powerful learning tool (Hirsh-Pasek et al., 2015)

### Multisensory Learning

- **Motor actions** paired with words double recall (Engelkamp & Zimmer, 1994)
- **Gesture** enhances word learning in young children (Goldin-Meadow, 2014)
- **Contextual variation** improves generalization (Nagy & Scott, 2000)

### Active Learning

- **Conversational turns** predict vocabulary growth (Gilkerson et al., 2017)
- **Active production** crucial for word learning (Swingley, 2007)
- **Play-based learning** superior to passive methods (Hirsh-Pasek et al., 2009)

## 🚀 Getting Started

### Start Commands

Frontend:

```bash
cd /Users/karen/MCSCaptsoneProject-frontend
npm install
npm run dev
```

Backend (run in a second terminal):

```bash
cd /Users/karen/MCSCaptsoneProject-backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Open: http://localhost:3000

### Installation

```bash
npm install
npm run dev
```

### Environment

Copy `.env.example` to `.env.local` and fill in the image provider credentials you want to use.

Local `next dev` now defaults to standard Next.js behavior. If you want binding-backed
Cloudflare dev mode locally, set `OPENNEXT_ENABLE_CLOUDFLARE_DEV=1` in `.env.local`.
Leave it unset for normal local page testing such as `/test-images`.

For local `/test-images` usage with `google/nano-banana-2`, you can also set
`CLOUDFLARE_PREVIEW_WORKER_URL` to a deployed preview worker URL. In standard
`next dev`, the route will proxy test-mode Nano Banana requests there so the UI
can show the binding-backed image without requiring the Cloudflare dev proxy.

For Cloudflare AI binding with gateway tracking on Nano Banana 2, the route now
prefers `env.AI.run("google/nano-banana-2", ..., { gateway: { id } })` whenever
the app is running through the OpenNext Cloudflare adapter.

Set at least:

```bash
CLOUDFLARE_AI_GATEWAY_ID=default
GEMINI_IMAGE_MODEL=gemini-2.5-flash-image
```

`wrangler.jsonc` in the repo already declares an `AI` binding for Workers. Before
deploying, update the Worker `name` there if you want a different Cloudflare
Worker name than the checked-in default.

If you want to test the binding-backed path locally in a Cloudflare runtime,
copy `.dev.vars.example` to `.dev.vars` and use:

```bash
pnpm preview
```

For a live Cloudflare verification without deploying over the main Worker name,
use the isolated preview environment:

```bash
pnpm deploy:preview
```

This deploys the built `.open-next/worker.js` directly with Wrangler. In this
repo that path avoids the OpenNext remote proxy step that was failing against
Cloudflare's `workers/subdomain/edge-preview` API.

The deploy scripts prefer `CLOUDFLARE_DEPLOY_API_TOKEN` when it is set and fall
back to `CLOUDFLARE_API_TOKEN` otherwise. The deploy token must include at least
`Workers Scripts Edit` on the target Cloudflare account.

Those scripts now source `.env.local` immediately before invoking Wrangler, so a
`CLOUDFLARE_DEPLOY_API_TOKEN` stored there will be picked up for deploy and
preview commands.

For Gemini through Cloudflare AI Gateway, set:

```bash
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_AI_API_TOKEN=your_cloudflare_ai_runtime_token
CLOUDFLARE_AI_GATEWAY_ID=your_gateway_name_or_id
# or CLOUDFLARE_AI_GATEWAY_NAME=your_gateway_name
CLOUDFLARE_AI_GATEWAY_TOKEN=your_ai_gateway_token
GEMINI_IMAGE_MODEL=gemini-2.5-flash-image
```

If your Google AI Studio key is not stored inside AI Gateway, also set `GEMINI_API_KEY` in `.env.local` and the app will forward it through the gateway.

`CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_AI_API_TOKEN` are used for the older
HTTP-based Cloudflare model calls and as a fallback when the AI binding is not
available. The route still accepts `CLOUDFLARE_API_TOKEN` for backward
compatibility, but that name is better reserved for Wrangler deploy auth.

### Access Points

- **Child Mode**: http://localhost:3000
- **Parent Dashboard**: http://localhost:3000/parent
- **Speech Test**: http://localhost:3000/test-speech

## 🎨 Design Philosophy

### UI/UX for Non-Readers

- **Large touch targets** (minimum 44px)
- **Icon-first navigation** with consistent symbols
- **Bright, engaging colors** with semantic meaning
- **Minimal text** for pre-readers
- **Clear visual feedback** for all interactions
- **Emoji and illustrations** for comprehension

### Age-Appropriate Interactions

- **Simple gestures** (tap, swipe)
- **Immediate feedback** (sounds, animations)
- **Short attention spans** (10-15 minute sessions)
- **Celebration moments** (stars, achievements)
- **No penalties** for mistakes

## 📱 Parent Engagement Features

### Joint Engagement Prompts

- Screen time activities suggest offline extensions
- "Missions" for daily routine integration
- Conversation starters for each word
- Tips for maximizing learning moments

### Progress Transparency

- Clear visualization of learning metrics
- Research explanations for features
- Actionable insights and recommendations
- Celebration of milestones

## 🔄 Adaptive Learning Flow

1. **Assessment**: Track exposures, mastery, engagement
2. **Analysis**: Calculate word priority, detect learning style
3. **Recommendation**: Suggest next words and activities
4. **Delivery**: Present personalized content
5. **Feedback**: Monitor engagement and adjust

## 📈 Future Enhancements

- [ ] Voice recording for pronunciation assessment
- [ ] Peer learning (sibling/classmate interactions)
- [ ] Augmented reality word hunts
- [ ] Parent-teacher communication portal
- [ ] Multilingual support
- [ ] Advanced analytics dashboard
- [ ] Custom word lists
- [ ] Integration with school curricula

## 🤝 Contributing

This platform embodies research-based best practices in early childhood education. Contributions should maintain these evidence-based principles.

## 📚 References

- Hart, B., & Risley, T. R. (1995). _Meaningful differences in the everyday experience of young American children_
- Whitehurst, G. J., et al. (1988). Accelerating language development through picture book reading
- Hirsh-Pasek, K., et al. (2015). Putting education in educational apps
- Engelkamp, J., & Zimmer, H. D. (1994). Motor similarity in subject-performed tasks
- Gilkerson, J., et al. (2017). Mapping the early language environment
- Goldin-Meadow, S. (2014). How gesture works to change our minds
- Swingley, D. (2007). Lexical exposure and word-form encoding in 1.5-year-olds

## 📄 License

MIT License - See LICENSE file for details

---

**Built with ❤️ for young learners and their families**
