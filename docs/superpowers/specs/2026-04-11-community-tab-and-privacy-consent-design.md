# Design Spec: Community Tab (Child Mode) + Privacy Consent Modal
**Date:** 11 April 2026  
**Author:** Team Member #4 — UI/UX & Community Design Lead  
**Status:** Approved — ready for implementation

---

## 1. Overview

Two new features:

1. **Privacy Consent Modal** — shown once to a parent on first login, before they reach the parent dashboard. Collects explicit consent for camera, microphone, community photo sharing, and analytics. Stored in the database; never shown again after acknowledgement.

2. **Community Tab** — a new bottom-nav tab in child mode (`社區`) with two sub-tabs:
   - **我的相片 (My Photos)** — the child's own camera-captured word photos, loaded from the DB.
   - **社區 (Community)** — anonymised word-photo cards from other children whose parents opted in to community sharing.

All text is Cantonese-primary. No hardcoded vocabulary data — everything comes from the database via API.

---

## 2. Database Changes (Backend)

### 2a. Migration: Add consent fields to `users` table

New Alembic migration file: `alembic/versions/<hash>_add_consent_fields_to_users.py`

```python
op.add_column('users', sa.Column('consent_given', sa.Boolean(), nullable=False, server_default='false'))
op.add_column('users', sa.Column('consent_given_at', sa.DateTime(timezone=True), nullable=True))
op.add_column('users', sa.Column('consent_camera', sa.Boolean(), nullable=False, server_default='true'))
op.add_column('users', sa.Column('consent_microphone', sa.Boolean(), nullable=False, server_default='true'))
op.add_column('users', sa.Column('consent_analytics', sa.Boolean(), nullable=False, server_default='true'))
```

> `consent_community_sharing` is intentionally on `Child` (not `User`) — it's a per-child opt-in.

### 2b. Migration: Add community_sharing_enabled to `children` table

New Alembic migration file: `alembic/versions/<hash>_add_community_sharing_to_children.py`

```python
op.add_column('children', sa.Column('community_sharing_enabled', sa.Boolean(), nullable=False, server_default='false'))
```

---

## 3. Backend: Model Changes

### `app/models/user.py` — `User` model

Add columns:
```python
consent_given = Column(Boolean, default=False)
consent_given_at = Column(DateTime(timezone=True), nullable=True)
consent_camera = Column(Boolean, default=True)
consent_microphone = Column(Boolean, default=True)
consent_analytics = Column(Boolean, default=True)
```

### `app/models/user.py` — `Child` model

Add column:
```python
community_sharing_enabled = Column(Boolean, default=False)
```

---

## 4. Backend: Schema Changes

### `app/schemas/user.py`

Add to `UserResponse`:
```python
consent_given: bool = False
consent_given_at: Optional[datetime] = None
consent_camera: bool = True
consent_microphone: bool = True
consent_analytics: bool = True
```

Add new request schema:
```python
class ConsentUpdate(BaseModel):
    consent_camera: bool
    consent_microphone: bool
    consent_community_sharing: bool   # maps to Child.community_sharing_enabled
    consent_analytics: bool
```

Add to `ChildUpdate` (already exists):
```python
community_sharing_enabled: Optional[bool] = None
```

Add to `ChildResponse`:
```python
community_sharing_enabled: bool = False
```

---

## 5. Backend: New Endpoints

### 5a. `PATCH /api/v1/users/me/consent`

**File:** `app/api/endpoints/users.py`  
**Auth:** Required (JWT)

- Receives `ConsentUpdate` body
- Sets `user.consent_given = True`, `user.consent_given_at = datetime.utcnow()` plus individual consent booleans
- Also sets `child.community_sharing_enabled = consent_community_sharing` for **all children** of this user
- Returns updated `UserResponse`

```python
@router.patch("/me/consent", response_model=UserResponse)
async def update_consent(
    consent: ConsentUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    ...
```

### 5b. `GET /api/v1/vocabulary/community`

**File:** `app/api/endpoints/vocabulary.py`  
**Auth:** Required (JWT)  
**Query params:** `limit: int = 50` (max 200)

- Returns words where `created_by_child_id IS NOT NULL` AND the owning child has `community_sharing_enabled = True`
- Joins `Word` → `Child` to filter on consent
- Response shape: same `WordResponse` schema BUT strips child-identifying fields before returning:
  - Included: `id`, `word`, `word_cantonese`, `jyutping`, `category`, `category_name_cantonese`, `image_url`, `audio_url`, `difficulty`
  - Excluded / nulled-out: `created_by_child_id`
- Orders by `created_at DESC`

```python
@router.get("/community", response_model=List[WordResponse])
async def get_community_words(
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    ...
```

Register the router: already included via `vocabulary.router` — no `__init__.py` change needed.

---

## 6. Frontend: API Client Modules

### 6a. New function in `lib/api/vocabulary.ts`

