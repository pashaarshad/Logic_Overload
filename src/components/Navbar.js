"use client";

import { useAuth } from "@/context/AuthContext";
import { signOut } from "@/lib/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Navbar() {
    const { user, userData, isAdmin } = useAuth();
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut();
        router.push("/");
    };

    return (
        <nav className="navbar">
            <Link href={isAdmin ? "/admin" : "/dashboard"} className="navbar-brand">
                <span className="navbar-logo">⚡ Logic Overload</span>
            </Link>

            <div className="navbar-links">
                {user && (
                    <>
                        {!isAdmin && (
                            <Link href="/dashboard" className="btn btn-secondary btn-sm">
                                Dashboard
                            </Link>
                        )}
                        {isAdmin && (
                            <Link href="/admin" className="btn btn-secondary btn-sm">
                                Admin
                            </Link>
                        )}
                        <Link href="/leaderboard" className="btn btn-secondary btn-sm">
                            Leaderboard
                        </Link>

                        <div className="navbar-user">
                            {userData?.team && (
                                <span className="navbar-team">{userData.team}</span>
                            )}
                            {userData?.photoURL && (
                                <img
                                    src={userData.photoURL}
                                    alt="Profile"
                                    className="navbar-avatar"
                                    referrerPolicy="no-referrer"
                                />
                            )}
                            <button onClick={handleSignOut} className="btn btn-sm btn-secondary">
                                Sign Out
                            </button>
                        </div>
                    </>
                )}
            </div>
        </nav>
    );
}
