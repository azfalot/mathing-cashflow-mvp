import { describe, expect, it } from "vitest";
import { calculateRiskAssessment } from "../src/modules/risk/risk.domain";

describe("calculateRiskAssessment", () => {
  it("returns interpretable risk metrics", () => {
    const result = calculateRiskAssessment(
      [
        {
          id: "1",
          organizationId: "org",
          sourceId: null,
          movementType: "INFLOW",
          status: "REALIZED",
          occurredAt: new Date("2026-03-01"),
          dueDate: new Date("2026-03-01"),
          amount: { toNumber: () => 12000 },
          currency: "EUR",
          category: "SALES",
          subcategory: null,
          counterparty: "Cliente",
          description: null,
          recurrenceGroupId: null,
          confidenceScore: null,
          rawReference: null,
          duplicateHash: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "2",
          organizationId: "org",
          sourceId: null,
          movementType: "OUTFLOW",
          status: "PENDING",
          occurredAt: null,
          dueDate: new Date("2026-03-20"),
          amount: { toNumber: () => 18000 },
          currency: "EUR",
          category: "SUPPLIER",
          subcategory: null,
          counterparty: "Proveedor",
          description: null,
          recurrenceGroupId: null,
          confidenceScore: null,
          rawReference: null,
          duplicateHash: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as never,
      {
        id: "settings",
        organizationId: "org",
        tensionThresholdAmount: { toNumber: () => 5000 },
        tensionThresholdDays: 14,
        monteCarloRuns: 50,
        defaultCurrency: "EUR",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never,
      50,
      1,
    );

    expect(result.summary).toHaveLength(3);
    expect(result.summary[2]?.breakProbability).toBeGreaterThanOrEqual(0);
    expect(result.drivers.length).toBeGreaterThan(0);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it("flags tension when there is a temporary cash valley before the horizon closes", () => {
    const result = calculateRiskAssessment(
      [
        {
          id: "1",
          organizationId: "org",
          sourceId: null,
          movementType: "INFLOW",
          status: "REALIZED",
          occurredAt: new Date("2026-03-01"),
          dueDate: new Date("2026-03-01"),
          amount: { toNumber: () => 59100 },
          currency: "EUR",
          category: "SALES",
          subcategory: null,
          counterparty: "Cliente",
          description: null,
          recurrenceGroupId: null,
          confidenceScore: null,
          rawReference: null,
          duplicateHash: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "2",
          organizationId: "org",
          sourceId: null,
          movementType: "OUTFLOW",
          status: "PENDING",
          occurredAt: null,
          dueDate: new Date("2026-04-07"),
          amount: { toNumber: () => 31000 },
          currency: "EUR",
          category: "PAYROLL",
          subcategory: null,
          counterparty: "Nominas",
          description: null,
          recurrenceGroupId: null,
          confidenceScore: null,
          rawReference: null,
          duplicateHash: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "3",
          organizationId: "org",
          sourceId: null,
          movementType: "INFLOW",
          status: "PENDING",
          occurredAt: null,
          dueDate: new Date("2026-04-09"),
          amount: { toNumber: () => 35000 },
          currency: "EUR",
          category: "SALES",
          subcategory: null,
          counterparty: "Cliente grande",
          description: null,
          recurrenceGroupId: null,
          confidenceScore: null,
          rawReference: null,
          duplicateHash: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as never,
      {
        id: "settings",
        organizationId: "org",
        tensionThresholdAmount: { toNumber: () => 30000 },
        tensionThresholdDays: 14,
        monteCarloRuns: 25,
        defaultCurrency: "EUR",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never,
      25,
      1,
    );

    expect(result.summary[0]?.tensionProbability).toBeGreaterThan(0);
    expect(result.summary[0]?.riskLevel).not.toBe("LOW");
    expect(result.balanceRanges[30].p50).toBeGreaterThan(30000);
  });
});
