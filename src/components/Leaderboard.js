"use client";

import { useEffect, useState } from "react";
import { getAllUsers, getAllAttempts } from "@/lib/firestore";

const ROUNDS = ["round1", "round2", "round3", "round4"];

export default function Leaderboard({ limit = null, minimal = false }) {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadLeaderboard = async () => {
            try {
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
                            // Prioritize admin manually entered score over auto-score
                            const roundScore = attempt?.adminScore ?? attempt?.score ?? null;
                            const roundTime = attempt?.timeTaken ?? null;

                            scores[roundId] = {
                                score: roundScore,
                                time: roundTime,
                            };

                            if (roundScore !== null) totalScore += roundScore;
                            if (roundTime !== null) totalTime += roundTime;
                        });

                        return {
                            uid: u.id,
                            name: u.name || "Participant",
                            team: u.team,
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

                if (limit) {
                    setLeaderboard(rows.slice(0, limit));
                } else {
                    setLeaderboard(rows);
                }
            } catch (err) {
                console.error("Failed to load leaderboard:", err);
            } finally {
                setLoading(false);
            }
        };

        loadLeaderboard();
    }, [limit]);

    const formatTime = (seconds) => {
        if (seconds === null || seconds === undefined) return "—";
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}m ${s}s`;
    };

    if (loading) {
        return <div className="spinner-container"><div className="spinner"></div></div>;
    }

    if (leaderboard.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-icon">📊</div>
                <p>No participants yet</p>
            </div>
        );
    }

    return (
        <div className="glass-card" style={{ padding: 0, overflow: "auto", border: minimal ? "none" : undefined, background: minimal ? "transparent" : undefined }}>
            <table className="leaderboard-table">
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Team</th>
                        <th>Name</th>
                        {!minimal && ROUNDS.map(r => <th key={r}>{r.replace("round", "R")}</th>)}
                        <th>Total</th>
                        <th>Time</th>
                    </tr>
                </thead>
                <tbody>
                    {leaderboard.map((row, idx) => (
                        <tr key={row.uid}>
                            <td>
                                <span
                                    className={`rank-badge ${idx === 0 ? "rank-1" : idx === 1 ? "rank-2" : idx === 2 ? "rank-3" : "rank-other"
                                        }`}
                                >
                                    {idx + 1}
                                </span>
                            </td>
                            <td><span className="navbar-team">{row.team}</span></td>
                            <td style={{ fontWeight: 600 }}>{row.name}</td>
                            {!minimal && ROUNDS.map((r) => (
                                <td key={r} style={{ fontFamily: "var(--font-mono)" }}>
                                    {row.scores[r]?.score !== null ? row.scores[r].score : "—"}
                                </td>
                            ))}
                            <td style={{ fontWeight: 800, color: "var(--accent-primary)", fontFamily: "var(--font-mono)", fontSize: "1.05rem" }}>
                                {row.totalScore}
                            </td>
                            <td style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                                {formatTime(row.totalTime)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
