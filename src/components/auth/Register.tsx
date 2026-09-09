import React, { useState } from 'react';
import { Mail, Lock, User, ArrowLeft, Bike, AlertCircle, CheckCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../services/supabase';

interface RegisterProps {
  onNavigateLogin: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onNavigateLogin }) => {
  const { language } = useLanguage();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // 1. Vérification des mots de passe
    if (password !== confirmPassword) {
      setError(language === 'fr' ? 'Les mots de passe ne correspondent pas.' : 'Passwords do not match.');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError(language === 'fr' ? 'Le mot de passe doit contenir au moins 6 caractères.' : 'Password must be at least 6 characters.');
      setIsLoading(false);
      return;
    }

    try {
      // 2. Création du compte dans Supabase Auth (le Trigger SQL créera le profil automatiquement)
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName, // Transmet le nom au Trigger pour la table profiles
          }
        }
      });

      if (authError) {
        setError(authError.message);
        setIsLoading(false);
        return;
      }

      // 3. Succès ! On affiche un message vert et on redirige vers le login après 2 secondes
      setSuccess(true);
      setTimeout(() => {
        onNavigateLogin();
      }, 2000);
      
    } catch (err) {
      console.error('Erreur inscription:', err);
      setError(language === 'fr' ? 'Une erreur inattendue est survenue.' : 'An unexpected error occurred.');
    } finally {
      if (!success) setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#121212] text-[#F4F4F2] font-sans">
      {/* Left Side - Image Background */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[#121212]/80 via-[#121212]/40 to-transparent z-10" />
        <img 
          src="https://images.unsplash.com/photo-1558981420-c532902e58b4?w=1200&auto=format&fit=crop&q=80" 
          alt="Motonomad Workshop" 
          className="object-cover w-full h-full"
        />
        <div className="absolute bottom-12 left-12 z-20 max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <Bike className="w-8 h-8 text-[#D4A017]" />
            <h1 className="text-3xl font-black tracking-widest text-white uppercase">MOTONOMAD</h1>
          </div>
          <p className="text-zinc-300 text-sm leading-relaxed">
            {language === 'fr' 
              ? "Rejoignez l'équipe. Créez votre compte pour accéder aux outils de gestion de flotte."
              : "Join the team. Create your account to access the fleet management tools."}
          </p>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 xl:p-24 relative">
        {/* Mobile Logo */}
        <div className="absolute top-8 left-8 lg:hidden flex items-center gap-2">
          <Bike className="w-6 h-6 text-[#D4A017]" />
          <span className="text-xl font-black tracking-widest uppercase">Motonomad</span>
        </div>

        <div className="w-full max-w-md space-y-8 animate-fadeIn">
          <div>
            <h2 className="text-3xl font-black text-white mb-2">
              {language === 'fr' ? 'Créer un compte' : 'Create an account'}
            </h2>
            <p className="text-zinc-400 text-sm">
              {language === 'fr' ? "Demandez votre accès à l'espace de travail." : "Request access to the workspace."}
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            
            {/* Design d'erreur */}
            {error && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 animate-fadeIn">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Design de succès */}
            {success && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 animate-fadeIn">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">
                  {language === 'fr' ? 'Compte créé avec succès ! Redirection...' : 'Account created successfully! Redirecting...'}
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">{language === 'fr' ? 'Nom Complet' : 'Full Name'}</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-5 h-5 text-zinc-500" />
                <input 
                  type="text" 
                  required
                  value={displayName}
                  onChange={(e) => { setDisplayName(e.target.value); setError(null); }}
                  placeholder="Ex: Mehdi Ouhssain"
                  className="w-full pl-11 pr-4 py-3 bg-[#1A1A1A] border border-[#333333] rounded-xl text-white focus:outline-none focus:border-[#D4A017] transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-5 h-5 text-zinc-500" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                  placeholder="nom@motonomad.ma"
                  className="w-full pl-11 pr-4 py-3 bg-[#1A1A1A] border border-[#333333] rounded-xl text-white focus:outline-none focus:border-[#D4A017] transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">{language === 'fr' ? 'Mot de passe' : 'Password'}</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-5 h-5 text-zinc-500" />
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(null); }}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3 bg-[#1A1A1A] border border-[#333333] rounded-xl text-white focus:outline-none focus:border-[#D4A017] transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">{language === 'fr' ? 'Confirmer' : 'Confirm'}</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-5 h-5 text-zinc-500" />
                  <input 
                    type="password" 
                    required
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
                    placeholder="••••••••"
                    className={`w-full pl-11 pr-4 py-3 bg-[#1A1A1A] border rounded-xl text-white focus:outline-none transition-colors ${
                      password !== confirmPassword && confirmPassword.length > 0 ? 'border-red-500/50' : 'border-[#333333] focus:border-[#D4A017]'
                    }`}
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading || success}
              className="w-full flex items-center justify-center gap-2 bg-[#D4A017] hover:bg-[#b88a10] text-[#1C1C1C] py-3.5 mt-2 rounded-xl font-black text-sm uppercase tracking-wide transition-all active:scale-[0.98] disabled:opacity-70"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-[#1C1C1C] border-t-transparent rounded-full animate-spin" />
              ) : (
                language === 'fr' ? "S'inscrire" : "Sign Up"
              )}
            </button>
          </form>

          <div className="text-center pt-6 border-t border-[#2D2D2D]">
            <button 
              onClick={onNavigateLogin} 
              className="flex items-center justify-center gap-2 w-full text-zinc-400 hover:text-white transition-colors text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              {language === 'fr' ? 'Retour à la connexion' : 'Back to Login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};