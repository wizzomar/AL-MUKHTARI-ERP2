import { useEffect, useMemo, useState } from 'react'
import { Plus, RefreshCw, Truck, ShoppingCart, Wallet, X, Save, Send } from 'lucide-react'
import { supabase } from './lib/supabase'

type Supplier = { id:string; supplier_code:string; name:string; phone:string|null; email:string|null; address:string|null; country_code:string|null; opening_balance:number; currency_code:string; is_active:boolean }
type Product = { id:string; sku:string; name_en:string; name_so:string|null; cost_price:number }
type PurchaseLine = {id:string;quantity:number;received_quantity:number;unit_cost:number;products?:{name_en:string;sku:string}|null}
type Purchase = { id:string; purchase_number:string; status:string; order_date:string; expected_date:string|null; currency_code:string; subtotal:number; tax_amount:number; total_amount:number; supplier_id:string; suppliers?:{name:string}|null; purchase_items?:PurchaseLine[] }
type Approval = {id:string;entity_id:string;status:string;reason:string|null;requested_data:Record<string,unknown>;created_at:string;approval_decisions:{approver_role:string;decision:string}[]}
type Payment = { id:string; supplier_id:string; amount:number; payment_date:string; currency_code:string; payment_method:string; payment_number:string }
type Props = { companyId:string; userId:string; mode:'suppliers'|'purchases' }

const fmt=(n:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(n||0))
const err=(e:unknown)=>e instanceof Error?e.message:'Khalad aan la aqoon ayaa dhacay.'

