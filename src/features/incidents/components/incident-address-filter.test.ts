import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const source=readFileSync(new URL("./incident-dashboard.tsx",import.meta.url),"utf8");
describe("shared Vietnam incident/assignment filters",()=>{
 it("uses one controlled picker for all inherited analytics/export and assignment scopes",()=>{
  expect(source).toContain('import { VietnamAddressPicker } from "@/features/location/components/vietnam-address-picker"');
  expect(source).toContain('idPrefix={assignments ? "assignment-filter" : "incident-filter"}');
  expect(source).toContain('value={addressFilter}');
  expect(source).toContain('onChange={setAddressFilter}');
  expect(source).toContain('const [addressFilter, setAddressFilter] = useState({ province: "", ward: "" });');
  expect(source).toContain('province: String(form.get("province") ?? "").trim()');
  expect(source).toContain('ward: String(form.get("ward") ?? "").trim()');
 });
 it("retains explicit apply/reset and passes committed filters to analytics",()=>{
  expect(source).toContain('onSubmit={apply}');
  expect(source).toContain('setAddressFilter({ province: "", ward: "" });');
  expect(source).toContain('<IncidentAnalytics filters={analyticsFilters}');
  expect(source).not.toContain('<Input name="province"');
  expect(source).not.toContain('<Input name="ward"');
 });
});
