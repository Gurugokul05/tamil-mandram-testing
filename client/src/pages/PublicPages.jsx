import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CalendarDays, MapPin, Share2, Search, Instagram, Linkedin, X } from 'lucide-react'
import { api } from '../lib/api'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Button, Card, SectionHeading, Badge, Skeleton, ErrorState, EmptyState, Input } from '../components/ui'

const fallback = 'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=1000&q=85'
const getError = (e) => e?.response?.data?.message || 'Could not load this content.'

export function About() {
  const [site,setSite]=useState(null); const [team,setTeam]=useState([]); const [loading,setLoading]=useState(true); const {local}=useLanguage()
  useEffect(()=>{Promise.all([api.get('/public/site'),api.get('/public/team')]).then(([a,b])=>{setSite(a.data.data);setTeam(b.data.data)}).catch(()=>{}).finally(()=>setLoading(false))},[])
  return <>
    <PageHero tamil="எங்களைப் பற்றி" english="About Tamil Mandram"/>
    <section className="section light"><div className="container split"><div><SectionHeading tamil="எங்கள் கதை" english="Our Story"/><p className="lead">{loading?'Loading our story…':local(site?.about)||'A student-led literary community celebrating Tamil language and culture.'}</p></div><img className="rounded-image" src={site?.heroImage?.url||fallback} alt="Tamil Mandram community"/></div></section>
    <section className="section"><div className="container"><SectionHeading tamil="நமது இலக்கு" english="Vision & Mission" align="center"/><div className="three-grid">
      {[['காட்சி','Vision','To keep Tamil imagination alive in the next generation.'],['பணி','Mission','Create spaces for literature, performance, research, and fellowship.'],['உறுதி','Values','Inclusive, curious, compassionate, and proudly rooted.']].map(([ta,en,text])=><Card key={ta}><span className="big-letter">{ta.slice(0,1)}</span><h3>{ta}</h3><small>{en}</small><p>{text}</p></Card>)}
    </div></div></section>
    <section className="section indigo-section"><div className="container"><SectionHeading tamil="நமது பயணம்" english="Milestones" align="center" light/><div className="timeline">{['2019|Mandram founded','2021|First digital literary festival','2024|Regional cultural exchange','2027|A decade of student voices'].map(t=>{const [year,text]=t.split('|');return <div key={year}><strong>{year}</strong><span>{text}</span></div>})}</div></div></section>
    <section className="section"><div className="container"><SectionHeading tamil="ஆசிரியர் ஒருங்கிணைப்பாளர்" english="Faculty Coordinator"/><div className="coordinator-grid">{team.filter(t=>t.group==='faculty').map(t=><Card className="person-card" key={t.id}><img src={t.photo?.url||fallback} alt={t.photo?.alt||t.name}/><h3>{t.name}</h3><p>{local(t.role)}</p><a href={`mailto:${t.email}`}>{t.email}</a></Card>)}</div></div></section>
  </>
}

export function Events() {
  const [items,setItems]=useState([]); const [filter,setFilter]=useState('upcoming'); const [query,setQuery]=useState(''); const [loading,setLoading]=useState(true); const [error,setError]=useState(''); const {local}=useLanguage()
  const load=()=>{setLoading(true);setError('');api.get('/public/events',{params:{filter,limit:50}}).then(r=>setItems(r.data.data)).catch(e=>setError(getError(e))).finally(()=>setLoading(false))}
  useEffect(load,[filter])
  const filtered=items.filter(e=>`${local(e.title)} ${local(e.venue)} ${e.category}`.toLowerCase().includes(query.toLowerCase()))
  return <><PageHero tamil="நிகழ்வுகள்" english="Events"/><section className="section light"><div className="container">
    <div className="filter-row"><div className="tabs">{['upcoming','past','all'].map(t=><button className={filter===t?'active':''} onClick={()=>setFilter(t)} key={t}>{t[0].toUpperCase()+t.slice(1)}</button>)}</div><label className="search"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search events"/></label></div>
    {error?<ErrorState message={error} retry={load}/>:loading?<div className="events-grid">{[1,2,3].map(i=><Skeleton key={i} className="event-skeleton"/>)}</div>:filtered.length?<div className="events-grid">{filtered.map(e=><Card className="event-card" key={e.id}><div className="event-image"><img src={e.poster?.url||fallback} alt={e.poster?.alt||local(e.title)} loading="lazy"/><div className="date-badge"><strong>{new Date(e.startDate).getDate()}</strong><span>{new Date(e.startDate).toLocaleDateString('en',{month:'short'}).toUpperCase()}</span></div></div><div className="event-card-body"><Badge>{e.category}</Badge><h3>{local(e.title)}</h3><p><CalendarDays size={16}/>{new Date(e.startDate).toLocaleString()}</p><p><MapPin size={16}/>{local(e.venue)||'College Campus'}</p><Button href={`/events/${e.slug}`} variant="soft">View details</Button></div></Card>)}</div>:<EmptyState title="No events found" message="Try a different filter or search."/>}
  </div></section></>
}