```ts
export interface CommunityWordResponse {
  id: string;
  word: string;
  word_cantonese?: string;
  jyutping?: string;
  category: string;
  category_name_cantonese?: string;
  image_url?: string;
  audio_url?: string;
  difficulty: "easy" | "medium" | "hard";
}

export async function getCommunityWords(limit = 50): Promise<CommunityWordResponse[]> {
  return apiRequest<CommunityWordResponse[]>(`/vocabulary/community?limit=${limit}`);
}

export async function getChildCapturedWords(
  childId: string,
  limit = 50,
): Promise<WordResponse[]> {
  return apiRequest<WordResponse[]>(
    `/vocabulary/external/captured/${childId}?limit=${limit}`,
  );
}
```

### 6b. New function in `lib/api/children.ts`

```ts
export async function updateChildCommunitySharing(
  childId: string,
  enabled: boolean,
): Promise<ChildResponse> {
  return updateChild(childId, { community_sharing_enabled: enabled });
}
```

`ChildCreateRequest` needs one new optional field:
```ts
community_sharing_enabled?: boolean;
```

`ChildResponse` needs one new field:
```ts
community_sharing_enabled?: boolean;
```

### 6c. New file: `lib/api/consent.ts`

```ts
import { apiRequest } from "./client";
import type { UserResponse } from "./auth";

export interface ConsentPayload {
  consent_camera: boolean;
  consent_microphone: boolean;
  consent_community_sharing: boolean;
  consent_analytics: boolean;
}

export async function submitConsent(payload: ConsentPayload): Promise<UserResponse> {
  return apiRequest<UserResponse>("/users/me/consent", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
```

---

## 7. Frontend: Privacy Consent Modal

### File: `components/modals/privacy-consent-modal.tsx`

**Props:**
```ts
interface PrivacyConsentModalProps {
  open: boolean;
  onAccept: () => void;   // called after successful API save
}
```

**Visual style:** Matches existing modals — full-screen overlay, `bg-black/50` backdrop, white rounded card (`rounded-[40px]`), large Cantonese heading, shadcn `Switch` components.

**Layout:**
```
┌─────────────────────────────────────────┐
│  🔒                                      │
│  私隱聲明                                │
│  (Privacy Statement)                    │
│  ─────────────────────────────────────  │
│  我們使用以下功能幫助小朋友學習廣東話。    │
│  請選擇您同意的項目：                    │
│                                         │
│  📷 相機使用           [  ●  ] ON       │  ← mandatory, cannot be disabled
│  使用相機拍攝物件以學習詞語              │
│                                         │
│  🎤 麥克風              [  ●  ] ON      │  ← toggleable
│  錄音以練習廣東話發音                   │
│                                         │
│  👥 社區相片分享        [    ] OFF      │  ← default OFF
│  讓其他小朋友睇到您孩子嘅相片            │
│                                         │
│  📊 學習數據收集        [  ●  ] ON      │  ← toggleable
│  記錄學習進度以提供建議                  │
│                                         │
│  我們絕不分享個人資料。詳情請參閱私隱政策 │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │       同意並繼續 ✓              │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

**Behaviour:**
- Not dismissible by clicking backdrop or pressing Escape
- Camera toggle is always `checked={true}` and `disabled={true}` — camera is required for core app function
- Submit button calls `submitConsent(payload)` from `lib/api/consent.ts`
- On success → calls `onAccept()` → parent dismisses and navigates to dashboard
- On API error → shows toast error, modal stays open; parent can retry

**Integration point:** `lib/auth-context.tsx` already exposes `user` — check `user.consent_given === false` after login to show modal. Logic lives in [app/parent/page.tsx](app/parent/page.tsx).

---

## 8. Frontend: Community Tab Component

### File: `components/child/community-tab.tsx`

**Props:**
```ts
interface CommunityTabProps {
  childId: string;
  childCommunityEnabled: boolean;  // from profile.community_sharing_enabled
}
```

**Sub-tabs:** Internal state `activeSubTab: "my-photos" | "community"`, rendered as two pill buttons at the top.

**My Photos sub-tab (`我的相片`):**
- Fetches `getChildCapturedWords(childId)` on mount
- Renders photo-word cards in a 2-column grid
- Each card: photo thumbnail (rounded-2xl, aspect-square, object-cover), large Cantonese word below, jyutping in smaller text, audio button (same `useWordAudio` pattern as existing word cards)
- Loading state: 4 skeleton cards
- Empty state: `"📷 未有相片！喺學習頁面用相機影下物件，即可學廣東話！"`

**Community sub-tab (`社區`):**
- **If `childCommunityEnabled === false`:** Shows locked state card:
  - Lock emoji + message: `"🔒 社區分享未開啟"` / `"請家長在設定中開啟社區相片分享"`
  - Link button → `/parent?tab=settings` (opens parent dashboard settings tab)
- **If `childCommunityEnabled === true`:** Fetches `getCommunityWords()` on mount
  - Same 2-column photo-word card grid as My Photos
  - Each card: thumbnail, Cantonese word, jyutping, audio button — no child name shown anywhere
  - Loading: 4 skeleton cards
  - Empty state: `"🌱 社區暫時未有分享。等其他小朋友加入後再睇！"`

**Audio:** Reuse `useWordAudio` hook (already in `hooks/use-word-audio.ts`) — pass word's `audio_url`.

---

## 9. Frontend: Child Navigation Update

### File: `components/child/navigation.tsx`

Add one entry to `navItems` array. The nav currently has 6 items; adding a 7th makes it tight on small screens. Use the same floating island style — items will auto-shrink via `w-full`.

```ts
{
  id: "community",
  icon: Users,          // from lucide-react — already imported in child/page.tsx
  label: "社區",
  activeBg: "bg-teal-400",
  activeText: "text-teal-600",
},
```

Add `import { Users } from "lucide-react"` to navigation.tsx.

---

## 10. Frontend: Child Dashboard Wiring

### File: `app/child/page.tsx`

1. Import `CommunityTab` component
2. Add `activeTab === "community"` section in main content area:
```tsx
{activeTab === "community" && profile && (
  <CommunityTab
    childId={profile.id}
    childCommunityEnabled={profile.communityEnabled ?? false}
  />
)}
```
3. Add `communityEnabled` field to `ChildProfile` type in `lib/types.ts` (maps from `community_sharing_enabled` in DB)
4. Update `toChildProfile()` in `lib/api/children.ts` to map the new field

---

## 11. Frontend: Parent Settings — Community Toggle

### File: `components/parent/settings-tab.tsx`

Add one new toggle row in the settings card, below the existing "Push notification" toggle:

```tsx
<div className="flex items-center justify-between py-3 border-b border-slate-100">
  <div className="space-y-0.5">
    <Label className="text-slate-700 font-bold">👥 社區相片分享</Label>
    <p className="text-xs text-slate-400">允許其他小朋友睇到相片詞卡</p>
  </div>
  <Switch
    checked={communitySharing}
    onCheckedChange={(val) => void handleCommunitySharingToggle(val)}
  />
