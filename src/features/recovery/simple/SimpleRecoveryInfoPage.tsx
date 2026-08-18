"use client";

import { MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";

import { RecoveryPageLayout } from "@/features/recovery/components/RecoveryPageLayout";
import {
  TransportSelector,
  type TransportType,
} from "@/features/recovery/simple/TransportSelector";
import { SIMPLE_RECOVERY_STEPS } from "@/features/recovery/simple/steps";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { ROUTES } from "@/shared/config/routes";

interface SimpleRecoveryBasicInfo {
  currentLocation: string;
  destination: string;
  arrivalTime: string;
  transport: TransportType;
}

const INITIAL_FORM: SimpleRecoveryBasicInfo = {
  currentLocation: "서울 종로구 인사동",
  destination: "광장 시장",
  arrivalTime: "17 : 00",
  transport: "car",
};

export function SimpleRecoveryInfoPage() {
  const router = useRouter();
  const [formData, setFormData] =
    useState<SimpleRecoveryBasicInfo>(INITIAL_FORM);

  const handleTextChange =
    (field: "currentLocation" | "destination" | "arrivalTime") =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setFormData((current) => ({
        ...current,
        [field]: event.target.value,
      }));
    };

  const handleUseCurrentLocation = () => {
    // Geolocation/address lookup will be connected in a separate feature task.
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
                value={formData.currentLocation}
                onChange={handleTextChange("currentLocation")}
                className="py-2.5 pr-36"
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-8 shadow-sm absolute top-1/2 right-2 -translate-y-1/2 rounded-lg border border-neutral-200 bg-white text-sm text-neutral-700  hover:border-neutral-400"
                onClick={handleUseCurrentLocation}
              >
                <MapPin aria-hidden="true" className="size-4" />
                현재 위치 사용
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="destination"
              className="text-base font-semibold text-neutral-900"
            >
              다음 일정 장소
            </label>
            <Input
              id="destination"
              value={formData.destination}
              onChange={handleTextChange("destination")}
              className="py-2.5"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="arrival-time"
              className="text-base font-semibold text-neutral-900"
            >
              도착해야 하는 시간
            </label>
            <Input
              id="arrival-time"
              inputMode="numeric"
              value={formData.arrivalTime}
              onChange={handleTextChange("arrivalTime")}
              className="py-2.5"
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
          <Button type="submit" size="md">
            복구할 일정 추천받기
          </Button>
        </div>
      </form>
    </RecoveryPageLayout>
  );
}
