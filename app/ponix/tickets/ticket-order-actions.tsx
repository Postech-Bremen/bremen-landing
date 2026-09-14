"use client"

import {
  approveTicketOrderAction,
  cancelTicketOrderAction,
} from "@/app/ponix/tickets/actions"
import { CmsSubmitButton } from "@/app/ponix/_components/cms-save-controls"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

export function TicketOrderActions({
  eventId,
  orderId,
  canApprove,
  canCancel,
}: {
  eventId: string
  orderId: string
  canApprove: boolean
  canCancel: boolean
}) {
  return (
    <div className="flex justify-end gap-2">
      {canApprove ? (
        <form action={approveTicketOrderAction}>
          <input type="hidden" name="event_id" value={eventId} />
          <input type="hidden" name="order_id" value={orderId} />
          <CmsSubmitButton pendingLabel="발급 중...">입금 승인·QR 발급</CmsSubmitButton>
        </form>
      ) : null}

      {canCancel ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="outline" className="text-destructive">
              주문 취소
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>이 주문을 취소할까요?</AlertDialogTitle>
              <AlertDialogDescription>
                발급된 미사용 티켓도 함께 무효화됩니다. 체크인된 티켓이 있으면 취소할 수 없습니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>돌아가기</AlertDialogCancel>
              <form action={cancelTicketOrderAction}>
                <input type="hidden" name="event_id" value={eventId} />
                <input type="hidden" name="order_id" value={orderId} />
                <AlertDialogAction asChild>
                  <CmsSubmitButton pendingLabel="취소 중...">주문 취소 확인</CmsSubmitButton>
                </AlertDialogAction>
              </form>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </div>
  )
}
