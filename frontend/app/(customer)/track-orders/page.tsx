import { ClipboardList } from 'lucide-react';
import { baduma } from '@/lib/baduma';

export default function TrackOrdersPage() {
  return (
    <section className="baduma-simple-page" aria-labelledby="track-title">
      <div className="baduma-kicker"><span /> ORDER UPDATES</div>
      <h1 id="track-title">Track your <em>order.</em></h1>
      <div className="baduma-empty-card">
        <span className="baduma-benefit-icon"><ClipboardList size={21} aria-hidden="true" /></span>
        <h2>Need an update?</h2>
        <p>Online tracking is not connected yet. Send us your order details and we&apos;ll help.</p>
        <div className="baduma-page-actions"><a className="baduma-secondary-button" href={baduma.whatsapp} target="_blank" rel="noopener noreferrer">Message on WhatsApp</a><a className="baduma-text-link" href={baduma.phone}>Call Baduma</a></div>
      </div>
    </section>
  );
}
