# Spec Delta

## Purpose

Processes incoming email provider delivery events and provides an authenticated one-click unsubscribe mechanism for recipients.

## ADDED Requirements

### Requirement: Email Delivery Webhook Processing
The system SHALL receive provider webhooks, verify signatures, and update recipient delivery metrics or lead unsubscribed status.

#### Scenario: Updating delivery status
- **WHEN** a signed provider webhook arrives indicating delivery, open, or click
- **THEN** the corresponding campaign_recipients or birthday_sends record is updated with timestamp

#### Scenario: Handling bounces and spam complaints
- **WHEN** a webhook indicates a hard bounce or spam complaint
- **THEN** the recipient record is marked bounced and the lead unsubscribed_at timestamp is set to current time

### Requirement: One-Click Tokenized Unsubscribe
The system SHALL generate tamper-proof HMAC tokens for email footers and immediately process unsubscribe requests upon token submission.

#### Scenario: Successful token verification and unsubscribe
- **WHEN** a user visits the unsubscribe route with a valid HMAC-signed token
- **THEN** the system marks the corresponding lead unsubscribed_at to now and displays a confirmation message

#### Scenario: Invalid or tampered token rejection
- **WHEN** an unsubscribe request is received with an invalid or expired signature
- **THEN** the system rejects the request and displays an invalid token notification without altering lead status
