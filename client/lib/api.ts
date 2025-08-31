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
    // Temporarily bypass Clerk auth for debugging
    console.log("=== API FETCH START ===");
    console.log("Making API request to:", input);
    console.log("Method:", init.method || 'GET');
    console.log("Headers:", init.headers);
    console.log("Body:", init.body);
    
    const headers = new Headers(init.headers || {});
    if (
      !headers.has("Content-Type") &&
      init.body &&
      !(init.body instanceof FormData)
    ) {
      headers.set("Content-Type", "application/json");
    }
    
    // Add base URL if needed
    const url = typeof input === 'string' && input.startsWith('/api') 
      ? `http://localhost:8080${input}`
      : input;
    
    console.log("Final URL:", url);
    console.log("Final headers:", Object.fromEntries(headers.entries()));
    console.log("About to make fetch request...");
    
    const response = await fetch(url, { ...init, headers });
    console.log("Response received!");
    console.log("Response status:", response.status);
    console.log("Response headers:", Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log("Error response body:", errorText);
      console.log("=== API FETCH ERROR ===");
    } else {
      console.log("=== API FETCH SUCCESS ===");
    }
    
    return response;
  } catch (e) {
    console.error("=== API FETCH EXCEPTION ===");
    console.error("API fetch error:", e);
    console.error("Error type:", typeof e);
    console.error("Error constructor:", e.constructor.name);
    throw e;
  }
}
