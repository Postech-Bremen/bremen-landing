"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import {
  AlertCircle,
  Check,
  ExternalLink,
  GripVertical,
  Loader2,
  PencilLine,
} from "lucide-react"

import { updateCmsEntityInlineAction } from "@/app/ponix/entities/actions"
import {
  deleteSectionEntityRelationAction,
  reorderSectionEntityRelationsAction,
  updateSectionEntityRelationInlineAction,
} from "@/app/ponix/relations/actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerNested,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { CmsSectionRelationContext } from "@/lib/cms/content"
import {
  cmsEntityFieldInputName,
  getEditableEntityFields,
  type CmsEditableEntityField,
} from "@/lib/cms/entity-editor"
import { cn } from "@/lib/utils"

type Relation = CmsSectionRelationContext["sectionEntities"][number]

type SaveState =
  | {
      status: "idle"
    }
  | {
      status: "saving"
    }
  | {
      status: "saved"
    }
  | {
      status: "error"
      message: string
    }

export function ComposerRelationList({
  sectionId,
  relations,
  redirectTo,
  typeOptions,
  slotOptions,
}: {
  sectionId: string
  relations: Relation[]
  redirectTo: string
  typeOptions: string[]
  slotOptions: string[]
}) {
  const [orderedRelations, setOrderedRelations] = useState(relations)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dropTargetId, setDropTargetId] = useState<string | null>(null)
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" })
  const [isPending, startTransition] = useTransition()

  function moveRelation(sourceId: string, targetId: string) {
    if (sourceId === targetId) return

    const previous = orderedRelations
    const next = reorderById(previous, sourceId, targetId)
    if (next === previous) return

    setOrderedRelations(next)
    setSaveState({ status: "saving" })

    startTransition(() => {
      void reorderSectionEntityRelationsAction({
        sectionId,
        relationIds: next.map((relation) => relation.id),
      }).then((result) => {
        if (!result.ok) {
          setOrderedRelations(previous)
          setSaveState({ status: "error", message: result.error })
          return
        }

        setSaveState({ status: "saved" })
        window.dispatchEvent(new CustomEvent("ponix:reload-canvas"))
      })
    })
  }

  if (!orderedRelations.length) {
    return (
      <p className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
        아직 연결된 데이터가 없습니다.
      </p>
    )
  }

  return (
    <div className="space-y-3" data-composer-relation-list>
      <div
        className={cn(
          "flex items-center justify-between rounded-xl border px-3 py-2 text-xs",
          saveState.status === "error"
            ? "border-destructive/40 bg-destructive/10 text-destructive"
            : "bg-muted/30 text-muted-foreground",
        )}
        data-composer-order-status={saveState.status}
      >
        <span>{orderStatusText(saveState, isPending)}</span>
        {saveState.status === "saving" ||
        (isPending && saveState.status === "idle") ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : saveState.status === "saved" ? (
          <Check className="size-3.5 text-emerald-600" />
        ) : saveState.status === "error" ? (
          <AlertCircle className="size-3.5" />
        ) : (
          <GripVertical className="size-3.5" />
        )}
      </div>

      <div className="space-y-2">
        {orderedRelations.map((relation) => (
          <SectionEntityRelationEditor
            key={relation.id}
            relation={relation}
            redirectTo={redirectTo}
            typeOptions={typeOptions}
            slotOptions={slotOptions}
            dragging={draggingId === relation.id}
            dropTarget={dropTargetId === relation.id}
            onDragStart={() => setDraggingId(relation.id)}
            onDragEnd={() => {
              setDraggingId(null)
              setDropTargetId(null)
            }}
            onDragOver={(event) => {
              event.preventDefault()
              if (draggingId && draggingId !== relation.id) {
                setDropTargetId(relation.id)
              }
            }}
            onDrop={(event) => {
              event.preventDefault()
              if (draggingId) {
                moveRelation(draggingId, relation.id)
              }
              setDraggingId(null)
              setDropTargetId(null)
            }}
          />
        ))}
      </div>
    </div>
  )
}

