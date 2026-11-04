"use client";

import { useEffect, useRef } from "react";

interface AddressAutocompleteProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onResolved?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    google: any;
  }
}

function waitForPlaces(callback: () => void) {
  if (window.google?.maps?.places) {
    callback();
    return;
  }
  const interval = setInterval(() => {
    if (window.google?.maps?.places) {
      clearInterval(interval);
      callback();
    }
  }, 100);
}

function loadGoogleMaps(apiKey: string, callback: () => void) {
  if (typeof window === "undefined") return;
  if (window.google?.maps?.places) {
    callback();
    return;
  }
  if (document.querySelector("script[data-gmaps]")) {
    waitForPlaces(callback);
    return;
  }
  const script = document.createElement("script");
  script.dataset.gmaps = "1";
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
  script.async = true;
  script.defer = true;
  script.onload = () => waitForPlaces(callback);
  document.head.appendChild(script);
}

/**
 * Google Places address field restricted to Nigeria. Falls back to a plain
 * input (still fully usable) when no Maps key is configured.
 */
export default function AddressAutocomplete({ id, value, onChange, onResolved, placeholder, className }: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const autocompleteRef = useRef<any>(null);
  const onResolvedRef = useRef(onResolved);
  onResolvedRef.current = onResolved;

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || !inputRef.current) return;

    loadGoogleMaps(apiKey, () => {
      if (!inputRef.current || autocompleteRef.current) return;

      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: "ng" },
        fields: ["formatted_address", "geometry", "name"],
      });

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        const address = place.formatted_address || place.name || inputRef.current?.value || "";
        onChange(address);
        if (place.geometry) onResolvedRef.current?.(address);
      });

      autocompleteRef.current = autocomplete;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (inputRef.current && document.activeElement !== inputRef.current && inputRef.current.value !== value) {
      inputRef.current.value = value;
    }
  }, [value]);

  return (
    <input
      ref={inputRef}
      id={id}
      type="text"
      defaultValue={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={(e) => onResolvedRef.current?.(e.target.value)}
      placeholder={placeholder}
      className={className ?? "input"}
      autoComplete="off"
    />
  );
}
