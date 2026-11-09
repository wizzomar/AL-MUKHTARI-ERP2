-- Phase 5: purchase order dual approval and goods receiving
create or replace function private.apply_purchase_order_approval()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  if new.status='approved' and old.status is distinct from new.status
     and new.entity_table='purchase_orders' then
    update public.purchase_orders set status='approved'
    where id::text=new.entity_id and company_id=new.company_id and status='submitted';
  elsif new.status='rejected' and old.status is distinct from new.status
     and new.entity_table='purchase_orders' then
    update public.purchase_orders set status='cancelled'
    where id::text=new.entity_id and company_id=new.company_id and status='submitted';
  end if;
  return new;
end;
$$;

drop trigger if exists approval_purchase_order_status on public.approval_requests;
create trigger approval_purchase_order_status
after update of status on public.approval_requests
for each row execute function private.apply_purchase_order_approval();

create or replace function public.receive_purchase_item(
  p_purchase_item_id uuid,
  p_quantity numeric,
  p_notes text default null
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_company_id uuid;
  v_warehouse_id uuid;
  v_product_id uuid;
  v_po_id uuid;
  v_order_status text;
  v_order_qty numeric;
  v_received_qty numeric;
  v_unit_cost numeric;
  v_movement_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_quantity is null or p_quantity <= 0 then raise exception 'Received quantity must be greater than zero'; end if;
  if not private.has_permission('inventory.receive') then raise exception 'Missing inventory.receive permission'; end if;
  select po.company_id,po.warehouse_id,po.id,po.status,pi.product_id,pi.quantity,pi.received_quantity,pi.unit_cost
  into v_company_id,v_warehouse_id,v_po_id,v_order_status,v_product_id,v_order_qty,v_received_qty,v_unit_cost
  from public.purchase_items pi join public.purchase_orders po on po.id=pi.purchase_order_id
  where pi.id=p_purchase_item_id for update of pi,po;
  if v_po_id is null then raise exception 'Purchase item not found'; end if;
  if v_company_id is distinct from private.current_profile_company() then raise exception 'Company access denied'; end if;
  if v_order_status not in ('approved','part_received') then raise exception 'Purchase order must be approved before receiving goods'; end if;
  if v_received_qty+p_quantity>v_order_qty then raise exception 'Received quantity exceeds outstanding quantity'; end if;
  v_movement_id:=public.create_stock_movement(v_company_id,v_warehouse_id,v_product_id,'purchase_receipt',p_quantity,1,v_unit_cost,'purchase_order',v_po_id,p_notes);
  update public.purchase_items set received_quantity=received_quantity+p_quantity where id=p_purchase_item_id;
  if not exists(select 1 from public.purchase_items where purchase_order_id=v_po_id and received_quantity<quantity) then
    update public.purchase_orders set status='received' where id=v_po_id;
  else
    update public.purchase_orders set status='part_received' where id=v_po_id;
  end if;
  return v_movement_id;
end;
$$;

revoke all on function public.receive_purchase_item(uuid,numeric,text) from public,anon;
grant execute on function public.receive_purchase_item(uuid,numeric,text) to authenticated;
notify pgrst, 'reload schema';
