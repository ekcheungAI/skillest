# AI Persona Library — Design Brainstorm v2

## Brief
Card-game-style persona picker. Clean, readable. Focus on working style + thinking style.
Users should feel like they're building a deck of mental models to install into their AI stack.

---

<response>
<idea>

**Design Movement:** Swiss International Typographic Style meets Trading Card Game
**Probability:** 0.07

**Core Principles:**
1. Every card is a self-contained artifact — like a Pokémon card or Magic: The Gathering card but for minds
2. Information hierarchy is ruthless: the most important thing (thinking style archetype) is always the largest element
3. Whitespace is structural, not decorative — it creates breathing room between dense information
4. The "stack" (selected personas) is always visible as a persistent tray at the bottom

**Color Philosophy:**
Each persona gets a unique card "element" color (like card game types). The background is off-white cream (#F5F0E8) — warm, paper-like, tactile. Cards have colored top-edge accents and subtle grain texture. No dark mode — this is a daytime reading tool.

**Layout Paradigm:**
Asymmetric masonry grid on the library page. Cards are portrait-oriented (like actual cards) — taller than wide. The selected stack tray slides up from the bottom of the screen. Detail page uses a two-column layout: left is the card (large, pinned), right is the scrollable content.

**Signature Elements:**
- Card "type" badge in top-left corner (like card game element icons)
- Personality "power stats" displayed as a compact 6-stat grid at the bottom of each card (like Pokémon base stats)
- A "rarity" indicator (Common / Rare / Legendary) based on how unique their thinking style is

**Interaction Philosophy:**
Cards can be "flipped" to reveal the AI prompt on the back. Selecting a card adds it to the bottom tray with a satisfying snap animation. The stack tray shows mini cards and a "Copy Stack Prompt" button that combines all selected personas.

**Animation:**
Card hover = subtle lift + shadow deepening (3D tilt effect). Card select = flip animation. Stack tray = slide-up from bottom. Page load = cards cascade in staggered.

**Typography System:**
- Display: Playfair Display (serif, editorial authority)
- Body: DM Sans (clean, highly readable)
- Stats/Code: JetBrains Mono
- Card name: Playfair Display Bold, large
- Thinking archetype: DM Sans Medium, muted

</idea>
<probability>0.07</probability>
</response>

<response>
<idea>

**Design Movement:** Brutalist Editorial — newspaper meets command terminal
**Probability:** 0.06

**Core Principles:**
1. Raw information density — no decoration, just content
2. Bold typographic hierarchy with extreme size contrast
3. Cards are rectangular tiles in a strict grid, like newspaper columns
4. Color is used only for function (status, category) — never decoration

**Color Philosophy:**
Pure white background, black ink, one accent color per category (red for Politics, blue for Tech, green for Finance). Like a financial newspaper. Cards have thick black borders.

**Layout Paradigm:**
Strict 4-column grid. Cards are landscape-oriented (wider than tall). The stack is a sidebar on the right that fills as you select cards.

**Signature Elements:**
- Large issue-number style card ID in the top-right corner
- Thinking style displayed as a bold headline, like a newspaper lede
- "Filed under:" category tags at the bottom

**Interaction Philosophy:**
Click to select — no hover states, no animations. Pure information retrieval. The stack sidebar updates instantly.

**Animation:**
None intentional — fast, snappy transitions only. No decorative motion.

**Typography System:**
- Display: Space Grotesk Bold (grotesque, authoritative)
- Body: IBM Plex Serif (editorial, readable)
- Stats: IBM Plex Mono

</idea>
<probability>0.06</probability>
</response>

<response>
<idea>

**Design Movement:** Premium SaaS meets Physical Card Game (Chosen)
**Probability:** 0.09

**Core Principles:**
1. Light, airy, and clean — like Notion or Linear but with card-game DNA
2. Cards feel physical: subtle shadows, slight rotation on hover, paper texture
3. The "thinking style archetype" is the hero of each card — displayed prominently as a colored badge
4. The stack/selection system is the core interaction — always visible, always actionable

**Color Philosophy:**
Background: very light warm gray (#F8F7F4). Cards: pure white with colored left-border accent (each persona's unique color). Typography: near-black (#1A1A1A) for maximum readability. Accent colors are saturated and distinct per persona. No gradients — flat with depth from shadows only.

**Layout Paradigm:**
3-column card grid on desktop, 2 on tablet, 1 on mobile. Cards are portrait-oriented. Left sidebar for filters (collapsible). Bottom sticky tray for the selected stack. Detail page: full-width hero banner with the card design, then tabbed content below.

**Signature Elements:**
- Left colored border accent (persona's unique color) — the "card spine"
- Thinking archetype badge prominently displayed (e.g., "First Principles", "Ecosystem Builder")
- 6 mini stat bars at the bottom of each card (compact, scannable)
- "Add to Stack" button that triggers a satisfying card-snap animation into the bottom tray

**Interaction Philosophy:**
Cards are browsable and selectable. The stack tray is the output — it shows selected personas and generates a combined system prompt. Detail page focuses on deep reading: working style, thinking style, then the AI prompt.

**Animation:**
Card hover = 2px lift + shadow. Card select = scale pulse + fly to tray. Tray = slide up. Page transitions = fade. Framework expand = accordion with smooth height transition.

**Typography System:**
- Display: Fraunces (optical-size serif, warm and authoritative)
- Body: Inter (clean, highly readable — intentionally neutral to let content breathe)
- Stats/Mono: JetBrains Mono
- Card name: Fraunces Bold, 22px
- Archetype badge: Inter SemiBold, uppercase, 11px

</idea>
<probability>0.09</probability>
</response>

---

## Chosen: Premium SaaS meets Physical Card Game

Light background, white cards with colored left-border spines, Fraunces + Inter typography.
The thinking archetype badge is the hero. The stack tray is the core interaction.
Clean, readable, tactile — like a well-designed physical card game but on screen.
