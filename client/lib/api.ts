declare global {
  interface Window {
    Clerk?: any;
  }
}

export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
) {
  try {
    const token = await window.Clerk?.session?.getToken?.();
    const headers = new Headers(init.headers || {});
    if (
      !headers.has("Content-Type") &&
      init.body &&
      !(init.body instanceof FormData)
    ) {
      headers.set("Content-Type", "application/json");
    }
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return fetch(input, { ...init, headers });
  } catch (e) {
    return fetch(input, init);
  }
}
