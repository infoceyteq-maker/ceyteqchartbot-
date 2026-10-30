import Link from 'next/link';
import { ArrowRight, ArrowUpRight, MessageCircle } from 'lucide-react';
import { PlatformStatus } from '@/components/platform-status';
import { brand } from '@/lib/brand';

const firstSocials = brand.socials.filter((social) => ['Facebook', 'Instagram', 'X (Twitter)'].includes(social.name));
const otherSocials = brand.socials.filter((social) => !['Facebook', 'Instagram', 'X (Twitter)'].includes(social.name));

export default function HomePage() {
  return (
    <div className="platform-shell">
      <header className="platform-nav">
        <div className="platform-nav-brand">
          <img src="/ceyteq-mark.svg" alt="" width="34" height="34" />
          <span>CEYTEQ <i /> DIGITAL PLATFORM</span>
        </div>
        <Link href="/workspace" className="platform-workspace-link">
          <span>Open workspace</span><ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </header>

      <main className="platform-main">
        <header className="platform-brand-card">
          <div className="platform-brand-kicker"><span /> A WORLD OF CONNECTION <span /></div>
          <h1>Cey<span>teq</span></h1>
          <p>CEYLON TECHNOLOGY</p>
          <div className="platform-brand-bottom">DIGITAL PLATFORM <span>✦</span> MADE FOR CONNECTION</div>
        </header>

        <PlatformStatus />

        <footer className="platform-contact" aria-labelledby="contact-title">
          <div className="platform-contact-heading">
            <div>
              <span className="platform-eyebrow">WE&apos;RE HERE FOR YOU</span>
              <h2 id="contact-title">Connect with Ceyteq<span>.</span></h2>
              <p>Questions, ideas, or just saying hello? Let&apos;s talk.</p>
            </div>
            <a href={brand.whatsapp} target="_blank" rel="noreferrer" className="platform-chat-link">
              <MessageCircle size={16} aria-hidden="true" /> Chat with us <ArrowUpRight size={15} aria-hidden="true" />
            </a>
          </div>

          <div className="platform-contact-grid">
            <div className="platform-contact-column">
              <h3>GET IN TOUCH</h3>
              <a href={`tel:${brand.hotline.replace(/[^\d+]/g, '')}`}><span>Hotline / WhatsApp</span><strong>{brand.hotline}</strong></a>
              <a href={`tel:${brand.mobile.replace(/[^\d+]/g, '')}`}><span>Mobile</span><strong>{brand.mobile}</strong></a>
              <a href={`mailto:${brand.email}`}><span>Email</span><strong>{brand.email}</strong></a>
            </div>
            <div className="platform-contact-column platform-contact-links">
              <h3>FIND US ONLINE</h3>
              <a href={brand.website} target="_blank" rel="noreferrer">ceyteq.online <ArrowUpRight size={14} aria-hidden="true" /></a>
              {firstSocials.map((social) => <a href={social.url} target="_blank" rel="noreferrer" key={social.name}>{social.name} <ArrowUpRight size={14} aria-hidden="true" /></a>)}
            </div>
            <div className="platform-contact-column platform-contact-links">
              <h3>FOLLOW ALONG</h3>
              {otherSocials.map((social) => <a href={social.url} target="_blank" rel="noreferrer" key={social.name}>{social.name} <ArrowUpRight size={14} aria-hidden="true" /></a>)}
            </div>
          </div>
        </footer>

        <div className="platform-page-footer">
          <span>© Ceyteq <span>·</span> Ceylon Technology</span>
          <Link href="/workspace">Explore your workspace <ArrowRight size={14} aria-hidden="true" /></Link>
        </div>
      </main>
    </div>
  );
}
