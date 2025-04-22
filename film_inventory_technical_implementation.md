# Film Inventory Management Application – Technical Implementation Guide

**Revision 0.1 — April 22 2025**  
Author Kevin Lin & ChatGPT (assistant)

---

## 0. Scope

This document translates the high‑level **Design Document** into concrete engineering tasks, repository layout, build tooling, and coding standards required to deliver version 1.0 across Windows & macOS (with iOS follow‑up).

---

## 1. Repository & Workspace Layout

```
film‑inventory/
├─ README.md
├─ Cargo.toml            # Rust workspace
├─ packages/             # Front‑end monorepo (pnpm)
│   ├─ ui/               # SvelteKit app
│   └─ icons/            # Shared icon sprite
├─ crates/
│   ├─ core/             # Domain logic, DB, import pipeline
│   ├─ imgproc/          # Thumbnail, histogram, blur‑hash
│   ├─ aiheal/           # Scratch removal (ONNX Runtime)
│   ├─ cloud/            # (future) sync service client
│   └─ cli/              # Headless utilities
├─ apps/
│   ├─ desktop/          # Tauri shell for Win/macOS
│   └─ ios/              # SwiftUI shell (beta)
├─ .github/workflows/    # CI definitions
└─ scripts/              # Dev helpers (signing, release)
```

### 1.1 Versioning strategy

* Semantic Versioning (MAJOR.MINOR.PATCH).  
* Align crates & UI npm packages via **cargo workspaces** + `changesets`.

---

## 2. Build Toolchain

| Layer | Tool | Notes |
| --------------- | ----------------------------------------- | ---------------------------------------- |
| Rust code       | `rustc 1.78.0` (2024‑Edition)             | Set in `rust-toolchain.toml`             |
| Front‑end       | `pnpm` + `Vite 5` + SvelteKit             | `pnpm recursive install` links workspace |
| Desktop         | **Tauri 2.0‑beta**                        | `tauri dev` & `tauri build`              |
| iOS             | Xcode 16 beta                             | Bridges Tauri webview into SwiftUI       |
| Static analysis | `clippy`, `rustfmt`, `eslint`, `prettier` | Enforced via pre‑commit hook             |
| Docs            | `mdBook` + rustdoc                        | Auto‑published to GitHub Pages           |

---

## 3. Core Crate Details (`crates/core`)

### 3.1 Domain Models

* `Roll`, `Photo`, `Tag`, `Settings`, with **serde** derive for JSON IPC.  
* Use `uuid::Uuid` for IDs (v7 sortable).

### 3.2 Database Layer

* Embedded **SQLite 3.46** via `rusqlite` with **SQLCipher** optional.  
* Migrations handled by **`refinery`** at startup (`resources/migrations/*.sql`).

### 3.3 Import Pipeline

```
Importer::run(folder) ─┬─► Walker (ignore .xmp)
                      ├─► EXIF taskpool (rayon)
                      ├─► ThumbGen (imgproc crate)
                      └─► DB batch insert (txn, 100 rows)
```

* Bypass duplicate detection via pHash (64 bit) stored in `Photo.hash128`.

### 3.4 IPC Command Surface (Tauri)

| Command | Request JSON | Response | Notes |
| ---------------------- | --------------------------------- | ---------------- | ------------------------ |
| `import`               | `{ path: string }`                | `ImportJobId`    | Spawns background worker |
| `query_photos`         | `{ q: string, page: u32 }`        | `Vec<PhotoLite>` | Uses FTS5                |
| `heal`                 | `{ ids: Uuid[], intensity: f32 }` | `JobId`          | Calls aiheal plugin      |
| `export_contact_sheet` | `{ roll_id, layout }`             | `file_path`      | Generates PDF            |

---

## 4. Image Processing Crates

### 4.1 `crates/imgproc`

* Decode via `image` crate → convert to 8‑bit RGB buffer.  
* Generate 128 px & 512 px thumbnails → encode **AVIF** via `ravif`.  
* Compute **blur‑hash** (`blurhash` crate) for progressive UI.  
* Parallelism with **rayon::ThreadPoolBuilder** (num_cpus ‑ 1).

### 4.2 `crates/aiheal`

