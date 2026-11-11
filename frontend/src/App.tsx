import { lazy, Suspense, useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { NavLink, Route, Routes, useNavigate } from 'react-router-dom'
import { Activity, Bell, Bot, Brain, ChevronDown, ClipboardList, Download, FileText, FlaskConical, HeartPulse, LayoutDashboard, Menu, Orbit, Settings, ShieldCheck, Timer, Users, WifiOff, X } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api, latest, metricName } from './api'
import type { Astronaut, Checkin, Evidence, Event, Metric, Mission, Notification, Protocol, Report } from './api'
import { connectionStatus, queueStatus, syncQueue } from './offline'

const AstronautScene = lazy(() => import('./AstronautScene'))
type Lang = 'en' | 'ru'
const words: Record<string, [string, string]> = {
  Dashboard: ['Dashboard', 'Панель'], Crew: ['Crew overview', 'Экипаж'], Health: ['Health monitoring', 'Мониторинг'], Mental: ['Mental health', 'Психологическое состояние'], AI: ['AI health assistant', 'ИИ-помощник'], Protocols: ['Medical protocols', 'Медицинские протоколы'], Timeline: ['Mission timeline', 'Хронология миссии'], Reports: ['Reports', 'Отчёты'], Evidence: ['Scientific evidence', 'Научные источники'], Settings: ['Settings', 'Настройки'], synthetic: ['SYNTHETIC DEMO DATA', 'СИНТЕТИЧЕСКИЕ ДЕМО-ДАННЫЕ'], overview: ['Mission health overview', 'Обзор здоровья экипажа'], selected: ['Selected astronaut', 'Выбранный астронавт'], noDiagnosis: ['Research demonstration only. Not a medical diagnosis.', 'Исследовательская демонстрация. Не является диагнозом.'], unavailable: ['No data available', 'Данные отсутствуют'], latest: ['Latest measurements', 'Последние измерения'], save: ['Save', 'Сохранить'], cancel: ['Cancel', 'Отмена'], add: ['Add astronaut', 'Добавить астронавта'], source: ['Source', 'Источник'], period: ['Period', 'Период']
}
const tr = (key: string, lang: Lang) => words[key]?.[lang === 'en' ? 0 : 1] || key
const date = (value: string, lang: Lang) => new Date(value).toLocaleString(lang === 'en' ? 'en-US' : 'ru-RU', { dateStyle: 'medium', timeStyle: 'short' })
const nav = [
  ['/', 'Dashboard', LayoutDashboard], ['/crew', 'Crew', Users], ['/health', 'Health', HeartPulse], ['/mental', 'Mental', Brain], ['/assistant', 'AI', Bot], ['/protocols', 'Protocols', ClipboardList], ['/timeline', 'Timeline', Orbit], ['/reports', 'Reports', FileText], ['/evidence', 'Evidence', FlaskConical], ['/settings', 'Settings', Settings]
] as const

function Panel({ title, children, extra, className = '' }: { title: string; children: React.ReactNode; extra?: React.ReactNode; className?: string }) {
  return <section className={`panel ${className}`}><div className="panel-head"><h2>{title}</h2>{extra}</div>{children}</section>
}
function State({ error, loading, children }: { error?: Error | null; loading?: boolean; children: React.ReactNode }) {
  if (loading) return <div className="state">Loading mission data…</div>
  if (error) return <div className="state error">{error.message}</div>
  return <>{children}</>
}
function Chart({ rows, metricKey }: { rows: Metric[]; metricKey: string }) {
  const points = rows.filter(row => row.key === metricKey).map(row => ({ date: new Date(row.sampled_at).toLocaleDateString(), value: row.value }))
  if (!points.length) return <p className="muted">No observations in this period.</p>
  return <div className="chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={points}><defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22d3ee" stopOpacity={0.45}/><stop offset="100%" stopColor="#22d3ee" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="#263147" vertical={false}/><XAxis dataKey="date" stroke="#94a3b8" tickLine={false}/><YAxis stroke="#94a3b8" domain={['dataMin - 2', 'dataMax + 2']} tickLine={false}/><Tooltip contentStyle={{ background: '#151c2c', border: '1px solid #263147', borderRadius: 10 }}/><Area type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={2} fill="url(#chartFill)"/></AreaChart></ResponsiveContainer></div>
}

