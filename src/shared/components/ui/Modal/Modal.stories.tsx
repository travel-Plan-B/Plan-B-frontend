import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { Button } from "../Button";
import { ConfirmModal } from "./ConfirmModal";
import { Modal } from "./Modal";

const meta = {
  title: "shared/ui/Modal",
  parameters: {
    layout: "centered",
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// 자유로운 콘텐츠를 담는 기본 Modal.
// 실제 화면(예: 복구 방식 선택 카드)의 내용물은 해당 feature에서 구현해서
// children으로 채워 넣는다 — 여기서는 그 자리를 자리표시자로만 보여준다.
export const CustomContent: Story = {
  render: () => {
    function Demo() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Modal 열기</Button>
          <Modal
            open={open}
            onClose={() => setOpen(false)}
            aria-labelledby="custom-content-modal-title"
          >
            <h2
              id="custom-content-modal-title"
              className="text-lg font-bold text-neutral-900"
            >
              어떤 방식으로 복구를 원하시나요?
            </h2>
            <p className="mt-1 text-sm text-neutral-700">
              상황과 필요에 맞는 복구 방식을 선택해 주세요
            </p>
            <div className="mt-6 grid grid-cols-2 gap-4">
              {["심플 리커버리", "디테일 리커버리"].map((label) => (
                <div
                  key={label}
                  className="flex h-40 flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-neutral-200 text-center text-sm text-neutral-500"
                >
                  <span className="font-semibold text-neutral-700">
                    {label}
                  </span>
                  <span>카드 UI는 features/recovery에서 구현</span>
                </div>
              ))}
            </div>
          </Modal>
        </>
      );
    }
    return <Demo />;
  },
};

// 파괴적이지 않은 일반 확인 모달.
export const Confirm: Story = {
  render: () => {
    function Demo() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>저장 확인 모달 열기</Button>
          <ConfirmModal
            open={open}
            onClose={() => setOpen(false)}
            onConfirm={() => setOpen(false)}
            title="변경 사항을 저장하시겠어요?"
            description="저장 후에도 언제든 다시 수정할 수 있습니다."
            confirmLabel="저장하기"
          />
        </>
      );
    }
    return <Demo />;
  },
};

// 삭제, 초기화처럼 되돌릴 수 없는 파괴적 확인 모달.
export const ConfirmDestructive: Story = {
  render: () => {
    function Demo() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button variant="ghost-danger" onClick={() => setOpen(true)}>
            DAY 1 일정 삭제
          </Button>
          <ConfirmModal
            open={open}
            onClose={() => setOpen(false)}
            onConfirm={() => setOpen(false)}
            title="DAY 1 일정을 모두 삭제하시겠어요?"
            description="DAY 1의 일정과 방문 시간, 체류 시간, 이동수단 정보가 모두 삭제됩니다."
            confirmLabel="삭제하기"
            destructive
          />
        </>
      );
    }
    return <Demo />;
  },
};
