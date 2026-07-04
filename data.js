// Each question option contributes to 4 axes (0..10 scale)
// axes: risk (appetite for loss), conviction (long-term belief vs momentum),
//       horizon (patience: short..long), thrill (chase novelty vs stability)

const QUESTIONS = [
  {
    prompt: "your portfolio drops 40% overnight. you:",
    hint: "be honest.",
    options: [
      { label: "buy more. red is a sale.",              axes: { risk: 9, conviction: 8, horizon: 8, thrill: 6 } },
      { label: "hold. check back in a month.",           axes: { risk: 5, conviction: 8, horizon: 9, thrill: 2 } },
      { label: "sell half to stop the bleeding.",        axes: { risk: 4, conviction: 3, horizon: 4, thrill: 3 } },
      { label: "panic sell everything at 3am.",          axes: { risk: 2, conviction: 1, horizon: 1, thrill: 4 } }
    ]
  },
  {
    prompt: "what's your relationship with a spreadsheet?",
    hint: "choose the closest.",
    options: [
      { label: "i model my own DCF for fun.",            axes: { risk: 5, conviction: 9, horizon: 9, thrill: 2 } },
      { label: "i track net worth monthly.",             axes: { risk: 5, conviction: 7, horizon: 8, thrill: 3 } },
      { label: "i know where my checking account is.",   axes: { risk: 4, conviction: 4, horizon: 5, thrill: 4 } },
      { label: "vibes only. money is imaginary.",        axes: { risk: 8, conviction: 2, horizon: 2, thrill: 9 } }
    ]
  },
  {
    prompt: "pick a saturday.",
    hint: "no wrong answers. mostly.",
    options: [
      { label: "reading a 40-page whitepaper.",          axes: { risk: 4, conviction: 9, horizon: 9, thrill: 2 } },
      { label: "skydiving with strangers.",              axes: { risk: 10, conviction: 3, horizon: 2, thrill: 10 } },
      { label: "tinkering with a side project.",         axes: { risk: 6, conviction: 7, horizon: 7, thrill: 6 } },
      { label: "couch. show. no thoughts.",              axes: { risk: 2, conviction: 5, horizon: 6, thrill: 1 } }
    ]
  },
  {
    prompt: "a friend pitches you a coin named after a frog.",
    hint: "volume: high. fundamentals: unclear.",
    options: [
      { label: "i'm in for whatever i can afford to lose.", axes: { risk: 10, conviction: 2, horizon: 1, thrill: 10 } },
      { label: "send me the chart. maybe a small bag.",     axes: { risk: 7, conviction: 3, horizon: 3, thrill: 8 } },
      { label: "i'll watch, not touch.",                    axes: { risk: 3, conviction: 6, horizon: 6, thrill: 4 } },
      { label: "unsubscribing from this friendship.",       axes: { risk: 1, conviction: 8, horizon: 9, thrill: 1 } }
    ]
  },
  {
    prompt: "what do you think about banks?",
    hint: "vibes-based answer is fine.",
    options: [
      { label: "broken. we need to replace them.",        axes: { risk: 7, conviction: 9, horizon: 8, thrill: 6 } },
      { label: "fine, but the rails should be programmable.", axes: { risk: 5, conviction: 8, horizon: 8, thrill: 5 } },
      { label: "they work. i just want lower fees.",      axes: { risk: 3, conviction: 5, horizon: 6, thrill: 3 } },
      { label: "no opinion. i just want number go up.",   axes: { risk: 6, conviction: 2, horizon: 2, thrill: 8 } }
    ]
  },
  {
    prompt: "time horizon on this money?",
    hint: "the one you're about to deploy.",
    options: [
      { label: "10+ years. i'll forget the password on purpose.", axes: { risk: 6, conviction: 10, horizon: 10, thrill: 2 } },
      { label: "3-5 years. i can sit through cycles.",     axes: { risk: 6, conviction: 8, horizon: 8, thrill: 3 } },
      { label: "6-18 months. i want to see something.",   axes: { risk: 6, conviction: 5, horizon: 4, thrill: 6 } },
      { label: "this week. i have plans.",                axes: { risk: 8, conviction: 2, horizon: 1, thrill: 9 } }
    ]
  },
  {
    prompt: "which of these gets you the most fired up?",
    hint: "gut, not head.",
    options: [
      { label: "digital gold. scarcity. forever.",        axes: { risk: 5, conviction: 10, horizon: 10, thrill: 3 } },
      { label: "apps. developers. building on-chain.",    axes: { risk: 6, conviction: 9, horizon: 8, thrill: 5 } },
      { label: "speed, memes, and money moving fast.",    axes: { risk: 8, conviction: 5, horizon: 3, thrill: 9 } },
      { label: "boring stablecoins. rails that just work.", axes: { risk: 2, conviction: 7, horizon: 7, thrill: 1 } }
    ]
  },
  {
    prompt: "pick your energy.",
    hint: "last one.",
    options: [
      { label: "stoic. glacial. long game.",              axes: { risk: 4, conviction: 9, horizon: 10, thrill: 2 } },
      { label: "curious builder. always tinkering.",      axes: { risk: 6, conviction: 8, horizon: 7, thrill: 5 } },
      { label: "degen. terminally online. no sleep.",     axes: { risk: 10, conviction: 3, horizon: 2, thrill: 10 } },
      { label: "careful. skeptical. show me proof.",      axes: { risk: 3, conviction: 6, horizon: 8, thrill: 2 } }
    ]
  }
];

