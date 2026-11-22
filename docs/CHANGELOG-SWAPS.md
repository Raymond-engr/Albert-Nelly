# Swap changelog

One line per patch: `date | patch | slots | source | deps added`.

2026-11-19 | 0002-motion-modes-and-dev-override | Stage (main: /, /three, /four) | new: src/lib/motion.ts, useMotionMode | none
2026-11-19 | 0003-variant-two-motion-modes | Stage (two) | uses src/lib/motion.ts from 0002 | none
2026-11-19 | 0004-variant-three-motion-modes | Stage (three) | uses src/lib/motion.ts from 0002 | none
2026-11-19 | 0005-variant-three-drop-width-rule | Stage (three) | none | none

2026-11-19 | 0006-variant-one-motion-modes | Stage (one) | uses src/lib/motion.ts from 0002 | none
2026-11-20 | 0006-variant-three-referral-phone-chat | Referral (three) | new: PhoneChat, PhoneGL (reuses three-r128, useMotionMode) | none
2026-11-21 | 0006-variant-two-work-gallery-and-compare | Work (two) | new: src/data/gallery.ts, WorkFrames/WorkGallery/WorkViewer/WorkCompare/WorkPic in src/variants/two, public/work/placeholder | none
2026-11-21 | 0006-promote-three-stage-into-main | Stage (main) | new: src/components/showroom/StageGL.tsx, scenes.ts, three-r128.d.ts, public/models/ | StageArt.tsx removed
2026-11-21 | 0007-services-walks-wire-dev-shapes | Services (main), SceneSection | uses 0006 | none
2026-11-21 | 0008-swap-hero-from-four | Hero (main) | uses 0006 | none
2026-11-22 | 0009-main-referral-phone-chat | Referral (main) | new: src/components/showroom/PhoneChat.tsx, PhoneGL.tsx, PhoneChat.module.css (copied from three; reuse three-r128 and useMotionMode); band in three's design; copy: "Refer someone" title and "commission" wording | none
