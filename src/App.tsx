import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import {
  LayoutDashboard, Package, Warehouse, ShoppingCart, Truck, Users,
  Wallet, ChartNoAxesCombined, Settings, Bell, Search, Menu,
  ArrowUpRight, Boxes, ClipboardList, AlertTriangle,
  Plus, RefreshCw, LogOut, X, Save, LockKeyhole
} from 'lucide-react'
import { supabase, supabaseConfigured } from './lib/supabase'
import SuppliersPurchasing from './SuppliersPurchasing'

type Profile = { id: string; company_id: string; role_id: string; full_name: string; is_active: boolean; roles?: { name_en: string; name_so: string; role_key: string } | null }
type Category = { id: string; name_en: string; name_so: string; code: string }
type Unit = { id: string; unit_code: string; name_en: string; name_so: string; decimal_allowed: boolean }
type Product = {
  id: string; sku: string; name_en: string; name_so: string | null; description: string | null
  cost_price: number; wholesale_price: number; retail_price: number | null; reorder_level: number
  is_active: boolean; category_id: string | null; base_unit_id: string
  categories?: { name_so: string; name_en: string } | null
  units?: { unit_code: string; name_so: string } | null
}
type Balance = { product_id: string; quantity_on_hand: number; quantity_reserved: number; warehouse_id: string }
type Movement = { id: string; movement_type: string; quantity: number; direction: number; notes: string | null; created_at: string; products?: { name_en: string; sku: string } | null; warehouses?: { name: string } | null }

const navGroups = [
  { title: 'GUUD', items: [{ label: 'Dashboard', icon: LayoutDashboard }] },
  { title: 'MAAMULKA BADEECADAHA', items: [
    { label: 'Badeecooyinka', icon: Package },
    { label: 'Kaydka Bakhaarka', icon: Warehouse },
  ]},
  { title: 'QAYBTA IIBSIGA', items: [
    { label: 'Iibsiga', icon: ShoppingCart },
    { label: 'Alaab-qeybiyeyaasha', icon: Truck },
  ]},
  { title: 'IIBKA IYO MACAAMIISHA', items: [
    { label: 'Iibka', icon: ClipboardList },
    { label: 'Macaamiisha', icon: Users },
    { label: 'Shaqaalaha', icon: Users },
  ]},
  { title: 'MAALIYADDA', items: [
    { label: 'Lacagaha', icon: Wallet },
    { label: 'Warbixinnada', icon: ChartNoAxesCombined },
  ]},
]
const money = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(v || 0))
const errorText = (e: unknown) => {
  if (e instanceof Error) return e.message
  if (typeof e === 'string') return e
  if (e && typeof e === 'object') {
    const value = e as Record<string, unknown>
    const message = value.message ?? value.msg ?? value.error_description ?? value.error
    if (typeof message === 'string' && message.trim()) return message
    try { return JSON.stringify(e) } catch { /* use fallback below */ }
  }
  return 'Khalad aan la aqoon ayaa dhacay.'
}

function Login({ onLogin, onForgot, onSignup }: { onLogin: (email: string, password: string) => Promise<void>; onForgot: () => void; onSignup: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setMessage('')
    try { await onLogin(email.trim(), password) } catch (err) { setMessage(errorText(err)) } finally { setBusy(false) }
  }
  return <div className="login-screen"><form className="login-card" onSubmit={submit}>
    <div className="login-brand"><div className="brand-mark">AM</div><div><strong>AL-MUKHTARI</strong><span>GENERAL TRADING COMPANY</span></div></div>
    <div className="login-lock"><LockKeyhole size={22}/></div><h1>Ku gal nidaamka</h1><p>Geli email-kaaga iyo password-kaaga shaqada.</p>
    <label>Email<input type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@company.com"/></label>
    <label>Password<input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password"/></label>
    {message && <div className="form-error">{message}</div>}
    <button className="primary-button login-submit" disabled={busy}>{busy ? 'Fadlan sug…' : 'Soo gal'}</button>
    <button type="button" className="auth-link" onClick={onForgot}>Password-ka ma illowday? / Forgot Password</button>
    <button type="button" className="auth-link" onClick={onSignup}>Account cusub samee / Sign Up</button>
    <small>Account kasta oo cusub wuxuu sugayaa ansixinta Owner-ka ka hor inta aan la gelin ERP-ga.</small>
  </form></div>
}


