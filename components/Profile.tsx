import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { User } from '@supabase/supabase-js';
import { motion } from 'motion/react';
import { User as UserIcon, BookOpen, Award, Calendar, Settings, ChevronRight, LogOut } from 'lucide-react';

interface Props {
  user: User;
  totalWords: number;
  onSignOut: () => void;
}

export const Profile: React.FC<Props> = ({ user, totalWords, onSignOut }) => {
  const [masteredCount, setMasteredCount] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      const { count } = await supabase
        .from('user_words')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'mastered');
      
      setMasteredCount(count || 0);
    };
    fetchStats();
  }, [user.id]);

  const joinDate = new Date(user.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 sm:p-10 shadow-xl border border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-8"
      >
        <div className="w-24 h-24 sm:w-32 sm:h-32 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-indigo-200 dark:shadow-none">
          <UserIcon size={48} className="sm:size-64" />
        </div>
        <div className="text-center sm:text-left space-y-2">
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white">
            {user.user_metadata?.full_name || 'Learner'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 font-medium flex items-center justify-center sm:justify-start gap-2">
            <Calendar size={18} />
            Joined {joinDate}
          </p>
          <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-4">
            <span className="px-4 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-sm font-bold border border-indigo-100 dark:border-indigo-800">
              {user.email}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-lg border border-gray-100 dark:border-slate-800 flex items-center gap-6"
        >
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center">
            <BookOpen size={32} />
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-wider">Words Searched</p>
            <p className="text-3xl font-black text-gray-900 dark:text-white">{totalWords}</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-lg border border-gray-100 dark:border-slate-800 flex items-center gap-6"
        >
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center">
            <Award size={32} />
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-wider">Mastered</p>
            <p className="text-3xl font-black text-gray-900 dark:text-white">{masteredCount}</p>
          </div>
        </motion.div>
      </div>

      {/* Settings List */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-lg border border-gray-100 dark:border-slate-800 overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center gap-3">
          <Settings className="text-gray-400" />
          <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-wider text-sm">Account Settings</h3>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-slate-800">
          <button className="w-full p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-gray-500">
                <UserIcon size={20} />
              </div>
              <span className="font-bold text-gray-700 dark:text-gray-300">Edit Profile</span>
            </div>
            <ChevronRight className="text-gray-300 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button 
            onClick={onSignOut}
            className="w-full p-6 flex items-center justify-between hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center text-red-500">
                <LogOut size={20} />
              </div>
              <span className="font-bold text-red-600 dark:text-red-400">Sign Out</span>
            </div>
            <ChevronRight className="text-red-200 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
