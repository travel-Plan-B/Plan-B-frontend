import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Tag } from "./Tag";
import { EMPTY_STATE_IMAGES, EmptyState } from "./EmptyState";

const meta = {
  title: "shared/ui/EmptyState",
  component: EmptyState,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Storage: Story = {
  args: {
    ...EMPTY_STATE_IMAGES.storage,
    title: "보관함이 비어 있어요",
    description:
      "이곳에 드는 장소를 검색해서 + 버튼을 눌러 보관함에 담아 보세요.",
  },
};

export const Search: Story = {
  args: {
    ...EMPTY_STATE_IMAGES.search,
    title: "원하는 장소를 검색해보세요",
    description: "장소명, 지역, 태그로 검색하면 이용 가능한 장소를 찾아드려요.",
  },
};

export const Schedule: Story = {
  args: {
    ...EMPTY_STATE_IMAGES.scheduleMascot,
    title: "아직 등록된 일정이 없어요",
    description: "왼쪽 보관함의 장소를 드래그해 여행 일정을 만들어보세요.",
    action: (
      <Tag variant="gray">드래그 앤 드롭으로 일정을 추가할 수 있어요!</Tag>
    ),
  },
};
