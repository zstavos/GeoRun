import React, { useEffect, useState, useRef, useCallback } from 'react';
import { APIProvider, Map, AdvancedMarker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { collection, query, onSnapshot, setDoc, doc, serverTimestamp, where, limit, increment, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { getTileId } from '../../lib/territory';
import { simplifyPath, calculateDistance, calculatePolygonArea } from '../../lib/geoUtils';
import { useAuth } from '../FirebaseProvider';
import { useNotification } from '../NotificationContext';
import { 
  Crosshair, 
  Shield,
  Zap,
  ChevronRight,
  User,
  Clock,
  ArrowUpCircle,
  X,
  TrendingUp,
  Cpu,
  MapPin,
  Coins,
  Trophy,
  Zap as Energy,
  Maximize2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { soundManager, SOUNDS } from '../../lib/sounds';
import { handleFirestoreError, OperationType } from '../../lib/firestoreUtils';
import { MapAvatar } from './MapAvatar';

// Renders a captured polygon area
interface CapturedPolygonProps {
  polygon: any;
  user: any;
  onSelect?: (polygon: any) => void;
}

const CapturedPolygonDisplay: React.FC<CapturedPolygonProps> = ({ polygon, user, onSelect }) => {
  const map = useMap();
  const mapsLib = useMapsLibrary('maps');
  const polygonRef = useRef<google.maps.Polygon | null>(null);

  useEffect(() => {
    if (!map || !mapsLib) return;

    const isMe = polygon.ownerId === user?.uid;
    const color = isMe ? '#22c55e' : (polygon.color || '#f43f5e');

    const poly = new mapsLib.Polygon({
      map,
      paths: polygon.points,
      strokeColor: color,
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: color,
      fillOpacity: 0.35,
      zIndex: isMe ? 10 : 5,
      clickable: true,
    });

    if (onSelect) {
      poly.addListener('click', () => {
        onSelect(polygon);
      });
    }

    polygonRef.current = poly;

    return () => {
      if (polygonRef.current) {
        polygonRef.current.setMap(null);
      }
    };
  }, [map, mapsLib, polygon.points, polygon.ownerId, polygon.color, user?.uid, onSelect]);

  return null;
};

const API_KEY = 
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY || 
  (process as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (process as any).env?.GOOGLE_MAPS_PLATFORM_KEY ||
  '';

// Smooth path overlay
interface TerritoryPathProps {
  points: { lat: number; lng: number }[];
  color: string;
}

const TerritoryPath: React.FC<TerritoryPathProps> = ({ points, color }) => {
  const map = useMap();
  const mapsLib = useMapsLibrary('maps');
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map || !mapsLib || points.length < 2) return;

    // Simplify the path for performance
    const simplified = simplifyPath(points, 0.0001);

    const poly = new mapsLib.Polyline({
      map,
      path: simplified,
      strokeColor: color,
      strokeOpacity: 0.4,
      strokeWeight: 50, // Thick highlight
      visible: true,
      clickable: false,
    });

    // Set line cap and join to round for smooth marker stroke look
    poly.setOptions({
      lineCap: 'round',
      lineJoin: 'round'
    } as any);

    polylineRef.current = poly;

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
    };
  }, [map, mapsLib, points, color]);

  return null;
};

interface MapContentProps {
  currentPosition: google.maps.LatLngLiteral | null;
  user: any;
  territories: any[]; // Legacy
  polygons: any[];
  activePath: { lat: number; lng: number }[];
  onRecenter: (map: google.maps.Map) => void;
  onSelectPolygon: (polygon: any) => void;
}

