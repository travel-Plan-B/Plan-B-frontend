import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "@/shared/components/ui/Button";

import { Header } from "./Header";

const meta = {
  title: "shared/layout/Header",
  component: Header,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithAction: Story = {
  render: () => (
    <Header>
      <Button size="sm">로그인</Button>
    </Header>
  ),
};
