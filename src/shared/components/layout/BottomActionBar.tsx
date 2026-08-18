import { Button } from "@/shared/components/ui/Button";
import { cn } from "@/shared/lib/cn";

export interface BottomActionBarProps {
  onBack?: () => void;
  backLabel?: string;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  className?: string;
}

// Step Flow 화면 하단 공통 액션 영역.
// design-system.md: 왼쪽엔 이전/취소, 오른쪽엔 다음/확정 액션을 배치한다.
export function BottomActionBar({
  onBack,
  backLabel = "이전",
  onNext,
  nextLabel = "다음으로 넘어가기",
  nextDisabled = false,
  className,
}: BottomActionBarProps) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      {onBack ? (
        <Button variant="outline" onClick={onBack}>
          {backLabel}
        </Button>
      ) : (
        <span />
      )}
      <Button variant="default" onClick={onNext} disabled={nextDisabled}>
        {nextLabel}
      </Button>
    </div>
  );
}
