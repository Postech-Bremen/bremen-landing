-- Supabase grants EXECUTE on new functions to API roles through default
-- privileges. Normalize ticket RPC grants so anonymous callers can only read
-- public availability; every other ticket function requires authentication.

revoke all on function private.can_manage_ticket_event(uuid) from public, anon, authenticated;
revoke all on function private.can_view_ticket_event(uuid) from public, anon, authenticated;
revoke all on function private.can_check_in_ticket_event(uuid) from public, anon, authenticated;

grant execute on function private.can_manage_ticket_event(uuid) to authenticated;
grant execute on function private.can_view_ticket_event(uuid) to authenticated;
grant execute on function private.can_check_in_ticket_event(uuid) to authenticated;

revoke all on function public.create_ticket_event(
  text, text, text, text, timestamptz, timestamptz, text, text,
  public.ticket_event_status, timestamptz, timestamptz, int, int, int,
  text, int, text, text, text, text, text, text
) from public, anon, authenticated;
revoke all on function public.get_ticket_event_availability(uuid) from public, anon, authenticated;
revoke all on function public.create_ticket_order(uuid, uuid, int, text, text, text) from public, anon, authenticated;
revoke all on function public.report_ticket_order_paid(uuid) from public, anon, authenticated;
revoke all on function public.approve_ticket_order(uuid) from public, anon, authenticated;
revoke all on function public.cancel_ticket_order(uuid) from public, anon, authenticated;
revoke all on function public.update_ticket_event_status(uuid, public.ticket_event_status) from public, anon, authenticated;
revoke all on function public.check_in_ticket(uuid, uuid) from public, anon, authenticated;

grant execute on function public.create_ticket_event(
  text, text, text, text, timestamptz, timestamptz, text, text,
  public.ticket_event_status, timestamptz, timestamptz, int, int, int,
  text, int, text, text, text, text, text, text
) to authenticated;
grant execute on function public.get_ticket_event_availability(uuid) to anon, authenticated;
grant execute on function public.create_ticket_order(uuid, uuid, int, text, text, text) to authenticated;
grant execute on function public.report_ticket_order_paid(uuid) to authenticated;
grant execute on function public.approve_ticket_order(uuid) to authenticated;
grant execute on function public.cancel_ticket_order(uuid) to authenticated;
grant execute on function public.update_ticket_event_status(uuid, public.ticket_event_status) to authenticated;
grant execute on function public.check_in_ticket(uuid, uuid) to authenticated;
