# Tasks

## 1. Schema, Types & Upload Endpoint

- [x] 1.1 Update `WorkItem` and `Partner` types in `src/lib/control-room/types.ts` and `src/types/content.ts` to include `imagePath` and `logoPath`; update mappers in `src/lib/control-room/server/mappers.ts` and reader in `src/lib/site-content.ts`
- [x] 1.2 Implement `src/lib/media.ts` helper for signed upload URL generation, file type/size validation, and public URL resolution; verify unit tests in `tests/media/media-helpers.test.ts`
- [x] 1.3 Implement `POST /api/control-room/uploads` route handler guarded by `requireStaff(["owner", "content"])` returning signed upload URL and updating entity rows; verify route tests in `tests/media/upload-route.test.ts`

## 2. Control Room Form Controls

- [x] 2.1 Update `WorkScreen.tsx` with image upload attachment, thumbnail preview, replace/remove actions, and 150 KB size budget advisory; verify component tests in `tests/media/work-screen.test.ts`
- [x] 2.2 Update `PartnerScreen.tsx` with logo upload attachment, preview, replace/remove actions, and 100 KB size validation; verify component tests in `tests/media/partner-screen.test.ts`

## 3. Showroom Media Display & Image Optimization

- [x] 3.1 Configure `next.config.ts` `images.remotePatterns` for Supabase Storage domains
- [x] 3.2 Update `src/components/showroom/Work.tsx` and `src/components/showroom/Partners.tsx` to render dynamic images via `next/image` when present with fallback to static styles; verify rendering tests in `tests/media/showroom-media.test.ts`

## 4. Verification & Validation

- [x] 4.1 Run `npm run typecheck` to verify no TypeScript regressions across Showroom and Control Room
- [x] 4.2 Run `npm run lint` to verify zero ESLint errors
- [x] 4.3 Run `npm test -- --run` to verify all test suites pass cleanly
- [x] 4.4 Run `npm run build` to confirm static and dynamic pages build cleanly with Next.js 16
