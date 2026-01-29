"use client";

/**
 * Communication bridge between the iframe (website) and parent mobile app
 */

export type MessageFromApp =
  | { type: "SET_USER"; userId: string; childId?: string }
  | {
      type: "WORD_LEARNED";
      wordId: string;
      word: string;
      timestamp: string;
      source: "object_detection" | "physical_activity";
      imageUrl?: string;
    }
  | { type: "SYNC_PROGRESS"; childId: string };

export type MessageToApp =
  | { type: "READY" }
  | {
      type: "WORD_COMPLETED";
      wordId: string;
      word: string;
      xp: number;
      level: number;
      wordsLearned: number;
    }
  | { type: "REQUEST_AUTH" }
  | {
      type: "PROGRESS_UPDATED";
      childId: string;
      xp: number;
      level: number;
      wordsLearned: number;
      todayProgress: number;
    };

export class IframeBridge {
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private isInitialized = false;
  private parentOrigin: string = "*"; // In production, set this to your mobile app's origin

  constructor() {
    if (typeof window !== "undefined") {
      this.init();
    }
  }

  private init() {
    if (this.isInitialized) return;

    window.addEventListener("message", this.handleMessage.bind(this));
    this.isInitialized = true;

    // Notify parent that iframe is ready
    this.sendToApp({ type: "READY" });

    console.log("[IframeBridge] Initialized and sent READY message");
  }

  private handleMessage(event: MessageEvent) {
    // In production, validate event.origin for security
    // if (event.origin !== this.parentOrigin) return;

    const message = event.data as MessageFromApp;

    console.log("[IframeBridge] Received message:", message);

    if (!message || !message.type) return;

    const listeners = this.listeners.get(message.type);
    if (listeners) {
      listeners.forEach((listener) => listener(message));
    }

    // Also notify wildcard listeners
    const wildcardListeners = this.listeners.get("*");
    if (wildcardListeners) {
      wildcardListeners.forEach((listener) => listener(message));
    }
  }

  /**
   * Listen for messages from the mobile app
   */
  on(type: string, callback: (data: any) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);

    return () => {
      this.listeners.get(type)?.delete(callback);
    };
  }

  /**
   * Send message to the mobile app
   */
  sendToApp(message: MessageToApp) {
    if (typeof window === "undefined") return;

    // Send to parent window (mobile app)
    if (window.parent && window.parent !== window) {
      console.log("[IframeBridge] Sending to app:", message);
      window.parent.postMessage(message, this.parentOrigin);
    } else {
      console.log("[IframeBridge] Not in iframe, message not sent:", message);
    }
  }

  /**
   * Check if running inside an iframe
   */
  isInIframe(): boolean {
    if (typeof window === "undefined") return false;
    return window.self !== window.top;
  }

  /**
   * Set the allowed origin for security (production use)
   */
  setAllowedOrigin(origin: string) {
    this.parentOrigin = origin;
  }

  /**
   * Remove all listeners
   */
  destroy() {
    if (typeof window !== "undefined") {
      window.removeEventListener("message", this.handleMessage);
    }
    this.listeners.clear();
    this.isInitialized = false;
  }
}

// Singleton instance
export const iframeBridge = new IframeBridge();
