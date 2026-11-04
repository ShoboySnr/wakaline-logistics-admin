let loadPromise: Promise<void> | null = null;

export function loadGoogleMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.google?.maps) return Promise.resolve();
  if (loadPromise) return loadPromise;

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return Promise.reject(new Error("no key"));

  loadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-gmaps]");
    if (existing) {
      const check = setInterval(() => {
        if (window.google?.maps) {
          clearInterval(check);
          resolve();
        }
      }, 100);
      return;
    }
    const script = document.createElement("script");
    script.dataset.gmaps = "1";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("failed to load Google Maps"));
    document.head.appendChild(script);
  });

  return loadPromise;
}
