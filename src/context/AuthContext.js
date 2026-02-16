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
                    // First login — assign team number (FIFO)
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