function SignUp({ onBack, onSubmitted }: { onBack: () => void; onSubmitted: () => void }) {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    if (password.length < 8) { setMessage('Password-ku ha ahaado ugu yaraan 8 xaraf.'); return }
    if (password !== confirm) { setMessage('Labada password isma laha.'); return }
    setBusy(true); setMessage('')
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { data: { full_name: fullName.trim(), phone: phone.trim() || null }, emailRedirectTo: window.location.origin },
      })
      if (signUpError) throw signUpError
      if (!data.user) throw new Error('Account lama abuuri karin. Fadlan mar kale isku day.')
      setSuccess(true)
    } catch (err) { setMessage(errorText(err)) } finally { setBusy(false) }
  }

  if (success) return <div className="login-screen"><div className="login-card">
    <div className="login-brand"><div className="brand-mark">AM</div><div><strong>AL-MUKHTARI</strong><span>GENERAL TRADING COMPANY</span></div></div>
    <div className="login-lock"><LockKeyhole size={22}/></div><h1>Codsiga waa la helay</h1>
    <p>Haddii email xaqiijin loo baahan yahay, ka xaqiiji email-kaaga. Kadib account-kaagu wuxuu sugayaa ansixinta Owner-ka shirkadda.</p>
    <button type="button" className="primary-button login-submit" onClick={onSubmitted}>Ku noqo Login</button>
  </div></div>

  return <div className="login-screen"><form className="login-card" onSubmit={submit}>
    <div className="login-brand"><div className="brand-mark">AM</div><div><strong>AL-MUKHTARI</strong><span>GENERAL TRADING COMPANY</span></div></div>
    <div className="login-lock"><Users size={22}/></div><h1>Account cusub samee</h1>
    <p>Buuxi xogtaada. Account-ka cusub wuxuu sugayaa ansixinta Owner-ka.</p>
    <label>Magaca oo buuxa<input required autoComplete="name" value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Magacaaga"/></label>
    <label>Telefoon (ikhtiyaari)<input type="tel" autoComplete="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+252..."/></label>
    <label>Email<input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@company.com"/></label>
    <label>Password<input type="password" autoComplete="new-password" required minLength={8} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Ugu yaraan 8 xaraf"/></label>
    <label>Xaqiiji password-ka<input type="password" autoComplete="new-password" required minLength={8} value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Ku celi password-ka"/></label>
    {message && <div className="form-error">{message}</div>}
    <button className="primary-button login-submit" disabled={busy}>{busy ? 'Account-ka abuuraya…' : 'Diiwaangeli'}</button>
    <button type="button" className="auth-link" onClick={onBack}>Ku noqo Login</button>
  </form></div>
}

