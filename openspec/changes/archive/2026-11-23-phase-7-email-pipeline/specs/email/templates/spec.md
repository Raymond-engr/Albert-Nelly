# Spec Delta

## Purpose

Defines responsive HTML email templates for welcome registrations, birthday greetings with partner perks, and broadcast campaigns matching the brand design system.

## ADDED Requirements

### Requirement: Welcome Email Template
The system SHALL provide a Welcome email template dispatched when a visitor registers interest in updates, featuring branding, welcome copy, and an unsubscribe link.

#### Scenario: Rendering welcome email
- **WHEN** the Welcome template is rendered with recipient name and unsubscribe URL
- **THEN** it outputs responsive HTML containing greeting text, brand assets, and a functional unsubscribe anchor

### Requirement: Birthday Greeting Template
The system SHALL provide a Birthday email template containing a personalized discount voucher notice, partner showcase cards, and an unsubscribe link.

#### Scenario: Rendering birthday email with partner perks
- **WHEN** the Birthday template is rendered with lead details and partner listings
- **THEN** it outputs responsive HTML with birthday greeting, WhatsApp claim instructions, and partner showcase cards

### Requirement: Marketing Campaign Template
The system SHALL provide a modular Campaign email template supporting subject, header, hero image, rich text body, call to action button, and footer.

#### Scenario: Rendering marketing campaign
- **WHEN** a campaign draft is rendered with markdown/HTML body, CTA, and unsubscribe link
- **THEN** it formats content cleanly into a 600px mobile-friendly table layout with fallback web fonts
