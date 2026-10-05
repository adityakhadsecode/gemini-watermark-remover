/**
 * FFmpeg.wasm Dedicated Worker (Classic Worker Script)
 * 100% offline, self-hosted, bypassing Next.js / Turbopack dynamic module parsing.
 */

let ffmpeg = null;

const FFMessageType = {
  LOAD: "LOAD",
  EXEC: "EXEC",
  FFPROBE: "FFPROBE",
  WRITE_FILE: "WRITE_FILE",
  READ_FILE: "READ_FILE",
  DELETE_FILE: "DELETE_FILE",
  LOG: "LOG",
  PROGRESS: "PROGRESS",
  ERROR: "ERROR",
};

self.onmessage = async ({ data: { id, type, data } }) => {
  const transfer = [];
  let result;

  try {
    if (type !== FFMessageType.LOAD && !ffmpeg) {
      throw new Error("FFmpeg is not loaded, call await ffmpeg.load() first");
    }

    switch (type) {
      case FFMessageType.LOAD: {
        const { coreURL, wasmURL, workerURL } = data || {};
        const scriptURL = coreURL || "/ffmpeg/ffmpeg-core.js";
        const wasm = wasmURL || scriptURL.replace(/\.js$/, ".wasm");
        const worker = workerURL || scriptURL.replace(/\.js$/, ".worker.js");

        // Load UMD ffmpeg-core.js synchronously into worker global scope
        importScripts(scriptURL);

        const createCore = self.createFFmpegCore;
        if (!createCore) {
          throw new Error("createFFmpegCore not defined after importing ffmpeg-core.js");
        }

        ffmpeg = await createCore({
          mainScriptUrlOrBlob: `${scriptURL}#${btoa(JSON.stringify({ wasmURL: wasm, workerURL: worker }))}`,
        });

        ffmpeg.setLogger((logData) => {
          self.postMessage({ type: FFMessageType.LOG, data: logData });
        });

        ffmpeg.setProgress((progressData) => {
          self.postMessage({ type: FFMessageType.PROGRESS, data: progressData });
        });

        result = true;
        break;
      }

      case FFMessageType.EXEC: {
        const { args = [], timeout = -1 } = data;
        ffmpeg.setTimeout(timeout);
        ffmpeg.exec(...args);
        result = ffmpeg.ret;
        ffmpeg.reset();
        break;
      }

      case FFMessageType.FFPROBE: {
        const { args = [], timeout = -1 } = data;
        ffmpeg.setTimeout(timeout);
        ffmpeg.ffprobe(...args);
        result = ffmpeg.ret;
        ffmpeg.reset();
        break;
      }

      case FFMessageType.WRITE_FILE: {
        const { path, data: fileData } = data;
        ffmpeg.FS.writeFile(path, fileData);
        result = true;
        break;
      }

      case FFMessageType.READ_FILE: {
        const { path, encoding } = data;
        result = ffmpeg.FS.readFile(path, { encoding });
        if (result instanceof Uint8Array) {
          transfer.push(result.buffer);
        }
        break;
      }

      case FFMessageType.DELETE_FILE: {
        ffmpeg.FS.unlink(data.path);
        result = true;
        break;
      }

      default:
        throw new Error(`Unknown message type: ${type}`);
    }

    self.postMessage({ id, type, data: result }, transfer);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    self.postMessage({ id, type: FFMessageType.ERROR, data: errorMsg });
  }
};
