# Community Tab + Privacy Consent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a COPPA-safe Community tab to child mode (My Photos + community word cards from opted-in families) and a first-login privacy consent modal that gates entry to the parent dashboard.

**Architecture:** Backend gets two Alembic migrations (consent columns on `users`, `community_sharing_enabled` on `children`), one new endpoint (`PATCH /users/me/consent`), and one new endpoint (`GET /vocabulary/community`). Frontend gets a full-screen consent modal shown from `app/parent/page.tsx` when `user.consent_given === false`, and a `社區` tab in child mode with two sub-tabs wired to existing and new API endpoints.

**Tech Stack:** FastAPI + SQLAlchemy (async) + Alembic · Next.js 14 App Router · Tailwind CSS · shadcn/ui (Switch, Button, Skeleton) · Lucide React

---

## File Map

| File                                                                                            | Action                                                                            |
| ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `MCSCaptsoneProject-backend/alembic/versions/e5f6a7b8c9d0_add_consent_fields_to_users.py`       | CREATE                                                                            |
| `MCSCaptsoneProject-backend/alembic/versions/f6a7b8c9d0e1_add_community_sharing_to_children.py` | CREATE                                                                            |
| `MCSCaptsoneProject-backend/app/models/user.py`                                                 | EDIT — add 5 consent cols to User, 1 col to Child                                 |
| `MCSCaptsoneProject-backend/app/schemas/user.py`                                                | EDIT — add `ConsentUpdate`; extend `UserResponse`, `ChildUpdate`, `ChildResponse` |
| `MCSCaptsoneProject-backend/app/api/endpoints/users.py`                                         | EDIT — add `PATCH /me/consent`                                                    |
| `MCSCaptsoneProject-backend/app/api/endpoints/vocabulary.py`                                    | EDIT — add `GET /community`                                                       |
| `MCSCaptsoneProject-frontend/lib/api/auth.ts`                                                   | EDIT — add `consent_given` to `UserResponse`                                      |
| `MCSCaptsoneProject-frontend/lib/api/consent.ts`                                                | CREATE                                                                            |
| `MCSCaptsoneProject-frontend/lib/api/vocabulary.ts`                                             | EDIT — add `getCommunityWords`, `getChildCapturedWords`                           |
| `MCSCaptsoneProject-frontend/lib/api/children.ts`                                               | EDIT — add `community_sharing_enabled` to request/response/mapper                 |
| `MCSCaptsoneProject-frontend/lib/types.ts`                                                      | EDIT — add `communityEnabled` to `ChildProfile`                                   |
| `MCSCaptsoneProject-frontend/lib/auth-context.tsx`                                              | EDIT — add `consent_given` to `User` interface                                    |
| `MCSCaptsoneProject-frontend/components/modals/privacy-consent-modal.tsx`                       | CREATE                                                                            |
| `MCSCaptsoneProject-frontend/components/child/community-tab.tsx`                                | CREATE                                                                            |
| `MCSCaptsoneProject-frontend/components/child/navigation.tsx`                                   | EDIT — add 社區 nav item                                                          |
| `MCSCaptsoneProject-frontend/app/child/page.tsx`                                                | EDIT — add community tab content block                                            |
| `MCSCaptsoneProject-frontend/app/parent/page.tsx`                                               | EDIT — add consent modal gate                                                     |
| `MCSCaptsoneProject-frontend/components/parent/settings-tab.tsx`                                | EDIT — add community sharing toggle                                               |

---

## Task 1: Migration — consent fields on `users`

**Files:**

- Create: `MCSCaptsoneProject-backend/alembic/versions/e5f6a7b8c9d0_add_consent_fields_to_users.py`

- [ ] **Step 1.1: Create migration file**

```python
"""add_consent_fields_to_users

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-04-11 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'e5f6a7b8c9d0'
down_revision = 'd4e5f6a7b8c9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('consent_given', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('users', sa.Column('consent_given_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('consent_camera', sa.Boolean(), nullable=False, server_default='true'))
    op.add_column('users', sa.Column('consent_microphone', sa.Boolean(), nullable=False, server_default='true'))
    op.add_column('users', sa.Column('consent_analytics', sa.Boolean(), nullable=False, server_default='true'))


def downgrade() -> None:
    op.drop_column('users', 'consent_analytics')
    op.drop_column('users', 'consent_microphone')
    op.drop_column('users', 'consent_camera')
    op.drop_column('users', 'consent_given_at')
    op.drop_column('users', 'consent_given')
```

