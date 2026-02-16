"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Timer from "@/components/Timer";
import AntiCheat from "@/components/AntiCheat";
import { getQuestions, getAttempt, saveAttempt, getRoundConfig } from "@/lib/firestore";

const ROUND_ID = "round1";

export default function Round1Page() {
    const { user, userData, loading } = useAuth();
    const router = useRouter();

    const [questions, setQuestions] = useState([]);
    const [currentQ, setCurrentQ] = useState(0);
    const [answered, setAnswered] = useState({});
    const [score, setScore] = useState(0);
    const [startTime, setStartTime] = useState(null);
    const [timeLimit, setTimeLimit] = useState(1800); // 30 min default
    const [selectedOption, setSelectedOption] = useState(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const hasInitialized = useRef(false);

    // Load questions & attempt state
    useEffect(() => {
        if (!user || hasInitialized.current) return;
        hasInitialized.current = true;

        const init = async () => {
            // Get round config
            const config = await getRoundConfig(ROUND_ID);
            if (config?.timeLimit) {
                setTimeLimit(config.timeLimit * 60);
            }

            // Get questions
            const qs = await getQuestions(ROUND_ID);
            setQuestions(qs);

            // Check existing attempt
            const attempt = await getAttempt(user.uid, ROUND_ID);

            if (attempt?.completed) {
                setCompleted(true);
                setScore(attempt.score || 0);
                setAnswered(attempt.answered || {});
                setCurrentQ(qs.length);
                setStartTime(attempt.startTime);
                setPageLoading(false);
                return;
            }

            if (attempt) {
                // Resume from saved state
                setCurrentQ(attempt.currentQuestion || 0);
                setAnswered(attempt.answered || {});
                setScore(attempt.score || 0);
                setStartTime(attempt.startTime);
            } else {
                // Wait for user to start manually
                setStartTime(null);
            }

            setPageLoading(false);
        };

        init();
    }, [user, userData]);

    const handleStartQuiz = async () => {
        setPageLoading(true);
        const now = Date.now();
        setStartTime(now);

        await saveAttempt(user.uid, ROUND_ID, {
            currentQuestion: 0,
            answered: {},
            score: 0,
            startTime: now,
            completed: false,
            team: userData?.team || "",
            name: userData?.name || "",
        });
        setPageLoading(false);
    };

    // Handle answer selection
    const handleAnswer = useCallback(
        async (optionIndex) => {
            if (showFeedback || !questions[currentQ]) return;

            const question = questions[currentQ];
            const isCorrect = optionIndex === question.correctAnswer;
            const newScore = isCorrect ? score + 1 : score;
            const newAnswered = {
                ...answered,
                [question.id]: { selected: optionIndex, correct: isCorrect },
            };
            const nextQ = currentQ + 1;

            setSelectedOption(optionIndex);
            setShowFeedback(true);
            setScore(newScore);
            setAnswered(newAnswered);

            // Save to Firebase immediately
            const isLast = nextQ >= questions.length;
            await saveAttempt(user.uid, ROUND_ID, {
                currentQuestion: nextQ,
                answered: newAnswered,
                score: newScore,
                completed: isLast,
                ...(isLast ? { endTime: Date.now(), timeTaken: Math.floor((Date.now() - startTime) / 1000) } : {}),
            });

            // Auto-advance after feedback delay
            setTimeout(() => {
                setSelectedOption(null);
                setShowFeedback(false);
                if (isLast) {
                    setCompleted(true);
                } else {
                    setCurrentQ(nextQ);
                }
            }, 1200);
        },
        [currentQ, questions, score, answered, showFeedback, user, startTime]
    );

    // Handle time up
    const handleTimeUp = useCallback(async () => {
        if (completed || !startTime) return;
        setCompleted(true);
        await saveAttempt(user.uid, ROUND_ID, {
            completed: true,
            endTime: Date.now(),
            timeTaken: Math.floor((Date.now() - startTime) / 1000),
        });
    }, [user, startTime, completed]);

    if (loading || pageLoading) {
        return (
            <div className="page-center">
                <div className="spinner-container">
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    if (!user) {
        router.push("/");
        return null;
    }

    // START SCREEN
    if (!startTime && !completed) {
        return (
            <>
                <Navbar />
                <div className="page-center">
                    <div className="glass-card" style={{ maxWidth: 600, textAlign: "center" }}>
                        <h1 className="section-title" style={{ fontSize: "2rem", marginBottom: 16 }}>Ready for Round 1?</h1>
                        <p className="subtitle" style={{ marginBottom: 32 }}>
                            You have 30 questions and 30 minutes.
                            The timer will start immediately when you click the button below.
                            <br /><br />
                            <span style={{ color: "var(--warning)" }}>⚠️ Do not refresh or close the page once started.</span>
                        </p>
                        <button className="btn btn-primary btn-lg" onClick={handleStartQuiz}>
                            🚀 Start Quiz
                        </button>
                    </div>
                </div>
            </>
        );
    }

    // COMPLETED — Show results
    if (completed) {
        const totalQ = questions.length || 30;
        const wrong = Object.values(answered).filter((a) => !a.correct).length;
        const unattempted = totalQ - Object.keys(answered).length;
        const timeTaken = startTime
            ? Math.floor((Date.now() - startTime) / 1000)
            : 0;
        const mins = Math.floor(timeTaken / 60);
        const secs = timeTaken % 60;

        return (
            <>
                <Navbar />
                <div className="results-container">
                    <div style={{ fontSize: "4rem", marginBottom: 16 }}>🎉</div>
                    <h1 className="section-title" style={{ fontSize: "1.8rem" }}>
                        Round 1 Complete!
                    </h1>
                    <div className="results-score">
                        {score}/{totalQ}
                    </div>
                    <div className="results-grid">
                        <div className="result-item">
                            <div className="value" style={{ color: "var(--success)" }}>
                                {score}
                            </div>
                            <div className="label">Correct</div>
                        </div>
                        <div className="result-item">
                            <div className="value" style={{ color: "var(--error)" }}>
                                {wrong}
                            </div>
                            <div className="label">Wrong</div>
                        </div>
                        <div className="result-item">
                            <div className="value" style={{ color: "var(--text-muted)" }}>
                                {unattempted}
                            </div>
                            <div className="label">Unattempted</div>
                        </div>
                    </div>
                    <div
                        className="glass-card"
                        style={{ marginTop: 24, display: "inline-block" }}
                    >
                        <span style={{ color: "var(--text-secondary)" }}>Time Taken: </span>
                        <span
                            style={{
                                fontFamily: "var(--font-mono)",
                                fontWeight: 700,
                                fontSize: "1.1rem",
                            }}
                        >
                            {mins}m {secs}s
                        </span>
                    </div>
                    <div style={{ marginTop: 32 }}>
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={() => router.push("/dashboard")}
                        >
                            ← Back to Dashboard
                        </button>
                    </div>
                </div>
            </>
        );
    }

    // QUIZ — Active
    const question = questions[currentQ];
    if (!question) {
        return (
            <div className="page-center">
                <div className="empty-state">
                    <div className="empty-icon">📋</div>
                    <p>No questions loaded. Please contact the admin.</p>
                </div>
            </div>
        );
    }

    const letters = ["A", "B", "C", "D"];

    return (
        <AntiCheat active={true}>
            <Navbar />
            <div className="quiz-container">
                {/* Header */}
                <div className="quiz-header">
                    <div className="quiz-progress">
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{
                                    width: `${((currentQ + 1) / questions.length) * 100}%`,
                                }}
                            ></div>
                        </div>
                        <span className="progress-text">
                            {currentQ + 1} / {questions.length}
                        </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <div
                            className="progress-text"
                            style={{ color: "var(--success)", fontSize: "1rem" }}
                        >
                            Score: {score}
                        </div>
                        <Timer
                            totalSeconds={timeLimit}
                            startTime={startTime}
                            onTimeUp={handleTimeUp}
                        />
                    </div>
                </div>

                {/* Question */}
                <div className="question-card">
                    <div className="question-number">
                        Question {currentQ + 1} of {questions.length}
                    </div>
                    <div className="question-text">{question.question}</div>

                    <div className="options-grid">
                        {question.options.map((option, idx) => {
                            let optClass = "option-btn";
                            if (showFeedback) {
                                if (idx === question.correctAnswer) {
                                    optClass += " correct";
                                } else if (idx === selectedOption && idx !== question.correctAnswer) {
                                    optClass += " wrong";
                                }
                            }

                            return (
                                <button
                                    key={idx}
                                    className={optClass}
                                    onClick={() => handleAnswer(idx)}
                                    disabled={showFeedback}
                                >
                                    <span className="option-letter">{letters[idx]}</span>
                                    <span>{option}</span>
                                </button>
                            );
                        })}
                    </div>

                    {showFeedback && (
                        <div
                            className={`feedback ${selectedOption === question.correctAnswer ? "correct" : "wrong"
                                }`}
                        >
                            {selectedOption === question.correctAnswer
                                ? "✅ Correct! +1 point"
                                : `❌ Wrong! The correct answer was: ${letters[question.correctAnswer]
                                }. ${question.options[question.correctAnswer]}`}
                        </div>
                    )}
                </div>
            </div>
        </AntiCheat>
    );
}