const MapContent: React.FC<MapContentProps> = ({ currentPosition, user, territories, polygons, activePath, onRecenter, onSelectPolygon }) => {
  const map = useMap();
  const [smoothPosition, setSmoothPosition] = useState<google.maps.LatLngLiteral | null>(currentPosition);
  const animationRef = useRef<number | null>(null);

  // Smoothing logic
  useEffect(() => {
    if (!currentPosition) return;
    if (!smoothPosition) {
      setSmoothPosition(currentPosition);
      return;
    }

    const startLat = smoothPosition.lat;
    const startLng = smoothPosition.lng;
    const endLat = currentPosition.lat;
    const endLng = currentPosition.lng;

    const duration = 1000; // 1 second for move
    let startTime: number | null = null;

    const animate = (time: number) => {
      if (!startTime) startTime = time;
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out quad
      const t = progress;
      const ease = t * (2 - t);

      const lat = startLat + (endLat - startLat) * ease;
      const lng = startLng + (endLng - startLng) * ease;

      setSmoothPosition({ lat, lng });

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [currentPosition]);

  // Center map once when position is first acquired
  const hasCenteredInitially = useRef(false);
  useEffect(() => {
    if (currentPosition && map && !hasCenteredInitially.current) {
      map.panTo(currentPosition);
      hasCenteredInitially.current = true;
    }
  }, [currentPosition, map]);

  const { profile } = useAuth();

  return (
    <Map
      defaultCenter={{ lat: 41.2995, lng: 69.2401 }}
      defaultZoom={15}
      mapId="DEMO_MAP_ID"
      className="w-full h-full"
      disableDefaultUI
      gestureHandling="greedy"
      internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
    >
      {smoothPosition && (
        <AdvancedMarker position={smoothPosition}>
          <div className="relative">
            <MapAvatar 
              level={profile?.level || 1} 
              xp={profile?.xp || 0} 
              equippedItems={profile?.equippedItems || []} 
              username={profile?.username || profile?.displayName || 'Explorer'}
            />
          </div>
        </AdvancedMarker>
      )}

      {/* Render active session path highlight */}
      {activePath.length >= 2 && (
        <TerritoryPath 
          points={activePath} 
          color="#22c55e" 
        />
      )}

      {/* Render all captured polygons */}
      {polygons.map(p => (
        <CapturedPolygonDisplay 
          key={p.id} 
          polygon={p} 
          user={user} 
          onSelect={onSelectPolygon}
        />
      ))}

      {/* Render legacy territories (disabled/simplified) */}
      {/* territories.map(t => <TerritoryTile key={t.id} territory={t} user={user} onSelect={onSelectTerritory} />) */}
    </Map>
  );
};

export const GeoMap: React.FC = () => {
  const { user, profile } = useAuth();
  const { notify } = useNotification();
  const [currentPosition, setCurrentPosition] = useState<google.maps.LatLngLiteral | null>(null);
  const [territories, setTerritories] = useState<any[]>([]);
  const [polygons, setPolygons] = useState<any[]>([]);
  const [activePath, setActivePath] = useState<{ lat: number; lng: number }[]>([]);
  const lastPathPoint = useRef<{ lat: number; lng: number } | null>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

  // Initial location tracking
  useEffect(() => {
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const newPos = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          };
          setCurrentPosition(newPos);
        },
        (err) => console.error(err),
        { enableHighAccuracy: true, maximumAge: 1000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  const handleRecenter = useCallback(() => {
    if (currentPosition && mapInstance) {
      mapInstance.panTo(currentPosition);
      mapInstance.setZoom(15);
    }
  }, [currentPosition, mapInstance]);

  const [selectedPolygonId, setSelectedPolygonId] = useState<string | null>(null);
  const selectedPolygon = polygons.find(p => p.id === selectedPolygonId);

  // Sync polygons from Firestore
  useEffect(() => {
    const q = query(collection(db, 'polygons'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const polygonsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPolygons(polygonsData);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'polygons', auth);
    });
    return () => unsubscribe();
  }, []);

  // Sync territories (Legacy)
  useEffect(() => {
    const q = query(collection(db, 'territories'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const territoriesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTerritories(territoriesData);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'territories', auth);
    });
    return () => unsubscribe();
  }, []);

  // Update active path and detect loop
  useEffect(() => {
    if (!currentPosition || !user) return;

    // Only add point if it's significantly different from last point
    if (lastPathPoint.current) {
      const dist = calculateDistance(lastPathPoint.current, currentPosition);
      if (dist < 3) return; // 3 meters threshold for path points
    }

    setActivePath(prev => {
      const newPath = [...prev, currentPosition];

      // Loop Detection Logic
      // Threshold: 10 meters, ignore last 15 points to prevent self-looping on immediate trail
      if (newPath.length > 20) {
        for (let i = 0; i < newPath.length - 15; i++) {
          const point = newPath[i];
          const dist = calculateDistance(point, currentPosition);

          if (dist < 10) {
            const loopPoints = newPath.slice(i);
            handleCloseLoop(loopPoints);
            return []; // Reset path after successful loop capture
          }
        }
      }

      lastPathPoint.current = currentPosition;
      return newPath;
    });
  }, [currentPosition, user]);

  const handleCloseLoop = async (points: { lat: number; lng: number }[]) => {
    if (!user || !profile) return;

    const area = calculatePolygonArea(points);
    if (area < 30) return; // Minimum capture area

    const polygonId = `poly_${Date.now()}_${user.uid.slice(0, 4)}`;
    
    // Proportional rewards: XP and Credits
    const xpReward = Math.max(10, Math.floor(area * 0.2));
    const coinReward = Math.max(5, Math.floor(area * 0.1));

    try {
      await setDoc(doc(db, 'polygons', polygonId), {
        ownerId: user.uid,
        ownerName: profile.username || profile.displayName || 'Operative',
        points: points,
        area: area,
        capturedAt: serverTimestamp(),
        color: profile.teamColor || '#22c55e'
      });

      await updateDoc(doc(db, 'users', user.uid), {
        xp: increment(xpReward),
        coins: increment(coinReward),
        ownedTerritoryCount: increment(1),
        updatedAt: serverTimestamp()
      });

      notify('success', undefined, `Area Secured! ${Math.round(area)}m² mapped. +${xpReward} XP`);
      soundManager.play(SOUNDS.CLAIM);
      
      const { questService } = await import('../../services/questService');
      await questService.updateQuestProgress(user.uid, 'conquest', 1);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `polygons/${polygonId}`, auth);
    }
  };

  // Simple territory upgrade logic
  const handleUpgrade = async (territory: any) => {
    if (!user || !profile || profile.coins < 50) {
      notify('error', undefined, 'Need more coins (50 required)');
      return;
    }

    try {
      const territoryRef = doc(db, 'territories', territory.id);
      await updateDoc(territoryRef, {
        level: increment(1),
        defense: increment(100),
        resources: increment(50),
        updatedAt: serverTimestamp()
      });

      // Deduct coins from user
      await updateDoc(doc(db, 'users', user.uid), {
        coins: increment(-50),
        updatedAt: serverTimestamp()
      });

      soundManager.play(SOUNDS.UPGRADE);
      notify('success', undefined, `Upgraded to Level ${ (territory.level || 1) + 1 }`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `territories/${territory.id}`, auth);
    }
  };

  if (!API_KEY) {
    return (
      <div className="h-full w-full bg-slate-900 flex items-center justify-center">
        {/* Empty state or subtle loading indicator instead of textual error */}
        <div className="w-12 h-12 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-slate-900">
      <APIProvider apiKey={API_KEY} version="weekly">
        <MapProviderWrapper onMapMount={setMapInstance}>
          <MapContent 
            currentPosition={currentPosition}
            user={user}
            territories={territories}
            polygons={polygons}
            activePath={activePath}
            onRecenter={handleRecenter}
            onSelectPolygon={(p) => setSelectedPolygonId(p.id)}
          />
        </MapProviderWrapper>
      </APIProvider>

      {/* Confirmation for New Territory Claim - REMOVED for Loop based system */}

      {/* Selected Polygon Details */}
      <AnimatePresence>
        {selectedPolygonId && selectedPolygon && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 z-50 p-4"
          >
            <div className="max-w-md mx-auto bento-card p-6 shadow-2xl relative">
              <button 
                onClick={() => setSelectedPolygonId(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <X size={16} />
              </button>

              <div className="flex items-start gap-4 mb-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                  selectedPolygon.ownerId === user?.uid ? 'bg-green-500 shadow-green-500/20' : 'bg-rose-500 shadow-rose-500/20'
                }`}>
                  <Maximize2 size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-black italic uppercase tracking-tight text-slate-900 leading-none mb-1">
                    Captured Sector
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                      <User size={10} />
                      {selectedPolygon.ownerName}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <div className="text-[10px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1">
                    <TrendingUp size={10} /> Area
                  </div>
                  <div className="text-xl font-black text-slate-900 leading-none">
                    {Math.round(selectedPolygon.area)}<span className="text-[10px] text-slate-400 ml-1">m²</span>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <div className="text-[10px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1">
                    <Cpu size={10} /> Efficiency
                  </div>
                  <div className="text-xl font-black text-slate-900 leading-none">
                    {Math.round(selectedPolygon.area * 0.1)}%
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between px-2 mb-6">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                  <Clock size={12} />
                  Captured {selectedPolygon.capturedAt?.seconds ? formatDistanceToNow(selectedPolygon.capturedAt.toDate()) : 'Recently'} ago
                </div>
                <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest bg-rose-50 px-2 py-0.5 rounded-sm italic">
                  {selectedPolygon.ownerId === user?.uid ? 'Verified' : 'Unstable'}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Basic Controls */}
      <div className="absolute bottom-32 right-6 space-y-4">
        <button 
          onClick={handleRecenter}
          className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-2xl text-slate-900 active:scale-95 transition-transform"
        >
          <Crosshair size={24} />
        </button>
      </div>
    </div>
  );
};

// Helper to capture map instance
const MapProviderWrapper: React.FC<{ children: React.ReactNode, onMapMount: (map: google.maps.Map) => void }> = ({ children, onMapMount }) => {
  const map = useMap();
  useEffect(() => {
    if (map) onMapMount(map);
  }, [map, onMapMount]);
  return <>{children}</>;
};
