# Cross‑Platform Viability of the Film‑Inventory Tech Stack

**Short answer — Yes, the stack will run on all three targets (Windows, macOS, iOS), with a few per‑platform tweaks.**  
The tables below list what works out of the box, what needs compile‑time flags, and where fall‑back paths are required.

---

## 1. Shell / Runtime

| Component | Windows | macOS | iOS | Notes |
|-----------|---------|-------|-----|-------|
| **Tauri 2.x** | ✔ Stable | ✔ Stable (universal2) | ✔ Mobile target in the stable channel | Mobile API surface is still thinner than desktop (dialogs, notifications, NFC, biometrics, clipboard). |
| Web‑view backend | WebView2 | WKWebView | WKWebView | The same HTML + JS bundle is used on all targets. |

> **Tip:** On iOS the generated `xcframework` is embedded in a **SwiftUI** host project. Xcode signs/notarizes the embedded Rust dylibs automatically when “Embed & Sign” is enabled.

---

## 2. Core Logic (Rust)

| Library | Windows / macOS | iOS | Caveats |
|---------|-----------------|-----|---------|
| **Std lib + Rayon** | ✔ | ✔ | On iOS the default thread count is lower; call `rayon::ThreadPoolBuilder::num_threads()`. |
| **SQLite / SQLCipher** | ✔ pre‑built DLL | ✔ static or Homebrew | ✔ static (community or commercial) | Community build is fine; commercial edition provides better Mac Catalyst binaries. |
| **AVIF encoder (`ravif`)** | ✔ | ✔ (Apple Silicon OK) | ✔ (CPU‑only) | Native AVIF QuickLook preview on macOS ≤ 13 requires a plug‑in. |
| **ONNX Runtime** | ✔ CPU & CUDA EP | ✔ CPU & Core ML EP | ✔ CPU or Core ML EP | Build with `--use_coreml` for Apple chips / iOS. |

*CUDA disappears on macOS/iOS; build‑scripts detect the target and pick the right feature.*

---

## 3. Front‑End (SvelteKit + Tailwind)

* Same bundle is served inside WebView2 and WKWebView.  
* Tailwind’s dark/light classes adapt automatically via `prefers‑color‑scheme` on iOS.

---

## 4. GPU / Multimedia Acceleration

| Feature | Windows | macOS | iOS |
|---------|---------|-------|-----|
| **wgpu thumbnail compute** | ✔ D3D12 / Vulkan | ✔ Metal | ⚠️ not yet (WebGPU disabled in iOS Tauri) |
| **AI scratch removal (ONNX U‑Net)** | CUDA or CPU | CPU or Core ML | CPU or Core ML |

Keep compute shaders behind a cargo feature flag; fall back to Rayon‑based CPU paths when the GPU build isn’t available.

---

## 5. DevOps & Distribution

| Step | Windows | macOS | iOS |
|------|---------|-------|-----|
| Signing | `signtool.exe` (EV cert) | `codesign` + `notarytool` | Xcode handles embedded dylibs | CI scripts in the implementation guide already call these tools. |
| Updates | Tauri auto‑updater | Sparkle | TestFlight / App Store | Auto‑update on iOS is simply App Store delivery. |

---

## Practical Tips Before First Release

1. **Cross‑compile early** – `cargo tauri build --target aarch64‑apple‑ios` to surface static‑lib issues.  
2. **Gate CUDA** – use `cfg_if!` to compile CUDA EP only on Windows.  
3. **Bundle size checks** – expect macOS universal build ≈ 13–15 MB, iOS `.ipa` ≈ 18 MB with Core ML.  
4. **Disk paths** – use `tauri::api::path::app_data_dir()` instead of hard‑coded `~/Pictures`.

---

## Bottom Line

* **Desktop:** 100 % covered — all components compile or ship pre‑built.  
* **iOS:** Runs with (a) CPU/Core ML inference, (b) no GPU thumbnail shaders for now, and (c) slightly thinner Tauri API surface. None are deal‑breakers for an inventory‑first workflow.

If you’re comfortable with those trade‑offs, the stack remains truly cross‑platform. Moving to Flutter or .NET MAUI would give deeper mobile APIs but sacrifice Rust’s performance and small binaries that motivated this design.

---

*End of document.*
