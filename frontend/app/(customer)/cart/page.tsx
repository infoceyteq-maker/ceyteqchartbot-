import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { baduma } from '@/lib/baduma';

export default function CartPage() {
  return (
    <section className="baduma-simple-page" aria-labelledby="cart-title">
      <div className="baduma-kicker"><span /> YOUR SELECTION</div>
      <h1 id="cart-title">Your <em>cart.</em></h1>
      <div className="baduma-empty-card">
        <span className="baduma-benefit-icon"><ShoppingCart size={21} aria-hidden="true" /></span>
        <h2>Online cart coming soon</h2>
        <p>For an order, please contact Baduma directly.</p>
        <div className="baduma-page-actions"><a className="baduma-secondary-button" href={baduma.whatsapp} target="_blank" rel="noopener noreferrer">Message on WhatsApp</a><Link className="baduma-text-link" href="/menu">View menu</Link></div>
      </div>
    </section>
  );
}