- [ ] **Step 1.2: Commit**

```bash
cd MCSCaptsoneProject-backend
git add alembic/versions/e5f6a7b8c9d0_add_consent_fields_to_users.py
git commit -m "feat: migration — consent fields on users table"
```

---

## Task 2: Migration — `community_sharing_enabled` on `children`

**Files:**

- Create: `MCSCaptsoneProject-backend/alembic/versions/f6a7b8c9d0e1_add_community_sharing_to_children.py`

- [ ] **Step 2.1: Create migration file**

```python
"""add_community_sharing_to_children

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-04-11 00:01:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'f6a7b8c9d0e1'
down_revision = 'e5f6a7b8c9d0'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('children', sa.Column('community_sharing_enabled', sa.Boolean(), nullable=False, server_default='false'))


def downgrade() -> None:
    op.drop_column('children', 'community_sharing_enabled')
```

- [ ] **Step 2.2: Commit**

```bash
git add alembic/versions/f6a7b8c9d0e1_add_community_sharing_to_children.py
git commit -m "feat: migration — community_sharing_enabled on children table"
```

---

## Task 3: Update SQLAlchemy models

**Files:**

- Modify: `MCSCaptsoneProject-backend/app/models/user.py`

- [ ] **Step 3.1: Add consent columns to `User` model**

In `app/models/user.py`, inside the `User` class after `is_active`:

```python
    # Privacy consent
    consent_given = Column(Boolean, default=False)
    consent_given_at = Column(DateTime(timezone=True), nullable=True)
    consent_camera = Column(Boolean, default=True)
    consent_microphone = Column(Boolean, default=True)
    consent_analytics = Column(Boolean, default=True)
```

- [ ] **Step 3.2: Add community_sharing_enabled to `Child` model**

In `app/models/user.py`, inside the `Child` class after `last_active`:

```python
    # Community feature
    community_sharing_enabled = Column(Boolean, default=False)
```

- [ ] **Step 3.3: Commit**

```bash
git add app/models/user.py
git commit -m "feat: add consent + community_sharing_enabled columns to models"
```

---

## Task 4: Update Pydantic schemas

**Files:**

- Modify: `MCSCaptsoneProject-backend/app/schemas/user.py`

- [ ] **Step 4.1: Add `ConsentUpdate` schema**

Add after `UserUpdate` in `app/schemas/user.py`:

```python
class ConsentUpdate(BaseModel):
    consent_camera: bool
    consent_microphone: bool
    consent_community_sharing: bool
    consent_analytics: bool
```

- [ ] **Step 4.2: Extend `UserResponse` with consent fields**

The existing `UserResponse` class:

```python
class UserResponse(UserBase):
    id: str
    role: UserRole
    is_active: bool
    created_at: datetime
    consent_given: bool = False
    consent_given_at: Optional[datetime] = None

    class Config:
        from_attributes = True
```

- [ ] **Step 4.3: Extend `ChildUpdate` and `ChildResponse`**

Add to `ChildUpdate`:

```python
    community_sharing_enabled: Optional[bool] = None
```

Add to `ChildResponse` (after `last_active`):

```python
    community_sharing_enabled: bool = False
```

- [ ] **Step 4.4: Commit**

```bash
git add app/schemas/user.py
git commit -m "feat: add ConsentUpdate schema; extend UserResponse + ChildUpdate + ChildResponse"
```

---

## Task 5: Add `PATCH /users/me/consent` endpoint

**Files:**

- Modify: `MCSCaptsoneProject-backend/app/api/endpoints/users.py`

- [ ] **Step 5.1: Add imports and endpoint**

Update `app/api/endpoints/users.py` to:

```python
"""
User management endpoints
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.schemas.user import UserResponse, UserUpdate, ConsentUpdate
from app.models.user import User, Child
from app.core.security import get_current_active_user

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_active_user)
):
    """Get current user profile"""
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_current_user(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update current user profile"""
    update_data = user_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.patch("/me/consent", response_model=UserResponse)
async def update_consent(
    consent: ConsentUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Save parent privacy consent choices. Sets consent_given=True and propagates
    community_sharing_enabled to all children of this user."""
    current_user.consent_given = True
    current_user.consent_given_at = datetime.utcnow()
    current_user.consent_camera = consent.consent_camera
    current_user.consent_microphone = consent.consent_microphone
    current_user.consent_analytics = consent.consent_analytics

    # Propagate community sharing choice to all children
    result = await db.execute(select(Child).where(Child.parent_id == current_user.id))
    children = result.scalars().all()
    for child in children:
        child.community_sharing_enabled = consent.consent_community_sharing

    await db.commit()
    await db.refresh(current_user)
    return current_user
```

