/* ============================================================
   REAL TREE GUY MEASUREMENT ENGINE — EXTREME LOGIC LAYER
   File: measurement-advanced.js

   Depends on:
   - Sensors
   - MathTools
   - LiveMeasure
   - PhotoMeasure
   - ManualMeasure
   - DistanceTool

   This layer:
   - Sensor fusion
   - Angle smoothing
   - Auto distance estimation
   - Tree height refinement
   - Diameter estimation
   - Crown spread estimation
   - Fall zone + hazard scoring
   - Multi-point triangulation
   - Pixel-to-real-world scaling
   - Error estimation
   ============================================================ */

import {
    Sensors,
    MathTools,
    LiveMeasure,
    PhotoMeasure,
    ManualMeasure,
    DistanceTool
} from "./measurement.js";

/* ============================
   UTILITY: FILTERS & HELPERS
   ============================ */
const AdvancedUtils = {
    movingAverage(values, windowSize = 5) {
        if (!values.length) return null;
        const result = [];
        for (let i = 0; i < values.length; i++) {
            const start = Math.max(0, i - windowSize + 1);
            const slice = values.slice(start, i + 1);
            const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
            result.push(avg);
        }
        return result;
    },

    clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    },

    degToRad(deg) {
        return deg * (Math.PI / 180);
    },

    radToDeg(rad) {
        return rad * (180 / Math.PI);
    }
};


/* ============================
   SENSOR FUSION & ANGLE LOGIC
   ============================ */
export const SensorFusion = {
    angleHistory: [],
    maxHistory: 30,

    pushOrientationSample() {
        if (!Sensors.orientation) return;

        const beta = Sensors.orientation.beta || 0;
        this.angleHistory.push(beta);

        if (this.angleHistory.length > this.maxHistory) {
            this.angleHistory.shift();
        }
    },

    getSmoothedAngle() {
        if (!this.angleHistory.length) return null;
        const smoothed = AdvancedUtils.movingAverage(this.angleHistory, 7);
        return smoothed[smoothed.length - 1];
    },

    getStableAngle(threshold = 0.5) {
        if (this.angleHistory.length < 5) return null;

        const recent = this.angleHistory.slice(-5);
        const max = Math.max(...recent);
        const min = Math.min(...recent);
        const spread = max - min;

        if (spread <= threshold) {
            return recent.reduce((a, b) => a + b, 0) / recent.length;
        }
        return null;
    }
};


/* ============================
   AUTO DISTANCE ESTIMATION
   ============================ */
export const AutoDistance = {
    // cameraHeight in meters, angleDown in degrees (looking at base)
    estimateDistanceFromAngle(cameraHeight, angleDownDegrees) {
        const angle = AdvancedUtils.degToRad(angleDownDegrees);
        if (angle <= 0) return null;
        return cameraHeight / Math.tan(angle);
    },

    // Uses tilt + assumed camera height to guess distance to base
    estimateDistanceFromOrientation(cameraHeight = 1.7) {
        if (!Sensors.orientation) return null;
        const beta = Sensors.orientation.beta || 0;

        // If device is tilted downward (positive beta), use it
        if (beta > 0) {
            return this.estimateDistanceFromAngle(cameraHeight, beta);
        }
        return null;
    }
};


/* ============================
   TREE HEIGHT REFINEMENT
   ============================ */
export const TreeHeightAdvanced = {
    // Uses separate angles to base and top + distance
    heightFromTwoAngles(distance, angleBaseDeg, angleTopDeg) {
        const baseAngle = AdvancedUtils.degToRad(angleBaseDeg);
        const topAngle  = AdvancedUtils.degToRad(angleTopDeg);

        const hBase = Math.tan(baseAngle) * distance;
        const hTop  = Math.tan(topAngle)  * distance;

        return {
            baseHeight: hBase,
            topHeight: hTop,
            treeHeight: hTop - hBase
        };
    },

    // Uses smoothed orientation angle + known distance
    refinedHeightFromSmoothedAngle(distance) {
        const angle = SensorFusion.getSmoothedAngle();
        if (angle == null) return null;

        return MathTools.angleToHeight(distance, angle);
    },

    // Full auto: estimate distance + use smoothed angle
    autoHeight(cameraHeight = 1.7) {
        const distance = AutoDistance.estimateDistanceFromOrientation(cameraHeight);
        if (!distance) return null;

        const height = this.refinedHeightFromSmoothedAngle(distance);
        if (!height) return null;

        return {
            distance,
            height
        };
    }
};


/* ============================
   DIAMETER & CROWN ESTIMATION
   ============================ */
export const TreeShapeAdvanced = {
    // diameter from pixel width + known reference
    diameterFromPixels(pixelWidth, refPixelWidth, refRealWidth) {
        if (!refPixelWidth || !refRealWidth) return null;
        const scale = refRealWidth / refPixelWidth;
        return pixelWidth * scale;
    },

    // crown spread from two or more points
    crownSpreadFromPoints(points, refPixelWidth, refRealWidth) {
        if (!points || points.length < 2) return null;

        let maxDist = 0;
        for (let i = 0; i < points.length; i++) {
            for (let j = i + 1; j < points.length; j++) {
                const d = MathTools.pixelDistance(points[i], points[j]);
                if (d > maxDist) maxDist = d;
            }
        }

        return this.diameterFromPixels(maxDist, refPixelWidth, refRealWidth);
    }
};


