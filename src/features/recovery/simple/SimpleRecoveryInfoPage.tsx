"use client";

import { LocateFixed, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";

import {
  requestSimpleRecommendations,
  toSimpleRecommendationRequest,
} from "@/features/recovery/simple/api/simpleRecommendations";

import { RecoveryPageLayout } from "@/features/recovery/components/RecoveryPageLayout";
import {
  ReferenceLocationSearch,
  type SelectedPlace,
} from "@/features/recovery/simple/ReferenceLocationSearch";
import { TransportSelector } from "@/features/recovery/simple/TransportSelector";
import { SIMPLE_RECOVERY_STEPS } from "@/features/recovery/simple/steps";
import { reverseGeocodeCoordinates } from "@/features/recovery/simple/reverseGeocode";
import {
  isFutureArrivalTime,
  isSimpleRecoveryInfoSubmittable,
  isLatestLocationSelection,
  toGpsReferenceLocation,
  toSearchReferenceLocation,
  toSimpleRecoveryLocationDraft,
} from "@/features/recovery/simple/simpleRecoveryForm";
import { useSimpleRecoveryStore } from "@/features/recovery/simple/store/useSimpleRecoveryStore";
import { Button } from "@/shared/components/ui/Button";
import {
  TimePicker,
  type TimePickerValue,
} from "@/shared/components/ui/TimePicker";
import { ROUTES } from "@/shared/config/routes";
import { Spinner } from "@/shared/components/ui/Spinner";
import { toast } from "@/shared/components/ui/Toast/toast";
import { cn } from "@/shared/lib/cn";

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

export function SimpleRecoveryInfoPage() {
  const router = useRouter();
  const reason = useSimpleRecoveryStore((state) => state.reason);
  const formData = useSimpleRecoveryStore((state) => state.info);
  const setFormData = useSimpleRecoveryStore((state) => state.setInfo);
  const setRecommendationResponse = useSimpleRecoveryStore(
    (state) => state.setRecommendationResponse,
  );
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionLockRef = useRef(false);
  const locationSelectionVersionRef = useRef(0);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [validationTime, setValidationTime] = useState<Date | null>(null);
  const canSubmit =
    validationTime !== null &&
    isSimpleRecoveryInfoSubmittable({
      referenceLocation: formData.referenceLocation,
      arrivalTime: formData.arrivalTime,
      transport: formData.transport,
      currentTime: validationTime,
    });
  const hasPastArrivalTime =
    validationTime !== null &&
    formData.arrivalTime !== "" &&
    !isFutureArrivalTime(formData.arrivalTime, validationTime);

  useEffect(() => {
    const updateValidationTime = () => setValidationTime(new Date());
    updateValidationTime();

    let intervalId: number | undefined;
    const timeoutId = window.setTimeout(
      () => {
        updateValidationTime();
        intervalId = window.setInterval(updateValidationTime, 60_000);
      },
      60_000 - (Date.now() % 60_000),
    );

    return () => {
      window.clearTimeout(timeoutId);
      if (intervalId !== undefined) window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!reason) {
      toast.info("먼저 복구할 문제 유형을 선택해 주세요.");
      router.replace(ROUTES.RECOVERY_SIMPLE_SETUP);
    }
  }, [reason, router]);

  const handleReferenceLocationInputChange = (
    referenceLocationInput: string,
  ) => {
    locationSelectionVersionRef.current += 1;
    setIsLocating(false);
    setLocationError(null);
    setFormData((current) => ({
      ...current,
      referenceLocationInput,
      referenceLocation: null,
    }));
  };

  const handleUseCurrentLocation = () => {
    if (!("geolocation" in navigator)) {
      setLocationError("이 브라우저에서는 현재 위치를 사용할 수 없습니다.");
      return;
    }

    const requestVersion = locationSelectionVersionRef.current + 1;
    locationSelectionVersionRef.current = requestVersion;
    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const coordinates = {
          lat: coords.latitude,
          lng: coords.longitude,
        };

        try {
          const address = (
            await reverseGeocodeCoordinates(coordinates.lat, coordinates.lng)
          ).trim();
          if (!address) {
            throw new Error("현재 위치 주소가 비어 있습니다.");
          }
          if (
            !isLatestLocationSelection(
              requestVersion,
              locationSelectionVersionRef.current,
            )
          ) {
            return;
          }
          setFormData((current) => ({
            ...current,
            referenceLocationInput: address,
            referenceLocation: toGpsReferenceLocation(address, coordinates),
          }));
        } catch {
          if (
            !isLatestLocationSelection(
              requestVersion,
              locationSelectionVersionRef.current,
            )
          ) {
            return;
          }
          setLocationError("현재 위치의 주소를 확인하지 못했습니다.");
        } finally {
          if (
            isLatestLocationSelection(
              requestVersion,
              locationSelectionVersionRef.current,
            )
          ) {
            setIsLocating(false);
          }
        }
      },
      (error) => {
        if (
          !isLatestLocationSelection(
            requestVersion,
            locationSelectionVersionRef.current,
          )
        ) {
          return;
        }
        setLocationError(
          error.code === error.PERMISSION_DENIED
            ? "위치 권한이 거부되었습니다. 장소를 검색해 주세요."
            : "현재 위치를 확인하지 못했습니다. 장소를 검색해 주세요.",
        );
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submissionLockRef.current) return;

    const submittedAt = new Date();
    const canSubmitAtSubmission = isSimpleRecoveryInfoSubmittable({
      referenceLocation: formData.referenceLocation,
      arrivalTime: formData.arrivalTime,
      transport: formData.transport,
      currentTime: submittedAt,
    });
    if (!canSubmitAtSubmission) {
      if (
        formData.arrivalTime &&
        !isFutureArrivalTime(formData.arrivalTime, submittedAt)
      ) {
        toast.info("현재 시간 이후의 도착 시간을 선택해 주세요.");
      }
      return;
    }

    submissionLockRef.current = true;
    setIsSubmitting(true);
    setLocationError(null);

    try {
      if (!reason || !formData.transport) {
        return;
      }

      const locationDraft = toSimpleRecoveryLocationDraft(
        formData.referenceLocation,
      );
      if (!locationDraft) {
        throw new Error("추천 기준 위치를 확인해 주세요.");
      }

      const request = toSimpleRecommendationRequest(
        {
          ...locationDraft,
          deadlineTime: formData.arrivalTime,
          transport: formData.transport,
          problemReason: reason,
        },
        submittedAt,
      );

      setRecommendationResponse(null);
      const response = await requestSimpleRecommendations(request);
      if (!response.success) {
        throw new Error(
          "추천 요청에 실패했습니다. 잠시 후 다시 시도해 주세요.",
        );
      }
      setRecommendationResponse(response);
      router.push(ROUTES.RECOVERY_SIMPLE_RECOMMEND);
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "추천 요청에 실패했습니다. 잠시 후 다시 시도해 주세요.";
      toast.error(message);
    } finally {
      submissionLockRef.current = false;
      setIsSubmitting(false);
    }
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
              htmlFor="reference-location"
              className="text-base font-semibold text-neutral-900"
            >
              기준 위치
            </label>
            <div className="relative">
              <ReferenceLocationSearch
                id="reference-location"
                value={formData.referenceLocationInput}
                isValueConfirmed={formData.referenceLocation !== null}
                placeholder="장소를 검색하거나 현재 위치를 사용해주세요"
                inputClassName="pr-44"
                onValueChange={handleReferenceLocationInputChange}
                onSelect={(place: SelectedPlace) => {
                  locationSelectionVersionRef.current += 1;
                  setIsLocating(false);
                  setLocationError(null);
                  setFormData((current) => ({
                    ...current,
                    referenceLocationInput: place.name,
                    referenceLocation: toSearchReferenceLocation(place),
                  }));
                }}
              />
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "absolute top-1.5 z-20 h-8 rounded-lg border border-neutral-200 bg-white text-sm text-neutral-700 shadow-sm hover:border-neutral-400",
                  formData.referenceLocationInput ? "right-10" : "right-2",
                )}
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
            {formData.referenceLocation?.source === "search" && (
              <p className="text-sm text-neutral-700">
                {formData.referenceLocation.address}
              </p>
            )}
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
            {hasPastArrivalTime && (
              <p className="text-sm text-rose-600" role="alert">
                현재 시간 이후의 도착 시간을 선택해 주세요.
              </p>
            )}
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
          <Button type="submit" size="md" disabled={!canSubmit || isSubmitting}>
            {isSubmitting && <Spinner size="xs" className="text-current" />}
            {isSubmitting ? "추천 요청 중" : "복구할 일정 추천받기"}
          </Button>
        </div>
      </form>
    </RecoveryPageLayout>
  );
}