function Dashboard({ person, lang, metrics, crew, notifications, loading, error }: { person?: Astronaut; lang: Lang; metrics: Metric[]; crew: Astronaut[]; notifications: Notification[]; loading: boolean; error?: Error | null }) {
  const measurements = latest(metrics)
  const featured = ['heart_rate', 'spo2', 'sleep_duration', 'stress'].map(key => measurements.find(m => m.key === key)).filter((m): m is Metric => !!m)
  return <State loading={loading} error={error}><div className="dashboard-grid"><Panel title={tr('selected', lang)} extra={<span className="eyebrow">3D · LIVE CONTROL</span>} className="scene-panel"><div className="scene-wrap"><Suspense fallback={<div className="scene-loading">Loading astronaut model…</div>}><AstronautScene /></Suspense><div className="scan-line"/></div><div className="scene-footer"><div><strong>{person?.name}</strong><span>{person?.callsign} · {person?.specialty}</span></div><span className="pill cyan">ASTRONAUT VIEW</span></div><p className="fineprint">Original animated suit model · Drag to rotate · Scroll to zoom. Anatomy assets are not yet sourced.</p></Panel><div className="dashboard-side"><Panel title={tr('overview', lang)}><div className="hero-number">{crew.length.toString().padStart(2, '0')}<small>CREW MEMBERS</small></div><div className="divider"/><p className="muted">Asteria Demonstration Mission</p><p className="fineprint">All observations are simulated. No live sensor connection.</p></Panel><Panel title={tr('latest', lang)}><div className="metric-list">{featured.map(m => <div key={m.key} className="metric-line"><span>{metricName[m.key]?.[lang === 'en' ? 0 : 1] || m.key}</span><strong>{m.value} <small>{m.unit}</small></strong></div>)}</div></Panel><Panel title="Mission messages"><div className="stack">{notifications.slice(0, 2).map(n => <div key={n.id} className="notice"><span className="dot"/><div><strong>{n.title}</strong><p>{n.detail}</p></div></div>)}</div></Panel></div></div><div className="two-col"><Panel title="Heart rate trend" extra={<span className="pill">14 DAYS</span>}><Chart rows={metrics} metricKey="heart_rate"/></Panel><Panel title="Data integrity"><div className="integrity"><ShieldCheck size={32}/><div><strong>Clearly labeled provenance</strong><p>Every seeded metric is marked “simulated demo” with its sample time. No medical thresholds are implied.</p></div></div></Panel></div></State>
}

