'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ClipboardList, ShoppingBag, ShoppingCart, UserRound } from 'lucide-react';

const items = [
  { href: '/menu', label: 'Menu', icon: ShoppingBag },
  { href: '/cart', label: 'Cart', icon: ShoppingCart },
  { href: '/track-orders', label: 'Track Orders', icon: ClipboardList },
  { href: '/profile', label: 'Profile', icon: UserRound },
] as const;

export function CustomerNavigation() {
  const pathname = usePathname();
  return (
    <nav className="baduma-nav" aria-label="Customer navigation">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href === '/profile' && pathname === '/login');
        return (
          <Link className={`baduma-nav-link${active ? ' is-active' : ''}`} href={href} key={href} aria-current={active ? 'page' : undefined}>
            <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
