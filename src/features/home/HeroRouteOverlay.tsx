const RECOVERY_ROUTE_PATH =
  "M426 616 C495 610 542 566 565 510 C578 480 612 470 660 475 C705 479 734 504 780 499 C824 495 850 468 885 455 C930 438 982 394 1002 342 C1018 302 1010 270 1035 235 C1058 203 1090 195 1088 152 C1086 125 1118 106 1154 96";

const FAILED_ROUTE_PATH =
  "M622 100 C650 126 690 126 700 156 C714 198 790 211 790 265 C790 300 742 304 715 334 C738 362 790 369 822 407";

const WAYPOINTS = [
  { cx: 660, cy: 475 },
  { cx: 885, cy: 455 },
  { cx: 1088, cy: 152 },
] as const;

function MapPin({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} className="text-primary-500">
      <ellipse cy="45" rx="28" ry="10" fill="currentColor" opacity="0.16" />
      <path
        d="M0 -22C-14 -22 -24 -12 -24 2C-24 20 0 44 0 44C0 44 24 20 24 2C24 -12 14 -22 0 -22Z"
        fill="currentColor"
        stroke="white"
        strokeWidth="4"
      />
      <circle cy="1" r="9" fill="white" />
    </g>
  );
}

function StatusMarker({
  type,
  x,
  y,
}: {
  type: "error" | "success";
  x: number;
  y: number;
}) {
  const isError = type === "error";

  return (
    <g
      transform={`translate(${x} ${y})`}
      className={isError ? "text-rose-500" : "text-primary-500"}
    >
      <circle r="34" fill="currentColor" opacity="0.14" />
      <circle r="25" fill="white" stroke="currentColor" strokeWidth="5" />
      <circle r="19" fill="currentColor" />
      {isError ? (
        <path
          d="M-7 -7L7 7M7 -7L-7 7"
          fill="none"
          stroke="white"
          strokeLinecap="round"
          strokeWidth="5"
        />
      ) : (
        <path
          d="M-9 0L-3 7L10 -8"
          fill="none"
          stroke="white"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="5"
        />
      )}
    </g>
  );
}

export function HeroRouteOverlay() {
  return (
    <svg
      viewBox="0 0 1280 720"
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 z-[2] h-full w-full"
      aria-hidden="true"
    >
      <g className="text-rose-500">
        <path
          d={FAILED_ROUTE_PATH}
          fill="none"
          stroke="currentColor"
          strokeWidth="7"
          strokeDasharray="10 14"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      <g className="text-primary-500">
        <path
          d={RECOVERY_ROUTE_PATH}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {WAYPOINTS.map(({ cx, cy }) => (
          <g key={`${cx}-${cy}`}>
            <circle cx={cx} cy={cy} r="17" fill="currentColor" opacity="0.12" />
            <circle
              cx={cx}
              cy={cy}
              r="11"
              fill="white"
              stroke="currentColor"
              strokeWidth="6"
            />
          </g>
        ))}
      </g>

      <MapPin x={426} y={572} />
      <MapPin x={1154} y={52} />
      <StatusMarker type="error" x={715} y={334} />
      <StatusMarker type="success" x={1002} y={342} />
    </svg>
  );
}