function CrewPage({ crew, lang, role, select, refresh }: { crew: Astronaut[]; lang: Lang; role: string; select: (id: number) => void; refresh: () => void }) {
  const [editing, setEditing] = useState<Astronaut | 'new' | null>(null)
  const [form, setForm] = useState({ name: '', callsign: '', specialty: '', mission_id: 1 })
  const [message, setMessage] = useState('')
  const navigate = useNavigate()
  const open = (person: Astronaut | 'new') => { setEditing(person); setForm(person === 'new' ? { name: '', callsign: '', specialty: '', mission_id: 1 } : { name: person.name, callsign: person.callsign, specialty: person.specialty, mission_id: person.mission_id }); setMessage('') }
  const save = async (event: React.FormEvent) => { event.preventDefault(); try { await api(editing === 'new' ? '/astronauts' : `/astronauts/${(editing as Astronaut).id}`, role, { method: editing === 'new' ? 'POST' : 'PUT', body: JSON.stringify(form) }); setEditing(null); refresh() } catch (err) { setMessage((err as Error).message) } }
  const remove = async (person: Astronaut) => { if (!confirm(`Remove ${person.name} from the demo crew?`)) return; try { await api(`/astronauts/${person.id}`, role, { method: 'DELETE' }); refresh() } catch (err) { setMessage((err as Error).message) } }
  return <><div className="page-actions"><p className="muted">Four synthetic crew profiles for demonstration.</p>{role === 'admin' && <button className="primary" onClick={() => open('new')}>+ {tr('add', lang)}</button>}</div>{message && <p className="error-text">{message}</p>}<div className="crew-grid">{crew.map(person => <article className="crew-card" key={person.id}><div className="avatar">{person.name.split(' ').map(part => part[0]).join('')}</div><span className="pill cyan">{person.callsign}</span><h2>{person.name}</h2><p>{person.specialty}</p><div className="divider"/><span className="fineprint">ASTERIA DEMONSTRATION MISSION</span><div className="card-actions"><button onClick={() => { select(person.id); navigate('/') }}>Dashboard</button><button onClick={() => { select(person.id); navigate('/health') }}>History</button>{role === 'admin' && <><button onClick={() => open(person)}>Edit</button><button className="danger" onClick={() => remove(person)}>Remove</button></>}</div></article>)}</div>{editing && <div className="modal-backdrop"><form className="modal" onSubmit={save}><div className="panel-head"><h2>{editing === 'new' ? 'Add astronaut' : 'Edit astronaut'}</h2><button type="button" className="icon-button" onClick={() => setEditing(null)}><X size={20}/></button></div>{(['name', 'callsign', 'specialty'] as const).map(key => <label key={key}>{key}<input required minLength={2} maxLength={120} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}/></label>)}{message && <p className="error-text">{message}</p>}<button className="primary" type="submit">{tr('save', lang)}</button></form></div>}</>
}

function HealthPage({ person, metrics, lang, role, refresh }: { person?: Astronaut; metrics: Metric[]; lang: Lang; role: string; refresh: () => void }) {
  const [days, setDays] = useState(30)
  const [key, setKey] = useState('heart_rate')
  const [entry, setEntry] = useState({ key: 'heart_rate', value: '', unit: 'bpm' })
  const [message, setMessage] = useState('')
  const filtered = metrics.filter(m => new Date(m.sampled_at).getTime() >= Date.now() - days * 86400000)
  const add = async (event: React.FormEvent) => { event.preventDefault(); if (!person) return; try { await api(`/astronauts/${person.id}/metrics`, role, { method: 'POST', body: JSON.stringify({ ...entry, value: Number(entry.value), sampled_at: new Date().toISOString() }) }); setEntry({ ...entry, value: '' }); setMessage('Saved manual demo entry'); refresh() } catch (err) { setMessage((err as Error).message) } }
  return <><div className="page-actions"><div><strong>{person?.name}</strong><p className="muted">Sampled history · synthetic demo telemetry</p></div><div className="segmented">{[[1, '24H'], [7, '7D'], [30, '30D'], [10000, 'MISSION']].map(([value, label]) => <button key={value} className={days === value ? 'active' : ''} onClick={() => setDays(Number(value))}>{label}</button>)}</div></div><div className="health-grid">{latest(filtered).map(m => <button className={`health-card ${key === m.key ? 'selected' : ''}`} key={m.key} onClick={() => setKey(m.key)}><span>{metricName[m.key]?.[lang === 'en' ? 0 : 1] || m.key}</span><strong>{m.value}<small> {m.unit}</small></strong><span className="fineprint">{date(m.sampled_at, lang)}</span><span className="source">{m.source}</span></button>)}</div><div className="two-col"><Panel title={metricName[key]?.[lang === 'en' ? 0 : 1] || key} extra={<span className="pill">{days === 10000 ? 'MISSION' : `${days} DAYS`}</span>}><Chart rows={filtered} metricKey={key}/></Panel><Panel title="Measurement provenance"><p>These observations were generated for demonstration. Values are descriptive and are not assessed against clinical thresholds.</p><div className="divider"/><p className="fineprint">Bone and muscle measurements require periodic assessments and are not modeled as continuous sensor feeds.</p></Panel></div>{role === 'admin' && <Panel title="Manual demo entry"><form className="inline-form" onSubmit={add}><select value={entry.key} onChange={e => { const selected = latest(metrics).find(m => m.key === e.target.value); setEntry({ ...entry, key: e.target.value, unit: selected?.unit || '' }) }}>{Object.keys(metricName).map(m => <option key={m} value={m}>{metricName[m][0]}</option>)}</select><input type="number" step="any" required placeholder="Value" value={entry.value} onChange={e => setEntry({ ...entry, value: e.target.value })}/><span>{entry.unit}</span><button className="primary">Save entry</button></form>{message && <p className="fineprint">{message}</p>}</Panel>}</>
}

