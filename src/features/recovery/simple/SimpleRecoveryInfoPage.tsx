"use client";

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
import {
  isFutureArrivalTime,
  isSimpleRecoveryInfoSubmittable,
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
  const resetRecommendation = useSimpleRecoveryStore(
    (state) => state.resetRecommendation,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionLockRef = useRef(false);
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
    setFormData((current) => ({
      ...current,
      referenceLocationInput,
      referenceLocation: null,
    }));
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

    try {
      if (!reason || !formData.transport) {
        return;
      }

      const locationDraft = toSimpleRecoveryLocationDraft(
        formData.referenceLocation,
      );
      if (!locationDraft) {
        throw new Error("복구 대상 장소를 확인해 주세요.");
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

      resetRecommendation();
      const response = await requestSimpleRecommendations(request);
      if (!response.success) {
        throw new Error(
          "추천 요청에 실패했습니다. 잠시 후 다시 시도해 주세요.",
        );
      }
      const current = useSimpleRecoveryStore.getState();
      if (current.reason !== reason || current.info !== formData) {
        toast.info("입력 정보가 변경됐어요. 현재 정보로 다시 요청해 주세요.");
        return;
      }
      current.setRecommendationResponse(response);
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
      title="복구할 일정 정보를 입력해주세요"
      description="문제가 생긴 장소와 도착 시간을 바탕으로 대체 일정을 추천해드려요"
      currentStep={2}
      steps={SIMPLE_RECOVERY_STEPS}
      headerClassName="flex-col flex-nowrap md:flex-row md:flex-wrap"
      headingClassName="w-full max-w-none flex-none md:max-w-xl md:flex-1"
    >
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="reference-location"
              className="text-base font-semibold text-neutral-900"
            >
              복구 대상 장소
            </label>
            <ReferenceLocationSearch
              id="reference-location"
              value={formData.referenceLocationInput}
              isValueConfirmed={formData.referenceLocation !== null}
              placeholder="대체할 기존 일정 장소를 검색해주세요"
              onValueChange={handleReferenceLocationInputChange}
              onSelect={(place: SelectedPlace) => {
                setFormData((current) => ({
                  ...current,
                  referenceLocationInput: place.name,
                  referenceLocation: toSearchReferenceLocation(place),
                }));
              }}
            />
            {formData.referenceLocation && (
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
