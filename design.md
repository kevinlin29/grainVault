Film Inventory Management Application – Design Document

Revision 0.1 — April 22 2025Author Kevin Lin & ChatGPT (assistant)

1. Purpose & Vision

Provide hobbyists and professional photographers a local‑first, cross‑platform catalogue for their scanned film photos that feels as fast and native as Lightroom’s Library, yet keeps data ownership on disk.

Why · Current DAM tools assume RAW‑digital workflows; film shooters juggle folders or spreadsheets.

For whom · Windows & macOS desktop users today; iOS companion next.

North‑star · Import a 36‑shot roll and be able to search by camera, film stock, or keyword in under 5 s.

2. Goals & Non‑Goals

Goals

Non‑Goals

🗂️ Seamless roll‑based import (folder ≈ roll)

Full RAW color‑correction pipeline

🔍 Instant search by EXIF, film stock, custom tags

In‑app editing beyond basic rotate/crop

💾 Local catalogue; optional encrypted cloud sync

Android support in v1

⚡️ 90 FPS thumbnail grid on mid‑range laptops

Multi‑user collaboration

🪄 AI scratch & dust removal (batch‑mode)

GPU‑intensive ML editing workflows

🛠️ Simple drag‑drop UI; dark/light themes

Printer/scanner control

3. User Personas & Key Scenarios

Enthusiast Eddie scans at home → drags roll folder → rates & tags.

Pro Paula imports hundreds of rolls after a wedding → batch keywords, exports contact sheet.

Archivist Alex wants statistics: rolls per camera, film stock usage, success rate vs. exposure notes.

4. High‑Level Architecture

┌──────────────┐   Rust FFI   ┌───────────────┐
│  SvelteKit   │◀────────────▶│  Core (Rust)  │  Thumbnail cache /  EXIF / DB
│  (Tauri UI)  │   Channels   └───────────────┘
└──────────────┘                ▲    ▲
        │ Filesystem APIs       │    │ Axum REST (sync)
        ▼                        │    ▼
┌──────────────┐        WebView  └───────────────┐
│  OS Storage  │ <─ iCloud / OneDrive (opt‑in) ──┘
└──────────────┘

Tauri 2.0 shell: ships <10 MB binary, native dialogs, file watchers.

Core crate: image decoding (image, avif-rs), EXIF (rexiv2), SQL logic (rusqlite, FTS5).

Sync service (optional): Axum behind Cloudflare Workers + S3/MinIO.

5. Module Breakdown

Module

Language

Responsibilities

ui/

TS + Svelte

Layout, virtual‑scroll grid, state via TanStack Query

core/

Rust

Domain models, import pipeline, image ops, DB layer

plugins/imgproc

Rust

Blur‑hash, histogram, future GPU thumb gen

plugins/aiheal

Rust + ONNX Runtime

Scratch/dust detection & inpainting

plugins/cloud

Rust

CloudKit / S3 sync adapter

cli/

Rust

Headless utilities (e.g., reindex)

6. Data Model (ER‑like)

Roll(id PK, name, date_scanned, camera, film_stock, notes)
Photo(id PK, roll_id FK, file_path, capture_date, frame_no, rating, hash128)
Tag(id PK, name)
PhotoTag(photo_id FK, tag_id FK)
History(id PK, action, ts, photo_id?)

FTS5 virtual table on Photo (keywords, notes) for instant search.

Thumbnails stored under ~/Pictures/FilmInventory/thumbs/{sha256}.avif.

7. Key Workflows

7.1 Import Roll

User drags folder → UI sends IPC import(path)

Core walks files, extracts EXIF/metadata, begins SQL txn.

Thumbs generated at 128 px/512 px; blur‑hash computed.

Progress events streamed to UI; optimistic rows show grey placeholder.

7.2 Search & Browse

Query built client‑side → SQLite FTS5 query via FFI → result IDs → UI fetches file paths & thumbs lazily.

7.3 Sync (future)

Lite‑weight delta log uploaded; images to S3 bucket → iOS app pulls same log, downloads needed thumbs/full files.

7.4 Scratch & Dust Removal

User selects photos → UI sends IPC heal(photo_ids, intensity).

Core loads ONNX U‑Net model (in plugins/aiheal), processes image into a nondestructive healing layer.

Progress streamed; new layer stored as sidecar .heal file, DB row updated (healed_at, version).

Lite‑weight delta log uploaded; images to S3 bucket → iOS app pulls same log, downloads needed thumbs/full files.

8. Non‑Functional Requirements

Performance · Import JPEG: ≥ 5 files/s; RAW: ≥ 2 files/s.

Memory · ≤ 250 MB while viewing 1 k thumbnails.

Security · All sync traffic TLS 1.3; SQLCipher optional encryption.

Portability · Compile targets: win‑x64, win‑arm64, mac‑universal2.

Accessibility · WCAG 2.2 AA color contrast; keyboard nav.

9. Tech Stack Summary

Layer

Choice

Rationale

Runtime

Tauri 2.0

Tiny binary, iOS path

UI

SvelteKit + Tailwind

Reactive, minimal bundle

State

TanStack Query, RxJS

Predictable caching

Domain

Rust 2024 edition

Safe, high‑perf

DB

SQLite + FTS5 + SQLCipher

Zero‑config, fast search

Sync

Axum + Cloudflare Workers

Serverless / low ops

CI

GitHub Actions + cross‑run

Cross‑compile, code‑sign

10. Open Questions & Risks

Thumbnail GPU acceleration – worth integrating wgpu?

Finder/Explorer extension – Tauri plug‑in vs. native Swift/C#?

Schema migrations – use Diesel migrations or custom?

Cloud storage cost – pay‑per‑user S3 vs. BYO‑bucket.

11. Roadmap (tentative)

Milestone

Target date

Features

M0 Prototype

May 31 ’25

Import folder, grid view, SQLite

M1 UX Polish

Jul 15 ’25

Rating/tagging, fast search, stats

M2 macOS Beta

Aug 30 ’25

Code‑sign, notarization, Apple Silicon

M3 Windows GA

Oct 15 ’25

Installer, auto‑update, telemetry opt‑in

M4 iOS Alpha

Dec 20 ’25

Read‑only catalogue, sync MVP

Appendix A – Performance Benchmarks

MacBook Air M1 (2020) · 36 JPEGs ≈ 4 s import.

Surface Laptop Studio (Intel i7‑13700H) · 36 DNG ≈ 14 s import.

Appendix B – Glossary

Roll – folder containing scans from one physical roll.

Hash128 – perceptual hash (pHash) for duplicate detection.

Blur‑hash – compact thumb representation for progressive loading.

End of document.

