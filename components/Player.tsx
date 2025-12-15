import React, { useEffect, useRef, useMemo } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { Vector3, Fog } from "three";
import { ScatteredObject, generateScatteredObjects } from "./scatterData";

const SPEED = 10; // Increased default speed
const SLOW_WALK_SPEED = 3; // Speed when shift is held
const JUMP_FORCE = 8;
const GRAVITY = -20;
const GROUND_HEIGHT = 2; // Camera height when standing
const DUCK_HEIGHT = 1; // Camera height when ducking
const PLAYER_RADIUS = 0.5; // Player collision radius

const KEYS = {
  KeyW: "forward",
  KeyS: "backward",
  KeyA: "left",
  KeyD: "right",
  Space: "jump",
  ArrowUp: "forward",
  ArrowDown: "backward",
  ArrowLeft: "left",
  ArrowRight: "right",
} as const;

type MoveState = {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  duck: boolean;
  slowWalk: boolean;
};

// Fog of war parameters (fog only, no pull-back)
const FOG_START_DISTANCE = 25; // Distance where fog starts to appear
const FOG_MAX_DISTANCE = 100; // Distance where fog is at maximum
const WALL_RADIUS = 75; // Radius of the circular wall
const CENTER = new Vector3(0, 0, 0);

// Collision bounds interface
interface CollisionBounds {
  type: "box" | "sphere" | "cylinder";
  position: Vector3;
  size: Vector3; // For box: width, height, depth. For sphere/cylinder: radius, height, unused
}

// Generate all collision bounds for static objects
const generateCollisionBounds = (
  scatteredObjects: ScatteredObject[]
): CollisionBounds[] => {
  const bounds: CollisionBounds[] = [];

  // Columns - 6 columns
  const columnPositions: [number, number, number][] = [
    [-8, 0, -5],
    [-8, 0, 5],
    [-8, 0, 15],
    [8, 0, -5],
    [8, 0, 5],
    [8, 0, 15],
  ];

  columnPositions.forEach(([x, y, z]) => {
    // Column base (2x1x2)
    bounds.push({
      type: "box",
      position: new Vector3(x, y + 0.5, z),
      size: new Vector3(2, 1, 2),
    });
    // Column shaft (cylinder, radius 0.8, height 10)
    bounds.push({
      type: "cylinder",
      position: new Vector3(x, y + 6, z),
      size: new Vector3(0.8, 10, 0),
    });
    // Column capital (1.8x1x1.8)
    bounds.push({
      type: "box",
      position: new Vector3(x, y + 11.5, z),
      size: new Vector3(1.8, 1, 1.8),
    });
  });

  // The Giant at [30, 0, -30]
  const giantPos = new Vector3(30, 0, -30);
  // Torso (cylinder, radius 4, height 12)
  bounds.push({
    type: "cylinder",
    position: new Vector3(giantPos.x, giantPos.y + 12, giantPos.z),
    size: new Vector3(4, 12, 0),
  });
  // Head (sphere, radius 3)
  bounds.push({
    type: "sphere",
    position: new Vector3(giantPos.x, giantPos.y + 20, giantPos.z),
    size: new Vector3(3, 0, 0),
  });
  // Left arm (cylinder, radius 1, height 10)
  bounds.push({
    type: "cylinder",
    position: new Vector3(giantPos.x - 5, giantPos.y + 12, giantPos.z + 2),
    size: new Vector3(1, 10, 0),
  });
  // Right arm (cylinder, radius 1, height 10)
  bounds.push({
    type: "cylinder",
    position: new Vector3(giantPos.x + 5, giantPos.y + 12, giantPos.z + 2),
    size: new Vector3(1, 10, 0),
  });

  // Scattered objects - shared deterministic data with rendered scene
  scatteredObjects.forEach(({ position, type, size }) => {
    const [x, y, z] = position;

    if (type === 0) {
      // Box: size x (size*1.5) x size
      bounds.push({
        type: "box",
        position: new Vector3(x, y + (size * 1.5) / 2, z),
        size: new Vector3(size, size * 1.5, size),
      });
    } else if (type === 1) {
      // Cylinder: radius size*0.5, height size*2
      bounds.push({
        type: "cylinder",
        position: new Vector3(x, y + size, z),
        size: new Vector3(size * 0.5, size * 2, 0),
      });
    } else if (type === 2) {
      // Sphere: radius size*0.7
      bounds.push({
        type: "sphere",
        position: new Vector3(x, y, z),
        size: new Vector3(size * 0.7, 0, 0),
      });
    } else if (type === 3) {
      // Cone: radius size*0.7, height size*2
      bounds.push({
        type: "cylinder", // Approximate cone as cylinder for collision
        position: new Vector3(x, y + size, z),
        size: new Vector3(size * 0.7, size * 2, 0),
      });
    }
  });

  return bounds;
};

