import axios from "axios";

const API_BASE = (import.meta.env.VITE_API_BASE || "/api").replace(/\/+$/, "");

// We get the key dynamically to support the AuthContext login
function getApiKey() {
  return sessionStorage.getItem('secure_cloud_api_key') || import.meta.env.VITE_API_KEY || "";
}

// Sync token to Service Worker for media requests
export function syncServiceWorkerToken() {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'INIT',
      token: getApiKey(),
      apiBase: API_BASE
    });
  }
}

// Ensure it syncs on startup if SW is already active
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then(() => syncServiceWorkerToken());
}

const http = axios.create({
  baseURL: API_BASE,
  timeout: 10_000,
});

const uploadHttp = axios.create({
  baseURL: API_BASE,
  timeout: 5 * 60_000,
});

// Add Authorization interceptor
[http, uploadHttp].forEach(client => {
  client.interceptors.request.use(config => {
    const key = getApiKey();
    if (key) {
      config.headers.Authorization = `Bearer ${key}`;
    }
    return config;
  });
});

function enc(p) {
  return encodeURIComponent(p || "");
}

export function listFiles(path = "") {
  return http
    .get("/files", { params: { path } })
    .then((r) => {
      const ct = r.headers?.["content-type"] || "";
      const data = r.data;
      if (typeof data === "string" && data.trim().startsWith("<")) {
        throw new Error(
          `Expected JSON from ${r.config?.url || "/files"} but got HTML.`
        );
      }
      if (ct && !ct.includes("application/json") && typeof data !== "object") {
        throw new Error(
          `Expected JSON from ${r.config?.url || "/files"} but got ${ct}.`
        );
      }
      return data;
    });
}

export function fileUrl(path) {
  const base = API_BASE.endsWith("/") ? API_BASE.slice(0, -1) : API_BASE;
  return `${base}/files/${enc(path)}`;
}

export function zipUrl(path, downloadId = "") {
  const base = API_BASE.endsWith("/") ? API_BASE.slice(0, -1) : API_BASE;
  return `${base}/zip?path=${enc(path)}&download_id=${enc(downloadId)}`;
}

export async function zipStatus(downloadId) {
  const res = await http.get(`/zip/status/${enc(downloadId)}`);
  return res.data;
}

export function streamUrl(path) {
  const base = API_BASE.endsWith("/") ? API_BASE.slice(0, -1) : API_BASE;
  return `${base}/stream/${enc(path)}`;
}

export function uploadFile(file, path = "", onProgress) {
  const form = new FormData();
  form.append("file", file);
  return uploadHttp.post("/upload", form, {
    params: { path },
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
    },
  });
}

export function deleteItem(name, path = "") {
  return http.delete("/files", { params: { name, path } });
}

export function renameItem(oldName, newName, path = "") {
  return http.put("/rename", null, {
    params: { old_name: oldName, new_name: newName, path },
  });
}

export function mkdir(name, path = "") {
  return http.post("/mkdir", null, { params: { name, path } });
}

export function readText(path) {
  return http.get(`/files/${enc(path)}`, { responseType: "text", timeout: 10_000 });
}