function MentalPage({ person, lang }: { person?: Astronaut; lang: Lang }) {
  const qc = useQueryClient()
  const [values, setValues] = useState({ mood: 3, focus: 3, stress: 3, isolation: 3, sleep: 3, comment: '' })
  const [phase, setPhase] = useState(0)
  const [seconds, setSeconds] = useState(4)
  const [running, setRunning] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const { data: checkins = [] } = useQuery({ queryKey: ['checkins', person?.id], queryFn: () => api<Checkin[]>(`/astronauts/${person!.id}/checkins`), enabled: !!person })
  const save = useMutation({ mutationFn: () => api<{ queued?: boolean }>(`/astronauts/${person!.id}/checkins`, 'astronaut', { method: 'POST', body: JSON.stringify(values) }), onSuccess: result => { if (!result.queued) qc.invalidateQueries({ queryKey: ['checkins', person?.id] }); setValues({ ...values, comment: '' }); setSaveMessage(result.queued ? 'Check-in queued for synchronization' : 'Check-in saved') } })
  useEffect(() => { if (!running) return; const timer = window.setInterval(() => setSeconds(s => { if (s > 1) return s - 1; setPhase(p => (p + 1) % 4); return 4 }), 1000); return () => clearInterval(timer) }, [running])
  return <div className="two-col"><Panel title="Mental check-in"><p className="muted">Self-report for {person?.name}. This is not a diagnosis.</p><form onSubmit={e => { e.preventDefault(); save.mutate() }}>{(['mood', 'focus', 'stress', 'isolation', 'sleep'] as const).map(key => <label className="range-row" key={key}><span>{key === 'isolation' ? 'Isolation comfort' : key === 'sleep' ? 'Sleep satisfaction' : key}</span><input type="range" min="1" max="5" value={values[key]} onChange={e => setValues({ ...values, [key]: Number(e.target.value) })}/><strong>{values[key]}/5</strong></label>)}<label>Optional comment<textarea maxLength={1000} value={values.comment} onChange={e => setValues({ ...values, comment: e.target.value })}/></label><button className="primary" disabled={save.isPending}>{save.isPending ? 'Saving…' : tr('save', lang)}</button>{save.isError && <p className="error-text">{save.error.message}</p>}{saveMessage && <p className="success-text">{saveMessage}</p>}</form></Panel><div className="stack"><Panel title="Breathing exercise"><p className="muted">4 seconds per phase · inhale, hold, exhale, hold</p><div className={`breathing ${running ? 'running' : ''}`}><span>{['Inhale', 'Hold', 'Exhale', 'Hold'][phase]}<strong>{seconds}</strong></span></div><button className="primary" onClick={() => { setRunning(!running); if (running) { setPhase(0); setSeconds(4) } }}>{running ? 'Stop exercise' : 'Start exercise'}</button></Panel><Panel title="Check-in history">{checkins.length ? checkins.map(c => <div className="history-row" key={c.id}><span>{date(c.created_at, lang)}</span><strong>Mood {c.mood}/5 · Stress {c.stress}/5</strong><small>{c.comment}</small></div>) : <p className="muted">No check-ins yet.</p>}</Panel></div></div>
}

