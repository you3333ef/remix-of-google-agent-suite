import { useState, useEffect, useRef, useCallback } from 'react';
import { Map, MapPin, Search, Navigation, Layers, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Place {
  name: string;
  address: string;
  lat: number;
  lng: number;
  placeId?: string;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export default function GoogleMapsManager() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [apiKey, setApiKey] = useState<string>('');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [mapType, setMapType] = useState('roadmap');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadApiKey();
    }
  }, [user]);

  useEffect(() => {
    if (apiKey && !mapLoaded) {
      loadGoogleMapsScript();
    }
  }, [apiKey]);

  const loadApiKey = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('user_settings')
      .select('api_keys')
      .eq('user_id', user.id)
      .single();

    if (data?.api_keys) {
      const keys = data.api_keys as Record<string, string>;
      setApiKey(keys.google_maps_api_key || '');
    }
  };

  const loadGoogleMapsScript = () => {
    if (window.google?.maps) {
      initializeMap();
      return;
    }

    window.initMap = initializeMap;
    
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMap`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  };

  const initializeMap = useCallback(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 24.7136, lng: 46.6753 }, // Riyadh as default
      zoom: 12,
      mapTypeId: mapType,
      styles: [
        { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
        { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
      ]
    });

    mapInstanceRef.current = map;
    setMapLoaded(true);

    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          map.setCenter(pos);
          new window.google.maps.Marker({
            position: pos,
            map,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#3b82f6',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2
            },
            title: 'Your Location'
          });
        },
        () => {
          console.log('Geolocation failed');
        }
      );
    }
  }, [mapType]);

  const searchPlaces = async () => {
    if (!searchQuery || !mapInstanceRef.current) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-maps', {
        body: {
          action: 'search',
          apiKey,
          query: searchQuery,
          location: mapInstanceRef.current.getCenter().toJSON()
        }
      });

      if (error) throw error;

      if (data.results) {
        setPlaces(data.results.map((p: any) => ({
          name: p.name,
          address: p.formatted_address || p.vicinity,
          lat: p.geometry.location.lat,
          lng: p.geometry.location.lng,
          placeId: p.place_id
        })));

        // Clear existing markers
        markersRef.current.forEach(m => m.setMap(null));
        markersRef.current = [];

        // Add new markers
        data.results.forEach((place: any) => {
          const marker = new window.google.maps.Marker({
            position: {
              lat: place.geometry.location.lat,
              lng: place.geometry.location.lng
            },
            map: mapInstanceRef.current,
            title: place.name
          });
          markersRef.current.push(marker);
        });

        // Fit bounds
        if (data.results.length > 0) {
          const bounds = new window.google.maps.LatLngBounds();
          data.results.forEach((p: any) => {
            bounds.extend({
              lat: p.geometry.location.lat,
              lng: p.geometry.location.lng
            });
          });
          mapInstanceRef.current.fitBounds(bounds);
        }
      }
    } catch (error: any) {
      toast({
        title: "Search Failed",
        description: error.message || "Could not search places",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const selectPlace = (place: Place) => {
    setSelectedPlace(place);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter({ lat: place.lat, lng: place.lng });
      mapInstanceRef.current.setZoom(16);
    }
  };

  const changeMapType = (type: string) => {
    setMapType(type);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setMapTypeId(type);
    }
  };

  const goToMyLocation = () => {
    if (navigator.geolocation && mapInstanceRef.current) {
      navigator.geolocation.getCurrentPosition((position) => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        mapInstanceRef.current.setCenter(pos);
        mapInstanceRef.current.setZoom(15);
      });
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="p-4 border-b border-border/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Map className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">Google Maps</h2>
              <p className="text-sm text-muted-foreground">Interactive maps and place search</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={mapType} onValueChange={changeMapType}>
              <SelectTrigger className="w-32">
                <Layers className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="roadmap">Roadmap</SelectItem>
                <SelectItem value="satellite">Satellite</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
                <SelectItem value="terrain">Terrain</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={goToMyLocation}>
              <Navigation className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {!apiKey ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="border-amber-500/30 bg-amber-500/5 max-w-md">
            <CardContent className="p-6 flex items-center gap-4">
              <AlertCircle className="h-8 w-8 text-amber-500 flex-shrink-0" />
              <div>
                <h3 className="font-semibold">API Key Required</h3>
                <p className="text-sm text-muted-foreground">
                  Please configure your Google Maps API Key in Settings → Integrations
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          <div className="w-80 border-r border-border/60 flex flex-col">
            <div className="p-4 border-b border-border/60">
              <div className="flex gap-2">
                <Input
                  placeholder="Search places..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchPlaces()}
                />
                <Button onClick={searchPlaces} disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-2 space-y-2">
              {places.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Search for places to see results
                  </p>
                </div>
              ) : (
                places.map((place, i) => (
                  <Card
                    key={i}
                    className={cn(
                      "cursor-pointer transition-colors",
                      selectedPlace?.placeId === place.placeId
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary/30"
                    )}
                    onClick={() => selectPlace(place)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{place.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {place.address}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          <div className="flex-1 relative">
            <div
              ref={mapRef}
              className="absolute inset-0"
              style={{ minHeight: '400px' }}
            />
            {!mapLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
