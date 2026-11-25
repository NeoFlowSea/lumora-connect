---
name: anti-slop
description: Review or build Lumora Connect UI so it looks designed by a person, not generated. Use before shipping a new section, page or screen, or when asked to remove the "AI look".
---

# Anti-slop review for Lumora Connect

Work in two passes: find the tells, then fix them with real content from this project.

## 1. Find the tells (read the code and open the page at 1280px and 375px)

Layout
- Three or more sections in a row built from the same card grid (rounded box, icon or number, bold title, grey sentence).
- Everything centred, every section the same height, same padding.
- Cards nested in cards; coloured stripe on one edge of a card.

Surface
- Gradients (especially purple to blue), glass blur panels, glows, blurred blobs, dotted or animated grids, cursor spotlights.
- Default Tailwind look: white or grey card, medium shadow, rounded-lg, on everything.
- Emoji or stock icons used as decoration instead of meaning.

Type
- Overused fonts (Inter, Roboto, Arial). This project uses Onest, Rubik Glitch and Press Start 2P only where CLAUDE.md allows.
- All headings the same size, no clear step between heading, lead and body.

Copy
- Words like: unlock, seamless, elevate, empower, revolutionize, cutting-edge, "in today's fast-paced world".
- Lists of exactly three benefits with parallel wording; invented numbers or quotes.
- Translations that read like machine output in ru or uz.

Motion
- Everything fades up on scroll with the same delay; pulsing dots; bouncing arrows.

## 2. Fix

- Replace decoration with content: a real photo from `public/photos`, a real number from `src/content/lumora.ts`, a real project name.
- Break repetition: change column count, make one item large, turn one card section into plain text with a rule line, or one full-width photo.
- Cut effects that do not carry information. Keep motion only where it shows a change of state.
- Rewrite copy short and concrete; read it aloud as a Lumora organiser would say it. Check ru and uz separately.
- Keep CLAUDE.md rules: palette 60/30/10, one orange action per screen, radius scale, sentence case, 44px tap targets, reduced motion.

## 3. Report

List what you found with file and line, what you changed, and what you left for the owner to decide (anything that changes the visual identity).
