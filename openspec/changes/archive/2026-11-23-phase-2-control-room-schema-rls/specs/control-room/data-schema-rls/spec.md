# Spec Delta: Control Room Database Schema, Row Level Security & RPC Functions

## Purpose

Establishes database schemas, immutable financial ledgers, transactional RPC procedures, and Row Level Security policies for the Albert Nelly agency platform.

## ADDED Requirements

### Requirement: Role-based Row Level Security enforcement
The database SHALL enforce Row Level Security across all tables using the authenticated user session's role and verified aal2 assurance.

#### Scenario: Sales role accesses financial data
- **WHEN** an authenticated user with role sales queries the payments table
- **THEN** the database returns zero rows and denies read access

#### Scenario: Finance role reads payments
- **WHEN** an authenticated staff member with role finance queries the payments table
- **THEN** the database returns the authorized payment records

### Requirement: Immutable financial and audit ledgers
The database SHALL reject any UPDATE or DELETE operations on payments and activity_log tables via append-only trigger protection.

#### Scenario: Attempt to alter recorded payment
- **WHEN** any database client attempts to UPDATE or DELETE an existing payment row
- **THEN** the database aborts the transaction with an append-only error exception

#### Scenario: Attempt to alter activity log
- **WHEN** an UPDATE or DELETE statement executes against activity_log
- **THEN** the database trigger raises an exception and aborts the modification

### Requirement: Atomic lead conversion via RPC
The database SHALL execute lead-to-deal conversion within a single transaction verifying lead eligibility, creating the deal, linking foreign keys, and recording the activity log.

#### Scenario: Converting an unconverted lead
- **WHEN** `convert_lead_to_deal` is invoked with valid deal parameters for an unconverted lead
- **THEN** the database creates the deal row, updates lead status to deal, sets deal_id, and logs the action

#### Scenario: Converting an already converted lead
- **WHEN** `convert_lead_to_deal` is called for a lead that already has an associated deal
- **THEN** the database raises an exception and aborts without creating duplicate deals

### Requirement: Enforce single featured school package
The database SHALL guarantee through partial unique indexing and RPC logic that at most one school package is marked as featured at any time.

#### Scenario: Setting a new featured package
- **WHEN** `set_featured_package` is executed for a package ID
- **THEN** the database clears the featured flag on all other packages and marks the target package as featured

### Requirement: Whole-Naira currency modeling
The database SHALL store all contract values, payment amounts, and operational costs as non-negative 64-bit integers representing whole Nigerian Naira.

#### Scenario: Storing negative currency amount
- **WHEN** an insert or update supplies a negative amount for deal agreed value, payment amount, or running cost
- **THEN** the database check constraint rejects the transaction
