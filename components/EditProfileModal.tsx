import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { X, Save } from 'lucide-react';

interface Props {
  user: User;
  onClose: () => void;
  onProfileUpdated: (fullName: string) => void;
}

export const EditProfileModal: React.FC<Props> = ({ user, onClose, onProfileUpdated }) => {
  const [fullName, setFullName] = useState(user.user_metadata?.full_name || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: { full_name: fullName.trim() },
      });

      if (error) {
        throw error;
      }
      
      if (data.user?.user_metadata?.full_name) {
        onProfileUpdated(data.user.user_metadata.full_name);
      }
      onClose();
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 dark:border-slate-800 w-full max-w-md space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-black text-gray-900 dark:text-white">Edit Profile</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-500 dark:text-gray-400">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <label htmlFor="fullName" className="block text-sm font-bold text-gray-700 dark:text-gray-300">Full Name</label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
            placeholder="Enter your full name"
            disabled={loading}
          />
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-800 dark:text-white rounded-xl font-bold transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors flex items-center gap-2"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save'}
            {!loading && <Save size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};
