/**
 * Liquid Wave Web Worker (MEI-Simple)
 * Move cálculos trigonométricos e físicos pesados de refração líquida
 * para uma thread dedicada em segundo plano (Web Worker), mantendo a
 * thread principal (UI e scroll) com taxa constante de 60/120 FPS.
 *
 * Suporta transferência de TypedArrays (Float32Array com Transferable Objects)
 * para zero-copy overhead e integração com requestAnimationFrame.
 */

export interface LiquidWaveParams {
  width: number;
  height: number;
  scrollY: number;
  deltaY: number;
  scale: number;
  freqX?: number;
  baseStep?: number;
}

export interface LiquidWaveResult {
  id: number;
  dynamicScale: number;
  interpolatedScroll: number;
  pointsBuffer: Float32Array;
  pointsCount: number;
  timestamp: number;
}

export type LiquidWorkerMessage = 
  | { type: 'COMPUTE_WAVE'; id: number; params: LiquidWaveParams }
  | { type: 'RESET' };

export type LiquidWorkerResponse = 
  | { type: 'WAVE_COMPUTED'; result: LiquidWaveResult }
  | { type: 'READY' };

// Código fonte do Web Worker executado em thread isolada (Background Worker Thread)
const WORKER_SCRIPT = `
// Tabela trigonométrica estática pré-computada em Float32Array para substituição ultra-rápida de Math.sin
const LUT_SIZE = 1024;
const SINE_LUT = new Float32Array(LUT_SIZE);
const TWO_PI = Math.PI * 2;
const INV_TWO_PI = 1 / TWO_PI;

for (let i = 0; i < LUT_SIZE; i++) {
  SINE_LUT[i] = Math.sin((i / LUT_SIZE) * TWO_PI);
}

function fastSin(val) {
  let normalized = (val * INV_TWO_PI) % 1;
  if (normalized < 0) normalized += 1;
  const index = (normalized * LUT_SIZE) | 0;
  return SINE_LUT[index];
}

function fastCos(val) {
  return fastSin(val + 1.5707963267948966); // PI / 2
}

// Configurações de camadas e física
const NUM_LAYERS = 3;
const LAYER_PHASE_FACTORS = [0.004, 0.008, 0.012];
const LAYER_OFFSETS = [0.0, 1.570796, 3.141592];
const LAYER_HEIGHT_FACTORS = [0.32, 0.54, 0.74];
const LAYER_AMP_BOOST = [1.5, 3.0, 4.5];

let smoothedScroll = 0;

self.onmessage = function(e) {
  const data = e.data;
  if (!data) return;

  if (data.type === 'RESET') {
    smoothedScroll = 0;
    return;
  }

  if (data.type === 'COMPUTE_WAVE') {
    const id = data.id;
    const p = data.params;
    const width = Math.max(1, p.width || 800);
    const height = Math.max(1, p.height || 64);
    const scrollY = p.scrollY || 0;
    const deltaY = p.deltaY || 0;
    const baseScale = p.scale || 12;

    // 1. Suavização física com amortecimento (LERP)
    smoothedScroll += (scrollY - smoothedScroll) * 0.25;

    // 2. Cálculo da escala ótica dinâmica com amortecimento elástico
    const dynamicAdd = Math.min(6, Math.max(0, deltaY * 0.12));
    const dynamicScale = Math.round((baseScale + dynamicAdd) * 10) / 10;

    // 3. Resolução adaptativa da malha geométrica da onda
    const baseStep = Math.max(16, p.baseStep || Math.floor(width / 32));
    const numPoints = Math.ceil(width / baseStep) + 2;
    const totalFloats = numPoints * 2 * NUM_LAYERS;
    
    // Aloca buffer contíguo de alta velocidade
    const pointsBuffer = new Float32Array(totalFloats);
    let bufferOffset = 0;

    // 4. Cálculo matemático das cáusticas multi-camadas
    for (let layer = 0; layer < NUM_LAYERS; layer++) {
      const phase = (smoothedScroll * LAYER_PHASE_FACTORS[layer]) + LAYER_OFFSETS[layer];
      const waveAmplitude = Math.max(1.5, (dynamicScale * 0.32) + LAYER_AMP_BOOST[layer]);
      const yBase = height * LAYER_HEIGHT_FACTORS[layer];

      for (let x = 0; x <= width + baseStep; x += baseStep) {
        const nx = x * 0.0028;
        const ny = phase + (x * 0.0008);
        const yOffset = (fastSin(nx + ny) * fastCos(ny * 0.5 + nx * 0.3)) * waveAmplitude;
        const y = Math.min(height, Math.max(0, yBase + yOffset));

        pointsBuffer[bufferOffset] = x;
        pointsBuffer[bufferOffset + 1] = y;
        bufferOffset += 2;
      }
    }

    const result = {
      id: id,
      dynamicScale: dynamicScale,
      interpolatedScroll: Math.round(smoothedScroll),
      pointsBuffer: pointsBuffer,
      pointsCount: bufferOffset,
      timestamp: Date.now()
    };

    // Responde com Transferable Objects (Zero-Copy transferência de memória)
    self.postMessage(
      { type: 'WAVE_COMPUTED', result: result },
      [pointsBuffer.buffer]
    );
  }
};

// Notifica a thread principal que o worker está pronto
self.postMessage({ type: 'READY' });
`;

