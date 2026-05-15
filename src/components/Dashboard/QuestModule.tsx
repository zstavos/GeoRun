import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Hexagon, 
  CircleCheck, 
  Coins, 
  Star,
  ChevronRight,
  Zap
} from 'lucide-react';
import { useAuth } from '../FirebaseProvider';
import { questService, Quest } from '../../services/questService';

import { useNotification } from '../NotificationContext';

import { soundManager, SOUNDS } from '../../lib/sounds';

export const DailyQuestModule: React.FC = () => {
  const { user } = useAuth();
  const { notify } = useNotification();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQuests = async () => {
    if (!user) return;
    try {
      const q = await questService.getDailyQuests(user.uid);
      setQuests(q);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuests();
  }, [user]);

  const handleClaim = async (questId: string) => {
    if (!user) return;
    const quest = quests.find(q => q.id === questId);
    if (!quest) return;

    try {
      await questService.claimReward(user.uid, questId);
      soundManager.play(SOUNDS.QUEST_COMPLETE);
      
      // Success Feedback
      notify('credits', quest.rewardCoins, 'Reward Claimed');
      notify('xp', quest.rewardXP, 'Training Complete');

      // Refresh quests or update locally
      setQuests(prev => prev.map(q => q.id === questId ? { ...q, status: 'claimed' } : q));
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Active Objectives</h3>
        <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full uppercase tracking-widest">Daily Reset</span>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {quests.map((quest) => (
            <motion.div 
              key={quest.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-5 rounded-[2rem] border transition-all ${
                quest.status === 'claimed' 
                ? 'bg-slate-50 border-slate-100 opacity-60' 
                : 'bg-white border-slate-100 shadow-sm'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                  quest.type === 'physical' ? 'bg-orange-50 text-orange-600' : 'bg-rose-50 text-rose-600'
                }`}>
                  {quest.type === 'physical' ? <Zap size={22} /> : <Hexagon size={22} />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-black text-slate-900 truncate pr-2">{quest.description}</p>
                    {quest.status === 'claimed' && <CircleCheck size={16} className="text-emerald-500" />}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                      <span>Progress</span>
                      <span>{Math.min(quest.currentValue, quest.targetValue)} / {quest.targetValue}</span>
                    </div>
                    
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((quest.currentValue / quest.targetValue) * 100, 100)}%` }}
                        className={`h-full rounded-full ${
                          quest.status === 'completed' ? 'bg-emerald-500' : 
                          quest.type === 'physical' ? 'bg-orange-500' : 'bg-rose-500'
                        }`}
                      />
                    </div>

                    <div className="flex items-center gap-4 pt-1">
                      <div className="flex items-center gap-1">
                        <Coins size={12} className="text-amber-500" />
                        <span className="text-[10px] font-black text-slate-600">{quest.rewardCoins}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star size={12} className="text-purple-500" />
                        <span className="text-[10px] font-black text-slate-600">{quest.rewardXP} XP</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {quest.status === 'completed' && (
                <button 
                  onClick={() => handleClaim(quest.id)}
                  className="w-full mt-4 py-3 bg-emerald-500 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform"
                >
                  Claim Rewards
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
