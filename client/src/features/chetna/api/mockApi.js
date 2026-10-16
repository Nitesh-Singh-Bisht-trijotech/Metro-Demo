/**
 * Dummy API layer for Chetna.
 * Every function is async, waits a random 0.5–1s, and returns plain JSON,
 * so replacing one with a real `fetch()` call later is a one-function change.
 */
const wait = (min = 500, spread = 500) =>
  new Promise((resolve) => setTimeout(resolve, min + Math.random() * spread));

export const LINES = {
  red: { name: "Red Line", color: "#d32f2f" },
  yellow: { name: "Yellow Line", color: "#e0a800" },
  blue: { name: "Blue Line", color: "#1e63d6" },
  green: { name: "Green Line", color: "#2e9d4a" },
  violet: { name: "Violet Line", color: "#7b3fa0" },
  pink: { name: "Pink Line", color: "#e86aa6" },
  magenta: { name: "Magenta Line", color: "#c2188a" },
  grey: { name: "Grey Line", color: "#8a8f98" },
  airport: { name: "Airport Express", color: "#f08a24" },
  aqua: { name: "Aqua Line", color: "#14a9b4" },
  rapid: { name: "Rapid Metro", color: "#3b4cc0" },
};

// station → lines it serves (stations with 2+ lines act as interchanges)
const STATION_DB = {
  Rithala: ["red"],
  Pitampura: ["red"],
  "Netaji Subhash Place": ["red", "pink"],
  "Kanhaiya Nagar": ["red"],
  Inderlok: ["red", "green"],
  "Pratap Nagar": ["red"],
  "Pul Bangash": ["red"],
  "Tis Hazari": ["red"],
  "Kashmere Gate": ["red", "yellow", "violet"],
  "Shastri Park": ["red"],
  Welcome: ["red", "pink"],
  "Dilshad Garden": ["red"],
  "Vidhan Sabha": ["yellow"],
  "Civil Lines": ["yellow"],
  "Chandni Chowk": ["yellow"],
  "New Delhi": ["yellow", "airport"],
  "Rajiv Chowk": ["yellow", "blue"],
  "Central Secretariat": ["yellow", "violet"],
  "Hauz Khas": ["yellow", "magenta"],
  Saket: ["yellow"],
  "Qutab Minar": ["yellow"],
  "Huda City Centre": ["yellow"],
  "Dwarka Sector 21": ["blue", "airport"],
  "Mandi House": ["blue", "violet"],
  "Yamuna Bank": ["blue"],
  Akshardham: ["blue"],
  "Noida Sector 18": ["blue", "aqua"],
  "Lal Qila": ["violet"],
  ITO: ["violet"],
  "Lajpat Nagar": ["violet", "pink"],
  "Kalkaji Mandir": ["violet", "magenta"],
  "Escorts Mujesar": ["violet"],
  "Delhi Aerocity": ["airport"],
};

const FACILITIES = ["Lift", "Escalator", "Parking", "Accessible toilets", "Feeder bus", "Cloak room", "ATM"];

// ───────── helpers ─────────
const hashOf = (s) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const FARE_SLABS = [[2, 11], [5, 21], [12, 32], [21, 43], [32, 54], [Infinity, 64]];
const fareFor = (km) => FARE_SLABS.find(([max]) => km <= max)[1];

const pairMetrics = (from, to) => {
  const h = hashOf([from, to].sort().join("|"));
  const distanceKm = Math.round((2.5 + (h % 340) / 10) * 10) / 10;
  return {
    distanceKm,
    stops: Math.max(2, Math.round(distanceKm / 1.1) + 1),
    durationMin: Math.round(distanceKm * 2.1 + 4),
    fare: fareFor(distanceKm),
  };
};

const assertStation = (name) => {
  if (!STATION_DB[name]) throw new Error(`Unknown station: ${name}`);
};

const buildLegs = (from, to, stops) => {
  const lf = STATION_DB[from];
  const lt = STATION_DB[to];
  const common = lf.find((l) => lt.includes(l));
  if (common) return [{ line: LINES[common], from, to, stops }];

  const hubName =
    Object.keys(STATION_DB).find((n) => {
      const ls = STATION_DB[n];
      return ls.some((l) => lf.includes(l)) && ls.some((l) => lt.includes(l));
    }) ?? "Rajiv Chowk";
  const hl = STATION_DB[hubName];
  const l1 = hl.find((l) => lf.includes(l)) ?? lf[0];
  const l2 = hl.find((l) => lt.includes(l) && l !== l1) ?? lt[0];
  const first = Math.ceil(stops / 2);
  return [
    { line: LINES[l1], from, to: hubName, stops: first },
    { line: LINES[l2], from: hubName, to, stops: stops - first },
  ];
};

