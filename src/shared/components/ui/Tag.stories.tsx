import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Tag } from "./Tag";

const meta = {
  title: "shared/ui/Tag",
  component: Tag,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["purple", "pink", "orange", "mint", "gray"],
    },
    appearance: {
      control: "radio",
      options: ["soft", "solid"],
    },
  },
  args: {
    variant: "purple",
    appearance: "soft",
    children: "태그",
  },
} satisfies Meta<typeof Tag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Soft: Story = {
  args: {
    appearance: "soft",
    children: "짧은 태그",
  },
};

export const Solid: Story = {
  args: {
    appearance: "solid",
    children: "조금 더 긴 태그 텍스트",
  },
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="w-10 text-xs text-neutral-700">Soft</span>
        <Tag variant="purple" appearance="soft">
          관광
        </Tag>
        <Tag variant="pink" appearance="soft">
          음식점
        </Tag>
        <Tag variant="orange" appearance="soft">
          카페
        </Tag>
        <Tag variant="mint" appearance="soft">
          현재 위치
        </Tag>
        <Tag variant="gray" appearance="soft">
          기타
        </Tag>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <span className="w-10 text-xs text-neutral-700">Solid</span>
        <Tag variant="purple" appearance="solid">
          관광
        </Tag>
        <Tag variant="pink" appearance="solid">
          음식점
        </Tag>
        <Tag variant="orange" appearance="solid">
          카페
        </Tag>
        <Tag variant="mint" appearance="solid">
          현재 위치
        </Tag>
        <Tag variant="gray" appearance="solid">
          기타
        </Tag>
      </div>
    </div>
  ),
};
