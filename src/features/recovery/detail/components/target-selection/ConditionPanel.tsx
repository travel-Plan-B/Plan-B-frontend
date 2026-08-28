import type { LucideIcon } from "lucide-react";
import Image, { type StaticImageData } from "next/image";

import { RecoveryTypeOption } from "@/features/recovery/components/RecoveryTypeOption";
import {
  EMPTY_STATE_IMAGES,
  EmptyState,
} from "@/shared/components/ui/EmptyState";
import {
  IconBadge,
  type IconBadgeVariant,
} from "@/shared/components/ui/IconBadge";
import { cn } from "@/shared/lib/cn";
import {
  SITUATION_OPTIONS,
  STYLE_OPTIONS,
  SUB_QUESTIONS,
  type SituationType,
  type StyleType,
} from "../../mocks/conditionMock";

function isImageIcon(
  icon: LucideIcon | StaticImageData,
): icon is StaticImageData {
  return typeof icon === "object" && "src" in icon;
}

function IconComponent({ icon: Icon }: { icon: LucideIcon }) {
  return <Icon />;
}

export type ConditionTab = "shared" | "individual";

// IconBadge의 size="sm"(32px 고정)을 뷰포트 폭에 비례해 28~32px로 살짝
// 줄인다 — 아이콘 원과 안쪽 아이콘 glyph를 각각 clamp로 덮어쓴다.
const ACTIVITY_ICON_SIZE_CLASSNAME =
  "size-[clamp(1.75rem,0.75rem+1.5625vw,2rem)] [&>span]:size-[clamp(0.875rem,0.375rem+0.78vw,1rem)]";

/**
 * 오른쪽 영역: "2. 어떤 문제가 생겼나요?" 상황 선택 + 하위 질문 + "3. 어떤
 * 스타일로 장소를 추천받고 싶나요?" 스타일 선택. "공통 조건"/"개별 조건"
 * 탭 전환 자체는 왼쪽 ScheduleSelectPanel에 있다 — 탭에 따라 왼쪽 목록의
 * 항목과 체크 동작이 달라지니, 탭 컨트롤도 그 목록과 같이 있는 게 자연스러워서.
 * 여기서는 지금 tab이 무엇인지에 맞는 값을 그대로 보여주고 편집만 한다.
 */
export interface ConditionPanelProps {
  tab: ConditionTab;
  /** individual 탭일 때만 — 지금 편집 중인 항목 이름. 없으면 아직 고른 게 없다는 뜻. */
  activeItemName?: string;
  situation: SituationType;
  onSituationChange: (value: SituationType) => void;
  subAnswer: string | null;
  onSubAnswerChange: (value: string) => void;
  style: StyleType;
  onStyleChange: (value: StyleType) => void;
}

function ActivityOptionCard({
  icon,
  badgeVariant,
  title,
  description,
  selected,
  onClick,
}: {
  icon?: LucideIcon | StaticImageData;
  badgeVariant: IconBadgeVariant;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "relative flex min-w-0 flex-1 flex-col items-start gap-2 rounded-xl border bg-white p-2.5 text-left transition-colors",
        selected
          ? "border-2 border-primary-500"
          : "border-neutral-200 hover:border-neutral-400",
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        {icon &&
          (isImageIcon(icon) ? (
            <IconBadge
              icon={icon}
              variant={badgeVariant}
              size="sm"
              className={ACTIVITY_ICON_SIZE_CLASSNAME}
            />
          ) : (
            <IconBadge
              variant={badgeVariant}
              size="sm"
              className={ACTIVITY_ICON_SIZE_CLASSNAME}
            >
              <IconComponent icon={icon} />
            </IconBadge>
          ))}
        {!icon && (
          <IconBadge
            variant={badgeVariant}
            size="sm"
            className={ACTIVITY_ICON_SIZE_CLASSNAME}
          >
            <></>
          </IconBadge>
        )}
        <p className="text-fluid-sm min-w-0 font-medium text-neutral-900">
          {title}
        </p>
      </div>
      <p className="text-fluid-xs text-neutral-600">{description}</p>
    </button>
  );
}