function SectionEntityRelationEditor({
  relation,
  redirectTo,
  typeOptions,
  slotOptions,
  dragging,
  dropTarget,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: {
  relation: Relation
  redirectTo: string
  typeOptions: string[]
  slotOptions: string[]
  dragging: boolean
  dropTarget: boolean
  onDragStart: () => void
  onDragEnd: () => void
  onDragOver: React.DragEventHandler<HTMLDivElement>
  onDrop: React.DragEventHandler<HTMLDivElement>
}) {
  const typeListId = `relation-types-${relation.id}`
  const slotListId = `relation-slots-${relation.id}`
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" })
  const [isPending, startTransition] = useTransition()

  function saveRelation(formData: FormData) {
    setSaveState({ status: "saving" })
    startTransition(() => {
      void updateSectionEntityRelationInlineAction(formData).then((result) => {
        if (!result.ok) {
          setSaveState({ status: "error", message: result.error })
          return
        }

        setSaveState({ status: "saved" })
        window.dispatchEvent(new CustomEvent("ponix:reload-canvas"))
      })
    })
  }

  return (
    <div
      data-composer-relation-item={relation.id}
      data-composer-entity-id={relation.entityId}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <Drawer direction="right">
        <div
          className={cn(
            "group flex items-stretch gap-2 rounded-xl border bg-background/70 p-2 shadow-xs transition",
            "hover:border-accent/60 hover:bg-muted/30",
            dragging && "scale-[0.99] opacity-60",
            dropTarget && "border-accent bg-accent/10",
          )}
        >
          <button
            type="button"
            draggable
            aria-label="순서 끌어서 변경"
            className="grid size-9 shrink-0 cursor-grab place-items-center self-center rounded-full border bg-muted/40 text-muted-foreground transition hover:border-accent hover:text-foreground active:cursor-grabbing"
            data-composer-drag-handle={relation.id}
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = "move"
              event.dataTransfer.setData("text/plain", relation.id)
              onDragStart()
            }}
            onDragEnd={onDragEnd}
          >
            <GripVertical className="size-4" />
          </button>
          <DrawerTrigger asChild>
            <button
              type="button"
              className="min-w-0 flex-1 rounded-lg px-2 py-2 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
              data-composer-relation-trigger={relation.id}
            >
              <div className="grid min-w-0 gap-2">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-sm font-medium">
                      {relation.entity?.title ?? relation.entityId}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {relation.entity?.schemaKey ?? "schema"}
                    </p>
                  </div>
                  <Badge variant="outline" className="rounded-full">
                    {relation.entity?.published ? "published" : "draft"}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge
                    variant="secondary"
                    className="rounded-full font-mono text-[10px]"
                  >
                    {relation.slot}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="rounded-full font-mono text-[10px]"
                  >
                    {relation.relationType}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="rounded-full font-mono text-[10px]"
                  >
                    #{relation.sortOrder}
                  </Badge>
                </div>
              </div>
            </button>
          </DrawerTrigger>
        </div>

        <DrawerContent
          className="w-[min(94vw,42rem)] gap-0 p-0 sm:max-w-none"
          data-composer-relation-drawer={relation.id}
        >
          <DrawerHeader className="border-b px-5 py-5">
            <div className="flex items-start justify-between gap-5 pr-8">
              <div className="min-w-0">
                <p className="caps mb-2 text-muted-foreground">
                  Section relation
                </p>
                <DrawerTitle className="line-clamp-2 font-serif text-3xl italic">
                  {relation.entity?.title ?? relation.entityId}
                </DrawerTitle>
                <DrawerDescription className="mt-2 line-clamp-2">
                  이 섹션에서 이 데이터가 어떻게 노출되는지 정리합니다.
                </DrawerDescription>
              </div>
              <Badge variant="secondary" className="mt-1 shrink-0 rounded-full">
                {relation.entity?.schemaLabel ??
                  relation.entity?.schemaKey ??
                  "schema"}
              </Badge>
            </div>
          </DrawerHeader>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div
              className="border-b bg-muted/20 px-5 py-4"
              data-composer-entity-quick-view={relation.entityId}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">
                    데이터
                  </p>
                  <p className="mt-1 line-clamp-1 text-sm font-medium">
                    {relation.entity?.title ?? relation.entityId}
                  </p>
                  {(relation.entity?.subtitle || relation.entity?.summary) && (
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {relation.entity?.subtitle ?? relation.entity?.summary}
                    </p>
                  )}
                </div>
                <Badge
                  variant="secondary"
                  className="rounded-full font-mono text-[10px]"
                >
                  {relation.entity?.entityType ?? "entity"}
                </Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <EntityEditDrawer relation={relation} />
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-full"
                >
                  <Link href={`/ponix/entities/${relation.entityId}`}>
                    상세 화면
                    <ExternalLink className="size-3.5" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-auto px-5 py-5">
              <form
                action={saveRelation}
                className="grid gap-5"
                data-composer-track-dirty
                onChange={() => {
                  if (saveState.status !== "idle") {
                    setSaveState({ status: "idle" })
                  }
                }}
              >
                <input type="hidden" name="redirect_to" value={redirectTo} />
                <input type="hidden" name="relation_id" value={relation.id} />
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_7rem]">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor={`relation-type-${relation.id}`}
                      className="text-xs"
                    >
                      Type
                    </Label>
                    <Input
                      id={`relation-type-${relation.id}`}
                      name="relation_type"
                      defaultValue={relation.relationType}
                      list={typeListId}
                      className="h-10 bg-card"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor={`relation-slot-${relation.id}`}
                      className="text-xs"
                    >
                      Slot
                    </Label>
                    <Input
                      id={`relation-slot-${relation.id}`}
                      name="slot"
                      defaultValue={relation.slot}
                      list={slotListId}
                      className="h-10 bg-card"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor={`relation-order-${relation.id}`}
                      className="text-xs"
                    >
                      Order
                    </Label>
                    <Input
                      id={`relation-order-${relation.id}`}
                      name="sort_order"
                      type="number"
                      defaultValue={relation.sortOrder}
                      className="h-10 bg-card"
                    />
                  </div>
                </div>
                <RelationDatalists
                  typeOptions={typeOptions}
                  slotOptions={slotOptions}
                  typeListId={typeListId}
                  slotListId={slotListId}
                />
                <SaveFeedbackBar
                  state={saveState}
                  pending={isPending}
                  idleText="섹션 안에서의 노출 방식과 순서를 조정합니다."
                  savingText="연결 정보를 저장하는 중입니다."
                  savedText="연결 정보가 저장되었습니다. 미리보기를 갱신했습니다."
                  buttonLabel="연결 정보 저장"
                  pendingButtonLabel="반영 중..."
                  statusAttr="data-composer-relation-save-status"
                  messageAttr="data-composer-relation-save-message"
                />
              </form>
            </div>
          </div>

          <DrawerFooter className="border-t bg-background px-5 py-4">
            <form action={deleteSectionEntityRelationAction}>
              <input type="hidden" name="redirect_to" value={redirectTo} />
              <input type="hidden" name="relation_id" value={relation.id} />
              <Button
                type="submit"
                size="sm"
                variant="ghost"
                className="h-9 w-full text-destructive hover:text-destructive"
              >
                이 섹션에서 제거
              </Button>
            </form>
            <DrawerClose asChild>
              <Button variant="outline" className="rounded-full">
                닫기
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  )
}

