import { useState, useCallback, useRef, useEffect } from 'react';

export function useAudioEngine() {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const startTimeRef = useRef(0);
  const pauseTimeRef = useRef(0);

  const loadAudio = async (file: File) => {
    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await context.decodeAudioData(arrayBuffer);
    
    const analyserNode = context.createAnalyser();
    analyserNode.fftSize = 256;
    
    setAudioContext(context);
    setAnalyser(analyserNode);
    setDuration(audioBuffer.duration);
    audioBufferRef.current = audioBuffer;
    
    return audioBuffer;
  };

  const play = useCallback(() => {
    if (!audioContext || !audioBufferRef.current || !analyser) return;

    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
    }

    const source = audioContext.createBufferSource();
    source.buffer = audioBufferRef.current;
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    
    const offset = pauseTimeRef.current;
    source.start(0, offset);
    startTimeRef.current = audioContext.currentTime - offset;
    audioSourceRef.current = source;
    setIsPlaying(true);

    source.onended = () => {
      if (audioContext.currentTime - startTimeRef.current >= audioBufferRef.current!.duration) {
        setIsPlaying(false);
        pauseTimeRef.current = 0;
      }
    };
  }, [audioContext, analyser]);

  const pause = useCallback(() => {
    if (!audioSourceRef.current || !audioContext) return;
    
    audioSourceRef.current.stop();
    pauseTimeRef.current = audioContext.currentTime - startTimeRef.current;
    setIsPlaying(false);
  }, [audioContext]);

  const stop = useCallback(() => {
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
    }
    pauseTimeRef.current = 0;
    setCurrentTime(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    let animationFrame: number;
    const updateProgress = () => {
      if (isPlaying && audioContext) {
        setCurrentTime(audioContext.currentTime - startTimeRef.current);
      }
      animationFrame = requestAnimationFrame(updateProgress);
    };
    animationFrame = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(animationFrame);
  }, [isPlaying, audioContext]);

  return {
    loadAudio,
    play,
    pause,
    stop,
    isPlaying,
    analyser,
    currentTime,
    duration,
    audioContext
  };
}
