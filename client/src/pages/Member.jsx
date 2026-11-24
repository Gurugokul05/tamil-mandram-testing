import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CalendarDays, LogOut, QrCode, UserRound, Bell, BookOpen } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'
import { Button, Card, SectionHeading, Input, Skeleton, EmptyState } from '../components/ui'

export function Membership() {
  const {user}=useAuth(); const navigate=useNavigate()
  useEffect(()=>{if(user)navigate('/dashboard')},[user,navigate])
  return <section className="membership-page"><div className="membership-card"><SectionHeading tamil="உறுப்பினர் சேர்க்கை" english="Join Tamil Mandram" align="center"/><p>Register an account, complete your profile, and submit it for president and faculty approval.</p><div className="approval-steps"><div><strong>1</strong><span>Create account</span></div><div><strong>2</strong><span>Complete profile</span></div><div><strong>3</strong><span>Two-stage approval</span></div></div><Button href="/register" className="full">Begin membership application</Button></div></section>
}

export function Status() {
  const {user}=useAuth()
  const status={profile_incomplete:['Complete profile','Submit your profile for review'],pending_president:['President review','Waiting for the president'],pending_faculty:['Faculty review','Waiting for final faculty approval'],rejected:['Application needs attention','Review your profile and apply again'],suspended:['Membership suspended','Contact the Mandram coordinators'],approved:['Approved','Welcome to the Mandram']}
  const [title,text]=status[user?.status]||['Membership status','Sign in to view your application']
  return <section className="status-page"><Card className="status-card"><div className="status-icon"><UserRound/></div><BadgeText text={title}/><h1>{title}</h1><p>{text}</p>{user?.status==='profile_incomplete'||user?.status==='rejected'?<Button href="/dashboard/profile">Complete profile</Button>:<Button href="/dashboard">Member area</Button>}</Card></section>
}
function BadgeText({text}){return <small>{text}</small>}

export function Dashboard() {
  const {user,logout}=useAuth(); const {local}=useLanguage(); const {toast}=useToast(); const [data,setData]=useState(null); const [loading,setLoading]=useState(true); const navigate=useNavigate()
  useEffect(()=>{apiLoad()},[])
  const apiLoad=()=>api.get('/member/overview').then(r=>setData(r.data.data)).finally(()=>setLoading(false))
  const signOut=async()=>{await logout();navigate('/')}
  return <section className="dashboard"><aside className="dashboard-sidebar"><div className="dash-brand">த தமிழ் மன்றம்</div><nav><Link className="active" to="/dashboard"><UserRound/> Overview</Link><Link to="/dashboard/profile"><BookOpen/> Profile</Link><Link to="/dashboard/events"><CalendarDays/> My events</Link></nav><button onClick={signOut}><LogOut/> Sign out</button></aside><div className="dashboard-main"><header><div><p>Welcome back</p><h1>{user?.name}</h1></div><div className="notification-icon"><Bell/><span>{data?.stats?.unread||0}</span></div></header>
  {loading?<><Skeleton className="dash-stat"/><Skeleton className="dash-card"/></>:<>
  <div className="dash-stats"><Card><strong>{data.stats.memberCount}</strong><span>Members</span></Card><Card><strong>{data.stats.myEvents}</strong><span>My events</span></Card><Card><strong>{data.stats.resources}</strong><span>Resources</span></Card></div>
  <SectionHeading tamil="எனது நிகழ்வுகள்" english="My Upcoming Events"/>{data.upcoming?.length?<div className="dash-events">{data.upcoming.map(r=><Card key={r.id}><h3>{local(r.event.title)}</h3><p>{new Date(r.event.startDate).toLocaleString()}</p><Button href={`/dashboard/events/${r.id}`} variant="soft"><QrCode size={16}/> View QR pass</Button></Card>)}</div>:<EmptyState title="No upcoming events" message="Explore and register for upcoming Mandram events." action={<Button href="/events">Browse events</Button>}/>}
  </>}
  </div></section>
}

export function ProfilePage() {
  const {user,setUser}=useAuth(); const {toast}=useToast(); const [loading,setLoading]=useState(false); const [wings,setWings]=useState([]); const [values,setValues]=useState({name:user?.name||'',regNo:user?.regNo||'',dept:user?.dept||'',year:user?.year||1,wing:user?.wing?.id||'',phone:user?.phone||'',bio:user?.bio||''})
  useEffect(()=>api.get('/public/wings').then(r=>setWings(r.data.data)).catch(()=>{}),[])
  const submit=async e=>{e.preventDefault();setLoading(true);try{const r=await api.put('/auth/profile',{...values,year:Number(values.year),wing:values.wing||null});setUser(r.data.data);toast(r.data.message)}catch(err){toast(err?.response?.data?.message||'Could not update profile','error')}finally{setLoading(false)}}
  return <section className="profile-page"><div className="container"><Card className="profile-form-card"><SectionHeading tamil="சுயவிவரம்" english="Member Profile"/><form onSubmit={submit} className="profile-form"><div className="two-fields"><Input label="Full name" value={values.name} onChange={e=>setValues({...values,name:e.target.value})}/><Input label="Register number" value={values.regNo} onChange={e=>setValues({...values,regNo:e.target.value})}/></div><div className="two-fields"><Input label="Department" value={values.dept} onChange={e=>setValues({...values,dept:e.target.value})}/><Input label="Year" type="number" min="1" max="6" value={values.year} onChange={e=>setValues({...values,year:e.target.value})}/></div><label className="field"><span>Wing</span><select value={values.wing} onChange={e=>setValues({...values,wing:e.target.value})}><option value="">Choose a wing</option>{wings.map(w=>{const name=w.name?.en||w.name?.ta||w.slug;return <option key={w.id} value={w.id}>{name}</option>})}</select></label><Input label="Phone" value={values.phone} onChange={e=>setValues({...values,phone:e.target.value})}/><label className="field"><span>Bio</span><textarea value={values.bio} onChange={e=>setValues({...values,bio:e.target.value})}/></label><Button loading={loading}>Save and submit profile</Button></form></Card></div></section>
}

export function PassPage() {
  const { id } = useParams()
  const [pass, setPass] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/member/registrations/${id}/pass`)
      .then((response) => setPass(response.data.data))
      .catch((err) => setError(err?.response?.data?.message || 'Could not load pass'))
  }, [id])

  return (
    <section className="section">
      <div className="container">
        {error ? (
          <Card>{error}</Card>
        ) : pass ? (
          <Card className="qr-card">
            <h2>{pass.event?.title?.en || pass.event?.title?.ta}</h2>
            {pass.qr && <img src={pass.qr} alt="Event QR pass" />}
            <p><strong>{pass.passCode}</strong></p>
          </Card>
        ) : (
          <Skeleton className="qr-card" />
        )}
      </div>
    </section>
  )
}
