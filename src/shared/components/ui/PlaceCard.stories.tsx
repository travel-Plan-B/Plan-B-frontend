import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { cn } from "@/shared/lib/cn";

import { PlaceCard } from "./PlaceCard";

const PLACE_SAMPLE_IMAGE =
  "https://images.unsplash.com/photo-1548013146-72479768bada";

const defaultPlace = {
  imageUrl: PLACE_SAMPLE_IMAGE,
  imageAlt: "서울역사박물관",
  title: "서울역사박물관",
  category: "박물관",
  location: "서울시 종로구",
  travelTime: "18분",
  stayTime: "1시간 20분",
  cost: "무료",
  rating: 4.4,
  onDetail: fn(),
};

const compactPlace = {
  imageUrl: PLACE_SAMPLE_IMAGE,
  imageAlt: "익선동 카페거리",
  title: "익선동 카페거리",
  category: "카페 · 상점",
  location: "종로",
  distance: "도보 12분",
  hours: "10:00 - 20:00",
  parking: "무료주차 및 인근 유료주차장 이용 가능",
  rating: 4.3,
  onDetail: fn(),
  onSelect: fn(),
};

const meta = {
  title: "shared/ui/PlaceCard",
  component: PlaceCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "radio",
      options: ["default", "compact"],
    },
    onDetail: { action: "detail-clicked" },
    onSelect: { action: "select-clicked" },
  },
  args: {
    variant: "default",
    ...defaultPlace,
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-90">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PlaceCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Compact: Story = {
  args: {
    variant: "compact",
    ...compactPlace,
  },
};

export const CompactRecommended: Story = {
  args: {
    variant: "compact",
    recommended: true,
    ...compactPlace,
  },
};

export const LongTitle: Story = {
  args: {
    variant: "compact",
    ...compactPlace,
    title: "전통과 현대가 함께하는 익선동 한옥 카페거리 문화 공간",
    hours: "평일 10:00 - 22:00 · 주말 및 공휴일 09:00 - 23:00",
    parking: "전용 주차장이 없어 인근 공영 및 민영 유료주차장을 이용해 주세요.",
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export const MobileCompact: Story = {
  decorators: [],
  render: () => (
    <div className="flex max-w-full flex-col items-start gap-6">
      {[
        { label: "288px", width: "w-72" },
        { label: "320px", width: "w-80" },
        { label: "376px", width: "w-94" },
      ].map(({ label, width }) => (
        <div key={label} className={cn("max-w-full", width)}>
          <p className="mb-2 text-xs font-medium text-neutral-700">{label}</p>
          <PlaceCard
            variant="compact"
            {...compactPlace}
            recommended
            title="전통과 현대가 함께하는 익선동 한옥 카페거리"
            hours="평일 10:00 - 22:00 · 주말 및 공휴일 09:00 - 23:00"
            parking="전용 주차장이 없어 인근 공영 및 민영 유료주차장을 이용해 주세요."
          />
        </div>
      ))}
    </div>
  ),
};

export const MissingOptionalData: Story = {
  args: {
    variant: "compact",
    imageUrl: undefined,
    title: "종로 산책길",
    category: undefined,
    location: "종로",
    rating: undefined,
    distance: undefined,
    hours: undefined,
    parking: undefined,
    recommended: false,
    onDetail: fn(),
    onSelect: undefined,
  },
};

export const ImageLoadError: Story = {
  args: {
    variant: "compact",
    ...compactPlace,
    imageUrl: "/images/place-image-that-does-not-exist.png",
  },
};

export const Variants: Story = {
  decorators: [],
  render: () => (
    <div className="flex w-full max-w-3xl flex-wrap items-start gap-6">
      <PlaceCard {...defaultPlace} />
      <PlaceCard variant="compact" recommended {...compactPlace} />
    </div>
  ),
};
