import { describe, expect, it } from "vitest";

type Operator = {
  id: string;
  status: "draft" | "pending_review" | "active" | "rejected" | "suspended" | "closed";
  complianceStatus: "compliant" | "non_compliant";
};

const demoOperators: Operator[] = [
  { id: "png-operator-001", status: "draft", complianceStatus: "compliant" },
  { id: "png-operator-002", status: "pending_review", complianceStatus: "compliant" },
  { id: "png-operator-003", status: "active", complianceStatus: "compliant" },
  { id: "png-operator-004", status: "rejected", complianceStatus: "non_compliant" },
  { id: "png-operator-005", status: "suspended", complianceStatus: "compliant" },
  { id: "png-operator-006", status: "closed", complianceStatus: "compliant" },
];

describe("Registry demo evaluation workload", () => {
  it("contains every governed lifecycle state", () => {
    expect(new Set(demoOperators.map((operator) => operator.status))).toEqual(
      new Set(["draft", "pending_review", "active", "rejected", "suspended", "closed"]),
    );
  });

  it("models the critical revocation case", () => {
    const suspendedCompliant = demoOperators.find((operator) => operator.status === "suspended");
    expect(suspendedCompliant?.complianceStatus).toBe("compliant");
    expect(suspendedCompliant?.status).not.toBe("active");
  });

  it("produces an active-only consumer evaluation set", () => {
    const visible = demoOperators.filter((operator) => operator.status === "active");
    expect(visible).toHaveLength(1);
    expect(visible.every((operator) => operator.complianceStatus === "compliant")).toBe(true);
  });
});
