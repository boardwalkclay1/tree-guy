// location.js
export const Location = {
    coords: null,
    manual: null,

    async getGPS() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) return reject("GPS not supported");

            navigator.geolocation.getCurrentPosition(
                pos => {
                    this.coords = {
                        lat: pos.coords.latitude,
                        lon: pos.coords.longitude
                    };
                    resolve(this.coords);
                },
                err => reject(err),
                { enableHighAccuracy: true }
            );
        });
    },

    setManual(lat, lon) {
        this.manual = { lat, lon };
    },

    async getActiveLocation() {
        if (this.manual) return this.manual;

        if (!this.coords) {
            try { await this.getGPS(); }
            catch { return null; }
        }

        return this.coords;
    }
};
