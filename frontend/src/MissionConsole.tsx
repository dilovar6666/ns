import { lazy, Suspense, useState } from 'react'
import { Activity, ArrowUpRight, HeartPulse, Radio, ShieldCheck, Siren, Users, Wifi } from 'lucide-react'
import { latest } from './api'
import type { Astronaut, Metric, Notification } from './api'
import './mission-console.css'

const AstronautScene = lazy(() => import('./AstronautScene'))

type Props = {
  person?: Astronaut
  crew: Astronaut[]
  metrics: Metric[]
  notifications: Notification[]
  loading: boolean
  error?: Error | null
  select: (id: number) => void
}

const vitalKeys = [
  { key: 'heart_rate', label: 'HEART RATE', icon: HeartPulse, color: 'rose' },
  { key: 'spo2', label: 'BLOOD OXYGEN', icon: Activity, color: 'cyan' },
  { key: 'hrv', label: 'HEART RATE VARIABILITY', icon: Activity, color: 'violet' },
  { key: 'stress', label: 'STRESS SCORE', icon: Activity, color: 'mint' },
] as const

export default function MissionConsole({ person, crew, metrics, notifications, loading, error, select }: Props) {
  const [station, setStation] = useState<'space' | 'earth'>('space')
  const [drill, setDrill] = useState(false)
  const current = latest(metrics)
  const get = (key: string) => current.find(item => item.key === key)
  const lastUpdate = current.reduce<string | null>((value, item) => !value || item.sampled_at > value ? item.sampled_at : value, null)

  if (loading) return <div className="state">Loading mission data…</div>
  if (error) return <div className="state error">{error.message}</div>

  return <div className={`mission-console ${drill ? 'drill-active' : ''}`}>
    <div className="console-header">
      <div className="console-title"><span className="console-kicker"><Radio size={14}/> ASTERIA / MISSION HEALTH NETWORK</span><h2>{station === 'space' ? 'Space station' : 'Earth control'} <span>console</span></h2><p>{station === 'space' ? 'Onboard crew view · local records' : 'Ground view · stored mission records'} · Synthetic demonstration</p></div>
      <div className="console-controls"><div className="station-switch" role="group" aria-label="Station view"><button aria-pressed={station === 'space'} className={station === 'space' ? 'active' : ''} onClick={() => setStation('space')}>SPACE</button><button aria-pressed={station === 'earth'} className={station === 'earth' ? 'active' : ''} onClick={() => setStation('earth')}>EARTH</button></div><button aria-pressed={drill} className={`drill-button ${drill ? 'active' : ''}`} onClick={() => setDrill(!drill)}><Siren size={16}/>{drill ? 'END DRILL' : 'SIMULATE DRILL'}</button></div>
    </div>

    <div className={`console-status ${drill ? 'alert' : ''}`}><div><span className="console-status-dot"/><strong>{drill ? 'SIMULATED ALERT ACTIVE' : 'MISSION DATA LINK READY'}</strong><span>{drill ? 'Training scenario only — no clinical event recorded' : 'Displaying stored demo data · no live sensors connected'}</span></div><span><Wifi size={14}/> {station === 'space' ? 'LOCAL VIEW' : 'GROUND VIEW'}</span></div>

    <div className="console-vitals">{vitalKeys.map(({ key, label, icon: Icon, color }) => { const metric = get(key); return <div className={`console-vital ${color}`} key={key}><div className="console-vital-head"><span><Icon size={17}/>{label}</span><i>{metric ? 'RECORDED' : 'NO DATA'}</i></div><div className="console-vital-value">{metric ? metric.value : '—'}<small>{metric?.unit || ''}</small></div><div className="console-vital-foot">{metric ? new Date(metric.sampled_at).toLocaleDateString() : 'Awaiting observation'}<span>{metric?.source || '—'}</span></div><div className="console-vital-bar"/></div> })}</div>

    <div className="console-workspace">
      <section className="console-card console-crew"><div className="console-card-head"><div><span className="console-overline">MISSION PERSONNEL</span><h3><Users size={17}/> Crew profiles</h3></div><span className="console-count">{crew.length.toString().padStart(2, '0')}</span></div><p className="console-subtitle">Select a member to inspect their stored health record.</p><div className="console-crew-list">{crew.map((member, index) => <button key={member.id} className={`console-crew-member ${member.id === person?.id ? 'selected' : ''}`} onClick={() => select(member.id)}><span className="console-serial">{String(index + 1).padStart(2, '0')}</span><span className="console-avatar">{member.name.split(' ').map(part => part[0]).join('')}</span><span className="console-member-info"><strong>{member.name}</strong><small>{member.specialty}</small><em>{member.callsign}</em></span><ArrowUpRight size={15}/></button>)}</div><div className="console-crew-bottom"><span className="console-status-dot"/> {crew.length} demo profiles available</div></section>

      <section className="console-card console-model"><div className="console-card-head"><div><span className="console-overline">ACTIVE SUBJECT / {person?.callsign || '—'}</span><h3>Suit visualization</h3></div><span className="console-live">3D MODEL</span></div><div className="console-model-stage"><div className="console-reticle"><span>01</span><span>02</span><span>03</span></div><Suspense fallback={<div className="console-loading">Loading astronaut model…</div>}><AstronautScene/></Suspense><div className="console-model-caption">ROTATE · DRAG <span>ZOOM · SCROLL</span></div></div><div className="console-model-foot"><div><strong>{person?.name || 'Select crew member'}</strong><span>{person?.specialty || ''}</span></div><span>ORIGINAL SUIT ASSET</span></div></section>

      <section className="console-card console-intel"><div className="console-card-head"><div><span className="console-overline">{station === 'space' ? 'ONBOARD STATUS' : 'GROUND STATUS'}</span><h3><ShieldCheck size={17}/> Mission intelligence</h3></div></div><div className="console-intel-block"><span>SELECTED ASTRONAUT</span><strong>{person?.name || '—'}</strong><small>{person?.callsign || ''} · {person?.specialty || ''}</small></div><div className="console-intel-block"><span>LAST STORED OBSERVATION</span><strong>{lastUpdate ? new Date(lastUpdate).toLocaleString() : 'No data'}</strong><small>{current.length} measurement types available</small></div><div className="console-intel-block"><span>{station === 'space' ? 'EDGE RECORDS' : 'GROUND ARCHIVE'}</span><strong>{station === 'space' ? 'Local review' : 'Mission history'}</strong><small>{station === 'space' ? 'Offline reading available after first load' : 'Review reports and long-term trends'}</small></div><div className="console-intel-events"><span className="console-overline">MISSION MESSAGES</span>{notifications.length ? notifications.slice(0, 2).map(note => <div className="console-event" key={note.id}><span className="console-event-dot"/><div><strong>{note.title}</strong><p>{note.detail}</p></div></div>) : <p>No messages recorded.</p>}</div></section>
    </div>
    <div className="console-provenance">COSMOHEALTHX · ASTROMIND-INSPIRED CONSOLE <span>All displayed health observations are synthetic. Drill mode changes the display only.</span></div>
  </div>
}
