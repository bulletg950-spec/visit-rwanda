import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { Profile, STAFF_ROLES } from './types';

interface Ctx { session: Session | null; user: User | null; profile: Profile | null; loading: boolean; isStaff: boolean; role: string; signOut: () => Promise<void>; refreshProfile: () => Promise<void> }
const AuthCtx = createContext<Ctx>({} as Ctx);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); if (!data.session) setLoading(false); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { setSession(s); if (!s) { setProfile(null); setLoading(false); } });
    return () => sub.subscription.unsubscribe();
  }, []);

  const uid = session?.user.id;
  const refreshProfile = useCallback(async () => {
    if (!uid) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
    setProfile((data as Profile) ?? null);
    setLoading(false);
  }, [uid]);
  useEffect(() => { if (uid) { setLoading(true); refreshProfile(); } }, [uid, refreshProfile]);

  const value = useMemo<Ctx>(() => ({
    session, user: session?.user ?? null, profile, loading,
    role: profile?.role ?? 'user',
    isStaff: !!profile && profile.is_active && STAFF_ROLES.includes(profile.role),
    signOut: async () => { await supabase.auth.signOut(); },
    refreshProfile,
  }), [session, profile, loading, refreshProfile]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
