import {
    BusFront,
    Headphones,
    IndianRupee,
    Luggage,
    SearchCheck,
    TrainFront,
} from "lucide-react";
import {
    bookTicket,
    calculateFare,
    getHelpContacts,
    getServiceStatus,
    getStationDetails,
    planJourney,
    reportLostItem,
} from "../api/chetnaApi";

const differentStations = ({ from, to }) =>
    from.toLowerCase() === to.toLowerCase() ? "Please choose two different stations." : "";

const FROM_TO = [
    { name: "from", label: "From", type: "station" },
    { name: "to", label: "To", type: "station" },
];

/**
 * One entry per Chetna capability.
 *  fields     → rendered by <FlowForm/> (empty = runs immediately)
 *  submit     → the (dummy) API call
 *  result     → key into results/index.js
 *  tile       → look of the menu tile (omit to hide from the menu)
 */
export const FLOWS = {
    journey: {
        label: "Journey Planner",
        intro: "Tell me where you're travelling and I'll find the best route.",
        fields: [
            ...FROM_TO,
            {
                name: "filter",
                label: "Route preference",
                type: "select",
                default: "shortest",
                options: [
                    { value: "shortest", label: "Shortest route" },
                    { value: "interchange", label: "Minimum interchange" },
                ],
            },
        ],
        validate: differentStations,
        submit: planJourney,
        summarize: (v) => `${v.from} to ${v.to}`,
        result: "journey",
        tile: { icon: Luggage, bg: "bg-orange-100", fg: "text-orange-500" },
    },

    fare: {
        label: "Calculate Fare",
        intro: "Pick your stations and I'll calculate the fare.",
        fields: FROM_TO,
        validate: differentStations,
        submit: calculateFare,
        summarize: (v) => `Fare from ${v.from} to ${v.to}`,
        result: "fare",
        tile: { icon: IndianRupee, bg: "bg-green-100", fg: "text-green-700" },
    },

    station: {
        label: "Station Details",
        intro: "Which station would you like to know about?",
        fields: [{ name: "station", label: "Station", type: "station" }],
        submit: getStationDetails,
        summarize: (v) => v.station,
        result: "station",
        tile: { icon: TrainFront, bg: "bg-sky-100", fg: "text-sky-700" },
    },

    status: {
        label: "Service Status",
        intro: "Fetching the live status of all lines…",
        fields: [],
        submit: getServiceStatus,
        summarize: () => "Service status",
        result: "status",
        tile: { icon: BusFront, bg: "bg-yellow-100", fg: "text-yellow-600" },
    },

    ticket: {
        label: "Book your ticket online",
        intro: "Where would you like to travel? I'll generate a QR ticket.",
        fields: [
            ...FROM_TO,
            { name: "passengers", label: "Passengers", type: "number", min: 1, max: 6, default: 1 },
        ],
        validate: differentStations,
        submit: bookTicket,
        summarize: (v) => `${v.passengers} ticket${v.passengers > 1 ? "s" : ""}: ${v.from} to ${v.to}`,
        result: "ticket",
    },

    lostfound: {
        label: "Lost & Found",
        intro: "Share a few details and I'll file a report with the station.",
        fields: [
            { name: "station", label: "Station where you lost it", type: "station" },
            { name: "item", label: "What did you lose?", type: "text", placeholder: "e.g. Black backpack" },
            { name: "phone", label: "Mobile number", type: "text", placeholder: "10-digit number" },
        ],
        validate: ({ phone }) => (/^\d{10}$/.test(phone) ? "" : "Enter a valid 10-digit mobile number."),
        submit: reportLostItem,
        summarize: (v) => `Lost ${v.item} at ${v.station}`,
        result: "lostfound",
        tile: { icon: SearchCheck, bg: "bg-pink-100", fg: "text-pink-600" },
    },

    help: {
        label: "Help & Contact",
        intro: "Here's how to reach the Delhi Metro helpdesk.",
        fields: [],
        submit: getHelpContacts,
        summarize: () => "Help & contact",
        result: "help",
        tile: { icon: Headphones, bg: "bg-violet-100", fg: "text-violet-600" },
    },
};

export const TILE_ORDER = ["journey", "fare", "station", "status", "lostfound", "help"];