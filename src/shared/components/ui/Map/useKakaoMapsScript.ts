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
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services`;
    script.async = true;

    // 실패한 캐시를 그대로 두면 이후 마운트되는 모든 <Map>이 재시도 없이
    // 즉시 "error"만 받게 된다 — 캐시를 비우고 실패한 스크립트 태그도
    // 지워서, 다음 마운트(탭 재진입 등)가 실제로 다시 시도하게 한다.
    const fail = (error: Error) => {
      window.clearTimeout(timeoutId);
      script.remove();
      scriptLoadPromise = null;
      reject(error);
    };

    // kakao.maps.load의 콜백이 어떤 이유로든 끝내 호출되지 않으면(스크립트는
    // 받아왔지만 SDK 내부 초기화가 멈추는 경우 등) Promise가 영원히 pending
    // 상태로 남아 <Map>이 "loading"에서 멈춘다 — 일정 시간 뒤엔 실패로 처리한다.
    const timeoutId = window.setTimeout(
      () => fail(new Error("카카오맵 SDK 로드 시간 초과")),
      10000,
    );

    script.onload = () => {
      try {
        window.kakao.maps.load(() => {
          window.clearTimeout(timeoutId);
          resolve();
        });
      } catch (error) {
        fail(
          error instanceof Error
            ? error
            : new Error("카카오맵 SDK 초기화 실패"),
        );
      }
    };
    script.onerror = () => fail(new Error("카카오맵 SDK 로드 실패"));
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

export function loadKakaoMapsSdk(): Promise<void> {
  const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_JS_KEY;

  if (!appKey) {
    return Promise.reject(new Error("Kakao Maps JavaScript key is missing."));
  }

  return loadKakaoMapsScript(appKey);
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
    loadKakaoMapsSdk()
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
