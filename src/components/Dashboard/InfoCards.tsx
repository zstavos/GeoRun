import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Quote } from 'lucide-react';

const ADVICES = [
  "Stay hydrated! Drink water before, during, and after your run.",
  "Proper footwear is key. Replace your running shoes every 300-500 miles.",
  "Consistency beats intensity. It's better to run 3 days a week every week than 7 days once a month.",
  "Listen to your body. Rest is just as important as the workout.",
  "Warm up properly with dynamic stretches to prevent injuries."
];

const QUOTES = [
  { text: "The miracle isn't that I finished. The miracle is that I had the courage to start.", author: "Joe Klocek" },
  { text: "Running is alone time that lets my brain unspool the tangles that build up over a day.", author: "Rob Haneisen" },
  { text: "A short run is better than no run at all.", author: null },
  { text: "Your only limit is you.", author: null }
];

export const AdvicesCard: React.FC = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % ADVICES.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-rose-50 border border-rose-100 rounded-3xl p-5 shadow-sm overflow-hidden min-h-[100px] flex flex-col justify-center">
      <div className="flex items-center gap-2 mb-2">
        <div className="bg-rose-500/10 p-1.5 rounded-lg">
          <Heart size={14} className="text-rose-500 fill-rose-500" />
        </div>
        <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Useful Advice</span>
      </div>
      
      <div className="relative h-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute inset-0"
          >
            <p className="text-slate-800 font-bold text-sm leading-tight">
              {ADVICES[index]}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export const QuotesCard: React.FC = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % QUOTES.length);
    }, 12000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-slate-100 border border-slate-200/50 rounded-3xl p-6 shadow-inner italic overflow-hidden min-h-[120px] flex flex-col justify-center">
      <div className="flex items-center gap-2 mb-3 opacity-30">
        <Quote size={18} className="text-slate-900" />
      </div>

      <div className="relative h-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="absolute inset-0 flex flex-col"
          >
            <p className="text-slate-700 font-medium text-base leading-snug">
              "{QUOTES[index].text}"
            </p>
            {QUOTES[index].author && (
              <p className="not-italic text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">
                — {QUOTES[index].author}
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
