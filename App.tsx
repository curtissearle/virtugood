import React, { useState, useRef } from "react";
import { Scene } from "./components/Scene";
import { Overlay } from "./components/Overlay";

const App: React.FC = () => {
  const [isLocked, setIsLocked] = useState(false);
  const [memory, setMemory] = useState(64); // Start with 64MB

  // Use a ref to access the PointerLockControls instance directly
  // This avoids race conditions and issues with raw DOM queries
  const controlsRef = useRef<any>(null);

  const handleStart = () => {
    // Try to lock via the controls instance first (must be part of user gesture)
    if (controlsRef.current?.lock) {
      controlsRef.current.lock();
      // Set locked state after attempting lock
      setIsLocked(true);
      return;
    }

    // Fallback: request pointer lock directly on canvas (user gesture required)
    const canvas = document.querySelector("canvas") as HTMLCanvasElement | null;
    if (canvas && "requestPointerLock" in canvas) {
      try {
        canvas.requestPointerLock();
        setIsLocked(true);
      } catch (err) {
        console.warn("requestPointerLock failed", err);
      }
      return;
    }

    // If controls aren't ready yet, set state and let useEffect handle it
    setIsLocked(true);
  };

  const handleFileDelete = () => {
    setMemory((prev) => prev + 64); // Double the memory!
  };

  return (
    <div className="relative w-full h-full bg-slate-900">
      <Scene
        isLocked={isLocked}
        onLock={() => setIsLocked(true)}
        onUnlock={() => setIsLocked(false)}
        onDeleteFile={handleFileDelete}
        controlsRef={controlsRef}
      />
      <Overlay isLocked={isLocked} onStart={handleStart} memory={memory} />
    </div>
  );
};

export default App;