</div>
```

The `handleCommunitySharingToggle` function calls `updateChildCommunitySharing(profile.id, enabled)` from `lib/api/children.ts`. Shows a success toast on save using the existing `useToast` pattern.

---

## 12. Frontend: Auth Context — Consent Check

### File: `lib/auth-context.tsx`

Add `consent_given` field to the `User` interface:
```ts
interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  consent_given: boolean;   // NEW
}
```

Map from `getCurrentUser()` API response (already returns `UserResponse` — just needs field added to the local `User` shape).

---

## 13. Frontend: Parent Dashboard — Consent Gate

### File: `app/parent/page.tsx`

After successful login, if `user.consent_given === false`:
- Render `<PrivacyConsentModal open={true} onAccept={() => setConsentGiven(true)} />` 
- Keep behind a `consentGiven` local state (derived from `user.consent_given`)
- Once accepted, render the normal dashboard

---

## 14. Types Update

### File: `lib/types.ts`

Add `communityEnabled` to `ChildProfile`:
```ts
export interface ChildProfile {
  // ...existing fields...
  communityEnabled?: boolean;
}
```

---

## 15. File Summary

| File | Action | Description |
|------|--------|-------------|
| `alembic/versions/<hash>_add_consent_fields_to_users.py` | CREATE | Migration: consent columns on users |
| `alembic/versions/<hash>_add_community_sharing_to_children.py` | CREATE | Migration: community_sharing_enabled on children |
| `app/models/user.py` | EDIT | Add consent + community_sharing_enabled columns |
| `app/schemas/user.py` | EDIT | Add ConsentUpdate schema; extend UserResponse + ChildResponse + ChildUpdate |
| `app/api/endpoints/users.py` | EDIT | Add PATCH /me/consent endpoint |
| `app/api/endpoints/vocabulary.py` | EDIT | Add GET /community endpoint |
| `lib/api/consent.ts` | CREATE | submitConsent() API function |
| `lib/api/vocabulary.ts` | EDIT | Add getCommunityWords() + getChildCapturedWords() |
| `lib/api/children.ts` | EDIT | Add community_sharing_enabled to ChildCreateRequest + ChildResponse; add updateChildCommunitySharing() |
| `lib/types.ts` | EDIT | Add communityEnabled to ChildProfile |
| `lib/auth-context.tsx` | EDIT | Add consent_given to User interface |
| `components/modals/privacy-consent-modal.tsx` | CREATE | Full-screen consent modal |
| `components/child/community-tab.tsx` | CREATE | My Photos + Community sub-tabs |
| `components/child/navigation.tsx` | EDIT | Add 社區 nav item with teal colour |
| `app/child/page.tsx` | EDIT | Add community tab section + consent modal gate logic |
| `app/parent/page.tsx` | EDIT | Add consent modal gate |
| `components/parent/settings-tab.tsx` | EDIT | Add community sharing toggle |

---

## 16. Privacy & Security Notes

- `GET /vocabulary/community` never returns `created_by_child_id` — anonymised at the API layer
- Community sharing is **opt-in, off by default** — only words from children with `community_sharing_enabled=True` appear
- Consent modal is not dismissible without clicking "同意並繼續" — prevents accidental bypass
- Camera consent toggle is locked ON in the UI — camera is required for core vocabulary capture
- All consent data persists in the DB tied to the parent User record — survives page refresh, not just `localStorage`
