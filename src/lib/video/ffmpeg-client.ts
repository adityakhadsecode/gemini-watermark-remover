/**
 * Native Browser Worker Client for FFmpeg.wasm.
 * Avoids bundler (Turbopack/Webpack) dynamic module resolution pitfalls by connecting
 * directly to the classic static worker in /public/ffmpeg/ffmpeg-worker.js.
 */

export interface LogMessage {
  type?: string;
  message: string;
}

export interface ProgressMessage {
  progress: number;
  time: number;
}

export class FFmpegClient {
  private worker: Worker | null = null;
  private messageId = 0;
  private pendingResolves = new Map<number, (val: unknown) => void>();
  private pendingRejects = new Map<number, (err: Error) => void>();
  private logCallbacks: Array<(msg: LogMessage) => void> = [];
  private progressCallbacks: Array<(data: ProgressMessage) => void> = [];
  public loaded = false;

  public on(event: "log" | "progress", callback: (data: any) => void) {
    if (event === "log") this.logCallbacks.push(callback);
    else if (event === "progress") this.progressCallbacks.push(callback);
  }

  public off(event: "log" | "progress", callback: (data: any) => void) {
    if (event === "log") {
      this.logCallbacks = this.logCallbacks.filter((cb) => cb !== callback);
    } else if (event === "progress") {
      this.progressCallbacks = this.progressCallbacks.filter((cb) => cb !== callback);
    }
  }

  public async load(config: { coreURL?: string; wasmURL?: string; workerURL?: string } = {}): Promise<boolean> {
    if (this.loaded) return true;

    if (!this.worker) {
      const workerUrl = "/ffmpeg/ffmpeg-worker.js";
      this.worker = new Worker(workerUrl);

      this.worker.onmessage = (e: MessageEvent) => {
        const { id, type, data } = e.data || {};

        if (type === "LOG") {
          const logPayload: LogMessage = typeof data === "string" ? { message: data } : data;
          this.logCallbacks.forEach((cb) => cb(logPayload));
          return;
        }

        if (type === "PROGRESS") {
          this.progressCallbacks.forEach((cb) => cb(data));
          return;
        }

        if (type === "ERROR") {
          const reject = this.pendingRejects.get(id);
          if (reject) {
            reject(new Error(String(data)));
            this.pendingResolves.delete(id);
            this.pendingRejects.delete(id);
          }
          return;
        }

        const resolve = this.pendingResolves.get(id);
        if (resolve) {
          resolve(data);
          this.pendingResolves.delete(id);
          this.pendingRejects.delete(id);
        }
      };

      this.worker.onerror = (err) => {
        console.error("FFmpeg Worker Error:", err);
      };
    }

    await this.send("LOAD", {
      coreURL: config.coreURL || "/ffmpeg/ffmpeg-core.js",
      wasmURL: config.wasmURL || "/ffmpeg/ffmpeg-core.wasm",
    });

    this.loaded = true;
    return true;
  }

  private send(type: string, data: unknown, transfer: Transferable[] = []): Promise<unknown> {
    if (!this.worker) return Promise.reject(new Error("Worker not initialized"));
    const id = ++this.messageId;

    return new Promise((resolve, reject) => {
      this.pendingResolves.set(id, resolve);
      this.pendingRejects.set(id, reject);
      this.worker!.postMessage({ id, type, data }, transfer);
    });
  }

  public async writeFile(path: string, data: Uint8Array): Promise<boolean> {
    // Clone buffer if necessary for transferable
    const copy = new Uint8Array(data);
    return (await this.send("WRITE_FILE", { path, data: copy }, [copy.buffer])) as boolean;
  }

  public async readFile(path: string, encoding = "binary"): Promise<Uint8Array | string> {
    return (await this.send("READ_FILE", { path, encoding })) as Uint8Array | string;
  }

  public async deleteFile(path: string): Promise<boolean> {
    return (await this.send("DELETE_FILE", { path })) as boolean;
  }

  public async exec(args: string[], timeout = -1): Promise<number> {
    return (await this.send("EXEC", { args, timeout })) as number;
  }

  public terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.loaded = false;
    }
  }
}
