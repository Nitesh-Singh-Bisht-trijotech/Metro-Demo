import * as mock from "./mockApi";
import * as live from "./liveApi";

const api = import.meta.env.VITE_USE_MOCK === "true" ? mock : live;

export const {
  fetchStations, planJourney, calculateFare, getStationDetails,
  getServiceStatus, bookTicket, reportLostItem, getHelpContacts,
  askChetna, askChetnaStream,
} = api;