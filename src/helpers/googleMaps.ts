let loadPromise: Promise<void> | null = null;

export function loadGoogleMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.google?.maps?.Map) return Promise.resolve();
  if (loadPromise) return loadPromise;

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return Promise.reject(new Error("no key"));

  loadPromise = new Promise<void>((resolve, reject) => {
    let settled = false;
    const start = Date.now();

    const finish = (err?: Error) => {
      if (settled) return;
      settled = true;
      clearInterval(poll);
      if (err) {
        loadPromise = null;
        reject(err);
      } else {
        resolve();
      }
    };

    const poll = setInterval(() => {
      if (window.google?.maps?.Map) finish();
      else if (Date.now() - start > 15000) finish(new Error("timeout"));
    }, 100);

    if (!document.querySelector("script[data-gmaps]")) {
      const script = document.createElement("script");
      script.dataset.gmaps = "1";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
      script.async = true;
      script.defer = true;
      script.onerror = () => finish(new Error("failed to load Google Maps"));
      document.head.appendChild(script);
    }
  });

  return loadPromise;
}
