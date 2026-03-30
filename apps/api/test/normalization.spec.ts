import { describe, expect, it } from "vitest";
import { NormalizationService } from "../src/modules/data-import/normalization.service";

describe("NormalizationService", () => {
  const service = new NormalizationService();

  it("normalizes rows and captures invalid data", () => {
    const result = service.normalizeRows([
      {
        date: "2026-03-12",
        amount: "1200",
        movementType: "inflow",
        status: "pending",
        currency: "EUR",
        category: "ventas",
      },
      {
        date: "not-a-date",
        amount: "abc",
        movementType: "",
        status: "",
        currency: "",
        category: "",
      },
    ]);

    expect(result.valid).toHaveLength(1);
    expect(result.valid[0]?.category).toBe("SALES");
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.messages).toContain("amount obligatorio y numérico");
  });
});
