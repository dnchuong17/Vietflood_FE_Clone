import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { VietnamAddressPicker } from "./vietnam-address-picker";
import { DivisionCombobox } from "./division-combobox";

describe("VietnamAddressPicker form contract", () => {
  it("renders labeled visible inputs and separate canonical names, without mount changes", () => {
    const onChange = vi.fn();
    const html = renderToStaticMarkup(<VietnamAddressPicker idPrefix="report" value={{ province: "TP cũ", ward: "Xã cũ" }} onChange={onChange} requiredProvince requiredWard />);
    expect(html).toContain('for="report-province"');
    expect(html).toContain('for="report-ward"');
    expect(html).toContain('id="report-province" role="combobox"');
    expect(html).toContain('type="hidden" name="province" value="TP cũ"');
    expect(html).toContain('type="hidden" name="ward" value="Xã cũ"');
    expect(html.match(/ required=""/g)).toHaveLength(2);
    expect(onChange).not.toHaveBeenCalled();
    expect(html).not.toContain('name="street"');
  });
  it("disables ward until province is nonempty", () => {
    const html = renderToStaticMarkup(<VietnamAddressPicker idPrefix="new" value={{ province: "", ward: "" }} onChange={() => {}} />);
    expect(html).toMatch(/id="new-ward"[^>]*disabled=""/);
    expect(html).toMatch(/type="hidden" disabled="" name="ward"/);
    expect(html).not.toMatch(/id="new-province"[^>]*disabled=""/);
  });
  it("supports optional names, style hooks, preserved legacy names and disabled forms", () => {
    const html = renderToStaticMarkup(<VietnamAddressPicker idPrefix="edit" value={{ province: "Hà Tây", ward: "Xã cũ" }} onChange={() => {}} provinceName="addressProvince" wardName="addressWard" className="test-grid" inputClassName="test-input" disabled />);
    expect(html).toContain('name="addressProvince"');
    expect(html).toContain('name="addressWard"');
    expect(html).toContain("test-grid");
    expect(html).toContain("test-input");
    expect(html).toContain('value="Hà Tây"');
    expect(html).not.toContain('required=""');
    expect(html).toMatch(/id="edit-province"[^>]*disabled=""/);
  });
  it("offers explicit manual entry and accessible retry/status for a failed dataset", () => {
    const html = renderToStaticMarkup(<DivisionCombobox id="p" name="province" label="Tỉnh/Thành phố" value="Tên cũ" onChange={() => {}} options={[]} error="Không thể tải" onRetry={() => {}} />);
    expect(html).toContain('role="alert"');
    expect(html).toContain("Thử lại");
    expect(html).toContain("thủ công (địa chỉ cũ / mất kết nối)");
    expect(html).toContain("Giữ nguyên giá trị đã lưu: Tên cũ");
    expect(html).toContain('aria-label="Xóa Tỉnh/Thành phố"');
    expect(html).toContain('aria-describedby="p-status"');
  });
});
