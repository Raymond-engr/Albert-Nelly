# Spec Delta

## Purpose

Renders optimized media assets on the public Showroom website using Next.js Image optimization with responsive fallback handling.

## ADDED Requirements

### Requirement: Optimized Project Screenshot Rendering
The system SHALL render project screenshots using Next.js Image with authorized storage domains and fallback states.

#### Scenario: Rendering project with screenshot
- **WHEN** a Work item has an associated `image_path` stored in the public storage bucket
- **THEN** the Showroom renders an optimized responsive image preserving 16:10 aspect ratio

#### Scenario: Fallback when screenshot is absent
- **WHEN** a Work item has no associated `image_path`
- **THEN** the Showroom renders the default design frame or placeholder illustration without layout shift

### Requirement: Partner Logo Rendering
The system SHALL render partner logos with consistent sizing and high visual contrast.

#### Scenario: Rendering partner logo
- **WHEN** a Partner has an associated `logo_path`
- **THEN** the Showroom displays the logo with fixed bounding dimensions and proper scaling
