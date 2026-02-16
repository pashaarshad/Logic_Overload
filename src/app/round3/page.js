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
        title: "Problem 1: Factorial Fix",
        description: "The code below attempts to calculate the factorial of a number (n!). However, the result is always incorrect due to an initialization error. Find and fix the initialization bug.",
        expectedOutput: "Input: 5 -> Output: 120 (1*2*3*4*5)",
        type: "debugging",
        buggyCode: {
            python: `def factorial(n):
    result = 0 # BUG HERE: Initialization
    for i in range(1, n + 1):
        result *= i
    return result

print(factorial(5))`,
            c: `#include <stdio.h>

int main() {
    int n = 5;
    int result = 0; // BUG HERE: Initialization
    
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
    int result = 0; // BUG HERE: Initialization
    
    for(int i=1; i<=n; i++) {
        result *= i;
    }
    
    cout << result;
    return 0;
}`,
            java: `public class Main {
    public static void main(String[] args) {
        int n = 5;
        int result = 0; // BUG HERE: Initialization
        
        for(int i=1; i<=n; i++) {
            result *= i;
        }
        
        System.out.println(result);
    }
}`,
            php: `<?php
function factorial($n) {
    $result = 0; // BUG HERE: Initialization
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
        title: "Problem 2: Two Sum",
        description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.
You can return the answer in any order.

Example 1:
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].

Example 2:
Input: nums = [3,2,4], target = 6
Output: [1,2]

Example 3:
Input: nums = [3,3], target = 6
Output: [0,1]

Constraints:
2 <= nums.length <= 104
-109 <= nums[i] <= 109
-109 <= target <= 109
Only one valid answer exists.`,
        instruction: "Solve this problem locally using any programming language."
    },
    q3: {
        id: "q3",
        title: "Problem 3: Remove Duplicates from Sorted Array",
        description: `Given an integer array nums sorted in non-decreasing order, remove the duplicates in-place such that each unique element appears only once. The relative order of the elements should be kept the same.

Consider the number of unique elements in nums to be k. After removing duplicates, return the number of unique elements k.

The first k elements of nums should contain the unique numbers in sorted order. The remaining elements beyond index k - 1 can be ignored.

Example 1:
Input: nums = [1,1,2]
Output: 2, nums = [1,2,_]
Explanation: Your function should return k = 2, with the first two elements of nums being 1 and 2 respectively.

Example 2:
Input: nums = [0,0,1,1,1,2,2,3,3,4]
Output: 5, nums = [0,1,2,3,4,_,_,_,_,_]
Explanation: Your function should return k = 5, with the first five elements of nums being 0, 1, 2, 3, and 4 respectively.

Constraints:
1 <= nums.length <= 3 * 104
-100 <= nums[i] <= 100
nums is sorted in non-decreasing order.`,
        instruction: "Solve this problem locally using any programming language."
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
            }
        };
        init();
    }, [user]);

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
        // Only for Q1 (Debugging)
        if (qId === 'q1') {
            setAnswers(prev => ({
                ...prev,
                [qId]: { ...prev[qId], code: newCode }
            }));
            setRunOutput(prev => ({ ...prev, [qId]: null }));
        }
    };

    // Client-side mock runner for specific fixes
    const handleRunCode = (qId) => {
        const { lang, code } = answers[qId];
        let passed = false;
        let output = "";

        if (qId === "q1") {
            // Factorial: Check initialization
            // Looking for result = 1
            if (code.includes("result = 1") || code.includes("result=1") || code.includes("$result = 1")) {
                passed = true;
                output = "✅ Passed! Output: 120";
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
                    <p className="subtitle">Your solutions have been recorded. Great job tackling those Data Structures & Algorithms!</p>
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

                    <div style={{ background: "rgba(0,0,0,0.2)", padding: "15px", borderRadius: "8px", marginBottom: "20px" }}>
                        <h4 style={{ color: "var(--text-secondary)", marginBottom: "8px" }}>Expected Output:</h4>
                        <pre style={{ margin: 0, fontFamily: "monospace", color: "#4caf50" }}>{problem.expectedOutput}</pre>
                    </div>

                    <div style={{ background: "rgba(255, 193, 7, 0.1)", border: "1px solid #ffc107", padding: "10px", borderRadius: "8px", color: "#e0a800" }}>
                        <strong>Wait!</strong> Select your preferred language on the right before fixing the code.
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
        return (
            <div className="glass-card" style={{ maxWidth: "800px", margin: "0 auto", textAlign: "left" }}>
                <h2 style={{ color: "var(--accent-primary)", marginBottom: "20px" }}>{problem.title}</h2>
                <div style={{ lineHeight: "1.7", whiteSpace: "pre-line", marginBottom: "30px", fontSize: "1.05rem", color: "var(--text-primary)" }}>
                    {problem.description}
                </div>

                <div style={{ background: "rgba(0,0,0,0.2)", padding: "20px", borderRadius: "8px", marginTop: "30px" }}>
                    <h3 style={{ marginBottom: "10px", color: "var(--text-primary)" }}>Instructions</h3>
                    <p style={{ color: "var(--text-secondary)", marginBottom: "15px" }}>{problem.instruction}</p>
                    <div style={{ color: "#4caf50", fontWeight: "bold", fontSize: "1.2rem" }}>
                        🏆 Reward: 500 Marks
                    </div>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "5px", opacity: 0.8 }}>
                        (Verification will be done manually by Admins. Please maximize your score!)
                    </p>
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
                    <h1 className="section-title" style={{ margin: 0, fontSize: "1.8rem" }}>Round 3: DSA Challenge</h1>
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
                                cursor: "pointer", fontWeight: "bold", transition: "0.2s"
                            }}
                        >
                            {PROBLEMS[qId].title}
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
