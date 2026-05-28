# React + Electron Boilerplate

A production-ready starter template for building **desktop applications** with **React**, **Electron**, and **Vite**. It ships with a small but realistic sample app (file viewer + HTTP/WebSocket API client), typed IPC, persistent state, light/dark theming, and unit/E2E tests.

## Features

### Platform & tooling

- **Vite** with HMR for fast renderer, main, and preload builds
- **Electron Forge** for dev, packaging, and installers
- **TypeScript** with shared types between main and renderer (`src/common/electronApi.ts`)
- **Zustand** for renderer state; **electron-store** for durable settings/history
- **Vitest** (unit) and **Playwright** (E2E against a real Electron window)
- **ESLint** flat config
- **Secure defaults**: `contextIsolation`, preload bridge, no `nodeIntegration` in the renderer

### Sample application

| Tab | What it demonstrates |
|-----|----------------------|
| **File** | Native open dialog, read text files, loading/error states |
| **API client** | REST requests (GET/POST/PUT/PATCH/DELETE), custom headers, JSON body, response viewer with status badges and copy-to-clipboard |
| **WebSocket** | Connect/disconnect, chat-style messages with timestamps, auto-scroll, connection errors |

### UX details (API client)

- Loading states on **Send** and **Connect**
- Client-side URL validation before IPC calls
- Request history (last 20 REST and WebSocket URLs), persisted via `electron-store`
- Light / dark theme toggle (CSS variables in `tokens.css`)

## Requirements

- **Node.js** 18+ (16+ may work; 18+ recommended)
- **npm** (or yarn/pnpm with equivalent scripts)
- **macOS**, **Windows**, or **Linux**

## Quick start

```bash
# Install dependencies
npm install

# Run in development (Electron + Vite HMR)
npm start

# Package without installer
npm run package

# Build distributable (output in out/)
npm run make
```

After `npm start`, use the top navigation:

1. **File** — click **Open file** to load a `.txt` file.
2. **API client** — switch between **REST API** and **WebSocket** sub-tabs.

## Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start Electron in development mode |
| `npm run package` | Package the app (no installer) |
| `npm run make` | Create platform packages/installers |
| `npm run publish` | Publish via Electron Forge (if configured) |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint with auto-fix |
| `npm run test:unit` | Run Vitest unit tests |
| `npm run test:e2e` | Build (`package`) then run Playwright E2E tests |
| `npm run clean` | Remove `.vite/` and `out/` build artifacts |

## Project structure

The renderer follows a **Feature-Sliced Design–inspired** layout: entities, features, pages, and shared code.

```
src/
├── main.ts                 # Electron main process (IPC, dialogs, HTTP/WS)
├── preload.ts              # contextBridge → window.electronAPI
├── renderer.ts             # Renderer entry (loads React)
├── common/
│   └── electronApi.ts      # Shared IPC types (main + renderer)
│
└── renderer/
    ├── app/                # App shell, global styles
    ├── pages/home/         # Home page (file + API tabs)
    ├── entities/           # Business entities (file, apiRequest)
    │   ├── file/           # File store + FileContent UI
    │   └── apiRequest/     # API store, ResponseViewer
    ├── features/           # User-facing features
    │   ├── openFile/
    │   └── apiClient/      # HTTP/WS forms, history, styles
    └── shared/
        ├── api/            # Renderer-side API helpers
        ├── lib/            # validateUrl, theme, persist, id
        ├── styles/         # tokens.css (design tokens)
        └── ui/Button/      # Shared Button component

tests/
├── unit/                   # Vitest (stores, URL validation)
└── e2e/                    # Playwright + Electron
```

## Architecture

### Process model

```
┌─────────────────┐     preload (contextBridge)     ┌──────────────────┐
│  Main process   │ ◄──────────────────────────────► │ Renderer (React) │
│  main.ts        │         electronAPI             │  Zustand stores  │
│  IPC handlers   │                                 │  UI components   │
└────────┬────────┘                                 └──────────────────┘
         │
         ├── fs / dialog (file open)
         ├── fetch (HTTP from main — no CORS in renderer)
         ├── WebSocket (main process)
         └── electron-store (persistentGet / persistentSet)
```

### IPC API (`window.electronAPI`)

Defined in `src/common/electronApi.ts` and exposed in `src/preload.ts`:

| Method | Description |
|--------|-------------|
| `ping()` | Health check |
| `openFileDialog()` | Open native file picker; returns path + UTF-8 content |
| `sendHttpRequest(config)` | HTTP request via `fetch` in the main process |
| `connectWebSocket(url)` | Returns connection id |
| `sendWsMessage(id, message)` | Send message on an open socket |
| `closeWebSocket(id)` | Close connection |
| `onWsEvent(callback)` | Listen for `open` / `message` / `close` / `error` |
| `removeWsListener()` | Remove all WS listeners |
| `persistentGet(key)` / `persistentSet(key, value)` | Encrypted local storage (`electron-store`) |

