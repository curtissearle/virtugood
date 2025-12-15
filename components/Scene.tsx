import React from "react";
import { Canvas } from "@react-three/fiber";
import { PointerLockControls, Stars } from "@react-three/drei";
import { Room } from "./Room";
import { Player } from "./Player";

interface SceneProps {
  isLocked: boolean;
  onUnlock: () => void;
  onLock: () => void;
  onDeleteFile: () => void;
  controlsRef: React.MutableRefObject<any>;
}

export const Scene: React.FC<SceneProps> = ({
  isLocked,
  onUnlock,
  onLock,
  onDeleteFile,
  controlsRef,
}) => {
  return (
    <div className="w-full h-full bg-black">
      <Canvas shadows camera={{ fov: 60, position: [0, 2, 10] }}>
        {/* Retro VR Sky Color */}
        <color attach="background" args={["#a855f7"]} />

        {/* Dynamic Fog of War - starts light, gets denser as you move from center */}
        <fog attach="fog" args={["#a855f7", 5, 30]} />

        {/* 90s Lighting - Ambient and Directional, slightly flat */}
        <ambientLight intensity={0.8} color="#e0e7ff" />
        <directionalLight
          position={[10, 20, 10]}
          intensity={1.2}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        {/* Strange purple underglow */}
        <pointLight
          position={[0, -5, 0]}
          intensity={1}
          color="#d946ef"
          distance={20}
        />

        <Room onDeleteFile={onDeleteFile} />
        <Player isLocked={isLocked} />

        <PointerLockControls
          ref={controlsRef}
          onUnlock={onUnlock}
          onLock={onLock}
        />

        {/* Subtle stars in the purple sky */}
        <Stars
          radius={100}
          depth={50}
          count={5000}
          factor={4}
          saturation={0}
          fade
          speed={1}
        />
      </Canvas>
    </div>
  );
};
