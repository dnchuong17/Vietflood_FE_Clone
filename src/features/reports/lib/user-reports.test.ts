import { describe, expect, it } from "vitest";

import { filterReportsByUserId } from "./user-reports";

describe("selected user report helpers", () => {
  it("matches reports by normalized backend user identifiers", () => {
    expect(
      filterReportsByUserId(
        [
          { id: 1, userId: 7, description: "camel user" },
          { id: 2, user_id: 7, description: "snake user" },
          { id: 3, user: { id: 7 }, description: "nested user" },
          { id: 4, userId: 9, description: "other user" },
          { id: 5, description: "missing user" },
        ],
        7,
      ).map((report) => report.id),
    ).toEqual([1, 2, 3]);
  });
});
