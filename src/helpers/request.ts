import { useStore } from "../store";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
export const ADMIN_API = `${API_BASE_URL}/admin/v1`;

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

type Query = Record<string, string | number | boolean | null | undefined>;

interface RequestOptions extends Omit<RequestInit, "body"> {
  query?: Query;
  body?: unknown;
}

const buildUrl = (path: string, query?: Query) => {
  const url = new URL(`${ADMIN_API}${path}`);
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
};

export const request = async <T>(path: string, { query, body, headers, ...init }: RequestOptions = {}): Promise<T> => {
  const token = useStore.getState().token;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const response = await fetch(buildUrl(path, query), {
    ...init,
    headers: {
      Accept: "application/json",
      ...(body !== undefined && !isFormData ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers ?? {}),
    },
    body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
  });

  const contentType = response.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json") ? await response.json() : null;

  if (response.status === 401 && token) {
    useStore.getState().logout();
  }

  if (!response.ok) {
    throw new ApiError(data?.message || `Request failed (${response.status})`, response.status, data?.errors);
  }

  return data as T;
};

export const openFile = async (path: string, filename?: string) => {
  const token = useStore.getState().token;
  const response = await fetch(buildUrl(path), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    throw new ApiError(`Could not open file (${response.status})`, response.status);
  }

  const url = URL.createObjectURL(await response.blob());

  if (filename) {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
  } else {
    window.open(url, "_blank", "noopener");
  }

  setTimeout(() => URL.revokeObjectURL(url), 60_000);
};

export const errorMessage = (error: unknown) => {
  if (error instanceof ApiError && error.errors) {
    return Object.values(error.errors).flat()[0] ?? error.message;
  }
  return error instanceof Error ? error.message : "Something went wrong";
};
