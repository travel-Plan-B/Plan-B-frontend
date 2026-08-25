"use client";

import { ImageDown, Share2 } from "lucide-react";

import { Button } from "@/shared/components/ui/Button";
import { toast } from "@/shared/components/ui/Toast/toast";

/**
 * 우측 "일정 저장 및 공유" 카드. shareUrl은 백엔드 없이 현재 일정을 URL 자체에
 * 인코딩해 만든 실제 동작하는 공유 링크다(shareEncode.ts, #118) — 열면
 * /recovery/share에서 그 시점의 일정 그대로를 다시 보여준다.
 */
export interface ShareSaveCardProps {
  shareUrl: string;
  /** 타임라인을 이미지로 저장할 때 캡처할 대상 DOM을 부모(ResultConfirmStep)가 갖고 있어 콜백으로 받는다. */
  onSaveImage?: () => void;
}

export function ShareSaveCard({ shareUrl, onSaveImage }: ShareSaveCardProps) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("링크를 복사했어요.");
    } catch {
      toast.error("링크 복사에 실패했어요.");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Plan B 여행 일정", url: shareUrl });
        return;
      } catch (error) {
        // 공유 시트에서 사용자가 직접 취소한 경우(AbortError)는 실패가 아니다.
        if (error instanceof Error && error.name === "AbortError") return;
        // 그 외(공유 대상이 없거나 user gesture 요건 등)는 링크 복사로 대체한다.
      }
    }
    await handleCopy();
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-lg">
      <h2 className="font-semibold text-neutral-900">일정 저장 및 공유</h2>

      <Button
        variant="default"
        className="w-full gap-2 font-semibold"
        onClick={handleShare}
      >
        <Share2 className="size-4" aria-hidden="true" />
        일정 공유하기
      </Button>

      <div className="flex items-center justify-between gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-3">
        <span className="truncate text-sm text-neutral-700">{shareUrl}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 text-sm font-semibold text-primary-500 hover:opacity-80"
        >
          복사
        </button>
      </div>

      <Button
        variant="outline"
        className="w-full gap-2 font-semibold"
        onClick={onSaveImage}
      >
        <ImageDown className="size-4" aria-hidden="true" />
        일정 이미지로 저장
      </Button>
    </div>
  );
}
