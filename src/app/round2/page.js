"use client";

import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";

export default function Round2Page() {
    const { user, loading } = useAuth();
    const router = useRouter();

    if (loading) {
        return (
            <div className="page-center">
                <div className="spinner-container"><div className="spinner"></div></div>
            </div>
        );
    }

    if (!user) { router.push("/"); return null; }

    return (
        <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
            <Navbar />
            <div className="container" style={{ padding: "40px 20px", maxWidth: "1200px", margin: "0 auto" }}>
                <h1 className="section-title" style={{ textAlign: "center", marginBottom: "40px" }}>Round 2: The Replica Challenge</h1>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", alignItems: "start" }}>

                    {/* Instructions Column */}
                    <div className="glass-card" style={{ padding: "30px" }}>
                        <h2 style={{ fontSize: "1.8rem", marginBottom: "20px", color: "var(--accent-primary)" }}>Instructions</h2>

                        <div style={{ marginBottom: "30px" }}>
                            <h3 style={{ marginBottom: "10px", color: "var(--text-primary)" }}>🎯 Base Task (5 Marks)</h3>
                            <p style={{ lineHeight: "1.6", color: "var(--text-secondary)" }}>
                                Replicate the design shown in the reference image as closely as possible using HTML and CSS.
                                <br /><br />
                                You should write your code in <b>VS Code</b>, <b>Notepad</b>, or any external editor of your choice.
                            </p>
                        </div>

                        <div style={{ marginBottom: "30px" }}>
                            <h3 style={{ marginBottom: "10px", color: "var(--text-primary)" }}>🚀 Advanced Task ( 5 Marks + Base Task)</h3>
                            <p style={{ marginBottom: "10px", color: "var(--text-secondary)" }}>To achieve full marks, implement the following:</p>
                            <ul style={{ listStyle: "disc", paddingLeft: "20px", lineHeight: "1.8", color: "var(--text-secondary)" }}>
                                <li>Create separate HTML files for <b>Home</b>, <b>About</b>, <b>Services</b>, and <b>Contact</b> pages.</li>
                                <li>Implement functional <b>Navigation (Anchor Tags)</b> to help users move between these pages.</li>
                                <li>Add <b>Hover Effects</b> and <b>Animations</b> to the navigation buttons/links for a polished UI.</li>
                                <li>Ensure separate files are used and linked correctly.</li>
                                <li>Focus on good structure, color usage, and visual appeal.</li>
                            </ul>
                        </div>

                        <div style={{ marginBottom: "20px", background: "rgba(220, 53, 69, 0.1)", border: "1px solid #dc3545", padding: "15px", borderRadius: "8px", color: "#dc3545" }}>
                            <h3 style={{ marginBottom: "10px", color: "#dc3545", display: "flex", alignItems: "center", gap: "8px", fontSize: "1.1rem" }}>
                                ⚠️ Strict Rules
                            </h3>
                            <ul style={{ listStyle: "disc", paddingLeft: "20px", lineHeight: "1.6" }}>
                                <li>You <b>cannot</b> use any online tools.</li>
                                <li>You must do <b>manual coding</b> only.</li>
                                <li><b>No use of any AI tools.</b></li>
                                <li>If you use AI/online tools, you will get <b>-10 marks</b> and will be <b>disqualified</b> if caught with 100% proof.</li>
                            </ul>
                        </div>

                        <div style={{ background: "rgba(255, 193, 7, 0.1)", border: "1px solid #ffc107", padding: "15px", borderRadius: "8px", color: "#e0a800" }}>
                            <strong>Note:</strong> Since you are using external tools, please keep this tab open to view the reference image. Anti-Cheat is disabled for this round.
                        </div>
                    </div>

                    {/* Image Column */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        <h2 style={{ fontSize: "1.5rem", textAlign: "center", color: "var(--text-primary)" }}>Reference Design</h2>
                        <div style={{
                            border: "4px solid var(--border)",
                            borderRadius: "16px",
                            overflow: "hidden",
                            position: "relative",
                            background: "#000",
                            boxShadow: "0 8px 30px rgba(0,0,0,0.3)"
                        }}>
                            <img
                                src="/round2.png"
                                alt="Round 2 Design Challenge"
                                style={{ width: "100%", height: "auto", display: "block" }}
                            />
                        </div>
                        <div style={{ textAlign: "center", display: "flex", gap: "10px", justifyContent: "center" }}>
                            <a href="/round2.png" download className="btn btn-primary">
                                ⬇️ Download
                            </a>
                            <a href="/round2.png" target="_blank" className="btn btn-secondary">
                                👁️ Preview
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
