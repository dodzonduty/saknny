export interface APIResponse<T = any> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1").replace("localhost", "127.0.0.1");

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<APIResponse<T>> {
  try {
    const defaultHeaders: HeadersInit = {
      "Content-Type": "application/json",
    };

    // If we have a token, add it to the headers
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      if (token) {
        defaultHeaders.Authorization = `Bearer ${token}`;
      }
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    const data = await response.json();
    
    // If the backend returns a successful shape but it's an error response
    if (data && typeof data.success !== 'undefined') {
        return data as APIResponse<T>;
    }

    // Fallback if the response isn't formatted as APIResponse
    if (!response.ok) {
      return { success: false, data: null, error: data.error || "Request failed" };
    }

    return { success: true, data: data.data, error: null };
  } catch (error: any) {
    return { success: false, data: null, error: error.message || "Network error" };
  }
}

export async function apiUploadFile<T>(
  endpoint: string,
  formData: FormData
): Promise<APIResponse<T>> {
  try {
    const headers: HeadersInit = {};
    
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    // DO NOT set Content-Type for FormData, the browser will set it with the correct boundary
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers,
      body: formData,
    });

    const data = await response.json();
    
    // If the backend returns a successful shape but it's an error response
    if (data && typeof data.success !== 'undefined') {
      return data;
    }

    if (!response.ok) {
      return { success: false, data: null, error: data.detail || "Upload failed" };
    }

    return { success: true, data, error: null };
  } catch (error: any) {
    return { success: false, data: null, error: error.message || "Network error" };
  }
}
