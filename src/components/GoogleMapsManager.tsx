import { useState, useEffect, useRef, useCallback } from 'react';
import { Map, MapPin, Search, Navigation, Layers, AlertCircle, Loader2, MapPinned, ArrowRightLeft, Copy, CheckCircle2, Route, Car, Footprints, Train, Clock, ChevronDown, ChevronUp, MessageSquare, Send, Bot, User, Sparkles, X, Menu, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useMapsAgent, MapsAgentMessage } from '@/hooks/useMapsAgent';
import { cn } from '@/lib/utils';

interface Place {
  name: string;
  address: string;
  lat: number;
  lng: number;
  placeId?: string;
  rating?: number;
  userRatingsTotal?: number;
}

interface GeocodingResult {
  lat: number;
  lng: number;
  formattedAddress: string;
  placeId?: string;
}

interface DirectionsResult {
  distance: string;
  duration: string;
  steps: Array<{ instruction: string; distance: string; duration: string }>;
  polyline?: string;
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
  const directionsRendererRef = useRef<any>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  
  const [apiKey, setApiKey] = useState<string>('');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [geocodeLoading, setGeocodeLoading] = useState(false);
  const [directionsLoading, setDirectionsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [mapType, setMapType] = useState('roadmap');
  const [activeTab, setActiveTab] = useState('agent');
  const [showSidebar, setShowSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  // Geocoding states
  const [addressInput, setAddressInput] = useState('');
  const [geocodeResult, setGeocodeResult] = useState<GeocodingResult | null>(null);
  const [reverseLatitude, setReverseLatitude] = useState('');
  const [reverseLongitude, setReverseLongitude] = useState('');
  const [reverseResult, setReverseResult] = useState<string>('');
  const [copied, setCopied] = useState(false);
  
  // Directions states
  const [originInput, setOriginInput] = useState('');
  const [destinationInput, setDestinationInput] = useState('');
  const [travelMode, setTravelMode] = useState<'driving' | 'walking' | 'transit'>('driving');
  const [directionsResult, setDirectionsResult] = useState<DirectionsResult | null>(null);
  const [showSteps, setShowSteps] = useState(false);
  
  // Agent chat states
  const [agentInput, setAgentInput] = useState('');
  const { messages, isProcessing, sendMessage, clearMessages, initializeAgent } = useMapsAgent();
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Responsive handling
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-fetch API key from backend on mount
  useEffect(() => {
    if (user) {
      fetchApiKeyFromBackend();
    }
  }, [user]);

  useEffect(() => {
    if (apiKey && !mapLoaded) {
      loadGoogleMapsScript();
      initializeAgent(apiKey);
    }
  }, [apiKey, initializeAgent]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchApiKeyFromBackend = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('google-maps', {
        body: { action: 'getApiKey' }
      });

      if (error) throw error;
      
      const key = data?.data?.apiKey || data?.apiKey;
      if (key) {
        setApiKey(key);
      } else {
        toast({ 
          title: "API Key Missing", 
          description: "Google Maps API key not configured", 
          variant: "destructive" 
        });
      }
    } catch (error: any) {
      console.error('Failed to fetch API key:', error);
      toast({ 
        title: "Error", 
        description: "Failed to load Maps configuration", 
        variant: "destructive" 
      });
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
      center: { lat: 24.7136, lng: 46.6753 },
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
    
    directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
      map,
      suppressMarkers: false,
      polylineOptions: {
        strokeColor: '#3b82f6',
        strokeWeight: 5,
        strokeOpacity: 0.8
      }
    });
    
    setMapLoaded(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
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
        () => console.log('Geolocation failed')
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

      const results = data?.data?.results || data?.results;
      if (results) {
        setPlaces(results.map((p: any) => ({
          name: p.name,
          address: p.formatted_address || p.vicinity,
          lat: p.geometry.location.lat,
          lng: p.geometry.location.lng,
          placeId: p.place_id,
          rating: p.rating,
          userRatingsTotal: p.user_ratings_total
        })));

        markersRef.current.forEach(m => m.setMap(null));
        markersRef.current = [];

        results.forEach((place: any) => {
          const marker = new window.google.maps.Marker({
            position: { lat: place.geometry.location.lat, lng: place.geometry.location.lng },
            map: mapInstanceRef.current,
            title: place.name
          });
          markersRef.current.push(marker);
        });

        if (results.length > 0) {
          const bounds = new window.google.maps.LatLngBounds();
          results.forEach((p: any) => bounds.extend({ lat: p.geometry.location.lat, lng: p.geometry.location.lng }));
          mapInstanceRef.current.fitBounds(bounds);
        }
      }
    } catch (error: any) {
      toast({ title: "Search Failed", description: error.message, variant: "destructive" });
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
        const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
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
        body: { action: 'geocode', apiKey, address: addressInput }
      });

