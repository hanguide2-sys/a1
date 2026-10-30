import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";
import { Providers } from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "현장별 공정·기성 대시보드",
  description: "교육용 가상 자료로 현장 12곳의 공정·기성 현황을 보고 점검이 필요한 현장을 찾는 대시보드",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <Providers>
          <AppHeader />
          <main className="mx-auto w-full max-w-[1480px] flex-1 px-6 py-5">{children}</main>
          <footer className="border-t border-line bg-white px-6 py-3 text-xs text-subtle">
            교육용 가상 자료입니다. 현장명·계약·기록은 실제 회사의 현장·계약·기상·사업 구성이 아닙니다. 판정과 가중 공정률은 교육용 규칙입니다.
          </footer>
        </Providers>
      </body>
    </html>
  );
}