/* ============================
   FALL ZONE & HAZARD SCORING
   ============================ */
export const FallZone = {
    // Basic fall line: straight line from tree base in lean direction
    computeFallLine(treeHeight, leanAngleDeg = 0) {
        const leanRad = AdvancedUtils.degToRad(leanAngleDeg);
        const horizontalReach = treeHeight * Math.sin(leanRad);
        const verticalDrop    = treeHeight * Math.cos(leanRad);

        return {
            horizontalReach,
            verticalDrop
        };
    },

    // Safety radius as multiple of tree height
    safetyRadius(treeHeight, factor = 1.5) {
        return treeHeight * factor;
    },

    // Simple hazard score 0–100
    hazardScore({
        treeHeight,
        leanAngleDeg,
        targetDistance,
        targetDirectionDiffDeg,
        decay = 0.05
    }) {
        if (!treeHeight || targetDistance == null) return null;

        const fall = this.computeFallLine(treeHeight, leanAngleDeg);
        const reach = Math.abs(fall.horizontalReach);

        const distanceFactor = AdvancedUtils.clamp(1 - (targetDistance - reach) * decay, 0, 1);
        const directionFactor = AdvancedUtils.clamp(1 - (Math.abs(targetDirectionDiffDeg) / 90), 0, 1);

        const rawScore = distanceFactor * directionFactor * 100;
        return AdvancedUtils.clamp(rawScore, 0, 100);
    }
};


/* ============================
   MULTI-POINT TRIANGULATION
   ============================ */
export const Triangulation = {
    // Two distance measurements from different positions to same tree
    // Returns approximate position of tree relative to first point
    triangulate2D(d1, bearing1Deg, d2, bearing2Deg) {
        const b1 = AdvancedUtils.degToRad(bearing1Deg);
        const b2 = AdvancedUtils.degToRad(bearing2Deg);

        const x1 = 0;
        const y1 = 0;

        const x2 = d2 * Math.sin(b2 - b1);
        const y2 = d2 * Math.cos(b2 - b1);

        // Intersection of two circles is simplified here as mid-point
        const treeX = (d1 * Math.sin(b1) + x2) / 2;
        const treeY = (d1 * Math.cos(b1) + y2) / 2;

        return { x: treeX, y: treeY };
    }
};


/* ============================
   PIXEL-TO-REAL-WORLD SCALING
   ============================ */
export const PixelScaling = {
    // Given a reference object in the image
    // refPixelHeight, refRealHeight (meters)
    scaleFromReference(refPixelHeight, refRealHeight) {
        if (!refPixelHeight || !refRealHeight) return null;
        return refRealHeight / refPixelHeight;
    },

    // Convert pixel distance to real distance using scale
    pixelsToReal(pixelDistance, scale) {
        if (!scale) return null;
        return pixelDistance * scale;
    },

    // Full pipeline: two points + reference
    measureRealDistance(points, refPixelHeight, refRealHeight) {
        if (!points || points.length < 2) return null;

        const pixelDist = MathTools.pixelDistance(points[0], points[1]);
        const scale = this.scaleFromReference(refPixelHeight, refRealHeight);
        return this.pixelsToReal(pixelDist, scale);
    }
};


/* ============================
   ERROR ESTIMATION
   ============================ */
export const ErrorEstimation = {
    // Simple percentage error estimate based on angle stability and distance
    estimateHeightError({
        angleSpreadDeg,
        distance,
        baseError = 0.05
    }) {
        const angleFactor = AdvancedUtils.clamp(angleSpreadDeg / 5, 0, 1);
        const distanceFactor = AdvancedUtils.clamp(distance / 30, 0, 1);

        const error = baseError + angleFactor * 0.1 + distanceFactor * 0.1;
        return AdvancedUtils.clamp(error, 0.02, 0.3); // 2%–30%
    }
};


/* ============================
   ADVANCED WRAPPER API
   ============================ */
export const MeasurementAdvanced = {
    tickSensorFusion() {
        SensorFusion.pushOrientationSample();
    },

    autoTreeHeight(cameraHeight = 1.7) {
        return TreeHeightAdvanced.autoHeight(cameraHeight);
    },

    advancedFallAnalysis({
        treeHeight,
        leanAngleDeg,
        targetDistance,
        targetDirectionDiffDeg
    }) {
        const fallLine = FallZone.computeFallLine(treeHeight, leanAngleDeg);
        const safetyRadius = FallZone.safetyRadius(treeHeight);
        const hazard = FallZone.hazardScore({
            treeHeight,
            leanAngleDeg,
            targetDistance,
            targetDirectionDiffDeg
        });

        return {
            fallLine,
            safetyRadius,
            hazardScore: hazard
        };
    },

    photoDiameterAndCrown({
        trunkPixelWidth,
        crownPoints,
        refPixelWidth,
        refRealWidth
    }) {
        const diameter = TreeShapeAdvanced.diameterFromPixels(
            trunkPixelWidth,
            refPixelWidth,
            refRealWidth
        );

        const crownSpread = TreeShapeAdvanced.crownSpreadFromPoints(
            crownPoints,
            refPixelWidth,
            refRealWidth
        );

        return {
            diameter,
            crownSpread
        };
    },

    gpsDistanceBetween(lat1, lon1, lat2, lon2) {
        return MathTools.gpsDistance(lat1, lon1, lat2, lon2);
    }
};