- [ ] **Step 5.2: Manual smoke test** (requires running backend)

```bash
# Start backend if not running
uvicorn main:app --reload --port 8000

# Register and login to get token, then:
curl -X PATCH http://localhost:8000/api/v1/users/me/consent \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"consent_camera":true,"consent_microphone":true,"consent_community_sharing":false,"consent_analytics":true}'

# Expected: 200 response with user object including consent_given: true
```

- [ ] **Step 5.3: Commit**

```bash
git add app/api/endpoints/users.py
git commit -m "feat: add PATCH /users/me/consent endpoint"
```

---

## Task 6: Add `GET /vocabulary/community` endpoint

**Files:**

- Modify: `MCSCaptsoneProject-backend/app/api/endpoints/vocabulary.py`

- [ ] **Step 6.1: Add the endpoint**

Add this function to `app/api/endpoints/vocabulary.py` (after the `get_external_captured_words` function, before the end of file):

```python
@router.get("/community", response_model=List[WordResponse])
async def get_community_words(
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Return anonymised word cards from children whose parents opted in to community sharing.
    created_by_child_id is stripped from every response item."""
    from app.models.user import Child as ChildModel

    query = (
        select(Word)
        .join(ChildModel, Word.created_by_child_id == ChildModel.id)
        .options(selectinload(Word.category_rel))
        .where(
            Word.is_active == True,
            Word.created_by_child_id.is_not(None),
            ChildModel.community_sharing_enabled == True,
        )
        .order_by(Word.created_at.desc())
        .limit(limit)
    )
    result = await db.execute(query)
    words = result.scalars().all()

    response_words = []
    for word in words:
        word_dict = WordResponse.model_validate(word).model_dump()
        word_dict["category_name"] = word.category_rel.name if word.category_rel else None
        word_dict["category_name_cantonese"] = word.category_rel.name_cantonese if word.category_rel else None
        # Anonymise: never expose which child submitted this word
        word_dict["created_by_child_id"] = None
        response_words.append(word_dict)

    return response_words
```

Also add `get_current_active_user` to the imports at the top of vocabulary.py (it's already imported as `get_current_active_user` if you check — verify it's present, otherwise add):

```python
from app.core.security import get_current_active_user
```

- [ ] **Step 6.2: Manual smoke test**

```bash
curl http://localhost:8000/api/v1/vocabulary/community \
  -H "Authorization: Bearer <token>"
# Expected: 200, JSON array (may be empty if no community-sharing children yet)
# Verify no item has a non-null created_by_child_id
```

- [ ] **Step 6.3: Commit**

```bash
git add app/api/endpoints/vocabulary.py
git commit -m "feat: add GET /vocabulary/community endpoint — anonymised community word cards"
```

---

## Task 7: Run Alembic migrations

- [ ] **Step 7.1: Apply migrations**

```bash
cd MCSCaptsoneProject-backend
alembic upgrade head
```

Expected output ends with:

```
Running upgrade d4e5f6a7b8c9 -> e5f6a7b8c9d0, add_consent_fields_to_users
Running upgrade e5f6a7b8c9d0 -> f6a7b8c9d0e1, add_community_sharing_to_children
```

- [ ] **Step 7.2: Verify columns exist in DB**

```bash
psql $DATABASE_URL -c "\d users" | grep consent
psql $DATABASE_URL -c "\d children" | grep community
```

Expected: consent_given, consent_given_at, consent_camera, consent_microphone, consent_analytics columns on users; community_sharing_enabled on children.

---

## Task 8: Frontend — Update `UserResponse` and `ChildResponse` types

**Files:**

- Modify: `MCSCaptsoneProject-frontend/lib/api/auth.ts`
- Modify: `MCSCaptsoneProject-frontend/lib/api/children.ts`
- Modify: `MCSCaptsoneProject-frontend/lib/types.ts`
- Modify: `MCSCaptsoneProject-frontend/lib/auth-context.tsx`

- [ ] **Step 8.1: Add `consent_given` to `UserResponse` in `lib/api/auth.ts`**

