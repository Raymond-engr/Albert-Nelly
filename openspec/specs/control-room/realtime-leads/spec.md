# control-room/realtime-leads Specification

## Purpose
Delivers live awareness of new enquiries by pushing a Supabase Realtime notification to
all connected Control Room sessions whenever a new lead row is inserted into the database.

## Requirements

### Requirement: Shell subscribes to new lead insertions
The Control Room shell SHALL maintain an active Supabase Realtime `postgres_changes`
subscription on `INSERT` events for `public.leads` while a staff session is open.

#### Scenario: New lead arrives while shell is open
- **WHEN** a new row is inserted into `public.leads`
- **THEN** the shell receives a Realtime event within the normal Supabase channel latency
- **AND** the in-memory store is refreshed by calling `refreshDb()`
- **AND** a toast notification is displayed showing the lead's name and service interest

#### Scenario: Multiple leads arrive in quick succession
- **WHEN** two or more leads are inserted within seconds of each other
- **THEN** each event triggers a separate toast and store refresh

#### Scenario: Subscription is torn down on unmount
- **WHEN** the user signs out or the Shell component unmounts
- **THEN** the Realtime channel is removed and no further events are delivered

### Requirement: Database publication enables Realtime for leads
The `supabase_realtime` publication SHALL include `public.leads` so that
Realtime `postgres_changes` subscriptions receive row-level events.

#### Scenario: Publication covers leads table
- **WHEN** the migration is applied
- **THEN** `public.leads` is part of the `supabase_realtime` publication
- **AND** an authenticated Realtime channel for `public.leads` receives INSERT events

### Requirement: Realtime subscription requires authentication
The shell SHALL only establish the Realtime channel after the user session is confirmed
at `aal2`. An unauthenticated or `aal1` browser SHALL NOT receive Realtime lead events.

#### Scenario: Authenticated staff receives events
- **WHEN** a staff member is signed in with an `aal2` session and the Shell is mounted
- **THEN** the Realtime channel is active and events are delivered

#### Scenario: Unauthenticated browser does not receive events
- **WHEN** a request reaches Supabase Realtime without a valid `aal2` session token
- **THEN** the subscription is rejected and no lead data is delivered
