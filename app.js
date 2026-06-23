/* ============================================================
   Autism Party 2026 - app.js
   Zero-dependency SPA. Hash router + localStorage "backend".
   Routes: #/ (main, tabbed)  #/admin  #/present  #/results
   ============================================================ */

(function () {
  "use strict";

  /* ----------------------------------------------------------
     CONFIG - tweak the party here
     ---------------------------------------------------------- */
  const CONFIG = {
    partyName: "Autism Party",
    edition: "Electric Stimaloo", // this year's theme name
    year: 2026,
    date: "Friday, July 24th",
    time: "8 PM EST", // doors / start time
    adminPassword: "spectrum", // mock-only gate; not real security
  };

  /* ----------------------------------------------------------
     RETURNING GUESTS - last year's attendees. If someone enters a
     matching name they get a "welcome back" bonus before the test.
     Matched on first name + last initial (case-insensitive).
     ---------------------------------------------------------- */
  // host-written welcome line per returning guest (keyed by full name). Blanks fall back to the default.
  const RETURNING_FALLBACK = "That was pretty autistic of you to come back for round two. 🏆";
  const RETURNING_SENTENCES = {
    "Mikayla Fishel": "You really should get bonus points for that time you set stuff on fire in our apartment.",
    "Robert Mallow": "You really should get bonus points for owning a 3D printer.",
    "Elijah Fishel": "You were the least autistic person last year. Why are you even here?",
    "Dan Shapiro": "Everyone in vegas said you were autistic as hell.",
    "Greg Righter": "We are hoping you wore that cute autistic shirt again this year.",
    "Brian Righter": "Having sex with your subordinate? Now that's pretty autistic.",
    "Alexa Cimino": "Filming my speech from last year? Pretty autistic.",
  };
  const RETURNING_GUESTS = [
    { first: "Mikayla", initial: "F", full: "Mikayla Fishel" },
    { first: "Robert", initial: "M", full: "Robert Mallow" },
    { first: "Stephen", initial: "T", full: "Stephen Thouvenot" },
    { first: "Elijah", initial: "F", full: "Elijah Fishel" },
    { first: "Dan", initial: "S", full: "Dan Shapiro" },
    { first: "Danny", initial: "S", full: "Dan Shapiro" },
    { first: "Matt", initial: "M", full: "Matt Milburn" },
    { first: "James", initial: "O", full: "James Owens" },
    { first: "Andy", initial: "L", full: "Andy Lieu" },
    { first: "Greg", initial: "R", full: "Greg Righter" },
    { first: "Pat", initial: "D", full: "Pat Dunleavy" },
    { first: "Brian", initial: "R", full: "Brian Righter" },
    { first: "Conor", initial: "M", full: "Conor Moore" },
    { first: "Justin", initial: "C", full: "Justin Cenname" },
    { first: "Cory", initial: "G", full: "Cory Grubbs" },
    { first: "Chris", initial: "B", full: "Chris Belden" },
    { first: "Rob", initial: "M", full: "Robert Mallow" },
    { first: "Samiha", initial: "M", full: "Samiha M" },
    { first: "Roman", initial: "B", full: "Roman Bost" },
    { first: "Alexa", initial: "C", full: "Alexa Cimino" },
  ];
  function findReturningGuest(firstName, lastInitial) {
    const f = (firstName || "").trim().toLowerCase();
    const i = (lastInitial || "").trim().toUpperCase().slice(0, 1);
    if (!f || !i) return null;
    return RETURNING_GUESTS.find(g => g.first.toLowerCase() === f && g.initial === i) || null;
  }
  // girls the host has been on a date with -> they get a tongue-in-cheek "survey" instead of the quiz
  const DATE_GUESTS = [
    { first: "Mollie", initial: "W" },
    { first: "Rachel", initial: "W" },
  ];
  function findDateGuest(firstName, lastInitial) {
    const f = (firstName || "").trim().toLowerCase();
    const i = (lastInitial || "").trim().toUpperCase().slice(0, 1);
    if (!f || !i) return null;
    return DATE_GUESTS.find(g => g.first.toLowerCase() === f && g.initial === i) || null;
  }

  /* ----------------------------------------------------------
     PHOTOS - last year's pics (shown as a collage on the home page)
     ---------------------------------------------------------- */
  // champion goes FIRST - it's the centered highlight of the collage
  const PHOTOS = [
    { src: "photos/2025/champion.jpg", cap: "Reigning Champion 🏆" },
    { src: "photos/2025/the-gang.png", cap: "The whole gang 🌈" },
    { src: "photos/2025/the-test.jpg", cap: "Test in session" },
    { src: "photos/2025/the-crowd.jpg", cap: "The whole room 👀" },
    { src: "photos/2025/the-crew.jpg", cap: "Good company" },
    { src: "photos/2025/mascot.jpg", cap: "Mascot 🐾" },
  ];
  // collage layout: index 0 = champion (centered, front, big); the rest sit symmetrically around it
  // (matching top pair + matching bottom pair, mirrored L/R, with the mascot peeking up top-centre)
  const COLLAGE_POS = [
    { r: "-2deg", t: "27%", l: "16%",   z: 10, w: "52%" }, // champion - center highlight
    { r: "-6deg", t: "11%", l: "-6%",   z: 5,  w: "37%" }, // top-left
    { r: "6deg",  t: "11%", l: "53%",   z: 5,  w: "37%" }, // top-right   (mirrors top-left)
    { r: "6deg",  t: "61%", l: "-6%",   z: 4,  w: "37%" }, // bottom-left
    { r: "-6deg", t: "61%", l: "53%",   z: 4,  w: "37%" }, // bottom-right (mirrors bottom-left)
    { r: "2deg",  t: "0%",  l: "23.5%", z: 2,  w: "37%" }, // mascot - top-centre peek above champion
  ];

  /* ----------------------------------------------------------
     EMOJI - the avatar palette for character creation
     ---------------------------------------------------------- */
  const EMOJI_CHOICES = [
    "😎","🤓","🥳","🧠","😴","🤠","🥸","🤖","👽","👾","🦾","🧙","🦸","🧛","🧜",
    "🦄","🐙","🐸","🐱","🐶","🦊","🐼","🦁","🐲","🦖","🐧","🦝","🦦","🐝","🦋",
    "🌟","🔥","🌈","🍕","🍄","🎮","🎧","🎸","🎨","📚","🚀","💀","👑","🛸","⚡",
  ];

  /* ----------------------------------------------------------
     BUILD-A-HUMAN - parametric SVG avatar
     ---------------------------------------------------------- */
  const SKINS = ["#ffe0c2", "#ffdab3", "#f4c896", "#e6a866", "#c98a52", "#a96a3d", "#824c2c", "#5c3620"];
  const HAIRCOLORS = ["#1c1c1c", "#3b2417", "#6b4423", "#a86a32", "#e3b04b", "#c0531f", "#9a9a9a", "#ededed", "#ff4d97", "#2f9bff", "#2ec27e", "#8b5cf6"];
  const SHIRTS = ["#2f9bff", "#ff3d7f", "#ffd23f", "#2ec27e", "#8b5cf6", "#ff8a3d", "#16b5b5", "#e23d4b", "#2a2a2a", "#ededed"];
  // soft backdrops for the avatar circle
  const BGS = ["#ffffff", "#fff0c8", "#ffe0ec", "#dcecff", "#e3f9e5", "#ece2ff", "#ffe6d4", "#d8f3ff"];
  const HAIRSTYLES = [
    { id: "bald", label: "Bald" }, { id: "short", label: "Short" }, { id: "curly", label: "Curly" },
    { id: "afro", label: "Afro" }, { id: "spiky", label: "Spiky" }, { id: "long", label: "Long" },
    { id: "wavy", label: "Wavy" }, { id: "bun", label: "Bun" }, { id: "pony", label: "Ponytail" },
    { id: "pigtails", label: "Pigtails" }, { id: "mohawk", label: "Mohawk" },
  ];
  // facial expressions: each returns the mouth markup; eyes get a shared highlight
  const MOODS = [
    { id: "smile", label: "🙂 Smile" }, { id: "grin", label: "😁 Grin" }, { id: "chill", label: "😌 Chill" },
    { id: "wow", label: "😮 Wow" }, { id: "smirk", label: "😏 Smirk" },
  ];
  // a crown cap that reliably covers the top of the head down to the hairline.
  // outer controls sit well above the head top (y=16) so the bezier actually
  // crests over the crown; inner curve is the hairline.
  const cap = c => `<path d="M24,46 C20,2 80,2 76,46 C72,40 62,31 50,31 C38,31 28,40 24,46 Z" fill="${c}"/>`;
  const HAIR = {
    bald: {},
    short: { top: c => cap(c) },
    // curly: a bumpy curl silhouette - cap base + a ring of curl bumps + small forehead curls
    curly: {
      back: c => `<g fill="${c}"><circle cx="27" cy="38" r="8"/><circle cx="73" cy="38" r="8"/><circle cx="24" cy="30" r="6.5"/><circle cx="76" cy="30" r="6.5"/></g>`,
      top: c => `<g fill="${c}">${cap(c)}<circle cx="31" cy="22" r="7"/><circle cx="42" cy="16" r="7.5"/><circle cx="50" cy="13.5" r="7.5"/><circle cx="58" cy="16" r="7.5"/><circle cx="69" cy="22" r="7"/><circle cx="24" cy="33" r="5.5"/><circle cx="76" cy="33" r="5.5"/><circle cx="37" cy="30" r="3.4"/><circle cx="50" cy="28.5" r="3.4"/><circle cx="63" cy="30" r="3.4"/></g>`,
    },
    afro: { back: c => `<circle cx="50" cy="30" r="28" fill="${c}"/>`, top: c => cap(c) },
    // spiky: cap base + a row of more, finer spikes (spikier but not as tall/aggressive)
    spiky: { top: c => `<g fill="${c}">${cap(c)}<path d="M23,35 L27,12 L31,33 L36,11 L40,33 L44,10 L49,33 L53,10 L57,33 L62,11 L66,33 L71,12 L77,35 Z"/></g>` },
    // `drape: true` = the back piece hangs below a hat, so it survives when headwear is on
    long: { drape: true, back: c => `<path d="M22,42 C22,14 78,14 78,42 L78,84 L65,84 L65,44 C65,30 59,25 50,25 C41,25 35,30 35,44 L35,84 L22,84 Z" fill="${c}"/>`, top: c => cap(c) },
    // wavy: long base with a scalloped, wavy hem
    wavy: { drape: true, back: c => `<path d="M21,42 C21,14 79,14 79,42 C79,58 75,64 78,72 C73,70 72,64 68,68 C66,62 62,66 63,58 L63,46 C63,31 58,26 50,26 C42,26 37,31 37,46 L37,58 C38,66 34,62 32,68 C28,64 27,70 22,72 C25,64 21,58 21,42 Z" fill="${c}"/>`, top: c => cap(c) },
    bun: { top: c => `<g fill="${c}"><circle cx="50" cy="13" r="7.5"/>${cap(c)}</g>` },
    // ponytail: cap base + a tail sweeping down behind the right side
    pony: { drape: true, back: c => `<path d="M71,40 C86,44 86,64 79,74 C76,79 70,77 72,72 C78,64 76,54 70,48 C67,45 66,42 71,40 Z" fill="${c}"/>`, top: c => `<g fill="${c}">${cap(c)}<circle cx="70" cy="42" r="3.2"/></g>` },
    // pigtails: cap base + two puffs low on each side
    pigtails: { drape: true, back: c => `<g fill="${c}"><ellipse cx="20" cy="54" rx="9" ry="12"/><ellipse cx="80" cy="54" rx="9" ry="12"/></g>`, top: c => `<g fill="${c}">${cap(c)}<circle cx="26" cy="44" r="3"/><circle cx="74" cy="44" r="3"/></g>` },
    mohawk: { top: c => `<path d="M44,8 L56,8 L53,34 L47,34 Z" fill="${c}"/>` },
  };
  // mouth shape per expression; femme gets lipstick-red, masc a soft line
  function mouthFor(mood, fem) {
    const lip = fem ? "#d6334c" : "#9c4a3a";
    const w = fem ? 2.6 : 2.4;
    switch (mood) {
      case "grin": {
        const lips = fem ? `<path d="M41.5,52.4 Q50,49.4 58.5,52.4" stroke="#d6334c" stroke-width="2.2" fill="none" stroke-linecap="round"/>` : "";
        return `<g><path d="M42,52.5 Q50,63 58,52.5 Q50,55 42,52.5 Z" fill="#9c2c3e"/><path d="M44,53 Q50,55.4 56,53 Q50,53.4 44,53 Z" fill="#fff"/>${lips}</g>`;
      }
      case "chill":
        return `<path d="M44.5,55 q5.5,1.4 11,0" stroke="${lip}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
      case "wow": {
        const ring = fem ? `<ellipse cx="50" cy="55.5" rx="3.6" ry="4.6" fill="none" stroke="#d6334c" stroke-width="1.6"/>` : "";
        return `<g><ellipse cx="50" cy="55.5" rx="3.4" ry="4.4" fill="#9c2c3e"/>${ring}</g>`;
      }
      case "smirk":
        return `<path d="M43.5,55.6 Q50,56.6 57,51" stroke="${lip}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
      default: // smile
        return fem
          ? `<g><path d="M43,53 Q46.5,50.8 50,52.2 Q53.5,50.8 57,53 Q53.5,57.6 50,57.6 Q46.5,57.6 43,53 Z" fill="#d6334c"/><path d="M44,53.2 Q50,54.6 56,53.2" stroke="#a52840" stroke-width="0.8" fill="none" stroke-linecap="round"/></g>`
          : `<path d="M44,54 q6,5 12,0" stroke="#9c4a3a" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    }
  }
  const DRINKS = [
    { id: "none", label: "None" }, { id: "beer", label: "🍺 Beer" }, { id: "seltzer", label: "🥤 Seltzer" },
    { id: "shirley", label: "🍒 Dirty Shirley" }, { id: "lolly", label: "🍭 Lollipop" },
  ];
  // a drink held up in one hand, drawn at the bottom-right of the bust
  function drinkSVG(drink, skin) {
    if (!drink || drink === "none") return "";
    const hand = `<ellipse cx="67.5" cy="78" rx="2.3" ry="3" fill="${skin}" stroke="rgba(0,0,0,.35)" stroke-width=".7"/><ellipse cx="73" cy="80.5" rx="6.6" ry="4.6" fill="${skin}" stroke="rgba(0,0,0,.4)" stroke-width="1"/>`;
    if (drink === "beer") return `<g><rect x="68" y="60" width="10" height="20" rx="2" fill="#f6b93b" stroke="#1a1a1a" stroke-width="1.4"/><rect x="70" y="63" width="1.6" height="12" rx=".8" fill="#fff" opacity=".5"/><ellipse cx="73" cy="60" rx="5.6" ry="2.7" fill="#fff7e6" stroke="#1a1a1a" stroke-width="1"/>${hand}</g>`;
    if (drink === "seltzer") return `<g><rect x="69" y="58" width="8.5" height="22" rx="2.5" fill="#eef4fb" stroke="#1a1a1a" stroke-width="1.4"/><rect x="69.5" y="56.6" width="7.5" height="2.6" rx="1" fill="#b9c0c6" stroke="#1a1a1a" stroke-width=".8"/><rect x="69" y="66" width="8.5" height="7" fill="#2f9bff"/><circle cx="73.2" cy="69.5" r="1.9" fill="#ff3d7f"/>${hand}</g>`;
    if (drink === "lolly") return `<g><rect x="70.3" y="59" width="1.7" height="22" rx=".85" fill="#fafafa" stroke="#1a1a1a" stroke-width=".7"/><circle cx="71" cy="59" r="6.6" fill="#ff5da2" stroke="#1a1a1a" stroke-width="1.3"/><path d="M71,54.6 A4.4,4.4 0 1 1 67,60.4" fill="none" stroke="#fff" stroke-width="1.3" opacity=".75"/><circle cx="71" cy="59" r="1.4" fill="none" stroke="#fff" stroke-width="1" opacity=".75"/>${hand}</g>`;
    return `<g><rect x="71" y="51" width="1.8" height="17" rx=".9" fill="#ff7aa0" transform="rotate(10 72 59)"/><rect x="68" y="64" width="10" height="16" rx="2" fill="#ff3158"/><rect x="68" y="59" width="10" height="21" rx="2" fill="rgba(255,255,255,.22)" stroke="#1a1a1a" stroke-width="1.4"/><path d="M76,55 Q78,51 80.5,52.5" stroke="#6b4a1f" stroke-width="1" fill="none"/><circle cx="76" cy="57" r="2.6" fill="#c0162f" stroke="#1a1a1a" stroke-width=".8"/>${hand}</g>`;
  }
  function avatarSVG(cfg) {
    cfg = cfg || {};
    const skin = cfg.skin || SKINS[2];
    const c = cfg.hairColor || HAIRCOLORS[1];
    const shirt = cfg.shirt || SHIRTS[0];
    const fem = (cfg.face || "masc") === "femme";
    const h = HAIR[cfg.hairStyle] || HAIR.short;
    const bg = cfg.bg || "#ffffff";
    // a hat replaces the crown, so hide crown hair; keep only hair that drapes below it
    const hatOn = ["beanie", "cap", "propeller"].includes(cfg.headwear);
    const backHair = h.back && (!hatOn || h.drape) ? h.back(c) : "";
    const topHair = h.top && !hatOn ? h.top(c) : "";

    const brows = fem
      ? `<path d="M36,36.5 q5,-2.5 10,-0.5" stroke="${c}" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M54,36 q5,-2 10,0.5" stroke="${c}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`
      : `<path d="M35,37 q6,-3 11,0" stroke="${c}" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M54,37 q5,-3 11,0" stroke="${c}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    const lashes = fem ? `<path d="M35.5,42.6 l-2.6,-1.6" stroke="#2a2a2a" stroke-width="1.4" stroke-linecap="round"/><path d="M64.5,42.6 l2.6,-1.6" stroke="#2a2a2a" stroke-width="1.4" stroke-linecap="round"/>` : "";
    const mouth = mouthFor(cfg.mood || "smile", fem);
    // pupils with a tiny catch-light so the avatar feels alive
    const eyes = `<circle cx="41" cy="44" r="2.6" fill="#2a2a2a"/><circle cx="59" cy="44" r="2.6" fill="#2a2a2a"/><circle cx="40.1" cy="43.1" r="0.85" fill="#fff"/><circle cx="58.1" cy="43.1" r="0.85" fill="#fff"/>`;

    let beard = "";
    if (cfg.facialHair === "stubble") {
      // a neat, brick-offset 5 o'clock shadow over the jaw/chin (clearly not a solid beard)
      let dots = "", row = 0;
      for (let yy = 50; yy <= 67.5; yy += 2.7, row++) {
        const xoff = (row % 2) * 1.35;
        for (let xx = 32 + xoff; xx <= 68; xx += 2.7) {
          const inFace = ((xx - 50) / 21) ** 2 + ((yy - 43) / 24) ** 2 <= 1;
          const lipGap = yy > 51.5 && yy < 56.5 && xx > 42.5 && xx < 57.5;
          if (inFace && !lipGap) dots += `<circle cx="${xx.toFixed(1)}" cy="${yy.toFixed(1)}" r=".56" fill="${c}" opacity=".45"/>`;
        }
      }
      beard = `<g>${dots}</g>`;
    }
    else if (cfg.facialHair === "beard") beard = `<path d="M29,45 C30,66 42,74 50,74 C58,74 70,66 71,45 C66,59 60,62 50,62 C40,62 34,59 29,45 Z" fill="${c}"/>`;
    else if (cfg.facialHair === "mustache") beard = (cfg.mood === "smirk")
      ? `<path d="M41,54 Q47,51.5 50,52.6 Q53,50 59,49 Q56,53 50,53.9 Q45,55.6 41,54 Z" fill="${c}"/>` // right wing lifts to follow the smirk
      : (cfg.mood === "wow")
        ? `<path d="M41,48 Q50,46.5 59,48 Q54,50.5 50,49 Q46,50.5 41,48 Z" fill="${c}"/>` // raised so it clears the open mouth
        : `<path d="M41,52 Q50,50 59,52 Q54,56 50,53.5 Q46,56 41,52 Z" fill="${c}"/>`;

    let eyewear = "";
    if (cfg.eyewear === "glasses") eyewear = `<g stroke="#1f1f1f" stroke-width="2" fill="rgba(255,255,255,0.12)"><circle cx="41" cy="44" r="6.5"/><circle cx="59" cy="44" r="6.5"/><path d="M47.5,44 h5" fill="none"/><path d="M34.5,43 l-5,-1.5" fill="none"/><path d="M65.5,43 l5,-1.5" fill="none"/></g>`;
    else if (cfg.eyewear === "square") eyewear = `<g stroke="#1f1f1f" stroke-width="2" fill="rgba(255,255,255,0.12)"><rect x="34.5" y="38.7" width="13" height="11" rx="2"/><rect x="52.5" y="38.7" width="13" height="11" rx="2"/><path d="M47.5,44 h5" fill="none"/><path d="M34.5,42 l-5,-1.5" fill="none"/><path d="M65.5,42 l5,-1.5" fill="none"/></g>`;
    else if (cfg.eyewear === "shades") eyewear = `<g fill="#1b1b1b"><rect x="33" y="40" width="14" height="8" rx="3.5"/><rect x="53" y="40" width="14" height="8" rx="3.5"/><rect x="46" y="42.5" width="8" height="2.2"/><path d="M33,42 l-4.5,-1.5" stroke="#1b1b1b" stroke-width="2"/><path d="M67,42 l4.5,-1.5" stroke="#1b1b1b" stroke-width="2"/></g>`;

    const earrings = cfg.earrings ? `<circle cx="27" cy="50.5" r="2.2" fill="#ffd23f" stroke="#b8860b" stroke-width="0.5"/><circle cx="73" cy="50.5" r="2.2" fill="#ffd23f" stroke="#b8860b" stroke-width="0.5"/>` : "";
    const freckles = cfg.freckles ? `<g fill="#7a4326" opacity="0.72"><circle cx="38" cy="49" r="1.2"/><circle cx="42" cy="51" r="1.2"/><circle cx="40" cy="47" r="1.05"/><circle cx="36" cy="50.5" r="1"/><circle cx="62" cy="49" r="1.2"/><circle cx="58" cy="51" r="1.2"/><circle cx="60" cy="47" r="1.05"/><circle cx="64" cy="50.5" r="1"/></g>` : "";
    const blush = cfg.blush ? `<g fill="#ff7d96" opacity="0.45"><ellipse cx="37" cy="50" rx="4.5" ry="2.6"/><ellipse cx="63" cy="50" rx="4.5" ry="2.6"/></g>` : "";

    let headwear = "";
    if (cfg.headwear === "beanie") headwear = `<g><path d="M24,38 C22,2 78,2 76,38 Z" fill="${shirt}"/><rect x="23" y="31" width="54" height="8" rx="4" fill="${shirt}"/><rect x="23" y="31" width="54" height="8" rx="4" fill="rgba(255,255,255,0.14)"/></g>`;
    else if (cfg.headwear === "cap") headwear = `<g fill="${shirt}"><path d="M25,40 C23,4 77,4 75,40 Z"/><path d="M73,40 C85,40 91,42 93,46 L74,46 C74,43 74,41 73,40 Z"/></g>`;
    else if (cfg.headwear === "propeller") headwear = `<g><path d="M27,40 C25,6 75,6 73,40 Z" fill="${shirt}" stroke="#1a1a1a" stroke-width="1.3"/><rect x="48.8" y="9" width="2.4" height="6" fill="#5a3a1a"/><g class="av-prop"><rect x="43" y="10.7" width="14" height="2.6" rx="1.3" fill="#ff3d7f"/><rect x="43" y="10.7" width="14" height="2.6" rx="1.3" fill="#2f9bff" transform="rotate(90 50 12)"/></g><circle cx="50" cy="12" r="1.8" fill="#1a1a1a"/></g>`;

    const headphones = cfg.headphones ? `<g><path d="M22,42 C21,4 79,4 78,42" stroke="#2a2a2a" stroke-width="4" fill="none"/><rect x="19" y="41" width="9" height="14" rx="3.5" fill="#e23d6d"/><rect x="72" y="41" width="9" height="14" rx="3.5" fill="#e23d6d"/></g>` : "";
    const drink = drinkSVG(cfg.drink, skin);

    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
      <rect x="0" y="0" width="100" height="100" fill="${bg}"/>
      ${backHair}
      <path d="M14,100 C14,75 30,67 50,67 C70,67 86,75 86,100 Z" fill="${shirt}"/>
      <rect x="43" y="55" width="14" height="16" rx="6" fill="${skin}"/>
      <circle cx="27" cy="45" r="5" fill="${skin}"/><circle cx="73" cy="45" r="5" fill="${skin}"/>
      ${earrings}
      <ellipse cx="50" cy="42" rx="23" ry="26" fill="${skin}"/>
      ${beard}
      ${topHair}
      ${eyes}
      ${lashes}${brows}${freckles}${blush}${mouth}${eyewear}${headwear}${headphones}
      ${drink}
    </svg>`;
  }
  function avatarChip(cfg, px) {
    return `<span class="avchip" style="width:${px}px;height:${px}px">${avatarSVG(cfg)}</span>`;
  }
  const DEFAULT_AVATAR = { face: "masc", skin: SKINS[2], hairStyle: "short", hairColor: HAIRCOLORS[1], shirt: SHIRTS[0], mood: "smile", bg: "#fff0c8", eyewear: "none", facialHair: "none", headwear: "none", drink: "none", earrings: false, freckles: false, blush: false, headphones: false };
  const AV_PRESETS = { masc: { face: "masc", hairStyle: "short" }, femme: { face: "femme", hairStyle: "long" } };

  /* ----------------------------------------------------------
     QUIZ - 12 questions, each option scored 0..3
     ---------------------------------------------------------- */
  const QUESTIONS = [
    {
      q: "The plan changes at the last minute. Your internal weather:",
      opts: [
        ["Sunny - whatever, let's roll", 0],
        ["A few clouds, I adapt", 1],
        ["Storm warning, I need a minute", 2],
        ["The plan was sacred. This is a betrayal.", 3],
      ],
    },
    {
      q: "You discover a topic you love. How deep do you go?",
      opts: [
        ["I learn the basics and move on", 0],
        ["I read a few articles", 1],
        ["I now own three books on it", 2],
        ["I could lecture for 6 hours, unprompted, tonight", 3],
      ],
    },
    {
      q: "Eye contact during conversation feels:",
      opts: [
        ["Totally natural", 0],
        ["Fine in small doses", 1],
        ["Like a task I'm consciously managing", 2],
        ["Why are we doing this to each other", 3],
      ],
    },
    {
      q: "Your ideal Friday night:",
      opts: [
        ["Big party, lots of people", 0],
        ["Drinks with a few friends", 1],
        ["One trusted person + a shared activity", 2],
        ["Me, my hyperfixation, and zero humans", 3],
      ],
    },
    {
      q: "Small talk is:",
      opts: [
        ["Easy and pleasant", 0],
        ["Manageable", 1],
        ["A weird ritual I perform", 2],
        ["An elaborate form of psychological warfare", 3],
      ],
    },
    {
      q: "Certain textures, sounds, or bright lights:",
      opts: [
        ["Never really notice them", 0],
        ["Occasionally bug me", 1],
        ["Can absolutely ruin my day", 2],
        ["I have a detailed list and avoidance strategy", 3],
      ],
    },
    {
      q: "Your daily routine is:",
      opts: [
        ["Loose, I improvise", 0],
        ["Roughly the same most days", 1],
        ["A system. It has steps.", 2],
        ["A sacred sequence. Do not disrupt the sequence.", 3],
      ],
    },
    {
      q: "Someone says 'we should hang out sometime':",
      opts: [
        ["Great, I'll text them", 0],
        ["Nice, vaguely meant", 1],
        ["Do they mean it? Should I propose a date?", 2],
        ["I need exact day, time, location, and an agenda", 3],
      ],
    },
    {
      q: "Group chats make you feel:",
      opts: [
        ["Energized, love them", 0],
        ["Fine, I keep up", 1],
        ["47 unread and rising anxiety", 2],
        ["I left to preserve my soul", 3],
      ],
    },
    {
      q: "When you're really into something, you:",
      opts: [
        ["Enjoy it casually", 0],
        ["Get pretty enthusiastic", 1],
        ["Info-dump on anyone nearby", 2],
        ["Restructure my entire identity around it", 3],
      ],
    },
    {
      q: "Reading the 'vibe' of a room:",
      opts: [
        ["Instant and effortless", 0],
        ["Usually get it", 1],
        ["I decode it manually, a bit late", 2],
        ["I find out three days later", 3],
      ],
    },
    {
      q: "Your sock / clothing tag situation:",
      opts: [
        ["No opinions, never think about it", 0],
        ["Mild preferences", 1],
        ["Tags get cut, seams matter", 2],
        ["I have one acceptable fabric and we do not negotiate", 3],
      ],
    },
  ];
  const MAX_RAW = QUESTIONS.length * 3; // 36

  /* ----------------------------------------------------------
     TIERS - score is 0..100
     ---------------------------------------------------------- */
  const TIERS = [
    { min: 0,  emoji: "🧍", name: "Refreshingly Neurotypical", blurb: "You read rooms like a barcode scanner and small talk doesn't even hurt. Honestly, suspicious. We'll keep an eye on you." },
    { min: 21, emoji: "🌀", name: "Quirky Civilian", blurb: "A little spice, a little structure. You pass as normal but the group chat has its doubts." },
    { min: 41, emoji: "⚡", name: "Certified Spicy Brain", blurb: "You've got hyperfixations, sock opinions, and a deep personal relationship with your routine. Welcome home." },
    { min: 61, emoji: "🛰️", name: "Deeply Spectrum-Coded", blurb: "Eye contact is a performance, your special interest could fill a textbook, and chaos is your nemesis. Iconic." },
    { min: 81, emoji: "👑", name: "Maximum Autism Royalty", blurb: "Behold. The fabric is non-negotiable, the agenda is sacred, and the info-dump is incoming. We are not worthy." },
  ];
  function tierFor(score) {
    let t = TIERS[0];
    for (const x of TIERS) if (score >= x.min) t = x;
    return t;
  }

  /* ----------------------------------------------------------
     STORE - localStorage backed
     ---------------------------------------------------------- */
  const LS = {
    subs: "ap_submissions_v1",
    flag: "ap_results_public_v1",
    auth: "ap_admin_auth_v1",
  };
  function load(key, fallback) {
    try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); }
    catch (e) { return fallback; }
  }
  function save(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

  const store = {
    all() { return load(LS.subs, []); },
    approved() { return this.all().filter(s => s.status === "approved").sort((a, b) => a.score - b.score); },
    pending() { return this.all().filter(s => s.status === "pending"); },
    add(sub) { const a = this.all(); a.push(sub); save(LS.subs, a); },
    update(id, patch) { const a = this.all().map(s => s.id === id ? Object.assign(s, patch) : s); save(LS.subs, a); },
    remove(id) { save(LS.subs, this.all().filter(s => s.id !== id)); },
    resultsPublic() { return load(LS.flag, false); },
    setResultsPublic(v) { save(LS.flag, !!v); },
    seedIfEmpty() {
      if (this.all().length) return;
      const seed = [
        ["Maya", "R", 8, { face: "femme", skin: SKINS[1], hairStyle: "long", hairColor: "#1c1c1c", shirt: "#ff3d7f", blush: true }],
        ["Devon", "K", 19, { skin: SKINS[4], hairStyle: "short", hairColor: "#1c1c1c", shirt: "#2f9bff", eyewear: "glasses" }],
        ["Priya", "S", 27, { face: "femme", skin: SKINS[3], hairStyle: "bun", hairColor: "#3b2417", shirt: "#ffd23f", earrings: true }],
        ["Marcus", "T", 34, { skin: SKINS[5], hairStyle: "buzz", hairColor: "#1c1c1c", shirt: "#2ec27e", facialHair: "beard" }],
        ["Sofia", "L", 44, { face: "femme", skin: SKINS[2], hairStyle: "curly", hairColor: "#6b4423", shirt: "#8b5cf6", freckles: true }],
        ["Liam", "B", 52, { skin: SKINS[1], hairStyle: "short", hairColor: "#e3b04b", shirt: "#ff8a3d", eyewear: "shades" }],
        ["Tasha", "M", 63, { face: "femme", skin: SKINS[6], hairStyle: "afro", hairColor: "#1c1c1c", shirt: "#ffd23f", earrings: true }],
        ["Wen", "C", 71, { skin: SKINS[2], hairStyle: "short", hairColor: "#1c1c1c", shirt: "#2f9bff", headphones: true }],
        ["Eli", "G", 83, { skin: SKINS[0], hairStyle: "mohawk", hairColor: "#2f9bff", shirt: "#2a2a2a", facialHair: "mustache" }],
        ["Robin", "P", 94, { face: "femme", skin: SKINS[3], hairStyle: "long", hairColor: "#8b5cf6", shirt: "#ededed", eyewear: "glasses" }],
      ];
      const now = Date.now();
      seed.forEach((s, i) => {
        store.add({
          id: "seed-" + i,
          name: s[0] + " " + s[1] + ".",
          firstName: s[0],
          lastInitial: s[1],
          avatar: s[3],
          score: s[2],
          answers: QUESTIONS.map(() => null),
          status: i % 4 === 0 ? "pending" : "approved",
          createdAt: now - (seed.length - i) * 60000,
          seeded: true,
        });
      });
    },
  };

  /* ----------------------------------------------------------
     UTIL
     ---------------------------------------------------------- */
  const $ = (sel, el) => (el || document).querySelector(sel);
  const uid = () => "s-" + Math.floor(performance.now() * 1000).toString(36) + "-" + (load("ap_ctr", 0) + 1);
  function bumpCtr() { save("ap_ctr", load("ap_ctr", 0) + 1); }
  function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  function fmtTime(ts) {
    const d = new Date(ts);
    return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  }

  let toastTimer;
  function toast(msg) {
    let t = $("#toast");
    if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; document.body.appendChild(t); }
    t.textContent = msg;
    requestAnimationFrame(() => t.classList.add("show"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2400);
  }

  /* ----------------------------------------------------------
     CONFETTI
     ---------------------------------------------------------- */
  const confetti = (function () {
    const canvas = $("#confetti-canvas");
    const ctx = canvas.getContext("2d");
    let pieces = [], raf = null;
    const COLORS = ["#ff5d8f", "#ff9f45", "#ffd23f", "#4ade80", "#38bdf8", "#a78bfa"];
    function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
    addEventListener("resize", resize); resize();
    function burst(n, originX) {
      const ox = originX == null ? innerWidth / 2 : originX;
      for (let i = 0; i < n; i++) {
        pieces.push({
          x: ox + (Math.sin(i) * 60), y: innerHeight * 0.35,
          vx: (i / n - 0.5) * 12 + (i % 2 ? 2 : -2),
          vy: -(6 + (i % 9)), g: 0.28 + (i % 5) * 0.03,
          size: 6 + (i % 7), color: COLORS[i % COLORS.length],
          rot: i, vr: (i % 2 ? 0.2 : -0.2), life: 0, max: 140 + (i % 60),
        });
      }
      if (!raf) loop();
    }
    function loop() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces = pieces.filter(p => p.life < p.max);
      for (const p of pieces) {
        p.life++; p.vy += p.g; p.x += p.vx; p.y += p.vy; p.vx *= 0.99; p.rot += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(0, 1 - p.life / p.max);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }
      if (pieces.length) raf = requestAnimationFrame(loop);
      else { raf = null; ctx.clearRect(0, 0, canvas.width, canvas.height); }
    }
    return { burst };
  })();

  /* ----------------------------------------------------------
     ROUTER
     ---------------------------------------------------------- */
  const routes = {};
  function route(path, fn) { routes[path] = fn; }
  function currentHash() {
    const h = location.hash.replace(/^#/, "") || "/";
    return h;
  }
  function navigate(path) { location.hash = path; }
  function render() {
    store.seedIfEmpty();
    const path = currentHash();
    const app = $("#app");
    const key = "/" + (path.split("/")[1] || "");
    const fn = routes[key] || routes["/"];
    app.innerHTML = "";
    app.appendChild(shell(fn()));
    window.scrollTo(0, 0);
  }
  addEventListener("hashchange", render);

  /* ----------------------------------------------------------
     SHELL (header + footer wrapper)
     ---------------------------------------------------------- */
  function shell(contentNode) {
    const frag = document.createDocumentFragment();
    const path = currentHash();
    const key = "/" + (path.split("/")[1] || "");

    const header = el(`
      <header class="site-header">
        <div class="wrap">
          <button class="brand" data-nav="/">
            <img class="brand-logo" src="logo.png" alt="${CONFIG.partyName} logo" />
            <span>${CONFIG.partyName} <small>'${String(CONFIG.year).slice(2)}</small></span>
          </button>
          <button class="nav-toggle" id="nav-toggle" aria-label="Open menu" aria-expanded="false"><span></span><span></span><span></span></button>
          <nav class="header-links" id="site-nav">
            <button data-nav="/" class="${key === "/" ? "active" : ""}">Home</button>
            <button data-nav="/test" class="${key === "/test" ? "active" : ""}">Take the Test</button>
            <button data-nav="/details" class="${key === "/details" ? "active" : ""}">Details</button>
            <button data-nav="/results" class="${key === "/results" ? "active" : ""}">Results</button>
            <button data-nav="/admin" class="${key === "/admin" ? "active" : ""}">Admin</button>
          </nav>
        </div>
      </header>`);
    frag.appendChild(header);
    // mobile hamburger: toggle the nav open/closed (navigating re-renders the shell, closing it)
    const navToggle = $("#nav-toggle", header);
    const siteNav = $("#site-nav", header);
    if (navToggle && siteNav) {
      navToggle.addEventListener("click", () => {
        const open = header.classList.toggle("nav-open");
        navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
    }

    frag.appendChild(contentNode);

    const footer = el(`
      <footer class="site-footer">
        <div class="footer-rainbow"></div>
        <div class="wrap footer-inner">
          <div class="footer-brand">
            <img class="footer-logo" src="logo.png" alt="${CONFIG.partyName} logo" />
            <div class="footer-brand-text">
              <div class="footer-edition grad-text">${CONFIG.edition}</div>
              <div class="footer-tag">The 2nd Annual ${CONFIG.partyName} · ${CONFIG.date}, ${CONFIG.year}</div>
            </div>
          </div>
          <p class="cause">💛 <span class="cause-pre">Want to help a cause? </span><a href="https://autisticadvocacy.org/donate/" target="_blank" rel="noopener">Support autistic-led advocacy →</a></p>
        </div>
      </footer>`);
    frag.appendChild(footer);

    frag.querySelectorAll("[data-nav]").forEach(b =>
      b.addEventListener("click", () => navigate(b.getAttribute("data-nav")))
    );
    return frag;
  }

  /* helper: build element from HTML string */
  function el(html) {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }
  function wrapDiv(html) {
    const d = document.createElement("div");
    d.innerHTML = html;
    return d;
  }

  /* ----------------------------------------------------------
     ROUTE: HOME (landing - hero + CTA + photos + fun facts)
     ---------------------------------------------------------- */
  route("/", function () {
    const root = wrapDiv("");
    root.className = "fade-in";

    const ed = CONFIG.edition.toUpperCase().split(" ");
    const marqueeBits = [
      CONFIG.edition.toUpperCase(),
      "TAKE THE TEST",
      "FIND YOUR SPECTRUM",
      "INVITE YOUR FRIENDS",
      "FREE PIZZA",
      "FREE DRINKS",
      "EVERY BRAIN INVITED",
      CONFIG.date.toUpperCase(),
    ];
    // a drawn steam train: a black locomotive pulling proper railway carriages (dark roof, a band
    // of windows, a nameboard with the word, dark underframe, two bogies of wheels), linked by
    // couplers. track = two identical halves animated -50% (seamless infinite); one half exceeds
    // any viewport so the loop never shows a gap. classic 3-livery palette, not rainbow.
    const carColors = ["#2f6b50", "#7e2b34", "#2b4a73"]; // brunswick green, maroon, navy
    const loco = `<div class="loco">
        <div class="smoke"><i></i><i></i><i></i></div>
        <div class="boiler"></div><div class="dome"></div><div class="stack"></div>
        <div class="cab"></div><div class="beam"></div><div class="light"></div>
        <div class="rod"></div>
        <div class="w w1"></div><div class="w w2"></div><div class="w w3"></div>
      </div>`;
    const carriage = (word, ci) =>
      `<div class="coupler"></div><div class="carriage" style="--car:${carColors[ci % carColors.length]}">` +
        `<div class="roof"></div><div class="win"></div><div class="name">${esc(word)}</div>` +
        `<div class="bogie bl"><div class="w"></div><div class="w"></div></div>` +
        `<div class="bogie br"><div class="w"></div><div class="w"></div></div>` +
      `</div>`;
    // a short train = a gap, then an engine pulling one full set of message cars. repeat a few
    // trains per half so the engine comes around often; the gap separates each train from the next.
    let half = "", ci = 0;
    for (let t = 0; t < 3; t++) {
      half += `<div class="train-gap"></div>` + loco;
      for (const b of marqueeBits) half += carriage(b, ci++);
    }
    const marquee = el(`<div class="train-marquee"><div class="rails"></div><div class="train">${half}${half}</div></div>`);
    root.appendChild(marquee);

    const polaroids = PHOTOS.map((p, i) => {
      const pos = COLLAGE_POS[i % COLLAGE_POS.length];
      return `<figure class="polaroid${i === 0 ? " hi" : ""}" style="--r:${pos.r};top:${pos.t};left:${pos.l};width:${pos.w};z-index:${pos.z}">
          <img loading="lazy" src="${p.src}" alt="${esc(p.cap)}"
               onerror="this.style.display='none';this.parentElement.classList.add('photo-empty');" />
          <figcaption>${esc(p.cap)}</figcaption>
        </figure>`;
    }).join("");

    // futuristic radial burst behind the hero: rotating rainbow rays, expanding rings,
    // and a field of twinkling sparks - all radiating from the centre.
    const SPARK_COLORS = ["#ff3d7f", "#2f9bff", "#2ec27e", "#ffd23f", "#8b5cf6", "#ff8a3d", "#16b5b5", "#ffffff"];
    let sparks = "";
    for (let i = 0; i < 34; i++) {
      const x = (Math.random() * 100).toFixed(1), y = (Math.random() * 100).toFixed(1);
      const s = (3 + Math.random() * 6).toFixed(1);
      const c = SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)];
      const d = (Math.random() * 3).toFixed(2), dur = (1.8 + Math.random() * 2.4).toFixed(2);
      sparks += `<span class="spark" style="left:${x}%;top:${y}%;width:${s}px;height:${s}px;color:${c};animation-delay:${d}s;animation-duration:${dur}s"></span>`;
    }
    const heroFx = `<div class="hero-fx" aria-hidden="true">
        <div class="fx-core"></div>
        <div class="fx-rays"></div>
        <div class="fx-ring" style="animation-delay:0s"></div>
        <div class="fx-ring" style="animation-delay:1.6s"></div>
        <div class="fx-ring" style="animation-delay:3.2s"></div>
        <div class="fx-sparks">${sparks}</div>
      </div>`;
    const hero = el(`
      <section class="home-wrap">
        ${heroFx}
        <div class="wrap home">
          <div class="home-copy">
            <span class="eyebrow"><span class="bolt bolt-xs">⚡</span> The 2nd Annual ${CONFIG.partyName} · ${CONFIG.year}</span>
            <h1 class="home-title">
              <span class="line-1">presents</span>
              <span class="line-big">${ed[0]}</span>
              <span class="line-big">${ed.slice(1).join(" ")}</span>
            </h1>
            <div class="bolt-row" aria-hidden="true">
              <span class="bolt">⚡</span><span class="bolt">⚡</span><span class="bolt">⚡</span><span class="bolt">⚡</span><span class="bolt">⚡</span><span class="bolt">⚡</span>
            </div>
            <p class="sub">One night. One test. One spectrum. Find out exactly how delightfully wired you are - then we plot you on the big graph for all to see.</p>
            <div class="hero-cta">
              <button class="btn btn-rainbow btn-lg btn-hero" data-nav="/test">Take the Test <span class="btn-sub">~20 min</span></button>
              <button class="btn btn-ghost" data-nav="/details">📍 Getting There</button>
            </div>
            <p class="home-foot">📅 ${CONFIG.date} · 🕗 ${CONFIG.time} · 🎟️ ${CONFIG.year}</p>
          </div>
          <div class="collage">${polaroids}</div>
        </div>
      </section>`);
    root.appendChild(hero);

    // mobile photo strip: highlight whichever photo is centred (swipe brings the next one to the front)
    const collageEl = $(".collage", hero);
    if (collageEl) {
      const updateFront = () => {
        if (getComputedStyle(collageEl).overflowX !== "auto") { // desktop scatter: no "front"
          collageEl.querySelectorAll(".polaroid").forEach(p => p.classList.remove("front"));
          return;
        }
        const mid = collageEl.scrollLeft + collageEl.clientWidth / 2;
        let best = null, bestD = Infinity;
        collageEl.querySelectorAll(".polaroid").forEach(p => {
          const d = Math.abs((p.offsetLeft + p.offsetWidth / 2) - mid);
          if (d < bestD) { bestD = d; best = p; }
        });
        collageEl.querySelectorAll(".polaroid").forEach(p => p.classList.toggle("front", p === best));
      };
      let raf;
      collageEl.addEventListener("scroll", () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(updateFront); }, { passive: true });
      addEventListener("resize", updateFront, { passive: true });
      setTimeout(updateFront, 60);
    }

    bindNav(hero);
    return root;
  });

  /* ----------------------------------------------------------
     ROUTE: TEST (the quiz, on its own page)
     ---------------------------------------------------------- */
  route("/test", function () {
    const root = wrapDiv("");
    root.className = "fade-in";
    const bar = el(`<div class="wrap" style="padding-top:24px"><button class="btn btn-ghost btn-sm" data-nav="/">← Back home</button></div>`);
    root.appendChild(bar);
    root.appendChild(quizView());
    bindNav(root);
    return root;
  });

  /* ----------------------------------------------------------
     ROUTE: DETAILS (festival-grade logistics for an apartment)
     ---------------------------------------------------------- */
  route("/details", function () {
    const ADDR = "344 3rd Ave, New York, NY 10010";
    const Q = encodeURIComponent(ADDR);
    const pin = `https://www.google.com/maps/search/?api=1&query=${Q}`;
    const dir = (mode, origin) =>
      `https://www.google.com/maps/dir/?api=1&destination=${Q}&travelmode=${mode}` +
      (origin ? `&origin=${encodeURIComponent(origin)}` : "");
    const ml = (href, label) => `<a class="maplink" href="${href}" target="_blank" rel="noopener">🗺️ ${label}</a>`;

    const modes = [
      {
        icon: "🚶", name: "ON FOOT",
        tag: "For the locals & the brave",
        body: "Already in Murray Hill / Gramercy / Kips Bay? Then you are, geographically speaking, already at the party. Point yourself at <b>3rd Ave &amp; 25th St</b> and walk with purpose. If you can see Madison Square Park, you've gone too far west - turn around and reflect.",
        links: [ml(dir("walking"), "Walking directions")],
      },
      {
        icon: "🚇", name: "BY SUBWAY",
        tag: "The people's chariot",
        body: "Take the <b>6 train</b> to <b>28 St</b> or <b>23 St</b> (Lexington Ave) and walk two short blocks east to 3rd Ave. Coming on the <b>N / R / W</b>? Hop off at <b>23 St</b> (Broadway) and head east - it's a character-building stroll across town.",
        links: [ml(dir("transit"), "Transit directions")],
      },
      {
        icon: "🚆", name: "BY RAIL",
        tag: "Arriving from distant lands",
        body: "Long-haul travelers funnel through <b>Penn Station</b> (LIRR, NJ Transit, Amtrak/Acela) or <b>Grand Central</b> (Metro-North). Both are a ~15-min victory lap away - grab the 6 from Grand Central or just walk it off.",
        links: [
          ml(dir("transit", "Penn Station, New York, NY"), "From Penn Station"),
          ml(dir("transit", "Grand Central Terminal, New York, NY"), "From Grand Central"),
        ],
      },
      {
        icon: "✈️", name: "BY AIR",
        tag: "VIPs, out-of-towners & people who overcommit",
        body: "<b>LaGuardia (LGA)</b> is closest (~20-30 min by car). <b>JFK</b> and <b>Newark (EWR)</b> are also viable if you enjoy a journey. Clear customs, collect your bags, and proceed directly to the snacks.",
        links: [
          ml(dir("transit", "LaGuardia Airport, Queens, NY"), "From LGA"),
          ml(dir("transit", "John F. Kennedy International Airport"), "From JFK"),
          ml(dir("transit", "Newark Liberty International Airport"), "From EWR"),
        ],
      },
      {
        icon: "🚗", name: "BY CAR / RIDESHARE",
        tag: "Bold. Foolish. Respected.",
        body: "Have your driver pull up on <b>3rd Ave</b> near 25th St for a cinematic drop-off. Parking in Manhattan is less a task and more a spiritual trial - we recommend a garage, a prayer, or simply not driving.",
        links: [ml(dir("driving"), "Driving directions")],
      },
      {
        icon: "🚲", name: "BY CITI BIKE",
        tag: "Eco-friendly & smug about it",
        body: "Docks dot the neighborhood - the nearest is at <b>Baruch Plaza</b>. Pedal in, lock up, and arrive glowing (literally - it's humid). Helmet optional, vibes mandatory.",
        links: [ml(dir("bicycling"), "Bike directions")],
      },
      {
        icon: "🚁", name: "BY HELICOPTER",
        tag: "Okay now you're just showing off",
        body: "Set down at the <b>E 34th St Heliport</b>, then it's a quick cab south. We will absolutely be watching out the window. There is no helipad on the roof. Please do not attempt the roof.",
        links: [ml(dir("transit", "East 34th Street Heliport, New York, NY"), "From the heliport")],
      },
    ];

    const faqs = [
      ["Is the food <i>actually</i> free?", "Yes. Free, hot, and plentiful. <b>Domino's 🍕</b> all night - <b>cheese</b> plus <b>pepperoni &amp; sausage</b>. Eat with abandon; it's on the house."],
      ["And the drinks?", "Also free. <b>Beer 🍺</b>, <b>seltzer</b>, and <b>dirty Shirleys 🍒</b> all evening - something for everyone. Pace yourself; the test rewards honesty, not blackouts."],
      ["Wait… are there prizes?", "There are. The top of the spectrum is a <b>competitive event</b>. We award <b>🥇 1st</b>, <b>🥈 2nd</b>, and <b>🥉 3rd place</b> on the night."],
      ["What are the prizes?", "Classified. Past years have featured medals, trophies, and the kind of bragging rights that last 365 days. Win and find out. 🏆"],
      ["Will there be surprises?", "Several. We can't spoil them (that's the entire point of a surprise) but the answer is an enthusiastic <b>yes</b>. Expect at least one thing you didn't expect."],
      ["What should I wear?", "Come as you are. Propeller caps, rainbow everything, and questionable fashion choices are all warmly encouraged."],
      ["What do I need to bring?", "Just yourself and an <b>honest brain</b> for the test. No tickets, no wristbands, no buzzer - walk right in and take the elevator to the 15th floor."],
      ["When should I show up?", `Doors swing open <b>${CONFIG.date} at ${CONFIG.time}</b>. Take the test right here on the site before you come (about 20 minutes), so you're locked in and ready for the big reveal.`],
    ];

    const root = wrapDiv(`<section class="section fade-in"><div class="wrap">
      <div class="details-hero">
        <span class="eyebrow"><span class="bolt bolt-xs">⚡</span> Party Logistics &amp; Survival Guide</span>
        <h2 class="section-title">Getting to the Grounds 🎪</h2>
        <p class="section-sub">A comprehensive, multi-modal transit dossier for a destination that is, in reality, one (1) apartment. We take access seriously.</p>
      </div>

      <div class="addr-card card">
        <div class="addr-main">
          <div class="addr-label">📍 THE VENUE</div>
          <div class="addr-line">344 3rd Ave · <span class="grad-text">Apt 15G</span></div>
          <div class="addr-sub">New York, NY 10010 · "Manhattan Promenade", Gramercy / Kips Bay</div>
          <div class="addr-when">🗓️ ${CONFIG.date} · 🕗 Doors at ${CONFIG.time}</div>
          <div class="addr-note">🛗 No buzzer, no code, no nonsense - walk straight in and take the elevator up to the <b>15th floor</b>, Apt 15G.</div>
        </div>
        <div class="addr-actions">${ml(pin, "Open in Google Maps")}</div>
      </div>

      <h3 class="block-head">🧭 How To Get There</h3>
      <div class="grid grid-2 travel-grid">
        ${modes.map(m => `
          <div class="card route-card">
            <div class="route-top"><span class="route-icon">${m.icon}</span>
              <div><div class="route-name">${m.name}</div><div class="route-tag">${m.tag}</div></div>
            </div>
            <p class="route-body">${m.body}</p>
            <div class="route-links">${m.links.join("")}</div>
          </div>`).join("")}
      </div>

      <h3 class="block-head">❓ Frequently Asked (Loudly)</h3>
      <div class="faq">
        ${faqs.map(([q, a]) => `<details><summary>${q}</summary><div class="a">${a}</div></details>`).join("")}
      </div>

      <div class="details-foot">
        <button class="btn btn-rainbow btn-lg" data-nav="/test"><span class="bolt bolt-sm">⚡</span> Take the Test <span class="bolt bolt-sm">⚡</span></button>
      </div>
    </div></section>`);

    return bindNav(root);
  });

  /* ----------------------------------------------------------
     QUIZ VIEW (stateful sub-component)
     ---------------------------------------------------------- */
  function quizView() {
    const state = { step: -1, firstName: "", lastInitial: "", avatar: Object.assign({}, DEFAULT_AVATAR), name: "", answers: QUESTIONS.map(() => null), done: false, score: 0, welcome: false, returningFull: "", returningSentence: "", dateStep: "" };
    const displayName = () => state.firstName.trim() + (state.lastInitial.trim() ? " " + state.lastInitial.trim().toUpperCase() + "." : "");
    const container = el(`<section class="section"><div class="quiz-shell"></div></section>`);
    const shellEl = $(".quiz-shell", container);

    function computeScore() {
      const raw = state.answers.reduce((a, v) => a + (v == null ? 0 : v), 0);
      return Math.round((raw / MAX_RAW) * 100);
    }

    function paint() {
      shellEl.innerHTML = "";

      // intro / name step
      if (state.step === -1) {
        const node = el(`
          <div class="card char-create fade-in">
            <div class="step-tag"><span class="step-num">1</span> Create your character <span class="step-arrow">→</span> <span class="step-faded">2 · take the test</span></div>
            <h2 class="section-title">First, build your autist</h2>
            <p class="section-sub">Make your little character below - <b>this isn't the test yet</b>. When you're happy with them, hit start and the 12 questions begin.</p>
            <div class="char-note"><span><b>Use your real name 🪪.</b> The host approves every contestant by hand and will only wave through names he actually recognizes. Fake names, bits, and aliases get rejected at the door 🚪.</span></div>
            <div class="char-layout">
              <div class="char-form">
                <div class="char-row">
                  <div class="char-name-field">
                    <label class="field-label">First name</label>
                    <input class="name-input" id="first-in" placeholder="Alex" maxlength="20" value="${esc(state.firstName)}" />
                  </div>
                  <div class="char-initial-field">
                    <label class="field-label">Last initial</label>
                    <input class="name-input char-initial" id="lasti-in" placeholder="K" maxlength="1" value="${esc(state.lastInitial)}" />
                  </div>
                </div>
                <div class="builder">
                  <div class="builder-group">
                    <span class="builder-label">Base</span>
                    <div class="opts">
                      <button type="button" class="opt-btn" data-preset="masc">🧑 Masc</button>
                      <button type="button" class="opt-btn" data-preset="femme">👩 Femme</button>
                    </div>
                  </div>
                  <div class="builder-group">
                    <span class="builder-label">Skin</span>
                    <div class="swatches" data-opt="skin">${SKINS.map(s => `<button type="button" class="swatch" data-v="${s}" style="background:${s}" title="skin tone"></button>`).join("")}</div>
                  </div>
                  <div class="builder-group">
                    <span class="builder-label">Hair</span>
                    <div class="opts" data-opt="hairStyle">${HAIRSTYLES.map(h => `<button type="button" class="opt-btn" data-v="${h.id}">${h.label}</button>`).join("")}</div>
                  </div>
                  <div class="builder-group">
                    <span class="builder-label">Hair color</span>
                    <div class="swatches" data-opt="hairColor">${HAIRCOLORS.map(s => `<button type="button" class="swatch" data-v="${s}" style="background:${s}" title="hair color"></button>`).join("")}</div>
                  </div>
                  <div class="builder-group">
                    <span class="builder-label">Expression</span>
                    <div class="opts" data-opt="mood">${MOODS.map(m => `<button type="button" class="opt-btn" data-v="${m.id}">${m.label}</button>`).join("")}</div>
                  </div>
                  <div class="builder-group">
                    <span class="builder-label">Shirt</span>
                    <div class="swatches" data-opt="shirt">${SHIRTS.map(s => `<button type="button" class="swatch" data-v="${s}" style="background:${s}" title="shirt color"></button>`).join("")}</div>
                  </div>
                  <div class="builder-group">
                    <span class="builder-label">Backdrop</span>
                    <div class="swatches" data-opt="bg">${BGS.map(s => `<button type="button" class="swatch swatch-bg" data-v="${s}" style="background:${s}" title="backdrop"></button>`).join("")}</div>
                  </div>
                  <div class="builder-group">
                    <span class="builder-label">Eyewear</span>
                    <div class="opts" data-opt="eyewear">
                      <button type="button" class="opt-btn" data-v="none">None</button>
                      <button type="button" class="opt-btn" data-v="glasses">👓 Round</button>
                      <button type="button" class="opt-btn" data-v="square">🤓 Square</button>
                      <button type="button" class="opt-btn" data-v="shades">🕶️ Shades</button>
                    </div>
                  </div>
                  <div class="builder-group">
                    <span class="builder-label">Facial hair</span>
                    <div class="opts" data-opt="facialHair">
                      <button type="button" class="opt-btn" data-v="none">None</button>
                      <button type="button" class="opt-btn" data-v="stubble">Stubble</button>
                      <button type="button" class="opt-btn" data-v="mustache">Mustache</button>
                      <button type="button" class="opt-btn" data-v="beard">Beard</button>
                    </div>
                  </div>
                  <div class="builder-group">
                    <span class="builder-label">Headwear</span>
                    <div class="opts" data-opt="headwear">
                      <button type="button" class="opt-btn" data-v="none">None</button>
                      <button type="button" class="opt-btn" data-v="beanie">🧢 Beanie</button>
                      <button type="button" class="opt-btn" data-v="cap">Cap</button>
                      <button type="button" class="opt-btn" data-v="propeller">🚁 Propeller</button>
                    </div>
                  </div>
                  <div class="builder-group">
                    <span class="builder-label">Drink in hand</span>
                    <div class="opts" data-opt="drink">${DRINKS.map(d => `<button type="button" class="opt-btn" data-v="${d.id}">${d.label}</button>`).join("")}</div>
                  </div>
                  <div class="builder-group">
                    <span class="builder-label">Extras</span>
                    <div class="opts">
                      <button type="button" class="opt-btn" data-flag="earrings">💎 Earrings</button>
                      <button type="button" class="opt-btn" data-flag="freckles">Freckles</button>
                      <button type="button" class="opt-btn" data-flag="blush">Blush</button>
                      <button type="button" class="opt-btn" data-flag="headphones">🎧 Headphones</button>
                    </div>
                  </div>
                </div>
              </div>
              <div class="char-preview">
                <div class="avatar"><div class="avatar-inner" id="av-art">${avatarSVG(state.avatar)}</div></div>
                <div class="avatar-name" id="av-name">${esc(displayName()) || "Your name"}</div>
                <div class="avatar-sub">your spectrum human</div>
                <div class="dice-row">
                  <button type="button" class="btn-dice" id="randomize">🎲 Surprise me</button>
                  <button type="button" class="btn-reset" id="reset-av" title="Reset to default">↺</button>
                </div>
              </div>
            </div>
            <label class="terms">
              <input type="checkbox" id="agree" ${state.agreed ? "checked" : ""} />
              <span>I'll take this seriously and answer <b>honestly</b> - not just pick answers to score the highest. Wherever I land on the spectrum is where I land. 🤝</span>
            </label>
            <div class="quiz-nav start-row">
              <span class="start-hint" id="start-hint"></span>
              <button class="btn btn-primary" id="start-btn">Save character &amp; start test →</button>
            </div>
          </div>`);
        shellEl.appendChild(node);
        const first = $("#first-in", node);
        const lasti = $("#lasti-in", node);
        const agree = $("#agree", node);
        const startBtn = $("#start-btn", node);
        const startHint = $("#start-hint", node);
        const avArt = $("#av-art", node);
        const avName = $("#av-name", node);
        const humanList = a => a.length === 1 ? a[0] : a.length === 2 ? a[0] + " and " + a[1] : a.slice(0, -1).join(", ") + ", and " + a[a.length - 1];
        const markSel = () => {
          node.querySelectorAll("[data-opt]").forEach(group => {
            const key = group.getAttribute("data-opt");
            group.querySelectorAll("[data-v]").forEach(b => b.classList.toggle("selected", state.avatar[key] === b.getAttribute("data-v")));
          });
          node.querySelectorAll("[data-flag]").forEach(b => b.classList.toggle("selected", !!state.avatar[b.getAttribute("data-flag")]));
          node.querySelectorAll("[data-preset]").forEach(b => b.classList.toggle("selected", AV_PRESETS[b.getAttribute("data-preset")].face === state.avatar.face));
        };
        const paintAvatar = () => {
          avArt.innerHTML = avatarSVG(state.avatar);
          markSel();
          if (avArt.animate) avArt.animate([{ transform: "scale(.9)" }, { transform: "scale(1)" }], { duration: 170, easing: "cubic-bezier(.2,1.5,.4,1)" });
        };
        const refresh = () => {
          avName.textContent = displayName() || "Your name";
          // gray the button out until ready, but always show a hint of what's still missing
          const missing = [];
          if (!state.firstName.trim()) missing.push("a first name");
          if (!state.lastInitial.trim()) missing.push("a last initial");
          if (!agree.checked) missing.push("the honesty checkbox");
          startBtn.disabled = missing.length > 0;
          if (missing.length) {
            startHint.textContent = "👆 Add " + humanList(missing) + " first";
            startHint.classList.remove("ready");
          } else {
            startHint.textContent = "✓ All set - you're good to go!";
            startHint.classList.add("ready");
          }
        };
        first.addEventListener("input", e => { state.firstName = e.target.value; refresh(); });
        lasti.addEventListener("input", e => { state.lastInitial = e.target.value.toUpperCase().slice(0, 1); e.target.value = state.lastInitial; refresh(); });
        node.querySelectorAll("[data-opt]").forEach(group => {
          const key = group.getAttribute("data-opt");
          group.querySelectorAll("[data-v]").forEach(b => b.addEventListener("click", () => { state.avatar[key] = b.getAttribute("data-v"); paintAvatar(); }));
        });
        node.querySelectorAll("[data-flag]").forEach(b => b.addEventListener("click", () => { const f = b.getAttribute("data-flag"); state.avatar[f] = !state.avatar[f]; paintAvatar(); }));
        node.querySelectorAll("[data-preset]").forEach(b => b.addEventListener("click", () => { Object.assign(state.avatar, AV_PRESETS[b.getAttribute("data-preset")]); paintAvatar(); }));
        $("#randomize", node).addEventListener("click", () => {
          const pick = a => a[Math.floor(Math.random() * a.length)];
          const f = pick(["masc", "femme"]);
          state.avatar = {
            face: f, skin: pick(SKINS), hairStyle: pick(HAIRSTYLES).id, hairColor: pick(HAIRCOLORS), shirt: pick(SHIRTS),
            mood: pick(MOODS).id, bg: pick(BGS),
            eyewear: pick(["none", "none", "glasses", "square", "shades"]),
            facialHair: f === "femme" ? "none" : pick(["none", "none", "stubble", "beard", "mustache"]),
            headwear: pick(["none", "none", "none", "beanie", "cap", "propeller"]), drink: pick(["none", "none", "none", "beer", "seltzer", "shirley", "lolly"]),
            earrings: Math.random() > 0.6, freckles: Math.random() > 0.6, blush: Math.random() > 0.7, headphones: Math.random() > 0.82,
          };
          paintAvatar();
        });
        $("#reset-av", node).addEventListener("click", () => { state.avatar = Object.assign({}, DEFAULT_AVATAR); paintAvatar(); });
        agree.addEventListener("change", () => { state.agreed = agree.checked; refresh(); });
        const go = () => {
          if (!state.firstName.trim()) { first.focus(); toast("Enter your first name!"); return; }
          if (!state.lastInitial.trim()) { lasti.focus(); toast("Add your last initial!"); return; }
          if (!agree.checked) { toast("Check the honesty box to start 🤝"); return; }
          state.name = displayName();
          const date = findDateGuest(state.firstName, state.lastInitial);
          if (date) { state.dateStep = "survey"; state.welcome = false; state.step = 0; paint(); window.scrollTo({ top: 0, behavior: "auto" }); return; }
          const ret = findReturningGuest(state.firstName, state.lastInitial);
          if (ret) { state.returningFull = ret.full; state.returningSentence = RETURNING_SENTENCES[ret.full] || RETURNING_FALLBACK; state.welcome = true; state.step = 0; paint(); }
          else { state.returningFull = ""; state.returningSentence = ""; state.welcome = false; state.step = 0; paint(); }
          window.scrollTo({ top: 0, behavior: "auto" }); // start the test from the top
        };
        startBtn.addEventListener("click", go);
        // tapping the name on the preview jumps back up to the name fields
        avName.style.cursor = "pointer";
        avName.title = "Edit your name";
        avName.addEventListener("click", () => {
          const anchor = node.querySelector(".char-row") || first;
          const y = anchor.getBoundingClientRect().top + window.scrollY - 124; // land a bit above the name fields
          window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
          setTimeout(() => first.focus({ preventScroll: true }), 320);
        });
        [first, lasti].forEach(inp => inp.addEventListener("keydown", e => { if (e.key === "Enter") go(); }));
        markSel();
        refresh();
        setTimeout(() => first.focus(), 60);
        return;
      }

      // date-guest bit: a fake "rate dating me" survey instead of the quiz
      if (state.dateStep === "survey") {
        const node = el(`
          <div class="card date-survey fade-in">
            <span class="wb-tag date-tag">💘 Special guest detected</span>
            <h2 class="section-title">Hold on, <span class="grad-text">${esc(state.firstName.trim())}</span>…</h2>
            <p class="wb-text">Instead of filling out this autism quiz, why don't you fill out <b>this</b> survey instead?</p>
            <div class="date-q">
              <label class="field-label">Rate dating me on a scale of 1–10</label>
              <input class="name-input date-rating" id="date-rating" type="number" min="1" max="10" inputmode="numeric" placeholder="10, obviously" />
            </div>
            <div class="date-q">
              <label class="field-label">Any feedback? (be honest, be generous)</label>
              <textarea class="date-feedback" id="date-feedback" rows="4" placeholder="e.g. elite texter, slightly too into trains, would date again…"></textarea>
            </div>
            <div class="quiz-nav" style="justify-content:center;margin-top:6px">
              <button class="btn btn-primary btn-lg" id="date-submit">Submit survey →</button>
            </div>
          </div>`);
        shellEl.appendChild(node);
        $("#date-submit", node).addEventListener("click", () => { state.dateStep = "kidding"; paint(); window.scrollTo({ top: 0 }); });
        return;
      }
      if (state.dateStep === "kidding") {
        const node = el(`
          <div class="card date-kidding fade-in" style="text-align:center">
            <div class="finale-medal">😏</div>
            <h2 class="section-title">Just kidding…</h2>
            <p class="wb-text">…but remember, there might be <b>a lot of you</b> at this party — so please don't fight over me. 😘</p>
            <div class="quiz-nav" style="justify-content:center;margin-top:6px">
              <button class="btn btn-primary btn-lg" id="date-continue">Okay fine, the actual test →</button>
            </div>
          </div>`);
        shellEl.appendChild(node);
        confetti.burst(80);
        $("#date-continue", node).addEventListener("click", () => { state.dateStep = ""; state.step = 0; paint(); window.scrollTo({ top: 0 }); });
        return;
      }

      // welcome-back interstitial for returning guests (after Start, before Q1)
      if (state.welcome) {
        const node = el(`
          <div class="card welcome-back fade-in">
            <span class="wb-tag">⚡ Returning guest detected</span>
            <div class="wb-avatar"><span class="avchip" style="width:96px;height:96px">${avatarSVG(state.avatar)}</span></div>
            <h2 class="section-title">Welcome back, <span class="grad-text">${esc(state.returningFull)}</span>!</h2>
            <p class="wb-text">${esc(state.returningSentence || RETURNING_FALLBACK)}</p>
            <div class="quiz-nav" style="justify-content:center;margin-top:8px">
              <button class="btn btn-primary btn-lg" id="wb-begin">Let's gooo →</button>
            </div>
          </div>`);
        shellEl.appendChild(node);
        confetti.burst(90);
        $("#wb-begin", node).addEventListener("click", () => { state.welcome = false; paint(); });
        return;
      }

      // result step
      if (state.done) {
        const t = tierFor(state.score);
        const node = el(`
          <div class="card result-card fade-in">
            <div class="result-emoji"><span class="avchip" style="width:104px;height:104px">${avatarSVG(state.avatar)}</span></div>
            <div class="q-count">${esc(state.name)}, you are…</div>
            <div class="result-tier"><span class="grad">${t.name}</span></div>
            <p class="result-blurb">${t.blurb}</p>
            <div class="score-meter">
              <div class="meter-track"><div class="meter-pin" style="left:0%"></div></div>
              <div class="meter-scale"><span>Neurotypical</span><span>Maximum Autism</span></div>
            </div>
            <div class="submitted-banner">
              ✅ Submitted! You're in the queue. The host will approve you, then you'll appear on the spectrum graph at the party.
            </div>
            <div class="quiz-nav" style="justify-content:center;margin-top:24px">
              <button class="btn btn-ghost btn-sm" id="retake">Take it again</button>
            </div>
          </div>`);
        shellEl.appendChild(node);
        setTimeout(() => { $(".meter-pin", node).style.left = state.score + "%"; }, 150);
        confetti.burst(150);
        $("#retake", node).addEventListener("click", () => {
          state.step = -1; state.done = false; state.welcome = false; state.dateStep = ""; state.returningFull = ""; state.returningSentence = ""; state.answers = QUESTIONS.map(() => null); paint();
        });
        return;
      }

      // question step
      const i = state.step;
      const Q = QUESTIONS[i];
      const pct = Math.round((i / QUESTIONS.length) * 100);
      const node = el(`
        <div class="fade-in">
          <div class="progress-rail"><div class="progress-fill" style="width:${pct}%"></div></div>
          <div class="q-count">Question ${i + 1} of ${QUESTIONS.length}</div>
          <h2 class="q-text">${Q.q}</h2>
          <div class="options"></div>
          <div class="quiz-nav">
            <button class="btn btn-ghost btn-sm" id="back-btn">← Back</button>
            <button class="btn btn-primary btn-sm" id="next-btn" disabled>Next →</button>
          </div>
        </div>`);
      const optWrap = $(".options", node);
      Q.opts.forEach((o, idx) => {
        const b = el(`<button class="option ${state.answers[i] === o[1] && state.__sel === idx ? "selected" : ""}">
            <span class="dot"></span><span>${o[0]}</span></button>`);
        // track selection by index for visual correctness
        if (state.__selByStep && state.__selByStep[i] === idx) b.classList.add("selected");
        b.addEventListener("click", () => {
          state.answers[i] = o[1];
          state.__selByStep = state.__selByStep || {};
          state.__selByStep[i] = idx;
          optWrap.querySelectorAll(".option").forEach(x => x.classList.remove("selected"));
          b.classList.add("selected");
          $("#next-btn", node).disabled = false;
        });
        optWrap.appendChild(b);
      });
      const isLast = i === QUESTIONS.length - 1;
      const nextBtn = $("#next-btn", node);
      nextBtn.textContent = isLast ? "See my result →" : "Next →";
      if (state.answers[i] != null) nextBtn.disabled = false;
      nextBtn.addEventListener("click", () => {
        if (state.answers[i] == null) return;
        if (isLast) {
          state.score = computeScore();
          submitToQueue(state);
          state.done = true; paint();
        } else { state.step++; paint(); }
      });
      $("#back-btn", node).addEventListener("click", () => {
        if (state.step === 0) { state.step = -1; }
        else state.step--;
        paint();
      });
      shellEl.appendChild(node);
    }

    paint();
    return container;
  }

  function submitToQueue(state) {
    bumpCtr();
    store.add({
      id: uid(),
      name: (state.name || "").trim(),
      firstName: state.firstName.trim(),
      lastInitial: state.lastInitial.trim().toUpperCase(),
      avatar: Object.assign({}, state.avatar),
      score: state.score,
      answers: state.answers.slice(),
      agreed: !!state.agreed,
      returning: state.returningFull || "",
      status: "pending",
      createdAt: Date.now(),
    });
  }

  /* ----------------------------------------------------------
     FUN FACTS VIEW
     ---------------------------------------------------------- */
  function factsView() {
    const facts = [
      { emoji: "🧠", h: "Pattern-seeking superpowers", p: "Spectrum brains are wildly good at spotting patterns, details, and inconsistencies everyone else glides right past." },
      { emoji: "🎯", h: "The hyperfixation engine", p: "When the interest hits, focus goes nuclear. Hours vanish. Expertise accumulates. It's basically a cheat code." },
      { emoji: "♾️", h: "Why the rainbow infinity?", p: "The infinity loop stands for infinite variation - every brain wired a little differently, none of them wrong." },
      { emoji: "🔊", h: "Sensory dials go to 11", p: "Sounds, lights, textures and tastes can land way louder than 'normal'. Noise-cancelling headphones: elite tier." },
      { emoji: "💬", h: "Info-dumping is love", p: "Sharing every fact about a beloved topic is a genuine act of affection. Receiving one is a compliment." },
      { emoji: "📊", h: "It's a spectrum, not a line", p: "Nobody's just 'a little' or 'a lot'. It's a whole mixing board of traits - which is exactly what tonight celebrates." },
    ];
    const stats = [
      { n: "2", l: "years running", s: "and counting" },
      { n: "1", l: "legendary spreadsheet", s: "of every result, ever" },
      { n: "∞", l: "spectrums plotted", s: "no two alike" },
    ];
    const root = wrapDiv(`<section class="section fade-in"><div class="wrap">
      <h2 class="section-title">Fun Facts</h2>
      <p class="section-sub">A little appreciation for the beautifully wired brain - and a few stats from parties past.</p>
      <div class="grid grid-3" style="margin-bottom:28px">
        ${stats.map(s => `<div class="card fact" style="text-align:center">
          <div class="big-num">${s.n}</div><h3>${s.l}</h3><p>${s.s}</p></div>`).join("")}
      </div>
      <div class="grid grid-3">
        ${facts.map(f => `<div class="card fact">
          <span class="emoji">${f.emoji}</span><h3>${f.h}</h3><p>${f.p}</p></div>`).join("")}
      </div>
    </div></section>`);
    return root;
  }

  /* ----------------------------------------------------------
     PAST YEARS VIEW (placeholder photos via picsum)
     ---------------------------------------------------------- */
  function pastYearsView() {
    const years = [
      {
        y: 2025,
        tag: "The one that started it all",
        photos: [
          { src: "photos/2025/the-gang.png", cap: "The whole gang 🌈" },
          { src: "photos/2025/champion.jpg", cap: "Reigning champion 🏆" },
          { src: "photos/2025/the-reveal.png", cap: "The 2025 spectrum reveal" },
          { src: "photos/2025/the-test.jpg", cap: "Scoring the spectrum, live" },
          { src: "photos/2025/the-crowd.jpg", cap: "The whole room, locked in 👀" },
          { src: "photos/2025/the-crew.jpg", cap: "Good company" },
          { src: "photos/2025/mascot.jpg", cap: "The unofficial mascot 🐾" },
        ],
      },
    ];
    const root = wrapDiv(`<section class="section fade-in"><div class="wrap">
      <h2 class="section-title">Past Years</h2>
      <p class="section-sub">The archive. Where the legends were made.</p>
      ${years.map((yr) => `
        <div class="year-block">
          <div class="year-head"><h3>${yr.y}</h3><span class="tag">${yr.tag}</span></div>
          <div class="photo-grid">
            ${yr.photos.map((p) => `
              <div class="photo">
                <img loading="lazy" src="${p.src}" alt="${esc(p.cap)}"
                     onerror="this.style.display='none';this.parentElement.classList.add('photo-empty');" />
                <div class="cap">${esc(p.cap)}</div>
              </div>`).join("")}
          </div>
        </div>`).join("")}
    </div></section>`);
    return root;
  }

  /* ----------------------------------------------------------
     ROUTE: ADMIN
     ---------------------------------------------------------- */
  route("/admin", function () {
    if (load(LS.auth, false) !== true) return adminGate();
    return adminPanel();
  });

  function adminGate() {
    const root = wrapDiv(`<section class="section fade-in"><div class="wrap">
      <div class="card gate">
        <div class="glyph">🔒</div>
        <h2 class="section-title">Host Login</h2>
        <p class="section-sub">For your eyes only. Enter the host password.</p>
        <input class="name-input" id="pw" type="password" placeholder="Password" />
        <div style="margin-top:14px"><button class="btn btn-primary" id="enter" style="width:100%;justify-content:center">Enter →</button></div>
        <p class="field-hint" style="margin-top:18px">Demo password: <b>${CONFIG.adminPassword}</b> (change it in app.js → CONFIG)</p>
      </div>
    </div></section>`);
    const pw = $("#pw", root);
    const tryAuth = () => {
      if (pw.value === CONFIG.adminPassword) { save(LS.auth, true); render(); toast("Welcome, host 👑"); }
      else { toast("Nope. Try again."); pw.value = ""; pw.focus(); }
    };
    $("#enter", root).addEventListener("click", tryAuth);
    pw.addEventListener("keydown", e => { if (e.key === "Enter") tryAuth(); });
    setTimeout(() => pw.focus(), 60);
    return root;
  }

  function adminPanel() {
    const all = store.all();
    const pending = store.pending();
    const approved = store.all().filter(s => s.status === "approved");
    const rejected = store.all().filter(s => s.status === "rejected");
    const isPublic = store.resultsPublic();

    const root = wrapDiv(`<section class="section fade-in"><div class="wrap">
      <div class="admin-bar">
        <div>
          <h2 class="section-title" style="text-align:left;margin-bottom:4px">Admin · The Queue</h2>
          <p style="color:var(--ink-soft);margin:0">Approve valid guests. They appear in Presentation &amp; Results.</p>
        </div>
        <div class="pill-stat">
          <span class="pill">⏳ Pending <b id="stat-pending">${pending.length}</b></span>
          <span class="pill">✅ Approved <b id="stat-approved">${approved.length}</b></span>
          <span class="pill">🚫 Rejected <b id="stat-rejected">${rejected.length}</b></span>
        </div>
      </div>

      <div class="toggle-row">
        <div>
          <div style="font-weight:700;font-size:16px">Make results public</div>
          <div style="color:var(--ink-faint);font-size:13px;margin-top:2px">Off during the party. Flip ON afterward so everyone can revisit the graph.</div>
        </div>
        <label class="switch"><input type="checkbox" id="pub-toggle" ${isPublic ? "checked" : ""}><span class="slider"></span></label>
      </div>

      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px">
        <button class="btn btn-ghost btn-sm" data-nav="/present">▶ Open Presentation</button>
        <button class="btn btn-ghost btn-sm" data-nav="/results">📊 View Results page</button>
        <button class="btn btn-ghost btn-sm" id="logout">Log out</button>
      </div>

      <div id="queue"></div>
    </div></section>`);

    root.querySelectorAll("[data-nav]").forEach(b => b.addEventListener("click", () => navigate(b.getAttribute("data-nav"))));
    $("#logout", root).addEventListener("click", () => { save(LS.auth, false); render(); });
    $("#pub-toggle", root).addEventListener("change", e => {
      store.setResultsPublic(e.target.checked);
      toast(e.target.checked ? "Results are now PUBLIC 🌍" : "Results hidden 🤫");
    });

    const queue = $("#queue", root);
    function updateStats() {
      const a = store.all();
      $("#stat-pending", root).textContent = a.filter(s => s.status === "pending").length;
      $("#stat-approved", root).textContent = a.filter(s => s.status === "approved").length;
      $("#stat-rejected", root).textContent = a.filter(s => s.status === "rejected").length;
    }
    function paintQueue() {
      updateStats();
      const list = store.all().slice().sort((a, b) => {
        const order = { pending: 0, approved: 1, rejected: 2 };
        if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
        return b.createdAt - a.createdAt;
      });
      if (!list.length) { queue.innerHTML = `<p class="empty">No submissions yet. Go take the test!</p>`; return; }
      queue.innerHTML = "";
      list.forEach(s => queue.appendChild(subRow(s, paintQueue)));
    }
    paintQueue();
    return root;
  }

  function subRow(s, refresh) {
    const t = tierFor(s.score);
    const row = el(`
      <div class="sub-row ${s.status}">
        <div>
          <div class="sub-name">${avatarChip(s.avatar, 30)} ${esc(s.name)} ${s.seeded ? "<span style='font-size:11px;color:var(--ink-faint)'>(demo)</span>" : ""}</div>
          <div class="sub-meta">Score ${s.score}/100 · ${fmtTime(s.createdAt)} · <span style="text-transform:capitalize">${s.status}</span></div>
          <div class="sub-tier">${t.emoji} ${t.name}</div>
          ${s.answers && s.answers.some(a => a != null) ? `<button class="link-btn" data-act="toggle">View answers</button>` : ""}
          <div class="answers-detail"></div>
        </div>
        <div class="sub-actions"></div>
      </div>`);

    const actions = $(".sub-actions", row);
    if (s.status === "pending") {
      const ap = el(`<button class="btn-mini btn-approve">✅ Approve</button>`);
      const rj = el(`<button class="btn-mini btn-reject">Reject</button>`);
      ap.addEventListener("click", () => { store.update(s.id, { status: "approved" }); toast(s.name + " approved!"); confetti.burst(40); refresh(); });
      rj.addEventListener("click", () => { store.update(s.id, { status: "rejected" }); refresh(); });
      actions.append(ap, rj);
    } else {
      const reset = el(`<button class="btn-mini btn-reject">↺ Pending</button>`);
      const del = el(`<button class="btn-mini" style="color:var(--ink-faint);background:transparent">Delete</button>`);
      reset.addEventListener("click", () => { store.update(s.id, { status: "pending" }); refresh(); });
      del.addEventListener("click", () => { store.remove(s.id); refresh(); });
      actions.append(reset, del);
    }

    const toggle = row.querySelector("[data-act='toggle']");
    if (toggle) {
      const detail = $(".answers-detail", row);
      detail.innerHTML = s.answers.map((a, i) =>
        a == null ? "" : `<div class="qa"><b>${esc(QUESTIONS[i].q)}</b>${esc((QUESTIONS[i].opts.find(o => o[1] === a) || ["-"])[0])} <span style="color:var(--ink-faint)">(+${a})</span></div>`
      ).join("") || `<div class="qa">No detailed answers (demo entry).</div>`;
      toggle.addEventListener("click", () => {
        detail.classList.toggle("open");
        toggle.textContent = detail.classList.contains("open") ? "Hide answers" : "View answers";
      });
    }
    return row;
  }

  /* ----------------------------------------------------------
     ROUTE: PRESENTATION
     ---------------------------------------------------------- */
  let presentRevealed = 0; // how many revealed so far this session
  route("/present", function () {
    if (load(LS.auth, false) !== true) return adminGate();
    const guests = store.approved(); // ascending by score
    const root = wrapDiv(`<section class="section fade-in"><div class="wrap">
      <h2 class="section-title">The Reveal</h2>
      <p class="section-sub">Approved guests, least → most autistic. Reveal them one at a time - then the <b>Final 3</b> get the podium treatment. 🥁</p>
      <div class="graph-wrap">
        <div id="reveal-stage" class="reveal-stage"></div>
        <div id="podium" class="podium" style="display:none">
          <div class="podium-slot second" data-fi="1"><div class="medal">🥈</div><div class="slot-body"></div><div class="pedestal">2nd</div></div>
          <div class="podium-slot first" data-fi="2"><div class="medal">👑</div><div class="slot-body"></div><div class="pedestal">1st</div></div>
          <div class="podium-slot third" data-fi="0"><div class="medal">🥉</div><div class="slot-body"></div><div class="pedestal">3rd</div></div>
        </div>
        <div class="graph" id="graph">
          <div class="graph-axis"></div>
          <div class="graph-axis-labels"><span>Neurotypical</span><span>Quirky</span><span>Spicy</span><span>Spectrum-coded</span><span>Maximum</span></div>
        </div>
      </div>
      <div class="present-controls">
        <button class="btn btn-ghost btn-sm" id="reset-btn">↺ Reset</button>
        <span class="present-count" id="count"></span>
        <button class="btn btn-primary" id="reveal-btn">Reveal next →</button>
      </div>
    </div></section>`);

    const graph = $("#graph", root);
    const stage = $("#reveal-stage", root);
    const countEl = $("#count", root);
    const revealBtn = $("#reveal-btn", root);
    const podiumEl = $("#podium", root);
    const hasPodium = guests.length >= 3;
    const finaleStart = guests.length - 3; // array index of the 3rd-place finalist

    if (!guests.length) {
      stage.innerHTML = `<div class="placeholder">No approved guests yet.<br>Approve some in the <b>Admin</b> queue first.</div>`;
      revealBtn.disabled = true;
    }

    // clamp revealed to current guest count
    presentRevealed = Math.min(presentRevealed, guests.length);

    const dots = [];
    function placeAll() {
      graph.querySelectorAll(".guest-dot").forEach(d => d.remove());
      dots.length = 0;
      guests.forEach((g, idx) => {
        const dot = el(`
          <div class="guest-dot" style="left:${g.score}%">
            <div class="flag">${esc(g.name)}<span class="s">${g.score}</span></div>
            <div class="pin">${avatarSVG(g.avatar)}</div>
          </div>`);
        graph.appendChild(dot);
        dots.push(dot);
        if (idx < presentRevealed) dot.classList.add("show");
      });
      updateStage();
      updateUI();
    }
    function updateUI() {
      dots.forEach((d, i) => d.classList.toggle("current", i === presentRevealed - 1));
      const done = presentRevealed >= guests.length;
      revealBtn.disabled = done;
      const inFinale = hasPodium && presentRevealed >= finaleStart;
      countEl.textContent = (inFinale && !done)
        ? `🥁 Final 3 · ${presentRevealed - finaleStart}/3 revealed`
        : `${presentRevealed} / ${guests.length} revealed`;
      if (done) revealBtn.textContent = "All revealed 🎉";
      else if (inFinale) {
        const n = presentRevealed - finaleStart; // 0=3rd, 1=2nd, 2=1st
        revealBtn.textContent = n === 0 ? "🥉 Reveal 3rd place →" : n === 1 ? "🥈 Reveal 2nd place →" : "👑 Reveal the MOST autistic →";
      } else revealBtn.textContent = "Reveal next →";
      renderPodium();
    }
    function renderPodium() {
      if (!podiumEl) return;
      const active = hasPodium && presentRevealed >= finaleStart;
      podiumEl.style.display = active ? "" : "none";
      if (!active) return;
      podiumEl.querySelectorAll(".podium-slot").forEach(slot => {
        const fi = +slot.getAttribute("data-fi"); // 0=3rd,1=2nd,2=1st
        const g = guests[finaleStart + fi];
        const revealed = presentRevealed > finaleStart + fi;
        slot.classList.toggle("revealed", revealed);
        slot.querySelector(".slot-body").innerHTML = revealed
          ? `<span class="avchip" style="width:58px;height:58px">${avatarSVG(g.avatar)}</span><div class="slot-name">${esc(g.name)}</div><div class="slot-score">${g.score}</div>`
          : `<div class="slot-mystery">?</div>`;
      });
    }
    function renderFinaleStage(idx) {
      const g = guests[idx], t = tierFor(g.score);
      const fi = idx - finaleStart;
      const p = fi === 2 ? { m: "👑", label: "THE MOST AUTISTIC", cls: "first" }
        : fi === 1 ? { m: "🥈", label: "2nd Most Autistic", cls: "second" }
          : { m: "🥉", label: "3rd Most Autistic", cls: "third" };
      stage.innerHTML = `<div class="fade-in finale-announce ${p.cls}">
        <div class="finale-medal">${p.m}</div>
        <div class="finale-place">${p.label}</div>
        <span class="avchip" style="width:104px;height:104px">${avatarSVG(g.avatar)}</span>
        <div class="name">${esc(g.name)}</div>
        <div class="tier">${t.emoji} ${t.name} · <b>${g.score}</b>/100</div>
      </div>`;
    }
    // a teaser of the three finalists shown the moment the regulars are done,
    // before their podium places get revealed one at a time
    function renderFinalePreview() {
      const finalists = guests.slice(finaleStart); // ascending [3rd, 2nd, 1st]
      // shuffle display order so left→right doesn't telegraph the ranking
      const order = finalists.map((_, i) => i);
      for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
      const people = order.map(i => {
        const g = finalists[i];
        return `<div class="fp-person"><span class="avchip" style="width:74px;height:74px">${avatarSVG(g.avatar)}</span><div class="fp-name">${esc(g.name)}</div></div>`;
      }).join("");
      stage.innerHTML = `<div class="fade-in finale-preview">
        <div class="finale-preview-title">🥁 Meet your Final 3</div>
        <div class="finale-preview-people">${people}</div>
        <div class="finale-preview-sub">The very top of the spectrum - but who takes <b>1st</b>? Reveal them one at a time…</div>
      </div>`;
    }
    function updateStage() {
      // about to announce the podium → preview the three finalists
      if (hasPodium && presentRevealed === finaleStart) { renderFinalePreview(); return; }
      if (presentRevealed === 0) {
        stage.innerHTML = `<div class="placeholder">Ready when you are. Hit <b>Reveal next</b> to begin the ascent. 🚀</div>`;
        return;
      }
      // already into the podium → re-show the most recently revealed finalist
      if (hasPodium && presentRevealed > finaleStart) { renderFinaleStage(presentRevealed - 1); return; }
      const g = guests[presentRevealed - 1];
      const t = tierFor(g.score);
      stage.innerHTML = `<div class="fade-in">
        <span class="avchip" style="width:90px;height:90px">${avatarSVG(g.avatar)}</span>
        <div class="name">${esc(g.name)}</div>
        <div class="tier">${t.emoji} ${t.name} · <b>${g.score}</b>/100</div>
      </div>`;
    }
    function reveal() {
      if (presentRevealed >= guests.length) return;
      const idx = presentRevealed;
      dots[idx].classList.add("show");
      presentRevealed++;
      const g = guests[idx];
      updateStage();
      updateUI();
      const rect = graph.getBoundingClientRect();
      const isChamp = idx === guests.length - 1;
      confetti.burst(isChamp ? 280 : (g.score > 70 ? 120 : 60), rect.left + rect.width * (g.score / 100));
    }

    revealBtn.addEventListener("click", reveal);
    $("#reset-btn", root).addEventListener("click", () => {
      presentRevealed = 0;
      dots.forEach(d => d.classList.remove("show", "current"));
      updateStageToLast(); updateUI();
    });

    setTimeout(placeAll, 30);
    return root;
  });

  /* ----------------------------------------------------------
     ROUTE: RESULTS (public after party / always for host)
     ---------------------------------------------------------- */
  route("/results", function () {
    const isPublic = store.resultsPublic();
    const isHost = load(LS.auth, false) === true;
    const guests = store.approved();

    if (!isPublic && !isHost) {
      return bindNav(wrapDiv(`<section class="section fade-in"><div class="wrap">
        <div class="locked">
          <div class="glyph">🤫</div>
          <h2 class="section-title">Results are under wraps</h2>
          <p class="section-sub">The spectrum gets revealed live at the party. Check back after - the host unlocks the full graph here.</p>
          <button class="btn btn-ghost" data-nav="/">← Back home</button>
        </div>
      </div></section>`));
    }

    const root = wrapDiv(`<section class="section fade-in"><div class="wrap">
      <h2 class="section-title">The ${CONFIG.edition} Spectrum</h2>
      <p class="section-sub">Every approved guest, plotted least → most autistic.</p>
      <div class="graph-wrap">
        <div class="graph" id="rgraph">
          <div class="graph-axis"></div>
          <div class="graph-axis-labels"><span>Neurotypical</span><span>Quirky</span><span>Spicy</span><span>Spectrum-coded</span><span>Maximum</span></div>
        </div>
      </div>
      <div class="rank-list" id="ranks"></div>
    </div></section>`);

    const graph = $("#rgraph", root);
    if (!guests.length) {
      graph.innerHTML += `<div class="placeholder" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--ink-faint)">No approved guests yet.</div>`;
    }
    const byScore = guests.slice().sort((a, b) => b.score - a.score);
    const medals = ["🥇", "🥈", "🥉"];
    guests.forEach((g, idx) => {
      const rank = byScore.indexOf(g);
      const medal = rank < 3 ? medals[rank] : "";
      const dot = el(`<div class="guest-dot show${medal ? " ranked" : ""}" style="left:${g.score}%">
        ${medal ? `<div class="rank-medal">${medal}</div>` : ""}
        <div class="flag">${esc(g.name)}<span class="s">${g.score}</span></div>
        <div class="pin">${avatarSVG(g.avatar)}</div></div>`);
      graph.appendChild(dot);
    });

    const ranks = $("#ranks", root);
    const ranked = guests.slice().sort((a, b) => b.score - a.score);
    ranks.innerHTML = ranked.map((g, i) => {
      const t = tierFor(g.score);
      return `<div class="rank-row">
        <div class="rank-num">${i + 1}</div>
        <div class="rank-info">${avatarChip(g.avatar, 34)}<div><div class="rank-name">${esc(g.name)}</div><div class="rank-tier">${t.emoji} ${t.name}</div></div></div>
        <div class="rank-score">${g.score}</div>
      </div>`;
    }).join("");

    return root;
  });

  function bindNav(node) {
    node.querySelectorAll("[data-nav]").forEach(b => b.addEventListener("click", () => navigate(b.getAttribute("data-nav"))));
    return node;
  }

  /* ----------------------------------------------------------
     BOOT
     ---------------------------------------------------------- */
  document.title = CONFIG.edition + " · " + CONFIG.partyName + " " + CONFIG.year;
  render();
})();
