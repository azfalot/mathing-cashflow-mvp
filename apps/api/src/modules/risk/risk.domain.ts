import { FinancialMovement, OrganizationSettings, RiskLevel } from "@prisma/client";
import { addDays, formatISO } from "date-fns";
import { toNumber } from "../common/decimal";
import { buildDeterministicForecast } from "../forecasting/forecasting.domain";

type Horizon = 30 | 60 | 90;

export type RiskAssessmentResult = {
  summary: Array<{
    horizonDays: Horizon;
    tensionProbability: number;
    breakProbability: number;
    riskLevel: RiskLevel;
  }>;
  balanceRanges: Record<Horizon, { p10: number; p50: number; p90: number }>;
  minimumBalanceDistribution: number[];
  drivers: string[];
  recommendations: string[];
};

export function calculateRiskAssessment(
  movements: FinancialMovement[],
  settings: OrganizationSettings,
  runs = settings.monteCarloRuns,
  seed = 42,
): RiskAssessmentResult {
  const deterministic = buildDeterministicForecast(movements, settings);
  const thresholds: Horizon[] = [30, 60, 90];
  const outcome = new Map<Horizon, number[]>();
  const minimums: number[] = [];
  thresholds.forEach((horizon) => outcome.set(horizon, []));

  for (let run = 0; run < runs; run += 1) {
    const simulated = simulateMovements(movements, seed + run);
    const forecast = buildDeterministicForecast(simulated, settings);
    minimums.push(forecast.minimumBalance);
    thresholds.forEach((horizon) => {
      outcome.get(horizon)?.push(forecast.projectedBalances[horizon]);
    });
  }

  const summary = thresholds.map((horizon) => {
    const values = outcome.get(horizon) ?? [];
    const tensionThreshold = toNumber(settings.tensionThresholdAmount);
    const tensionProbability = probability(values, (value) => value <= tensionThreshold);
    const breakProbability = probability(values, (value) => value < 0);
    return {
      horizonDays: horizon,
      tensionProbability,
      breakProbability,
      riskLevel: toRiskLevel(Math.max(tensionProbability, breakProbability)),
    };
  });

  return {
    summary,
    balanceRanges: {
      30: percentileRange(outcome.get(30) ?? []),
      60: percentileRange(outcome.get(60) ?? []),
      90: percentileRange(outcome.get(90) ?? []),
    },
    minimumBalanceDistribution: minimums,
    drivers: explainDrivers(movements, deterministic),
    recommendations: explainRecommendations(movements, deterministic),
  };
}

function simulateMovements(movements: FinancialMovement[], seed: number) {
  let state = seed;
  const random = () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };

  return movements.map((movement) => {
    if (movement.status === "REALIZED") return movement;
    const cloned = { ...movement };
    const currentAmount = toNumber(movement.amount);
    let amount = currentAmount;
    let dueDate = movement.dueDate ? new Date(movement.dueDate) : null;

    if (movement.movementType === "INFLOW" && movement.status === "PENDING") {
      const delay = Math.round(random() * 12);
      dueDate = dueDate ? addDays(dueDate, delay) : addDays(new Date(), delay);
    }

    if (movement.movementType === "INFLOW" && movement.status === "FORECAST") {
      amount = currentAmount * (0.9 + random() * 0.25);
    }

    if (movement.movementType === "OUTFLOW" && ["PAYROLL", "TAX", "SUPPLIER"].includes(movement.category)) {
      amount = currentAmount * (1 + random() * 0.12);
    }

    return {
      ...cloned,
      amount: { toNumber: () => amount } as FinancialMovement["amount"],
      dueDate,
    };
  });
}

function percentileRange(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    p10: percentile(sorted, 0.1),
    p50: percentile(sorted, 0.5),
    p90: percentile(sorted, 0.9),
  };
}

function percentile(values: number[], pct: number) {
  if (values.length === 0) return 0;
  const index = Math.min(values.length - 1, Math.floor(values.length * pct));
  return Number(values[index]!.toFixed(2));
}

function probability(values: number[], predicate: (value: number) => boolean) {
  if (values.length === 0) return 0;
  return Number((((values.filter(predicate).length / values.length) * 100) || 0).toFixed(2));
}

function toRiskLevel(probabilityValue: number): RiskLevel {
  if (probabilityValue >= 60) return RiskLevel.CRITICAL;
  if (probabilityValue >= 35) return RiskLevel.HIGH;
  if (probabilityValue >= 15) return RiskLevel.MEDIUM;
  return RiskLevel.LOW;
}

function explainDrivers(
  movements: FinancialMovement[],
  deterministic: ReturnType<typeof buildDeterministicForecast>,
) {
  const drivers: string[] = [];
  const nextMonthOutflows = movements
    .filter((movement) => movement.movementType === "OUTFLOW" && movement.status !== "REALIZED")
    .filter((movement) => {
      const dueDate = movement.dueDate ?? movement.occurredAt;
      return dueDate ? dueDate <= addDays(new Date(), 30) : false;
    })
    .reduce((acc, movement) => acc + toNumber(movement.amount), 0);

  if (nextMonthOutflows > deterministic.currentCashBalance * 0.8) {
    drivers.push("La principal presión viene de una concentración de pagos en el corto plazo.");
  }

  const pendingInflows = movements.filter(
    (movement) => movement.movementType === "INFLOW" && movement.status === "PENDING",
  );
  if (pendingInflows.length > 0) {
    const largest = pendingInflows.map((movement) => toNumber(movement.amount)).sort((a, b) => b - a)[0]!;
    const total = pendingInflows.reduce((acc, movement) => acc + toNumber(movement.amount), 0);
    if (largest / total > 0.4) {
      drivers.push("Existe dependencia de pocos cobros grandes y sensibles a retrasos.");
    }
  }

  if (deterministic.firstNegativeDate) {
    drivers.push(
      `La proyección determinista entra en saldo negativo alrededor del ${formatISO(new Date(deterministic.firstNegativeDate), { representation: "date" })}.`,
    );
  }

  return drivers.length > 0
    ? drivers
    : ["El riesgo actual es contenido, aunque conviene seguir monitorizando cobros pendientes."];
}

function explainRecommendations(
  movements: FinancialMovement[],
  deterministic: ReturnType<typeof buildDeterministicForecast>,
) {
  const recommendations: string[] = [];
  const supplierPayment = movements.find(
    (movement) => movement.category === "SUPPLIER" && movement.movementType === "OUTFLOW",
  );

  if (supplierPayment) {
    recommendations.push("Valora aplazar pagos a proveedores para suavizar el valle de caja.");
  }

  if (deterministic.minimumBalance < 0) {
    recommendations.push("Prioriza adelantar cobros y reducir gasto discrecional en las próximas semanas.");
  }

  recommendations.push("Actualiza semanalmente la fecha esperada de los cobros pendientes más grandes.");
  return recommendations;
}
