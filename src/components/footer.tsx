import Link from "next/link";
import { Github, Twitter, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/10 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="font-semibold gradient-text">PipeInspect</span>
            <span>·</span>
            <span>CI Pipeline Visualizer & Optimizer</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link href="/import" className="hover:text-white transition-colors">
              Import
            </Link>
            <Link href="/visualize" className="hover:text-white transition-colors">
              Visualize
            </Link>
            <Link href="/settings" className="hover:text-white transition-colors">
              Settings
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-white transition-colors"
              aria-label="GitHub"
            >
              <Github className="h-5 w-5" />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-white transition-colors"
              aria-label="Twitter"
            >
              <Twitter className="h-5 w-5" />
            </a>
          </div>
        </div>

        <div className="mt-4 text-center text-xs text-gray-600 flex items-center justify-center gap-1">
          Built with <Heart className="h-3 w-3 text-red-500 fill-current" /> using Next.js, D3.js & Prisma
        </div>
      </div>
    </footer>
  );
}
