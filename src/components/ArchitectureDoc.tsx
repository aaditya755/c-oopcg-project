import React from 'react';
import { Terminal, Layers, Cpu, Compass, BookOpen, ShieldCheck } from 'lucide-react';

export const ArchitectureDoc: React.FC = () => {
  return (
    <div className="mx-auto w-full max-w-5xl py-8 px-4 sm:px-6 space-y-12">
      {/* Overview Banner */}
      <div className="border-b border-slate-800 pb-6">
        <h2 className="font-['Chakra_Petch'] text-3xl font-bold text-white tracking-wide">
          Raylib C++20 Retro Racer Architecture & Engineering Specification
        </h2>
        <p className="mt-2 text-sm sm:text-base text-slate-400 leading-relaxed">
          In-depth documentation covering modular OOP design, frame pacing, vehicle physics equations,
          collision detection mathematics, and multi-platform compilation workflows.
        </p>
      </div>

      {/* Section 1: Modular Subsystem Breakdown */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-amber-400" />
          <h3 className="font-['Chakra_Petch'] text-xl font-bold text-white">
            01. Modular Class Design & Subsystem Hierarchy
          </h3>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">
          The game conforms to strict separation of concerns, avoiding monolithic game loops or hidden global state.
          Each subsystem owns its state, resources, update cycle, and rendering pass.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <h4 className="font-mono text-sm font-bold text-amber-400">Game (Coordinator)</h4>
            <p className="mt-1 text-xs text-slate-300 leading-relaxed">
              Orchestrates the frame loop at 60 FPS, tracks session score/distance, manages the state machine
              (<code>TITLE</code>, <code>PLAYING</code>, <code>PAUSED</code>, <code>GAME_OVER</code>), generates camera
              shake matrices on collision, and triggers the dynamic difficulty scaler.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <h4 className="font-mono text-sm font-bold text-sky-400">Car (Player Vehicle)</h4>
            <p className="mt-1 text-xs text-slate-300 leading-relaxed">
              Simulates throttle acceleration, progressive braking, lateral tire steering drag, and off-road penalty
              when tires cross asphalt boundaries. Emits procedural particle flame exhausts and manages tire skid marks.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <h4 className="font-mono text-sm font-bold text-emerald-400">Track (Infinite World Highway)</h4>
            <p className="mt-1 text-xs text-slate-300 leading-relaxed">
              Renders the 4-lane asphalt highway, alternating red/white rumble curb strips, segmented lane dashes,
              gravel shoulders, and roadside parallax scenery trees with speed illusions.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <h4 className="font-mono text-sm font-bold text-purple-400">Obstacle (AI Traffic & Hazards)</h4>
            <p className="mt-1 text-xs text-slate-300 leading-relaxed">
              Spawns distinct vehicle archetypes: cruising Sedans, high-velocity Supercars, heavy Semi-Trucks with
              extended hitboxes, spinning Oil Slick traps, and restorative Health Kits.
            </p>
          </div>
        </div>
      </section>

      {/* Section 2: Game Loop & Raylib Lifecycle */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Cpu className="h-5 w-5 text-amber-400" />
          <h3 className="font-['Chakra_Petch'] text-xl font-bold text-white">
            02. Game Loop & Frame-Rate Management
          </h3>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">
          Raylib handles low-level window creation, OpenGL context allocation, and V-Sync. Our main loop ensures
          deterministic physics independent of variable hardware refresh rates:
        </p>

        <div className="rounded-xl border border-slate-800 bg-[#080d1a] p-4 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
{`void Game::Run() {
    while (!WindowShouldClose()) {
        // Retrieve frame delta time clamped against large latency spikes (e.g. window dragging)
        float deltaTime = GetFrameTime();
        if (deltaTime > 0.05f) deltaTime = 0.05f;

        ProcessInput();
        Update(deltaTime);
        Render();
    }
}`}
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 text-xs text-slate-300 space-y-2">
          <p className="font-semibold text-white">Raylib Rendering Contract:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><code>BeginDrawing()</code> binds the default framebuffer and clears GPU draw calls.</li>
            <li><code>ClearBackground(COLOR)</code> clears the color buffer.</li>
            <li><code>rlPushMatrix()</code> and <code>rlRotatef()</code> apply hardware-accelerated matrix transformations for rotating vehicle sprites without texture degradation.</li>
            <li><code>EndDrawing()</code> swaps double-buffers and synchronizes frame timing against <code>SetTargetFPS(60)</code>.</li>
          </ul>
        </div>
      </section>

      {/* Section 3: Physics & Collision Mathematics */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Compass className="h-5 w-5 text-amber-400" />
          <h3 className="font-['Chakra_Petch'] text-xl font-bold text-white">
            03. Longitudinal & Lateral Physics Equations
          </h3>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">
          The vehicle dynamics model simulates continuous momentum, grip, and surface friction:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs space-y-2">
            <span className="font-bold text-amber-400">Acceleration & Natural Drag</span>
            <div className="font-mono bg-slate-950 p-2.5 rounded text-[11px] text-slate-300">
              v(t + Δt) = v(t) + (a_throttle - f_drag) · Δt
            </div>
            <p className="text-slate-400">
              When throttle is released, natural tire friction <code>f_drag = 120.0f</code> smoothly decelerates the vehicle.
              Driving on grass amplifies friction by 3.5× and caps maximum velocity to 45%.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs space-y-2">
            <span className="font-bold text-sky-400">Two-Phase Collision Detection</span>
            <div className="font-mono bg-slate-950 p-2.5 rounded text-[11px] text-slate-300">
              distSq &lt; (radiusA + radiusB)² → OBB Local Projection
            </div>
            <p className="text-slate-400">
              Phase 1 runs a rapid bounding circle radius test to prune 95% of candidates.
              Phase 2 rotates the obstacle center into the player car’s local coordinate frame via trigonometry to perform precise intersection.
            </p>
          </div>
        </div>
      </section>

      {/* Section 4: Multi-Platform Compilation Guide */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Terminal className="h-5 w-5 text-amber-400" />
          <h3 className="font-['Chakra_Petch'] text-xl font-bold text-white">
            04. Multi-Platform Compilation Instructions
          </h3>
        </div>

        <div className="space-y-4">
          {/* Ubuntu / Debian */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="flex items-center justify-between text-xs font-bold text-white mb-2">
              <span>Linux (Ubuntu / Debian / Pop!_OS)</span>
              <span className="font-mono text-emerald-400">GCC / G++ 11+</span>
            </div>
            <pre className="font-mono text-xs bg-slate-950 p-3 rounded text-slate-300 overflow-x-auto">
{`# 1. Install Raylib and graphics dev headers
sudo apt update && sudo apt install -y libraylib-dev cmake g++ git

# 2. Build with CMake
mkdir -p build && cd build
cmake ..
cmake --build .

# 3. Launch game
./RaylibRetroRacer`}
            </pre>
          </div>

          {/* macOS */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="flex items-center justify-between text-xs font-bold text-white mb-2">
              <span>macOS (Apple Silicon & Intel)</span>
              <span className="font-mono text-sky-400">Clang + Homebrew</span>
            </div>
            <pre className="font-mono text-xs bg-slate-950 p-3 rounded text-slate-300 overflow-x-auto">
{`# 1. Install Raylib via Homebrew
brew install raylib cmake

# 2. Build via CMake
mkdir -p build && cd build
cmake ..
cmake --build .

# 3. Launch
./RaylibRetroRacer`}
            </pre>
          </div>

          {/* Windows */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="flex items-center justify-between text-xs font-bold text-white mb-2">
              <span>Windows (MSYS2 / MinGW-w64 or Visual Studio)</span>
              <span className="font-mono text-amber-400">MinGW / MSVC</span>
            </div>
            <pre className="font-mono text-xs bg-slate-950 p-3 rounded text-slate-300 overflow-x-auto">
{`# Option A: MSYS2 MinGW-w64 terminal
pacman -S mingw-w64-x86_64-raylib mingw-w64-x86_64-cmake make
mkdir build && cd build
cmake -G "MinGW Makefiles" ..
cmake --build .
./RaylibRetroRacer.exe

# Option B: Direct 1-command compilation with g++:
g++ -std=c++17 -O2 single_file/main_single.cpp -lraylib -lopengl32 -lgdi32 -lwinmm -o RetroRacer.exe`}
            </pre>
          </div>
        </div>
      </section>

      {/* Section 5: Memory Safety & Zero-Dependency Guarantee */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <ShieldCheck className="h-8 w-8 text-emerald-400 shrink-0" />
        <div className="text-xs text-slate-300 leading-relaxed">
          <strong className="text-sm text-white block mb-1">RAII & Modern C++ Memory Safety Guarantee</strong>
          Every entity vector (particles, traffic, skid marks) utilizes standard STL containers (<code>std::vector</code>)
          with automatic lifetime management. Zero manual <code>malloc/free</code> or unmanaged raw pointers are present,
          preventing memory leaks and dangling pointer crashes across long play sessions.
        </div>
      </section>
    </div>
  );
};
