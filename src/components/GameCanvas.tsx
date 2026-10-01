import React, { useEffect, useRef, useState } from 'react';
import { GameSimulator, SimulatorState } from '../engine/GameSimulator';
import { Play, RotateCcw, Pause, Shield, Zap, Gauge, Compass } from 'lucide-react';

interface GameCanvasProps {
  simulator: GameSimulator | null;
  onInitSimulator: (sim: GameSimulator) => void;
  onOpenCode: () => void;
  onOpenTuner: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  simulator,
  onInitSimulator,
  onOpenCode,
  onOpenTuner,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<SimulatorState>('TITLE');
  const [hudStats, setHudStats] = useState({
    speed: 0,
    health: 100,
    nitro: 100,
    score: 0,
    distance: 0,
    multiplier: 1,
    difficulty: 1.0,
    onGrass: false,
    nearMiss: null as string | null,
  });

  // Initialize Simulator on mount
  useEffect(() => {
    if (!canvasRef.current) return;
    const sim = new GameSimulator(canvasRef.current);
    onInitSimulator(sim);
    sim.run();

    // Poll HUD telemetry at 30Hz for React state without degrading canvas loop
    const hudInterval = setInterval(() => {
      setGameState(sim.state);
      setHudStats({
        speed: Math.round(Math.abs(sim.carSpeed) * 0.45),
        health: Math.round(sim.carHealth),
        nitro: Math.round(sim.carNitro),
        score: Math.round(sim.score),
        distance: Number((sim.distance / 1000).toFixed(2)),
        multiplier: sim.multiplier,
        difficulty: Number(sim.difficulty.toFixed(1)),
        onGrass: sim.onGrass,
        nearMiss: sim.nearMissToast ? sim.nearMissToast.text : null,
      });
    }, 33);

    return () => {
      clearInterval(hudInterval);
      sim.destroy();
    };
  }, []);

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!simulator) return;

      const code = e.code;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(code)) {
        e.preventDefault();
      }

      if (code === 'KeyW' || code === 'ArrowUp') simulator.keys.up = true;
      if (code === 'KeyS' || code === 'ArrowDown') simulator.keys.down = true;
      if (code === 'KeyA' || code === 'ArrowLeft') simulator.keys.left = true;
      if (code === 'KeyD' || code === 'ArrowRight') simulator.keys.right = true;
      if (code === 'Space' || code === 'ShiftLeft' || code === 'ShiftRight') simulator.keys.nitro = true;

      if (code === 'KeyP') {
        simulator.pauseToggle();
      }

      if (code === 'KeyR' || code === 'Enter') {
        if (simulator.state === 'TITLE' || simulator.state === 'GAME_OVER') {
          simulator.start();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!simulator) return;

      const code = e.code;
      if (code === 'KeyW' || code === 'ArrowUp') simulator.keys.up = false;
      if (code === 'KeyS' || code === 'ArrowDown') simulator.keys.down = false;
      if (code === 'KeyA' || code === 'ArrowLeft') simulator.keys.left = false;
      if (code === 'KeyD' || code === 'ArrowRight') simulator.keys.right = false;
      if (code === 'Space' || code === 'ShiftLeft' || code === 'ShiftRight') simulator.keys.nitro = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [simulator]);

  // Touch handlers for on-screen controls
  const handleTouch = (action: keyof GameSimulator['keys'], active: boolean) => {
    if (!simulator) return;
    simulator.keys[action] = active;
  };

  return (
    <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center gap-6 py-4">
      {/* Editorial Headline & Feature Summary */}
      <div className="w-full text-center sm:text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h1 className="font-['Chakra_Petch'] text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Raylib C++20 Retro Racer Simulator
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Interactive in-browser execution mirroring the modular Raylib C++ game architecture.
          </p>
        </div>
        <div className="flex items-center justify-center sm:justify-end gap-3 text-xs text-slate-400">
          <span>Target: 60 FPS</span>
          <span aria-hidden="true">·</span>
          <span>Resolution: 800×900</span>
          <span aria-hidden="true">·</span>
          <span>Collision: Raylib OBB</span>
        </div>
      </div>

      {/* Main Viewport Container */}
      <div className="relative flex flex-col lg:flex-row items-center justify-center gap-6 w-full">
        {/* Playable Game Viewport */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-slate-800 bg-slate-950 shadow-2xl">
          <canvas
            ref={canvasRef}
            width={800}
            height={900}
            className="h-[560px] w-[370px] sm:h-[680px] sm:w-[450px] md:h-[750px] md:w-[500px] object-contain cursor-pointer select-none"
            onClick={() => {
              if (simulator && (gameState === 'TITLE' || gameState === 'GAME_OVER')) {
                simulator.start();
              }
            }}
          />

          {/* Near-Miss Toast Overlay */}
          {hudStats.nearMiss && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 transform rounded-md bg-amber-400 px-4 py-1 text-xs font-bold text-slate-950 shadow-lg animate-bounce pointer-events-none">
              {hudStats.nearMiss}
            </div>
          )}

          {/* Title Screen Overlay */}
          {gameState === 'TITLE' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-xs p-6 text-center">
              <span className="font-['Chakra_Petch'] text-3xl sm:text-4xl font-extrabold tracking-wider text-amber-400 drop-shadow-md">
                TURBO APEX RACER
              </span>
              <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-xs">
                Pure C++17/20 & Raylib Arcade Simulation with physics, AI traffic, and friction dynamics.
              </p>

              <div className="mt-6 flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900/90 p-4 text-left text-xs text-slate-300 max-w-sm w-full">
                <div className="flex justify-between">
                  <span className="font-mono text-slate-400">Drive / Steer</span>
                  <span className="font-semibold text-white">W, A, S, D / Arrow Keys</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-mono text-slate-400">Nitro Booster</span>
                  <span className="font-semibold text-sky-400">Spacebar / Shift</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-mono text-slate-400">Brake / Reverse</span>
                  <span className="font-semibold text-rose-400">S / Down Arrow</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-mono text-slate-400">Pause Game</span>
                  <span className="font-semibold text-white">P Key</span>
                </div>
              </div>

              <button
                onClick={() => simulator?.start()}
                className="mt-6 flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-3 font-['Chakra_Petch'] text-sm font-bold text-slate-950 shadow-lg hover:bg-amber-300 active:scale-95 transition-all"
              >
                <Play className="h-4 w-4 fill-slate-950" />
                START ENGINE
              </button>
            </div>
          )}

          {/* Game Over Screen Overlay */}
          {gameState === 'GAME_OVER' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-xs p-6 text-center">
              <span className="font-['Chakra_Petch'] text-3xl font-extrabold tracking-wider text-rose-500">
                CRITICAL COLLISION
              </span>
              <p className="mt-1 text-xs text-slate-400">Hull integrity reached 0%. Vehicle decommissioned.</p>

              <div className="mt-6 grid grid-cols-2 gap-3 rounded-xl border border-slate-800 bg-slate-900/90 p-4 text-xs max-w-xs w-full">
                <div className="text-left">
                  <div className="text-slate-400">Final Score</div>
                  <div className="text-base font-mono font-bold text-white tabular-nums">{hudStats.score}</div>
                </div>
                <div className="text-left">
                  <div className="text-slate-400">Distance</div>
                  <div className="text-base font-mono font-bold text-slate-200 tabular-nums">{hudStats.distance} km</div>
                </div>
                <div className="text-left">
                  <div className="text-slate-400">Top Speed</div>
                  <div className="text-base font-mono font-bold text-amber-400 tabular-nums">{hudStats.speed} km/h</div>
                </div>
                <div className="text-left">
                  <div className="text-slate-400">Max Difficulty</div>
                  <div className="text-base font-mono font-bold text-emerald-400 tabular-nums">{hudStats.difficulty}x</div>
                </div>
              </div>

              <button
                onClick={() => simulator?.start()}
                className="mt-6 flex items-center gap-2 rounded-xl bg-emerald-400 px-6 py-3 font-['Chakra_Petch'] text-sm font-bold text-slate-950 shadow-lg hover:bg-emerald-300 active:scale-95 transition-all"
              >
                <RotateCcw className="h-4 w-4" />
                REPAIR & RESTART [R]
              </button>
            </div>
          )}

          {/* Pause Screen Overlay */}
          {gameState === 'PAUSED' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/70 backdrop-blur-xs p-6 text-center">
              <span className="font-['Chakra_Petch'] text-3xl font-bold tracking-wider text-white">
                SIMULATION PAUSED
              </span>
              <button
                onClick={() => simulator?.pauseToggle()}
                className="mt-4 flex items-center gap-2 rounded-lg bg-amber-400 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-300"
              >
                <Play className="h-4 w-4 fill-slate-950" />
                RESUME [P]
              </button>
            </div>
          )}
        </div>

        {/* Live Telemetry Dashboard & Architecture Link Panel */}
        <div className="flex flex-col gap-4 w-full max-w-sm">
          {/* Real-time Telemetry Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">Live Telemetry</span>
              </div>
              <span className="text-xs font-mono text-emerald-400">60 FPS REALTIME</span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate-950/60 p-3 border border-slate-800/60">
                <div className="text-[11px] text-slate-400">Speed (KM/H)</div>
                <div className="mt-1 text-2xl font-mono font-bold text-amber-400 tabular-nums">
                  {hudStats.speed}
                </div>
              </div>

              <div className="rounded-lg bg-slate-950/60 p-3 border border-slate-800/60">
                <div className="text-[11px] text-slate-400">Score & Combo</div>
                <div className="mt-1 text-2xl font-mono font-bold text-white tabular-nums">
                  {hudStats.score}
                  {hudStats.multiplier > 1 && (
                    <span className="ml-1 text-xs text-emerald-400">x{hudStats.multiplier}</span>
                  )}
                </div>
              </div>

              <div className="rounded-lg bg-slate-950/60 p-3 border border-slate-800/60">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Hull HP</span>
                  <span className="font-mono text-xs">{hudStats.health}%</span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-150 ${
                      hudStats.health > 50 ? 'bg-emerald-400' : hudStats.health > 25 ? 'bg-amber-400' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.max(0, hudStats.health)}%` }}
                  />
                </div>
              </div>

              <div className="rounded-lg bg-slate-950/60 p-3 border border-slate-800/60">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Nitro (NOS)</span>
                  <span className="font-mono text-xs">{hudStats.nitro}%</span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-sky-400 transition-all duration-150"
                    style={{ width: `${Math.max(0, hudStats.nitro)}%` }}
                  />
                </div>
              </div>
            </div>

            {hudStats.onGrass && (
              <div className="mt-3 rounded bg-rose-500/20 border border-rose-500/40 p-2 text-center text-xs font-semibold text-rose-300">
                ⚠️ Off-Road Drag Active (Friction x3.5)
              </div>
            )}
          </div>

          {/* Quick Actions & C++ Navigation */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg flex flex-col gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">Architectural Inspect</span>
            <div className="flex flex-col gap-2">
              <button
                onClick={onOpenCode}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/70 px-4 py-2.5 text-xs font-medium text-slate-200 hover:border-amber-400/50 hover:bg-slate-900 transition-colors"
              >
                <span>Browse Raylib C++ Source Files</span>
                <span className="font-mono text-amber-400 text-[11px]">.hpp / .cpp →</span>
              </button>
              <button
                onClick={onOpenTuner}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/70 px-4 py-2.5 text-xs font-medium text-slate-200 hover:border-amber-400/50 hover:bg-slate-900 transition-colors"
              >
                <span>Live Physics Tuner & Snippet Generator</span>
                <span className="font-mono text-amber-400 text-[11px]">Tuning →</span>
              </button>
            </div>
          </div>

          {/* On-Screen Touch Controls for Mobile/Trackpad */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              On-Screen Controls
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div />
              <button
                onMouseDown={() => handleTouch('up', true)}
                onMouseUp={() => handleTouch('up', false)}
                onTouchStart={() => handleTouch('up', true)}
                onTouchEnd={() => handleTouch('up', false)}
                className="h-10 rounded-lg bg-slate-800 font-bold text-white active:bg-amber-400 active:text-slate-950 transition-colors text-xs flex items-center justify-center"
              >
                ▲ ACCEL
              </button>
              <button
                onMouseDown={() => handleTouch('nitro', true)}
                onMouseUp={() => handleTouch('nitro', false)}
                onTouchStart={() => handleTouch('nitro', true)}
                onTouchEnd={() => handleTouch('nitro', false)}
                className="h-10 rounded-lg bg-sky-950 border border-sky-800 font-bold text-sky-300 active:bg-sky-400 active:text-slate-950 transition-colors text-xs flex items-center justify-center"
              >
                <Zap className="h-3 w-3 mr-1" /> NOS
              </button>
              <button
                onMouseDown={() => handleTouch('left', true)}
                onMouseUp={() => handleTouch('left', false)}
                onTouchStart={() => handleTouch('left', true)}
                onTouchEnd={() => handleTouch('left', false)}
                className="h-10 rounded-lg bg-slate-800 font-bold text-white active:bg-amber-400 active:text-slate-950 transition-colors text-xs flex items-center justify-center"
              >
                ◄ LEFT
              </button>
              <button
                onMouseDown={() => handleTouch('down', true)}
                onMouseUp={() => handleTouch('down', false)}
                onTouchStart={() => handleTouch('down', true)}
                onTouchEnd={() => handleTouch('down', false)}
                className="h-10 rounded-lg bg-slate-800 font-bold text-white active:bg-amber-400 active:text-slate-950 transition-colors text-xs flex items-center justify-center"
              >
                ▼ BRAKE
              </button>
              <button
                onMouseDown={() => handleTouch('right', true)}
                onMouseUp={() => handleTouch('right', false)}
                onTouchStart={() => handleTouch('right', true)}
                onTouchEnd={() => handleTouch('right', false)}
                className="h-10 rounded-lg bg-slate-800 font-bold text-white active:bg-amber-400 active:text-slate-950 transition-colors text-xs flex items-center justify-center"
              >
                RIGHT ►
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
