# Design — Project Identity

> This document is project-long-lived. Tokens are not changed without
> the Architect's approval. Developers MUST use these tokens
> instead of improvising their own colors/spacings.

## Style Direction

Professionelles Produktivitäts-Design mit Navy-Sidebar auf hellem Grau-Hintergrund, einem kräftigen Mittelblau als funktionalem Akzent und reduzierter visueller Last – Jira-inspiriert, aber schlanker.

## Colors

- `--color-bg`: **#F4F5F7**
- `--color-bg_sidebar`: **#1B2A4A**
- `--color-fg`: **#1A2332**
- `--color-fg_sidebar`: **#CDD6E4**
- `--color-accent`: **#2563EB**
- `--color-accent_hover`: **#1D4ED8**
- `--color-accent_light`: **#DBEAFE**
- `--color-accent_subtle`: **#EFF6FF**
- `--color-border`: **#D1D5DB**
- `--color-border_light`: **#E5E7EB**
- `--color-muted`: **#6B7280**
- `--color-danger`: **#EF4444**
- `--color-danger_light`: **#FEE2E2**
- `--color-warning`: **#F59E0B**
- `--color-warning_light`: **#FEF3C7**
- `--color-success`: **#10B981**
- `--color-card_bg`: **#FFFFFF**
- `--color-card_shadow`: **rgba(0,0,0,0.06)**
- `--color-overlay`: **rgba(0,0,0,0.4)**

## Typography

- `font_family`: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif
- `heading_weight`: 600
- `body_weight`: 400
- `size_scale`: 12px/14px/16px/18px/22px/28px

## Spacing Scale

- `--space-0`: 4px
- `--space-1`: 8px
- `--space-2`: 12px
- `--space-3`: 16px
- `--space-4`: 24px
- `--space-5`: 32px
- `--space-6`: 48px

## Border-Radii

- `--radius-sm`: 4px
- `--radius-md`: 8px
- `--radius-lg`: 12px
- `--radius-pill`: 999px

## Components

### Button (Primary)

bg=accent #2563EB, fg=#FFFFFF, padding 10/20, radius=md 8px, font-weight 500, min-height 44px; hover bg=accent_hover #1D4ED8; active transform scale(0.97), transition 120ms; disabled opacity 0.45, pointer-events none; focus-visible ring 2px #2563EB offset 2px

### Button (Secondary)

bg=transparent, fg=accent #2563EB, border 1px solid #D1D5DB, padding 10/20, radius=md 8px, font-weight 500, min-height 44px; hover bg=accent_subtle #EFF6FF, border=accent; active transform scale(0.97); disabled opacity 0.45

### Button (Danger)

bg=#EF4444, fg=#FFFFFF, padding 10/20, radius=md 8px, font-weight 500, min-height 44px; hover bg=#DC2626; active scale(0.97); disabled opacity 0.45

### Sidebar Navigation

width 240px, bg=bg_sidebar #1B2A4A, fg=fg_sidebar #CDD6E4; item padding 10/16, radius=sm 4px, font-size 14px; hover bg=rgba(255,255,255,0.08); active-item bg=accent #2563EB, fg=#FFFFFF; brand-logo area height 56px, border-bottom 1px solid rgba(255,255,255,0.1)

### Board Column

bg=card_bg #FFFFFF, border 1px solid border_light #E5E7EB, radius=lg 12px, min-width 280px, max-width 340px, padding 12px; box-shadow 0 1px 3px rgba(0,0,0,0.06); column-header padding-bottom 12px, border-bottom 1px solid border_light; WIP-limit-exceeded: bg=#FEF2F2, border=#EF4444, header-bg=#FEE2E2 with danger-icon; transition border-color 250ms ease

### Ticket Card

bg=card_bg #FFFFFF, border 1px solid border_light #E5E7EB, radius=md 8px, padding 12px, box-shadow 0 1px 2px rgba(0,0,0,0.04); hover shadow 0 4px 12px rgba(0,0,0,0.1), border=#D1D5DB; dragging shadow 0 8px 24px rgba(0,0,0,0.16), rotate 2deg, scale 1.02; title font-weight 500, size 14px, line-height 1.4; label-pills inline-flex, height 20px, padding 2/8, radius=pill, font-size 11px, font-weight 500; avatar-placeholder 24x24 circle bg=muted, first-letter white; transition box-shadow 150ms, transform 150ms, border-color 150ms

