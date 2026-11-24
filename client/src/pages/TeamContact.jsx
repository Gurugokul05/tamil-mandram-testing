import { useEffect, useState } from 'react'
import { Instagram, Linkedin, Mail, MapPin, Phone } from 'lucide-react'
import { api } from '../lib/api'
import { useLanguage } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'
import { Button, Card, SectionHeading, Skeleton, ErrorState, Input } from '../components/ui'
import { PageHero } from './PublicPages'

const fallback='https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=700&q=85'

export function Team() {
  const [team,setTeam]=useState([]); const [loading,setLoading]=useState(true); const [error,setError]=useState(''); const {local}=useLanguage()
  const load=()=>{setLoading(true);api.get('/public/team').then(r=>setTeam(r.data.data)).catch(e=>setError(e?.response?.data?.message||'Could not load the team')).finally(()=>setLoading(false))}
  useEffect(load,[])
  const president=team.find(t=>t.role?.en?.toLower?.().includes('president'))
  const rest=team.filter(t=>t!==president)
  return <><PageHero tamil="எங்கள் அணி" english="Team"/><section className="section light"><div className="container">
    {error?<ErrorState retry={load} message={error}/>:loading?<div className="team-grid">{[1,2,3,4].map(i=><Skeleton key={i} className="team-skeleton"/>)}</div>:<>
      {president&&<Card className="president-card"><img src={president.photo?.url||fallback} alt={president.photo?.alt||president.name}/><div><small>President</small><h2>{president.name}</h2><p>{local(president.role)}</p><p>{local(president.bio)}</p></div></Card>}
      <div className="team-grid">{rest.map(t=><Card className="person-card" key={t.id}><img src={t.photo?.url||fallback} alt={t.photo?.alt||t.name}/><h3>{t.name}</h3><p>{local(t.role)}</p><div className="person-links">{t.email&&<a href={`mailto:${t.email}`} aria-label="Email"><Mail size={17}/></a>}{t.socials?.linkedin&&<a href={t.socials.linkedin} aria-label="LinkedIn"><Linkedin size={17}/></a>}{t.socials?.instagram&&<a href={t.socials.instagram} aria-label="Instagram"><Instagram size={17}/></a>}</div></Card>)}</div>
    </>}
  </div></section></>
}

export function Contact() {
  const [site,setSite]=useState(null); const [values,setValues]=useState({name:'',email:'',phone:'',subject:'',message:''}); const [errors,setErrors]=useState({}); const [loading,setLoading]=useState(false); const {toast}=useToast(); const {local}=useLanguage()
  useEffect(()=>api.get('/public/site').then(r=>setSite(r.data.data)).catch(()=>{}),[])
  const submit=async e=>{e.preventDefault();const next={};if(values.name.trim().length<2)next.name='Please enter your name';if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))next.email='Enter a valid email';if(values.message.trim().length<10)next.message='Please write at least 10 characters';setErrors(next);if(Object.keys(next).length)return;setLoading(true);try{await api.post('/public/contact',values);toast('Message sent successfully');setValues({name:'',email:'',phone:'',subject:'',message:''})}catch(err){toast(err?.response?.data?.message||'Could not send your message','error')}finally{setLoading(false)}}
  return <><PageHero tamil="தொடர்பு" english="Contact"/><section className="section light"><div className="container contact-grid"><div><SectionHeading tamil="எழுதுங்கள்" english="Send a Message"/><form className="contact-form" onSubmit={submit}><div className="two-fields"><Input label="Name" value={values.name} error={errors.name} onChange={e=>setValues({...values,name:e.target.value})}/><Input label="Email" type="email" value={values.email} error={errors.email} onChange={e=>setValues({...values,email:e.target.value})}/></div><div className="two-fields"><Input label="Phone" value={values.phone} onChange={e=>setValues({...values,phone:e.target.value})}/><Input label="Subject" value={values.subject} onChange={e=>setValues({...values,subject:e.target.value})}/></div><label className="field"><span>Message</span><textarea value={values.message} onChange={e=>setValues({...values,message:e.target.value})}/>{errors.message&&<small className="field-error">{errors.message}</small>}</label><Button loading={loading}>Send message</Button></form></div><aside className="contact-info"><h3>Mandram Office</h3><p><MapPin size={18}/>{local(site?.address)||'College Campus, Tamil Nadu'}</p><p><Mail size={18}/>{site?.email||'hello@tamilmandram.test'}</p><p><Phone size={18}/>{site?.phone||'+91 00000 00000'}</p><div className="map-placeholder"><div className="kolam"/><span>Campus map placeholder</span></div></aside></div></section></>
}