function EntityEditDrawer({ relation }: { relation: Relation }) {
  const entity = relation.entity
  const editableFields = entity ? getEditableEntityFields(entity.schemaKey) : []
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" })
  const [isPending, startTransition] = useTransition()

  function saveEntity(formData: FormData) {
    setSaveState({ status: "saving" })
    startTransition(() => {
      void updateCmsEntityInlineAction(formData).then((result) => {
        if (!result.ok) {
          setSaveState({ status: "error", message: result.error })
          return
        }

        setSaveState({ status: "saved" })
        window.dispatchEvent(new CustomEvent("ponix:reload-canvas"))
      })
    })
  }

  return (
    <DrawerNested direction="right">
      <DrawerTrigger asChild>
        <button
          type="button"
          className="inline-flex h-8 items-center justify-center gap-2 rounded-full border bg-background px-3 text-sm font-medium shadow-xs transition hover:bg-accent hover:text-accent-foreground"
          data-composer-entity-drawer-trigger={relation.entityId}
        >
          <PencilLine className="size-3.5" />
          데이터 수정
        </button>
      </DrawerTrigger>
      <DrawerContent
        className="w-[min(94vw,58rem)] gap-0 p-0 sm:max-w-none"
        data-composer-entity-edit-drawer={relation.entityId}
      >
        <DrawerHeader className="border-b px-5 py-5">
          <div className="flex items-start justify-between gap-8 pr-8">
            <div className="min-w-0">
              <p className="caps mb-2 text-muted-foreground">Entity editor</p>
              <DrawerTitle className="line-clamp-2 font-serif text-3xl italic">
                {entity?.title ?? relation.entityId}
              </DrawerTitle>
              <DrawerDescription className="mt-2 line-clamp-2">
                {entity?.subtitle ?? entity?.summary ?? "연결된 데이터 항목"}
              </DrawerDescription>
            </div>
            <Badge variant="secondary" className="mt-1 shrink-0 rounded-full">
              {entity?.schemaLabel ?? entity?.schemaKey ?? "schema"}
            </Badge>
          </div>
        </DrawerHeader>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/20 px-5 py-3 text-xs text-muted-foreground">
            <span>
              현재 composer를 떠나지 않고 연결된 데이터의 주요 필드를 바로
              수정합니다.
            </span>
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link href={`/ponix/entities/${relation.entityId}/edit`}>
                전체 화면 편집
                <ExternalLink className="size-3.5" />
              </Link>
            </Button>
          </div>
          {entity && editableFields.length ? (
            <form
              action={saveEntity}
              className="flex min-h-0 flex-1 flex-col"
              data-composer-inline-entity-form={relation.entityId}
            >
              <input type="hidden" name="entity_id" value={relation.entityId} />
              <div className="grid flex-1 gap-4 overflow-auto px-5 py-5 md:grid-cols-2">
                {editableFields.map((field) => (
                  <InlineEntityField
                    key={`${field.source}:${field.key}`}
                    field={field}
                    entity={entity}
                  />
                ))}
              </div>
              <div
                className={cn(
                  "border-t bg-background px-5 py-4",
                  saveState.status === "error" && "bg-destructive/5",
                )}
              >
                <SaveFeedbackBar
                  state={saveState}
                  pending={isPending}
                  idleText="저장해도 composer 화면을 떠나지 않습니다."
                  savingText="데이터를 저장하는 중입니다."
                  savedText="데이터가 저장되었습니다. 미리보기를 갱신했습니다."
                  buttonLabel="데이터 저장"
                  pendingButtonLabel="저장 중..."
                  statusAttr="data-composer-inline-entity-status"
                  messageAttr="data-composer-inline-entity-message"
                />
              </div>
            </form>
          ) : (
            <div className="grid flex-1 place-items-center px-5 py-12 text-center">
              <div className="max-w-sm">
                <p className="font-medium">
                  이 데이터는 인라인 편집을 지원하지 않습니다.
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  등록되지 않은 스키마이거나 편집 가능한 필드가 없습니다. 전체
                  화면 편집으로 확인하세요.
                </p>
              </div>
            </div>
          )}
        </div>
      </DrawerContent>
    </DrawerNested>
  )
}

