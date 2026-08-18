"use client";

import { FolderOpen, Search } from "lucide-react";
import { useEffect, useState } from "react";
import {
  EMPTY_STATE_IMAGES,
  EmptyState,
} from "@/shared/components/ui/EmptyState";
import { Input } from "@/shared/components/ui/Input";
import { Tabs } from "@/shared/components/ui/Tabs/Tabs";
import { TabsList } from "@/shared/components/ui/Tabs/TabsList";
import { TabsTrigger } from "@/shared/components/ui/Tabs/TabsTrigger";
import { usePlacesSearchQuery } from "../api/placeQueries";
import type { Place } from "../api/types";
import { PlaceResultItem } from "./PlaceResultItem";

// 타이핑마다 요청을 보내지 않도록, 입력이 멈추고 300ms 뒤에만 검색어를 반영한다.
function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

// 왼쪽 영역: 장소를 검색하거나 보관함에 담아둔 장소를 확인하는 패널.
export function PlaceFinderPanel() {
  const [tab, setTab] = useState<"search" | "storage">("search");
  const isSearch = tab === "search";

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const { data: results, isFetching } = usePlacesSearchQuery(debouncedQuery);

  const [storedPlaces, setStoredPlaces] = useState<Place[]>([]);
  const isStored = (place: Place) =>
    storedPlaces.some((stored) => stored.place_id === place.place_id);
  const toggleStored = (place: Place) => {
    setStoredPlaces((prev) =>
      prev.some((stored) => stored.place_id === place.place_id)
        ? prev.filter((stored) => stored.place_id !== place.place_id)
        : [...prev, place],
    );
  };

  return (
    <div className="min-w-70 flex flex-2 flex-col gap-3 rounded-2xl border border-neutral-200 bg-white px-4 pt-4 pb-0 shadow-lg">
      <Tabs
        value={tab}
        onChange={(value) => setTab(value as typeof tab)}
        variant="underline"
        className="w-full"
      >
        <TabsList className="w-full">
          <TabsTrigger value="search" className="flex-1 text-fluid-base">
            장소 찾기
          </TabsTrigger>
          <TabsTrigger value="storage" className="flex-1 text-fluid-base">
            장소 보관함
            <span className="text-tiny inline-flex size-4 items-center justify-center rounded-full bg-neutral-100 font-medium text-neutral-700">
              {storedPlaces.length}
            </span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {isSearch ? (
        <>
          <div className="flex flex-col gap-1">
            <p className="text-fluid-base text-center font-semibold text-neutral-900">
              여행에 추가할 장소를 찾아보세요
            </p>
            <p className="text-fluid-sm text-center text-neutral-700">
              장소명이나 태그로 검색해 원하는 장소를 보관함에 담을 수 있어요.
            </p>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-4 z-10 size-4 -translate-y-1/2 text-neutral-600" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="태그나,장소명을 검색 해주세요"
              clearable
              className="text-fluid-sm placeholder:text-fluid-sm pl-10 py-1.5"
            />
          </div>

          {!debouncedQuery ? (
            <EmptyState
              {...EMPTY_STATE_IMAGES.search}
              title="원하는 장소를 검색해보세요"
              description="장소명, 지역, 태그로 검색하면 이용 가능한 장소를 찾아드려요."
              imageClassName="w-40"
              className="flex-1 py-3"
            />
          ) : isFetching ? (
            <p className="flex-1 py-3 text-center text-sm text-neutral-500">
              검색 중이에요...
            </p>
          ) : results && results.length > 0 ? (
            <div className="flex-1 divide-y divide-neutral-100 overflow-y-auto">
              {results.map((place) => (
                <PlaceResultItem
                  key={place.place_id}
                  place={place}
                  isStored={isStored(place)}
                  onToggle={() => toggleStored(place)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              {...EMPTY_STATE_IMAGES.search}
              title="검색 결과가 없어요"
              description="다른 장소명이나 태그로 다시 검색해보세요."
              imageClassName="w-40"
              className="flex-1 py-3"
            />
          )}
        </>
      ) : (
        <>
          <div className="flex flex-col gap-1">
            <p className="text-fluid-base text-center font-semibold text-neutral-900">
              저장한 장소를 일정에 추가해보세요
            </p>
            <p className="text-fluid-sm text-center text-neutral-700">
              장소를 오른쪽 일정으로 드래그해 원하는 날짜에 추가할 수 있어요.
            </p>
          </div>

          {storedPlaces.length === 0 ? (
            <EmptyState
              {...EMPTY_STATE_IMAGES.storage}
              title="보관함이 비어 있어요"
              description="이곳에 드는 장소를 검색해서 + 버튼을 눌러 보관함에 담아 보세요."
              imageClassName="w-40"
              className="flex-1 py-3"
            />
          ) : (
            <div className="flex-1 divide-y divide-neutral-100 overflow-y-auto">
              {storedPlaces.map((place) => (
                <PlaceResultItem
                  key={place.place_id}
                  place={place}
                  isStored
                  onToggle={() => toggleStored(place)}
                />
              ))}
            </div>
          )}
        </>
      )}

      <p className="text-fluid-xs mt-auto flex items-center justify-center gap-1.5 border-t border-neutral-200 py-2 text-neutral-700">
        <FolderOpen className="size-4 text-primary-500" aria-hidden="true" />
        보관함은 최대{" "}
        <span className="font-semibold text-primary-600">50개까지</span> 저장
        가능합니다.
      </p>
    </div>
  );
}
