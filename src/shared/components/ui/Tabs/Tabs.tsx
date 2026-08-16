"use client";

import { createContext, useContext, type ReactNode } from "react";

// pill: 카테고리 필터처럼 독립된 pill 버튼 (비활성=테두리, 활성=배경 채움)
// underline: 장소 찾기/보관함처럼 밑줄로만 활성 상태 표시
// segmented: 정렬 기준/보기 방식처럼 회색 트랙 안에 버튼들이 묶여있는 형태
// date: DAY 1/DAY 2처럼 비활성 시 테두리조차 없는(완전 투명) 형태
export type TabsVariant = "pill" | "underline" | "segmented" | "date";

interface TabsContextValue {
  value: string;
  onChange: (value: string) => void;
  variant: TabsVariant;
}

const TabsContext = createContext<TabsContextValue | null>(null);

// TabsList/TabsTrigger가 <Tabs> 밖에서 쓰이는 실수를 막기 위한 가드.
export function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error(
      "TabsList와 TabsTrigger는 <Tabs> 안에서만 사용할 수 있습니다.",
    );
  }
  return context;
}

export interface TabsProps {
  value: string;
  onChange: (value: string) => void;
  variant?: TabsVariant;
  children: ReactNode;
  className?: string;
}

// 현재 선택값(value)을 Context로 내려줘서, 하위 TabsTrigger가 매번 active를
// props로 전달받지 않고 자기 value를 비교해서 스스로 판단하게 한다.
export function Tabs({
  value,
  onChange,
  variant = "pill",
  children,
  className,
}: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onChange, variant }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}
