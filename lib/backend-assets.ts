export function isBackendImageUrl(value?: string): boolean {
  const safeValue = value?.trim() ?? "";

  return (
    safeValue.startsWith("http://") ||
    safeValue.startsWith("https://") ||
    safeValue.startsWith("data:image/") ||
    safeValue.startsWith("/") ||
    safeValue.startsWith("uploads/")
  );
}

export function resolveBackendAssetUrl(value?: string): string {
  const safeValue = value?.trim() ?? "";

  if (!safeValue) {
    return "";
  }

  if (
    safeValue.startsWith("http://") ||
    safeValue.startsWith("https://") ||
    safeValue.startsWith("data:") ||
    safeValue.startsWith("/")
  ) {
    return safeValue;
  }

  if (safeValue.startsWith("uploads/") || safeValue.startsWith("audio/")) {
    return `/${safeValue}`;
  }

  return safeValue;
}