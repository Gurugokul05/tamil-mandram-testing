import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, CalendarDays, MapPin, Users, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useLanguage } from '../context/LanguageContext'
import { Button, Card, SectionHeading, Badge, Skeleton, ErrorState } from '../components/ui'

const fallbackImage = 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=85'

export default function Home() {
  const { local } = useLanguage()
  const [site, setSite] = useState(null)
  const [events, setEvents] = useState([])
  const [gallery, setGallery] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const load = async () => {
    setLoading(true); setError('')
    try {
      const [siteRes, eventsRes, galleryRes] = await Promise.all([
        api.get('/public/site'), api.get('/public/events', { params: { filter: 'upcoming', limit: 3 } }), api.get('/public/gallery'),
      ])
      setSite(siteRes.data.data); setEvents(eventsRes.data.data); setGallery(galleryRes.data.data.slice(0, 6))
    } catch (e) { setError(e?.response?.data?.message || 'Could not load the Mandram feed.') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  return (
    <>
      <section className="hero">
        <div className="kolam hero-kolam" aria-hidden="true"/>
        <div className="floating-letters" aria-hidden="true"><span>அ</span><span>த்</span><span>ழ்</span></div>
        <motion.div className="hero-content" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8 }}>
          <Badge tone="outline">EST. {site?.establishedYear || '2019'} · COLLEGE LITERARY CLUB</Badge>
          <h1>{local(site?.tagline) || 'மொழியால் இணைவோம்'}<em>{local(site?.clubName) || 'Tamil Mandram'}</em></h1>
          <p className="hero-subtitle">{local(site?.tagline) || 'United by language, rooted in culture.'}</p>
          <div className="hero-actions">
            <Button href="/membership">Join the Mandram <ArrowRight size={18}/></Button>
            <Button href="/events" variant="ghost">Explore Events</Button>
          </div>
        </motion.div>
      </section>

      {error && <div className="container"><ErrorState message={error} retry={load}/></div>}

      <section className="section light about-preview">
        <div className="container split">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <SectionHeading tamil="எங்கள் கதை" english="Our Story"/>
            <p className="lead">{local(site?.intro) || 'A gathering place for young voices, classic verse, and the many forms of Tamil culture.'}</p>
            <p>{local(site?.about) || 'Tamil Mandram nurtures literature, debate, performance, and cultural fellowship across the campus.'}</p>
            <Link className="text-link" to="/about">Discover our Mandram <ArrowRight size={17}/></Link>
          </motion.div>
          <motion.div className="about-image" initial={{ opacity: 0, scale: .96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
            <img src={site?.heroImage?.url || fallbackImage} alt={site?.heroImage?.alt || 'Students gathered for a Tamil literary event'} loading="lazy"/>
          </motion.div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading tamil="வரவிருக்கும் நிகழ்வுகள்" english="Upcoming Events"/>
          {loading ? <div className="events-grid">{[1,2,3].map(i => <Skeleton key={i} className="event-skeleton"/>)}</div> :
            <div className="events-grid">{events.map((event) => (
              <Card className="event-card" key={event.id}>
                <div className="event-image"><img src={event.poster?.url || fallbackImage} alt={event.poster?.alt || local(event.title)} loading="lazy"/><div className="date-badge"><strong>{new Date(event.startDate).getDate()}</strong><span>{new Date(event.startDate).toLocaleDateString('en', {month:'short'}).toUpperCase()}</span></div></div>
                <div className="event-card-body"><Badge>{event.category}</Badge><h3>{local(event.title)}</h3><p><CalendarDays size={16}/>{new Date(event.startDate).toLocaleDateString()}</p><p><MapPin size={16}/>{local(event.venue) || 'College Campus'}</p><Button href={`/events/${event.slug}`} variant="soft">View event <ArrowRight size={16}/></Button></div>
              </Card>
            ))}</div>}
        </div>
      </section>

      <section className="stats-strip">
        {(site?.stats || [
          {key:'members',value:250,suffix:'+'},{key:'events',value:48,suffix:''},{key:'achievements',value:16,suffix:''},
        ]).map((stat) => <div key={stat.key}><strong>{stat.value}{stat.suffix}</strong><span>{stat.key}</span></div>)}
      </section>

      <section className="section spotlight">
        <div className="container spotlight-grid">
          <div><SectionHeading tamil="இலக்கியக் கண்ணோட்டம்" english="Literature Spotlight"/></div>
          <blockquote><Sparkles size={22}/><p>“கற்றது கைம்மண்ணளவு, கல்லாதது உலகளவு.”</p><cite>— திருவள்ளுவர் · What is learned is but a handful; the rest of the world, much more.</cite></blockquote>
        </div>
      </section>

      <section className="section light">
        <div className="container">
          <SectionHeading tamil="நினைவுகள்" english="Gallery"/>
          {loading ? <div className="masonry">{[1,2,3,4,5,6].map(i => <Skeleton key={i}/>)}</div> :
            <div className="masonry">{gallery.map((item) => <img key={item.id} src={item.image} alt={item.alt || local(item.title)} loading="lazy"/>)}<Link className="text-link gallery-link" to="/gallery">View full gallery <ArrowRight size={17}/></Link></div>}
        </div>
      </section>

      <section className="join-band">
        <div><span>மன்றக் குடும்பத்தில் சேருங்கள்</span><h2>Bring your voice. Shape our culture.</h2></div>
        <Button href="/membership" variant="ivory">Join the Mandram <ArrowRight size={18}/></Button>
      </section>
    </>
  )
}