interface PlayerProps {
  isLocked: boolean;
}

export const Player: React.FC<PlayerProps> = ({ isLocked }) => {
  const { camera, scene } = useThree();
  const scatteredObjects = useMemo(() => generateScatteredObjects(), []);
  const moveState = useRef<MoveState>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    duck: false,
    slowWalk: false,
  });
  const velocityY = useRef(0);
  const isGrounded = useRef(true);

  // Generate collision bounds once for static objects
  const staticCollisionBounds = useMemo(
    () => generateCollisionBounds(scatteredObjects),
    [scatteredObjects]
  );

  // Check if a position collides with any object
  const checkCollision = (pos: Vector3, playerHeight: number): boolean => {
    const playerBottom = pos.y - playerHeight / 2;
    const playerTop = pos.y + playerHeight / 2;

    // Check static objects (Columns, Giant, scattered objects)
    for (const bound of staticCollisionBounds) {
      if (bound.type === "box") {
        const minX = bound.position.x - bound.size.x / 2;
        const maxX = bound.position.x + bound.size.x / 2;
        const minY = bound.position.y - bound.size.y / 2;
        const maxY = bound.position.y + bound.size.y / 2;
        const minZ = bound.position.z - bound.size.z / 2;
        const maxZ = bound.position.z + bound.size.z / 2;

        // Check if player sphere intersects with box
        const closestX = Math.max(minX, Math.min(pos.x, maxX));
        const closestY = Math.max(minY, Math.min(pos.y, maxY));
        const closestZ = Math.max(minZ, Math.min(pos.z, maxZ));

        const distX = pos.x - closestX;
        const distY = pos.y - closestY;
        const distZ = pos.z - closestZ;
        const distSq = distX * distX + distY * distY + distZ * distZ;

        if (distSq < PLAYER_RADIUS * PLAYER_RADIUS) {
          return true;
        }
      } else if (bound.type === "sphere") {
        const dist = pos.distanceTo(bound.position);
        if (dist < PLAYER_RADIUS + bound.size.x) {
          // Also check vertical overlap
          if (
            playerBottom < bound.position.y + bound.size.x &&
            playerTop > bound.position.y - bound.size.x
          ) {
            return true;
          }
        }
      } else if (bound.type === "cylinder") {
        // Check horizontal distance (XZ plane)
        const dx = pos.x - bound.position.x;
        const dz = pos.z - bound.position.z;
        const horizontalDist = Math.sqrt(dx * dx + dz * dz);

        if (horizontalDist < PLAYER_RADIUS + bound.size.x) {
          // Check vertical overlap
          const cylBottom = bound.position.y - bound.size.y / 2;
          const cylTop = bound.position.y + bound.size.y / 2;
          if (playerBottom < cylTop && playerTop > cylBottom) {
            return true;
          }
        }
      }
    }

    return false;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't process movement keys until game is entered
      if (!isLocked) {
        return;
      }

      const key = e.code as keyof typeof KEYS;

      // Handle Ctrl for ducking
      if (e.ctrlKey || e.code === "ControlLeft" || e.code === "ControlRight") {
        moveState.current.duck = true;
      }

      // Handle Shift for slow walk
      if (e.shiftKey || e.code === "ShiftLeft" || e.code === "ShiftRight") {
        moveState.current.slowWalk = true;
      }

      if (KEYS[key]) {
        if (key === "Space") {
          // Only allow jump if grounded
          if (isGrounded.current && velocityY.current === 0) {
            velocityY.current = JUMP_FORCE;
            isGrounded.current = false;
          }
        } else {
          moveState.current[KEYS[key]] = true;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.code as keyof typeof KEYS;

      // Handle Ctrl release for ducking
      if (e.code === "ControlLeft" || e.code === "ControlRight") {
        moveState.current.duck = false;
      }

      // Handle Shift release for slow walk
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
        moveState.current.slowWalk = false;
      }

      // Also check modifier state - if modifier is no longer held, release
      if (!e.ctrlKey) {
        moveState.current.duck = false;
      }
      if (!e.shiftKey) {
        moveState.current.slowWalk = false;
      }

      if (KEYS[key] && key !== "Space") {
        moveState.current[KEYS[key]] = false;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [isLocked]);

  useFrame((state, delta) => {
    // Don't allow movement or camera updates until game is entered
    if (!isLocked) {
      return;
    }

    const { forward, backward, left, right, duck, slowWalk } =
      moveState.current;

    // Determine current movement speed (slow walk if shift is held)
    const currentSpeed = slowWalk ? SLOW_WALK_SPEED : SPEED;

    // Apply gravity
    velocityY.current += GRAVITY * delta;

    // Update Y position from jumping/falling
    camera.position.y += velocityY.current * delta;

    // Handle ducking and ground collision
    const isOnGround = camera.position.y <= GROUND_HEIGHT;

    if (isOnGround) {
      // Reset velocity when landing
      if (velocityY.current < 0) {
        velocityY.current = 0;
      }
      isGrounded.current = true;

      // Handle ducking on ground
      if (duck) {
        // Smoothly lower to duck height
        const targetY = DUCK_HEIGHT;
        if (camera.position.y > targetY) {
          camera.position.y = Math.max(targetY, camera.position.y - 15 * delta);
        } else {
          camera.position.y = targetY;
        }
      } else {
        // Smoothly raise to standing height
        const targetY = GROUND_HEIGHT;
        if (camera.position.y < targetY) {
          camera.position.y = Math.min(targetY, camera.position.y + 15 * delta);
        } else {
          camera.position.y = targetY;
        }
      }
    } else {
      isGrounded.current = false;
      // Can't duck in air, but if already ducking and jumping, maintain relative height
    }

    // Calculate movement direction
    const frontVector = new Vector3(0, 0, Number(backward) - Number(forward));
    const sideVector = new Vector3(Number(left) - Number(right), 0, 0);
    const direction = new Vector3();

    direction
      .subVectors(frontVector, sideVector)
      .normalize()
      .multiplyScalar(currentSpeed * delta)
      .applyEuler(camera.rotation);

    // Calculate new position after movement
    const newX = camera.position.x + direction.x;
    const newZ = camera.position.z + direction.z;

    // Calculate distance from center for wall collision
    const distanceFromCenter = Math.sqrt(newX * newX + newZ * newZ);

    // Prevent player from passing through the wall
    if (distanceFromCenter >= WALL_RADIUS) {
      // Player is trying to go past the wall, prevent movement
      // Calculate the position on the wall boundary
      const angle = Math.atan2(newZ, newX);
      camera.position.x = Math.cos(angle) * WALL_RADIUS;
      camera.position.z = Math.sin(angle) * WALL_RADIUS;
    } else {
      // Check collision with objects before moving
      const currentHeight = duck ? DUCK_HEIGHT : GROUND_HEIGHT;
      const testPos = new Vector3(newX, currentHeight, newZ);

      if (!checkCollision(testPos, currentHeight)) {
        // Safe to move
        camera.position.x = newX;
        camera.position.z = newZ;
      }
      // If collision detected, don't update position (player stays in place)
    }

    // Calculate distance from center for fog effect only
    const finalPos = new Vector3(camera.position.x, 0, camera.position.z);
    const newDistance = finalPos.distanceTo(CENTER);

    // Update fog based on distance from center
    const fog = scene.fog as Fog | null;
    if (fog) {
      // Adjust fog near and far based on distance
      // Closer to center = less fog, further = more fog
      const fogIntensity = Math.max(
        0,
        Math.min(
          1,
          (newDistance - FOG_START_DISTANCE) /
            (FOG_MAX_DISTANCE - FOG_START_DISTANCE)
        )
      );

      // Fog starts closer and extends further as you move away from center
      fog.near = 5 + fogIntensity * 15; // 5 to 20
      fog.far = 30 + fogIntensity * 40; // 30 to 70
    }
  });

  return null;
};
