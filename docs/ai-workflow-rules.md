# AI Workflow Rules

## Development Approach

This application is built incrementally using a **spec-driven, phase-gated workflow**.
The documentation files in `docs/` define the functional requirements, architectural contracts, design tokens, and current progress. All code must implement against these specifications rather than inventing speculative behavior.

---

## Scoping Rules

1. **One Unit at a Time**: Complete a single functional module (e.g. image mask extraction, UI dropzone, video demuxer) before moving to the next.
2. **End-to-End Verifiability**: Every completed step must be testable in isolation.
3. **No Mixed Boundaries**: Do not mix UI redesigns, video codec plumbing, and core mathematical formulas in a single change.

---

## When to Split Work

Split an implementation step if:
- It involves both image processing and video decoding simultaneously.
- It attempts to create the entire application shell and all components in a single commit.
- The unit requires new external dependencies or WASM builds that have not been individually tested.

---

## Handling Missing Requirements

- Never guess or approximate the reverse alpha blending equations — refer directly to the reference implementations (`GeminiWatermarkTool` and `VeoWatermarkRemover`).
- If a watermark variant (e.g. a new resolution or aspect ratio) has unknown offsets, log the candidate coordinates as an open question in `docs/progress-tracker.md` and provide a manual region override escape hatch.

---

## Protected Files

- `docs/*`: Must only be updated to document verified architectural decisions or progress tracking.
- Reference assets / masks: Must match the calibrated bitmaps from `allenk/GeminiWatermarkTool`.

---

## Keeping Docs in Sync

After every meaningful implementation change:
1. Update `docs/progress-tracker.md` to reflect completed items, current status, and next steps.
2. If implementation reveals new constraints (such as browser WebCodecs codec support limitations), document the decision in `docs/architecture.md`.

---

## Before Moving to the Next Unit

1. The current unit builds cleanly without TypeScript or ESLint errors.
2. Invariants in `docs/architecture.md` are preserved (zero server leaks, lossless audio, accurate math).
3. The change is verified in the browser or via automated unit tests.
4. `docs/progress-tracker.md` is updated.