function SaveFeedbackBar({
  state,
  pending,
  idleText,
  savingText,
  savedText,
  buttonLabel,
  pendingButtonLabel,
  statusAttr,
  messageAttr,
}: {
  state: SaveState
  pending: boolean
  idleText: string
  savingText: string
  savedText: string
  buttonLabel: string
  pendingButtonLabel: string
  statusAttr: string
  messageAttr: string
}) {
  const saving = state.status === "saving" || (pending && state.status === "idle")
  const message =
    state.status === "error"
      ? state.message
      : saving
        ? savingText
        : state.status === "saved"
          ? savedText
          : idleText

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border bg-card/70 p-3 sm:flex-row sm:items-center sm:justify-between",
        state.status === "saved" && "border-emerald-300 bg-emerald-50",
        state.status === "error" && "border-destructive/40 bg-destructive/10",
      )}
      {...{ [statusAttr]: state.status }}
    >
      <p
        className={cn(
          "text-xs leading-relaxed text-muted-foreground",
          state.status === "saved" && "text-emerald-800",
          state.status === "error" && "text-destructive",
        )}
        aria-live="polite"
        {...{ [messageAttr]: "" }}
      >
        {message}
      </p>
      <Button
        type="submit"
        disabled={saving}
        className="rounded-full sm:min-w-36"
      >
        {saving ? (
          <Loader2 className="size-4 animate-spin" />
        ) : state.status === "saved" ? (
          <Check className="size-4" />
        ) : null}
        {saving ? pendingButtonLabel : buttonLabel}
      </Button>
    </div>
  )
}

function InlineEntityField({
  field,
  entity,
}: {
  field: CmsEditableEntityField
  entity: NonNullable<Relation["entity"]>
}) {
  const id = `composer-entity-${entity.id}-${field.source}-${field.key}`
  const name = cmsEntityFieldInputName(field)
  const value = inlineEntityFieldValue(entity, field)
  const wide =
    field.type === "textarea" ||
    field.type === "json" ||
    field.type === "string-list"

  return (
    <div className={wide ? "space-y-2 md:col-span-2" : "space-y-2"}>
      <div className="flex items-center gap-2">
        <Label htmlFor={id}>{field.label}</Label>
        {field.required && (
          <Badge variant="outline" className="rounded-full">
            Required
          </Badge>
        )}
      </div>
      {renderInlineFieldInput({ field, id, name, value })}
      <p className="font-mono text-[11px] text-muted-foreground">
        {field.source}.{field.key}
      </p>
      {field.description && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          {field.description}
        </p>
      )}
    </div>
  )
}

