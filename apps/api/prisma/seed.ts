import { PrismaClient, Prisma, Role } from "@prisma/client";
import { hash } from "bcryptjs";
import { addDays, subDays } from "date-fns";

const prisma = new PrismaClient();

type SignalSeed = {
  signalType: string;
  sourceName: string;
  url: string;
  geography: string;
  sector: string | null;
  impactScore: number;
  fallbackTitle: string;
  fallbackDate: string;
  fallbackDescription: string;
};

const SIGNAL_SOURCES: SignalSeed[] = [
  {
    signalType: "INTEREST_RATE",
    sourceName: "ECB Data Portal",
    url: "https://data.ecb.europa.eu/key-figures/ecb-interest-rates-and-exchange-rates/key-ecb-interest-rates",
    geography: "Euro area",
    sector: null,
    impactScore: 0.82,
    fallbackTitle: "Key ECB interest rates",
    fallbackDate: "2025-06-11",
    fallbackDescription:
      "La pagina oficial del ECB muestra 2.15% para main refinancing operations, 2.40% para marginal lending facility y 2.00% para deposit facility.",
  },
  {
    signalType: "BANKRUPTCY_TREND",
    sourceName: "Eurostat",
    url: "https://ec.europa.eu/eurostat/web/products-eurostat-news/w/ddn-20250224-1",
    geography: "EU",
    sector: "Industry",
    impactScore: 0.76,
    fallbackTitle: "Bankruptcies slightly down and registrations up in Q4 2024",
    fallbackDate: "2025-02-24",
    fallbackDescription:
      "Eurostat indica que las quiebras empresariales bajaron 0.7% trimestral en Q4 2024, aunque repuntaron en industria y actividades sociales.",
  },
  {
    signalType: "PRODUCER_PRICE",
    sourceName: "Eurostat",
    url: "https://ec.europa.eu/eurostat/web/products-euro-indicators/w/4-03102024-ap",
    geography: "Euro area",
    sector: "Industry",
    impactScore: 0.68,
    fallbackTitle:
      "Industrial producer prices up by 0.6% in the euro area and by 0.4% in the EU",
    fallbackDate: "2024-10-03",
    fallbackDescription:
      "Eurostat reporto un aumento mensual de 0.6% en precios industriales del area euro y 1.5% en Espana, con energia como principal impulsor.",
  },
];

async function main() {
  await resetDatabase();

  const hashedPassword = await hash("Demo1234!", 10);
  const signals = await fetchExternalSignals();
  await prisma.externalSignal.createMany({
    data: signals,
  });

  await seedOrganizationCase({
    name: "Acme Industrial",
    adminEmail: "admin@demo.local",
    analystEmail: "analyst@demo.local",
    sector: "Industry",
    country: "ES",
    currency: "EUR",
    threshold: 12000,
    monteCarloRuns: 400,
    realizedInflows: [28000, 22000, 24000, 19000, 17000],
    realizedOutflows: [14000, 9000, 6200, 7800, 9500],
    pendingInflows: [16000, 22000, 18000, 15000],
    pendingOutflows: [14500, 13000, 6300, 11200, 21000, 15000],
    forecastInflows: [12000, 14000, 14500, 15000],
    forecastOutflows: [4200, 4800, 0, 0],
    counterparties: ["Cliente Norte", "Grupo Delta", "Cliente Atlas", "Logisur", "Tecnometal"],
  });

  await seedOrganizationCase({
    name: "Transit Flow Logistics",
    adminEmail: "admin.logistics@demo.local",
    analystEmail: "analyst.logistics@demo.local",
    sector: "Transportation",
    country: "ES",
    currency: "EUR",
    threshold: 18000,
    monteCarloRuns: 500,
    realizedInflows: [42000, 39000, 41000, 36500, 33000],
    realizedOutflows: [28000, 26000, 24500, 25200, 28700],
    pendingInflows: [35000, 29000, 27000, 26000],
    pendingOutflows: [31000, 12000, 14500, 18500, 22000, 27000],
    forecastInflows: [26000, 25500, 25000, 24800],
    forecastOutflows: [7200, 7800, 8100, 8600],
    counterparties: ["Autoparts Iberia", "RetailHub", "Mercabarna", "FreshCargo", "PortLink"],
  });

  await seedOrganizationCase({
    name: "Northstar Advisory",
    adminEmail: "admin.advisory@demo.local",
    analystEmail: "analyst.advisory@demo.local",
    sector: "Services B2B",
    country: "ES",
    currency: "EUR",
    threshold: 8000,
    monteCarloRuns: 350,
    realizedInflows: [18000, 21000, 17500, 22000, 16000],
    realizedOutflows: [11000, 9800, 10200, 10900, 11300],
    pendingInflows: [9000, 14000, 12500, 11800],
    pendingOutflows: [11600, 6500, 7200, 6800, 9000, 12400],
    forecastInflows: [13000, 13200, 13600, 14100],
    forecastOutflows: [3000, 3400, 3600, 3900],
    counterparties: ["Helix Legal", "Futura Tech", "Iberia Capital", "BioBridge", "Lambda Ops"],
  });

  console.log("Seed completada. Usuarios demo:");
  console.log("  admin@demo.local / Demo1234!");
  console.log("  admin.logistics@demo.local / Demo1234!");
  console.log("  admin.advisory@demo.local / Demo1234!");
}

