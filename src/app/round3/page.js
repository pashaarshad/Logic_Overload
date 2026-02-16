"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";
import { getAttempt, saveAttempt } from "@/lib/firestore";

const ROUND_ID = "round3";

const PROBLEMS = {
    q1: {
        id: "q1",
        title: "Problem 1: Factorial Fix (5 Marks)",
        description: "The code below attempts to calculate the factorial of a number (n!). However, the result is incorrect. debug the code to make it work correctly.",
        hint: "You don't need to change all the lines. Focus on the most important part (initialization/logic).",
        expectedOutput: "Input: 5 -> Output: 120 (1*2*3*4*5)",
        type: "debugging",
        buggyCode: {
            python: `def factorial(n):
    result = 0 
    for i in range(1, n + 1):
        result *= i
    return result

print(factorial(5))`,
            c: `#include <stdio.h>

int main() {
    int n = 5;
    int result = 0;
    
    for(int i=1; i<=n; i++) {
        result *= i;
    }
    
    printf("%d", result);
    return 0;
}`,
            cpp: `#include <iostream>
using namespace std;

int main() {
    int n = 5;
    int result = 0;
    
    for(int i=1; i<=n; i++) {
        result *= i;
    }
    
    cout << result;
    return 0;
}`,
            java: `public class Main {
    public static void main(String[] args) {
        int n = 5;
        int result = 0;
        
        for(int i=1; i<=n; i++) {
            result *= i;
        }
        
        System.out.println(result);
    }
}`,
            php: `<?php
function factorial($n) {
    $result = 0;
    for ($i = 1; $i <= $n; $i++) {
        $result *= $i;
    }
    return $result;
}
echo factorial(5);
?>`
        }
    },
    q2: {
        id: "q2",
        title: "Problem 2: Pattern Design (5 Marks)",
        description: `Write a program to print the following pattern exactly as shown below for N lines (e.g., N=4).
The pattern involves a mixture of hashes (#) and numbers.

Pattern for N=4:
#
# 1
# 1 #
# 1 # 2

Logic:
Row 1: #
Row 2: # 1
Row 3: # 1 #
Row 4: # 1 # 2

(Alternating sequence starting with #)`,
        instruction: "Solve this problem locally and paste your code below.",
        pattern: `#
# 1
# 1 #
# 1 # 2`
    },
    q3: {
        id: "q3",
        title: "Problem 3: Remove Duplicates (5 Marks)",
        description: `Given an integer array nums sorted in non-decreasing order, remove the duplicates in-place such that each unique element appears only once. The relative order of the elements should be kept the same.

Example 1:
Input: nums = [1,1,2]
Output: 2, nums = [1,2,_]

Example 2:
Input: nums = [0,0,1,1,1,2,2,3,3,4]
Output: 5, nums = [0,1,2,3,4,_,_,_,_,_]`,
        instruction: "Solve this problem locally and paste your code below."
    }
};

