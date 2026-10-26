function errorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback;
  const { message, error } = data as Record<string, unknown>;
  if (typeof message === "string" && message.trim()) return message;
  if (Array.isArray(message)) {
    const text = message.filter((item) => typeof item === "string" && item.trim()).join(", ");
    if (text) return text;
  }
  return typeof error === "string" && error.trim() ? error : fallback;
}

/** Preserve status so temporary connectivity failures never invalidate a session. */
export class ApiResponseError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "ApiResponseError";
  }
}

export function getResponseErrorStatus(data: unknown): number | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const record = data as Record<string, unknown>;
  const status = Number(record.statusCode ?? record.status);
  if (Number.isInteger(status) && status >= 400 && status <= 599) return status;
  if (record.error && typeof record.error === "object") return getResponseErrorStatus(record.error) ?? 500;
  if (record.success === false || record.ok === false || (typeof record.error === "string" && record.error.trim())) return 500;
  return null;
}

export function responseError(data: unknown, status: number, fallback: string): ApiResponseError {
  const record = data && typeof data === "object" ? data as Record<string, unknown> : null;
  const nested = record?.error && typeof record.error === "object" ? record.error : data;
  return new ApiResponseError(errorMessage(nested, errorMessage(data, fallback)), status);
}
