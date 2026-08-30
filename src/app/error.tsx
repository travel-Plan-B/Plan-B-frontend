"use client";

import { Home, RotateCcw } from "lucide-react";

import { Button } from "@/shared/components/ui/Button";
import { ROUTES } from "@/shared/config/routes";

export default function Error({ retry }: { retry: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-12 text-center">
      <div className="flex max-w-md flex-col gap-2">
        <h1 className="text-2xl font-bold text-neutral-900">
          문제가 발생했어요
        </h1>
        <p className="text-base text-neutral-700">
          요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-3 lg:max-w-none lg:flex-row lg:justify-center lg:gap-6">
        <Button
          variant="outline"
          size="sm"
          className="w-full px-6 lg:w-auto"
          onClick={() => retry()}
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          다시 시도
        </Button>
        <Button
          size="sm"
          className="w-full px-6 lg:w-auto"
          onClick={() => window.location.assign(ROUTES.HOME)}
        >
          <Home className="size-4" aria-hidden="true" />
          메인으로 이동
        </Button>
      </div>
    </div>
  );
}
