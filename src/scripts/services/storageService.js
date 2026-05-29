// ─────────────────────────────────────────────
//  STORAGE SERVICE
//  Wraps localStorage so all key names live in one place.
//  When Best Buy provides a real auth flow these can swap to
//  session tokens or a backend without touching app logic.
// ─────────────────────────────────────────────

export function getStoredApiKey() {
  return localStorage.getItem("bb_key") || "";
}
export function saveApiKey(key) {
  localStorage.setItem("bb_key", key);
}
export function clearApiKey() {
  localStorage.removeItem("bb_key");
}

export function getStoredStoreId() {
  return localStorage.getItem("bb_store") || "360";
}
export function saveStoreId(id) {
  localStorage.setItem("bb_store", id);
}

export function saveFavoriteProductKeys(keys) {
  localStorage.setItem("bb_favorites", JSON.stringify(keys));
}

export function getInstallDismissed() {
  return localStorage.getItem("bb_install_dismissed") === "1";
}
export function setInstallDismissed() {
  localStorage.setItem("bb_install_dismissed", "1");
}
