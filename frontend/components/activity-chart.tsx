'use client';

import type { Message } from '@/lib/types';
import { demoActivity } from '@/lib/demo';

function points(values: number[], max: number) {
  return values.map((value, i) => ({ x: 16 + i * 84, y: 162 - (value / max) * 125 }));
}
function smooth(points: { x: number; y: number }[]) {
  return points.reduce((path, point, i) => {
    if (!i) return `M ${point.x} ${point.y}`;
    const prev = points[i - 1];
    const mid = (prev.x + point.x) / 2;
    return `${path} C ${mid} ${prev.y}, ${mid} ${point.y}, ${point.x} ${point.y}`;
  }, '');
}

export function ActivityChart({ demo, messages }: { demo: boolean; messages: Message[] }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(); date.setHours(0, 0, 0, 0); date.setDate(date.getDate() - (6 - i)); return date;
  });
  const received = days.map((day) => messages.filter((message) => {
    const date = new Date((message.messageTimestamp || 0) * 1000);
    return date.toDateString() === day.toDateString() && !message.key?.fromMe;
  }).length);
  const sent = days.map((day) => messages.filter((message) => {
    const date = new Date((message.messageTimestamp || 0) * 1000);
    return date.toDateString() === day.toDateString() && message.key?.fromMe;
  }).length);
  const first = demo ? demoActivity.received : received;
  const second = demo ? demoActivity.sent : sent;
  const max = Math.max(4, ...first, ...second) * 1.15;
  const line1 = smooth(points(first, max));
  const line2 = smooth(points(second, max));
  return <div className="chart-wrap" aria-label={`${demo ? 'Sample ' : ''}messages received and sent during the last seven days`}>
    <svg viewBox="0 0 536 190" preserveAspectRatio="none" role="img">
      <defs><linearGradient id="chart-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#67baf4" stopOpacity=".29" /><stop offset="100%" stopColor="#67baf4" stopOpacity="0" /></linearGradient></defs>
      {[36, 78, 120, 162].map((y) => <line key={y} x1="16" x2="520" y1={y} y2={y} stroke="#d7e0e7" strokeDasharray="4 6" />)}
      <path d={`${line1} L 520 162 L 16 162 Z`} fill="url(#chart-fill)" />
      <path d={line2} fill="none" stroke="#aebfd1" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="5 6" />
      <path d={line1} fill="none" stroke="#64b8ef" strokeWidth="3.5" strokeLinecap="round" />
      {points(first, max).map((point, i) => <circle key={i} cx={point.x} cy={point.y} r="3.5" fill="#eff5f8" stroke="#63b5ea" strokeWidth="2" />)}
      {days.map((day, i) => <text key={i} x={16 + i * 84} y="187" textAnchor={i === 0 ? 'start' : i === 6 ? 'end' : 'middle'} className="chart-label">{day.toLocaleDateString('en', { weekday: 'short' })}</text>)}
    </svg>
  </div>;
}
