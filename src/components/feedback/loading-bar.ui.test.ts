import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./loading-bar.tsx", import.meta.url), "utf8");

describe("loading bar UI", () => {
  it("uses BarLoader from react-spinners with semantic loading markup", () => {
    expect(source).toContain('import BarLoader from "react-spinners/BarLoader"');
    expect(source).toContain("<BarLoader");
    expect(source).toContain('color="var(--primary)"');
    expect(source).toContain('role="status"');
    expect(source).toContain('aria-live="polite"');
  });
});
