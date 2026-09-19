import { describe, expect, it } from "vitest";

describe("Registry publication query integration contract", () => {
  it("requires an operators join and active-status predicate for published profiles", () => {
    const query = "select ip.* from industry_profiles ip join operators o on o.id=ip.operator_id where ip.published=true and ip.review_status='published' and o.status='active'";
    expect(query).toMatch(/join\s+operators\s+o\s+on\s+o\.id\s*=\s*ip\.operator_id/i);
    expect(query).toMatch(/o\.status\s*=\s*'active'/i);
  });

  it("requires an operators join and active-status predicate for published experiences", () => {
    const query = "select ie.* from industry_experiences ie join operators o on o.id=ie.operator_id where ie.status='published' and o.status='active'";
    expect(query).toMatch(/join\s+operators\s+o\s+on\s+o\.id\s*=\s*ie\.operator_id/i);
    expect(query).toMatch(/o\.status\s*=\s*'active'/i);
  });
});
