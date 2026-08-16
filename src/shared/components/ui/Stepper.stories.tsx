import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Stepper } from "./Stepper";

const meta = {
  title: "shared/ui/Stepper",
  component: Stepper,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    steps: [
      { label: "기존 일정 입력" },
      { label: "조건 설정" },
      { label: "결과편집" },
      { label: "최종설정" },
    ],
  },
  argTypes: {
    currentStep: {
      control: { type: "number", min: 1, max: 4, step: 1 },
    },
  },
} satisfies Meta<typeof Stepper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Step1: Story = {
  args: {
    currentStep: 1,
  },
};

export const Step2: Story = {
  args: {
    currentStep: 2,
  },
};
