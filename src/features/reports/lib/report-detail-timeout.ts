export const REPORT_DETAIL_TIMEOUT_MS = 8_000;
export const REPORT_DETAIL_TIMEOUT_MESSAGE =
  "Không thể tải chi tiết báo cáo. Vui lòng kiểm tra kết nối và thử lại.";

export function withReportDetailTimeout<T>(
  promise: Promise<T>,
  timeoutMs = REPORT_DETAIL_TIMEOUT_MS,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(REPORT_DETAIL_TIMEOUT_MESSAGE));
    }, timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  });
}