```typescript
export interface UserResponse {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  consent_given: boolean;
}
```

- [ ] **Step 8.2: Add `consent_given` to `User` interface in `lib/auth-context.tsx`**

Locate the `User` interface near the top of `lib/auth-context.tsx`:

```typescript
interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  consent_given: boolean;
}
```

- [ ] **Step 8.3: Add `community_sharing_enabled` to `ChildCreateRequest` and `ChildResponse` in `lib/api/children.ts`**

Add to `ChildCreateRequest`:

```typescript
  community_sharing_enabled?: boolean;
```

Add to `ChildResponse`:

```typescript
  community_sharing_enabled?: boolean;
```

Update `toChildProfile()` at the bottom of `lib/api/children.ts` — add one field to the returned object:

```typescript
    languagePreference: response.language_preference || "cantonese",
    communityEnabled: response.community_sharing_enabled ?? false,
```

- [ ] **Step 8.4: Add `communityEnabled` to `ChildProfile` in `lib/types.ts`**

Locate the `ChildProfile` interface and add after `languagePreference`:

```typescript
  communityEnabled?: boolean;
```

- [ ] **Step 8.5: Commit**

```bash
cd MCSCaptsoneProject-frontend
git add lib/api/auth.ts lib/api/children.ts lib/types.ts lib/auth-context.tsx
git commit -m "feat: add consent_given and communityEnabled to frontend type contracts"
```

---

## Task 9: Create `lib/api/consent.ts`

**Files:**

- Create: `MCSCaptsoneProject-frontend/lib/api/consent.ts`

- [ ] **Step 9.1: Create file**

```typescript
/**
 * Privacy Consent API
 */
import { apiRequest } from "./client";
import type { UserResponse } from "./auth";

export interface ConsentPayload {
  consent_camera: boolean;
  consent_microphone: boolean;
  consent_community_sharing: boolean;
  consent_analytics: boolean;
}

/**
 * Submit parent privacy consent choices.
 * Sets consent_given=true on the User and propagates community_sharing_enabled
 * to all children of this user.
 */
export async function submitConsent(
  payload: ConsentPayload,
): Promise<UserResponse> {
  return apiRequest<UserResponse>("/users/me/consent", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
```

- [ ] **Step 9.2: Commit**

```bash
git add lib/api/consent.ts
git commit -m "feat: add lib/api/consent.ts — submitConsent API function"
```

---

## Task 10: Update `lib/api/vocabulary.ts`

**Files:**

- Modify: `MCSCaptsoneProject-frontend/lib/api/vocabulary.ts`

- [ ] **Step 10.1: Add `CommunityWordResponse` interface and two new functions**

At the end of `lib/api/vocabulary.ts`, add:

```typescript
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

/**
 * Get anonymised community word cards from children whose parents opted in.
 */
export async function getCommunityWords(
  limit = 50,
): Promise<CommunityWordResponse[]> {
  return apiRequest<CommunityWordResponse[]>(
    `/vocabulary/community?limit=${limit}`,
  );
}

/**
 * Get this child's own camera-captured word cards.
 */
export async function getChildCapturedWords(
  childId: string,
  limit = 50,
): Promise<WordResponse[]> {
  return apiRequest<WordResponse[]>(
    `/vocabulary/external/captured/${childId}?limit=${limit}`,
  );
}
```

- [ ] **Step 10.2: Commit**

```bash
git add lib/api/vocabulary.ts
git commit -m "feat: add getCommunityWords + getChildCapturedWords API functions"
```

---

## Task 11: Create privacy consent modal

**Files:**

- Create: `MCSCaptsoneProject-frontend/components/modals/privacy-consent-modal.tsx`

- [ ] **Step 11.1: Create the component**

