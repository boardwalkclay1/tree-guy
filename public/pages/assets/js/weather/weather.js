// weather.js
import { Location } from "./location.js";
import { WindLogic } from "./wind.js";
import { PressureLogic } from "./pressure.js";
import { StormLogic } from "./storm.js";
import { HazardLogic } from "./hazard.js";
import { WeatherUI } from "./ui.js";

async function fetchWorkerWeather(lat, lon) {
    try {
        const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`, {
            headers: {
                "Content-Type": "application/json",
                "X-RTG-User": localStorage.getItem("rtgUserId") || "dev",
                "X-RTG-Email": localStorage.getItem("rtgUserEmail") || "dev@local",
                "X-RTG-Type": localStorage.getItem("rtgUserType") || "tree"
            }
        });

        const text = await res.text();

        // Prevent "<!DOCTYPE" crash
        try {
            return JSON.parse(text);
        } catch {
            console.warn("Weather worker returned non‑JSON:", text.slice(0, 200));
            return null;
        }
    } catch (err) {
        console.error("Weather worker fetch failed:", err);
        return null;
    }
}

async function initWeather() {
    // 1. Get location from D1 weather profile or GPS fallback
    const loc = await Location.getActiveLocation();
    if (!loc) {
        alert("Unable to get location");
        return;
    }

    // 2. Fetch weather from YOUR Worker (NOT Open‑Meteo directly)
    const data = await fetchWorkerWeather(loc.lat, loc.lon);
    if (!data || !data.current) {
        console.error("Invalid weather data:", data);
        return;
    }

    // 3. Extract formatted weather from Worker
    const current = {
        temperature: data.current.temperature,
        windspeed: data.current.wind,
        weathercode: data.current.code,
        windgusts: data.current.gust,
        pressure: data.current.pressure,
        rain: data.current.rain
    };

    const hourly = data.hourly;

    // 4. Run your logic modules
    const wind = WindLogic.analyze(current);
    const pressure = PressureLogic.analyze(current, hourly);
    const storm = StormLogic.compute({ wind, pressure, hourly });
    const hazard = HazardLogic.compute({ wind, pressure });

    // 5. Update UI
    WeatherUI.updateCurrent(current);
    WeatherUI.updateWind(wind);
    WeatherUI.updatePressure(pressure);
    WeatherUI.updateStorm(storm);
    WeatherUI.updateHazard(hazard);
}

initWeather();
