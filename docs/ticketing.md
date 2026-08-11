# 공연 예매·티켓 운영

브레멘 사이트의 공연 콘텐츠와 예매 트랜잭션을 한 서비스 안에서 운영하기 위한 MVP 구조다. 공개 공연 정보는 기존 콘텐츠 그래프의 `performance/v1` 엔티티를 계속 사용하고, 재고·주문·티켓·체크인은 정규화한 티켓 테이블에서 관리한다.

## 사용자 동선

| 대상 | 경로 | 역할 |
| --- | --- | --- |
| 관객 | `/performances` | 예매 가능한 공연을 기존 공연 아카이브 위에 노출 |
| 관객 | `/performances/[slug]` | 포스터, 일시, 장소, 가격, 잔여석, 안내 확인 |
| 관객 | `/performances/[slug]/reserve` | Google 로그인 후 티켓 종류·수량·연락처 입력 |
| 관객 | `/tickets` | 입금 계좌, 처리 상태, QR·이미지 저장·공유·Apple Wallet 확인 |
| 관리자 | `/ponix/tickets` | 공연별 예약·입장·매출 현황 확인 |
| 관리자 | `/ponix/tickets/new` | 공연 콘텐츠와 예매 설정을 함께 생성 |
| 관리자 | `/ponix/tickets/[id]` | 판매 상태, 입금 승인, QR 발급, 스태프 지정 |
| 현장 스태프 | `/staff/events/[id]/check-in` | 카메라 또는 코드 입력으로 일회성 체크인 |

## 데이터 경계

- `entities`: 포스터, 공연명, 소개처럼 공개 사이트와 아카이브에서 재사용하는 콘텐츠
- `ticket_events`, `ticket_types`, `ticket_payment_settings`: 공연별 예매 설정
- `ticket_orders`, `ticket_order_items`: 관객의 주문과 입금 확인 상태
- `tickets`: 승인된 좌석마다 한 행씩 발급되는 QR 티켓
- `ticket_checkins`: 누가 언제 입장 처리했는지 남기는 기록
- `ticket_event_staff`: 공연 단위의 `manager`, `door`, `viewer` 권한
- `ticket_customers`: Google 티켓 사용자의 최소 프로필. `members`와 분리한다.

재고 차감, 입금 승인과 QR 발급, 체크인은 모두 PostgreSQL 함수 안에서 잠금과 권한 검사를 수행한다. 브라우저에는 service-role 키를 두지 않는다.

## 상태 흐름

공연은 `draft → published → sales_open → sales_closed → ended`를 기본 흐름으로 사용하며 필요하면 `cancelled`로 바꾼다.

주문은 `pending_payment → payment_review → confirmed`로 진행한다. 입금 기한이 지나면 다음 주문 생성 시 `expired` 처리되며, 운영자는 사용 전 주문을 `cancelled`로 바꿀 수 있다. `confirmed` 전환 시 주문 수량만큼 개별 티켓과 무작위 QR 토큰이 발급된다.

## Google OAuth 설정

코드 배포 전 다음 외부 설정이 필요하다.

1. Google Cloud에서 OAuth 웹 클라이언트를 만든다.
2. Google 클라이언트 ID와 secret을 Supabase Auth의 Google provider에 등록한다.
3. Google 승인된 리디렉션 URI에 Supabase가 안내하는 `/auth/v1/callback` URL을 등록한다.
4. Supabase Auth URL Configuration의 Site URL과 Redirect URLs에 로컬·Preview·Production의 `/auth/callback`을 허용한다.
5. Google 로그인, 일반 관객의 `members` 미생성, 기존 멤버 로그인을 각각 확인한다.

## 티켓 이미지 저장과 공유

- `사진 저장`은 예매자명, 티켓 번호, 입장 QR이 포함된 개인 보관용 PNG를 만든다.
- `공유`는 공연명, 일시, 장소만 포함한 4:5 JPEG를 만든다. QR 토큰, 티켓 번호, 예매자명은 공유 카드 생성 함수에 전달하지 않는다.
- 파일 공유를 지원하는 브라우저에서는 운영체제 공유 시트를 열고, 그 외 환경에서는 이미지를 내려받는다.
- iPhone/iPad에서는 이미지 미리보기를 열어 길게 눌러 사진 앱에 저장할 수 있게 한다.
- 두 이미지는 서버에 업로드하지 않고 로그인한 관객의 브라우저 안에서만 생성한다.