async function resetDatabase() {
  await prisma.importRowError.deleteMany();
  await prisma.financialMovement.deleteMany();
  await prisma.dataSource.deleteMany();
  await prisma.scenarioSimulation.deleteMany();
  await prisma.riskAssessment.deleteMany();
  await prisma.cashPositionSnapshot.deleteMany();
  await prisma.externalSignal.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.organizationSettings.deleteMany();
  await prisma.organizationProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();
}

async function fetchExternalSignals() {
  const scraped = await Promise.all(
    SIGNAL_SOURCES.map(async (source) => {
      try {
        const response = await fetch(source.url);
        const html = await response.text();
        const title =
          matchFirst(html, /<h1[^>]*>\s*([^<]+?)\s*<\/h1>/i) ??
          matchFirst(html, /<title[^>]*>\s*([^<]+?)\s*<\/title>/i) ??
          source.fallbackTitle;
        const published =
          matchFirst(html, /News articles\s+([0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4})/i) ??
          matchFirst(html, /Euro indicators\s+([0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4})/i) ??
          matchFirst(html, /([0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4})/i) ??
          source.fallbackDate;
        const paragraph =
          matchFirst(html, /<p[^>]*>\s*([^<]{60,500})<\/p>/i) ?? source.fallbackDescription;

        return {
          signalType: source.signalType,
          sourceName: source.sourceName,
          signalDate: parseDate(published, source.fallbackDate),
          geography: source.geography,
          sector: source.sector,
          title: cleanText(title),
          description: cleanText(paragraph),
          sentimentScore: null,
          impactScore: source.impactScore,
          metadataJson: {
            url: source.url,
            scrapedAt: new Date().toISOString(),
          },
        };
      } catch {
        return {
          signalType: source.signalType,
          sourceName: source.sourceName,
          signalDate: new Date(source.fallbackDate),
          geography: source.geography,
          sector: source.sector,
          title: source.fallbackTitle,
          description: source.fallbackDescription,
          sentimentScore: null,
          impactScore: source.impactScore,
          metadataJson: {
            url: source.url,
            fallback: true,
          },
        };
      }
    }),
  );

  return scraped;
}

