export type ScenarioActionType =
  | "DELAY_PAYMENT"
  | "ACCELERATE_COLLECTION"
  | "INCREASE_FORECAST_SALES"
  | "REDUCE_EXPENSE_CATEGORY"
  | "ADD_EXTRA_EXPENSE"
  | "POSTPONE_INVESTMENT";

export type ScenarioAction = {
  type: ScenarioActionType;
  movementId?: string;
  category?: string;
  days?: number;
  percentage?: number;
  amount?: number;
  dueDate?: string;
  description?: string;
};
