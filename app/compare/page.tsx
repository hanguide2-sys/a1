import { CompareTable } from "@/components/CompareTable";
import { PageGate } from "@/components/PageGate";

export default function ComparePage() {
  return (
    <PageGate what="현장별 비교표">
      <CompareTable />
    </PageGate>
  );
}