function AssistantPage({ person, role }: { person?: Astronaut; role: string }) {
  const [question, setQuestion] = useState('Summarize recent trends and data limitations.')
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const ask = async (event: React.FormEvent) => { event.preventDefault(); if (!person) return; setBusy(true); setError(''); setAnswer(''); try { const result = await api<{ answer: string; records_used: number }>('/ai/analyze', role, { method: 'POST', body: JSON.stringify({ astronaut_id: person.id, question }) }); setAnswer(result.answer) } catch (err) { setError((err as Error).message) } finally { setBusy(false) } }
  return <div className="narrow"><Panel title="AI health assistant"><p className="muted">Gemini uses recent stored demo records and check-ins. Its interpretation is separate from calculated reports.</p><form onSubmit={ask}><label>Question<textarea required minLength={2} maxLength={2000} value={question} onChange={e => setQuestion(e.target.value)}/></label><button className="primary" disabled={busy}>{busy ? 'Analyzing…' : 'Analyze with Gemini'}</button></form>{error && <div className="state error">{error}</div>}{answer && <div className="answer"><span className="eyebrow">GEMINI INTERPRETATION</span><p>{answer}</p></div>}<p className="fineprint">No diagnosis or treatment advice. The AI service requires a server-side API key and network access.</p></Panel></div>
}

function ReportsPage({ person, lang }: { person?: Astronaut; lang: Lang }) {
  const [days, setDays] = useState(7)
  const { data, isLoading, error } = useQuery({ queryKey: ['report', person?.id, days], queryFn: () => api<Report>(`/reports/${person!.id}?days=${days}`), enabled: !!person })
  return <State loading={!person || isLoading} error={error}>
    <div className="page-actions"><div><strong>Calculated mission report</strong><p className="muted">Generated from stored measurements, independently of AI.</p></div><div className="actions"><select value={days} onChange={e => setDays(Number(e.target.value))}><option value={1}>Daily</option><option value={7}>Weekly</option><option value={30}>Monthly</option><option value={10000}>Mission</option></select><a className="button primary" href={`/api/reports/${person?.id}/pdf?days=${days}`} download><Download size={16}/> Export PDF</a></div></div>
    <Panel title={`${data?.astronaut} · ${data?.period_days} days`} extra={<span className="pill cyan">DEMO REPORT</span>}>
      <div className="report-grid"><div><span className="eyebrow">MEASUREMENTS</span><strong>{Object.keys(data?.metrics || {}).length}</strong></div><div><span className="eyebrow">CHECK-INS</span><strong>{data?.checkins.count}</strong></div><div><span className="eyebrow">CREW MEMBERS</span><strong>{data?.crew_count}</strong></div><div><span className="eyebrow">NOTIFICATIONS</span><strong>{data?.notifications_count}</strong></div></div>
      <div className="table-wrap"><table><thead><tr><th>Metric</th><th>Mean</th><th>Min</th><th>Max</th><th>Samples</th><th>Vs prior period</th></tr></thead><tbody>{Object.entries(data?.metrics || {}).map(([key, m]) => <tr key={key}><td>{metricName[key]?.[lang === 'en' ? 0 : 1] || key}</td><td>{m.mean} {m.unit}</td><td>{m.min}</td><td>{m.max}</td><td>{m.count}</td><td>{m.change_vs_previous === null ? '—' : `${m.change_vs_previous > 0 ? '+' : ''}${m.change_vs_previous} ${m.unit}`}</td></tr>)}</tbody></table></div>
      <p className="fineprint">{data?.provenance}. Generated {data && date(data.generated_at, lang)}. These descriptive statistics are not clinical assessments.</p>
    </Panel>
    <div className="report-chart"><Panel title="Heart rate observations"><Chart rows={data?.series.map((row, id) => ({ ...row, id, unit: 'bpm', source: 'stored record' })) || []} metricKey="heart_rate"/></Panel></div>
  </State>
}

