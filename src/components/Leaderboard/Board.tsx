import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Medal, Star } from 'lucide-react';

import { getTacticalColor } from '../../lib/colors';
import { useAuth } from '../FirebaseProvider';
import { handleFirestoreError, OperationType } from '../../lib/firestoreUtils';

interface Entry {
  id: string;
  userId: string;
  displayName: string;
  score: number;
  photoURL?: string;
  pace?: string;
}

export const Board: React.FC<{ period: 'weekly' | 'all' | 'daily' }> = ({ period }) => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('ownedTerritoryCount', 'desc'), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ts: Entry[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        ts.push({ 
          id: doc.id, 
          userId: doc.id, 
          displayName: data.displayName, 
          score: data.ownedTerritoryCount || 0,
          photoURL: data.photoURL,
          pace: '4:34/mi' // Mock pace as in design
        } as Entry);
      });
      setEntries(ts);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'users', auth);
    });
    return () => unsubscribe();
  }, [period]);

  const top1 = entries[0];
  const list = entries.slice(1);

  return (
    <div className="space-y-8 pb-12">
      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-1">
        {['All-Time', 'Men', 'Women', 'This year'].map((label) => (
          <button 
            key={label}
            className={`px-5 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              label === 'All-Time' ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/30' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Top 1 Hero Card */}
      {top1 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative h-48 rounded-[2.5rem] bg-gradient-to-br from-rose-100 via-white to-sky-100 border border-slate-100 shadow-xl shadow-rose-500/5 flex flex-col items-center justify-center overflow-hidden p-6"
        >
          {/* Abstract blobs like design */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-400/10 blur-2xl rounded-full" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-sky-400/10 blur-2xl rounded-full" />

          <div className="relative z-10 flex flex-col items-center gap-3">
             <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-white shadow-xl overflow-hidden">
                  <img src={top1.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=winner'} alt="Rank 1" className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-rose-600 rounded-full border-4 border-white flex items-center justify-center text-white">
                  <Trophy size={14} />
                </div>
             </div>
             <div className="text-center">
                <h4 className="text-lg font-black text-slate-900 tracking-tight">{top1.displayName}</h4>
                <div className="inline-flex items-center gap-2 mt-1 px-3 py-1 bg-white/50 backdrop-blur rounded-full text-[10px] font-black text-rose-600 uppercase tracking-widest border border-white">
                  Rank #1 • {top1.score} Tiles
                </div>
             </div>
          </div>
        </motion.div>
      )}

      {/* Leaderboard List */}
      <div className="space-y-4">
        <div className="flex justify-between px-4 text-[9px] font-black uppercase tracking-widest text-slate-400">
           <span>Rank / Athlete</span>
           <span>Time / Pace</span>
        </div>
        
        <div className="space-y-2">
          {list.map((entry, index) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              key={entry.userId}
              className={`flex items-center gap-4 p-4 rounded-3xl border border-slate-100 transition-all ${
                entry.userId === user?.uid ? 'bg-rose-50 border-rose-200' : 'bg-white'
              }`}
            >
              <div className="w-6 flex items-center justify-center font-black text-xs text-slate-300">
                {index + 2}
              </div>
              
              <div className="w-10 h-10 rounded-2xl overflow-hidden border border-slate-100">
                <img src={entry.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.userId}`} alt="User" className="w-full h-full object-cover" />
              </div>

              <div className="flex-1">
                <p className="text-xs font-black text-slate-900 tracking-tight leading-none mb-1">{entry.displayName}</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Oct 19, 2023</p>
              </div>

              <div className="text-right">
                <p className="text-xs font-black text-slate-900 tracking-tighter leading-none mb-1">{entry.score}</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{entry.pace}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
