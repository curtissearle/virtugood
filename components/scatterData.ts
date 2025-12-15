export type ScatteredObject = {
  position: [number, number, number];
  type: number;
  size: number;
  rotation: number;
  colorIndex: number;
  key: string;
};

// Simple deterministic RNG (Linear Congruential Generator) to keep render/collision in sync
const createRng = (seed = 1) => {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) % 4294967296;
    return state / 4294967296;
  };
};

export const generateScatteredObjects = (
  count = 60,
  // Minimum radius from the very center of the arena where objects can appear.
  // Set this small (but not zero) so we can have objects in the column area
  // and near the player start, without stacking directly on the exact center.
  startRadius = 5,
  wallRadius = 75
): ScatteredObject[] => {
  const rand = createRng(12345);
  const objects: ScatteredObject[] = [];

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + rand() * 0.5; // slight jitter per object
    // Distribute objects across the whole playable area, from just off-center
    // out toward the inner side of the circular wall (with a small buffer).
    const distance = startRadius + rand() * (wallRadius - startRadius - 5); // keep away from wall a bit

    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;
    const y = rand() * 5;

    const type = Math.floor(rand() * 4); // 0-3
    const size = 1 + rand() * 3;
    const rotation = rand() * Math.PI * 2;
    const colorIndex = Math.floor(rand() * 6);

    objects.push({
      position: [x, y, z],
      type,
      size,
      rotation,
      colorIndex,
      key: `obj-${i}`,
    });
  }

  return objects;
};
