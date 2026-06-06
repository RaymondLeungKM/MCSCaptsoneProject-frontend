/**
 * Community & Social API functions (Phase 10)
 *
 * Covers:
 *  Epic 10.1 – Kid-Friendly Community Feeds
 *  Epic 10.2 – Parent Social Networking
 */
import { apiRequest, getAuthToken, API_BASE_URL, APIError } from "./client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ModerationStatus = "pending" | "approved" | "rejected";
export type FriendshipStatus = "pending" | "accepted" | "blocked";
export type ChallengeStatus = "active" | "completed" | "expired";

export interface CommunityPost {
  id: string;
  child_id: string;
  word_id: string | null;
  word_text: string | null;
  word_text_cantonese: string | null;
  caption: string | null;
  image_url: string;
  is_anonymous: boolean;
  moderation_status: ModerationStatus;
  reaction_count: number;
  created_at: string;
}

export interface PostReaction {
  id: number;
  post_id: string;
  child_id: string;
  reaction_type: string;
  created_at: string;
}

export interface FriendChildStats {
  child_name: string;
  avatar: string;
  age: number;
  words_learned: number;
  current_streak: number;
  level: number;
  recent_words: string[];
}

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
  updated_at: string | null;
  requester_name: string | null;
  addressee_name: string | null;
}

export interface FriendProgress {
  friend_id: string;
  friend_name: string;
  children_stats: FriendChildStats[];
}

export interface UserSearchResult {
  id: string;
  full_name: string;
}

export interface CommunityChallenge {
  id: string;
  title: string;
  title_zh: string | null;
  description: string | null;
  description_zh: string | null;
  target_count: number;
  category: string | null;
  emoji: string;
  status: ChallengeStatus;
  starts_at: string;
  ends_at: string;
  created_at: string;
}

export interface CommunityChallengeMutationRequest {
  title: string;
  title_zh: string | null;
  description: string | null;
  description_zh: string | null;
  target_count: number;
  category: string | null;
  emoji: string;
  status: ChallengeStatus;
  starts_at: string;
  ends_at: string;
}

export interface ChallengeParticipation {
  id: string;
  challenge_id: string;
  child_id: string;
  progress: number;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string | null;
  challenge_title: string | null;
  challenge_title_zh: string | null;
  challenge_target: number | null;
  challenge_emoji: string | null;
  parent_name: string | null;
  child_name: string | null;
  child_avatar: string | null;
  participant_code: string | null;
}

export type FriendChallengeMetric =
  | "practice_days"
  | "new_words"
  | "active_words";

export type FriendChallengeInviteStatus =
  | "pending"
  | "accepted"
  | "declined";

export type FriendChallengeViewStatus =
  | "pending"
  | "active"
  | "completed"
  | "expired"
  | "declined";

export interface FriendChallengeParticipant {
  id: string;
  parent_id: string | null;
  parent_name: string | null;
  child_id: string | null;
  child_name: string | null;
  child_avatar: string | null;
  invite_status: FriendChallengeInviteStatus;
  progress: number;
  is_completed: boolean;
}

export interface FriendChallenge {
  id: string;
  title: string;
  title_zh: string | null;
  emoji: string;
  creator_name: string | null;
  metric_type: FriendChallengeMetric;
  target_count: number;
  starts_at: string;
  ends_at: string;
  my_progress: number;
  pending_participant_count: number;
  view_status: FriendChallengeViewStatus;
  participants: FriendChallengeParticipant[];
}

export interface FriendChallengeCreate {
  child_id: string;
  invited_parent_ids: string[];
  metric_type: FriendChallengeMetric;
  target_count: number;
  duration_days: number;
}

export interface FriendChallengeResponseUpdate {
  invite_status: Extract<FriendChallengeInviteStatus, "accepted" | "declined">;
  child_id?: string;
}

const FRIEND_CHALLENGE_ENDPOINT = "/social/friend-challenges";
const FRIEND_CHALLENGE_UNAVAILABLE_MESSAGE = "好友挑戰功能尚未在目前伺服器啟用。";
const ADMIN_CHALLENGE_UPDATE_UNAVAILABLE_MESSAGE =
  "目前後端未提供編輯公共挑戰 API。";

function isUnavailableFriendChallengeEndpoint(error: unknown): boolean {
  return error instanceof APIError && [404, 405, 501].includes(error.status);
}

function toChallengeCreatePayload(
  payload: CommunityChallengeMutationRequest,
): Omit<CommunityChallenge, "id" | "status" | "created_at"> {
  return {
    title: payload.title,
    title_zh: payload.title_zh,
    description: payload.description,
    description_zh: payload.description_zh,
    target_count: payload.target_count,
    category: payload.category,
    emoji: payload.emoji,
    starts_at: payload.starts_at,
    ends_at: payload.ends_at,
  };
}