export function EventDetail() {
  const {slug}=useParams(); const [event,setEvent]=useState(null); const [loading,setLoading]=useState(true); const [error,setError]=useState(''); const [notes,setNotes]=useState({teamName:'',notes:''}); const {local}=useLanguage(); const {user}=useAuth(); const {toast}=useToast()
  useEffect(()=>{api.get(`/public/events/${slug}`).then(r=>setEvent(r.data.data)).catch(e=>setError(getError(e))).finally(()=>setLoading(false))},[slug])
  const register=async(e)=>{e.preventDefault();if(!user){toast('Please login to register','error');return};try{await api.post(`/member/events/${slug}/register`,notes);toast('Registration confirmed. Your QR pass is ready.')}catch(err){toast(err?.response?.data?.message||'Registration failed','error')}}
  const share=async()=>{try{await navigator.share({title:local(event?.title),url:location.href})}catch{await navigator.clipboard.writeText(location.href);toast('Event link copied')}}
  if(loading)return <div className="container detail-loading"><Skeleton className="detail-hero"/><Skeleton className="detail-copy"/></div>
  if(error)return <div className="container"><ErrorState message={error}/></div>
  return <><div className="event-detail-hero" style={{backgroundImage:`linear-gradient(90deg,rgba(27,31,75,.96),rgba(37,42,102,.5)),url(${event.poster?.url||fallback})`}}><div className="container"><Badge>{event.category}</Badge><h1>{local(event.title)}</h1><p>{new Date(event.startDate).toLocaleString()} · {local(event.venue)}</p><Button onClick={share} variant="ghost"><Share2 size={17}/> Share</Button></div></div>
  <section className="section light"><div className="container detail-grid"><article><SectionHeading tamil="நிகழ்வு விவரம்" english="About this event"/><p className="reading-copy">{local(event.description)||local(event.summary)||'Details for this event will be announced soon.'}</p>{event.schedule?.length>0&&<><h3>Schedule</h3><div className="schedule">{event.schedule.map((item,i)=><div key={i}><strong>{item.time}</strong><span>{local(item.title)}</span></div>)}</div></>}<h3>Eligibility</h3><p>{local(event.eligibility)||'Open to all interested students.'}</p></article>
  <aside className="registration-card"><h3>Register</h3><p>{event.spotsLeft===null?'Open registration':`${event.spotsLeft} spots remaining`}</p>{user?<form onSubmit={register}><Input label="Team name (optional)" value={notes.teamName} onChange={e=>setNotes({...notes,teamName:e.target.value})}/><label className="field"><span>Notes</span><textarea value={notes.notes} onChange={e=>setNotes({...notes,notes:e.target.value})}/></label><Button className="full" loading={false}>Confirm registration</Button></form>:<div><p>Sign in to reserve a place and receive your QR pass.</p><Button href="/login" className="full">Login to register</Button></div>}</aside></div></section></>
}

export function Gallery() {
  const [items,setItems]=useState([]); const [category,setCategory]=useState('all'); const [selected,setSelected]=useState(null); const [loading,setLoading]=useState(true); const [error,setError]=useState('')
  useEffect(()=>{api.get('/public/gallery').then(r=>setItems(r.data.data)).catch(e=>setError(getError(e))).finally(()=>setLoading(false))},[])
  useEffect(()=>{const key=e=>{if(!selected)return;if(e.key==='Escape')setSelected(null);if(e.key==='ArrowRight')setSelected(s=>items[(items.findIndex(i=>i.id===s.id)+1)%items.length]);if(e.key==='ArrowLeft')setSelected(s=>items[(items.findIndex(i=>i.id===s.id)-1+items.length)%items.length])};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)},[selected,items])
  const cats=['all',...new Set(items.map(i=>i.category).filter(Boolean))]; const filtered=category==='all'?items:items.filter(i=>i.category===category)
  return <><PageHero tamil="படசேகரம்" english="Gallery"/><section className="section light"><div className="container">{error?<ErrorState message={error}/>:<><div className="chips">{cats.map(c=><button className={category===c?'active':''} onClick={()=>setCategory(c)} key={c}>{c}</button>)}</div>{loading?<div className="masonry">{[1,2,3,4,5,6].map(i=><Skeleton key={i}/>)}</div>:<div className="gallery-grid">{filtered.map(item=><button className="gallery-item" key={item.id} onClick={()=>setSelected(item)}><img src={item.image} alt={item.alt||item.title?.en||item.title?.ta||''} loading="lazy"/><span>{item.title?.en||item.title?.ta||''}</span></button>)}</div>}</>}</div></section>
  {selected&&<div className="lightbox" role="dialog" aria-modal="true" onClick={()=>setSelected(null)}><button className="lightbox-close" aria-label="Close"><X/></button><img src={selected.image} alt={selected.alt||''} onClick={e=>e.stopPropagation()}/></div>}</>
}

