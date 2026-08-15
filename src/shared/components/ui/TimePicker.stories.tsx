import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { TimePicker, type TimePickerValue } from "./TimePicker";

const meta = {
  title: "shared/ui/TimePicker",
  component: TimePicker,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof TimePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

const hourOptions = Array.from({ length: 23 }, (_, index) => {
  const hour = index + 1;
  return {
    value: hour,
    label: String(hour).padStart(2, "0"),
  };
});

const minuteOptions = [0, 10, 20, 30, 40, 50].map((minute) => ({
  value: minute,
  label: String(minute).padStart(2, "0"),
}));

const durationHourOptions = Array.from({ length: 4 }, (_, hour) => ({
  value: hour,
  label: `${hour}시간`,
}));

const durationMinuteOptions = [0, 30].map((minute) => ({
  value: minute,
  label: `${minute}분`,
}));

export const Default: Story = {
  args: {
    title: "방문 시간 선택",
    value: { hour: 9, minute: 30 },
    hourOptions,
    minuteOptions,
    onChange: () => {},
  },
  render: () => {
    function Demo() {
      const [visitTime, setVisitTime] = useState<TimePickerValue>({
        hour: 9,
        minute: 30,
      });
      const [stayTime, setStayTime] = useState<TimePickerValue>({
        hour: 1,
        minute: 30,
      });
      return (
        <div className="flex items-start gap-6">
          <div className="flex flex-col gap-2">
            <span className="text-sm text-neutral-700">방문 시간</span>
            <TimePicker
              title="방문 시간 선택"
              value={visitTime}
              onChange={setVisitTime}
              hourOptions={hourOptions}
              minuteOptions={minuteOptions}
              columnLabels={{ hour: "시", minute: "분" }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm text-neutral-700">체류 시간</span>
            <TimePicker
              title="체류 시간 선택"
              value={stayTime}
              onChange={setStayTime}
              hourOptions={durationHourOptions}
              minuteOptions={durationMinuteOptions}
              columnLabels={{ hour: "시간", minute: "분" }}
              formatValue={(value) => `${value.hour}시간 ${value.minute}분`}
              isValid={(value) => value.hour > 0 || value.minute > 0}
            />
          </div>
        </div>
      );
    }
    return <Demo />;
  },
};
