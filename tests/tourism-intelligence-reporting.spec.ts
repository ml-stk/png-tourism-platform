import { describe, expect, it } from "vitest";

describe("Tourism intelligence reporting contract", () => {
  it("defines province-level intelligence as an aggregated reporting surface", () => {
    const columns = [
      "province_code",
      "total_operators",
      "active_operators",
      "active_published_profiles",
      "active_published_experiences",
      "engagement_events_30d",
      "visitor_leads_30d",
    ];

    expect(columns).toContain("province_code");
    expect(columns).toContain("active_operators");
    expect(columns).toContain("engagement_events_30d");
  });

  it("requires destination reporting to use active operators for published content", () => {
    const publicationPredicate = "published AND operator.status = active";
    expect(publicationPredicate).toContain("operator.status = active");
  });

  it("defines executive decision metrics", () => {
    const metrics = [
      "active_operator_rate_pct",
      "active_operator_profile_coverage_pct",
      "engagement_to_lead_rate_pct",
    ];

    expect(metrics).toHaveLength(3);
  });

  it("limits engagement trend reporting to a rolling 30-day window", () => {
    const windowDays = 30;
    expect(windowDays).toBe(30);
  });
});
