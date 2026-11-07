---
version: alpha
name: VietFlood Operations
description: Calm, legible blue-brand flood reporting and relief coordination.
colors:
  primary: "#1266A8"
  primary-foreground: "#FFFFFF"
  background: "#F5F7FA"
  surface: "#FFFFFF"
  foreground: "#172B3A"
  muted-foreground: "#526477"
  border: "#DCE3E9"
  dark-background: "#101923"
  dark-surface: "#172532"
  dark-foreground: "#EDF3F8"
  dark-muted-foreground: "#AABAC8"
  dark-primary: "#7DC7F4"
  dark-primary-foreground: "#102B40"
typography:
  title:
    fontFamily: Be Vietnam Pro
    fontSize: 1.375rem
    fontWeight: 700
    lineHeight: 1.35
  section:
    fontFamily: Be Vietnam Pro
    fontSize: 1rem
    fontWeight: 600
    lineHeight: 1.5
  body:
    fontFamily: Be Vietnam Pro
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.6
rounded:
  sm: 8px
  md: 12px
  lg: 16px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    height: 44px
  page:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
  surface:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
  secondary-text:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.muted-foreground}"
  dark-page:
    backgroundColor: "{colors.dark-background}"
    textColor: "{colors.dark-foreground}"
  dark-surface:
    backgroundColor: "{colors.dark-surface}"
    textColor: "{colors.dark-foreground}"
  dark-secondary-text:
    backgroundColor: "{colors.dark-surface}"
    textColor: "{colors.dark-muted-foreground}"
  dark-button-primary:
    backgroundColor: "{colors.dark-primary}"
    textColor: "{colors.dark-primary-foreground}"
---

## Overview

A shared visual language for the existing VietFlood web and native apps. Retain the blue identity and all working operational behavior. Layout is task-first: find a location/report, assess severity and recency, then choose one clear next action. This is enhancement of a functioning app, not a mockup or replacement product.

Source guidance: `evondev/evondevKit`, `skills/ui-ux`, revision `9c03553222592e433f88429a19f831f0707dbf8f`. Apply its task-first hierarchy, restrained flat surfaces, consistent controls and complete states. The user chose direct implementation without wireframes. Preserve accessibility and real application functionality where upstream examples/preferences differ. Do not run unreviewed upstream scripts.

## Colors

Use the existing semantic token system, synchronized to the normative palette above for shared surfaces/text/brand. Emergency, warning, success and AI/unverified states retain distinct semantic colors and text labels; they are not decorative competing accents. Never make an urgent state neutral merely to achieve a one-accent aesthetic. Ensure normal text contrast at least 4.5:1 and meaningful controls/focus indicators at least 3:1 against adjacent surfaces. Measure rendered combinations in both themes, including muted and disabled states where actionable information remains.

## Typography

Retain Be Vietnam Pro on web and Mulish on native. Use a restrained title/section/body/caption hierarchy, not oversized dashboard hero headings. Native body text is 15–16pt, page titles 22–24pt, section labels 16–18pt; support font scaling. Do not truncate critical location/severity content or Vietnamese diacritics. Use tabular figures for comparative operational metrics where appropriate.

## Layout

Use 4/8/16/24/32 spacing steps, 16px narrow gutters and 24px desktop section padding. Screen headers pair a compact title and useful description with one prominent action. Related records belong in coherent rows or grids rather than a card around every label. Keep controls in logical reading/focus order; filters wrap cleanly and preserve draft/apply/reset semantics. At narrow widths, rearrange content before shrinking it or relying on horizontal scrolling. Only genuinely wide data tables may scroll within a labelled container.

On web the shared vocabulary is `.workspace-header`, `.workspace-title`, `.workspace-description`, `.workspace-section`, `.workspace-toolbar` and `.workspace-stack`. Foundation CSS owns these classes; screen components reuse them. Keep existing operations classes compatible while removing decorative gradients and heavy elevation. Native uses existing theme tokens and components, not CSS/DOM facsimiles.

## Elevation & Depth

Prefer opaque theme surfaces, subtle boundaries and whitespace. Remove decorative gradients, repeated glows and raised panels. Reserve elevation for overlays and clearly floating controls; map layers keep the separation needed for readability. Do not remove informative severity edges or focus indicators.

## Shapes

Controls and standard panels use 12px radii; compact controls use 8px; large modal/panel shells may use 16px. Avatars and status dots remain circular. Native targets are at least 44pt, normally 48pt for important actions. Do not reduce hit areas to make dense layouts fit.

## Components

Reuse shadcn/Radix on web and the existing React Native/NativeWind primitives on mobile. Keep props and variants backward compatible. Use one deliberate high-emphasis action in a local task group; do not globally reinterpret `default` button behavior without auditing consumers. Secondary actions are legible outlined or ghost controls with visible hover/pressed states. Destructive actions remain clearly identified and confirmed where already required.

Forms retain labels, required markers, inline validation, passwords, address picker semantics and submission rules. Pending, disabled, empty, error/retry, success and no-results states are real states, not invented data. Dialogs retain accessible names, focus containment and return focus. Preserve keyboard focus on buttons, links and tabs even if upstream styling examples remove it. Respect reduced motion; avoid animating layout or content on each tab switch.

Chat keeps provenance, service limitations and collection/review boundaries readable. GPS/photos remain device-only until explicit confirmation. Do not reconstruct executable proposals or lost attachments from historical prose. Navigation preserves routes, role guards and feature flags. No new backend capabilities, tracking permissions or authentication providers are implied by a UI change.

## Do's and Don'ts

- Do preserve the already implemented Vietnam address picker and every legacy/manual fallback rule.
- Do exercise both cold light/dark loads and live theme transitions, long Vietnamese strings, narrow widths, keyboard use and native large text.
- Do test against intercepted browser APIs and isolated localhost native fixtures; label synthetic data honestly.
- Do not send real reports, confirmations, GPS/photos, account edits or role changes during UI QA.
- Do not replace handlers with placeholders, hide failures, fabricate metrics, remove content or add nonfunctional actions.
- Keep baseline changes intact. No commit, push or deployment is part of this task.