function ProtocolCard({ protocol, person }: { protocol: Protocol; person?: Astronaut }) {
  const qc = useQueryClient()
  const [checked, setChecked] = useState<number[]>([])
  const [message, setMessage] = useState('')
  const { data: history = [] } = useQuery({ queryKey: ['executions', protocol.id, person?.id], queryFn: () => api<{ id: number; completed_steps: number[]; updated_at: string }[]>(`/protocols/${protocol.id}/executions?astronaut_id=${person!.id}`), enabled: !!person })
  const save = async () => { if (!person) return; try { await api(`/protocols/${protocol.id}/executions?astronaut_id=${person.id}`, 'astronaut', { method: 'POST', body: JSON.stringify(checked) }); setMessage('Checklist saved'); setChecked([]); qc.invalidateQueries({ queryKey: ['executions', protocol.id, person.id] }) } catch (err) { setMessage((err as Error).message) } }
  return <div className="protocol"><h3>{protocol.title}</h3><p>{protocol.description}</p><a href={protocol.source_url} target="_blank" rel="noreferrer">Source ↗</a>{protocol.steps.map(step => <label className="check-row" key={step.id}><input type="checkbox" checked={checked.includes(step.id)} onChange={e => setChecked(e.target.checked ? [...checked, step.id] : checked.filter(id => id !== step.id))}/>{step.text}</label>)}<button className="primary" onClick={save}>Save checklist</button>{message && <p className="fineprint">{message}</p>}{history.length > 0 && <div className="history-row"><strong>Previous execution</strong><span>{new Date(history[0].updated_at).toLocaleString()} · {history[0].completed_steps.length}/{protocol.steps.length} steps</span></div>}</div>
}

function ProtocolsPage({ person, role }: { person?: Astronaut; role: string }) {
  const qc = useQueryClient()
  const { data = [] } = useQuery({ queryKey: ['protocols'], queryFn: () => api<Protocol[]>('/protocols') })
  const [form, setForm] = useState({ title: '', description: '', source_url: '', steps: '' })
  const [message, setMessage] = useState('')
  const add = async (event: React.FormEvent) => { event.preventDefault(); try { await api('/protocols', role, { method: 'POST', body: JSON.stringify({ ...form, steps: form.steps.split('\n').map(step => step.trim()).filter(Boolean) }) }); setForm({ title: '', description: '', source_url: '', steps: '' }); setMessage('Protocol added'); qc.invalidateQueries({ queryKey: ['protocols'] }) } catch (err) { setMessage((err as Error).message) } }
  return <div className="narrow"><Panel title="Source-linked protocols">{data.length ? data.map(protocol => <ProtocolCard key={protocol.id} protocol={protocol} person={person}/>) : <div className="state">No medical protocols have been added. Add only source-verified, reviewed instructions.</div>}</Panel>{role === 'admin' && <Panel title="Add reviewed protocol"><p className="fineprint">The administrator is responsible for verifying the source and medical instructions before adding content.</p><form onSubmit={add}><label>Title<input required minLength={3} maxLength={160} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}/></label><label>Description<textarea required minLength={10} maxLength={3000} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}/></label><label>Official HTTPS source URL<input required type="url" pattern="https://.*" value={form.source_url} onChange={e => setForm({ ...form, source_url: e.target.value })}/></label><label>Checklist steps · one per line<textarea required value={form.steps} onChange={e => setForm({ ...form, steps: e.target.value })}/></label><button className="primary">Add protocol</button>{message && <p className="fineprint">{message}</p>}</form></Panel>}</div>
}

function TimelinePage({ lang }: { lang: Lang }) {
  const { data = [], isLoading, error } = useQuery({ queryKey: ['timeline'], queryFn: () => api<Event[]>('/timeline') })
  return <State loading={isLoading} error={error}><div className="narrow"><Panel title="Mission events"><div className="timeline">{data.map(event => <div className="timeline-item" key={event.id}><span className="dot"/><span className="eyebrow">{date(event.occurred_at, lang)} · {event.kind.toUpperCase()}</span><h3>{event.title}</h3><p>{event.detail}</p></div>)}</div></Panel></div></State>
}

function EvidencePage() {
  const { data = [], isLoading, error } = useQuery({ queryKey: ['evidence'], queryFn: () => api<Evidence[]>('/evidence') })
  return <State loading={isLoading} error={error}><p className="muted">Research references provide context. Public NASA research catalogs are not a live biometric data source.</p><div className="evidence-grid">{data.map(item => <Panel key={item.title} title={item.title} extra={<FlaskConical size={19}/>}><p>{item.description}</p><div className="divider"/><p className="fineprint">{item.organization} · Used for: {item.used_for}</p><a href={item.url} target="_blank" rel="noreferrer">Open official source ↗</a></Panel>)}</div></State>
}

