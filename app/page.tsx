import { InspectionRank } from "@/components/InspectionRank";
import { KpiCards } from "@/components/KpiCards";
import { PageGate } from "@/components/PageGate";
import { SiteSummaryTable } from "@/components/SiteSummaryTable";
import { TrendChart } from "@/components/TrendChart";

// 현황 요약(첫 화면): 필터 → 큰 숫자 4개 → 12개 현장 요약표 → 점검 순위 → 추이·월별 기성
export default function Home() {
  return (
    <PageGate what="현황">
      <div className="space-y-4">
        <KpiCards />
        <div className="grid gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <SiteSummaryTable />
          </div>
          <InspectionRank />
        </div>
        <TrendChart />
      </div>
    </PageGate>
  );
}
