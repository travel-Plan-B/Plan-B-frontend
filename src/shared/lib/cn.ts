import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * text-tiny, text-fluid-*(globals.css @theme에 추가한 커스텀 폰트 크기
 * 토큰)를 twMerge 기본 설정이 모르기 때문에 font-size가 아니라 text-color
 * 그룹으로 잘못 인식해서, 같이 쓰인 text-purple-700/text-primary-500 같은
 * 색상 클래스를 "충돌"로 보고 지워버리는 문제가 있었음
 * -> font-size 그룹에 직접 등록해서 고침.
 * 새 커스텀 text-* 크기 토큰을 globals.css에 추가하면 여기도 같이 등록해야 한다.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "tiny",
            "fluid-xs",
            "fluid-sm",
            "fluid-base",
            "fluid-lg",
            "fluid-xl",
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
