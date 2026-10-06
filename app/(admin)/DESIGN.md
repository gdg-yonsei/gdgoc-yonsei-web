# GYMS admin design direction

Reading this as: a community management workspace for GDGoC Yonsei members, with warm paper surfaces and clear utility controls, ENERGY 1 / RHYTHM 1 / MOTION 2.

This is the admin implementation guide. The earlier file analyzed another product's marketing site; those pricing, commerce, testimonial and illustration examples are not requirements for GYMS. The chapter's own information architecture, bilingual content and GDG identity define this workspace. See the [project design direction](../../DESIGN.md) for shared constraints.

## Structure and hierarchy

Use the existing sidebar on desktop, header and bottom navigation on mobile, and permission-filtered navigation in both. Keep forms, tables and detail pages predictable so members can manage community data quickly. The page title and current task remain the focal point.

Use Google Sans for Latin text and Pretendard for Korean. Body text has comfortable line spacing; small metadata uses the shared caption and eyebrow styles rather than ad hoc sizes.

Keep the existing radius scale: inputs 4px, menu rows 5px, buttons 8px, cards 12px, containers 16px. Shadows describe elevated menus and dialogs rather than surrounding every surface.

## Theme and control tokens

`app/admin.css` owns the light and dark tokens. Warm canvas, surface and sunken surface distinguish layers; hairline borders are decorative separators. Interactive fields and secondary buttons use the separate control-border token for a visible boundary.

The faint text token remains readable at 4.5:1 or more on all three surfaces. Primary actions use primary/on-primary; destructive actions use danger/on-danger, including icon buttons. Do not apply white text directly to the dark theme's pale danger fill.

Minimum interactive hit areas are 44px in both dimensions. Checkbox labels can provide this area around a smaller visible checkmark. Controls may wrap as a group on narrow screens, while each label stays readable. Preserve focus indicators and error instructions in both themes.

## States and motion

Motion level 2 means short state transitions and content reveals, not scroll choreography. Reduced motion removes spatial transforms and repeated loading animation; static content and status text still explain what is happening.

Every asynchronous view needs loading, empty and error feedback. Skeletons and page loading boundaries announce a localized status; decorative marks stay hidden from screen readers. Passkey errors remain visible and offer another attempt or sign-in method.

Keep at most two blurred elements visible simultaneously. The header and drawer backdrop can use blur; bottom navigation and destructive modal backdrops do not.

Dialogs place initial focus on the safe action, support Escape and restore focus. Destructive actions require the existing confirmation behavior. All internal destinations and forms must be exercised in a browser before compliance is reported.
