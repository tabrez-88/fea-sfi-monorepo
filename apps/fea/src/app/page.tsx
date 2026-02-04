import { DealStatus } from '@sfi-fea/shared';

export default function HomePage() {
  return (
    <main className="container">
      <h1>SFI-FEA</h1>
      <p>Settlement & Financial Infrastructure Platform</p>

      <section className="status-section">
        <h2>System Status</h2>
        <ul>
          <li>Frontend: Running</li>
          <li>Available Deal Statuses: {Object.values(DealStatus).join(', ')}</li>
        </ul>
      </section>

      <section className="links-section">
        <h2>Quick Links</h2>
        <ul>
          <li>
            <a href="/deals">Deals</a> (TODO)
          </li>
          <li>
            <a href="/settlements">Settlements</a> (TODO)
          </li>
          <li>
            <a href="/reports">Reports</a> (TODO)
          </li>
        </ul>
      </section>
    </main>
  );
}
