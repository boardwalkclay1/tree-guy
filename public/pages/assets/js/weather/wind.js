// wind.js
export const WindLogic = {
    analyze(current) {
        const speed = current.wind_speed_10m;
        const gust = current.wind_gusts_10m;
        const dir = current.wind_direction_10m;

        const gustRatio = gust && speed ? (gust / speed).toFixed(2) : "N/A";

        return {
            speed,
            gust,
            dir,
            gustRatio
        };
    }
};
