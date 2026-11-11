export type Astronaut = { id: number; name: string; callsign: string; specialty: string; mission_id: number; active: boolean }
export type Metric = { id: number; key: string; value: number; unit: string; source: string; sampled_at: string }
export type Checkin = { id: number; mood: number; focus: number; stress: number; isolation: number; sleep: number; comment: string; created_at: string }
export type Notification = { id: number; level: string; title: string; detail: string; read: boolean; created_at: string }
export type Event = { id: number; title: string; detail: string; kind: string; occurred_at: string }
export type Report = { astronaut: string; period_days: number; generated_at: string; provenance: string; metrics: Record<string, { mean: number; min: number; max: number; count: number; unit: string }>; checkins: { count: number; mean_mood: number | null; mean_stress: number | null } }
export type Evidence = { title: string; organization: string; url: string; description: string; used_for: string }
export type Protocol = { id: number; title: string; description: string; source_url: string; steps: { id: number; position: number; text: string }[] }

export async function api<T>(path: string, role = 'astronaut', options: RequestInit = {}): Promise<T> {
  const response = await fetch('/api' + path, { ...options, headers: { 'Content-Type': 'application/json', 'X-Demo-Role': role, ...options.headers } })
  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try { message = (await response.json()).detail || message } catch { /* keep status */ }
    throw new Error(message)
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>
}

export const latest = (metrics: Metric[]) => Object.values(metrics.reduce<Record<string, Metric>>((map, metric) => {
  if (!map[metric.key] || map[metric.key].sampled_at < metric.sampled_at) map[metric.key] = metric
  return map
}, {}))

export const metricName: Record<string, [string, string]> = {
  heart_rate: ['Heart rate', 'Пульс'], hrv: ['Heart rate variability', 'Вариабельность пульса'], spo2: ['Blood oxygen', 'Кислород в крови'], respiratory_rate: ['Respiratory rate', 'Частота дыхания'], sleep_duration: ['Sleep duration', 'Длительность сна'], sleep_quality: ['Sleep quality', 'Качество сна'], radiation_exposure: ['Radiation exposure', 'Радиационное воздействие'], stress: ['Stress', 'Стресс'], mood: ['Mood', 'Настроение'], focus: ['Focus', 'Концентрация'], activity: ['Physical activity', 'Физическая активность'], hydration: ['Hydration', 'Гидратация']
}
