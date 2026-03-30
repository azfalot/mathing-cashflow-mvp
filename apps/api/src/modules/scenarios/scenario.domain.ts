import { FinancialMovement } from "@prisma/client";
import type { ScenarioAction } from "@repo/shared/scenario";
import { toNumber } from "../common/decimal";

export function applyScenarioActions(
  movements: FinancialMovement[],
  actions: ScenarioAction[],
) {
  return movements.map((movement) => {
    let current = { ...movement };

    actions.forEach((action) => {
      if (action.movementId && action.movementId !== movement.id) return;

      switch (action.type) {
        case "DELAY_PAYMENT":
          if (current.movementType === "OUTFLOW" && current.dueDate && action.days) {
            current = {
              ...current,
              dueDate: new Date(current.dueDate.getTime() + action.days * 86400000),
            };
          }
          break;
        case "ACCELERATE_COLLECTION":
          if (current.movementType === "INFLOW" && current.dueDate && action.days) {
            current = {
              ...current,
              dueDate: new Date(current.dueDate.getTime() - action.days * 86400000),
            };
          }
          break;
        case "INCREASE_FORECAST_SALES":
          if (current.movementType === "INFLOW" && current.status === "FORECAST" && action.percentage) {
            const amount = toNumber(current.amount);
            current = {
              ...current,
              amount: { toNumber: () => amount * (1 + action.percentage! / 100) } as FinancialMovement["amount"],
            };
          }
          break;
        case "REDUCE_EXPENSE_CATEGORY":
          if (current.movementType === "OUTFLOW" && current.category === action.category && action.percentage) {
            const amount = toNumber(current.amount);
            current = {
              ...current,
              amount: { toNumber: () => amount * (1 - action.percentage! / 100) } as FinancialMovement["amount"],
            };
          }
          break;
        case "POSTPONE_INVESTMENT":
          if (current.category === "CAPEX" && current.dueDate && action.days) {
            current = {
              ...current,
              dueDate: new Date(current.dueDate.getTime() + action.days * 86400000),
            };
          }
          break;
        default:
          break;
      }
    });

    return current;
  });
}

export function createSyntheticMovements(actions: ScenarioAction[]) {
  return actions
    .filter((action) => action.type === "ADD_EXTRA_EXPENSE" && action.amount && action.dueDate)
    .map((action) => ({
      id: `scenario-${action.description ?? action.dueDate}`,
      organizationId: "scenario",
      sourceId: null,
      movementType: "OUTFLOW" as const,
      status: "FORECAST" as const,
      occurredAt: null,
      dueDate: new Date(action.dueDate!),
      amount: { toNumber: () => action.amount! } as FinancialMovement["amount"],
      currency: "EUR",
      category: "OTHER",
      subcategory: null,
      counterparty: "Escenario",
      description: action.description ?? "Gasto extraordinario",
      recurrenceGroupId: null,
      confidenceScore: null,
      rawReference: null,
      duplicateHash: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })) as FinancialMovement[];
}
