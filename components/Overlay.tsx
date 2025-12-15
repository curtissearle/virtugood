import React, { useEffect, useRef } from "react";
import { Terminal, Cpu, HardDrive } from "lucide-react";

interface OverlayProps {
  isLocked: boolean;
  onStart: () => void;
  memory: number;
}

export const Overlay: React.FC<OverlayProps> = ({
  isLocked,
  onStart,
  memory,
}) => {
  const hasStartedRef = useRef(false);
  const onStartRef = useRef(onStart);

  // Update refs
  useEffect(() => {
    onStartRef.current = onStart;
  }, [onStart]);

  // Reset hasStarted when overlay becomes visible again
  useEffect(() => {
    if (!isLocked) {
      hasStartedRef.current = false;
    }
  }, [isLocked]);

  // Handle Enter key press - only when not locked
  useEffect(() => {
    if (isLocked) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !hasStartedRef.current) {
        e.preventDefault();
        e.stopPropagation();
        hasStartedRef.current = true;
        onStartRef.current();
      }
    };

    window.addEventListener("keydown", handleKeyDown, { once: false });
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLocked]);

  // Completely hide overlay when game is entered
  if (isLocked) {
    return null;
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50 overflow-hidden">
      {/* Blurred halo around the center content */}
      <div
        className="absolute inset-0 backdrop-blur-xl bg-black/60 pointer-events-none"
        style={{
          WebkitMaskImage:
            "radial-gradient(circle at center, transparent 0%, transparent 260px, black 340px)",
          maskImage:
            "radial-gradient(circle at center, transparent 0%, transparent 260px, black 340px)",
        }}
      />
      {/* Scanline effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_4px,3px_100%] pointer-events-none" />

      <div className="relative z-20 bg-black/80 border-2 border-green-600 p-12 max-w-lg w-full shadow-[0_0_50px_rgba(22,163,74,0.3)] pointer-events-auto">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="border-b-2 border-green-600 w-full pb-4 mb-2">
            <h1
              className="text-5xl font-mono font-bold text-green-500 tracking-tighter"
              style={{ textShadow: "2px 2px 0px rgba(0,50,0,1)" }}
            >
              VIRTUGOOD
            </h1>
            <p className="text-green-400 font-mono text-xl tracking-widest mt-2">
              6500
            </p>
          </div>

          <p className="text-green-300/80 font-mono text-sm leading-relaxed max-w-sm">
            INITIALIZING VIRTUAL ENVIRONMENT...
            <br />
            LOADING ASSETS...
            <br />
            LAWNMOWER.BIN NOT FOUND.
            <br />
            ENTERING SAFE MODE.
          </p>

          <div className="grid grid-cols-2 gap-4 w-full font-mono text-green-400 text-sm border border-green-800 p-4 bg-green-900/10">
            <div className="flex items-center space-x-2">
              <Terminal size={16} />
              <span>WASD to NAVIGATE</span>
            </div>
            <div className="flex items-center space-x-2">
              <Cpu size={16} />
              <span>MOUSE to LOOK</span>
            </div>
            <div className="flex items-center space-x-2">
              <HardDrive size={16} />
              <span>SPACE to JUMP</span>
            </div>
            <div className="flex items-center space-x-2">
              <HardDrive size={16} />
              <span>CTRL to DUCK</span>
            </div>
            <div className="flex items-center space-x-2">
              <HardDrive size={16} />
              <span>SHIFT to WALK SLOW</span>
            </div>
            <div className="flex items-center space-x-2">
              <HardDrive size={16} />
              <span>CLICK to SELECT</span>
            </div>
          </div>

          <p className="mt-8 text-green-400 font-mono text-lg uppercase tracking-widest">
            PRESS ENTER TO START
          </p>

          <p className="text-xs text-green-900 font-mono mt-4">
            COPYRIGHT 1995
          </p>
        </div>
      </div>
    </div>
  );
};
