import Image from "next/image";
import Link from "next/link";
import type { HTMLAttributes, ReactNode } from "react";

import { ROUTES } from "@/shared/config/routes";
import { cn } from "@/shared/lib/cn";

import { PageContainer } from "./PageContainer";

export interface HeaderProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
}

export function Header({ children, className, ...props }: HeaderProps) {
  return (
    <header className={cn("w-full shadow-2xs", className)} {...props}>
      <PageContainer className="flex h-16 max-w-320 items-center justify-between px-6 sm:px-12 xl:px-16">
        <Link
          href={ROUTES.HOME}
          className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        >
          <Image
            src="/images/PlanB_logo.png"
            alt="PlanB"
            width={863}
            height={319}
            className="h-8 w-auto"
            priority
          />
        </Link>
        {children}
      </PageContainer>
    </header>
  );
}
