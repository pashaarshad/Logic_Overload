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
        query(collection(db, "questions"), where("roundId", "==", roundId))
    );
    const questions = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    // Client-side sort to avoid requiring a composite index
    return questions.sort((a, b) => (a.order || 0) - (b.order || 0));
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
            password: "overload002",
            timeLimit: 45,
            totalQuestions: 0,
            isActive: true,
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

export async function getDesignChallenges() {
    const snap = await getDocs(collection(db, "designChallenges"));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function seedDesignChallenges() {
    const challenges = [
        { name: "Red Box with Border", desc: "Create a 200px by 200px red box with a 5px solid black border." },
        { name: "Three Flex Circles", desc: "Create three colored circles (50px) arranged horizontally with space between them using Flexbox." },
        { name: "Centered Text", desc: "Place a heading 'Hello World' perfectly in the center of the screen (vertically and horizontally)." },
        { name: "Hover Button", desc: "Create a button that has a blue background, but changes to green when you hover over it." },
        { name: "Two Column Layout", desc: "Create a layout with a sidebar (30% width) and main content (70% width) side by side." },
        { name: "Simple Navbar", desc: "Create a black navigation bar with white links: Home, About, Services, Contact." },
        { name: "Card with Shadow", desc: "Create a white card div with a title and paragraph, adding a soft box-shadow around it." },
        { name: "Footer with Copyright", desc: "Create a footer section with a gray background and centered text '© 2024 Your Name'." },
        { name: "Simple Table", desc: "Create a table with 3 rows and 3 columns. Add borders to the cells." },
        { name: "Rounded Button", desc: "Create a button with fully rounded corners (border-radius: 50px) and white text." },
        { name: "Rotated Square", desc: "Create a square div that is rotated via CSS transform by 45 degrees." },
        { name: "Text Shadow", desc: "Create a large heading text with a 2px gray shadow offset." },
        { name: "Gradient Background", desc: "Create a div with a linear gradient background going from blue to purple." },
        { name: "Square List Bullets", desc: "Create an unordered list (ul) where the bullet points are squares instead of circles." },
        { name: "Input Focus Border", desc: "Create a text input field. When clicked (focused), its border should turn red." },
        { name: "Grid Layout 2x2", desc: "Create a 2x2 grid of colored boxes using CSS Grid." },
        { name: "Circle inside Square", desc: "Create a square div, and center a smaller circular div inside it." },
        { name: "Dashed Border Box", desc: "Create a div with a thick dashed orange border and some padding inside." },
        { name: "Text Decoration", desc: "Create a paragraph where some words are underlined and some have a line-through." },
        { name: "Opacity Hover", desc: "Create an image placeholder (div) that fades to 50% opacity when hovered." },
        { name: "Zebra Striped Table", desc: "Create a table where every even row has a light gray background color." },
        { name: "Sticky Header", desc: "Create a header that stays fixed at the top of the viewport when you scroll down." },
        { name: "Letter Spacing", desc: "Create a heading with very wide spacing between the letters (e.g., 5px)." },
        { name: "Vertical Flex Menu", desc: "Create a vertical menu list where items are centered and spaced evenly." },
        { name: "Top-Left Radius", desc: "Create a box where only the top-left corner is rounded, the others are sharp." },
        { name: "Overflow Hidden", desc: "Create a small box (100px) with a lot of text inside, but hide the overflow text." },
        { name: "Right Aligned Text", desc: "Create a paragraph of text that is aligned to the right side of the container." },
        { name: "Blend Mode Colors", desc: "Create two overlapping circles with mix-blend-mode to show a color change at intersection." },
        { name: "CSS Triangle", desc: "Create a triangle pointing up using only CSS borders (no background color)." },
        { name: "Simple Tooltip", desc: "Create a text 'Hover Me' that shows a hidden span text when hovered." },
        { name: "Text Badge", desc: "Create a notification text with a small 'New' badge next to it (styled span)." },
        { name: "Pagination Links", desc: "Create a row of links styled as buttons: Prev, 1, 2, 3, Next." },
        { name: "Breadcrumbs", desc: "Create a breadcrumb navigation: Home > Products > Details." },
        { name: "Blockquote Style", desc: "Style a blockquote element with a left border and italic text." },
        { name: "Custom HR Line", desc: "Style a horizontal rule (hr) to be a dotted line 5px thick." },
        { name: "Button Group", desc: "Create three buttons joined together (no space between them) as a group." },
        { name: "Full Screen Section", desc: "Create a section that takes up exactly 100% of the viewport height (100vh)." },
        { name: "Transparent Background", desc: "Create a div with a semi-transparent black background (rgba) over whitespace." },
        { name: "Negative Margin", desc: "Create two boxes where the second box overlaps the first one using negative margin." },
        { name: "Link Hover Underline", desc: "Create a link that has no underline normally, but gets one on hover." },
        { name: "Uppercase Text", desc: "Create a paragraph that is forced to uppercase using CSS text-transform." },
        { name: "Different Borders", desc: "Create a box with a different border color/style on each of the four sides." },
        { name: "Relative Positioning", desc: "Create a box and verify its position using 'top' and 'left' relative to its normal spot." },
        { name: "Cursor Pointer", desc: "Create a div that changes the mouse cursor to a pointer (hand) when hovered." },
        { name: "Outline Offset", desc: "Create a button with an outline that is offset 5px away from the border." }
    ];

    const batch = writeBatch(db);
    challenges.forEach((c, i) => {
        const id = `design_q${i + 1}`;
        batch.set(doc(db, "designChallenges", id), { ...c, id }, { merge: true });
    });
    await batch.commit();
}