export default function SuppliersPurchasing({companyId,userId,mode}:Props){
 const [suppliers,setSuppliers]=useState<Supplier[]>([])
 const [products,setProducts]=useState<Product[]>([])
 const [purchases,setPurchases]=useState<Purchase[]>([])
 const [payments,setPayments]=useState<Payment[]>([])
 const [approvals,setApprovals]=useState<Approval[]>([])
 const [warehouseId,setWarehouseId]=useState('')
 const [busy,setBusy]=useState(false)
 const [error,setError]=useState('')
 const [notice,setNotice]=useState('')
 const [supplierModal,setSupplierModal]=useState(false)
 const [purchaseModal,setPurchaseModal]=useState(false)
 const [paymentModal,setPaymentModal]=useState<Supplier|null>(null)
 const [receiveModal,setReceiveModal]=useState<{purchase:Purchase;item:PurchaseLine}|null>(null)
 const [receiveQty,setReceiveQty]=useState('')
 const [supplierForm,setSupplierForm]=useState({supplier_code:'',name:'',phone:'',email:'',address:'',country_code:'AE',opening_balance:'0'})
 const [purchaseForm,setPurchaseForm]=useState({supplier_id:'',product_id:'',quantity:'',unit_cost:'',tax_rate:'5',expected_date:'',notes:''})
 const [paymentForm,setPaymentForm]=useState({amount:'',payment_method:'bank_transfer',reference_number:'',payment_date:new Date().toISOString().slice(0,10)})

 async function load(){
  if(!supabase)return
  setBusy(true);setError('')
  try{
   const [s,p,o,sp,w,ar]=await Promise.all([
    supabase.from('suppliers').select('id,supplier_code,name,phone,email,address,country_code,opening_balance,currency_code,is_active').eq('company_id',companyId).order('name'),
    supabase.from('products').select('id,sku,name_en,name_so,cost_price').eq('company_id',companyId).eq('is_active',true).order('name_en'),
    supabase.from('purchase_orders').select('id,purchase_number,status,order_date,expected_date,currency_code,subtotal,tax_amount,total_amount,supplier_id,suppliers(name),purchase_items(id,quantity,received_quantity,unit_cost,products(name_en,sku))').eq('company_id',companyId).order('created_at',{ascending:false}).limit(100),
    supabase.from('supplier_payments').select('id,supplier_id,amount,payment_date,currency_code,payment_method,payment_number').eq('company_id',companyId).order('payment_date',{ascending:false}),
    supabase.from('warehouses').select('id').eq('company_id',companyId).eq('is_active',true).limit(1).single(),
    supabase.from('approval_requests').select('id,entity_id,status,reason,requested_data,created_at,approval_decisions(approver_role,decision)').eq('company_id',companyId).eq('entity_table','purchase_orders').in('status',['pending','partially_approved']).order('created_at',{ascending:false})
   ])
   if(s.error)throw s.error;if(p.error)throw p.error;if(o.error)throw o.error;if(sp.error)throw sp.error
   setSuppliers((s.data||[]) as Supplier[]);setProducts((p.data||[]) as Product[]);setPurchases((o.data||[]) as unknown as Purchase[]);setPayments((sp.data||[]) as Payment[]);setApprovals((ar.data||[]) as unknown as Approval[])
   if(w.data)setWarehouseId(w.data.id)
  }catch(e){setError(err(e))}
  finally{setBusy(false)}
 }
 useEffect(()=>{void load()},[companyId])

 const supplierTotals=useMemo(()=>suppliers.map(s=>{
  const bought=purchases.filter(p=>p.supplier_id===s.id && p.status!=='cancelled').reduce((n,p)=>n+Number(p.total_amount),0)
  const paid=payments.filter(p=>p.supplier_id===s.id).reduce((n,p)=>n+Number(p.amount),0)
  return {...s,balance:Number(s.opening_balance)+bought-paid,purchaseTotal:bought,paymentTotal:paid}
 }),[suppliers,purchases,payments])
 const subtotal=Number(purchaseForm.quantity||0)*Number(purchaseForm.unit_cost||0)
 const tax=subtotal*Number(purchaseForm.tax_rate||0)/100
 const total=subtotal+tax

 async function saveSupplier(e:React.FormEvent){
  e.preventDefault();if(!supabase)return
  setBusy(true);setError('');setNotice('')
  try{
   const {error:e1}=await supabase.from('suppliers').insert({company_id:companyId,supplier_code:supplierForm.supplier_code.trim().toUpperCase(),name:supplierForm.name.trim(),phone:supplierForm.phone.trim()||null,email:supplierForm.email.trim()||null,address:supplierForm.address.trim()||null,country_code:supplierForm.country_code||null,opening_balance:Number(supplierForm.opening_balance),currency_code:'USD',is_active:true})
   if(e1)throw e1
   setSupplierModal(false);setSupplierForm({supplier_code:'',name:'',phone:'',email:'',address:'',country_code:'AE',opening_balance:'0'});setNotice('Alaab-qeybiyaha waa la diiwaangeliyey.');await load()
  }catch(e){setError(err(e))}finally{setBusy(false)}
 }
 async function savePurchase(e:React.FormEvent){
  e.preventDefault();if(!supabase)return
  if(!warehouseId){setError('Bakhaarka firfircoon lama helin.');return}
  if(!purchaseForm.supplier_id||!purchaseForm.product_id){setError('Dooro alaab-qeybiye iyo badeeco.');return}
  setBusy(true);setError('');setNotice('')
  const number='PO-'+new Date().toISOString().slice(0,10).replaceAll('-','')+'-'+Math.floor(1000+Math.random()*9000)
  try{
   const {data:po,error:e1}=await supabase.from('purchase_orders').insert({company_id:companyId,supplier_id:purchaseForm.supplier_id,warehouse_id:warehouseId,purchase_number:number,status:'draft',order_date:new Date().toISOString().slice(0,10),expected_date:purchaseForm.expected_date||null,currency_code:'USD',exchange_rate:1,subtotal,tax_amount:tax,total_amount:total,notes:purchaseForm.notes.trim()||null,created_by:userId}).select('id').single()
   if(e1)throw e1
   const {error:e2}=await supabase.from('purchase_items').insert({purchase_order_id:po.id,product_id:purchaseForm.product_id,quantity:Number(purchaseForm.quantity),unit_cost:Number(purchaseForm.unit_cost),tax_rate:Number(purchaseForm.tax_rate),line_total:total,received_quantity:0})
   if(e2){await supabase.from('purchase_orders').delete().eq('id',po.id);throw e2}
   setPurchaseModal(false);setPurchaseForm({supplier_id:'',product_id:'',quantity:'',unit_cost:'',tax_rate:'5',expected_date:'',notes:''});setNotice('Dalabka iibsiga draft ahaan ayaa loo kaydiyey.');await load()
  }catch(e){setError(err(e))}finally{setBusy(false)}
 }
 async function submitPurchase(p:Purchase){
  if(!supabase)return
  if(!window.confirm('Ma gudbinaysaa dalabka '+p.purchase_number+' si loo ansixiyo?'))return
  setBusy(true);setError('');setNotice('')
  try{
   const {error:e}=await supabase.from('purchase_orders').update({status:'submitted'}).eq('id',p.id).eq('company_id',companyId).eq('status','draft');if(e)throw e;
   const {error:a}=await supabase.rpc('request_approval',{p_company_id:companyId,p_request_type:'purchase_order',p_entity_table:'purchase_orders',p_entity_id:p.id,p_requested_data:{purchase_number:p.purchase_number,total_amount:p.total_amount,supplier_id:p.supplier_id},p_reason:'Ansixinta dalabka iibsiga'});
   if(a){await supabase.from('purchase_orders').update({status:'draft'}).eq('id',p.id);throw a}
   setNotice('Dalabka waxaa loo gudbiyey ansixinta Owner iyo General Manager.');await load()
  }catch(e){setError(err(e))}finally{setBusy(false)}
 }
 async function decideApproval(id:string,decision:'approved'|'rejected'){
  if(!supabase)return
  const message=decision==='approved'?'Ma ansixinaysaa dalabkan?':'Ma diidaysaa dalabkan?'
  if(!window.confirm(message))return
  setBusy(true);setError('');setNotice('')
  try{const {error:e}=await supabase.rpc('decide_approval',{p_request_id:id,p_decision:decision,p_comments:null});if(e)throw e;setNotice(decision==='approved'?'Go’aanka ansixinta waa la diiwaangeliyey. Haddii labada maamule ansixiyaan, dalabku wuu furmayaa.':'Dalabka waa la diiday.');await load()}
  catch(e){setError(err(e))}finally{setBusy(false)}
 }
 async function receiveItem(e:React.FormEvent){
  e.preventDefault();if(!supabase||!receiveModal)return
  setBusy(true);setError('');setNotice('')
  try{
   const {error:e}=await supabase.rpc('receive_purchase_item',{p_purchase_item_id:receiveModal.item.id,p_quantity:Number(receiveQty),p_notes:'Alaab la helay: '+receiveModal.purchase.purchase_number})
   if(e)throw e
   setReceiveModal(null);setReceiveQty('');setNotice('Alaabta waa la xaqiijiyey, kaydkana si toos ah ayaa loogu daray.');await load()
  }catch(e){setError(err(e))}finally{setBusy(false)}
 }
 async function savePayment(e:React.FormEvent){
  e.preventDefault();if(!supabase||!paymentModal)return
  setBusy(true);setError('');setNotice('')
  const paymentNumber='SP-'+new Date().toISOString().slice(0,10).replaceAll('-','')+'-'+Math.floor(1000+Math.random()*9000)
  try{
   const {error:e}=await supabase.from('supplier_payments').insert({company_id:companyId,supplier_id:paymentModal.id,payment_number:paymentNumber,payment_date:paymentForm.payment_date,amount:Number(paymentForm.amount),currency_code:'USD',exchange_rate:1,payment_method:paymentForm.payment_method,reference_number:paymentForm.reference_number.trim()||null,created_by:userId})
   if(e)throw e
   setPaymentModal(null);setPaymentForm({amount:'',payment_method:'bank_transfer',reference_number:'',payment_date:new Date().toISOString().slice(0,10)});setNotice('Lacag-bixinta alaab-qeybiyaha waa la diiwaangeliyey.');await load()
  }catch(e){setError(err(e))}finally{setBusy(false)}
 }
 const statusLabel=(s:string)=>({draft:'Qabyo',submitted:'Sugaya ansixin',approved:'La ansixiyey',part_received:'Qayb la helay',received:'La wada helay',cancelled:'La joojiyey'}[s]||s)
 return <div className="phase-module">
  <div className="module-toolbar"><div><span className="module-eyebrow">PHASE 5 · MAAMULKA IIBSIGA</span><h2>{mode==='suppliers'?'Alaab-qeybiyeyaasha':'Dalabyada Iibsiga'}</h2><p>{mode==='suppliers'?'Diiwaanka shirkadaha iyo dadka badeecadaha keena.':'Dalabyada badeecadaha iyo xaaladdooda.'}</p></div><div className="module-actions"><button className="secondary-button" onClick={()=>void load()} disabled={busy}><RefreshCw size={15}/> Cusboonaysii</button>{mode==='suppliers'?<button className="primary-button" onClick={()=>setSupplierModal(true)}><Plus size={15}/> Alaab-qeybiye cusub</button>:<button className="primary-button" onClick={()=>setPurchaseModal(true)}><Plus size={15}/> Dalab cusub</button>}</div></div>
  {notice&&<div className="success-notice">{notice}</div>}{error&&<div className="error-notice">{error}<button onClick={()=>setError('')}><X size={15}/></button></div>}
  {mode==='suppliers'?<>
   <div className="module-stats"><article className="stat-card"><div className="stat-top"><span>Alaab-qeybiyeyaal</span><Truck size={18}/></div><strong>{suppliers.length}</strong><small>Dhammaan diiwaanka</small></article><article className="stat-card"><div className="stat-top"><span>Wadarta Iibsiga</span><ShoppingCart size={18}/></div><strong>{fmt(purchases.reduce((n,p)=>n+Number(p.total_amount),0))}</strong><small>Dalabyada aan la joojin</small></article><article className="stat-card"><div className="stat-top"><span>Lacagaha La Bixiyey</span><Wallet size={18}/></div><strong>{fmt(payments.reduce((n,p)=>n+Number(p.amount),0))}</strong><small>Wadarta lacag-bixinta</small></article></div>
   <section className="panel data-panel"><div className="panel-heading"><div><h2>Diiwaanka Alaab-qeybiyeyaasha</h2><p>{suppliers.length} diiwaan · USD</p></div></div><div className="table-wrap"><table><thead><tr><th>Koodh</th><th>Magaca</th><th>Dal</th><th>Xiriir</th><th>Iibsiga</th><th>Lacag la bixiyey</th><th>Haraaga</th><th>Ficil</th></tr></thead><tbody>{supplierTotals.map(s=><tr key={s.id}><td className="sku-cell">{s.supplier_code}</td><td><strong>{s.name}</strong><small>{s.email||'—'}</small></td><td>{s.country_code||'—'}</td><td>{s.phone||'—'}</td><td>{fmt(s.purchaseTotal)}</td><td>{fmt(s.paymentTotal)}</td><td><strong>{fmt(s.balance)}</strong></td><td><button className="small-action" onClick={()=>setPaymentModal(s)}>Diiwaangeli lacag-bixin</button></td></tr>)}{!suppliers.length&&<tr><td colSpan={8} className="empty-cell">Weli alaab-qeybiye lama diiwaangelin.</td></tr>}</tbody></table></div></section>
  </>:<>
   <div className="module-stats"><article className="stat-card"><div className="stat-top"><span>Dalabyada</span><ShoppingCart size={18}/></div><strong>{purchases.length}</strong><small>Dhammaan dalabyada</small></article><article className="stat-card"><div className="stat-top"><span>Qiimaha Iibsiga</span><Wallet size={18}/></div><strong>{fmt(purchases.filter(p=>p.status!=='cancelled').reduce((n,p)=>n+Number(p.total_amount),0))}</strong><small>USD</small></article><article className="stat-card"><div className="stat-top"><span>Sugaya Ansixin</span><Send size={18}/></div><strong>{purchases.filter(p=>p.status==='submitted').length}</strong><small>Dalabyo la gudbiyey</small></article></div>
   <section className="panel data-panel"><div className="panel-heading"><div><h2>Ansixinta Dalabyada</h2><p>Dalabyada sugaya go'aanka Owner iyo General Manager.</p></div><span className="soft-chip">{approvals.length} sugaya</span></div>{approvals.length?approvals.map(a=>{const owner=a.approval_decisions?.some(d=>d.approver_role==='owner'&&d.decision==='approved');const gm=a.approval_decisions?.some(d=>d.approver_role==='general_manager'&&d.decision==='approved');return <div className="approval-row" key={a.id}><div><strong>{String(a.requested_data?.purchase_number||a.entity_id)}</strong><small>{a.reason||'Dalab iibsiga'} · {new Date(a.created_at).toLocaleDateString('en-GB')}</small><small>Owner: {owner?'La ansixiyey':'Sugaya'} · General Manager: {gm?'La ansixiyey':'Sugaya'}</small></div><div className="module-actions"><button className="small-action" disabled={busy} onClick={()=>void decideApproval(a.id,'approved')}>Ansixi</button><button className="small-action danger-action" disabled={busy} onClick={()=>void decideApproval(a.id,'rejected')}>Diid</button></div></div>}) : <div className="empty-small">Ma jiraan dalabyo sugaya ansixin, ama koontadani ma laha rukhsadda aragtida ansixinta.</div>}</section>
   <section className="panel data-panel"><div className="panel-heading"><div><h2>Diiwaanka Dalabyada Iibsiga</h2><p>Dalab kasta wuxuu ku xiran yahay alaab-qeybiye iyo bakhaarka dhexe.</p></div></div><div className="table-wrap"><table><thead><tr><th>Lambarka</th><th>Alaab-qeybiye</th><th>Taariikh</th><th>Wadarta</th><th>Xaalad</th><th>Ficil</th></tr></thead><tbody>{purchases.map(p=><tr key={p.id}><td className="sku-cell">{p.purchase_number}</td><td>{p.suppliers?.name||suppliers.find(s=>s.id===p.supplier_id)?.name||'—'}</td><td>{p.order_date}</td><td><strong>{fmt(Number(p.total_amount))}</strong></td><td><span className={p.status==='approved'||p.status==='received'?'status-active':p.status==='cancelled'?'status-inactive':'status-low'}>{statusLabel(p.status)}</span></td><td>{p.status==='draft'?<button className="small-action" onClick={()=>void submitPurchase(p)} disabled={busy}><Send size={13}/> Gudbi</button>:p.status==='approved'||p.status==='part_received'?<div className="purchase-line-actions">{(p.purchase_items||[]).map(i=><button key={i.id} className="small-action" disabled={busy||Number(i.received_quantity)>=Number(i.quantity)} onClick={()=>{setReceiveModal({purchase:p,item:i});setReceiveQty(String(Number(i.quantity)-Number(i.received_quantity)))}}>Hel: {i.products?.name_en||i.products?.sku||'Badeeco'} ({i.received_quantity}/{i.quantity})</button>)}</div>:<span className="empty-small">—</span>}</td></tr>)}{!purchases.length&&<tr><td colSpan={6} className="empty-cell">Weli dalab iibsiga lama diiwaangelin.</td></tr>}</tbody></table></div></section>
  </>}
  {supplierModal&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setSupplierModal(false)}}><form className="modal-card wide-modal" onSubmit={saveSupplier}><div className="modal-heading"><div><h2>Alaab-qeybiye cusub</h2><p>Diiwaangeli supplier gudaha ama dibadda.</p></div><button type="button" className="icon-button" onClick={()=>setSupplierModal(false)}><X size={18}/></button></div><div className="form-grid">
   <label>Koodhka *<input required value={supplierForm.supplier_code} onChange={e=>setSupplierForm({...supplierForm,supplier_code:e.target.value})} placeholder="SUP-001"/></label><label>Magaca shirkadda/qofka *<input required value={supplierForm.name} onChange={e=>setSupplierForm({...supplierForm,name:e.target.value})}/></label><label>Telefoon<input value={supplierForm.phone} onChange={e=>setSupplierForm({...supplierForm,phone:e.target.value})}/></label><label>Email<input type="email" value={supplierForm.email} onChange={e=>setSupplierForm({...supplierForm,email:e.target.value})}/></label><label>Dal<select value={supplierForm.country_code} onChange={e=>setSupplierForm({...supplierForm,country_code:e.target.value})}><option value="AE">UAE / Dubai</option><option value="IN">India</option><option value="CN">China</option><option value="YE">Yemen</option><option value="SO">Somalia</option></select></label><label>Haraaga furitaanka (USD)<input type="number" min="0" step="0.01" value={supplierForm.opening_balance} onChange={e=>setSupplierForm({...supplierForm,opening_balance:e.target.value})}/></label><label className="full-field">Cinwaan<input value={supplierForm.address} onChange={e=>setSupplierForm({...supplierForm,address:e.target.value})}/></label>
  </div><div className="modal-actions"><button type="button" className="secondary-button" onClick={()=>setSupplierModal(false)}>Jooji</button><button className="primary-button" disabled={busy}><Save size={15}/> Kaydi</button></div></form></div>}
  {purchaseModal&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setPurchaseModal(false)}}><form className="modal-card" onSubmit={savePurchase}><div className="modal-heading"><div><h2>Dalab iibsiga cusub</h2><p>Dalabka waxaa marka hore loo kaydinayaa qabyo.</p></div><button type="button" className="icon-button" onClick={()=>setPurchaseModal(false)}><X size={18}/></button></div>
   <label>Alaab-qeybiye *<select required value={purchaseForm.supplier_id} onChange={e=>setPurchaseForm({...purchaseForm,supplier_id:e.target.value})}><option value="">Dooro supplier</option>{suppliers.filter(s=>s.is_active).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
   <label>Badeecada *<select required value={purchaseForm.product_id} onChange={e=>{const p=products.find(x=>x.id===e.target.value);setPurchaseForm({...purchaseForm,product_id:e.target.value,unit_cost:p?String(p.cost_price):''})}}><option value="">Dooro badeeco</option>{products.map(p=><option key={p.id} value={p.id}>{p.sku} · {p.name_so||p.name_en}</option>)}</select></label>
   <div className="form-grid"><label>Tirada *<input required type="number" min="0.001" step="0.001" value={purchaseForm.quantity} onChange={e=>setPurchaseForm({...purchaseForm,quantity:e.target.value})}/></label><label>Qiimaha halkii unug (USD) *<input required type="number" min="0" step="0.01" value={purchaseForm.unit_cost} onChange={e=>setPurchaseForm({...purchaseForm,unit_cost:e.target.value})}/></label><label>VAT (%)<input type="number" min="0" max="100" step="0.01" value={purchaseForm.tax_rate} onChange={e=>setPurchaseForm({...purchaseForm,tax_rate:e.target.value})}/></label><label>Taariikhda la filayo<input type="date" value={purchaseForm.expected_date} onChange={e=>setPurchaseForm({...purchaseForm,expected_date:e.target.value})}/></label></div>
   <div className="purchase-total"><span>Subtotal: {fmt(subtotal)}</span><span>VAT: {fmt(tax)}</span><strong>Wadarta: {fmt(total)}</strong></div><label>Faahfaahin<input value={purchaseForm.notes} onChange={e=>setPurchaseForm({...purchaseForm,notes:e.target.value})}/></label>
   <div className="modal-actions"><button type="button" className="secondary-button" onClick={()=>setPurchaseModal(false)}>Jooji</button><button className="primary-button" disabled={busy||!purchaseForm.quantity||!purchaseForm.unit_cost}><Save size={15}/> Kaydi dalabka</button></div></form></div>}
  {receiveModal&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setReceiveModal(null)}}><form className="modal-card" onSubmit={receiveItem}><div className="modal-heading"><div><h2>Xaqiiji helitaanka alaabta</h2><p>{receiveModal.purchase.purchase_number} · {receiveModal.item.products?.name_en||'Badeeco'}</p></div><button type="button" className="icon-button" onClick={()=>setReceiveModal(null)}><X size={18}/></button></div><p className="empty-small">Tirada dalabka: {receiveModal.item.quantity} · Hore loo helay: {receiveModal.item.received_quantity} · Hadhay: {Number(receiveModal.item.quantity)-Number(receiveModal.item.received_quantity)}</p><label>Tirada hadda la helay *<input required type="number" min="0.001" max={Number(receiveModal.item.quantity)-Number(receiveModal.item.received_quantity)} step="0.001" value={receiveQty} onChange={e=>setReceiveQty(e.target.value)}/></label><div className="modal-actions"><button type="button" className="secondary-button" onClick={()=>setReceiveModal(null)}>Jooji</button><button className="primary-button" disabled={busy||Number(receiveQty)<=0||Number(receiveQty)>Number(receiveModal.item.quantity)-Number(receiveModal.item.received_quantity)}><Save size={15}/> Xaqiiji oo kayd geli</button></div></form></div>}
  {paymentModal&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setPaymentModal(null)}}><form className="modal-card" onSubmit={savePayment}><div className="modal-heading"><div><h2>Lacag-bixin supplier</h2><p>{paymentModal.name}</p></div><button type="button" className="icon-button" onClick={()=>setPaymentModal(null)}><X size={18}/></button></div><label>Taariikh *<input required type="date" value={paymentForm.payment_date} onChange={e=>setPaymentForm({...paymentForm,payment_date:e.target.value})}/></label><label>Qadarka (USD) *<input required type="number" min="0.01" step="0.01" value={paymentForm.amount} onChange={e=>setPaymentForm({...paymentForm,amount:e.target.value})}/></label><label>Habka lacag-bixinta<select value={paymentForm.payment_method} onChange={e=>setPaymentForm({...paymentForm,payment_method:e.target.value})}><option value="cash">Cash</option><option value="bank_transfer">Bank Transfer</option><option value="evc">EVC</option><option value="edahab">eDahab</option><option value="other">Other</option></select></label><label>Tixraac / Reference<input value={paymentForm.reference_number} onChange={e=>setPaymentForm({...paymentForm,reference_number:e.target.value})}/></label><div className="modal-actions"><button type="button" className="secondary-button" onClick={()=>setPaymentModal(null)}>Jooji</button><button className="primary-button" disabled={busy}><Save size={15}/> Diiwaangeli</button></div></form></div>}
 </div>
}
