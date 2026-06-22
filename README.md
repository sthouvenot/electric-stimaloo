# Autism Party 2026 🧠♾️

A zero-dependency party website. Guests take a 12-question test, get placed on a spectrum,
and you (the host) approve them and reveal them one-by-one on a live graph at the party.

**No build step, no install, no signup.** All data is faked in the browser's `localStorage`.

## How to open it

- **Easiest:** double-click `index.html`.
- **Or serve it** (nicer, avoids any file:// quirks): `python -m http.server 5050` then visit http://localhost:5050

## The pages (all from one site)

| Route | What it is | Who |
|-------|-----------|-----|
| `#/` (Home) | Hero + tabs: **The Test**, **Fun Facts**, **Past Years** | Everyone |
| `#/admin` | The approval queue + "make results public" switch | You only (password) |
| `#/present` | The live reveal - drop guests onto the graph least → most | You, on the TV |
| `#/results` | The full spectrum graph + ranked list | Locked until you flip it public |

Links are in the header and footer.

## Host cheat-sheet

- **Admin password:** `spectrum` - change it in `app.js` → `CONFIG.adminPassword`
- **Party name / year / date:** also in `app.js` → `CONFIG`
- **The flow on party night:**
  1. Guests take the test on their phones → land in your **pending queue**.
  2. You open `#/admin`, log in, and **Approve** the real guests.
  3. Open `#/present` on the TV. Hit **Reveal next** to drop each guest onto the spectrum,
     in order from least to most autistic. Confetti included.
  4. After the party, flip **"Make results public"** ON in admin. Now `#/results` is open to all.

## What's faked right now

- **10 demo guests** are pre-seeded so the graph/results look alive. They're tagged `(demo)`
  in the admin queue - delete them whenever.
- Real submissions persist in `localStorage` on the device they were taken on.
- **Past Years photos** are placeholders (picsum.photos) - swap in real pics later.

## Customizing

- **Test questions / scoring:** `app.js` → `QUESTIONS` array (each option scored 0-3).
- **Result tiers / names / blurbs:** `app.js` → `TIERS`.
- **Fun facts & past-year captions:** `factsView()` and `pastYearsView()` in `app.js`.
- **Colors / vibe:** CSS variables at the top of `styles.css`.

## ⚠️ Important: localStorage is per-device

Because everything is faked client-side, each phone keeps **its own** submissions - they don't
sync to your laptop. That's fine for testing and feeling out the design. For the real party where
**you need to see everyone's submissions in one place**, we wire up a real backend
(Supabase free tier) so all phones submit to one queue you control. Say the word and I'll do that
port next - the whole UI stays the same.

## Deploying live later

It's plain static files - drop the folder on Netlify, Vercel, GitHub Pages, or Cloudflare Pages
and it just works. (No server needed.)
