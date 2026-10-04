import { Brand } from './ui.jsx';
import { Hist, StarRow } from './Stars.jsx';

const SAMPLE = { 5: 79, 4: 31, 3: 10, 2: 5, 1: 3 };

export default function AuthShell({ title, subtitle, footer, children }) {
  return (
    <div className="auth">
      <section className="auth-art">
        <Brand light />
        <div className="auth-copy">
          <h2>Ratings you can trust, store by store.</h2>
          <p>Customers rate stores from 1 to 5. Owners see who rated them. Admins keep the whole platform in order.</p>
        </div>
        <div className="sample" aria-hidden="true">
          <div className="sample-top">
            <div>
              <strong>Maple and Rye Bakery</strong>
              <span>128 ratings</span>
            </div>
            <div className="sample-score">4.5</div>
          </div>
          <StarRow value={4.5} size={20} />
          <Hist counts={SAMPLE} />
        </div>
      </section>
      <main className="auth-form">
        <div className="auth-card">
          <h1>{title}</h1>
          <p className="sub">{subtitle}</p>
          {children}
          <p className="auth-foot">{footer}</p>
        </div>
      </main>
    </div>
  );
}
