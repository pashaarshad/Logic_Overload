"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";
import { getAttempt, saveAttempt } from "@/lib/firestore";

const ROUND_ID = "round4";

const TOPICS = [
    "Food Delivery App (Zomato-like)",
    "Grocery Delivery (Blinkit-like)",
    "E-commerce Store (Amazon-like)",
    "Personal Portfolio / Resume Website",
    "Travel Booking & Tourism Site",
    "Online Learning Platform (Udemy-like)",
    "Real Estate Listing Website",
    "Fitness, Gym & Yoga Website",
    "Job Portal (LinkedIn-like)",
    "Event Management & Booking System",
    "Movie Streaming UI (Netflix-like)",
    "Social Media Dashboard",
    "Tech Blog & News Portal",
    "Car Rental Service",
    "Doctor Appointment Booking System",
    "Restaurant Menu & Reservation",
    "Productivity & To-Do App",
    "Weather Dashboard with Maps",
    "Music Player UI (Spotify-like)",
    "Charity & NGO Donation Page"
];

export default function Round4Page() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [assignedTopic, setAssignedTopic] = useState(null);
    const [isSpinning, setIsSpinning] = useState(false);
    const [spinAngle, setSpinAngle] = useState(0);

    useEffect(() => {
        if (!user) return;
        const init = async () => {
            const attempt = await getAttempt(user.uid, ROUND_ID);
            if (attempt && attempt.assignedTopic) {
                setAssignedTopic(attempt.assignedTopic);
            }
        };
        init();
    }, [user]);

    const handleSpin = async () => {
        if (assignedTopic || isSpinning) return;

        setIsSpinning(true);

        // Random spin calculation
        const randomTopicIndex = Math.floor(Math.random() * TOPICS.length);
        const selectedTopic = TOPICS[randomTopicIndex];

        // Spin animation logic (visual only)
        // 5 full rotations (1800 deg) + random slice
        const sliceAngle = 360 / TOPICS.length;
        const targetAngle = 1800 + (360 - (randomTopicIndex * sliceAngle)); // Land roughly on index? 
        // Actually, for simplicity, we mock the visual spin and just show the result.
        // Let's do a rapid text shuffle effect instead of a complex canvas wheel for reliability.

        // But user asked for a "spinner". Let's do a CSS Wheel.
        const spinValue = 3600 + Math.random() * 360; // Spin at least 10 times
        setSpinAngle(spinValue);

        // Wait for spin to finish (e.g. 3 seconds)
        setTimeout(async () => {
            setAssignedTopic(selectedTopic);
            setIsSpinning(false);

            // Save to Firestore
            await saveAttempt(user.uid, ROUND_ID, {
                assignedTopic: selectedTopic,
                timestamp: Date.now()
            });
        }, 3000);
    };

    if (loading) return <div className="page-center"><div className="spinner"></div></div>;
    if (!user) { router.push("/"); return null; }

    return (
        <div style={{ minHeight: "100vh", background: "var(--bg-primary)", color: "var(--text-primary)" }}>
            <Navbar />
            <div className="container" style={{ textAlign: "center", padding: "80px 20px" }}>
                <h1 className="section-title">Round 4: AI & Web Innovation</h1>
                <p className="subtitle">Leverage AI tools and your creativity to build a stunning website.<br />Spin the wheel to get your project topic!</p>

                <div className="glass-card" style={{ maxWidth: "800px", margin: "40px auto", padding: "40px", position: "relative", overflow: "hidden" }}>

                    {/* The Wheel Visual (Abstract) */}
                    {!assignedTopic && (
                        <div style={{ marginBottom: "30px", height: "300px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                            <div
                                style={{
                                    width: "250px", height: "250px",
                                    border: "10px solid var(--accent-primary)",
                                    borderRadius: "50%",
                                    display: "flex", justifyContent: "center", alignItems: "center",
                                    transition: "transform 3s cubic-bezier(0.25, 0.1, 0.25, 1)",
                                    transform: `rotate(${spinAngle}deg)`,
                                    background: "conic-gradient(from 0deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3, #54a0ff, #5f27cd, #ff6b6b)",
                                    boxShadow: "0 0 20px rgba(0,0,0,0.3)"
                                }}
                            >
                                <div style={{ width: "20px", height: "20px", background: "white", borderRadius: "50%" }}></div>
                            </div>
                            {/* Arrow */}
                            <div style={{
                                position: "absolute", top: "40px", left: "50%", transform: "translateX(-50%)",
                                width: "0", height: "0",
                                borderLeft: "15px solid transparent", borderRight: "15px solid transparent", borderTop: "25px solid white",
                                zIndex: 10
                            }}></div>
                        </div>
                    )}

                    {assignedTopic ? (
                        <div style={{ animation: "fadeIn 1s" }}>
                            <h2 style={{ fontSize: "2.5rem", color: "#4caf50", marginBottom: "20px" }}>🎉 Your Topic Assigned! 🎉</h2>
                            <div style={{
                                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                padding: "30px", borderRadius: "15px",
                                boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
                                marginBottom: "30px",
                                border: "2px solid white"
                            }}>
                                <h1 style={{ margin: 0, fontSize: "3rem", color: "white", textShadow: "2px 2px 4px rgba(0,0,0,0.3)" }}>
                                    {assignedTopic}
                                </h1>
                            </div>
                            <p style={{ fontSize: "1.2rem", lineHeight: "1.6", color: "var(--text-secondary)" }}>
                                You can now start building! Use <b>AI tools</b>, the internet, and any resources you need.
                                <br />Be creative, innovate, and make it functional.
                            </p>
                        </div>
                    ) : (
                        <div>
                            <button
                                onClick={handleSpin}
                                disabled={isSpinning}
                                className="btn btn-primary"
                                style={{
                                    fontSize: "1.5rem", padding: "15px 40px",
                                    transform: isSpinning ? "scale(0.95)" : "scale(1)",
                                    opacity: isSpinning ? 0.8 : 1
                                }}
                            >
                                {isSpinning ? "Spinning..." : "🎲 Spin to Get Topic 🎲"}
                            </button>
                        </div>
                    )}
                </div>

                <div style={{ marginTop: "40px", textAlign: "left", maxWidth: "800px", margin: "0 auto" }}>
                    <h3 style={{ color: "var(--text-primary)", borderBottom: "1px solid var(--border)", paddingBottom: "10px" }}>ℹ️ Round Instructions</h3>
                    <ul style={{ listStyle: "circle", paddingLeft: "20px", lineHeight: "1.8", fontSize: "1.1rem", color: "var(--text-secondary)" }}>
                        <li>This works on a <b>"Spin the Wheel"</b> mechanism. Everyone gets a random topic.</li>
                        <li>Once assigned, the topic is <b>fixed</b> and cannot be changed.</li>
                        <li><b>Allowed Tools:</b> You MAY use ChatGPT, V0, or any AI tool to generate code/assets.</li>
                        <li><b>Goal:</b> Create a functional/visual prototype of the assigned website idea.</li>
                        <li><b>Judging Criteria:</b> Creativity, Use of AI, Aesthetics, and Functionality.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
