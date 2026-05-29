// ─────────────────────────────────────────────
//  PWA INSTALL PROMPT
//  Handles the native browser install banner (Android/Chrome) and the
//  manual "Add to Home Screen" tip for iOS Safari.
// ─────────────────────────────────────────────
import state from "../state/appState.js";
import { getInstallDismissed, setInstallDismissed } from "../services/storageService.js";
import { showToast } from "./toast.js";

export function setupInstallPrompt() {
  const prompt = document.getElementById("install-prompt");
  const action = document.getElementById("install-action");
  const copy = document.getElementById("install-copy");
  const close = document.getElementById("install-close");

  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const dismissed = getInstallDismissed();

  const showPrompt = () => {
    if (isStandalone || dismissed) return;
    prompt.classList.add("show");
  };

  close.addEventListener("click", () => {
    setInstallDismissed();
    prompt.classList.remove("show");
  });

  action.addEventListener("click", async () => {
    if (state.installPromptEvent) {
      state.installPromptEvent.prompt();
      await state.installPromptEvent.userChoice.catch(() => {});
      state.installPromptEvent = null;
      prompt.classList.remove("show");
      return;
    }
    showToast(isIos ? "Tap Share, then Add to Home Screen" : "Use browser menu to install Open Box");
  });

  // Chrome/Android fires this before showing the default mini-infobar.
  window.addEventListener("beforeinstallprompt", e => {
    e.preventDefault();
    state.installPromptEvent = e;
    copy.textContent = "Install the app for full-screen access from your home screen.";
    action.textContent = "Install";
    setTimeout(showPrompt, 900);
  });

  if (isIos) {
    copy.textContent = "Tap Share, then Add to Home Screen for the full-screen app.";
    action.textContent = "How";
    setTimeout(showPrompt, 1200);
  }
}

export function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || location.protocol === "file:") return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
