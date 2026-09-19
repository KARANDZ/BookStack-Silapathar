import { createContext, useContext, useEffect, useState, useRef } from 'react';
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

  // Sequence ref to prevent concurrent auth/profile initializations from overwriting each other
  const requestIdRef = useRef(0);

  async function fetchUserProfile(authUser) {
    const currentRequestId = ++requestIdRef.current;

    if (!authUser) {
      if (currentRequestId === requestIdRef.current) {
        setProfile(null);
        setRole('USER');
        setLoading(false);
      }
      return { profile: null, role: 'USER' };
    }

    let fetchedProfile = null;
    let fetchedRole = 'USER';

    try {
      // Enforce a 4-second timeout on user profile lookup so network stalls do not block auth init
      const dbQueryPromise = supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile fetch timeout')), 4000)
      );

      const res = await Promise.race([dbQueryPromise, timeoutPromise]);
      const data = res?.data;
      const error = res?.error;

      if (error) {
        console.warn('Error fetching user profile record:', error.message);
      }

      if (data) {
        fetchedProfile = data;
        // Strictly use database assigned role, defaulting to USER
        fetchedRole = data.role || 'USER';
      } else {
        fetchedRole = 'USER';
      }
    } catch (err) {
      // Log error silently for debugging; default role to USER safely without elevating permissions
      console.warn('Profile fetch exception/timeout:', err?.message || err);
      fetchedProfile = null;
      fetchedRole = 'USER';
    }

    if (currentRequestId === requestIdRef.current) {
      setProfile(fetchedProfile);
      setRole(fetchedRole);
      setLoading(false);
    }

    return { profile: fetchedProfile, role: fetchedRole };
  }

  useEffect(() => {
    let isMounted = true;

    // Safety timeout: Guarantee auth loading turns false within 5 seconds even on slow mobile initialization
    const initSafetyTimer = setTimeout(() => {
      if (isMounted) {
        setLoading((prevLoading) => {
          if (prevLoading) {
            console.warn('Auth initialization safety fallback triggered after 5 seconds.');
            return false;
          }
          return prevLoading;
        });
      }
    }, 5000);

    // 1. Initial Session Check
    async function getInitialSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isMounted) {
          setUser(session.user);
          await fetchUserProfile(session.user);
        } else if (isMounted) {
          setLoading(false);
        }
      } catch (err) {
        console.warn('Initial session check error:', err?.message || err);
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    getInitialSession();

    // 2. Listen to Auth State Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

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
      isMounted = false;
      clearTimeout(initSafetyTimer);
      subscription?.unsubscribe();
    };
  }, []);

  // Sign Up Handler - Strictly enforces default 'USER' role
  async function signUp({ email, password, name }) {
    setLoading(true);
    try {
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
        const res = await fetchUserProfile(data.user);
        setLoading(false);
        return { ...data, profile: res.profile, role: res.role };
      }
      setLoading(false);
      return data;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  }

  // Sign In Handler - Returns resolved user profile & role directly
  async function signIn({ email, password }) {
    setLoading(true);
    try {
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
        const res = await fetchUserProfile(data.user);
        setLoading(false);
        return {
          ...data,
          profile: res.profile,
          role: res.role,
        };
      }
      setLoading(false);
      return { ...data, role: 'USER' };
    } catch (err) {
      setLoading(false);
      throw err;
    }
  }

  // Sign Out Handler - Clears user state & safely navigates home
  async function signOut() {
    setLoading(true);
    // Increment request ID to invalidate any in-flight profile queries
    requestIdRef.current++;
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('SignOut exception:', err?.message || err);
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
