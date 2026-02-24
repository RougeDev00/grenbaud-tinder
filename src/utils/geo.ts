// Geocoding utility using OpenStreetMap Nominatim (free, no API key)
// Caches results to avoid repeated API calls

interface GeoCoord {
    lat: number;
    lng: number;
}

const geoCache = new Map<string, GeoCoord | null>();

/**
 * Geocode a city name to lat/lng using Nominatim
 */
export async function geocodeCity(city: string): Promise<GeoCoord | null> {
    const key = city.toLowerCase().trim();
    if (!key) return null;
    if (geoCache.has(key)) return geoCache.get(key) || null;

    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(key)}&countrycodes=it&format=json&limit=1`,
            { headers: { 'Accept-Language': 'it' } }
        );
        const data = await res.json();
        if (data && data.length > 0) {
            const coord = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
            geoCache.set(key, coord);
            return coord;
        }
        geoCache.set(key, null);
        return null;
    } catch (err) {
        console.warn('[Geo] Failed to geocode:', city, err);
        geoCache.set(key, null);
        return null;
    }
}

/**
 * Calculate distance in km between two coordinates (Haversine formula)
 */
export function haversineDistance(a: GeoCoord, b: GeoCoord): number {
    const R = 6371; // Earth radius in km
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLng = (b.lng - a.lng) * Math.PI / 180;
    const sinLat = Math.sin(dLat / 2);
    const sinLng = Math.sin(dLng / 2);
    const calc = sinLat * sinLat +
        Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * sinLng * sinLng;
    return R * 2 * Math.atan2(Math.sqrt(calc), Math.sqrt(1 - calc));
}
