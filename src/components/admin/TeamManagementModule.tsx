import React, { useState } from 'react';
import { UserPlus, Shield, Mail, Lock, User, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useLanguage } from '../../context/LanguageContext';

export const TeamManagementModule: React.FC = () => {
  const { language } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'MANAGER' | 'ACCOUNTING' | 'STAFF'>('STAFF');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Appel de la Edge Function Supabase que tu viens de déployer
      const { data, error: fnError } = await supabase.functions.invoke('create-user', {
        body: { email, password, role, displayName },
      });

      if (fnError || data?.error) {
        throw new Error(fnError?.message || data?.error);
      }

      setSuccessMessage(
        language === 'fr' 
          ? 'Compte collaborateur créé avec succès !' 
          : 'Staff account successfully created!'
      );
      setEmail('');
      setPassword('');
      setDisplayName('');
      setRole('STAFF');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erreur lors de la création du compte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-[#1A1A1A] border border-[#333333] rounded-2xl shadow-xl space-y-6">
      <div className="flex items-center gap-3 border-b border-[#2D2D2D] pb-4">
        <div className="p-2.5 rounded-xl bg-[#D4A017]/10 text-[#D4A017]">
          <UserPlus className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-black text-white">
            {language === 'fr' ? "Gestion de l'équipe" : 'Team Management'}
          </h2>
          <p className="text-xs text-zinc-400">
            {language === 'fr' ? 'Créer un nouveau compte collaborateur et lui attribuer un rôle sécurisé.' : 'Create a new staff account and assign a secure role.'}
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-3 text-xs">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-3 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleCreateUser} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300 uppercase">
              {language === 'fr' ? 'Nom complet' : 'Full Name'}
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Mohamed Rochdi"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#141414] border border-[#333333] text-xs text-white focus:outline-none focus:border-[#D4A017]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300 uppercase">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@motonomad.ma"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#141414] border border-[#333333] text-xs text-white focus:outline-none focus:border-[#D4A017]"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300 uppercase">
              {language === 'fr' ? 'Mot de passe temporaire' : 'Temporary Password'}
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#141414] border border-[#333333] text-xs text-white focus:outline-none focus:border-[#D4A017]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300 uppercase">Rôle</label>
            <div className="relative">
              <Shield className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#141414] border border-[#333333] text-xs text-white focus:outline-none focus:border-[#D4A017] cursor-pointer"
              >
                <option value="ADMIN">ADMIN</option>
                <option value="MANAGER">MANAGER</option>
                <option value="ACCOUNTING">ACCOUNTING</option>
                <option value="STAFF">STAFF</option>
              </select>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl font-bold text-xs bg-[#D4A017] text-[#1C1C1C] hover:bg-[#b88a10] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg mt-4"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-[#1C1C1C] border-t-transparent rounded-full animate-spin" />
          ) : (
            <span>{language === 'fr' ? 'Créer le compte collaborateur' : 'Create Staff Account'}</span>
          )}
        </button>
      </form>
    </div>
  );
};

export default TeamManagementModule;