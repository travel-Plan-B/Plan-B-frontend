import Link from "next/link";

import { ROUTES } from "@/shared/config/routes";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 py-12 text-center">
      <h1 className="text-2xl font-semibold text-neutral-900">
        복구 방식 선택
      </h1>
      <nav aria-label="복구 방식" className="flex flex-col gap-3 sm:flex-row">
        <Link
          href={ROUTES.RECOVERY_SIMPLE}
          className="rounded-2xl bg-primary-500 px-6 py-3.5 text-base font-medium text-white transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        >
          간편 복구
        </Link>
        <Link
          href={ROUTES.RECOVERY_DETAIL}
          className="rounded-2xl border border-neutral-200 bg-white px-6 py-3.5 text-base font-medium text-neutral-900 transition-colors hover:border-neutral-400 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        >
          상세 복구
        </Link>
      </nav>
    </div>
  );
}
