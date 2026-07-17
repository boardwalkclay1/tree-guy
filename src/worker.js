import * as MapLogic from "./work-map.js";
import * as CalendarLogic from "./work-calendar.js";
import * as ContractLogic from "./work-contracts.js";
import * as RadioLogic from "./work-radio.js";
import * as WeatherLogic from "./work-weather.js";
import * as CustomerLogic from "./work-customers.js";
import * as JobLogic from "./work-jobs.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // MAP
    if (path.startsWith("/rtg/api/map")) {
      return MapLogic.handle(request, env);
    }

    // CALENDAR
    if (path.startsWith("/rtg/api/calendar")) {
      return CalendarLogic.handle(request, env);
    }

    // CONTRACTS
    if (path.startsWith("/rtg/api/contracts")) {
      return ContractLogic.handle(request, env);
    }

    // RADIO (signaling + presence)
    if (path.startsWith("/rtg/api/radio")) {
      return RadioLogic.handle(request, env);
    }

    // WEATHER
    if (path.startsWith("/rtg/api/weather")) {
      return WeatherLogic.handle(request, env);
    }

    // CUSTOMERS
    if (path.startsWith("/rtg/api/customers")) {
      return CustomerLogic.handle(request, env);
    }

    // JOBS
    if (path.startsWith("/rtg/api/jobs")) {
      return JobLogic.handle(request, env);
    }

    // STATIC ASSETS (JS, CSS, IMAGES, HTML)
    return env.ASSETS.fetch(request);
  }
};
