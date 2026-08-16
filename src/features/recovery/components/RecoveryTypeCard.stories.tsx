"use client";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import calendarIcon from "@/shared/assets/icons/calendar.svg";
import clockIcon from "@/shared/assets/icons/clock.svg";
import rainIcon from "@/shared/assets/icons/rain.svg";
import { IconBadge } from "@/shared/components/ui/IconBadge";

import { RecoveryTypeCard } from "./RecoveryTypeCard";

const meta = {
  title: "features/recovery/RecoveryTypeCard",
  component: RecoveryTypeCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  render: (args) => (
    <div>
      <RecoveryTypeCard
        {...args}
        icon={
          <IconBadge
            icon={rainIcon}
            variant={args.selected ? "mint" : "gray"}
            size="lg"
            className="size-18 [&>span]:size-9"
          />
        }
      />
    </div>
  ),
  argTypes: {
    icon: {
      control: false,
    },
    selected: {
      control: "boolean",
    },
    onClick: {
      action: "clicked",
    },
  },
  args: {
    icon: <IconBadge icon={rainIcon} variant="gray" size="lg" className="size-18 [&>span]:size-9" />,
    title: "날씨가 변했어요",
    description: "비가 오거나, 너무 덥거나, 춥거나 혹은 야외 일정을 계속하기 어려운 날씨입니다.",
    example: "근처 실내 장소 찾기",
    selected: false,
  },
} satisfies Meta<typeof RecoveryTypeCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Selected: Story = {
  args: {
    selected: true,
  },
};

type RecoveryType = "weather" | "closed" | "time";

const recoveryTypes = [
  {
    value: "weather",
    icon: rainIcon,
    title: "날씨가 변했어요",
    description: "비가 오거나, 너무 덥거나, 춥거나 혹은 야외 일정을 계속하기 어려운 날씨입니다.",
    example: "근처 실내 장소 찾기",
  },
  {
    value: "closed",
    icon: calendarIcon,
    title: "장소 휴무",
    description: "목적지가 폐쇄되었거나, 예약이 찼거나 일시적으로 이용할 수 없는 상태입니다.",
    example: "유사한 대안 장소 찾기",
  },
  {
    value: "time",
    icon: clockIcon,
    title: "시간이 부족해요",
    description: "이동이나 일정이 지연되어 예정된 장소를 방문하기 어려운 상태입니다.",
    example: "더 가까운 장소 찾기",
  },
] satisfies Array<{
  value: RecoveryType;
  icon: typeof rainIcon;
  title: string;
  description: string;
  example: string;
}>;

function RecoveryTypeCardExample() {
  const [selectedType, setSelectedType] = useState<RecoveryType>("weather");

  return (
    <div className="flex gap-6">
      {recoveryTypes.map((card) => (
        <RecoveryTypeCard
          key={card.value}
          icon={
            <IconBadge
              icon={card.icon}
              variant={selectedType === card.value ? "mint" : "gray"}
              size="lg"
              className="size-18 [&>span]:size-9"
            />
          }
          title={card.title}
          description={card.description}
          example={card.example}
          selected={selectedType === card.value}
          onClick={() => setSelectedType(card.value)}
        />
      ))}
    </div>
  );
}

export const AllRecoveryTypes: Story = {
  render: () => <RecoveryTypeCardExample />,
};
