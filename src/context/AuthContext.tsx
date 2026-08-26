import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  UserProfile, 
  UserRole, 
  ConfigurableSection, 
  RolePermissionsMap, 
  DEFAULT_ROLE_PERMISSIONS 
} from '../types';
import { INITIAL_STAFF } from '../data/seedData';
import { auth, googleProvider, db } from '../firebase/config';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as fbSignOut, 
  onAuthStateChanged, 
  GoogleAuthProvider,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  getDoc,
  getDocs,
  setDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  where
} from 'firebase/firestore';

interface AuthContextType {
  currentUser: UserProfile | null;
  firebaseUser: FirebaseUser | null;
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

// In-memory token cache as required by OAuth workspace guidelines
let inMemoryGoogleToken: string | null = null;

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

  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
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

  // Firestore real-time sync for role permissions
  useEffect(() => {
    const unsubscribePermissions = onSnapshot(doc(db, 'settings', 'role_permissions'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as RolePermissionsMap;
        if (data && typeof data === 'object') {
          const merged: RolePermissionsMap = {
            ...DEFAULT_ROLE_PERMISSIONS,
            ...data
          };
          setRolePermissions(merged);
          localStorage.setItem('rugby_role_permissions', JSON.stringify(merged));
        }
      } else {
        // Bootstrap initial role permissions in Firestore
        setDoc(doc(db, 'settings', 'role_permissions'), DEFAULT_ROLE_PERMISSIONS).catch(() => {});
      }
    }, (error) => {
      console.warn('Role permissions Firestore listener warning:', error);
    });

    return () => unsubscribePermissions();
  }, []);

  // Update a specific section flag for a role
  const updateRolePermission = async (role: UserRole, section: ConfigurableSection, enabled: boolean) => {
    setRolePermissions(prev => {
      const updated: RolePermissionsMap = {
        ...prev,
        [role]: {
          ...prev[role],
          [section]: enabled
        }
      };
      localStorage.setItem('rugby_role_permissions', JSON.stringify(updated));
      setDoc(doc(db, 'settings', 'role_permissions'), updated, { merge: true }).catch(err => {
        console.warn('Failed to update role permissions in Firestore:', err);
      });
      return updated;
    });
  };

  // Reset all permissions to club defaults
  const resetRolePermissionsToDefault = async () => {
    setRolePermissions(DEFAULT_ROLE_PERMISSIONS);
    localStorage.setItem('rugby_role_permissions', JSON.stringify(DEFAULT_ROLE_PERMISSIONS));
    try {
      await setDoc(doc(db, 'settings', 'role_permissions'), DEFAULT_ROLE_PERMISSIONS);
    } catch (err) {
      console.warn('Failed to reset role permissions in Firestore:', err);
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

  // Firestore real-time sync for staff users
  useEffect(() => {
    const unsubscribeStaff = onSnapshot(collection(db, 'staff_users'), (snapshot) => {
      if (!snapshot.empty) {
        const fetched = snapshot.docs.map(doc => doc.data() as UserProfile);
        const cleaned = cleanLegacyStaff(fetched);
        setStaffUsersState(cleaned);
        localStorage.setItem('rugby_staff_users', JSON.stringify(cleaned));
      } else {
        // Initialize INITIAL_STAFF to Firestore
        INITIAL_STAFF.forEach(staff => {
          setDoc(doc(db, 'staff_users', staff.id), staff, { merge: true }).catch(() => {});
        });
      }
    }, (error) => {
      console.warn('Staff users subscription fallback:', error);
    });

    return () => unsubscribeStaff();
  }, []);

  // Sync staff to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem('rugby_staff_users', JSON.stringify(staffUsers));
  }, [staffUsers]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user && user.email) {
        const userEmail = user.email.toLowerCase();
        
        // 1. Check if it's Gianni Grespan (Root Admin & Head Coach)
        if (userEmail === 'gianni.grespan@gmail.com') {
          const adminProf: UserProfile = {
            id: user.uid,
            email: user.email,
            name: user.displayName || 'Gianni Grespan (Admin & Head Coach)',
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
          setDoc(doc(db, 'staff_users', 'staff-gianni-grespan'), adminProf, { merge: true }).catch(() => {});
          setDoc(doc(db, 'users', user.uid), adminProf, { merge: true }).catch(() => {});
          setIsLoading(false);
          return;
        }

        // 2. Check in staff_users list
        const foundStaff = staffUsers.find(u => u.email.toLowerCase() === userEmail);
        if (foundStaff) {
          setCurrentUser(foundStaff);
          localStorage.setItem('rugby_current_user', JSON.stringify(foundStaff));
          setDoc(doc(db, 'users', user.uid), foundStaff, { merge: true }).catch(() => {});
          setIsLoading(false);
          return;
        }

        // 3. Query Firestore 'players' collection (Roster)
        try {
          const playerSnap = await getDocs(query(collection(db, 'players'), where('email', '==', userEmail)));
          if (!playerSnap.empty) {
            const playerProfile = playerSnap.docs[0].data() as UserProfile;
            setCurrentUser(playerProfile);
            localStorage.setItem('rugby_current_user', JSON.stringify(playerProfile));
            setDoc(doc(db, 'users', user.uid), playerProfile, { merge: true }).catch(() => {});
            setIsLoading(false);
            return;
          }
        } catch (err) {
          console.warn('Firestore player search warning:', err);
        }

        // 4. Query Firestore 'users' collection
        try {
          const userDocSnap = await getDoc(doc(db, 'users', user.uid));
          if (userDocSnap.exists()) {
            const existingUser = userDocSnap.data() as UserProfile;
            setCurrentUser(existingUser);
            localStorage.setItem('rugby_current_user', JSON.stringify(existingUser));
            setIsLoading(false);
            return;
          }
        } catch (err) {
          console.warn('Firestore user profile query warning:', err);
        }

        // 5. Default new user profile
        const newProfile: UserProfile = {
          id: user.uid,
          email: user.email,
          name: user.displayName || user.email.split('@')[0],
          role: 'player',
          position: 'Primo Centro (12)',
          department: 'trequarti',
          status: 'fit',
          createdAt: new Date().toISOString()
        };
        setCurrentUser(newProfile);
        localStorage.setItem('rugby_current_user', JSON.stringify(newProfile));
        setDoc(doc(db, 'users', user.uid), newProfile, { merge: true }).catch(() => {});
      } else {
        inMemoryGoogleToken = null;
        setGoogleAccessToken(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
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
      await setDoc(doc(db, 'staff_users', newId), newMember);
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
      await setDoc(doc(db, 'staff_users', member.id), member, { merge: true });
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
          role: isAdmin && s.role === 'player' ? 'admin' : s.role
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
        role: isAdmin && currentUser.role === 'player' ? 'admin' : currentUser.role
      };
      setCurrentUser(updatedUser);
      localStorage.setItem('rugby_current_user', JSON.stringify(updatedUser));
    }

    if (targetMember) {
      try {
        await setDoc(doc(db, 'staff_users', staffId), targetMember, { merge: true });
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
        await setDoc(doc(db, 'staff_users', staffId), targetMember, { merge: true });
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
      await deleteDoc(doc(db, 'staff_users', staffId));
    } catch (e) {
      console.warn('Staff delete cloud error:', e);
    }
  };

  const clearStaffMembers = async () => {
    setStaffUsersState([]);
    localStorage.setItem('rugby_staff_users', JSON.stringify([]));
  };

  const loginWithGoogle = async (): Promise<string | null> => {
    try {
      setIsLoading(true);
      const res = await signInWithPopup(auth, googleProvider);
      let token: string | null = null;
      const credential = GoogleAuthProvider.credentialFromResult(res);
      if (credential?.accessToken) {
        token = credential.accessToken;
        inMemoryGoogleToken = token;
        setGoogleAccessToken(token);
      }

      if (res.user && res.user.email) {
        const found = staffUsers.find(u => u.email.toLowerCase() === res.user.email?.toLowerCase());
        const userProf = found || {
          id: res.user.uid,
          email: res.user.email,
          name: res.user.displayName || 'Membro Staff',
          role: 'head_coach' as UserRole,
          isAdmin: res.user.email.toLowerCase() === 'gianni.grespan@gmail.com',
          position: 'Staff Tecnico' as const,
          department: 'staff' as const,
          status: 'fit' as const,
          createdAt: new Date().toISOString()
        };
        setCurrentUser(userProf);
        localStorage.setItem('rugby_current_user', JSON.stringify(userProf));
      }
      return token;
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
      await signInWithEmailAndPassword(auth, email, pass);
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
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      const isRootAdmin = email.toLowerCase() === 'gianni.grespan@gmail.com';
      const newProf: UserProfile = {
        id: res.user.uid,
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
      await setDoc(doc(db, 'users', res.user.uid), newProf, { merge: true });
      if (role !== 'player' || isRootAdmin) {
        await setDoc(doc(db, 'staff_users', res.user.uid), newProf, { merge: true });
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
      await fbSignOut(auth);
    } catch (e) {
      // ignore
    }
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
      firebaseUser,
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
