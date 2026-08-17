"use client";

import { useState } from "react";

import { TravelScheduleStep } from "./TravelScheduleStep";

// 4단계(기존 일정 입력 → 조건 설정 → 결과편집 → 최종설정)를 URL 없이
// 이 컴포넌트의 state로만 전환한다. 여행지역/기간, 보관함에 담은 장소 같은
// 단계 간 공유 데이터도 이 컴포넌트(또는 여기서 쓰는 훅)가 들고 있으면 되고,
// URL/RHF만으로 부족해질 때만 store 도입을 검토한다 (folder-structure.md 참고).
export function RecoveryFlow() {
  const [step] = useState(1);

  if (step === 1) {
    return <TravelScheduleStep />;
  }

  return null;
}
