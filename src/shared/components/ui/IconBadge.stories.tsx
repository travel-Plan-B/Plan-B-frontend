import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import calendarIcon from "@/shared/assets/icons/calendar.svg";
import carIcon from "@/shared/assets/icons/car.svg";
import clockIcon from "@/shared/assets/icons/clock.svg";
import rainIcon from "@/shared/assets/icons/rain.svg";
import trainIcon from "@/shared/assets/icons/train.svg";
import walkIcon from "@/shared/assets/icons/walk.svg";

import { IconBadge } from "./IconBadge";

const meta = {
  title: "shared/ui/IconBadge",
  component: IconBadge,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    icon: {
      control: false,
    },
    variant: {
      control: "select",
      options: ["mint", "purple", "pink", "orange", "gray"],
    },
    size: {
      control: "radio",
      options: ["sm", "md", "lg"],
    },
  },
  args: {
    icon: rainIcon,
    variant: "gray",
    size: "md",
  },
} satisfies Meta<typeof IconBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

const icons = [
  { name: "Rain", icon: rainIcon },
  { name: "Clock", icon: clockIcon },
  { name: "Calendar", icon: calendarIcon },
  { name: "Car", icon: carIcon },
  { name: "Walk", icon: walkIcon },
  { name: "Train", icon: trainIcon },
] as const;

export const Default: Story = {};

export const Variants: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <IconBadge icon={rainIcon} variant="mint" aria-label="Mint" />
      <IconBadge icon={rainIcon} variant="purple" aria-label="Purple" />
      <IconBadge icon={rainIcon} variant="pink" aria-label="Pink" />
      <IconBadge icon={rainIcon} variant="orange" aria-label="Orange" />
      <IconBadge icon={rainIcon} variant="gray" aria-label="Gray" />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      <IconBadge icon={clockIcon} size="sm" aria-label="Small" />
      <IconBadge icon={clockIcon} size="md" aria-label="Medium" />
      <IconBadge icon={clockIcon} size="lg" aria-label="Large" />
    </div>
  ),
};

export const Icons: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-6">
      {icons.map(({ name, icon }) => (
        <div key={name} className="flex flex-col items-center gap-2">
          <IconBadge icon={icon} variant="gray" aria-label={name} />
          <span className="text-xs text-neutral-700">{name}</span>
        </div>
      ))}
    </div>
  ),
};

export const DesignComparison: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-medium text-neutral-900">
          날씨 / 시간 / 일정
        </h3>
        <div className="flex gap-6">
          {icons.slice(0, 3).map(({ name, icon }, index) => (
            <div key={name} className="flex flex-col items-center gap-2">
              <div className="flex gap-2">
                <IconBadge icon={icon} variant="gray" />
                <IconBadge
                  icon={icon}
                  variant={(["purple", "pink", "orange"] as const)[index]}
                />
              </div>
              <span className="text-xs text-neutral-700">{name}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-medium text-neutral-900">이동수단</h3>
        <div className="flex gap-6">
          {icons.slice(3).map(({ name, icon }, index) => (
            <div key={name} className="flex flex-col items-center gap-2">
              <div className="flex gap-2">
                <IconBadge icon={icon} variant="gray" />
                <IconBadge
                  icon={icon}
                  variant={(["purple", "pink", "orange"] as const)[index]}
                />
              </div>
              <span className="text-xs text-neutral-700">{name}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  ),
};