```typescript
"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { submitConsent } from "@/lib/api/consent";

interface PrivacyConsentModalProps {
  open: boolean;
  onAccept: () => void;
}

interface ConsentRow {
  key: "consent_microphone" | "consent_community_sharing" | "consent_analytics";
  emoji: string;
  titleChinese: string;
  descChinese: string;
  defaultValue: boolean;
  required?: never;
}

const CONSENT_ROWS: ConsentRow[] = [
  {
    key: "consent_microphone",
    emoji: "🎤",
    titleChinese: "麥克風",
    descChinese: "錄音以練習廣東話發音",
    defaultValue: true,
  },
  {
    key: "consent_community_sharing",
    emoji: "👥",
    titleChinese: "社區相片分享",
    descChinese: "讓其他小朋友睇到您孩子嘅相片詞卡",
    defaultValue: false,
  },
  {
    key: "consent_analytics",
    emoji: "📊",
    titleChinese: "學習數據收集",
    descChinese: "記錄學習進度以提供個人化建議",
    defaultValue: true,
  },
];

export function PrivacyConsentModal({ open, onAccept }: PrivacyConsentModalProps) {
  const [toggles, setToggles] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(CONSENT_ROWS.map((r) => [r.key, r.defaultValue])),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleToggle = (key: string, value: boolean) => {
    setToggles((prev) => ({ ...prev, [key]: value }));
  };

  const handleAccept = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await submitConsent({
        consent_camera: true,
        consent_microphone: toggles["consent_microphone"] ?? true,
        consent_community_sharing: toggles["consent_community_sharing"] ?? false,
        consent_analytics: toggles["consent_analytics"] ?? true,
      });
      onAccept();
    } catch {
      setError("儲存失敗，請再試一次。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl overflow-hidden">
        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="text-5xl mb-2">🔒</div>
            <h2 className="text-3xl font-black text-slate-800">私隱聲明</h2>
            <p className="text-slate-500 font-medium text-sm">Privacy Statement</p>
          </div>

          <p className="text-slate-600 font-medium text-sm text-center">
            我們使用以下功能幫助小朋友學習廣東話。<br />請選擇您同意的項目：
          </p>

          {/* Camera row — mandatory, always on */}
          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <div className="space-y-0.5 flex-1 pr-4">
              <p className="text-slate-800 font-bold text-sm">📷 相機使用</p>
              <p className="text-xs text-slate-400">使用相機拍攝物件以學習詞語（必要功能）</p>
            </div>
            <Switch checked={true} disabled className="opacity-70" />
          </div>

          {/* Toggleable rows */}
          {CONSENT_ROWS.map((row) => (
            <div key={row.key} className="flex items-center justify-between py-3 border-b border-slate-100">
              <div className="space-y-0.5 flex-1 pr-4">
                <p className="text-slate-800 font-bold text-sm">
                  {row.emoji} {row.titleChinese}
                </p>
                <p className="text-xs text-slate-400">{row.descChinese}</p>
              </div>
              <Switch
                checked={toggles[row.key] ?? row.defaultValue}
                onCheckedChange={(val) => handleToggle(row.key, val)}
              />
            </div>
          ))}

          <p className="text-xs text-slate-400 text-center">
            我們絕不出售個人資料。您可以隨時在設定中更改選項。
          </p>

          {error && (
            <p className="text-red-500 text-sm font-bold text-center">{error}</p>
          )}

          <Button
            onClick={() => void handleAccept()}
            disabled={isSubmitting}
            className="w-full h-14 rounded-full text-lg font-black bg-[#38BDF8] hover:bg-[#0284C7] text-white shadow-lg shadow-blue-200/50 transition-all active:scale-95"
          >
            {isSubmitting ? "儲存中..." : "同意並繼續 ✓"}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 11.2: Commit**

```bash
git add components/modals/privacy-consent-modal.tsx
git commit -m "feat: add PrivacyConsentModal component"
```

---

## Task 12: Create community tab component

**Files:**

- Create: `MCSCaptsoneProject-frontend/components/child/community-tab.tsx`

- [ ] **Step 12.1: Create the component**

```typescript
"use client";

import { useEffect, useState } from "react";
import { Volume2, Loader2, Lock } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCommunityWords, getChildCapturedWords } from "@/lib/api/vocabulary";
import type { CommunityWordResponse, WordResponse } from "@/lib/api/vocabulary";
import { API_BASE_URL } from "@/lib/api/client";

interface CommunityTabProps {
  childId: string;
  childCommunityEnabled: boolean;
}

type SubTab = "my-photos" | "community";

function resolveImageUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const origin = API_BASE_URL.replace(/\/api\/v1\/?$/, "");
  return `${origin}${url.startsWith("/") ? "" : "/"}${url}`;
}

function resolveAudioUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const origin = API_BASE_URL.replace(/\/api\/v1\/?$/, "");
  return `${origin}${url.startsWith("/") ? "" : "/"}${url}`;
}

interface WordCardProps {
  wordCantonese?: string;
  wordEnglish: string;
  jyutping?: string;
  imageUrl?: string;
  audioUrl?: string;
}

