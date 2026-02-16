"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { getAllUsers, getAllAttempts } from "@/lib/firestore";

const ROUNDS = ["round1", "round2", "round3", "round4"];

export default function LeaderboardPage() {
    const { user, loading } = useAuth();
    const [leaderboard, setLeaderboard] = useState([]);
    const [pageLoading, setPageLoading] = useState(true);

    useEffect(() => {
        const loadLeaderboard = async () => {
            const users = await getAllUsers();
            const attempts = await getAllAttempts();

            // Build lookup: attemptId -> attempt
            const attemptMap = {};
            attempts.forEach((a) => {
                attemptMap[a.id] = a;
            });

            // Build leaderboard rows
            const rows = users
                .filter((u) => u.role !== "admin")
                .map((u) => {
                    const scores = {};
                    let totalScore = 0;
                    let totalTime = 0;

                    ROUNDS.forEach((roundId) => {
                        const attempt = attemptMap[`${u.id}_${roundId}`];
                        const roundScore = attempt?.score ?? attempt?.adminScore ?? null;
                        const roundTime = attempt?.timeTaken ?? null;

                        scores[roundId] = {
                            score: roundScore,
                            time: roundTime,
                            completed: attempt?.completed || false,
                        };

                        if (roundScore !== null) totalScore += roundScore;
                        if (roundTime !== null) totalTime += roundTime;
                    });

                    return {
                        uid: u.id,
                        name: u.name || u.email,
                        team: u.team,
                        teamNumber: u.teamNumber || 0,
                        scores,
                        totalScore,
                        totalTime,
                    };
                });

            // Sort: highest score first, then lowest time
            rows.sort((a, b) => {
                if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
                return a.totalTime - b.totalTime;
            });

            setLeaderboard(rows);
            setPageLoading(false);
        };

        loadLeaderboard();
    }, []);

    const formatTime = (seconds) => {
        if (seconds === null || seconds === undefined) return "—";
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}m ${s}s`;
    };

    if (loading || pageLoading) {
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

                    {leaderboard.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">📊</div>
                            <p>No participants yet</p>
                        </div>
                    ) : (
                        <div className="glass-card" style={{ padding: 0, overflow: "auto" }}>
                            <table className="leaderboard-table">
                                <thead>
                                    <tr>
                                        <th>Rank</th>
                                        <th>Team</th>
                                        <th>Name</th>
                                        <th>R1</th>
                                        <th>R2</th>
                                        <th>R3</th>
                                        <th>R4</th>
                                        <th>Total</th>
                                        <th>Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaderboard.map((row, idx) => (
                                        <tr key={row.uid}>
                                            <td>
                                                <span
                                                    className={`rank-badge ${idx === 0
                                                            ? "rank-1"
                                                            : idx === 1
                                                                ? "rank-2"
                                                                : idx === 2
                                                                    ? "rank-3"
                                                                    : "rank-other"
                                                        }`}
                                                >
                                                    {idx + 1}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="navbar-team">{row.team}</span>
                                            </td>
                                            <td style={{ fontWeight: 600 }}>{row.name}</td>
                                            {ROUNDS.map((r) => (
                                                <td key={r} style={{ fontFamily: "var(--font-mono)" }}>
                                                    {row.scores[r]?.score !== null
                                                        ? row.scores[r].score
                                                        : "—"}
                                                </td>
                                            ))}
                                            <td
                                                style={{
                                                    fontWeight: 800,
                                                    color: "var(--accent-primary)",
                                                    fontFamily: "var(--font-mono)",
                                                    fontSize: "1.05rem",
                                                }}
                                            >
                                                {row.totalScore}
                                            </td>
                                            <td
                                                style={{
                                                    fontFamily: "var(--font-mono)",
                                                    color: "var(--text-secondary)",
                                                    fontSize: "0.85rem",
                                                }}
                                            >
                                                {formatTime(row.totalTime)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