      if (error) throw error;

      const resultData = data?.data || data;
      if (resultData?.location) {
        const result: GeocodingResult = {
          lat: resultData.location.lat,
          lng: resultData.location.lng,
          formattedAddress: resultData.formattedAddress,
          placeId: resultData.placeId
        };
        setGeocodeResult(result);
        
        if (mapInstanceRef.current) {
          if (geocodeMarkerRef.current) geocodeMarkerRef.current.setMap(null);
          mapInstanceRef.current.setCenter({ lat: result.lat, lng: result.lng });
          mapInstanceRef.current.setZoom(16);
          
          geocodeMarkerRef.current = new window.google.maps.Marker({
            position: { lat: result.lat, lng: result.lng },
            map: mapInstanceRef.current,
            title: result.formattedAddress,
            icon: { path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW, scale: 6, fillColor: '#22c55e', fillOpacity: 1, strokeColor: '#ffffff', strokeWeight: 2 }
          });
        }
        toast({ title: "Geocoding Success", description: `Found: ${result.formattedAddress}` });
      }
    } catch (error: any) {
      toast({ title: "Geocoding Failed", description: error.message, variant: "destructive" });
    } finally {
      setGeocodeLoading(false);
    }
  };

  const reverseGeocode = async () => {
    if (!reverseLatitude || !reverseLongitude) return;
    
    const lat = parseFloat(reverseLatitude);
    const lng = parseFloat(reverseLongitude);
    
    if (isNaN(lat) || isNaN(lng)) {
      toast({ title: "Invalid Coordinates", description: "Please enter valid values", variant: "destructive" });
      return;
    }

    setGeocodeLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-maps', {
        body: { action: 'reverseGeocode', apiKey, lat, lng }
      });

      if (error) throw error;

      const resultData = data?.data || data;
      if (resultData?.success && resultData?.formattedAddress) {
        setReverseResult(resultData.formattedAddress);
        
        if (mapInstanceRef.current) {
          if (geocodeMarkerRef.current) geocodeMarkerRef.current.setMap(null);
          mapInstanceRef.current.setCenter({ lat, lng });
          mapInstanceRef.current.setZoom(16);
          
          geocodeMarkerRef.current = new window.google.maps.Marker({
            position: { lat, lng },
            map: mapInstanceRef.current,
            title: resultData.formattedAddress,
            icon: { path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW, scale: 6, fillColor: '#3b82f6', fillOpacity: 1, strokeColor: '#ffffff', strokeWeight: 2 }
          });
        }
        toast({ title: "Success", description: resultData.formattedAddress });
      }
    } catch (error: any) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    } finally {
      setGeocodeLoading(false);
    }
  };

  const getDirections = async () => {
    if (!originInput || !destinationInput) return;

    setDirectionsLoading(true);
    setDirectionsResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('google-maps', {
        body: { action: 'directions', apiKey, params: { origin: originInput, destination: destinationInput, mode: travelMode } }
      });

      if (error) throw error;

      const resultData = data?.data || data;
      if (resultData?.routes?.[0]?.legs?.[0]) {
        const leg = resultData.routes[0].legs[0];
        
        const result: DirectionsResult = {
          distance: leg.distance.text,
          duration: leg.duration.text,
          steps: leg.steps.map((step: any) => ({
            instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
            distance: step.distance.text,
            duration: step.duration.text
          })),
          polyline: resultData.routes[0].overview_polyline?.points
        };
        
        setDirectionsResult(result);
        
        if (mapInstanceRef.current && directionsRendererRef.current) {
          const directionsService = new window.google.maps.DirectionsService();
          directionsService.route(
            { origin: originInput, destination: destinationInput, travelMode: travelMode.toUpperCase() },
            (response: any, status: any) => {
              if (status === 'OK') directionsRendererRef.current.setDirections(response);
            }
          );
        }
        toast({ title: "Route Found", description: `${result.distance} - ${result.duration}` });
      }
    } catch (error: any) {
      toast({ title: "Directions Failed", description: error.message, variant: "destructive" });
    } finally {
      setDirectionsLoading(false);
    }
  };

  const swapLocations = () => {
    const temp = originInput;
    setOriginInput(destinationInput);
    setDestinationInput(temp);
  };

  const useMyLocationAsOrigin = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setOriginInput(`${position.coords.latitude}, ${position.coords.longitude}`);
        toast({ title: "Location Set", description: "Using current location" });
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied", description: "Copied to clipboard" });
  };

  const handleAgentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentInput.trim() || isProcessing) return;
    
    const input = agentInput;
    setAgentInput('');
    await sendMessage(input);
  };

  const TravelModeIcon = ({ mode }: { mode: string }) => {
    switch (mode) {
      case 'driving': return <Car className="h-3.5 w-3.5" />;
      case 'walking': return <Footprints className="h-3.5 w-3.5" />;
      case 'transit': return <Train className="h-3.5 w-3.5" />;
      default: return <Car className="h-3.5 w-3.5" />;
    }
  };

  const AgentMessageBubble = ({ message }: { message: MapsAgentMessage }) => {
    const isUser = message.role === 'user';
    
    return (
      <div className={cn("flex gap-2 mb-3", isUser ? "flex-row-reverse" : "flex-row")}>
        <div className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
          isUser ? "bg-primary" : "bg-gradient-to-br from-emerald-500 to-cyan-500"
        )}>
          {isUser ? <User className="h-3.5 w-3.5 text-primary-foreground" /> : <Bot className="h-3.5 w-3.5 text-white" />}
        </div>
        <div className={cn(
          "max-w-[85%] rounded-lg px-3 py-2 text-xs",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        )}>
          {message.isStreaming && message.steps && message.steps.length > 0 && (
            <div className="mb-2 space-y-1">
              {message.steps.filter(s => s.type !== 'answer').map((step, i) => (
                <div key={i} className="flex items-center gap-1.5 text-muted-foreground">
                  {step.type === 'think' && <Sparkles className="h-3 w-3 text-yellow-500" />}
                  {step.type === 'act' && <Loader2 className="h-3 w-3 animate-spin text-blue-500" />}
                  {step.type === 'observe' && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                  <span className="text-[10px]">{step.type}: {step.content.substring(0, 50)}...</span>
                </div>
              ))}
            </div>
          )}
          <div className="whitespace-pre-wrap">{message.content || (message.isStreaming ? '...' : '')}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-2 md:p-3 border-b border-border/60">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 md:hidden"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              {showSidebar ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Map className="h-4 w-4 text-primary" />
            </div>
            <div className="hidden sm:block">
              <h2 className="font-semibold text-sm">Google Maps Agent</h2>
              <p className="text-[10px] text-muted-foreground">AI-powered maps assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Select value={mapType} onValueChange={changeMapType}>
              <SelectTrigger className="w-20 md:w-28 h-7 text-[10px] md:text-xs">
                <Layers className="h-3 w-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="roadmap">Road</SelectItem>
                <SelectItem value="satellite">Satellite</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
                <SelectItem value="terrain">Terrain</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={goToMyLocation}>
              <Navigation className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {!apiKey ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="border-amber-500/30 bg-amber-500/5 max-w-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-amber-500 shrink-0" />
              <div>
                <h3 className="font-semibold text-sm">API Key Required</h3>
                <p className="text-xs text-muted-foreground">Configure Google Maps API Key in Settings</p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Sidebar */}
          <div className={cn(
            "border-b md:border-b-0 md:border-r border-border/60 flex flex-col transition-all duration-300 bg-background z-10",
            showSidebar 
              ? "h-[50vh] md:h-auto md:w-72 lg:w-80" 
              : "h-0 md:h-auto md:w-72 lg:w-80 overflow-hidden md:overflow-visible",
            isMobile && showSidebar && "absolute inset-x-0 top-[52px] bottom-0 h-auto"
          )}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
              <TabsList className="mx-2 mt-2 grid grid-cols-5 h-8">
                <TabsTrigger value="agent" className="text-[10px] px-1">
                  <Bot className="h-3 w-3" />
                </TabsTrigger>
                <TabsTrigger value="search" className="text-[10px] px-1">
                  <Search className="h-3 w-3" />
                </TabsTrigger>
                <TabsTrigger value="directions" className="text-[10px] px-1">
                  <Route className="h-3 w-3" />
                </TabsTrigger>
                <TabsTrigger value="geocode" className="text-[10px] px-1">
                  <MapPinned className="h-3 w-3" />
                </TabsTrigger>
                <TabsTrigger value="reverse" className="text-[10px] px-1">
                  <ArrowRightLeft className="h-3 w-3" />
                </TabsTrigger>
              </TabsList>

              {/* Agent Tab */}
              <TabsContent value="agent" className="flex-1 flex flex-col mt-0 data-[state=inactive]:hidden min-h-0">
                <div className="p-2 border-b border-border/60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-medium">Maps Agent</span>
                    </div>
                    {messages.length > 0 && (
                      <Button variant="ghost" size="sm" onClick={clearMessages} className="h-6 px-2 text-[10px]">
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
                
                <ScrollArea className="flex-1 p-2" ref={chatScrollRef}>
                  {messages.length === 0 ? (
                    <div className="text-center py-6 space-y-3">
                      <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center">
                        <Bot className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-medium">Maps Agent Ready</p>
                        <p className="text-[10px] text-muted-foreground mt-1">Ask me to find places, get directions, or geocode addresses</p>
                      </div>
                      <div className="space-y-1.5">
                        {["Find coffee shops near me", "Directions to Times Square", "Coordinates of Eiffel Tower"].map((q, i) => (
                          <Button
                            key={i}
                            variant="outline"
                            size="sm"
                            className="w-full h-7 text-[10px] justify-start"
                            onClick={() => setAgentInput(q)}
                          >
                            {q}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    messages.map((msg) => <AgentMessageBubble key={msg.id} message={msg} />)
                  )}
                </ScrollArea>
                
                <form onSubmit={handleAgentSubmit} className="p-2 border-t border-border/60">
                  <div className="flex gap-1.5">
                    <Input
                      value={agentInput}
                      onChange={(e) => setAgentInput(e.target.value)}
                      placeholder="Ask the Maps Agent..."
                      className="h-8 text-xs"
                      disabled={isProcessing}
                    />
                    <Button type="submit" size="icon" className="h-8 w-8 shrink-0" disabled={isProcessing || !agentInput.trim()}>
                      {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </form>
              </TabsContent>

              {/* Search Tab */}
              <TabsContent value="search" className="flex-1 flex flex-col mt-0 data-[state=inactive]:hidden min-h-0">
                <div className="p-2 border-b border-border/60">
                  <div className="flex gap-1.5">
                    <Input
                      placeholder="Search places..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && searchPlaces()}
                      className="h-8 text-xs"
                    />
                    <Button onClick={searchPlaces} disabled={loading} size="icon" className="h-8 w-8 shrink-0">
                      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>

                <ScrollArea className="flex-1 p-2">
                  {places.length === 0 ? (
                    <div className="text-center py-6">
                      <MapPin className="h-6 w-6 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-[10px] text-muted-foreground">Search for places</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {places.map((place, i) => (
                        <Card
                          key={i}
                          className={cn(
                            "cursor-pointer transition-colors",
                            selectedPlace?.placeId === place.placeId ? "border-primary bg-primary/5" : "hover:border-primary/30"
                          )}
                          onClick={() => selectPlace(place)}
                        >
                          <CardContent className="p-2">
                            <div className="flex items-start gap-2">
                              <MapPin className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-[10px] truncate">{place.name}</p>
                                <p className="text-[10px] text-muted-foreground truncate">{place.address}</p>
                                {place.rating && (
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <span className="text-[10px] text-yellow-500">★ {place.rating}</span>
                                    {place.userRatingsTotal && (
                                      <span className="text-[10px] text-muted-foreground">({place.userRatingsTotal})</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              {/* Directions Tab */}
              <TabsContent value="directions" className="flex-1 flex flex-col mt-0 p-2 space-y-2 data-[state=inactive]:hidden overflow-auto">
                <div className="space-y-1.5">
                  <div className="relative">
                    <Input
                      placeholder="Origin"
                      value={originInput}
                      onChange={(e) => setOriginInput(e.target.value)}
                      className="h-8 text-xs pr-8"
                    />
                    <Button variant="ghost" size="icon" className="absolute right-0 top-0 h-8 w-8" onClick={useMyLocationAsOrigin}>
                      <Navigation className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="flex justify-center">
                    <Button variant="ghost" size="sm" onClick={swapLocations} className="h-5 px-2">
                      <ArrowRightLeft className="h-3 w-3 rotate-90" />
                    </Button>
                  </div>
                  
                  <Input
                    placeholder="Destination"
                    value={destinationInput}
                    onChange={(e) => setDestinationInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && getDirections()}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="flex gap-1">
                  {(['driving', 'walking', 'transit'] as const).map((mode) => (
                    <Button
                      key={mode}
                      variant={travelMode === mode ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTravelMode(mode)}
                      className="flex-1 h-7 text-[10px]"
                    >
                      <TravelModeIcon mode={mode} />
                    </Button>
                  ))}
                </div>

                <Button onClick={getDirections} disabled={directionsLoading || !originInput || !destinationInput} className="w-full h-8 text-xs">
                  {directionsLoading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Route className="h-3.5 w-3.5 mr-1.5" />}
                  Get Directions
                </Button>

                {directionsResult && (
                  <Card className="border-primary/30 bg-primary/5">
                    <CardContent className="p-2 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <p className="text-sm font-bold text-primary">{directionsResult.distance}</p>
                          <p className="text-[10px] text-muted-foreground">Distance</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {directionsResult.duration}
                          </p>
                          <p className="text-[10px] text-muted-foreground">Duration</p>
                        </div>
                      </div>

                      <Button variant="ghost" size="sm" onClick={() => setShowSteps(!showSteps)} className="w-full h-6 text-[10px]">
                        {showSteps ? 'Hide' : 'Show'} {directionsResult.steps.length} Steps
                        {showSteps ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
                      </Button>

                      {showSteps && (
                        <ScrollArea className="max-h-24">
                          <div className="space-y-1.5">
                            {directionsResult.steps.map((step, i) => (
                              <div key={i} className="flex gap-1.5 text-[10px]">
                                <span className="text-muted-foreground shrink-0">{i + 1}.</span>
                                <div>
                                  <p>{step.instruction}</p>
                                  <p className="text-muted-foreground">{step.distance}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Geocode Tab */}
              <TabsContent value="geocode" className="flex-1 flex flex-col mt-0 p-2 space-y-2 data-[state=inactive]:hidden overflow-auto">
                <div className="space-y-1">
                  <Label className="flex items-center gap-1.5 text-xs">
                    <MapPinned className="h-3 w-3" />
                    Address → Coordinates
                  </Label>
                </div>

                <div className="space-y-1.5">
                  <Input
                    placeholder="Enter address..."
                    value={addressInput}
                    onChange={(e) => setAddressInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGeocode()}
                    className="h-8 text-xs"
                  />
                  <Button onClick={handleGeocode} disabled={geocodeLoading || !addressInput} className="w-full h-8 text-xs">
                    {geocodeLoading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <MapPinned className="h-3.5 w-3.5 mr-1.5" />}
                    Geocode
                  </Button>
                </div>

                {geocodeResult && (
                  <Card className="border-green-500/30 bg-green-500/5">
                    <CardContent className="p-2 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-medium text-green-500">Result</span>
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => copyToClipboard(`${geocodeResult.lat}, ${geocodeResult.lng}`)}>
                          {copied ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                      <div className="space-y-0.5 text-[10px]">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Lat:</span>
                          <span className="font-mono">{geocodeResult.lat.toFixed(6)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Lng:</span>
                          <span className="font-mono">{geocodeResult.lng.toFixed(6)}</span>
                        </div>
                        <p className="text-muted-foreground pt-1 border-t border-border/60 truncate">{geocodeResult.formattedAddress}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Reverse Geocode Tab */}
              <TabsContent value="reverse" className="flex-1 flex flex-col mt-0 p-2 space-y-2 data-[state=inactive]:hidden overflow-auto">
                <div className="space-y-1">
                  <Label className="flex items-center gap-1.5 text-xs">
                    <ArrowRightLeft className="h-3 w-3" />
                    Coordinates → Address
                  </Label>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <div className="space-y-0.5">
                    <Label className="text-[10px]">Lat</Label>
                    <Input placeholder="37.4224" value={reverseLatitude} onChange={(e) => setReverseLatitude(e.target.value)} className="h-8 text-xs" />
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-[10px]">Lng</Label>
                    <Input placeholder="-122.084" value={reverseLongitude} onChange={(e) => setReverseLongitude(e.target.value)} className="h-8 text-xs" />
                  </div>
                </div>

                <Button onClick={reverseGeocode} disabled={geocodeLoading || !reverseLatitude || !reverseLongitude} className="w-full h-8 text-xs">
                  {geocodeLoading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <ArrowRightLeft className="h-3.5 w-3.5 mr-1.5" />}
                  Reverse Geocode
                </Button>

                {reverseResult && (
                  <Card className="border-blue-500/30 bg-blue-500/5">
                    <CardContent className="p-2">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="h-3 w-3 text-blue-500 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] font-medium text-blue-500">Address</p>
                          <p className="text-[10px] text-muted-foreground">{reverseResult}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={() => copyToClipboard(reverseResult)}>
                          {copied ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Map Container */}
          <div className="flex-1 relative min-h-[200px]">
            <div ref={mapRef} className="absolute inset-0" />
            {!mapLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
