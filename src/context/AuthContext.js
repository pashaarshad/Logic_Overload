"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthChange } from "@/lib/auth";
import { getUserDoc, createUserDoc, getNextTeamNumber } from "@/lib/firestore";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onAuthChange(async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);

                // Check if user doc exists in Firestore
                let userDoc = await getUserDoc(firebaseUser.uid);

                if (!userDoc) {
                    // First login check

                    // Special check for Admin email to prevent Team assignment
                    if (firebaseUser.email === "arshad@logic.com" || firebaseUser.email === "arsh@logic.com") {
                        const newUser = {
                            name: firebaseUser.email.split("@")[0] + " Admin",
                            email: firebaseUser.email,
                            role: "admin",
                            // No team assigned
                        };
                        await createUserDoc(firebaseUser.uid, newUser);
                        userDoc = { id: firebaseUser.uid, ...newUser };
                    } else {
                        // Regular Candidate - Assign Team
                        const teamNumber = await getNextTeamNumber();
                        const newUser = {
                            name: firebaseUser.displayName || firebaseUser.email,
                            email: firebaseUser.email,
                            photoURL: firebaseUser.photoURL || null,
                            team: `Team ${teamNumber}`,
                            teamNumber: teamNumber,
                            role: "candidate",
                        };
                        await createUserDoc(firebaseUser.uid, newUser);
                        userDoc = { id: firebaseUser.uid, ...newUser };
                    }
                } else {
                    // Check if existing user should be admin based on email
                    // This fixes cases where an admin email was previously created as a candidate
                    if ((firebaseUser.email === "arshad@logic.com" || firebaseUser.email === "arsh@logic.com") && userDoc.role !== 'admin') {
                        await createUserDoc(firebaseUser.uid, { role: 'admin' }); // Merge update
                        userDoc.role = 'admin';
                    }
                }

                setUserData(userDoc);
            } else {
                setUser(null);
                setUserData(null);
            }
            setLoading(false);
        });

        return () => unsub();
    }, []);

    const isAdmin = userData?.role === "admin";

    return (
        <AuthContext.Provider value={{ user, userData, loading, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
