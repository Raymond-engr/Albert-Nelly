# Design

## Context

The database already provisions `image_path text` on `work_items` and `logo_path text` on `partners`. However, neither the API nor the Control Room UI provides upload functionality, and the public Showroom does not consume dynamic image paths.

Phase 8 creates the end-to-end media workflow connecting browser uploads to Supabase Storage and rendering them smoothly on the public Showroom.

## Goals / Non-Goals

**Goals:**
- Provide a secure signed upload URL endpoint (`POST /api/control-room/uploads`) enforcing size budgets and content type policies.
- Enable direct-to-storage file uploads from the browser so large binary payloads bypass Next.js API serverless memory limits.
- Update Work and Partner modal forms with drag/drop or click file attachment, image preview thumbnails, and clear/replace buttons.
- Update `next.config.ts` with `images.remotePatterns` pointing to Supabase Storage domains.
- Enhance `Work.tsx` and `Partners.tsx` to render dynamic images with `next/image` when present.

**Non-Goals:**
- Server-side image resizing/cropping microservices (assets are formatted client-side or uploaded directly within budget).
- Rich digital asset management (DAM) library; uploads are strictly tied to specific work items and partners.

## Decisions

### 1. Direct-to-Storage Signed Uploads
- **Decision**: The browser requests a signed upload URL via `POST /api/control-room/uploads`, then `PUT`s the file directly to Supabase Storage.
- **Rationale**: Keeps serverless functions fast and lightweight, avoiding 4.5MB request payload ceilings on serverless hosting platforms.
- **Alternatives Considered**: Multi-part form data uploads streamed through Next.js route handlers. Rejected due to unnecessary CPU and memory consumption on the server.

### 2. Strict Media Budgets and Format Validation
- **Decision**:
  - Screenshots (`work/`): WebP, PNG, JPEG. Limit 500 KB; UI advisory warning at > 150 KB. 16:10 aspect ratio suggested.
  - Logos (`partners/`): SVG, WebP, PNG. Limit 100 KB.
- **Rationale**: Ensures the public Showroom remains exceptionally fast on mobile and 4G networks without bloat.

### 3. Public URL Resolution & Next.js Image Optimization
- **Decision**: Store relative storage paths (e.g. `work/<id>.webp`) in the database. Construct public URLs using `NEXT_PUBLIC_SUPABASE_URL/storage/v1/object/public/site-media/<path>`.
- **Rationale**: Decouples stored data from domain migrations or custom storage CDN subdomains.

## Risks / Trade-offs

- **[Risk] Supabase Storage bucket missing or unconfigured in demo/development**
  → *Mitigation*: Fall back gracefully: if storage upload is unconfigured or fails, show a clean message in the Control Room and maintain placeholder illustration cards on the public Showroom.
- **[Risk] Unsanitized SVG uploads introducing XSS**
  → *Mitigation*: Strictly validate SVG files to ensure they do not contain `<script>` tags, inline event handlers, or malicious foreign objects before granting upload authorization.
