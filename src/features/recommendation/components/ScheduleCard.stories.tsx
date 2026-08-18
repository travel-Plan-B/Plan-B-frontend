import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { ScheduleCard, type ScheduleCardTone } from "./ScheduleCard";

const schedule = {
  label: "오후 일정",
  time: "14:00 - 16:00",
  title: "국립현대미술관 서울",
  description: "전시를 관람하며 여유롭게 실내 일정을 즐겨보세요.",
  location: "서울 종로구 삼청로 30",
  duration: "약 2시간",
  onAction: fn(),
};

const tones: ScheduleCardTone[] = [
  "neutral",
  "primary",
  "rose",
  "purple",
  "yellow",
];

const meta = {
  title: "features/recommendation/ScheduleCard",
  component: ScheduleCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    tone: {
      control: "select",
      options: tones,
    },
    onAction: {
      action: "detail-clicked",
    },
  },
  args: {
    tone: "neutral",
    ...schedule,
  },
  decorators: [
    (Story) => (
      <div className="w-120 max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ScheduleCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Rose: Story = {
  args: {
    tone: "rose",
    label: "기존 일정",
    title: "북촌한옥마을 산책",
    description: "한옥 골목을 따라 걷는 야외 일정이에요.",
  },
};

export const Purple: Story = {
  args: {
    tone: "purple",
    label: "추천 일정",
  },
};

export const Primary: Story = {
  args: { tone: "primary" },
};

export const Yellow: Story = {
  args: { tone: "yellow" },
};

export const Neutral: Story = {
  args: { tone: "neutral" },
};

export const Narrow: Story = {
  decorators: [
    (Story) => (
      <div className="w-72">
        <Story />
      </div>
    ),
  ],
  args: {
    tone: "purple",
    title: "국립현대미술관 서울에서 만나는 특별 기획전",
  },
};

export const Variants: Story = {
  decorators: [],
  render: () => (
    <div className="grid w-240 max-w-full grid-cols-1 gap-4 md:grid-cols-2">
      {tones.map((tone) => (
        <ScheduleCard
          key={tone}
          {...schedule}
          tone={tone}
          label={`${tone[0].toUpperCase()}${tone.slice(1)}`}
        />
      ))}
    </div>
  ),
};
