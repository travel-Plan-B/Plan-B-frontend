import { toast as sonnerToast } from "sonner";

import { ToastCard, type ToastType } from "./ToastCard";

// sonner 기본 스킨 대신 toast.custom으로 디자인 시스템 스타일의 카드를 렌더링한다.
function show(type: ToastType, message: string) {
  return sonnerToast.custom(() => <ToastCard type={type} message={message} />);
}

export const toast = {
  success: (message: string) => show("success", message),
  info: (message: string) => show("info", message),
  warning: (message: string) => show("warning", message),
  error: (message: string) => show("error", message),
};
