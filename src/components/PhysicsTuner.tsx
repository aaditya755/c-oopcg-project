import React, { useState } from 'react';
import { GameTuningConfig, DEFAULT_CONFIG } from '../engine/GameSimulator';
import { Sliders, RotateCcw, Copy, Check, Sparkles } from 'lucide-react';

interface PhysicsTunerProps {
  config: GameTuningConfig;
  onUpdateConfig: (newConfig: Partial<GameTuningConfig>) => void;
  onOpenSimulator: () => void;
}

export const PhysicsTuner: React.FC<PhysicsTunerProps> = ({
  config,
  onUpdateConfig,
  onOpenSimulator,
}) => {
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const handleReset = () => {
    onUpdateConfig(DEFAULT_CONFIG);
  };

  const cppCodeSnippet = `// Applied custom parameters in Car::Reset() / Car.cpp:
void Car::Reset() {
    position = { ROAD_CENTER_X, SCREEN_HEIGHT - 160.0f };
    size = { 38.0f, 72.0f };

    maxForwardSpeed  = ${config.maxSpeed}.0f;  // Top speed (${Math.round(config.maxSpeed * 0.45)} KM/H)
    accelerationRate = ${config.accelerationRate}.0f;  // Linear thrust rate
    brakingRate      = ${config.brakingRate}.0f;  // Brake deceleration
    turnRate         = ${config.turnRate}.0f;  // Lateral steering rate
    naturalFriction  = 120.0f;
    health           = 100.0f;
    nitro            = 100.0f;
}`;

  const copySnippet = () => {
    navigator.clipboard.writeText(cppCodeSnippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="mx-auto w-full max-w-4xl py-6 px-4 sm:px-6 space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-amber-400" />
            <h2 className="font-['Chakra_Petch'] text-2xl font-bold text-white tracking-wide">
              Live Vehicle Physics Tuner
            </h2>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Adjust telemetry variables in real time. Changes immediately affect the active game simulation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Defaults
          </button>
          <button
            onClick={onOpenSimulator}
            className="flex items-center gap-1.5 rounded-lg bg-amber-400 px-4 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-300 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Test in Simulator
          </button>
        </div>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Max Speed */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white">Max Forward Speed</span>
            <span className="font-mono text-amber-400 font-bold">
              {config.maxSpeed} px/s ({Math.round(config.maxSpeed * 0.45)} KM/H)
            </span>
          </div>
          <input
            type="range"
            min={240}
            max={720}
            step={20}
            value={config.maxSpeed}
            onChange={(e) => onUpdateConfig({ maxSpeed: Number(e.target.value) })}
            className="w-full accent-amber-400 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>240 (Cruiser)</span>
            <span>480 (Default)</span>
            <span>720 (Hyperspeed)</span>
          </div>
        </div>

        {/* Acceleration */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white">Acceleration Rate</span>
            <span className="font-mono text-sky-400 font-bold">{config.accelerationRate} px/s²</span>
          </div>
          <input
            type="range"
            min={150}
            max={650}
            step={25}
            value={config.accelerationRate}
            onChange={(e) => onUpdateConfig({ accelerationRate: Number(e.target.value) })}
            className="w-full accent-sky-400 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>150 (Gradual)</span>
            <span>320 (Standard)</span>
            <span>650 (Instant Torque)</span>
          </div>
        </div>

        {/* Braking Rate */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white">Braking Deceleration</span>
            <span className="font-mono text-rose-400 font-bold">{config.brakingRate} px/s²</span>
          </div>
          <input
            type="range"
            min={300}
            max={900}
            step={50}
            value={config.brakingRate}
            onChange={(e) => onUpdateConfig({ brakingRate: Number(e.target.value) })}
            className="w-full accent-rose-400 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>300 (Soft Brake)</span>
            <span>580 (Standard)</span>
            <span>900 (Carbon Ceramic)</span>
          </div>
        </div>

        {/* Steering Turn Rate */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white">Steering Agility</span>
            <span className="font-mono text-emerald-400 font-bold">{config.turnRate} deg/s</span>
          </div>
          <input
            type="range"
            min={100}
            max={320}
            step={10}
            value={config.turnRate}
            onChange={(e) => onUpdateConfig({ turnRate: Number(e.target.value) })}
            className="w-full accent-emerald-400 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>100 (Heavy)</span>
            <span>180 (Balanced)</span>
            <span>320 (Twitchy)</span>
          </div>
        </div>

        {/* Traffic Density */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white">Traffic Density</span>
            <span className="font-mono text-purple-400 font-bold">{config.trafficDensity}x</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={2.2}
            step={0.1}
            value={config.trafficDensity}
            onChange={(e) => onUpdateConfig({ trafficDensity: Number(e.target.value) })}
            className="w-full accent-purple-400 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>0.5x (Quiet)</span>
            <span>1.0x (Normal)</span>
            <span>2.2x (Rush Hour)</span>
          </div>
        </div>

        {/* Camera Shake Rumble */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white">Impact Rumble / Shake</span>
            <span className="font-mono text-amber-300 font-bold">{config.rumbleIntensity}x</span>
          </div>
          <input
            type="range"
            min={0.0}
            max={2.0}
            step={0.1}
            value={config.rumbleIntensity}
            onChange={(e) => onUpdateConfig({ rumbleIntensity: Number(e.target.value) })}
            className="w-full accent-amber-300 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>0.0 (None)</span>
            <span>1.0 (Realistic)</span>
            <span>2.0 (High Shock)</span>
          </div>
        </div>
      </div>

      {/* Generated C++ Snippet Preview */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Generated C++ Configuration Block (Car.cpp)
          </span>
          <button
            onClick={copySnippet}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-200 hover:text-white"
          >
            {copiedSnippet ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copiedSnippet ? 'Copied!' : 'Copy Snippet'}</span>
          </button>
        </div>

        <pre className="p-4 rounded-xl bg-[#070b14] border border-slate-800/80 font-mono text-xs text-amber-300/90 overflow-x-auto">
          {cppCodeSnippet}
        </pre>
      </div>
    </div>
  );
};
