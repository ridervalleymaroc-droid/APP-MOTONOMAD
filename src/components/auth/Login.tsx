import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Bike, ShieldCheck, AlertCircle } from 'lucide-react'; // <-- Ajout de AlertCircle
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../services/supabase';

interface LoginProps {
  onLoginSuccess: (role: string) => void;
  onNavigateRegister: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, onNavigateRegister }) => {
  const { language } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null); // <-- Nouvel état pour l'erreur

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null); // On réinitialise l'erreur à chaque nouvelle tentative
    
    try {
      // 1. Authentification via Supabase Cloud
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        // Au lieu d'un alert(), on met à jour le design d'erreur
        setError(language === 'fr' ? 'Identifiants incorrects. Veuillez vérifier votre email et mot de passe.' : 'Invalid credentials. Please check your email and password.');
        setIsLoading(false);
        return;
      }

      // 2. Récupération du rôle sécurisé depuis la table "profiles"
      if (authData.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authData.user.id)
          .single();

        const role = profileData?.role || 'STAFF'; 
        onLoginSuccess(role);
      }
    } catch (err) {
      console.error('Erreur lors de la connexion:', err);
      setError(language === 'fr' ? 'Une erreur inattendue est survenue.' : 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('motonomad2026');
    setError(null); // On efface l'erreur si l'utilisateur clique sur un compte de démo
  };

  return (
    <div className="min-h-screen flex bg-[#121212] text-[#F4F4F2] font-sans">
      {/* Left Side - Image Background */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[#121212]/80 via-[#121212]/40 to-transparent z-10" />
        <img 
          src="https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1200&auto=format&fit=crop&q=80" 
          alt="Motonomad Fleet" 
          className="object-cover w-full h-full"
        />
        <div className="absolute bottom-12 left-12 z-20 max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <Bike className="w-8 h-8 text-[#D4A017]" />
            <h1 className="text-3xl font-black tracking-widest text-white uppercase">MOTONOMAD</h1>
          </div>
          <p className="text-zinc-300 text-sm leading-relaxed">
            {language === 'fr' 
              ? "Le système exclusif de gestion de flotte et de location de motos premium au Maroc. Accès réservé au personnel autorisé."
              : "The exclusive premium motorcycle rental and fleet management system in Morocco. Authorized personnel access only."}
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 xl:p-24 relative">
        {/* Mobile Logo */}
        <div className="absolute top-8 left-8 lg:hidden flex items-center gap-2">
          <Bike className="w-6 h-6 text-[#D4A017]" />
          <span className="text-xl font-black tracking-widest uppercase">Motonomad</span>
        </div>

        <div className="w-full max-w-md space-y-8 animate-fadeIn">
          <div>
            <h2 className="text-3xl font-black text-white mb-2">
              {language === 'fr' ? 'Bon retour !' : 'Welcome back!'}
            </h2>
            <p className="text-zinc-400 text-sm">
              {language === 'fr' ? 'Veuillez vous connecter à votre espace de travail.' : 'Please log in to your workspace.'}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            
            {/* --- NOUVEAU DESIGN D'ERREUR ICI --- */}
            {error && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 animate-fadeIn">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}
            {/* ----------------------------------- */}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-5 h-5 text-zinc-500" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null); // Efface l'erreur dès qu'on tape à nouveau
                  }}
                  placeholder="admin@motonomad.ma"
                  className={`w-full pl-11 pr-4 py-3 bg-[#1A1A1A] border rounded-xl text-white focus:outline-none transition-colors ${
                    error ? 'border-red-500/50 focus:border-red-500' : 'border-[#333333] focus:border-[#D4A017]'
                  }`}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">{language === 'fr' ? 'Mot de passe' : 'Password'}</label>
                <a href="#" className="text-xs font-bold text-[#D4A017] hover:underline">
                  {language === 'fr' ? 'Oublié ?' : 'Forgot?'}
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-5 h-5 text-zinc-500" />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null); // Efface l'erreur dès qu'on tape à nouveau
                  }}
                  placeholder="••••••••"
                  className={`w-full pl-11 pr-4 py-3 bg-[#1A1A1A] border rounded-xl text-white focus:outline-none transition-colors ${
                    error ? 'border-red-500/50 focus:border-red-500' : 'border-[#333333] focus:border-[#D4A017]'
                  }`}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-[#D4A017] hover:bg-[#b88a10] text-[#1C1C1C] py-3.5 rounded-xl font-black text-sm uppercase tracking-wide transition-all active:scale-[0.98] disabled:opacity-70"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-[#1C1C1C] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {language === 'fr' ? 'Se Connecter' : 'Log In'} <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Raccourcis de test pour naviguer entre les 4 rôles facilement */}
          <div className="pt-6 border-t border-[#2D2D2D]">
            <div className="p-4 bg-[#D4A017]/5 border border-[#D4A017]/10 rounded-xl">
              <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 mb-3 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#D4A017]" />
                {language === 'fr' ? 'Comptes de Démo (Clic pour remplir)' : 'Demo Accounts (Click to fill)'}
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <button type="button" onClick={() => fillDemoAccount('admin@motonomad.ma')} className="text-left text-zinc-300 hover:text-[#D4A017] transition-colors truncate">
                  👑 admin@...
                </button>
                <button type="button" onClick={() => fillDemoAccount('manager@motonomad.ma')} className="text-left text-zinc-300 hover:text-[#D4A017] transition-colors truncate">
                  📊 manager@...
                </button>
                <button type="button" onClick={() => fillDemoAccount('accounting@motonomad.ma')} className="text-left text-zinc-300 hover:text-[#D4A017] transition-colors truncate">
                  💰 accounting@...
                </button>
                <button type="button" onClick={() => fillDemoAccount('staff@motonomad.ma')} className="text-left text-zinc-300 hover:text-[#D4A017] transition-colors truncate">
                  🛠️ staff@...
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};