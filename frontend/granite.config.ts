import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "findtime",
  brand: {
    displayName: "공통 시간 찾기", // 화면에 노출될 앱의 한글 이름으로 바꿔주세요.
    primaryColor: "#4593fc", // 화면에 노출될 앱의 기본 색상으로 바꿔주세요.
    icon: "https://static.toss.im/appsintoss/2205/0f06f97b-5716-4b73-b40a-b52480eeb70c.png", // 화면에 노출될 앱의 아이콘 이미지 주소로 바꿔주세요.
  },
  web: {
    host: "192.168.200.103",
    port: 5173,
    commands: {
      dev: "vite --host",
      build: "vite build",
    },
  },
  permissions: [],
  outdir: "dist",
});
