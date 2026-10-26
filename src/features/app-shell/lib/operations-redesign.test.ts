import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { getWorkspaceContext } from "./workspace-context";
import { OperationsBanner } from "@/components/ui/operations-banner";
import { HomeDisplayProvider } from "@/features/home/state/home-display-state";
import { Tools } from "@/features/home/components/tools";

describe("operations redesign", () => {
  it("keeps report detail in the reporting workspace without matching similar route prefixes", () => {
    expect(getWorkspaceContext("/bao-cao/12").label).toBe("Thông tin hiện trường");
    expect(getWorkspaceContext("/bao-cao-other").label).toBe("Không gian làm việc");
  });
  it("renders the operation heading, readable context and provided actions", () => {
    const html = renderToStaticMarkup(createElement(OperationsBanner, { eyebrow: "Điều phối", title: "Ưu tiên ứng cứu", description: "Kiểm tra thông tin" }, createElement("a", { href: "/bao-cao" }, "Báo cáo")));
    expect(html).toContain('aria-label="Điều phối"');
    expect(html).toContain("<h2");
    expect(html).toContain("Ưu tiên ứng cứu");
    expect(html).toContain('href="/bao-cao"');
  });
  it("offers all six weather layers as a native keyboard-accessible single-choice group", () => {
    const html = renderToStaticMarkup(createElement(HomeDisplayProvider, null, createElement(Tools)));
    expect((html.match(/type="radio"/g) ?? []).length).toBe(6);
    expect((html.match(/checked=""/g) ?? []).length).toBe(1);
    const selectedRadio = html.match(/<input[^>]*type="radio"[^>]*checked=""[^>]*>/)?.[0];
    expect(selectedRadio).toContain('value="wind"');
    expect(html).toContain("<fieldset>");
    expect(html).toContain("<legend");
    expect(html).toContain('role="switch"');
    expect(html).toContain('id="weather-statistics"');
    expect(html).not.toContain('role="menuitemradio"');
  });
});
