import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

import { Footer } from "@/shared/components/layout/Footer";
import { Header } from "@/shared/components/layout/Header";
import { PageContainer } from "@/shared/components/layout/PageContainer";
import { NetworkStatusToast } from "@/shared/components/ui/Toast/NetworkStatusToast";
import { ToastProvider } from "@/shared/components/ui/Toast/ToastProvider";
import { Providers } from "./providers";

const pretendard = localFont({
  src: "../../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2",
  variable: "--font-pretendard",
  weight: "45 920",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://planb-recovery.vercel.app"),
  title: "Plan B | AI 여행 일정 복구",
  description: "틀어진 여행 일정에서 필요한 부분만 AI로 빠르게 복구하세요.",
  openGraph: {
    title: "Plan B | AI 여행 일정 복구",
    description: "틀어진 여행 일정에서 필요한 부분만 AI로 빠르게 복구하세요.",
    siteName: "Plan B",
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary",
    title: "Plan B | AI 여행 일정 복구",
    description: "틀어진 여행 일정에서 필요한 부분만 AI로 빠르게 복구하세요.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${pretendard.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <Header />
        <PageContainer as="main" className="flex flex-1 flex-col">
          <Providers>{children}</Providers>
        </PageContainer>
        <Footer />
        <ToastProvider />
        <NetworkStatusToast />
      </body>
    </html>
  );
}
