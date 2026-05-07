import React, { useRef, useEffect, useState } from 'react';
import { VisualizerSettings } from '../constants';

interface VisualizerPreviewProps {
  analyser: AnalyserNode | null;
  settings: VisualizerSettings;
  setSettings: React.Dispatch<React.SetStateAction<VisualizerSettings>>;
  isPlaying: boolean;
}

export default function VisualizerPreview({ analyser, settings, setSettings, isPlaying }: VisualizerPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const particlesRef = useRef<any[]>([]);
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const [editingField, setEditingField] = useState<'title' | 'subtitle' | null>(null);

  // Preload background image
  useEffect(() => {
    if (settings.backgroundUrl) {
      const img = new Image();
      img.src = settings.backgroundUrl;
      img.onload = () => {
        bgImageRef.current = img;
      };
    } else {
      bgImageRef.current = null;
    }
  }, [settings.backgroundUrl]);

  // Initialize particles
  useEffect(() => {
    particlesRef.current = Array.from({ length: 100 }, () => ({
      x: Math.random() * 1920,
      y: Math.random() * 1080,
      size: Math.random() * 2 + 1,
      speedX: (Math.random() - 0.5) * 1,
      speedY: (Math.random() - 0.5) * 1,
      opacity: Math.random()
    }));
  }, []);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas || !analyser) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    // Calculate overall intensity for beat sync
    const average = dataArray.reduce((v, i) => v + i, 0) / bufferLength;
    const intensity = average / 255;
    const beatScale = 1 + intensity * settings.beatSensitivity;

    // Clear Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Background
    if (bgImageRef.current) {
      ctx.drawImage(bgImageRef.current, 0, 0, canvas.width, canvas.height);
      // Dark overlay for visibility
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(0,0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw Particles
    ctx.fillStyle = `rgba(255, 255, 255, ${0.2 + intensity * 0.5})`;
    particlesRef.current.forEach(p => {
      p.x += p.speedX * (1 + intensity * 2);
      p.y += p.speedY * (1 + intensity * 2);
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;
      
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * beatScale, 0, Math.PI * 2);
      ctx.fill();
    });

    // Template Specific Rendering
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    
    if (settings.template === 'circular') {
      drawCircular(ctx, dataArray, settings, beatScale);
    } else if (settings.template === 'bar') {
      drawBars(ctx, dataArray, settings, beatScale);
    } else if (settings.template === 'neon') {
      drawNeon(ctx, dataArray, settings, intensity);
    } else if (settings.template === 'broken-heart') {
      drawHeart(ctx, dataArray, settings, beatScale);
    }

    ctx.restore();
    requestRef.current = requestAnimationFrame(draw);
  };

  const drawCircular = (ctx: CanvasRenderingContext2D, data: Uint8Array, settings: VisualizerSettings, scale: number) => {
    const radius = 200 * scale;
    ctx.strokeStyle = settings.color;
    ctx.lineWidth = 4;
    ctx.shadowBlur = settings.glowStrength * 20;
    ctx.shadowColor = settings.color;

    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
        const angle = (i / data.length) * Math.PI * 2;
        const value = (data[i] / 255) * 100;
        const x = Math.cos(angle) * (radius + value);
        const y = Math.sin(angle) * (radius + value);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  };

  const drawBars = (ctx: CanvasRenderingContext2D, data: Uint8Array, settings: VisualizerSettings, scale: number) => {
    const barWidth = 10;
    const gutter = 4;
    const totalWidth = (barWidth + gutter) * data.length;
    ctx.translate(-totalWidth / 4, 0); // Center adjustment

    ctx.fillStyle = settings.color;
    ctx.shadowBlur = settings.glowStrength * 10;
    ctx.shadowColor = settings.color;

    for (let i = 0; i < data.length / 2; i++) {
      const h = (data[i] / 255) * 200 * scale;
      ctx.fillRect(i * (barWidth + gutter), -h / 2, barWidth, h);
    }
  };

  const drawNeon = (ctx: CanvasRenderingContext2D, data: Uint8Array, settings: VisualizerSettings, intensity: number) => {
    ctx.strokeStyle = settings.color;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 15;
    ctx.shadowColor = settings.color;

    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
      const x = (i / data.length) * 1000 - 500;
      const y = Math.sin(i * 0.1 + intensity * 5) * 50 + (data[i] / 255) * 150;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  };

  const drawHeart = (ctx: CanvasRenderingContext2D, data: Uint8Array, settings: VisualizerSettings, scale: number) => {
    ctx.fillStyle = settings.color;
    ctx.shadowBlur = 30 * scale;
    ctx.shadowColor = settings.color;

    const s = 15 * scale;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-s, -s, -s*2, s/2, 0, s*2);
    ctx.bezierCurveTo(s*2, s/2, s, -s, 0, 0);
    ctx.fill();

    // Pulse rings
    ctx.strokeStyle = settings.color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(0, s, 50 * scale + (data[0]/5), 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1.0;
  };

  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(draw);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, settings, analyser]);

  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/5">
      <canvas 
        id="visualizer-canvas"
        ref={canvasRef} 
        width={1920} 
        height={1080} 
        className="w-full h-full object-contain"
      />
      
      {/* Overlay UI */}
      <div className="absolute bottom-8 left-8 flex items-center gap-4 group/ui">
         <div className="w-12 h-12 rounded-full border-2 border-cyan-400/30 flex items-center justify-center animate-spin-slow">
            <div className="w-8 h-8 rounded-full border-2 border-cyan-400" />
         </div>
         <div className="text-left">
            {editingField === 'subtitle' ? (
              <input
                autoFocus
                className="bg-white/10 border-b border-cyan-400 outline-none text-[10px] uppercase tracking-widest font-bold text-white w-48 mb-1"
                value={settings.trackSubtitle}
                onChange={(e) => setSettings(s => ({ ...s, trackSubtitle: e.target.value }))}
                onBlur={() => setEditingField(null)}
                onKeyDown={(e) => e.key === 'Enter' && setEditingField(null)}
              />
            ) : (
              <p 
                onClick={() => setEditingField('subtitle')}
                className="text-[10px] uppercase tracking-widest font-bold text-white/40 hover:text-cyan-400 cursor-text transition-colors"
                title="Click to edit"
              >
                {settings.trackSubtitle}
              </p>
            )}

            {editingField === 'title' ? (
              <input
                autoFocus
                className="bg-white/10 border-b border-cyan-400 outline-none text-sm font-bold text-white w-64"
                value={settings.trackTitle}
                onChange={(e) => setSettings(s => ({ ...s, trackTitle: e.target.value }))}
                onBlur={() => setEditingField(null)}
                onKeyDown={(e) => e.key === 'Enter' && setEditingField(null)}
              />
            ) : (
              <p 
                onClick={() => setEditingField('title')}
                className="text-sm font-bold text-white tracking-wide hover:text-cyan-400 cursor-text transition-colors"
                title="Click to edit"
              >
                {settings.trackTitle}
              </p>
            )}
         </div>
      </div>
    </div>
  );
}
