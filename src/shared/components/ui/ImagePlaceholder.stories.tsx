import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ImagePlaceholder } from "./ImagePlaceholder";

const meta = {
  title: "shared/ui/ImagePlaceholder",
  component: ImagePlaceholder,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ImagePlaceholder>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LargeCardWithLabel: Story = {
  render: () => (
    <div className="h-48 w-64 overflow-hidden rounded-2xl border border-neutral-200">
      <ImagePlaceholder>
        <span className="text-xs text-neutral-500">이미지없음</span>
      </ImagePlaceholder>
    </div>
  ),
};

export const SmallThumbnail: Story = {
  render: () => (
    <div className="size-12 overflow-hidden rounded-2xl border border-neutral-200">
      <ImagePlaceholder />
    </div>
  ),
};
