"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Timer from "@/components/Timer";
import AntiCheat from "@/components/AntiCheat";
import { getAttempt, saveAttempt, getRoundConfig, getDesignChallenges, seedDesignChallenges } from "@/lib/firestore";

const ROUND_ID = "round2";

// 20 design descriptions — in production, replace with image URLs in Firestore
// Fallback themes in case Firestore is empty initially
const FALLBACK_THEMES = [
    { id: "d1", name: "Responsive Navbar", desc: "Create a fully responsive navbar with 4 links and a logo." },
    { id: "d2", name: "Center a Div", desc: "Center a div both vertically and horizontally using Grid or Flexbox." },
];

export default function Round2Page() {
    const { user, userData, loading } = useAuth();
    const router = useRouter();
    const [assignedDesign, setAssignedDesign] = useState(null);
    const [html, setHtml] = useState("<!-- Write your HTML here -->\n<div>\n  \n</div>");
    const [css, setCss] = useState("/* Write your CSS here */\n");
    // JS removed
    const [startTime, setStartTime] = useState(null);
    const [timeLimit, setTimeLimit] = useState(2700); // 45 min
    const [completed, setCompleted] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("html");
    const hasInit = useRef(false);

    useEffect(() => {
        if (!user || hasInit.current) return;
        hasInit.current = true;

        const init = async () => {
            const config = await getRoundConfig(ROUND_ID);
            if (config?.timeLimit) setTimeLimit(config.timeLimit * 60);

            const attempt = await getAttempt(user.uid, ROUND_ID);

            if (attempt?.completed) {
                setCompleted(true);
                setAssignedDesign(attempt.design);
                setHtml(attempt.html || "");
                setCss(attempt.css || "");
                setStartTime(attempt.startTime);
                setPageLoading(false);
                return;
            }

            if (attempt) {
                setAssignedDesign(attempt.design);
                setHtml(attempt.html || "");
                setCss(attempt.css || "");
                setStartTime(attempt.startTime);
            } else {
                // Fetch challenges from Firestore
                let challenges = await getDesignChallenges();
                if (challenges.length === 0) {
                    try {
                        await seedDesignChallenges();
                        challenges = await getDesignChallenges();
                    } catch (e) {
                        console.error("Auto-seed failed", e);
                        challenges = FALLBACK_THEMES;
                    }
                }

                // Assign random design
                const design = challenges.length > 0
                    ? challenges[Math.floor(Math.random() * challenges.length)]
                    : FALLBACK_THEMES[0];

                const now = Date.now();
                setAssignedDesign(design);
                setStartTime(now);
                await saveAttempt(user.uid, ROUND_ID, {
                    design,
                    html: "",
                    css: "",

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

    // Auto-save every 30 seconds
    useEffect(() => {
        if (!user || completed || pageLoading) return;
        const interval = setInterval(() => {
            saveAttempt(user.uid, ROUND_ID, { html, css });
        }, 30000);
        return () => clearInterval(interval);
    }, [user, html, css, js, completed, pageLoading]);

    const handleSubmit = async () => {
        if (!user) return;
        await saveAttempt(user.uid, ROUND_ID, {
            html,
            css,
            completed: true,
            endTime: Date.now(),
            timeTaken: Math.floor((Date.now() - startTime) / 1000),
        });
        setCompleted(true);
    };

    const handleTimeUp = async () => {
        if (completed) return;
        await handleSubmit();
    };

    const getPreview = () => {
        return `
      <html>
        <head><style>${css}</style></head>
        <body>${html}</body>
      </html>
    `;
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
                    <div style={{ fontSize: "4rem", marginBottom: 16 }}>🎨</div>
                    <h1 className="section-title" style={{ fontSize: "1.8rem" }}>Round 2 Submitted!</h1>
                    <p className="subtitle" style={{ marginTop: 8, marginBottom: 8 }}>
                        Design: <strong>{assignedDesign?.name}</strong>
                    </p>
                    <p className="subtitle">Your code has been saved. Results will be announced by the admin.</p>
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
            <div style={{ padding: 20 }}>
                {/* Header */}
                <div className="quiz-header">
                    <div>
                        <h2 className="section-title" style={{ marginBottom: 4 }}>🎨 {assignedDesign?.name}</h2>
                        <p className="subtitle">{assignedDesign?.desc}</p>
                    </div>
                    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                        <Timer totalSeconds={timeLimit} startTime={startTime} onTimeUp={handleTimeUp} />
                        <button className="btn btn-success" onClick={handleSubmit}>Submit Code</button>
                    </div>
                </div>

                {/* Editor & Preview */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 20, minHeight: "calc(100vh - 200px)" }}>
                    {/* Code Editor */}
                    <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
                        <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
                            {["html", "css"].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    style={{
                                        flex: 1, padding: "12px", border: "none", cursor: "pointer",
                                        background: activeTab === tab ? "var(--bg-card)" : "transparent",
                                        color: activeTab === tab ? "var(--accent-primary)" : "var(--text-secondary)",
                                        fontWeight: 600, fontFamily: "var(--font-sans)", fontSize: "0.9rem",
                                        borderBottom: activeTab === tab ? "2px solid var(--accent-primary)" : "none",
                                    }}
                                >
                                    {tab.toUpperCase()}
                                </button>
                            ))}
                        </div>
                        <textarea
                            value={activeTab === "html" ? html : css}
                            onChange={(e) => {
                                if (activeTab === "html") setHtml(e.target.value);
                                else setCss(e.target.value);
                            }}
                            style={{
                                width: "100%", height: "calc(100% - 48px)", padding: 16,
                                background: "var(--bg-primary)", color: "var(--text-primary)",
                                border: "none", resize: "none", outline: "none",
                                fontFamily: "var(--font-mono)", fontSize: "0.9rem", lineHeight: 1.6,
                            }}
                            spellCheck={false}
                        />
                    </div>

                    {/* Live Preview */}
                    <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
                        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", fontWeight: 600, fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                            Live Preview
                        </div>
                        <iframe
                            srcDoc={getPreview()}
                            style={{ width: "100%", height: "calc(100% - 48px)", border: "none", background: "white" }}
                            sandbox="allow-scripts"
                            title="Preview"
                        />
                    </div>
                </div>
            </div>
        </AntiCheat>
    );
}
