/**
 * AI Segmentation Worker (Classic Version)
 * This version is designed for maximum compatibility across all browsers.
 */
console.log('[Worker] AI Segmentation Worker is starting up...');

self.onmessage = async (event) => {
  const { type, payload } = event.data;
  console.log('[Worker] Received command:', type);

  try {
    if (type === 'INIT') {
      self.postMessage({ status: 'loading', message: 'Downloading AI library...' });
      
      // Load the AI library dynamically from CDN for zero-setup compatibility
      console.log('[Worker] Loading AI library from CDN...');
      // @ts-ignore — Dynamic CDN import, valid at runtime in browser
      const { pipeline, env } = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.3.3');
      
      env.allowLocalModels = false;
      
      self.postMessage({ status: 'loading', message: 'Downloading AI model...' });
      
      const segmenter = await pipeline('image-segmentation', 'Xenova/segformer-b0-finetuned-ade-512-512', {
        progress_callback: (x: any) => {
          if (x.status === 'progress') {
            self.postMessage({ status: 'progress', progress: x.progress });
          }
        }
      });

      // Once loaded, we overwrite the onmessage handler to use the active segmenter
      console.log('[Worker] AI Model is ready');
      self.postMessage({ status: 'ready' });

      self.onmessage = async (nextEvent) => {
        const { type: nextType, payload: nextPayload } = nextEvent.data;
        if (nextType === 'SEGMENT') {
          const { image, targetWidth, targetHeight } = nextPayload;
          self.postMessage({ status: 'processing', message: 'Analyzing room surfaces...' });
          
          const results = await segmenter(image);
          
          const safeResults = results.map((result: any) => {
            const originalMask = result.mask.data;
            const originalWidth = result.mask.width;
            const originalHeight = result.mask.height;

            const upscaledMask = new Uint8Array(targetWidth * targetHeight);
            const xRatio = (originalWidth - 1) / targetWidth;
            const yRatio = (originalHeight - 1) / targetHeight;

            for (let y = 0; y < targetHeight; y++) {
              const py = y * yRatio;
              const py0 = Math.floor(py);
              const py1 = Math.min(originalHeight - 1, py0 + 1);
              const wy = py - py0;
              const yOffset = y * targetWidth;

              for (let x = 0; x < targetWidth; x++) {
                const px = x * xRatio;
                const px0 = Math.floor(px);
                const px1 = Math.min(originalWidth - 1, px0 + 1);
                const wx = px - px0;

                const v00 = originalMask[py0 * originalWidth + px0];
                const v10 = originalMask[py0 * originalWidth + px1];
                const v01 = originalMask[py1 * originalWidth + px0];
                const v11 = originalMask[py1 * originalWidth + px1];

                const val = v00 * (1 - wx) * (1 - wy) +
                            v10 * wx * (1 - wy) +
                            v01 * (1 - wx) * wy +
                            v11 * wx * wy;

                if (val > 0.5) upscaledMask[yOffset + x] = 1;
              }
            }

            return {
              label: result.label,
              score: result.score,
              width: targetWidth,
              height: targetHeight,
              maskData: upscaledMask
            };
          });

          // Ceiling Leak Prevention
          const wallMasks = safeResults.filter((r: any) => r.label === 'wall');
          const ceilingMasks = safeResults.filter((r: any) => r.label === 'ceiling');

          if (ceilingMasks.length > 0) {
            const combinedWallMask = new Uint8Array(targetWidth * targetHeight);
            for (const wm of wallMasks) {
              for (let i = 0; i < wm.maskData.length; i++) {
                if (wm.maskData[i] > 0) combinedWallMask[i] = 1;
              }
            }

            for (const cm of ceilingMasks) {
              const mask = cm.maskData;
              for (let i = 0; i < mask.length; i++) {
                if (mask[i] > 0) {
                  const y = Math.floor(i / targetWidth);
                  // Increase threshold from 40% to 70% for better ceiling coverage
                  if (y > targetHeight * 0.70 || combinedWallMask[i] === 1) {
                    mask[i] = 0;
                  }
                }
              }
            }
          }
          self.postMessage({ status: 'complete', results: safeResults });
        }
      };
    }
  } catch (error: any) {
    console.error('[Worker] Fatal Error:', error);
    self.postMessage({ status: 'error', error: error.message || 'Worker startup failed' });
  }
};
