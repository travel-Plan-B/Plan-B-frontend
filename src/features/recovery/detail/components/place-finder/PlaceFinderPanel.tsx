"use client";

import { FolderOpen, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/shared/components/ui/Button";
import {
  EMPTY_STATE_IMAGES,
  EmptyState,
} from "@/shared/components/ui/EmptyState";
import { Input } from "@/shared/components/ui/Input";
import { ConfirmModal } from "@/shared/components/ui/Modal/ConfirmModal";
import { Tabs } from "@/shared/components/ui/Tabs/Tabs";
import { TabsList } from "@/shared/components/ui/Tabs/TabsList";
import { TabsTrigger } from "@/shared/components/ui/Tabs/TabsTrigger";
import { cn } from "@/shared/lib/cn";
import { MOCK_SEARCH_RESULTS, PLACE_CATEGORIES } from "../../mocks/placeMock";
import { PlaceResultItem } from "./PlaceResultItem";
import { StoredPlaceItem } from "./StoredPlaceItem";

/**
 * 왼쪽 영역: "장소 찾기" / "장소 보관함" 두 탭 패널.
 *
 * TODO(#71): 검색/보관함 API 연동.
 */
export function PlaceFinderPanel() {
  const [tab, setTab] = useState<"search" | "storage">("search");
  const isSearch = tab === "search";

  const [storedIds, setStoredIds] = useState<string[]>(["place-1"]);
  const isStored = (id: string) => storedIds.includes(id);
  const toggleStored = (id: string) => {
    setStoredIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );
  };
  const removeStored = (id: string) =>
    setStoredIds((prev) => prev.filter((v) => v !== id));

  const storedPlaces = MOCK_SEARCH_RESULTS.filter((place) =>
    storedIds.includes(place.id),
  );

  const [categoryFilter, setCategoryFilter] =
    useState<(typeof PLACE_CATEGORIES)[number]>("전체");
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const filteredStoredPlaces =
    categoryFilter === "전체"
      ? storedPlaces
      : storedPlaces.filter((place) => place.categoryTag === categoryFilter);

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
            <span
              className={cn(
                "text-tiny inline-flex size-4 items-center justify-center rounded-full font-medium",
                tab === "storage"
                  ? "bg-primary-500 text-white"
                  : "bg-neutral-100 text-neutral-700",
              )}
            >
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
              defaultValue="성산"
              placeholder="태그나,장소명을 검색 해주세요"
              clearable
              className="text-fluid-sm placeholder:text-fluid-sm pl-10 py-1.5"
            />
          </div>

          <p className="text-xs font-semibold text-neutral-700">
            검색 결과{" "}
            <span className="font-semibold text-primary-600">100</span>
          </p>

          <div className="flex-1 divide-y divide-neutral-100 overflow-y-auto">
            {MOCK_SEARCH_RESULTS.map((place) => (
              <PlaceResultItem
                key={place.id}
                place={place}
                isStored={isStored(place.id)}
                onToggle={() => toggleStored(place.id)}
              />
            ))}
          </div>
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

          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-4 z-10 size-4 -translate-y-1/2 text-neutral-600" />
            <Input
              placeholder="태그나,장소명을 검색 해주세요"
              clearable
              className="text-fluid-sm placeholder:text-fluid-sm pl-10 py-1.5"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {PLACE_CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setCategoryFilter(category)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    categoryFilter === category
                      ? "bg-neutral-900 text-white"
                      : "border border-neutral-200 text-neutral-700 hover:border-neutral-400",
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
            <Button
              variant="ghost-danger"
              size="sm"
              className="shrink-0 gap-1 text-xs"
              disabled={storedPlaces.length === 0}
              onClick={() => setConfirmClearOpen(true)}
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
              보관함 비우기
            </Button>
          </div>

          {filteredStoredPlaces.length === 0 ? (
            <EmptyState
              {...EMPTY_STATE_IMAGES.storage}
              title="보관함이 비어 있어요"
              description="이곳에 드는 장소를 검색해서 + 버튼을 눌러 보관함에 담아 보세요."
              imageClassName="w-40"
              className="flex-1 py-3"
            />
          ) : (
            <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
              {filteredStoredPlaces.map((place) => (
                <StoredPlaceItem
                  key={place.id}
                  place={place}
                  onRemove={() => removeStored(place.id)}
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

      <ConfirmModal
        open={confirmClearOpen}
        onClose={() => setConfirmClearOpen(false)}
        onConfirm={() => {
          setStoredIds([]);
          setConfirmClearOpen(false);
        }}
        title="보관함을 비울까요?"
        description="담아둔 장소가 모두 삭제됩니다."
        confirmLabel="비우기"
        destructive
      />
    </div>
  );
}
