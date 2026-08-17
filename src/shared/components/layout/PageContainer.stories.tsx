import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PageContainer } from "./PageContainer";

const meta = {
  title: "shared/layout/PageContainer",
  component: PageContainer,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof PageContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <PageContainer className="bg-primary-50 py-6">
      <p className="text-neutral-900">
        max-width 1200px, 좌우 padding 24px, 중앙 정렬
      </p>
    </PageContainer>
  ),
};
