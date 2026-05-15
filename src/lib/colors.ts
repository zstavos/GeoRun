export const TACTICAL_COLORS = [
  '#f43f5e', // rose-500
  '#3b82f6', // blue-500
  '#a855f7', // purple-500
  '#06b6d4', // cyan-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#6366f1', // indigo-500
  '#ec4899', // pink-500
  '#f97316', // orange-500
  '#8b5cf6', // violet-500
];

export const getTacticalColor = (userId: string, isMe: boolean) => {
  if (isMe) return '#e11d48'; // Always Rose-600 for current user
  
  // Deterministic index based on userId string hash
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % TACTICAL_COLORS.length;
  return TACTICAL_COLORS[index];
};
