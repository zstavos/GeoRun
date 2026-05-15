export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Chaikin's Smoothing Algorithm
 * Smooths a path by iteratively cutting corners.
 * 
 * @param points Array of LatLng coordinates
 * @param iterations Number of smoothing passes (default: 2)
 * @param closed Whether the path is a closed polygon (default: true)
 * @returns Smoothed array of LatLng coordinates
 */
export function chaikinSmoothing(
  points: LatLng[], 
  iterations: number = 2, 
  closed: boolean = true
): LatLng[] {
  if (points.length < 3) return points;

  let smoothed = [...points];

  for (let i = 0; i < iterations; i++) {
    const nextLayer: LatLng[] = [];
    const n = smoothed.length;

    for (let j = 0; j < (closed ? n : n - 1); j++) {
      const p0 = smoothed[j];
      const p1 = smoothed[(j + 1) % n];

      // Q = 0.75 * p0 + 0.25 * p1
      const q: LatLng = {
        lat: p0.lat * 0.75 + p1.lat * 0.25,
        lng: p0.lng * 0.75 + p1.lng * 0.25,
      };

      // R = 0.25 * p0 + 0.75 * p1
      const r: LatLng = {
        lat: p0.lat * 0.25 + p1.lat * 0.75,
        lng: p0.lng * 0.25 + p1.lng * 0.75,
      };

      nextLayer.push(q, r);
    }

    smoothed = nextLayer;
  }

  return smoothed;
}

/**
 * Douglas-Peucker Algorithm
 * Simplifies a polyline by removing points that are within a certain distance of the line segment.
 */
export function simplifyPath(points: LatLng[], tolerance: number): LatLng[] {
  if (points.length <= 2) return points;

  const sqTolerance = tolerance * tolerance;

  function getSqDist(p: LatLng, p1: LatLng, p2: LatLng): number {
    let x = p1.lng, y = p1.lat,
        dx = p2.lng - x, dy = p2.lat - y;

    if (dx !== 0 || dy !== 0) {
      const t = ((p.lng - x) * dx + (p.lat - y) * dy) / (dx * dx + dy * dy);
      if (t > 1) {
        x = p2.lng; y = p2.lat;
      } else if (t > 0) {
        x += dx * t; y += dy * t;
      }
    }

    dx = p.lng - x; dy = p.lat - y;
    return dx * dx + dy * dy;
  }

  function simplifyDPStep(points: LatLng[], first: number, last: number, sqTolerance: number, simplified: LatLng[]) {
    let maxSqDist = sqTolerance,
        index = -1;

    for (let i = first + 1; i < last; i++) {
        const sqDist = getSqDist(points[i], points[first], points[last]);
        if (sqDist > maxSqDist) {
            index = i;
            maxSqDist = sqDist;
        }
    }

    if (index !== -1) {
        simplifyDPStep(points, first, index, sqTolerance, simplified);
        simplified.push(points[index]);
        simplifyDPStep(points, index, last, sqTolerance, simplified);
    }
  }

  const simplified: LatLng[] = [points[0]];
  simplifyDPStep(points, 0, points.length - 1, sqTolerance, simplified);
  simplified.push(points[points.length - 1]);

  return simplified;
}

/**
 * Calculates the Haversine distance between two points in meters.
 */
export function calculateDistance(p1: LatLng, p2: LatLng): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (p1.lat * Math.PI) / 180;
  const φ2 = (p2.lat * Math.PI) / 180;
  const Δφ = ((p2.lat - p1.lat) * Math.PI) / 180;
  const Δλ = ((p2.lng - p1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculates the area of a polygon in square meters using the Shoelace formula on spherical coordinates.
 */
export function calculatePolygonArea(points: LatLng[]): number {
  if (points.length < 3) return 0;
  
  const R = 6371000; // Earth radius in meters
  let area = 0;

  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    
    // Radians
    const λ1 = (p1.lng * Math.PI) / 180;
    const λ2 = (p2.lng * Math.PI) / 180;
    const φ1 = (p1.lat * Math.PI) / 180;
    const φ2 = (p2.lat * Math.PI) / 180;

    area += (λ2 - λ1) * (2 + Math.sin(φ1) + Math.sin(φ2));
  }

  area = (area * R * R) / 2.0;
  return Math.abs(area);
}
