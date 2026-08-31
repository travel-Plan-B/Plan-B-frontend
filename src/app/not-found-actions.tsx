"use client";

import { ArrowLeft, Home } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/shared/components/ui/Button";
import { ROUTES } from "@/shared/config/routes";

export function NotFoundActions() {
  const router = useRouter();

  return (
    <div className="flex w-full max-w-xs flex-col gap-3 md:max-w-none md:flex-row md:justify-center md:gap-6">
      <Button
        variant="outline"
        className="w-full px-6 md:w-auto"
        size="sm"
        onClick={() => router.push(ROUTES.HOME)}
      >
        <Home className="size-4" />
        메인으로 이동
      </Button>
      <Button
        size="sm"
        className="w-full px-6 md:w-auto"
        onClick={() => router.back()}
      >
        <ArrowLeft className="size-4" />
        이전 페이지로
      </Button>
    </div>
  );
}
