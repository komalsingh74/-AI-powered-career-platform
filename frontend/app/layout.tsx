import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import Providers from "./providers";
import WorkspaceChrome from "@/components/workspace-chrome";

export const metadata: Metadata = {
  title: "Help Study Abroad — Your next chapter starts here",
  description:
    "A thoughtful career workspace for resumes, career coaching, and expert consultations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Suspense fallback={children}>
            <WorkspaceChrome>{children}</WorkspaceChrome>
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
