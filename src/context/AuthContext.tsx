import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { supabase } from '../services/supabase';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (role: UserRole) => void; // Conservé pour la compatibilité des types, mais géré par Supabase
  logout: () => void;
  hasPermission: (moduleName: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null, 
  loading: true, // On démarre en mode "chargement" le temps de vérifier Supabase
  login: () => {},
  logout: () => {},
  hasPermission: () => false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Vérifier s'il y a déjà une session active au lancement de l'app
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await fetchProfile(session.user.id, session.user.email);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Erreur de session Supabase:", error);
        setLoading(false);
      }
    };

    checkSession();

    // 2. Écouter en temps réel les connexions/déconnexions
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await fetchProfile(session.user.id, session.user.email);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fonction pour récupérer les données de la table "profiles" (Nom, Rôle, etc.)
  const fetchProfile = async (userId: string, email?: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data && !error) {
        setUser({
          uid: data.id,
          email: data.email,
          displayName: data.display_name,
          role: data.role as UserRole,
          avatarUrl: data.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        });
      }
    } catch (error) {
      console.error("Erreur lors de la récupération du profil:", error);
    } finally {
      setLoading(false);
    }
  };

  const login = (role: UserRole) => {
    // Ne fait plus rien ici. La vraie connexion se fait dans Login.tsx avec Supabase.
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // Role-Based Permissions
  const hasPermission = (moduleName: string): boolean => {
    if (!user) return false;
    if ((user.role as string) === 'ADMIN') return true;

    switch (moduleName) {
      case 'dashboard':
        return ['ADMIN', 'MANAGER', 'ACCOUNTING'].includes(user.role);
      case 'clients':
      case 'reservations':
      case 'fleet':
      case 'maintenance':
      case 'equipment':
        return ['ADMIN', 'MANAGER', 'STAFF'].includes(user.role);
      case 'tours':
      case 'investments':
        return ['ADMIN', 'MANAGER'].includes(user.role);
      case 'finance':
      case 'accounting':
      case 'agencies':
      case 'suppliers':
      case 'reports':
        return ['ADMIN', 'MANAGER', 'ACCOUNTING'].includes(user.role);
      case 'settings':
      case 'audit':
        return (user.role as string) === 'ADMIN';
      default:
        return true;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasPermission }}>
      {/* On n'affiche l'application que lorsque Supabase a fini de charger l'utilisateur */}
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);