// ---------------------------------------------------------------------------
// Epic 10.1 – Community Feed
// ---------------------------------------------------------------------------

/**
 * Submit a child photo check-in for parental review.
 * Uses FormData so the image file is sent as multipart.
 */
export async function submitCommunityPost(
  childId: string,
  file: File,
  opts: {
    wordId?: string;
    wordText?: string;
    wordTextCantonese?: string;
    caption?: string;
  } = {},
): Promise<CommunityPost> {
  const form = new FormData();
  form.append("file", file);
  if (opts.wordId) form.append("word_id", opts.wordId);
  if (opts.wordText) form.append("word_text", opts.wordText);
  if (opts.wordTextCantonese)
    form.append("word_text_cantonese", opts.wordTextCantonese);
  if (opts.caption) form.append("caption", opts.caption.slice(0, 120));

  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/community/posts/${childId}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `Upload failed (${res.status})`);
  }
  return res.json();
}

/**
 * Submit a community post by picking an existing word from the child's
 * My Collection.  No new file upload – reuses the word's existing image URL.
 */
export async function submitCommunityPostFromCollection(
  childId: string,
  wordId: string,
  opts: { caption?: string } = {},
): Promise<CommunityPost> {
  return apiRequest<CommunityPost>(
    `/community/posts/${childId}/from-collection`,
    {
      method: "POST",
      body: JSON.stringify({
        word_id: wordId,
        caption: opts.caption?.slice(0, 120),
      }),
    },
  );
}

/** Fetch the current child's own community posts, including pending shares */
export async function getMyCommunityPosts(
  childId: string,
): Promise<CommunityPost[]> {
  return apiRequest<CommunityPost[]>(`/community/posts/${childId}/mine`);
}

/** Get posts awaiting parent moderation */
export async function getPendingPosts(): Promise<CommunityPost[]> {
  return apiRequest<CommunityPost[]>("/community/posts/pending");
}

/** Approve or reject a pending post */
export async function moderatePost(
  postId: string,
  status: "approved" | "rejected",
  note?: string,
): Promise<CommunityPost> {
  return apiRequest<CommunityPost>(`/community/posts/${postId}/moderate`, {
    method: "PUT",
    body: JSON.stringify({ status, note }),
  });
}

/** Fetch the approved public community feed */
export async function getCommunityFeed(
  opts: {
    limit?: number;
    offset?: number;
    wordId?: string;
    childId?: string;
  } = {},
): Promise<CommunityPost[]> {
  const params = new URLSearchParams();
  if (opts.limit !== undefined) params.set("limit", String(opts.limit));
  if (opts.offset !== undefined) params.set("offset", String(opts.offset));
  if (opts.wordId) params.set("word_id", opts.wordId);
  if (opts.childId) params.set("child_id", opts.childId);
  const qs = params.toString();
  return apiRequest<CommunityPost[]>(`/community/feed${qs ? `?${qs}` : ""}`);
}

/** Star / react to a post */
export async function reactToPost(
  postId: string,
  childId: string,
  reactionType = "star",
): Promise<PostReaction> {
  return apiRequest<PostReaction>(
    `/community/posts/${postId}/react?child_id=${childId}`,
    {
      method: "POST",
      body: JSON.stringify({ reaction_type: reactionType }),
    },
  );
}

/** Remove a reaction */
export async function removeReaction(
  postId: string,
  childId: string,
): Promise<void> {
  await apiRequest<void>(
    `/community/posts/${postId}/react?child_id=${childId}`,
    { method: "DELETE" },
  );
}

// ---------------------------------------------------------------------------
// Epic 10.2 – Parent Social Networking
// ---------------------------------------------------------------------------

/** Send a friend request by email */
export async function sendFriendRequest(
  addresseeEmail: string,
): Promise<Friendship> {
  return apiRequest<Friendship>("/social/friends/request", {
    method: "POST",
    body: JSON.stringify({ addressee_email: addresseeEmail }),
  });
}

/** Look up a parent by their exact user ID (returns only id + display name) */
export async function searchUserById(
  userId: string,
): Promise<UserSearchResult> {
  return apiRequest<UserSearchResult>(
    `/social/users/search?user_id=${encodeURIComponent(userId)}`,
  );
}

/** Send a friend request using the target parent's user ID */
export async function sendFriendRequestById(
  addresseeId: string,
): Promise<Friendship> {
  return apiRequest<Friendship>("/social/friends/request-by-id", {
    method: "POST",
    body: JSON.stringify({ addressee_id: addresseeId }),
  });
}

