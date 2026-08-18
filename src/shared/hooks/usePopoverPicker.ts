"use client";

import { useEffect, useRef, useState } from "react";

import { useAnchoredPosition } from "./useAnchoredPosition";

// 트리거 버튼 + Portal 팝오버로 뜨는 Picker(TimePicker, DateRangePicker 등)들이
// 공통으로 쓰는 open/draft 상태와 "바깥 클릭·스크롤 시 닫기" 동작을 모아둔 훅.
// "확인"을 눌러야 draft가 실제 value로 반영되는 패턴(TimePicker에서 먼저 쓰던 것)도 여기서 처리한다.
export function usePopoverPicker<T>(value: T, onChange: (value: T) => void) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelPositionStyle = useAnchoredPosition(open, triggerRef, panelRef);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !panelRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    const handleScroll = () => setOpen(false);

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open]);

  const handleOpen = () => {
    setDraft(value);
    setOpen(true);
  };

  const handleConfirm = () => {
    onChange(draft);
    setOpen(false);
  };

  return {
    open,
    setOpen,
    draft,
    setDraft,
    triggerRef,
    panelRef,
    panelPositionStyle,
    handleOpen,
    handleConfirm,
  };
}
