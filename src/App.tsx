import React, { useState, useEffect } from 'react';
import { FirebaseProvider, useAuth } from './components/FirebaseProvider';
import { GeoMap } from './components/Map/GeoMap';
import { doc, setDoc, serverTimestamp, collection, query, where, limit, getDocs, updateDoc, arrayUnion, arrayRemove, getDoc, addDoc } from 'firebase/firestore';
import { loginWithGoogle, auth, db } from './lib/firebase';
import { motion } from 'motion/react';
import { 
  User,
  LogOut,
  Trophy,
  Hexagon,
  Smartphone,
  Settings,
  Pencil,
  Mail,
  ShieldCheck,
  Check,
  Fingerprint,
  Crosshair,
  Home,
  Users,
  Map as MapIcon,
  Crown,
  History,
  Info,
  ChevronRight,
  Plus,
  Search,
  ArrowLeft,
  UserPlus,
  Languages,
  Star,
  Coins
} from 'lucide-react';

import { TacticalProvider, useTactical } from './components/TacticalContext';

import { UpgradeModule } from './components/Dashboard/UpgradeModule';
import { DominionModule } from './components/Dashboard/DominionModule';
import { DailyQuestModule } from './components/Dashboard/QuestModule';
import { Board } from './components/Leaderboard/Board';
import { questService } from './services/questService';
import { QuestListIcon } from './components/ui/QuestListIcon';
import { ShopIcon } from './components/ui/ShopIcon';
import { ShopWindow } from './components/Dashboard/ShopWindow';
import { AdvicesCard, QuotesCard } from './components/Dashboard/InfoCards';

const LANGUAGES = {
  en: {
    home: 'Home',
    leaderboards: 'Leaderboards',
    map: 'Map',
    social: 'Social',
    profile: 'Profile',
    editProfile: 'Edit Profile',
    settings: 'Settings',
    language: 'Language',
    edit: 'Edit',
    logout: 'Log out',
    saveChanges: 'Save Changes',
    cancel: 'Cancel',
    firstName: 'First Name',
    lastName: 'Last Name',
    age: 'Age',
    gender: 'Gender',
    username: 'Username',
    email: 'Email',
    security: 'Security & Access',
    male: 'Male',
    female: 'Female',
    english: 'English',
    russian: 'Russian',
    uzbek: 'Uzbek'
  },
  ru: {
    home: 'Главная',
    leaderboards: 'Рейтинги',
    map: 'Карта',
    social: 'Социальное',
    profile: 'Профиль',
    editProfile: 'Изменить профиль',
    settings: 'Настройки',
    language: 'Язык',
    edit: 'Изменить',
    logout: 'Выйти',
    saveChanges: 'Сохранить',
    cancel: 'Отмена',
    firstName: 'Имя',
    lastName: 'Фамилия',
    age: 'Возраст',
    gender: 'Пол',
    username: 'Имя пользователя',
    email: 'Эл. почта',
    security: 'Безопасность',
    male: 'Мужской',
    female: 'Женский',
    english: 'Английский',
    russian: 'Русский',
    uzbek: 'Узбекский'
  },
  uz: {
    home: 'Asosiy',
    leaderboards: 'Reyting',
    map: 'Xarita',
    social: 'Ijtimoiy',
    profile: 'Profil',
    editProfile: 'Profilni tahrirlash',
    settings: 'Sozlamalar',
    language: 'Til',
    edit: 'Tahrirlash',
    logout: 'Chiqish',
    saveChanges: 'Saqlash',
    cancel: 'Bekor qilish',
    firstName: 'Ism',
    lastName: 'Familiya',
    age: 'Yosh',
    gender: 'Jins',
    username: 'Foydalanuvchi nomi',
    email: 'Elektron pochta',
    security: 'Xavfsizlik',
    male: 'Erkak',
    female: 'Ayol',
    english: 'Inglizcha',
    russian: 'Ruscha',
    uzbek: 'Oʻzbekcha'
  }
};

import { NotificationProvider } from './components/NotificationContext';

