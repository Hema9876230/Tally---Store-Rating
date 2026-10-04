import { useEffect, useRef, useState } from 'react';
import { check } from '../validate.js';

export function Brand({ light }) {
  return (
    <div className={`brand ${light ? 'light' : ''}`}>
      <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
        <rect width="30" height="30" rx="8" fill="#0E7C86" />
        <path d="M15 6.5l2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L6.4 12.8l6-.8z" fill="#F2A60C" />
      </svg>
      <span>Tally</span>
    </div>
  );
}

export function Alert({ kind = 'error', children }) {
  return <div className={`alert ${kind}`} role={kind === 'error' ? 'alert' : 'status'}>{children}</div>;
}

export function PageHead({ title, sub, action }) {
  return (
    <div className="page-head">
      <div><h1>{title}</h1>{sub && <p>{sub}</p>}</div>
      {action}
    </div>
  );
}

export function Modal({ title, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}>
        <header><h2>{title}</h2><button className="icon-btn" onClick={onClose} aria-label="Close">×</button></header>
        {children}
      </div>
    </div>
  );
}

export function FilterBar({ fields, filters, setFilters }) {
  const set = (name, value) => setFilters((s) => ({ ...s, [name]: value }));
  return (
    <div className="filters" role="search">
      {fields.map((f) =>
        f.options ? (
          <select key={f.name} aria-label={f.label} value={filters[f.name] || ''} onChange={(e) => set(f.name, e.target.value)}>
            <option value="">{f.label}</option>
            {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ) : (
          <input key={f.name} type="search" aria-label={f.label} placeholder={f.label} value={filters[f.name] || ''} onChange={(e) => set(f.name, e.target.value)} />
        )
      )}
      {Object.values(filters).some(Boolean) && <button className="btn ghost" onClick={() => setFilters({})}>Clear filters</button>}
    </div>
  );
}

function Field({ f, value, error, onChange }) {
  const [show, setShow] = useState(false);
  const id = `f-${f.name}`;
  const common = {
    id, name: f.name, value, placeholder: f.placeholder, autoComplete: f.autoComplete,
    onChange: (e) => onChange(e.target.value),
    'aria-invalid': !!error,
    'aria-describedby': error ? `${id}-msg` : f.hint ? `${id}-msg` : undefined,
  };
  let input;
  if (f.type === 'textarea') input = <textarea rows={3} {...common} />;
  else if (f.type === 'select') input = <select {...common}>{f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>;
  else if (f.type === 'password')
    input = (
      <div className="pw">
        <input {...common} type={show ? 'text' : 'password'} />
        <button type="button" className="pw-toggle" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>{show ? 'Hide' : 'Show'}</button>
      </div>
    );
  else input = <input {...common} type={f.type || 'text'} />;
  return (
    <div className={`field${error ? ' has-error' : ''}`}>
      <label htmlFor={id}>{f.label}</label>
      {input}
      {error ? <p className="field-msg err" id={`${id}-msg`}>{error}</p> : f.hint && <p className="field-msg" id={`${id}-msg`}>{f.hint}</p>}
    </div>
  );
}

// Config-driven form: validation, field errors, busy state, server errors.
export function Form({ fields, initial = {}, onSubmit, submitLabel, busyLabel, resetOnSuccess, block, onCancel }) {
  const blank = () => Object.fromEntries(fields.map((f) => [f.name, initial[f.name] ?? '']));
  const [values, setValues] = useState(blank);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (name, value) => {
    setValues((s) => ({ ...s, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
  };

  async function submit(e) {
    e.preventDefault();
    const found = check(values, fields);
    setErrors(found); setError(''); setNotice('');
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      const msg = await onSubmit(values);
      if (resetOnSuccess) setValues(blank());
      if (typeof msg === 'string') setNotice(msg);
    } catch (err) {
      setError(err.message);
      if (err.errors) setErrors(err.errors);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      {error && <Alert>{error}</Alert>}
      {notice && <Alert kind="ok">{notice}</Alert>}
      {fields.map((f) => <Field key={f.name} f={f} value={values[f.name]} error={errors[f.name]} onChange={(v) => set(f.name, v)} />)}
      <div className="form-actions">
        {onCancel && <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>}
        <button className={`btn${block ? ' block' : ''}`} disabled={busy}>{busy ? busyLabel || 'Saving…' : submitLabel}</button>
      </div>
    </form>
  );
}
