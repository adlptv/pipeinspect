import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Toaster } from "@/components/ui/toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PipeInspect — CI Pipeline Visualizer",
  description:
    "Parse, analyze, and optimize your CI/CD pipelines. Visualize DAGs, detect bottlenecks, estimate costs, and get actionable suggestions.",
  keywords: ["CI/CD", "pipeline", "visualizer", "DAG", "optimization", "GitHub Actions", "GitLab CI", "Jenkins", "CircleCI"],
  authors: [{ name: "PipeInspect" }],
  openGraph: {
    title: "PipeInspect — CI Pipeline Visualizer",
    description: "Parse, analyze, and optimize your CI/CD pipelines.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <div className="relative min-h-screen flex flex-col">
            {/* Background gradient */}
            <div className="fixed inset-0 -z-10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
            <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.15),transparent_50%)]" />
            <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(168,85,247,0.1),transparent_50%)]" />

            <Navbar />
            <main className="flex-1 relative z-0">{children}</main>
            <Footer />
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
