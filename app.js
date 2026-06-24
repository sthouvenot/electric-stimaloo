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
      kind: "dodge",
      q: "Keep your avatar alive as long as you can.",
      opts: [
        ["Splatted almost immediately", 0],
        ["Survived a little", 1],
        ["Lasted a good while", 2],
        ["Frighteningly good at this", 3],
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
  ];
  const MAX_RAW = QUESTIONS.length * 3; // 27

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
    pin: "ap_dev_unlocked_v1",
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
        ["Maya", "R", 8, { face: "femme", skin: SKINS[1], hairStyle: "long", hairColor: "#1c1c1c", shirt: "#ff3d7f", blush: true }, { trainWatch: 2.3, eyeContact: 12.4, dodge: 5.5 }],
        ["Devon", "K", 19, { skin: SKINS[4], hairStyle: "short", hairColor: "#1c1c1c", shirt: "#2f9bff", eyewear: "glasses" }, { trainWatch: 5.1, eyeContact: 0.9, dodge: 9.2 }],
        ["Priya", "S", 27, { face: "femme", skin: SKINS[3], hairStyle: "bun", hairColor: "#3b2417", shirt: "#ffd23f", earrings: true }, { trainWatch: 9.7, eyeContact: 3.4, dodge: 2.1 }],
        ["Marcus", "T", 34, { skin: SKINS[5], hairStyle: "buzz", hairColor: "#1c1c1c", shirt: "#2ec27e", facialHair: "beard" }, { trainWatch: 1.1, eyeContact: 6.2, dodge: 18.7 }],
        ["Sofia", "L", 44, { face: "femme", skin: SKINS[2], hairStyle: "curly", hairColor: "#6b4423", shirt: "#8b5cf6", freckles: true }, { trainWatch: 15.6, eyeContact: 19.8, dodge: 7.0 }],
        ["Liam", "B", 52, { skin: SKINS[1], hairStyle: "short", hairColor: "#e3b04b", shirt: "#ff8a3d", eyewear: "shades" }, { trainWatch: 7.2, eyeContact: 0.4, dodge: 12.3 }],
        ["Tasha", "M", 63, { face: "femme", skin: SKINS[6], hairStyle: "afro", hairColor: "#1c1c1c", shirt: "#ffd23f", earrings: true }, { trainWatch: 23.9, eyeContact: 5.0, dodge: 3.8 }],
        ["Wen", "C", 71, { skin: SKINS[2], hairStyle: "short", hairColor: "#1c1c1c", shirt: "#2f9bff", headphones: true }, { trainWatch: 3.0, eyeContact: 9.1, dodge: 22.0 }],
        ["Eli", "G", 83, { skin: SKINS[0], hairStyle: "mohawk", hairColor: "#2f9bff", shirt: "#2a2a2a", facialHair: "mustache" }, { trainWatch: 6.6, eyeContact: 1.6, dodge: 14.4 }],
        ["Robin", "P", 94, { face: "femme", skin: SKINS[3], hairStyle: "long", hairColor: "#8b5cf6", shirt: "#ededed", eyewear: "glasses" }, { trainWatch: 11.1, eyeContact: 7.7, dodge: 6.1 }],
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
          metrics: s[4] || {},
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
      `<button class="tw-car" data-i="${k}" style="--car:${car.c}" type="button" aria-label="train car ${k + 1}"><i></i><i></i></button>`).join("");
    body.innerHTML = `
      <div class="tw-stage">
        <div class="tw-train"><span class="tw-loco">🚂</span>${carRow()}<span class="tw-loco">🚂</span>${carRow()}</div>
        <div class="tw-track"></div>
      </div>
      <p class="tw-hint">↑ tap the car you like best</p>
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
        reveal.innerHTML = `🚂 You watched for <b>${secs.toFixed(1)} seconds</b> before picking ${car.label}.<br><span class="tw-twist">…we weren't really asking about the car.</span>`;
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

  // Dodge game: the player's own avatar follows the pointer; survive the falling
  // junk. Longer survival = better reflexes/hyperfocus = higher score. Uses a
  // setInterval loop (rAF throttles in background tabs) and self-cleans if the
  // quiz navigates away mid-game.
  function renderDodgeGame(body, Q, setAnswer, avatar) {
    body.innerHTML = `
      <div class="dodge-stage" id="dodge-stage">
        <div class="dodge-hud"><span class="dodge-time">0.0s</span><span class="dodge-lives" id="dodge-lives">❤️❤️❤️</span></div>
        <div class="dodge-player" id="dodge-player"><span class="avchip" style="width:100%;height:100%">${avatarSVG(avatar)}</span></div>
        <div class="dodge-overlay" id="dodge-ov">
          <div class="dodge-msg">Keep your avatar alive.<small>Move with your mouse / finger — dodge the falling junk. You get 3 lives.</small></div>
          <button class="btn btn-primary dodge-go" type="button">▶ Start</button>
        </div>
      </div>
      <div class="dodge-reveal" hidden></div>`;
    const stage = $("#dodge-stage", body), player = $("#dodge-player", body), timeEl = $(".dodge-time", body), ov = $("#dodge-ov", body), reveal = $(".dodge-reveal", body), livesEl = $("#dodge-lives", body);
    const PLAYER = 52, PAD = 4, EMOJI = ["🧱","🔨","📦","🪨","🧊","⚙️","🔧","💣"];
    let running = false, loop = null, startT = 0, best = 0, elapsed = 0, last = 0, spawnAcc = 0, px = 0, W = 0, H = 0, rocks = [], lives = 3;
    function measure() { const r = stage.getBoundingClientRect(); W = r.width; H = r.height; return r; }
    function setPlayer(clientX) { const r = stage.getBoundingClientRect(); px = Math.max(PAD, Math.min(W - PLAYER - PAD, clientX - r.left - PLAYER / 2)); player.style.left = px + "px"; }
    function onMove(e) { setPlayer(e.clientX); }
    function spawnRock() {
      const sz = 24 + Math.random() * 20, x = PAD + Math.random() * (W - sz - PAD * 2);
      const d = document.createElement("div");
      d.className = "dodge-rock"; d.textContent = EMOJI[Math.floor(Math.random() * EMOJI.length)];
      d.style.width = d.style.height = sz + "px"; d.style.left = x + "px"; d.style.top = (-sz) + "px";
      stage.appendChild(d);
      rocks.push({ el: d, x, y: -sz, size: sz, vy: 2 + Math.random() * 1.6 });
    }
    function cleanup() { running = false; clearInterval(loop); window.removeEventListener("pointermove", onMove); }
    function tick() {
      if (!document.body.contains(stage)) { cleanup(); return; }
      if (!running) return;
      const t = Date.now();
      let dt = last ? t - last : 16; last = t; if (dt > 60) dt = 60;
      elapsed = (t - startT) / 1000;
      timeEl.textContent = elapsed.toFixed(1) + "s";
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
      measure(); setPlayer(stage.getBoundingClientRect().left + W / 2);
      running = true; startT = Date.now(); last = 0; spawnAcc = 0; elapsed = 0;
      ov.style.display = "none"; reveal.hidden = true; stage.classList.add("dodge-playing");
      window.addEventListener("pointermove", onMove, { passive: true });
      loop = setInterval(tick, 24);
    }
    function gameOver() {
      cleanup(); stage.classList.remove("dodge-playing");
      if (elapsed > best) best = elapsed;
      lives = Math.max(0, lives - 1);
      if (livesEl) livesEl.textContent = lives > 0 ? "❤️".repeat(lives) : "💀";
      const points = best < 3 ? 0 : best < 7 ? 1 : best < 13 ? 2 : 3;
      const verdicts = ["Reflexes of a sleepy cat. We love that for you.", "Decent. You panicked, but on a delay.", "Sharp. Suspiciously locked in.", "Frightening hand-eye control. Textbook hyperfocus."];
      // best run so far is always the answer; once lives run out, Next is forced
      setAnswer(points, { dodge: +best.toFixed(1) });
      reveal.hidden = false;
      reveal.innerHTML = `Best run: <b>${best.toFixed(1)}s</b> — ${verdicts[points]}<br><span class="dodge-twist">…the better you are at this, the more autistic we're afraid you are.</span>`;
      ov.style.display = "";
      if (lives > 0) {
        ov.innerHTML = `<div class="dodge-msg">💥 You survived <b>${elapsed.toFixed(1)}s</b><small>${lives} ${lives === 1 ? "life" : "lives"} left</small></div><button class="btn btn-primary dodge-go" type="button">↻ Use a life</button>`;
        ov.querySelector(".dodge-go").addEventListener("click", start);
      } else {
        ov.innerHTML = `<div class="dodge-msg">💀 Out of lives<small>Best run: ${best.toFixed(1)}s — hit Next →</small></div>`;
      }
    }
    ov.querySelector(".dodge-go").addEventListener("click", start);
  }

  function renderBankPinGame(body, Q, setAnswer, state) {
    body.innerHTML = `
      <div class="pinq">
        <p class="pinq-note">Pick a 4-digit PIN you'd actually use. We'll rate it once you lock it in.</p>
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
        setAnswer(pts);
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
  const BIRTHSTONES = ["Garnet","Amethyst","Aquamarine","Diamond","Emerald","Pearl","Ruby","Peridot","Sapphire","Opal","Topaz","Turquoise"];
  const BIRTHFLOWERS = ["Carnation","Violet","Daffodil","Daisy","Lily of the Valley","Rose","Larkspur","Gladiolus","Aster","Marigold","Chrysanthemum","Holly"];
  function dayOfYear(m, d) { const cum = [0,31,59,90,120,151,181,212,243,273,304,334]; return cum[m-1] + d; }
  function daysInMonth(m, y) { const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; return [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]; }
  function zodiacSign(m, d) {
    const last = [19,18,20,19,20,20,22,22,21,22,21,19];
    const signs = ["Capricorn","Aquarius","Pisces","Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn"];
    return d > last[m-1] ? signs[m] : signs[m-1];
  }
  function ordinal(n) { const s = ["th","st","nd","rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
  // a fun fact derivable for ANY day of the year
  function dayFunFact(m, d) {
    const doy = dayOfYear(m, d), remaining = 365 - doy, xmas = dayOfYear(12, 25);
    const tillXmas = doy <= xmas ? xmas - doy : 365 - doy + xmas;
    const sign = zodiacSign(m, d);
    const xmasBit = tillXmas === 0 ? ", and it's Christmas Day itself 🎄" : `, and it's <b>${tillXmas}</b> day${tillXmas === 1 ? "" : "s"} until Christmas 🎄`;
    return `📅 <b>${MONTHS[m-1]} ${d}</b> is the <b>${ordinal(doy)}</b> day of the year (${remaining} to go). Anyone born then is a <b>${sign}</b>, with birthstone <b>${BIRTHSTONES[m-1]}</b> and birth-flower the <b>${BIRTHFLOWERS[m-1]}</b>${xmasBit}.`;
  }
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
      reveal.innerHTML = `${dayFunFact(m, d)}<br><br>The answer was <b>21 April 1926</b>. ${exact ? "🎯 Exact match! " : ""}${roasts[pts]}`;
      btn.disabled = true; btn.textContent = "Locked in";
      mSel.disabled = dIn.disabled = yIn.disabled = true;
      setAnswer(pts);
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
        <button class="whg-giveup" id="whg-giveup" type="button">give up →</button>
        <div class="whg-reveal" hidden></div>
      </div>`;
    // virtual coordinate system; scaled to the measured field on every frame
    const VW = 640, VH = 380, PS = 26;
    const startX2 = 92, endX1 = VW - 92; // inner edges of the two pink zones
    // 3 levels: easy / medium / hard. More lanes, more dots per lane, faster.
    const midX = (startX2 + endX1) / 2;
    const LEVELS = [
      { name: "Easy",   lanes: [130, 250], per: 1, base: 1.3, coins: [[midX, 190]] },
      { name: "Medium", lanes: [70, 130, 190, 250, 310], per: 2, base: 2.1, coins: [[startX2 + 70, 110], [endX1 - 70, 270]] },
      { name: "Hard",   lanes: [55, 100, 145, 195, 245, 295, 335], per: 2, base: 2.9, coins: [[startX2 + 60, 90], [midX, 195], [endX1 - 60, 300]] },
    ];
    function buildEnemies(lv) {
      const L = LEVELS[lv], arr = [], span = endX1 - startX2;
      L.lanes.forEach((y, li) => {
        const sign = li % 2 === 0 ? 1 : -1;
        for (let k = 0; k < L.per; k++) {
          const x = startX2 + span * ((k + (li % 2 ? 0.5 : 0)) / L.per) + 30;
          arr.push({ x, y, r: 15, vx: sign * (L.base + li * 0.12), xMin: startX2 + 4, xMax: endX1 - 4 });
        }
      });
      return arr;
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
    function cleanup() { running = false; clearInterval(loop); removeEventListener("keydown", onKey); removeEventListener("keyup", onKey); }
    function loadLevel(lv) {
      level = lv; enemies = buildEnemies(lv); coins = buildCoins(lv); coinsLeft = coins.length;
      buildSprites(); resetPlayer(); updateHud();
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
      resetPlayer(); paintSprites();
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
      for (const e of enemies) { e.x += e.vx * f; if (e.x <= e.xMin) { e.x = e.xMin; e.vx = Math.abs(e.vx); } else if (e.x >= e.xMax) { e.x = e.xMax; e.vx = -Math.abs(e.vx); } }
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
      if (location.hash !== "#/test") { cleanup(); return; }
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
    $("#whg-giveup", body).addEventListener("click", () => endGame(false));
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
        // just register the pick and let them hit Next — no right/wrong reveal
        body.querySelectorAll(".polo-opt").forEach(b => b.disabled = true);
        btn.classList.add("sel");
        setAnswer(Q.opts[idx][1]);
      });
    });
  }

  /* ----------------------------------------------------------
     QUIZ VIEW (stateful sub-component)
     ---------------------------------------------------------- */
  function quizView() {
    const state = { step: -1, firstName: "", lastInitial: "", avatar: Object.assign({}, DEFAULT_AVATAR), name: "", answers: QUESTIONS.map(() => null), metrics: {}, bankPin: "", unlocked: load(LS.pin, false), done: false, score: 0, welcome: false, returningFull: "", returningSentence: "", dateStep: "" };
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
          state.step = -1; state.done = false; state.welcome = false; state.dateStep = ""; state.returningFull = ""; state.returningSentence = ""; state.answers = QUESTIONS.map(() => null); state.metrics = {}; state.bankPin = ""; paint();
        });
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

      // question step
      const i = state.step;
      const Q = QUESTIONS[i];
      const pct = Math.round((i / QUESTIONS.length) * 100);
      const chrome = Q.bare ? "" : `
          <div class="progress-rail"><div class="progress-fill" style="width:${pct}%"></div></div>
          <div class="q-count">Question ${i + 1} of ${QUESTIONS.length}</div>
          <h2 class="q-text">${Q.q}</h2>`;
      const node = el(`
        <div class="fade-in">${chrome}
          <div class="q-body"></div>
          <div class="quiz-nav quiz-nav-next">
            <button class="btn btn-primary btn-sm" id="next-btn" disabled>Next →</button>
          </div>
        </div>`);
      const qbody = $(".q-body", node);
      const setAnswer = (points, meta) => {
        state.answers[i] = points;
        if (meta) Object.assign(state.metrics, meta);
        const nb = $("#next-btn", node);
        if (nb) nb.disabled = false;
      };
      const kind = Q.kind || "choice";
      if (kind === "choice") {
        const optWrap = el(`<div class="options"></div>`);
        qbody.appendChild(optWrap);
        Q.opts.forEach((o, idx) => {
          const b = el(`<button class="option" type="button"><span class="dot"></span><span>${o[0]}</span></button>`);
          // track selection by index for visual correctness
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
      } else if (kind === "train") {
        renderTrainGame(qbody, Q, setAnswer);
      } else if (kind === "bankpin") {
        renderBankPinGame(qbody, Q, setAnswer, state);
      } else if (kind === "color") {
        renderColorGame(qbody, Q, setAnswer);
      } else if (kind === "typing") {
        renderTypingGame(qbody, Q, setAnswer);
      } else if (kind === "qebday") {
        renderQueenBdayGame(qbody, Q, setAnswer);
      } else if (kind === "polo") {
        renderPoloGame(qbody, Q, setAnswer, i + 1);
      } else if (kind === "reenterpin") {
        renderReenterPinGame(qbody, Q, setAnswer, state);
      } else if (kind === "dodge") {
        renderDodgeGame(qbody, Q, setAnswer, state.avatar);
      } else if (kind === "whg") {
        renderWhgGame(qbody, Q, setAnswer);
      }
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
      metrics: Object.assign({}, state.metrics),
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
        <button class="btn btn-primary btn-sm" data-nav="/intro">🎉 Awards Intro</button>
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
  /* ----------------------------------------------------------
     AWARDS INTRO - a "Mario Party" superlatives show. Lines every
     guest up along the bottom, then spotlights + roasts one winner
     per fun-fact award (derived from quiz metrics) before the reveal.
     ---------------------------------------------------------- */
  function buildAwards(guests) {
    const list = [];
    const hasT = g => g.metrics && typeof g.metrics.trainWatch === "number";
    const hasE = g => g.metrics && typeof g.metrics.eyeContact === "number";
    const hasD = g => g.metrics && typeof g.metrics.dodge === "number";
    const withT = guests.filter(hasT), withE = guests.filter(hasE), withD = guests.filter(hasD);
    const top = (arr, f) => arr.slice().sort((a, b) => f(b) - f(a))[0];
    const bot = (arr, f) => arr.slice().sort((a, b) => f(a) - f(b))[0];
    if (withT.length) { const g = top(withT, x => x.metrics.trainWatch); list.push({ emoji: "🚂", title: "Longest Train Stare", g, stat: `watched a looping cartoon train for <b>${g.metrics.trainWatch}s</b>`, roast: "We were genuinely worried you'd missed your stop." }); }
    if (withT.length > 1) { const g = bot(withT, x => x.metrics.trainWatch); list.push({ emoji: "⚡", title: "Quickest Draw", g, stat: `picked a train car in <b>${g.metrics.trainWatch}s</b> flat`, roast: "Didn't even watch the train go by. Are you sure you're at the right party?" }); }
    if (withE.length) { const g = top(withE, x => x.metrics.eyeContact); list.push({ emoji: "👁️", title: "The Iron Gaze", g, stat: `held eye contact for <b>${g.metrics.eyeContact}s</b> without flinching`, roast: "Nobody asked you to win this one. Please, blink." }); }
    if (withE.length > 1) { const g = bot(withE, x => x.metrics.eyeContact); list.push({ emoji: "🫣", title: "First to Crack", g, stat: `lasted <b>${g.metrics.eyeContact}s</b> of eye contact before bailing`, roast: "Honestly? The most relatable person in the room." }); }
    if (withD.length) { const g = top(withD, x => x.metrics.dodge); list.push({ emoji: "🎮", title: "Reflex Champion", g, stat: `kept their avatar alive for <b>${g.metrics.dodge}s</b>`, roast: "Unsettling hand-eye control. We see those gamer hours." }); }
    const won = guests.filter(g => g.metrics && g.metrics.whgWon === 1 && typeof g.metrics.whgDeaths === "number");
    if (won.length) { const g = bot(won, x => x.metrics.whgDeaths); list.push({ emoji: "🟥", title: "Ice in the Veins", g, stat: `beat the World's Hardest Game with just <b>${g.metrics.whgDeaths}</b> death${g.metrics.whgDeaths === 1 ? "" : "s"}`, roast: "Most people rage-quit. You went quiet and locked in. Terrifying." }); }
    if (guests.length) { const g = guests.slice().sort((a, b) => Math.abs(a.score - 50) - Math.abs(b.score - 50))[0]; list.push({ emoji: "🎯", title: "Dead Center", g, stat: `landed at exactly <b>${g.score}/100</b>`, roast: "The living embodiment of 'well… it's a spectrum.'" }); }
    return list;
  }

  let awardsKeyHandler = null;
  route("/intro", function () {
    if (load(LS.auth, false) !== true) return adminGate();
    const guests = store.approved();
    const awards = buildAwards(guests);
    let awardIdx = 0;
    const root = wrapDiv(`<section class="section fade-in"><div class="wrap">
      <h2 class="section-title">🎉 The Awards Show</h2>
      <p class="section-sub">A few superlatives before we crown the most autistic among us. Brace yourselves. 🏆</p>
      <div class="award-stage" id="award-stage"></div>
      <div class="award-roster" id="award-roster"></div>
      <div class="present-controls">
        <button class="btn btn-ghost btn-sm" id="aw-back">← Back</button>
        <span class="present-count" id="aw-count"></span>
        <button class="btn btn-primary" id="aw-next">Next award →</button>
      </div>
    </div></section>`);
    const stageEl = $("#award-stage", root), rosterEl = $("#award-roster", root);
    const countEl = $("#aw-count", root), nextBtn = $("#aw-next", root), backBtn = $("#aw-back", root);

    if (!guests.length || !awards.length) {
      stageEl.innerHTML = `<div class="placeholder">No approved guests yet.<br>Approve some in the <b>Admin</b> queue first.</div>`;
      nextBtn.disabled = true;
      backBtn.addEventListener("click", () => navigate("/admin"));
      return root;
    }

    // line everyone up along the bottom
    rosterEl.innerHTML = guests.map((g, i) =>
      `<div class="roster-toon" data-i="${i}"><span class="avchip" style="width:54px;height:54px">${avatarSVG(g.avatar)}</span><div class="roster-name">${esc(g.firstName || g.name)}</div></div>`
    ).join("");
    const toons = Array.from(rosterEl.querySelectorAll(".roster-toon"));

    function showAward(n) {
      const a = awards[n], wi = guests.indexOf(a.g);
      stageEl.innerHTML = `<div class="award-card fade-in">
        <div class="award-kicker">${a.emoji} Award ${n + 1} of ${awards.length}</div>
        <div class="award-title">${esc(a.title)}</div>
        <div class="award-winner">
          <span class="avchip" style="width:118px;height:118px">${avatarSVG(a.g.avatar)}</span>
          <div class="award-name">${esc(a.g.name)}</div>
        </div>
        <div class="award-stat">${a.stat}</div>
        <div class="award-roast">“${esc(a.roast)}”</div>
      </div>`;
      toons.forEach((t, i) => { t.classList.toggle("spotlight", i === wi); t.classList.toggle("dim", i !== wi); });
      if (toons[wi]) toons[wi].scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
      countEl.textContent = `${n + 1} / ${awards.length}`;
      nextBtn.textContent = n >= awards.length - 1 ? "Start the Reveal →" : "Next award →";
      confetti.burst(70);
    }
    function go(delta) {
      if (awardIdx >= awards.length - 1 && delta > 0) { navigate("/present"); return; }
      if (awardIdx <= 0 && delta < 0) { navigate("/admin"); return; }
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

    setTimeout(() => showAward(0), 30);
    return root;
  });

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
    const topTwoStart = guests.length - 2; // 2nd place index; 1st = topTwoStart+1
    function updateUI() {
      dots.forEach((d, i) => d.classList.toggle("current", i === presentRevealed - 1));
      const done = presentRevealed >= guests.length;
      revealBtn.disabled = done;
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
    function renderFinaleBoth() {
      const second = guests[guests.length - 2], first = guests[guests.length - 1];
      const ts = tierFor(second.score), tf = tierFor(first.score);
      stage.innerHTML = `<div class="fade-in finale-both">
        <div class="finale-both-grid">
          <div class="finale-col second">
            <div class="finale-medal">🥈</div>
            <div class="finale-place">2nd Most Autistic</div>
            <span class="avchip" style="width:92px;height:92px">${avatarSVG(second.avatar)}</span>
            <div class="name">${esc(second.name)}</div>
            <div class="tier">${ts.emoji} ${ts.name} · <b>${second.score}</b>/100</div>
          </div>
          <div class="finale-col first">
            <div class="finale-medal">👑</div>
            <div class="finale-place">THE MOST AUTISTIC</div>
            <span class="avchip" style="width:112px;height:112px">${avatarSVG(first.avatar)}</span>
            <div class="name">${esc(first.name)}</div>
            <div class="tier">${tf.emoji} ${tf.name} · <b>${first.score}</b>/100</div>
          </div>
        </div>
      </div>`;
    }
    function updateStage() {
      // both finalists already out → keep them side by side
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
        const rect = graph.getBoundingClientRect();
        confetti.burst(170, rect.left + rect.width * (guests[second].score / 100));
        confetti.burst(290, rect.left + rect.width * (guests[first].score / 100));
      });
    }

    revealBtn.addEventListener("click", reveal);
    $("#reset-btn", root).addEventListener("click", () => {
      presentRevealed = 0;
      dots.forEach(d => d.classList.remove("show", "current"));
      updateStage(); updateUI();
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
