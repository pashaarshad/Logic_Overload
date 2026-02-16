"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import {
    getAllUsers,
    getAllAttempts,
    getQuestions,
    setQuestion,
    deleteQuestion,
    getRoundConfig,
    updateRoundConfig,
    saveAttempt,
    deleteAttempt,
    seedRounds,
    seedQuestions,
    updateUserDoc,
} from "@/lib/firestore";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";

const ROUNDS = ["round1", "round2", "round3", "round4"];
const ROUND_NAMES = {
    round1: "Round 1 — MCQ Quiz",
    round2: "Round 2 — Frontend Design",
    round3: "Round 3 — DSA/HackerRank",
    round4: "Round 4 — Final Round",
};

export default function AdminPage() {
    const { user, userData, loading, isAdmin } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("participants");
    const [users, setUsers] = useState([]);
    const [attempts, setAttempts] = useState([]);
    const [questions, setQuestionsState] = useState([]);
    const [roundConfigs, setRoundConfigs] = useState({});
    const [pageLoading, setPageLoading] = useState(true);
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [viewSubmission, setViewSubmission] = useState(null);
    const [viewDetails, setViewDetails] = useState(null); // New state for details modal
    const [message, setMessage] = useState("");



    useEffect(() => {
        if (!user || !isAdmin) return;
        loadData();
    }, [user, isAdmin]);

    const loadData = async () => {
        setPageLoading(true);
        try {
            const [usersData, attemptsData] = await Promise.all([
                getAllUsers(),
                getAllAttempts(),
            ]);

            setUsers(usersData);
            setAttempts(attemptsData);

            // Load round configs separately to safeguard against individual failures
            try {
                const configs = {};
                for (const r of ROUNDS) {
                    configs[r] = await getRoundConfig(r);
                }
                setRoundConfigs(configs);
            } catch (err) {
                console.error("Failed to load round configs", err);
            }

            // Load questions separately - this often fails due to missing index
            try {
                const qs = await getQuestions("round1");
                setQuestionsState(qs);
            } catch (err) {
                console.error("Failed to load questions (likely missing index)", err);
                showMessage("⚠️ Error loading questions. Check console/indexes.");
            }

        } catch (err) {
            console.error("Critical error loading admin data", err);
            showMessage("❌ Critical Error: " + err.message);
        } finally {
            setPageLoading(false);
        }
    };

    const showMessage = (msg) => {
        setMessage(msg);
        setTimeout(() => setMessage(""), 3000);
    };

    // ─── Seed Data ───
    const handleSeedRounds = async () => {
        await seedRounds();
        showMessage("✅ Rounds seeded successfully");
        loadData();
    };

    const handleSeedQuestions = async () => {
        await seedQuestions();
        showMessage("✅ Questions seeded successfully");
        loadData();
    };

    // ─── Round Config ───
    const handleUpdateRound = async (roundId, field, value) => {
        await updateRoundConfig(roundId, { [field]: value });
        setRoundConfigs((prev) => ({
            ...prev,
            [roundId]: { ...prev[roundId], [field]: value },
        }));
        showMessage(`✅ ${roundId} updated`);
    };

    // ─── Manage Scores ───
    const handleUpdateScore = async (uid, roundId, score) => {
        const attemptId = `${uid}_${roundId}`;
        await saveAttempt(uid, roundId, { adminScore: parseInt(score) || 0 });
        showMessage(`✅ Score updated`);
        loadData();
    };

    const handleDeleteAttempt = async (uid, roundId) => {
        if (!confirm("Are you sure you want to completely RESET this attempt? This action cannot be undone.")) return;
        setPageLoading(true);
        await deleteAttempt(uid, roundId);
        showMessage("🗑️ Attempt reset!");
        loadData();
    };

    // ─── Make Admin ───
    const handleToggleAdmin = async (uid, currentRole) => {
        const newRole = currentRole === "admin" ? "candidate" : "admin";
        await updateUserDoc(uid, { role: newRole });
        showMessage(`✅ User role changed to ${newRole}`);
        loadData();
    };

    if (loading) {
        return (
            <div className="page-center">
                <div className="spinner-container"><div className="spinner"></div></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="page-center">
                <Navbar />
                <div className="login-container glass-card" style={{ maxWidth: 400, margin: "40px auto" }}>
                    <h2 className="section-title" style={{ textAlign: "center", marginBottom: 24 }}>🛡️ Admin Login</h2>
                    <form onSubmit={async (e) => {
                        e.preventDefault();
                        const usernameVal = e.target.username.value.trim();
                        const passwordVal = e.target.password.value.trim();

                        if ((usernameVal.toLowerCase() === "arshad" || usernameVal.toLowerCase() === "arsh") && passwordVal === "logic65") {
                            setMessage("🔄 Authenticating...");
                            const email = usernameVal.toLowerCase() === "arsh" ? "arsh@logic.com" : "arshad@logic.com";
                            try {
                                const cred = await signInWithEmailAndPassword(auth, email, passwordVal);
                                await updateUserDoc(cred.user.uid, { role: "admin", name: `${usernameVal} Admin` });
                            } catch (err) {
                                if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
                                    try {
                                        const cred = await createUserWithEmailAndPassword(auth, email, passwordVal);
                                        await updateUserDoc(cred.user.uid, { role: "admin", name: `${usernameVal} Admin` });
                                    } catch (createErr) {
                                        showMessage("❌ Create Failed: " + createErr.message);
                                    }
                                } else {
                                    showMessage("❌ Login Failed: " + err.message);
                                }
                            }
                        } else {
                            showMessage("❌ Invalid credentials");
                        }
                    }}>
                        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                            <button type="button" className="btn btn-sm btn-secondary" onClick={() => document.querySelector('input[name="username"]').value = "arshad"}>Arshad</button>
                            <button type="button" className="btn btn-sm btn-secondary" onClick={() => document.querySelector('input[name="username"]').value = "arsh"}>Arsh</button>
                        </div>
                        <div className="input-group" style={{ marginBottom: 16 }}>
                            <label>Username</label>
                            <input name="username" className="input" placeholder="arshad" autoFocus autoComplete="username" />
                        </div>
                        <div className="input-group" style={{ marginBottom: 24 }}>
                            <label>Password</label>
                            <input name="password" type="password" className="input" placeholder="•••••••" autoComplete="current-password" />
                        </div>
                        <button className="btn btn-primary btn-full">Login as Admin</button>
                        {message && <div style={{ marginTop: 16, textAlign: "center", color: "var(--accent-primary)" }}>{message}</div>}
                    </form>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="page-center">
                <Navbar />
                <div className="glass-card" style={{ textAlign: "center", maxWidth: 400 }}>
                    <h1 className="hero-title" style={{ fontSize: "2rem", marginBottom: 16 }}>🚫 Access Denied</h1>
                    <p className="subtitle" style={{ marginBottom: 24 }}>You do not have admin permissions.</p>
                    <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
                        <button className="btn btn-secondary" onClick={() => router.push("/dashboard")}>Dashboard</button>
                        <button className="btn btn-primary" onClick={() => signOut(auth)}>Log Out</button>
                    </div>
                </div>
            </div>
        );
    }

    // Build attempt lookup
    const attemptMap = {};
    attempts.forEach((a) => { attemptMap[a.id] = a; });

    return (
        <>
            <Navbar />
            <div className="admin-layout">
                {/* Sidebar */}
                <aside className="admin-sidebar">
                    <div style={{ padding: "0 24px 24px", borderBottom: "1px solid var(--border)", marginBottom: 16 }}>
                        <div className="navbar-logo" style={{ fontSize: "1.1rem" }}>⚡ Admin Panel</div>
                    </div>
                    {[
                        { id: "participants", icon: "👥", label: "Participants" },
                        { id: "admins", icon: "🛡️", label: "Admins" }, // New tab
                        { id: "rounds", icon: "🔧", label: "Round Settings" },
                        { id: "questions", icon: "📝", label: "Questions" },
                        { id: "scores", icon: "📊", label: "Scores & Marks" },
                        { id: "seed", icon: "🌱", label: "Seed Data" },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            className={`admin-nav-item ${activeTab === tab.id ? "active" : ""}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </aside>

                {/* Content */}
                <main className="admin-content">
                    {message && (
                        <div className="feedback correct" style={{ marginBottom: 20 }}>
                            {message}
                        </div>
                    )}

                    {pageLoading ? (
                        <div className="spinner-container"><div className="spinner"></div></div>
                    ) : (
                        <>
                            {/* ─── Participants Tab ─── */}
                            {activeTab === "participants" && (
                                <div>
                                    <h2 className="section-title" style={{ marginBottom: 24 }}>
                                        👥 Participants ({users.filter(u => u.role !== "admin").length})
                                    </h2>
                                    <div className="glass-card" style={{ padding: 0, overflow: "auto" }}>
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Team</th>
                                                    <th>Name</th>
                                                    <th>Email</th>
                                                    <th>Role</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {users.filter(u => u.role !== "admin").map((u, i) => (
                                                    <tr key={u.id}>
                                                        <td>{i + 1}</td>
                                                        <td><span className="navbar-team">{u.team}</span></td>
                                                        <td style={{ fontWeight: 600 }}>{u.name}</td>
                                                        <td style={{ color: "var(--text-secondary)" }}>{u.email}</td>
                                                        <td>
                                                            <span style={{
                                                                padding: "4px 10px", borderRadius: "var(--radius-full)",
                                                                fontSize: "0.8rem", fontWeight: 600,
                                                                background: u.role === "admin" ? "rgba(108, 92, 231, 0.1)" : "rgba(16, 185, 129, 0.1)",
                                                                color: u.role === "admin" ? "var(--accent-primary)" : "var(--success)",
                                                            }}>
                                                                {u.role}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <button className="btn btn-sm btn-secondary" onClick={() => handleToggleAdmin(u.id, u.role)}>
                                                                {u.role === "admin" ? "Remove Admin" : "Make Admin"}
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-primary"
                                                                style={{ marginLeft: 8 }}
                                                                onClick={() => setViewDetails(u)}
                                                            >
                                                                📄 Details
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* ─── Round Settings Tab ─── */}
                            {activeTab === "rounds" && (
                                <div>
                                    <h2 className="section-title" style={{ marginBottom: 24 }}>🔧 Round Settings</h2>
                                    <div style={{ display: "grid", gap: 20 }}>
                                        {ROUNDS.map((roundId) => {
                                            const config = roundConfigs[roundId] || {};
                                            return (
                                                <div key={roundId} className="glass-card">
                                                    <h3 style={{ marginBottom: 16 }}>{ROUND_NAMES[roundId]}</h3>
                                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                                                        <div className="input-group">
                                                            <label>Password</label>
                                                            <input
                                                                className="input"
                                                                defaultValue={config.password || ""}
                                                                onBlur={(e) => handleUpdateRound(roundId, "password", e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="input-group">
                                                            <label>Time Limit (min)</label>
                                                            <input
                                                                className="input"
                                                                type="number"
                                                                defaultValue={config.timeLimit || 30}
                                                                onBlur={(e) => handleUpdateRound(roundId, "timeLimit", parseInt(e.target.value))}
                                                            />
                                                        </div>
                                                        <div className="input-group">
                                                            <label>Active</label>
                                                            <button
                                                                className={`btn btn-sm ${config.isActive ? "btn-success" : "btn-secondary"}`}
                                                                onClick={() => handleUpdateRound(roundId, "isActive", !config.isActive)}
                                                            >
                                                                {config.isActive ? "✅ Active" : "❌ Inactive"}
                                                            </button>
                                                        </div>
                                                    </div>
                                                    {roundId === "round3" && (
                                                        <div className="input-group" style={{ marginTop: 16 }}>
                                                            <label>HackerRank Link</label>
                                                            <input
                                                                className="input"
                                                                defaultValue={config.hackerRankLink || ""}
                                                                placeholder="https://www.hackerrank.com/..."
                                                                onBlur={(e) => handleUpdateRound(roundId, "hackerRankLink", e.target.value)}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* ─── Questions Tab ─── */}
                            {activeTab === "questions" && (
                                <div>
                                    <h2 className="section-title" style={{ marginBottom: 24 }}>
                                        📝 Round 1 Questions ({questions.length})
                                    </h2>
                                    <div className="glass-card" style={{ padding: 0, overflow: "auto" }}>
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Question</th>
                                                    <th>Options</th>
                                                    <th>Correct</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {questions.map((q, i) => (
                                                    <tr key={q.id}>
                                                        <td>{q.order || i + 1}</td>
                                                        <td style={{ maxWidth: 400 }}>{q.question}</td>
                                                        <td style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                                                            {q.options?.map((o, j) => (
                                                                <div key={j}>
                                                                    {["A", "B", "C", "D"][j]}: {o}
                                                                </div>
                                                            ))}
                                                        </td>
                                                        <td>
                                                            <span style={{
                                                                fontWeight: 700,
                                                                color: "var(--success)",
                                                                fontFamily: "var(--font-mono)",
                                                            }}>
                                                                {["A", "B", "C", "D"][q.correctAnswer]}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* ─── Scores Tab ─── */}
                            {activeTab === "scores" && (
                                <div>
                                    <h2 className="section-title" style={{ marginBottom: 24 }}>📊 Scores & Marks</h2>
                                    <div className="glass-card" style={{ padding: 0, overflow: "auto" }}>
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th>Team</th>
                                                    <th>Name</th>
                                                    {ROUNDS.map((r) => (
                                                        <th key={r}>{r.replace("round", "R")}</th>
                                                    ))}
                                                    <th>Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {users.filter(u => u.role !== "admin").map((u) => {
                                                    let total = 0;
                                                    return (
                                                        <tr key={u.id}>
                                                            <td><span className="navbar-team">{u.team}</span></td>
                                                            <td style={{ fontWeight: 600 }}>{u.name}</td>
                                                            {ROUNDS.map((roundId) => {
                                                                const attempt = attemptMap[`${u.id}_${roundId}`];
                                                                const score = attempt?.adminScore ?? attempt?.score ?? "";
                                                                if (score !== "") total += parseInt(score) || 0;

                                                                return (
                                                                    <td key={roundId}>
                                                                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                                                            <input
                                                                                className="score-input"
                                                                                type="number"
                                                                                key={attempt?.adminScore} // Force re-render on update
                                                                                defaultValue={score}
                                                                                onBlur={(e) => handleUpdateScore(u.id, roundId, e.target.value)}
                                                                                placeholder="—"
                                                                                style={{ width: "60px" }}
                                                                            />
                                                                            {attempt && roundId === "round2" && (
                                                                                <button
                                                                                    className="btn btn-sm btn-primary"
                                                                                    style={{ padding: "4px 8px", fontSize: "1rem" }}
                                                                                    onClick={() => setViewSubmission(attempt)}
                                                                                    title="View Submission"
                                                                                >
                                                                                    👁️
                                                                                </button>
                                                                            )}
                                                                            {attempt && (
                                                                                <button
                                                                                    className="btn btn-sm btn-danger"
                                                                                    style={{ padding: "4px 8px", fontSize: "1rem" }}
                                                                                    onClick={() => handleDeleteAttempt(u.id, roundId)}
                                                                                    title="Reset Attempt"
                                                                                >
                                                                                    ↺
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                );
                                                            })}
                                                            <td style={{
                                                                fontWeight: 800,
                                                                color: "var(--accent-primary)",
                                                                fontFamily: "var(--font-mono)",
                                                                fontSize: "1.05rem",
                                                            }}>
                                                                {total || "—"}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* ─── Seed Data Tab ─── */}
                            {activeTab === "seed" && (
                                <div>
                                    <h2 className="section-title" style={{ marginBottom: 24 }}>🌱 Seed Initial Data</h2>
                                    <p className="subtitle" style={{ marginBottom: 32 }}>
                                        Use these buttons to populate the database with initial round
                                        configurations and quiz questions.
                                    </p>
                                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                                        <button className="btn btn-primary btn-lg" onClick={handleSeedRounds}>
                                            🔧 Seed Round Configs
                                        </button>
                                        <button className="btn btn-primary btn-lg" onClick={handleSeedQuestions}>
                                            📝 Seed 30 MCQ Questions
                                        </button>
                                    </div>
                                    <div className="glass-card" style={{ marginTop: 32 }}>
                                        <h3 style={{ marginBottom: 12, color: "var(--warning)" }}>⚠️ Important Notes</h3>
                                        <ul style={{ color: "var(--text-secondary)", lineHeight: 2, paddingLeft: 20 }}>
                                            <li>Seeding will merge data — it won't delete existing entries</li>
                                            <li>Round passwords: Round 1 = <code style={{ fontFamily: "var(--font-mono)", background: "var(--bg-card)", padding: "2px 6px", borderRadius: 4 }}>round1SDCArsh</code></li>
                                            <li>You can change passwords anytime in the Round Settings tab</li>
                                            <li>Questions can be edited in the Firestore console</li>
                                        </ul>
                                    </div>
                                </div>
                            )}
                            {/* ─── Admins Tab ─── */}
                            {activeTab === "admins" && (
                                <div>
                                    <h2 className="section-title" style={{ marginBottom: 24 }}>
                                        🛡️ Admins ({users.filter(u => u.role === "admin").length})
                                    </h2>
                                    <div className="glass-card" style={{ padding: 0, overflow: "auto" }}>
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Name</th>
                                                    <th>Email</th>
                                                    <th>Role</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {users.filter(u => u.role === "admin").map((u, i) => (
                                                    <tr key={u.id}>
                                                        <td>{i + 1}</td>
                                                        <td style={{ fontWeight: 600 }}>{u.name}</td>
                                                        <td style={{ color: "var(--text-secondary)" }}>{u.email}</td>
                                                        <td>
                                                            <span style={{
                                                                padding: "4px 10px", borderRadius: "12px",
                                                                fontSize: "0.8rem", fontWeight: 600,
                                                                background: "rgba(108, 92, 231, 0.1)",
                                                                color: "var(--accent-primary)",
                                                            }}>
                                                                {u.role}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <button className="btn btn-sm btn-danger" onClick={() => handleToggleAdmin(u.id, u.role)}>
                                                                Remove Admin role
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                        </>
                    )}
                </main>

                {viewSubmission && (
                    <SubmissionModal
                        submission={viewSubmission}
                        onClose={() => setViewSubmission(null)}
                    />
                )}

                {viewDetails && (
                    <DetailsModal
                        user={viewDetails}
                        onClose={() => setViewDetails(null)}
                    />
                )}
            </div>
        </>
    );

    function DetailsModal({ user, onClose }) {
        return (
            <div className="modal-overlay">
                <div className="glass-card modal-content" style={{ maxWidth: 500 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                        <h3>Participant Details</h3>
                        <button className="btn btn-sm btn-secondary" onClick={onClose}>Close</button>
                    </div>
                    <div style={{ display: "grid", gap: 12 }}>
                        <div><strong>Team:</strong> {user.team}</div>
                        <div><strong>College:</strong> {user.college || "N/A"}</div>
                        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 8 }}>
                            <strong>Member 1:</strong>
                            <div>Name: {user.member1Name || user.name}</div>
                            <div>Mobile: {user.member1Mobile || "N/A"}</div>
                        </div>
                        {user.member2Name && (
                            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 8 }}>
                                <strong>Member 2:</strong>
                                <div>Name: {user.member2Name}</div>
                                <div>Mobile: {user.member2Mobile || "N/A"}</div>
                            </div>
                        )}
                        <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 8 }}>
                            Email: {user.email}<br />
                            UID: {user.id}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    function SubmissionModal({ submission, onClose }) {
        const [activeCode, setActiveCode] = useState("html");
        const [score, setScore] = useState(submission.adminScore || "");

        const previewSrc = `
      <html>
        <head><style>${submission.css || ""}</style></head>
        <body>${submission.html || ""}<script>${submission.js || ""}<\/script></body>
      </html>
    `;

        return (
            <div style={{
                position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 2000,
                display: "flex", alignItems: "center", justifyContent: "center", padding: 20
            }}>
                <div className="glass-card" style={{ width: "100%", height: "100%", maxWidth: 1400, display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>
                    {/* Header */}
                    <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0,0,0,0.2)" }}>
                        <div>
                            <h3 style={{ margin: 0 }}>Participant: {submission.name} ({submission.team})</h3>
                            <div style={{ fontSize: "0.85rem", opacity: 0.7 }}>Task: {submission.design?.name || "Unknown"}</div>
                        </div>
                        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                            <div className="input-group" style={{ flexDirection: "row", alignItems: "center", marginBottom: 0 }}>
                                <label style={{ marginBottom: 0, marginRight: 8 }}>Score:</label>
                                <input
                                    className="input"
                                    type="number"
                                    style={{ width: 80, padding: "8px" }}
                                    value={score}
                                    onChange={(e) => setScore(e.target.value)}
                                />
                                <button className="btn btn-success" onClick={() => {
                                    handleUpdateScore(submission.id.split("_")[0], "round2", score);
                                    onClose();
                                }}>Save</button>
                            </div>
                            <button className="btn btn-secondary" onClick={onClose}>Close</button>
                        </div>
                    </div>

                    {/* Body */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", flex: 1, minHeight: 0 }}>
                        {/* Editor View */}
                        <div style={{ borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
                            <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
                                {["html", "css", "js"].map(lang => (
                                    <button
                                        key={lang}
                                        onClick={() => setActiveCode(lang)}
                                        style={{
                                            flex: 1, padding: 12, border: "none", cursor: "pointer",
                                            background: activeCode === lang ? "rgba(255,255,255,0.1)" : "transparent",
                                            color: activeCode === lang ? "var(--accent-primary)" : "var(--text-secondary)",
                                            fontWeight: 600
                                        }}
                                    >
                                        {lang.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                            <textarea
                                readOnly
                                value={submission[activeCode] || ""}
                                style={{
                                    flex: 1, width: "100%", padding: 16, resize: "none", border: "none", outline: "none",
                                    background: "transparent", color: "var(--text-primary)", fontFamily: "var(--font-mono)",
                                    lineHeight: 1.5
                                }}
                            />
                        </div>

                        {/* Preview */}
                        <div style={{ background: "white", display: "flex", flexDirection: "column" }}>
                            <div style={{ padding: "8px 16px", background: "#f0f0f0", color: "#333", borderBottom: "1px solid #ccc", fontSize: "0.8rem", fontWeight: 600 }}>
                                Output Preview
                            </div>
                            <iframe
                                srcDoc={previewSrc}
                                style={{ flex: 1, width: "100%", border: "none" }}
                                sandbox="allow-scripts"
                                title="Preview"
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