// Coin profiles — "ideal" axis scores. Match distance = closeness to user vector.
const COINS = [
  {
    id: "bitcoin", symbol: "BTC", name: "Bitcoin",
    tag: "digital gold · store of value",
    axes: { risk: 5, conviction: 10, horizon: 10, thrill: 3 },
    blurb: "you're wired for patience. bitcoin rewards people who can sit through cycles, ignore noise, and treat volatility as weather. you don't need to trade\u2014you need to hold.",
    traits: [
      "long horizon, high conviction, low need for novelty",
      "you'd rather be right in 10 years than clever this week",
      "comfort with volatility as long as the thesis is intact"
    ]
  },
  {
    id: "ethereum", symbol: "ETH", name: "Ethereum",
    tag: "world computer · programmable rails",
    axes: { risk: 6, conviction: 9, horizon: 8, thrill: 5 },
    blurb: "you like systems. ethereum is a bet on developers, apps, and infrastructure\u2014not on any single token narrative. you want an asset that compounds through use, not hype.",
    traits: [
      "medium-high conviction with real curiosity about how things work",
      "tolerant of change (upgrades, forks, rewrites)",
      "long-ish horizon with occasional tactical moves"
    ]
  },
  {
    id: "solana", symbol: "SOL", name: "Solana",
    tag: "high-throughput L1 · speed maxi",
    axes: { risk: 7, conviction: 7, horizon: 6, thrill: 7 },
    blurb: "you like fast, and you like things that ship. solana matches builder-energy with degen adjacency\u2014it moves quickly, breaks occasionally, and rewards conviction with volatility.",
    traits: [
      "comfortable with drawdowns if the ecosystem is alive",
      "prefer momentum over dogma",
      "attracted to speed, memes, and real apps at once"
    ]
  },
  {
    id: "chainlink", symbol: "LINK", name: "Chainlink",
    tag: "oracle infra · picks-and-shovels",
    axes: { risk: 5, conviction: 8, horizon: 8, thrill: 3 },
    blurb: "you're the person reading the whitepaper while everyone else screenshots charts. chainlink is a bet on the boring plumbing every serious protocol needs. patient. unsexy. essential.",
    traits: [
      "analytical, allergic to hype cycles",
      "look for infra that survives multiple narratives",
      "willing to be early and quiet"
    ]
  },
  {
    id: "ripple", symbol: "XRP", name: "XRP",
    tag: "payments rails · institutional lean",
    axes: { risk: 5, conviction: 6, horizon: 6, thrill: 4 },
    blurb: "you want crypto exposure without full-degen exposure. xrp is a bet on cross-border payments and institutions actually using this stuff. steady thesis, familiar shape.",
    traits: [
      "pragmatic about regulation and adoption",
      "prefer specific use-cases over sweeping visions",
      "okay being the least exciting one at the table"
    ]
  },
  {
    id: "cardano", symbol: "ADA", name: "Cardano",
    tag: "academic · peer-reviewed L1",
    axes: { risk: 4, conviction: 7, horizon: 9, thrill: 2 },
    blurb: "you like proof. cardano's whole personality is 'we published a paper.' if you want a slow, deliberate, research-heavy project with a long horizon, this matches your patience.",
    traits: [
      "skeptical of ship-fast-break-things culture",
      "comfortable being early and waiting years",
      "low thrill-seeking; high thoroughness"
    ]
  },
  {
    id: "avalanche-2", symbol: "AVAX", name: "Avalanche",
    tag: "L1 · subnets · enterprise-flavored",
    axes: { risk: 6, conviction: 7, horizon: 7, thrill: 5 },
    blurb: "you want the ambition of ethereum with the tempo of solana, minus the tribalism. avalanche is a bet on modular chains and enterprise pilots that don't announce themselves.",
    traits: [
      "you like optionality (subnets, custom chains)",
      "comfortable with medium risk if the roadmap is legible",
      "you don't need the loudest ecosystem"
    ]
  },
  {
    id: "dogecoin", symbol: "DOGE", name: "Dogecoin",
    tag: "meme · culture · chaos-native",
    axes: { risk: 9, conviction: 3, horizon: 2, thrill: 10 },
    blurb: "you understand that in this market, narrative is fundamentals. doge is a bet on internet culture, elon posting, and the fact that memes move faster than balance sheets. only bring what you can laugh about losing.",
    traits: [
      "high thrill, short horizon, low tolerance for boredom",
      "you'd rather be entertained than early",
      "vibes-driven position sizing"
    ]
  },
  {
    id: "pepe", symbol: "PEPE", name: "Pepe",
    tag: "pure memecoin · max chaos",
    axes: { risk: 10, conviction: 2, horizon: 1, thrill: 10 },
    blurb: "you are the reason the phrase 'position sizing' exists. pepe is not an investment; it's a lottery ticket with a frog on it. matched to you because your risk dial is stuck at max and you know it.",
    traits: [
      "terminal risk appetite, terminally online",
      "treat losses as content",
      "you already know the disclaimer"
    ]
  },
  {
    id: "tether", symbol: "USDT", name: "Tether (USDT)",
    tag: "stablecoin · dollar rails",
    axes: { risk: 1, conviction: 6, horizon: 6, thrill: 1 },
    blurb: "you're not looking for a rocket. you want programmable dollars, low drama, and the option to move fast when something real shows up. cash-equivalent with keyboard shortcuts.",
    traits: [
      "prioritize capital preservation over upside",
      "want optionality without exposure",
      "comfort > excitement, always"
    ]
  }
];

window.QUESTIONS = QUESTIONS;
window.COINS = COINS;
