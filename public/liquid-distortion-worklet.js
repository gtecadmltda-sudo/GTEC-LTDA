/**
 * Liquid Distortion Paint Worklet (CSS Houdini Paint API)
 * Desenha apenas o acabamento das bordas do vidro:
 * - luz na borda superior e sombra na borda inferior (EDGE_PX pixels)
 * A distorção do conteúdo ao fundo NÃO é feita aqui: ela vem do
 * backdrop-filter com filtro SVG (#liquid-distortion), definido no CSS.
 */

const EDGE_PX = 3;
const scope = typeof globalThis !== 'undefined' ? globalThis : {};

if (typeof registerPaint !== 'undefined' && !scope.__liquidDistortionRegistered) {
  class LiquidDistortionPainter {
    paint(ctx, geom) {
      const { width, height } = geom;
      if (width <= EDGE_PX * 2 || height <= EDGE_PX * 2) return;

      // Luz na borda superior
      const top = ctx.createLinearGradient(0, 0, 0, EDGE_PX);
      top.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
      top.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = top;
      ctx.fillRect(0, 0, width, EDGE_PX);

      // Sombra na borda inferior
      const bottom = ctx.createLinearGradient(0, height - EDGE_PX, 0, height);
      bottom.addColorStop(0, 'rgba(0, 0, 0, 0)');
      bottom.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
      ctx.fillStyle = bottom;
      ctx.fillRect(0, height - EDGE_PX, width, EDGE_PX);
    }
  }

  registerPaint('liquid-distortion', LiquidDistortionPainter);
  scope.__liquidDistortionRegistered = true;
}