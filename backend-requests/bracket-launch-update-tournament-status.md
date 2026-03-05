# Backend Request: Update tournament status when bracket launches

## Problem

When the bracket is launched from the admin panel, `bracket_status` is set to `live` and `bracket_launched_at` is populated, but the tournament's top-level `status` field remains `upcoming`. This causes inconsistencies across the platform (tournament listings, profile cards, game hub filters, status badges).

## Required Change

The bracket launch process (admin panel or Edge Function) must also update `tournaments.status` from `upcoming` to `active` when setting `bracket_status = 'live'`.

### SQL to add to the bracket launch logic

```sql
UPDATE tournaments
SET status = 'active'
WHERE id = <tournament_id>
  AND bracket_status = 'live';
```

## DB Constraint Reference

The `tournaments_status_check` constraint only allows: `upcoming`, `active`, `past`.

## Impact

Without this fix, any tournament whose bracket is launched before the scheduled `start_date` will:
- Still appear in "upcoming" filter lists instead of "active"
- Show incorrect status badges across the platform
- Confuse users who see a live bracket but an "upcoming" label

## Frontend Mitigation

The frontend now reads `bracket_status` and uses it to override date-based status calculation for the bracket tab. This ensures the bracket always renders when `bracket_status = 'live'`, regardless of the top-level `status` field. However, the backend fix is still needed for consistent display across all other parts of the app.
