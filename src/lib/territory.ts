/**
 * Utility for territory (hex/tile) calculations
 */

export interface TileBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

// Level of detail for the grid
const TILE_SIZE = 0.002;

export function getTileId(lat: number, lng: number): string {
  const x = Math.floor(lng / TILE_SIZE);
  const y = Math.floor(lat / TILE_SIZE);
  return `${x}_${y}`;
}

export function getTileBounds(tileId: string): TileBounds {
  const [xStr, yStr] = tileId.split('_');
  const x = parseInt(xStr, 10);
  const y = parseInt(yStr, 10);

  return {
    west: x * TILE_SIZE,
    east: (x + 1) * TILE_SIZE,
    south: y * TILE_SIZE,
    north: (y + 1) * TILE_SIZE,
  };
}

export function getTilePath(tileId: string): { lat: number; lng: number }[] {
  const bounds = getTileBounds(tileId);
  return [
    { lat: bounds.north, lng: bounds.west },
    { lat: bounds.north, lng: bounds.east },
    { lat: bounds.south, lng: bounds.east },
    { lat: bounds.south, lng: bounds.west },
  ];
}
