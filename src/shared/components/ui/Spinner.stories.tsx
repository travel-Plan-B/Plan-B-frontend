import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Spinner } from "./Spinner";

const meta = {
  title: "shared/ui/Spinner",
  component: Spinner,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: { type: "radio" },
      options: ["sm", "md", "lg"],
    },
  },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    size: "md",
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-6">
      <Spinner size="sm" />
      <Spinner size="md" />
      <Spinner size="lg" />
    </div>
  ),
};

// 설명 텍스트는 Spinner가 갖고 있지 않다. 각 사용처에서 원하는 문구를 그대로 옆/아래에 붙여 쓴다.
export const ButtonLoading: Story = {
  render: () => (
    <button
      type="button"
      className="flex items-center gap-2 rounded-2xl bg-neutral-900 px-6 py-3.5 text-white"
      disabled
    >
      <Spinner size="sm" className="text-white" />
      불러오는 중
    </button>
  ),
};

export const FullPageLoading: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-3">
      <Spinner size="lg" />
      <p className="text-sm text-neutral-700">데이터를 불러오는 중입니다...</p>
    </div>
  ),
};

export const ListCardLoading: Story = {
  render: () => (
    <div className="flex w-72 items-center gap-3 rounded-2xl border border-neutral-200 p-4">
      <Spinner size="md" />
      <p className="text-sm text-neutral-700">리스트 불러오는 중입니다...</p>
    </div>
  ),
};

export const ModalLoading: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-3">
      <Spinner size="md" />
      <p className="text-sm text-neutral-700">처리 중입니다...</p>
    </div>
  ),
};

export const MapLoading: Story = {
  render: () => (
    <div className="flex h-40 w-72 flex-col items-center justify-center gap-2 rounded-2xl bg-neutral-100">
      <Spinner size="lg" />
      <p className="text-sm text-neutral-700">지도를 불러오는 중...</p>
    </div>
  ),
};