function SettingsPage({ lang, setLang, role, setRole }: { lang: Lang; setLang: (lang: Lang) => void; role: string; setRole: (role: string) => void }) {
  return <div className="narrow"><Panel title="Demo settings"><label>Language<select value={lang} onChange={e => setLang(e.target.value as Lang)}><option value="en">English</option><option value="ru">Русский</option></select></label><label>Demo role<select value={role} onChange={e => setRole(e.target.value)}><option value="astronaut">Astronaut</option><option value="admin">Admin</option></select></label><p className="fineprint">This role selector is for a local demonstration. It is not production authentication.</p></Panel><Panel title="Data & connectivity"><p>Synthetic data is generated and stored by the backend. Charts and reports use those saved records.</p><p className="fineprint">Previously loaded data is cached for offline reading. Mental check-ins queue and sync after reconnecting. Other writes require the server.</p></Panel></div>
}

function SyncBanner({ online }: { online: boolean }) {
  const qc = useQueryClient()
  const [status, setStatus] = useState({ pending: 0, errors: 0 })
  useEffect(() => {
    const update = () => { queueStatus().then(setStatus).catch(() => {}); qc.invalidateQueries({ queryKey: ['checkins'] }); qc.invalidateQueries({ queryKey: ['timeline'] }) }
    update()
    window.addEventListener('cosmo-sync', update)
    return () => window.removeEventListener('cosmo-sync', update)
  }, [qc])
  if (online && !status.pending) return null
  return <div className="sync-banner"><WifiOff size={15}/><span>{online ? `${status.pending} check-in(s) awaiting sync${status.errors ? ` · ${status.errors} error(s)` : ''}` : `Offline · cached data available · ${status.pending} check-in(s) queued`}</span>{online && status.pending > 0 && <button onClick={() => syncQueue().catch(() => {})}>Retry sync</button>}</div>
}

