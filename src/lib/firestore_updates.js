
export async function getDesignChallenges() {
    const snap = await getDocs(collection(db, "designChallenges"));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function seedDesignChallenges() {
    const challenges = [
        { name: "Responsive Navbar", desc: "Create a fully responsive navigation bar with a logo, 4 links, and a CTA button. On mobile, it should collapse into a hamburger menu." },
        { name: "CSS Loader", desc: "Design a unique loading spinner using only CSS. It should run infinitely and be centered on the screen." },
        { name: "Hero Section", desc: "Build a landing page hero section with a headline, subheadline, two buttons, and a background image/gradient." },
        { name: "Pricing Table", desc: "Create a comparison pricing table with 3 columns (Basic, Pro, Enterprise). Highlight the 'Pro' column." },
        { name: "Modal Popup", desc: "Implement a modal that opens on button click and closes when clicking outside or on a close icon." },
        { name: "Footer Design", desc: "Design a professional footer with 4 columns: About, Links, Contact, and Social Media icons." },
        { name: "Contact Form", desc: "Build a contact form with fields for Name, Email, Subject, and Message. Style the focus states." },
        { name: "Product Card", desc: "Create an e-commerce product card showing image, title, price, discount, and an 'Add to Cart' button." },
        { name: "404 Page", desc: "Design a creative 404 error page. Include a funny illustration (css/text) and a 'Go Home' button." },
        { name: "Accordion", desc: "Build a vertical accordion for FAQs. Only one section should be open at a time." },
        { name: "Login/Signup", desc: "Create a login form that can toggle to a signup form using a switch or tabs." },
        { name: "Search Bar", desc: "Design a stylish search bar that expands on focus and has a search icon button." },
        { name: "Testimonial Card", desc: "Create a testimonial card with the user's photo, quote, name, and rating stars." },
        { name: "Toggle Switch", desc: "Build a CSS-only toggle switch (like iOS settings) that changes color when active." },
        { name: "Sidebar Nav", desc: "Create a collapsible sidebar navigation with icons and labels. It should push content or overlay." },
        { name: "Progress Steps", desc: "Design a multi-step progress bar (Step 1, Step 2, Step 3) showing the current active step." },
        { name: "User Profile", desc: "Build a user profile widget showing a circular avatar, stats (followers, posts), and a 'Follow' button." },
        { name: "Notification Toast", desc: "Create a notification toast message that slides in from the top or right and fades out." },
        { name: "Video Player UI", desc: "Design the custom controls for a video player: Play/Pause, Progress Bar, Volume, Fullscreen." },
        { name: "Back to Top", desc: "Create a 'Back to Top' button that appears only when scrolling down. Add smooth scrolling." },
        { name: "Dropdown Menu", desc: "Build a hover-triggered dropdown menu for a 'Services' nav item." },
        { name: "Shopping Cart", desc: "Design a shopping cart summary item showing product thumbnail, info, quantity controls, and price." },
        { name: "Newsletter", desc: "Create a newsletter subscription section with an input field and a 'Subscribe' button." },
        { name: "Star Rating", desc: "Build an interactive star rating component where hovering highlights the stars." },
        { name: "Timeline", desc: "Create a vertical timeline of events (e.g., job history) with dots and connecting lines." },
        { name: "Tooltip", desc: "Implement a tooltip that appears when hovering over a specific text or icon." },
        { name: "File Upload", desc: "Design a drag-and-drop file upload zone with a dashed border and an icon." },
        { name: "Credit Card Form", desc: "Create a credit card input form with fields for Number, Expiry, CVD. Style it realistically." },
        { name: "Cookie Banner", desc: "Design a GDPR cookie consent banner fixed at the bottom with 'Accept' and 'Decline' buttons." },
        { name: "Skeleton Loader", desc: "Create a skeleton loading state for a card component (shimmer effect)." },
        { name: "Pagination", desc: "Build a pagination control with Prev, Next, and Page Numbers. Highlight current page." },
        { name: "Weather Widget", desc: "Design a weather card showing current temp, icon (sun/cloud), and humidity." },
        { name: "Gallery Grid", desc: "Create an image gallery grid that uses CSS Grid to create a masonry or mosaic layout." },
        { name: "Parallax Section", desc: "Build a section with a parallax scrolling background effect." },
        { name: "Gradient Button", desc: "Design a button with a moving gradient border or background on hover." },
        { name: "Chat Bubble", desc: "Create a chat interface message bubble, distinct styles for 'Sent' and 'Received'." },
        { name: "Dashboard Stats", desc: "Design a dashboard widget showing a statistic (e.g. 'Views') and a mini sparkline chart." },
        { name: "Tab Interface", desc: "Build a tabbed interface where clicking tabs switches the content pane without reloading." },
        { name: "Team Member", desc: "Create a 'Meet the Team' card with hover effect to show social links overlay." },
        { name: "Features List", desc: "Design a features section with 3 columns, each having an icon, title, and description." }
    ];

    const batch = writeBatch(db);
    challenges.forEach((c, i) => {
        const id = `design_q${i + 1}`;
        batch.set(doc(db, "designChallenges", id), { ...c, id }, { merge: true });
    });
    await batch.commit();
}
