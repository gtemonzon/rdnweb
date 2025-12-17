import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';

const REFUGIO_COORDINATES: [number, number] = [-90.5133, 14.6076]; // 4ta avenida zona 9, Guatemala City

const ContactMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [tokenInput, setTokenInput] = useState('');

  useEffect(() => {
    // Check localStorage for saved token
    const savedToken = localStorage.getItem('mapbox_token');
    if (savedToken) {
      setMapboxToken(savedToken);
    }
  }, []);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: REFUGIO_COORDINATES,
        zoom: 15,
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Add marker for Refugio de la Niñez
      new mapboxgl.Marker({ color: '#F68A33' })
        .setLngLat(REFUGIO_COORDINATES)
        .setPopup(
          new mapboxgl.Popup().setHTML(
            '<strong>Refugio de la Niñez</strong><br/>4ta avenida 10-53 zona 9<br/>Ciudad de Guatemala'
          )
        )
        .addTo(map.current);

      map.current.on('load', () => {
        setIsMapLoaded(true);
      });

      map.current.on('error', () => {
        setIsMapLoaded(false);
        setMapboxToken('');
        localStorage.removeItem('mapbox_token');
      });
    } catch (error) {
      console.error('Error loading map:', error);
      setMapboxToken('');
      localStorage.removeItem('mapbox_token');
    }

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken]);

  const handleSubmitToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (tokenInput.trim()) {
      localStorage.setItem('mapbox_token', tokenInput.trim());
      setMapboxToken(tokenInput.trim());
    }
  };

  if (!mapboxToken) {
    return (
      <div className="rounded-xl overflow-hidden h-64 bg-muted flex items-center justify-center p-6">
        <form onSubmit={handleSubmitToken} className="text-center space-y-4 w-full max-w-sm">
          <MapPin className="w-10 h-10 mx-auto text-primary opacity-50" />
          <p className="text-sm text-muted-foreground">
            Para ver el mapa, ingresa tu token público de Mapbox.
            <br />
            <a 
              href="https://mapbox.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Obtén uno gratis en mapbox.com
            </a>
          </p>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="pk.eyJ1..."
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="sm">Cargar</Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden h-64">
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
};

export default ContactMap;
