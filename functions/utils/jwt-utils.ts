// JWT utility functions
export const encodeBase64 = (bytes: Uint8Array): string => {
  const binary = Array.from(bytes).map(byte => String.fromCharCode(byte)).join('');
  return btoa(binary);
};

export const decodeBase64 = (str: string): Uint8Array => {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

export const encodeBase64Url = (str: string): string => {
  // Convert string to bytes first
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  const base64 = encodeBase64(bytes);
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

export const decodeBase64Url = (str: string): Uint8Array => {
  // Add padding if needed
  const padding = '='.repeat((4 - str.length % 4) % 4);
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/') + padding;
  return decodeBase64(base64);
};