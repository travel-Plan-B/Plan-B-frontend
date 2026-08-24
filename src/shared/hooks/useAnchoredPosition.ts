import {
  useLayoutEffect,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";

/**
 * 트리거 요소 바로 아래에 뜨는 Portal 패널(팝오버, 드롭다운 등)의 위치를 계산한다.
 *
 * 패널을 실제로 그린 뒤 크기를 재서 뷰포트 밖으로 나가지 않게 좌표를 보정한다.
 * 트리거가 화면 오른쪽/아래쪽 끝에 있으면 패널이 잘려서 버튼을 못 누르는
 * 문제가 있었음 (코드리뷰에서 지적됨).
 * - 가로: 오른쪽 끝에 붙는다 싶으면 왼쪽으로 당긴다.
 * - 세로: 아래쪽 공간이 부족하면 트리거 위로 뒤집어서 띄우고,
 *   그래도 패널이 남는 공간보다 크면 max-height + 내부 스크롤로 자른다.
 * - 열려있는 동안 창 크기가 바뀌면(resize) 같은 계산을 다시 돌려서 위치를 갱신한다.
 *
 * 스크롤로 트리거가 화면에서 움직이는 경우는 위치를 다시 계산하지 않는다.
 * 호출하는 쪽에서 패널을 닫는 걸 권장한다 (흔히 쓰는 패턴).
 */
export function useAnchoredPosition(
  open: boolean,
  triggerRef: RefObject<HTMLElement | null>,
  panelRef: RefObject<HTMLElement | null>,
) {
  const [style, setStyle] = useState<CSSProperties>();

  useLayoutEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      if (!triggerRef.current || !panelRef.current) return;

      const margin = 8;
      const gap = 8;
      const rect = triggerRef.current.getBoundingClientRect();
      const panelRect = panelRef.current.getBoundingClientRect();
      const maxPanelWidth = window.innerWidth - margin * 2;
      const panelWidth = Math.min(panelRect.width, maxPanelWidth);
      const maxLeft = window.innerWidth - panelWidth - margin;

      // 기본은 trigger의 왼쪽 시작점에 맞추고, viewport 경계에 닿을 때만
      // 좌우 margin 안으로 보정한다.
      const left = Math.max(margin, Math.min(rect.left, maxLeft));

      const spaceBelow = window.innerHeight - rect.bottom - gap - margin;
      const spaceAbove = rect.top - gap - margin;
      const openUpward =
        panelRect.height > spaceBelow && spaceAbove > spaceBelow;

      setStyle({
        position: "fixed",
        left,
        top: openUpward
          ? Math.max(rect.top - panelRect.height - gap, margin)
          : rect.bottom + gap,
        maxWidth: maxPanelWidth,
        maxHeight: openUpward ? spaceAbove : spaceBelow,
        overflowY: "auto",
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [open, triggerRef, panelRef]);

  return style;
}
