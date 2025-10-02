export interface IPGeoLocation {
  ip: string;
  country: string | null;
  countryCode: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  isp: string | null;
  isVPN: boolean;
  isProxy: boolean;
  isDataCenter: boolean;
  isTor: boolean;
}

export async function getIPGeoLocation(ip: string): Promise<IPGeoLocation> {
  try {
    // Using ipapi.co free API (1000 requests/day)
    // For production, use paid service like MaxMind, IPQualityScore, or ipdata.co
    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: {
        'User-Agent': 'veriffy.me/1.0',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch IP geolocation');
    }

    const data = await response.json();

    // Check for VPN/Proxy using basic heuristics
    // For production, use specialized services like IPQualityScore or IPHub
    const isVPN = false; // Would need paid API
    const isProxy = false; // Would need paid API
    const isDataCenter = data.org?.toLowerCase().includes('hosting') ||
                         data.org?.toLowerCase().includes('datacenter') ||
                         data.org?.toLowerCase().includes('cloud') || false;
    const isTor = false; // Would need Tor exit node list

    return {
      ip,
      country: data.country_name || null,
      countryCode: data.country_code || null,
      city: data.city || null,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      timezone: data.timezone || null,
      isp: data.org || null,
      isVPN,
      isProxy,
      isDataCenter,
      isTor,
    };
  } catch (error) {
    console.error('IP Geolocation error:', error);

    // Return minimal data on error
    return {
      ip,
      country: null,
      countryCode: null,
      city: null,
      latitude: null,
      longitude: null,
      timezone: null,
      isp: null,
      isVPN: false,
      isProxy: false,
      isDataCenter: false,
      isTor: false,
    };
  }
}

// Calculate distance between two coordinates in km
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
