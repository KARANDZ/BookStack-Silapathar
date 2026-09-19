import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';

const AuthContext = createContext({
  user: null,
  profile: null,
  role: 'USER',
  loading: true,
  signUp: async () => {},
  signIn: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState('USER');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  async function fetchUserProfile(authUser) {
    if (!authUser) {
      setProfile(null);
      setRole('USER');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error);
      }

      if (data) {
        setProfile(data);
        setRole(data.role || 'USER');
      } else {
        setRole('USER');
      }
    } catch (err) {
      console.error('Fetch profile exception:', err);
    }
    setLoading(false);
  }

  useEffect(() => {
    // 1. Initial Session Check
    async function getInitialSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          await fetchUserProfile(session.user);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Session error:', err);
        setLoading(false);
      }
    }

    getInitialSession();

    // 2. Listen to Auth State Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setProfile(null);
        setRole('USER');
        setLoading(false);
        return;
      }

      const currentUser = session?.user || null;
      setUser(currentUser);
      if (currentUser) {
        await fetchUserProfile(currentUser);
      } else {
        setProfile(null);
        setRole('USER');
        setLoading(false);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Sign Up Handler - Strictly enforces default 'USER' role
  async function signUp({ email, password, name }) {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          name: name,
          role: 'USER',
        },
      },
    });

    if (error) {
      setLoading(false);
      throw error;
    }

    if (data.user) {
      setUser(data.user);
      await supabase.from('users').upsert({
        id: data.user.id,
        email: email,
        name: name,
        role: 'USER',
      });
      await fetchUserProfile(data.user);
    }
    setLoading(false);
    return data;
  }

  // Sign In Handler
  async function signIn({ email, password }) {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      throw error;
    }

    if (data.user) {
      setUser(data.user);
      await fetchUserProfile(data.user);
    }
    setLoading(false);
    return data;
  }

  // Sign Out Handler - Clears all user state & safely navigates home
  async function signOut() {
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('SignOut error:', err);
    } finally {
      setUser(null);
      setProfile(null);
      setRole('USER');
      setLoading(false);
      router.push('/');
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        loading,
        signUp,
        signIn,
        signOut,
        refreshProfile: () => fetchUserProfile(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
