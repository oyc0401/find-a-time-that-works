## Web Frontend Refactor Notes

이 문서는 `web/` 폴더의 UI 스택이 Toss TDS / Granite 의존성을 제거하고 Tailwind + Vite 기반으로 전환된 과정을 정리합니다. 신규/후임 개발자가 컴포넌트를 수정하거나 확장할 때 반드시 참고해주세요.

### 1. 런타임 & 빌드

- **Vite 단독 사용**: `package.json`의 `dev`, `build`, `preview` 스크립트는 모두 Vite로 동작합니다. Granite CLI는 더 이상 필요하지 않습니다.
  ```bash
  pnpm install        # 모듈 설치
  pnpm dev            # http://localhost:5173
  pnpm build          # dist/ 산출
  pnpm preview        # 빌드 결과 확인
  ```
- Granite 관련 설정 파일(`granite.config.ts`, `findtime.ait` 등)은 배포 자동화를 위해 남겨 두었지만, 로컬 개발/빌드에는 관여하지 않습니다.

### 2. TDS 제거와 대체 수단

#### 2.1 공통 팔레트
- `src/lib/palette.ts`에 Toss 스펙과 동일한 컬러 토큰을 하드코딩해 두었습니다.
- 과거 `adaptive.xxx`를 참조하던 모든 영역은 이 팔레트에서 색상을 가져옵니다. Tailwind 클래스만으로 표현하기 애매한 **캔버스 색상, corner fill** 등에 사용합니다.

#### 2.2 재사용 가능한 UI Primitive
| 파일 | 용도 |
| --- | --- |
| `components/ui/Button.tsx` | TDS Button 대체. `variant="primary\|secondary\|ghost"`, `fullWidth` 지원. |
| `components/ui/BottomActionBar.tsx` | 고정 CTA 영역 (하단 그림자/blur 포함). |
| `components/ui/BottomSheet.tsx` | 표준 모달 시트. Body scroll lock, ESC 닫기, 포커스 트랩 없이도 모바일 UX 유지. `title`, `footer` 슬롯 제공. |
| `components/ui/Spinner.tsx` | TDS Loader 대체. |

해당 컴포넌트는 모두 Tailwind Utility 만으로 스타일링하며, 추가 테마가 필요하면 여기서 확장합니다.

### 3. 화면별 적용 사항

#### 3.1 홈/최근 페이지 (`pages/page.tsx`, `pages/recent/page.tsx`)
- TDS List / ListRow 대신 Tailwind 카드와 lucide 아이콘(`Clock4`, `ChevronRight`)으로 치환.
- 최근 방 카드, CTA 영역 모두 `BottomActionBar + Button`으로 통일.

#### 3.2 캘린더 & 시간 선택
- `components/CalendarGrid.tsx`, `components/CalendarGridSub.tsx`, `pages/DateSelector.tsx`, `pages/TimeSlider.tsx`가 palette 기반 색상으로 재작성되었습니다.
- TimeSlider는 Text/Spacing 같은 TDS Typography 없이 순수 Tailwind + haptic hook 만 사용합니다.

#### 3.3 방 화면 (`pages/room/**`)
- 상단 Top/AppBar, Tab, Menu, CTA 등 TDS 컴포넌트를 모두 Tailwind로 대체했습니다.
  - 설정 메뉴는 `Settings` 아이콘 + 커스텀 드롭다운.
  - Tab은 border-bottom 버튼 3개로 구현 (schedule/overview/participants).
  - 공유 CTA는 `BottomActionBar`에 배치.
- Select/Overview/Participant 탭 내부의 Badge, Grid, ListRow도 순수 Tailwind로 변경.
- `pages/room/bottomSheet/*` 전부 `BottomSheet` + `Button` 조합으로 통일. 입력 필드는 기본 `<input>`을 사용하며 라벨/placeholder 텍스트는 기존 번역 키 그대로 유지됩니다.

### 4. 새 UI 패턴을 따를 때의 가이드
1. **새 버튼**이 필요하면 `components/ui/Button`을 가져와 variant만 지정합니다. TDS 스타일을 직접 복붙하지 않습니다.
2. **색상**이 필요하면 우선 Tailwind 프리셋(`text-gray-500` 등)을, 불가피하면 `palette`의 hex 값을 사용합니다.
3. **모바일 하단 영역**은 `BottomActionBar`를 통해 시각적 일관성을 확보합니다.
4. **Bottom sheet**는 모두 `BottomSheet` 컴포넌트로 구현하고 `title`/`footer`만 채우면 됩니다. 닫기 버튼은 `onClose` 콜백에서 처리하세요.

### 5. 참고 사항
- 기존 `@toss/tds-mobile(-ait)`/`@toss/tds-colors` 의존성은 `package.json`에서 제거되었습니다. 만약 새로운 Toss UI가 필요하면 디자인팀과 협의하여 Tailwind 패턴으로 녹여내야 합니다.
- Granite 기반 배포 스크립트가 필요하다면 `pnpm deploy` (AIT)만 사용하며, 개발/빌드는 Vite 명령으로 일관성 있게 유지합니다.

이 문서에 추가 설명이 필요하면 README에 직접 보완해주세요. (예: 향후 공통 컴포넌트 추가 시 테이블에 행을 추가)
