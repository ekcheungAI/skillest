# AI Persona Library — Design Brainstorm

## Approach A — "Intelligence Dossier"
**Design Movement:** Cold War spy file meets Silicon Valley brutalism
**Core Principles:** Information density, classified-file aesthetic, monochrome with sharp accent
**Color Philosophy:** Near-black (#0D0D0D) base, warm parchment card backgrounds, single electric amber (#F59E0B) accent for CTAs and highlights
**Layout Paradigm:** Asymmetric grid — hero takes 60% width, sidebar navigation on the left, cards arranged in a masonry-style staggered layout
**Signature Elements:** Redacted-text effect on hover, typewriter font for labels, classified stamp watermarks
**Interaction Philosophy:** Every hover reveals more information progressively — the "dossier opens" metaphor
**Animation:** Typewriter entrance animations, stamp-reveal for category badges, slide-in from left for cards
**Typography System:** IBM Plex Mono (labels/code) + Playfair Display (names) + IBM Plex Sans (body)
<probability>0.08</probability>

## Approach B — "Executive Intelligence Terminal"
**Design Movement:** Bloomberg Terminal meets luxury editorial magazine
**Core Principles:** Dark command-center aesthetic, data-forward layout, premium typography, high information density
**Color Philosophy:** Deep charcoal (#111827) background, off-white text, electric teal (#0EA5E9) as primary accent, gold (#D97706) for premium highlights. The darkness conveys authority and focus.
**Layout Paradigm:** Full-bleed dark background with a top navigation bar. Cards arranged in a 3-column grid with clear hierarchy. A sticky left sidebar for category filters.
**Signature Elements:** Thin horizontal rule dividers, monospace data labels, glowing accent borders on hover
**Interaction Philosophy:** Precision and speed — filters snap instantly, cards expand inline with smooth transitions
**Animation:** Subtle fade-in on load, card border glow on hover, smooth expand/collapse for detail panels
**Typography System:** Space Grotesk (headings) + Inter (body) + JetBrains Mono (code/prompts)
<probability>0.07</probability>

## Approach C — "Persona Codex"
**Design Movement:** Dark academic meets modern SaaS product
**Core Principles:** Deep, rich color palette; editorial layout with strong typographic hierarchy; tactile card design; cinematic photography treatment
**Color Philosophy:** Deep navy (#0F172A) base, slate-800 cards, vivid indigo (#6366F1) primary accent, warm amber (#F59E0B) secondary accent. Colors evoke depth, intelligence, and trust.
**Layout Paradigm:** Full-width hero with a dramatic title, then a 3-column card grid below. Each card has a photo zone, metadata strip, and expandable detail panel. No sidebar — filters live in a horizontal pill row at the top.
**Signature Elements:** Diagonal photo crop on cards, trait radar chart visualization, monospace prompt code block
**Interaction Philosophy:** Cards feel like physical objects — they lift on hover, expand to reveal depth
**Animation:** Cards slide up on page load with staggered delay, photo desaturates to color on hover, prompt block types out character by character
**Typography System:** Bebas Neue (large display) + Lora (body text) + Fira Code (prompts/code)
<probability>0.06</probability>

---

## Selected Approach: B — "Executive Intelligence Terminal"

Dark command-center aesthetic with Bloomberg Terminal meets luxury editorial magazine. Deep charcoal background, electric teal accents, Space Grotesk + JetBrains Mono typography. Cards arranged in a clean 3-column grid with trait visualization, expandable detail panels, and a one-click prompt copy feature.
