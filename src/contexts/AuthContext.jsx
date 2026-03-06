import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../services/firebase';
import {
    GoogleAuthProvider,
    signInWithRedirect,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    getRedirectResult,
    updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, getDocs, collection } from 'firebase/firestore';
import { sendLeadToExternal } from '../services/leads';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    // ADMIN EMAIL
    const ADMIN_EMAIL = "rafsilveira@gmail.com";

    // Sign in with Google
    const loginGoogle = async () => {
        const provider = new GoogleAuthProvider();
        try {
            // Try popup first (works best on desktop, fails on some mobile ad-blockers/in-app browsers)
            const result = await signInWithPopup(auth, provider);

            // If successful via popup, ensure user profile exists
            const userDocRef = doc(db, "users", result.user.uid);
            const userSnap = await getDoc(userDocRef);

            if (!userSnap.exists()) {
                const newUser = {
                    name: result.user.displayName || result.user.email?.split('@')[0] || 'Usuário',
                    email: result.user.email,
                    createdAt: new Date(),
                };
                await setDoc(userDocRef, newUser);
            }
        } catch (error) {
            console.error("Popup failed", error);
            // If popup is blocked or not supported, fallback to redirect
            if (error.code === 'auth/popup-blocked' || error.code === 'auth/unauthorized-domain') {
                await signInWithRedirect(auth, provider);
            } else {
                throw error;
            }
        }
    };

    // Sign in with Email/Password
    const loginEmailPassword = async (email, password) => {
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            return result;
        } catch (error) {
            console.error("Email login failed", error);
            throw error;
        }
    };

    // Sign up with Email/Password
    const signupEmailPassword = async (email, password, name) => {
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            const userDocRef = doc(db, "users", result.user.uid);
            const newUser = {
                name: name,
                email: email,
                createdAt: new Date(),
            };
            await setDoc(userDocRef, newUser);
            return result;
        } catch (error) {
            console.error("Email signup failed", error);
            throw error;
        }
    };

    // Logout
    const logout = () => {
        return signOut(auth);
    };

    // Update Profile (e.g. adding phone)
    const updateProfileData = async (data) => {
        if (!currentUser) return;

        // 1. Update Firestore Document
        const userDocRef = doc(db, "users", currentUser.uid);
        await setDoc(userDocRef, data, { merge: true });

        // 2. Update Firebase Auth Profile (if name changed)
        if (data.name && data.name !== currentUser.displayName) {
            try {
                await updateProfile(currentUser, { displayName: data.name });
            } catch (err) {
                console.error("Error updating firebase auth profile", err);
            }
        }

        // 3. Update local state
        setUserProfile(prev => ({ ...prev, ...data }));

        // 4. INTEGRATION: Send lead if we have a phone number now
        if (data.phone) {
            sendLeadToExternal({
                name: data.name || currentUser.displayName,
                email: currentUser.email,
                phone: data.phone,
                uid: currentUser.uid
            });
        }
    };

    useEffect(() => {
        // Handle the result from signInWithRedirect if it was used
        const handleRedirect = async () => {
            try {
                const result = await getRedirectResult(auth);
                if (result && result.user) {
                    const userDocRef = doc(db, "users", result.user.uid);
                    const userSnap = await getDoc(userDocRef);
                    if (!userSnap.exists()) {
                        const newUser = {
                            name: result.user.displayName || result.user.email?.split('@')[0] || 'Usuário',
                            email: result.user.email,
                            createdAt: new Date(),
                        };
                        await setDoc(userDocRef, newUser);
                    }
                }
            } catch (err) {
                console.error("Redirect result error:", err);
            }
        };

        handleRedirect();

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                // Check Admin (Hardcoded OR Firestore)
                let isAdminUser = user.email === ADMIN_EMAIL;

                if (!isAdminUser) {
                    // Check Firestore 'admins' collection
                    try {
                        const adminsSnap = await getDocs(collection(db, "admins"));
                        const adminEmails = adminsSnap.docs.map(doc => doc.data().email);
                        if (adminEmails.includes(user.email)) {
                            isAdminUser = true;
                        }
                    } catch (e) {
                        console.error("Error checking admin collection", e);
                    }
                }

                setIsAdmin(isAdminUser);

                // Fetch extra profile data (phone, etc)
                const userDocRef = doc(db, "users", user.uid);
                const userSnap = await getDoc(userDocRef);
                if (userSnap.exists()) {
                    setUserProfile(userSnap.data());
                } else {
                    // Give a tiny delay in case redirect result is still writing
                    setTimeout(async () => {
                        const snap = await getDoc(userDocRef);
                        if (snap.exists()) {
                            setUserProfile(snap.data());
                        } else {
                            setUserProfile(null);
                        }
                    }, 1000);
                }
            } else {
                setUserProfile(null);
                setIsAdmin(false);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        userProfile,
        loginGoogle,
        loginEmailPassword,
        signupEmailPassword,
        logout,
        updateProfileData,
        loading,
        isAdmin
    };

    return (
        <AuthContext.Provider value={value}>
            {loading ? (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                    width: '100vw',
                    background: '#05020a',
                    color: '#fff',
                    gap: '1rem',
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    zIndex: 9999
                }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '4px solid rgba(255,255,255,0.3)',
                        borderTop: '4px solid #e31e24',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }}></div>
                    <p style={{ fontFamily: 'sans-serif' }}>Carregando...</p>
                    <style>{`
                        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                    `}</style>
                </div>
            ) : children}
        </AuthContext.Provider>
    );
}
