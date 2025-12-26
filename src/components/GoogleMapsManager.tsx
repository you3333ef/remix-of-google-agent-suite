import { useState, useEffect, useRef, useCallback } from 'react';
import { Map, MapPin, Search, Navigation, Layers, AlertCircle, Loader2, MapPinned, ArrowRightLeft, Copy, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
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

interface GeocodingResult {
  lat: number;
  lng: number;
  formattedAddress: string;
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
  const geocodeMarkerRef = useRef<any>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [geocodeLoading, setGeocodeLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [mapType, setMapType] = useState('roadmap');
  const [activeTab, setActiveTab] = useState('search');
  
  // Geocoding states
  const [addressInput, setAddressInput] = useState('');
  const [geocodeResult, setGeocodeResult] = useState<GeocodingResult | null>(null);
  const [reverseLatitude, setReverseLatitude] = useState('');
  const [reverseLongitude, setReverseLongitude] = useState('');
  const [reverseResult, setReverseResult] = useState<string>('');
  const [copied, setCopied] = useState(false);
  
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
        setReverseLatitude(pos.lat.toFixed(6));
        setReverseLongitude(pos.lng.toFixed(6));
      });
    }
  };

  const handleGeocode = async () => {
    if (!addressInput) return;
    
    setGeocodeLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-maps', {
        body: {
          action: 'geocode',
          apiKey,
          address: addressInput
        }
      });

      if (error) throw error;

      if (data.location) {
        const result: GeocodingResult = {
          lat: data.location.lat,
          lng: data.location.lng,
          formattedAddress: data.formattedAddress,
          placeId: data.placeId
        };
        setGeocodeResult(result);
        
        // Show on map
        if (mapInstanceRef.current) {
          // Remove existing geocode marker
          if (geocodeMarkerRef.current) {
            geocodeMarkerRef.current.setMap(null);
          }
          
          mapInstanceRef.current.setCenter({ lat: result.lat, lng: result.lng });
          mapInstanceRef.current.setZoom(16);
          
          geocodeMarkerRef.current = new window.google.maps.Marker({
            position: { lat: result.lat, lng: result.lng },
            map: mapInstanceRef.current,
            title: result.formattedAddress,
            icon: {
              path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
              scale: 6,
              fillColor: '#22c55e',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2
            }
          });
        }

        toast({
          title: "Geocoding Success",
          description: `Found: ${result.formattedAddress}`
        });
      } else {
        toast({
          title: "Not Found",
          description: data.message || "Could not find location for this address",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Geocoding Failed",
        description: error.message || "Could not geocode address",
        variant: "destructive"
      });
    } finally {
      setGeocodeLoading(false);
    }
  };

  const reverseGeocode = async () => {
    if (!reverseLatitude || !reverseLongitude) return;
    
    const lat = parseFloat(reverseLatitude);
    const lng = parseFloat(reverseLongitude);
    
    if (isNaN(lat) || isNaN(lng)) {
      toast({
        title: "Invalid Coordinates",
        description: "Please enter valid latitude and longitude values",
        variant: "destructive"
      });
      return;
    }

    setGeocodeLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-maps', {
        body: {
          action: 'reverseGeocode',
          apiKey,
          lat,
          lng
        }
      });

      if (error) throw error;

      if (data.success && data.formattedAddress) {
        setReverseResult(data.formattedAddress);
        
        // Show on map
        if (mapInstanceRef.current) {
          if (geocodeMarkerRef.current) {
            geocodeMarkerRef.current.setMap(null);
          }
          
          mapInstanceRef.current.setCenter({ lat, lng });
          mapInstanceRef.current.setZoom(16);
          
          geocodeMarkerRef.current = new window.google.maps.Marker({
            position: { lat, lng },
            map: mapInstanceRef.current,
            title: data.formattedAddress,
            icon: {
              path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
              scale: 6,
              fillColor: '#3b82f6',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2
            }
          });
        }

        toast({
          title: "Reverse Geocoding Success",
          description: data.formattedAddress
        });
      } else {
        toast({
          title: "Not Found",
          description: data.message || "Could not find address for these coordinates",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Reverse Geocoding Failed",
        description: error.message || "Could not reverse geocode coordinates",
        variant: "destructive"
      });
    } finally {
      setGeocodeLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied", description: "Copied to clipboard" });
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
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="mx-2 mt-2 w-fit">
                <TabsTrigger value="search" className="text-xs">
                  <Search className="h-3 w-3 mr-1" />
                  Search
                </TabsTrigger>
                <TabsTrigger value="geocode" className="text-xs">
                  <MapPinned className="h-3 w-3 mr-1" />
                  Geocode
                </TabsTrigger>
                <TabsTrigger value="reverse" className="text-xs">
                  <ArrowRightLeft className="h-3 w-3 mr-1" />
                  Reverse
                </TabsTrigger>
              </TabsList>

              <TabsContent value="search" className="flex-1 flex flex-col mt-0 data-[state=inactive]:hidden">
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
              </TabsContent>

              <TabsContent value="geocode" className="flex-1 flex flex-col mt-0 p-4 space-y-4 data-[state=inactive]:hidden">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPinned className="h-4 w-4" />
                    Address to Coordinates
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Convert a street address to latitude/longitude coordinates
                  </p>
                </div>

                <div className="space-y-3">
                  <Input
                    placeholder="Enter address (e.g., 1600 Amphitheatre Parkway, Mountain View, CA)"
                    value={addressInput}
                    onChange={(e) => setAddressInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGeocode()}
                  />
                  <Button onClick={handleGeocode} disabled={geocodeLoading || !addressInput} className="w-full">
                    {geocodeLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <MapPinned className="h-4 w-4 mr-2" />
                    )}
                    Get Coordinates
                  </Button>
                </div>

                {geocodeResult && (
                  <Card className="border-green-500/30 bg-green-500/5">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-green-500">Result</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(`${geocodeResult.lat}, ${geocodeResult.lng}`)}
                        >
                          {copied ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Latitude:</span>
                          <span className="font-mono">{geocodeResult.lat.toFixed(6)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Longitude:</span>
                          <span className="font-mono">{geocodeResult.lng.toFixed(6)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground pt-2 border-t border-border/60">
                          {geocodeResult.formattedAddress}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="reverse" className="flex-1 flex flex-col mt-0 p-4 space-y-4 data-[state=inactive]:hidden">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <ArrowRightLeft className="h-4 w-4" />
                    Coordinates to Address
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Convert latitude/longitude coordinates to a street address
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Latitude</Label>
                    <Input
                      placeholder="e.g., 37.4224"
                      value={reverseLatitude}
                      onChange={(e) => setReverseLatitude(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Longitude</Label>
                    <Input
                      placeholder="e.g., -122.0842"
                      value={reverseLongitude}
                      onChange={(e) => setReverseLongitude(e.target.value)}
                    />
                  </div>
                </div>

                <Button onClick={reverseGeocode} disabled={geocodeLoading || !reverseLatitude || !reverseLongitude} className="w-full">
                  {geocodeLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                  )}
                  Get Address
                </Button>

                <Button variant="outline" size="sm" onClick={goToMyLocation} className="w-full">
                  <Navigation className="h-4 w-4 mr-2" />
                  Use My Location
                </Button>

                {reverseResult && (
                  <Card className="border-blue-500/30 bg-blue-500/5">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-sm font-medium text-blue-500">Address</span>
                          <p className="text-sm mt-1">{reverseResult}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(reverseResult)}
                        >
                          {copied ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
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
