import { create } from "zustand";
import type { StoreApi } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { DateRange } from "@/shared/components/ui/DateRangePicker";
import type { DetailRecommendResult } from "../api/detailRecommend";
import type { SituationType, StyleType } from "../mocks/conditionMock";
import type { ResultScheduleItem } from "../mocks/resultEditMock";
import type { ScheduleItem } from "../mocks/scheduleMock";

/** useState 세터처럼 값 하나 또는 (prev) => next 업데이터 함수 둘 다 받는다. */
type Updater<T> = T | ((prev: T) => T);
function resolve<T>(update: Updater<T>, prev: T): T {
  return typeof update === "function"
    ? (update as (prev: T) => T)(prev)
    : update;
}

/**
 * 복구 대상 항목 하나의 "어떤 문제/어떤 스타일" 답. 같은 날이어도 항목마다
 * 이유가 다를 수 있어서(예: A는 날씨, B는 폐업) 항목 단위로 따로 둔다.
 */
export interface RecoveryCondition {
  situation: SituationType;
  subAnswer: string | null;
  style: StyleType;
}

export const DEFAULT_RECOVERY_CONDITION: RecoveryCondition = {
  situation: "weather",
  subAnswer: "outdoor-walking",
  style: "new",
};

interface RecoveryDraftData {
  step: number;
  region: string;
  dateRange: DateRange;
  itemsByDay: Record<number, ScheduleItem[]>;
  selectedIds: Set<string>;
  /** 체크한 항목이 기본으로 쓰는 공통 복구 조건. */
  sharedCondition: RecoveryCondition;
  /**
   * "개별로 설정"한 항목만 공통 조건 대신 자기만의 조건을 쓴다. 대부분은
   * 공통 조건을 그대로 쓰는 게 흔해서(예외만 따로), 여기 없으면 sharedCondition을
   * 쓴다. 체크 해제하면 같이 지운다.
   */
  overrideConditionByItemId: Record<string, RecoveryCondition>;
  resultItemsByDay: Record<number, ResultScheduleItem[]>;
  /** 2단계에서 선택한 항목마다 REQ-DETAIL-002로 받아온 추천 후보. */
  recommendationsByItemId: Record<string, DetailRecommendResult>;
  /** 3단계에서 지금 어떤 항목의 추천을 보고 있는지(왼쪽 DAY 목록 클릭으로 전환). */
  activeRecommendItemId: string | null;
}

const initialDraft: RecoveryDraftData = {
  step: 1,
  region: "",
  dateRange: { start: null, end: null },
  itemsByDay: {},
  selectedIds: new Set(),
  sharedCondition: DEFAULT_RECOVERY_CONDITION,
  overrideConditionByItemId: {},
  resultItemsByDay: {},
  recommendationsByItemId: {},
  activeRecommendItemId: null,
};

/** `setStep`처럼 각 필드마다 useState 세터와 같은 모양의 setter 이름을 만든다. */
type SetterName<K extends string> = `set${Capitalize<K>}`;
type Setters = {
  [K in keyof RecoveryDraftData as SetterName<string & K>]: (
    update: Updater<RecoveryDraftData[K]>,
  ) => void;
};

interface RecoveryDraftStore extends RecoveryDraftData, Setters {
  restart: () => void;
  /** localStorage에서 값을 읽어오기 전(SSR 직후)엔 false. 하이드레이션 불일치 방지용. */
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
}

/**
 * `initialDraft`의 키마다 `setRegion`, `setDateRange` 같은 setter를 자동으로
 * 만든다. useState 세터처럼 값 또는 업데이터 함수를 받는다 — 그래야
 * TravelScheduleStep 등 이미 `onRegionChange={setRegion}` 식으로 쓰던 화면
 * 코드를 하나도 안 고치고 그대로 꽂아 쓸 수 있다.
 */
function createSetters(
  set: StoreApi<RecoveryDraftStore>["setState"],
  get: StoreApi<RecoveryDraftStore>["getState"],
): Setters {
  const setters = {} as Setters;
  for (const key of Object.keys(initialDraft) as (keyof RecoveryDraftData)[]) {
    const name = `set${key[0].toUpperCase()}${key.slice(1)}` as keyof Setters;
    (setters[name] as (update: Updater<unknown>) => void) = (update) =>
      set({ [key]: resolve(update, get()[key]) });
  }
  return setters;
}

/**
 * 디테일모드 복구 플로우(1~4단계) 전체 상태를 localStorage에 저장해, 새로고침해도
 * 입력한 여행 일정/선택/추천 결과가 그대로 유지되게 한다. 장소 보관함
 * (useStoredPlacesStore)과 동일한 zustand persist 패턴이다.
 */
export const useRecoveryDraftStore = create<RecoveryDraftStore>()(
  persist(
    (set, get) => ({
      ...initialDraft,
      ...createSetters(set, get),
      restart: () => set({ ...initialDraft }),
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "planb-recovery-detail-draft",
      // localStorage 읽기는 동기라, 스토어 생성 시점에 바로 rehydrate되면
      // 서버 렌더(hasHydrated: false)와 클라이언트 첫 렌더가 어긋난다. 자동
      // rehydrate를 끄고, 마운트 후 RecoveryFlow가 직접 rehydrate()를 부른다.
      skipHydration: true,
      // hasHydrated는 "이번 로드에서 복원이 끝났는지"를 나타내는 런타임
      // 플래그일 뿐이라 localStorage에 같이 저장되면 안 된다(다음 로드 때
      // 저장된 값으로 되돌아와 버림) — initialDraft에 있는 필드만 저장한다.
      partialize: (state) =>
        Object.fromEntries(
          (Object.keys(initialDraft) as (keyof RecoveryDraftData)[]).map(
            (key) => [key, state[key]],
          ),
        ) as unknown as RecoveryDraftData,
      storage: createJSONStorage(() => localStorage, {
        replacer: (_key, value) =>
          value instanceof Set ? { __type: "Set", values: [...value] } : value,
        // dateRange.start/end는 JSON.stringify가 알아서 ISO 문자열로 바꿔주지만
        // 되돌아올 땐 문자열 그대로라 여기서 다시 Date로 바꿔줘야 한다.
        reviver: (key, value) => {
          if (
            value &&
            typeof value === "object" &&
            "__type" in value &&
            value.__type === "Set" &&
            "values" in value &&
            Array.isArray(value.values)
          ) {
            return new Set(value.values);
          }
          if ((key === "start" || key === "end") && typeof value === "string") {
            return new Date(value);
          }
          return value;
        },
      }),
      // 저장된 값이 깨져 있으면(예: 수동 편집, 포맷 변경) state 없이 error만
      // 온다 — 그 경우에도 hasHydrated는 true로 만들어야 RecoveryFlow가
      // 계속 null만 그리는 상태에 갇히지 않는다.
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error("복구 플로우 데이터 복원 실패:", error);
        }
        useRecoveryDraftStore.getState().setHasHydrated(true);
      },
    },
  ),
);
