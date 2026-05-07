import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export async function exportVideo(
  canvas: HTMLCanvasElement,
  audioFile: File,
  duration: number,
  onProgress: (p: number) => void
): Promise<string> {
  const ffmpeg = new FFmpeg();
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
  
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  return new Promise((resolve, reject) => {
    const stream = canvas.captureStream(30); // 30 FPS
    const recorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 5000000 // 5Mbps
    });

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);
    
    recorder.onstop = async () => {
      try {
        const videoBlob = new Blob(chunks, { type: 'video/webm' });
        onProgress(0.9); // Encoding phase
        
        await ffmpeg.writeFile('input.webm', await fetchFile(videoBlob));
        await ffmpeg.writeFile('audio.mp3', await fetchFile(audioFile));

        // Mux video and audio into MP4
        // Use faster preset for browser environment
        await ffmpeg.exec([
          '-i', 'input.webm', 
          '-i', 'audio.mp3', 
          '-c:v', 'copy', 
          '-c:a', 'aac', 
          '-shortest', 
          'output.mp4'
        ]);

        const data = await ffmpeg.readFile('output.mp4');
        const mp4Blob = new Blob([data], { type: 'video/mp4' });
        resolve(URL.createObjectURL(mp4Blob));
      } catch (err) {
        reject(err);
      }
    };

    // Start recording
    recorder.start();
    
    // Progress tracking based on time
    let start = Date.now();
    const interval = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      const progress = Math.min(0.8, elapsed / duration);
      onProgress(progress);
      
      if (elapsed >= duration) {
        clearInterval(interval);
        recorder.stop();
      }
    }, 500);
  });
}
