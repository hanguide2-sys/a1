import { AskPanel } from "@/components/AskPanel";
import { PageGate } from "@/components/PageGate";

export default function AskPage() {
  return (
    <PageGate what="AI에게 묻기">
      <AskPanel />
    </PageGate>
  );
}
