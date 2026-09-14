import type { Metadata } from "next"

import { LegalDocument } from "@/components/legal-document"

export const metadata: Metadata = {
  title: "개인정보처리방침 | 브레멘 Bremen",
  description: "브레멘 공연 예매 서비스의 개인정보 처리 기준입니다.",
}

const sections = [
  {
    title: "수집하는 정보",
    paragraphs: [
      "브레멘은 공연 예매와 티켓 발급에 필요한 최소한의 정보만 처리합니다.",
    ],
    items: [
      "Google 로그인 정보: 이메일 주소, 표시 이름, 프로필 이미지, 계정 식별자",
      "예매 정보: 예매자 이름, 연락처, 입금자명, 주문 내역과 결제 확인 상태",
      "티켓 정보: 티켓 번호, QR 식별자, 발급·취소·입장 처리 시각",
    ],
  },
  {
    title: "이용 목적",
    items: [
      "본인 확인과 예매 내역 제공",
      "입금 확인, 티켓 발급, 현장 입장 처리",
      "공연 변경·취소 등 예매 관련 안내와 문의 대응",
      "중복 사용과 부정 이용 방지, 서비스 안정성 확보",
    ],
  },
  {
    title: "보관과 삭제",
    paragraphs: [
      "개인정보는 공연과 예매 서비스 운영에 필요한 기간 동안 보관하며, 목적이 달성되면 관련 법령과 분쟁 대응에 필요한 범위를 제외하고 지체 없이 삭제합니다. 이용자는 홈페이지 하단의 공식 연락 채널을 통해 자신의 정보 열람·정정·삭제를 요청할 수 있습니다.",
    ],
  },
  {
    title: "처리 서비스",
    paragraphs: [
      "로그인은 Google OAuth, 인증과 데이터 저장은 Supabase, 웹 서비스 제공은 Vercel을 사용합니다. 각 서비스는 서비스 제공에 필요한 범위에서 정보를 처리할 수 있으며, 해당 사업자의 개인정보 보호정책이 함께 적용됩니다.",
      "브레멘은 이용자의 개인정보를 판매하지 않으며, 법령상 의무가 있거나 이용자의 동의가 있는 경우를 제외하고 예매 운영 목적 밖의 제3자에게 제공하지 않습니다.",
    ],
  },
  {
    title: "티켓 이미지와 Wallet",
    paragraphs: [
      "개인 보관용 티켓 이미지는 이용자의 브라우저에서 생성됩니다. 공유용 이미지는 QR, 티켓 번호, 예매자 이름을 포함하지 않습니다. Apple Wallet 패스는 로그인한 이용자의 티켓 소유권을 확인한 뒤 짧은 유효기간의 암호화된 다운로드 주소로 발급합니다.",
    ],
  },
  {
    title: "문의와 변경",
    paragraphs: [
      "개인정보 관련 문의는 홈페이지 하단의 브레멘 공식 연락 채널로 접수할 수 있습니다. 이 방침이 변경되면 시행 전에 사이트를 통해 알립니다.",
    ],
  },
]

export default function PrivacyPage() {
  return (
    <LegalDocument
      eyebrow="Privacy"
      title="개인정보처리방침"
      description="공연을 예매하고 티켓을 사용하는 동안 어떤 정보를 왜 처리하는지 안내합니다."
      effectiveDate="2026. 09. 14."
      sections={sections}
    />
  )
}
