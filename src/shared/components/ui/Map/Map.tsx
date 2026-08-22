"use client";

import { LocateFixed, Minus, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/shared/lib/cn";
import { EMPTY_STATE_IMAGES, EmptyState } from "../EmptyState";
import { Spinner } from "../Spinner";
import { useKakaoMapsScript } from "./useKakaoMapsScript";

export interface MapMarkerData {
  id: string;
  lat: number;
  lng: number;
  title: string;
  description?: string;
  /** 마커 색상(#xxxxxx). 호출하는 쪽에서 도메인 규칙(카테고리 등)에 맞게 정한다. */
  color: string;
}

export interface MapRouteData {
  id: string;
  path: { lat: number; lng: number }[];
  /** 선 색상(#xxxxxx). 호출하는 쪽에서 도메인 규칙(이동수단 등)에 맞게 정한다. */
  color: string;
  dashed?: boolean;
  /** 경로 중간에 띄울 라벨(예: "18분"). 없으면 라벨을 그리지 않는다. */
  label?: string;
}

export interface MapProps {
  markers: MapMarkerData[];
  routes?: MapRouteData[];
  className?: string;
}

// 마커가 하나도 없을 때만 쓰는 기본 중심 좌표(서울시청).
const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };

// 클래식한 "핀" 모양 마커. 끝(꼬리)이 좌표를 정확히 가리키도록 CustomOverlay의
// yAnchor를 1로 맞춰 쓴다(핀 이미지 에셋 없이 SVG만으로 색상별 마커를 만든다).
// color는 MapProps를 통해 호출하는 쪽이 임의의 문자열을 넘길 수 있어서,
// innerHTML 문자열에 그대로 끼워 넣지 않고 setAttribute로 넣는다.
function createMarkerElement(color: string): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "cursor-pointer drop-shadow-md";
  el.innerHTML = `
    <svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.268 21.732 0 14 0Z"/>
      <circle cx="14" cy="14" r="5.5" fill="white"/>
    </svg>
  `;
  el.querySelector("path")?.setAttribute("fill", color);
  return el;
}

// innerHTML 대신 textContent로 조립한다 — marker.title/description은 장소 검색
// 결과에서 온 사용자 데이터라 innerHTML로 넣으면 XSS 위험이 있다.
function createOverlayElement(marker: MapMarkerData): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "min-w-28 max-w-44 rounded-xl bg-white px-3 py-2 shadow-lg";
  // 마커(핀 높이 36px) 바로 위에 붙도록 마커와 같은 좌표 기준으로 끌어올린다.
  // yAnchor로는 핀 높이만큼 정확히 밀어올리기 까다로워서 margin으로 처리한다.
  el.style.marginBottom = "40px";

  const title = document.createElement("p");
  title.className = "text-sm font-bold text-neutral-900";
  title.textContent = marker.title;
  el.appendChild(title);

  if (marker.description) {
    const description = document.createElement("p");
    description.className = "mt-0.5 text-xs text-neutral-500";
    description.textContent = marker.description;
    el.appendChild(description);
  }

  return el;
}

function createRouteLabelElement(label: string, color: string): HTMLDivElement {
  const el = document.createElement("div");
  el.className =
    "flex items-center gap-0.5 rounded-full bg-white px-2 py-0.5 text-tiny font-semibold shadow-md whitespace-nowrap";
  el.style.color = color;
  el.textContent = `→ ${label}`;
  return el;
}

/**
 * 카카오맵 기반 지도. 마커 클릭 시 커스텀 오버레이로 장소 정보를 보여주고,
 * routes를 넘기면 이동 경로 선도 같이 그린다(design-system.md Map 규격).
 * NEXT_PUBLIC_KAKAO_MAP_JS_KEY가 없으면 안내 문구만 보여주고 SDK를 아예 불러오지 않는다.
 */
