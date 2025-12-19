import { useState, useEffect } from 'react';
import { Coordinates } from '../types';

export interface GeolocationData extends Coordinates {
  heading?: number; // Bearing/direction in degrees (0-360)
  speed?: number; // Speed in m/s
  accuracy?: number; // Accuracy in meters
}

interface GeolocationState {
  location: GeolocationData | null;
  loading: boolean;
  error: string | null;
}

export const useGeolocation = (enabled: boolean = true): GeolocationState => {
  const [location, setLocation] = useState<GeolocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    if (!navigator.geolocation) {
      setError('Geolocalização não é suportada pelo seu navegador');
      setLoading(false);
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          heading: position.coords.heading !== null && position.coords.heading !== undefined 
            ? position.coords.heading 
            : undefined,
          speed: position.coords.speed !== null && position.coords.speed !== undefined
            ? position.coords.speed
            : undefined,
          accuracy: position.coords.accuracy
        });
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
        console.error('Erro de geolocalização:', err);
      },
      options
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [enabled]);

  return { location, loading, error };
};

