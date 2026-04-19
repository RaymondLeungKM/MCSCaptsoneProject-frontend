/**
 * Privacy consent API
 */
import { apiRequest } from "./client";
import type { UserResponse } from "./auth";

export interface ConsentRequest {
  consent_camera: boolean;
  consent_microphone: boolean;
  consent_analytics: boolean;
  community_sharing_enabled: boolean;
}

/**
 * Submit parent consent choices.
 * Sets consent_given = true on the server and propagates
 * community_sharing_enabled to all children.
 */
export async function submitConsent(
  data: ConsentRequest,
): Promise<UserResponse> {
  return apiRequest<UserResponse>("/users/me/consent", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
