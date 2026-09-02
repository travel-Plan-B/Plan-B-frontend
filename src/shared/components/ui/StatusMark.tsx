import type { SVGProps } from "react";

type StatusMarkProps = SVGProps<SVGSVGElement> & {
  status: "error" | "success";
};

export function StatusMark({
  status,
  className = "",
  ...props
}: StatusMarkProps) {
  const isError = status === "error";

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`size-6 shrink-0 ${isError ? "text-rose-500" : "text-primary-500"} ${className}`}
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="12" r="12" fill="currentColor" />
      {isError ? (
        <path
          d="m8.5 8.5 7 7m0-7-7 7"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="m7.5 12.25 3 3 6-6.5"
          stroke="white"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}