export function Map({ markers, routes = [], className }: MapProps) {
  const status = useKakaoMapsScript();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<kakao.maps.Map | null>(null);
  const boundsRef = useRef<kakao.maps.LatLngBounds | null>(null);
  const activeOverlayRef = useRef<{
    id: string;
    overlay: kakao.maps.CustomOverlay;
  } | null>(null);
  // 지도가 로드된 뒤에만 커스텀 줌/현재 위치 버튼을 보여준다.
  const [controlsReady, setControlsReady] = useState(false);

  useEffect(() => {
    if (status !== "loaded" || !containerRef.current) return;

    const center = markers[0]
      ? new window.kakao.maps.LatLng(markers[0].lat, markers[0].lng)
      : new window.kakao.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng);

    const map =
      mapInstanceRef.current ??
      new window.kakao.maps.Map(containerRef.current, { center, level: 7 });
    mapInstanceRef.current = map;
    setControlsReady(true);

    const bounds = new window.kakao.maps.LatLngBounds();
    const markerOverlays = markers.map((markerData) => {
      const position = new window.kakao.maps.LatLng(
        markerData.lat,
        markerData.lng,
      );
      bounds.extend(position);

      const markerEl = createMarkerElement(markerData.color);
      const markerOverlay = new window.kakao.maps.CustomOverlay({
        position,
        content: markerEl,
        map,
        yAnchor: 1,
        zIndex: 2,
      });

      // 같은 마커를 다시 클릭하면 닫히고(토글), 다른 마커를 클릭하면 기존 정보
      // 카드를 닫고 새로 연다 — 여러 개가 동시에 떠서 지도를 가리지 않게.
      markerEl.addEventListener("click", () => {
        if (activeOverlayRef.current?.id === markerData.id) {
          activeOverlayRef.current.overlay.setMap(null);
          activeOverlayRef.current = null;
          return;
        }

        activeOverlayRef.current?.overlay.setMap(null);
        const infoOverlay = new window.kakao.maps.CustomOverlay({
          position,
          content: createOverlayElement(markerData),
          map,
          yAnchor: 1,
          zIndex: 3,
        });
        activeOverlayRef.current = { id: markerData.id, overlay: infoOverlay };
      });

      return markerOverlay;
    });

    const routeOverlays: (kakao.maps.Polyline | kakao.maps.CustomOverlay)[] =
      [];
    routes.forEach((route) => {
      route.path.forEach((point) =>
        bounds.extend(new window.kakao.maps.LatLng(point.lat, point.lng)),
      );
      routeOverlays.push(
        new window.kakao.maps.Polyline({
          map,
          path: route.path.map(
            (point) => new window.kakao.maps.LatLng(point.lat, point.lng),
          ),
          strokeWeight: 3,
          strokeColor: route.color,
          strokeOpacity: 0.9,
          strokeStyle: route.dashed ? "shortdash" : "solid",
        }),
      );

      if (route.label && route.path.length > 0) {
        // 경로 좌표들의 평균 지점에 "→ 18분" 같은 라벨을 띄운다.
        const midLat =
          route.path.reduce((sum, p) => sum + p.lat, 0) / route.path.length;
        const midLng =
          route.path.reduce((sum, p) => sum + p.lng, 0) / route.path.length;
        routeOverlays.push(
          new window.kakao.maps.CustomOverlay({
            position: new window.kakao.maps.LatLng(midLat, midLng),
            content: createRouteLabelElement(route.label, route.color),
            map,
            zIndex: 1,
          }),
        );
      }
    });

    boundsRef.current = bounds;
    // DAY를 바꿔 markers가 통째로 달라져도(지도 인스턴스는 최초 한 번만 만들어
    // 재사용하므로) 매번 새 마커 기준으로 다시 맞춰줘야 한다.
    if (markers.length > 1) {
      map.setBounds(bounds);
    } else {
      map.setCenter(center);
    }

    return () => {
      markerOverlays.forEach((overlay) => overlay.setMap(null));
      routeOverlays.forEach((overlay) => overlay.setMap(null));
      activeOverlayRef.current?.overlay.setMap(null);
      activeOverlayRef.current = null;
    };
  }, [status, markers, routes]);

  // 카카오맵은 레벨 숫자가 작을수록 확대된 상태다.
  const handleZoomIn = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.setLevel(Math.max(1, map.getLevel() - 1));
  };
  const handleZoomOut = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.setLevel(Math.min(14, map.getLevel() + 1));
  };
  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (!map || !boundsRef.current) return;
    if (markers.length > 1) {
      map.setBounds(boundsRef.current);
    } else if (markers[0]) {
      map.setCenter(
        new window.kakao.maps.LatLng(markers[0].lat, markers[0].lng),
      );
    }
  };

  if (status === "no-key" || status === "error") {
    return (
      <EmptyState
        {...EMPTY_STATE_IMAGES.scheduleMascot}
        title={
          status === "no-key"
            ? "지도를 표시할 수 없어요"
            : "지도를 불러오지 못했어요"
        }
        description={
          status === "no-key"
            ? "카카오맵 API 키가 설정되지 않았어요."
            : "잠시 후 다시 시도해주세요."
        }
        imageClassName="w-32"
        className={cn(
          "flex-1 rounded-xl border border-dashed border-neutral-300 py-3",
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn("relative flex-1 overflow-hidden rounded-xl", className)}
    >
      {status === "loading" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white">
          <Spinner size="md" />
        </div>
      )}
      <div ref={containerRef} className="h-full w-full" />

      {controlsReady && (
        <div className="absolute right-3 bottom-3 z-20 flex flex-col items-center gap-2">
          <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-md">
            <button
              type="button"
              onClick={handleZoomIn}
              aria-label="지도 확대"
              className="flex size-9 items-center justify-center text-neutral-700 hover:bg-neutral-50"
            >
              <Plus className="size-4" aria-hidden="true" />
            </button>
            <div className="h-px w-full bg-neutral-200" />
            <button
              type="button"
              onClick={handleZoomOut}
              aria-label="지도 축소"
              className="flex size-9 items-center justify-center text-neutral-700 hover:bg-neutral-50"
            >
              <Minus className="size-4" aria-hidden="true" />
            </button>
          </div>
          <button
            type="button"
            onClick={handleRecenter}
            aria-label="전체 마커 다시 보기"
            className="flex size-9 items-center justify-center rounded-full bg-white text-neutral-700 shadow-md hover:bg-neutral-50"
          >
            <LocateFixed className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
