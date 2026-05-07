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
  
  if (!window.crossOriginIsolated) {
    console.warn('Cross-Origin Isolation is not enabled. FFmpeg might fail to load.');
    // Attempting to load anyway, but this is a common failure point
  }
  
  try {
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
  } catch (e) {
    console.error('FFmpeg Load Error:', e);
    throw new Error('Video engine failed to load. This usually happens because "Cross-Origin Isolation" is not enabled in the browser headers.');
  }

  ffmpeg.on('log', ({ message }) => console.log('FFmpeg:', message));

  return new Promise((resolve, reject) => {
    const supportedMimeTypes = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4'
    ];
    
    const mimeType = supportedMimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || '';
    console.log('Selected mimeType:', mimeType);

    const stream = canvas.captureStream(30); // 30 FPS
    
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 5000000 // 5Mbps
      });
    } catch (e) {
      console.error('MediaRecorder initialization failed:', e);
      reject(new Error('MediaRecorder not supported or failed to initialize with selected mimeType.'));
      return;
    }

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    
    recorder.onerror = (e) => reject(e);

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

    // Start recording with timeslice to ensure data chunks are provided
    recorder.start(1000);
    
    // Progress tracking based on time
    let start = Date.now();
    const interval = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      const progress = Math.min(0.8, (elapsed / (duration || 1)));
      onProgress(progress);
      
      if (elapsed >= (duration || 5)) {
        clearInterval(interval);
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      }
    }, 500);
  });
}
