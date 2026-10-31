import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Facebook, Instagram, MapPin, MessageCircle, Phone, PhoneCall } from 'lucide-react';
import { CustomerNavigation } from '@/components/baduma/customer-navigation';
import { baduma } from '@/lib/baduma';
import './customer.css';

export const metadata: Metadata = {
  title: 'Baduma | Customer',
  description: 'Baduma customer menu, orders and account.',
  icons: { icon: '/baduma/logo.png' },
};

const heroLinks = [
  { label: 'Facebook', href: baduma.facebook, icon: Facebook, external: true },
  { label: 'Instagram', href: baduma.instagram, icon: Instagram, external: true },
  { label: 'WhatsApp', href: baduma.whatsapp, icon: MessageCircle, external: true },
  { label: 'Location', href: baduma.maps, icon: MapPin, external: true },
  { label: 'Call us', href: baduma.phone, icon: PhoneCall, external: false },
] as const;

export default function CustomerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="baduma-shell bd-min-h-screen bd-w-full bd-antialiased">
      <div className="baduma-wrap bd-mx-auto">
        <header className="baduma-header bd-flex bd-items-center bd-justify-between">
          <Link href="/menu" className="baduma-header-brand" aria-label="Baduma menu">
            <Image src="/baduma/logo.png" alt="බැදුම" width={144} height={62} priority />
          </Link>
          <CustomerNavigation />
        </header>

        <section className="baduma-hero" aria-label="Baduma restaurant and contact links">
          <div className="baduma-hero-image" aria-hidden="true" />
          <div className="baduma-hero-copy bd-flex bd-flex-col">
            <Image className="baduma-hero-logo" src="/baduma/logo.png" alt="බැදුම" width={288} height={124} priority />
            <div className="baduma-hero-divider" />
            <p className="baduma-hero-label">CONNECT WITH US</p>
            <div className="baduma-socials bd-flex bd-flex-wrap">
              {heroLinks.map(({ label, href, icon: Icon, external }) => (
                <a
                  className="baduma-social-button"
                  href={href}
                  key={label}
                  target={external ? '_blank' : undefined}
                  rel={external ? 'noopener noreferrer' : undefined}
                  aria-label={`${label} ${label === 'Location' ? 'on Google Maps' : 'Baduma'}`}
                >
                  <Icon size={16} strokeWidth={1.9} aria-hidden="true" />
                  <span>{label}</span>
                </a>
              ))}
            </div>
          </div>
        </section>

        <main id="customer-content">{children}</main>

        <footer className="baduma-footer">
          <div className="baduma-footer-brand">
            <Image src="/baduma/logo.png" alt="බැදුම" width={140} height={60} />
            <p>Owner: <strong>Sadun Chamila</strong></p>
          </div>
          <div className="baduma-footer-section">
            <span className="baduma-footer-title">FIND US</span>
            <a href={baduma.maps} target="_blank" rel="noopener noreferrer">
              <MapPin size={17} aria-hidden="true" />
              <span>Address: Baduma.malgammana,<br />Pilimatalawa, Kandy</span>
            </a>
          </div>
          <div className="baduma-footer-section">
            <span className="baduma-footer-title">GET IN TOUCH</span>
            <div className="baduma-footer-contact">
              <Phone size={17} aria-hidden="true" />
              <span>Phone / WhatsApp:<br /><a href={baduma.phone}>+94 77 070 1682</a> <span aria-hidden="true">/</span> <a href={baduma.whatsapp} target="_blank" rel="noopener noreferrer">+94 77 948 1682</a></span>
            </div>
            <a className="baduma-footer-email" href={baduma.email}>Sadunchamila405@gmail.com</a>
          </div>
          <p className="baduma-footer-bottom">© {new Date().getFullYear()} Baduma</p>
        </footer>
      </div>
    </div>
  );
}