## Apple Wallet 설정

Wallet 패스는 같은 Next.js 프로젝트의 Node Route Handler에서 생성한다. 브라우저의 Supabase 세션과 기존 티켓 RLS로 소유권을 확인하므로 service-role 키는 사용하지 않는다. 발급 요청이 성공하면 QR을 포함한 티켓 스냅샷을 AES-256-GCM으로 암호화한 60초짜리 다운로드 URL을 반환하며, 이 URL에서 서명한 `.pkpass`를 내려준다.

1. Apple Developer에서 Pass Type ID와 Pass Type ID 인증서를 준비한다.
2. Apple WWDR 인증서, signer 인증서와 개인 키를 PEM으로 준비하고 각각 base64 한 줄 문자열로 변환한다.
3. Vercel의 Preview·Production 환경에 아래 서버 전용 변수를 등록한다. 값을 로컬 파일이나 Git에 커밋하지 않는다.
   - `APPLE_PASS_TYPE_ID`
   - `APPLE_TEAM_ID`
   - `APPLE_SIGNER_CERT_BASE64`
   - `APPLE_SIGNER_KEY_BASE64`
   - `APPLE_SIGNER_KEY_PASSPHRASE` (필요한 경우만)
   - `APPLE_WWDR_CERT_BASE64`
   - `WALLET_DOWNLOAD_SECRET` (32자 이상 무작위 값)
4. [Apple Wallet 리소스](https://developer.apple.com/wallet/resources/)에서 약관에 맞는 한국어 `Add to Apple Wallet` SVG 배지를 받아 `public/` 아래에 둔다. 직접 그린 배지나 변형한 배지를 사용하지 않는다.
5. `APPLE_WALLET_BADGE_PATH=/wallet/add-to-apple-wallet-ko.svg`로 설정한다. 이 저장소에는 기존 티켓 프로젝트에서 사용하던 Apple 공식 한국어 배지가 `public/wallet/`에 포함되어 있다.
6. 모든 준비가 끝난 뒤에만 `APPLE_WALLET_ENABLED=true`로 바꾼다. 하나라도 빠지면 `/tickets`에서 Wallet 버튼은 표시되지 않는다.
7. 실제 iPhone Safari에서 추가, Wallet 표시, QR 스캔, 만료 URL, 타인 계정 접근 차단을 확인한다.

패스는 공유 금지(`sharingProhibited`)로 발급하지만, 화면 캡처까지 기술적으로 막을 수는 없다. 따라서 QR은 기존 일회성 체크인 검증을 계속 최종 기준으로 사용한다.

## 배포 순서

1. `20260811000070_ticketing_google_oauth_mvp.sql`을 별도 Preview/로컬 Supabase에서 먼저 적용한다.
2. 관리자 1명으로 작성 중 공연을 만들고 공개 페이지가 숨겨지는지 확인한다.
3. `sales_open` 전환 후 Google 관객 계정으로 주문과 입금 완료 요청을 확인한다.
4. 관리자가 입금을 승인하고 주문 수량만큼 QR이 발급되는지 확인한다.
5. 현장 계정으로 같은 QR을 두 번 읽어 두 번째 결과가 `already_used`인지 확인한다.
6. 티켓 PNG에는 QR이 있고 공유 JPEG에는 QR·티켓 번호·예매자명이 없는지 확인한다.
7. Wallet 환경을 켠 경우 실제 iPhone에서 `.pkpass` 추가와 QR 체크인을 확인한다.
8. 환불·취소 운영 기준과 계좌 정보를 최종 확인한 뒤 Production에 적용한다.

현재 MVP에는 PG 자동결제, 지정 좌석, 티켓 양도, 부분 환불, Google Wallet 발급이 포함되지 않는다.