export function Literature() {
  const pieces=[
    {slug:'vanin-niram',title:'வானின் நிறம்',author:'Ananya S.',tag:'Poetry',time:'3 min read',excerpt:'ஒரு கவிதை — புதிய காலையின் குரலாக...',ta:true},
    {slug:'naam-vaazhum-nagaram',title:'நாம் வாழும் நகரம்',author:'Naveen R.',tag:'Essay',time:'6 min read',excerpt:'நகரத்தின் நினைவுகளைப் பேசும் ஒரு தனிப்பட்ட சிந்தனை.'},
    {slug:'pazhaiya-kaditham',title:'பழைய கடிதம்',author:'Lakshmi K.',tag:'Short story',time:'8 min read',excerpt:'மூன்று தலைமுறைகள் காக்கும் ஒரு மடல்.'},
  ]
  return <><PageHero tamil="இலக்கியம்" english="Literature"/><section className="section light"><div className="container"><SectionHeading tamil="எழுத்து மையம்" english="Reading Hub"/>  <div className="literature-grid">{pieces.map((p)=><Card className="literature-card" key={p.title}><Badge>{p.tag}</Badge><h3>{p.title}</h3><p className="excerpt">{p.excerpt}</p><div className="piece-meta"><span>{p.author}</span><span>{p.time}</span></div><Link className="text-link" to={`/literature/${p.slug}`}>Read piece</Link></Card>)}</div></div></section></>
}

export function PageHero({tamil,english}) {
  return <header className="page-hero"><div className="kolam page-kolam" aria-hidden="true"/><div className="container"><motion.h1 initial={{opacity:0,y:15}} animate={{opacity:1,y:0}}>{tamil}</motion.h1><motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.15}}>{english}</motion.p></div></header>
}

export function LiteratureReading() {
  const {slug}=useParams(); const [progress,setProgress]=useState(0)
  useEffect(()=>{const onScroll=()=>{const el=document.documentElement;const max=el.scrollHeight-el.clientHeight;setProgress(max>0?(el.scrollTop/max)*100:0)};window.addEventListener('scroll',onScroll,{passive:true});onScroll();return()=>window.removeEventListener('scroll',onScroll)},[])
  const title=slug==='vanin-niram'?'வானின் நிறம்':slug==='naam-vaazhum-nagaram'?'நாம் வாழும் நகரம்':'பழைய கடிதம்'
  return <><div className="reading-progress" style={{width:`${progress}%`}}/><section className="reading-page"><article><header><Badge>Member writing</Badge><h1>{title}</h1><p>By Ananya S. · 3 min read</p></header><p className="reading-lead">நம் வார்த்தைகளின் ஒளியில் ஒரு காலத்தின் நினைவுகள் தங்கி நிற்கின்றன.</p><p>இரவில் வானம் கருப்பாக இல்லாமல், எண்ணற்ற மொழிகளின் நிறங்களால் நிரம்பியிருந்தது. கற்காலத்து பாறைகள் போல சில நினைவுகள் நம் உள்ளத்தில் அமைதியாக அமர்ந்திருந்தன. அவை பேசாமல் இருந்தாலும், காலம் நகரும்போது ஒவ்வொரு வாசலையும் திறக்கின்றன.</p><p>மழையின் பின்னால் மறைந்திருந்த மேகங்களைப் பார்த்தபோது, புதிய தொடக்கங்களின் வாசனை தெளிவாக உணரப்பட்டது. நகரின் சத்தம் மென்மையாகக் குறைந்தது. அந்த நிமிடம் மட்டும் உலகம் ஒரு கவிதையாக இருந்தது.</p><blockquote>“ஒரு மொழி நம்மை அணைத்து வாழ வைத்தால்தான் அது நிற்கும்.”</blockquote><p>எழுத்து என்பது கால் வைக்கும் இடம் அல்ல; ஒரு படகு. அது நம் நினைவுகளின் கரையைக் கடந்துசென்று, மற்றவர்களின் குரலோடு கலந்து புதிய கதைகளை உருவாக்குகிறது.</p></article></section></>
}
