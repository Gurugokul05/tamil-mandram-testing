import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, CalendarDays, CheckSquare, Settings, ShieldCheck } from 'lucide-react'
import { api } from '../lib/api'
import { useToast } from '../context/ToastContext'
import { Card, SectionHeading, Button, Badge, Skeleton } from '../components/ui'

export default function Admin() {
  const [tab,setTab]=useState('applications'); const [items,setItems]=useState([]); const [loading,setLoading]=useState(true); const [stats,setStats]=useState(null); const {toast}=useToast()
  const load=async()=>{setLoading(true);try{const [a,s]=await Promise.all([api.get('/admin/applications',{params:{status:'pending'}}),api.get('/admin/stats')]);setItems(a.data.data);setStats(s.data.data)}catch(e){toast(e?.response?.data?.message||'Could not load admin data','error')}finally{setLoading(false)}}
  useEffect(load,[])
  const decide=async(item,decision)=>{const endpoint=item.status==='pending_president'?'president':'faculty';try{await api.post(`/admin/applications/${item.id}/${endpoint}`,{decision,reason:decision==='reject'?'Please update your application details.':''});toast(`Application ${decision}d`);load()}catch(e){toast(e?.response?.data?.message||'Action failed','error')}}
  return <section className="admin-page"><aside className="admin-sidebar"><div><ShieldCheck/> Admin</div><nav><button className={tab==='applications'?'active':''} onClick={()=>setTab('applications')}><CheckSquare/> Approvals</button><button className={tab==='members'?'active':''} onClick={()=>setTab('members')}><Users/> Members</button><button className={tab==='events'?'active':''} onClick={()=>setTab('events')}><CalendarDays/> Events</button><button className={tab==='settings'?'active':''} onClick={()=>setTab('settings')}><Settings/> Settings</button></nav><Link to="/dashboard">← Member area</Link></aside><div className="admin-main"><SectionHeading tamil="மேலாண்மை" english="Admin Console"/>{stats&&<div className="dash-stats">{Object.entries(stats).slice(0,4).map(([k,v])=><Card key={k}><strong>{typeof v==='object'?v?.length||0:v}</strong><span>{k}</span></Card>)}</div>}
  {tab==='applications'&&<><h2>Membership approvals</h2>{loading?<Skeleton className="admin-table"/>:items.length?<div className="admin-list">{items.map(item=><Card className="admin-row" key={item.id}><div><h3>{item.name}</h3><p>{item.dept} · Year {item.year}</p><Badge>{item.status.replaceAll('_',' ')}</Badge></div><div className="admin-actions"><Button variant="outline" onClick={()=>decide(item,'approve')}>Approve</Button><Button variant="ghost-dark" onClick={()=>decide(item,'reject')}>Reject</Button></div></Card>)}</div>:<p>No applications waiting for review.</p>}</>}
  {tab==='members'&&<MemberAdmin />}
  {tab==='events'&&<EventsAdmin />}
  {tab==='settings'&&<SettingsAdmin />}
  </div></section>
}

function MemberAdmin(){const [items,setItems]=useState([]);useEffect(()=>api.get('/admin/members').then(r=>setItems(r.data.data)).catch(()=>{}),[]);return <><h2>Members</h2><div className="admin-list">{items.slice(0,30).map(i=><Card className="admin-row" key={i.id}><div><h3>{i.name}</h3><p>{i.email}</p></div><Badge>{i.status}</Badge></Card>)}</div></>}
function EventsAdmin(){const [items,setItems]=useState([]);useEffect(()=>api.get('/admin/content/events').then(r=>setItems(r.data.data)).catch(()=>{}),[]);return <><h2>Events</h2><div className="admin-list">{items.map(i=><Card className="admin-row" key={i.id}><div><h3>{i.title?.en||i.title?.ta}</h3><p>{i.category}</p></div><Badge>{i.isPublished?'Published':'Draft'}</Badge></Card>)}</div></>}
function SettingsAdmin(){const [settings,setSettings]=useState(null);useEffect(()=>api.get('/admin/settings').then(r=>setSettings(r.data.data)).catch(()=>{}),[]);return <><h2>Site settings</h2>{settings&&<Card><p>{settings.clubName?.en||settings.clubName?.ta}</p><p>Membership: {settings.status?.membershipOpen?'Open':'Closed'}</p></Card>}</>}
