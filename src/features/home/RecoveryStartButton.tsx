"use client";

import { ArrowRight } from "lucide-react";
import { useState } from "react";

import { RecoveryTypeModal } from "@/features/recovery/components/RecoveryTypeModal";
import { cn } from "@/shared/lib/cn";

export interface RecoveryStartButtonProps {
  className?: string;
  label?: string;
}

export function RecoveryStartButton({
  className,
  label = "서비스 시작하기",
}: RecoveryStartButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "group inline-flex cursor-pointer items-center justify-center bg-primary-500 font-semibold text-white transition-all duration-200 active:translate-y-0 active:scale-[0.98]",
          "hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
          "gap-2.5 rounded-2xl px-8 py-4 text-base shadow-md hover:-translate-y-0.5 hover:shadow-lg",
          className,
        )}
      >
        <span>{label}</span>
        <ArrowRight className="size-4.5 transition-transform duration-200 group-hover:translate-x-1" />
      </button>

      <RecoveryTypeModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
