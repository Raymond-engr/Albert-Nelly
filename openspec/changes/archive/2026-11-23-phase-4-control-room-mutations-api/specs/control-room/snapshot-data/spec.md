# Spec Delta: control-room/snapshot-data

## MODIFIED Requirements

### Requirement: Live store hydration and refresh lifecycle
The system SHALL hydrate the client store from the server snapshot upon mounting and maintain a refresh mechanism for window focus and post-mutation synchronization.

#### Scenario: Initial application shell mount
- **WHEN** the Control Room shell mounts in the browser
- **THEN** the store requests `/api/control-room/snapshot` and transitions status from loading to ready upon receipt

#### Scenario: Snapshot retrieval failure
- **WHEN** a snapshot request fails due to a network interruption or server error
- **THEN** the client shell transitions to an error state and renders a retry action

#### Scenario: Post-mutation store re-synchronization
- **WHEN** any seam mutation completes successfully on the server
- **THEN** the client store automatically executes `refreshDb()` to reflect updated database records across all screens
