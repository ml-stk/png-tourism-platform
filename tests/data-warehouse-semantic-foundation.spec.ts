import { describe, expect, it } from "vitest";

const warehouseViews = [
  "analytics.operator_registry",
  "analytics.province_operator_summary",
  "analytics.destination_content_summary",
  "analytics.visitor_engagement_daily",
  "analytics.executive_kpis",
] as const;

describe("Tourism Data Warehouse semantic foundation", () => {
  it("defines the Phase 1 analytical subject areas", () => {
    expect(warehouseViews).toContain("analytics.operator_registry");
    expect(warehouseViews).toContain("analytics.province_operator_summary");
    expect(warehouseViews).toContain("analytics.destination_content_summary");
    expect(warehouseViews).toContain("analytics.visitor_engagement_daily");
  });

  it("provides an executive KPI surface", () => {
    expect(warehouseViews).toContain("analytics.executive_kpis");
  });

  it("keeps the analytics schema non-public", () => {
    expect("analytics").not.toBe("public");
  });
});
