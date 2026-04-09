# Mathing Cashflow MVP

Financial forecasting MVP that simulates cash flow scenarios and detects liquidity risks.
Designed to model real-world financial uncertainty and support decision making.

## Stack

- Frontend: Next.js 16 + TypeScript + Tailwind CSS + Recharts
- Backend: NestJS + Prisma + PostgreSQL
- Auth: JWT simple
- Monorepo: pnpm workspaces + Turbo
- Infra local: Docker Compose, Dockerfiles propios y cluster PostgreSQL local aislado

## Estructura

- `apps/web`: interfaz en espanol con login, dashboard, importacion, movimientos, escenarios y configuracion.
- `apps/api`: API REST modular con auth, organizations, data-import, normalization, financial-movements, forecasting, risk, scenarios, dashboard y external-signals.
- `packages/shared`: tipos y contratos compartidos.
- `examples/`: CSVs de ejemplo para cargar datos manualmente.

## Endpoints principales

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/organizations/current`
- `PATCH /api/organizations/current`
- `POST /api/imports/upload`
- `GET /api/imports/:id/report`
- `GET /api/movements`
- `POST /api/movements`
- `GET /api/forecast`
- `GET /api/risk-assessment`
- `POST /api/scenarios`
- `GET /api/scenarios`
- `GET /api/scenarios/:id`
- `POST /api/scenarios/:id/run`
- `GET /api/dashboard/summary`

## Docker

La dockerizacion ahora usa imagenes propias:

- `apps/api/Dockerfile`: construye NestJS, aplica migraciones al arrancar y sirve la API en produccion.
- `apps/web/Dockerfile`: construye Next.js en modo `standalone` y sirve la UI en produccion.
- `docker-compose.yml`: levanta `db`, ejecuta un contenedor `seed` una sola vez y despues arranca `api` y `web`.

### Arranque rapido con Docker

1. Copia `.env.example` a `.env` si quieres reutilizar variables fuera de Docker.
2. Asegurate de tener Docker Desktop levantado.
3. Ejecuta `docker compose up --build`.
4. Abre [http://localhost:3002](http://localhost:3002).
5. Usa las credenciales demo:
   - `admin@demo.local` / `Demo1234!`
   - `analyst@demo.local` / `Demo1234!`

### Flujo del compose

1. `db` levanta PostgreSQL y expone `5433` en host.
2. `seed` espera a que la base este sana, aplica migraciones y carga datos demo.
3. `api` espera a `db` y `seed`, vuelve a asegurar migraciones y expone `4002`.
4. `web` sirve la aplicacion en `3002`.

## Arranque local sin Docker

1. Levanta PostgreSQL en local.
2. Exporta variables:
   - `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mathing`
   - `JWT_SECRET=dev-secret-change-me`
   - `NEXT_PUBLIC_API_URL=http://localhost:4000/api`
3. Instala dependencias: `pnpm install`
4. Genera cliente Prisma: `pnpm db:generate`
5. Ejecuta migraciones: `pnpm --filter api exec prisma migrate deploy`
6. Carga datos demo: `pnpm db:seed`
7. Inicia backend: `pnpm --filter api dev`
8. Inicia frontend: `pnpm --filter web dev`

## Estado local preparado en esta maquina

Durante esta sesion he dejado un entorno local utilizable con:

- PostgreSQL aislado del proyecto en `C:\Desarrollo\mathing\.local\pgdata`
- Base de datos local accesible por `postgresql://postgres@localhost:55432/mathing`
- API disponible en `http://localhost:4000`
- Frontend disponible en `http://localhost:3100`

Scripts auxiliares creados:

- `.local\run-api.cmd`
- `.local\start-web.cmd`
- `.local\start-api.cmd`

## Flujo funcional del MVP

1. Login o registro de una organizacion nueva.
2. Importacion de CSVs de transacciones, obligaciones o previsiones.
3. Normalizacion a `FinancialMovement` con validacion, trazabilidad y deteccion de duplicados simples.
4. Forecast diario a 90 dias con saldo acumulado, primer dia negativo, peor saldo y runway.
5. Scoring hibrido con reglas + Monte Carlo para tension y rotura a 30/60/90 dias.
6. Simulacion de escenarios con comparacion base vs escenario.
7. Dashboard con metricas, grafico, pagos criticos, cobros relevantes, drivers y recomendaciones.

## CSVs de ejemplo

- `examples/transactions.csv`
- `examples/obligations.csv`
- `examples/forecasts.csv`

Columnas soportadas de forma automatica:

- `amount`, `date`/`dueDate`, `movementType`, `status`, `currency`, `category`
- opcionales: `subcategory`, `counterparty`, `description`, `rawReference`

## Scripts utiles

- `pnpm build`
- `pnpm check-types`
- `pnpm test`
- `pnpm lint`
- `pnpm db:generate`
- `pnpm db:seed`

## Tests incluidos

- `apps/api/test/normalization.spec.ts`: validacion y mapeo CSV.
- `apps/api/test/forecasting.spec.ts`: forecast diario y deteccion de saldo negativo.
- `apps/api/test/risk.spec.ts`: scoring interpretable y recomendaciones.

## Notas de diseno

- Multi-tenant por `organizationId` en todos los modulos de negocio.
- Los modulos de forecast, riesgo y escenarios estan desacoplados del transporte HTTP.
- `ExternalSignal` ya se usa para cargar senales oficiales base y sigue siendo extensible para futuras integraciones.
- El MVP asume una moneda principal por organizacion y no hace conversion FX avanzada.

## Fuentes consultadas para seeds

Ver [docs/data-sources.md](/C:/Desarrollo/mathing/docs/data-sources.md).
