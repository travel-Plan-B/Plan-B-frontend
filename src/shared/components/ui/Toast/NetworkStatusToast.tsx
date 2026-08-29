"use client";

import { useEffect } from "react";

import { toast } from "./toast";

/**
 * 네트워크가 끊기거나 복구되면 토스트로 알린다. 이 앱은 대부분의 화면이
 * 장소 검색/추천/이동시간 조회처럼 네트워크에 의존하는데, 오프라인 상태에선
 * 그 요청들이 그냥 조용히 실패해서 사용자가 "왜 안 되지"라고 헷갈리기 쉽다.
 *
 * 첫 렌더 시점의 상태는 토스트를 띄우지 않는다 — 페이지를 열자마자
 * "연결됐어요"가 뜨는 건 불필요한 알림이고, 이미 오프라인인 채로 접속한
 * 경우는 화면 자체가 정상적으로 안 뜰 가능성이 높아 이 토스트가 의미가
 * 없다. online/offline "전환" 이벤트만 알린다.
 */
export function NetworkStatusToast() {
  useEffect(() => {
    const handleOffline = () => toast.error("인터넷 연결이 끊겼어요");
    const handleOnline = () => toast.success("인터넷에 다시 연결됐어요");

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return null;
}
