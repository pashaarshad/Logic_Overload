"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import PasswordGate from "@/components/PasswordGate";
import { getRoundConfig, getAttempt } from "@/lib/firestore";

const ROUND_INFO = [
    {
        id: "round1",
        number: "01",
        title: "Logic & MCQ Quiz",
        desc: "30 BCA-level questions • 30 minutes • No back navigation",
        icon: "🧠",
        path: "/round1",
    },
    {
        id: "round2",
        number: "02",
        title: "Frontend Design Challenge",
        desc: "Recreate a UI design using HTML, CSS & JavaScript",
        icon: "🎨",
        path: "/round2",
    },
    {
        id: "round3",
        number: "03",
        title: "DSA & Coding Logic",
        desc: "Solve algorithmic problems on HackerRank",
        icon: "💻",
        path: "/round3",
    },
    {
        id: "round4",
        number: "04",
        title: "Final Round",
        desc: "Details will be announced soon",
        icon: "🏆",
        path: "/round4",
    },
];

export default function DashboardPage() {
    const { user, userData, loading, isAdmin } = useAuth();
    const router = useRouter();
    const [showPasswordModal, setShowPasswordModal] = useState(null);
    const [roundStatuses, setRoundStatuses] = useState({});
    const [roundConfigs, setRoundConfigs] = useState({});
    const [passwordError, setPasswordError] = useState("");

    useEffect(() => {
        if (!loading && !user) {
            router.push("/");
        }
        if (!loading && isAdmin) {
            router.push("/admin");
        }
    }, [user, loading, isAdmin, router]);

    // Load round configs and attempt statuses
    useEffect(() => {
        if (!user?.uid) return;
        const uid = user.uid;

        const loadData = async () => {
            try {
                const configs = {};
                const statuses = {};

                for (const round of ROUND_INFO) {
                    const config = await getRoundConfig(round.id);
                    configs[round.id] = config;

                    const attempt = await getAttempt(uid, round.id);
                    if (attempt?.completed) {
                        statuses[round.id] = "completed";
                    } else if (attempt?.startTime) {
                        statuses[round.id] = "in-progress";
                    } else {
                        statuses[round.id] = config?.isActive ? "active" : "locked";
                    }
                }

                setRoundConfigs(configs);
                setRoundStatuses(statuses);
            } catch (err) {
                console.error("Dashboard load error:", err);
            }
        };

        loadData();
    }, [user]);

    const handleRoundClick = (round) => {
        const status = roundStatuses[round.id];
        if (status === "locked") return;

        if (status === "in-progress" || status === "completed") {
            router.push(round.path);
            return;
        }

        setShowPasswordModal(round);
        setPasswordError("");
    };

    const handlePasswordSubmit = (password) => {
        const config = roundConfigs[showPasswordModal.id];
        if (password.trim().toLowerCase() === (config?.password || "").trim().toLowerCase()) {
            setShowPasswordModal(null);
            router.push(showPasswordModal.path);
        } else {
            setPasswordError("Incorrect password");
        }
    };

    if (loading || !user) {
        return (
            <div className="page-center">
                <div className="spinner-container">
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    return (
        <>
            <Navbar />
            <div className="page-container" style={{ paddingTop: 40 }}>
                <div style={{ textAlign: "center", marginBottom: 48 }}>
                    <h1 className="hero-title" style={{ marginBottom: 8 }}>
                        Welcome, {userData?.name?.split(" ")[0] || "Participant"}
                    </h1>
                    <p className="subtitle" style={{ marginBottom: 8 }}>
                        Select a round to begin your challenge
                    </p>
                    {userData?.team && (
                        <span
                            className="navbar-team"
                            style={{ fontSize: "0.9rem", padding: "6px 16px" }}
                        >
                            {userData.team}
                        </span>
                    )}
                </div>

                <div className="rounds-grid">
                    {ROUND_INFO.map((round) => {
                        const status = roundStatuses[round.id] || "locked";
                        const attempt = roundStatuses[round.id];

                        return (
                            <div
                                key={round.id}
                                className={`round-card ${status}`}
                                onClick={() => handleRoundClick(round)}
                            >
                                <div style={{ fontSize: "2rem", marginBottom: 8 }}>
                                    {round.icon}
                                </div>
                                <div className="round-number">{round.number}</div>
                                <div className="round-title">{round.title}</div>
                                <div className="round-desc">{round.desc}</div>
                                <div
                                    className={`round-status ${status === "completed"
                                        ? "status-completed"
                                        : status === "active" || status === "in-progress"
                                            ? "status-active"
                                            : "status-locked"
                                        }`}
                                >
                                    {status === "completed"
                                        ? "✅ Completed"
                                        : status === "in-progress"
                                            ? "▶ In Progress"
                                            : status === "active"
                                                ? "🔓 Available"
                                                : "🔒 Locked"}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {showPasswordModal && (
                <PasswordGate
                    roundTitle={showPasswordModal.title}
                    onSuccess={handlePasswordSubmit}
                    onClose={() => {
                        setShowPasswordModal(null);
                        setPasswordError("");
                    }}
                    error={passwordError}
                />
            )}
        </>
    );
}
