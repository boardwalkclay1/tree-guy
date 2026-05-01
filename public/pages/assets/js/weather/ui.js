// ui.js
export const WeatherUI = {
    updateCurrent(current) {
        document.getElementById("weatherBox").innerHTML = `
            <div class="temp">${current.temperature_2m}°F</div>
            <div class="cond">Wind: ${current.wind_speed_10m} mph</div>
            <div class="cond">Gusts: ${current.wind_gusts_10m} mph</div>
        `;
    },

    updateWind(wind) {
        document.getElementById("windSpeed").textContent = `${wind.speed} mph`;
        document.getElementById("windGust").textContent = `${wind.gust} mph`;
        document.getElementById("windDir").textContent = `${wind.dir}°`;
        document.getElementById("gustRatio").textContent = wind.gustRatio;
    },

    updatePressure(pressure) {
        document.getElementById("pressure").textContent = `${pressure.pressure} hPa`;
        document.getElementById("pressureTrend").textContent = pressure.trend;
    },

    updateStorm(storm) {
        document.getElementById("stormRisk").textContent = storm.level;
        document.getElementById("stormNotes").textContent = storm.notes;
    },

    updateHazard(hazard) {
        document.getElementById("hazardScore").textContent = hazard.level;
        document.getElementById("hazardNotes").textContent = hazard.notes;
    }
};
