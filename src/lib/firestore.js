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
            password: "round1SDCArsh",
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
        { order: 1, question: "Who is known as the Father of Artificial Intelligence?", options: ["Alan Turing", "John McCarthy", "Marvin Minsky", "Geoffrey Hinton"], correctAnswer: 1, roundId: "round1" },
        { order: 2, question: "Who invented the first mechanical computer?", options: ["Blaise Pascal", "Charles Babbage", "John von Neumann", "Ada Lovelace"], correctAnswer: 1, roundId: "round1" },
        { order: 3, question: "What does CPU stand for?", options: ["Central Processing Unit", "Central Program Utility", "Computer Processing Unit", "Central Processor Utility"], correctAnswer: 0, roundId: "round1" },
        { order: 4, question: "Which programming language is known as the mother of all languages?", options: ["C", "FORTRAN", "COBOL", "Assembly"], correctAnswer: 0, roundId: "round1" },
        { order: 5, question: "What is the binary representation of the decimal number 10?", options: ["1010", "1100", "1001", "1110"], correctAnswer: 0, roundId: "round1" },
        { order: 6, question: "Which data structure uses LIFO principle?", options: ["Queue", "Stack", "Array", "Linked List"], correctAnswer: 1, roundId: "round1" },
        { order: 7, question: "HTML stands for?", options: ["Hyper Text Markup Language", "High Tech Modern Language", "Hyper Transfer Markup Language", "Home Tool Markup Language"], correctAnswer: 0, roundId: "round1" },
        { order: 8, question: "Which company developed the Java programming language?", options: ["Microsoft", "Apple", "Sun Microsystems", "Google"], correctAnswer: 2, roundId: "round1" },
        { order: 9, question: "What is the time complexity of binary search?", options: ["O(n)", "O(log n)", "O(n²)", "O(1)"], correctAnswer: 1, roundId: "round1" },
        { order: 10, question: "Which protocol is used to send emails?", options: ["FTP", "HTTP", "SMTP", "TCP"], correctAnswer: 2, roundId: "round1" },
        { order: 11, question: "What does SQL stand for?", options: ["Structured Query Language", "Simple Query Language", "Standard Query Logic", "Sequential Query Language"], correctAnswer: 0, roundId: "round1" },
        { order: 12, question: "Which of these is NOT an operating system?", options: ["Linux", "Windows", "Oracle", "macOS"], correctAnswer: 2, roundId: "round1" },
        { order: 13, question: "What is the full form of RAM?", options: ["Read Access Memory", "Random Access Memory", "Run Access Memory", "Random Allocation Memory"], correctAnswer: 1, roundId: "round1" },
        { order: 14, question: "Who is known as the Father of Computer Science?", options: ["Charles Babbage", "Alan Turing", "Tim Berners-Lee", "Dennis Ritchie"], correctAnswer: 1, roundId: "round1" },
        { order: 15, question: "Which sorting algorithm has the best average-case time complexity?", options: ["Bubble Sort", "Selection Sort", "Merge Sort", "Insertion Sort"], correctAnswer: 2, roundId: "round1" },
        { order: 16, question: "What does IP stand for in networking?", options: ["Internet Protocol", "Internal Process", "Internet Procedure", "Intranet Protocol"], correctAnswer: 0, roundId: "round1" },
        { order: 17, question: "Which generation of computers used transistors?", options: ["First", "Second", "Third", "Fourth"], correctAnswer: 1, roundId: "round1" },
        { order: 18, question: "What is the default port number for HTTP?", options: ["21", "25", "80", "443"], correctAnswer: 2, roundId: "round1" },
        { order: 19, question: "Which language is used for styling web pages?", options: ["HTML", "CSS", "JavaScript", "Python"], correctAnswer: 1, roundId: "round1" },
        { order: 20, question: "What does DBMS stand for?", options: ["Data Base Management System", "Data Backup Management Service", "Digital Base Mapping System", "Data Binary Management System"], correctAnswer: 0, roundId: "round1" },
        { order: 21, question: "Which of the following is a NoSQL database?", options: ["MySQL", "PostgreSQL", "MongoDB", "Oracle"], correctAnswer: 2, roundId: "round1" },
        { order: 22, question: "What is the first computer virus called?", options: ["ILOVEYOU", "Melissa", "Creeper", "MyDoom"], correctAnswer: 2, roundId: "round1" },
        { order: 23, question: "In OOP, what does encapsulation mean?", options: ["Hiding implementation details", "Inheriting from parent class", "Multiple forms of a function", "Creating objects"], correctAnswer: 0, roundId: "round1" },
        { order: 24, question: "Which topology connects all devices to a single cable?", options: ["Star", "Ring", "Bus", "Mesh"], correctAnswer: 2, roundId: "round1" },
        { order: 25, question: "What does the 'www' stand for in a URL?", options: ["Wide Web World", "World Wide Web", "Web World Wide", "World Web Wide"], correctAnswer: 1, roundId: "round1" },
        { order: 26, question: "Which of these is a valid JavaScript data type?", options: ["float", "integer", "undefined", "character"], correctAnswer: 2, roundId: "round1" },
        { order: 27, question: "What is 1 KB equal to?", options: ["1000 bytes", "1024 bytes", "1024 bits", "1000 bits"], correctAnswer: 1, roundId: "round1" },
        { order: 28, question: "Who created the Linux operating system?", options: ["Bill Gates", "Steve Jobs", "Linus Torvalds", "Dennis Ritchie"], correctAnswer: 2, roundId: "round1" },
        { order: 29, question: "Which layer of the OSI model handles routing?", options: ["Transport", "Data Link", "Network", "Session"], correctAnswer: 2, roundId: "round1" },
        { order: 30, question: "What is the output of 2 + '2' in JavaScript?", options: ["4", "22", "NaN", "Error"], correctAnswer: 1, roundId: "round1" },
    ];

    const batch = writeBatch(db);
    questions.forEach((q, i) => {
        const id = `round1_q${i + 1}`;
        batch.set(doc(db, "questions", id), { ...q, id }, { merge: true });
    });
    await batch.commit();
}
