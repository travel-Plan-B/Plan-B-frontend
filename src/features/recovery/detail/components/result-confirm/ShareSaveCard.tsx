import { Download, Share2 } from "lucide-react";

import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";

/**
 * 우측 "일정 저장 및 공유" 카드. 실제 공유 링크 생성, 클립보드 복사,
 * 이미지 저장 로직은 범위 밖(#85)이라 UI만 제공한다.
 */
export interface ShareSaveCardProps {
  shareLink: string;
}

export function ShareSaveCard({ shareLink }: ShareSaveCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-lg">
      <h2 className="font-semibold text-neutral-900">일정 저장 및 공유</h2>

      <Button variant="default" className="w-full gap-2">
        <Share2 className="size-4" aria-hidden="true" />
        일정 공유하기
      </Button>

      <div className="flex gap-2">
        <Input
          value={shareLink}
          readOnly
          className="py-2 text-sm text-neutral-700"
        />
        <Button variant="outline" size="sm" className="shrink-0">
          복사
        </Button>
      </div>

      <Button variant="outline" className="w-full gap-2">
        <Download className="size-4" aria-hidden="true" />
        일정 이미지로 저장
      </Button>
    </div>
  );
}
