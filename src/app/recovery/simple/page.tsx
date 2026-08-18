import { redirect } from "next/navigation";

import { ROUTES } from "@/shared/config/routes";

export default function SimpleRecoveryPage() {
  redirect(ROUTES.RECOVERY_SIMPLE_SETUP);
}
