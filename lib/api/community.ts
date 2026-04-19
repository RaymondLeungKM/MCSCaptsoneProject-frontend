/**
 * Community & Social API functions (Phase 10)
 *
 * Covers:
 *  Epic 10.1 – Kid-Friendly Community Feeds
 *  Epic 10.2 – Parent Social Networking
 */
import { apiRequest, getAuthToken, API_BASE_URL } from "./client";

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
