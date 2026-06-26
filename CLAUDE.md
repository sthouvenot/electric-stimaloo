# CLAUDE.md — Autism Party site ("Electric Stimaloo")

Context for Claude Code working on this project. Read this first.

## What this is
A website for an **annual house party** the owner hosts. Guests play a tongue-in-cheek
"how autistic are you" gauntlet that places them on a spectrum; the host reveals everyone live
on a graph at the party. This year (the **2nd** year) the party is themed **"Electric Stimaloo"**,
**Friday, July 24, 2026, 8 PM**, at the host's apartment (**344 3rd Ave, Apt 15G, NYC 10010**).

Live at **https://theautismparty.com** (custom domain — see `CNAME`).

The party quietly donates proceeds to charity. **Do NOT name the specific charity the party
donates to anywhere on the site.** (A *generic* "support autistic-led advocacy" link to ASAN in
the footer is fine — explicitly requested, doesn't reveal the recipient.)

Tone: playful, celebratory, neurodiversity-positive. The bit is affectionate, never mean-spirited.

## Tech / architecture
- **Zero-dependency static site.** No build step, no framework, no npm. Three files:
  - `index.html` — shell (fonts, favicon = `logo.png`, mounts `#app`, loads `app.js`)
  - `styles.css` — all styling (~980 lines)
  - `app.js` — the entire app in one IIFE (~2600 lines): hash router + `localStorage` "backend"
    + every view + the mini-games + the avatar SVG engine + a tiny Web Audio SFX kit.
- **Node is NOT installed** on the original machine; that's why it's vanilla JS. Don't add a
  build toolchain unless asked.
- **Hash router** (`route(path, fn)`, `render()` swaps the view into `#app`). Routes:
  `#/` home · `#/test` the gauntlet · `#/details` logistics · `#/admin` (gated) ·
  `#/intro` (gated, awards show) · `#/present` (gated, live reveal) ·
  `#/debug` (gated, game sandbox — jump to any game + restart) · `#/results` (locked until public).
- **"Backend" is fake** — `localStorage` only. Keys (`LS` object): `ap_submissions_v1`,
  `ap_results_public_v1`, `ap_admin_auth_v1`, `ap_dev_unlocked_v1`. 10 demo guests auto-seed when
  submissions are empty. **PER-DEVICE** — phones don't sync to the host. Real shared backend is
  still the big planned item (see below).

## Running / previewing
Can double-click `index.html`, or use the static server in `.claude/launch.json`:
```
python -m http.server 5050   # then http://localhost:5050
```
**Gotcha:** the preview screenshot tool here times out (sandbox can't settle on remote fonts).
Verify via `preview_eval` (DOM/JS inspection), not screenshots.

## Editing `app.js` — key things
- `CONFIG` (top): `partyName`, `edition`, `year`, `date`, `time`, `adminPassword` (`"spectrum"`),
  `devPin` (`"4444"`). All mock gates — client-side, not real security.
- **Cache-busting:** assets are linked as `styles.css?vN` / `app.js?vN` in `index.html`. After
  meaningful changes, BUMP the `?v=` number or browsers/preview serve stale files. (Currently high,
  ~v63 — it's been bumped a lot.)
- **Stale seed gotcha:** demo guests only re-seed when `ap_submissions_v1` is empty. If you change
  the seed/submission shape, clear that key (and bump `?v=`) or you'll see old-format data.
- **Line-ending gotcha:** `CNAME` and `*.html` are pinned to LF via `.gitattributes` (CRLF can break
  the custom domain). Don't fight it.

## The gauntlet (`#/test`) — the core product
Replaces the old text quiz. Flow: **character creator → (optional welcome/date interstitial) →
10 mini-games → score → submit to pending queue.** Score = sum of per-game scores (0–3 each)
/ `MAX_RAW` (`QUESTIONS.length`×3) × 100. Games live in the `QUESTIONS` array (`kind` per game);
a shared **`dispatchGame(qbody, Q, i, state, setAnswer)`** helper renders the right `render*Game()`
(also reused by the debug sandbox). `setAnswer(points, metrics)` records the score + stashes metrics
for the awards show. `GAME_LABELS` maps kind → human label.

The 10 games (in order): **bank PIN** (entropy of a 4-digit PIN) · **train** (how long you watch
before picking) · **color** memory (match a hue) · **dodge** (survive falling junk; left/right
buttons + arrow keys; avatar renders with `noBg`) · **WHG** (World's Hardest Game, 3 levels; cross
d-pad, no give-up button) · **rock-paper-scissors** (rigged — computer ALWAYS wins the match;
round 1 is 50/50, then forced; retry button after each loss; scored on **games played**, not time,
via `rpsGames` metric) · **typing** race · **Queen Elizabeth birthday** guess (21 Apr 1926;
`DAY_FACTS` powers an "on this day" reveal) · **"holes in a Polo?"** meme trivia (4 is the funny
"right" answer, scored silently) · **re-enter PIN** (recall the one from game 1).

`avatarSVG(cfg, opts)` takes an optional `{ noBg: true }` to drop the backdrop (used by dodge + RPS).

- **Real name required** — host approves by recognition. There's a "use your real name" disclaimer.
- **Dev gate:** a gag "under development" PIN screen; entering `devPin` (`4444`) unlocks and sets
  `ap_dev_unlocked_v1`.
- **Returning guests:** `RETURNING_GUESTS` + `RETURNING_SENTENCES` (matched on first name + last
  initial) trigger a personalized welcome-back card before the games.
- **"Date guest" joke flow:** `DATE_GUESTS` (a couple hardcoded names) get a fake tongue-in-cheek
  "survey" then a "just kidding" beat before the real games. Keep this gag intact.

## Build-a-human avatars
Parametric SVG via `avatarSVG(cfg)` (NOT images/emoji). Config: `face` ('masc'|'femme'), `skin`,
`hairStyle`, `hairColor`, `shirt`, `mood`, `bg`, `eyewear`, `facialHair`, `headwear`,
`headwearColor`, `drink`, + booleans `earrings`/`freckles`/`blush`/`headphones`. Palettes/option
tables: `SKINS`, `HAIRCOLORS`, `SHIRTS`, `BGS`, `HAIRSTYLES`, `MOODS`, `DRINKS`, `HAIR`, `mouthFor()`,
`DEFAULT_AVATAR`, `AV_PRESETS`. The avatar renders on graph pins, reveal, podium, admin, leaderboard,
result. (An older `EMOJI_CHOICES` picker may linger unused — fine to remove.)

## Host flow (party night)
1. `#/admin` (password `spectrum`) — approve/reject the pending queue; toggle **results_public**.
2. `#/intro` — **Mario-Party-style awards show**: `buildAwards()` derives superlatives from the
   stored per-game **metrics** (longest train stare, quickest draw, reflex champ, dead-center, etc.),
   revealed one at a time with confetti. Suspense-builder before the podium.
3. `#/present` — live reveal. Approved guests sorted least→most autistic, dropped onto the rainbow
   spectrum graph one at a time (ding SFX + positional confetti). A **drum-roll** builds for the last
   two; the **final 3 get a podium** (🥉→🥈→👑) revealed one at a time, champion = "THE MOST AUTISTIC"
   with a big confetti burst + fanfare. `presentRevealed` tracks progress; Reset rewinds.
4. `#/results` — locked (🤫) until host flips public; then full graph + ranked leaderboard (🥇🥈🥉).

There's a small **Web Audio SFX kit** (`sfx.ding/crash/fanfare/drumroll`) and a canvas
`confetti.burst()` used across the reveal/awards.

## Details page (`#/details`)
Deliberately over-produced "festival logistics" for what is just an apartment: multi-modal
directions (foot/subway/rail/air/car/bike/helicopter) with real Google Maps links + an FAQ
(free pizza/drinks, prizes, surprises). Access note: **no buzzer/code — walk straight in, elevator
to the 15th floor.** A Spotify embed lives here too.

## Home (`#/`)
Single-screen landing: hero with jiggling ⚡ bolts + a train marquee + a scattered **polaroid
collage** of last year's photos (champion centered, rainbow frame). Mobile = stacked + horizontal
photo strip + **hamburger nav**. No "fun facts" on home (removed by request).

## Design system (brutalist carnival)
CSS variables at top of `styles.css`. Cream paper bg + dot grid; thick black borders; hard offset
shadows (no blur); tilted "sticker" cards; rainbow (neurodiversity) accents.
Fonts: **Bagel Fat One** (fat display), **Bricolage Grotesque** (headings), **Space Grotesk** (body),
**Permanent Marker** (accents).

## Assets
- `logo.png` (root) — 4-piece puzzle logo; header brand + favicon.
- `photos/2025/*` — real photos from last year (`champion.jpg`, `the-gang.png`, `the-reveal.png`,
  `the-test.jpg`, `the-crowd.jpg`, `the-crew.jpg`, `mascot.jpg`). Used in the home collage.
- `.gitignore` keeps the **real guest list** out of the repo (`*.xlsx`, `*.py` are ignored) — don't
  commit anyone's real names / spreadsheets.

## Git / GitHub
- Repo: **https://github.com/sthouvenot/electric-stimaloo** (PRIVATE). Branch `main`.
- `git add -A && git commit -m "..." && git push`. Custom domain `theautismparty.com` via `CNAME`.

## Planned / open work
- **Real shared backend** so all phones submit to ONE queue the host sees (current localStorage is
  per-device). Plan: Supabase free tier (submissions table w/ status, password-gated admin,
  realtime graph). UI stays the same.
- The host's *real* legacy quiz is the "Reading the Mind in the Eyes" test scored in a Google Sheet;
  the on-site mini-games are the fun replacement.
- Possible **Prizes section**. Real prizes: 🥇 train set, 🥈 pinwheel hat, 🥉 lollipop; idea floated
  for a "Most Neurotypical" booby prize (e.g. a "Live Laugh Love" sign).

## Working preferences observed
- **COMMIT + PUSH after every change.** The user wants nothing left sitting uncommitted — after each
  task/feature, bump `?v=`, then `git add -A && git commit && git push`. Don't wait to be asked.
- The user vibe-codes: move fast, make opinionated choices, show results, offer to revert.
- Verify changes with `preview_eval` (screenshots don't work here). Bump `?v=` after changes.
- History matters: don't reintroduce removed things (emoji picker → avatars, "fun facts" off home,
  text quiz → mini-games). Keep the joke flows (date guests, dev gate, Polo) intact.
