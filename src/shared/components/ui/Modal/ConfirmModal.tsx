"use client";

import { TriangleAlert } from "lucide-react";
import { useId } from "react";

import { Button } from "../Button";
import { Modal } from "./Modal";

export interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  cancelLabel?: string;
  confirmLabel: string;
  // 삭제, 초기화처럼 되돌릴 수 없는 파괴적 확인인지 여부.
  // true면 경고 아이콘과 "되돌릴 수 없습니다" 문구, destructive 확정 버튼을 사용한다.
  destructive?: boolean;
  destructiveNote?: string;
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  cancelLabel = "취소",
  confirmLabel,
  destructive = false,
  destructiveNote = "이 작업은 되돌릴 수 없습니다.",
}: ConfirmModalProps) {
  const titleId = useId();

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="max-w-lg"
      aria-labelledby={titleId}
    >
      <div className="flex flex-col items-center gap-4 text-center">
        {destructive && (
          <span className="flex size-16 items-center justify-center rounded-full bg-[#FBEBEB]">
            <TriangleAlert className="size-6 text-danger-500" />
          </span>
        )}
        <div className="flex flex-col gap-2">
          <h2 id={titleId} className="text-lg font-bold text-neutral-900">
            {title}
          </h2>
          {description && (
            <p className="text-sm text-neutral-700">{description}</p>
          )}
          {destructive && (
            <p className="text-sm font-medium text-danger-500">
              {destructiveNote}
            </p>
          )}
        </div>
      </div>
      <div className="mt-6 flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onClose}>
          {cancelLabel}
        </Button>
        <Button
          variant={destructive ? "destructive" : "default"}
          className="flex-1"
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
