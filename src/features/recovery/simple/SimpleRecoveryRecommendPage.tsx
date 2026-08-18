import { RecoveryPageLayout } from "@/features/recovery/components/RecoveryPageLayout";
import { SIMPLE_RECOVERY_STEPS } from "@/features/recovery/simple/steps";

export function SimpleRecoveryRecommendPage() {
  return (
    <RecoveryPageLayout
      title="AI 추천 일정을 확인해주세요"
      description="입력한 정보를 바탕으로 복구 일정을 추천해드려요"
      currentStep={3}
      steps={SIMPLE_RECOVERY_STEPS}
    >
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-700">
        추천 결과는 다음 기능 작업에서 연결됩니다.
      </div>
    </RecoveryPageLayout>
  );
}
