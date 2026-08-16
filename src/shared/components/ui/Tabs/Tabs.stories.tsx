import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Cloud, List, Map, Sun } from "lucide-react";
import { useState } from "react";

import { Tabs } from "./Tabs";
import { TabsList } from "./TabsList";
import { TabsTrigger } from "./TabsTrigger";

const meta = {
  title: "shared/ui/Tabs",
  component: Tabs,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

// 카테고리마다 활성 색상이 다르다 (전체=Primary, 관광=Purple, 음식점=Rose, 카페=Yellow).
// 색상은 공용 컴포넌트가 알 필요 없는 호출부 관심사라 className으로 덮어쓴다.
const categoryActiveColor: Record<string, string> = {
  전체: "bg-primary-500",
  관광: "bg-purple-500",
  음식점: "bg-rose-500",
  카페: "bg-yellow-500",
};

export const Pill: Story = {
  args: { value: "", onChange: () => {}, children: null },
  render: () => {
    function Demo() {
      const [value, setValue] = useState("관광");
      return (
        <Tabs value={value} onChange={setValue} variant="pill">
          <TabsList>
            {["전체", "관광", "음식점", "카페"].map((label) => (
              <TabsTrigger
                key={label}
                value={label}
                className={
                  value === label ? categoryActiveColor[label] : undefined
                }
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      );
    }
    return <Demo />;
  },
};

export const Underline: Story = {
  args: { value: "", onChange: () => {}, children: null },
  render: () => {
    function Demo() {
      const [value, setValue] = useState("보관함");
      return (
        <Tabs value={value} onChange={setValue} variant="underline">
          <TabsList>
            {["찾기", "보관함"].map((label) => (
              <TabsTrigger key={label} value={label}>
                장소 {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      );
    }
    return <Demo />;
  },
};

export const Segmented: Story = {
  args: { value: "", onChange: () => {}, children: null },
  render: () => {
    function Demo() {
      const [sort, setSort] = useState("리뷰순");
      const [view, setView] = useState("일정");
      return (
        <div className="flex flex-col gap-6">
          <Tabs value={sort} onChange={setSort} variant="segmented">
            <TabsList>
              {["추천순", "별점순", "리뷰순", "거리순"].map((label) => (
                <TabsTrigger key={label} value={label}>
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Tabs value={view} onChange={setView} variant="segmented">
            <TabsList>
              <TabsTrigger value="일정">
                <List className="size-4" />
                일정
              </TabsTrigger>
              <TabsTrigger value="지도">
                <Map className="size-4" />
                지도
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      );
    }
    return <Demo />;
  },
};

export const DateVariant: Story = {
  args: { value: "", onChange: () => {}, children: null },
  render: () => {
    function Demo() {
      const [value, setValue] = useState("day1");
      return (
        <Tabs value={value} onChange={setValue} variant="date">
          <TabsList>
            <TabsTrigger value="day1" className="flex-col items-start gap-0.5">
              <span className="flex items-center gap-1">
                DAY 1
                <Sun className="size-4" />
              </span>
              <span className="text-tiny text-neutral-700">08.03(월)</span>
            </TabsTrigger>
            <TabsTrigger value="day2" className="flex-col items-start gap-0.5">
              <span className="flex items-center gap-1">
                DAY 2
                <Cloud className="size-4" />
              </span>
              <span className="text-tiny text-neutral-700">08.04(화)</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      );
    }
    return <Demo />;
  },
};
