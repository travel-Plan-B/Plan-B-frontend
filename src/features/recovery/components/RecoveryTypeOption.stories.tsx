"use client";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CalendarX } from "lucide-react";
import { useState } from "react";

import clockIcon from "@/shared/assets/icons/clock.svg";
import rainIcon from "@/shared/assets/icons/rain.svg";
import { IconBadge } from "@/shared/components/ui/IconBadge";

import { RecoveryTypeOption } from "./RecoveryTypeOption";

const meta = {
  title: "features/recovery/RecoveryTypeOption",
  component: RecoveryTypeOption,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  render: (args) => (
    <div className="w-96">
      <RecoveryTypeOption
        {...args}
        icon={
          <IconBadge
            icon={rainIcon}
            variant={args.selected ? "mint" : "gray"}
            size="lg"
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
    icon: <IconBadge icon={rainIcon} variant="gray" size="lg" />,
    title: "날씨가 변했어요",
    description: "비가 오거나 날씨가 달라졌어요",
    selected: false,
  },
} satisfies Meta<typeof RecoveryTypeOption>;

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
    description: "비가 오거나 날씨가 달라졌어요",
  },
  {
    value: "closed",
    icon: null,
    title: "장소가 휴무예요",
    description: "방문하려던 장소가 문을 닫았어요",
  },
  {
    value: "time",
    icon: clockIcon,
    title: "시간이 부족해요",
    description: "예상보다 일정이 늦어졌어요",
  },
] satisfies Array<{
  value: RecoveryType;
  icon: typeof rainIcon | null;
  title: string;
  description: string;
}>;

function RecoveryTypeExample() {
  const [selectedType, setSelectedType] = useState<RecoveryType>("weather");

  return (
    <div className="w-4xl">
      <div className="grid grid-cols-3 gap-3">
        {recoveryTypes.map((option) => (
          <RecoveryTypeOption
            key={option.value}
            icon={
              option.icon ? (
                <IconBadge
                  icon={option.icon}
                  variant={selectedType === option.value ? "mint" : "gray"}
                  size="lg"
                />
              ) : (
                <IconBadge
                  variant={selectedType === option.value ? "mint" : "gray"}
                  size="lg"
                >
                  <CalendarX strokeWidth={1.75} />
                </IconBadge>
              )
            }
            title={option.title}
            description={option.description}
            selected={selectedType === option.value}
            onClick={() => setSelectedType(option.value)}
          />
        ))}
      </div>
    </div>
  );
}

export const AllRecoveryTypes: Story = {
  render: () => <RecoveryTypeExample />,
};
