import type { LucideIcon } from "lucide-react";
import {
  AlarmClock,
  CalendarX,
  Clock,
  Heart,
  MapPin,
  Sparkles,
  Sun,
  ThumbsUp,
  X,
} from "lucide-react";
import type { StaticImageData } from "next/image";

import type { IconBadgeVariant } from "@/shared/components/ui/IconBadge";
import clockIcon from "@/shared/assets/icons/clock.svg";
import rainIcon from "@/shared/assets/icons/rain.svg";
import walkIcon from "@/shared/assets/icons/walk.svg";

/**
 * "2. 어떤 문제가 생겼나요?" 상황 선택 카드 + 상황별 하위 질문(다중 옵션) +
 * "3. 어떤 스타일로 장소를 추천받고 싶나요?" 스타일 카드 목업 데이터.
 * #81 정적 UI 목업. 실제 AI 추천 연동은 별도 이슈에서 진행한다.
 */
export type SituationType = "weather" | "unavailable" | "time-changed";

export interface SituationOption {
  value: SituationType;
  icon: LucideIcon | StaticImageData;
  title: string;
  description: string;
}

export const SITUATION_OPTIONS: SituationOption[] = [
  {
    value: "weather",
    icon: rainIcon,
    title: "날씨가 변했어요",
    description: "비, 더위, 추위 등으로 야외 일정을 진행하기 어려운 날씨예요.",
  },
  {
    value: "unavailable",
    icon: CalendarX,
    title: "장소를 이용할 수 없어요",
    description: "목적지가 폐쇄되었거나 예약이 차서 이용할 수 없어요.",
  },
  {
    value: "time-changed",
    icon: clockIcon,
    title: "일정 시간이 변경 됐어요",
    description: "일정이 지연되거나 앞당겨져 계획 조정이 필요해요.",
  },
];

export interface SubQuestionOption {
  value: string;
  icon?: LucideIcon | StaticImageData;
  badgeVariant: IconBadgeVariant;
  title: string;
  description: string;
}

export interface SubQuestion {
  question: string;
  hint: string;
  options: SubQuestionOption[];
}

export const SUB_QUESTIONS: Record<SituationType, SubQuestion> = {
  weather: {
    question: "어떤 활동을 피하고 싶나요?",
    hint: "해당되는 항목을 선택해주세요.",
    options: [
      {
        value: "outdoor",
        icon: Sun,
        badgeVariant: "orange",
        title: "야외 활동",
        description: "비나 더위 등 날씨의 영향을 받는 활동",
      },
      {
        value: "walking",
        icon: walkIcon,
        badgeVariant: "mint",
        title: "오래 걷는 활동",
        description: "많이 걷거나 이동하는 활동",
      },
      {
        value: "outdoor-walking",
        badgeVariant: "purple",
        title: "야외 + 오래 걷기",
        description: "날씨의 영향이 있고 많이 걷는 활동",
      },
    ],
  },
  unavailable: {
    question: "유사한 장소로 안내해드릴까요?",
    hint: "원하는 옵션을 선택해주세요.",
    options: [
      {
        value: "yes",
        icon: ThumbsUp,
        badgeVariant: "mint",
        title: "네",
        description: "비슷한 테마나 분위기의 장소를 추천해주세요.",
      },
      {
        value: "no",
        icon: X,
        badgeVariant: "pink",
        title: "아니요",
        description: "다른 스타일의 장소를 추천해주세요.",
      },
    ],
  },
  "time-changed": {
    question: "현재 시간 상황은 어떤가요?",
    hint: "원하는 옵션을 선택해주세요.",
    options: [
      {
        value: "shorter",
        icon: AlarmClock,
        badgeVariant: "orange",
        title: "시간이 부족해졌어요",
        description: "예상보다 시간이 부족해져서 일정을 조정해야 해요.",
      },
      {
        value: "longer",
        icon: Clock,
        badgeVariant: "mint",
        title: "예상보다 시간이 남았어요",
        description: "여유 시간이 생겨서 일정을 추가하고 싶어요.",
      },
    ],
  },
};

export type StyleType = "keep" | "nearby" | "new";

export interface StyleOption {
  value: StyleType;
  icon: LucideIcon;
  title: string;
  description: string;
}

export const STYLE_OPTIONS: StyleOption[] = [
  {
    value: "keep",
    icon: Heart,
    title: "기존 일정 최대한 유지",
    description: "지금 계획한 일정을 중심으로 변경을 최소화 해요.",
  },
  {
    value: "nearby",
    icon: MapPin,
    title: "가까운 곳 우선",
    description: "이동 거리와 시간을 줄여 가까운 곳을 추천해요.",
  },
  {
    value: "new",
    icon: Sparkles,
    title: "새로운 경험",
    description: "기존 계획과 달리고 색다른 곳을 추천해요.",
  },
];
