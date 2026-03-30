import { FinancialMovement, OrganizationSettings } from "@prisma/client";
import { addDays, differenceInCalendarDays, formatISO, isWithinInterval, startOfDay } from "date-fns";
import { toNumber } from "../common/decimal";

export type ForecastPoint = {
  date: string;
  inflows: number;
  outflows: number;
  balance: number;
};

export type ForecastResult = {
  currentCashBalance: number;
  projectedBalances: Record<30 | 60 | 90, number>;
  timeline: ForecastPoint[];
  firstNegativeDate: string | null;
  minimumBalance: number;
  runwayDays: number | null;
};

export function buildDeterministicForecast(
  movements: FinancialMovement[],
  _settings: OrganizationSettings,
  today = startOfDay(new Date()),
): ForecastResult {
  const realized = movements.filter((movement) => movement.status === "REALIZED");
  const planned = movements.filter((movement) => movement.status !== "REALIZED");

  const currentCashBalance = realized.reduce((acc, movement) => {
    const amount = toNumber(movement.amount);
    return acc + (movement.movementType === "INFLOW" ? amount : -amount);
  }, 0);

  const dayMap = new Map<string, { inflows: number; outflows: number }>();
  for (let offset = 0; offset <= 90; offset += 1) {
    dayMap.set(formatISO(addDays(today, offset), { representation: "date" }), {
      inflows: 0,
      outflows: 0,
    });
  }

  planned.forEach((movement) => {
    const date = startOfDay(movement.dueDate ?? movement.occurredAt ?? today);
    if (
      !isWithinInterval(date, {
        start: today,
        end: addDays(today, 90),
      })
    ) {
      return;
    }

    const key = formatISO(date, { representation: "date" });
    const entry = dayMap.get(key);
    if (!entry) return;

    const amount = toNumber(movement.amount);
    if (movement.movementType === "INFLOW") entry.inflows += amount;
    else entry.outflows += amount;
  });

  let runningBalance = currentCashBalance;
  let firstNegativeDate: string | null = null;
  let minimumBalance = currentCashBalance;
  const timeline: ForecastPoint[] = [];

  [...dayMap.entries()].forEach(([date, values]) => {
    runningBalance += values.inflows - values.outflows;
    minimumBalance = Math.min(minimumBalance, runningBalance);
    if (!firstNegativeDate && runningBalance < 0) firstNegativeDate = date;
    timeline.push({
      date,
      inflows: Number(values.inflows.toFixed(2)),
      outflows: Number(values.outflows.toFixed(2)),
      balance: Number(runningBalance.toFixed(2)),
    });
  });

  const getBalanceAt = (days: 30 | 60 | 90) =>
    timeline[Math.min(days, timeline.length - 1)]?.balance ?? currentCashBalance;

  const net90 = getBalanceAt(90) - currentCashBalance;
  const runwayDays =
    net90 >= 0
      ? null
      : Math.max(0, Math.round(currentCashBalance / Math.abs(net90 / 90)));

  return {
    currentCashBalance: Number(currentCashBalance.toFixed(2)),
    projectedBalances: {
      30: getBalanceAt(30),
      60: getBalanceAt(60),
      90: getBalanceAt(90),
    },
    timeline,
    firstNegativeDate,
    minimumBalance: Number(minimumBalance.toFixed(2)),
    runwayDays:
      firstNegativeDate !== null
        ? differenceInCalendarDays(new Date(firstNegativeDate), today)
        : runwayDays,
  };
}