export function ConditionPanel({
  tab,
  activeItemName,
  situation,
  onSituationChange,
  subAnswer,
  onSubAnswerChange,
  style,
  onStyleChange,
}: ConditionPanelProps) {
  const subQuestion = SUB_QUESTIONS[situation];
  const showEditor = tab === "shared" || activeItemName != null;

  return (
    <div className="min-w-70 flex flex-3 flex-col gap-3 overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-3 shadow-lg">
      {tab === "individual" && !activeItemName && (
        <EmptyState
          {...EMPTY_STATE_IMAGES.scheduleMascot}
          title="개별로 설정할 일정을 골라주세요"
          description="왼쪽 목록에서 항목을 체크하면 그 일정만의 조건을 설정할 수 있어요."
          imageClassName="w-32"
          className="flex-1 rounded-xl border border-dashed border-neutral-300 py-3"
        />
      )}

      {showEditor && (
        <>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <p className="text-fluid-lg font-semibold text-neutral-900">
                2. 어떤 문제가 생겼나요?
              </p>
              <span className="flex w-fit shrink-0 items-center gap-1 truncate rounded-full bg-primary-50 px-2.5 py-0.5 text-tiny font-semibold text-primary-700">
                {tab === "individual" && activeItemName
                  ? `${activeItemName} 개별조건 적용중`
                  : "공통조건 적용중"}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {SITUATION_OPTIONS.map((option) => (
                <RecoveryTypeOption
                  key={option.value}
                  icon={
                    isImageIcon(option.icon) ? (
                      <IconBadge
                        icon={option.icon}
                        variant={situation === option.value ? "mint" : "gray"}
                        size="md"
                      />
                    ) : (
                      <IconBadge
                        variant={situation === option.value ? "mint" : "gray"}
                        size="md"
                      >
                        <IconComponent icon={option.icon} />
                      </IconBadge>
                    )
                  }
                  title={option.title}
                  description={option.description}
                  selected={situation === option.value}
                  onClick={() => onSituationChange(option.value)}
                  size="sm"
                  titleClassName="text-fluid-sm"
                  descriptionClassName="text-fluid-xs"
                />
              ))}
            </div>

            <div className="flex flex-col gap-3 rounded-xl bg-neutral-50 p-3">
              <div className="flex items-center gap-3">
                <Image
                  src="/images/recovery_mascot.png"
                  alt=""
                  width={70}
                  height={87}
                  className="h-[clamp(3.5rem,2rem+4vw,6rem)] w-auto shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-900">
                    Q. {subQuestion.question}
                  </p>
                  <p className="text-xs text-neutral-600">{subQuestion.hint}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {subQuestion.options.map((option) => (
                  <ActivityOptionCard
                    key={option.value}
                    icon={option.icon}
                    badgeVariant={option.badgeVariant}
                    title={option.title}
                    description={option.description}
                    selected={subAnswer === option.value}
                    onClick={() => onSubAnswerChange(option.value)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-fluid-lg font-semibold text-neutral-900">
              3. 어떤 스타일로 장소를 추천받고 싶나요?
            </p>
            <div className="grid grid-cols-3 gap-3">
              {STYLE_OPTIONS.map((option) => (
                <RecoveryTypeOption
                  key={option.value}
                  icon={
                    <IconBadge
                      variant={style === option.value ? "mint" : "gray"}
                      size="md"
                    >
                      <option.icon />
                    </IconBadge>
                  }
                  title={option.title}
                  description={option.description}
                  selected={style === option.value}
                  onClick={() => onStyleChange(option.value)}
                  size="sm"
                  titleClassName="text-fluid-sm"
                  descriptionClassName="text-fluid-xs"
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
