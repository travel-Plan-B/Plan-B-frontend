import Image from "next/image";
import Link from "next/link";
import type { HTMLAttributes, SVGProps } from "react";

import { cn } from "@/shared/lib/cn";

import { PageContainer } from "./PageContainer";

// Lucide는 브랜드 로고를 제공하지 않아 GitHub 마크만 커스텀 SVG로 추가.
function GithubIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.09 3.29 9.4 7.86 10.93.57.1.79-.25.79-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.34-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.09 0 4.41-2.7 5.39-5.26 5.67.41.36.78 1.06.78 2.15 0 1.55-.01 2.8-.01 3.18 0 .3.21.66.79.55A10.51 10.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}

const REPO_LINKS = [
  {
    label: "Frontend",
    href: "https://github.com/travel-Plan-B/Plan-B-frontend",
  },
  {
    label: "Backend",
    href: "https://github.com/travel-Plan-B/Plan-B-backend",
  },
];

export type FooterProps = HTMLAttributes<HTMLElement>;

export function Footer({ className, ...props }: FooterProps) {
  return (
    <footer
      className={cn("w-full border-t border-neutral-200", className)}
      {...props}
    >
      <PageContainer className="flex items-center justify-between py-4">
        <div className="flex flex-col items-start gap-2">
          <Image
            src="/images/PlanB_logo.png"
            alt="PlanB"
            width={863}
            height={319}
            className="h-7 w-auto"
          />
          <p className="flex items-center gap-2 text-xs text-neutral-700">
            {`© ${new Date().getFullYear()} Plan B AI. All rights reserved.`}
          </p>
        </div>
        <nav aria-label="레포지토리 링크" className="flex items-center gap-6">
          {REPO_LINKS.map((repo) => (
            <Link
              key={repo.label}
              href={repo.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-neutral-700 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded-sm"
            >
              <GithubIcon aria-hidden="true" className="size-4" />
              {repo.label}
            </Link>
          ))}
        </nav>
      </PageContainer>
    </footer>
  );
}