const AppContent: React.FC = () => {
  const { user, profile, loading } = useAuth();

  const { isTracking, speed, duration } = useTactical();
  const [activeTab, setActiveTab] = useState<'home' | 'leaderboard' | 'map' | 'social' | 'profile' | 'quests'>('home');
  const [socialSubView, setSocialSubView] = useState<'main' | 'find' | 'create-options' | 'create-form' | 'players' | 'player-detail'>('main');
  const [socialTab, setSocialTab] = useState<'Team' | 'Players'>('Team');
  const [quests, setQuests] = useState<any[]>([]);
  const [unclaimedQuestCount, setUnclaimedQuestCount] = useState(0);
  const [hasNewQuests, setHasNewQuests] = useState(false);
  const [lastSeenQuestCount, setLastSeenQuestCount] = useState(0);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [teamSearchQuery, setTeamSearchQuery] = useState('');
  const [playerSearchQuery, setPlayerSearchQuery] = useState('');
  const [foundPlayers, setFoundPlayers] = useState<any[]>([]);
  const [isSearchingPlayers, setIsSearchingPlayers] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [isSendingFriendRequest, setIsSendingFriendRequest] = useState(false);
  const [createTeamForm, setCreateTeamForm] = useState<{
    type: 'public' | 'private' | null;
    name: string;
    username: string;
  }>({
    type: null,
    name: '',
    username: ''
  });
  const [isSavingTeam, setIsSavingTeam] = useState(false);
  const [foundTeams, setFoundTeams] = useState<any[]>([]);
  const [isSearchingTeams, setIsSearchingTeams] = useState(false);
  const [currentTeam, setCurrentTeam] = useState<any>(null);
  const [isLoadingTeam, setIsLoadingTeam] = useState(false);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [teamHexCount, setTeamHexCount] = useState(0);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const fetchQuestStatus = async () => {
        try {
          const q = await questService.getDailyQuests(user.uid);
          setQuests(q);
          const count = q.filter(quest => quest.status === 'completed').length;
          
          if (count > lastSeenQuestCount && activeTab !== 'quests') {
            setHasNewQuests(true);
          }
          
          setUnclaimedQuestCount(count);
        } catch (e) {
          console.error(e);
        }
      };
      fetchQuestStatus();
      // Poll every minute or so, or we could use onSnapshot if we wanted real-time
      const timer = setInterval(fetchQuestStatus, 60000);
      return () => clearInterval(timer);
    }
  }, [user, activeTab]); // Re-fetch when switching tabs to ensure freshness
  useEffect(() => {
    if (activeTab === 'quests') {
      setHasNewQuests(false);
      setLastSeenQuestCount(unclaimedQuestCount);
    }
  }, [activeTab, unclaimedQuestCount]);

  useEffect(() => {
    if (profile?.currentTeamId) {
      const fetchTeamData = async () => {
        setIsLoadingTeam(true);
        try {
          const teamSnap = await getDoc(doc(db, 'teams', profile.currentTeamId));
          if (teamSnap.exists()) {
            const teamData = { id: teamSnap.id, ...teamSnap.data() } as any;
            setCurrentTeam(teamData);
            
            // Fetch first few members' profiles
            const memberIds = teamData.members.slice(0, 10);
            if (memberIds.length > 0) {
              const q = query(collection(db, 'users'), where('uid', 'in', memberIds));
              const mSnap = await getDocs(q);
              setTeamMembers(mSnap.docs.map(d => d.data()));
            }

            // Fetch team hex count
            const hexQ = query(collection(db, 'territories'), where('teamId', '==', teamSnap.id));
            const hexSnap = await getDocs(hexQ);
            setTeamHexCount(hexSnap.size);
          }
        } catch (error) {
          console.error("Error fetching team data:", error);
        } finally {
          setIsLoadingTeam(false);
        }
      };
      fetchTeamData();
    } else {
      setCurrentTeam(null);
      setTeamMembers([]);
      setTeamHexCount(0);
    }
  }, [profile?.currentTeamId]);

  useEffect(() => {
    if (socialSubView === 'find' && teamSearchQuery.length >= 3) {
      const searchTeams = async () => {
        setIsSearchingTeams(true);
        try {
          // Simple search: case sensitive prefix match for name OR username
          const qName = query(
            collection(db, 'teams'),
            where('name', '>=', teamSearchQuery),
            where('name', '<=', teamSearchQuery + '\uf8ff'),
            limit(10)
          );
          const qUser = query(
            collection(db, 'teams'),
            where('username', '>=', teamSearchQuery.toLowerCase()),
            where('username', '<=', teamSearchQuery.toLowerCase() + '\uf8ff'),
            limit(10)
          );
          
          const [snapName, snapUser] = await Promise.all([getDocs(qName), getDocs(qUser)]);
          const results = new Map();
          snapName.docs.forEach(doc => results.set(doc.id, doc.data()));
          snapUser.docs.forEach(doc => results.set(doc.id, doc.data()));
          
          setFoundTeams(Array.from(results.values()));
        } catch (error) {
          console.error("Search error:", error);
        } finally {
          setIsSearchingTeams(false);
        }
      };
      
      const timer = setTimeout(searchTeams, 500);
      return () => clearTimeout(timer);
    } else {
      setFoundTeams([]);
    }
  }, [teamSearchQuery, socialSubView]);

  useEffect(() => {
    if (socialSubView === 'players' && playerSearchQuery.length >= 3) {
      const searchPlayers = async () => {
        setIsSearchingPlayers(true);
        try {
          const q = query(
            collection(db, 'users'),
            where('username', '>=', playerSearchQuery.toLowerCase()),
            where('username', '<=', playerSearchQuery.toLowerCase() + '\uf8ff'),
            limit(10)
          );
          const snap = await getDocs(q);
          setFoundPlayers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
          console.error("Player search error:", error);
        } finally {
          setIsSearchingPlayers(false);
        }
      };
      
      const timer = setTimeout(searchPlayers, 500);
      return () => clearTimeout(timer);
    } else if (socialSubView === 'players') {
      setFoundPlayers([]);
    }
  }, [playerSearchQuery, socialSubView]);

  const handleSendFriendRequest = async (targetPlayer: any) => {
    if (!user || !profile) return;
    setIsSendingFriendRequest(true);
    try {
      await addDoc(collection(db, 'friendRequests'), {
        fromUserId: user.uid,
        fromUserName: profile.username || profile.displayName,
        fromUserPhotoURL: profile.photoURL || '',
        toUserId: targetPlayer.id || targetPlayer.uid,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      alert(`Friend request sent to ${targetPlayer.username}!`);
    } catch (e) {
      console.error(e);
      alert('Failed to send friend request.');
    } finally {
      setIsSendingFriendRequest(false);
    }
  };
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showLeaveTeamConfirm, setShowLeaveTeamConfirm] = useState(false);
  const [lang, setLang] = useState<'en' | 'ru' | 'uz'>('en');
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [showLanguageSecondary, setShowLanguageSecondary] = useState(false);

  const t = (key: string) => {
    return (LANGUAGES as any)[lang][key] || key;
  };

  const handleLeaveTeam = async () => {
    if (!user || !currentTeam) return;
    try {
      await updateDoc(doc(db, 'teams', currentTeam.id), {
        members: arrayRemove(user.uid),
        updatedAt: serverTimestamp()
      });
      await updateDoc(doc(db, 'users', user.uid), {
        currentTeamId: null,
        updatedAt: serverTimestamp()
      });
      setCurrentTeam(null);
      setSocialSubView('find');
      setShowLeaveTeamConfirm(false);
    } catch (e) {
      console.error(e);
    }
  };
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    username: '',
    gender: '',
    email: '',
    securityEmail: ''
  });

  useEffect(() => {
    if (profile) {
      setEditFormData({
        firstName: profile.firstName || profile.displayName?.split(' ')[0] || '',
        lastName: profile.lastName || profile.displayName?.split(' ')?.slice(1)?.join(' ') || '',
        age: profile.age || '',
        username: profile.username || '',
        gender: profile.gender || '',
        email: profile.email || user?.email || '',
        securityEmail: profile.securityEmail || ''
      });
    }
  }, [profile, user]);

  enum OperationType {
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete',
    LIST = 'list',
    GET = 'get',
    WRITE = 'write',
  }

  interface FirestoreErrorInfo {
    error: string;
    operationType: OperationType;
    path: string | null;
    authInfo: {
      userId?: string | null;
      email?: string | null;
      emailVerified?: boolean | null;
      isAnonymous?: boolean | null;
      tenantId?: string | null;
      providerInfo?: {
        providerId?: string | null;
        email?: string | null;
      }[];
    }
  }

  const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
        isAnonymous: auth.currentUser?.isAnonymous,
        tenantId: auth.currentUser?.tenantId,
        providerInfo: auth.currentUser?.providerData?.map(provider => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || []
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    const path = `users/${user.uid}`;
    try {
      await setDoc(doc(db, 'users', user.uid), {
        ...profile,
        ...editFormData,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setIsEditingProfile(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const handleCreateTeam = async () => {
    if (!user || !createTeamForm.type || !createTeamForm.name) return;
    
    let username = createTeamForm.username;
    if (createTeamForm.type === 'private') {
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
      username = '';
      for (let i = 0; i < 12; i++) {
        username += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }

    if (!username) return;

    setIsSavingTeam(true);
    const teamId = doc(collection(db, 'teams')).id;
    try {
      await setDoc(doc(db, 'teams', teamId), {
        id: teamId,
        name: createTeamForm.name,
        username: username,
        type: createTeamForm.type,
        creatorId: user.uid,
        members: [user.uid],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Update user's current team
      await updateDoc(doc(db, 'users', user.uid), {
        currentTeamId: teamId,
        updatedAt: serverTimestamp()
      });

      setSocialSubView('main');
      setCreateTeamForm({ type: null, name: '', username: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `teams/${teamId}`);
    } finally {
      setIsSavingTeam(false);
    }
  };

  const handleJoinTeam = async (teamId: string) => {
    if (!user) return;
    setIsSavingTeam(true); // Reusing state for join loading
    try {
      // 1. Add user to team members
      await updateDoc(doc(db, 'teams', teamId), {
        members: arrayUnion(user.uid),
        updatedAt: serverTimestamp()
      });

      // 2. Set user's current team
      await updateDoc(doc(db, 'users', user.uid), {
        currentTeamId: teamId,
        updatedAt: serverTimestamp()
      });

      setSocialSubView('main');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `teams/${teamId}/join`);
    } finally {
      setIsSavingTeam(false);
    }
  };

  const handlePurchase = async (item: any) => {
    if (!user || !profile) return;
    if ((profile.coins || 0) < item.price) return;

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        coins: (profile.coins || 0) - item.price,
        inventory: arrayUnion(item.id),
        updatedAt: serverTimestamp()
      });
      // Optionally notify user
    } catch (e) {
      console.error("Purchase error:", e);
    }
  };

  const handleEquip = async (itemId: string, category: string) => {
    if (!user || !profile) return;
    
    // Logic: 
    // 1. Filter out other items in the same category (e.g., only one hat at a time)
    // 2. Toggle if already equipped, or replace
    
    let newEquipped = [...(profile.equippedItems || [])];
    const isEquipped = newEquipped.includes(itemId);
    
    // Find category prefix for mapping (Hats=h, Shirts=sh, Pants=p, Shoes=s, Accessories=a)
    const prefixes: { [key: string]: string } = {
      'Hats': 'h',
      'Shirts': 'sh',
      'Pants': 'p',
      'Shoes': 's',
      'Accessories': 'a'
    };
    const prefix = prefixes[category];

    if (isEquipped) {
      newEquipped = newEquipped.filter(id => id !== itemId);
    } else {
      // Remove other items with same category prefix
      newEquipped = newEquipped.filter(id => !id.startsWith(prefix));
      newEquipped.push(itemId);
    }

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        equippedItems: newEquipped,
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      console.error("Equip error:", e);
    }
  };

  const handleLogin = async () => {
    setAuthError(null);
    setIsAuthenticating(true);
    try {
      await loginWithGoogle();
    } catch (error: any) {
      setAuthError(error.message || 'Authentication failed');
    } finally {
      setIsAuthenticating(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <motion.div 
          animate={{ scale: [0.9, 1, 0.9], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-16 h-16 rounded-[2rem] bg-rose-600 flex items-center justify-center text-white"
        >
          <Hexagon className="animate-spin" size={32} />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen bg-white overflow-hidden relative font-sans flex flex-col items-center justify-center p-8">
        {/* Abstract Image Blobs like Reference */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-100 rounded-full blur-3xl opacity-50 -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-100 rounded-full blur-3xl opacity-50 -ml-20 -mb-20" />
        
        <div className="relative z-10 w-full max-w-sm flex flex-col">
          <div className="flex justify-center mb-12">
            <div className="w-16 h-16 bg-rose-600 rounded-[2rem] flex items-center justify-center text-white shadow-xl shadow-rose-500/30">
              <Crosshair size={32} />
            </div>
          </div>

          <div className="space-y-6 mb-16">
            <p className="text-zinc-400 font-bold uppercase tracking-[0.3em] text-[10px]">Terra-Run Mobility</p>
            <h1 className="text-6xl font-black text-zinc-900 leading-[0.9] tracking-tighter">
              Together,<br />
              <span className="text-rose-600">we run.</span>
            </h1>
            <p className="text-zinc-500 font-medium leading-relaxed">
              Explore your world, claim your tiles, and build your dominion through movement.
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleLogin}
              disabled={isAuthenticating}
              className="btn-primary w-full py-5 text-lg"
            >
              {isAuthenticating ? 'Authorizing...' : 'Sign up to Explore'}
            </button>
            <button
              onClick={handleLogin}
              disabled={isAuthenticating}
              className="btn-secondary w-full py-5 text-lg"
            >
              Log in
            </button>
          </div>

          {authError && (
            <div className="mt-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl">
              <p className="text-[11px] text-rose-600 font-bold leading-relaxed">{authError}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-slate-50 text-slate-900 font-sans flex flex-col overflow-hidden">
      {/* Main Content Areas */}
      {activeTab === 'map' ? (
        <div className="flex-1 relative">
          <GeoMap />
        </div>
      ) : (
        <main className="flex-1 overflow-y-auto pb-24">
          {activeTab === 'home' && (
          <div className="min-h-full flex flex-col">
            <header className="px-6 pt-8 pb-4 bg-white shrink-0 border-b border-slate-50 flex items-center justify-between">
              <h1 className="text-3xl font-black tracking-tight">{t('home')}</h1>
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsShopOpen(true)}
                  className="relative p-2 flex items-center justify-center hover:bg-slate-50 rounded-full transition-colors outline-none"
                >
                  <ShopIcon size={24} strokeWidth={2.5} color="#fb7185" />
                </button>
                <button 
                  onClick={() => setActiveTab('quests')}
                  className="relative p-2 flex items-center justify-center hover:bg-slate-50 rounded-full transition-colors outline-none"
                >
                  <QuestListIcon size={24} strokeWidth={2.5} lineColor="#94a3b8" checkColor="#22c55e" />
                  {hasNewQuests && (
                    <span className="w-2 h-2 bg-red-500 rounded-full absolute -top-1 -right-1 border-2 border-slate-900" />
                  )}
                </button>
              </div>
            </header>
            
            <div className="p-6 space-y-12">
              <AdvicesCard />
              
              <div className="pt-2">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 px-2">Activity Stream</h3>
                <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-900">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-6 font-black italic">
                    S
                  </div>
                  <h2 className="text-xl font-black mb-4">Quiet on the front</h2>
                  <p className="text-slate-500 font-bold text-xs leading-relaxed max-w-[240px]">
                    Your tactical updates and conquest logs will appear here as you reclaim the world.
                  </p>
                </div>
              </div>

              <div className="pt-4">
                <QuotesCard />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'quests' && (
          <div className="min-h-full flex flex-col">
            <header className="px-6 pt-8 pb-4 bg-white shrink-0 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setActiveTab('home')}
                  className="p-2 rounded-full bg-slate-50 text-slate-900"
                >
                  <ArrowLeft size={20} />
                </button>
                <h1 className="text-3xl font-black tracking-tight">Daily Quests</h1>
              </div>
              <QuestListIcon size={24} strokeWidth={2.5} lineColor="#94a3b8" checkColor="#22c55e" />
            </header>
            <div className="p-6 overflow-y-auto">
              <DailyQuestModule />
            </div>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="min-h-full flex flex-col">
            <header className="px-6 pt-8 pb-4 bg-white shrink-0">
              <h1 className="text-3xl font-black tracking-tight">{t('leaderboards')}</h1>
            </header>
            <div className="px-6 pt-4 space-y-6">
              <div className="bg-slate-200 p-1.5 rounded-2xl flex gap-1 mb-8">
                {['Individual', 'Team'].map(tab => (
                  <button 
                    key={tab}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${tab === 'Individual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <section className="space-y-6">
                <div>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Global</h3>
                  <LeaderboardItem 
                    rank="31386th position" 
                    stats="0 Hexes owned" 
                    info="Position 31386/31386"
                    icon={<Hexagon size={18} fill="currentColor" />}
                  />
                </div>

                <div>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Tashkent</h3>
                  <LeaderboardItem 
                    rank="27th position" 
                    stats="0 Hexes owned" 
                    info="0% Owned out of 4,946 hexes"
                    icon={<Hexagon size={18} fill="currentColor" />}
                  />
                </div>

                <div className="bg-gradient-to-r from-green-300 to-emerald-400 p-6 rounded-[2rem] flex items-center justify-between text-white shadow-lg shadow-green-500/20">
                  <div>
                    <h3 className="text-lg font-black tracking-tighter flex items-center gap-2">
                      UZBEKISTAN <ShieldCheck size={20} />
                    </h3>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-90">Go Pro to Access: Start Free Trial Now</p>
                  </div>
                  <ChevronRight size={24} />
                </div>
              </section>
            </div>
          </div>
        )}

        {activeTab === 'social' && (
          <div className="min-h-full flex flex-col">
            {socialSubView === 'main' && (
              <>
                <header className="px-6 pt-8 pb-4 bg-white shrink-0 flex items-center justify-between">
                  <h1 className="text-3xl font-black tracking-tight">{t('social')}</h1>
                </header>
                <div className="px-6 pt-4 h-full flex flex-col">
                  <div className="bg-slate-200 p-1.5 rounded-2xl flex gap-1 mb-6 shrink-0">
                    {['Team', 'Players'].map(tab => (
                      <button 
                        key={tab}
                        onClick={() => setSocialTab(tab as any)}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${socialTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {socialTab === 'Team' ? (
                    <div className="flex-1 flex flex-col overflow-y-auto">
                      {profile?.currentTeamId && currentTeam ? (
                        <div className="flex-1 flex flex-col">
                          <header className="pb-6 flex items-center justify-between">
                            <div>
                              <h1 className="text-2xl font-black tracking-tight leading-tight">{currentTeam.name}</h1>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">@{currentTeam.username}</p>
                            </div>
                            <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg shadow-slate-900/10">
                              <ShieldCheck size={20} />
                            </div>
                          </header>

                          <div className="space-y-6 pb-12">
                            {/* Team Stats */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Territory</span>
                                <div className="flex items-baseline gap-2">
                                  <span className="text-2xl font-black text-slate-900">{teamHexCount}</span>
                                  <span className="text-[10px] font-bold text-slate-400">Hexes</span>
                                </div>
                              </div>
                              <div className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Rank</span>
                                <div className="flex items-baseline gap-2">
                                  <span className="text-2xl font-black text-slate-900">#42</span>
                                  <span className="text-[10px] font-bold text-slate-400">Top 100</span>
                                </div>
                              </div>
                            </div>

                            {/* Members list */}
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h3 className="text-lg font-black tracking-tight">Tactical Squad</h3>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{currentTeam.members.length} Active</span>
                              </div>

                              <div className="space-y-3">
                                {teamMembers.map((member) => (
                                  <div key={member.uid} className="flex items-center gap-4 p-4 bg-white rounded-3xl border border-slate-100 shadow-sm">
                                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-50">
                                      {member.photoURL ? (
                                        <img src={member.photoURL} alt={member.displayName} className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                                          <User size={20} />
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-black text-slate-900 truncate">{member.displayName}</p>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">@{member.username || 'exploring'}</p>
                                    </div>
                                    {member.uid === currentTeam.creatorId && (
                                      <div className="px-2 py-1 bg-amber-50 rounded-lg">
                                        <Crown size={14} className="text-amber-500 fill-amber-500" />
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>

                              <button 
                                onClick={() => setShowLeaveTeamConfirm(true)}
                                className="w-full py-4 text-xs font-black text-rose-600 uppercase tracking-widest border-2 border-rose-100 rounded-2xl mt-4"
                              >
                                Leave Team
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center pb-24">
                          <h2 className="text-2xl font-black text-slate-900 mb-8 max-w-[200px] leading-tight">
                            You are not currently in a team
                          </h2>
                          <p className="text-slate-500 font-bold text-sm leading-relaxed max-w-[280px] mb-12">
                            Create or join a team with other players, work together to increase your control over the world and rise up through the leaderboards
                          </p>

                          <div className="w-full space-y-4 max-w-[280px]">
                            <button 
                              onClick={() => setSocialSubView('find')}
                              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-slate-900/20"
                            >
                              Find Team
                            </button>
                            <button 
                              onClick={() => setSocialSubView('create-options')}
                              className="w-full py-4 border-2 border-slate-900 text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs"
                            >
                              Create Team
                            </button>
                            <button className="w-full py-4 border-2 border-slate-900 text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs">
                              Join Team With Code
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center pb-24">
                      <div className="w-24 h-24 bg-slate-100 rounded-[2.5rem] flex items-center justify-center mb-8">
                        <UserPlus size={40} className="text-slate-400" />
                      </div>
                      <h2 className="text-2xl font-black text-slate-900 mb-4 leading-tight">
                        Expand your network
                      </h2>
                      <p className="text-slate-500 font-bold text-sm leading-relaxed max-w-[280px] mb-12">
                        Search for other explorers around the world, send friend requests and see their achievements.
                      </p>

                      <button 
                        onClick={() => setSocialSubView('players')}
                        className="w-full max-w-[280px] py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-slate-900/20"
                      >
                        Search Players
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {socialSubView === 'find' && (
              <div className="flex-1 flex flex-col bg-white">
                <header className="px-6 pt-8 pb-4 flex items-center gap-4 border-b border-slate-100">
                  <button 
                    onClick={() => {
                      setSocialSubView('main');
                      setTeamSearchQuery('');
                    }}
                    className="p-2 rounded-full bg-slate-100 text-slate-900"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <div className="flex-1 bg-slate-100 rounded-2xl px-4 py-3 flex items-center gap-3">
                    <Search size={18} className="text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search" 
                      value={teamSearchQuery}
                      onChange={(e) => setTeamSearchQuery(e.target.value)}
                      className="bg-transparent border-none focus:outline-none text-sm font-bold w-full"
                      autoFocus
                    />
                  </div>
                </header>
                <div className="flex-1 overflow-y-auto bg-slate-50">
                  {teamSearchQuery.length < 3 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8">
                      <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 mb-4">
                        <Search size={24} />
                      </div>
                      <p className="text-slate-900 font-black mb-2">Find your crew</p>
                      <p className="text-slate-500 font-bold text-xs max-w-[200px]">Type a team name or username to search for active teams.</p>
                    </div>
                  ) : (
                    <div className="p-6 space-y-4">
                      {isSearchingTeams && (
                        <div className="flex justify-center p-8">
                          <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
                        </div>
                      )}
                      
                      {!isSearchingTeams && foundTeams.length === 0 && (
                        <div className="text-center py-12">
                          <p className="text-slate-400 font-bold text-sm">No teams found matching "{teamSearchQuery}"</p>
                        </div>
                      )}

                      {foundTeams.map(team => (
                        <div 
                          key={team.id}
                          className="w-full p-6 bg-white rounded-[2rem] border border-slate-100 flex items-center gap-4 text-left shadow-sm transition-transform hover:border-slate-300"
                        >
                          <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-xl font-black shrink-0">
                            {team.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-black text-slate-900 truncate">{team.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">@{team.username}</p>
                          </div>
                          <button 
                            onClick={() => handleJoinTeam(team.id)}
                            disabled={isSavingTeam}
                            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md shadow-slate-900/10 disabled:opacity-50 shrink-0"
                          >
                            {isSavingTeam ? 'Joining...' : 'Join'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {socialSubView === 'players' && (
              <div className="flex-1 flex flex-col bg-white">
                <header className="px-6 pt-8 pb-4 flex items-center gap-4 border-b border-slate-100">
                  <button 
                    onClick={() => {
                      setSocialSubView('main');
                      setPlayerSearchQuery('');
                    }}
                    className="p-2 rounded-full bg-slate-100 text-slate-900"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <div className="flex-1 bg-slate-100 rounded-2xl px-4 py-3 flex items-center gap-3">
                    <Search size={18} className="text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search players" 
                      value={playerSearchQuery}
                      onChange={(e) => setPlayerSearchQuery(e.target.value)}
                      className="bg-transparent border-none focus:outline-none text-sm font-bold w-full"
                      autoFocus
                    />
                  </div>
                </header>
                <div className="flex-1 overflow-y-auto bg-slate-50">
                  {playerSearchQuery.length < 3 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8">
                      <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 mb-4">
                        <UserPlus size={24} />
                      </div>
                      <p className="text-slate-900 font-black mb-2">Find other explorers</p>
                      <p className="text-slate-500 font-bold text-xs max-w-[200px]">Type a username to find players around the world.</p>
                    </div>
                  ) : (
                    <div className="p-6 space-y-4">
                      {isSearchingPlayers && (
                        <div className="flex justify-center p-8">
                          <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
                        </div>
                      )}
                      
                      {!isSearchingPlayers && foundPlayers.length === 0 && (
                        <div className="text-center py-12">
                          <p className="text-slate-400 font-bold text-sm">No players found matching "{playerSearchQuery}"</p>
                        </div>
                      )}

                      {foundPlayers.map(p => (
                        <button 
                          key={p.id}
                          onClick={() => {
                            setSelectedPlayer(p);
                            setSocialSubView('player-detail');
                          }}
                          className="w-full p-4 bg-white rounded-3xl border border-slate-100 flex items-center gap-4 text-left shadow-sm transition-transform active:scale-95"
                        >
                          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-50 bg-slate-100 shrink-0">
                            {p.photoURL ? (
                              <img src={p.photoURL} alt={p.displayName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <User size={20} />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-black text-slate-900 truncate">{p.displayName}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">@{p.username}</p>
                          </div>
                          <ChevronRight size={18} className="text-slate-300" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {socialSubView === 'player-detail' && selectedPlayer && (
              <div className="flex-1 flex flex-col bg-white">
                <header className="px-6 pt-8 pb-4 flex items-center gap-4">
                  <button 
                    onClick={() => setSocialSubView('players')}
                    className="p-2 rounded-full bg-slate-100 text-slate-900"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <h1 className="text-2xl font-black tracking-tight truncate flex-1">{selectedPlayer.displayName}</h1>
                </header>
                
                <div className="flex-1 overflow-y-auto px-6 pt-4 pb-12 space-y-8">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-24 h-24 rounded-[2.5rem] overflow-hidden border-4 border-slate-50 shadow-xl mb-4">
                       {selectedPlayer.photoURL ? (
                          <img src={selectedPlayer.photoURL} alt={selectedPlayer.displayName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                            <User size={40} />
                          </div>
                        )}
                    </div>
                    <h2 className="text-xl font-black text-slate-900">@{selectedPlayer.username}</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Exploration Level 12</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 bg-slate-50 rounded-3xl flex flex-col gap-1 items-center">
                      <span className="text-xl font-black text-slate-900">{(selectedPlayer.totalDistance || 0).toFixed(1)}</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">KM Ran</span>
                    </div>
                    <div className="p-5 bg-slate-50 rounded-3xl flex flex-col gap-1 items-center">
                      <span className="text-xl font-black text-slate-900">{selectedPlayer.ownedTerritoryCount || 0}</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hexes</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleSendFriendRequest(selectedPlayer)}
                    disabled={isSendingFriendRequest || selectedPlayer.id === user?.uid}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSendingFriendRequest ? (
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <UserPlus size={16} />
                    )}
                    {selectedPlayer.id === user?.uid ? 'This is you' : 'Send Friend Request'}
                  </button>

                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Achievements</h3>
                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="shrink-0 w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                          <Trophy size={24} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {socialSubView === 'create-options' && (
              <div className="flex-1 flex flex-col bg-white">
                <header className="px-6 pt-8 pb-4 flex items-center gap-4">
                  <button 
                    onClick={() => setSocialSubView('main')}
                    className="p-2 rounded-full bg-slate-100 text-slate-900"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <h1 className="text-2xl font-black tracking-tight">Create Team</h1>
                </header>
                <div className="flex-1 p-6 space-y-4">
                  <button 
                    onClick={() => {
                      setCreateTeamForm({ ...createTeamForm, type: 'public' });
                      setSocialSubView('create-form');
                    }}
                    className="w-full p-8 rounded-[2.5rem] bg-slate-900 text-white text-left transition-transform active:scale-95 shadow-xl shadow-slate-900/20"
                  >
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-4">
                      <Users size={24} />
                    </div>
                    <p className="text-xl font-black mb-2">Public Team</p>
                    <p className="text-xs font-bold text-white/60">Anyone can find and join. Great for building a large community.</p>
                  </button>

                  <button 
                    onClick={() => {
                      setCreateTeamForm({ ...createTeamForm, type: 'private' });
                      setSocialSubView('create-form');
                    }}
                    className="w-full p-8 rounded-[2.5rem] bg-white border-2 border-slate-900 text-slate-900 text-left transition-transform active:scale-95"
                  >
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                      <ShieldCheck size={24} />
                    </div>
                    <p className="text-xl font-black mb-2">Private Team</p>
                    <p className="text-xs font-bold text-slate-400">Join by code only. Perfect for close friends and tactical squads.</p>
                  </button>
                </div>
              </div>
            )}

            {socialSubView === 'create-form' && (
              <div className="flex-1 flex flex-col bg-white">
                <header className="px-6 pt-8 pb-4 flex items-center gap-4">
                  <button 
                    onClick={() => setSocialSubView('create-options')}
                    className="p-2 rounded-full bg-slate-100 text-slate-900"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <h1 className="text-2xl font-black tracking-tight">Team Details</h1>
                </header>
                
                <div className="flex-1 p-6 space-y-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Team Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Urban Explorers"
                        value={createTeamForm.name}
                        onChange={(e) => setCreateTeamForm({ ...createTeamForm, name: e.target.value })}
                        className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold text-slate-900 focus:ring-2 focus:ring-slate-900 focus:outline-none"
                      />
                      <p className="text-[10px] font-bold text-slate-400 italic">This is how your team will appear on leaderboards.</p>
                    </div>

                    {createTeamForm.type === 'public' && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Team Username</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">@</span>
                          <input 
                            type="text" 
                            placeholder="urban_explorers"
                            value={createTeamForm.username}
                            onChange={(e) => setCreateTeamForm({ ...createTeamForm, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                            className="w-full p-4 pl-8 bg-slate-50 rounded-2xl border border-slate-100 font-bold text-slate-900 focus:ring-2 focus:ring-slate-900 focus:outline-none"
                          />
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 italic">A unique identifier for your team.</p>
                      </div>
                    )}

                    {createTeamForm.type === 'private' && (
                      <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3">
                        <ShieldCheck className="text-amber-600 shrink-0" size={20} />
                        <div className="space-y-1">
                          <p className="text-xs font-black text-amber-900">Private Mode Active</p>
                          <p className="text-[10px] font-bold text-amber-700 leading-tight">
                            A unique 12-character ID will be generated for your team. Share it with friends to let them join.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 pb-12">
                  <button 
                    disabled={!createTeamForm.name || (createTeamForm.type === 'public' && !createTeamForm.username) || isSavingTeam}
                    onClick={handleCreateTeam}
                    className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-slate-900/20 disabled:opacity-50 disabled:shadow-none"
                  >
                    {isSavingTeam ? 'Creating...' : 'Establish Team'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="px-6 space-y-8 pt-4 pb-12 relative">
            <div className="flex justify-between items-center px-2">
              <h1 className="text-3xl font-black tracking-tight">
                {isEditingProfile ? t('editProfile') : t('profile')}
              </h1>
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsShopOpen(true)}
                  className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-rose-500 hover:bg-slate-200 transition-colors"
                >
                  <ShopIcon size={20} strokeWidth={2.5} color="currentColor" />
                </button>
              <button 
                onClick={() => setActiveTab('quests')}
                className="relative p-2 flex items-center justify-center hover:bg-slate-50 rounded-full transition-colors outline-none"
              >
                <QuestListIcon size={24} strokeWidth={2.5} lineColor="#94a3b8" checkColor="#22c55e" />
                {hasNewQuests && (
                  <span className="w-2 h-2 bg-red-500 rounded-full absolute -top-1 -right-1 border-2 border-slate-900" />
                )}
              </button>
                <button 
                  onClick={() => {
                    const url = window.location.href;
                    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
                    const win = window.open('', '_blank', 'width=350,height=450');
                    if (win) {
                      win.document.write(`
                        <body style="background:white;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;text-align:center;padding:20px;">
                          <div style="width:64px;height:64px;background:#e11d48;border-radius:16px;display:flex;align-items:center;justify-content:center;color:white;margin-bottom:20px;">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/></svg>
                          </div>
                          <h2 style="font-weight:900;margin:0 0 10px 0;text-transform:uppercase;">Connect Mobile</h2>
                          <p style="font-size:12px;color:#64748b;margin-bottom:20px;">Scan to sync with your device</p>
                          <img src="${qrUrl}" style="border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,0.1);" />
                        </body>
                      `);
                    }
                  }}
                  className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  <Smartphone size={20} />
                </button>
                
                {!isEditingProfile ? (
                  <div className="relative">
                    <button 
                      onClick={() => {
                        setShowSettingsDropdown(!showSettingsDropdown);
                        setShowLanguageSecondary(false);
                      }}
                      className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"
                    >
                      <Settings size={20} />
                    </button>
                    
                    {showSettingsDropdown && (
                      <>
                        <div 
                          className="fixed inset-0 z-[105]" 
                          onClick={() => {
                            setShowSettingsDropdown(false);
                            setShowLanguageSecondary(false);
                          }} 
                        />
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 z-[110] overflow-hidden py-2">
                          {!showLanguageSecondary ? (
                            <>
                              <button 
                                onClick={() => {
                                  setIsEditingProfile(true);
                                  setShowSettingsDropdown(false);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-slate-700 font-bold text-sm text-left"
                              >
                                <Pencil size={18} className="text-slate-400" />
                                {t('edit')}
                              </button>
                              <button 
                                onClick={() => setShowLanguageSecondary(true)}
                                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors text-slate-700 font-bold text-sm text-left"
                              >
                                <div className="flex items-center gap-3">
                                  <Languages size={18} className="text-slate-400" />
                                  {t('language')}
                                </div>
                                <ChevronRight size={16} className="text-slate-400" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                onClick={() => setShowLanguageSecondary(false)}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-slate-400 font-bold text-[10px] uppercase tracking-widest text-left"
                              >
                                <ArrowLeft size={14} />
                                {t('language')}
                              </button>
                              {[
                                { key: 'en', label: t('english') },
                                { key: 'ru', label: t('russian') },
                                { key: 'uz', label: t('uzbek') }
                              ].map(l => (
                                <button 
                                  key={l.key}
                                  onClick={() => {
                                    setLang(l.key as any);
                                    setShowSettingsDropdown(false);
                                    setShowLanguageSecondary(false);
                                  }}
                                  className={`w-full flex items-center justify-between px-6 py-3 hover:bg-slate-50 transition-colors font-bold text-sm text-left ${lang === l.key ? 'text-rose-600 bg-rose-50/50' : 'text-slate-700'}`}
                                >
                                  {l.label}
                                  {lang === l.key && <Check size={16} />}
                                </button>
                              ))}
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <button 
                    onClick={handleSaveProfile}
                    className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center transition-all shadow-lg shadow-slate-900/20"
                  >
                    <Check size={20} />
                  </button>
                )}
              </div>
            </div>

            {/* Profile Header Card */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-rose-500/5 flex flex-col items-center">
              {!isEditingProfile ? (
                <>
                  <div className="relative mb-6">
                    <div className="w-24 h-24 rounded-full border-4 border-white shadow-2xl overflow-hidden ring-4 ring-rose-50">
                      {profile?.photoURL ? (
                        <img src={profile.photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                          <User size={40} />
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-rose-600 rounded-full border-4 border-white flex items-center justify-center text-white">
                      <ShieldCheck size={16} />
                    </div>
                  </div>

                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-1.5 rounded-full mb-8">
                    @{profile?.username || 'unidentified_user'}
                  </p>

                  {/* Level & Rewards Stats */}
                  <div className="w-full grid grid-cols-3 gap-3 mb-8">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
                        <Trophy size={20} />
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase">Level {profile?.level || 1}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-sm">
                        <Coins size={20} />
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase">{profile?.coins || 0} Coins</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-sm">
                        <Star size={20} />
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase">{profile?.xp || 0} XP</span>
                    </div>
                  </div>

                  <div className="w-full space-y-4">
                    {/* Personal Info Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <ProfileItem label={t('firstName')} value={profile?.firstName || profile?.displayName?.split(' ')[0] || '-'} />
                      <ProfileItem label={t('lastName')} value={profile?.lastName || profile?.displayName?.split(' ')[1] || '-'} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <ProfileItem label={t('age')} value={profile?.age || '-'} />
                      <ProfileItem label={t('gender')} value={profile?.gender ? (profile.gender === 'Male' ? t('male') : t('female')) : '-'} />
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-3xl border border-slate-100">
                      <div className="w-14 h-14 shrink-0 rounded-2xl bg-white flex items-center justify-center text-rose-600 shadow-sm">
                        <Fingerprint size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{t('username')}</p>
                        <p className="text-sm font-bold text-slate-900 truncate">@{profile?.username || 'unidentified'}</p>
                      </div>
                    </div>

                    {/* Email Section */}
                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-3xl border border-slate-100">
                      <div className="w-14 h-14 shrink-0 rounded-2xl bg-white flex items-center justify-center text-sky-600 shadow-sm">
                        <Mail size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{t('email')}</p>
                        <p className="text-sm font-bold text-slate-900 truncate">{profile?.email || user?.email}</p>
                      </div>
                    </div>

                    {/* Security Section */}
                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-3xl border border-slate-100">
                      <div className="w-14 h-14 shrink-0 rounded-2xl bg-white flex items-center justify-center text-slate-400 shadow-sm">
                        <ShieldCheck size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{t('security')}</p>
                        <p className="text-sm font-bold text-slate-900 truncate">{profile?.securityEmail || 'Google Protected'}</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('firstName')}</label>
                      <input 
                        type="text" 
                        value={editFormData.firstName}
                        onChange={(e) => setEditFormData({...editFormData, firstName: e.target.value})}
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('lastName')}</label>
                      <input 
                        type="text" 
                        value={editFormData.lastName}
                        onChange={(e) => setEditFormData({...editFormData, lastName: e.target.value})}
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('age')}</label>
                      <input 
                        type="number" 
                        value={editFormData.age}
                        onChange={(e) => setEditFormData({...editFormData, age: e.target.value})}
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('username')}</label>
                      <input 
                        type="text" 
                        value={editFormData.username}
                        onChange={(e) => setEditFormData({...editFormData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')})}
                        placeholder="Choose username..."
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('gender')}</label>
                    <div className="flex gap-2">
                       {['Male', 'Female'].map(option => (
                         <button
                           key={option}
                           onClick={() => setEditFormData({...editFormData, gender: option})}
                           className={`flex-1 py-3 rounded-2xl text-xs font-bold transition-all border ${
                             editFormData.gender === option 
                               ? 'bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-500/20' 
                               : 'bg-white border-slate-100 text-slate-500'
                           }`}
                         >
                           {option === 'Male' ? t('male') : t('female')}
                         </button>
                       ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('email')}</label>
                    <input 
                      type="email" 
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('security')}</label>
                    <input 
                      type="email" 
                      value={editFormData.securityEmail}
                      onChange={(e) => setEditFormData({...editFormData, securityEmail: e.target.value})}
                      placeholder="Backup recovery email..."
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button 
                      onClick={() => setIsEditingProfile(false)}
                      className="flex-1 py-4 px-6 bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest"
                    >
                      {t('cancel')}
                    </button>
                    <button 
                      onClick={handleSaveProfile}
                      className="flex-[2] py-4 px-6 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/30"
                    >
                      {t('saveChanges')}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {!isEditingProfile && (
              <button 
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full py-5 bg-rose-50 text-rose-600 rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-rose-100 transition-all border border-rose-100 shadow-sm"
              >
                <LogOut size={18} />
                {t('logout')}
              </button>
            )}
          </div>
        )}
      </main>
    )}

      {/* Leave Team Confirmation Overlay */}
      {showLeaveTeamConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setShowLeaveTeamConfirm(false)}
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="relative w-full max-w-xs bg-white rounded-[2.5rem] p-8 text-center shadow-2xl"
          >
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <LogOut size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Leave Team?</h3>
            <p className="text-sm font-bold text-slate-500 mb-8">Are you sure you want to leave {currentTeam?.name}? You will lose access to team territory information.</p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleLeaveTeam}
                className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-rose-500/20"
              >
                Yes, Leave
              </button>
              <button 
                onClick={() => setShowLeaveTeamConfirm(false)}
                className="w-full py-4 bg-slate-100 text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Logout Confirmation Overlay */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setShowLogoutConfirm(false)}
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="relative bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl border border-slate-100 flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mb-6">
              <LogOut size={32} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Confirm Logout</h3>
            <p className="text-slate-500 font-medium leading-relaxed mb-10">Are you sure you want to log out of your session?</p>
            
            <div className="w-full flex gap-3">
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-[2rem] font-black uppercase tracking-widest text-xs transition-all hover:bg-slate-200"
              >
                No, Stay
              </button>
              <button 
                onClick={() => auth.signOut()}
                className="flex-1 py-5 bg-rose-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-lg shadow-rose-500/30 transition-all hover:bg-rose-700"
              >
                Yes, Log out
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Persistent Bottom Nav Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 px-4 py-4 flex justify-between items-center z-50 rounded-t-[2.5rem] shadow-2xl">
        <NavIcon active={activeTab === 'home'} icon={<Home />} label={t('home').toUpperCase()} onClick={() => setActiveTab('home')} />
        <NavIcon active={activeTab === 'leaderboard'} icon={<Trophy />} label={t('leaderboards').toUpperCase()} onClick={() => setActiveTab('leaderboard')} />
        <NavIcon active={activeTab === 'map'} icon={<MapIcon />} label={t('map').toUpperCase()} onClick={() => setActiveTab('map')} />
        <NavIcon active={activeTab === 'social'} icon={<Users />} label={t('social').toUpperCase()} onClick={() => {
          setActiveTab('social');
          setSocialSubView('main');
        }} />
        <NavIcon active={activeTab === 'profile'} icon={<User />} label={t('profile').toUpperCase()} onClick={() => setActiveTab('profile')} />
      </nav>

      <ShopWindow 
        isOpen={isShopOpen} 
        onClose={() => setIsShopOpen(false)} 
        userCredits={profile?.coins || 0}
        inventory={profile?.inventory || []}
        equippedItems={profile?.equippedItems || []}
        onPurchase={handlePurchase}
        onEquip={handleEquip}
      />
    </div>
  );
};

const LeaderboardItem: React.FC<{ rank: string; stats: string; info: string; icon: React.ReactNode }> = ({ rank, stats, info, icon }) => (
  <div className="flex items-center gap-4 group mb-6">
    <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center text-lg font-black shadow-lg shadow-slate-900/10">
      #
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 rounded-full bg-slate-900" />
        <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{rank}</span>
        <div className="flex items-center gap-1 text-slate-400">
          {icon}
          <span className="text-[10px] font-black">{stats}</span>
        </div>
      </div>
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{info}</div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-slate-400/30 rounded-full" style={{ width: '40%' }} />
      </div>
    </div>
    <ChevronRight className="text-slate-900" size={24} />
  </div>
);

const ProfileItem: React.FC<{ icon?: React.ReactNode; label: string; value: string | number }> = ({ icon, label, value }) => (
  <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col gap-1 items-center text-center">
    {icon && <div className="text-slate-300 mb-1">{icon}</div>}
    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</span>
    <span className="text-sm font-bold text-slate-900 truncate w-full">{value}</span>
  </div>
);

const StatCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="bg-white p-4 rounded-3xl border border-slate-100 flex flex-col gap-1">
    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{label}</span>
    <span className="text-lg font-black tracking-tighter text-slate-900">{value}</span>
  </div>
);

const NavIcon: React.FC<{ active: boolean; icon: React.ReactNode; label: string; onClick: () => void; hasBadge?: boolean }> = ({ active, icon, label, onClick, hasBadge }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${active ? 'text-slate-900' : 'text-slate-400'}`}
  >
    <div className={`relative p-2.5 rounded-full transition-all duration-300 ${active ? 'bg-slate-100' : ''}`}>
      {React.cloneElement(icon as React.ReactElement, { size: 20, strokeWidth: active ? 3 : 2.5 })}
      {hasBadge && (
        <span className="absolute top-2 right-2 w-2 h-2 bg-rose-600 rounded-full border border-white animate-pulse" />
      )}
    </div>
    <span className={`text-[8px] font-black tracking-widest transition-all ${active ? 'opacity-100' : 'opacity-60'}`}>
      {label}
    </span>
  </button>
);

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`group relative flex flex-col items-center gap-1.5 p-3 transition-all ${
      active ? 'text-emerald-500' : 'text-zinc-600 hover:text-zinc-400'
    }`}
  >
    {active && (
      <motion.div 
        layoutId="active-pill"
        className="absolute inset-0 bg-emerald-500/10 rounded-2xl border border-emerald-500/20"
        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
      />
    )}
    <div className="relative z-10 transition-transform group-hover:scale-110">
      {React.cloneElement(icon as React.ReactElement, { size: active ? 28 : 24 })}
    </div>
    <span className={`relative z-10 text-[9px] font-black tracking-[0.2em] transition-all ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
      {label}
    </span>
  </button>
);

export default function App() {
  return (
    <FirebaseProvider>
      <NotificationProvider>
        <TacticalProvider>
          <AppContent />
        </TacticalProvider>
      </NotificationProvider>
    </FirebaseProvider>
  );
}
