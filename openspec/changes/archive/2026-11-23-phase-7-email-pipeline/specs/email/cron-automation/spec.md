# Spec Delta

## Purpose

Automates periodic sending of scheduled campaigns and daily birthday greetings using secured cron triggers.

## ADDED Requirements

### Requirement: Scheduled Campaign Cron Dispatcher
The system SHALL periodically query and trigger delivery of campaigns that have reached their scheduled dispatch timestamp.

#### Scenario: Processing scheduled campaign
- **WHEN** the scheduled campaign cron endpoint is requested with valid bearer authorization
- **THEN** campaigns with status scheduled and scheduled_for at or before current time are dispatched and marked sent

#### Scenario: Unauthorized cron trigger rejection
- **WHEN** a cron endpoint is requested with missing or invalid bearer token
- **THEN** the endpoint returns HTTP 401 Unauthorized without executing queries

### Requirement: Daily Birthday Greetings Automation
The system SHALL query leads celebrating birthdays today in Lagos timezone and dispatch greetings idempotently once per calendar year.

#### Scenario: Dispatches birthday email on matching date
- **WHEN** the birthday cron runs on a date matching lead birth_day and birth_month in Africa/Lagos
- **THEN** the system dispatches a greeting email and inserts a unique record in birthday_sends

#### Scenario: Idempotent execution on subsequent runs
- **WHEN** the birthday cron runs multiple times on the same calendar day
- **THEN** leads already recorded in birthday_sends for the current year are excluded from duplicate dispatch
