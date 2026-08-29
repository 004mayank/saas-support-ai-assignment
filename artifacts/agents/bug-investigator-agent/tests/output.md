## Classification
New or unmatched issue. Neither changelog entry aligns on both export type and triggering range.

## Engineering title
Analytics CSV export stalls at 92% for ranges over 90 days in EU workspace

## Impact
- Customer cannot export a 120-day Analytics range after three attempts.
- Scope beyond this Growth-plan EU workspace is unknown.

## Environment
- Web app web-2026.08.27; Chrome 127; EU workspace; Growth plan.

## Reproduction steps
1. Open Analytics.
2. Choose a 120-day date range.
3. Select Export CSV.

## Expected vs actual
- Expected: CSV download starts.
- Actual: progress remains at 92% for at least 15 minutes and no file downloads.

## Evidence
- Frequency: 3 of 3 attempts.
- Attachment supplied: network-har-redacted.zip.
- KI-224 conflicts on browser and export type; FIX-812 concerns ranges over one year and is already fixed.

## Missing diagnostics
- Workspace ID, export job ID, exact timestamps, dataset size, and console errors.

## Duplicate-search terms
- `analytics csv export 92% EU`
- `csv export 120 day timeout`
