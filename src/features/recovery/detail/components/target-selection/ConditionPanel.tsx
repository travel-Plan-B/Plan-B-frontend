import type { LucideIcon } from "lucide-react";
import Image, { type StaticImageData } from "next/image";

import { RecoveryTypeOption } from "@/features/recovery/components/RecoveryTypeOption";
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

/**
 * 오른쪽 영역: "2. 어떤 문제가 생겼나요?" 상황 선택 + 상황별 하위 질문 +
 * "3. 어떤 스타일로 장소를 추천받고 싶나요?" 스타일 선택 패널.
 */
export interface ConditionPanelProps {
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
        "relative flex flex-1 items-center gap-2 rounded-xl border bg-white p-3 text-left transition-colors",
        selected
          ? "border-primary-500"
          : "border-neutral-200 hover:border-neutral-400",
      )}
    >
      {icon &&
        (isImageIcon(icon) ? (
          <IconBadge icon={icon} variant={badgeVariant} size="sm" />
        ) : (
          <IconBadge variant={badgeVariant} size="sm">
            <IconComponent icon={icon} />
          </IconBadge>
        ))}
      {!icon && (
        <IconBadge variant={badgeVariant} size="sm">
          <></>
        </IconBadge>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-neutral-900">{title}</p>
        <p className="text-xs text-neutral-600">{description}</p>
      </div>
    </button>
  );
}

export function ConditionPanel({
  situation,
  onSituationChange,
  subAnswer,
  onSubAnswerChange,
  style,
  onStyleChange,
}: ConditionPanelProps) {
  const subQuestion = SUB_QUESTIONS[situation];

  return (
    <div className="min-w-70 flex flex-3 flex-col gap-6 overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-4 shadow-lg">
      <div className="flex flex-col gap-4">
        <p className="text-fluid-lg font-semibold text-neutral-900">
          2. 어떤 문제가 생겼나요?
        </p>
        <div className="grid grid-cols-3 gap-4">
          {SITUATION_OPTIONS.map((option) => (
            <RecoveryTypeOption
              key={option.value}
              icon={
                isImageIcon(option.icon) ? (
                  <IconBadge
                    icon={option.icon}
                    variant={situation === option.value ? "mint" : "gray"}
                    size="lg"
                  />
                ) : (
                  <IconBadge
                    variant={situation === option.value ? "mint" : "gray"}
                    size="lg"
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
            />
          ))}
        </div>

        <div className="flex items-center gap-3 rounded-xl bg-neutral-50 p-4">
          <Image
            src="/images/recovery_mascot.png"
            alt=""
            width={70}
            height={87}
            className="h-24 w-auto shrink-0"
          />
          <div className="flex flex-1 flex-col gap-3">
            <div>
              <p className="text-sm font-semibold text-neutral-900">
                Q. {subQuestion.question}
              </p>
              <p className="text-xs text-neutral-600">{subQuestion.hint}</p>
            </div>
            <div className="flex gap-3">
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
      </div>

      <div className="flex flex-col gap-4">
        <p className="text-fluid-lg font-semibold text-neutral-900">
          3. 어떤 스타일로 장소를 추천받고 싶나요?
        </p>
        <div className="grid grid-cols-3 gap-4">
          {STYLE_OPTIONS.map((option) => (
            <RecoveryTypeOption
              key={option.value}
              icon={
                <IconBadge
                  variant={style === option.value ? "mint" : "gray"}
                  size="lg"
                >
                  <option.icon />
                </IconBadge>
              }
              title={option.title}
              description={option.description}
              selected={style === option.value}
              onClick={() => onStyleChange(option.value)}
              size="sm"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
