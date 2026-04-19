# My Contribution Summary — Role #4: Design & UX Refinement Lead

**Team Member:** #4 — Design System Owner & UI Polish Lead
**Primary Focus:** Website Component Finalization, Visual Identity, & UX Research
**Current Date:** 11 April 2026 | **Project Deadline:** 30 June 2026

---

## My Role on the Team

My responsibility is to bridge the gap between Member #1 structural architecture and the final polished user experience. While Member #1 builds the routes and data plumbing, I own the **visual identity**, **interaction quality**, and **UX research** that makes the product feel credible and learnable for families.

Core areas:
- **Website Component Finalization** — Ensuring every component on the site has consistent padding, shadow depth, hover states, and focus rings.
- **Visual Identity** — Zen Maru Gothic typography, the "Cozy" colour palette, and category-colour psychology.
- **UX Research** — Auditing TTS voice quality, story coherence, and interaction friction through structured evaluation methods.

---

## 10-Milestone Overview

| # | Milestone | Deadline | Status | My Design & UX Focus |
|---|-----------|----------|--------|----------------------|
| 1 | Scope & User Stories | 31 Mar | ✅ Completed | Persona development, 3-Tap Rule, UX requirements |
| 2 | Research & Planning | 07 Apr | ✅ Completed | Design system foundations, colour tokens, competitor audit |
| 3 | Model Evaluation UX | 21 Apr | 🔄 **In Progress** | TTS naturalness audit, story coherence research |
| 4 | Interactive Prototypes | 28 Apr | 🔄 **In Progress** | Figma prototyping, website component finalization |
| 5 | Integration & API UI | 05 May | ⬜ Upcoming | Skeleton loader design, error state UX |
| 6 | Learning Module UX | 19 May | ⬜ Upcoming | Shutter animation, word-card reveal polish |
| 7 | Revision Flow UX | 02 Jun | ⬜ Upcoming | Leitner Box visual metaphor for spaced repetition |
| 8 | Dashboard Analytics | 09 Jun | ⬜ Upcoming | Recharts skinning, final component polish |
| 9 | Story Reader Flow | 16 Jun | ⬜ Upcoming | Bedtime Mode immersive UI, sync-highlight UX |
| 10 | Refinement & Demo | 30 Jun | ⬜ Upcoming | WCAG AA audit, UI/UX final report |

---

## 🎤 Milestone 1: UX Scoping, Strategy & Persona Design
**Status:** ✅ Completed (31 March 2026) | **Sharing Duration:** ~5 Minutes

### 1. Problem Space Definition (2 min)
- **Challenge:** Researching the "Friction Gap" in heritage language learning. Most diaspora families give up because existing apps feel too much like school or too much like a game.
- **Core Strategy:** Established the **"Cozy Learning"** philosophy—focusing on warmth, safety, and parent-child bonding rather than "streaks" and "leaderboards."

### 2. User Persona Development (2 min)
- **The Parent (The Facilitator):** Motivated by emotional connection and "glanceable" progress.
- **The Child (The Explorer):** Motivated by auditory rewards and collection mechanics.
- **Constraint Research:** Conducted an audit of 3-8 year old cognitive loads, leading to the **"3-Tap Rule"**.

### 3. Success Metrics (1 min)
- **Bilingual Text Hierarchy:** Researched optimal font ratios for Cantonese vs. English subtitles.
- **Outcome:** A set of 12 validated user stories focusing on the child discovery and parent pride.

---

## 🎤 Milestone 2: UI/UX Research & Design System Foundations
**Status:** ✅ Completed (07 April 2026) | **Sharing Duration:** ~5 Minutes

### 1. Competitive UX Audit (1.5 min)
- **Benchmarks:** Audited Duolingo, ClassDojo, and Seesaw.
- **Findings:** Identified "Gamification Fatigue." Pivoted away from aggressive neon colors toward "warm-neutral."
- **Privacy Design:** Researched COPPA standards, resulting in the **"Anonymized Share Card"** spec.

### 2. The "Cozy" Design System (2 min)
- **Typography Selection:** Chose **Zen Maru Gothic** for its rounded, calming feel.
- **Color Psychology:** Defined 10+ category colors in `lib/category-colors.ts` for visual association.

### 3. Website Architecture Specs (1.5 min)
- **Elevation Model:** Defined shadow/spacing tokens for the [Navigation Component](components/parent/navigation.tsx).
- **UI Consistency:** Created a "Look and Feel" guide for Member #1.

---

## 🎤 Milestone 3: Model Evaluation Research (TTS & AI Story)
**Status:** 🔄 In Progress (21 April 2026) | **Sharing Duration:** ~5 Minutes

### 1. Cantonese TTS Naturalness Audit (2 min)
- **The Stakes:** Cantonese is a 9-tone language. Pitch matters.
- **Methodology:** Using a structured **Mean Opinion Score (MOS)** framework to rate gTTS vs. system voices.

### 2. AI Story Coherence & "Dialogic Reading" (2 min)
- **Research Goal:** Evaluating if AI stories follow the **PEER framework**.
- **Action:** Auditing generated stories to ensure they invite parent-child conversation.
- **UI Hook:** Designing the "Reading Guide" overlay for conversation prompts.

### 3. Qualitative Milestone Progress (1 min)
- **Status Update:** 60% through the MOS audit.

---

## 🎤 Milestone 4: High-Fidelity Prototyping & Website Finalization
**Status:** 🔄 In Progress (28 April 2026) | **Sharing Duration:** ~5 Minutes

### 1. Website Component Finalization (2 min)
- **UI Polish:** Walking through all 6 Parent Dashboard tabs.
- **Interactions:** Verifying hover states and WCAG-compliant focus rings.
- **Spacing Audit:** Removing "pixel drift" to standardize padding.

### 2. Community & Sharing UX (2 min)
- **The Achievement Card:** Designing a "Polaroid" layout for `html2canvas` exports.
- **Privacy Flow:** Finalizing the "First-Launch Consent" modal.

### 3. Breakpoint Strategy (1 min)
- **Testing:** Ensuring pill-navigation works across all screen sizes.

---

## 🎤 Milestones 5-10: Future Roadmap & Polish
**Status:** ⬜ Upcoming

- **Milestone 5 (05 May):** Designing Skeleton Loaders and error states.
- **Milestone 7 (02 Jun):** Creating the Leitner Box visual metaphor.
- **Milestone 8 (09 Jun):** Skinning Recharts for an "encouraging" feel.
- **Milestone 10 (30 Jun):** Final WCAG AA Audit and project report.

---

## Key Design Decisions Log

| Decision | Rationale | Milestone |
|----------|-----------|-----------|
| Zen Maru Gothic | Rounded letterforms lower learner anxiety | M2 |
| 3-Tap Rule | Simplified navigation for kids | M1 |
| Privacy-Safe Card | Protects child identity | M2 |
| MOS Evaluation | Subjective quality matters for Cantonese | M3 |
| PEER Framework | Aligns stories with proven pedagogical methods | M3 |
