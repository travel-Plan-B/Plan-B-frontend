"use client";

import { Calendar, FolderOpen, MapPin, Search } from "lucide-react";
import { useState } from "react";

import { PageContainer } from "@/shared/components/layout/PageContainer";
import {
  EMPTY_STATE_IMAGES,
  EmptyState,
} from "@/shared/components/ui/EmptyState";
import { Input } from "@/shared/components/ui/Input";
import { Stepper, type StepperStep } from "@/shared/components/ui/Stepper";
import { Tag } from "@/shared/components/ui/Tag";
import { Tabs } from "@/shared/components/ui/Tabs/Tabs";
import { TabsList } from "@/shared/components/ui/Tabs/TabsList";
import { TabsTrigger } from "@/shared/components/ui/Tabs/TabsTrigger";

const STEPS: StepperStep[] = [
  { label: "기존 일정 입력" },
  { label: "조건 설정" },
  { label: "결과편집" },
  { label: "최종설정" },
];

function PanelCard({ defaultTab }: { defaultTab: "search" | "storage" }) {
  const [tab, setTab] = useState<"search" | "storage">(defaultTab);
  const isSearch = tab === "search";

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-6">
      <Tabs
        value={tab}
        onChange={(value) => setTab(value as typeof tab)}
        variant="underline"
      >
        <TabsList>
          <TabsTrigger value="search">장소 찾기</TabsTrigger>
          <TabsTrigger value="storage">장소 보관함</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-col gap-1">
        <p className="text-lg font-semibold text-neutral-900">
          {isSearch
            ? "여행에 추가할 장소를 찾아보세요"
            : "저장한 장소를 일정에 추가해보세요"}
        </p>
        <p className="text-sm text-neutral-700">
          {isSearch
            ? "장소명이나 태그로 검색해 원하는 장소를 보관함에 담을 수 있어요."
            : "장소를 오른쪽 일정으로 드래그해 원하는 날짜에 추가할 수 있어요."}
        </p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-neutral-600" />
        <Input placeholder="태그나, 장소명을 검색해주세요" className="pl-10" />
      </div>

      <EmptyState
        {...(isSearch ? EMPTY_STATE_IMAGES.search : EMPTY_STATE_IMAGES.storage)}
        title={isSearch ? "원하는 장소를 검색해보세요" : "보관함이 비어 있어요"}
        description={
          isSearch
            ? "장소명, 지역, 태그로 검색하면 이용 가능한 장소를 찾아드려요."
            : "이곳에 드는 장소를 검색해서 + 버튼을 눌러 보관함에 담아 보세요."
        }
        className="py-6"
      />

      <p className="flex items-center gap-1.5 text-xs text-neutral-500">
        <FolderOpen className="size-4" aria-hidden="true" />
        보관함은 최대 <span className="text-primary-600">50개까지</span> 저장
        가능합니다.
      </p>
    </div>
  );
}

export function TravelScheduleStep() {
  return (
    <PageContainer as="section" className="flex flex-col gap-8 py-8">
      <div className="flex items-start justify-between gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-neutral-900">
            기존 여행 일정을 입력해주세요
          </h1>
          <p className="text-sm text-neutral-700">
            장소를 검색해서 보관함에 추가한 뒤, 여행 일정에 드래그하여 시간을
            설정해주세요.
          </p>
        </div>
        <Stepper steps={STEPS} currentStep={1} className="shrink-0" />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-neutral-900">
            여행 지역
          </span>
          <div className="relative">
            <MapPin className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-neutral-600" />
            <Input placeholder="여행 지역을 입력해주세요" className="pl-10" />
          </div>
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-neutral-900">
            여행 기간
          </span>
          <div className="relative">
            <Calendar className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-neutral-600" />
            <Input placeholder="여행 기간을 선택해주세요" className="pl-10" />
          </div>
        </label>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <PanelCard defaultTab="storage" />
        <PanelCard defaultTab="search" />

        <div className="flex flex-col gap-1 rounded-2xl border border-neutral-200 bg-white p-6">
          <p className="text-lg font-semibold text-neutral-900">
            여행 일정 입력
          </p>
          <p className="text-sm text-neutral-700">
            여행기간을 선택하면 자동으로 추가 돼요!
          </p>
          <EmptyState
            {...EMPTY_STATE_IMAGES.scheduleMascot}
            title="아직 등록된 일정이 없어요"
            description="왼쪽 보관함의 장소를 드래그해 여행 일정을 만들어보세요."
            action={
              <Tag variant="gray">
                드래그 앤 드롭으로 일정을 추가할 수 있어요!
              </Tag>
            }
            className="py-6"
          />
        </div>
      </div>
    </PageContainer>
  );
}
