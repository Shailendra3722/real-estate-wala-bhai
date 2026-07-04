/**
 * Distance Calculation Service
 * 
 * Provides math helpers to calculate geodetic distances on Earth's surface
 * using the Haversine formula. Used for nearby property queries.
 */

/**
 * Calculates distance in kilometers between two coordinates.
 * @param {number} lat1 - Latitude of center point
 * @param {number} lng1 - Longitude of center point
 * @param {number} lat2 - Latitude of target point
 * @param {number} lng2 - Longitude of target point
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
        
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Converts degrees to radians.
 */
function toRad(degrees) {
    return degrees * (Math.PI / 180);
}

module.exports = {
    calculateDistance
};
