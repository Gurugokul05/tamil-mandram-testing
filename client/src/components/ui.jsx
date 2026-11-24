import { ArrowRight, LoaderCircle } from 'lucide-react'

export function Button({ children, variant = 'primary', className = '', loading = false, href, ...props }) {
  const classes = `btn btn-${variant} ${className}`
  if (href) return <a className={classes} href={href} {...props}>{children}</a>
  return <button className={classes} disabled={loading || props.disabled} {...props}>{loading && <LoaderCircle className="spin" size={18}/>} {children}</button>
}

export function SectionHeading({ tamil, english, align = 'left', light = false }) {
  return (
    <header className={`section-heading ${align === 'center' ? 'center' : ''} ${light ? 'light' : ''}`}>
      <h2>{tamil}</h2>
      <p>{english}</p>
    </header>
  )
}

export function Card({ children, className = '', onClick }) {
  return <article className={`card ${className}`} onClick={onClick}>{children}</article>
}

export function Badge({ children, tone = 'gold' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>
}

export function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} />
}

export function ErrorState({ title = 'Something went wrong', message, retry }) {
  return (
    <div className="error-state" role="alert">
      <strong>{title}</strong>
      {message && <p>{message}</p>}
      {retry && <Button variant="outline" onClick={retry}>Try again</Button>}
    </div>
  )
}

export function EmptyState({ title, message, action }) {
  return <div className="empty-state"><div className="empty-mark">அ</div><h3>{title}</h3><p>{message}</p>{action}</div>
}

export function Input({ label, error, className = '', ...props }) {
  return (
    <label className={`field ${className}`}>
      <span>{label}</span>
      <input {...props} aria-invalid={Boolean(error)} />
      {error && <small className="field-error">{error}</small>}
    </label>
  )
}
