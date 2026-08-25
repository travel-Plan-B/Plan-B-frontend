import carIcon from "@/shared/assets/icons/car.svg";
import trainIcon from "@/shared/assets/icons/train.svg";
import walkIcon from "@/shared/assets/icons/walk.svg";
import { IconBadge } from "@/shared/components/ui/IconBadge";
import { cn } from "@/shared/lib/cn";

export type TransportType = "car" | "walk" | "transit";

const TRANSPORT_OPTIONS = [
  { value: "car", label: "차량", icon: carIcon },
  { value: "walk", label: "도보", icon: walkIcon },
  {
    value: "transit",
    label: "대중교통",
    icon: trainIcon,
    disabled: true,
  },
] satisfies Array<{
  value: TransportType;
  label: string;
  icon: typeof carIcon;
  disabled?: boolean;
}>;

interface TransportSelectorProps {
  value: TransportType | null;
  onChange: (value: TransportType) => void;
}

export function TransportSelector({ value, onChange }: TransportSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {TRANSPORT_OPTIONS.map((option) => {
        const selected = value === option.value;
        const disabled = option.disabled === true;

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border bg-white p-3 text-sm font-semibold text-neutral-900 transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
              disabled
                ? "cursor-not-allowed border-neutral-200 bg-neutral-50 text-neutral-500"
                : selected
                  ? "border-primary-500 bg-primary-25 text-primary-700"
                  : "border-neutral-200 hover:border-neutral-400",
            )}
          >
            <IconBadge
              icon={option.icon}
              variant={!disabled && selected ? "mint" : "gray"}
              size="md"
            />
            <span>{option.label}</span>
            {disabled && (
              <span className="text-xs font-normal text-neutral-500">
                준비 중
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
