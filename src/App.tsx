import { useState } from 'react'
import {
  LayoutDashboard, Package, Warehouse, ShoppingCart, Truck, Users,
  Wallet, ChartNoAxesCombined, Settings, Bell, Search, Menu, ChevronDown,
  ArrowUpRight, Boxes, ClipboardList, CircleDollarSign, AlertTriangle
} from 'lucide-react'

const navGroups = [
  { title: 'GUUD', items: [{ label: 'Dashboard', icon: LayoutDashboard }] },
  { title: 'MAAMULKA BADEECADAHA', items: [
    { label: 'Badeecooyinka', icon: Package },
    { label: 'Kaydka Bakhaarka', icon: Warehouse },
    { label: 'Iibsiga', icon: ShoppingCart },
    { label: 'Alaab-qeybiyeyaasha', icon: Truck },
  ]},
  { title: 'IIBKA IYO MACAAMIISHA', items: [
    { label: 'Iibka', icon: ClipboardList },
    { label: 'Macaamiisha', icon: Users },
  ]},
  { title: 'MAALIYADDA', items: [
    { label: 'Lacagaha', icon: Wallet },
    { label: 'Warbixinnada', icon: ChartNoAxesCombined },
  ]},
]

function App() {
  const [active, setActive] = useState('Dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [search, setSearch] = useState('')

  return (
    <div className="app-shell">
      <aside className={sidebarOpen ? 'sidebar' : 'sidebar collapsed'}>
        <div className="brand">
          <div className="brand-mark">AM</div>
          {sidebarOpen && <div><strong>AL-MUKHTARI</strong><span>GENERAL TRADING</span></div>}
        </div>
        <div className="company-label">SHAQADA SHIRKADDA</div>
        <nav>
          {navGroups.map(group => (
            <section className="nav-group" key={group.title}>
              {sidebarOpen && <p>{group.title}</p>}
              {group.items.map(item => {
                const Icon = item.icon
                return <button key={item.label} className={active === item.label ? 'nav-item active' : 'nav-item'} onClick={() => setActive(item.label)} title={item.label}>
                  <Icon size={18} /><span>{sidebarOpen && item.label}</span>
                </button>
              })}
            </section>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-item" onClick={() => setActive('Dejinta')}><Settings size={18}/>{sidebarOpen && <span>Dejinta</span>}</button>
          {sidebarOpen && <div className="branch-card"><span>GOOBTA SHAQADA</span><strong>Bariire Branch</strong><small>Main Warehouse</small></div>}
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="icon-button" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle menu"><Menu size={20}/></button>
          <div className="breadcrumbs">AL-MUKHTARI ERP <span>/</span> {active}</div>
          <div className="top-actions">
            <label className="search-box"><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Raadi..." /></label>
            <button className="icon-button notification" aria-label="Notifications"><Bell size={19}/><i/></button>
            <button className="profile-button"><div className="avatar">AO</div><span><strong>Abukar Omar Mukhtar</strong><small>Milkiile / Owner</small></span><ChevronDown size={16}/></button>
          </div>
        </header>

        <div className="content">
          <div className="page-heading">
            <div><div className="eyebrow">MAAMULKA GANACSIGA</div><h1>{active === 'Dashboard' ? 'Dashboard-ka Guud' : active}</h1><p>Ku soo dhowow nidaamka maamulka AL-MUKHTARI.</p></div>
            <div className="date-chip">USD <span>•</span> VAT 5%</div>
          </div>

          <div className="notice"><AlertTriangle size={18}/><div><strong>Marxaladda dhismaha</strong><span>Interface-ka bilowga ah ayaa la diyaarinayaa. Xogta ganacsiga dhabta ah weli lama gelin.</span></div></div>

          <div className="stats-grid">
            <article className="stat-card"><div className="stat-top"><span>Badeecooyinka</span><Package size={19}/></div><strong>—</strong><small>Weli lama diiwaangelin</small></article>
            <article className="stat-card"><div className="stat-top"><span>Qiimaha Kaydka</span><Boxes size={19}/></div><strong>$ —</strong><small>Waxay sugaysaa xogta kaydka</small></article>
            <article className="stat-card"><div className="stat-top"><span>Iibka Maanta</span><CircleDollarSign size={19}/></div><strong>$ —</strong><small>Wax macaamil ah lama gelin</small></article>
            <article className="stat-card"><div className="stat-top"><span>Dalabaadka Iibsiga</span><ShoppingCart size={19}/></div><strong>—</strong><small>Wax dalab ah lama gelin</small></article>
          </div>

          <div className="dashboard-grid">
            <section className="panel chart-panel"><div className="panel-heading"><div><h2>Dhaqdhaqaaqa Ganacsiga</h2><p>Guudmar iibka iyo iibsiga</p></div><button className="period-button">Toddobaadkan <ChevronDown size={15}/></button></div><div className="empty-chart"><div className="chart-icon"><ChartNoAxesCombined size={27}/></div><strong>Weli xog ma jirto</strong><span>Marka iibka iyo iibsiga la diiwaangeliyo, xogtu halkan ayay ka muuqan doontaa.</span></div></section>
            <section className="panel quick-panel"><div className="panel-heading"><div><h2>Hawlaha Degdegga ah</h2><p>Qaybaha inta badan la isticmaalo</p></div></div><div className="quick-links">
              {[['Diiwaangeli badeeco',Package],['Samee iib cusub',ClipboardList],['Diiwaangeli iibsasho',ShoppingCart],['Eeg kaydka bakhaarka',Warehouse]].map(([label, Icon]) => {
                const I = Icon as typeof Package
                return <button key={label as string} onClick={() => setActive(label as string)}><span><I size={17}/></span>{label as string}<ArrowUpRight size={15}/></button>
              })}
            </div></section>
          </div>
          <footer>© 2026 AL-MUKHTARI GENERAL TRADING COMPANY <span>•</span> Nidaamka Gudaha</footer>
        </div>
      </main>
    </div>
  )
}

export default App
