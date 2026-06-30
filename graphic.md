# 앱 그래픽 및 UI/UX 디자인 기획서

## 1. 개요
본 문서는 현재 개발된 애플리케이션의 그래픽, 테마, 폰트 디자인 및 전반적인 UI/UX 설계 방식을 타 애플리케이션에 이식하거나 일관되게 적용하기 위한 기획서입니다.

## 2. 디자인 원칙 (Design Principles)
* **직관성 (Intuitive)**: 사용자 인터페이스는 복잡한 설명 없이도 목적을 알 수 있도록 명확하게 설계합니다.
* **가독성 (Readability)**: 데이터가 많이 전시되는 대시보드 및 에디터 화면의 특성상 텍스트의 가독성을 최우선으로 합니다.
* **반응성 (Responsiveness)**: 컴포넌트는 창 크기나 사이드바 오픈 여부에 맞춰 능동적으로 크기가 조절되어야 합니다.

## 3. 타이포그래피 (Typography) 및 폰트 디자인
* **기본 폰트**: 정보 전달과 가독성에 최적화된 산세리프 계열(Sans-serif) 적용. (ex: Inter, Pretendard, Noto Sans KR)
* **사이즈 체계**:
  - `Title (H1~H2)`: 24px ~ 20px, Bold (화면 상단 제목 등)
  - `Subtitle (H3)`: 18px ~ 16px, Semi-Bold (위젯 제목, 탭 이름)
  - `BodyText`: 14px, Regular (일반 데이터, 에디터 본문, 테이블 내용)
  - `SmallText`: 12px, Regular (부가 설명, 태그, 페이지 수 표시)
* **행간 및 자간**:
  - 데이터 밀집 구역은 행간 1.2~1.4로 다소 타이트하게 유지하여 한 눈에 많은 정보가 보이게 합니다.
  - 일반 텍스트 문단은 1.5 수준 유지.

## 4. 컬러 시스템 (Color System)
명도 대비를 통한 시각적 계층 구조(Visual Hierarchy)를 형성하며, 라이트/다크 모드를 고려한 시맨틱 컬러를 구성합니다.

* **Primary (주조색)**: 액션 버튼, 활성화된 탭, 하이라이팅에 사용 (ex. Blue 계열)
* **Background (배경색)**: 전체 앱 배경 스킨 및 카드 컨테이너 배경 (ex. Gray-50/Gray-900)
* **Text (텍스트)**: Primary Text (블랙/화이트), Secondary Text (다크그레이/라이트그레이)
* **Status (상태색)**: 정상(Green), 경고(Yellow/Orange), 에러(Red)
* **Borders & Dividers**: 구분선은 튀지 않도록 아주 옅은 투명도나 연한 회색을 사용합니다.

## 5. 컴포넌트 및 인터랙션 (Components & Interaction)
* **컴포넌트 라이브러리 활용**: Tailwind CSS와 같은 유틸리티 우선 CSS 프레임워크를 기반으로, 일관된 사이즈(Padding, Margin)를 적용합니다.
* **아이콘**: Lucide 계열의 선(Line) 타입 아이콘을 사용하여 일관된 굵기와 무드를 유지합니다.
* **애니메이션 및 전환 효과 (Motion)**:
  - 탭 이동, 아이템 삭제/생성, 드롭다운 전개 시 부드러운 트랜지션 적용.
  - framer-motion 등의 라이브러리를 통해 너무 과하지 않은(150~300ms) fade-in, slide 효과만 제한적으로 사용합니다.