function WordPhotoCard({ wordCantonese, wordEnglish, jyutping, imageUrl, audioUrl }: WordCardProps) {
  const [audioPlaying, setAudioPlaying] = useState(false);

  const playAudio = () => {
    const resolved = resolveAudioUrl(audioUrl);
    if (!resolved) return;
    const audio = new Audio(resolved);
    setAudioPlaying(true);
    audio.onended = () => setAudioPlaying(false);
    audio.onerror = () => setAudioPlaying(false);
    void audio.play();
  };

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-3xl overflow-hidden shadow-sm border border-white/50 flex flex-col">
      {/* Photo */}
      <div className="aspect-square w-full bg-slate-100 overflow-hidden">
        {imageUrl ? (
          <img
            src={resolveImageUrl(imageUrl)}
            alt={wordCantonese || wordEnglish}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            📷
          </div>
        )}
      </div>

      {/* Word info */}
      <div className="p-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xl font-black text-slate-800 truncate">
            {wordCantonese || wordEnglish}
          </p>
          {jyutping && (
            <p className="text-xs text-slate-400 font-medium truncate">{jyutping}</p>
          )}
        </div>
        {audioUrl && (
          <button
            onClick={playAudio}
            className={cn(
              "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all",
              audioPlaying
                ? "bg-sky-400 text-white animate-pulse"
                : "bg-sky-100 text-sky-600 hover:bg-sky-200",
            )}
            aria-label="播放發音"
          >
            {audioPlaying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-3xl overflow-hidden">
          <Skeleton className="aspect-square w-full" />
          <div className="p-3 space-y-1">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CommunityTab({ childId, childCommunityEnabled }: CommunityTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("my-photos");
  const [myPhotos, setMyPhotos] = useState<WordResponse[]>([]);
  const [communityWords, setCommunityWords] = useState<CommunityWordResponse[]>([]);
  const [myPhotosLoading, setMyPhotosLoading] = useState(false);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [myPhotosError, setMyPhotosError] = useState<string | null>(null);
  const [communityError, setCommunityError] = useState<string | null>(null);

  useEffect(() => {
    setMyPhotosLoading(true);
    setMyPhotosError(null);
    getChildCapturedWords(childId)
      .then(setMyPhotos)
      .catch(() => setMyPhotosError("載入相片失敗，請稍後再試。"))
      .finally(() => setMyPhotosLoading(false));
  }, [childId]);

  useEffect(() => {
    if (!childCommunityEnabled) return;
    setCommunityLoading(true);
    setCommunityError(null);
    getCommunityWords()
      .then(setCommunityWords)
      .catch(() => setCommunityError("載入社區詞語失敗，請稍後再試。"))
      .finally(() => setCommunityLoading(false));
  }, [childCommunityEnabled]);

  return (
    <div className="space-y-4 pb-4">
      {/* Sub-tab pill toggle */}
      <div className="flex gap-2 bg-white/60 backdrop-blur-md rounded-2xl p-1.5 border border-white/50">
        <button
          onClick={() => setActiveSubTab("my-photos")}
          className={cn(
            "flex-1 py-2.5 rounded-xl text-sm font-black transition-all",
            activeSubTab === "my-photos"
              ? "bg-teal-400 text-white shadow-sm"
              : "text-slate-500 hover:text-slate-700",
          )}
        >
          📷 我的相片
        </button>
        <button
          onClick={() => setActiveSubTab("community")}
          className={cn(
            "flex-1 py-2.5 rounded-xl text-sm font-black transition-all",
            activeSubTab === "community"
              ? "bg-teal-400 text-white shadow-sm"
              : "text-slate-500 hover:text-slate-700",
          )}
        >
          👥 社區
        </button>
      </div>

      {/* My Photos */}
      {activeSubTab === "my-photos" && (
        <>
          {myPhotosLoading && <SkeletonGrid />}
          {!myPhotosLoading && myPhotosError && (
            <p className="text-center text-red-400 font-bold py-8">{myPhotosError}</p>
          )}
          {!myPhotosLoading && !myPhotosError && myPhotos.length === 0 && (
            <div className="text-center py-14 space-y-3">
              <div className="text-6xl">📷</div>
              <p className="text-slate-600 font-black text-lg">未有相片！</p>
              <p className="text-slate-400 text-sm font-medium">
                喺學習頁面用相機影下物件，即可學廣東話！
              </p>
            </div>
          )}
          {!myPhotosLoading && myPhotos.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {myPhotos.map((w) => (
                <WordPhotoCard
                  key={w.id}
                  wordCantonese={w.word_cantonese}
                  wordEnglish={w.word}
                  jyutping={w.jyutping}
                  imageUrl={w.image_url}
                  audioUrl={w.audio_url}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Community */}
      {activeSubTab === "community" && (
        <>
          {!childCommunityEnabled && (
            <div className="flex flex-col items-center justify-center py-14 space-y-4 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                <Lock className="w-10 h-10 text-slate-400" />
              </div>
              <p className="text-slate-700 font-black text-lg">社區分享未開啟</p>
              <p className="text-slate-400 text-sm font-medium">
                請家長在設定中開啟社區相片分享
              </p>
              <Link href="/parent?tab=settings">
                <Button
                  variant="outline"
                  className="rounded-full font-bold border-teal-300 text-teal-600 hover:bg-teal-50"
                >
                  前往家長設定
                </Button>
              </Link>
            </div>
          )}

          {childCommunityEnabled && communityLoading && <SkeletonGrid />}

          {childCommunityEnabled && !communityLoading && communityError && (
            <p className="text-center text-red-400 font-bold py-8">{communityError}</p>
          )}

          {childCommunityEnabled && !communityLoading && !communityError && communityWords.length === 0 && (
            <div className="text-center py-14 space-y-3">
              <div className="text-6xl">🌱</div>
              <p className="text-slate-600 font-black text-lg">社區暫時未有分享</p>
              <p className="text-slate-400 text-sm font-medium">
                等其他小朋友加入後再睇！
              </p>
            </div>
          )}

          {childCommunityEnabled && !communityLoading && communityWords.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {communityWords.map((w) => (
                <WordPhotoCard
                  key={w.id}
                  wordCantonese={w.word_cantonese}
                  wordEnglish={w.word}
                  jyutping={w.jyutping}
                  imageUrl={w.image_url}
                  audioUrl={w.audio_url}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 12.2: Commit**

```bash
git add components/child/community-tab.tsx
git commit -m "feat: add CommunityTab component with My Photos + Community sub-tabs"
```

---

## Task 13: Update child navigation — add 社區 tab

**Files:**

- Modify: `MCSCaptsoneProject-frontend/components/child/navigation.tsx`

- [ ] **Step 13.1: Add import and nav item**

At the top of `components/child/navigation.tsx`, the import line for icons is:

```typescript
import { Home, BookOpen, Gamepad2, Trophy, User, Moon } from "lucide-react";
```

Change to:

```typescript
import {
  Home,
  BookOpen,
  Gamepad2,
  Trophy,
  User,
  Moon,
  Users,
} from "lucide-react";
```

In the `navItems` array, add the community entry after the `stories` item and before `rewards`:

```typescript
  {
    id: "community",
    icon: Users,
    label: "社區",
    activeBg: "bg-teal-400",
    activeText: "text-teal-600",
  },
```

So the full array order becomes: home → learn → games → stories → community → rewards → profile.

- [ ] **Step 13.2: Commit**

```bash
git add components/child/navigation.tsx
git commit -m "feat: add 社區 (community) tab to child navigation"
```

---

## Task 14: Wire community tab into child dashboard

**Files:**

- Modify: `MCSCaptsoneProject-frontend/app/child/page.tsx`

- [ ] **Step 14.1: Add import**

Near the top of `app/child/page.tsx`, with the other component imports, add:

```typescript
import { CommunityTab } from "@/components/child/community-tab";
```

- [ ] **Step 14.2: Add community tab content block**

In `app/child/page.tsx`, inside the `<main>` element where other tab sections live, add this block after the `stories` section and before the `rewards/profile` section:

```typescript
          {activeTab === "community" && profile && (
            <section>
              <CommunityTab
                childId={profile.id}
                childCommunityEnabled={profile.communityEnabled ?? false}
              />
            </section>
          )}
```

- [ ] **Step 14.3: Commit**

```bash
git add app/child/page.tsx
git commit -m "feat: wire CommunityTab into child dashboard page"
```

---

## Task 15: Add consent modal gate to parent dashboard

**Files:**

- Modify: `MCSCaptsoneProject-frontend/app/parent/page.tsx`

- [ ] **Step 15.1: Add import**

Near the top of `app/parent/page.tsx`, with the other component imports, add:

```typescript
import { PrivacyConsentModal } from "@/components/modals/privacy-consent-modal";
import { useAuth } from "@/lib/auth-context";
```

(If `useAuth` is already imported, skip the second line.)

- [ ] **Step 15.2: Add consent state and modal render**

Inside `ParentDashboardContent` (the inner component), add:

```typescript
const { user, refreshUser } = useAuth();
const needsConsent = user !== null && user.consent_given === false;
```

Then at the very top of the JSX returned by `ParentDashboardContent`, before the `<CozyPageWrapper>`, add:

```typescript
    <>
      <PrivacyConsentModal
        open={needsConsent}
        onAccept={() => void refreshUser()}
      />
      <CozyPageWrapper ...>
        ...
      </CozyPageWrapper>
    </>
```

Wrap the existing return in a React Fragment so both elements can coexist.

- [ ] **Step 15.3: Commit**

```bash
git add app/parent/page.tsx
git commit -m "feat: add privacy consent modal gate to parent dashboard"
```

---

## Task 16: Add community sharing toggle to settings tab

**Files:**

- Modify: `MCSCaptsoneProject-frontend/components/parent/settings-tab.tsx`

- [ ] **Step 16.1: Add state and handler**

Inside the `SettingsTab` function (mock UI branch), after the existing `const [parentalControls, setParentalControls] = useState(true);` line, add:

```typescript
const [communitySharing, setCommunitySharing] = useState(false);
```

Also add the import at the top of the file (if not already present):

```typescript
import { updateChild } from "@/lib/api/children";
import { useToast } from "@/hooks/use-toast";
```

Inside the function, add:

```typescript
const { toast } = useToast();

const handleCommunitySharingToggle = async (enabled: boolean) => {
  setCommunitySharing(enabled);
  if (isMockData) return; // skip API call for mock data
  try {
    await updateChild(profile.id, { community_sharing_enabled: enabled });
    toast({
      title: enabled ? "已開啟社區分享" : "已關閉社區分享",
      description: enabled
        ? "小朋友的相片詞卡已可與社區分享"
        : "小朋友的相片詞卡已設為私人",
    });
  } catch {
    setCommunitySharing(!enabled); // revert on error
    toast({
      title: "儲存失敗",
      description: "請稍後再試。",
      variant: "destructive",
    });
  }
};
```

- [ ] **Step 16.2: Add toggle row to the notification settings card**

Find the existing "Push notification" toggle row in the settings JSX. Add the community toggle row directly after it:

```tsx
<div className="flex items-center justify-between">
  <div className="space-y-0.5">
    <Label className="text-slate-700 font-bold text-sm">👥 社區相片分享</Label>
    <p className="text-xs text-slate-400">允許其他小朋友睇到相片詞卡</p>
  </div>
  <Switch
    checked={communitySharing}
    onCheckedChange={(val) => void handleCommunitySharingToggle(val)}
  />
</div>
```

- [ ] **Step 16.3: Commit**

```bash
git add components/parent/settings-tab.tsx
git commit -m "feat: add community sharing toggle to parent settings tab"
```

---

## Task 17: Smoke test end-to-end

- [ ] **Step 17.1: Start backend and frontend**

```bash
# Terminal 1
cd MCSCaptsoneProject-backend && uvicorn main:app --reload --port 8000

# Terminal 2
cd MCSCaptsoneProject-frontend && npm run dev
```

- [ ] **Step 17.2: Test consent modal**

1. Open http://localhost:3000/parent — log in with a test account that has `consent_given=false` (newly registered account)
2. Verify: consent modal appears, cannot be dismissed by clicking outside
3. Toggle community sharing OFF, click "同意並繼續"
4. Verify: modal disappears, dashboard renders
5. Refresh page — modal must NOT appear again

- [ ] **Step 17.3: Test community tab in child mode**

1. Open http://localhost:3000/child
2. Verify: 社區 tab appears in bottom navigation between 故事 and 獎勵
3. Tap 社區 → 我的相片 sub-tab shows (skeleton then words or empty state)
4. Tap 社區 sub-tab → shows locked state (community sharing is OFF)
5. In parent dashboard Settings → enable 社區相片分享
6. Return to child mode → 社區 sub-tab now shows community words (or empty state if none yet)

- [ ] **Step 17.4: Final commit**

```bash
git add -A
git commit -m "feat: community tab + privacy consent — end-to-end wiring complete"
```
