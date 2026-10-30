"use client";

import type { ReactNode } from "react";
import { FilterBar } from "./FilterBar";
import { useData } from "./Providers";
import { EmptyData } from "./ui";

/** 자료가 없으면 "자료 없음" 안내를, 있으면 필터 막대와 화면을 보여 줍니다. */
export function PageGate({ what, children }: { what: string; children: ReactNode }) {
  const { rows } = useData();
  if (!rows) return <EmptyData what={what} />;
  return (
    <>
      <FilterBar />
      {children}
    </>
  );
}
