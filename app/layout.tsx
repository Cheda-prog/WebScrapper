import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MoFlo Knowledge Builder",
  description: "Build structured knowledge bases from company websites",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
