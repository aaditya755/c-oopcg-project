import React, { useState, useMemo } from 'react';
import { CPP_PROJECT_FILES, CppFile } from '../data/cppProjectFiles';
import { Copy, Check, Download, FileCode, Folder, Search, FileText } from 'lucide-react';

interface CodeViewerProps {
  onDownloadZip: () => void;
  isDownloadingZip: boolean;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ onDownloadZip, isDownloadingZip }) => {
  const [selectedFilePath, setSelectedFilePath] = useState<string>('src/Game.cpp');
  const [copied, setCopied] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const currentFile = useMemo(() => {
    return CPP_PROJECT_FILES.find((f) => f.path === selectedFilePath) || CPP_PROJECT_FILES[0];
  }, [selectedFilePath]);

  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return CPP_PROJECT_FILES;
    const q = searchQuery.toLowerCase();
    return CPP_PROJECT_FILES.filter(
      (f) => f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSingle = () => {
    const blob = new Blob([currentFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = currentFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderCodeWithLineNumbers = (code: string) => {
    const lines = code.split('\n');
    return (
      <div className="flex font-mono text-xs sm:text-[13px] leading-relaxed">
        {/* Line numbers gutter */}
        <div className="select-none py-4 pl-3 pr-4 text-right text-slate-600 border-r border-slate-800/80 bg-slate-950/60 font-mono">
          {lines.map((_, i) => (
            <div key={i} className="tabular-nums">
              {i + 1}
            </div>
          ))}
        </div>
        {/* Code text content */}
        <div className="overflow-x-auto py-4 px-5 text-slate-200 w-full whitespace-pre font-mono">
          {lines.map((line, idx) => {
            // Lightweight syntax highlighting helpers
            let formattedLine: React.ReactNode = line;
            if (line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim().startsWith('*')) {
              formattedLine = <span className="text-slate-500 italic">{line}</span>;
            } else if (line.trim().startsWith('#')) {
              formattedLine = <span className="text-pink-400 font-semibold">{line}</span>;
            } else if (line.includes('class ') || line.includes('struct ') || line.includes('enum class ')) {
              formattedLine = <span className="text-amber-300">{line}</span>;
            }

            return (
              <div key={idx} className="hover:bg-slate-900/40">
                {formattedLine}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto w-full max-w-7xl py-6 px-4 sm:px-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="font-['Chakra_Petch'] text-2xl font-bold text-white tracking-wide">
            C++17/20 Raylib Source Codebase
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Complete, modular object-oriented project structure with zero omitted logic or stubs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:border-slate-500 hover:text-white transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy File'}</span>
          </button>

          <button
            onClick={handleDownloadSingle}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:border-slate-500 hover:text-white transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download {currentFile.name}</span>
          </button>

          <button
            onClick={onDownloadZip}
            disabled={isDownloadingZip}
            className="flex items-center gap-1.5 rounded-lg bg-amber-400 px-4 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-300 transition-colors disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{isDownloadingZip ? 'Archiving...' : 'Download Full Project (.ZIP)'}</span>
          </button>
        </div>
      </div>

      {/* Main File Explorer & Code Pane */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden">
        {/* Left Sidebar: File Tree */}
        <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-900/60 p-4 flex flex-col">
          {/* File Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search project files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950/80 py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-amber-400 focus:outline-none"
            />
          </div>

          {/* Categorized File List */}
          <div className="space-y-4 overflow-y-auto max-h-[600px] pr-1">
            {/* Headers */}
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                <Folder className="h-3.5 w-3.5 text-amber-400" />
                <span>Headers (include/)</span>
              </div>
              <div className="mt-1 space-y-1">
                {filteredFiles
                  .filter((f) => f.path.startsWith('include/'))
                  .map((file) => (
                    <button
                      key={file.path}
                      onClick={() => setSelectedFilePath(file.path)}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-left transition-colors ${
                        selectedFilePath === file.path
                          ? 'bg-amber-400 text-slate-950 font-bold'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileCode className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{file.name}</span>
                      </div>
                      <span className="text-[10px] opacity-75">HPP</span>
                    </button>
                  ))}
              </div>
            </div>

            {/* Implementation Sources */}
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                <Folder className="h-3.5 w-3.5 text-sky-400" />
                <span>Implementations (src/)</span>
              </div>
              <div className="mt-1 space-y-1">
                {filteredFiles
                  .filter((f) => f.path.startsWith('src/'))
                  .map((file) => (
                    <button
                      key={file.path}
                      onClick={() => setSelectedFilePath(file.path)}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-left transition-colors ${
                        selectedFilePath === file.path
                          ? 'bg-amber-400 text-slate-950 font-bold'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileCode className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{file.name}</span>
                      </div>
                      <span className="text-[10px] opacity-75">CPP</span>
                    </button>
                  ))}
              </div>
            </div>

            {/* Build System & Docs */}
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                <Folder className="h-3.5 w-3.5 text-emerald-400" />
                <span>Build & Standalone</span>
              </div>
              <div className="mt-1 space-y-1">
                {filteredFiles
                  .filter(
                    (f) =>
                      f.category === 'build' ||
                      f.path.startsWith('single_file/') ||
                      f.name === 'README.md'
                  )
                  .map((file) => (
                    <button
                      key={file.path}
                      onClick={() => setSelectedFilePath(file.path)}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-left transition-colors ${
                        selectedFilePath === file.path
                          ? 'bg-amber-400 text-slate-950 font-bold'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{file.name}</span>
                      </div>
                      <span className="text-[10px] opacity-75">
                        {file.name.endsWith('.md') ? 'MD' : file.category === 'build' ? 'BUILD' : 'STANDALONE'}
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Code Display Area */}
        <div className="lg:col-span-8 flex flex-col bg-slate-950 min-h-[600px] overflow-hidden">
          {/* File Tab Info Bar */}
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/40 px-5 py-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono text-amber-400 font-bold">{currentFile.path}</span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400 text-[11px]">{currentFile.description}</span>
            </div>
            <span className="font-mono text-[11px] text-slate-500">
              {currentFile.content.split('\n').length} lines
            </span>
          </div>

          {/* Code Viewer Container */}
          <div className="max-h-[640px] overflow-y-auto overflow-x-auto bg-[#050811]">
            {renderCodeWithLineNumbers(currentFile.content)}
          </div>
        </div>
      </div>
    </div>
  );
};
