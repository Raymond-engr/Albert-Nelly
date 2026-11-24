# Spec Delta

## Purpose

Enables staff to attach, preview, replace, and remove media files in Work item and Partner management forms in the Control Room.

## ADDED Requirements

### Requirement: Media File Attachment and Preview
The system SHALL provide an interactive image upload and preview control within the Work item and Partner modal forms.

#### Scenario: Previewing an uploaded image
- **WHEN** a user selects an image file or the record contains an existing image path
- **THEN** the form displays an image preview thumbnail alongside file replacement and removal actions

#### Scenario: File size budget warning
- **WHEN** a user selects a screenshot file larger than the recommended budget of 150 KB (but under the 500 KB limit)
- **THEN** the form displays a visual advisory recommending image optimization

### Requirement: Media Removal
The system SHALL allow staff to remove an attached media file from a Work item or Partner.

#### Scenario: Removing an image
- **WHEN** staff clicks the remove image action in the edit form
- **THEN** the image path is cleared from the record upon saving
