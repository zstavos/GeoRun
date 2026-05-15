import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Coins, Star, Info } from 'lucide-react';

import { soundManager, SOUNDS } from '../lib/sounds';

interface Notification {
  id: string;
  type: 'xp' | 'credits' | 'info';
  message: string;
  amount?: number;
}

interface NotificationContextType {
  notify: (type: 'xp' | 'credits' | 'info', amount?: number, message?: string) => void;
}

const NotificationContext = createContext<NotificationContextType>({ notify: () => {} });

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notify = useCallback((type: 'xp' | 'credits' | 'info', amount?: number, message?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newNotification: Notification = {
      id,
      type,
      message: message || '',
      amount
    };

    setNotifications(prev => [...prev, newNotification]);
    soundManager.play(SOUNDS.NOTIFICATION);

    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  }, []);

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[1000] flex flex-col items-center gap-3 pointer-events-none">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, scale: 0.8, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              className="bg-white border border-slate-100 rounded-3xl shadow-xl shadow-rose-500/10 px-6 py-3 flex items-center gap-3"
            >
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                n.type === 'xp' ? 'bg-purple-100 text-purple-600' :
                n.type === 'credits' ? 'bg-amber-100 text-amber-600' :
                'bg-blue-100 text-blue-600'
              }`}>
                {n.type === 'xp' ? <Star size={20} /> :
                 n.type === 'credits' ? <Coins size={20} /> :
                 <Info size={20} />}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black text-slate-900 leading-tight">
                  {n.type === 'xp' ? `+${n.amount} XP` :
                   n.type === 'credits' ? `+${n.amount} Credits` :
                   n.message}
                </span>
                {n.message && n.type !== 'info' && (
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{n.message}</span>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};
