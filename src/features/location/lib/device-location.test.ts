import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getDeviceLocation, getDeviceLocationError } from "./device-location";

const getCurrentPosition = vi.fn();
const position = { coords: { latitude: 10.77, longitude: 106.7 } };

describe("device location", () => {
  beforeEach(() => {
    getCurrentPosition.mockReset();
    vi.stubGlobal("window", { isSecureContext: true });
    vi.stubGlobal("navigator", { geolocation: { getCurrentPosition } });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("gets a bounded network position without requiring a GPS receiver", async () => {
    getCurrentPosition.mockImplementation((success) => success(position));
    await expect(getDeviceLocation()).resolves.toEqual(position);
    expect(getCurrentPosition).toHaveBeenCalledWith(expect.any(Function), expect.any(Function), {
      enableHighAccuracy: false, timeout: 10000, maximumAge: 60000,
    });
  });

  it.each([2, 3])("retries with high accuracy for error %s", async (code) => {
    getCurrentPosition.mockImplementationOnce((_success, failure) => failure({ code }))
      .mockImplementationOnce((success) => success(position));
    await expect(getDeviceLocation()).resolves.toEqual(position);
    expect(getCurrentPosition.mock.calls[1][2].enableHighAccuracy).toBe(true);
  });

  it("does not repeat a denied permission request", async () => {
    getCurrentPosition.mockImplementation((_success, failure) => failure({ code: 1 }));
    await expect(getDeviceLocation()).rejects.toEqual({ code: 1 });
    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
    expect(getDeviceLocationError({ code: 1 })).toContain("Quyền vị trí bị chặn");
  });

  it("reports a timeout after both attempts fail", async () => {
    getCurrentPosition.mockImplementation((_success, failure) => failure({ code: 3 }));
    await expect(getDeviceLocation()).rejects.toEqual({ code: 3 });
    expect(getCurrentPosition).toHaveBeenCalledTimes(2);
    expect(getDeviceLocationError({ code: 3 })).toContain("quá lâu");
  });

  it("explains HTTPS requirements before requesting permission", async () => {
    vi.stubGlobal("window", { isSecureContext: false });
    await expect(getDeviceLocation()).rejects.toThrow("HTTPS");
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  it("handles browsers without location support", async () => {
    vi.stubGlobal("navigator", {});
    await expect(getDeviceLocation()).rejects.toThrow("không hỗ trợ");
  });
});
