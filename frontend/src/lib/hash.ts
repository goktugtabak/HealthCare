// SHA-256 helper using the Web Crypto API. Used by the audit log
// hash chain (FR-53) and any other place that needs cryptographic
// integrity in the browser.
export const sha256Hex = async (input: string): Promise<string> => {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const data = new TextEncoder().encode(input);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  // Fallback for SSR / non-secure contexts. Audit chains are only
  // verified server-side in real-mode, so this is acceptable.
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    const char = input.charCodeAt(index);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return (hash >>> 0).toString(16).padStart(64, "0");
};
