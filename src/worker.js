import * as MapLogic from "./work-map.js";
import * as CalendarLogic from "./work-calendar.js";
import * as ContractLogic from "./work-contracts.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path.startsWith("/api/map")) {
      return MapLogic.handle(request, env);
    }

    if (path.startsWith("/api/calendar")) {
      return CalendarLogic.handle(request, env);
    }

    if (path.startsWith("/api/contracts")) {
      return ContractLogic.handle(request, env);
    }

    return new Response("Not found", { status: 404 });
  }
};
