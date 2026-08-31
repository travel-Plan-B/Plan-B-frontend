import Image from "next/image";

import { NotFoundActions } from "./not-found-actions";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-2 py-4 text-center md:gap-8 md:px-6 md:py-6">
      <Image
        src="/images/404-numeral.png"
        alt="404"
        width={418}
        height={166}
        className="h-auto w-[clamp(8rem,5.83rem+9.64vw,12rem)]"
        priority
      />
      <div className="flex flex-col gap-2">
        <h1 className="text-[clamp(1rem,0.73rem+1.2vw,1.5rem)] font-bold text-neutral-900">
          페이지를 찾을 수 없어요
        </h1>
        <p className="max-w-md text-[clamp(0.875rem,0.81rem+0.3vw,1rem)] text-neutral-700">
          찾으시는 페이지가 이동되었거나 삭제되었을 수 있어요. 주소를 다시
          확인하거나 메인 페이지에서 다시 시작해 주세요.
        </p>
      </div>
      <Image
        src="/images/404-mascot.png"
        alt=""
        width={485}
        height={332}
        className="h-auto w-full max-w-[clamp(10rem,7.29rem+12vw,15rem)]"
        priority
      />
      <NotFoundActions />
    </div>
  );
}
