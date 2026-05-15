import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Heart, MapPin, Activity } from 'lucide-react';

interface FeedItem {
  id: string;
  userId: string;
  userName: string;
  userPhotoURL: string;
  type: string;
  content: string;
  createdAt: any;
  stats?: any;
}

export const Feed: React.FC = () => {
  const [items, setItems] = useState<FeedItem[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'activities'), orderBy('createdAt', 'desc'), limit(20));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ts: FeedItem[] = [];
      snapshot.forEach((doc) => {
        ts.push({ id: doc.id, ...doc.data() } as FeedItem);
      });
      setItems(ts);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-6">
      <AnimatePresence mode="popLayout">
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-zinc-800/30 border border-white/5 rounded-2xl p-4 hover:border-lime-400/30 transition-colors group mb-3 last:mb-0"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-[10px] font-bold border border-white/10 text-zinc-400">
                {item.userName?.[0] || 'U'}
              </div>
              <div className="flex-1">
                <p className="font-bold text-white text-[11px] leading-tight uppercase tracking-tight">{item.userName}</p>
                <p className="text-zinc-500 text-[9px] uppercase font-bold tracking-widest leading-none mt-0.5">
                  {item.createdAt?.toDate ? formatDistanceToNow(item.createdAt.toDate(), { addSuffix: true }) : 'just now'}
                </p>
              </div>
              <div className="bg-lime-400/10 text-lime-400 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border border-lime-400/20">
                {item.type}
              </div>
            </div>

            <p className="text-zinc-400 text-xs mb-3 leading-relaxed font-medium">
              {item.content}
            </p>

            <div className="flex items-center gap-6">
              <button className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest py-2 btn-active-effect">
                <Heart className="w-4 h-4" />
                Boost
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {items.length === 0 && (
        <div className="py-20 text-center">
          <Activity className="w-12 h-12 mx-auto mb-4 text-zinc-700" />
          <p className="text-zinc-500 font-mono text-sm">Waiting for reconnaissance data...</p>
        </div>
      )}
    </div>
  );
};
