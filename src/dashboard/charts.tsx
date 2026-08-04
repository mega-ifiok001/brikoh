/** Lightweight SVG chart helpers for the Brikoh dashboard. */

export function AreaChart({
  series,
  labels,
  height = 200,
  stroke = "#E86100",
  fill = "#FF8C4A",
  className = "",
}: {
  series: number[];
  labels?: string[];
  height?: number;
  stroke?: string;
  fill?: string;
  className?: string;
}) {
  const w = 600;
  const h = 200;
  const pad = 8;
  const max = Math.max(...series) * 1.15;
  const min = Math.min(...series) * 0.6;
  const pts = series.map((v, i) => {
    const x = pad + (i / (series.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / (max - min)) * (h - pad * 2);
    return [x, y] as const;
  });
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${h} L${pts[0][0].toFixed(1)},${h} Z`;
  const id = `grad-${stroke.replace("#", "")}-${fill.replace("#", "")}`;

  return (
    <div className={className}>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }} preserveAspectRatio="none">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fill} stopOpacity="0.32" />
            <stop offset="100%" stopColor={fill} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((t) => (
          <line
            key={t}
            x1={pad}
            x2={w - pad}
            y1={h * t}
            y2={h * t}
            stroke="#E8E4DC"
            strokeDasharray="4 6"
            strokeWidth="1"
          />
        ))}
        <path d={area} fill={`url(#${id})`} />
        <path d={line} fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3.5" fill="#fff" stroke={stroke} strokeWidth="2" />
        ))}
      </svg>
      {labels && (
        <div className="mt-1 flex justify-between text-[11px] font-medium text-muted">
          {labels.map((l, i) => (
            <span key={i}>{l}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export function BarRow({
  label,
  value,
  color,
  max,
}: {
  label: string;
  value: number;
  color: string;
  max: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-ink/80">{label}</span>
        <span className="font-bold text-ink">{value}%</span>
      </div>
      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-ink/5">
        <div
          className={`h-full rounded-full ${color} transition-all duration-700`}
          style={{ width: `${(value / max) * 100}%` }}
        />
      </div>
    </div>
  );
}
