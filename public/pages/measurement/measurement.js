/* ============================================================
   REAL TREE GUY MEASUREMENT ENGINE — CORE LAYER
   Single-file version containing:
   - Sensors
   - Math Tools
   - Live Camera Measurement
   - Photo Measurement
   - Manual Measurement
   - GPS Distance Measurement
   - UI Controls
   ============================================================ */

/* ============================
   SENSORS MODULE
   ============================ */
export const Sensors = {
    gps: null,
    compass: null,
    orientation: null,

    async initGPS() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) return reject("GPS not supported");

            navigator.geolocation.getCurrentPosition(
                pos => {
                    this.gps = {
                        lat: pos.coords.latitude,
                        lon: pos.coords.longitude,
                        accuracy: pos.coords.accuracy
                    };
                    resolve(this.gps);
                },
                err => reject(err),
                { enableHighAccuracy: true }
            );
        });
    },

    async initCompass() {
        window.addEventListener("deviceorientationabsolute", e => {
            this.compass = e.alpha;
        });
    },

    async initOrientation() {
        window.addEventListener("deviceorientation", e => {
            this.orientation = {
                beta: e.beta,
                gamma: e.gamma,
                alpha: e.alpha
            };
        });
    }
};


/* ============================
   MATH MODULE
   ============================ */
export const MathTools = {
    pythag(a, b) {
        return Math.sqrt(a*a + b*b);
    },

    angleToHeight(distance, angleDegrees) {
        const angle = angleDegrees * (Math.PI / 180);
        return Math.tan(angle) * distance;
    },

    pixelDistance(p1, p2) {
        return Math.sqrt(
            Math.pow(p2.x - p1.x, 2) +
            Math.pow(p2.y - p1.y, 2)
        );
    },

    gpsDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3;
        const φ1 = lat1 * Math.PI/180;
        const φ2 = lat2 * Math.PI/180;
        const Δφ = (lat2-lat1) * Math.PI/180;
        const Δλ = (lon2-lon1) * Math.PI/180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c;
    }
};


/* ============================
   LIVE CAMERA MEASUREMENT
   ============================ */
export const LiveMeasure = {
    video: null,

    async initCamera(videoElement) {
        this.video = videoElement;

        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" }
        });

        this.video.srcObject = stream;
        await this.video.play();
    },

    getHeight(distance) {
        if (!Sensors.orientation) return null;

        const angle = Sensors.orientation.beta;
        return MathTools.angleToHeight(distance, angle);
    }
};


/* ============================
   PHOTO MEASUREMENT
   ============================ */
export const PhotoMeasure = {
    image: null,
    points: [],

    loadImage(file, imgElement) {
        const reader = new FileReader();
        reader.onload = e => {
            imgElement.src = e.target.result;
            this.image = imgElement;
        };
        reader.readAsDataURL(file);
    },

    addPoint(x, y) {
        this.points.push({ x, y });
    },

    measure() {
        if (this.points.length < 2) return null;
        return MathTools.pixelDistance(this.points[0], this.points[1]);
    }
};


/* ============================
   MANUAL MEASUREMENT
   ============================ */
export const ManualMeasure = {
    heightFromAngle(distance, angle) {
        return MathTools.angleToHeight(distance, angle);
    },

    pythag(a, b) {
        return MathTools.pythag(a, b);
    }
};


/* ============================
   DISTANCE BETWEEN OBJECTS
   ============================ */
export const DistanceTool = {
    async measureToPoint(lat, lon) {
        if (!Sensors.gps) await Sensors.initGPS();

        return MathTools.gpsDistance(
            Sensors.gps.lat,
            Sensors.gps.lon,
            lat,
            lon
        );
    }
};


/* ============================
   UI MODULE
   ============================ */
export const UI = {
    showTab(id) {
        document.querySelectorAll(".tab").forEach(t => t.style.display = "none");
        document.getElementById(id).style.display = "block";
    }
};
