import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { toast } from "./toast";
import { ToastCard } from "./ToastCard";
import { ToastProvider } from "./ToastProvider";

const meta = {
  title: "shared/ui/Toast",
  parameters: {
    layout: "centered",
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// 실제 트리거(toast.success 등)로 켜지는 모습을 보여준다.
export const Interactive: Story = {
  render: () => (
    <div className="flex gap-2">
      <ToastProvider />
      <button
        type="button"
        className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
        onClick={() => toast.success("저장이 완료됐어요")}
      >
        success
      </button>
      <button
        type="button"
        className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
        onClick={() => toast.info("알아두면 좋아요")}
      >
        info
      </button>
      <button
        type="button"
        className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
        onClick={() => toast.warning("한 번 더 확인해 주세요")}
      >
        warning
      </button>
      <button
        type="button"
        className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
        onClick={() => toast.error("처리에 실패했어요")}
      >
        error
      </button>
    </div>
  ),
};

// 정적 카드 스타일만 한눈에 비교하기 위한 뷰.
export const AllTypes: Story = {
  render: () => (
    <div className="flex w-[344px] flex-col gap-3">
      <ToastCard type="success" message="저장이 완료됐어요" />
      <ToastCard type="info" message="알아두면 좋아요" />
      <ToastCard type="warning" message="한 번 더 확인해 주세요" />
      <ToastCard type="error" message="처리에 실패했어요" />
    </div>
  ),
};
