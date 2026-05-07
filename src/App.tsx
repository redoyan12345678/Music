import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Download, 
  Settings2, 
  Palette, 
  Wind, 
  Zap, 
  Music2, 
  Upload,
  ArrowRight,
  Layers,
  Menu,
  X
} from 'lucide-react';
import { useAudioEngine } from './hooks/useAudioEngine';
import VisualizerPreview from './components/VisualizerPreview';
import { VisualizerSettings, TEMPLATES } from './constants';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { exportVideo } from './lib/exportEngine';

export default function App() {
  const { loadAudio, play, pause, isPlaying, analyser, currentTime, duration } = useAudioEngine();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  
  const [settings, setSettings] = useState<VisualizerSettings>({
    template: 'circular',
    color: '#00f2ff',
    glowStrength: 1,
    particleCount: 100,
    beatSensitivity: 0.5,
    backgroundUrl: null,
    videoBackgroundUrl: null,
    trackTitle: 'SYSTEM_OUTPUT_M4U3.mp4',
    trackSubtitle: 'VISUALIZING TRACK'
  });

  const [activeTab, setActiveTab] = useState<'style' | 'effects' | 'export'>('style');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
      await loadAudio(file);
    }
  };

  const handleExport = async () => {
    const canvas = document.getElementById('visualizer-canvas') as HTMLCanvasElement;
    if (!canvas || !audioFile) return;

    try {
      setIsExporting(true);
      setExportProgress(0);
      
      // Auto-restart playback for recording
      play();
      
      const videoUrl = await exportVideo(canvas, audioFile, duration, (p) => {
        setExportProgress(p);
      });

      // Download the video
      const a = document.createElement('a');
      a.href = videoUrl;
      a.download = `PulseCanvas_${settings.trackTitle.replace(/\s/g, '_')}.mp4`;
      a.click();
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Please ensure your browser supports MediaRecorder and FFmpeg WASM.');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col text-white overflow-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-cyan-500/5 to-transparent" />
        <div className="absolute bottom-0 right-0 w-[50vw] h-[50vw] bg-purple-500/5 rounded-full blur-[120px]" />
      </div>

      {/* Navigation */}
      <nav className="h-16 border-b border-white/5 flex items-center justify-between px-4 md:px-8 backdrop-blur-xl bg-black/40 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 md:hidden text-white/60 hover:text-white transition-colors"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Music2 className="text-white w-5 h-5" />
          </div>
          <h1 className="font-bold text-lg tracking-tighter uppercase hidden sm:block">Pulse<span className="text-white/40">Canvas</span></h1>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
           {!analyser && (
             <label className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer text-[10px] md:text-xs font-bold uppercase tracking-widest leading-none">
                <Upload className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Upload Track</span>
                <span className="xs:hidden">Upload</span>
                <input type="file" className="hidden" accept="audio/*" onChange={handleFileUpload} />
             </label>
           )}
           <button className="p-2 text-white/40 hover:text-white transition-colors">
             <Settings2 className="w-5 h-5" />
           </button>
        </div>
      </nav>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Sidebar - Controls */}
        <aside className={cn(
          "fixed inset-y-0 left-0 z-40 w-full sm:w-80 bg-[#050505] border-r border-white/5 flex flex-col transform transition-transform duration-300 ease-in-out overflow-y-auto pt-16 md:pt-0 md:relative md:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="p-4 md:p-6 border-b border-white/5 flex gap-2">
            {(['style', 'effects', 'export'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
                  activeTab === tab ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/20" : "text-white/40 hover:text-white hover:bg-white/5"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-4 md:p-6 space-y-8 flex-1">
            <AnimatePresence mode="wait">
              {activeTab === 'style' && (
                <motion.div
                  key="style"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-6"
                >
                  <section>
                    <label className="sidebar-label block mb-4">Spectrum Template</label>
                    <div className="grid grid-cols-1 gap-3">
                      {TEMPLATES.map(t => (
                        <button
                          key={t.id}
                          onClick={() => {
                            setSettings(s => ({ ...s, template: t.id }));
                            if (window.innerWidth < 768) setIsSidebarOpen(false);
                          }}
                          className={cn(
                            "p-4 rounded-xl border text-left transition-all group",
                            settings.template === t.id 
                              ? "bg-cyan-500/10 border-cyan-500/50" 
                              : "bg-white/[0.02] border-white/5 hover:border-white/20"
                          )}
                        >
                          <p className={cn("text-sm font-bold", settings.template === t.id ? "text-white" : "text-white/60")}>{t.name}</p>
                          <p className="text-[10px] text-white/30 mt-1 line-clamp-1">{t.description}</p>
                        </button>
                      ))}
                    </div>
                  </section>
                </motion.div>
              )}

              {activeTab === 'effects' && (
                <motion.div
                  key="effects"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-6"
                >
                   <section>
                    <div className="flex items-center justify-between mb-4">
                      <label className="sidebar-label">Accent Color</label>
                      <Palette className="w-4 h-4 text-white/20" />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {['#00f2ff', '#ff006e', '#ffbe0b', '#fb5607', '#3a86ff'].map(c => (
                        <button
                          key={c}
                          onClick={() => setSettings(s => ({ ...s, color: c }))}
                          style={{ backgroundColor: c }}
                          className={cn(
                            "w-8 h-8 rounded-full border-2 transition-transform active:scale-90",
                            settings.color === c ? "border-white scale-110 shadow-lg" : "border-black/50"
                          )}
                        />
                      ))}
                    </div>
                  </section>

                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="sidebar-label">Glow Strength</label>
                      <span className="text-[10px] font-mono text-cyan-400">{(settings.glowStrength * 100).toFixed(0)}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="2" step="0.1" 
                      value={settings.glowStrength}
                      onChange={(e) => setSettings(s => ({ ...s, glowStrength: parseFloat(e.target.value) }))}
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                  </section>

                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="sidebar-label">Background</label>
                      <Layers className="w-3 h-3 text-white/20" />
                    </div>
                    <label className="w-full aspect-video rounded-xl bg-white/5 border border-white/10 hover:border-white/20 flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group">
                      {settings.backgroundUrl ? (
                        <img src={settings.backgroundUrl} className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <Upload className="w-5 h-5 text-white/20 mb-2 group-hover:text-cyan-400 transition-colors" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-white/20 group-hover:text-cyan-400 transition-colors">Upload Media</span>
                        </>
                      )}
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const url = URL.createObjectURL(file);
                            setSettings(s => ({ ...s, backgroundUrl: url }));
                          }
                        }}
                      />
                    </label>
                  </section>

                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="sidebar-label">Beat Sensitivity</label>
                      <Zap className="w-3 h-3 text-amber-400" />
                    </div>
                    <input 
                      type="range" min="0" max="1" step="0.05" 
                      value={settings.beatSensitivity}
                      onChange={(e) => setSettings(s => ({ ...s, beatSensitivity: parseFloat(e.target.value) }))}
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                  </section>
                </motion.div>
              )}

              {activeTab === 'export' && (
                <motion.div
                  key="export"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                   <div className="bg-cyan-500/5 border border-cyan-500/10 rounded-2xl p-4 md:p-6 text-center md:text-left">
                      <div className="flex items-center gap-3 mb-4 justify-center md:justify-start">
                        <Layers className="w-5 h-5 text-cyan-400" />
                        <h4 className="font-bold text-sm">YouTube 4K Ready</h4>
                      </div>
                      <p className="text-xs text-white/40 leading-relaxed mb-6">
                        Our cloud-processing rendering engine will capture this visualizer frame-by-frame for maximum quality.
                      </p>
                      <button 
                        onClick={handleExport}
                        disabled={isExporting}
                        className={cn(
                          "w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 shadow-lg",
                          isExporting
                            ? "bg-white/5 border border-white/10 text-white/20 cursor-wait"
                            : "bg-cyan-500 hover:bg-cyan-400 text-black shadow-cyan-500/20"
                        )}
                      >
                         {isExporting ? `Exporting ${(exportProgress * 100).toFixed(0)}%` : 'Start Export'}
                         {!isExporting && <Download className="w-4 h-4" />}
                      </button>
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className={cn(
          "flex-1 flex flex-col gap-6 md:gap-8 bg-black/40 overflow-y-auto p-4 md:p-8 relative",
          isSidebarOpen && "hidden md:flex" 
        )}>
          {analyser ? (
            <div className="max-w-6xl mx-auto w-full space-y-6 md:space-y-8">
              <VisualizerPreview 
                analyser={analyser} 
                settings={settings} 
                setSettings={setSettings}
                isPlaying={isPlaying} 
              />
              
              {/* Controls Bar */}
              <div className="glass-panel p-4 md:p-6 flex flex-col md:flex-row items-center gap-6 md:gap-8">
                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
                   <div className="flex items-center gap-4">
                     <button 
                      onClick={isPlaying ? pause : play}
                      className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl"
                     >
                       {isPlaying ? <Pause className="w-5 h-5 md:w-6 md:h-6" /> : <Play className="fill-current ml-1 w-5 h-5 md:w-6 md:h-6" />}
                     </button>
                     <div className="text-left">
                        <p className="text-[8px] md:text-[10px] font-mono text-white/30 uppercase tracking-widest">Playback</p>
                        <p className="text-lg md:text-2xl font-black font-mono tabular-nums leading-none">
                          {formatTime(currentTime)} <span className="text-white/20">/ {formatTime(duration)}</span>
                        </p>
                     </div>
                   </div>
                   
                   <button className="md:hidden p-3 rounded-lg bg-white/5 text-white/40 hover:text-white transition-all">
                     <Wind className="w-5 h-5" />
                   </button>
                </div>

                <div className="flex-1 w-full flex items-center gap-4">
                  <div className="flex-1 h-2 md:h-3 bg-white/5 rounded-full overflow-hidden relative border border-white/5">
                    <motion.div 
                      className="absolute inset-y-0 left-0 bg-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.5)]"
                      style={{ width: `${(currentTime / duration) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="hidden md:flex items-center gap-3">
                   <button className="p-3 rounded-lg bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all">
                     <Wind className="w-5 h-5" />
                   </button>
                   <button 
                     onClick={handleExport}
                     disabled={isExporting}
                     className={cn(
                       "flex items-center gap-2 px-6 py-3 rounded-xl border text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                       isExporting 
                        ? "bg-white/5 border-white/10 text-white/20 cursor-wait" 
                        : "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
                     )}
                   >
                     {isExporting ? `Exporting ${(exportProgress * 100).toFixed(0)}%` : 'Export 4K'}
                     {!isExporting && <ArrowRight className="w-4 h-4" />}
                   </button>
                </div>
                
                <button 
                  onClick={handleExport}
                  disabled={isExporting}
                  className={cn(
                    "md:hidden w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl border text-xs font-bold uppercase tracking-widest transition-all",
                    isExporting 
                      ? "bg-white/5 border-white/10 text-white/20 cursor-wait" 
                      : "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
                  )}
                >
                   {isExporting ? `Exporting ${(exportProgress * 100).toFixed(0)}%` : 'Export 4K'}
                   {!isExporting && <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
               <div className="w-16 h-16 md:w-24 md:h-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 md:mb-8 animate-float">
                 <Music2 className="w-6 h-6 md:w-10 md:h-10 text-white/20" />
               </div>
               <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tighter leading-tight max-w-lg">Your Stage is Empty</h2>
               <p className="text-white/40 text-sm md:text-base max-w-sm mb-10 leading-relaxed">
                 Start by uploading an audio track. We'll automatically build a professional spectrum canvas for it.
               </p>
               <label className="flex items-center gap-3 px-6 md:px-8 py-3 md:py-4 rounded-2xl bg-cyan-500 text-black font-black uppercase tracking-widest text-xs md:text-sm hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-2xl shadow-cyan-500/40">
                  <Upload className="w-4 h-4 md:w-5 md:h-5" />
                  Select Audio Track
                  <input type="file" className="hidden" accept="audio/*" onChange={handleFileUpload} />
               </label>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