Renderer code should **only** talk to the main process through this API.

### State management

- **File store** (`entities/file/model/store.ts`) — file path, content, loading, errors.
- **API store** (`entities/apiRequest/model/store.ts`) — REST/WebSocket form state, responses, messages, history. History is persisted with `electronPersist` (wrapper around `persistentSet` / `persistentGet`).

### Theming

- Design tokens live in `src/renderer/shared/styles/tokens.css`.
- Theme is stored in `localStorage` (`app-theme`) and applied as `data-theme="light" | "dark"` on `<html>`.
- Toggle: **Dark** / **Light** button in the top menu.

## Configuration files

| File | Purpose |
|------|---------|
| `tsconfig.json` | TypeScript compiler options |
| `vite.main.config.ts` | Main process bundle |
| `vite.preload.config.ts` | Preload bundle |
| `vite.renderer.config.ts` | React renderer bundle |
| `forge.config.ts` | Electron Forge makers & Vite plugin |
| `vitest.config.ts` | Unit test runner |
| `playwright.config.ts` | E2E test runner |
| `eslint.config.js` | ESLint flat config |

## CI & dependencies

- **GitHub Actions** (`.github/workflows/ci.yml`) runs on every push/PR to `main`/`master`: ESLint, unit tests, and `electron-forge package`.
- **Dependabot** (`.github/dependabot.yml`) opens weekly PRs for npm and GitHub Actions updates.

## Testing

See **[tests/README.md](./tests/README.md)** for a full catalog of every test case.

### Unit tests (`npm run test:unit`)

| File | Suite | Cases |
|------|--------|-------|
| `tests/unit/store.test.ts` | **FileStore** | Loading flag during `openFile`; save path/content on success; surface IPC errors |
| `tests/unit/apiStore.test.ts` | **ApiStore** | Block invalid HTTP/WS URLs; `restLoading` lifecycle; REST history; WebSocket connect + `wsConnecting` |
| `tests/unit/validateUrl.test.ts` | **validateHttpUrl / validateWebSocketUrl** | Accept/reject schemes, empty input, malformed strings |

### E2E tests (`npm run test:e2e`)

Runs `npm run package` first, then Playwright against the packaged Electron app with `E2E_TEST=true` (mocked file dialog and HTTP in `main.ts`).

| File | Test name | What it checks |
|------|-----------|----------------|
| `tests/e2e/app.spec.ts` | `opens a text file and displays its content` | File tab → open dialog → content rendered |
| `tests/e2e/api-client.spec.ts` | `API client: validates REST URL and shows mocked HTTP response` | Invalid URL error; valid URL → status 200 + JSON body |
| `tests/e2e/api-client.spec.ts` | `API client: validates WebSocket URL before connect` | `https://` rejected on WebSocket tab |
| `tests/e2e/api-client.spec.ts` | `toggles dark and light theme` | `data-theme` on `<html>` switches light ↔ dark |

**Troubleshooting:** If Electron fails to launch (e.g. Playwright/Electron CLI flag conflicts), run `npm run package` manually and verify `.vite/build/main.js` exists.

## Security

- **Context isolation** is enabled; the renderer has no direct Node.js access.
- **Preload** exposes a minimal, typed `electronAPI` via `contextBridge`.
- HTTP and WebSocket run in the **main process** so secrets and Node APIs stay out of the renderer when you extend the app.
- Persistent data uses **electron-store** with an encryption key (change `encryptionKey` in `src/main.ts` for production).

## Extending the boilerplate

1. **Add IPC** — extend `ElectronAPI` in `common/electronApi.ts`, implement handler in `main.ts`, expose in `preload.ts`.
2. **Add a feature** — create `features/myFeature/ui/` and wire it from a page.
3. **Add persistence** — wrap a Zustand store with `electronPersist` from `shared/lib/persistElectronStore.ts`.
4. **Add makers** — configure DEB/RPM/Squirrel in `forge.config.ts`.

## Tech stack

| Layer | Technology |
|-------|------------|
| Desktop | Electron 42 |
| UI | React 19 |
| Language | TypeScript |
| Bundler | Vite 5 |
| Packaging | Electron Forge 7 |
| State | Zustand 5 |
| Storage | electron-store 11 |
| Unit tests | Vitest 2 |
| E2E tests | Playwright 1 |
| Lint | ESLint 9 |

## License

MIT © [Aliaksandr Andreyeu](mailto:andreyeu.aliaksandr@gmail.com)