// ───────── endpoints ─────────
export async function fetchStations() {
  await wait(200, 200);
  return Object.keys(STATION_DB).sort();
}

export async function planJourney({ from, to, filter }) {
  await wait();
  assertStation(from);
  assertStation(to);
  const m = pairMetrics(from, to);
  const legs = buildLegs(from, to, m.stops);
  return { from, to, filter, ...m, legs, interchanges: legs.length - 1 };
}

export async function calculateFare({ from, to }) {
  await wait();
  assertStation(from);
  assertStation(to);
  const { distanceKm, fare } = pairMetrics(from, to);
  return {
    from,
    to,
    distanceKm,
    token: fare,
    smartCard: Math.round(fare * 0.9),
    offPeakCard: Math.round(fare * 0.8),
  };
}

export async function getStationDetails({ station }) {
  await wait();
  assertStation(station);
  const h = hashOf(station);
  const facilities = FACILITIES.filter((f, i) => i < 2 || (h >> i) & 1);
  const lines = STATION_DB[station].map((k) => LINES[k]);
  return {
    name: station,
    lines,
    interchange: lines.length > 1,
    gates: 2 + (h % 4),
    platforms: 2,
    firstTrain: "05:30",
    lastTrain: "23:30",
    facilities,
  };
}

export async function getServiceStatus() {
  await wait();
  const lines = Object.entries(LINES).map(([key, line]) => ({
    ...line,
    status: key === "yellow" ? "delayed" : "normal",
    note:
      key === "yellow"
        ? "Minor delays between Kashmere Gate and Civil Lines."
        : "Running as per schedule.",
  }));
  return {
    updatedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    lines,
  };
}

export async function bookTicket({ from, to, passengers }) {
  await wait(800, 600);
  assertStation(from);
  assertStation(to);
  const { fare, distanceKm } = pairMetrics(from, to);
  return {
    bookingId: `DM${Date.now().toString(36).toUpperCase()}`,
    from,
    to,
    passengers,
    distanceKm,
    fare,
    total: fare * passengers,
    validUntil: new Date(Date.now() + 2 * 3600e3).toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short",
    }),
  };
}

export async function reportLostItem({ station, item, phone }) {
  await wait();
  return {
    reference: `LF-${Date.now().toString(36).toUpperCase()}`,
    station,
    item,
    phone: `******${phone.slice(-4)}`,
  };
}

export async function getHelpContacts() {
  await wait(300, 300);
  return {
    helpline: "155370",
    email: "feedback@dmrc.example",
    hours: "24 hours, all days",
  };
}

/** Tiny keyword "NLU" so free-text queries can route into flows. */
export async function askChetna(query, lang = "en") {
  await wait(500, 400);
  const q = query.toLowerCase();
  const t = (en, hi) => (lang === "hi" ? hi : en);

  const rules = [
    [/\b(hi|hello|hey|namaste)\b/, null, t("Hello! I'm Chetna. How can I help you today?", "नमस्ते! मैं चेतना हूँ। मैं आपकी कैसे मदद कर सकती हूँ?")],
    [/fare|price|cost|charge|kitna/, "fare", t("Sure, let's check the fare.", "ज़रूर, किराया देखते हैं।")],
    [/route|journey|reach|travel|plan/, "journey", t("Let's plan your journey.", "चलिए आपकी यात्रा की योजना बनाते हैं।")],
    [/ticket|book|qr/, "ticket", t("I can book that for you.", "मैं आपके लिए बुक कर देती हूँ।")],
    [/status|delay|running|disrupt/, "status", t("Checking the live status.", "लाइव स्थिति देखती हूँ।")],
    [/station|gate|facility|lift|parking/, "station", t("Let me look up that station.", "मैं वह स्टेशन देखती हूँ।")],
    [/lost|found|left behind|forgot/, "lostfound", t("I'm sorry to hear that. Let's file a report.", "यह सुनकर दुख हुआ। चलिए रिपोर्ट दर्ज करें।")],
    [/help|contact|helpline|complaint|feedback/, "help", t("Here is how to reach us.", "हमसे संपर्क करने का तरीका यह है।")],
  ];

  for (const [re, flow, reply] of rules) {
    if (re.test(q)) return { reply, flow };
  }

  return {
    reply: t(
      "I'm not sure I got that. Here are some things I can help with:",
      "मैं समझ नहीं पाई। मैं इनमें मदद कर सकती हूँ:"
    ),
    suggestions: [
      { label: "Journey Planner", flow: "journey" },
      { label: "Calculate Fare", flow: "fare" },
      { label: "Service Status", flow: "status" },
    ],
  };
}

export async function askChetnaStream(query, { lang = "en", onToken } = {}) {
  const res = await askChetna(query, lang);
  onToken?.(res.reply);
  return res;
}

export function resetSession() {
  return "mock-session-reset";
}