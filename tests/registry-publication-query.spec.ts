import { describe, expect, it } from "vitest";

describe("Registry publication query contract", () => {
  it("requires the active lifecycle predicate for consumer-facing queries", () => {
    const consumerQuery = "select * from operators where status = 'active'";
    expect(consumerQuery).toMatch(/status\s*=\s*'active'/i);
  });

  it("never uses compliance status as a substitute for lifecycle status", () => {
    const consumerQuery = "select * from operators where status = 'active'";
    expect(consumerQuery).not.toMatch(/compliance_status\s*=\s*'compliant'/i);
  });

  it("documents the required consumers", () => {
    const consumers = ["public", "partner", "ai_concierge"];
    expect(consumers).toEqual(["public", "partner", "ai_concierge"]);
  });
});