* Bundled ONNX model: **U‑Net 512 × 512** fine‑tuned on film scans.  
* Use `onnxruntime` crate:  
  * Default **CPU** EP; enable **CUDA** EP when `RUSTFLAGS="--cfg cuda"`.  
* Tile strategy: split >512 px images into overlapping tiles, apply Poisson blending.  
* Outputs a **sidecar PNG diff** (`photo_id.heal.png`); merged at display.

---

## 5. Front‑End Implementation (`packages/ui`)

| Concern      | Approach |
| ------------ | ------------------------------------------------------- |
| State mgmt   | TanStack Query; each IPC promise cached by key |
| Routing      | SvelteKit file‑based routes (`src/routes/+page.svelte`) |
| Virtual grid | `svelte-virtual` with 300 row buffer |
| Theming      | Tailwind CSS + DaisyUI, system dark/light toggle |
| Forms        | `felte` for metadata dialogs |
| Drag‑drop    | Tauri `FileDialog` + HTML5 DnD fallback |

### 5.1 Packaging Optimizations

* `vite build --mode tauri` → splits vendor chunk, keeps JS bundle < 150 KB gzip.  
* Images, fonts inlined if <4 KB.

---

## 6. Testing Strategy

| Level | Tool | Coverage Goal |
| ----------- | ---------------------------- | -------------------------- |
| Unit (Rust) | `cargo test --lib` | 80 % statements |
| WASM + UI | `playwright` headless | Import & browse flows |
| Integration | `cargo test --test=*` | Import pipeline end‑to‑end |
| Fuzzing | `cargo fuzz` on EXIF parser | 0 crashes in 1 M runs |
| Perf | `cargo criterion` benchmarks | Track regressions >5 % |

---

## 7. Continuous Integration

* **GitHub Actions** matrix: `windows-latest`, `macos-latest`.  
* Steps:  
  1. Setup Rust + Node.  
  2. Restore pnpm cache.  
  3. `cargo clippy -- -Dwarnings`, `rustfmt --check`.  
  4. Build crates (`--release`).  
  5. `pnpm build`.  
  6. `tauri build --target win64|mac-universal`.  
  7. Upload artifacts.

### 7.1 Code‑Signing & Notarization

| OS | Tool | CI step |
| ------- | ------------------------- | ------------------------- |
| Windows | `signtool.exe` EV cert | Azure secret injected |
| macOS | `codesign` + `notarytool` | App Store Connect API key |

---

## 8. Performance & Profiling

* **Tracing** crate with `tokio-console` for async spans.  
* Use **`cargo flamegraph`** on hot paths (thumb gen, SQL queries).  
* UI: Chrome DevTools Lighthouse against `tauri://localhost`.

---

## 9. Deployment & Updates

| Channel | Format | Update Mechanism |
| ---------- | --------------- | ------------------------------------ |
| Windows | `installer.msi` | Tauri Auto‑Updater + GitHub Releases |
| macOS | `.dmg` | Sparkle (embedded by Tauri) |
| iOS (beta) | TestFlight | Manual upload until App Store launch |

---

## 10. Security Considerations

* All IPC validated via **serde‑valid**.  
* Feature gates: compile‑time `--features "sqlcipher,cuda"`.  
* Supply‑chain scanning: **cargo‑audit**, **npm audit**.

---

## 11. Future Enhancements (v1.1+)

1. GPU thumbnail pipeline via **wgpu** compute shaders.  
2. Replace SQLite with **LiteFS** for transparent sync.  
3. Mobile write‑access (rating, tags) with optimistic replication.

---

### Appendix A – Example Migration (`V1__init.sql`)

```sql
CREATE TABLE Roll(
  id       TEXT PRIMARY KEY,
  name     TEXT,
  date_scanned INTEGER,
  camera   TEXT,
  film_stock TEXT,
  notes    TEXT
);

CREATE TABLE Photo(
  id         TEXT PRIMARY KEY,
  roll_id    TEXT REFERENCES Roll(id),
  file_path  TEXT,
  capture_date INTEGER,
  frame_no   INTEGER,
  rating     INTEGER DEFAULT 0,
  hash128    BLOB
);
-- FTS virtual table
CREATE VIRTUAL TABLE photo_fts USING fts5(id, keywords, content='Photo', content_rowid='id');
```

---

*End of Implementation Guide.*
