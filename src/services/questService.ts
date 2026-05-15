import { 
  collection, 
  query, 
  getDocs, 
  getDoc,
  setDoc, 
  doc, 
  serverTimestamp, 
  updateDoc, 
  increment, 
  where,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface Quest {
  id: string;
  type: 'physical' | 'conquest';
  description: string;
  targetValue: number;
  currentValue: number;
  rewardCoins: number;
  rewardXP: number;
  status: 'active' | 'completed' | 'claimed';
  createdAt: Timestamp;
  expiresAt: Timestamp;
}

const QUEST_TEMPLATES = [
  { type: 'physical', description: 'Run 1 km today', target: 1000, coins: 50, xp: 100 },
  { type: 'physical', description: 'Run 2 km today', target: 2000, coins: 120, xp: 250 },
  { type: 'physical', description: 'Active for 15 minutes', target: 15, coins: 40, xp: 80 },
  { type: 'conquest', description: 'Capture 1 new territory', target: 1, coins: 60, xp: 120 },
  { type: 'conquest', description: 'Capture 3 new territories', target: 3, coins: 200, xp: 400 },
  { type: 'conquest', description: 'Explore for 500 meters', target: 500, coins: 45, xp: 90 },
];

export const questService = {
  async getDailyQuests(userId: string): Promise<Quest[]> {
    const questsRef = collection(db, 'users', userId, 'dailyQuests');
    const now = new Date();
    
    // Cleanup old quests or just fetch current ones
    const q = query(questsRef, where('expiresAt', '>', Timestamp.fromDate(now)));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return this.generateNewDailyQuests(userId);
    }
    
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Quest));
  },

  async generateNewDailyQuests(userId: string): Promise<Quest[]> {
    const questsRef = collection(db, 'users', userId, 'dailyQuests');
    const batch = writeBatch(db);
    
    // Choose 3 random templates
    const shuffled = [...QUEST_TEMPLATES].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);
    
    const now = new Date();
    const expiresAt = new Date();
    expiresAt.setHours(23, 59, 59, 999); // Expire at end of day
    
    const newQuests: Quest[] = selected.map((t, index) => {
      const id = `quest_${now.getTime()}_${index}`;
      const data = {
        id,
        type: t.type as any,
        description: t.description,
        targetValue: t.target,
        currentValue: 0,
        rewardCoins: t.coins,
        rewardXP: t.xp,
        status: 'active' as const,
        createdAt: Timestamp.fromDate(now),
        expiresAt: Timestamp.fromDate(expiresAt),
      };
      
      batch.set(doc(questsRef, id), data);
      return data;
    });
    
    await batch.commit();
    return newQuests;
  },

  async updateQuestProgress(userId: string, type: 'physical' | 'conquest', incrementValue: number) {
    const questsRef = collection(db, 'users', userId, 'dailyQuests');
    const now = new Date();
    const q = query(
      questsRef, 
      where('type', '==', type), 
      where('status', '==', 'active'),
      where('expiresAt', '>', Timestamp.fromDate(now))
    );
    
    const snapshot = await getDocs(q);
    
    for (const d of snapshot.docs) {
      const quest = d.data() as Quest;
      const newValue = quest.currentValue + incrementValue;
      
      const updateData: any = { 
        currentValue: increment(incrementValue),
        updatedAt: serverTimestamp()
      };
      
      if (newValue >= quest.targetValue) {
        updateData.status = 'completed';
      }
      
      await updateDoc(d.ref, updateData);
    }
  },

  async claimReward(userId: string, questId: string) {
    const questRef = doc(db, 'users', userId, 'dailyQuests', questId);
    const userRef = doc(db, 'users', userId);
    
    const questSnap = await getDoc(questRef);
    
    if (!questSnap.exists()) return;
    
    const quest = questSnap.data() as Quest;
    
    if (quest.status !== 'completed') return;
    
    const batch = writeBatch(db);
    
    // Update quest status
    batch.update(questRef, { status: 'claimed' });
    
    // Give rewards
    batch.update(userRef, {
      coins: increment(quest.rewardCoins),
      xp: increment(quest.rewardXP),
      updatedAt: serverTimestamp()
    });
    
    await batch.commit();
  }
};
