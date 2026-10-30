import type { NextConfig } from "next";

// cacheComponents·partialPrefetching(기본 틀이 켜 둔 캐시 기능)은 끕니다.
// 이 앱은 자료를 서버나 캐시에 두지 않고 브라우저 메모리에만 두므로 필요 없고,
// 켜 두면 이전 페이지가 숨겨진 채 남아 같은 필터가 중복되어 혼란스럽습니다.
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
