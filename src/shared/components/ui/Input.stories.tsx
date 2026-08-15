import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Input } from "./Input";

const meta = {
  title: "shared/ui/Input",
  component: Input,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    error: {
      control: "boolean",
    },
    disabled: {
      control: "boolean",
    },
    clearable: {
      control: "boolean",
    },
  },
  args: {
    placeholder: "텍스트를 입력하세요",
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Clearable: Story = {
  args: {
    clearable: true,
    defaultValue: "제주도 여행",
  },
};

export const States: Story = {
  args: {},
  render: (args) => (
    <div className="flex w-64 flex-col gap-3">
      <Input {...args} placeholder="텍스트를 입력하세요" />
      <Input {...args} placeholder="텍스트를 입력하세요" disabled />
      <Input {...args} placeholder="텍스트를 입력하세요" error />
    </div>
  ),
};
