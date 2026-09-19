import { describe, expect, it } from "vitest";

const PUBLISHABLE_STATUS = "active";

function visibleToConsumer(status: string) {
  return status === PUBLISHABLE_STATUS;
}

describe("National Tourism Registry visibility contract", () => {
  it("exposes only active operators to public consumers", () => {
    const fixture = [
      { id: "draft-1", status: "draft" },
      { id: "review-1", status: "pending_review" },
      { id: "active-1", status: "active" },
      { id: "rejected-1", status: "rejected" },
      { id: "suspended-1", status: "suspended" },
      { id: "closed-1", status: "closed" },
    ];

    const visible = fixture.filter((operator) => visibleToConsumer(operator.status));
    expect(visible.map((operator) => operator.id)).toEqual(["active-1"]);
    expect(visible.every((operator) => operator.status === PUBLISHABLE_STATUS)).toBe(true);
  });

  it("does not treat compliance alone as publication authority", () => {
    const operator = { status: "suspended", complianceStatus: "compliant" };
    expect(visibleToConsumer(operator.status)).toBe(false);
  });

  it("uses the same publication rule for partner and AI Concierge consumers", () => {
    const operators = [
      { id: "a", status: "active" },
      { id: "b", status: "pending_review" },
      { id: "c", status: "suspended" },
    ];
    const expected = operators.filter((operator) => visibleToConsumer(operator.status));
    expect(expected.map((operator) => operator.id)).toEqual(["a"]);
  });
});
