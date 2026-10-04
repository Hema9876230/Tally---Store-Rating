import { useState } from 'react';

// Read-only stars with fractional fill (e.g. 4.6).
export function StarRow({ value = 0, size = 18 }) {
  const pct = (Math.max(0, Math.min(5, value)) / 5) * 100;
  return (
    <span className="stars" style={{ fontSize: size }} role="img" aria-label={`${value} out of 5 stars`}>
      <span className="stars-bg" aria-hidden="true">★★★★★</span>
      <span className="stars-fg" aria-hidden="true" style={{ width: `${pct}%` }}>★★★★★</span>
    </span>
  );
}

// Interactive 1–5 selector.
export function StarInput({ value, onChange, disabled, label = 'Your rating' }) {
  const [hover, setHover] = useState(0);
  return (
    <span className="star-input" role="radiogroup" aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          disabled={disabled}
          className={n <= (hover || value || 0) ? 'on' : ''}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
        >
          ★
        </button>
      ))}
    </span>
  );
}

// Horizontal distribution bars, 5 down to 1.
export function Hist({ counts }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  return (
    <div className="hist">
      {[5, 4, 3, 2, 1].map((n, i) => (
        <div className="hist-row" key={n}>
          <span>{n}</span>
          <span className="bar"><i style={{ width: `${(counts[n] / total) * 100}%`, animationDelay: `${i * 70}ms` }} /></span>
          <span className="hist-n">{counts[n]}</span>
        </div>
      ))}
    </div>
  );
}
