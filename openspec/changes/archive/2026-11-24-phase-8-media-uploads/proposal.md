# Proposal

## Why

The Control Room currently manages Selected Work and Partner entities through text fields only, but the Showroom design requires high-quality 16:10 project screenshots and partner logos. Phase 8 implements the media pipeline specified in `docs/CONTROL_ROOM_HANDOVER.md` (Section 12), enabling staff to upload, preview, and associate media with work items and partners via Supabase Storage, while serving optimized images to the public Showroom via Next.js Image optimization.

## What Changes

- **Supabase Storage Integration & Upload API (`POST /api/control-room/uploads`)**:
  - Implements signed upload URL generation (`createSignedUploadUrl`) targeting a public `site-media` bucket.
  - Role-gated for `owner` and `content` roles.
  - Enforces strict MIME type restrictions (WebP, PNG, JPEG, SVG for logos) and payload size budgets (screenshots budget ~150 KB, limit 500 KB; logos limit 100 KB).
  - Automatically updates `image_path` on `work_items` or `logo_path` on `partners`.
- **Control Room Form Media Controls**:
  - Adds image attachment, live thumbnail preview, file replacement, and removal controls to `WorkScreen.tsx` (Work item dialog) and `PartnerScreen.tsx` (Partner dialog).
  - Displays visual file budget warnings when selected files exceed the 150 KB screenshot recommendation.
  - Sanitizes SVG logo markup or prioritizes raster/clean formats.
- **Showroom Optimization (`next.config.ts` & public components)**:
  - Updates `next.config.ts` `images.remotePatterns` to authorize images from Supabase Storage domains.
  - Configures `next/image` in `Work.tsx` and `Partners.tsx` to render responsive, lazy-loaded screenshots and logos with clean fallbacks when unconfigured.

## Capabilities

### New Capabilities

- `media/storage-uploads`: Direct-to-storage signed URL upload handler, file type and size budget validation, and path recording.
- `media/form-management`: Interactive media upload, thumbnail preview, file replacement, and removal in Work and Partner management screens.
- `media/showroom-display`: Optimized image display for project screenshots and partner logos with responsive srcset and fallback handling.

### Modified Capabilities

<!-- None: Existing specs cover showroom content and control-room CRUD, but did not specify binary media storage or upload procedures. -->

## Impact

- **Storage**: Requires Supabase Storage bucket `site-media` with public read access.
- **APIs**: New endpoint `POST /api/control-room/uploads`.
- **Control Room UI**: Updates `WorkScreen.tsx` and `PartnerScreen.tsx`.
- **Public Showroom**: Updates `next.config.ts` and enhances `Work.tsx` and `Partners.tsx` to render `image_path` / `logo_path` when present.
- **Types**: Extends TypeScript types for `WorkItem` (`imagePath?: string | null`) and `Partner` (`logoPath?: string | null`).