async function seedOrganizationCase(input: {
  name: string;
  adminEmail: string;
  analystEmail: string;
  sector: string;
  country: string;
  currency: string;
  threshold: number;
  monteCarloRuns: number;
  realizedInflows: number[];
  realizedOutflows: number[];
  pendingInflows: number[];
  pendingOutflows: number[];
  forecastInflows: number[];
  forecastOutflows: number[];
  counterparties: string[];
}) {
  const organization = await prisma.organization.create({
    data: {
      name: input.name,
      profile: {
        create: {
          sector: input.sector,
          currency: input.currency,
          country: input.country,
          fiscalCalendarType: "STANDARD",
        },
      },
      settings: {
        create: {
          tensionThresholdAmount: new Prisma.Decimal(input.threshold),
          tensionThresholdDays: 14,
          monteCarloRuns: input.monteCarloRuns,
          defaultCurrency: input.currency,
        },
      },
    },
  });

  const [admin, analyst] = await Promise.all([
    prisma.user.create({
      data: {
        email: input.adminEmail,
        fullName: `Admin ${input.name}`,
        passwordHash: await hash("Demo1234!", 10),
      },
    }),
    prisma.user.create({
      data: {
        email: input.analystEmail,
        fullName: `Analyst ${input.name}`,
        passwordHash: await hash("Demo1234!", 10),
      },
    }),
  ]);

  await prisma.membership.createMany({
    data: [
      { userId: admin.id, organizationId: organization.id, role: Role.ADMIN },
      { userId: analyst.id, organizationId: organization.id, role: Role.ANALYST },
    ],
  });

  const createMovement = (
    date: Date,
    amount: number,
    category: string,
    counterparty: string,
    description: string,
    movementType: "INFLOW" | "OUTFLOW",
    status: "REALIZED" | "PENDING" | "FORECAST",
  ) =>
    prisma.financialMovement.create({
      data: {
        organizationId: organization.id,
        movementType,
        status,
        occurredAt: status === "REALIZED" ? date : null,
        dueDate: date,
        amount: new Prisma.Decimal(amount),
        currency: input.currency,
        category,
        counterparty,
        description,
        rawReference: `${category}-${counterparty}`,
        duplicateHash: `${organization.id}-${category}-${amount}-${date.toISOString()}`,
      },
    });

  const basePastDates = [60, 48, 35, 18, 7];
  const pendingDates = [10, 24, 43, 67, 8, 14, 21, 33, 55, 74];
  const forecastDates = [35, 49, 63, 76];

  for (const [index, amount] of input.realizedInflows.entries()) {
    await createMovement(
      subDays(new Date(), basePastDates[index] ?? 12),
      amount,
      index % 2 === 0 ? "SALES" : "SERVICES",
      input.counterparties[index % input.counterparties.length]!,
      "Ingreso cobrado",
      "INFLOW",
      "REALIZED",
    );
  }

  for (const [index, amount] of input.realizedOutflows.entries()) {
    await createMovement(
      subDays(new Date(), (basePastDates[index] ?? 10) - 4),
      amount,
      ["PAYROLL", "SUPPLIER", "RENT", "TAX", "SUPPLIER"][index % 5]!,
      ["Nominas", "Proveedor clave", "Alquiler sede", "Hacienda", "Proveedor logistico"][
        index % 5
      ]!,
      "Gasto pagado",
      "OUTFLOW",
      "REALIZED",
    );
  }

  for (const [index, amount] of input.pendingInflows.entries()) {
    await createMovement(
      addDays(new Date(), pendingDates[index] ?? 14),
      amount,
      index % 2 === 0 ? "SALES" : "SERVICES",
      input.counterparties[index % input.counterparties.length]!,
      index === 1 ? "Cobro grande con riesgo de retraso" : "Factura pendiente",
      "INFLOW",
      "PENDING",
    );
  }

  const outflowCategories = ["PAYROLL", "SUPPLIER", "RENT", "TAX", "CAPEX", "SUPPLIER"];
  for (const [index, amount] of input.pendingOutflows.entries()) {
    await createMovement(
      addDays(new Date(), pendingDates[index + 4] ?? 20),
      amount,
      outflowCategories[index]!,
      ["Nominas", "Proveedor clave", "Arrendador", "Hacienda", "Inversion", "Proveedor internacional"][
        index
      ]!,
      "Compromiso pendiente",
      "OUTFLOW",
      "PENDING",
    );
  }

  for (const [index, amount] of input.forecastInflows.entries()) {
    await createMovement(
      addDays(new Date(), forecastDates[index] ?? 45),
      amount,
      "SALES",
      `Pipeline ${index + 1}`,
      "Forecast comercial",
      "INFLOW",
      "FORECAST",
    );
  }

  for (const [index, amount] of input.forecastOutflows.entries()) {
    if (!amount) continue;
    await createMovement(
      addDays(new Date(), forecastDates[index] ?? 45),
      amount,
      index % 2 === 0 ? "MARKETING" : "SUBSCRIPTION",
      index % 2 === 0 ? "Campana de demanda" : "Software recurrente",
      "Forecast de gasto",
      "OUTFLOW",
      "FORECAST",
    );
  }
}

function matchFirst(input: string, regex: RegExp) {
  return input.match(regex)?.[1] ?? null;
}

function cleanText(value: string) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function parseDate(value: string, fallback: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date(fallback) : parsed;
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
