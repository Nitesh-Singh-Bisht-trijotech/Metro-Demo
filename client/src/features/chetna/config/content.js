export const LANGS = {
  en: { label: "En", speech: "en-IN" },
  hi: { label: "हि", speech: "hi-IN" },
};

export const STRINGS = {
  en: {
    placeholder: "Type or use mic to ask a query…",
    book: "Book your ticket online",
    talk: "Talk to Chetna",
    chat: "Chat with Chetna",
    back: "Back to menu",
    refresh: "Clear chat and refresh session",
    close: "Close chat",
  },
  hi: {
    placeholder: "प्रश्न लिखें या माइक का उपयोग करें…",
    book: "ऑनलाइन टिकट बुक करें",
    talk: "चेतना से बात करें",
    chat: "चेतना से चैट करें",
    back: "मेन्यू पर वापस",
    refresh: "चैट साफ़ करें और नया सत्र शुरू करें",
    close: "चैट बंद करें",
  },
};

export const SLIDES = [
  { id: 1, title: "Plan any trip in seconds", sub: "Routes, fares and timings in one chat", bg: "from-sky-700 via-blue-700 to-indigo-900" },
  { id: 2, title: "Tap in with NCMC", sub: "One card for metro, bus and more", bg: "from-emerald-600 via-teal-700 to-cyan-900" },
  { id: 3, title: "Get the Sarthi app", sub: "Tickets and live updates on your phone", bg: "from-rose-600 via-red-700 to-red-900" },
  { id: 4, title: "Travel safe, stay informed", sub: "Check live line status before you leave", bg: "from-violet-600 via-purple-700 to-indigo-900" },
];

export const QUICK_PROMPTS = {
  journey: "Help me plan a journey",
  fare: "I want to calculate a fare",
  station: "Tell me about a station",
  status: "What is the current service status?",
  lostfound: "I lost something in the metro",
  help: "How can I contact the helpdesk?",
  ticket: "I want to book a ticket",
};

export const CALL_TEXT = {
  en: {
    greeting: "Hello, this is Chetna from Delhi Metro. How can I help you today?",
    error: "Sorry, I'm having trouble connecting right now. Please try again.",
    empty: "Sorry, I didn't catch that. Could you say it again?",
    micBlocked: "Microphone access is blocked. Allow it in your browser's address bar and try again.",
  },
  hi: {
    greeting: "नमस्ते, मैं दिल्ली मेट्रो की चेतना बोल रही हूँ। मैं आपकी क्या मदद कर सकती हूँ?",
    error: "क्षमा करें, अभी कनेक्ट करने में समस्या हो रही है। कृपया दोबारा कोशिश करें।",
    empty: "क्षमा करें, मैं समझ नहीं पाई। कृपया दोबारा बोलें।",
    micBlocked: "माइक्रोफ़ोन की अनुमति बंद है। ब्राउज़र के एड्रेस बार में अनुमति दें और दोबारा कोशिश करें।",
  },
};