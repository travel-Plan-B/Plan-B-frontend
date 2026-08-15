"use client";

import { X } from "lucide-react";
import {
  useRef,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
} from "react";

import { cn } from "@/shared/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  clearable?: boolean;
}

export function Input({
  error = false,
  clearable = false,
  className,
  type = "text",
  value,
  defaultValue,
  onChange,
  disabled,
  ...props
}: InputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isControlled = value !== undefined;
  const [innerValue, setInnerValue] = useState(value ?? defaultValue ?? "");
  const currentValue = isControlled ? value : innerValue;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) setInnerValue(event.target.value);
    onChange?.(event);
  };

  const handleClear = () => {
    if (!isControlled) setInnerValue("");
    onChange?.({ target: { value: "" } } as ChangeEvent<HTMLInputElement>);
    inputRef.current?.focus();
  };

  const showClear = clearable && !disabled && String(currentValue).length > 0;

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        type={type}
        value={currentValue}
        onChange={handleChange}
        disabled={disabled}
        className={cn(
          "w-full rounded-lg border bg-white px-4 py-3 text-base text-neutral-900 transition-colors placeholder:text-neutral-500",
          "focus-visible:outline-none focus-visible:border-primary-500",
          "disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400 disabled:placeholder:text-neutral-400",
          error
            ? "border-danger-500"
            : "border-neutral-200 hover:border-neutral-400",
          showClear && "pr-10",
          className,
        )}
        {...props}
      />
      {showClear && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-neutral-400 hover:text-neutral-600"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
