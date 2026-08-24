const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

export class ApiError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(
    message: string,
    code: string = "API_ERROR",
    status: number = 500,
    details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("xoxo_auth_token");
}

export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  // Only attach authorization header to relative endpoints or same API_BASE_URL
  const isInternalUrl = endpoint.startsWith("/") || endpoint.startsWith(API_BASE_URL);

  if (token && isInternalUrl) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type");
  let data: Record<string, unknown> | string | null = null;
  if (contentType && contentType.includes("application/json")) {
    data = (await response.json()) as Record<string, unknown>;
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    let errorMessage = response.statusText || `Request failed with status ${response.status}`;
    let errorCode = `HTTP_${response.status}`;
    let errorDetails: unknown = null;

    if (typeof data === "object" && data !== null) {
      const dataObj = data as Record<string, unknown>;

      if (dataObj.error) {
        if (typeof dataObj.error === "object" && dataObj.error !== null) {
          const err = dataObj.error as Record<string, unknown>;
          errorMessage = (err.message as string) || errorMessage;
          errorCode = (err.code as string) || errorCode;
          errorDetails = err.details !== undefined ? err.details : dataObj.error;
        } else if (typeof dataObj.error === "string") {
          errorMessage = dataObj.error;
        }
      } else if (dataObj.detail !== undefined) {
        errorDetails = dataObj.detail;
        if (typeof dataObj.detail === "string") {
          errorMessage = dataObj.detail;
        } else if (Array.isArray(dataObj.detail)) {
          const messages = dataObj.detail.map((err) => {
            if (typeof err === "string") return err;
            if (err && typeof err === "object") {
              const obj = err as Record<string, unknown>;
              const loc = Array.isArray(obj.loc)
                ? obj.loc.filter((l) => l !== "body").join(".")
                : "";
              const msg = (obj.msg as string) || (obj.message as string) || JSON.stringify(obj);
              return loc ? `${loc}: ${msg}` : String(msg);
            }
            return String(err);
          });
          errorMessage = messages.filter(Boolean).join("; ") || errorMessage;
        } else if (dataObj.detail && typeof dataObj.detail === "object") {
          const detailObj = dataObj.detail as Record<string, unknown>;
          errorMessage =
            (detailObj.message as string) ||
            (detailObj.msg as string) ||
            JSON.stringify(dataObj.detail);
        }
      } else if (typeof dataObj.message === "string") {
        errorMessage = dataObj.message;
      }
    } else if (typeof data === "string" && data.trim()) {
      errorMessage = data;
    }

    throw new ApiError(errorMessage, errorCode, response.status, errorDetails);
  }

  return data as T;
}

export const api = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    apiClient<T>(endpoint, { ...options, method: "GET" }),
  post: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    apiClient<T>(endpoint, {
      ...options,
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    apiClient<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(endpoint: string, options?: RequestInit) =>
    apiClient<T>(endpoint, { ...options, method: "DELETE" }),
};
