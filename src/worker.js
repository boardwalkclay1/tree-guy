import * as MapLogic from "./work-map.js";
import * as CalendarLogic from "./work-calendar.js";
import * as ContractLogic from "./work-contracts.js";
import * as RadioLogic from "./work-radio.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // MAP
    if (path.startsWith("/api/map")) {
      return MapLogic.handle(request, env);
    }

    // CALENDAR
    if (path.startsWith("/api/calendar")) {
      return CalendarLogic.handle(request, env);
    }

    // CONTRACTS
    if (path.startsWith("/api/contracts")) {
      return ContractLogic.handle(request, env);
    }

    // RADIO (signaling + presence)
    if (path.startsWith("/api/radio")) {
      return RadioLogic.handle(request, env);
    }

    return new Response("Not found", { status: 404 });
  }
};
