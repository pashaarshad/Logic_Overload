"use client";

import { useState } from "react";

export default function PasswordGate({ roundTitle, onSuccess, onClose }) {
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        const trimmed = password.trim();
        if (!trimmed) {
            setError("Please enter a password");
            return;
        }
        onSuccess(trimmed);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-title">🔐 Enter Round Password</div>
                <div className="modal-desc">
                    Enter the password to access <strong>{roundTitle}</strong>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="input-group" style={{ marginBottom: 16 }}>
                        <input
                            type="password"
                            className="input"
                            placeholder="Enter password..."
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setError("");
                            }}
                            autoFocus
                            autoComplete="off"
                        />
                        {error && <div className="modal-error">{error}</div>}
                    </div>
                    <div style={{ display: "flex", gap: 12 }}>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                            Enter Round
                        </button>
                        <button type="button" onClick={onClose} className="btn btn-secondary">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
