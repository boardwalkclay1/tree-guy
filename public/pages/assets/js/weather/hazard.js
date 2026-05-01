// hazard.js
export const HazardLogic = {
    compute({ wind, pressure }) {
        let score = 0;

        if (wind.gust > 20) score += 20;
        if (wind.gust > 35) score += 40;

        if (pressure.diff < -1) score += 10;
        if (pressure.diff < -3) score += 20;

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
            case "Moderate": return "Limb snap risk increasing.";
            case "High": return "Uproot risk elevated.";
            case "Extreme": return "High failure probability. Avoid tree proximity.";
            default: return "Stable conditions.";
        }
    }
};
