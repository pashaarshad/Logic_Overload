"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import AntiCheat from "@/components/AntiCheat";
import { getAttempt, saveAttempt, getRoundConfig } from "@/lib/firestore";

const ROUND_ID = "round3";

export default function Round3Page() {
    const { user, userData, loading } = useAuth();
    const router = useRouter();
    const [startTime, setStartTime] = useState(null);
    const [completed, setCompleted] = useState(false);
    const [hackerRankLink, setHackerRankLink] = useState("");
    const [pageLoading, setPageLoading] = useState(true);
    const hasInit = useRef(false);

    useEffect(() => {
        if (!user || hasInit.current) return;
        hasInit.current = true;

        const init = async () => {
            const config = await getRoundConfig(ROUND_ID);
            if (config?.hackerRankLink) setHackerRankLink(config.hackerRankLink);

            const attempt = await getAttempt(user.uid, ROUND_ID);

            if (attempt?.completed) {
                setCompleted(true);
                setStartTime(attempt.startTime);
            } else if (attempt) {
                setStartTime(attempt.startTime);
            } else {
                const now = Date.now();
                setStartTime(now);
                await saveAttempt(user.uid, ROUND_ID, {
                    startTime: now,
                    completed: false,
                    team: userData?.team || "",
                    name: userData?.name || "",
                });
            }
            setPageLoading(false);
        };
        init();
    }, [user, userData]);

    const handleComplete = async () => {
        if (!user) return;
        await saveAttempt(user.uid, ROUND_ID, {
            completed: true,
            endTime: Date.now(),
            timeTaken: Math.floor((Date.now() - startTime) / 1000),
        });
        setCompleted(true);
    };

    if (loading || pageLoading) {
        return (
            <div className="page-center">
                <div className="spinner-container"><div className="spinner"></div></div>
            </div>
        );
    }

    if (!user) { router.push("/"); return null; }

    if (completed) {
        return (
            <>
                <Navbar />
                <div className="results-container">
                    <div style={{ fontSize: "4rem", marginBottom: 16 }}>💻</div>
                    <h1 className="section-title" style={{ fontSize: "1.8rem" }}>Round 3 Submitted!</h1>
                    <p className="subtitle" style={{ marginTop: 8 }}>
                        Your completion has been recorded. Marks will be updated by the admin.
                    </p>
                    <button className="btn btn-primary btn-lg" style={{ marginTop: 32 }} onClick={() => router.push("/dashboard")}>
                        ← Back to Dashboard
                    </button>
                </div>
            </>
        );
    }

    return (
        <AntiCheat active={true}>
            <Navbar />
            <div className="page-container" style={{ paddingTop: 40 }}>
                <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
                    <div style={{ fontSize: "4rem", marginBottom: 16 }}>💻</div>
                    <h1 className="hero-title" style={{ fontSize: "2rem", marginBottom: 12 }}>
                        Round 3 — DSA & Coding Logic
                    </h1>
                    <p className="subtitle" style={{ marginBottom: 32 }}>
                        Solve the algorithmic problems on HackerRank. Once you finish, click
                        "Mark as Complete" below.
                    </p>

                    <div className="glass-card" style={{ marginBottom: 32, textAlign: "left" }}>
                        <h3 style={{ marginBottom: 16, color: "var(--accent-primary)" }}>📋 Instructions</h3>
                        <ul style={{ color: "var(--text-secondary)", lineHeight: 2, paddingLeft: 20 }}>
                            <li>Open the HackerRank link provided below</li>
                            <li>Solve the given problem(s) within the time limit</li>
                            <li>Your code will be evaluated by the organizers</li>
                            <li>Marks will be entered manually by the admin</li>
                            <li>Anti-cheat monitoring is active — do not switch tabs excessively</li>
                        </ul>
                    </div>

                    {hackerRankLink ? (
                        <a
                            href={hackerRankLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary btn-lg"
                            style={{ marginBottom: 20 }}
                        >
                            🔗 Open HackerRank Challenge
                        </a>
                    ) : (
                        <div className="glass-card" style={{ marginBottom: 20 }}>
                            <p style={{ color: "var(--warning)" }}>
                                ⚠️ HackerRank link not yet configured. Please wait for the admin to set it up.
                            </p>
                        </div>
                    )}

                    <div style={{ marginTop: 24 }}>
                        <button className="btn btn-success btn-lg" onClick={handleComplete}>
                            ✅ Mark as Complete
                        </button>
                    </div>
                </div>
            </div>
        </AntiCheat>
    );
}
