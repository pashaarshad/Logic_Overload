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
        title: "Problem 1: Palindrome Fix",
        description: "The code below attempts to check if a string is a palindrome (reads same forwards and backwards). However, there is a syntax/logic error preventing it from working correctly. Find and fix the bug.",
        expectedOutput: "Input: 'madam' -> Output: True\nInput: 'hello' -> Output: False",
        buggyCode: {
            python: `def is_palindrome(s):
    # Reverse the string
    rev = s[::-1]
    
    # Check if equal
    if s = rev:  # BUG HERE
        return True
    return False

print(is_palindrome("madam"))`,
            c: `#include <stdio.h>
#include <string.h>

int main() {
    char str[] = "madam";
    int len = strlen(str);
    int flag = 1;
    
    for(int i=0; i < len/2; i++) {
        // Check characters
        if(str[i] = str[len-i-1]) { // BUG HERE
            flag = 0;
            break;
        }
    }
    
    if(flag) printf("True");
    else printf("False");
    return 0;
}`,
            cpp: `#include <iostream>
#include <string>
#include <algorithm>
using namespace std;

bool isPalindrome(string s) {
    string rev = s;
    reverse(rev.begin(), rev.end());
    
    // Check equality
    if (s = rev) { // BUG HERE
        return true;
    }
    return false;
}

int main() {
    cout << isPalindrome("madam");
    return 0;
}`,
            java: `public class Main {
    public static void main(String[] args) {
        String str = "madam";
        String rev = new StringBuilder(str).reverse().toString();
        
        // Check equality
        if (str = rev) { // BUG HERE
            System.out.println("True");
        } else {
            System.out.println("False");
        }
    }
}`,
            php: `<?php
function is_palindrome($str) {
    if ($str = strrev($str)) { // BUG HERE
        return "True";
    }
    return "False";
}
echo is_palindrome("madam");
?>`
        }
    },
    q2: {
        id: "q2",
        title: "Problem 2: Factorial Fix",
        description: "The code below attempts to calculate the factorial of a number (n!). However, the result is always incorrect due to an initialization error. Find and fix the bug.",
        expectedOutput: "Input: 5 -> Output: 120 (1*2*3*4*5)",
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
        title: "Problem 3: Pattern Printing",
        description: "Write a program in your preferred language to print the following pattern exactly as shown below. You must run this in your local system first to verify the output.",
        pattern: `*
1
* 1
* 1 *
* 1 * 2`,
        instruction: "Paste your working solution code in the area below."
    },
    q4: {
        id: "q4",
        title: "Problem 4: Array Sum (Two Sum)",
        description: "Given an array of integers `nums` and an integer `target`, write a program to return indices of the two numbers such that they add up to `target`.",
        example: "Input: nums = [2,7,11,15], target = 9\nOutput: [0,1] (Because nums[0] + nums[1] == 9)",
        instruction: "Solve this problem (LeetCode #1) locally and paste your solution code below."
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
                        <select
                            value={currentAns.lang}
                            onChange={(e) => handleLangChange(qId, e.target.value)}
                            style={{ padding: "5px 10px", borderRadius: "4px", background: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                        >
                            {Object.keys(problem.buggyCode).map(lang => (
                                <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                            ))}
                        </select>
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
                </div>
            </div>
        );
    };

    const renderManualProblem = (qId) => {
        const problem = PROBLEMS[qId];
        return (
            <div className="glass-card" style={{ maxWidth: "800px", margin: "0 auto" }}>
                <h2 style={{ color: "var(--accent-primary)", marginBottom: "15px" }}>{problem.title}</h2>
                <p style={{ lineHeight: "1.6", whiteSpace: "pre-line", marginBottom: "20px" }}>{problem.description}</p>

                {problem.pattern && (
                    <div style={{ background: "rgba(0,0,0,0.2)", padding: "20px", borderRadius: "8px", marginBottom: "20px", textAlign: "left" }}>
                        <pre style={{ margin: 0, fontFamily: "monospace", color: "var(--text-primary)", fontSize: "1.2rem", lineHeight: "1.5" }}>{problem.pattern}</pre>
                    </div>
                )}

                {problem.example && (
                    <div style={{ background: "rgba(0,0,0,0.2)", padding: "15px", borderRadius: "8px", marginBottom: "20px" }}>
                        <h4 style={{ color: "var(--text-secondary)", marginBottom: "8px" }}>Example:</h4>
                        <pre style={{ margin: 0, fontFamily: "monospace", color: "#4caf50" }}>{problem.example}</pre>
                    </div>
                )}

                <div style={{ marginBottom: "20px" }}>
                    <p style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>{problem.instruction}</p>
                </div>

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
