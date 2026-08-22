"use client";

import { useEffect, useState } from "react";

export type KakaoMapsScriptStatus = "loading" | "loaded" | "no-key" | "error";

// 여러 <Map>이 동시에 마운트돼도 SDK 스크립트는 한 번만 삽입해야 해서, 모듈
// 스코프에 로딩 Promise를 캐싱해 두고 모든 인스턴스가 이걸 같이 기다린다.
let scriptLoadPromise: Promise<void> | null = null;

function loadKakaoMapsScript(appKey: string): Promise<void> {
  scriptLoadPromise ??= new Promise((resolve, reject) => {
    if (window.kakao?.maps) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`;
    script.async = true;
    script.onload = () => window.kakao.maps.load(resolve);
    script.onerror = () => reject(new Error("카카오맵 SDK 로드 실패"));
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

/**
 * 카카오맵 JS SDK를 불러온다. 키가 없으면(.env에 NEXT_PUBLIC_KAKAO_MAP_JS_KEY
 * 미설정) 아예 스크립트를 삽입하지 않고 "no-key" 상태로 바로 알려준다.
 */
export function useKakaoMapsScript(): KakaoMapsScriptStatus {
  const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_JS_KEY;
  const [status, setStatus] = useState<KakaoMapsScriptStatus>(
    appKey ? "loading" : "no-key",
  );

  useEffect(() => {
    if (!appKey) return;

    let cancelled = false;
    loadKakaoMapsScript(appKey)
      .then(() => {
        if (!cancelled) setStatus("loaded");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [appKey]);

  return status;
}
