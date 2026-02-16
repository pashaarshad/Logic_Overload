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
        {
            name: "Red Box with Border",
            desc: "Create a 200px by 200px red box with a 5px solid black border.",
            html: "<div class='box'></div>",
            css: ".box { width: 200px; height: 200px; background-color: red; border: 5px solid black; }"
        },
        {
            name: "Three Flex Circles",
            desc: "Create three colored circles (50px) arranged horizontally with space between them using Flexbox.",
            html: "<div class='container'>\n  <div class='circle'></div>\n  <div class='circle'></div>\n  <div class='circle'></div>\n</div>",
            css: ".container { display: flex; gap: 20px; } .circle { width: 50px; height: 50px; background-color: blue; border-radius: 50%; }"
        },
        {
            name: "Centered Text",
            desc: "Place a heading 'Hello World' perfectly in the center of the screen.",
            html: "<div class='center-box'><h1>Hello World</h1></div>",
            css: ".center-box { display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; }"
        },
        {
            name: "Hover Button",
            desc: "Create a button that has a blue background, but changes to green when you hover over it.",
            html: "<button class='btn'>Hover Me</button>",
            css: ".btn { padding: 10px 20px; background-color: blue; color: white; border: none; cursor: pointer; transition: background 0.3s; } .btn:hover { background-color: green; }"
        },
        {
            name: "Two Column Layout",
            desc: "Create a layout with a sidebar (30%) and main content (70%) side by side.",
            html: "<div class='layout'>\n  <aside>Sidebar</aside>\n  <main>Main Content</main>\n</div>",
            css: ".layout { display: flex; height: 200px; } aside { width: 30%; background: #ddd; padding: 10px; } main { width: 70%; background: #eee; padding: 10px; }"
        },
        {
            name: "Simple Navbar",
            desc: "Create a black navigation bar with white links: Home, About, Services, Contact.",
            html: "<nav><a>Home</a><a>About</a><a>Services</a><a>Contact</a></nav>",
            css: "nav { background: black; padding: 15px; display: flex; gap: 15px; } nav a { color: white; text-decoration: none; font-family: sans-serif; }"
        },
        {
            name: "Card with Shadow",
            desc: "Create a white card div with a title and paragraph, adding a soft box-shadow.",
            html: "<div class='card'>\n  <h3>Card Title</h3>\n  <p>Some awesome content goes here.</p>\n</div>",
            css: ".card { width: 300px; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); font-family: sans-serif; }"
        },
        {
            name: "Footer with Copyright",
            desc: "Create a footer section with a gray background and centered text.",
            html: "<footer>&copy; 2024 Your Name</footer>",
            css: "footer { background: #333; color: white; padding: 20px; text-align: center; font-family: sans-serif; }"
        },
        {
            name: "Simple Table",
            desc: "Create a table with 3 rows and 3 columns. Add borders.",
            html: "<table><tr><td>1</td><td>2</td><td>3</td></tr><tr><td>4</td><td>5</td><td>6</td></tr><tr><td>7</td><td>8</td><td>9</td></tr></table>",
            css: "table { border-collapse: collapse; width: 100%; } td { border: 1px solid black; padding: 10px; text-align: center; }"
        },
        {
            name: "Rounded Button",
            desc: "Create a button with fully rounded corners (border-radius: 50px).",
            html: "<button>Click Me</button>",
            css: "button { padding: 12px 24px; border-radius: 50px; border: none; background: purple; color: white; font-size: 16px; cursor: pointer; }"
        },
        {
            name: "Rotated Square",
            desc: "Create a square div that is rotated 45 degrees.",
            html: "<div class='square'></div>",
            css: ".square { width: 100px; height: 100px; background: orange; transform: rotate(45deg); margin: 50px; }"
        },
        {
            name: "Text Shadow",
            desc: "Create a large heading text with a 2px gray shadow offset.",
            html: "<h1>Shadow Text</h1>",
            css: "h1 { font-size: 48px; text-shadow: 2px 2px 4px gray; font-family: serif; }"
        },
        {
            name: "Gradient Background",
            desc: "Create a div with a linear gradient background from blue to purple.",
            html: "<div class='gradient-box'></div>",
            css: ".gradient-box { width: 100%; height: 200px; background: linear-gradient(to right, blue, purple); }"
        },
        {
            name: "Square List Bullets",
            desc: "Create an unordered list where the bullet points are squares.",
            html: "<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>",
            css: "ul { list-style-type: square; font-family: sans-serif; }"
        },
        {
            name: "Input Focus Border",
            desc: "Create a text input. When focused, its border turns red.",
            html: "<input type='text' placeholder='Focus me...'>",
            css: "input { padding: 10px; border: 2px solid #ccc; outline: none; } input:focus { border-color: red; }"
        },
        {
            name: "Grid Layout 2x2",
            desc: "Create a 2x2 grid of colored boxes using CSS Grid.",
            html: "<div class='grid'><div>1</div><div>2</div><div>3</div><div>4</div></div>",
            css: ".grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; } .grid div { background: teal; height: 100px; color: white; display: flex; align-items: center; justify-content: center; }"
        },
        {
            name: "Circle inside Square",
            desc: "Create a square div, and center a smaller circular div inside it.",
            html: "<div class='square'><div class='circle'></div></div>",
            css: ".square { width: 150px; height: 150px; background: #eee; display: flex; align-items: center; justify-content: center; } .circle { width: 50px; height: 50px; background: red; border-radius: 50%; }"
        },
        {
            name: "Dashed Border Box",
            desc: "Create a div with a thick dashed orange border.",
            html: "<div class='dashed'>Dashed Box</div>",
            css: ".dashed { border: 5px dashed orange; padding: 20px; width: 200px; text-align: center; font-family: sans-serif; }"
        },
        {
            name: "Text Decoration",
            desc: "Create text with underline and line-through styles.",
            html: "<p><span class='under'>Underline</span> and <span class='strike'>Strikethrough</span></p>",
            css: ".under { text-decoration: underline; } .strike { text-decoration: line-through; } p { font-size: 20px; font-family: sans-serif; }"
        },
        {
            name: "Opacity Hover",
            desc: "Create a div that fades to 50% opacity when hovered.",
            html: "<div class='fade'>Hover to Fade</div>",
            css: ".fade { width: 200px; height: 100px; background: navy; color: white; display: flex; align-items: center; justify-content: center; transition: opacity 0.5s; } .fade:hover { opacity: 0.5; }"
        },
        {
            name: "Zebra Striped Table",
            desc: "Create a table where every even row has a background color.",
            html: "<table><tr><td>Row 1</td></tr><tr><td>Row 2</td></tr><tr><td>Row 3</td></tr><tr><td>Row 4</td></tr></table>",
            css: "table { width: 100%; border-collapse: collapse; } td { padding: 10px; border: 1px solid #ddd; } tr:nth-child(even) { background-color: #f2f2f2; }"
        },
        {
            name: "Sticky Header",
            desc: "Create a header that stays fixed at the top when scrolling.",
            html: "<header>Sticky Header</header><div style='height:2000px;background:#f9f9f9'>Scroll down...</div>",
            css: "header { position: sticky; top: 0; background: yellow; padding: 20px; font-weight: bold; font-family: sans-serif; }"
        },
        {
            name: "Letter Spacing",
            desc: "Create a heading with wide spacing between letters.",
            html: "<h1>SPACED OUT</h1>",
            css: "h1 { letter-spacing: 10px; text-align: center; font-family: sans-serif; }"
        },
        {
            name: "Vertical Flex Menu",
            desc: "Create a vertical menu list centered and spaced.",
            html: "<div class='menu'><a>Home</a><a>Profile</a><a>Settings</a></div>",
            css: ".menu { display: flex; flexDirection: column; gap: 10px; align-items: center; } a { background: #eee; padding: 10px 40px; border-radius: 4px; font-family: sans-serif; }"
        },
        {
            name: "Top-Left Radius",
            desc: "Create a box with only top-left rounded corner.",
            html: "<div class='box'></div>",
            css: ".box { width: 100px; height: 100px; background: tomato; border-top-left-radius: 30px; }"
        },
        {
            name: "Overflow Hidden",
            desc: "Create a small box with lots of text, hiding overflow.",
            html: "<div class='box'>This text is too long to fit inside this small box but we will hide it.</div>",
            css: ".box { width: 100px; height: 50px; border: 1px solid black; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-family: sans-serif; padding: 5px; }"
        },
        {
            name: "Right Aligned Text",
            desc: "Align text to the right side.",
            html: "<p>Right aligned text.</p>",
            css: "p { text-align: right; background: #eee; padding: 10px; font-family: sans-serif; }"
        },
        {
            name: "Blend Mode Colors",
            desc: "Two overlapping circles with mix-blend-mode.",
            html: "<div class='container'><div class='c1'></div><div class='c2'></div></div>",
            css: ".container { position: relative; height: 150px; } .c1, .c2 { width: 100px; height: 100px; border-radius: 50%; position: absolute; mix-blend-mode: multiply; } .c1 { background: cyan; left: 20px; } .c2 { background: magenta; left: 60px; }"
        },
        {
            name: "CSS Triangle",
            desc: "Create a triangle using CSS borders.",
            html: "<div class='triangle'></div>",
            css: ".triangle { width: 0; height: 0; border-left: 50px solid transparent; border-right: 50px solid transparent; border-bottom: 100px solid red; }"
        },
        {
            name: "Simple Tooltip",
            desc: "Hover text to show hidden info.",
            html: "<div class='tooltip'>Hover me<span class='tooltiptext'>Tooltip!</span></div>",
            css: ".tooltip { position: relative; display: inline-block; cursor: pointer; font-family: sans-serif; } .tooltiptext { visibility: hidden; width: 120px; background-color: black; color: #fff; text-align: center; border-radius: 6px; padding: 5px 0; position: absolute; z-index: 1; bottom: 100%; left: 50%; margin-left: -60px; } .tooltip:hover .tooltiptext { visibility: visible; }"
        }
    ];

    const batch = writeBatch(db);
    challenges.forEach((c, i) => {
        const id = `design_q${i + 1}`;
        batch.set(doc(db, "designChallenges", id), { ...c, id }, { merge: true });
    });
    await batch.commit();
}