### Modal / Panel

bg=card_bg #FFFFFF, radius=lg 12px, max-width 640px, padding 24px; overlay bg=overlay rgba(0,0,0,0.4), backdrop-blur 2px; header padding-bottom 16px, border-bottom 1px solid border_light; close-button top-right 12px, icon-only 32x32, radius=sm; animate in fade+scale(0.95→1), 200ms ease-out

### Input Field

bg=#FFFFFF, border 1px solid border #D1D5DB, radius=md 8px, padding 10/14, font-size 14px, fg=#1A2332; placeholder fg=muted #6B7280; hover border=#9CA3AF; focus border=accent #2563EB, ring 3px #DBEAFE; disabled bg=#F9FAFB, opacity 0.6; min-height 44px

### Toast Notification

bg=#1A2332, fg=#FFFFFF, radius=md 8px, padding 12/16, font-size 14px, max-width 380px; box-shadow 0 8px 24px rgba(0,0,0,0.2); success-left-border 4px solid success; warning-left-border 4px solid warning; danger-left-border 4px solid danger; animate slide-in from right, 300ms; auto-dismiss after 5s with fade-out

### Search Bar

bg=card_bg #FFFFFF, border 1px solid border_light #E5E7EB, radius=pill, padding 8/16, font-size 14px, width 100% max 480px, min-height 44px; focus border=accent, ring 3px #DBEAFE; icon left 20px from edge; results-dropdown bg=white, border, radius=md, max-height 360px, scrollable; result-item padding 10/16, hover bg=#F9FAFB

### Activity Log Panel

bg=card_bg #FFFFFF, border-left 1px solid border_light, width 320px, padding 16px; header font-weight 600, size 14px, padding-bottom 12px, border-bottom 1px solid border_light; entry padding 8/0, font-size 13px, border-bottom 1px solid #F3F4F6; timestamp fg=muted, size 11px; animate slide-in from right, 250ms

### Dashboard Cards

bg=card_bg #FFFFFF, border 1px solid border_light, radius=lg 12px, padding 20px, box-shadow 0 1px 3px rgba(0,0,0,0.05); hover shadow 0 4px 16px rgba(0,0,0,0.08); stat-number font-weight 700, size 28px, fg=accent; label size 12px, fg=muted, uppercase tracking-wide

## Layout Principles

- Desktop-First ab 1024px, minimale Tablet-Tauglichkeit; Haupt-Layout: dunkle Sidebar (240px, fixed left) + flexibler Content-Bereich mit overflow-x auto für Board-Spalten
- Maximale Content-Breite im Dashboard: 1200px zentriert; Board-Ansicht: volle Breite, horizontales Scrollen der Spalten via overflow-x auto mit sanftem Scroll-Snap
- Board-Spalten horizontal in einer Reihe per flexbox (gap 16px), vertikaler Inner-Scroll je Spalte für Tickets (overflow-y auto)
- Vertikaler Abstand zwischen großen Sektionen: 32px (spacing-5), zwischen verwandten Elementen: 16px (spacing-3), innerhalb eines Elements: 8-12px (spacing-2)
- Grid-Layout für Dashboard: responsive CSS-Grid mit auto-fill minmax(300px, 1fr) bei gap 20px
- Z-Index-Stufen: Sidebar 100, Modals/Overlay 1000, Toasts 1100, Tooltips 1050
- Sanfte Übergänge global via transition-duration 150-250ms, ease-out; Drag-Übergänge reagieren auf FLIP-Prinzip
- Farbcodierung für Prioritäten: 1 (niedrig)=#9CA3AF, 2=#60A5FA, 3=#2563EB, 4=#F59E0B, 5 (kritisch)=#EF4444 – sichtbar als farbiger Punkt/Label auf Ticket-Karten
