import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { useAuth } from './FirebaseProvider';
import { doc, updateDoc, increment, serverTimestamp, setDoc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface TacticalContextType {
  isTracking: boolean;
  currentPosition: google.maps.LatLngLiteral | null;
  speed: number;
  duration: number;
  activeBoost: string | null;
  startTracking: () => void;
  stopTracking: () => void;
  setActiveBoost: (boost: string | null) => void;
}

const TacticalContext = createContext<TacticalContextType | undefined>(undefined);

export const TacticalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const [isTracking, setIsTracking] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<google.maps.LatLngLiteral | null>(null);
  const [speed, setSpeed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeBoost, setActiveBoost] = useState<string | null>(null);
  const watchId = useRef<number | null>(null);
  const timerId = useRef<NodeJS.Timeout | null>(null);
  const runPath = useRef<google.maps.LatLngLiteral[]>([]);

  useEffect(() => {
    if (isTracking) {
      timerId.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerId.current) clearInterval(timerId.current);
      setDuration(0);
    }
    return () => {
      if (timerId.current) clearInterval(timerId.current);
    };
  }, [isTracking]);

  useEffect(() => {
    // Initial position fetch
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setCurrentPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      }, (err) => console.error("Initial positioning failed", err));
    }
  }, []);

  const startTracking = () => {
    if (!("geolocation" in navigator)) return;
    setIsTracking(true);
    runPath.current = [];
    
    watchId.current = navigator.geolocation.watchPosition((pos) => {
      const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setCurrentPosition(p);
      setSpeed(pos.coords.speed || 0);
      runPath.current.push(p);
    }, (err) => console.error(err), {
      enableHighAccuracy: true,
    });
  };

  const stopTracking = async () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setIsTracking(false);
    setSpeed(0);

    if (runPath.current.length > 2 && user && profile) {
      try {
        // Calculate total distance for this run (very simplistic for now)
        // In a real app we'd sum the distance between every pair of points
        // here we just use the length of the path as a proxy for engagement
        const distanceMeters = runPath.current.length * 10; // 10m per point roughly

        const activityRef = doc(collection(db, 'activities'));
        await setDoc(activityRef, {
          userId: user.uid,
          userName: profile.displayName,
          userPhotoURL: profile.photoURL || '',
          type: 'run',
          content: `Strategy deployed. Distance secured: ${distanceMeters}m. Mission integrity: 100%`,
          createdAt: serverTimestamp(),
          stats: {
            pathLength: runPath.current.length,
            duration: duration,
            distance: distanceMeters,
            timestamp: Date.now(),
          }
        });

        // Update Quest Progress
        const { questService } = await import('../services/questService');
        await questService.updateQuestProgress(user.uid, 'physical', distanceMeters);

      } catch (e) {
        console.error("Mission log failed", e);
      }
    }
  };

  return (
    <TacticalContext.Provider value={{ 
      isTracking, 
      currentPosition, 
      speed, 
      duration, 
      activeBoost,
      startTracking, 
      stopTracking,
      setActiveBoost
    }}>
      {children}
    </TacticalContext.Provider>
  );
};

export const useTactical = () => {
  const context = useContext(TacticalContext);
  if (context === undefined) {
    throw new Error('useTactical must be used within a TacticalProvider');
  }
  return context;
};