/**
 * Cliente gerenciador do Web Worker para a thread principal.
 * Agrupa chamadas com requestAnimationFrame e debounce para prevenir
 * layout thrashing e sobrecarga do canal postMessage.
 */
export class LiquidWorkerClient {
  private worker: Worker | null = null;
  private requestId = 0;
  private isBusy = false;
  private pendingParams: LiquidWaveParams | null = null;
  private onResultCallback: ((result: LiquidWaveResult) => void) | null = null;
  private rafId: number | null = null;

  constructor() {
    this.initWorker();
  }

  private initWorker(): void {
    if (typeof window === 'undefined') return;

    try {
      const blob = new Blob([WORKER_SCRIPT], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      this.worker = new Worker(workerUrl);
      URL.revokeObjectURL(workerUrl);

      this.worker.onmessage = (event: MessageEvent<LiquidWorkerResponse>) => {
        const data = event.data;
        if (!data) return;

        if (data.type === 'WAVE_COMPUTED') {
          this.isBusy = false;
          if (this.onResultCallback) {
            this.onResultCallback(data.result);
          }

          // Se novos parâmetros de scroll chegaram enquanto o worker calculava, dispara a próxima iteração
          if (this.pendingParams) {
            const nextParams = this.pendingParams;
            this.pendingParams = null;
            this.scheduleCalculation(nextParams);
          }
        }
      };

      this.worker.onerror = (err) => {
        console.warn('LiquidWorker fallback para thread local:', err);
        this.isBusy = false;
      };
    } catch (e) {
      console.warn('Falha ao instanciar LiquidWorker:', e);
      this.worker = null;
    }
  }

  /**
   * Define o callback para receber resultados da onda calculada.
   */
  public onWaveComputed(callback: (result: LiquidWaveResult) => void): void {
    this.onResultCallback = callback;
  }

  /**
   * Agenda um cálculo de onda para ser disparado na próxima animação gráfica.
   * Evita chamadas síncronas repetitivas durante o scroll.
   */
  public requestWaveCalculation(params: LiquidWaveParams): void {
    this.pendingParams = params;

    if (this.rafId === null) {
      this.rafId = requestAnimationFrame(() => {
        this.rafId = null;
        if (this.pendingParams && !this.isBusy) {
          const toSend = this.pendingParams;
          this.pendingParams = null;
          this.scheduleCalculation(toSend);
        }
      });
    }
  }

  private scheduleCalculation(params: LiquidWaveParams): void {
    if (!this.worker) return;

    this.isBusy = true;
    this.requestId++;
    const message: LiquidWorkerMessage = {
      type: 'COMPUTE_WAVE',
      id: this.requestId,
      params
    };

    this.worker.postMessage(message);
  }

  public reset(): void {
    if (this.worker) {
      this.worker.postMessage({ type: 'RESET' });
    }
    this.pendingParams = null;
    this.isBusy = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  public terminate(): void {
    this.reset();
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.onResultCallback = null;
  }
}

// Singleton global para reuso eficiente em toda a aplicação
let globalWorkerClient: LiquidWorkerClient | null = null;

export function getLiquidWorkerClient(): LiquidWorkerClient {
  if (!globalWorkerClient) {
    globalWorkerClient = new LiquidWorkerClient();
  }
  return globalWorkerClient;
}

export function terminateLiquidWorker(): void {
  if (globalWorkerClient) {
    globalWorkerClient.terminate();
    globalWorkerClient = null;
  }
}
