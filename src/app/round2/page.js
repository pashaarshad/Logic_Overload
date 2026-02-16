"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import AntiCheat from "@/components/AntiCheat";
import { getAttempt, saveAttempt, getRoundConfig, getDesignChallenges, seedDesignChallenges } from "@/lib/firestore";

const ROUND_ID = "round2";

// 20 design descriptions — in production, replace with image URLs in Firestore
// Fallback themes in case Firestore is empty initially
const FALLBACK_THEMES = [
    {
        id: "d1", name: "Responsive Navbar",
        desc: "Create a fully responsive navbar with 4 links and a logo.",
        html: "<nav class='navbar'><div>Logo</div><div class='links'><a>Home</a><a>About</a><a>Contact</a><a>Help</a></div></nav>",
        css: ".navbar { display: flex; justify-content: space-between; padding: 20px; background: #333; color: white; } .links a { margin-left: 20px; color: white; text-decoration: none; }"
    },
    {
        id: "d2", name: "Center a Div",
        desc: "Center a div both vertically and horizontally using Grid or Flexbox.",
        html: "<div class='container'><div class='box'>Centered</div></div>",
        css: ".container { display: flex; justify-content: center; align-items: center; height: 100vh; } .box { padding: 40px; background: tomato; color: white; border-radius: 8px; }"
    },
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

    // Ref to hold latest state for timers/intervals to avoid stale closures
    const codeRef = useRef({ html, css });
    useEffect(() => {
        codeRef.current = { html, css };
    }, [html, css]);

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
                if (challenges.length === 0 || (challenges[0] && !challenges[0].html)) {
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
        // Depends only on robust stable props, avoids resetting on keystroke
        if (!user || completed || pageLoading) return;

        const interval = setInterval(() => {
            // Read fresh values from ref
            const { html: currentHtml, css: currentCss } = codeRef.current;
            saveAttempt(user.uid, ROUND_ID, { html: currentHtml, css: currentCss });
        }, 30000);

        return () => clearInterval(interval);
    }, [user, completed, pageLoading]);

    const handleSubmit = async () => {
        if (!user) return;

        // Read fresh values from ref
        const { html: currentHtml, css: currentCss } = codeRef.current;

        await saveAttempt(user.uid, ROUND_ID, {
            html: currentHtml,
            css: currentCss,
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

    const [phase, setPhase] = useState("loading"); // loading, preview, coding, ended
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        if (!startTime || completed) return;

        const tick = () => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);

            if (elapsed < 300) { // First 5 minutes: Preview
                setPhase("preview");
                setTimeLeft(300 - elapsed);
            } else if (elapsed < 2100) { // Next 30 minutes: Coding (300 + 1800)
                setPhase("coding");
                setTimeLeft(2100 - elapsed);
            } else {
                setPhase("ended");
                if (!completed) handleTimeUp();
            }
        };

        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [startTime, completed]);

    const getReferencePreview = () => {
        if (!assignedDesign?.html && !assignedDesign?.css) return "";
        return `
      <html>
        <head>
            <style>
                body { margin: 0; padding: 10px; font-family: sans-serif; }
                ${assignedDesign.css}
            </style>
        </head>
        <body>${assignedDesign.html}</body>
      </html>
    `;
    };

    const formatTime = (sec) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s < 10 ? "0" : ""}${s}`;
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
                {phase === "preview" && (
                    <div style={{
                        display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center", gap: 24, minHeight: "80vh"
                    }}>
                        <div style={{ textAlign: "center" }}>
                            <h1 className="section-title" style={{ fontSize: "2.5rem", marginBottom: 16 }}>👀 Memorize this Design!</h1>
                            <div style={{
                                fontSize: "3rem", fontWeight: "700", color: "var(--accent-primary)",
                                background: "rgba(0,0,0,0.2)", padding: "10px 40px", borderRadius: 12,
                                border: "2px solid var(--accent-primary)", display: "inline-block"
                            }}>
                                {formatTime(timeLeft)}
                            </div>
                        </div>
                        <div className="glass-card" style={{ width: "100%", maxWidth: 1000, height: "60vh", padding: 0, overflow: "hidden", border: "4px solid var(--accent-primary)", borderRadius: 16 }}>
                            <iframe
                                srcDoc={getReferencePreview()}
                                style={{ width: "100%", height: "100%", border: "none", background: "white" }}
                                title="Target Preview"
                            />
                        </div>
                        <p className="subtitle" style={{ opacity: 0.8 }}>Programming phase starts automatically when timer ends.</p>
                    </div>
                )}

                {phase === "coding" && (
                    <>
                        <div className="quiz-header">
                            <div>
                                <h2 className="section-title" style={{ marginBottom: 4 }}>🎨 {assignedDesign?.name}</h2>
                                <p className="subtitle">{assignedDesign?.desc}</p>
                            </div>
                            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                                <div style={{
                                    fontSize: "1.5rem", fontWeight: "700", color: "var(--text-primary)",
                                    background: "var(--bg-card)", padding: "8px 24px", borderRadius: 8,
                                    border: "1px solid var(--border)"
                                }}>
                                    ⏱️ {formatTime(timeLeft)}
                                </div>
                                <button className="btn btn-success" onClick={handleSubmit}>Submit Code</button>
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 20, minHeight: "calc(100vh - 200px)" }}>
                            <div className="glass-card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
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
                                        flex: 1, width: "100%", padding: 16,
                                        background: "var(--bg-primary)", color: "var(--text-primary)",
                                        border: "none", resize: "none", outline: "none",
                                        fontFamily: "var(--font-mono)", fontSize: "0.9rem", lineHeight: 1.6,
                                    }}
                                    spellCheck={false}
                                />
                            </div>

                            <div className="glass-card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                                <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", fontWeight: 600, fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                                    👁️ Your Live Output
                                </div>
                                <iframe
                                    srcDoc={getPreview()}
                                    style={{ flex: 1, width: "100%", border: "none", background: "white" }}
                                    sandbox="allow-scripts"
                                    title="Live Preview"
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>
        </AntiCheat>
    );
}
