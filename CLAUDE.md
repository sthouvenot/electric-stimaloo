# CLAUDE.md — Autism Party site ("Electric Stimaloo")

Context for Claude Code working on this project. Read this first.

## What this is
A website for an **annual house party** the owner hosts. Guests take a tongue-in-cheek
"how autistic are you" quiz that places them on a spectrum; the host reveals everyone live
on a graph at the party. This year (the **2nd** year) the party is themed **"Electric Stimaloo"**,
on **Friday, July 24, 2026**, at the host's apartment (**344 3rd Ave, Apt 15G, NYC 10010**).

The party quietly donates proceeds to charity. **Do NOT name the specific charity the party
donates to anywhere on the site.** (A *generic* "support autistic-led advocacy" link to ASAN is
allowed in the footer — that was explicitly requested and doesn't reveal the donation recipient.)

Tone: playful, celebratory, neurodiversity-positive (rainbow infinity / puzzle motif). The quiz is
a fun party bit, never mean-spirited.

## Tech / architecture
- **Zero-dependency static site.** No build step, no framework, no npm. Just three files:
  - `index.html` — shell (fonts, favicon = `logo.png`, mounts `#app`, loads `app.js`)
  - `styles.css` — all styling
  - `app.js` — entire app: hash router + `localStorage` "backend" + every view, in one IIFE
- **Node is NOT installed** on the original machine; that's why it's vanilla JS. Don't introduce a
  build toolchain unless the user asks.
- **Hash router.** Routes: `#/` (home), `#/test`, `#/details`, `#/admin`, `#/present`, `#/results`.
  Routes registered via `route(path, fn)`; `render()` swaps the view into `#app`.
- **"Backend" is fake** — all data in `localStorage` (`ap_submissions_v1`, `ap_results_public_v1`,
  `ap_admin_auth_v1`). 10 demo guests are auto-seeded. THIS IS PER-DEVICE — submissions don't sync
  between phones. For the real party the user will want a real shared backend (see "Planned work").

## Running / previewing
No server strictly needed (can double-click `index.html`), but for the preview tooling use the
static server in `.claude/launch.json`:
```
python -m http.server 5050   # then http://localhost:5050
```
**Gotcha:** the preview screenshot tool in this environment times out (sandbox can't settle on
remote fonts). Verify via `preview_eval` (DOM/JS inspection) instead of screenshots.

## Key things to know before editing `app.js`
- `CONFIG` (top of file) holds party name, edition, year, date, and the **admin password**
  (`"spectrum"` — mock gate only, client-side, not real security).
- **Cache-busting:** `index.html` links assets as `styles.css?vN` / `app.js?vN`. After meaningful
  changes, BUMP the `?v=` number so browsers (and the preview) reload fresh. (Currently v4.)
- **Stale seed gotcha:** the demo guests only re-seed when `localStorage` is empty. If you change
  the seed shape, clear `ap_submissions_v1` (and bump `?v=`) or you'll see old-format data.
- **Build-a-human avatars** are parametric SVG (`avatarSVG(cfg)`), not images/emoji. Config fields:
  `face` ('masc'|'femme'), `skin`, `hairStyle`, `hairColor`, `shirt`, `eyewear`, `facialHair`,
  `headwear`, + booleans `earrings`/`freckles`/`blush`/`headphones`. Palettes: `SKINS`, `HAIRCOLORS`,
  `SHIRTS`, `HAIRSTYLES`, `HAIR`. The avatar renders on graph pins, reveal, admin, leaderboard, result.
  (An older emoji picker, `EMOJI_CHOICES`, is left in the file unused as a fallback — can be removed.)

## How the flow works (the core product)
1. **`#/test`** — character creator FIRST (first name + single last initial + build-a-human avatar +
   honesty checkbox), THEN the 12-question quiz. Score 0–100 → tier (`TIERS`). Submits to the
   pending queue. Users are told to use their **real name** (host approves by recognition).
2. **`#/admin`** (password-gated) — approve/reject the pending queue; a switch flips
   `results_public` for after the party.
3. **`#/present`** (also password-gated) — host-driven reveal. Approved guests sorted least→most
   autistic, dropped onto a rainbow spectrum graph one at a time. **The final 3 get a podium
   finale**: a 🥉→🥈→👑 podium reveals them one at a time (3rd, 2nd, then "THE MOST AUTISTIC"
   champion with a big confetti burst).
4. **`#/results`** — locked (🤫) until the host flips it public post-party; then shows the full
   graph + ranked leaderboard.
- **`#/details`** — deliberately over-produced "festival logistics" page (it's just an apartment):
  multi-modal directions with real Google Maps links + an FAQ (free pizza/drinks, prizes, surprises).
  Access note: no buzzer/code, walk straight in, elevator to 15th floor.
- **Home** (`#/`) — single-screen landing: hero with jiggling ⚡ bolts + a scattered polaroid
  collage of last year's photos (champion centered with a rainbow frame). Mobile = stacked +
  horizontal photo strip. No "fun facts" on home (removed by request).

## Design system (brutalist carnival)
Defined via CSS variables at top of `styles.css`. Cream paper bg + dot grid; thick black borders;
hard offset shadows (no blur); tilted "sticker" cards; rainbow (neurodiversity) accents.
Fonts: **Bagel Fat One** (fat display), **Bricolage Grotesque** (headings), **Space Grotesk** (body).

## Assets
- `logo.png` (root) — the 4-piece puzzle logo; used as header brand + favicon.
- `photos/2025/*` — real photos from last year's party, used in the home collage. Filenames are
  semantic (`champion.jpg`, `the-gang.png`, `the-reveal.png`, `the-test.jpg`, `the-crowd.jpg`,
  `the-crew.jpg`, `mascot.jpg`).

## Git / GitHub
- Repo: **https://github.com/sthouvenot/electric-stimaloo** (PRIVATE).
- Just `git add -A && git commit -m "..." && git push`. Default branch `main`.

## Planned / open work (not done yet)
- **Real shared backend** so all phones submit to ONE queue the host sees (current localStorage is
  per-device). Plan discussed: Supabase free tier (submissions table w/ status, password-gated admin,
  realtime graph). UI would stay the same.
- The host's **real** quiz is the "Reading the Mind in the Eyes" test scored in a Google Sheet; the
  on-site 12-Q personality quiz is a placeholder the user said they'll change later.
- Possible **Prizes section** (Details/FAQ). Real prizes: 🥇 train set, 🥈 pinwheel hat, 🥉 lollipop.
  Idea floated for a "Most Neurotypical" booby prize (e.g. a "Live Laugh Love" sign).
- Deploy for a real URL: Netlify/Vercel (host private repos free; GitHub Pages needs public).

## Working preferences observed
- The user vibe-codes: move fast, make opinionated choices, show results, offer to revert.
- Verify changes with `preview_eval` (screenshots don't work here).
- The emoji→avatar and "fun facts removed" history means: don't reintroduce removed things.