function UsersManagement({ companyId }: { companyId: string }) {
  const [rows, setRows] = useState<Array<{id:string;full_name:string;phone:string|null;created_at:string;is_active:boolean;roles?:{name_so:string;name_en:string}|null}>>([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  async function load() {
    if (!supabase) return
    setBusy(true); setMessage('')
    try {
      const { data, error } = await supabase.from('profiles').select('id,full_name,phone,created_at,is_active,roles(name_so,name_en)').eq('company_id', companyId).order('created_at', { ascending: false })
      if (error) throw error
      setRows((data || []) as typeof rows)
    } catch (err) { setMessage(errorText(err)) } finally { setBusy(false) }
  }
  useEffect(() => { void load() }, [companyId])
  async function approve(id: string) {
    if (!supabase) return
    setBusy(true); setMessage('')
    try {
      const { error } = await supabase.from('profiles').update({ is_active: true }).eq('id', id).eq('company_id', companyId)
      if (error) throw error
      await load()
      setMessage('Account-ka waa la ansixiyey.')
    } catch (err) { setMessage(errorText(err)) } finally { setBusy(false) }
  }
  return <section className="panel data-panel">
    <div className="panel-heading"><div><h2>Maamulka Shaqaalaha</h2><p>Ansixi account-yada cusub ka hor inta aysan ERP-ga geli karin.</p></div><button className="secondary-button" onClick={()=>void load()} disabled={busy}><RefreshCw size={16}/> Cusboonaysii</button></div>
    {message && <div className={message.includes('ansixiyey')?'success-notice':'error-notice'}>{message}</div>}
    <div className="table-wrap"><table><thead><tr><th>Magaca</th><th>Telefoon</th><th>Doorka</th><th>Taariikhda</th><th>Xaaladda</th><th>Ficil</th></tr></thead><tbody>
      {rows.map(row=><tr key={row.id}><td><strong>{row.full_name}</strong></td><td>{row.phone||'—'}</td><td>{row.roles?.name_so||row.roles?.name_en||'Sales Officer'}</td><td>{new Date(row.created_at).toLocaleDateString('en-GB')}</td><td><span className={row.is_active?'status-active':'status-inactive'}>{row.is_active?'Firfircoon':'Sugaya ansixin'}</span></td><td>{!row.is_active&&<button className="small-action" disabled={busy} onClick={()=>void approve(row.id)}>Ansixi</button>}</td></tr>)}
      {rows.length===0&&<tr><td colSpan={6} className="empty-cell">{busy?'Waa la soo rarayaa…':'Shaqaale lama helin.'}</td></tr>}
    </tbody></table></div>
  </section>
}


function ForgotPassword({ onBack, onCodeSent }: { onBack: () => void; onCodeSent: (email: string) => void }) {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setBusy(true); setMessage('')
    try {
      const normalizedEmail = email.trim().toLowerCase()
      const { error: e1 } = await supabase.auth.resetPasswordForEmail(normalizedEmail)
      if (e1) throw e1
      onCodeSent(normalizedEmail)
    } catch (err) { setMessage(errorText(err)) } finally { setBusy(false) }
  }
  return <div className="login-screen"><form className="login-card" onSubmit={submit}>
    <div className="login-brand"><div className="brand-mark">AM</div><div><strong>AL-MUKHTARI</strong><span>GENERAL TRADING COMPANY</span></div></div>
    <div className="login-lock"><LockKeyhole size={22}/></div><h1>Forgot Password</h1><p>Geli email-ka account-kaaga. Waxaan kuu soo diraynaa koodh xaqiijin ah oo 8-god ah.</p>
    <label>Email<input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@company.com"/></label>
    {message && <div className="form-error">{message}</div>}
    <button className="primary-button login-submit" disabled={busy}>{busy ? 'Diraya koodhka…' : 'Ii soo dir koodhka'}</button>
    <button type="button" className="auth-link" onClick={onBack}>Ku noqo Login</button>
  </form></div>
}

function ResetPassword({ email, onComplete }: { email: string; onComplete: () => void }) {
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [verified, setVerified] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    if (!verified && !/^\d{8}$/.test(token.trim())) { setMessage('Geli koodhka 8-god ah ee email-ka laguu soo diray.'); return }
    if (password.length < 8) { setMessage('Password-ku ha ahaado ugu yaraan 8 xaraf.'); return }
    if (password !== confirm) { setMessage('Labada password isma laha.'); return }
    setBusy(true); setMessage('')
    try {
      if (!verified) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          email,
          token: token.trim(),
          type: 'recovery',
        })
        if (verifyError) throw verifyError
        setVerified(true)
      }
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError
      await supabase.auth.signOut()
      onComplete()
    } catch (err) { setMessage(errorText(err)) } finally { setBusy(false) }
  }
  return <div className="login-screen"><form className="login-card" onSubmit={submit}>
    <div className="login-brand"><div className="brand-mark">AM</div><div><strong>AL-MUKHTARI</strong><span>GENERAL TRADING COMPANY</span></div></div>
    <div className="login-lock"><LockKeyhole size={22}/></div><h1>Xaqiiji koodhka</h1><p>Koodh 8-god ah ayaa loo diray <strong>{email}</strong>. Geli koodhka, kadibna samee password cusub.</p>
    <label>Koodhka xaqiijinta<input type="text" inputMode="numeric" autoComplete="one-time-code" required maxLength={8} pattern="[0-9]{8}" value={token} onChange={e=>setToken(e.target.value.replace(/\D/g, '').slice(0, 8))} placeholder="12345678" disabled={verified}/></label>
    <label>Password cusub<input type="password" autoComplete="new-password" required minLength={8} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Ugu yaraan 8 xaraf"/></label>
    <label>Xaqiiji password-ka<input type="password" autoComplete="new-password" required minLength={8} value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Ku celi password-ka"/></label>
    {message && <div className="form-error">{message}</div>}
    <button className="primary-button login-submit" disabled={busy}>{busy ? 'Xaqiijinaya…' : 'Xaqiiji koodhka oo deji password-ka'}</button>
  </form></div>
}

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [authView, setAuthView] = useState<'login' | 'forgot' | 'reset' | 'signup'>('login')
  const [resetEmail, setResetEmail] = useState('')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [active, setActive] = useState('Dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [balances, setBalances] = useState<Balance[]>([])
  const [movements, setMovements] = useState<Movement[]>([])
  const [branchName, setBranchName] = useState('Bariire Branch')
  const [warehouseName, setWarehouseName] = useState('Main Warehouse')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [productModal, setProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [stockModal, setStockModal] = useState<Product | null>(null)
  const [unitsModal, setUnitsModal] = useState<Product | null>(null)
  const [unitForm, setUnitForm] = useState({ unit_id:'', conversion_to_base:'1', barcode:'' })
  const [productForm, setProductForm] = useState({ sku:'', name_en:'', name_so:'', category_id:'', base_unit_id:'', cost_price:'0', wholesale_price:'0', retail_price:'', reorder_level:'0', description:'', barcode:'' })
  const [stockForm, setStockForm] = useState({ quantity:'', direction:'1', unit_cost:'', notes:'' })

  useEffect(() => {
    if (!supabase) { setProfileLoading(false); return }
    let alive = true

    // Supabase detects and stores the browser recovery session from the URL.
    // Subscribe before reading the session so PASSWORD_RECOVERY is not missed.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!alive) return
      setSession(next)
    })

    async function initializeAuth() {
      try {
        const url = new URL(window.location.href)
        const params = url.searchParams
        const hash = new URLSearchParams(url.hash.replace(/^#/, ''))
        const { data, error: authError } = await supabase!.auth.getSession()
        if (authError) throw authError
        if (alive) {
          setSession(data.session)
        }
        const urlError = params.get('error_description') || hash.get('error_description')
        if (urlError) throw new Error(decodeURIComponent(urlError.replace(/\\+/g, ' ')))
      } catch (err) {
        if (alive) {
          setAuthView('login')
          setError('Link-ga password reset-ka lama xaqiijin ama wuu dhacay. Codso link cusub. (' + errorText(err) + ')')
        }
      } finally {
        if (alive) setProfileLoading(false)
      }
    }

    void initializeAuth()
    return () => { alive = false; listener.subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    if (!session || !supabase) {
      setProfile(null)
      setProfileLoading(false)
      return
    }
    let alive = true
    setProfile(null)
    setProfileLoading(true)
    setError('')
    async function loadProfile() {
      try {
        const { data, error: e } = await supabase!.from('profiles').select('id,company_id,role_id,full_name,is_active,roles(name_en,name_so,role_key)').eq('id', session!.user.id).maybeSingle()
        if (!alive) return
        if (e) throw e
        if (!data || !data.is_active) throw new Error('Account-kan lama hawlgelin ama profile lama helin. La xiriir Owner-ka.')
        setProfile(data as unknown as Profile)
      } catch (err) {
        if (alive) setError(errorText(err))
      } finally {
        if (alive) setProfileLoading(false)
      }
    }
    void loadProfile()
    return () => { alive = false }
  }, [session])

  async function loadData() {
    if (!supabase || !profile) return
    setBusy(true); setError('')
    try {
      const [p,c,u,w] = await Promise.all([
        supabase.from('products').select('id,sku,name_en,name_so,description,cost_price,wholesale_price,retail_price,reorder_level,is_active,category_id,base_unit_id,categories(name_en,name_so),units(unit_code,name_so)').eq('company_id',profile.company_id).order('name_en'),
        supabase.from('categories').select('id,name_en,name_so,code').eq('company_id',profile.company_id).order('name_en'),
        supabase.from('units').select('id,unit_code,name_en,name_so,decimal_allowed').eq('company_id',profile.company_id).order('unit_code'),
        supabase.from('warehouses').select('id,name,branch_id').eq('company_id',profile.company_id).eq('is_active',true).limit(1).maybeSingle(),
      ])
      if (p.error) throw p.error; if (c.error) throw c.error; if (u.error) throw u.error; if (w.error) throw w.error
      setProducts((p.data || []) as unknown as Product[]); setCategories(c.data || []); setUnits(u.data || [])
      if (w.data) { setWarehouseName(w.data.name); const {data:b}=await supabase.from('branches').select('name').eq('id',w.data.branch_id).maybeSingle(); if(b) setBranchName(b.name) }
      const [b,m] = await Promise.all([
        supabase.from('inventory_balances').select('product_id,quantity_on_hand,quantity_reserved,warehouse_id').eq('company_id',profile.company_id),
        supabase.from('stock_movements').select('id,movement_type,quantity,direction,notes,created_at,products(name_en,sku),warehouses(name)').eq('company_id',profile.company_id).order('created_at',{ascending:false}).limit(12),
      ])
      if (b.error) throw b.error; if (m.error) throw m.error
      setBalances((b.data || []) as unknown as Balance[]); setMovements((m.data || []) as unknown as Movement[])
    } catch (e) { setError(errorText(e)) } finally { setBusy(false) }
  }

  useEffect(() => { if (profile) loadData() }, [profile])

  async function login(email: string, password: string) {
    if (!supabase) throw new Error('Supabase lama habayn. Hubi VITE_SUPABASE_URL iyo VITE_SUPABASE_PUBLISHABLE_KEY.')
    const { error: e } = await supabase.auth.signInWithPassword({ email, password })
    if (e) throw e
  }
  async function logout() { if (supabase) await supabase.auth.signOut(); setProfile(null); setSession(null) }

  function resetProductForm() {
    setProductForm({sku:'',name_en:'',name_so:'',category_id:'',base_unit_id:'',cost_price:'0',wholesale_price:'0',retail_price:'',reorder_level:'0',description:'',barcode:''})
    setEditingProduct(null)
  }
  function openNewProduct() { resetProductForm(); setProductModal(true) }

  async function saveProduct(e: FormEvent) {
    e.preventDefault(); if (!supabase || !profile) return
    setBusy(true); setError(''); setNotice('')
    try {
      const productPayload = {
        company_id:profile.company_id, category_id:productForm.category_id || null,
        base_unit_id:productForm.base_unit_id, sku:productForm.sku.trim(),
        name_en:productForm.name_en.trim(), name_so:productForm.name_so.trim() || null,
        description:productForm.description.trim() || null,
        cost_price:Number(productForm.cost_price), wholesale_price:Number(productForm.wholesale_price),
        retail_price:productForm.retail_price === '' ? null : Number(productForm.retail_price),
        reorder_level:Number(productForm.reorder_level),
      }
      let productId = editingProduct?.id
      if (editingProduct) {
        const { error: updateError } = await supabase.from('products').update(productPayload).eq('id',editingProduct.id).eq('company_id',profile.company_id)
        if (updateError) throw updateError
      } else {
        const { data: createdProduct, error: insertError } = await supabase.from('products').insert({...productPayload,is_active:true}).select('id').single()
        if (insertError) throw insertError
        productId = createdProduct.id
      }
      if (productForm.barcode.trim() && productId) {
        const { error: barcodeError } = await supabase.from('product_units').update({ barcode:productForm.barcode.trim() }).eq('product_id',productId).eq('is_base_unit',true)
        if (barcodeError) throw barcodeError
      }
      setProductModal(false); setEditingProduct(null); setProductForm({sku:'',name_en:'',name_so:'',category_id:'',base_unit_id:'',cost_price:'0',wholesale_price:'0',retail_price:'',reorder_level:'0',description:'',barcode:''})
      setNotice(editingProduct ? 'Xogta badeecada waa la cusboonaysiiyey.' : 'Badeecada si guul leh ayaa loo diiwaangeliyey.'); await loadData()
    } catch (err) { setError(errorText(err)) } finally { setBusy(false) }
  }

  function openEditProduct(p: Product) {
    setEditingProduct(p)
    setProductForm({sku:p.sku,name_en:p.name_en,name_so:p.name_so||'',category_id:p.category_id||'',base_unit_id:p.base_unit_id,cost_price:String(p.cost_price),wholesale_price:String(p.wholesale_price),retail_price:p.retail_price===null?'':String(p.retail_price),reorder_level:String(p.reorder_level),description:p.description||'',barcode:''})
    setProductModal(true)
  }

  async function toggleProductStatus(p: Product) {
    if (!supabase || !profile) return
    const action = p.is_active ? 'xirto' : 'dib u hawlgeliso'
    if (!window.confirm('Ma hubtaa inaad rabto inaad '+action+' badeecada '+p.name_en+'?')) return
    setBusy(true); setError(''); setNotice('')
    try {
      const { error: e1 } = await supabase.from('products').update({is_active:!p.is_active}).eq('id',p.id).eq('company_id',profile.company_id)
      if (e1) throw e1
      setNotice(p.is_active?'Badeecada waa la xiray; diiwaankeeda iyo taariikhdeedu way sii jiraan.':'Badeecada dib ayaa loo hawlgeliyey.')
      await loadData()
    } catch(err) { setError(errorText(err)) } finally { setBusy(false) }
  }

  async function saveUnitConversion(e: FormEvent) {
    e.preventDefault(); if (!supabase || !profile || !unitsModal) return
    setBusy(true); setError(''); setNotice('')
    try {
      const { error: e1 } = await supabase.from('product_units').insert({
        company_id:profile.company_id, product_id:unitsModal.id, unit_id:unitForm.unit_id,
        conversion_to_base:Number(unitForm.conversion_to_base), barcode:unitForm.barcode.trim() || null,
        is_base_unit:false, is_purchase_unit:true, is_sales_unit:true, is_active:true,
      })
      if (e1) throw e1
      setUnitsModal(null); setUnitForm({unit_id:'',conversion_to_base:'1',barcode:''})
      setNotice('Halbeegga dheeraadka ah waa la diiwaangeliyey.')
    } catch (err) { setError(errorText(err)) } finally { setBusy(false) }
  }
  async function saveStock(e: FormEvent) {
    e.preventDefault(); if (!supabase || !profile || !stockModal) return
    const warehouseId = (await supabase.from('warehouses').select('id').eq('company_id',profile.company_id).eq('is_active',true).limit(1).single()).data?.id
    if (!warehouseId) { setError('Bakhaar firfircoon lama helin.'); return }
    setBusy(true); setError(''); setNotice('')
    try {
      const { error: e1 } = await supabase.rpc('create_stock_movement', {
        p_company_id:profile.company_id, p_warehouse_id:warehouseId, p_product_id:stockModal.id,
        p_movement_type:stockForm.direction === '1' ? 'opening' : 'adjustment',
        p_quantity:Number(stockForm.quantity), p_direction:Number(stockForm.direction),
        p_unit_cost:stockForm.unit_cost === '' ? null : Number(stockForm.unit_cost),
        p_reference_type:'manual', p_reference_id:null, p_notes:stockForm.notes.trim() || null,
      })
      if (e1) throw e1
      setStockModal(null); setStockForm({quantity:'',direction:'1',unit_cost:'',notes:''})
      setNotice('Dhaqdhaqaaqa kaydka waa la diiwaangeliyey.'); await loadData()
    } catch (err) { setError(errorText(err)) } finally { setBusy(false) }
  }

  const balanceMap = useMemo(() => new Map(balances.map(b=>[b.product_id,Number(b.quantity_on_hand)])),[balances])
  const filteredProducts = useMemo(() => products.filter(p => [p.sku,p.name_en,p.name_so || ''].join(' ').toLowerCase().includes(search.toLowerCase())),[products,search])
  const lowStock = products.filter(p => (balanceMap.get(p.id) || 0) <= Number(p.reorder_level)).length
  const stockValue = products.reduce((sum,p)=>sum+(balanceMap.get(p.id)||0)*Number(p.cost_price),0)

  if (!supabaseConfigured || !supabase) return <div className="setup-screen"><div className="setup-card"><div className="brand-mark">AM</div><h1>Supabase setup ayaa loo baahan yahay</h1><p>Ku dar labada environment variables ee Vercel ama faylka .env.local si app-ku ugu xirmo database-ka.</p><code>VITE_SUPABASE_URL</code><code>VITE_SUPABASE_PUBLISHABLE_KEY</code><small>Ha gelin service_role key gudaha frontend-ka.</small></div></div>
  if (profileLoading) return <div className="loading-screen"><div className="spinner"/><span>Hubinta rukhsadda account-ka…</span></div>
  if (authView === 'signup') return <SignUp onBack={() => setAuthView('login')} onSubmitted={() => setAuthView('login')}/>
  if (authView === 'reset') return <ResetPassword email={resetEmail} onComplete={() => { setResetEmail(''); setAuthView('login') }}/>
  if (authView === 'forgot') return <ForgotPassword onBack={() => setAuthView('login')} onCodeSent={(email) => { setResetEmail(email); setAuthView('reset') }}/>
  if (!session) return <Login onLogin={login} onForgot={() => setAuthView('forgot')} onSignup={() => setAuthView('signup')}/>
  if (!profile) return <div className="loading-screen"><h2>Gelitaanka lama dhammeystirin</h2><p className="form-error">{error || 'Profile-ka shaqaalaha lama helin.'}</p><div className="loading-actions"><button className="primary-button" onClick={() => window.location.reload()}>Dib u tijaabi</button><button className="secondary-button" onClick={logout}>Ka bax oo dib u gal</button></div></div>

  return <div className="app-shell">
    <aside className={sidebarOpen ? 'sidebar' : 'sidebar collapsed'}>
      <div className="brand"><div className="brand-mark">AM</div>{sidebarOpen && <div><strong>AL-MUKHTARI</strong><span>GENERAL TRADING</span></div>}</div>
      <div className="company-label">SHAQADA SHIRKADDA</div>
      <nav>{navGroups.map(group=><section className="nav-group" key={group.title}>{sidebarOpen && <p>{group.title}</p>}{group.items.map(item=>{const Icon=item.icon;return <button key={item.label} className={active===item.label?'nav-item active':'nav-item'} onClick={()=>setActive(item.label)} title={item.label}><Icon size={18}/>{sidebarOpen&&<span>{item.label}</span>}</button>})}</section>)}</nav>
      <div className="sidebar-bottom"><button className="nav-item" onClick={()=>setActive('Dejinta')}><Settings size={18}/>{sidebarOpen&&<span>Dejinta</span>}</button>{sidebarOpen&&<div className="branch-card"><span>GOOBTA SHAQADA</span><strong>{branchName}</strong><small>{warehouseName}</small></div>}</div>
    </aside>
    <main className="main-area">
      <header className="topbar"><button className="icon-button" onClick={()=>setSidebarOpen(!sidebarOpen)} aria-label="Toggle menu"><Menu size={20}/></button><div className="breadcrumbs">AL-MUKHTARI ERP <span>/</span> {active}</div><div className="top-actions"><label className="search-box"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Raadi badeeco..."/></label><button className="icon-button" onClick={loadData} aria-label="Refresh"><RefreshCw size={17}/></button><button className="icon-button notification" aria-label="Notifications"><Bell size={19}/></button><button className="profile-button" onClick={logout}><div className="avatar">{profile.full_name.split(' ').map(x=>x[0]).slice(0,2).join('')}</div><span><strong>{profile.full_name}</strong><small>{profile.roles?.name_so || profile.roles?.name_en || 'Shaqaale'} · Ka bax</small></span><LogOut size={16}/></button></div></header>
      <div className="content">
        <div className="page-heading"><div><div className="eyebrow">MAAMULKA GANACSIGA</div><h1>{active==='Dashboard'?'Dashboard-ka Guud':active}</h1><p>Ku soo dhowow nidaamka maamulka AL-MUKHTARI.</p></div><div className="date-chip">USD <span>•</span> VAT 5%</div></div>
        {notice&&<div className="success-notice">{notice}</div>}{error&&<div className="error-notice"><AlertTriangle size={17}/>{error}<button onClick={()=>setError('')}><X size={15}/></button></div>}
        {active==='Shaqaalaha' ? <UsersManagement companyId={profile.company_id}/> : null}
        {active==='Badeecooyinka' ? <section className="panel data-panel">
          <div className="panel-heading"><div><h2>Diiwaanka Badeecooyinka</h2><p>{products.length} badeeco ayaa diiwaangashan</p></div><button className="primary-button" onClick={openNewProduct}><Plus size={16}/> Badeeco cusub</button></div>
          <div className="table-wrap"><table><thead><tr><th>SKU</th><th>Badeecada</th><th>Qaybta</th><th>Halbeegga</th><th>Qiimaha Cost</th><th>Jumlo</th><th>Tafaariiq</th><th>Kaydka</th><th>Xaalad</th><th></th></tr></thead><tbody>{filteredProducts.map(p=><tr key={p.id}><td className="sku-cell">{p.sku}</td><td><strong>{p.name_so||p.name_en}</strong><small>{p.name_en}</small></td><td>{p.categories?.name_so||'—'}</td><td>{p.units?.name_so||'—'}</td><td>{money(Number(p.cost_price))}</td><td>{money(Number(p.wholesale_price))}</td><td>{p.retail_price===null?'—':money(Number(p.retail_price))}</td><td>{balanceMap.get(p.id)||0}</td><td><span className={p.is_active?'status-active':'status-inactive'}>{p.is_active?'Firfircoon':'Xiran'}</span></td><td><div className="row-actions"><button className="small-action" onClick={()=>openEditProduct(p)}>Wax ka beddel</button><button className="small-action" onClick={()=>toggleProductStatus(p)}>{p.is_active?"Xir":"Hawl geli"}</button><button className="small-action" onClick={()=>{setUnitsModal(p);setUnitForm({unit_id:"",conversion_to_base:"1",barcode:""})}}>Halbeegyo</button><button className="small-action" onClick={()=>setStockModal(p)}>Kayd geli</button></div></td></tr>)}{filteredProducts.length===0&&<tr><td colSpan={10} className="empty-cell">{search?'Wax badeeco ah lama helin.':'Weli badeeco lama diiwaangelin. Riix “Badeeco cusub” si aad u bilowdo.'}</td></tr>}</tbody></table></div>
        </section> : active==='Kaydka Bakhaarka' ? <div className="inventory-layout">
          <section className="panel"><div className="panel-heading"><div><h2>Heerka Kaydka</h2><p>Bakhaarka: {warehouseName}</p></div><span className="soft-chip">{balances.length} diiwaan</span></div><div className="table-wrap"><table><thead><tr><th>SKU</th><th>Badeecada</th><th>Kaydka</th><th>Heerka digniinta</th><th>Xaalad</th><th>Ficil</th></tr></thead><tbody>{products.map(p=>{const qty=balanceMap.get(p.id)||0;return <tr key={p.id}><td className="sku-cell">{p.sku}</td><td>{p.name_so||p.name_en}</td><td><strong>{qty}</strong></td><td>{p.reorder_level}</td><td>{qty<=Number(p.reorder_level)?<span className="status-low">Kayd hoose</span>:<span className="status-active">Caadi</span>}</td><td><button className="small-action" onClick={()=>setStockModal(p)}>Diiwaangeli dhaqdhaqaaq</button></td></tr>})}{products.length===0&&<tr><td colSpan={6} className="empty-cell">Marka badeecooyin la diiwaangeliyo, kaydkoodu halkan ayuu ka muuqan doonaa.</td></tr>}</tbody></table></div></section>
          <section className="panel"><div className="panel-heading"><div><h2>Dhaqdhaqaaqyadii u dambeeyey</h2><p>Gelinta iyo sixitaanka kaydka</p></div></div>{movements.length?movements.map(m=><div className="movement-row" key={m.id}><span className={m.direction===1?'movement-in':'movement-out'}>{m.direction===1?'+':'−'}</span><div><strong>{m.products?.name_en||'Badeeco'}</strong><small>{m.movement_type} · {new Date(m.created_at).toLocaleDateString('en-GB')}</small></div><b>{m.direction===1?'+':'−'}{m.quantity}</b></div>):<div className="empty-small">Weli dhaqdhaqaaq kayd lama diiwaangelin.</div>}</section>
        </div> : active==='Alaab-qeybiyeyaasha' ? <SuppliersPurchasing companyId={profile.company_id} userId={profile.id} mode="suppliers"/> : active==='Iibsiga' ? <SuppliersPurchasing companyId={profile.company_id} userId={profile.id} mode="purchases"/> : <><div className="notice"><AlertTriangle size={18}/><div><strong>Qaybtan weli lama hawlgelin</strong><span>Phase 4 wuxuu hadda diiradda saarayaa Badeecooyinka iyo Kaydka Bakhaarka. Qaybaha kale waxaa lagu dhisi doonaa phases-kooda.</span></div></div><div className="stats-grid"><article className="stat-card"><div className="stat-top"><span>Badeecooyinka</span><Package size={19}/></div><strong>{products.length}</strong><small>Wadarta diiwaanka</small></article><article className="stat-card"><div className="stat-top"><span>Qiimaha Kaydka</span><Boxes size={19}/></div><strong>{money(stockValue)}</strong><small>Qiyaasta cost-ka kaydka</small></article><article className="stat-card"><div className="stat-top"><span>Kayd Hoose</span><AlertTriangle size={19}/></div><strong>{lowStock}</strong><small>Badeecooyin u baahan dib-u-buuxin</small></article><article className="stat-card"><div className="stat-top"><span>Bakhaarka</span><Warehouse size={19}/></div><strong>1</strong><small>{warehouseName}</small></article></div><div className="dashboard-grid"><section className="panel chart-panel"><div className="panel-heading"><div><h2>Dhaqdhaqaaqa Kaydka</h2><p>12 dhaqdhaqaaq ee ugu dambeeyey</p></div></div>{movements.length?movements.slice(0,6).map(m=><div className="movement-row" key={m.id}><span className={m.direction===1?'movement-in':'movement-out'}>{m.direction===1?'+':'−'}</span><div><strong>{m.products?.name_en||'Badeeco'}</strong><small>{m.movement_type} · {new Date(m.created_at).toLocaleDateString('en-GB')}</small></div><b>{m.direction===1?'+':'−'}{m.quantity}</b></div>):<div className="empty-chart"><div className="chart-icon"><ChartNoAxesCombined size={27}/></div><strong>Weli xog ma jirto</strong><span>Marka badeeco iyo kayd la diiwaangeliyo, xogtu halkan ayay ka muuqan doontaa.</span></div>}</section><section className="panel quick-panel"><div className="panel-heading"><div><h2>Hawlaha Degdegga ah</h2><p>Maamulka badeecooyinka iyo kaydka</p></div></div><div className="quick-links"><button onClick={()=>setProductModal(true)}><span><Package size={17}/></span>Diiwaangeli badeeco cusub<ArrowUpRight size={15}/></button><button onClick={()=>setActive('Badeecooyinka')}><span><ClipboardList size={17}/></span>Arag diiwaanka badeecooyinka<ArrowUpRight size={15}/></button><button onClick={()=>setActive('Kaydka Bakhaarka')}><span><Warehouse size={17}/></span>Eeg kaydka bakhaarka<ArrowUpRight size={15}/></button></div></section></div></>}
        <footer>© 2026 AL-MUKHTARI GENERAL TRADING COMPANY <span>•</span> Nidaamka Gudaha</footer>
      </div>
    </main>
    {productModal&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget){setProductModal(false);resetProductForm()}}}><form className="modal-card wide-modal" onSubmit={saveProduct}><div className="modal-heading"><div><h2>{editingProduct?"Wax ka beddel badeecada":"Badeeco cusub"}</h2><p>Buuxi xogta badeecada. SKU waa inuu noqdaa mid gaar ah.</p></div><button type="button" className="icon-button" onClick={()=>{setProductModal(false);resetProductForm()}}><X size={18}/></button></div><div className="form-grid">
      <label>SKU / Koodhka badeecada *<input required value={productForm.sku} onChange={e=>setProductForm({...productForm,sku:e.target.value.toUpperCase()})} placeholder="Tusaale: SP-001"/></label>
      <label>Magaca English *<input required value={productForm.name_en} onChange={e=>setProductForm({...productForm,name_en:e.target.value})} placeholder="Black Pepper"/></label>
      <label>Magaca Soomaaliga<input value={productForm.name_so} onChange={e=>setProductForm({...productForm,name_so:e.target.value})} placeholder="Basbaas madow"/></label>
      <label>Qaybta<select value={productForm.category_id} onChange={e=>setProductForm({...productForm,category_id:e.target.value})}><option value="">Dooro qaybta</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name_so||c.name_en}</option>)}</select></label>
      <label>Halbeegga aasaasiga ah *<select required disabled={!!editingProduct} value={productForm.base_unit_id} onChange={e=>setProductForm({...productForm,base_unit_id:e.target.value})}><option value="">Dooro halbeeg</option>{units.map(u=><option key={u.id} value={u.id}>{u.name_so||u.name_en} ({u.unit_code})</option>)}</select></label>
      <label>Qiimaha Cost (USD) *<input type="number" min="0" step="0.01" required value={productForm.cost_price} onChange={e=>setProductForm({...productForm,cost_price:e.target.value})}/></label>
      <label>Qiimaha Jumlada (USD) *<input type="number" min="0" step="0.01" required value={productForm.wholesale_price} onChange={e=>setProductForm({...productForm,wholesale_price:e.target.value})}/></label>
      <label>Qiimaha Tafaariiqda (USD)<input type="number" min="0" step="0.01" value={productForm.retail_price} onChange={e=>setProductForm({...productForm,retail_price:e.target.value})}/></label>
      <label>Barcode<input value={productForm.barcode} onChange={e=>setProductForm({...productForm,barcode:e.target.value})} placeholder="Barcode (ikhtiyaari)"/></label>
      <label>Heerka digniinta kaydka *<input type="number" min="0" step="0.001" required value={productForm.reorder_level} onChange={e=>setProductForm({...productForm,reorder_level:e.target.value})}/></label>
      <label className="full-field">Faahfaahin<input value={productForm.description} onChange={e=>setProductForm({...productForm,description:e.target.value})} placeholder="Faahfaahin dheeraad ah"/></label>
    </div><div className="modal-actions"><button type="button" className="secondary-button" onClick={()=>{setProductModal(false);resetProductForm()}}>Jooji</button><button className="primary-button" disabled={busy}><Save size={16}/> {busy?'Kaydinaya…':editingProduct?'Cusboonaysii badeecada':'Kaydi badeecada'}</button></div></form></div>}
    {unitsModal&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setUnitsModal(null)}}><form className="modal-card" onSubmit={saveUnitConversion}><div className="modal-heading"><div><h2>Halbeeg dheeraad ah</h2><p>{unitsModal.name_so||unitsModal.name_en} · {unitsModal.sku}</p></div><button type="button" className="icon-button" onClick={()=>setUnitsModal(null)}><X size={18}/></button></div>
      <label>Halbeegga cusub *<select required value={unitForm.unit_id} onChange={e=>setUnitForm({...unitForm,unit_id:e.target.value})}><option value="">Dooro halbeeg</option>{units.filter(u=>u.id!==unitsModal.base_unit_id).map(u=><option key={u.id} value={u.id}>{u.name_so||u.name_en} ({u.unit_code})</option>)}</select></label>
      <label>Immisa halbeeg aasaasi ah ayuu ka kooban yahay? *<input type="number" min="0.000001" step="0.000001" required value={unitForm.conversion_to_base} onChange={e=>setUnitForm({...unitForm,conversion_to_base:e.target.value})}/><small>Tusaale: 1 jawaan = 25 KG, geli 25 haddii KG yahay halbeegga aasaasiga ah.</small></label>
      <label>Barcode<input value={unitForm.barcode} onChange={e=>setUnitForm({...unitForm,barcode:e.target.value})} placeholder="Ikhtiyaari"/></label><div className="modal-actions"><button type="button" className="secondary-button" onClick={()=>setUnitsModal(null)}>Jooji</button><button className="primary-button" disabled={busy}><Save size={16}/> Kaydi halbeegga</button></div></form></div>}
    {stockModal&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setStockModal(null)}}><form className="modal-card" onSubmit={saveStock}><div className="modal-heading"><div><h2>Dhaqdhaqaaqa kaydka</h2><p>{stockModal.name_so||stockModal.name_en} · {stockModal.sku}</p></div><button type="button" className="icon-button" onClick={()=>setStockModal(null)}><X size={18}/></button></div><label>Nooca dhaqdhaqaaqa<select value={stockForm.direction} onChange={e=>setStockForm({...stockForm,direction:e.target.value})}><option value="1">Kayd soo galaya / Opening</option><option value="-1">Kayd baxaya / Adjustment</option></select></label><label>Tirada *<input type="number" min="0.001" step="0.001" required value={stockForm.quantity} onChange={e=>setStockForm({...stockForm,quantity:e.target.value})}/></label><label>Qiimaha halkii halbeeg (USD)<input type="number" min="0" step="0.01" value={stockForm.unit_cost} onChange={e=>setStockForm({...stockForm,unit_cost:e.target.value})}/></label><label>Sababta / Faahfaahin<input required value={stockForm.notes} onChange={e=>setStockForm({...stockForm,notes:e.target.value})} placeholder="Tusaale: Opening stock"/></label><div className="modal-actions"><button type="button" className="secondary-button" onClick={()=>setStockModal(null)}>Jooji</button><button className="primary-button" disabled={busy}><Save size={16}/> {busy?'Kaydinaya…':'Diiwaangeli kaydka'}</button></div></form></div>}
  </div>
}
export default App