export default function App() {
  const qc = useQueryClient()
  const [lang, setLang] = useState<Lang>(() => localStorage.getItem('cosmo-lang') === 'ru' ? 'ru' : 'en')
  const [role, setRole] = useState(() => localStorage.getItem('cosmo-role') || 'astronaut')
  const [personId, setPersonId] = useState(() => Number(localStorage.getItem('cosmo-person') || 1))
  const [menuOpen, setMenuOpen] = useState(false)
  const [online, setOnline] = useState(connectionStatus)
  const [showNotices, setShowNotices] = useState(false)
  const [notificationFilter, setNotificationFilter] = useState('all')
  useEffect(() => { localStorage.setItem('cosmo-lang', lang); localStorage.setItem('cosmo-role', role); localStorage.setItem('cosmo-person', String(personId)) }, [lang, role, personId])
  useEffect(() => { const update = () => setOnline(connectionStatus()); window.addEventListener('online', update); window.addEventListener('offline', update); window.addEventListener('cosmo-connectivity', update); return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); window.removeEventListener('cosmo-connectivity', update) } }, [])
  const { data: missions = [] } = useQuery({ queryKey: ['missions'], queryFn: () => api<Mission[]>('/missions') })
  const missionDay = missions[0] ? Math.max(1, Math.floor((Date.now() - new Date(missions[0].started_at).getTime()) / 86400000) + 1) : '—'
  const { data: crew = [], isLoading, error } = useQuery({ queryKey: ['crew'], queryFn: () => api<Astronaut[]>('/astronauts') })
  const person = crew.find(p => p.id === personId) || crew[0]
  const { data: metrics = [] } = useQuery({ queryKey: ['metrics', person?.id], queryFn: () => api<Metric[]>(`/astronauts/${person!.id}/metrics?days=10000`), enabled: !!person })
  const { data: notifications = [] } = useQuery({ queryKey: ['notifications'], queryFn: () => api<Notification[]>('/notifications') })
  const readNotice = async (id: number) => { await api(`/notifications/${id}/read`, role, { method: 'PATCH' }); qc.invalidateQueries({ queryKey: ['notifications'] }) }
  const refresh = () => { qc.invalidateQueries({ queryKey: ['crew'] }); qc.invalidateQueries({ queryKey: ['metrics'] }) }
  return <div className="app-shell"><aside className={`sidebar ${menuOpen ? 'open' : ''}`}><div className="brand"><div className="brand-mark"><Activity size={22}/></div><div><strong>COSMO<span>HEALTH</span>X</strong><small>MISSION HEALTH SYSTEM</small></div></div><div className="side-label">MISSION CONTROL</div><nav>{nav.map(([path, label, Icon]) => <NavLink key={path} end={path === '/'} to={path} onClick={() => setMenuOpen(false)} className={({ isActive }) => isActive ? 'active' : ''}><Icon size={18}/><span>{tr(label, lang)}</span></NavLink>)}</nav><div className="side-bottom"><div className="system-status"><span className={`dot ${online ? '' : 'offline-dot'}`}/>{online ? 'SYSTEM ONLINE' : 'OFFLINE'}</div><p>ASTERIA · DEMO MISSION<br/>MISSION DAY {missionDay}</p></div></aside><div className="main-area"><header className="topbar"><button className="icon-button mobile-menu" onClick={() => setMenuOpen(!menuOpen)}><Menu/></button><div className="breadcrumb"><span>MISSION CONTROL</span><span>/</span><strong>COSMOHEALTHX</strong></div><div className="top-actions"><span className="demo-badge">{tr('synthetic', lang)}</span>{!online && <span className="offline"><WifiOff size={15}/> Offline</span>}<select aria-label="Demo profile" value={person?.id || ''} onChange={e => setPersonId(Number(e.target.value))}>{crew.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select><button className="icon-button notification-button" aria-label="Notifications" onClick={() => setShowNotices(!showNotices)}><Bell size={19}/>{notifications.some(n => !n.read) && <span className="unread-dot"/>}</button><select aria-label="Language" value={lang} onChange={e => setLang(e.target.value as Lang)}><option value="en">EN</option><option value="ru">RU</option></select></div></header><SyncBanner online={online}/>{showNotices && <div className="notice-popover"><div className="panel-head"><h2>Notifications</h2><button className="icon-button" onClick={() => setShowNotices(false)}><X size={18}/></button></div><select aria-label="Notification filter" value={notificationFilter} onChange={e => setNotificationFilter(e.target.value)}><option value="all">All</option><option value="unread">Unread</option><option value="info">Info</option><option value="warning">Warning</option><option value="critical">Critical</option></select>{notifications.filter(n => notificationFilter === "all" || (notificationFilter === "unread" ? !n.read : n.level === notificationFilter)).map(n => <div className="popover-notice" key={n.id}><strong>{n.title}</strong><p>{n.detail}</p><small>{date(n.created_at, lang)}</small>{!n.read && <button onClick={() => readNotice(n.id)}>Mark read</button>}</div>)}</div>}<main><div className="page-heading"><div><span className="eyebrow">ASTERIA / HEALTH INTELLIGENCE</span><h1>{tr(nav.find(([path]) => path === location.pathname)?.[1] || 'Dashboard', lang)}</h1><p>{tr('noDiagnosis', lang)}</p></div><div className="heading-icon"><Activity size={24}/></div></div><Routes><Route path="/" element={<Dashboard person={person} lang={lang} metrics={metrics} crew={crew} notifications={notifications} loading={isLoading} error={error}/>}/><Route path="/crew" element={<CrewPage crew={crew} lang={lang} role={role} select={setPersonId} refresh={refresh}/>}/><Route path="/health" element={<HealthPage person={person} metrics={metrics} lang={lang} role={role} refresh={refresh}/>}/><Route path="/mental" element={<MentalPage person={person} lang={lang}/>}/><Route path="/assistant" element={<AssistantPage person={person} role={role}/>}/><Route path="/protocols" element={<ProtocolsPage person={person} role={role}/>}/><Route path="/timeline" element={<TimelinePage lang={lang}/>}/><Route path="/reports" element={<ReportsPage person={person} lang={lang}/>}/><Route path="/evidence" element={<EvidencePage/>}/><Route path="/settings" element={<SettingsPage lang={lang} setLang={setLang} role={role} setRole={setRole}/>}/></Routes></main></div></div>
}


