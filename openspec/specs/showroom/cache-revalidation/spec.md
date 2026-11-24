# showroom/cache-revalidation Specification

## Purpose
Ensures that edits made in the Control Room to public services, school packages, running costs, selected work items, or partner organizations are immediately reflected on the public website via on-demand Next.js route revalidation.

## Requirements

### Requirement: Mutation handlers trigger path revalidation
Whenever a mutating API route in `/api/control-room/` updates, inserts, or deletes records that affect the public site, the handler SHALL invoke `revalidatePath("/")`.

#### Scenario: Service price or details updated
- **WHEN** `PATCH /api/control-room/services/:id` completes successfully
- **THEN** `revalidatePath("/")` is called before the response is returned
- **AND** the public homepage serves the fresh service data on the next request

#### Scenario: School package or running cost updated
- **WHEN** `PATCH /api/control-room/packages/:id` or `PUT /api/control-room/running-costs` completes successfully
- **THEN** `revalidatePath("/")` is called before the response is returned

#### Scenario: Work item created, edited, or deleted
- **WHEN** `POST /api/control-room/work`, `PATCH /api/control-room/work/:id`, or `DELETE /api/control-room/work/:id` completes successfully
- **THEN** `revalidatePath("/")` is called before the response is returned

#### Scenario: Partner created, edited, or deleted
- **WHEN** `POST /api/control-room/partners`, `PATCH /api/control-room/partners/:id`, or `DELETE /api/control-room/partners/:id` completes successfully
- **THEN** `revalidatePath("/")` is called before the response is returned

#### Scenario: Settings updated
- **WHEN** `PATCH /api/control-room/settings` completes successfully and `whatsappNumber` is changed
- **THEN** `revalidatePath("/")` is called before the response is returned

### Requirement: Public homepage defines safety revalidation interval
The public homepage route `src/app/page.tsx` SHALL export `revalidate = 300` as a time-based stale-while-revalidate safety net.

#### Scenario: Background ISR refresh
- **WHEN** visitors browse the homepage without manual revalidations
- **THEN** Next.js refreshes the static cache at most once every 300 seconds
