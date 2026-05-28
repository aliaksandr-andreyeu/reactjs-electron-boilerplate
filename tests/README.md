# Tests

This project uses **Vitest** for unit tests and **Playwright** for end-to-end tests against a real Electron window.

## Running tests

```bash
# Unit tests only (no build required)
npm run test:unit

# E2E tests (runs `npm run package` first via pretest:e2e)
npm run test:e2e
```

E2E tests set `E2E_TEST=true` so the main process mocks file dialogs and HTTP responses (see `src/main.ts`).

---

## Unit tests (`tests/unit/`)

### `store.test.ts` - File store

| Test | What it verifies |
|------|------------------|
| `sets loading to true while openFile is in progress` | `loading` becomes `true` immediately when `openFile()` is called and returns to `false` when the dialog resolves with no file. |
| `stores file path and content after a successful open` | On a successful IPC result, `filePath` and `fileContent` are saved and `error` is cleared. |
| `sets error and clears content when IPC returns an error` | When IPC returns `{ error }`, the store keeps `fileContent` null and exposes the error message. |

**Mocks:** `window.electronAPI.openFileDialog`

---

### `apiStore.test.ts` - API client store

| Test | What it verifies |
|------|------------------|
| `does not send HTTP when the URL is invalid` | Empty/invalid URL sets `restUrlError` and does not call `sendHttpRequest`. |
| `sets restLoading during HTTP request and clears it after completion` | `restLoading` is `true` while the request is in flight, then `false`; response status is `200`. |
| `appends the request to restHistory after a successful HTTP call` | After a successful send, `restHistory` contains one entry with the request URL. |
| `does not connect WebSocket when the URL is invalid` | Non-`ws`/`wss` URL sets `wsUrlError` and does not call `connectWebSocket`. |
| `calls connectWebSocket and sets wsConnecting for a valid URL` | Valid `wss://` URL triggers IPC connect and `wsConnecting` is `true` until an `open` event (not simulated here). |

**Mocks:** full `window.electronAPI` (HTTP, WebSocket, persistence). Store module is re-imported per test so `electronPersist` sees the mock `window`.

---

### `validateUrl.test.ts` - URL validation helpers

| Test | What it verifies |
|------|------------------|
| `validateHttpUrl` → `rejects an empty URL` | Empty string fails validation. |
| `validateHttpUrl` → `accepts a valid https URL` | Standard HTTPS URL passes. |
| `validateHttpUrl` → `rejects ws:// protocol` | WebSocket scheme is not allowed for HTTP. |
| `validateHttpUrl` → `rejects a malformed string` | Non-URL strings fail. |
| `validateWebSocketUrl` → `rejects an empty URL` | Whitespace-only input fails. |
| `validateWebSocketUrl` → `accepts a valid wss URL` | Secure WebSocket URL passes. |
| `validateWebSocketUrl` → `rejects https:// protocol` | HTTP scheme is not allowed for WebSocket. |

---

## E2E tests (`tests/e2e/`)

Playwright launches the packaged Electron app (`/.vite/build/main.js`) with `E2E_TEST=true`.

### `app.spec.ts`

| Test | Steps | Expected result |
|------|--------|-----------------|
| `opens a text file and displays its content` | Click **Open file** on the File tab. | Mock dialog returns `test.txt` / `Hello E2E`; `.file-path` and `.content` show the data. |

---

### `api-client.spec.ts`

| Test | Steps | Expected result |
|------|--------|-----------------|
| `API client: validates REST URL and shows mocked HTTP response` | Open **API Client** → enter invalid URL → **Send** → enter `https://example.com/api` → **Send**. | Field error for invalid URL; then status badge `200` and JSON body with `"ok":true` (E2E HTTP mock in main process). |
| `API client: validates WebSocket URL before connect` | Open **WebSocket** tab → enter `https://…` → **Connect**. | Error message mentions `ws` protocol requirement. |
| `toggles dark and light theme` | Click **Dark**, then **Light**. | `html[data-theme]` cycles `light` → `dark` → `light`. |

---

## Configuration

| File | Role |
|------|------|
| `vitest.config.ts` | Unit test environment and path aliases |
| `playwright.config.ts` | E2E directory, timeouts, viewport |

## Troubleshooting E2E

1. Run `npm run package` manually and confirm `.vite/build/main.js` exists.
2. If Electron fails to launch (`bad option: --remote-debugging-port=0`), check Playwright and Electron version compatibility.
3. E2E does not start a dev server; it uses the **packaged** build output.