export default function Round3Page() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("q1");
    const [answers, setAnswers] = useState({
        q1: { lang: "python", code: PROBLEMS.q1.buggyCode.python },
        q2: "",
        q3: ""
    });
    const [runOutput, setRunOutput] = useState({ q1: null });
    const [submitting, setSubmitting] = useState(false);
    const [completed, setCompleted] = useState(false);

    // Timer for Q1 (5 Minutes)
    const [q1timeLeft, setQ1TimeLeft] = useState(300);
    const [isQ2Unlocked, setIsQ2Unlocked] = useState(false);

    useEffect(() => {
        if (!user) return;
        const init = async () => {
            const attempt = await getAttempt(user.uid, ROUND_ID);
            if (attempt) {
                if (attempt.completed) setCompleted(true);
                setAnswers(prev => ({
                    ...prev,
                    q1: attempt.q1 || prev.q1,
                    q2: attempt.q2 || "",
                    q3: attempt.q3 || ""
                }));

                // If checking reload, maybe unlock if time passed? 
                // For now, simpler to just start timer or rely on saved state if we tracked start time.
                // Assuming session reset on reload for timer or just 5 min per view.
            }
        };
        init();
    }, [user]);

    useEffect(() => {
        if (q1timeLeft > 0) {
            const timer = setInterval(() => {
                setQ1TimeLeft(prev => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        } else {
            setIsQ2Unlocked(true);
        }
    }, [q1timeLeft]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const handleSave = async (isComplete = false) => {
        if (!user) return;
        setSubmitting(true);
        try {
            await saveAttempt(user.uid, ROUND_ID, {
                ...answers,
                completed: isComplete,
                lastUpdated: Date.now()
            });
            if (isComplete) setCompleted(true);
        } catch (e) {
            console.error(e);
        }
        setSubmitting(false);
    };

    const handleLangChange = (qId, lang) => {
        setAnswers(prev => ({
            ...prev,
            [qId]: { lang, code: PROBLEMS[qId].buggyCode[lang] }
        }));
        setRunOutput(prev => ({ ...prev, [qId]: null }));
    };

    const handleCodeChange = (qId, newCode) => {
        if (qId === 'q1') {
            setAnswers(prev => ({
                ...prev,
                [qId]: { ...prev[qId], code: newCode }
            }));
            setRunOutput(prev => ({ ...prev, [qId]: null }));
        } else {
            setAnswers(prev => ({ ...prev, [qId]: newCode }));
        }
    };

    // Client-side mock runner for Q1
    const handleRunCode = (qId) => {
        const { lang, code } = answers[qId];
        let passed = false;
        let output = "";

        if (qId === "q1") {
            // Factorial: Check initialization
            if (code.includes("result = 1") || code.includes("result=1") || code.includes("$result = 1")) {
                passed = true;
                output = "✅ Passed! Output: 120";
                // Optionally auto-unlock Q2 if Q1 is solved?
                // setIsQ2Unlocked(true); 
            } else {
                passed = false;
                output = "❌ Error: Output is 0. Check your initialization.";
            }
        }

        setRunOutput(prev => ({ ...prev, [qId]: { passed, message: output } }));
    };

    if (loading) return <div className="page-center"><div className="spinner"></div></div>;
    if (!user) { router.push("/"); return null; }

    if (completed) {
        return (
            <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
                <Navbar />
                <div className="container" style={{ textAlign: "center", padding: "100px 20px" }}>
                    <h1 className="section-title">Round 3 Submitted!</h1>
                    <p className="subtitle">Your solutions have been recorded. Great job!</p>
                    <button className="btn btn-primary" onClick={() => router.push("/dashboard")}>Back to Dashboard</button>
                </div>
            </div>
        );
    }

    const renderDebugger = (qId) => {
        const problem = PROBLEMS[qId];
        const currentAns = answers[qId];
        const result = runOutput[qId];

        return (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", height: "calc(100vh - 200px)" }}>
                {/* Left: Description */}
                <div className="glass-card" style={{ overflowY: "auto" }}>
                    <h2 style={{ color: "var(--accent-primary)", marginBottom: "15px" }}>{problem.title}</h2>
                    <p style={{ lineHeight: "1.6", whiteSpace: "pre-line", marginBottom: "20px" }}>{problem.description}</p>

                    <div style={{ background: "rgba(0,188,212,0.1)", borderLeft: "4px solid #00bcd4", padding: "15px", marginBottom: "20px", fontStyle: "italic", color: "#e0f7fa" }}>
                        <strong>Hint:</strong> {problem.hint}
                    </div>

                    <div style={{ background: "rgba(0,0,0,0.2)", padding: "15px", borderRadius: "8px", marginBottom: "20px" }}>
                        <h4 style={{ color: "var(--text-secondary)", marginBottom: "8px" }}>Expected Output:</h4>
                        <pre style={{ margin: 0, fontFamily: "monospace", color: "#4caf50" }}>{problem.expectedOutput}</pre>
                    </div>
                </div>

                {/* Right: Editor */}
                <div className="glass-card" style={{ display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>
                    <div style={{ padding: "10px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-card)" }}>
                        <span style={{ fontWeight: "bold" }}>Code Editor</span>
                        <div style={{ display: "flex", gap: "10px" }}>
                            <select
                                value={currentAns.lang}
                                onChange={(e) => handleLangChange(qId, e.target.value)}
                                style={{ padding: "5px 10px", borderRadius: "4px", background: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                            >
                                {Object.keys(problem.buggyCode).map(lang => (
                                    <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                                ))}
                            </select>
                            <button
                                className="btn btn-sm btn-primary"
                                onClick={() => handleRunCode(qId)}
                            >
                                ▶ Run Code
                            </button>
                        </div>
                    </div>
                    <textarea
                        value={currentAns.code}
                        onChange={(e) => handleCodeChange(qId, e.target.value)}
                        style={{
                            flex: 1, width: "100%", padding: "15px",
                            background: "#1e1e1e", color: "#d4d4d4", border: "none",
                            fontFamily: "monospace", resize: "none", outline: "none", lineHeight: "1.5"
                        }}
                        spellCheck="false"
                    />
                    {result && (
                        <div style={{
                            padding: "10px 15px",
                            background: result.passed ? "rgba(40, 167, 69, 0.1)" : "rgba(220, 53, 69, 0.1)",
                            color: result.passed ? "#28a745" : "#dc3545",
                            borderTop: "1px solid var(--border)",
                            fontWeight: "bold",
                            animation: "fadeIn 0.3s"
                        }}>
                            {result.message}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderManualProblem = (qId) => {
        const problem = PROBLEMS[qId];
        if (!isQ2Unlocked) {
            return (
                <div style={{ textAlign: "center", padding: "50px", color: "var(--text-secondary)" }}>
                    <h2>🔒 Locked</h2>
                    <p>Please focus on Problem 1 for the first 5 minutes.</p>
                    <p style={{ fontSize: "1.5rem", marginTop: "20px", fontWeight: "bold", color: "var(--accent-primary)" }}>
                        Unlocks in {formatTime(q1timeLeft)}
                    </p>
                </div>
            );
        }

        return (
            <div className="glass-card" style={{ maxWidth: "800px", margin: "0 auto", textAlign: "left" }}>
                <h2 style={{ color: "var(--accent-primary)", marginBottom: "20px" }}>{problem.title}</h2>
                <div style={{ lineHeight: "1.7", whiteSpace: "pre-line", marginBottom: "30px", fontSize: "1.05rem", color: "var(--text-primary)" }}>
                    {problem.description}
                </div>

                {problem.pattern && (
                    <div style={{ background: "rgba(0,0,0,0.2)", padding: "20px", borderRadius: "8px", marginBottom: "20px", textAlign: "left" }}>
                        <pre style={{ margin: 0, fontFamily: "monospace", color: "var(--text-primary)", fontSize: "1.2rem", lineHeight: "1.5" }}>{problem.pattern}</pre>
                    </div>
                )}

                <div style={{ background: "rgba(0,0,0,0.2)", padding: "20px", borderRadius: "8px", marginTop: "30px" }}>
                    <h3 style={{ marginBottom: "10px", color: "var(--text-primary)" }}>Instructions</h3>
                    <p style={{ color: "var(--text-secondary)", marginBottom: "15px" }}>{problem.instruction}</p>

                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <label style={{ marginBottom: "5px", fontWeight: "bold" }}>Your Solution Code:</label>
                        <textarea
                            value={answers[qId]}
                            onChange={(e) => handleCodeChange(qId, e.target.value)}
                            placeholder="// Paste your code here..."
                            style={{
                                padding: "15px", minHeight: "300px",
                                background: "var(--bg-primary)", color: "var(--text-primary)",
                                border: "1px solid var(--border)", borderRadius: "8px",
                                fontFamily: "monospace", resize: "vertical"
                            }}
                            spellCheck="false"
                        />
                    </div>

                    <div style={{ color: "#4caf50", fontWeight: "bold", fontSize: "1.2rem", marginTop: "20px" }}>
                        🏆 Reward: 5 Marks
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
            <Navbar />
            <div style={{ padding: "20px" }}>
                {/* Header & Tabs */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <div>
                        <h1 className="section-title" style={{ margin: 0, fontSize: "1.8rem" }}>Round 3: DSA Challenge</h1>
                        {!isQ2Unlocked && (
                            <span style={{ color: "var(--accent-primary)", fontSize: "0.9rem", marginLeft: "10px" }}>
                                ⏱️ Next problems unlock in: {formatTime(q1timeLeft)}
                            </span>
                        )}
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                        <button className="btn btn-secondary" onClick={() => handleSave(false)}>Save Progress</button>
                        <button className="btn btn-success" onClick={() => handleSave(true)} disabled={submitting}>
                            {submitting ? "Submitting..." : "Submit All Solutions"}
                        </button>
                    </div>
                </div>

                <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: "20px" }}>
                    {Object.keys(PROBLEMS).map(qId => (
                        <button
                            key={qId}
                            onClick={() => setActiveTab(qId)}
                            style={{
                                padding: "12px 24px",
                                background: activeTab === qId ? "var(--accent-primary)" : "transparent",
                                color: activeTab === qId ? "white" : "var(--text-secondary)",
                                border: "none", borderTopLeftRadius: "8px", borderTopRightRadius: "8px",
                                cursor: "pointer", fontWeight: "bold", transition: "0.2s",
                                opacity: (!isQ2Unlocked && qId !== 'q1') ? 0.5 : 1
                            }}
                        >
                            {PROBLEMS[qId].title} {(!isQ2Unlocked && qId !== 'q1') && "🔒"}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {activeTab === 'q1' && renderDebugger('q1')}
                {activeTab === 'q2' && renderManualProblem('q2')}
                {activeTab === 'q3' && renderManualProblem('q3')}
            </div>
        </div>
    );
}
