"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { getAntiCheatLog, saveAntiCheatLog } from "@/lib/firestore";

const UNLOCK_PASSWORD = "6565";
const MAX_WARNINGS = 3;

export default function AntiCheat({ children, active = true }) {
    const { user } = useAuth();
    const [warnings, setWarnings] = useState(0);
    const [locked, setLocked] = useState(false);
    const [showWarning, setShowWarning] = useState(false);
    const [warningMessage, setWarningMessage] = useState("");
    const [unlockInput, setUnlockInput] = useState("");
    const [unlockError, setUnlockError] = useState("");
    const warningsRef = useRef(0);

    // Load anti-cheat state from Firebase
    useEffect(() => {
        if (!user || !active) return;

        const loadState = async () => {
            const log = await getAntiCheatLog(user.uid);
            if (log) {
                setWarnings(log.warnings || 0);
                warningsRef.current = log.warnings || 0;
                if ((log.warnings || 0) > MAX_WARNINGS) {
                    setLocked(true);
                }
            }
        };
        loadState();
    }, [user, active]);

    const triggerWarning = useCallback(
        async (reason) => {
            if (!user || locked) return;

            const newCount = warningsRef.current + 1;
            warningsRef.current = newCount;
            setWarnings(newCount);

            // Save to Firebase
            await saveAntiCheatLog(user.uid, {
                warnings: newCount,
                lastViolation: reason,
                lastViolationAt: Date.now(),
            });

            if (newCount > MAX_WARNINGS) {
                setLocked(true);
                return;
            }

            // Show warning popup
            const messages = [
                "⚠️ Warning 1/3: Please stay on this tab and don't try to copy content.",
                "⚠️ Warning 2/3: This is your second warning. One more and your screen will be locked.",
                "🚨 Warning 3/3: FINAL WARNING! Next violation will lock your screen. An organizer password will be required to continue.",
            ];
            setWarningMessage(messages[newCount - 1] || messages[2]);
            setShowWarning(true);
        },
        [user, locked]
    );

    // Block copy/paste/cut
    useEffect(() => {
        if (!active) return;

        const handleCopy = (e) => {
            e.preventDefault();
            triggerWarning("copy_attempt");
        };
        const handlePaste = (e) => {
            e.preventDefault();
            triggerWarning("paste_attempt");
        };
        const handleCut = (e) => {
            e.preventDefault();
            triggerWarning("cut_attempt");
        };
        const handleContextMenu = (e) => {
            e.preventDefault();
            triggerWarning("right_click");
        };

        document.addEventListener("copy", handleCopy);
        document.addEventListener("paste", handlePaste);
        document.addEventListener("cut", handleCut);
        document.addEventListener("contextmenu", handleContextMenu);

        return () => {
            document.removeEventListener("copy", handleCopy);
            document.removeEventListener("paste", handlePaste);
            document.removeEventListener("cut", handleCut);
            document.removeEventListener("contextmenu", handleContextMenu);
        };
    }, [active, triggerWarning]);

    // Tab switch detection
    useEffect(() => {
        if (!active) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                triggerWarning("tab_switch");
            }
        };

        const handleBlur = () => {
            triggerWarning("window_blur");
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("blur", handleBlur);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("blur", handleBlur);
        };
    }, [active, triggerWarning]);

    // Block keyboard shortcuts
    useEffect(() => {
        if (!active) return;

        const handleKeyDown = (e) => {
            // Block Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+A, Ctrl+U, F12
            if (
                (e.ctrlKey && ["c", "v", "x", "a", "u"].includes(e.key.toLowerCase())) ||
                e.key === "F12"
            ) {
                e.preventDefault();
                triggerWarning(`keyboard_shortcut_${e.key}`);
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [active, triggerWarning]);

    const handleUnlock = (e) => {
        e.preventDefault();
        if (unlockInput === UNLOCK_PASSWORD) {
            setLocked(false);
            setUnlockInput("");
            setUnlockError("");
            // Reset warnings in Firebase after unlock
            saveAntiCheatLog(user.uid, { warnings: 0, unlockedAt: Date.now() });
            warningsRef.current = 0;
            setWarnings(0);
        } else {
            setUnlockError("Incorrect password. Ask the organizer for help.");
        }
    };

    if (!active) return children;

    return (
        <>
            {children}

            {/* Warning popup */}
            {showWarning && !locked && (
                <div className="warning-overlay" onClick={() => setShowWarning(false)}>
                    <div className="warning-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="warning-icon">⚠️</div>
                        <h2 style={{ marginBottom: 12 }}>Violation Detected</h2>
                        <p style={{ color: "var(--text-secondary)", marginBottom: 20 }}>
                            {warningMessage}
                        </p>
                        <div className="warning-count">
                            Warnings: {warnings}/{MAX_WARNINGS}
                        </div>
                        <button
                            className="btn btn-primary"
                            style={{ marginTop: 20 }}
                            onClick={() => setShowWarning(false)}
                        >
                            I Understand
                        </button>
                    </div>
                </div>
            )}

            {/* Lock screen */}
            {locked && (
                <div className="lock-overlay">
                    <div className="lock-modal">
                        <div className="lock-icon">🔒</div>
                        <h2 style={{ marginBottom: 8 }}>Screen Locked</h2>
                        <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>
                            Too many violations detected. Please ask the organizer to unlock
                            your screen with the password.
                        </p>
                        <form onSubmit={handleUnlock}>
                            <div className="input-group" style={{ marginBottom: 16 }}>
                                <input
                                    type="password"
                                    className="input"
                                    placeholder="Enter unlock password..."
                                    value={unlockInput}
                                    onChange={(e) => {
                                        setUnlockInput(e.target.value);
                                        setUnlockError("");
                                    }}
                                    autoFocus
                                />
                                {unlockError && (
                                    <div className="modal-error">{unlockError}</div>
                                )}
                            </div>
                            <button type="submit" className="btn btn-primary btn-full">
                                Unlock
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
