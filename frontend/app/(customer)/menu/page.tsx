import { ArrowUpRight } from 'lucide-react';
import { baduma } from '@/lib/baduma';

const categories = ['Kottu', 'Burgers', 'Fried Rice', 'Shawarma', 'Hoppers / Appa'];

export default function MenuPage() {
  return (
    <section className="baduma-simple-page" aria-labelledby="menu-title">
      <div className="baduma-kicker"><span /> FIND YOUR FAVOURITE</div>
      <h1 id="menu-title">Our <em>menu.</em></h1>
      <p className="baduma-page-copy">Ask us about today&apos;s selection and prices.</p>
      <div className="baduma-menu-grid">
        {categories.map((category, index) => (
          <a key={category} className="baduma-menu-card" href={`${baduma.whatsapp}?text=${encodeURIComponent(`Hello Baduma! I'd like to ask about ${category}.`)}`} target="_blank" rel="noopener noreferrer">
            <span className="baduma-menu-number">0{index + 1}</span><strong>{category}</strong><span className="baduma-menu-action">Ask on WhatsApp <ArrowUpRight size={16} aria-hidden="true" /></span>
          </a>
        ))}
      </div>
    </section>
  );
}
