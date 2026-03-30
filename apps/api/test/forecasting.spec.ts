import { describe, expect, it } from "vitest";
import { buildDeterministicForecast } from "../src/modules/forecasting/forecasting.domain";

describe("buildDeterministicForecast", () => {
  it("builds a 90-day timeline and detects negative balances", () => {
    const result = buildDeterministicForecast(
      [
        {
          id: "1",
          organizationId: "org",
          sourceId: null,
          movementType: "INFLOW",
          status: "REALIZED",
          occurredAt: new Date("2026-03-01"),
          dueDate: new Date("2026-03-01"),
          amount: { toNumber: () => 1000 },
          currency: "EUR",
          category: "SALES",
          subcategory: null,
          counterparty: null,
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
          dueDate: new Date("2026-03-15"),
          amount: { toNumber: () => 1500 },
          currency: "EUR",
          category: "SUPPLIER",
          subcategory: null,
          counterparty: null,
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
        tensionThresholdAmount: { toNumber: () => 200 },
        tensionThresholdDays: 14,
        monteCarloRuns: 100,
        defaultCurrency: "EUR",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never,
      new Date("2026-03-10"),
    );

    expect(result.timeline).toHaveLength(91);
    expect(result.firstNegativeDate).toBeTruthy();
    expect(result.minimumBalance).toBeLessThan(0);
  });
});
