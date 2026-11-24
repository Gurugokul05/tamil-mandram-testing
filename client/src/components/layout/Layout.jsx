import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Instagram, Facebook, Youtube, Menu, X, Languages, UserRound } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'

const nav = [
  ['/', 'Home', 'முகப்பு'], ['/about', 'About', 'எங்களைப் பற்றி'], ['/events', 'Events', 'நிகழ்வுகள்'],
  ['/gallery', 'Gallery', 'படசேகரம்'], ['/literature', 'Literature', 'இலக்கியம்'], ['/team', 'Team', 'அணி'], ['/contact', 'Contact', 'தொடர்பு'],
]

export default function Layout() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { language, toggle } = useLanguage()
  const { user } = useAuth()
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  useEffect(() => { setOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }, [location.pathname])

  return (
    <>
      <nav className={`navbar ${scrolled || location.pathname !== '/' ? 'solid' : ''}`} aria-label="Primary navigation">
        <Link className="brand" to="/" aria-label="Tamil Mandram home">
          <span className="brand-mark">த</span>
          <span><strong>தமிழ் மன்றம்</strong><small>Tamil Mandram</small></span>
        </Link>
        <div className={`nav-links ${open ? 'open' : ''}`}>
          {nav.map(([path, en, ta]) => <NavLink key={path} to={path} end={path === '/'}>{language === 'ta' ? ta : en}</NavLink>)}
        </div>
        <div className="nav-actions">
          <button className="language-toggle" onClick={toggle} aria-label="Switch language"><Languages size={17}/><span>{language === 'ta' ? 'EN' : 'தமிழ்'}</span></button>
          <Link className="profile-link" to={user ? (['president','faculty_coordinator'].includes(user.role) ? '/admin' : '/dashboard') : '/login'} aria-label={user ? 'Open profile' : 'Login'}>
            <UserRound size={18}/><span>{user ? 'Profile' : 'Login'}</span>
          </Link>
          <button className="menu-button" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Toggle menu">{open ? <X/> : <Menu/>}</button>
        </div>
      </nav>
      <main><Outlet /></main>
      <Footer />
    </>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div><div className="brand footer-brand"><span className="brand-mark">த</span><span><strong>தமிழ் மன்றம்</strong><small>Tamil Mandram</small></span></div><p>மொழியால் இணைவோம்<br/>United by language, rooted in culture.</p></div>
        <div><strong>Explore</strong><Link to="/about">About</Link><Link to="/events">Events</Link><Link to="/gallery">Gallery</Link><Link to="/literature">Literature</Link></div>
        <div><strong>Community</strong><Link to="/team">Our team</Link><Link to="/contact">Contact</Link><Link to="/login">Member login</Link></div>
        <div><strong>Follow</strong><div className="socials"><a href="#" aria-label="Instagram"><Instagram/></a><a href="#" aria-label="Facebook"><Facebook/></a><a href="#" aria-label="YouTube"><Youtube/></a></div></div>
      </div>
      <div className="proverb">“யாதும் ஊழ்” — What is destined is not escaped</div>
    </footer>
  )
}
