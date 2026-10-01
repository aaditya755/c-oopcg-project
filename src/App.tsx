import React, { useState, useCallback } from 'react';
import JSZip from 'jszip';
import { GameSimulator, GameTuningConfig, DEFAULT_CONFIG } from './engine/GameSimulator';
import { CPP_PROJECT_FILES } from './data/cppProjectFiles';
import { TopNav } from './components/TopNav';
import { GameCanvas } from './components/GameCanvas';
import { CodeViewer } from './components/CodeViewer';
import { ArchitectureDoc } from './components/ArchitectureDoc';
import { PhysicsTuner } from './components/PhysicsTuner';
import { retroAudio } from './engine/RetroAudio';

export default function App() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'code' | 'architecture' | 'tuner'>('simulator');
  const [simulator, setSimulator] = useState<GameSimulator | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [tuningConfig, setTuningConfig] = useState<GameTuningConfig>(DEFAULT_CONFIG);
  const [isDownloadingZip, setIsDownloadingZip] = useState<boolean>(false);

  const handleInitSimulator = useCallback((sim: GameSimulator) => {
    setSimulator(sim);
  }, []);

  const handleToggleMute = useCallback(() => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    retroAudio.setMuted(nextMute);
    if (simulator) {
      simulator.setTuningConfig({ enableAudio: !nextMute });
    }
  }, [isMuted, simulator]);

  const handleUpdateConfig = useCallback((newConfig: Partial<GameTuningConfig>) => {
    setTuningConfig((prev) => {
      const updated = { ...prev, ...newConfig };
      if (simulator) {
        simulator.setTuningConfig(updated);
      }
      return updated;
    });
  }, [simulator]);

  // Download entire C++ project as a clean .ZIP archive
  const handleDownloadZip = async () => {
    try {
      setIsDownloadingZip(true);
      const zip = new JSZip();

      // Create root folder inside zip
      const rootFolder = zip.folder('RaylibRetroRacer');
      if (!rootFolder) throw new Error('Zip initialization error');

      for (const file of CPP_PROJECT_FILES) {
        rootFolder.file(file.path, file.content);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'RaylibRetroRacer_Cpp.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate ZIP:', err);
    } finally {
      setIsDownloadingZip(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* Top Bar Contract compliant with Frontend Constitution */}
      <TopNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMuted={isMuted}
        toggleMute={handleToggleMute}
        onDownloadZip={handleDownloadZip}
        isDownloadingZip={isDownloadingZip}
      />

      {/* Main View Area */}
      <main className="flex-1 w-full">
        {activeTab === 'simulator' && (
          <GameCanvas
            simulator={simulator}
            onInitSimulator={handleInitSimulator}
            onOpenCode={() => setActiveTab('code')}
            onOpenTuner={() => setActiveTab('tuner')}
          />
        )}

        {activeTab === 'code' && (
          <CodeViewer
            onDownloadZip={handleDownloadZip}
            isDownloadingZip={isDownloadingZip}
          />
        )}

        {activeTab === 'architecture' && <ArchitectureDoc />}

        {activeTab === 'tuner' && (
          <PhysicsTuner
            config={tuningConfig}
            onUpdateConfig={handleUpdateConfig}
            onOpenSimulator={() => setActiveTab('simulator')}
          />
        )}
      </main>

      {/* Clean quiet footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 px-4 text-center text-xs text-slate-500">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span>Modern C++17/20 & Raylib 5.0 Racing Architecture</span>
          <span aria-hidden="true">·</span>
          <span>Zero External Runtime Asset Dependencies</span>
          <span aria-hidden="true">·</span>
          <span>Desktop & Web (Emscripten) Compatible</span>
        </div>
      </footer>
    </div>
  );
}
