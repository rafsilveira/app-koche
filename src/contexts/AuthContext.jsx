import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../services/firebase';
import {
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    RecaptchaVerifier,
    linkWithPhoneNumber
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
            const result = await signInWithPopup(auth, provider);
            // Check if user exists in Firestore, if not create basic record
            const userDocRef = doc(db, "users", result.user.uid);
            const userSnap = await getDoc(userDocRef);

            if (!userSnap.exists()) {
                // Create basic profile from Google data
                const newUser = {
                    name: result.user.displayName,
                    email: result.user.email,
                    createdAt: new Date(),
                };
                await setDoc(userDocRef, newUser);

                // If the user already has a phone (unlikely from Google alone, but possible), send lead
                // But usually we wait for the ProfileForm to capture the phone
            }
        } catch (error) {
            console.error("Login failed", error);
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
        const userDocRef = doc(db, "users", currentUser.uid);
        await setDoc(userDocRef, data, { merge: true });

        // Update local state
        setUserProfile(prev => ({ ...prev, ...data }));

        // INTEGRATION: Send lead if we have a phone number now
        if (data.phone) {
            sendLeadToExternal({
                name: currentUser.displayName,
                email: currentUser.email,
                phone: data.phone,
                uid: currentUser.uid
            });
        }
    };

    useEffect(() => {
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
                    setUserProfile(null);
                }
            } else {
                setUserProfile(null);
                setIsAdmin(false);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    // Initial setup for Recaptcha
    const setupRecaptcha = (elementId) => {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, elementId, {
                'size': 'invisible', // or 'normal'
                'callback': (response) => {
                    // reCAPTCHA solved
                }
            });
        }
        return window.recaptchaVerifier;
    };

    // Link Phone Number (Send SMS)
    const startPhoneVerification = async (phoneNumber, recaptchaVerifier) => {
        try {
            // This returns a confirmationResult object with a .confirm(otp) method
            return await linkWithPhoneNumber(currentUser, phoneNumber, recaptchaVerifier);
        } catch (error) {
            console.error("Error sending SMS:", error);
            throw error;
        }
    };

    const value = {
        currentUser,
        userProfile,
        loginGoogle,
        logout,
        updateProfileData,
        setupRecaptcha,
        startPhoneVerification,
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
