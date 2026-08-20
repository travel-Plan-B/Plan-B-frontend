"use client";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { Button } from "@/shared/components/ui/Button";

import { RecoveryTypeModal } from "./RecoveryTypeModal";

const meta = {
  title: "features/recovery/RecoveryTypeModal",
  parameters: {
    layout: "centered",
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    function Demo() {
      const [open, setOpen] = useState(true);
      return (
        <div className="flex flex-col items-center justify-center p-6">
          <Button variant="secondary" onClick={() => setOpen(true)}>
            복구 모달 다시 열기
          </Button>
          <RecoveryTypeModal open={open} onClose={() => setOpen(false)} />
        </div>
      );
    }
    return <Demo />;
  },
};

export const Interactive: Story = {
  render: () => {
    function Demo() {
      const [open, setOpen] = useState(false);
      return (
        <div className="flex flex-col items-center justify-center p-12">
          <Button variant="secondary" onClick={() => setOpen(true)}>
            복구 방식 선택하기
          </Button>
          <RecoveryTypeModal open={open} onClose={() => setOpen(false)} />
        </div>
      );
    }
    return <Demo />;
  },
};
