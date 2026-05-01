// storm.js
export const StormLogic = {
    compute({ wind, pressure, hourly }) {
        let score = 0;

        if (wind.gust > 25) score += 20;
        if (wind.gust > 40) score += 40;

        if (pressure.diff < -1) score += 20;
        if (pressure.diff < -3) score += 40;

        const rainChance = hourly.precipitation_probability[0];
        if (rainChance > 50) score += 10;
        if (rainChance > 80) score += 20;

        let level = "Low";
        if (score > 30) level = "Moderate";
        if (score > 60) level = "High";
        if (score > 90) level = "Extreme";

        return {
            score,
            level,
            notes: this.getNotes(level)
        };
    },

    getNotes(level) {
        switch (level) {
            case "Moderate": return "Watch wind shifts and gust fronts.";
            case "High": return "Tree failures likely. Avoid bucket work.";
            case "Extreme": return "Severe storm risk. Shut down operations.";
            default: return "Normal conditions.";
        }
    }
};
