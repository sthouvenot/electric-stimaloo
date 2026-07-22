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
    devPin: "4444", // gag "under development" gate shown before the test
    firebaseUrl: "https://electric-d1aec-default-rtdb.firebaseio.com", // shared realtime DB (public, not sensitive)
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
  function avatarSVG(cfg, opts) {
    cfg = cfg || {};
    const skin = cfg.skin || SKINS[2];
    const c = cfg.hairColor || HAIRCOLORS[1];
    const shirt = cfg.shirt || SHIRTS[0];
    const hw = cfg.headwearColor || shirt; // headwear has its own color now
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
    if (cfg.headwear === "beanie") headwear = `<g><path d="M24,38 C22,2 78,2 76,38 Z" fill="${hw}"/><rect x="23" y="31" width="54" height="8" rx="4" fill="${hw}"/><rect x="23" y="31" width="54" height="8" rx="4" fill="rgba(255,255,255,0.14)"/></g>`;
    else if (cfg.headwear === "cap") headwear = `<g fill="${hw}"><path d="M25,40 C23,4 77,4 75,40 Z"/><path d="M73,40 C85,40 91,42 93,46 L74,46 C74,43 74,41 73,40 Z"/></g>`;
    // propeller: cap raised to fully cover the crown (was exposing a sliver of
    // backdrop up top), and the blade spins via SMIL animateTransform around an
    // explicit SVG centre — the old CSS transform-box spin mis-rendered on mobile.
    else if (cfg.headwear === "propeller") headwear = `<g><path d="M26,40 C24,1 76,1 74,40 Z" fill="${hw}" stroke="#1a1a1a" stroke-width="1.3"/><rect x="48.8" y="8" width="2.4" height="7" fill="#5a3a1a"/><g><rect x="43" y="10.7" width="14" height="2.6" rx="1.3" fill="#ff3d7f"/><rect x="43" y="10.7" width="14" height="2.6" rx="1.3" fill="#2f9bff" transform="rotate(90 50 12)"/><animateTransform attributeName="transform" attributeType="XML" type="rotate" from="0 50 12" to="360 50 12" dur="0.5s" repeatCount="indefinite"/></g><circle cx="50" cy="12" r="1.9" fill="#1a1a1a"/></g>`;

    const headphones = cfg.headphones ? `<g><path d="M22,42 C21,4 79,4 78,42" stroke="#2a2a2a" stroke-width="4" fill="none"/><rect x="19" y="41" width="9" height="14" rx="3.5" fill="#e23d6d"/><rect x="72" y="41" width="9" height="14" rx="3.5" fill="#e23d6d"/></g>` : "";
    const drink = drinkSVG(cfg.drink, skin);

    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
      ${opts && opts.noBg ? "" : `<rect x="0" y="0" width="100" height="100" fill="${bg}"/>`}
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
  const DEFAULT_AVATAR = { face: "masc", skin: SKINS[2], hairStyle: "short", hairColor: HAIRCOLORS[1], shirt: SHIRTS[0], mood: "smile", bg: "#fff0c8", eyewear: "none", facialHair: "none", headwear: "none", headwearColor: SHIRTS[0], drink: "none", earrings: false, freckles: false, blush: false, headphones: false };
  const AV_PRESETS = { masc: { face: "masc", hairStyle: "short" }, femme: { face: "femme", hairStyle: "long" } };

  /* ----------------------------------------------------------
     QUIZ - 6 mini-games, each scored 0..3
     ---------------------------------------------------------- */
  const COMMON_PINS = new Set([
    "0000","1111","2222","3333","4444","5555","6666","7777","8888","9999",
    "1234","2345","3456","4567","5678","6789","9876","8765","7654","6543","5432","4321",
    "1122","2233","3344","4455","5566","6677","7788","8899",
    "1212","2323","3434","4545","5656","6767","7878","8989",
    "1221","2112","1100","0011","1010","0101","2020","1001","2002",
    "6969","8008","5150","4200","3141","0420","1337",
  ]);
  function pinSequential(p) {
    let up = true, down = true;
    for (let i = 1; i < 4; i++) { const a = +p[i-1], b = +p[i]; if (b !== a+1) up = false; if (b !== a-1) down = false; }
    return up || down;
  }
  function pinAllSame(p) { return p[0]===p[1] && p[1]===p[2] && p[2]===p[3]; }
  function pinPairs(p) { return p[0]===p[2] && p[1]===p[3]; }
  function scorePin(pin) {
    const noRepeat = new Set(pin.split("")).size === 4;
    const pattern = COMMON_PINS.has(pin) || pinSequential(pin) || pinAllSame(pin) || pinPairs(pin);
    const n = parseInt(pin, 10);
    const birthYear = n >= 1950 && n <= 2026;
    const checks = [
      { ok: noRepeat,    good: "No repeated digits",       bad: "Repeats a digit" },
      { ok: !pattern,    good: "Not an obvious pattern",   bad: "Classic guessable pattern" },
      { ok: !birthYear,  good: "Not a birth year",         bad: "That's literally a birth year" },
    ];
    return { pts: checks.reduce((a, c) => a + (c.ok ? 1 : 0), 0), checks };
  }
  const TYPING_SENTENCE = "I would rather reorganize my entire bookshelf than make small talk.";

  const QUESTIONS = [
    {
      kind: "bankpin",
      q: "Create a 4-digit PIN for your bank account.",
      opts: [["Wildly guessable",0],["A little obvious",1],["Pretty solid",2],["Paranoid and unguessable",3]],
    },
    {
      kind: "train",
      q: "Pick your favorite train car.",
      opts: [
        ["Picked one almost instantly", 0],
        ["Took a moment to choose", 1],
        ["Really watched it roll by", 2],
        ["Watched the whole loop go round", 3],
      ],
    },
    {
      kind: "color",
      q: "Memorize this color.",
      opts: [["Way off",0],["Close-ish",1],["Pretty close",2],["Spot on",3]],
    },
    {
      kind: "simon",
      q: "Repeat the pattern.",
      opts: [["Lost it early",0],["A few rounds",1],["Strong memory",2],["Photographic",3]],
    },
    {
      kind: "tvvol",
      q: "Set the TV volume.",
      opts: [["Odd. Chaos.",0],["Even, at least",1],["A multiple of 5",2],["Perfectly round",3],["Sixty-seven",4]],
    },
    {
      kind: "rings",
      q: "Sort the rings — one color per pole.",
      opts: [["Gave up",0],["Slow sort",1],["Quick sort",2],["Speed demon",3]],
    },
    {
      kind: "bricks",
      q: "Follow the instructions and build the thing.",
      opts: [["Gave up",0],["Half-built",1],["Finished it",2],["Finished it flawlessly",3]],
    },
    {
      kind: "dodge",
      q: "Sensory overload incoming — dodge it as long as you can.",
      opts: [
        ["Overwhelmed instantly", 0],
        ["Coped a little", 1],
        ["Held it together a while", 2],
        ["Unbothered. Master of the chaos.", 3],
      ],
    },
    {
      kind: "flappy",
      q: "Keep the routine going — flap through the gaps.",
      opts: [
        ["Crashed at the gate", 0],
        ["A few pipes", 1],
        ["A solid run", 2],
        ["Locked in, unstoppable", 3],
      ],
    },
    {
      kind: "subway",
      q: "Surf the subway — dodge the trains, grab the coins.",
      opts: [
        ["Clipped by the first train", 0],
        ["Survived a bit", 1],
        ["A proper run", 2],
        ["Certified surfer", 3],
      ],
    },
    {
      kind: "whg",
      q: "Get the red square across. Don't touch the blue.",
      opts: [
        ["Never made it", 0],
        ["Squeaked across, barely", 1],
        ["Crossed it, a few deaths", 2],
        ["Flawless run, no deaths", 3],
      ],
    },
    {
      kind: "rps",
      q: "Beat the computer in rock paper scissors — best 3 of 5.",
      opts: [["Gave up fast",0],["A couple tries",1],["Kept grinding",2],["Would not quit",3]],
    },
    {
      kind: "eggs",
      q: "Feed the egg.",
      opts: [["Fed it nothing",0],["Fed it a few",1],["Fed it a lot",2],["Fed it far too many",3]],
    },
    {
      kind: "boxes",
      q: "At least one box is true and at least one box is false.",
      opts: [["Opened the wrong box",0],["Solved it — opened the right box",3]],
    },
    {
      kind: "typing",
      q: "Type this sentence as fast as you can.",
      opts: [["Slow",0],["Decent",1],["Fast",2],["Blazing",3]],
    },
    {
      kind: "qebday",
      q: "When was Queen Elizabeth II born?",
      opts: [["No clue",0],["Right ballpark",1],["Very close",2],["Nailed the exact day",3]],
    },
    {
      kind: "imgtext",
      q: "What's happening in this picture?",
      img: "photos/iceberg.webp",
      imgAlt: "A huge crowd of Club Penguin penguins all packed onto one side of the iceberg",
      keywords: ["tip"], // award points if the typed answer mentions tipping
      opts: [["No idea",0],["Nailed it",3]],
    },
    // "Reading the Mind in the Eyes" test — an actual autism-research instrument.
    // Misreading the eyes is the autistic-coded outcome, so the RIGHT emotion
    // (answer) scores 0 and the foils score 2. answer = index of the textbook emotion.
    {
      kind: "imgquiz",
      q: "What is this person feeling? 👀",
      img: "photos/eyeImage1.png",
      imgAlt: "A close-up of a person's eyes",
      answer: 0,
      explain: "The textbook answer is <b>playful</b>. Reading a whole mood off a two-inch strip of face is a party trick some of us just never installed. 👀",
      opts: [["Playful", 0], ["Comforting", 2], ["Irritated", 2], ["Bored", 2]],
    },
    {
      kind: "imgquiz",
      q: "What is this person feeling? 👀",
      img: "photos/eyeImage2.png",
      imgAlt: "A close-up of a person's eyes",
      answer: 1,
      explain: "The textbook answer is <b>upset</b>. Eyes are just wet circles — expecting them to broadcast <i>feelings</i> is a big ask.",
      opts: [["Terrified", 2], ["Upset", 0], ["Arrogant", 2], ["Annoyed", 2]],
    },
    {
      kind: "imgquiz",
      q: "What is this person feeling? 👀",
      img: "photos/eyeImage3.png",
      imgAlt: "A close-up of a person's eyes",
      answer: 2,
      explain: "The textbook answer is <b>desire</b>. Yeah… we didn't get that from the eyebrows either.",
      opts: [["Joking", 2], ["Flustered", 2], ["Desire", 0], ["Convinced", 2]],
    },
    {
      kind: "imgquiz",
      q: "What is this person feeling? 👀",
      img: "photos/eyeImage4.png",
      imgAlt: "A close-up of a person's eyes",
      answer: 1,
      explain: "The textbook answer is <b>insisting</b>. If you nailed all four of these, we're a little suspicious of you.",
      opts: [["Joking", 2], ["Insisting", 0], ["Amused", 2], ["Relaxed", 2]],
    },
    {
      kind: "polo",
      bare: true, // renders its own meme-style card; hide the default chrome
      q: "How many holes in a Polo?",
      opts: [["One", 1], ["Two", 1], ["Three", 1], ["Four", 3]], // four is correct (scored silently)
    },
    {
      kind: "reenterpin",
      q: "One more thing — re-enter your bank PIN.",
      opts: [["Wrong",0],["Correct",3]],
    },

    /* ----------------------------------------------------------
       MULTIPLE CHOICE (mc: true) — shuffled in among the games by
       buildQuizOrder(), never as a block.

       Design rule: NO option is the obvious "most autistic" pick, so you can't
       rig it. Every option is something a normal person would plausibly say —
       the scoring instead keys on real, documented autistic cognition rather
       than stereotypes:
         monotropism (single-channel attention) · detail-first perception (weak
         central coherence) · literal + precise language · interoception
         differences · need for predictability (not just dislike of plans) ·
         sensory load · the cost of masking · memory by context, not by face ·
         low tolerance for ambiguous instructions · repetition as regulation.
       Deliberately, the highest-scoring answer often reads as the *reasonable*
       one ("I'd recalculated by minute six", "drained even though it went well").
       ---------------------------------------------------------- */
    {
      kind: "choice", mc: true, label: "Apartment",
      q: "You're in a friend's new apartment for the first time. What do you clock first?",
      opts: [
        ["The overall feel of the place", 0],
        ["The one thing that's crooked, mismatched, or slightly off", 3], // detail-first perception
        ["Who's already there", 0],
        ["The layout — what's where", 2],
      ],
    },
    {
      kind: "choice", mc: true, label: "Your name",
      q: "Someone says your name while you're absorbed in something. Honestly, what happens?",
      opts: [
        ["I hear it and answer", 0],
        ["I hear it, but it takes me a second to surface", 2],
        ["I genuinely don't hear it — not ignoring, just gone", 3], // monotropic attention tunnel
        ["Depends how interesting the thing is", 1],
      ],
    },
    {
      kind: "choice", mc: true, label: "Five minutes",
      q: "\"I'll be there in five minutes.\" They arrive in twelve. Your real reaction?",
      opts: [
        ["Didn't notice", 0],
        ["That's just what \"five minutes\" means", 0],
        ["Noted: they say five, they mean fifteen", 2],
        ["I'd already recalculated the whole evening by minute six", 3], // literal time + precision
      ],
    },
    {
      kind: "choice", mc: true, label: "Hunger",
      q: "How do you usually find out that you're hungry?",
      opts: [
        ["I feel hungry", 0],
        ["I eat at the same times regardless", 2],
        ["I get snappy and someone else works out that I haven't eaten", 3], // interoception
        ["My stomach makes it obvious", 0],
      ],
    },
    {
      kind: "choice", mc: true, label: "New song",
      q: "A song you love comes on. What actually happens next?",
      opts: [
        ["Add it to a playlist and move on", 0],
        ["Play it on repeat until I've completely worn it out", 3], // repetition as regulation
        ["Go read about who made it and how", 2],
        ["Send it to someone", 0],
      ],
    },
    {
      kind: "choice", mc: true, label: "Cancelled plans",
      q: "Plans you didn't even want to go to get cancelled last minute. You feel:",
      opts: [
        ["Relief. Pure relief.", 0],
        ["Relieved — and still annoyed the plan changed", 3], // predictability > preference
        ["Annoyed", 2],
        ["No strong feeling", 0],
      ],
    },
    {
      kind: "choice", mc: true, label: "Ruins the day",
      q: "Which of these ruins your day the fastest?",
      opts: [
        ["A tag in your shirt you can't get rid of", 3],           // sensory
        ["A passive-aggressive email", 0],
        ["Running 20 minutes behind", 2],
        ["A flickering light nobody else has noticed", 3],          // sensory
      ],
    },
    {
      kind: "choice", mc: true, label: "After the party",
      q: "Three hours at a party. It genuinely went well. Afterwards you feel:",
      opts: [
        ["Great — could do it all again", 0],
        ["Fine", 0],
        ["Completely drained, even though it was good", 3], // the cost of masking
        ["Ready to leave, glad I went", 2],
      ],
    },
    {
      kind: "choice", mc: true, label: "Met twice",
      q: "You bump into someone you've met exactly twice. What's going on in your head?",
      opts: [
        ["Greeting them by name", 0],
        ["I know the face, I've lost the name", 1],
        ["I know where we met and what they said — but not the name", 3], // context-keyed memory
        ["No idea who this is", 2],
      ],
    },
    {
      kind: "choice", mc: true, label: "Season to taste",
      q: "A recipe says \"season to taste.\" You:",
      opts: [
        ["Season it to taste", 0],
        ["Look up how much that actually is", 3],        // ambiguity intolerance
        ["Guess and move on", 0],
        ["Feel a small but real flash of anger", 3],      // ambiguity intolerance
      ],
    },
  ];
  const MAX_RAW = QUESTIONS.length * 3;

  // ── Relative curve scoring ────────────────────────────────────────────────
  // Some games have no intrinsic "right" score — a Flappy run of 8 pipes only
  // means something next to everyone else's runs. Those games are scored on a
  // curve across all approved contestants: bottom third → 1pt, middle → 2pt,
  // top → 3pt, ties grouped together. Games with an intrinsic target (TV volume
  // 67, Queen's birthday date, PINs, image quizzes) keep their fixed scoring and
  // are NOT listed here. World's Hardest is also excluded (1pt per level).
  //   metric: the stored metric that measures performance
  //   dir:    "high" = bigger is better, "low" = smaller is better
  // A guest only enters the curve if they actually completed the game (has a
  // finite metric > 0 for counts / a recorded time). Non-finishers keep raw 0.
  const CURVE_GAMES = [
    { kind: "flappy", metric: "flappyBest",  dir: "high" },
    { kind: "eggs",   metric: "eggsFed",     dir: "high" },
    { kind: "subway", metric: "subwayTime",  dir: "high" },
    { kind: "simon",  metric: "simonRounds", dir: "high" },
    { kind: "dodge",  metric: "dodge",       dir: "high" },
    { kind: "train",  metric: "trainWatch",  dir: "high" },
    { kind: "rps",    metric: "rpsGames",    dir: "high" },
    { kind: "bricks", metric: "brickTime",   dir: "low"  },
    { kind: "rings",  metric: "ringTime",    dir: "low"  },
    { kind: "typing", metric: "typeSecs",    dir: "low"  },
  ];
  // canonical QUESTIONS index for each curved game's kind (answers[] is keyed by it)
  const kindIndex = k => QUESTIONS.findIndex(q => (q.kind || "choice") === k);

  // Given the pool of guests, return a bottom/middle/top-third points map keyed
  // by guest id for one curved game. Ties share the same band. Guests without a
  // valid completed metric are omitted (they keep their raw 0).
  function curveOneGame(guests, g) {
    const scored = guests
      .map(gu => ({ id: gu.id, v: gu.metrics ? gu.metrics[g.metric] : undefined }))
      .filter(x => typeof x.v === "number" && isFinite(x.v) && x.v > 0);
    const out = {};
    const n = scored.length;
    if (!n) return out;
    // rank so that a HIGHER-performing run gets a HIGHER point band regardless of dir
    const better = (a, b) => g.dir === "high" ? a - b : b - a; // ascending in "worse→better"
    scored.sort((a, b) => better(a.v, b.v));
    // assign each DISTINCT value a band by where its group's midpoint falls in [0,n)
    // (ties grouped: every guest with the same value gets the same band)
    let i = 0;
    while (i < n) {
      let j = i;
      while (j < n && scored[j].v === scored[i].v) j++;   // [i,j) share one value
      const mid = (i + j - 1) / 2;                        // group's central rank
      const frac = n === 1 ? 0.5 : mid / (n - 1);          // 0 = worst, 1 = best
      const band = frac < 1 / 3 ? 1 : frac < 2 / 3 ? 2 : 3;
      for (let k = i; k < j; k++) out[scored[k].id] = band;
      i = j;
    }
    return out;
  }

  // Return a shallow-cloned guest list with curved games' answers overridden and
  // each guest's score recomputed. Fixed-score games are left untouched. Pure —
  // does not mutate stored submissions.
  function applyCurve(guests) {
    if (!guests.length) return guests;
    const bands = CURVE_GAMES.map(g => ({ g, idx: kindIndex(g.kind), map: curveOneGame(guests, g) }))
      .filter(b => b.idx >= 0);
    return guests.map(gu => {
      const answers = (gu.answers || []).slice();
      bands.forEach(b => { if (b.map[gu.id] != null) answers[b.idx] = b.map[gu.id]; });
      const raw = answers.reduce((a, v) => a + (v == null ? 0 : v), 0);
      const score = Math.min(100, Math.round((raw / MAX_RAW) * 100));
      return Object.assign({}, gu, { answers, score });
    });
  }
  // ──────────────────────────────────────────────────────────────────────────

  // Games keep their authored order (bank PIN must come before re-enter PIN, and
  // it stays last). The multiple-choice questions get dropped into random gaps
  // between them, so no two players see them in the same places.
  function buildQuizOrder() {
    const games = [], mc = [];
    QUESTIONS.forEach((q, i) => (q.mc ? mc : games).push(i));
    const shuffle = arr => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
    shuffle(mc);
    // Pick DISTINCT gaps between games (1..games.length-1 keeps the first game
    // first and the last game last). One MC per gap means they can never land
    // back-to-back — random placement, but always spread through the quiz.
    const gaps = [];
    for (let g = 1; g < games.length; g++) gaps.push(g);
    shuffle(gaps);
    let chosen = gaps.slice(0, mc.length);
    while (chosen.length < mc.length) chosen.push(1 + Math.floor(Math.random() * Math.max(1, games.length - 1))); // more MC than gaps
    chosen.sort((a, b) => b - a); // descending, so each splice can't shift the next
    const order = games.slice();
    chosen.forEach((pos, k) => order.splice(pos, 0, mc[k]));
    return order;
  }

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
     STORE - Firebase Realtime Database backed (live + cross-device).
     Submissions and the results_public flag live in the shared cloud DB and
     update in real time via Server-Sent Events (with a polling fallback).
     Admin auth and the dev-gate unlock stay PER-DEVICE in localStorage.
     ---------------------------------------------------------- */
  const LS = { auth: "ap_admin_auth_v1", pin: "ap_dev_unlocked_v1" };
  function load(key, fallback) {
    try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); }
    catch (e) { return fallback; }
  }
  function save(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

  // in-memory mirror of the cloud DB, kept live by the subscription below
  const DB = { submissions: {}, results_public: false };
  let dbReady = false, liveRefresh = null;
  const fbUrl = (path) => CONFIG.firebaseUrl + "/" + path + ".json";
  function fbWrite(method, path, val) {
    return fetch(fbUrl(path), { method, headers: { "Content-Type": "application/json" }, body: val === undefined ? undefined : JSON.stringify(val) }).catch(() => {});
  }

  const store = {
    all() { const s = DB.submissions || {}; return Object.keys(s).map(k => s[k]).filter(Boolean); },
    approved() { return applyCurve(this.all().filter(s => s.status === "approved")).sort((a, b) => a.score - b.score); },
    pending() { return this.all().filter(s => s.status === "pending"); },
    add(sub) { DB.submissions[sub.id] = sub; fbWrite("PUT", "submissions/" + sub.id, sub); },
    update(id, patch) { if (DB.submissions[id]) Object.assign(DB.submissions[id], patch); fbWrite("PATCH", "submissions/" + id, patch); },
    remove(id) { delete DB.submissions[id]; fbWrite("DELETE", "submissions/" + id); },
    resultsPublic() { return !!DB.results_public; },
    setResultsPublic(v) { DB.results_public = !!v; fbWrite("PUT", "results_public", !!v); },
    seedIfEmpty() { /* the shared DB is seeded once, server-side - no per-device seeding */ },
  };

  // merge a Firebase SSE event (path + data) into the local mirror
  function applyFb(path, data, isPatch) {
    const parts = String(path == null ? "/" : path).split("/").filter(Boolean);
    if (parts.length === 0) { DB.submissions = (data && data.submissions) || {}; DB.results_public = !!(data && data.results_public); return; }
    if (parts[0] === "submissions") {
      if (parts.length === 1) { if (isPatch) Object.assign(DB.submissions, data || {}); else DB.submissions = data || {}; }
      else { const id = parts[1]; if (data === null) delete DB.submissions[id]; else if (isPatch && DB.submissions[id]) Object.assign(DB.submissions[id], data); else DB.submissions[id] = data; }
    } else if (parts[0] === "results_public") { DB.results_public = !!data; }
  }
  // when cloud data changes, repaint just the live host/public views
  function onDbChange() { if (liveRefresh) { try { liveRefresh(); } catch (e) {} } }

  // live subscription: Server-Sent Events (true realtime), polling fallback
  function startLive() {
    try {
      const es = new EventSource(CONFIG.firebaseUrl + "/.json");
      let opened = false;
      const onMsg = (isPatch) => (ev) => {
        opened = true;
        let m; try { m = JSON.parse(ev.data); } catch (e) { return; }
        if (!m || m.path === undefined) return;
        applyFb(m.path, m.data, isPatch); dbReady = true; onDbChange();
      };
      es.addEventListener("put", onMsg(false));
      es.addEventListener("patch", onMsg(true));
      es.addEventListener("open", () => { opened = true; });
      es.onerror = () => { if (!opened) startPolling(); };
    } catch (e) { startPolling(); }
  }
  let pollTimer = null, lastSnap = "";
  function startPolling() {
    if (pollTimer) return;
    const poll = () => fetch(fbUrl("")).then(r => r.json()).then(data => {
      DB.submissions = (data && data.submissions) || {}; DB.results_public = !!(data && data.results_public); dbReady = true;
      const snap = JSON.stringify(DB); if (snap !== lastSnap) { lastSnap = snap; onDbChange(); }
    }).catch(() => {});
    poll(); pollTimer = setInterval(poll, 3500);
  }

  /* ----------------------------------------------------------
     UTIL
     ---------------------------------------------------------- */
  const $ = (sel, el) => (el || document).querySelector(sel);
  // globally-unique-ish id (cross-device safe; no '.' '$' '#' '[' ']' '/' for Firebase keys)
  const uid = () => "s-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  function bumpCtr() { /* no longer needed - uid is self-contained */ }
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
     SFX - tiny Web Audio synth (no asset files). Used for the
     presentation reveal: a ding per guest, a building drum roll,
     then a crash + fanfare for the 1st/2nd place reveal.
     ---------------------------------------------------------- */
  const sfx = (function () {
    let ctx = null;
    function ac() {
      if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
      if (ctx.state === "suspended") ctx.resume();
      return ctx;
    }
    function tone(freq, dur, type, gain, when) {
      const c = ac(); if (!c) return;
      const t0 = c.currentTime + (when || 0);
      const o = c.createOscillator(), g = c.createGain();
      o.type = type || "sine"; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(gain || 0.2, t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g).connect(c.destination); o.start(t0); o.stop(t0 + dur + 0.03);
    }
    function noise(dur, gain) {
      const c = ac(); if (!c) return;
      const t0 = c.currentTime;
      const b = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate * dur)), c.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
      const s = c.createBufferSource(); s.buffer = b;
      const g = c.createGain(); g.gain.value = gain || 0.2;
      s.connect(g).connect(c.destination); s.start(t0);
    }
    return {
      pop() { tone(420, 0.12, "triangle", 0.18); },
      ding() { tone(660, 0.16, "sine", 0.2); tone(990, 0.22, "sine", 0.13, 0.04); },
      crash() { noise(0.6, 0.28); tone(1320, 0.5, "sawtooth", 0.06); },
      fanfare() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.55, "sawtooth", 0.14, i * 0.1)); },
      drumroll(ms, cb) {
        const c = ac();
        const dur = ms || 1800, start = (c ? c.currentTime * 1000 : 0);
        if (!c) { if (cb) setTimeout(cb, dur); return; }
        let elapsedMs = 0;
        const hit = () => {
          if (elapsedMs >= dur) { if (cb) cb(); return; }
          noise(0.03, 0.12);
          const gap = Math.max(26, 95 - (elapsedMs / dur) * 64); // accelerate toward the end
          elapsedMs += gap;
          setTimeout(hit, gap);
        };
        hit();
      },
    };
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
    liveRefresh = null; // each view re-registers its own live-update hook
    const path = currentHash();
    // TV mode belongs to the host screens only — never leak the chrome-hiding elsewhere
    const fsKey = "/" + (path.split("/")[1] || "");
    if (fsKey !== "/present" && fsKey !== "/intro") document.body.classList.remove("present-fs");
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
            <span class="eyebrow">The 2nd Annual ${CONFIG.partyName}</span>
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
     QUIZ MINI-GAMES - interactive question types.
     Each game maps its interaction to a 0..3 score via setAnswer(),
     so the overall scoring math (MAX_RAW) is unchanged. Game questions
     keep an `opts` legend so the host answer-recap still renders.
     ---------------------------------------------------------- */
  const TRAIN_CARS = [
    { c: "var(--c1)", label: "the pink car" },
    { c: "var(--c2)", label: "the orange car" },
    { c: "var(--c3)", label: "the yellow car" },
    { c: "var(--c4)", label: "the green car" },
    { c: "var(--c5)", label: "the blue car" },
    { c: "var(--c6)", label: "the violet car" },
  ];
  const EYES_SVG = {
    anxious: `<svg class="re-eyes" viewBox="0 0 240 132" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <line x1="40" y1="50" x2="98" y2="32" stroke="#16130c" stroke-width="8" stroke-linecap="round"/>
      <line x1="200" y1="50" x2="142" y2="32" stroke="#16130c" stroke-width="8" stroke-linecap="round"/>
      <ellipse cx="70" cy="82" rx="36" ry="28" fill="#fff" stroke="#16130c" stroke-width="4.5"/>
      <ellipse cx="170" cy="82" rx="36" ry="28" fill="#fff" stroke="#16130c" stroke-width="4.5"/>
      <circle cx="74" cy="76" r="14" fill="#16130c"/>
      <circle cx="166" cy="76" r="14" fill="#16130c"/>
      <circle cx="79" cy="71" r="4.5" fill="#fff"/>
      <circle cx="171" cy="71" r="4.5" fill="#fff"/>
    </svg>`,
  };

  function renderTrainGame(body, Q, setAnswer) {
    const carRow = () => TRAIN_CARS.map((car, k) =>
      `<button class="tw-car" data-i="${k}" style="--car:${car.c}" type="button" aria-label="train car ${k + 1}">
         <span class="tw-roof"></span>
         <span class="tw-cab"><i class="tw-win"></i><i class="tw-win"></i></span>
         <span class="tw-wheel tw-wl"></span><span class="tw-wheel tw-wr"></span>
       </button>`).join("");
    body.innerHTML = `
      <div class="tw-stage">
        <div class="tw-train"><span class="tw-loco">🚂</span>${carRow()}<span class="tw-loco">🚂</span>${carRow()}</div>
        <div class="tw-track"></div>
      </div>
      <p class="tw-hint">🚂 tap your favorite car as it rolls by</p>
      <div class="tw-reveal" hidden></div>`;
    const start = Date.now();
    let picked = false; // lock after the first pick so the timing can't change
    const stage = $(".tw-stage", body), reveal = $(".tw-reveal", body), hint = $(".tw-hint", body);
    body.querySelectorAll(".tw-car").forEach(btn => {
      btn.addEventListener("click", () => {
        if (picked) return;
        picked = true;
        const secs = (Date.now() - start) / 1000;
        const points = secs < 3 ? 0 : secs < 7 ? 1 : secs < 14 ? 2 : 3;
        stage.classList.add("tw-stopped");
        body.querySelectorAll(".tw-car").forEach(b => { b.classList.remove("tw-picked"); b.disabled = true; });
        btn.classList.add("tw-picked");
        const car = TRAIN_CARS[+btn.dataset.i];
        if (hint) hint.style.display = "none";
        reveal.hidden = false;
        reveal.innerHTML = `You watched for <b>${secs.toFixed(1)} seconds</b> before picking ${car.label}.<br><span class="tw-twist">…we weren't really asking about the car.</span>`;
        setAnswer(points, { trainWatch: +secs.toFixed(1) });
      });
    });
  }

  function renderEyesGame(body, Q, setAnswer) {
    body.innerHTML = `<div class="re-face">${EYES_SVG[Q.eyes] || EYES_SVG.anxious}</div><div class="options re-opts"></div>`;
    const wrap = $(".re-opts", body);
    Q.opts.forEach(o => {
      const b = el(`<button class="option" type="button"><span class="dot"></span><span>${esc(o[0])}</span></button>`);
      b.addEventListener("click", () => {
        wrap.querySelectorAll(".option").forEach(x => x.classList.remove("selected"));
        b.classList.add("selected");
        setAnswer(o[1]);
      });
      wrap.appendChild(b);
    });
  }

  function renderEyeContactGame(body, Q, setAnswer) {
    body.innerHTML = `
      <div class="ec-wrap">
        <svg class="ec-eyes" viewBox="0 0 240 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <ellipse cx="70" cy="62" rx="40" ry="32" fill="#fff" stroke="#16130c" stroke-width="4.5"/>
          <ellipse cx="170" cy="62" rx="40" ry="32" fill="#fff" stroke="#16130c" stroke-width="4.5"/>
          <circle cx="70" cy="62" r="16" fill="#2f9bff" stroke="#16130c" stroke-width="3"/>
          <circle cx="170" cy="62" r="16" fill="#2f9bff" stroke="#16130c" stroke-width="3"/>
          <circle cx="70" cy="62" r="7.5" fill="#16130c"/>
          <circle cx="170" cy="62" r="7.5" fill="#16130c"/>
        </svg>
        <div class="ec-timer">0.0s</div>
        <div class="ec-taunt">Press &amp; hold. Don't look away.</div>
        <button class="btn btn-primary ec-hold" type="button">👁️ Hold eye contact</button>
        <div class="ec-reveal" hidden></div>
      </div>`;
    const wrap = $(".ec-wrap", body), timerEl = $(".ec-timer", body), taunt = $(".ec-taunt", body), btn = $(".ec-hold", body), reveal = $(".ec-reveal", body);
    const TAUNTS = [[0, "Don't look away."], [2, "They can see you."], [4, "They're still looking…"], [6, "Do NOT break."], [9, "This is a lot, huh."], [13, "Are you even blinking??"]];
    const VERDICTS = ["Unbreakable. Suspiciously neurotypical.", "Pretty solid — you can fake it.", "You cracked fast.", "Nope. Instant abort."];
    let startT = 0, tick = null, holding = false;
    function down(e) {
      e.preventDefault();
      if (holding) return;
      holding = true; startT = Date.now();
      wrap.classList.add("ec-on"); reveal.hidden = true;
      window.addEventListener("pointerup", up);
      tick = setInterval(() => {
        const s = (Date.now() - startT) / 1000;
        timerEl.textContent = s.toFixed(1) + "s";
        let t = TAUNTS[0][1];
        for (const band of TAUNTS) if (s >= band[0]) t = band[1];
        taunt.textContent = t;
        wrap.style.setProperty("--ec", Math.min(1, s / 12));
      }, 60);
    }
    function up() {
      if (!holding) return;
      holding = false; clearInterval(tick);
      window.removeEventListener("pointerup", up);
      wrap.classList.remove("ec-on"); wrap.style.setProperty("--ec", 0);
      const s = (Date.now() - startT) / 1000;
      const points = s >= 10 ? 0 : s >= 5 ? 1 : s >= 2 ? 2 : 3;
      taunt.textContent = "Press & hold. Don't look away.";
      timerEl.textContent = s.toFixed(1) + "s";
      reveal.hidden = false;
      reveal.innerHTML = `You held eye contact for <b>${s.toFixed(1)} seconds</b>.<br><span class="ec-verdict">${VERDICTS[points]}</span>`;
      setAnswer(points, { eyeContact: +s.toFixed(1) });
    }
    btn.addEventListener("pointerdown", down);
    btn.addEventListener("pointercancel", up);
  }

  // Sensory-dodge game: the player's avatar slides left/right to dodge falling
  // sensory hazards (loud noise, bright light, small talk, eye contact, surprise
  // plans…). Longer survival = better at weathering overstimulation = higher
  // score. setInterval loop (rAF throttles in background tabs); self-cleans on nav.
  function renderDodgeGame(body, Q, setAnswer, avatar) {
    body.innerHTML = `
      <div class="dodge-stage" id="dodge-stage">
        <div class="dodge-hud"><span class="dodge-time">0.0s</span><span class="dodge-lives" id="dodge-lives">❤️❤️❤️</span></div>
        <div class="dodge-player" id="dodge-player">${avatarSVG(avatar, { noBg: true })}</div>
        <div class="dodge-overlay" id="dodge-ov">
          <div class="dodge-msg">Dodge the overload.<small>Loud noises, small talk, eye contact, surprise plans — duck it all. Move with ← → (arrow keys or the buttons). 3 lives.</small></div>
          <button class="btn btn-primary dodge-go" type="button">▶ Start</button>
        </div>
      </div>
      <div class="dodge-dpad">
        <button class="dodge-dbtn" data-dir="left" type="button" aria-label="move left">◀</button>
        <button class="dodge-dbtn" data-dir="right" type="button" aria-label="move right">▶</button>
      </div>
      <div class="dodge-reveal" hidden></div>`;
    const stage = $("#dodge-stage", body), player = $("#dodge-player", body), timeEl = $(".dodge-time", body), ov = $("#dodge-ov", body), reveal = $(".dodge-reveal", body), livesEl = $("#dodge-lives", body);
    // falling sensory hazards: loud noise, bright light, phone call, small talk,
    // eye contact, scratchy wool, surprise party, handshake, plan change, alarm, karaoke, hug
    const PLAYER = 52, PAD = 4, EMOJI = ["🔊","💡","📞","💬","👁️","🧶","🎉","🤝","📅","🔔","🎤","🫂"];
    let running = false, loop = null, startT = 0, best = 0, elapsed = 0, last = 0, spawnAcc = 0, px = 0, W = 0, H = 0, rocks = [], lives = 3;
    let mvL = false, mvR = false;
    function measure() { const r = stage.getBoundingClientRect(); W = r.width; H = r.height; return r; }
    function clampPlayer() { px = Math.max(PAD, Math.min(W - PLAYER - PAD, px)); player.style.left = px + "px"; }
    function onKey(e) {
      const k = e.key;
      if (k !== "ArrowLeft" && k !== "ArrowRight" && k !== "a" && k !== "d" && k !== "A" && k !== "D") return;
      if (location.hash !== "#/test" && location.hash !== "#/debug") { cleanup(); return; }
      e.preventDefault();
      const down = e.type === "keydown";
      if (k === "ArrowLeft" || k === "a" || k === "A") mvL = down;
      else mvR = down;
    }
    function spawnRock() {
      const sz = 24 + Math.random() * 20, x = PAD + Math.random() * (W - sz - PAD * 2);
      const d = document.createElement("div");
      d.className = "dodge-rock"; d.textContent = EMOJI[Math.floor(Math.random() * EMOJI.length)];
      d.style.width = d.style.height = sz + "px"; d.style.left = x + "px"; d.style.top = (-sz) + "px";
      stage.appendChild(d);
      rocks.push({ el: d, x, y: -sz, size: sz, vy: 2 + Math.random() * 1.6 });
    }
    function cleanup() { running = false; clearInterval(loop); removeEventListener("keydown", onKey); removeEventListener("keyup", onKey); }
    function tick() {
      if (!document.body.contains(stage)) { cleanup(); return; }
      if (!running) return;
      const t = Date.now();
      let dt = last ? t - last : 16; last = t; if (dt > 60) dt = 60;
      elapsed = (t - startT) / 1000;
      timeEl.textContent = elapsed.toFixed(1) + "s";
      // move left/right while held
      const move = 6.2 * (dt / 16);
      if (mvL) px -= move; if (mvR) px += move;
      clampPlayer();
      const speed = 1 + elapsed * 0.07;
      spawnAcc += dt;
      const every = Math.max(260, 680 - elapsed * 24);
      if (spawnAcc >= every) { spawnAcc = 0; spawnRock(); }
      const playerTop = H - PLAYER - 10;
      for (let i = rocks.length - 1; i >= 0; i--) {
        const rk = rocks[i];
        rk.y += rk.vy * speed * (dt / 16);
        rk.el.style.top = rk.y + "px";
        if (rk.y + rk.size > playerTop + 6 && rk.y < playerTop + PLAYER - 6 && rk.x + rk.size > px + 6 && rk.x < px + PLAYER - 6) { gameOver(); return; }
        if (rk.y > H) { rk.el.remove(); rocks.splice(i, 1); }
      }
    }
    function start() {
      if (running) return;
      rocks.forEach(r => r.el.remove()); rocks = [];
      measure(); px = (W - PLAYER) / 2; clampPlayer();
      mvL = mvR = false;
      running = true; startT = Date.now(); last = 0; spawnAcc = 0; elapsed = 0;
      ov.style.display = "none"; reveal.hidden = true; stage.classList.add("dodge-playing");
      addEventListener("keydown", onKey); addEventListener("keyup", onKey);
      loop = setInterval(tick, 24);
    }
    function gameOver() {
      cleanup(); stage.classList.remove("dodge-playing");
      if (elapsed > best) best = elapsed;
      lives = Math.max(0, lives - 1);
      if (livesEl) livesEl.textContent = lives > 0 ? "❤️".repeat(lives) : "💀";
      const points = best < 3 ? 0 : best < 7 ? 1 : best < 13 ? 2 : 3;
      const verdicts = ["Overwhelmed on contact. Honestly relatable.", "You held on a bit before the meltdown.", "Impressively unbothered. Noise-cancelling soul.", "Total sensory zen. Nothing rattles you."];
      // best run so far is always the answer; Next stays locked until lives are
      // gone — no bailing early on a lives-based game.
      setAnswer(points, { dodge: +best.toFixed(1) }, lives > 0);
      reveal.hidden = false;
      reveal.innerHTML = `Survived <b>${best.toFixed(1)}s</b> of overload — ${verdicts[points]}<br><span class="dodge-twist">…the longer you can tune out the chaos, the more we suspect you've had practice. 😅</span>`;
      ov.style.display = "";
      if (lives > 0) {
        ov.innerHTML = `<div class="dodge-msg">💥 You survived <b>${elapsed.toFixed(1)}s</b><small>${lives} ${lives === 1 ? "life" : "lives"} left</small></div><button class="btn btn-primary dodge-go" type="button">↻ Use a life</button>`;
        ov.querySelector(".dodge-go").addEventListener("click", start);
      } else {
        ov.innerHTML = `<div class="dodge-msg">💀 Out of lives<small>Best run: ${best.toFixed(1)}s — hit Next →</small></div>`;
      }
    }
    body.querySelectorAll(".dodge-dbtn").forEach(b => {
      const d = b.getAttribute("data-dir");
      const on = (e) => { e.preventDefault(); if (!running) start(); if (d === "left") mvL = true; else mvR = true; b.classList.add("active"); };
      const off = (e) => { e.preventDefault(); if (d === "left") mvL = false; else mvR = false; b.classList.remove("active"); };
      b.addEventListener("pointerdown", on);
      b.addEventListener("pointerup", off);
      b.addEventListener("pointerleave", off);
      b.addEventListener("pointercancel", off);
    });
    ov.querySelector(".dodge-go").addEventListener("click", start);
  }

  // Flappy-bird-style game using the player's own avatar as the bird. Flap (click /
  // tap / Space / ↑ / button) to rise; gravity pulls you down; thread the gaps in
  // the pipes. Score = pipes passed; 3 lives, best run counts. setInterval loop.
  function renderFlappyGame(body, Q, setAnswer, avatar) {
    body.innerHTML = `
      <div class="flap-stage" id="flap-stage">
        <div class="flap-hud"><span class="flap-score" id="flap-score">0</span><span class="flap-lives" id="flap-lives">❤️❤️❤️</span></div>
        <div class="flap-layer" id="flap-layer"></div>
        <div class="flap-ground"></div>
        <div class="flap-bird" id="flap-bird">${avatarSVG(avatar, { noBg: true })}</div>
        <div class="flap-overlay" id="flap-ov">
          <div class="flap-msg">Flap to fly.<small>Click / tap, Space, ↑, or the FLAP button. <b>Clear the first pipe to start for real</b> — crash before that and it's a free retry.</small></div>
          <button class="btn btn-primary flap-go" type="button">▶ Start</button>
        </div>
      </div>
      <div class="flap-dpad"><button class="flap-btn" id="flap-flap" type="button">⬆ FLAP</button></div>
      <div class="flap-reveal" hidden></div>`;
    const stage = $("#flap-stage", body), layer = $("#flap-layer", body), bird = $("#flap-bird", body);
    const ov = $("#flap-ov", body), reveal = $(".flap-reveal", body), scoreEl = $("#flap-score", body), livesEl = $("#flap-lives", body);
    const BIRD = 40, GROUND = 26, PW = 60, GAP = 145;
    let running = false, loop = null, last = 0, W = 0, H = 0, by = 0, vy = 0, pipes = [], spawnAcc = 0, score = 0, best = 0, lives = 3;
    function birdX() { return W * 0.26; }
    function measure() { const r = stage.getBoundingClientRect(); W = r.width; H = r.height; }
    function paintBird() { bird.style.left = birdX() + "px"; bird.style.top = by + "px"; bird.style.transform = `rotate(${Math.max(-28, Math.min(70, vy * 5))}deg)`; }
    function spawnPipe() {
      const gap = Math.max(108, GAP - score * 4); // gap narrows as you score
      const gapTop = 28 + Math.random() * Math.max(20, H - GROUND - gap - 56);
      const top = document.createElement("div"); top.className = "flap-pipe flap-pipe-top";
      top.style.left = W + "px"; top.style.height = gapTop + "px"; top.style.width = PW + "px";
      const bot = document.createElement("div"); bot.className = "flap-pipe flap-pipe-bot";
      bot.style.left = W + "px"; bot.style.top = (gapTop + gap) + "px"; bot.style.height = (H - GROUND - gapTop - gap) + "px"; bot.style.width = PW + "px";
      layer.append(top, bot);
      pipes.push({ top, bot, x: W, gapTop, gap, scored: false });
    }
    function onKey(e) {
      if (e.key !== " " && e.key !== "ArrowUp" && e.key !== "Spacebar") return;
      if (location.hash !== "#/test" && location.hash !== "#/debug") { cleanup(); return; }
      e.preventDefault();
      if (e.type === "keydown") flap();
    }
    function cleanup() { running = false; clearInterval(loop); removeEventListener("keydown", onKey); }
    function flap() { if (!running) { start(); return; } vy = -6.7; }
    function tick() {
      if (!document.body.contains(stage)) { cleanup(); return; }
      if (!running) return;
      const t = Date.now(); let dt = last ? t - last : 16; last = t; if (dt > 60) dt = 60; const f = dt / 16;
      vy += 0.42 * f; by += vy * f;
      if (by < 0) { by = 0; vy = 0; }
      const floor = H - GROUND - BIRD;
      if (by >= floor) { by = floor; paintBird(); gameOver(); return; }
      spawnAcc += dt;
      const interval = Math.max(1050, 1500 - score * 45);   // pipes arrive faster as you score
      if (spawnAcc >= interval) { spawnAcc = 0; spawnPipe(); }
      const bx = birdX(), m = 6;
      const pspeed = 2.6 + Math.min(2.6, score * 0.12);      // and they move faster
      for (let i = pipes.length - 1; i >= 0; i--) {
        const p = pipes[i];
        p.x -= pspeed * f; p.top.style.left = p.x + "px"; p.bot.style.left = p.x + "px";
        if (bx + BIRD - m > p.x && bx + m < p.x + PW && (by + m < p.gapTop || by + BIRD - m > p.gapTop + p.gap)) { gameOver(); return; }
        if (!p.scored && p.x + PW < bx) { p.scored = true; score++; scoreEl.textContent = score; }
        if (p.x < -PW) { p.top.remove(); p.bot.remove(); pipes.splice(i, 1); }
      }
      paintBird();
    }
    function start() {
      if (running) return;
      pipes.forEach(p => { p.top.remove(); p.bot.remove(); }); pipes = [];
      measure(); by = H * 0.4; vy = 0; score = 0; scoreEl.textContent = "0"; spawnAcc = 700;
      running = true; last = 0;
      ov.style.display = "none"; reveal.hidden = true;
      addEventListener("keydown", onKey);
      paintBird();
      loop = setInterval(tick, 24);
    }
    function gameOver() {
      cleanup();
      if (score > best) best = score;
      const passedFirst = score >= 1; // lives only count once you've cleared a pipe
      if (passedFirst) { lives = Math.max(0, lives - 1); livesEl.textContent = lives > 0 ? "❤️".repeat(lives) : "💀"; }
      const points = best < 1 ? 0 : best < 3 ? 1 : best < 6 ? 2 : 3;
      const verdicts = ["Gravity won instantly. We respect the commitment.", "A few gaps cleared — not bad.", "Genuinely solid flapping.", "Inhuman focus. The pattern is yours."];
      // Next stays locked until you've truly run out of lives (and actually
      // started a counted run) — no bailing early.
      setAnswer(points, { flappyBest: best }, !passedFirst || lives > 0);
      reveal.hidden = false;
      reveal.innerHTML = `Best run: <b>${best}</b> pipe${best === 1 ? "" : "s"} — ${verdicts[points]}`;
      ov.style.display = "";
      if (!passedFirst) {
        ov.innerHTML = `<div class="flap-msg">🐤 You didn't clear the first pipe!<small>No life lost — get past pipe #1 and the real run begins.</small></div><button class="btn btn-primary flap-go" type="button">↻ Try again</button>`;
        ov.querySelector(".flap-go").addEventListener("click", start);
      } else if (lives > 0) {
        ov.innerHTML = `<div class="flap-msg">💥 Down you go<small>Score ${score} · ${lives} ${lives === 1 ? "life" : "lives"} left</small></div><button class="btn btn-primary flap-go" type="button">↻ Use a life</button>`;
        ov.querySelector(".flap-go").addEventListener("click", start);
      } else {
        ov.innerHTML = `<div class="flap-msg">💀 Out of lives<small>Best: ${best} pipes — hit Next →</small></div>`;
      }
    }
    stage.addEventListener("pointerdown", (e) => { if (!running && ov.style.display !== "none") return; e.preventDefault(); flap(); });
    $("#flap-flap", body).addEventListener("pointerdown", (e) => { e.preventDefault(); flap(); });
    ov.querySelector(".flap-go").addEventListener("click", start);
  }

  // "FEED EGGS" — a deadpan drag-to-feed game (homage to the ITYSL bit, drawn
  // from scratch in a muted monochrome style). Drag eggs from the basket onto
  // the egg; each one is +1. Feeding more = more autistic (the compulsion to
  // keep going). Open-ended, so Next is enabled from the first egg. The metric
  // eggsFed drives the "Fed the Most Eggs" award.
  function renderEggGame(body, Q, setAnswer) {
    const EGG = c => `<svg viewBox="0 0 40 52" xmlns="http://www.w3.org/2000/svg"><path d="M20 2 C31 2 36 24 36 34 A16 17 0 0 1 4 34 C4 24 9 2 20 2 Z" fill="#e7eef1" stroke="${c}" stroke-width="2.5"/></svg>`;
    const guySVG = `<svg viewBox="0 0 120 150" xmlns="http://www.w3.org/2000/svg">
      <line x1="49" y1="118" x2="45" y2="146" stroke="#33454f" stroke-width="4" stroke-linecap="round"/>
      <line x1="71" y1="118" x2="75" y2="146" stroke="#33454f" stroke-width="4" stroke-linecap="round"/>
      <line x1="36" y1="146" x2="52" y2="146" stroke="#33454f" stroke-width="4" stroke-linecap="round"/>
      <line x1="68" y1="146" x2="84" y2="146" stroke="#33454f" stroke-width="4" stroke-linecap="round"/>
      <path d="M60 6 C88 6 102 52 102 78 A42 46 0 0 1 18 78 C18 52 32 6 60 6 Z" fill="#cfe0e6" stroke="#33454f" stroke-width="3"/>
      <circle cx="45" cy="48" r="7.5" fill="#f2f7f9" stroke="#33454f" stroke-width="2"/><circle cx="46" cy="49" r="3" fill="#33454f"/>
      <circle cx="75" cy="48" r="7.5" fill="#f2f7f9" stroke="#33454f" stroke-width="2"/><circle cx="74" cy="49" r="3" fill="#33454f"/>
      <ellipse cx="60" cy="89" rx="21" ry="25" fill="#24343f"/>
    </svg>`;
    const basketSVG = `<svg viewBox="0 0 130 96" xmlns="http://www.w3.org/2000/svg">
      <g fill="#e7eef1" stroke="#33454f" stroke-width="1.6">
        <ellipse cx="42" cy="40" rx="11" ry="14"/><ellipse cx="65" cy="34" rx="11" ry="14"/><ellipse cx="88" cy="40" rx="11" ry="14"/>
        <ellipse cx="54" cy="30" rx="11" ry="14"/><ellipse cx="77" cy="30" rx="11" ry="14"/>
      </g>
      <path d="M18 50 Q65 62 112 50 L100 90 L30 90 Z" fill="#b7cdd5" stroke="#33454f" stroke-width="3"/>
      <path d="M18 50 Q65 62 112 50" fill="none" stroke="#33454f" stroke-width="3"/>
      <path d="M40 53 L34 87 M60 56 L58 89 M80 56 L82 89 M98 53 L94 87" stroke="#33454f" stroke-width="1.3" fill="none" opacity=".55"/>
    </svg>`;
    body.innerHTML = `
      <div class="egg-screen" id="egg-screen">
        <div class="egg-title">FEED EGGS</div>
        <div class="egg-msg"><div class="egg-msg-bar"></div><div class="egg-msg-text" id="egg-msg">Drag an egg from the basket into the egg.</div></div>
        <div class="egg-hand" aria-hidden="true">👆</div>
        <div class="egg-guy" id="egg-guy">${guySVG}</div>
        <div class="egg-basket" id="egg-basket" title="drag an egg">${basketSVG}</div>
        <div class="egg-count" id="egg-count">EGGS: 0</div>
      </div>
      <div class="egg-reveal" id="egg-reveal" hidden></div>`;
    const guy = $("#egg-guy", body), basket = $("#egg-basket", body);
    const countEl = $("#egg-count", body), msgEl = $("#egg-msg", body), reveal = $("#egg-reveal", body);
    let count = 0, dragEl = null;
    const scoreFor = n => n === 0 ? 0 : n < 5 ? 1 : n < 12 ? 2 : 3;
    setAnswer(0, { eggsFed: 0 }); // open-ended: Next is available from the start
    function feed() {
      count++;
      countEl.textContent = "EGGS: " + count;
      msgEl.textContent = `You now have ${count} egg${count === 1 ? "" : "s"}.`;
      guy.classList.remove("egg-gulp"); void guy.offsetWidth; guy.classList.add("egg-gulp");
      reveal.hidden = false;
      reveal.innerHTML = `The egg has eaten <b>${count}</b> egg${count === 1 ? "" : "s"}. It would like more.`;
      setAnswer(scoreFor(count), { eggsFed: count });
    }
    function onMove(e) {
      if (!dragEl) return;
      if (!document.body.contains(guy)) { endDrag(); return; }
      dragEl.style.left = e.clientX + "px"; dragEl.style.top = e.clientY + "px";
    }
    function endDrag(e) {
      basket.removeEventListener("pointermove", onMove);
      basket.removeEventListener("pointerup", endDrag);
      basket.removeEventListener("pointercancel", endDrag);
      let hit = false;
      if (e && dragEl) { const r = guy.getBoundingClientRect(); hit = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; }
      if (dragEl) { dragEl.remove(); dragEl = null; }
      if (hit) feed();
    }
    basket.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      if (dragEl) return;
      try { basket.setPointerCapture(e.pointerId); } catch (_) {}
      dragEl = document.createElement("div");
      dragEl.className = "egg-drag";
      dragEl.innerHTML = EGG("#33454f");
      dragEl.style.left = e.clientX + "px"; dragEl.style.top = e.clientY + "px";
      document.body.appendChild(dragEl);
      basket.addEventListener("pointermove", onMove);
      basket.addEventListener("pointerup", endDrag);
      basket.addEventListener("pointercancel", endDrag);
    });
  }

  // 3-chest logic puzzle (painted treasure-chest look). One chest holds the
  // correct answer; read the self-referential signs and open the right one —
  // one shot. Solving it by deduction is peak autistic-coded (correct = 3,
  // wrong = 0). A brute-force solver derives the answer from the sign predicates
  // so scoring can never disagree with the logic. Board (Blue/White/Black,
  // answer = White) is solver-verified to have exactly one deducible answer.
  const BOX_BOARD = {
    ruleFn: () => true, // each sign is simply true or false; consistency does the work
    colors: ["blue", "white", "black"],
    colorNames: ["Blue", "White", "Black"],
    boxes: [
      "You will open this box and not find the correct answer.",
      "A true box contains the correct answer.",
      "This box and the white box are both false.",
    ],
    preds: [
      (p, t) => p !== 0,                                 // box 1 is empty
      (p, t) => t[p] === true,                           // the answer sits in a box whose sign is true
      (p, t) => t[2] === false && t[1] === false,        // this box (Black) and the White box are both false
    ],
  };
  function solveBoxes(board) {
    const answers = new Set();
    for (let p = 0; p < 3; p++) {
      for (let m = 0; m < 8; m++) {
        const t = [!!(m & 1), !!(m & 2), !!(m & 4)];
        const cnt = t.reduce((a, b) => a + (b ? 1 : 0), 0);
        let ok = true;
        for (let i = 0; i < 3; i++) { if (t[i] !== board.preds[i](p, t)) { ok = false; break; } }
        if (ok && board.ruleFn(p, t, cnt)) answers.add(p);
      }
    }
    return answers.size === 1 ? [...answers][0] : 0;
  }
  const CHEST_TINTS = {
    blue:  { fill: "#a9c2e0", band: "#6d86a8", stroke: "#2c3e56" },
    white: { fill: "#eef1f4", band: "#c3cbd2", stroke: "#49555f" },
    black: { fill: "#474d57", band: "#727a86", stroke: "#20252c" },
  };
  function chestSVG(colorKey) {
    const c = CHEST_TINTS[colorKey] || CHEST_TINTS.white;
    return `<svg viewBox="0 0 200 200" class="chest-svg" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="100" cy="190" rx="80" ry="8" fill="rgba(0,0,0,.3)"/>
      <rect x="26" y="112" width="148" height="72" rx="6" fill="${c.fill}" stroke="${c.stroke}" stroke-width="3"/>
      <line x1="64" y1="116" x2="64" y2="180" stroke="${c.stroke}" stroke-width="1.4" opacity=".35"/>
      <line x1="100" y1="116" x2="100" y2="180" stroke="${c.stroke}" stroke-width="1.4" opacity=".35"/>
      <line x1="136" y1="116" x2="136" y2="180" stroke="${c.stroke}" stroke-width="1.4" opacity=".35"/>
      <rect x="26" y="112" width="9" height="72" fill="${c.band}" stroke="${c.stroke}" stroke-width="2"/>
      <rect x="165" y="112" width="9" height="72" fill="${c.band}" stroke="${c.stroke}" stroke-width="2"/>
      <path d="M22,116 L22,60 Q22,26 66,26 L134,26 Q178,26 178,60 L178,116 Z" fill="${c.fill}" stroke="${c.stroke}" stroke-width="3"/>
      <rect x="22" y="108" width="156" height="10" fill="${c.band}" stroke="${c.stroke}" stroke-width="2"/>
      <rect x="34" y="38" width="132" height="66" rx="5" fill="#f3efe2" stroke="${c.stroke}" stroke-width="2.5"/>
      <rect x="39" y="43" width="122" height="56" rx="3" fill="none" stroke="#b9b09a" stroke-width="1.2"/>
      <circle cx="100" cy="126" r="5" fill="${c.band}" stroke="${c.stroke}" stroke-width="2"/>
      <g fill="${c.band}" stroke="${c.stroke}" stroke-width="2">
        <rect x="96" y="160" width="8" height="30" rx="2"/>
        <circle cx="93" cy="185" r="6" fill="none"/><circle cx="107" cy="185" r="6" fill="none"/>
      </g>
    </svg>`;
  }
  function renderBoxesGame(body, Q, setAnswer) {
    const board = BOX_BOARD;
    const answer = solveBoxes(board);
    const chests = board.boxes.map((sign, i) =>
      `<button class="chest chest-${board.colors[i]}" type="button" data-i="${i}">
         ${chestSVG(board.colors[i])}
         <div class="chest-sign">${esc(sign)}</div>
         <div class="chest-open" aria-hidden="true"></div>
         <div class="chest-tag">${board.colorNames[i]} chest</div>
       </button>`).join("");
    body.innerHTML = `
      <div class="chestq">
        <div class="chestq-row">${chests}</div>
        <div class="chestq-reveal" id="chestq-reveal" hidden></div>
      </div>`;
    const reveal = $("#chestq-reveal", body);
    let done = false;
    body.querySelectorAll(".chest").forEach(btn => {
      btn.addEventListener("click", () => {
        if (done) return;
        done = true;
        const correct = +btn.dataset.i === answer;
        body.querySelectorAll(".chest").forEach(b => b.disabled = true);
        btn.classList.add(correct ? "chest-correct" : "chest-wrong");
        const o = btn.querySelector(".chest-open"); if (o) o.textContent = correct ? "💎" : "🕳️";
        reveal.hidden = false;
        reveal.textContent = correct ? "✅ Correct" : "❌ Wrong";
        setAnswer(correct ? 3 : 0, { boxSolved: correct ? 1 : 0 });
      });
    });
  }

  // Rigged rock-paper-scissors, best 3 of 5. The computer ALWAYS wins the match
  // (it reacts to your pick). Each round has a 33% chance of a TIE (computer
  // mirrors your move → replay, no score change); ties don't consume a decisive
  // outcome, so the rig still guarantees the computer wins. The human can win a
  // round or two but never the match. We DON'T reveal the gag during play — after
  // each loss it just says "so close, play again?". The gag is only revealed when
  // they hit GIVE UP ("you played N games that were impossible to win"). Score is
  // persistence: the more matches you grind through before giving up, the higher.
  const RPS = { rock: "🪨", paper: "📄", scissors: "✂️" };
  const RPS_BEATEN_BY = { rock: "paper", paper: "scissors", scissors: "rock" }; // move that BEATS the key
  const RPS_LOSES_TO = { rock: "scissors", paper: "rock", scissors: "paper" };  // move the key BEATS
  function renderRpsGame(body, Q, setAnswer, avatar) {
    body.innerHTML = `
      <div class="rps-wrap">
        <div class="rps-hud"><span class="rps-score" id="rps-score">You 0 — 0 CPU</span></div>
        <div class="rps-arena">
          <div class="rps-side"><div class="rps-av">${avatarSVG(avatar, { noBg: true })}</div><div class="rps-pick" id="rps-you">❔</div><div class="rps-label">You</div></div>
          <div class="rps-vs">VS</div>
          <div class="rps-side"><div class="rps-av rps-cpu">🤖</div><div class="rps-pick" id="rps-cpu">❔</div><div class="rps-label">Computer</div></div>
        </div>
        <div class="rps-result" id="rps-result">Best 3 of 5. Make your move.</div>
        <div class="rps-moves" id="rps-moves">
          <button class="rps-move" data-m="rock" type="button">🪨<span>Rock</span></button>
          <button class="rps-move" data-m="paper" type="button">📄<span>Paper</span></button>
          <button class="rps-move" data-m="scissors" type="button">✂️<span>Scissors</span></button>
        </div>
        <button class="rps-giveup" id="rps-giveup" type="button">I give up →</button>
        <div class="rps-reveal" hidden></div>
      </div>`;
    const youPick = $("#rps-you", body), cpuPick = $("#rps-cpu", body), scoreEl = $("#rps-score", body), resultEl = $("#rps-result", body);
    const movesEl = $("#rps-moves", body), reveal = $(".rps-reveal", body), giveBtn = $("#rps-giveup", body);
    let outcomes = [], round = 0, you = 0, cpu = 0, busy = false, games = 0, done = false;
    // best 3 of 5: computer always reaches 3 first; human gets 0-2 (weighted to feel close)
    function rig() {
      const humanWins = [2, 2, 2, 1, 2, 0][Math.floor(Math.random() * 6)];
      const pool = [];
      for (let i = 0; i < humanWins; i++) pool.push("H");
      for (let i = 0; i < 2; i++) pool.push("C"); // 2 cpu wins now, 3rd clinches at the end
      for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
      return pool.concat("C");
    }
    function setMovesEnabled(on) { movesEl.querySelectorAll(".rps-move").forEach(b => b.disabled = !on); }
    function newMatch() {
      outcomes = rig(); round = 0; you = 0; cpu = 0; busy = false;
      youPick.textContent = "❔"; cpuPick.textContent = "❔";
      scoreEl.textContent = "You 0 — 0 CPU";
      resultEl.textContent = "Best 3 of 5. Make your move.";
      reveal.hidden = true; reveal.innerHTML = "";
      setMovesEnabled(true);
    }
    function play(human) {
      if (busy || done) return;
      busy = true;
      // 33% chance of a tie on ANY round — the computer mirrors your move and the
      // round just replays (no score change, no decisive outcome consumed).
      const tie = Math.random() < 1 / 3;
      const want = tie ? null : outcomes[round]; // 'C' = computer wins, 'H' = human wins
      const cpuMove = tie ? human : (want === "C" ? RPS_BEATEN_BY[human] : RPS_LOSES_TO[human]);
      youPick.textContent = RPS[human];
      setMovesEnabled(false);
      // tiny suspense beat before the computer "decides"
      let n = 0;
      const shuffle = setInterval(() => { cpuPick.textContent = ["🪨", "📄", "✂️"][n++ % 3]; }, 90);
      setTimeout(() => {
        clearInterval(shuffle);
        cpuPick.textContent = RPS[cpuMove];
        if (tie) {
          resultEl.textContent = "🤝 Tie — replay that round.";
        } else {
          if (want === "C") { cpu++; } else { you++; }
          round++;
          scoreEl.textContent = `You ${you} — ${cpu} CPU`;
          if (cpu === 3) { matchOver(); return; }
          resultEl.textContent = (want === "C" ? "💻 Computer takes the round." : "🎉 You win that one!") + " Keep going →";
        }
        busy = false; setMovesEnabled(true);
      }, 700);
    }
    function matchOver() {
      games++;
      setMovesEnabled(false);
      resultEl.textContent = `💻 Computer wins it, ${cpu}–${you}.`;
      // NO gag here — just nudge them to try again
      reveal.hidden = false;
      reveal.innerHTML = `${you === 2 ? "Agonizingly close." : "Tough one."}
        <div class="rps-again"><button class="btn btn-primary rps-retry" type="button">🔁 Play again</button></div>`;
      reveal.querySelector(".rps-retry").addEventListener("click", newMatch);
    }
    function giveUp() {
      if (done) return;
      done = true; setMovesEnabled(false); giveBtn.style.display = "none";
      setAnswer(Math.min(3, games), { rpsGames: games, rpsWins: you });
      resultEl.textContent = "🤖 The computer cannot lose.";
      reveal.hidden = false;
      const g = games;
      const gag = g === 0
        ? `Confession: that game was <b>impossible to win</b>. The whole thing was rigged — the computer cannot lose.`
        : `You just played <b>${g}</b> game${g === 1 ? "" : "s"} that ${g === 1 ? "was" : "were"} <b>impossible to win</b>. The whole thing was rigged — the computer literally cannot lose. 🤖`;
      reveal.innerHTML = `${gag}<br><span class="rps-hint">…hit <b>Next →</b> to move on.</span>`;
    }
    movesEl.querySelectorAll(".rps-move").forEach(b => b.addEventListener("click", () => play(b.getAttribute("data-m"))));
    giveBtn.addEventListener("click", giveUp);
    newMatch();
  }

  function renderBankPinGame(body, Q, setAnswer, state) {
    body.innerHTML = `
      <div class="pinq">
        <p class="pinq-note">Pick a 4-digit PIN you'd actually use.</p>
        <input class="pinq-input" id="pin-in" type="password" inputmode="numeric" maxlength="4" placeholder="••••" autocomplete="off" />
        <button class="btn btn-primary" id="pin-submit" disabled>Lock it in →</button>
        <div class="pinq-checks" id="pin-checks" hidden></div>
        <div class="pinq-roast" id="pin-roast" hidden></div>
      </div>`;
    const inp = $("#pin-in", body), checks = $("#pin-checks", body), roast = $("#pin-roast", body), btn = $("#pin-submit", body);
    const ROASTS = [
      "Your PIN basically screams 'rob me'. A toddler could guess that.",
      "Bold choice. Your bank manager is sweating a little.",
      "Not bad. You're not the easiest target on the block.",
      "Basically uncrackable. Suspicious, honestly.",
    ];
    // no live feedback while typing — only validate length
    inp.addEventListener("input", () => {
      const v = inp.value.replace(/\D/g, "").slice(0, 4);
      inp.value = v;
      btn.disabled = v.length < 4;
    });
    btn.addEventListener("click", () => {
      const v = inp.value.replace(/\D/g, "").slice(0, 4);
      if (v.length < 4) return;
      const { pts, checks: c } = scorePin(v);
      state.bankPin = v;
      // now reveal which of the three checks they passed
      checks.hidden = false;
      checks.innerHTML = c.map(ck =>
        `<div class="pinq-check ${ck.ok ? "ok" : "bad"}">${ck.ok ? "✅" : "❌"} ${ck.ok ? ck.good : ck.bad}</div>`
      ).join("");
      roast.hidden = false;
      roast.textContent = ROASTS[pts];
      btn.textContent = "PIN saved ✓";
      btn.disabled = true;
      inp.disabled = true;
      setAnswer(pts);
    });
    setTimeout(() => inp.focus(), 60);
  }

  function renderColorGame(body, Q, setAnswer) {
    const hue = Math.floor(Math.random() * 360);
    // Phase 1: memorize the swatch (no slider visible). After the countdown the
    // whole memorize block is REPLACED by the matching slider.
    body.innerHTML = `
      <div class="colq">
        <div class="colq-memorize" id="colq-mem">
          <div class="colq-swatch" style="background:hsl(${hue},72%,56%)"></div>
          <div class="colq-msg">Memorize this color — you have <b id="colq-cd">3</b>s</div>
        </div>
      </div>`;
    const colq = $(".colq", body), cdEl = $("#colq-cd", body), mem = $("#colq-mem", body);
    let cd = 3;
    const tick = setInterval(() => {
      cd--;
      if (cd > 0) { cdEl.textContent = cd; return; }
      clearInterval(tick);
      showGuess();
    }, 1000);
    function showGuess() {
      // swap the memorize block out for the slider
      mem.remove();
      const guess = el(`
        <div class="colq-guess">
          <p class="colq-hint">Now match it — drag the slider to the color you saw.</p>
          <input type="range" class="hue-slider" id="hue-sl" min="0" max="359" value="180" />
          <div class="colq-preview" id="colq-prev" style="background:hsl(180,72%,56%)"></div>
          <button class="btn btn-primary" id="colq-submit">That's it →</button>
        </div>`);
      colq.appendChild(guess);
      const sl = $("#hue-sl", body), prev = $("#colq-prev", body), submitBtn = $("#colq-submit", body);
      sl.addEventListener("input", () => { prev.style.background = `hsl(${sl.value},72%,56%)`; });
      submitBtn.addEventListener("click", () => {
        const g = +sl.value;
        let diff = Math.abs(hue - g);
        if (diff > 180) diff = 360 - diff;
        const pts = diff < 15 ? 3 : diff < 35 ? 2 : diff < 70 ? 1 : 0;
        const msgs = ["Not even close — were you even looking? 👀", "Same rough ballpark.", "Ooh, pretty close!", "Basically a perfect match. Spooky color memory."];
        // show the real color next to their guess (no confusing "degrees")
        guess.innerHTML = `
          <p class="colq-verdict">${msgs[pts]}</p>
          <div class="colq-compare">
            <div class="colq-cmp"><div class="colq-cmp-sw" style="background:hsl(${hue},72%,56%)"></div><span>the color</span></div>
            <div class="colq-cmp"><div class="colq-cmp-sw" style="background:hsl(${g},72%,56%)"></div><span>your match</span></div>
          </div>`;
        setAnswer(pts);
      });
    }
  }

  function renderTypingGame(body, Q, setAnswer) {
    body.innerHTML = `
      <div class="typeq">
        <div class="typeq-target" id="tq-target">${esc(TYPING_SENTENCE)}</div>
        <textarea class="typeq-input" id="tq-in" rows="3" placeholder="Just start typing — the timer begins the moment you do…"></textarea>
        <div class="typeq-timer" id="tq-timer">0.00s</div>
        <div class="typeq-result" id="tq-result" hidden></div>
      </div>`;
    const target = TYPING_SENTENCE;
    const inp = $("#tq-in", body), timerEl = $("#tq-timer", body), result = $("#tq-result", body);
    let startT = 0, tick = null, started = false, finished = false;
    inp.addEventListener("input", () => {
      if (finished) return;
      // the clock starts on the very first keystroke — no start button
      if (!started) {
        started = true;
        startT = Date.now();
        tick = setInterval(() => { timerEl.textContent = ((Date.now() - startT) / 1000).toFixed(2) + "s"; }, 50);
      }
      const v = inp.value;
      const correct = target.startsWith(v);
      inp.classList.toggle("typeq-ok", v === target);
      inp.classList.toggle("typeq-wrong", !correct && v.length > 0);
      if (v === target) {
        finished = true;
        clearInterval(tick);
        const secs = (Date.now() - startT) / 1000;
        inp.disabled = true;
        const pts = secs < 8 ? 3 : secs < 13 ? 2 : secs < 20 ? 1 : 0;
        const msgs = ["Blazing fast. Were you… prepared for this?", "Pretty quick — you've typed that before.", "Decent. You got there.", "You typed it correctly though, so."];
        result.hidden = false;
        result.innerHTML = `Finished in <b>${secs.toFixed(2)}s</b> — ${msgs[pts]}`;
        timerEl.textContent = secs.toFixed(2) + "s";
        setAnswer(pts, { typeSecs: +secs.toFixed(2) });
      }
    });
    setTimeout(() => inp.focus(), 60);
  }

  function renderReenterPinGame(body, Q, setAnswer, state) {
    const saved = state.bankPin || "";
    body.innerHTML = `
      <div class="pinq">
        <p class="pinq-note">You set a bank PIN earlier. What was it?</p>
        <input class="pinq-input" id="repin-in" type="password" inputmode="numeric" maxlength="4" placeholder="••••" autocomplete="off" />
        <div class="pinq-roast" id="repin-roast" hidden></div>
        <button class="btn btn-primary" id="repin-submit" disabled>Submit →</button>
      </div>`;
    const inp = $("#repin-in", body), roast = $("#repin-roast", body), btn = $("#repin-submit", body);
    inp.addEventListener("input", () => {
      const v = inp.value.replace(/\D/g, "").slice(0, 4);
      inp.value = v;
      btn.disabled = v.length < 4;
    });
    btn.addEventListener("click", () => {
      const v = inp.value.replace(/\D/g, "").slice(0, 4);
      if (v.length < 4) return;
      const correct = saved && v === saved;
      roast.hidden = false;
      roast.textContent = correct
        ? "Correct. You remembered your own PIN. Deeply autistic."
        : saved ? `Nope. It was ${saved}. You forgot your own PIN in under 10 minutes.`
        : "No PIN was set — you skipped question 1 somehow.";
      inp.disabled = true;
      btn.textContent = correct ? "✓ Correct" : "✗ Wrong";
      btn.disabled = true;
      setAnswer(correct ? 3 : 0);
    });
    setTimeout(() => inp.focus(), 60);
  }

  // Queen Elizabeth II: born 21 April 1926. Knowing an obscure date to the
  // day = peak autism energy. Guess month/day/year; scored on how close.
  const QE_BIRTH = { y: 1926, m: 4, d: 21 };
  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  function dayOfYear(m, d) { const cum = [0,31,59,90,120,151,181,212,243,273,304,334]; return cum[m-1] + d; }
  function daysInMonth(m, y) { const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; return [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]; }
  // a real "on this day" historical fact for every day of the year (the year of
  // the event needn't match the year they typed — it's a fact about the DATE).
  // DAY_FACTS[month-1][day-1]. February has 29 entries for leap day.
  const DAY_FACTS = [
    [ // January
      "New Year's Day kicked off — and the Euro entered circulation (2002)","Georgia became the 4th U.S. state (1788)","Alaska became the 49th U.S. state (1959)","Isaac Newton was born (1643) and the Burj Khalifa opened as the world's tallest building (2010)","construction began on the Golden Gate Bridge (1933)","Joan of Arc was born (1412)","the first U.S. presidential election was held (1789)","both Elvis Presley (1935) and David Bowie (1947) were born","Steve Jobs unveiled the very first iPhone (2007)","the United Nations General Assembly met for the first time (1946)","insulin was first used to treat a diabetic patient (1922)","the National Geographic Society was founded (1888)","the first public radio broadcast was made (1910)","Albert Schweitzer was born (1875)","Wikipedia launched (2001) and Martin Luther King Jr. was born (1929)","Prohibition was set in motion in the U.S. (1919)","Benjamin Franklin was born (1706)","A.A. Milne, creator of Winnie-the-Pooh, was born (1882)","Edgar Allan Poe was born (1809)","U.S. presidents have been inaugurated on this day since 1937","the USS Nautilus, the first nuclear submarine, was launched (1954)","Queen Victoria died after a 63-year reign (1901)","Elizabeth Blackwell became the first woman to earn a U.S. medical degree (1849)","gold was discovered at Sutter's Mill, sparking the California Gold Rush (1848)","the first Winter Olympics opened (1924)","the First Fleet arrived in Australia, now Australia Day (1788)","Mozart was born (1756) and Auschwitz was liberated (1945)","the Space Shuttle Challenger broke apart after launch (1986)","the Victoria Cross medal was established (1856)","Mahatma Gandhi was assassinated (1948)","the U.S. launched its first satellite, Explorer 1 (1958)"
    ],
    [ // February
      "the Space Shuttle Columbia broke apart on re-entry (2003)","Groundhog Day is observed, and James Joyce was born (1882)","Buddy Holly's plane crash became 'the day the music died' (1959)","Facebook launched (2004) and Rosa Parks was born (1913)","baseball legend Hank Aaron was born (1934)","Queen Elizabeth II acceded to the throne (1952)","the Beatles arrived in America (1964) and Charles Dickens was born (1812)","Mary, Queen of Scots was executed (1587)","the Beatles played 'The Ed Sullivan Show' for 73 million viewers (1964)","world champion Garry Kasparov first faced IBM's Deep Blue (1996)","Nelson Mandela was released from prison (1990) and Thomas Edison was born (1847)","both Abraham Lincoln and Charles Darwin were born (1809)","the Allied firebombing of Dresden began (1945)","it's Valentine's Day — and explorer Captain James Cook was killed in Hawaii (1779)","Galileo Galilei was born (1564)","the tomb of Tutankhamun was opened (1923)","basketball legend Michael Jordan was born (1963)","Pluto was discovered (1930)","Thomas Edison patented the phonograph (1878) and Copernicus was born (1473)","John Glenn became the first American to orbit the Earth (1962)","'The Communist Manifesto' was published (1848)","George Washington was born (1732)","the U.S. flag was raised on Iwo Jima (1945) and Handel was born (1685)","Steve Jobs was born (1955)","Beatle George Harrison was born (1943)","the Grand Canyon became a national park (1919)","the Reichstag fire broke out in Berlin (1933) and John Steinbeck was born (1902)","the final episode of 'M*A*S*H' aired to the biggest TV audience ever (1983)","it's Leap Day, which only rolls around once every four years"
    ],
    [ // March
      "Yellowstone became the world's first national park (1872)","Dr. Seuss was born (1904)","Alexander Graham Bell was born (1847)","the first U.S. Congress convened (1789)","Soviet leader Joseph Stalin died (1953)","Michelangelo was born (1475)","Alexander Graham Bell was granted the telephone patent (1876)","International Women's Day is marked around the world","the ironclads Monitor and Merrimack fought (1862) and Barbie debuted (1959)","Alexander Graham Bell made the first-ever phone call (1876)","a massive earthquake and tsunami struck Fukushima, Japan (2011)","Gandhi set out on his famous Salt March (1930)","Uranus was discovered by William Herschel (1781)","Albert Einstein was born (1879) — fittingly, it's also Pi Day","Julius Caesar was assassinated on the Ides of March (44 BC)","Robert Goddard launched the first liquid-fueled rocket (1926)","St. Patrick's Day is celebrated","Alexei Leonov performed the first-ever spacewalk (1965)","the Sydney Harbour Bridge opened (1932)","spring begins at the equinox, and 'Uncle Tom's Cabin' was published (1852)","Johann Sebastian Bach was born (1685)","Britain's Stamp Act inflamed the American colonies (1765)","Patrick Henry cried 'Give me liberty, or give me death!' (1775)","the Exxon Valdez oil spill struck Alaska (1989) and Harry Houdini was born (1874)","the Triangle Shirtwaist Factory fire spurred U.S. labor laws (1911)","Jonas Salk announced a working polio vaccine (1953)","the Tenerife disaster, the deadliest in aviation history, occurred (1977)","the Three Mile Island nuclear accident began (1979)","the last U.S. combat troops left Vietnam (1973)","Vincent van Gogh was born (1853)","the Eiffel Tower opened to the public (1889)"
    ],
    [ // April
      "it's April Fools' Day — trust no one","fairy-tale author Hans Christian Andersen was born (1805)","the Pony Express began carrying mail (1860)","Martin Luther King Jr. was assassinated (1968) and NATO was founded (1949)","Pocahontas married John Rolfe (1614)","the first modern Olympic Games opened in Athens (1896)","the World Health Organization was founded (1948)","Pablo Picasso died (1973)","the American Civil War effectively ended at Appomattox (1865)","the Titanic set sail on its maiden voyage (1912)","Apollo 13 launched toward its near-disaster (1970)","Yuri Gagarin became the first human in space (1961)","Thomas Jefferson was born (1743)","the Titanic struck an iceberg (1912) and Lincoln was shot (1865)","the Titanic sank (1912) and Leonardo da Vinci was born (1452)","Charlie Chaplin was born (1889)","the Ford Mustang made its debut (1964)","Paul Revere made his midnight ride (1775) and the great San Francisco earthquake struck (1906)","the American Revolution began at Lexington and Concord (1775)","artist Joan Miró was born (1893)","Rome was founded according to legend (753 BC) — and a certain Queen was born (1926) 👑","the very first Earth Day was celebrated (1970)","William Shakespeare was both born and died on this day (1564 and 1616)","the Hubble Space Telescope was launched into orbit (1990)","Watson and Crick published the structure of DNA (1953)","the Chernobyl nuclear disaster unfolded (1986)","Samuel Morse, inventor of Morse code, was born (1791)","the mutiny on the Bounty took place (1789)","the zipper was patented (1913)","George Washington was inaugurated as the first U.S. president (1789)"
    ],
    [ // May
      "the Empire State Building opened (1931)","Leonardo da Vinci died (1519)","political philosopher Niccolò Machiavelli was born (1469)","Star Wars fans celebrate 'May the Fourth'","Cinco de Mayo is celebrated, and Karl Marx was born (1818)","the Hindenburg airship burst into flames (1937) and Sigmund Freud was born (1856)","the Lusitania was sunk by a U-boat (1915)","V-E Day marked victory in Europe in WWII (1945)","the FDA approved the first birth-control pill (1960)","the first U.S. transcontinental railroad was completed (1869)","songwriter Irving Berlin was born (1888)","nursing pioneer Florence Nightingale was born (1820)","musician Stevie Wonder was born (1950)","Edward Jenner tested the first smallpox vaccine (1796) and Israel declared independence (1948)","nylon stockings first went on sale (1940)","the first-ever Academy Awards were handed out (1929)","the Supreme Court's Brown v. Board of Education ended school segregation (1954)","Mount St. Helens erupted (1980)","Anne Boleyn was executed on Henry VIII's orders (1536)","Charles Lindbergh began the first solo transatlantic flight (1927)","Clara Barton founded the American Red Cross (1881)","Arthur Conan Doyle, creator of Sherlock Holmes, was born (1859)","outlaws Bonnie and Clyde were killed in an ambush (1934)","the Brooklyn Bridge opened (1883) and Morse sent his first telegraph message (1844)","the first 'Star Wars' film premiered (1977)","the Dunkirk evacuation began (1940)","the Golden Gate Bridge opened to pedestrians (1937)","the Dionne quintuplets, the first to survive infancy, were born (1934)","Hillary and Norgay first summited Mount Everest (1953) and JFK was born (1917)","Joan of Arc was burned at the stake (1431)","poet Walt Whitman was born (1819)"
    ],
    [ // June
      "Marilyn Monroe was born (1926)","Queen Elizabeth II was crowned at Westminster Abbey (1953)","Ed White became the first American to walk in space (1965)","the Montgolfier brothers gave the first public hot-air balloon demonstration (1783)","the Marshall Plan to rebuild Europe was announced (1947)","D-Day — Allied forces stormed the beaches of Normandy (1944)","musician Prince was born (1958)","architect Frank Lloyd Wright was born (1867)","Donald Duck made his cartoon debut (1934)","Judy Garland was born (1922)","ocean explorer Jacques Cousteau was born (1910)","Anne Frank was born (1929) and later received her famous diary (1942)","the U.S. Supreme Court established Miranda rights (1966)","it's Flag Day, and the U.S. Army was founded (1775)","King John sealed the Magna Carta (1215)","Valentina Tereshkova became the first woman in space (1963)","the Statue of Liberty arrived in New York (1885) and the Watergate break-in occurred (1972)","the Battle of Waterloo was fought (1815) and Paul McCartney was born (1942)","Juneteenth marks the end of slavery in the U.S. (1865)","the film 'Jaws' opened and invented the summer blockbuster (1975)","the summer solstice brings the longest day of the year","Galileo was forced by the Inquisition to recant (1633)","computing pioneer Alan Turing was born (1912)","the first widely reported UFO sighting occurred (1947)","Custer met his end at the Battle of Little Bighorn (1876) and Michael Jackson died (2009)","the UN Charter was signed (1945) and the first 'Harry Potter' book was published (1997)","Helen Keller was born (1880)","Archduke Franz Ferdinand was assassinated, triggering WWI (1914)","Shakespeare's Globe Theatre burned to the ground (1613)","the Tunguska blast flattened a Siberian forest (1908)"
    ],
    [ // July
      "it's Canada Day (1867), and the Battle of Gettysburg began (1863)","the U.S. Civil Rights Act was signed into law (1964)","writer Franz Kafka was born (1883)","the U.S. declared its independence (1776)","Dolly the sheep, the first cloned mammal, was born (1996)","Louis Pasteur first used his rabies vaccine on a human (1885)","Beatle Ringo Starr was born (1940)","the Liberty Bell rang out for the Declaration of Independence (1776)","Elias Howe patented the sewing machine (1846)","inventor Nikola Tesla was born (1856)","'To Kill a Mockingbird' was published (1960)","writer and naturalist Henry David Thoreau was born (1817)","the global Live Aid concerts raised famine relief (1985)","it's Bastille Day — Parisians stormed the Bastille (1789)","the painter Rembrandt was born (1606)","the first atomic bomb was detonated in the Trinity test (1945) and Apollo 11 launched (1969)","Disneyland opened its gates (1955)","Nelson Mandela was born (1918)","the Seneca Falls women's rights convention opened (1848)","Neil Armstrong walked on the Moon (1969)","writer Ernest Hemingway was born (1899)","Wiley Post completed the first solo flight around the world (1933)","the ice cream cone was reportedly invented at the World's Fair (1904)","Amelia Earhart was born (1897) — and it's the day of a certain Autism Party 🎉","Louise Brown, the first test-tube baby, was born (1978)","Rolling Stone Mick Jagger was born (1943)","the armistice ending the Korean War was signed (1953)","World War I officially began (1914)","NASA was established (1958)","automaker Henry Ford was born (1863)","J.K. Rowling — and her character Harry Potter — share this birthday (1965)"
    ],
    [ // August
      "MTV launched and aired its first music video (1981)","Wild Bill Hickok was shot holding the 'dead man's hand' (1876)","Christopher Columbus set sail for the New World (1492)","jazz great Louis Armstrong was born (1901)","astronaut Neil Armstrong was born (1930)","the atomic bomb was dropped on Hiroshima (1945)","George Washington created the Purple Heart medal (1782)","Britain's Great Train Robbery was pulled off (1963)","Richard Nixon resigned the U.S. presidency (1974)","the Smithsonian Institution was founded (1846)","Apple co-founder Steve Wozniak was born (1950)","Cleopatra, last pharaoh of Egypt, died (30 BC)","filmmaker Alfred Hitchcock was born (1899)","Japan announced its surrender, ending WWII (1945)","India gained independence (1947) and the Woodstock festival began (1969)","Elvis Presley died at Graceland (1977)","frontiersman Davy Crockett was born (1786)","the 19th Amendment giving American women the vote was ratified (1920)","designer Coco Chanel was born (1883)","NASA's Voyager 2 probe launched on its grand tour (1977)","the Mona Lisa was stolen from the Louvre (1911)","the first America's Cup yacht race was held (1851)","dancer and actor Gene Kelly was born (1912)","Mount Vesuvius buried Pompeii in ash (AD 79)","actor Sean Connery, the first James Bond, was born (1930)","the 19th Amendment was certified, and American women could vote (1920)","the volcano Krakatoa erupted catastrophically (1883)","Martin Luther King Jr. gave his 'I Have a Dream' speech (1963)","Michael Jackson was born (1958)","Mary Shelley, author of 'Frankenstein', was born (1797)","Princess Diana died in a Paris car crash (1997)"
    ],
    [ // September
      "World War II began as Germany invaded Poland (1939)","the Great Fire of London broke out (1666)","Britain and France declared war on Germany (1939)","Google was founded (1998)","the first U.S. Labor Day was celebrated (1882)","the Marquis de Lafayette, hero of two revolutions, was born (1757)","Queen Elizabeth I of England was born (1533)","the original 'Star Trek' premiered on TV (1966)","California became the 31st U.S. state (1850)","Colonel Sanders, founder of KFC, was born (1890)","the September 11th terrorist attacks occurred (2001)","the prehistoric Lascaux cave paintings were discovered (1940)","children's author Roald Dahl was born (1916)","Francis Scott Key wrote 'The Star-Spangled Banner' (1814)","mystery writer Agatha Christie was born (1890)","the Mayflower set sail for America (1620)","the U.S. Constitution was signed (1787)","the cornerstone of the U.S. Capitol was laid (1793)","Ötzi the 5,000-year-old Iceman was discovered in the Alps (1991)","Magellan's expedition set out to circle the globe (1519)","'The Hobbit' was first published (1937)","Lincoln issued the preliminary Emancipation Proclamation (1862)","the planet Neptune was discovered (1846)","Jim Henson, creator of the Muppets, was born (1936)","Balboa became the first European to see the Pacific Ocean (1513)","the first televised U.S. presidential debate, Kennedy vs Nixon, aired (1960)","the 'Locomotion' pulled the first passenger railway train (1825)","Alexander Fleming discovered penicillin (1928)","physicist Enrico Fermi was born (1901)","actor James Dean died in a car crash (1955)"
    ],
    [ // October
      "Walt Disney World opened in Florida (1971)","Mahatma Gandhi was born (1869)","East and West Germany were reunified (1990)","the Soviet Union launched Sputnik, the first satellite (1957)","the first James Bond film, 'Dr. No', premiered (1962)","'The Jazz Singer', the first 'talkie', opened (1927)","writer Edgar Allan Poe died mysteriously (1849)","the Great Chicago Fire broke out (1871)","Beatle John Lennon was born (1940)","the U.S. Naval Academy opened (1845)","Eleanor Roosevelt was born (1884)","Christopher Columbus reached the Americas (1492)","the cornerstone of the White House was laid (1792)","Chuck Yeager broke the sound barrier in flight (1947)","the accused spy Mata Hari was executed (1917)","writer Oscar Wilde was born (1854)","gangster Al Capone was convicted of tax evasion (1931)","the U.S. formally took possession of Alaska from Russia (1867)","the stock market crashed on 'Black Monday' (1987)","the Sydney Opera House was officially opened (1973)","Thomas Edison demonstrated a long-lasting light bulb (1879)","JFK announced the naval blockade of the Cuban Missile Crisis (1962)","the Hungarian Revolution against Soviet rule began (1956)","the United Nations officially came into existence (1945)","artist Pablo Picasso was born (1881)","the Erie Canal opened, linking the Great Lakes to the Atlantic (1825)","the New York City subway opened (1904)","the Statue of Liberty was dedicated (1886)","the first message was sent over ARPANET, the early internet (1969)","Orson Welles' 'War of the Worlds' broadcast sparked panic (1938)","it's Halloween — and Martin Luther sparked the Reformation with his 95 Theses (1517)"
    ],
    [ // November
      "Michelangelo's Sistine Chapel ceiling was unveiled (1512)","the first scheduled U.S. radio broadcast aired election results (1920)","the dog Laika became the first animal to orbit Earth (1957)","the tomb of Tutankhamun was discovered (1922)","Britain marks Guy Fawkes Night and the foiled Gunpowder Plot (1605)","Abraham Lincoln was elected president (1860)","scientist Marie Curie was born (1867)","Wilhelm Röntgen discovered X-rays (1895)","the Berlin Wall fell (1989)","'Sesame Street' premiered (1969)","the WWI armistice took effect at the 11th hour (1918)","sculptor Auguste Rodin was born (1840)","'Treasure Island' author Robert Louis Stevenson was born (1850)","Impressionist painter Claude Monet was born (1840)","the Articles of Confederation were adopted (1777)","Oklahoma became the 46th U.S. state (1907)","the Suez Canal opened (1869)","Mickey Mouse debuted in 'Steamboat Willie' (1928)","Lincoln delivered the Gettysburg Address (1863)","the Nuremberg Trials of Nazi war criminals began (1945)","the Montgolfier brothers made the first manned hot-air balloon flight (1783)","President John F. Kennedy was assassinated in Dallas (1963)","'Doctor Who' first aired on the BBC (1963)","Darwin's 'On the Origin of Species' went on sale (1859)","industrialist Andrew Carnegie was born (1835)","Charles M. Schulz, creator of 'Peanuts', was born (1922)","Alfred Nobel signed the will that created the Nobel Prizes (1895)","Magellan's fleet reached the Pacific Ocean (1520)","'Little Women' author Louisa May Alcott was born (1832)","both Winston Churchill (1874) and Mark Twain (1835) were born"
    ],
    [ // December
      "Rosa Parks refused to give up her bus seat, sparking a boycott (1955)","scientists achieved the first controlled nuclear chain reaction (1942)","surgeons performed the first human heart transplant (1967)","abstract-art pioneer Wassily Kandinsky was born (1866)","Walt Disney was born (1901)","the 13th Amendment abolished slavery in the U.S. (1865)","the attack on Pearl Harbor drew the U.S. into WWII (1941)","musician John Lennon was killed in New York (1980)","the computer mouse was publicly demonstrated for the first time (1968)","the first Nobel Prizes were awarded (1901)","UNICEF was founded to help children worldwide (1946)","Marconi received the first transatlantic radio signal (1901)","Sir Francis Drake set out to circumnavigate the globe (1577)","Roald Amundsen became the first to reach the South Pole (1911)","the U.S. Bill of Rights was ratified (1791)","the Boston Tea Party dumped British tea into the harbor (1773)","the Wright brothers made the first powered airplane flight (1903)","filmmaker Steven Spielberg was born (1946)","Dickens' 'A Christmas Carol' was first published (1843)","the Louisiana Purchase doubled the size of the U.S. (1803)","the Mayflower pilgrims landed at Plymouth (1620) — and it's the winter solstice","Tchaikovsky's 'The Nutcracker' premiered (1892)","the transistor was first demonstrated at Bell Labs (1947)","Apollo 8 orbited the Moon on Christmas Eve (1968)","it's Christmas Day — and Isaac Newton was born (1642)","Charles Babbage, father of the computer, was born (1791)","microbiologist Louis Pasteur was born (1822)","the Lumière brothers held the first public movie screening (1895)","Texas became the 28th U.S. state (1845)","'The Jungle Book' author Rudyard Kipling was born (1865)","it's New Year's Eve — the first Times Square ball dropped (1907)"
    ],
  ];
  function factFor(m, d) { const f = (DAY_FACTS[m - 1] || [])[d - 1]; return f || "history is being coy about what happened"; }
  function renderQueenBdayGame(body, Q, setAnswer) {
    body.innerHTML = `
      <div class="qbq">
        <div class="qbq-fields">
          <label class="qbq-field">Month
            <select class="qbq-sel" id="qb-m"><option value="" selected>—</option>${MONTHS.map((mn,i)=>`<option value="${i+1}">${mn}</option>`).join("")}</select>
          </label>
          <label class="qbq-field">Day
            <input class="qbq-in" id="qb-d" type="number" min="1" max="31" inputmode="numeric" />
          </label>
          <label class="qbq-field">Year
            <input class="qbq-in" id="qb-y" type="number" min="1000" max="2026" inputmode="numeric" />
          </label>
        </div>
        <div class="qbq-err" id="qb-err" hidden></div>
        <button class="btn btn-primary" id="qb-submit" disabled>Lock in guess →</button>
        <div class="qbq-reveal" id="qb-reveal" hidden></div>
      </div>`;
    const mSel = $("#qb-m", body), dIn = $("#qb-d", body), yIn = $("#qb-y", body), btn = $("#qb-submit", body), reveal = $("#qb-reveal", body), err = $("#qb-err", body);
    const check = () => { btn.disabled = !(mSel.value && dIn.value && yIn.value); };
    // keep the day between 1 and 31 as they type
    dIn.addEventListener("input", () => { let v = dIn.value.replace(/[^\d]/g, ""); if (v !== "") v = String(Math.max(1, Math.min(31, +v))); dIn.value = v; err.hidden = true; check(); });
    mSel.addEventListener("change", () => { err.hidden = true; check(); });
    yIn.addEventListener("input", () => { err.hidden = true; check(); });
    btn.addEventListener("click", () => {
      const m = +mSel.value, d = +dIn.value, y = +yIn.value || 0;
      // reject impossible dates (April 31, Feb 30, Feb 29 in a non-leap year…)
      const dim = daysInMonth(m, y || 2024);
      if (d < 1 || d > dim) {
        err.hidden = false;
        err.innerHTML = `🚫 <b>${MONTHS[m-1]} ${d}</b> isn't a real date — ${MONTHS[m-1]}${m === 2 ? ` ${y}` : ""} only has <b>${dim}</b> days. Try again.`;
        return;
      }
      let dist = Math.abs(dayOfYear(m, d) - dayOfYear(QE_BIRTH.m, QE_BIRTH.d));
      if (dist > 182) dist = 365 - dist; // wrap around the calendar
      const yearOff = Math.abs(y - QE_BIRTH.y);
      const exact = m === QE_BIRTH.m && d === QE_BIRTH.d && y === QE_BIRTH.y;
      let pts;
      if (exact || (dist === 0 && yearOff <= 1)) pts = 3;
      else if (dist <= 7 && yearOff <= 5) pts = 2;
      else if (dist <= 31) pts = 1;
      else pts = 0;
      const roasts = [
        "Way off — honestly, healthy. Normal people don't keep this filed away.",
        "Right season, at least. We'll allow it.",
        "Spookily close. Slightly concerned about you.",
        "You KNEW that. Why do you know that? (You're among friends.)",
      ];
      reveal.hidden = false;
      reveal.innerHTML = `📅 <b>${MONTHS[m-1]} ${d}</b>: ${factFor(m, d)}. <i>Are you fond of that?</i><br><br>The answer was <b>21 April 1926</b>. ${exact ? "🎯 Exact match! " : ""}${roasts[pts]}`;
      btn.disabled = true; btn.textContent = "Locked in";
      mSel.disabled = dIn.disabled = yIn.disabled = true;
      // dist = days off from April 21 (wrapped around the calendar) — powers the "Closest Queen Birthday" award
      setAnswer(pts, { qeDaysOff: dist });
    });
  }

  // World's Hardest Game clone: red square crosses a checkerboard field full of
  // bouncing blue dots, from the pink start zone (left) to the pink end zone
  // (right). Keyboard arrows / WASD on desktop, on-screen D-pad on mobile.
  // Skill under pressure = more autistic. setInterval loop (rAF throttles in bg
  // tabs); self-cleans if the quiz navigates away.
  function renderWhgGame(body, Q, setAnswer) {
    body.innerHTML = `
      <div class="whg-wrap">
        <div class="whg-hud">
          <span class="whg-level" id="whg-level">Easy</span>
          <span class="whg-levelnum" id="whg-levelnum">Level 1 / 3</span>
          <span class="whg-coins" id="whg-coins">🪙 0/1</span>
          <span class="whg-lives" id="whg-lives">❤️❤️❤️</span>
        </div>
        <div class="whg-field" id="whg-field">
          <div class="whg-zone whg-start"></div>
          <div class="whg-zone whg-end"></div>
          <div class="whg-layer" id="whg-layer"></div>
          <div class="whg-player" id="whg-player"></div>
          <div class="whg-overlay" id="whg-ov">
            <div class="whg-msg">Cross all 3 levels.<small>Grab every 🪙, then reach the far side. Arrow keys / WASD or the buttons below. A blue dot costs a life — you get 3.</small></div>
            <button class="btn btn-primary whg-go" type="button">▶ Start</button>
          </div>
        </div>
        <div class="whg-dpad">
          <button class="whg-dbtn whg-up"    data-dir="up"    type="button" aria-label="up">▲</button>
          <button class="whg-dbtn whg-left"  data-dir="left"  type="button" aria-label="left">◀</button>
          <button class="whg-dbtn whg-down"  data-dir="down"  type="button" aria-label="down">▼</button>
          <button class="whg-dbtn whg-right" data-dir="right" type="button" aria-label="right">▶</button>
        </div>
        <div class="whg-reveal" hidden></div>
      </div>`;
    // virtual coordinate system; scaled to the measured field on every frame
    const VW = 640, VH = 380, PS = 26;
    const startX2 = 92, endX1 = VW - 92; // inner edges of the two pink zones
    // 3 levels: easy / medium / hard. More lanes, more dots per lane, faster.
    const midX = (startX2 + endX1) / 2;
    // Level geometry: player is 26px (half 13), dots r=15, so anything closer
    // than 28px to a dot's path can be clipped. Coins sit well clear of every
    // fixed path (verticals live in their own columns, away from the coins).
    // helper: `count` dots evenly spread along a horizontal lane at height y
    const lane = (y, count, speed, sign) => {
      const span = endX1 - startX2, arr = [];
      for (let k = 0; k < count; k++) arr.push({ x: startX2 + span * ((k + 0.5) / count), y, vx: sign * speed });
      return arr;
    };
    const LEVELS = [
      // Easy: four dots bobbing up/down, each in its own column; coin mid-field.
      { name: "Easy", coins: [[midX, 195]], dots: [
        { x: 183, y: 60,  vy: 1.6 }, { x: 274, y: 320, vy: -1.6 },
        { x: 365, y: 60,  vy: 1.6 }, { x: 456, y: 320, vy: -1.6 },
      ] },
      // Medium: three horizontal lanes plus two vertical bobbers.
      { name: "Medium", coins: [[startX2 + 80, 157], [endX1 - 80, 232]], dots: [
        ...lane(120, 3, 2.1, 1), ...lane(195, 3, 2.2, -1), ...lane(270, 3, 2.3, 1),
        { x: 250, y: 40, vy: 2.0 }, { x: 390, y: 340, vy: -2.0 },
      ] },
      // Hard: horizontals + vertical bobbers + diagonal bouncers, 3-coin zig-zag.
      { name: "Hard", coins: [[startX2 + 70, 130], [endX1 - 70, 210], [midX, 290]], dots: [
        ...lane(90, 2, 2.7, 1), ...lane(330, 2, 2.7, -1),
        { x: 200, y: 60, vy: 2.2 }, { x: 270, y: 300, vy: -2.2 }, { x: 440, y: 60, vy: 2.2 },
        { x: 150, y: 100, vx: 1.9, vy: 1.6 }, { x: 470, y: 280, vx: -1.9, vy: -1.6 }, { x: 320, y: 60, vx: 1.7, vy: 2.0 },
      ] },
    ];
    function buildEnemies(lv) {
      return LEVELS[lv].dots.map(d => ({
        x: d.x, y: d.y, r: 15, vx: d.vx || 0, vy: d.vy || 0,
        xMin: startX2 + 4, xMax: endX1 - 4, yMin: 19, yMax: VH - 19,
      }));
    }
    function buildCoins(lv) { return LEVELS[lv].coins.map(([x, y]) => ({ x, y, got: false })); }

    const field = $("#whg-field", body), layer = $("#whg-layer", body), player = $("#whg-player", body);
    const ov = $("#whg-ov", body), reveal = $(".whg-reveal", body);
    const levelEl = $("#whg-level", body), levelNumEl = $("#whg-levelnum", body), livesEl = $("#whg-lives", body), coinsEl = $("#whg-coins", body);
    let W = 0, H = 0, sx = 1, sy = 1;
    function measure() { const r = field.getBoundingClientRect(); W = r.width; H = r.height; sx = W / VW; sy = H / VH; }
    let px = 46, py = VH / 2;
    const dir = { up: false, down: false, left: false, right: false };
    let level = 0, lives = 3, levelsDone = 0, enemies = [], enemyEls = [], coins = [], coinEls = [], coinsLeft = 0;
    let running = false, loop = null, last = 0, answered = false, phase = "ready";

    function updateHud() {
      levelEl.textContent = LEVELS[level].name;
      levelNumEl.textContent = `Level ${level + 1} / 3`;
      const total = LEVELS[level].coins.length;
      coinsEl.textContent = `🪙 ${total - coinsLeft}/${total}`;
      livesEl.textContent = lives > 0 ? "❤️".repeat(lives) : "💀";
    }
    function buildSprites() {
      layer.innerHTML = "";
      enemyEls = enemies.map(() => { const d = document.createElement("div"); d.className = "whg-enemy"; layer.appendChild(d); return d; });
      coinEls = coins.map(() => { const d = document.createElement("div"); d.className = "whg-coin"; layer.appendChild(d); return d; });
    }
    function paintSprites() {
      measure();
      enemies.forEach((e, i) => { const el = enemyEls[i]; if (!el) return; const d = e.r * 2 * sx; el.style.width = el.style.height = d + "px"; el.style.left = (e.x * sx - d / 2) + "px"; el.style.top = (e.y * sy - d / 2) + "px"; });
      coins.forEach((c, i) => { const el = coinEls[i]; if (!el) return; el.style.display = c.got ? "none" : ""; const d = 18 * sx; el.style.width = el.style.height = d + "px"; el.style.left = (c.x * sx - d / 2) + "px"; el.style.top = (c.y * sy - d / 2) + "px"; });
      const ps = PS * sx; player.style.width = player.style.height = ps + "px"; player.style.left = (px * sx - ps / 2) + "px"; player.style.top = (py * sy - ps / 2) + "px";
    }
    function resetPlayer() { px = 46; py = VH / 2; }
    function clearInput() { dir.up = dir.down = dir.left = dir.right = false; body.querySelectorAll(".whg-dbtn.active").forEach(b => b.classList.remove("active")); }
    function cleanup() { running = false; clearInterval(loop); removeEventListener("keydown", onKey); removeEventListener("keyup", onKey); clearInput(); }
    function loadLevel(lv) {
      level = lv; enemies = buildEnemies(lv); coins = buildCoins(lv); coinsLeft = coins.length;
      clearInput(); buildSprites(); resetPlayer(); updateHud();
      field.classList.toggle("whg-locked", coinsLeft > 0);
      ov.style.display = "none"; reveal.hidden = true;
      running = true; last = 0; phase = "playing";
      addEventListener("keydown", onKey); addEventListener("keyup", onKey);
      clearInterval(loop); loop = setInterval(tick, 24);
      paintSprites();
    }
    function flash() { field.classList.add("whg-hit"); setTimeout(() => field.classList.remove("whg-hit"), 160); }
    function onDeath() {
      lives = Math.max(0, lives - 1); updateHud(); flash();
      if (lives <= 0) { endGame(false); return; }
      // dying resets the level's coins — you have to collect them all again
      coins.forEach(c => c.got = false); coinsLeft = coins.length;
      field.classList.add("whg-locked");
      resetPlayer(); updateHud(); paintSprites();
    }
    function onLevelClear() {
      levelsDone = level + 1;
      if (level >= LEVELS.length - 1) { endGame(true); return; }
      cleanup(); phase = "between";
      ov.style.display = "";
      ov.innerHTML = `<div class="whg-msg">✅ ${LEVELS[level].name} cleared!<small>${lives} ${lives === 1 ? "life" : "lives"} left — up next: ${LEVELS[level + 1].name}.</small></div><button class="btn btn-primary whg-go" type="button">Next level →</button>`;
      ov.querySelector(".whg-go").addEventListener("click", () => loadLevel(level + 1));
    }
    function endGame(won) {
      if (answered) return;
      answered = true; phase = "over"; cleanup();
      const deaths = 3 - lives, pts = Math.min(3, levelsDone);
      setAnswer(pts, { whgDeaths: deaths, whgWon: won ? 1 : 0, whgLevels: levelsDone });
      ov.style.display = "";
      ov.innerHTML = won
        ? `<div class="whg-msg">🏁 All 3 levels beaten!<small>${deaths} death${deaths === 1 ? "" : "s"} — hit Next →</small></div>`
        : `<div class="whg-msg">💀 Out of lives<small>Cleared ${levelsDone}/3 levels — hit Next →</small></div>`;
      reveal.hidden = false;
      reveal.innerHTML = won
        ? `🏁 Cleared all 3 levels with <b>${deaths}</b> death${deaths === 1 ? "" : "s"}. <span class="whg-twist">The calmer you stayed under fire, the more autistic we're afraid you are.</span>`
        : `Cleared <b>${levelsDone}/3</b> levels before the blue dots won. ${levelsDone >= 2 ? "Genuinely impressive." : levelsDone === 1 ? "Respectable start." : "Brutal — the dots showed no mercy."}`;
    }
    function tick() {
      if (!document.body.contains(field)) { cleanup(); return; }
      if (!running) return;
      const t = Date.now(); let dt = last ? t - last : 16; last = t; if (dt > 60) dt = 60; const f = dt / 16;
      const sp = 3.0 * f;
      if (dir.left) px -= sp; if (dir.right) px += sp; if (dir.up) py -= sp; if (dir.down) py += sp;
      px = Math.max(PS / 2, Math.min(VW - PS / 2, px)); py = Math.max(PS / 2, Math.min(VH - PS / 2, py));
      for (const e of enemies) {
        if (e.vx) { e.x += e.vx * f; if (e.x <= e.xMin) { e.x = e.xMin; e.vx = Math.abs(e.vx); } else if (e.x >= e.xMax) { e.x = e.xMax; e.vx = -Math.abs(e.vx); } }
        if (e.vy) { e.y += e.vy * f; if (e.y <= e.yMin) { e.y = e.yMin; e.vy = Math.abs(e.vy); } else if (e.y >= e.yMax) { e.y = e.yMax; e.vy = -Math.abs(e.vy); } }
      }
      const half = PS / 2;
      // collect coins on contact
      for (const c of coins) {
        if (c.got) continue;
        const cdx = c.x - px, cdy = c.y - py;
        if (cdx * cdx + cdy * cdy < (half + 11) * (half + 11)) {
          c.got = true; coinsLeft--; updateHud();
          if (coinsLeft === 0) field.classList.remove("whg-locked");
        }
      }
      for (const e of enemies) {
        const nx = Math.max(px - half, Math.min(e.x, px + half));
        const ny = Math.max(py - half, Math.min(e.y, py + half));
        const dx = e.x - nx, dy = e.y - ny;
        if (dx * dx + dy * dy < e.r * e.r) { onDeath(); return; }
      }
      // the exit only opens once every coin on the level is collected
      if (px >= endX1 + 4 && coinsLeft === 0) { paintSprites(); onLevelClear(); return; }
      paintSprites();
    }
    function onKey(e) {
      const map = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right", w: "up", s: "down", a: "left", d: "right", W: "up", S: "down", A: "left", D: "right" };
      const k = map[e.key]; if (!k) return;
      if (location.hash !== "#/test" && location.hash !== "#/debug") { cleanup(); return; }
      e.preventDefault();
      dir[k] = e.type === "keydown";
    }
    function start() { if (phase !== "ready") return; loadLevel(0); }
    body.querySelectorAll(".whg-dbtn").forEach(b => {
      const d = b.getAttribute("data-dir");
      const on = (e) => { e.preventDefault(); if (phase === "ready") start(); dir[d] = true; b.classList.add("active"); };
      const off = (e) => { e.preventDefault(); dir[d] = false; b.classList.remove("active"); };
      b.addEventListener("pointerdown", on);
      b.addEventListener("pointerup", off);
      b.addEventListener("pointerleave", off);
      b.addEventListener("pointercancel", off);
    });
    ov.querySelector(".whg-go").addEventListener("click", start);
    buildSprites(); paintSprites();
  }

  // "How many holes in a Polo?" — recreated to look like the hand-drawn trivia
  // meme: white card, red scribbled number, blue marker question, 2×2 pink
  // buttons with thick blue borders and side cables. We score it silently
  // (four is "correct") and never reveal right/wrong — you just move on.
  const POLO_CIRCLE = `<svg class="polo-ring" viewBox="0 0 110 110" aria-hidden="true"><path d="M59,9 C86,8 104,31 100,57 C96,85 71,103 45,99 C21,95 6,72 11,46 C15,23 34,11 57,11" fill="none" stroke="#ec1c24" stroke-width="6.5" stroke-linecap="round"/></svg>`;
  function renderPoloGame(body, Q, setAnswer, num) {
    const cells = Q.opts.map((o, idx) =>
      `<button class="polo-opt ${idx % 2 === 0 ? "lcol" : "rcol"}" type="button" data-i="${idx}">
         <i class="pw" style="--y:30%"></i><i class="pw" style="--y:70%"></i>
         <span class="polo-lbl">${esc(o[0])}</span>
       </button>`).join("");
    body.innerHTML = `
      <div class="polo">
        <div class="polo-top">
          <span class="polo-num">${POLO_CIRCLE}<b>${num}.</b></span>
          <div class="polo-q">${esc(Q.q)}</div>
        </div>
        <div class="polo-grid">${cells}</div>
      </div>`;
    let picked = false;
    body.querySelectorAll(".polo-opt").forEach(btn => {
      btn.addEventListener("click", () => {
        if (picked) return;
        picked = true;
        const idx = +btn.dataset.i;
        // register the pick (no right/wrong reveal), then auto-advance to the next question
        body.querySelectorAll(".polo-opt").forEach(b => b.disabled = true);
        btn.classList.add("sel");
        setAnswer(Q.opts[idx][1]);
        setTimeout(() => { const nb = document.getElementById("next-btn"); if (nb && !nb.disabled) nb.click(); }, 350);
      });
    });
  }

  // "What's happening in this picture?" — shows a screenshot (Q.img) and four
  // shuffled choices. Pick one (no right/wrong reveal, no explanation); the
  // player just hits Next to move on. Scoring is entirely in the option points,
  // so the "right" answer can score low (e.g. the eyes test: misreading = more
  // autistic). Missing image falls back to a note.
  function renderImgQuizGame(body, Q, setAnswer) {
    const order = Q.opts.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    const optsHtml = order.map(oi =>
      `<button class="option imgq-opt" type="button" data-oi="${oi}"><span class="dot"></span><span>${esc(Q.opts[oi][0])}</span></button>`).join("");
    body.innerHTML = `
      <div class="imgq">
        <figure class="imgq-shot">
          <img src="${Q.img}" alt="${esc(Q.imgAlt || "")}" onerror="this.closest('.imgq-shot').classList.add('imgq-missing')" />
          <figcaption class="imgq-missing-note">🖼️ screenshot goes here</figcaption>
        </figure>
        <div class="options imgq-opts">${optsHtml}</div>
      </div>`;
    body.querySelectorAll(".imgq-opt").forEach(btn => {
      btn.addEventListener("click", () => {
        body.querySelectorAll(".imgq-opt").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
        setAnswer(Q.opts[+btn.dataset.oi][1]);
      });
    });
  }

  // Image + free-text answer. Type what's happening; you get points if the
  // answer contains one of Q.keywords (matched at a word boundary, case-
  // insensitive — so "tip" also catches tips/tipping/tipped). No right/wrong
  // reveal; submit locks it and enables Next.
  function renderImgTextGame(body, Q, setAnswer) {
    body.innerHTML = `
      <div class="imgq">
        <figure class="imgq-shot">
          <img src="${Q.img}" alt="${esc(Q.imgAlt || "")}" onerror="this.closest('.imgq-shot').classList.add('imgq-missing')" />
          <figcaption class="imgq-missing-note">🖼️ screenshot goes here</figcaption>
        </figure>
        <textarea class="imgtext-input" id="imgtext-in" rows="2" placeholder="Type what you think is happening…"></textarea>
        <button class="btn btn-primary" id="imgtext-submit" disabled>Submit →</button>
        <div class="imgtext-note" id="imgtext-note" hidden></div>
      </div>`;
    const inp = $("#imgtext-in", body), btn = $("#imgtext-submit", body), note = $("#imgtext-note", body);
    const kw = Q.keywords || [];
    inp.addEventListener("input", () => { btn.disabled = inp.value.trim().length === 0; });
    inp.addEventListener("keydown", e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) btn.click(); });
    btn.addEventListener("click", () => {
      const v = inp.value.trim();
      if (!v) return;
      const hit = kw.some(k => new RegExp("\\b" + k, "i").test(v));
      inp.disabled = true; btn.disabled = true; btn.textContent = "Locked in ✓";
      note.hidden = false; note.textContent = "Answer locked in.";
      setAnswer(hit ? (Q.score || 3) : 0, { imgTextAnswer: v });
    });
    setTimeout(() => inp.focus(), 60);
  }

  // Simon-style memory game: watch the pads light up, repeat the sequence.
  // One mistake ends it; rounds survived = score. Uses its own little tones.
  function renderSimonGame(body, Q, setAnswer) {
    const PADS = [
      { c: "var(--c1)", f: 330 }, { c: "var(--c3)", f: 392 },
      { c: "var(--c4)", f: 494 }, { c: "var(--c5)", f: 587 },
    ];
    body.innerHTML = `
      <div class="simon">
        <div class="simon-grid">${PADS.map((p, i) => `<button class="simon-pad" type="button" data-i="${i}" style="--pad:${p.c}" disabled></button>`).join("")}</div>
        <div class="simon-status" id="simon-status">Watch the pattern, then repeat it.</div>
        <button class="btn btn-primary" id="simon-start">▶ Start</button>
        <div class="simon-reveal" id="simon-reveal" hidden></div>
      </div>`;
    const pads = [...body.querySelectorAll(".simon-pad")];
    const status = $("#simon-status", body), startBtn = $("#simon-start", body), reveal = $("#simon-reveal", body);
    let actx = null;
    function beep(f) {
      try {
        if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
        if (actx.state === "suspended") actx.resume();
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = "sine"; o.frequency.value = f;
        g.gain.setValueAtTime(0.18, actx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + 0.28);
        o.connect(g).connect(actx.destination); o.start(); o.stop(actx.currentTime + 0.3);
      } catch (e) {}
    }
    const seq = [];
    let pos = 0, round = 0, accepting = false, over = false;
    function flash(i, ms) {
      const p = pads[i];
      p.classList.add("lit"); beep(PADS[i].f);
      setTimeout(() => p.classList.remove("lit"), ms || 320);
    }
    function playback() {
      accepting = false;
      pads.forEach(p => p.disabled = true);
      status.textContent = `Round ${round} — watch…`;
      seq.forEach((v, k) => setTimeout(() => { if (document.body.contains(body)) flash(v); }, 500 * k + 400));
      setTimeout(() => {
        if (!document.body.contains(body) || over) return;
        accepting = true; pos = 0;
        pads.forEach(p => p.disabled = false);
        status.textContent = `Round ${round} — your turn`;
      }, 500 * seq.length + 450);
    }
    function nextRound() {
      round++;
      seq.push(Math.floor(Math.random() * 4));
      playback();
    }
    function endGame() {
      over = true; accepting = false;
      pads.forEach(p => p.disabled = true);
      const done = round - 1; // rounds fully completed
      const pts = done <= 2 ? 0 : done <= 4 ? 1 : done <= 6 ? 2 : 3;
      status.textContent = "";
      reveal.hidden = false;
      reveal.textContent = `You made it through ${done} round${done === 1 ? "" : "s"}.`;
      setAnswer(pts, { simonRounds: done });
    }
    // use pointerdown (fires once, unlike the click-then-synthetic-click that
    // could double-advance on mobile and desync the sequence). one press = one step.
    pads.forEach(p => p.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      if (!accepting || over) return;
      const i = +p.dataset.i;
      if (i !== seq[pos]) { flash(i, 200); endGame(); return; }
      flash(i, 200);
      pos++;
      if (pos === seq.length) { accepting = false; setTimeout(nextRound, 550); }
    }));
    startBtn.addEventListener("click", () => { startBtn.style.display = "none"; nextRound(); });
  }

  // TV volume: nudge the volume with the remote, then we judge the number —
  // PIN-style checklist. Starts on a cursed 13. Even / multiple of 5 /
  // perfectly round (multiple of 10) each earn a point.
  function renderTvVolGame(body, Q, setAnswer) {
    let vol = 60, locked = false;
    body.innerHTML = `
      <div class="tvq">
        <div class="tv">
          <div class="tv-screen">
            <div class="tv-osd">
              <span class="tv-osd-label">VOL</span>
              <span class="tv-osd-num" id="tv-num">60</span>
              <div class="tv-osd-bar"><div class="tv-osd-fill" id="tv-fill"></div></div>
            </div>
          </div>
          <div class="tv-foot"></div>
        </div>
        <div class="tv-remote">
          <div class="tv-remote-dot"></div>
          <button class="tv-btn" id="tv-down" type="button" aria-label="volume down">−</button>
          <span class="tv-remote-label">VOL</span>
          <button class="tv-btn" id="tv-up" type="button" aria-label="volume up">+</button>
        </div>
        <button class="btn btn-primary" id="tv-set">Set it →</button>
        <div class="qbq-err" id="tv-err" hidden></div>
        <div class="pinq-checks" id="tv-checks" hidden></div>
      </div>`;
    const num = $("#tv-num", body), fill = $("#tv-fill", body), checks = $("#tv-checks", body), setBtn = $("#tv-set", body), err = $("#tv-err", body);
    const paint = () => { num.textContent = vol; fill.style.width = vol + "%"; };
    paint();
    let rep = null;
    const step = d => { if (locked) return; vol = Math.max(0, Math.min(100, vol + d)); err.hidden = true; paint(); };
    const hold = (btn, d) => {
      btn.addEventListener("pointerdown", e => {
        e.preventDefault();
        step(d);
        clearInterval(rep);
        rep = setInterval(() => step(d), 140);
      });
      ["pointerup", "pointerleave", "pointercancel"].forEach(ev => btn.addEventListener(ev, () => clearInterval(rep)));
    };
    hold($("#tv-up", body), 1);
    hold($("#tv-down", body), -1);
    setBtn.addEventListener("click", () => {
      if (locked) return;
      if (vol === 69) {
        err.hidden = false;
        err.textContent = "This is an autism test, not the Rice Purity Test. Pick a different number, you freak.";
        return;
      }
      locked = true;
      clearInterval(rep);
      const cs = [
        { ok: vol % 2 === 0,  good: "Even", bad: "Odd" },
        { ok: vol % 5 === 0,  good: "A multiple of 5", bad: "Not a multiple of 5" },
        { ok: vol % 10 === 0, good: "Perfectly round", bad: "Not perfectly round" },
      ];
      let pts = cs.reduce((a, c) => a + (c.ok ? 1 : 0), 0);
      checks.hidden = false;
      checks.innerHTML = cs.map(c => `<div class="pinq-check ${c.ok ? "ok" : "bad"}">${c.ok ? "✅ " + c.good : "❌ " + c.bad}</div>`).join("");
      if (vol === 67) {
        pts = 4; // scores above the normal 3-point max
        checks.innerHTML += `<div class="pinq-check ok">6️⃣7️⃣ 🫴🫴 Bonus autism point awarded</div>`;
      }
      setBtn.disabled = true; setBtn.textContent = "Volume set ✓";
      setAnswer(pts, { tvVolume: vol });
    });
  }

  // Subway-surfers-style runner: three subway tracks rushing toward the camera
  // in fake 3D. Swipe / arrows to change lane, jump the barriers, dodge the
  // trains, grab coins. 3 lives; best run time scores, coins feed an award.
  // Virtual space is 560x400 with the horizon at y=150; every object carries a
  // depth z (1 = horizon, 0 = the player's plane) and gets projected+scaled.
  const SUB_TRAIN_COLORS = [
    { body: "#ff8a3d", dark: "#d96a1e" }, { body: "#2f9bff", dark: "#1f6fd0" },
    { body: "#2ec27e", dark: "#1d9560" }, { body: "#e23d4b", dark: "#b32734" },
  ];
  function subTrainSVG(c) {
    return `<svg viewBox="0 0 100 130" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="10" width="92" height="116" rx="10" fill="${c.body}" stroke="#16130c" stroke-width="3"/>
      <rect x="4" y="10" width="92" height="14" rx="7" fill="${c.dark}"/>
      <rect x="14" y="30" width="72" height="42" rx="6" fill="#1d2733" stroke="#16130c" stroke-width="2.5"/>
      <rect x="20" y="35" width="26" height="14" rx="3" fill="#3d5a75" opacity=".8"/>
      <rect x="12" y="82" width="76" height="8" rx="4" fill="${c.dark}"/>
      <circle cx="22" cy="106" r="7" fill="#ffe27a" stroke="#16130c" stroke-width="2.5"/>
      <circle cx="78" cy="106" r="7" fill="#ffe27a" stroke="#16130c" stroke-width="2.5"/>
      <rect x="0" y="118" width="100" height="12" rx="4" fill="#2a2d35"/>
    </svg>`;
  }
  const SUB_BARRIER_SVG = `<svg viewBox="0 0 100 55" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="18" width="8" height="37" fill="#5b5446" stroke="#16130c" stroke-width="2"/>
    <rect x="84" y="18" width="8" height="37" fill="#5b5446" stroke="#16130c" stroke-width="2"/>
    <g stroke="#16130c" stroke-width="2.5">
      <rect x="2" y="6" width="96" height="18" rx="4" fill="#e23d4b"/>
    </g>
    <g fill="#fff">
      <rect x="14" y="8" width="12" height="14" transform="skewX(-18)" transform-origin="20 15"/>
      <rect x="44" y="8" width="12" height="14" transform="skewX(-18)" transform-origin="50 15"/>
      <rect x="74" y="8" width="12" height="14" transform="skewX(-18)" transform-origin="80 15"/>
    </g>
  </svg>`;
  function subSceneSVG() {
    // static backdrop: sky, sun, clouds, skyline, ground, walls, 3 tracks
    const VP = 280, HZ = 150;
    let rails = "", beds = "", ties = "";
    for (const l of [-1, 0, 1]) {
      const bx = VP + l * 168, tx = VP + l * 168 * 0.06;
      beds += `<polygon points="${bx - 44},400 ${bx + 44},400 ${tx + 5},${HZ} ${tx - 5},${HZ}" fill="#9aa1ab"/>`;
      rails += `<line x1="${bx - 26}" y1="400" x2="${tx - 2.5}" y2="${HZ}" stroke="#e6eaf0" stroke-width="4"/>
                <line x1="${bx - 26}" y1="400" x2="${tx - 2.5}" y2="${HZ}" stroke="#5b6068" stroke-width="1.2"/>
                <line x1="${bx + 26}" y1="400" x2="${tx + 2.5}" y2="${HZ}" stroke="#e6eaf0" stroke-width="4"/>
                <line x1="${bx + 26}" y1="400" x2="${tx + 2.5}" y2="${HZ}" stroke="#5b6068" stroke-width="1.2"/>`;
      for (let k = 1; k <= 9; k++) {
        const t = Math.pow(k / 9.5, 1.9), y = HZ + 244 * t, f = 0.06 + 0.94 * t;
        const cx = VP + l * 168 * f, half = 36 * f;
        ties += `<line x1="${cx - half}" y1="${y}" x2="${cx + half}" y2="${y}" stroke="#7a5a3a" stroke-width="${Math.max(1.5, 6 * f)}"/>`;
      }
    }
    let city = "";
    const bld = [[0,52,44],[48,34,70],[86,60,38],[128,42,58],[174,30,80],[208,56,46],[258,38,64],[300,48,50],[352,32,74],[390,58,42],[436,40,60],[480,52,48],[526,36,56]];
    bld.forEach(([x, w, h], i) => { city += `<rect x="${x}" y="${HZ - h}" width="${w}" height="${h}" fill="${i % 2 ? "#8ea0c9" : "#7c8fb8"}"/>`; });
    return `<svg class="sub-scene" viewBox="0 0 560 400" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="subsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fc0ff"/><stop offset="1" stop-color="#d8efff"/></linearGradient>
        <linearGradient id="subgnd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c3c9d2"/><stop offset="1" stop-color="#8b929e"/></linearGradient>
      </defs>
      <rect x="0" y="0" width="560" height="${HZ}" fill="url(#subsky)"/>
      <circle cx="74" cy="46" r="24" fill="#ffe27a"/><circle cx="74" cy="46" r="34" fill="#ffe27a" opacity=".28"/>
      <g fill="#fff" opacity=".9"><ellipse cx="380" cy="52" rx="34" ry="12"/><ellipse cx="410" cy="44" rx="24" ry="10"/><ellipse cx="180" cy="78" rx="28" ry="10"/></g>
      ${city}
      <rect x="0" y="${HZ}" width="560" height="${400 - HZ}" fill="url(#subgnd)"/>
      <polygon points="0,400 112,400 ${VP - 168 * 0.06 - 44},${HZ} 0,${HZ}" fill="#6e7683"/>
      <polygon points="560,400 448,400 ${VP + 168 * 0.06 + 44},${HZ} 560,${HZ}" fill="#6e7683"/>
      ${beds}${ties}${rails}
    </svg>`;
  }
  function renderSubwayGame(body, Q, setAnswer, avatar) {
    body.innerHTML = `
      <div class="sub-stage" id="sub-stage">
        ${subSceneSVG()}
        <div class="sub-layer" id="sub-layer"></div>
        <div class="sub-shadow" id="sub-shadow"></div>
        <div class="sub-player" id="sub-player">${avatarSVG(avatar, { noBg: true })}</div>
        <div class="sub-hud"><span id="sub-time">0.0s</span><span id="sub-coins">🪙 0</span><span id="sub-lives">❤️❤️❤️</span></div>
        <div class="sub-ov" id="sub-ov">
          <div class="sub-msg">Surf the subway.<small>Swipe or ◀ ▶ to change lanes, ▲ / swipe up to jump the barriers. Trains cannot be jumped.</small></div>
          <button class="btn btn-primary sub-go" type="button">▶ Start</button>
        </div>
      </div>
      <div class="sub-dpad">
        <button class="sub-btn" data-act="left" type="button" aria-label="left">◀</button>
        <button class="sub-btn" data-act="jump" type="button" aria-label="jump">▲</button>
        <button class="sub-btn" data-act="right" type="button" aria-label="right">▶</button>
      </div>
      <div class="sub-reveal" hidden></div>`;
    const VW = 560, VH = 400, HZ = 150;
    const stage = $("#sub-stage", body), layer = $("#sub-layer", body), player = $("#sub-player", body), shadow = $("#sub-shadow", body);
    const ov = $("#sub-ov", body), reveal = $(".sub-reveal", body);
    const timeEl = $("#sub-time", body), coinsEl = $("#sub-coins", body), livesEl = $("#sub-lives", body);
    let W = 0, H = 0, sx = 1, sy = 1;
    function measure() { const r = stage.getBoundingClientRect(); W = r.width; H = r.height; sx = W / VW; sy = H / VH; }
    const proj = z => { const t = Math.pow(Math.max(0, 1 - z), 1.9); return { t, y: HZ + 244 * t, s: 0.10 + 0.90 * t }; };
    const laneX = (l, t) => 280 + (l - 1) * 168 * (0.06 + 0.94 * t);

    let running = false, loop = null, last = 0, elapsed = 0, best = 0, lives = 3, coins = 0;
    let lane = 1, laneVis = 1, jy = 0, vy = 0, spawnAcc = 0, ents = [], answered = false;
    const PLAYER_W = 58;

    function updateHud() { timeEl.textContent = elapsed.toFixed(1) + "s"; coinsEl.textContent = "🪙 " + coins; livesEl.textContent = lives > 0 ? "❤️".repeat(lives) : "💀"; }
    function clearEnts() { ents.forEach(e => e.el.remove()); ents = []; }
    function spawn() {
      const kind = Math.random();
      const l1 = Math.floor(Math.random() * 3);
      if (kind < 0.42) addEnt("train", l1, 1.15);
      else if (kind < 0.6) addEnt("barrier", l1, 1.05);
      else { const run = 4 + Math.floor(Math.random() * 3); for (let k = 0; k < run; k++) addEnt("coin", l1, 1.05 + k * 0.1); } // longer coin runs, more often
      // when an obstacle spawns, drop a coin line in one of the OTHER lanes so
      // there's almost always coins to grab while you dodge
      if (kind < 0.6) {
        const cl = (l1 + 1 + Math.floor(Math.random() * 2)) % 3;
        const run = 3 + Math.floor(Math.random() * 3);
        for (let k = 0; k < run; k++) addEnt("coin", cl, 1.08 + k * 0.1);
      }
      // second obstacle in a different lane once you're warmed up (never all 3)
      if (elapsed > 10 && kind < 0.6 && Math.random() < 0.4) {
        const l2 = (l1 + 1 + Math.floor(Math.random() * 2)) % 3;
        addEnt(Math.random() < 0.6 ? "train" : "barrier", l2, 1.3);
      }
    }
    function addEnt(type, l, z) {
      const el = document.createElement("div");
      el.className = "sub-ent sub-" + type;
      if (type === "train") el.innerHTML = subTrainSVG(SUB_TRAIN_COLORS[Math.floor(Math.random() * SUB_TRAIN_COLORS.length)]);
      else if (type === "barrier") el.innerHTML = SUB_BARRIER_SVG;
      layer.appendChild(el);
      ents.push({ type, lane: l, z, len: type === "train" ? 0.26 : 0, el });
    }
    function paintEnt(e) {
      const p = proj(e.z);
      let w, h;
      if (e.type === "train") { w = 148 * p.s; h = 190 * p.s; }
      else if (e.type === "barrier") { w = 132 * p.s; h = 66 * p.s; }
      else { w = 30 * p.s; h = 30 * p.s; }
      const x = laneX(e.lane, p.t) * sx - w * sx / 2;
      const yOff = e.type === "coin" ? 26 * p.s : 0;
      e.el.style.width = (w * sx) + "px"; e.el.style.height = (h * sy) + "px";
      e.el.style.left = x + "px"; e.el.style.top = ((p.y - h - yOff) * sy) + "px";
      e.el.style.zIndex = 100 + Math.round((1 - e.z) * 800);
      e.el.style.opacity = e.z > 0.93 ? String(Math.max(0, (1 - e.z) / 0.07)) : "1";
    }
    function paintPlayer(f) {
      laneVis += (lane - laneVis) * Math.min(1, 0.22 * f);
      const t = 1, x = laneX(laneVis, t), s = 1;
      const w = PLAYER_W * s;
      player.style.width = (w * sx) + "px"; player.style.height = (w * 1.15 * sy) + "px";
      player.style.left = (x * sx - w * sx / 2) + "px";
      player.style.top = ((VH - 12 - w * 1.15 + jy) * sy) + "px";
      shadow.style.width = (w * 0.9 * sx) + "px"; shadow.style.height = (10 * sy) + "px";
      shadow.style.left = (x * sx - w * 0.45 * sx) + "px"; shadow.style.top = ((VH - 16) * sy) + "px";
      shadow.style.opacity = String(0.45 * (1 + jy / 120));
    }
    function cleanup() { running = false; clearInterval(loop); removeEventListener("keydown", onKey); }
    function die() {
      cleanup();
      stage.classList.add("sub-hit"); setTimeout(() => stage.classList.remove("sub-hit"), 220);
      if (elapsed > best) best = elapsed;
      lives = Math.max(0, lives - 1);
      updateHud();
      const pts = best < 6 ? 0 : best < 14 ? 1 : best < 25 ? 2 : 3;
      // Next stays locked until all lives are spent — no giving up early.
      setAnswer(pts, { subwayTime: +best.toFixed(1), subwayCoins: coins }, lives > 0);
      reveal.hidden = false;
      reveal.innerHTML = `Best run: <b>${best.toFixed(1)}s</b> · 🪙 ${coins}`;
      ov.style.display = "";
      if (lives > 0) {
        ov.innerHTML = `<div class="sub-msg">💥 Trained.<small>${lives} ${lives === 1 ? "life" : "lives"} left</small></div><button class="btn btn-primary sub-go" type="button">↻ Use a life</button>`;
        ov.querySelector(".sub-go").addEventListener("click", start);
      } else {
        ov.innerHTML = `<div class="sub-msg">💀 Out of lives<small>Best: ${best.toFixed(1)}s · 🪙 ${coins} — hit Next →</small></div>`;
      }
    }
    function tick() {
      if (!document.body.contains(stage)) { cleanup(); return; }
      if (!running) return;
      const t = Date.now(); let dt = last ? t - last : 16; last = t; if (dt > 60) dt = 60; const f = dt / 16;
      elapsed += dt / 1000;
      // jump physics
      if (jy < 0 || vy < 0) { vy += 0.55 * f; jy += vy * f; if (jy >= 0) { jy = 0; vy = 0; } }
      // ramp: base approach speed rises the whole time (no cap) so it keeps
      // getting harder; spawns get denser + faster too.
      const spd = (0.55 + elapsed * 0.028) * (dt / 1000);
      spawnAcc += dt;
      const every = Math.max(430, 1150 - elapsed * 34);
      if (spawnAcc >= every) { spawnAcc = 0; spawn(); }
      for (let i = ents.length - 1; i >= 0; i--) {
        const e = ents[i];
        // advance in projected (t) space, not linear z, so nothing appears to
        // stall as it reaches the player — it actually speeds up close up.
        const tNow = Math.pow(Math.max(0, 1 - e.z), 1.9);
        // cap high enough that even a long train (len .26) pushes fully past the
        // removal threshold (z + len < -.06) and leaves the screen — 1.4 was too
        // low, so trains stalled at the bottom edge and never disappeared.
        const tNext = Math.min(1.9, tNow + spd * (1.0 + 1.6 * tNow));
        e.z = 1 - Math.pow(tNext, 1 / 1.9);
        if (e.z + e.len < -0.06) { e.el.remove(); ents.splice(i, 1); continue; }
        paintEnt(e);
        const atPlayer = e.z < 0.05 && e.z + e.len > -0.02;
        if (!atPlayer || e.lane !== lane) continue;
        if (e.type === "coin") { coins++; updateHud(); e.el.remove(); ents.splice(i, 1); continue; }
        if (e.type === "barrier" && jy < -26) continue; // cleared it mid-air
        updateHud(); die(); return;
      }
      updateHud();
      paintPlayer(f);
    }
    function start() {
      if (running) return;
      measure(); clearEnts();
      lane = 1; laneVis = 1; jy = 0; vy = 0; elapsed = 0; spawnAcc = 600;
      running = true; last = 0;
      ov.style.display = "none"; reveal.hidden = true;
      addEventListener("keydown", onKey);
      updateHud(); paintPlayer(1);
      clearInterval(loop); loop = setInterval(tick, 24);
    }
    const act = a => {
      if (!running) return;
      if (a === "left") lane = Math.max(0, lane - 1);
      else if (a === "right") lane = Math.min(2, lane + 1);
      else if (a === "jump" && jy === 0) vy = -9.4;
    };
    function onKey(e) {
      const map = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "jump", a: "left", d: "right", w: "jump", " ": "jump" };
      const k = map[e.key]; if (!k) return;
      if (location.hash !== "#/test" && location.hash !== "#/debug") { cleanup(); return; }
      e.preventDefault();
      if (e.type === "keydown") act(k);
    }
    // swipe on the stage
    let swipe = null;
    stage.addEventListener("pointerdown", e => { swipe = { x: e.clientX, y: e.clientY }; });
    stage.addEventListener("pointerup", e => {
      if (!swipe) return;
      const dx = e.clientX - swipe.x, dy = e.clientY - swipe.y; swipe = null;
      if (Math.abs(dx) < 18 && Math.abs(dy) < 18) return;
      if (Math.abs(dx) > Math.abs(dy)) act(dx > 0 ? "right" : "left");
      else if (dy < 0) act("jump");
    });
    body.querySelectorAll(".sub-btn").forEach(b =>
      b.addEventListener("pointerdown", e => { e.preventDefault(); act(b.dataset.act); }));
    ov.querySelector(".sub-go").addEventListener("click", start);
    measure(); paintPlayer(1);
  }

  // Ring sort: three poles, nine colored rings (3 of each color). Move top
  // rings between poles until every pole holds a single color. Scrambled by
  // legal moves from a solved board, so it's always solvable. Timer + give up.
  const RING_COLORS = [
    { fill: "#ff3d7f", edge: "#c21e5c" },
    { fill: "#ffd23f", edge: "#c99b12" },
    { fill: "#2f9bff", edge: "#1f6fd0" },
  ];
  function renderRingsGame(body, Q, setAnswer) {
    const CAP = 4;
    // fixed start: every pole holds all three colors (a latin-square rotation).
    // BFS over the full state space says this needs 13 moves optimally — a
    // proper puzzle, same for everyone.
    const pegs = [[0, 1, 2], [1, 2, 0], [2, 0, 1]];
    const solved = () => pegs.every(p => p.every(c => c === p[0]));
    body.innerHTML = `
      <div class="ringq">
        <div class="ringq-hud"><span id="ring-timer">0.0s</span><span id="ring-moves">0 moves</span></div>
        <div class="ringq-board" id="ring-board">
          ${[0, 1, 2].map(i => `
            <button class="ring-peg" type="button" data-i="${i}">
              <div class="ring-pole"></div>
              <div class="ring-slots">${'<div class="ring-slot"></div>'.repeat(4)}</div>
              <div class="ring-stack" id="ring-stack-${i}"></div>
              <div class="ring-base"></div>
            </button>`).join("")}
        </div>
        <div class="ringq-cap">Max 4 rings per pole</div>
        <button class="btn btn-ghost btn-sm" id="ring-giveup" type="button">Give up</button>
        <div class="ringq-note" id="ring-note" hidden></div>
      </div>`;
    const timerEl = $("#ring-timer", body), movesEl = $("#ring-moves", body), note = $("#ring-note", body), giveupBtn = $("#ring-giveup", body);
    let sel = -1, moves = 0, t0 = 0, tick = null, locked = false;
    function paint() {
      for (let i = 0; i < 3; i++) {
        const stack = $("#ring-stack-" + i, body);
        stack.innerHTML = pegs[i].map((c, k) => {
          const top = k === pegs[i].length - 1;
          const lift = top && sel === i ? " ring-lift" : "";
          return `<div class="ring${lift}" style="--rf:${RING_COLORS[c].fill};--re:${RING_COLORS[c].edge}"></div>`;
        }).join("");
      }
    }
    function startTimer() {
      if (t0) return;
      t0 = Date.now();
      tick = setInterval(() => {
        if (!document.body.contains(body)) { clearInterval(tick); return; }
        timerEl.textContent = ((Date.now() - t0) / 1000).toFixed(1) + "s";
      }, 100);
    }
    function finish(won) {
      locked = true; sel = -1;
      clearInterval(tick);
      giveupBtn.disabled = true;
      body.querySelectorAll(".ring-peg").forEach(p => p.disabled = true);
      if (won) {
        const secs = (Date.now() - t0) / 1000;
        timerEl.textContent = secs.toFixed(1) + "s";
        const pts = secs < 25 ? 3 : secs < 50 ? 2 : 1;
        note.hidden = false; note.textContent = `Sorted in ${secs.toFixed(1)}s.`;
        setAnswer(pts, { ringTime: +secs.toFixed(1) });
      } else {
        note.hidden = false; note.textContent = "Given up. The rings remain unsorted.";
        setAnswer(0, { ringGaveUp: 1 });
      }
      paint();
    }
    body.querySelectorAll(".ring-peg").forEach(peg => {
      peg.addEventListener("click", () => {
        if (locked) return;
        const i = +peg.dataset.i;
        if (sel === -1) {
          if (!pegs[i].length) return;
          sel = i; startTimer(); paint(); return;
        }
        if (sel === i) { sel = -1; paint(); return; }
        if (pegs[i].length >= CAP) { // pole is full — shake it
          peg.classList.remove("peg-full"); void peg.offsetWidth; peg.classList.add("peg-full");
          return;
        }
        pegs[i].push(pegs[sel].pop());
        sel = -1; moves++;
        movesEl.textContent = moves + " move" + (moves === 1 ? "" : "s");
        paint();
        if (solved()) finish(true);
      });
    });
    giveupBtn.addEventListener("click", () => { if (!locked) finish(false); });
    paint();
  }

  // Brick build: a jumbled bin of colorful studded bricks and an instruction
  // sheet. You get MORE bricks than you need — drag the ones the steps call for
  // onto the plate, snapping stud-on-stud, to assemble a little model (a
  // rocket). Leftover bricks stay in the bin. Original toy-brick art, no set.
  const BRICK_COLORS = {
    red:    { top: "#ff5d5d", side: "#d13a3a", stud: "#ff7a7a" },
    orange: { top: "#ff9f45", side: "#d1721e", stud: "#ffb46b" },
    yellow: { top: "#ffd23f", side: "#d1a613", stud: "#ffe27a" },
    green:  { top: "#42c98a", side: "#1d9560", stud: "#67e0a6" },
    blue:   { top: "#4a9cff", side: "#1f6fd0", stud: "#78b6ff" },
    white:  { top: "#f2f4f7", side: "#c7ced6", stud: "#ffffff" },
    grey:   { top: "#9aa1ab", side: "#6d747e", stud: "#b4bac2" },
    brown:  { top: "#a9713f", side: "#7d4f28", stud: "#c08a55" },
  };
  const BRICK_U = 24; // one stud = 24px
  const BRICK_BODY_H = 22, BRICK_STUD_H = 7, BRICK_SIDE_STUD = 8; // brick body/stud geometry (shared with the ghost)
  // grid model, built bottom-up. Each step places one brick at [col,row] (row 0
  // = bottom). This silhouette reads as a little parrot perched on a branch —
  // a chunkier, more intricate build than a plain stack. Original brick art.
  const BRICK_MODEL = { cols: 6, rows: 8, steps: [
    { color: "brown",  w: 6, col: 0, row: 0, label: "Brown 6-wide branch across the bottom" },
    { color: "grey",   w: 1, col: 2, row: 1, label: "Grey 1-wide leg gripping the branch" },
    { color: "grey",   w: 1, col: 3, row: 1, label: "Grey 1-wide second leg, next to it" },
    { color: "green",  w: 3, col: 1, row: 2, label: "Green 3-wide belly, sitting on the legs" },
    { color: "green",  w: 4, col: 1, row: 3, side: "right", label: "Green 4-wide chest — side stud faces right for the wing" },
    { color: "blue",   w: 2, col: 4, row: 3, label: "Blue 2-wide folded wing, plugged onto the chest's right stud" },
    { color: "green",  w: 3, col: 1, row: 4, side: "right", label: "Green 3-wide back — side stud faces right for the wing" },
    { color: "blue",   w: 2, col: 4, row: 4, label: "Blue 2-wide, stacking the wing taller" },
    { color: "green",  w: 3, col: 1, row: 5, side: "left", label: "Green 3-wide head — side stud faces left for the beak" },
    { color: "yellow", w: 1, col: 0, row: 5, label: "Yellow 1-wide beak, plugged onto the head's left stud" },
    { color: "red",    w: 2, col: 1, row: 6, label: "Red 2-wide crest feathers on top of the head" },
    { color: "white",  w: 1, col: 3, row: 6, label: "White 1-wide feather tip, right of the crest" },
  ] };
  // side: "" | "left" | "right" — draws an extra sideways connector stud poking
  // out that edge, so a neighbouring brick (wing, beak) can plug into the side
  // instead of only stacking on top. The SVG widens to fit the protruding stud.
  function brickSVG(color, w, studless, side) {
    const c = BRICK_COLORS[color] || BRICK_COLORS.grey;
    const U = BRICK_U, bodyH = BRICK_BODY_H, studH = BRICK_STUD_H, studR = 7.5;
    const bodyW = w * U, sideStud = BRICK_SIDE_STUD; // how far the side stud sticks out
    const padL = side === "left" ? sideStud : 0, padR = side === "right" ? sideStud : 0;
    const W = bodyW + padL + padR, H = bodyH + studH;
    const bx = padL; // body left edge inside the widened viewBox
    let studs = "";
    if (!studless) for (let i = 0; i < w; i++) {
      const cx = bx + i * U + U / 2;
      studs += `<rect x="${cx - studR}" y="${studH - 2}" width="${studR * 2}" height="6" fill="${c.side}"/>
                <ellipse cx="${cx}" cy="${studH - 1}" rx="${studR}" ry="4" fill="${c.stud}" stroke="#16130c" stroke-width="1.6"/>`;
    }
    // sideways connector stud (drawn as an ellipse on its side hugging the edge)
    let sideStudSVG = "";
    if (side === "right" || side === "left") {
      const cy = studH + bodyH / 2;
      const ex = side === "right" ? bx + bodyW - 1 : bx + 1; // stud center rides the body edge
      sideStudSVG = `<rect x="${side === "right" ? ex - 1 : ex - sideStud + 1}" y="${cy - studR}" width="${sideStud}" height="${studR * 2}" fill="${c.side}"/>
                     <ellipse cx="${side === "right" ? ex + sideStud - 2 : ex - sideStud + 2}" cy="${cy}" rx="4" ry="${studR}" fill="${c.stud}" stroke="#16130c" stroke-width="1.6"/>`;
    }
    return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      ${sideStudSVG}
      ${studs}
      <rect x="${bx + 1.5}" y="${studH}" width="${bodyW - 3}" height="${bodyH - 1.5}" rx="3" fill="${c.side}" stroke="#16130c" stroke-width="2"/>
      <rect x="${bx + 1.5}" y="${studH}" width="${bodyW - 3}" height="9" rx="3" fill="${c.top}"/>
      <rect x="${bx + bodyW - 8}" y="${studH + 4}" width="4" height="${bodyH - 8}" rx="2" fill="rgba(0,0,0,.12)"/>
    </svg>`;
  }
  function renderBrickGame(body, Q, setAnswer) {
    const M = BRICK_MODEL, U = BRICK_U;
    // bin = every brick the model needs, plus decoys, all shuffled. Bricks are
    // matched by color+width (not by step index), so any brick of the right
    // color and size fits the current step — two blue 2-wides are interchangeable.
    // each model brick keeps its side connector (left/right/none) so the bin
    // piece SHOWS the side stud — you have to pick the one with the right stud.
    const bin = M.steps.map((s, i) => ({ id: "s" + i, color: s.color, w: s.w, side: s.side || "" }));
    // decoys: extra bricks you don't need. A couple of greens carry the "wrong"
    // side stud (or none) so matching on side matters — you can't drop a plain or
    // wrong-facing green into a slot that needs a specific side connector.
    [ ["red", 3, ""], ["orange", 2, ""], ["orange", 1, ""], ["blue", 3, ""], ["white", 2, ""],
      ["grey", 2, ""], ["green", 4, ""], ["green", 3, ""] ].forEach((d, i) => bin.push({ id: "x" + i, color: d[0], w: d[1], side: d[2] }));
    for (let i = bin.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [bin[i], bin[j]] = [bin[j], bin[i]]; }

    body.innerHTML = `
      <div class="brickq">
        <div class="brickq-main">
          <div class="brick-instr">
            <div class="brick-instr-head">📘 Build the parrot</div>
            <ol class="brick-steps" id="brick-steps">
              ${M.steps.map((s, i) => `<li data-i="${i}"><span class="brick-swatch" style="background:${BRICK_COLORS[s.color].top}"></span>${s.label}</li>`).join("")}
            </ol>
            <div class="brick-hint">You have spare bricks you won't need — only use what the steps ask for.</div>
          </div>
          <div class="brick-build">
            <div class="brick-plate" id="brick-plate" style="width:${M.cols * U}px;height:${M.rows * (U * 0.87)}px">
              <div class="brick-ghost" id="brick-ghost" hidden></div>
            </div>
            <div class="brick-baseplate" style="width:${M.cols * U + 16}px"></div>
            <div class="brick-target" id="brick-target">Next: <b class="brick-target-txt">${M.steps[0].label}</b></div>
          </div>
        </div>
        <div class="brick-bin" id="brick-bin">
          <div class="brick-bin-label">the bin of bricks</div>
          ${bin.map(b => `<div class="brick-piece" data-id="${b.id}" data-color="${b.color}" data-w="${b.w}" data-side="${b.side}" style="left:${5 + Math.random() * 62}%;top:${16 + Math.random() * 62}%;--rot:${(Math.random() * 16 - 8).toFixed(1)}deg">${brickSVG(b.color, b.w, false, b.side)}</div>`).join("")}
        </div>
        <div class="brickq-hud"><span id="brick-timer">0.0s</span><button class="btn btn-ghost btn-sm" id="brick-giveup" type="button">Give up</button></div>
        <div class="brickq-note" id="brick-note" hidden></div>
      </div>`;
    const plate = $("#brick-plate", body), ghost = $("#brick-ghost", body), stepsEl = $("#brick-steps", body);
    const targetTxt = $(".brick-target-txt", body), targetBox = $("#brick-target", body);
    const binEl = $("#brick-bin", body), timerEl = $("#brick-timer", body), note = $("#brick-note", body), giveupBtn = $("#brick-giveup", body);
    const ROWH = U * 0.87; // a brick body is a touch shorter than a stud pitch
    let step = 0, t0 = 0, tick = null, locked = false;

    // where step s lands on the plate (top-left px), y measured from plate top
    const slotXY = s => ({ x: M.steps[s].col * U, y: (M.rows - 1 - M.steps[s].row) * ROWH });
    // a brick fits the current step if its color, width AND side connector match —
    // so you must pick the green with the correct side stud, not a plain one.
    const fits = el => step < M.steps.length && el.dataset.color === M.steps[step].color
      && +el.dataset.w === M.steps[step].w && (el.dataset.side || "") === (M.steps[step].side || "");
    function showGhost() {
      if (step >= M.steps.length) { ghost.hidden = true; return; }
      const s = M.steps[step], p = slotXY(step);
      ghost.hidden = false;
      // outline the brick BODY exactly where it will land: the placed brick's SVG
      // top sits at p.y and its body starts BRICK_STUD_H below that (studs poke up
      // into the row above), so the visible body cell is offset down by the stud
      // height. Width/height track the real body, not the full stud-pitch cell.
      ghost.style.left = p.x + "px";
      ghost.style.top = (p.y + BRICK_STUD_H) + "px";
      ghost.style.width = s.w * U + "px";
      ghost.style.height = BRICK_BODY_H + "px";
    }
    const highlight = () => {
      stepsEl.querySelectorAll("li").forEach((li, i) => { li.classList.toggle("done", i < step); li.classList.toggle("cur", i === step); });
      if (step < M.steps.length) targetTxt.textContent = M.steps[step].label;
      showGhost();
    };
    function startTimer() { if (t0) return; t0 = Date.now(); tick = setInterval(() => { if (!document.body.contains(body)) { clearInterval(tick); return; } timerEl.textContent = ((Date.now() - t0) / 1000).toFixed(1) + "s"; }, 100); }
    function placeBrick(s) {
      const st = M.steps[s], p = slotXY(s);
      const el = document.createElement("div");
      el.className = "brick-set";
      // a left-side stud widens the SVG on the left, pushing the body right by 8px;
      // shift the element left by that much so the body still lands on its slot.
      const leftPad = st.side === "left" ? 8 : 0;
      el.style.left = (p.x - leftPad) + "px"; el.style.top = p.y + "px";
      el.innerHTML = brickSVG(st.color, st.w, false, st.side);
      plate.appendChild(el);
    }
    function finish(won) {
      locked = true; clearInterval(tick);
      giveupBtn.disabled = true; ghost.hidden = true;
      binEl.querySelectorAll(".brick-piece").forEach(p => p.classList.add("brick-done"));
      if (won) {
        const secs = (Date.now() - t0) / 1000;
        timerEl.textContent = secs.toFixed(1) + "s";
        const pts = secs < 30 ? 3 : secs < 60 ? 2 : 1;
        targetBox.innerHTML = "🦜 Done! Parrot complete.";
        note.hidden = false; note.textContent = `Built it in ${secs.toFixed(1)}s.`;
        setAnswer(pts, { brickTime: +secs.toFixed(1) });
      } else {
        targetBox.innerHTML = "🛠️ Left unfinished.";
        note.hidden = false; note.textContent = `Given up at brick ${step + 1} of ${M.steps.length}.`;
        setAnswer(step === 0 ? 0 : 1, { brickSteps: step });
      }
    }

    let drag = null;
    function moveDrag(e) {
      if (!drag) return;
      // place the fixed brick so the grab point stays under the pointer
      drag.el.style.left = (e.clientX - drag.gx) + "px";
      drag.el.style.top = (e.clientY - drag.gy) + "px";
      // light up the ghost slot when hovering it with the right brick
      const pr = plate.getBoundingClientRect();
      const near = e.clientX > pr.left - 30 && e.clientX < pr.right + 30 && e.clientY > pr.top - 30 && e.clientY < pr.bottom + 40;
      ghost.classList.toggle("brick-ghost-hot", !!(near && fits(drag.el)));
    }
    function endDrag(e) {
      const el = drag.el;
      el.removeEventListener("pointermove", moveDrag);
      el.removeEventListener("pointerup", endDrag);
      el.removeEventListener("pointercancel", endDrag);
      ghost.classList.remove("brick-ghost-hot");
      const pr = plate.getBoundingClientRect();
      const over = e.clientX >= pr.left - 34 && e.clientX <= pr.right + 34 && e.clientY >= pr.top - 34 && e.clientY <= pr.bottom + 46;
      if (over && fits(el) && !locked) {
        placeBrick(step); el.remove(); step++; highlight();
        el.classList.remove("brick-dragging");
        drag = null;
        if (step >= M.steps.length) finish(true);
        return;
      }
      // not placed on the plate — drop it back in the bin. If it was released
      // over the bin, leave it right where you dropped it (so you can rearrange /
      // dig for pieces); otherwise snap it home.
      el.classList.remove("brick-dragging");
      const br = binEl.getBoundingClientRect();
      const overBin = e.clientX >= br.left && e.clientX <= br.right && e.clientY >= br.top && e.clientY <= br.bottom;
      binEl.appendChild(el);
      if (overBin && !locked) {
        // convert drop point (pointer minus grab offset) to a % within the bin
        const w = el.getBoundingClientRect().width, h = el.getBoundingClientRect().height;
        let lx = e.clientX - drag.gx - br.left, ly = e.clientY - drag.gy - br.top;
        lx = Math.max(0, Math.min(br.width - w, lx));
        ly = Math.max(0, Math.min(br.height - h, ly));
        el.style.left = (lx / br.width * 100).toFixed(2) + "%";
        el.style.top = (ly / br.height * 100).toFixed(2) + "%";
      } else {
        // dropped off in no-man's-land — bounce back to where it started
        el.classList.add("brick-reject");
        el.style.left = drag.home.left; el.style.top = drag.home.top;
        setTimeout(() => el.classList.remove("brick-reject"), 260);
      }
      drag = null; return;
    }
    binEl.querySelectorAll(".brick-piece").forEach(el => {
      el.addEventListener("pointerdown", e => {
        if (locked || drag) return;
        e.preventDefault();
        startTimer();
        const home = { left: el.style.left, top: el.style.top, parent: el.parentNode, next: el.nextSibling }; // bin slot, for snap-back
        const r0 = el.getBoundingClientRect();
        // move to <body> so no transformed ancestor (the .fade-in section!) becomes
        // the containing block for the fixed brick — that was the drift bug.
        document.body.appendChild(el);
        el.classList.add("brick-dragging"); // -> position:fixed, un-rotated
        const gx = e.clientX - r0.left, gy = e.clientY - r0.top;
        drag = { el, gx, gy, home };
        el.style.left = (e.clientX - gx) + "px";
        el.style.top = (e.clientY - gy) + "px";
        try { el.setPointerCapture(e.pointerId); } catch (_) {}
        el.addEventListener("pointermove", moveDrag);
        el.addEventListener("pointerup", endDrag);
        el.addEventListener("pointercancel", endDrag);
      });
    });
    giveupBtn.addEventListener("click", () => { if (!locked) finish(false); });
    highlight();
  }

  /* ----------------------------------------------------------
     QUIZ VIEW (stateful sub-component)
     ---------------------------------------------------------- */
  function quizView() {
    const state = { step: -1, order: buildQuizOrder(), firstName: "", lastInitial: "", avatar: Object.assign({}, DEFAULT_AVATAR), name: "", answers: QUESTIONS.map(() => null), metrics: {}, bankPin: "", unlocked: load(LS.pin, false), done: false, score: 0, welcome: false, returningFull: "", returningSentence: "", dateStep: "", dateSurvey: null };
    const displayName = () => state.firstName.trim() + (state.lastInitial.trim() ? " " + state.lastInitial.trim().toUpperCase() + "." : "");
    const container = el(`<section class="section"><div class="quiz-shell"></div></section>`);
    const shellEl = $(".quiz-shell", container);

    function computeScore() {
      const raw = state.answers.reduce((a, v) => a + (v == null ? 0 : v), 0);
      // the 67 TV-volume bonus can push raw past MAX_RAW — cap at 100
      return Math.min(100, Math.round((raw / MAX_RAW) * 100));
    }

    function paint() {
      shellEl.innerHTML = "";

      // intro / name step
      if (state.step === -1) {
        const node = el(`
          <div class="card char-create fade-in">
            <div class="step-tag"><span class="step-num">1</span> Create your character <span class="step-arrow">→</span> <span class="step-faded">2 · take the test</span></div>
            <h2 class="section-title">Create your own character</h2>
            <p class="section-sub">Make your little character below - <b>this isn't the test yet</b>. When you're happy with them, hit start and the ${QUESTIONS.length} questions begin.</p>
            <div class="char-note"><span><b>Use your real name.</b> The host approves every contestant by hand and will only wave through names he actually recognizes. Fake names, bits, and aliases get rejected at the door.</span></div>
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
                    <span class="builder-label">Headwear color</span>
                    <div class="swatches" data-opt="headwearColor">${SHIRTS.map(s => `<button type="button" class="swatch" data-v="${s}" style="background:${s}" title="headwear color"></button>`).join("")}</div>
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
            headwear: pick(["none", "none", "none", "beanie", "cap", "propeller"]), headwearColor: pick(SHIRTS), drink: pick(["none", "none", "none", "beer", "seltzer", "shirley", "lolly"]),
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
          // land ON the name field, just clear of the sticky header (and, on
          // mobile, the sticky avatar preview that sits under it) + a little pad
          const isMobile = window.matchMedia("(max-width: 680px)").matches;
          const header = document.querySelector(".site-header");
          const preview = node.querySelector(".char-preview");
          const headerH = header ? header.getBoundingClientRect().height : 0;
          const previewH = (isMobile && preview) ? preview.getBoundingClientRect().height : 0;
          const pad = isMobile ? 18 : 12;
          const y = anchor.getBoundingClientRect().top + window.scrollY - headerH - previewH - pad;
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
            <span class="wb-tag date-tag">💘 Person I've been on a date with detected</span>
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
        $("#date-submit", node).addEventListener("click", () => {
          // capture the survey so it rides along to the admin panel (tagged with their name)
          const rating = ($("#date-rating", node).value || "").trim();
          const feedback = ($("#date-feedback", node).value || "").trim();
          if (rating || feedback) state.dateSurvey = { rating, feedback };
          state.dateStep = "kidding"; paint(); window.scrollTo({ top: 0 });
        });
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

      // result step — NO score reveal; results go live at the party
      if (state.done) {
        const node = el(`
          <div class="card result-card submitted-card fade-in">
            <div class="result-avatar"><span class="avchip" style="width:116px;height:116px">${avatarSVG(state.avatar)}</span><div class="ra-stamp">✓ IN</div></div>
            <div class="q-count">Locked in, ${esc(state.firstName || state.name)} 🎉</div>
            <h2 class="result-tier"><span class="grad">Results submitted!</span></h2>
            <p class="result-blurb">Your spot on the spectrum is sealed and sent to the host. The big reveal happens <b>LIVE at the party</b> on the giant graph — no peeking, not even for you.</p>
            <div class="sealed-spectrum">
              <div class="sealed-bar"></div>
              <div class="sealed-pin">?</div>
            </div>
            <div class="sealed-tag">🤫 your spot · revealed at the party</div>
            <p class="result-joke">We'd tell you your score… but then we couldn't plot you publicly in front of everyone for maximum drama. Patience. 😈</p>
            <p class="result-nodo">🔒 No do-overs — <b>your first submission is the one that counts.</b> You can't retake the test, so this is officially your spot on the spectrum.</p>
            <div class="quiz-nav" style="justify-content:center;margin-top:10px">
              <button class="btn btn-primary btn-sm" id="to-details">📍 Party details →</button>
            </div>
          </div>`);
        shellEl.appendChild(node);
        confetti.burst(180);
        $("#to-details", node).addEventListener("click", () => navigate("/details"));
        return;
      }

      // dev "under construction" gate — shows AFTER the start button and AFTER
      // the returning/date gags, right before the real questions. Once the
      // correct code is entered it's remembered, so it won't nag on retakes.
      if (!state.unlocked) {
        const node = el(`
          <div class="card dev-gate fade-in">
            <div class="dev-glyph">🚧</div>
            <span class="dev-tag">⚠ Restricted area</span>
            <h2 class="section-title">You shouldn't be here.</h2>
            <p class="wb-text">This site is still <b>under development</b>. If someone gave you the access code, punch it in. If not… how did you even get this far? 👀</p>
            <input class="dev-pin" id="dev-pin" type="password" inputmode="numeric" maxlength="4" placeholder="••••" autocomplete="off" />
            <div class="dev-err" id="dev-err" hidden>🚫 That's not the code. Nice try.</div>
            <div class="quiz-nav" style="justify-content:center;margin-top:10px">
              <button class="btn btn-primary btn-lg" id="dev-enter">Enter →</button>
            </div>
          </div>`);
        shellEl.appendChild(node);
        const inp = $("#dev-pin", node), err = $("#dev-err", node);
        const tryUnlock = () => {
          const v = inp.value.replace(/\D/g, "").slice(0, 4);
          if (v === CONFIG.devPin) { state.unlocked = true; save(LS.pin, true); confetti.burst(60); paint(); window.scrollTo({ top: 0 }); }
          else { err.hidden = false; node.classList.remove("shake"); void node.offsetWidth; node.classList.add("shake"); inp.value = ""; inp.focus(); }
        };
        inp.addEventListener("input", () => { inp.value = inp.value.replace(/\D/g, "").slice(0, 4); err.hidden = true; });
        inp.addEventListener("keydown", e => { if (e.key === "Enter") tryUnlock(); });
        $("#dev-enter", node).addEventListener("click", tryUnlock);
        setTimeout(() => inp.focus(), 60);
        return;
      }

      // question step — state.step walks the shuffled order; qi is the canonical
      // QUESTIONS index, so stored answers always line up for the host's recap
      const total = state.order.length;
      const qi = state.order[state.step];
      const Q = QUESTIONS[qi];
      const pct = Math.round((state.step / total) * 100);
      const chrome = Q.bare ? "" : `
          <div class="progress-rail"><div class="progress-fill" style="width:${pct}%"></div></div>
          <div class="q-count">Question ${state.step + 1} of ${total}</div>
          <h2 class="q-text">${Q.q}</h2>`;
      const node = el(`
        <div class="fade-in">${chrome}
          <div class="q-body"></div>
          <div class="quiz-nav quiz-nav-next">
            <button class="btn btn-primary btn-sm" id="next-btn" disabled>Next →</button>
          </div>
        </div>`);
      const qbody = $(".q-body", node);
      // keepLocked: record the answer/metric but DON'T enable Next yet. Lives-based
      // games use this on every death so the score stays current, but the player
      // can't advance (no giving up) until all lives are spent — then they call
      // setAnswer normally to unlock Next.
      const setAnswer = (points, meta, keepLocked) => {
        state.answers[qi] = points;
        if (meta) Object.assign(state.metrics, meta);
        const nb = $("#next-btn", node);
        if (nb && !keepLocked) nb.disabled = false;
      };
      dispatchGame(qbody, Q, qi, state, setAnswer, state.step + 1);
      const isLast = state.step === total - 1;
      const nextBtn = $("#next-btn", node);
      nextBtn.textContent = isLast ? "See my result →" : "Next →";
      // polo auto-advances on pick — keep the button (it clicks it) but hide it
      if (Q.kind === "polo") { const nav = node.querySelector(".quiz-nav-next"); if (nav) nav.style.display = "none"; }
      if (state.answers[qi] != null) nextBtn.disabled = false;
      nextBtn.addEventListener("click", () => {
        if (state.answers[qi] == null) return;
        if (isLast) {
          state.score = computeScore();
          submitToQueue(state);
          state.done = true; paint();
        } else { state.step++; paint(); }
      });
      shellEl.appendChild(node);
    }

    paint();
    return container;
  }

  // shared question dispatcher — used by both the real test and the debug sandbox
  function dispatchGame(qbody, Q, i, state, setAnswer, displayNum) {
    const kind = Q.kind || "choice";
    if (kind === "choice") {
      const optWrap = el(`<div class="options"></div>`);
      qbody.appendChild(optWrap);
      Q.opts.forEach((o, idx) => {
        const b = el(`<button class="option" type="button"><span class="dot"></span><span>${o[0]}</span></button>`);
        if (state.__selByStep && state.__selByStep[i] === idx) b.classList.add("selected");
        b.addEventListener("click", () => {
          state.__selByStep = state.__selByStep || {};
          state.__selByStep[i] = idx;
          optWrap.querySelectorAll(".option").forEach(x => x.classList.remove("selected"));
          b.classList.add("selected");
          setAnswer(o[1]);
        });
        optWrap.appendChild(b);
      });
    } else if (kind === "train") { renderTrainGame(qbody, Q, setAnswer); }
    else if (kind === "bankpin") { renderBankPinGame(qbody, Q, setAnswer, state); }
    else if (kind === "color") { renderColorGame(qbody, Q, setAnswer); }
    else if (kind === "typing") { renderTypingGame(qbody, Q, setAnswer); }
    else if (kind === "qebday") { renderQueenBdayGame(qbody, Q, setAnswer); }
    else if (kind === "polo") { renderPoloGame(qbody, Q, setAnswer, displayNum || i + 1); }
    else if (kind === "reenterpin") { renderReenterPinGame(qbody, Q, setAnswer, state); }
    else if (kind === "dodge") { renderDodgeGame(qbody, Q, setAnswer, state.avatar); }
    else if (kind === "flappy") { renderFlappyGame(qbody, Q, setAnswer, state.avatar); }
    else if (kind === "whg") { renderWhgGame(qbody, Q, setAnswer); }
    else if (kind === "rps") { renderRpsGame(qbody, Q, setAnswer, state.avatar); }
    else if (kind === "eggs") { renderEggGame(qbody, Q, setAnswer); }
    else if (kind === "boxes") { renderBoxesGame(qbody, Q, setAnswer); }
    else if (kind === "imgquiz") { renderImgQuizGame(qbody, Q, setAnswer); }
    else if (kind === "imgtext") { renderImgTextGame(qbody, Q, setAnswer); }
    else if (kind === "simon") { renderSimonGame(qbody, Q, setAnswer); }
    else if (kind === "tvvol") { renderTvVolGame(qbody, Q, setAnswer); }
    else if (kind === "subway") { renderSubwayGame(qbody, Q, setAnswer, state.avatar); }
    else if (kind === "rings") { renderRingsGame(qbody, Q, setAnswer); }
    else if (kind === "bricks") { renderBrickGame(qbody, Q, setAnswer); }
  }
  const GAME_LABELS = { choice: "Choice", bankpin: "Bank PIN", train: "Train stare", color: "Color memory", simon: "Repeat the pattern", tvvol: "TV volume", rings: "Ring sort", bricks: "Brick build", dodge: "Sensory dodge", flappy: "Flappy routine", subway: "Subway surf", whg: "World's Hardest", rps: "Rock Paper Scissors", eggs: "Feed eggs", boxes: "3 boxes", typing: "Typing race", qebday: "Queen's birthday", imgquiz: "What's happening", imgtext: "What's happening (typed)", polo: "Polo holes", reenterpin: "Re-enter PIN" };

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
      metrics: Object.assign({}, state.metrics),
      agreed: !!state.agreed,
      returning: state.returningFull || "",
      dateSurvey: state.dateSurvey || null,
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
        <button class="btn btn-primary btn-sm" data-nav="/intro">🎉 Awards Intro</button>
        <button class="btn btn-ghost btn-sm" data-nav="/present">▶ Open Presentation</button>
        <button class="btn btn-ghost btn-sm" data-nav="/results">📊 View Results page</button>
        <button class="btn btn-ghost btn-sm" data-nav="/debug">🐞 Debug games</button>
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
    // live: repaint the queue (and stats) whenever a phone submits / data changes
    liveRefresh = () => { if (currentHash().indexOf("/admin") === 0) paintQueue(); };
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
          ${s.dateSurvey ? `<div class="date-survey-note">💘 <b>${esc(s.name)}</b> rated dating the host <b>${s.dateSurvey.rating ? esc(s.dateSurvey.rating) + "/10" : "—"}</b>${s.dateSurvey.feedback ? `<div class="dsn-fb">“${esc(s.dateSurvey.feedback)}”</div>` : ""}</div>` : ""}
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
      // guard against submissions saved under an older/longer QUESTIONS set:
      // a missing QUESTIONS[i] used to throw and blank the whole admin page.
      detail.innerHTML = s.answers.map((a, i) => {
        const Q = QUESTIONS[i];
        if (a == null || !Q) return "";
        const opt = (Q.opts || []).find(o => o[1] === a) || ["-"];
        return `<div class="qa"><b>${esc(Q.q)}</b>${esc(opt[0])} <span style="color:var(--ink-faint)">(+${a})</span></div>`;
      }).join("") || `<div class="qa">No detailed answers (demo entry).</div>`;
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
  /* ----------------------------------------------------------
     AWARDS INTRO - a "Mario Party" superlatives show. Lines every
     guest up along the bottom, then spotlights + roasts one winner
     per fun-fact award (derived from quiz metrics) before the reveal.
     ---------------------------------------------------------- */
  // Each award is a metric-based, Mario-Party-style bar race: every guest with
  // that metric gets an animated bar; the winner's bar is longest. dir:"high"
  // = bigger value wins; dir:"low" = smaller value wins (bar is inverted so the
  // winner is still longest).
  function buildAwards(guests) {
    const defs = [
      { emoji: "🚂", title: "Longest Train Stare",     key: "trainWatch",  dir: "high", suffix: "s", desc: "Watched the looping train the longest before finally picking a car.", stat: v => `stared at the train for <b>${v} seconds</b>`, roast: "we were genuinely worried you'd missed your stop.", min: 1 },
      { emoji: "🐤", title: "Flappy Legend",           key: "flappyBest",  dir: "high", suffix: " pipes", desc: "Cleared the most pipes in a single run.", stat: v => `cleared <b>${v} pipe${v === 1 ? "" : "s"}</b> in one run`, roast: "you and that bird share one beautifully focused brain.", min: 1 },
      { emoji: "🔁", title: "Never Surrenders",        key: "rpsGames",    dir: "high", suffix: " games", desc: "Replayed the unwinnable rock-paper-scissors the most times before giving up.", stat: v => `played <b>${v} unwinnable game${v === 1 ? "" : "s"}</b> before quitting`, roast: "replayed a rigged game that many times. Iconic.", min: 1 },
      { emoji: "🥚", title: "Fed the Most Eggs",       key: "eggsFed",     dir: "high", suffix: " eggs", desc: "Fed more eggs than anybody else.", stat: v => `fed <b>${v} egg${v === 1 ? "" : "s"}</b>`, roast: "the egg never asked for this. You kept going anyway.", min: 1 },
      { emoji: "🧠", title: "Pattern Prophet",         key: "simonRounds", dir: "high", suffix: " rounds", desc: "Repeated the longest Simon sequence from memory.", stat: v => `remembered <b>${v} round${v === 1 ? "" : "s"}</b> of the pattern`, roast: "memorized beeps like it was nothing. Unnerving.", min: 1 },
      { emoji: "🚇", title: "Subway Surfer",           key: "subwayCoins", dir: "high", suffix: " coins", desc: "Grabbed the most coins while dodging subway trains.", stat: v => `pocketed <b>${v} coin${v === 1 ? "" : "s"}</b> mid-dodge`, roast: "the trains missed. The coins didn't.", min: 1 },
      { emoji: "💍", title: "Ring Master",             key: "ringTime",    dir: "low",  suffix: "s", desc: "Sorted the rings by color the fastest.", stat: v => `sorted every ring in <b>${v} seconds</b>`, roast: "sorted by color at speed. The shelves at home must be immaculate.", min: 2 },
      { emoji: "🧱", title: "Master Builder",          key: "brickTime",   dir: "low",  suffix: "s", desc: "Followed the brick instructions and built the fastest.", stat: v => `built the whole thing in <b>${v} seconds</b>`, roast: "followed the instructions to the letter, at speed. No notes.", min: 2 },
      { emoji: "⌨️", title: "Fastest Typer",           key: "typeSecs",    dir: "low",  suffix: "s", desc: "Typed the sentence correctly in the fewest seconds.", stat: v => `typed the whole sentence in <b>${v} seconds</b>`, roast: "typed it clean and fast. You've done this before.", min: 1 },
      { emoji: "👑", title: "Closest Queen Birthday",  key: "qeDaysOff",   dir: "low",  suffix: " days off", desc: "Guessed closest to Queen Elizabeth II's real birthday (21 April 1926).", stat: v => v === 0 ? `nailed her birthday <b>exactly</b>` : `guessed <b>${v} day${v === 1 ? "" : "s"}</b> away from her birthday`, roast: "why do you know when the Queen was born? (You're among friends.)", min: 1 },
    ];
    return defs.map(d => {
      const pool = guests.filter(g => g.metrics && typeof g.metrics[d.key] === "number");
      return pool.length >= (d.min || 1) ? Object.assign({}, d, { pool }) : null;
    }).filter(Boolean);
  }

  let awardsKeyHandler = null;
  /* ----------------------------------------------------------
     ROUTE: DEBUG (host-only) — jump to any game in isolation + restart
     ---------------------------------------------------------- */
  let debugStep = 0;
  route("/debug", function () {
    if (load(LS.auth, false) !== true) return adminGate();
    debugStep = Math.max(0, Math.min(debugStep, QUESTIONS.length - 1));
    const root = wrapDiv(`<section class="section fade-in"><div class="wrap">
      <div class="admin-bar">
        <div>
          <h2 class="section-title" style="text-align:left;margin-bottom:4px">🐞 Debug · Game Sandbox</h2>
          <p style="color:var(--ink-soft);margin:0">Jump to any game and restart it on command. Nothing here is saved.</p>
        </div>
        <div><button class="btn btn-ghost btn-sm" data-nav="/admin">← Admin</button></div>
      </div>
      <div class="dbg-menu" id="dbg-menu"></div>
      <div class="dbg-bar">
        <button class="btn btn-primary btn-sm" id="dbg-restart">🔄 Restart this game</button>
        <span class="dbg-score" id="dbg-score">score: —</span>
      </div>
      <div class="card dbg-stage"><div id="dbg-body"></div></div>
    </div></section>`);

    const menu = $("#dbg-menu", root), bodyHost = $("#dbg-body", root), scoreEl = $("#dbg-score", root);
    QUESTIONS.forEach((Q, idx) => {
      const b = el(`<button class="dbg-item" type="button">${idx + 1}. ${Q.mc ? esc(Q.label || "Multiple choice") : (GAME_LABELS[Q.kind] || Q.kind)}</button>`);
      b.addEventListener("click", () => { debugStep = idx; mount(); });
      menu.appendChild(b);
    });

    function mount() {
      menu.querySelectorAll(".dbg-item").forEach((b, idx) => b.classList.toggle("active", idx === debugStep));
      const Q = QUESTIONS[debugStep];
      scoreEl.textContent = "score: —";
      // throwaway state so games that read state work (avatar, bankPin, etc.)
      const state = { step: debugStep, firstName: "Debug", lastInitial: "Q", name: "Debug Q.", avatar: Object.assign({}, DEFAULT_AVATAR), answers: QUESTIONS.map(() => null), metrics: {}, bankPin: "1357", __selByStep: {} };
      const setAnswer = (points, meta) => { scoreEl.textContent = `score: ${points}/3${meta ? " · " + JSON.stringify(meta) : ""}`; };
      bodyHost.innerHTML = (Q.bare ? "" : `<h2 class="q-text" style="margin-bottom:18px">${Q.q}</h2>`) + `<div class="q-body" id="dbg-inner"></div>`;
      dispatchGame($("#dbg-inner", bodyHost), Q, debugStep, state, setAnswer);
    }
    $("#dbg-restart", root).addEventListener("click", mount);
    root.querySelectorAll("[data-nav]").forEach(b => b.addEventListener("click", () => navigate(b.getAttribute("data-nav"))));
    setTimeout(mount, 20);
    return root;
  });

  route("/intro", function () {
    if (load(LS.auth, false) !== true) return adminGate();
    const guests = store.approved();
    const awards = buildAwards(guests);
    let awardIdx = 0;
    const root = wrapDiv(`<section class="section awards-view fade-in"><div class="wrap">
      <h2 class="section-title">🎉 The Awards Show</h2>
      <p class="section-sub">A few superlatives before we crown the most autistic among us. Brace yourselves. 🏆</p>
      <div class="award-stage" id="award-stage"></div>
      <div class="award-roster" id="award-roster"></div>
      <div class="present-controls">
        <button class="btn btn-ghost btn-sm" id="aw-back">← Back</button>
        <button class="btn btn-ghost btn-sm" id="fs-btn">⛶ Full screen</button>
        <span class="present-count" id="aw-count"></span>
        <button class="btn btn-primary" id="aw-next">Next award →</button>
      </div>
    </div></section>`);
    const stageEl = $("#award-stage", root), rosterEl = $("#award-roster", root);
    const countEl = $("#aw-count", root), nextBtn = $("#aw-next", root), backBtn = $("#aw-back", root);

    if (!guests.length || !awards.length) {
      stageEl.innerHTML = `<div class="placeholder">${dbReady ? "No approved guests yet.<br>Approve some in the <b>Admin</b> queue first." : "Loading guests…"}</div>`;
      nextBtn.disabled = true;
      backBtn.addEventListener("click", () => navigate("/admin"));
      // once cloud data arrives, re-render so the show populates
      liveRefresh = () => { if (currentHash().indexOf("/intro") === 0 && store.approved().length) render(); };
      return root;
    }

    // line everyone up along the bottom
    rosterEl.innerHTML = guests.map((g, i) =>
      `<div class="roster-toon" data-i="${i}"><span class="avchip" style="width:54px;height:54px">${avatarSVG(g.avatar)}</span><div class="roster-name">${esc(g.firstName || g.name)}</div></div>`
    ).join("");
    const toons = Array.from(rosterEl.querySelectorAll(".roster-toon"));

    function showAward(n) {
      const a = awards[n];
      const ranked = a.pool.slice().sort((x, y) => a.dir === "high" ? (y.metrics[a.key] - x.metrics[a.key]) : (x.metrics[a.key] - y.metrics[a.key]));
      const winner = ranked[0], wi = guests.indexOf(winner);
      const shown = ranked.slice(0, 10);
      const maxV = Math.max.apply(null, shown.map(g => g.metrics[a.key]).concat(0.0001));
      const barScore = (v) => a.dir === "high" ? v : (maxV - v + maxV * 0.12); // invert so the winner (low) is longest
      const maxScore = Math.max.apply(null, shown.map(g => barScore(g.metrics[a.key])).concat(0.0001));
      const rows = shown.map((g, idx) => {
        const v = g.metrics[a.key];
        const pct = Math.max(12, Math.round(barScore(v) / maxScore * 100));
        return `<div class="mp-row${idx === 0 ? " mp-win" : ""}">
          <span class="mp-rank">${idx === 0 ? "🏆" : (idx + 1)}</span>
          <span class="avchip mp-av" style="width:42px;height:42px">${avatarSVG(g.avatar)}</span>
          <span class="mp-name">${esc(g.firstName || g.name)}</span>
          <div class="mp-track"><div class="mp-bar" style="--w:${pct}%;animation-delay:${(idx * 0.09).toFixed(2)}s"></div></div>
          <span class="mp-val">${v}${a.suffix || ""}</span>
        </div>`;
      }).join("");
      stageEl.innerHTML = `<div class="award-card fade-in">
        <div class="award-kicker">${a.emoji} Award ${n + 1} of ${awards.length}</div>
        <div class="award-title">${esc(a.title)}</div>
        <div class="award-desc">${esc(a.desc || "")}</div>
        <div class="mp-chart">${rows}</div>
        <div class="award-stat">🏆 <b>${esc(winner.firstName || winner.name)}</b> ${a.stat ? a.stat(winner.metrics[a.key]) : ""}</div>
        <div class="award-roast">“${esc(a.roast)}”</div>
      </div>`;
      toons.forEach((t, i) => { t.classList.toggle("spotlight", i === wi); t.classList.toggle("dim", i !== wi); });
      if (toons[wi]) toons[wi].scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
      countEl.textContent = `${n + 1} / ${awards.length}`;
      nextBtn.textContent = n >= awards.length - 1 ? "Start the Reveal →" : "Next award →";
      confetti.burst(80);
    }
    // title card — the show waits for the host to hit Start
    let started = false;
    function showStart() {
      started = false;
      stageEl.innerHTML = `<div class="award-card award-start">
        <div class="as-emoji">🎉</div>
        <div class="as-title">The Awards Show</div>
        <div class="as-sub"><b>${awards.length}</b> superlative${awards.length === 1 ? "" : "s"}, then we crown the most autistic among us.</div>
        <button class="btn btn-primary btn-lg" id="aw-start" type="button">▶ Start the show</button>
      </div>`;
      countEl.textContent = "";
      nextBtn.style.display = "none";
      toons.forEach(t => t.classList.remove("spotlight", "dim"));
      $("#aw-start", stageEl).addEventListener("click", startShow);
    }
    function startShow() {
      if (started) return;
      started = true;
      nextBtn.style.display = "";
      awardIdx = 0;
      showAward(0);
    }
    function go(delta) {
      if (!started) { if (delta > 0) startShow(); else navigate("/admin"); return; }
      if (awardIdx >= awards.length - 1 && delta > 0) { navigate("/present"); return; }
      if (awardIdx <= 0 && delta < 0) { showStart(); return; } // back from award 1 → title card
      awardIdx = Math.max(0, Math.min(awards.length - 1, awardIdx + delta));
      showAward(awardIdx);
    }
    nextBtn.addEventListener("click", () => go(1));
    backBtn.addEventListener("click", () => go(-1));

    if (awardsKeyHandler) removeEventListener("keydown", awardsKeyHandler);
    awardsKeyHandler = (e) => {
      if (location.hash !== "#/intro") return;
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") { e.preventDefault(); go(1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
    };
    addEventListener("keydown", awardsKeyHandler);
    wireFullscreen(root); // TV mode for the awards show too

    setTimeout(showStart, 30);
    return root;
  });

  let presentRevealed = 0; // how many revealed so far this session
  let fsChangeHandler = null;
  // Shared "TV mode" for the host screens (#/present and #/intro): hides the site
  // chrome and scales the stage up. Needs a real click — browsers block
  // requestFullscreen without a user gesture. onChange re-measures after a toggle.
  function wireFullscreen(root, onChange) {
    const fsBtn = $("#fs-btn", root);
    if (!fsBtn) return;
    const isFs = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
    function syncFs() {
      const on = isFs();
      document.body.classList.toggle("present-fs", on);
      fsBtn.textContent = on ? "⛶ Exit full screen" : "⛶ Full screen";
      if (typeof onChange === "function") setTimeout(onChange, 60);
    }
    fsBtn.addEventListener("click", () => {
      const el = document.documentElement;
      if (isFs()) (document.exitFullscreen || document.webkitExitFullscreen || function () {}).call(document);
      else (el.requestFullscreen || el.webkitRequestFullscreen || function () {}).call(el);
    });
    if (fsChangeHandler) removeEventListener("fullscreenchange", fsChangeHandler);
    fsChangeHandler = syncFs;
    addEventListener("fullscreenchange", fsChangeHandler);
    syncFs();
  }
  route("/present", function () {
    if (load(LS.auth, false) !== true) return adminGate();
    const guests = store.approved(); // ascending by score
    const root = wrapDiv(`<section class="section present-view fade-in"><div class="wrap">
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
        <button class="btn btn-ghost btn-sm" id="fs-btn">⛶ Full screen</button>
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
      stage.innerHTML = `<div class="placeholder">${dbReady ? "No approved guests yet.<br>Approve some in the <b>Admin</b> queue first." : "Loading guests…"}</div>`;
      revealBtn.disabled = true;
      // populate once cloud data arrives — but never interrupt an in-progress reveal
      liveRefresh = () => { if (currentHash().indexOf("/present") === 0 && presentRevealed === 0 && store.approved().length) render(); };
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
    const topTwoStart = guests.length - 2; // 2nd place index; 1st = topTwoStart+1
    const sectionEl = root.querySelector("section");
    function updateUI() {
      dots.forEach((d, i) => d.classList.toggle("current", i === presentRevealed - 1));
      const done = presentRevealed >= guests.length;
      revealBtn.disabled = done;
      // champion moment: the podium is the whole show — full screen drops the graph
      // so the finale always fits on the TV without scrolling
      if (sectionEl) sectionEl.classList.toggle("champ-mode", guests.length > 0 && done);
      const atTopTwo = guests.length >= 2 && presentRevealed === topTwoStart;
      const inFinale = hasPodium && presentRevealed >= finaleStart;
      if (done) countEl.textContent = `${guests.length} / ${guests.length} revealed`;
      else if (atTopTwo) countEl.textContent = `🥁 The top two — together`;
      else if (inFinale) countEl.textContent = `🥁 Final 3 · ${presentRevealed - finaleStart}/3 revealed`;
      else countEl.textContent = `${presentRevealed} / ${guests.length} revealed`;
      if (done) revealBtn.textContent = "All revealed 🎉";
      else if (atTopTwo) revealBtn.textContent = "🥁 Drum roll — reveal 1st & 2nd →";
      else if (hasPodium && presentRevealed === finaleStart) revealBtn.textContent = "🥉 Reveal 3rd place →";
      else revealBtn.textContent = "Reveal next →";
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
    // everyone's out — go absolutely feral for the champion
    function renderFinaleBoth() {
      const first = guests[guests.length - 1];
      const t = tierFor(first.score);
      stage.innerHTML = `<div class="finale-crown champ">
        <div class="fc-medal">👑</div>
        <div class="fc-title">THE MOST AUTISTIC</div>
        <div class="fc-champ">
          <span class="fc-halo"><span class="avchip fc-av">${avatarSVG(first.avatar)}</span></span>
          <div class="fc-who">
            <div class="fc-name">${esc(first.name)}</div>
            <div class="fc-sub">${t.emoji} ${t.name} · <b>${first.score}</b>/100</div>
          </div>
        </div>
        <div class="fc-sparks"><span>✨</span><span>🎉</span><span>🏆</span><span>⚡</span><span>🌈</span><span>✨</span></div>
      </div>`;
    }
    function updateStage() {
      // everyone revealed → crown banner + the full 1st/2nd/3rd podium
      if (guests.length >= 2 && presentRevealed >= guests.length) { renderFinaleBoth(); return; }
      // about to announce the podium → preview the three finalists
      if (hasPodium && presentRevealed === finaleStart) { renderFinalePreview(); return; }
      if (presentRevealed === 0) {
        stage.innerHTML = `<div class="placeholder">Ready when you are. Hit <b>Reveal next</b> to begin the ascent. 🚀</div>`;
        return;
      }
      // 3rd place just revealed (its own moment, before the top-two drum roll)
      if (hasPodium && presentRevealed === finaleStart + 1) { renderFinaleStage(finaleStart); return; }
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
      // the final two are announced together, after a drum roll
      if (guests.length >= 2 && presentRevealed === topTwoStart) { revealTopTwo(); return; }
      const idx = presentRevealed;
      dots[idx].classList.add("show");
      presentRevealed++;
      const g = guests[idx];
      updateStage();
      updateUI();
      sfx.ding();
      const rect = graph.getBoundingClientRect();
      confetti.burst(g.score > 70 ? 120 : 60, rect.left + rect.width * (g.score / 100));
    }
    function revealTopTwo() {
      revealBtn.disabled = true;
      stage.innerHTML = `<div class="fade-in finale-drumroll">
        <div class="dr-emoji">🥁</div>
        <div class="dr-text">The top two… revealed together</div>
        <div class="dr-dots"><span>.</span><span>.</span><span>.</span></div>
      </div>`;
      renderPodium();
      sfx.drumroll(2200, () => {
        sfx.crash(); sfx.fanfare();
        const second = guests.length - 2, first = guests.length - 1;
        if (dots[second]) dots[second].classList.add("show");
        if (dots[first]) dots[first].classList.add("show");
        presentRevealed = guests.length;
        renderFinaleBoth();
        updateUI();
        // absolute chaos: shake the stage, then rolling confetti volleys + a second fanfare.
        // (shake the inner wrap, NOT the section — the section owns the .fade-in animation)
        const shakeEl = root.querySelector(".graph-wrap");
        if (shakeEl) { shakeEl.classList.add("champ-shake"); setTimeout(() => shakeEl.classList.remove("champ-shake"), 700); }
        const W = innerWidth;
        confetti.burst(320, W * 0.5);
        [[240, 0.18, 320], [240, 0.82, 620], [280, 0.5, 940], [200, 0.3, 1250], [200, 0.7, 1450]]
          .forEach(([n, at, delay]) => setTimeout(() => confetti.burst(n, W * at), delay));
        setTimeout(() => { sfx.fanfare(); confetti.burst(360, W * 0.5); }, 1700);
      });
    }

    revealBtn.addEventListener("click", reveal);
    $("#reset-btn", root).addEventListener("click", () => {
      presentRevealed = 0;
      dots.forEach(d => d.classList.remove("show", "current"));
      updateStage(); updateUI();
    });

    wireFullscreen(root, placeAll); // TV mode (re-measures the graph on toggle)

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
      // unlock live the moment the host flips results public
      liveRefresh = () => { if (store.resultsPublic()) render(); };
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

    const graph = $("#rgraph", root), ranks = $("#ranks", root);
    function paint() {
      const gs = store.approved();
      graph.querySelectorAll(".guest-dot, .placeholder").forEach(n => n.remove());
      if (!gs.length) {
        graph.innerHTML += `<div class="placeholder" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--ink-faint)">No approved guests yet.</div>`;
      }
      const byScore = gs.slice().sort((a, b) => b.score - a.score);
      const medals = ["🥇", "🥈", "🥉"];
      gs.forEach((g) => {
        const rank = byScore.indexOf(g);
        const medal = rank < 3 ? medals[rank] : "";
        graph.appendChild(el(`<div class="guest-dot show${medal ? " ranked" : ""}" style="left:${g.score}%">
          ${medal ? `<div class="rank-medal">${medal}</div>` : ""}
          <div class="flag">${esc(g.name)}<span class="s">${g.score}</span></div>
          <div class="pin">${avatarSVG(g.avatar)}</div></div>`));
      });
      ranks.innerHTML = byScore.map((g, i) => {
        const t = tierFor(g.score);
        return `<div class="rank-row">
          <div class="rank-num">${i + 1}</div>
          <div class="rank-info">${avatarChip(g.avatar, 34)}<div><div class="rank-name">${esc(g.name)}</div><div class="rank-tier">${t.emoji} ${t.name}</div></div></div>
          <div class="rank-score">${g.score}</div>
        </div>`;
      }).join("");
    }
    paint();
    // live: re-plot as guests are approved (and re-lock if the host hides results)
    liveRefresh = () => { if (!store.resultsPublic() && load(LS.auth, false) !== true) render(); else paint(); };
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
  startLive();   // subscribe to the shared cloud DB (realtime)
  render();
})();
