// weather.js
import { Location } from "./location.js";
import { WeatherFetch } from "./fetch.js";
import { WindLogic } from "./wind.js";
import { PressureLogic } from "./pressure.js";
import { StormLogic } from "./storm.js";
import { HazardLogic } from "./hazard.js";
import { WeatherUI } from "./ui.js";

async function initWeather() {
    const loc = await Location.getActiveLocation();
    if (!loc) return alert("Unable to get location");

    const data = await WeatherFetch.getWeather(loc.lat, loc.lon);

    const current = data.current;
    const hourly = data.hourly;

    const wind = WindLogic.analyze(current);
    const pressure = PressureLogic.analyze(current, hourly);
    const storm = StormLogic.compute({ wind, pressure, hourly });
    const hazard = HazardLogic.compute({ wind, pressure });

    WeatherUI.updateCurrent(current);
    WeatherUI.updateWind(wind);
    WeatherUI.updatePressure(pressure);
    WeatherUI.updateStorm(storm);
    WeatherUI.updateHazard(hazard);
}

initWeather();
