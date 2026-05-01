// pressure.js
export const PressureLogic = {
    analyze(current, hourly) {
        const now = current.pressure_msl;
        const past = hourly.pressure_msl[0];
        const diff = now - past;

        let trend = "Stable";
        if (diff < -1) trend = "Falling (Storm Incoming)";
        if (diff > 1) trend = "Rising (Clearing)";

        return {
            pressure: now,
            trend,
            diff
        };
    }
};
