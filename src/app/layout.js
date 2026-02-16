import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
  title: "Logic Overload | Technical Coding Event",
  description:
    "Logic Overload is a multi-round competitive technical event testing logical thinking, problem-solving, coding ability, and adaptability.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" style={{ scrollBehavior: "smooth" }}>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
