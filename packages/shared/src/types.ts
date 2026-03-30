export type Role = "ADMIN" | "ANALYST";
export type SourceType = "CSV" | "ERP" | "BANK" | "MANUAL" | "API";
export type ImportStatus = "PENDING" | "COMPLETED" | "FAILED" | "PARTIAL";
export type MovementType = "INFLOW" | "OUTFLOW";
export type MovementStatus = "REALIZED" | "PENDING" | "FORECAST";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type DashboardSummary = {
  currentCashBalance: number;
  projectedBalances: Record<30 | 60 | 90, number>;
  riskByHorizon: Array<{
    horizonDays: 30 | 60 | 90;
    tensionProbability: number;
    breakProbability: number;
    riskLevel: RiskLevel;
  }>;
  timeline: Array<{
    date: string;
    balance: number;
    inflows: number;
    outflows: number;
  }>;
  criticalPayments: Array<{
    id: string;
    dueDate: string;
    amount: number;
    counterparty: string | null;
    category: string;
  }>;
  relevantInflows: Array<{
    id: string;
    dueDate: string;
    amount: number;
    counterparty: string | null;
    category: string;
  }>;
  marketSignals: Array<{
    id: string;
    title: string;
    signalDate: string;
    sourceName: string;
    description: string | null;
    sector: string | null;
    impactScore: number | null;
  }>;
  drivers: string[];
  recommendations: string[];
};
