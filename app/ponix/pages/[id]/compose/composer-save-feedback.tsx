import { CmsSaveNotice } from "@/app/ponix/_components/cms-save-controls"

export function ComposerSaveFeedback({
  sectionSaved,
  relationMessage,
  relationError,
}: {
  sectionSaved: boolean
  relationMessage?: string
  relationError?: string
}) {
  if (relationError) {
    return (
      <div data-composer-save-feedback="error">
        <CmsSaveNotice
          error={operatorRelationError(relationError)}
          errorTitle="연결 데이터를 바꾸지 못했습니다"
        />
      </div>
    )
  }

  if (relationMessage) {
    return (
      <div data-composer-save-feedback="relation">
        <CmsSaveNotice
          saved
          savedTitle="연결 데이터를 반영했습니다"
          savedDescription={operatorRelationMessage(relationMessage)}
        />
      </div>
    )
  }

  if (sectionSaved) {
    return (
      <div data-composer-save-feedback="section">
        <CmsSaveNotice
          saved
          savedTitle="섹션 문구를 저장했습니다"
          savedDescription="캔버스와 공개 페이지에서 새 내용이 보이도록 갱신했습니다."
        />
      </div>
    )
  }

  return null
}

function operatorRelationMessage(message: string) {
  const normalized = message.trim().toLowerCase()

  if (normalized.includes("removed")) {
    return "선택한 데이터가 이 섹션에서 빠졌습니다."
  }

  if (normalized.includes("saved")) {
    return "이 섹션의 데이터 연결과 노출 순서를 저장했습니다."
  }

  return message
}

function operatorRelationError(message: string) {
  const normalized = message.trim()

  if (!normalized) {
    return "연결 정보를 다시 확인한 뒤 저장해 주세요."
  }

  if (normalized.includes("required")) {
    return "필수 항목이 비어 있습니다. 연결할 데이터와 관계 정보를 확인해 주세요."
  }

  if (normalized.includes("integer")) {
    return "순서는 정수로 입력해야 합니다."
  }

  if (normalized.includes("not found")) {
    return "대상 연결을 찾지 못했습니다. 화면을 새로고침한 뒤 다시 시도해 주세요."
  }

  return normalized
}
