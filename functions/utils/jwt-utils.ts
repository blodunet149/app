// JWT utility functions
export const encodeBase64 = (str: string): string => {
  return btoa(unescape(encodeURIComponent(str)));
};

export const decodeBase64 = (str: string): string => {
  return decodeURIComponent(escape(atob(str)));
};

export const encodeBase64Url = (str: string): string => {
  return encodeBase64(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

export const decodeBase64Url = (str: string): string => {
  // Add padding if needed
  const padding = '='.repeat((4 - str.length % 4) % 4);
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/') + padding;
  return decodeBase64(base64);
};