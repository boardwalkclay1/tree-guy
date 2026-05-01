// fetch.js
export const WeatherFetch = {
    async getWeather(lat, lon) {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,wind_gusts_10m,wind_direction_10m,pressure_msl,precipitation&hourly=temperature_2m,wind_speed_10m,wind_gusts_10m,pressure_msl,precipitation_probability`;

        const res = await fetch(url);
        return await res.json();
    }
};
