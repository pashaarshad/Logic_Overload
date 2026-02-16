"use client";

import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Leaderboard from "@/components/Leaderboard";

export default function LeaderboardPage() {
    const { loading } = useAuth();

    if (loading) {
        return (
            <div className="page-center">
                <div className="spinner-container"><div className="spinner"></div></div>
            </div>
        );
    }

    return (
        <>
            <Navbar />
            <div className="page-container" style={{ paddingTop: 32 }}>
                <div style={{ maxWidth: 1200, margin: "0 auto" }}>
                    <div style={{ textAlign: "center", marginBottom: 40 }}>
                        <h1 className="hero-title" style={{ marginBottom: 8 }}>🏆 Leaderboard</h1>
                        <p className="subtitle">Real-time rankings based on marks and time</p>
                    </div>
                    <Leaderboard />
                </div>
            </div>
        </>
    );
}
