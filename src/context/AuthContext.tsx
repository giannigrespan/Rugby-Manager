import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserProfile,
  UserRole,
  ConfigurableSection,
  RolePermissionsMap,
  DEFAULT_ROLE_PERMISSIONS
} from '../types';
import { INITIAL_STAFF } from '../data/seedData';
import { supabase } from '../supabase/config';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextType {
  currentUser: UserProfile | null;
  supabaseUser: SupabaseUser | null;
  staffUsers: UserProfile[];
  googleAccessToken: string | null;
  isLoading: boolean;
  rolePermissions: RolePermissionsMap;
  isSectionVisibleForUser: (section: ConfigurableSection, user?: UserProfile | null) => boolean;
  updateRolePermission: (role: UserRole, section: ConfigurableSection, enabled: boolean) => Promise<void>;
  resetRolePermissionsToDefault: () => Promise<void>;
  loginWithGoogle: () => Promise<string | null>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  updateCurrentUserProfile: (updates: Partial<UserProfile>) => void;
  setStaffList: (list: UserProfile[]) => void;
  addStaffMember: (member: Omit<UserProfile, 'id' | 'createdAt'>) => Promise<void>;
  updateStaffMember: (member: UserProfile) => Promise<void>;
  toggleStaffAdmin: (staffId: string, isAdmin: boolean) => Promise<void>;
  updateStaffRole: (staffId: string, role: UserRole) => Promise<void>;
  deleteStaffMember: (staffId: string) => Promise<void>;
  clearStaffMembers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// In-memory token cache: Supabase only hands back the Google provider token
// once, right after the OAuth redirect completes.
let inMemoryGoogleToken: string | null = null;

const ROLE_PERMISSIONS_ROW_ID = 'default';

// Filter out old legacy dummy staff IDs
const cleanLegacyStaff = (list: UserProfile[]): UserProfile[] => {
  const legacyIds = new Set(['staff-1', 'staff-2', 'staff-3', 'staff-4']);
  const legacyEmails = new Set([
    'headcoach@rugbyfemminile.it',
    'trainer@rugbyfemminile.it',
    'physio@rugbyfemminile.it',
    'admin@rugbyfemminile.it'
  ]);
  return list.filter(u => !legacyIds.has(u.id) && !legacyEmails.has(u.email.toLowerCase()));
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [staffUsers, setStaffUsersState] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('rugby_staff_users');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const cleaned = cleanLegacyStaff(parsed);
          if (cleaned.length > 0) return cleaned;
        }
      } catch (e) {
        // fallback
      }
    }
    return INITIAL_STAFF;
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('rugby_current_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && !parsed.email?.includes('@rugbyfemminile.it')) {
          return parsed;
        }
      } catch (e) {
        // fallback
      }
    }
    return INITIAL_STAFF[0] || null;
  });

  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Role permissions matrix state
  const [rolePermissions, setRolePermissions] = useState<RolePermissionsMap>(() => {
    const saved = localStorage.getItem('rugby_role_permissions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            ...DEFAULT_ROLE_PERMISSIONS,
            ...parsed
          };
        }
      } catch (e) {
        // fallback
      }
    }
    return DEFAULT_ROLE_PERMISSIONS;
  });

  // Supabase real-time sync for role permissions
  useEffect(() => {
    const loadRolePermissions = async () => {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .eq('id', ROLE_PERMISSIONS_ROW_ID)
        .maybeSingle();

      if (error) {
        console.warn('Role permissions Supabase read warning:', error);
        return;
      }

      if (data) {
        const merged: RolePermissionsMap = {
          ...DEFAULT_ROLE_PERMISSIONS,
          ...(data.permissions as RolePermissionsMap)
        };
        setRolePermissions(merged);
        localStorage.setItem('rugby_role_permissions', JSON.stringify(merged));
      } else {
        // Bootstrap initial role permissions in Supabase
        await supabase
          .from('role_permissions')
          .upsert({ id: ROLE_PERMISSIONS_ROW_ID, permissions: DEFAULT_ROLE_PERMISSIONS })
          .then(({ error: upsertError }) => {
            if (upsertError) console.warn('Role permissions bootstrap warning:', upsertError);
          });
      }
    };

    loadRolePermissions();

    const channel = supabase
      .channel('role_permissions-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'role_permissions' },
        () => loadRolePermissions()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Update a specific section flag for a role
  const updateRolePermission = async (role: UserRole, section: ConfigurableSection, enabled: boolean) => {
    let updatedMap: RolePermissionsMap | null = null;
    setRolePermissions(prev => {
      const updated: RolePermissionsMap = {
        ...prev,
        [role]: {
          ...prev[role],
          [section]: enabled
        }
      };
      localStorage.setItem('rugby_role_permissions', JSON.stringify(updated));
      updatedMap = updated;
      return updated;
    });

    if (updatedMap) {
      const { error } = await supabase
        .from('role_permissions')
        .upsert({ id: ROLE_PERMISSIONS_ROW_ID, permissions: updatedMap });
      if (error) console.warn('Failed to update role permissions in Supabase:', error);
    }
  };

  // Reset all permissions to club defaults
  const resetRolePermissionsToDefault = async () => {
    setRolePermissions(DEFAULT_ROLE_PERMISSIONS);
    localStorage.setItem('rugby_role_permissions', JSON.stringify(DEFAULT_ROLE_PERMISSIONS));
    try {
      const { error } = await supabase
        .from('role_permissions')
        .upsert({ id: ROLE_PERMISSIONS_ROW_ID, permissions: DEFAULT_ROLE_PERMISSIONS });
      if (error) throw error;
    } catch (err) {
      console.warn('Failed to reset role permissions in Supabase:', err);
    }
  };

  // Check if a section is visible for a specific user profile (or current user / guest)
  const isSectionVisibleForUser = (section: ConfigurableSection, user: UserProfile | null = currentUser): boolean => {
    // If not logged in, fall back to player permissions
    if (!user) {
      return rolePermissions['player']?.[section] ?? DEFAULT_ROLE_PERMISSIONS['player']?.[section] ?? true;
    }
    // Full Administrator always has access to all sections
    if (user.isAdmin || user.role === 'admin') {
      return true;
    }
    const role = user.role || 'player';
    return rolePermissions[role]?.[section] ?? DEFAULT_ROLE_PERMISSIONS[role]?.[section] ?? true;
  };

  // Supabase real-time sync for staff users
  useEffect(() => {
    const loadStaffUsers = async () => {
      const { data, error } = await supabase.from('staff_users').select('*');
      if (error) {
        console.warn('Staff users Supabase read warning:', error);
        return;
      }

      if (data && data.length > 0) {
        const cleaned = cleanLegacyStaff(data as UserProfile[]);
        setStaffUsersState(cleaned);
        localStorage.setItem('rugby_staff_users', JSON.stringify(cleaned));
      } else {
        // Initialize INITIAL_STAFF in Supabase
        const { error: seedError } = await supabase.from('staff_users').upsert(INITIAL_STAFF);
        if (seedError) console.warn('Staff users seed warning:', seedError);
      }
    };

    loadStaffUsers();

    const channel = supabase
      .channel('staff_users-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'staff_users' },
        () => loadStaffUsers()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Sync staff to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem('rugby_staff_users', JSON.stringify(staffUsers));
  }, [staffUsers]);

  useEffect(() => {
    const resolveProfile = async (user: SupabaseUser | null) => {
      if (!user || !user.email) {
        inMemoryGoogleToken = null;
        setGoogleAccessToken(null);
        setIsLoading(false);
        return;
      }

      const userEmail = user.email.toLowerCase();

      // 1. Check if it's Gianni Grespan (Root Admin & Head Coach)
      if (userEmail === 'gianni.grespan@gmail.com') {
        const adminProf: UserProfile = {
          id: user.id,
          email: user.email,
          name: (user.user_metadata?.full_name as string) || 'Gianni Grespan (Admin & Head Coach)',
          role: 'head_coach',
          isAdmin: true,
          position: 'Staff Tecnico',
          department: 'staff',
          status: 'fit',
          createdAt: new Date().toISOString(),
          notes: 'Responsabile e Amministratore Rugby Villorba'
        };
        setCurrentUser(adminProf);
        localStorage.setItem('rugby_current_user', JSON.stringify(adminProf));
        supabase.from('staff_users').upsert({ ...adminProf, id: 'staff-gianni-grespan' }).then(({ error }) => {
          if (error) console.warn('Admin staff upsert warning:', error);
        });
        supabase.from('user_accounts').upsert(adminProf).then(({ error }) => {
          if (error) console.warn('Admin user_accounts upsert warning:', error);
        });
        setIsLoading(false);
        return;
      }

      // 2. Check in staff_users list
      const foundStaff = staffUsers.find(u => u.email.toLowerCase() === userEmail);
      if (foundStaff) {
        setCurrentUser(foundStaff);
        localStorage.setItem('rugby_current_user', JSON.stringify(foundStaff));
        supabase.from('user_accounts').upsert({ ...foundStaff, id: user.id }).then(({ error }) => {
          if (error) console.warn('Staff user_accounts upsert warning:', error);
        });
        setIsLoading(false);
        return;
      }

      // 3. Query Supabase 'players' table (Roster)
      try {
        const { data: playerRows, error } = await supabase
          .from('players')
          .select('*')
          .eq('email', userEmail)
          .limit(1);
        if (error) throw error;
        if (playerRows && playerRows.length > 0) {
          const playerProfile = playerRows[0] as UserProfile;
          setCurrentUser(playerProfile);
          localStorage.setItem('rugby_current_user', JSON.stringify(playerProfile));
          supabase.from('user_accounts').upsert({ ...playerProfile, id: user.id }).then(({ error: upsertError }) => {
            if (upsertError) console.warn('Player user_accounts upsert warning:', upsertError);
          });
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Supabase player search warning:', err);
      }

      // 4. Query Supabase 'user_accounts' table
      try {
        const { data: existingUser, error } = await supabase
          .from('user_accounts')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        if (error) throw error;
        if (existingUser) {
          setCurrentUser(existingUser as UserProfile);
          localStorage.setItem('rugby_current_user', JSON.stringify(existingUser));
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Supabase user profile query warning:', err);
      }

      // 5. Default new user profile
      const newProfile: UserProfile = {
        id: user.id,
        email: user.email,
        name: (user.user_metadata?.full_name as string) || user.email.split('@')[0],
        role: 'player',
        position: 'Primo Centro (12)',
        department: 'trequarti',
        status: 'fit',
        createdAt: new Date().toISOString()
      };
      setCurrentUser(newProfile);
      localStorage.setItem('rugby_current_user', JSON.stringify(newProfile));
      supabase.from('user_accounts').upsert(newProfile).then(({ error }) => {
        if (error) console.warn('New profile user_accounts upsert warning:', error);
      });
      setIsLoading(false);
    };

    // Resolve whatever session is already active on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSupabaseUser(session?.user ?? null);
      if (session?.provider_token) {
        inMemoryGoogleToken = session.provider_token;
        setGoogleAccessToken(session.provider_token);
      }
      resolveProfile(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSupabaseUser(session?.user ?? null);

      if (session?.provider_token) {
        inMemoryGoogleToken = session.provider_token;
        setGoogleAccessToken(session.provider_token);
      }

      if (event === 'SIGNED_OUT') {
        inMemoryGoogleToken = null;
        setGoogleAccessToken(null);
      }

      resolveProfile(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [staffUsers]);

  const setStaffList = (list: UserProfile[]) => {
    const cleaned = cleanLegacyStaff(list);
    setStaffUsersState(cleaned);
    localStorage.setItem('rugby_staff_users', JSON.stringify(cleaned));
  };

  const addStaffMember = async (memberData: Omit<UserProfile, 'id' | 'createdAt'>) => {
    const newId = `staff-${Date.now().toString().slice(-6)}`;
    const newMember: UserProfile = {
      ...memberData,
      id: newId,
      position: 'Staff Tecnico',
      department: 'staff',
      status: 'fit',
      createdAt: new Date().toISOString()
    };
    setStaffUsersState(prev => [newMember, ...prev]);
    try {
      const { error } = await supabase.from('staff_users').upsert(newMember);
      if (error) throw error;
    } catch (e) {
      console.warn('Staff member cloud write error:', e);
    }
  };

  const updateStaffMember = async (member: UserProfile) => {
    setStaffUsersState(prev => prev.map(s => s.id === member.id ? member : s));
    if (currentUser?.id === member.id) {
      setCurrentUser(member);
      localStorage.setItem('rugby_current_user', JSON.stringify(member));
    }
    try {
      const { error } = await supabase.from('staff_users').upsert(member);
      if (error) throw error;
    } catch (e) {
      console.warn('Staff member update cloud error:', e);
    }
  };

  const toggleStaffAdmin = async (staffId: string, isAdmin: boolean) => {
    let targetMember: UserProfile | undefined;
    setStaffUsersState(prev => prev.map(s => {
      if (s.id === staffId) {
        const updated = {
          ...s,
          isAdmin,
          role: isAdmin && s.role === 'player' ? 'admin' as UserRole : s.role
        };
        targetMember = updated;
        return updated;
      }
      return s;
    }));

    if (currentUser?.id === staffId) {
      const updatedUser = {
        ...currentUser,
        isAdmin,
        role: isAdmin && currentUser.role === 'player' ? 'admin' as UserRole : currentUser.role
      };
      setCurrentUser(updatedUser);
      localStorage.setItem('rugby_current_user', JSON.stringify(updatedUser));
    }

    if (targetMember) {
      try {
        const { error } = await supabase.from('staff_users').upsert(targetMember);
        if (error) throw error;
      } catch (e) {
        console.warn('Staff admin toggle cloud error:', e);
      }
    }
  };

  const updateStaffRole = async (staffId: string, role: UserRole) => {
    let targetMember: UserProfile | undefined;
    setStaffUsersState(prev => prev.map(s => {
      if (s.id === staffId) {
        const updated = {
          ...s,
          role,
          isAdmin: role === 'admin' ? true : s.isAdmin
        };
        targetMember = updated;
        return updated;
      }
      return s;
    }));

    if (currentUser?.id === staffId) {
      const updatedUser = {
        ...currentUser,
        role,
        isAdmin: role === 'admin' ? true : currentUser.isAdmin
      };
      setCurrentUser(updatedUser);
      localStorage.setItem('rugby_current_user', JSON.stringify(updatedUser));
    }

    if (targetMember) {
      try {
        const { error } = await supabase.from('staff_users').upsert(targetMember);
        if (error) throw error;
      } catch (e) {
        console.warn('Staff role update cloud error:', e);
      }
    }
  };

  const deleteStaffMember = async (staffId: string) => {
    setStaffUsersState(prev => prev.filter(s => s.id !== staffId));
    if (currentUser?.id === staffId) {
      const remaining = staffUsers.filter(s => s.id !== staffId);
      const nextUser = remaining.length > 0 ? remaining[0] : null;
      setCurrentUser(nextUser);
      if (nextUser) {
        localStorage.setItem('rugby_current_user', JSON.stringify(nextUser));
      } else {
        localStorage.removeItem('rugby_current_user');
      }
    }
    try {
      const { error } = await supabase.from('staff_users').delete().eq('id', staffId);
      if (error) throw error;
    } catch (e) {
      console.warn('Staff delete cloud error:', e);
    }
  };

  const clearStaffMembers = async () => {
    setStaffUsersState([]);
    localStorage.setItem('rugby_staff_users', JSON.stringify([]));
  };

  const loginWithGoogle = async (): Promise<string | null> => {
    // If we already picked up a provider token from a previous OAuth
    // round-trip in this session, reuse it instead of redirecting again.
    if (inMemoryGoogleToken) {
      return inMemoryGoogleToken;
    }

    try {
      setIsLoading(true);
      // Supabase Google sign-in redirects the whole page to Google and back
      // (there is no popup-with-immediate-token flow like Firebase's).
      // The provider token is picked up in the onAuthStateChange listener
      // above once the user lands back on the app.
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/spreadsheets.readonly',
          queryParams: { prompt: 'select_account' },
          redirectTo: window.location.origin + window.location.pathname
        }
      });
      if (error) throw error;
      return null;
    } catch (err: any) {
      console.warn('Google sign-in error or cancelled:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) throw error;
    } catch (err) {
      // Check in staff list
      const found = staffUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (found) {
        setCurrentUser(found);
        localStorage.setItem('rugby_current_user', JSON.stringify(found));
      } else {
        throw new Error('Credenziali non valide o utente non trovato.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const registerWithEmail = async (email: string, pass: string, name: string, role: UserRole) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: { data: { full_name: name } }
      });
      if (error) throw error;
      if (!data.user) throw new Error('Registrazione non riuscita.');

      const isRootAdmin = email.toLowerCase() === 'gianni.grespan@gmail.com';
      const newProf: UserProfile = {
        id: data.user.id,
        email,
        name,
        role: isRootAdmin ? 'head_coach' : role,
        isAdmin: isRootAdmin,
        position: role === 'player' ? 'Ala Destra (14)' : 'Staff Tecnico',
        department: role === 'player' ? 'trequarti' : 'staff',
        status: 'fit',
        createdAt: new Date().toISOString()
      };
      setCurrentUser(newProf);
      localStorage.setItem('rugby_current_user', JSON.stringify(newProf));
      await supabase.from('user_accounts').upsert(newProf);
      if (role !== 'player' || isRootAdmin) {
        await supabase.from('staff_users').upsert(newProf);
      }
    } catch (err: any) {
      // Local fallback
      const isRootAdmin = email.toLowerCase() === 'gianni.grespan@gmail.com';
      const newProf: UserProfile = {
        id: 'user-' + Date.now(),
        email,
        name,
        role: isRootAdmin ? 'head_coach' : role,
        isAdmin: isRootAdmin,
        position: role === 'player' ? 'Ala Destra (14)' : 'Staff Tecnico',
        department: role === 'player' ? 'trequarti' : 'staff',
        status: 'fit',
        createdAt: new Date().toISOString()
      };
      setCurrentUser(newProf);
      localStorage.setItem('rugby_current_user', JSON.stringify(newProf));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // ignore
    }
    inMemoryGoogleToken = null;
    setGoogleAccessToken(null);
    // Set to null or guest
    setCurrentUser(null);
    localStorage.removeItem('rugby_current_user');
  };

  const updateCurrentUserProfile = (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updates };
    setCurrentUser(updated);
    localStorage.setItem('rugby_current_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      supabaseUser,
      staffUsers,
      googleAccessToken,
      isLoading,
      rolePermissions,
      isSectionVisibleForUser,
      updateRolePermission,
      resetRolePermissionsToDefault,
      loginWithGoogle,
      loginWithEmail,
      registerWithEmail,
      logout,
      updateCurrentUserProfile,
      setStaffList,
      addStaffMember,
      updateStaffMember,
      toggleStaffAdmin,
      updateStaffRole,
      deleteStaffMember,
      clearStaffMembers
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
