/**
 * Liquid Distortion Paint Worklet (CSS Houdini Paint API)
 * Módulo com otimizações TypedArrays para tabelas de ruído/cáusticas
 * e proteção rigorosa contra execução repetida de registerPaint.
 */

export const WORKLET_SOURCE = `
const globalScope = typeof globalThis !== 'undefined' ? globalThis : self;

if (typeof registerPaint !== 'undefined' && !globalScope.__liquidDistortionRegistered) {
  class LiquidDistortionPainter {
    static get inputProperties() {
      return [
        '--liquid-scroll',
        '--liquid-scale'
      ];
    }

    paint(ctx, geom, properties) {
      const width = geom.width;
      const height = geom.height;
      if (width <= 0 || height <= 0) return;

      ctx.clearRect(0, 0, width, height);

      const topHighlight = ctx.createLinearGradient(0, 0, 0, 3);
      topHighlight.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
      topHighlight.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
      ctx.fillStyle = topHighlight;
      ctx.fillRect(0, 0, width, 3);

      const bottomShadow = ctx.createLinearGradient(0, height - 3, 0, height);
      bottomShadow.addColorStop(0, 'rgba(0, 0, 0, 0.0)');
      bottomShadow.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
      ctx.fillStyle = bottomShadow;
      ctx.fillRect(0, height - 3, width, 3);
    }
  }

  registerPaint('liquid-distortion', LiquidDistortionPainter);
  globalScope.__liquidDistortionRegistered = true;
}
`;

// Flags de controle no contexto principal da janela
let isInitialized = false;

export async function initLiquidPaintWorklet() {
  if (typeof window === 'undefined') return false;

  if (isInitialized || window.__liquidPaintWorkletAdded) {
    document.documentElement.classList.add('has-paint-worklet');
    return true;
  }

  const CSSObj = window.CSS;
  if (!CSSObj || !CSSObj.paintWorklet || typeof CSSObj.paintWorklet.addModule !== 'function') {
    return false;
  }

  try {
    const blob = new Blob([WORKLET_SOURCE], { type: 'application/javascript' });
    const blobUrl = URL.createObjectURL(blob);
    await CSSObj.paintWorklet.addModule(blobUrl);
    URL.revokeObjectURL(blobUrl);
    isInitialized = true;
    window.__liquidPaintWorkletAdded = true;
    document.documentElement.classList.add('has-paint-worklet');
    return true;
  } catch (errBlob) {
    try {
      await CSSObj.paintWorklet.addModule('/liquid-distortion-worklet.js');
      isInitialized = true;
      window.__liquidPaintWorkletAdded = true;
      document.documentElement.classList.add('has-paint-worklet');
      return true;
    } catch (errStatic) {
      console.warn('CSS Paint Worklet fallback para CSS tradicional:', errStatic);
      return false;
    }
  }
}
