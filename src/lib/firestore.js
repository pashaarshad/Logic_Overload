import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    collection,
    getDocs,
    query,
    orderBy,
    where,
    onSnapshot,
    serverTimestamp,
    increment,
    deleteDoc,
    writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";

/* ─── Users ─── */

export async function getUserDoc(uid) {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function createUserDoc(uid, data) {
    await setDoc(doc(db, "users", uid), {
        ...data,
        registeredAt: serverTimestamp(),
    });
}

export async function updateUserDoc(uid, data) {
    await updateDoc(doc(db, "users", uid), data);
}

export async function getNextTeamNumber() {
    const snap = await getDocs(collection(db, "users"));
    return snap.size + 1;
}

export async function getAllUsers() {
    const snap = await getDocs(query(collection(db, "users"), orderBy("registeredAt", "asc")));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/* ─── Rounds ─── */

export async function getRoundConfig(roundId) {
    const snap = await getDoc(doc(db, "rounds", roundId));
    return snap.exists() ? snap.data() : null;
}

export async function updateRoundConfig(roundId, data) {
    await setDoc(doc(db, "rounds", roundId), data, { merge: true });
}

/* ─── Questions ─── */

export async function getQuestions(roundId) {
    const snap = await getDocs(
        query(collection(db, "questions"), where("roundId", "==", roundId), orderBy("order", "asc"))
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function setQuestion(questionId, data) {
    await setDoc(doc(db, "questions", questionId), data, { merge: true });
}

export async function deleteQuestion(questionId) {
    await deleteDoc(doc(db, "questions", questionId));
}

/* ─── Attempts ─── */

export async function getAttempt(uid, roundId) {
    const attemptId = `${uid}_${roundId}`;
    const snap = await getDoc(doc(db, "attempts", attemptId));
    return snap.exists() ? snap.data() : null;
}

export async function saveAttempt(uid, roundId, data) {
    const attemptId = `${uid}_${roundId}`;
    await setDoc(doc(db, "attempts", attemptId), data, { merge: true });
}

export async function deleteAttempt(uid, roundId) {
    const attemptId = `${uid}_${roundId}`;
    await deleteDoc(doc(db, "attempts", attemptId));
}

export function onAttemptSnapshot(uid, roundId, callback) {
    const attemptId = `${uid}_${roundId}`;
    return onSnapshot(doc(db, "attempts", attemptId), (snap) => {
        callback(snap.exists() ? snap.data() : null);
    });
}

/* ─── Results / Leaderboard ─── */

export async function getResults(roundId) {
    const snap = await getDocs(collection(db, "attempts"));
    return snap.docs
        .filter((d) => d.id.endsWith(`_${roundId}`))
        .map((d) => ({ id: d.id, ...d.data() }));
}

export async function getAllAttempts() {
    const snap = await getDocs(collection(db, "attempts"));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/* ─── Anti-Cheat ─── */

export async function getAntiCheatLog(uid) {
    const snap = await getDoc(doc(db, "antiCheat", uid));
    return snap.exists() ? snap.data() : null;
}

export async function saveAntiCheatLog(uid, data) {
    await setDoc(doc(db, "antiCheat", uid), data, { merge: true });
}

export async function incrementWarning(uid) {
    await setDoc(
        doc(db, "antiCheat", uid),
        { warnings: increment(1) },
        { merge: true }
    );
}

/* ─── Seed Initial Data ─── */

export async function seedRounds() {
    const rounds = [
        {
            id: "round1",
            title: "Logic & MCQ Quiz",
            password: "logic001",
            timeLimit: 30,
            totalQuestions: 30,
            isActive: true,
            type: "mcq",
        },
        {
            id: "round2",
            title: "Frontend Design Challenge",
            password: "round2SDCArsh",
            timeLimit: 45,
            totalQuestions: 0,
            isActive: false,
            type: "design",
        },
        {
            id: "round3",
            title: "DSA & Coding Logic",
            password: "round3SDCArsh",
            timeLimit: 60,
            totalQuestions: 0,
            isActive: false,
            type: "hackerrank",
        },
        {
            id: "round4",
            title: "Final Round",
            password: "round4SDCArsh",
            timeLimit: 30,
            totalQuestions: 0,
            isActive: false,
            type: "tbd",
        },
    ];

    const batch = writeBatch(db);
    rounds.forEach((r) => {
        batch.set(doc(db, "rounds", r.id), r, { merge: true });
    });
    await batch.commit();
}

export async function seedQuestions() {
    const questions = [
        // 1-5: Shell, Basic OS, DS, Java
        { order: 1, question: "Which command lists files in a directory in Linux?", options: ["ls", "dir", "show", "list"], correctAnswer: 0, roundId: "round1" },
        { order: 2, question: "Which data structure follows LIFO?", options: ["Queue", "Stack", "Tree", "Graph"], correctAnswer: 1, roundId: "round1" },
        { order: 3, question: "What acts as a bridge between hardware and software?", options: ["Compiler", "Operating System", "Interpreter", "Assembler"], correctAnswer: 1, roundId: "round1" },
        { order: 4, question: "In Java, standard output is printed using?", options: ["System.out.print", "console.log", "print", "echo"], correctAnswer: 0, roundId: "round1" },
        { order: 5, question: "Which command changes the current directory?", options: ["mv", "cd", "cp", "pwd"], correctAnswer: 1, roundId: "round1" },

        // 6-12: Python, PHP, Networking, Cybersecurity
        { order: 6, question: "What is the file extension for Python?", options: [".py", ".pt", ".python", ".p"], correctAnswer: 0, roundId: "round1" },
        { order: 7, question: "PHP scripts define blocks using?", options: ["<?php ... ?>", "<script ...>", "<? ... ?>", "<php ...>"], correctAnswer: 0, roundId: "round1" },
        { order: 8, question: "Which OSI layer transmits raw bits?", options: ["Physical", "Data Link", "Network", "Transport"], correctAnswer: 0, roundId: "round1" },
        { order: 9, question: "What is 127.0.0.1?", options: ["Public IP", "Localhost", "Router IP", "Gateway"], correctAnswer: 1, roundId: "round1" },
        { order: 10, question: "What does SQL Injection target?", options: ["Operating System", "Database", "Firewall", "Network"], correctAnswer: 1, roundId: "round1" },
        { order: 11, question: "Which port does HTTPS use?", options: ["80", "21", "443", "25"], correctAnswer: 2, roundId: "round1" },
        { order: 12, question: "Who is known as the father of AI?", options: ["Alan Turing", "John McCarthy", "Elon Musk", "Guido van Rossum"], correctAnswer: 1, roundId: "round1" },

        // 13-19: Final Year topics (AI, General CS)
        { order: 13, question: "What is the third layer of the OSI Model?", options: ["Physical", "Data Link", "Network", "Transport"], correctAnswer: 2, roundId: "round1" },
        { order: 14, question: "Which algorithm mimics the human brain?", options: ["Neural Networks", "Genetic", "Greedy", "Sorting"], correctAnswer: 0, roundId: "round1" },
        { order: 15, question: "Who founded the World Wide Web?", options: ["Tim Berners-Lee", "Bill Gates", "Steve Jobs", "Vint Cerf"], correctAnswer: 0, roundId: "round1" },
        { order: 16, question: "What represents 'TRUE' in binary?", options: ["0", "1", "-1", "10"], correctAnswer: 1, roundId: "round1" },
        { order: 17, question: "Which is a volatile memory?", options: ["ROM", "HDD", "RAM", "SSD"], correctAnswer: 2, roundId: "round1" },
        { order: 18, question: "What does GUI stand for?", options: ["Graphical User Interface", "Global User Interface", "General Unit Interface", "Gaming User Interface"], correctAnswer: 0, roundId: "round1" },
        { order: 19, question: "Who created Bitcoin?", options: ["Satoshi Nakamoto", "Vitalik Buterin", "Charlie Lee", "Banks"], correctAnswer: 0, roundId: "round1" },

        // 20-30: New & General Tech
        { order: 20, question: "What does IoT stand for?", options: ["Internet of Things", "Intranet of Technology", "Interconnected Operational Tech", "Input Output Tools"], correctAnswer: 0, roundId: "round1" },
        { order: 21, question: "Which company owns Github?", options: ["Google", "Facebook", "Microsoft", "Amazon"], correctAnswer: 2, roundId: "round1" },
        { order: 22, question: "React.js was developed by?", options: ["Google", "Facebook (Meta)", "Twitter", "Apple"], correctAnswer: 1, roundId: "round1" },
        { order: 23, question: "Linux is which type of OS?", options: ["Proprietary", "Open Source", "Paid", "Closed Source"], correctAnswer: 1, roundId: "round1" },
        { order: 24, question: "Which device forwards packets between networks?", options: ["Hub", "Switch", "Router", "Modem"], correctAnswer: 2, roundId: "round1" },
        { order: 25, question: "What allows secure remote login?", options: ["Telnet", "SSH", "FTP", "HTTP"], correctAnswer: 1, roundId: "round1" },
        { order: 26, question: "Docker is used for?", options: ["Virtualization", "Containerization", "Compilation", "Database"], correctAnswer: 1, roundId: "round1" },
        { order: 27, question: "Big O notation describes?", options: ["Algorithm Speed", "Algorithm Complexity", "Disk Space", "RAM Size"], correctAnswer: 1, roundId: "round1" },
        { order: 28, question: "Main component of Android OS?", options: ["C# Kernel", "Linux Kernel", "Windows Kernel", "Java Kernel"], correctAnswer: 1, roundId: "round1" },
        { order: 29, question: "JSON stands for?", options: ["JavaScript Object Notation", "Java System Object Network", "Java Standard Output Node", "JavaScript Online Network"], correctAnswer: 0, roundId: "round1" },
        { order: 30, question: "Which tag is used for line break in HTML?", options: ["<lb>", "<br>", "<break>", "<newline>"], correctAnswer: 1, roundId: "round1" },
    ];

    const batch = writeBatch(db);
    questions.forEach((q, i) => {
        const id = `round1_q${i + 1}`;
        batch.set(doc(db, "questions", id), { ...q, id }, { merge: true });
    });
    await batch.commit();
}
