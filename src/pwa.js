if ("serviceWorker" in navigator && window.location.protocol === "https:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js", { scope: "/" }).catch(() => {
      // The app remains fully usable online if service-worker registration is unavailable.
    });
  });
}
