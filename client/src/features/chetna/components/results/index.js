import AckResult from "./AckResult";
import FareResult from "./FareResult";
import HelpResult from "./HelpResult";
import JourneyResult from "./JourneyResult";
import StationResult from "./StationResult";
import StatusResult from "./StatusResult";
import TicketResult from "./TicketResult";

// keys match `result` in config/flows.js
export const RESULTS = {
  journey: JourneyResult,
  fare: FareResult,
  station: StationResult,
  status: StatusResult,
  ticket: TicketResult,
  lostfound: AckResult,
  help: HelpResult,
};