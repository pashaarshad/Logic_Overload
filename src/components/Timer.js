"use client";

import { useState, useEffect, useCallback } from "react";

export default function Timer({ totalSeconds, startTime, onTimeUp }) {
    const [remaining, setRemaining] = useState(totalSeconds);

    const calculateRemaining = useCallback(() => {
        if (!startTime) return totalSeconds;
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        return Math.max(0, totalSeconds - elapsed);
    }, [startTime, totalSeconds]);

    useEffect(() => {
        setRemaining(calculateRemaining());

        const interval = setInterval(() => {
            const r = calculateRemaining();
            setRemaining(r);
            if (r <= 0) {
                clearInterval(interval);
                onTimeUp?.();
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [calculateRemaining, onTimeUp]);

    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;

    const timerClass =
        remaining <= 60 ? "timer danger" : remaining <= 300 ? "timer warning" : "timer";

    return (
        <div className={timerClass}>
            <span className="timer-icon">⏱</span>
            <span>
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </span>
        </div>
    );
}
