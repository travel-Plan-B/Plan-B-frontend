"use client";

import type { ChangeEvent } from "react";

import type { Place } from "@/features/recovery/api/places";
import { PlaceSearchResultItem } from "@/features/recovery/components/PlaceSearchResultItem";
import { useDebouncedValue } from "@/features/recovery/hooks/useDebouncedValue";
import { usePlaceSearchQuery } from "@/features/recovery/hooks/usePlaceSearchQuery";
import { Input } from "@/shared/components/ui/Input";
import { Spinner } from "@/shared/components/ui/Spinner";
import { cn } from "@/shared/lib/cn";

const SEARCH_DEBOUNCE_MS = 400;

export type SelectedPlace = Pick<
  Place,
  "id" | "placeId" | "source" | "name" | "address" | "lat" | "lng"
>;

interface ReferenceLocationSearchProps {
  id?: string;
  value: string;
  isValueConfirmed: boolean;
  onValueChange: (value: string) => void;
  onSelect: (place: SelectedPlace) => void;
  placeholder?: string;
  inputClassName?: string;
}

export function ReferenceLocationSearch({
  id = "destination",
  value,
  isValueConfirmed,
  onValueChange,
  onSelect,
  placeholder = "대체할 기존 일정 장소를 검색해주세요",
  inputClassName,
}: ReferenceLocationSearchProps) {
  const debouncedQuery = useDebouncedValue(value, SEARCH_DEBOUNCE_MS);
  const query = isValueConfirmed ? "" : debouncedQuery;
  const { data, isLoading, isFetching, isError } = usePlaceSearchQuery(query);

  const hasInput = value.trim().length > 0;
  const isWaitingForDebounce =
    hasInput && value.trim() !== debouncedQuery.trim();
  const isSearching =
    !isValueConfirmed &&
    hasInput &&
    (isWaitingForDebounce || isLoading || isFetching);
  const results = data ?? [];
  const showSettledResult =
    !isValueConfirmed && hasInput && !isSearching && !isError;
  const showSearchPanel =
    isSearching ||
    (!isValueConfirmed && hasInput && !isSearching && isError) ||
    showSettledResult;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onValueChange(event.target.value);
  };

  const handleSelect = (place: Place) => {
    onSelect({
      id: place.id,
      placeId: place.placeId,
      source: place.source,
      name: place.name,
      address: place.address,
      lat: place.lat,
      lng: place.lng,
    });
  };

  return (
    <div className="flex w-full flex-col">
      <Input
        id={id}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        autoComplete="off"
        clearable
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showSettledResult && results.length > 0}
        aria-controls={
          showSearchPanel ? "destination-search-results" : undefined
        }
        className={cn(
          "py-2.5",
          isValueConfirmed && "border-primary-500",
          showSearchPanel && "relative z-10 rounded-b-none",
          inputClassName,
        )}
      />

      {isSearching && (
        <div
          id="destination-search-results"
          className="-mt-px flex items-center gap-2 rounded-b-lg border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700"
          role="status"
        >
          <Spinner size="xs" />
          장소를 검색하고 있어요.
        </div>
      )}

      {!isValueConfirmed && hasInput && !isSearching && isError && (
        <p
          id="destination-search-results"
          className="-mt-px rounded-b-lg border border-rose-100 bg-rose-25 px-4 py-3 text-sm text-rose-700"
          role="alert"
        >
          장소 검색에 실패했어요. 잠시 후 다시 시도해 주세요.
        </p>
      )}

      {showSettledResult && results.length === 0 && (
        <p
          id="destination-search-results"
          className="-mt-px rounded-b-lg border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700"
          role="status"
        >
          검색 결과가 없어요. 다른 장소명으로 검색해 보세요.
        </p>
      )}

      {showSettledResult && results.length > 0 && (
        <div
          id="destination-search-results"
          role="listbox"
          aria-label="장소 검색 결과"
          className="-mt-px max-h-80 w-full overflow-y-auto overscroll-contain rounded-b-lg border border-neutral-200 bg-white divide-y divide-neutral-100"
        >
          {results.map((place) => (
            <PlaceSearchResultItem
              key={place.id}
              place={place}
              onSelect={() => handleSelect(place)}
              className="px-4"
            />
          ))}
        </div>
      )}
    </div>
  );
}
