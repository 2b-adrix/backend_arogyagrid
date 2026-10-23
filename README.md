# ArogyaGrid demo CSV dataset

This pack contains 9 linked CSV files for populating the ArogyaGrid Smart Health Supply Chain & Predictive Command Center data layer. All records are **synthetic demo data** intended for development, UI prototyping, and integration testing; they are not official government data, real staff records, patient records, or verified live inventory.

## Files and row counts

| File | Rows (excluding header) | Purpose |
|---|---:|---|
| facilities.csv | 18 | Facility catalogue, district, GIS coordinates, and bed capacity |
| medicines.csv | 30 | Essential medicines and supplies master list |
| inventory_balances.csv | 540 | Facility x medicine stock levels and consumption |
| risk_assessments.csv | 540 | Derived stockout risk levels, scores, and days to stockout |
| alerts.csv | 59 | Command-center alerts for stock risk, bed pressure, expiry review, and transfer approval |
| redistribution_recommendations.csv | 34 | Suggested facility-to-facility transfers |
| beds_and_staff.csv | 18 | Bed occupancy and staffing snapshot per facility |
| demand_forecasts.csv | 2520 | 14-day history/forecast series for selected high-use medicines |
| audit_logs.csv | 80 | Synthetic administrative action history |

## Data conventions

- IDs are stable foreign keys: `facilityId` references `facilities.id`; `medicineId` references `medicines.id`.
- `updatedAt`, `createdAt`, and `timestamp` values use Unix epoch **milliseconds**.
- `isResolved` uses lowercase `true`/`false`.
- `dayLabel` is an ISO date (`YYYY-MM-DD`). Historical forecast rows contain `actualDemand`; future forecast rows have a blank `actualDemand`.
- `coverageDays = closingStock / averageDailyConsumption`, rounded to two decimals.
- `stockGap = max(0, ceil(7 × averageDailyConsumption − closingStock))`, i.e. the shortfall against a seven-day coverage target.
- Risk levels are generated from coverage: CRITICAL (≤3.5 days), HIGH (>3.5–7), MEDIUM (>7–14), LOW (>14). Scores are synthetic on a 0–10 scale.
- Redistribution suggestions only use the estimated stock surplus above a 14-day source-facility reserve, with preference for facilities in the same district or nearby locations. They are recommendations, not completed transactions.
- Expiry alerts are explicitly labeled simulated because this pack does not include batch/lot-level expiry tables.

## Suggested import order

1. `facilities.csv`
2. `medicines.csv`
3. `inventory_balances.csv`
4. `beds_and_staff.csv`
5. `risk_assessments.csv`
6. `redistribution_recommendations.csv`
7. `alerts.csv`
8. `demand_forecasts.csv`
9. `audit_logs.csv`

Import IDs as strings and parse the epoch-millisecond fields as 64-bit integers / timestamps. Keep blank `actualDemand` as null for future forecast dates.
