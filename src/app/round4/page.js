"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";

export default function Round4Page() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) router.push("/");
    }, [user, loading, router]);

    if (loading || !user) {
        return (
            <div className="page-center">
                <div className="spinner-container"><div className="spinner"></div></div>
            </div>
        );
    }

    return (
        <>
            <Navbar />
            <div className="page-container" style={{ paddingTop: 60 }}>
                <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
                    <div style={{ fontSize: "5rem", marginBottom: 24 }}>🏆</div>
                    <h1 className="hero-title" style={{ fontSize: "2.2rem", marginBottom: 12 }}>
                        Round 4 — Final Round
                    </h1>
                    <p className="subtitle" style={{ fontSize: "1.1rem", marginBottom: 32 }}>
                        Details will be announced soon. Stay tuned!
                    </p>
                    <div className="glass-card">
                        <p style={{ color: "var(--text-secondary)", lineHeight: 1.8 }}>
                            This round is currently being prepared by the organizers.
                            The format and challenges will be revealed at the appropriate time.
                            Keep your skills sharp and be ready for anything!
                        </p>
                    </div>
                    <button
                        className="btn btn-primary btn-lg"
                        style={{ marginTop: 32 }}
                        onClick={() => router.push("/dashboard")}
                    >
                        ← Back to Dashboard
                    </button>
                </div>
            </div>
        </>
    );
}
