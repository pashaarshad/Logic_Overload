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
        title: "Problem 1: Count Vowels",
        description: "The code below attempts to count the number of vowels (a, e, i, o, u) in a string. However, there is a syntax/logic error in the condition checking. Find and fix the bug.",
        expectedOutput: "Input: 'hello world' -> Output: 3 (e, o, o)",
        type: "debugging",
        buggyCode: {
            python: `def count_vowels(s):
    count = 0
    vowels = "aeiou"
    for char in s:
        # Check if character is a vowel
        if char in vowels: 
            # Logic error: Incorrect increment or check? 
            # Actually, let's use the Assignment Bug as requested
            pass
            
def count_vowels_demo(s):
    count = 0
    for char in s:
        if char = 'a' or char = 'e' or char = 'i' or char = 'o' or char = 'u': # BUG HERE
            count += 1
    return count

print(count_vowels_demo("hello world"))`,
            c: `#include <stdio.h>
#include <string.h>

int main() {
    char str[] = "hello world";
    int count = 0;
    
    for(int i=0; i < strlen(str); i++) {
        char c = str[i];
        // Check for vowels
        if(c = 'a' || c = 'e' || c = 'i' || c = 'o' || c = 'u') { // BUG HERE
            count++;
        }
    }
    
    printf("%d", count);
    return 0;
}`,
            cpp: `#include <iostream>
#include <string>
using namespace std;

int countVowels(string s) {
    int count = 0;
    for(char c : s) {
        // Check for vowels
        if(c = 'a' || c = 'e' || c = 'i' || c = 'o' || c = 'u') { // BUG HERE
            count++;
        }
    }
    return count;
}

int main() {
    cout << countVowels("hello world");
    return 0;
}`,
            java: `public class Main {
    public static void main(String[] args) {
        String str = "hello world";
        int count = 0;
        
        for(int i=0; i<str.length(); i++) {
            char c = str.charAt(i);
            // Check for vowels
            if(c = 'a' || c = 'e' || c = 'i' || c = 'o' || c = 'u') { // BUG HERE
                count++;
            }
        }
        
        System.out.println(count);
    }
}`,
            php: `<?php
function count_vowels($str) {
    $count = 0;
    for ($i = 0; $i < strlen($str); $i++) {
        $c = $str[$i];
        if ($c = 'a' || $c = 'e' || $c = 'i' || $c = 'o' || $c = 'u') { // BUG HERE
            $count++;
        }
    }
    return $count;
}
echo count_vowels("hello world");
?>`
        }
    },
    q2: {
        id: "q2",
        title: "Problem 2: Factorial Fix",
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
    q3: {
        id: "q3",
        title: "Problem 3: Two Sum (LeetCode #1)",
        description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.",
        link: "https://leetcode.com/problems/two-sum/",
        instruction: "Solve this problem on LeetCode or your local machine."
    },
    q4: {
        id: "q4",
        title: "Problem 4: Remove Duplicates (LeetCode #26)",
        description: "Given an integer array `nums` sorted in non-decreasing order, remove the duplicates in-place such that each unique element appears only once.",
        link: "https://leetcode.com/problems/remove-duplicates-from-sorted-array/",
        instruction: "Solve this problem on LeetCode or your local machine."
    }
};

export default function Round3Page() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("q1");
    const [answers, setAnswers] = useState({
        q1: { lang: "python", code: PROBLEMS.q1.buggyCode.python },
        q2: { lang: "python", code: PROBLEMS.q2.buggyCode.python },
        q3: "",
        q4: ""
    });
    const [runOutput, setRunOutput] = useState({ q1: null, q2: null });
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
                    q2: attempt.q2 || prev.q2,
                    q3: attempt.q3 || "",
                    q4: attempt.q4 || ""
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
        setRunOutput(prev => ({ ...prev, [qId]: null })); // Reset output
    };

    const handleCodeChange = (qId, newCode) => {
        setAnswers(prev => {
            if (qId === 'q3' || qId === 'q4') {
                return { ...prev, [qId]: newCode };
            }
            return {
                ...prev,
                [qId]: { ...prev[qId], code: newCode }
            };
        });
        setRunOutput(prev => ({ ...prev, [qId]: null })); // Reset output check
    };

    // Client-side mock runner for specific fixes
    const handleRunCode = (qId) => {
        const { lang, code } = answers[qId];
        let passed = false;
        let output = "";

        if (qId === "q1") {
            // Check if assignments '=' are replaced with equality '=='
            // Simplified check: looking for '==' usage instead of '=' inside logic
            // Or roughly checking if the specific buggy line is fixed
            if (code.includes("== 'a'") || code.includes("=='a'") || code.includes("== 'e'")) {
                passed = true;
            } else if (lang === 'python' && code.includes("in vowels")) {
                // Heuristic improvement
                passed = true;
            }

            // Check if they carelessly left the single '='
            if (code.includes("= 'a'") || code.includes("='a'")) {
                passed = false;
            }

            if (passed) output = "✅ passed! Output: 3";
            else output = "❌ Error: Syntax/Logic Error. Counts do not match expected.";
        }
        else if (qId === "q2") {
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
            <div className="glass-card" style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
                <h2 style={{ color: "var(--accent-primary)", marginBottom: "15px" }}>{problem.title}</h2>
                <p style={{ lineHeight: "1.6", whiteSpace: "pre-line", marginBottom: "30px", fontSize: "1.1rem" }}>{problem.description}</p>

                <div style={{ marginBottom: "40px" }}>
                    <a
                        href={problem.link}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-primary"
                        style={{ fontSize: "1.2rem", padding: "15px 30px", textDecoration: "none" }}
                    >
                        🚀 Solve on LeetCode
                    </a>
                </div>

                <div style={{ background: "rgba(0,0,0,0.2)", padding: "20px", borderRadius: "8px" }}>
                    <h3 style={{ marginBottom: "10px", color: "var(--text-primary)" }}>Instructions</h3>
                    <p style={{ color: "var(--text-secondary)", marginBottom: "10px" }}>{problem.instruction}</p>
                    <div style={{ color: "#4caf50", fontWeight: "bold", fontSize: "1.2rem", marginTop: "15px" }}>
                        🏆 Reward: 500 Marks
                    </div>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "10px", opacity: 0.8 }}>
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
                {activeTab === 'q2' && renderDebugger('q2')}
                {activeTab === 'q3' && renderManualProblem('q3')}
                {activeTab === 'q4' && renderManualProblem('q4')}
            </div>
        </div>
    );
}
