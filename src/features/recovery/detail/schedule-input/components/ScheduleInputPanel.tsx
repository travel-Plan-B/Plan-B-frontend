import { MousePointerClick } from "lucide-react";
import {
  EMPTY_STATE_IMAGES,
  EmptyState,
} from "@/shared/components/ui/EmptyState";
import { Tag } from "@/shared/components/ui/Tag";

// 오른쪽 영역: 보관함의 장소를 드래그해 넣는 여행 일정 타임라인 패널.
export function ScheduleInputPanel() {
  return (
    <div className="min-w-70 flex flex-3 flex-col gap-1 rounded-2xl border border-neutral-200 bg-white shadow-lg p-4">
      <p className="text-fluid-lg font-semibold text-neutral-900">
        여행 일정 입력
      </p>
      <p className="text-fluid-sm text-neutral-700">
        여행기간을 선택하면 자동으로 추가 돼요!
      </p>
      <EmptyState
        {...EMPTY_STATE_IMAGES.scheduleMascot}
        title="아직 등록된 일정이 없어요"
        description="왼쪽 보관함의 장소를 드래그해 여행 일정을 만들어보세요."
        action={
          <Tag variant="mint" className="gap-1">
            <MousePointerClick className="size-4" aria-hidden="true" />
            드래그 앤 드롭으로 일정을 추가할 수 있어요!
          </Tag>
        }
        imageClassName="w-32"
        className="flex-1 rounded-xl border border-dashed border-neutral-300 py-3"
      />
    </div>
  );
}
