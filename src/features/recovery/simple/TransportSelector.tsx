import carIcon from "@/shared/assets/icons/car.svg";
import trainIcon from "@/shared/assets/icons/train.svg";
import walkIcon from "@/shared/assets/icons/walk.svg";
import { IconBadge } from "@/shared/components/ui/IconBadge";
import { cn } from "@/shared/lib/cn";

export type TransportType = "car" | "walk" | "transit";

const TRANSPORT_OPTIONS = [
  { value: "car", label: "차량", icon: carIcon },
  { value: "walk", label: "도보", icon: walkIcon },
  { value: "transit", label: "대중교통", icon: trainIcon },
] satisfies Array<{
  value: TransportType;
  label: string;
  icon: typeof carIcon;
}>;

interface TransportSelectorProps {
  value: TransportType;
  onChange: (value: TransportType) => void;
}

export function TransportSelector({ value, onChange }: TransportSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {TRANSPORT_OPTIONS.map((option) => {
        const selected = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border bg-white p-3 text-sm font-semibold text-neutral-900 transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
              selected
                ? "border-primary-500 bg-primary-25 text-primary-700"
                : "border-neutral-200 hover:border-neutral-400",
            )}
          >
            <IconBadge
              icon={option.icon}
              variant={selected ? "mint" : "gray"}
              size="md"
            />
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
