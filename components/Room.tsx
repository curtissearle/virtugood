import React from "react";
import { useFrame } from "@react-three/fiber";
import { Grid } from "@react-three/drei";
import { Vector2, DoubleSide } from "three";
import { ScatteredObject, generateScatteredObjects } from "./scatterData";

// Force the raycaster to always cast from the center of the screen
// This is necessary because PointerLockControls disconnects the mouse position
const CenterRaycaster: React.FC = () => {
  useFrame((state) => {
    state.raycaster.setFromCamera(new Vector2(0, 0), state.camera);
  });
  return null;
};

interface RoomProps {
  onDeleteFile?: () => void;
}

export const Room: React.FC<RoomProps> = ({ onDeleteFile }) => {
  const scatteredObjects = React.useMemo(() => generateScatteredObjects(), []);

  return (
    <group>
      <CenterRaycaster />

      {/* Expanded Infinite Checkerboard Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.2} />
      </mesh>

      {/* Expanded Grid overlay to enhance the VR feel */}
      <Grid
        position={[0, 0.01, 0]}
        args={[500, 500]}
        cellSize={2}
        cellThickness={1}
        cellColor="#64748b"
        sectionSize={10}
        sectionThickness={1.5}
        sectionColor="#94a3b8"
        fadeDistance={80}
        infiniteGrid
      />

      {/* Classical Columns */}
      <Column position={[-8, 0, -5]} />
      <Column position={[-8, 0, 5]} />
      <Column position={[-8, 0, 15]} />
      <Column position={[8, 0, -5]} />
      <Column position={[8, 0, 5]} />
      <Column position={[8, 0, 15]} />

      {/* The Giant (Silver Humanoid Abstract) */}
      <group position={[30, 0, -30]} rotation={[0, -Math.PI / 4, 0]}>
        {/* Torso */}
        <mesh position={[0, 12, 0]} castShadow>
          <cylinderGeometry args={[4, 3, 12, 8]} />
          <meshStandardMaterial
            color="#cbd5e1"
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
        {/* Head */}
        <mesh position={[0, 20, 0]} castShadow>
          <sphereGeometry args={[3, 16, 16]} />
          <meshStandardMaterial
            color="#cbd5e1"
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
        {/* Arms */}
        <mesh position={[-5, 12, 2]} rotation={[0, 0, 0.5]} castShadow>
          <cylinderGeometry args={[1, 1, 10]} />
          <meshStandardMaterial
            color="#cbd5e1"
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
        <mesh position={[5, 12, 2]} rotation={[0, 0, -0.5]} castShadow>
          <cylinderGeometry args={[1, 1, 10]} />
          <meshStandardMaterial
            color="#cbd5e1"
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
      </group>

      {/* Manually Scattered Objects */}
      <ScatteredObjects objects={scatteredObjects} />

      {/* Massive Circular Wall */}
      <CircularWall radius={75} />
    </group>
  );
};

// Massive circular wall component - hollow cylinder using torus
const CircularWall: React.FC<{ radius: number }> = ({ radius }) => {
  const WALL_HEIGHT = 50;
  const radialSegments = 96;

  return (
    <mesh rotation={[0, 0, 0]} castShadow receiveShadow>
      {/* Single open-ended cylinder to minimize draw calls */}
      <cylinderGeometry
        args={[radius, radius, WALL_HEIGHT, radialSegments, 1, true]}
      />
      <meshStandardMaterial
        color="#475569"
        metalness={0.7}
        roughness={0.3}
        side={DoubleSide} // view both inside/outside
      />
    </mesh>
  );
};

const Column: React.FC<{ position: [number, number, number] }> = ({
  position,
}) => {
  return (
    <group position={position}>
      {/* Base */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[2, 1, 2]} />
        <meshStandardMaterial color="#e2e8f0" />
      </mesh>
      {/* Shaft */}
      <mesh position={[0, 6, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.8, 0.8, 10, 16]} />
        <meshStandardMaterial color="#f1f5f9" />
      </mesh>
      {/* Capital */}
      <mesh position={[0, 11.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 1, 1.8]} />
        <meshStandardMaterial color="#e2e8f0" />
      </mesh>
      {/* Ionic details (abstract) */}
      <mesh position={[0.6, 11.5, 0.6]}>
        <cylinderGeometry args={[0.3, 0.3, 1.2]} />
        <meshStandardMaterial color="#cbd5e1" />
      </mesh>
      <mesh position={[-0.6, 11.5, -0.6]}>
        <cylinderGeometry args={[0.3, 0.3, 1.2]} />
        <meshStandardMaterial color="#cbd5e1" />
      </mesh>
    </group>
  );
};

// Manually scattered objects within the wall
const ScatteredObjects: React.FC<{ objects: ScatteredObject[] }> = ({
  objects,
}) => {
  return (
    <>
      {objects.map((obj) => (
        <RandomObject
          key={obj.key}
          position={obj.position}
          type={obj.type}
          size={obj.size}
          rotation={obj.rotation}
          colorIndex={obj.colorIndex}
        />
      ))}
    </>
  );
};

const RandomObject: React.FC<{
  position: [number, number, number];
  type: number;
  size: number;
  rotation: number;
  colorIndex: number;
}> = ({ position, type, size, rotation, colorIndex }) => {
  const colors = [
    "#8b5cf6", // Purple
    "#ec4899", // Pink
    "#06b6d4", // Cyan
    "#f59e0b", // Amber
    "#10b981", // Emerald
    "#ef4444", // Red
  ];

  const color = colors[colorIndex % colors.length];

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {type === 0 && (
        <mesh castShadow>
          <boxGeometry args={[size, size * 1.5, size]} />
          <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
        </mesh>
      )}
      {type === 1 && (
        <mesh castShadow>
          <cylinderGeometry args={[size * 0.5, size * 0.5, size * 2, 8]} />
          <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
        </mesh>
      )}
      {type === 2 && (
        <mesh castShadow>
          <sphereGeometry args={[size * 0.7, 16, 16]} />
          <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
        </mesh>
      )}
      {type === 3 && (
        <mesh castShadow>
          <coneGeometry args={[size * 0.7, size * 2, 8]} />
          <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
        </mesh>
      )}
    </group>
  );
};
