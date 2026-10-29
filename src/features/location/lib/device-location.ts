export function getDeviceLocationError(error: unknown): string {
  const code = (error as { code?: number } | null)?.code;
  if (code === 1) {
    return "Quyền vị trí bị chặn. Hãy cho phép vị trí trong cài đặt trình duyệt và bật dịch vụ định vị trên thiết bị.";
  }
  if (code === 3) {
    return "Lấy vị trí quá lâu. Hãy bật dịch vụ định vị và thử lại ở nơi có tín hiệu tốt hơn.";
  }
  return error instanceof Error
    ? error.message
    : "Không thể xác định vị trí. Hãy bật dịch vụ định vị trên thiết bị và thử lại.";
}

export async function getDeviceLocation(): Promise<GeolocationPosition> {
  if (!window.isSecureContext) {
    throw new Error("GPS cần kết nối HTTPS hoặc localhost. Hãy mở trang qua HTTPS để dùng vị trí.");
  }
  if (!navigator.geolocation) {
    throw new Error("Trình duyệt này không hỗ trợ định vị.");
  }

  const request = (enableHighAccuracy: boolean) =>
    new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy,
        timeout: 10000,
        maximumAge: 60000,
      });
    });

  try {
    // Network positioning works indoors and on computers without a GPS receiver.
    return await request(false);
  } catch (error) {
    const code = (error as GeolocationPositionError).code;
    if (code !== 2 && code !== 3) throw error;
    return request(true);
  }
}