function renderInlineFieldInput({
  field,
  id,
  name,
  value,
}: {
  field: CmsEditableEntityField
  id: string
  name: string
  value: unknown
}) {
  if (field.type === "boolean") {
    return (
      <div className="flex h-11 items-center gap-3 rounded-md border bg-background/70 px-3">
        <input type="hidden" name={name} value="false" />
        <Checkbox
          id={id}
          name={name}
          value="true"
          defaultChecked={Boolean(value)}
        />
        <Label htmlFor={id} className="text-sm font-normal">
          Enabled
        </Label>
      </div>
    )
  }

  if (
    field.type === "textarea" ||
    field.type === "string-list" ||
    field.type === "json"
  ) {
    return (
      <Textarea
        id={id}
        name={name}
        defaultValue={inlineFieldDefaultText(field, value)}
        rows={field.type === "json" ? 8 : 4}
        className="bg-background/70"
      />
    )
  }

  if (field.type === "select") {
    return (
      <select
        id={id}
        name={name}
        defaultValue={inlineFieldDefaultText(field, value)}
        className="border-input h-11 w-full rounded-md border bg-background/70 px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        {!field.required && <option value="">Empty</option>}
        {(field.options ?? []).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    )
  }

  return (
    <Input
      id={id}
      name={name}
      type={inlineInputType(field)}
      defaultValue={inlineFieldDefaultText(field, value)}
      className="h-11 bg-background/70"
    />
  )
}

function RelationDatalists({
  typeOptions,
  slotOptions,
  typeListId = "composer-relation-types",
  slotListId = "composer-slots",
}: {
  typeOptions: string[]
  slotOptions: string[]
  typeListId?: string
  slotListId?: string
}) {
  return (
    <>
      <datalist id={typeListId}>
        {typeOptions.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
      <datalist id={slotListId}>
        {slotOptions.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </>
  )
}

function reorderById(relations: Relation[], sourceId: string, targetId: string) {
  const sourceIndex = relations.findIndex((relation) => relation.id === sourceId)
  const targetIndex = relations.findIndex((relation) => relation.id === targetId)

  if (sourceIndex < 0 || targetIndex < 0) {
    return relations
  }

  const next = [...relations]
  const [moved] = next.splice(sourceIndex, 1)
  next.splice(targetIndex, 0, moved)
  return next
}

function inlineEntityFieldValue(
  entity: NonNullable<Relation["entity"]>,
  field: CmsEditableEntityField,
) {
  if (field.source === "data") {
    return jsonRecord(entity.data)[field.key]
  }

  if (field.key === "slug") return entity.slug
  if (field.key === "title") return entity.title
  if (field.key === "subtitle") return entity.subtitle
  if (field.key === "summary") return entity.summary
  if (field.key === "thumbnail_url") return entity.thumbnailUrl
  if (field.key === "sort_at") return entity.sortAt
  if (field.key === "published") return entity.published

  return null
}

function jsonRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {} as Record<string, unknown>
  }

  return value as Record<string, unknown>
}

function inlineInputType(field: CmsEditableEntityField) {
  if (field.type === "number") return "number"
  if (field.type === "date") return "date"
  if (field.type === "datetime") return "datetime-local"
  return "text"
}

function inlineFieldDefaultText(
  field: CmsEditableEntityField,
  value: unknown,
) {
  if (value === null || value === undefined) {
    return ""
  }

  if (field.type === "string-list") {
    return Array.isArray(value) ? value.join("\n") : String(value)
  }

  if (field.type === "json") {
    return JSON.stringify(value, null, 2)
  }

  if (field.type === "datetime" && typeof value === "string") {
    return value.slice(0, 16)
  }

  return String(value)
}

function orderStatusText(saveState: SaveState, isPending: boolean) {
  if (saveState.status === "saved") {
    return "순서가 저장되었습니다."
  }

  if (saveState.status === "error") {
    return saveState.message
  }

  if (saveState.status === "saving" || isPending) {
    return "순서를 저장하는 중입니다."
  }

  return "핸들을 끌어서 노출 순서를 바꿉니다."
}
