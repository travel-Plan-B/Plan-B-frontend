"use client";

import { LocateFixed, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";

import { RecoveryPageLayout } from "@/features/recovery/components/RecoveryPageLayout";
import {
  DestinationSearch,
  type SelectedDestination,
} from "@/features/recovery/simple/DestinationSearch";
import {
  TransportSelector,
  type TransportType,
} from "@/features/recovery/simple/TransportSelector";
import { SIMPLE_RECOVERY_STEPS } from "@/features/recovery/simple/steps";
import { reverseGeocodeCoordinates } from "@/features/recovery/simple/reverseGeocode";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import {
  TimePicker,
  type TimePickerValue,
} from "@/shared/components/ui/TimePicker";
import { ROUTES } from "@/shared/config/routes";

interface SimpleRecoveryBasicInfo {
  currentLocationInput: string;
  currentLocation: CurrentLocation | null;
  destinationQuery: string;
  selectedDestination: SelectedDestination | null;
  arrivalTime: string;
  transport: TransportType | null;
}

interface CurrentLocation {
  address: string;
  lat: number | null;
  lng: number | null;
}

const ARRIVAL_HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => ({
  value: hour,
  label: String(hour).padStart(2, "0"),
}));

const ARRIVAL_MINUTE_OPTIONS = [0, 10, 20, 30, 40, 50].map((minute) => ({
  value: minute,
  label: String(minute).padStart(2, "0"),
}));

function parseTime(value: string): TimePickerValue | null {
  if (!value) return null;
  const [hour, minute] = value.split(":").map(Number);
  return { hour, minute };
}

function formatTime({ hour, minute }: TimePickerValue): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

const INITIAL_FORM: SimpleRecoveryBasicInfo = {
  currentLocationInput: "",
  currentLocation: null,
  destinationQuery: "",
  selectedDestination: null,
  arrivalTime: "",
  transport: null,
};

export function SimpleRecoveryInfoPage() {
  const router = useRouter();
  const [formData, setFormData] =
    useState<SimpleRecoveryBasicInfo>(INITIAL_FORM);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const canSubmit = Boolean(
    formData.currentLocation?.address.trim() && formData.arrivalTime,
  );

  const handleCurrentLocationChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const address = event.target.value;
    setLocationError(null);
    setFormData((current) => ({
      ...current,
      currentLocationInput: address,
      currentLocation: address ? { address, lat: null, lng: null } : null,
    }));
  };

  const handleUseCurrentLocation = () => {
    if (!("geolocation" in navigator)) {
      setLocationError("이 브라우저에서는 현재 위치를 사용할 수 없습니다.");
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const address = await reverseGeocodeCoordinates(
            coords.latitude,
            coords.longitude,
          );
          setFormData((current) => ({
            ...current,
            currentLocationInput: address,
            currentLocation: {
              address,
              lat: coords.latitude,
              lng: coords.longitude,
            },
          }));
        } catch {
          setLocationError("현재 위치의 주소를 확인하지 못했습니다.");
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setLocationError(
          error.code === error.PERMISSION_DENIED
            ? "위치 권한이 거부되었습니다. 직접 입력해주세요."
            : "현재 위치를 확인하지 못했습니다. 직접 입력해주세요.",
        );
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;
    router.push(ROUTES.RECOVERY_SIMPLE_RECOMMEND);
  };

  return (
    <RecoveryPageLayout
      title="기존 정보를 입력해주세요"
      description="최소한의 정보만으로 최적의 일정을 추천해드려요"
      currentStep={2}
      steps={SIMPLE_RECOVERY_STEPS}
    >
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="current-location"
              className="text-base font-semibold text-neutral-900"
            >
              현재 위치
            </label>
            <div className="relative">
              <Input
                id="current-location"
                value={formData.currentLocationInput}
                onChange={handleCurrentLocationChange}
                placeholder="현재 위치를 입력해주세요"
                className="py-2.5 pr-36"
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-8 shadow-sm absolute top-1/2 right-2 -translate-y-1/2 rounded-lg border border-neutral-200 bg-white text-sm text-neutral-700  hover:border-neutral-400"
                onClick={handleUseCurrentLocation}
                disabled={isLocating}
              >
                {isLocating ? (
                  <LocateFixed
                    aria-hidden="true"
                    className="size-4 animate-pulse"
                  />
                ) : (
                  <MapPin aria-hidden="true" className="size-4" />
                )}
                {isLocating ? "위치 확인 중" : "현재 위치 사용"}
              </Button>
            </div>
            {locationError && (
              <p className="text-sm text-rose-600" role="alert">
                {locationError}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="destination"
              className="text-base font-semibold text-neutral-900"
            >
              다음 일정 장소
            </label>
            <DestinationSearch
              value={formData.destinationQuery}
              selectedDestination={formData.selectedDestination}
              onValueChange={(destinationQuery) =>
                setFormData((current) => ({
                  ...current,
                  destinationQuery,
                  selectedDestination: null,
                }))
              }
              onSelect={(selectedDestination) =>
                setFormData((current) => ({
                  ...current,
                  destinationQuery: selectedDestination.name,
                  selectedDestination,
                }))
              }
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="arrival-time"
              className="text-base font-semibold text-neutral-900"
            >
              도착해야 하는 시간
            </label>
            <TimePicker
              id="arrival-time"
              title="도착 시간 선택"
              value={parseTime(formData.arrivalTime)}
              onChange={(value) =>
                setFormData((current) => ({
                  ...current,
                  arrivalTime: formatTime(value),
                }))
              }
              hourOptions={ARRIVAL_HOUR_OPTIONS}
              minuteOptions={ARRIVAL_MINUTE_OPTIONS}
              columnLabels={{ hour: "시", minute: "분" }}
              placeholder="도착 시간을 선택해주세요"
              className="w-full justify-between"
            />
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-base font-semibold text-neutral-900">
              이동수단 선택
            </legend>
            <TransportSelector
              value={formData.transport}
              onChange={(transport) =>
                setFormData((current) => ({ ...current, transport }))
              }
            />
          </fieldset>
        </div>

        <div className="mx-auto mt-8 flex w-full max-w-2xl justify-end">
          <Button type="submit" size="md" disabled={!canSubmit}>
            복구할 일정 추천받기
          </Button>
        </div>
      </form>
    </RecoveryPageLayout>
  );
}
