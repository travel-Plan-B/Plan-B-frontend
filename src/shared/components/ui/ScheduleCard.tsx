import type { HTMLAttributes, MouseEventHandler, ReactNode } from "react";

import { ChevronRight, Clock, MapPin } from "lucide-react";

import { cn } from "@/shared/lib/cn";

export type ScheduleCardTone =
  "neutral" | "primary" | "rose" | "purple" | "yellow";

export interface ScheduleCardProps extends Omit<
  HTMLAttributes<HTMLElement>,
  "title"
> {
  tone?: ScheduleCardTone;
  label?: string;
  time?: string;
  title?: ReactNode;
  description?: ReactNode;
  location?: string;
  duration?: string;
  onAction?: MouseEventHandler<HTMLButtonElement>;
  actionAriaLabel?: string;
}

interface ToneStyle {
  card: string;
  accent: string;
  badge: string;
  action: string;
}

const toneStyles: Record<ScheduleCardTone, ToneStyle> = {
  neutral: {
    card: "border-neutral-200 bg-white",
    accent: "bg-neutral-100 text-neutral-800",
    badge: "bg-white text-neutral-700",
    action: "text-neutral-700",
  },
  primary: {
    card: "border-primary-500 bg-primary-50",
    accent: "bg-primary-500 text-white",
    badge: "bg-white text-primary-700",
    action: "text-primary-700",
  },
  rose: {
    card: "border-rose-500 bg-rose-50",
    accent: "bg-rose-500 text-white",
    badge: "bg-white text-rose-700",
    action: "text-rose-700",
  },
  purple: {
    card: "border-purple-500 bg-purple-50",
    accent: "bg-purple-500 text-white",
    badge: "bg-white text-purple-700",
    action: "text-purple-700",
  },
  yellow: {
    card: "border-yellow-500 bg-yellow-50",
    accent: "bg-yellow-500 text-neutral-900",
    badge: "bg-white text-yellow-700",
    action: "text-yellow-700",
  },
};

export function ScheduleCard({
  tone = "neutral",
  label,
  time,
  title = "일정 제목",
  description,
  location,
  duration,
  onAction,
  actionAriaLabel = "일정 자세히 보기",
  className,
  ...props
}: ScheduleCardProps) {
  const styles = toneStyles[tone];

  return (
    <article
      className={cn(
        "w-full overflow-hidden rounded-2xl border",
        styles.card,
        className,
      )}
      {...props}
    >
      {(label || time) && (
        <div
          className={cn(
            "flex min-h-12 items-center justify-between gap-3 px-4 py-3",
            styles.accent,
          )}
        >
          {label && <span className="text-sm font-semibold">{label}</span>}
          {time && (
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
                styles.badge,
              )}
            >
              <Clock aria-hidden="true" className="size-4" />
              {time}
            </span>
          )}
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
            {description && (
              <div className="mt-1 text-sm text-neutral-700">{description}</div>
            )}
          </div>
          {onAction && (
            <button
              type="button"
              aria-label={actionAriaLabel}
              onClick={onAction}
              className={cn(
                "inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-xl transition-opacity hover:opacity-70",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
                styles.action,
              )}
            >
              <ChevronRight aria-hidden="true" className="size-5" />
            </button>
          )}
        </div>

        {(location || duration) && (
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-current/10 pt-3 text-xs text-neutral-700">
            {location && (
              <span className="inline-flex items-center gap-2">
                <MapPin aria-hidden="true" className="size-4" />
                {location}
              </span>
            )}
            {duration && (
              <span className="inline-flex items-center gap-2">
                <Clock aria-hidden="true" className="size-4" />
                {duration}
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