/** Accept or block a friend request */
export async function respondToFriendRequest(
  friendshipId: string,
  status: "accepted" | "blocked",
): Promise<Friendship> {
  return apiRequest<Friendship>(`/social/friends/${friendshipId}/respond`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}

/** List friends (and optionally pending requests) */
export async function getFriends(
  includePending = false,
): Promise<Friendship[]> {
  return apiRequest<Friendship[]>(
    `/social/friends${includePending ? "?include_pending=true" : ""}`,
  );
}

/** Get shared progress dashboard for all accepted friends */
export async function getFriendsProgress(): Promise<FriendProgress[]> {
  return apiRequest<FriendProgress[]>("/social/friends/progress");
}

/**
 * Friend challenges are still optional on the backend; return an empty list
 * when that slice is not deployed so the parent page keeps compiling.
 */
export async function getFriendChallenges(): Promise<FriendChallenge[]> {
  try {
    return await apiRequest<FriendChallenge[]>(FRIEND_CHALLENGE_ENDPOINT);
  } catch (error) {
    if (isUnavailableFriendChallengeEndpoint(error)) {
      return [];
    }
    throw error;
  }
}

export async function createFriendChallenge(
  payload: FriendChallengeCreate,
): Promise<FriendChallenge> {
  try {
    return await apiRequest<FriendChallenge>(FRIEND_CHALLENGE_ENDPOINT, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (error) {
    if (isUnavailableFriendChallengeEndpoint(error)) {
      throw new Error(FRIEND_CHALLENGE_UNAVAILABLE_MESSAGE);
    }
    throw error;
  }
}

export async function respondToFriendChallenge(
  challengeId: string,
  payload: FriendChallengeResponseUpdate,
): Promise<FriendChallenge> {
  try {
    return await apiRequest<FriendChallenge>(
      `${FRIEND_CHALLENGE_ENDPOINT}/${challengeId}/respond`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      },
    );
  } catch (error) {
    if (isUnavailableFriendChallengeEndpoint(error)) {
      throw new Error(FRIEND_CHALLENGE_UNAVAILABLE_MESSAGE);
    }
    throw error;
  }
}

/** List active community challenges */
export async function getChallenges(
  status: ChallengeStatus = "active",
): Promise<CommunityChallenge[]> {
  return apiRequest<CommunityChallenge[]>(
    `/social/challenges?status=${status}`,
  );
}

/** Create a new community challenge */
export async function createChallenge(
  payload: Omit<CommunityChallenge, "id" | "status" | "created_at">,
): Promise<CommunityChallenge> {
  return apiRequest<CommunityChallenge>("/social/challenges", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listAdminChallenges(): Promise<CommunityChallenge[]> {
  const lists = await Promise.all([
    getChallenges("active"),
    getChallenges("completed"),
    getChallenges("expired"),
  ]);

  const merged = new Map<string, CommunityChallenge>();
  for (const challenge of lists.flat()) {
    merged.set(challenge.id, challenge);
  }

  return Array.from(merged.values()).sort(
    (left, right) =>
      new Date(left.ends_at).getTime() - new Date(right.ends_at).getTime(),
  );
}

export async function createAdminChallenge(
  payload: CommunityChallengeMutationRequest,
): Promise<CommunityChallenge> {
  if (payload.status !== "active") {
    throw new Error("目前後端只支援建立進行中的公共挑戰。");
  }

  return createChallenge(toChallengeCreatePayload(payload));
}

export async function updateAdminChallenge(
  challengeId: string,
  payload: CommunityChallengeMutationRequest,
): Promise<CommunityChallenge> {
  try {
    return await apiRequest<CommunityChallenge>(`/social/challenges/${challengeId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  } catch (error) {
    if (error instanceof APIError && [404, 405, 501].includes(error.status)) {
      throw new Error(ADMIN_CHALLENGE_UPDATE_UNAVAILABLE_MESSAGE);
    }
    throw error;
  }
}

/** Join / increment progress on a challenge */
export async function participateInChallenge(
  challengeId: string,
  childId: string,
  increment = 1,
): Promise<ChallengeParticipation> {
  return apiRequest<ChallengeParticipation>(
    `/social/challenges/${challengeId}/participate/${childId}`,
    {
      method: "POST",
      body: JSON.stringify({ increment }),
    },
  );
}

/** Get leaderboard for a challenge */
export async function getChallengeLeaderboard(
  challengeId: string,
): Promise<ChallengeParticipation[]> {
  return apiRequest<ChallengeParticipation[]>(
    `/social/challenges/${challengeId}/participations`,
  );
}

/** Get a child's progress on one challenge */
export async function getMyChallengeProgress(
  challengeId: string,
  childId: string,
): Promise<ChallengeParticipation> {
  return apiRequest<ChallengeParticipation>(
    `/social/challenges/${challengeId}/my-progress/${childId}`,
  );
}
