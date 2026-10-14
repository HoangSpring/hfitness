import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export function ProgressChart({ data, height = 240 }: { data: Array<{ date: string; weight: number }>; height?: number }) {
  if (!data.length) return null;
  return <ResponsiveContainer width="100%" height={height}>
    <LineChart data={data} margin={{ top: 12, right: 16, bottom: 4, left: 0 }}>
      <XAxis dataKey="date" tick={{ fill: 'var(--color-muted)', fontSize: 12 }} tickLine={false} axisLine={false} />
      <YAxis dataKey="weight" unit=" kg" tick={{ fill: 'var(--color-muted)', fontSize: 12 }} tickLine={false} axisLine={false} width={58} domain={['auto', 'auto']} />
      <Tooltip formatter={(value) => [`${Number(value ?? 0)} kg`, 'Weight']} labelFormatter={(label) => String(label)} contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-card-border)', borderRadius: 'var(--radius-sm)' }} />
      <Line type="linear" dataKey="weight" stroke="var(--color-accent)" strokeWidth={3} dot={{ fill: 'var(--color-accent)', r: data.length === 1 ? 5 : 3 }} activeDot={{ r: 6 }} />
    </LineChart>
  </ResponsiveContainer>;
}

export function ActivityChart({ counts, labels }: { counts: number[]; labels: string[] }) {
  return <ResponsiveContainer width="100%" height={150}>
    <LineChart data={counts.map((count, index) => ({ label: labels[index], count }))} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
      <XAxis dataKey="label" tick={{ fill: 'var(--color-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
      <YAxis allowDecimals={false} hide />
      <Tooltip formatter={(value) => [Number(value ?? 0), 'Completed workouts']} contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-card-border)', borderRadius: 'var(--radius-sm)' }} />
      <Line type="monotone" dataKey="count" stroke="var(--color-success)" strokeWidth={3} dot={{ fill: 'var(--color-success)', r: 4 }} />
    </LineChart>
  </ResponsiveContainer>;
}
