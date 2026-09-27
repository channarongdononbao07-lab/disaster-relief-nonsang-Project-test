'use client';
import { useId } from 'react';

export default function WarningTowerLogo({ size = 36, className = '' }) {
  const id = useId();
  const fireGradId = `fireGrad-${id}`;
  const glowGradId = `glowGrad-${id}`;
  const shadowId = `shadow-${id}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={className}
      style={{ overflow: 'visible' }}
    >
      <defs>
        {/* Gradient หลัก */}
        <linearGradient id={fireGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD93D" />
          <stop offset="50%" stopColor="#FF8C42" />
          <stop offset="100%" stopColor="#E63946" />
        </linearGradient>

        {/* Gradient เรืองแสง */}
        <radialGradient id={glowGradId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFD93D" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#E63946" stopOpacity="0" />
        </radialGradient>

        {/* เงา */}
        <filter id={shadowId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#8B0000" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* คลื่นสัญญาณรัศมี 3 ระดับฝั่งซ้าย (กระจายออกด้านข้างและกระพริบช้าๆ) */}
      <path
        d="M26 68 C16 78 12 90 12 100 C12 110 16 122 26 132"
        stroke="#FFD93D"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
        opacity="0.85"
      >
        <animate attributeName="opacity" values="0.35;0.95;0.35" dur="2.4s" repeatCount="indefinite" begin="0.5s" />
      </path>
      <path
        d="M17 56 C4 70 0 85 0 100 C0 115 4 130 17 144"
        stroke="#FFA94D"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        opacity="0.65"
      >
        <animate attributeName="opacity" values="0.25;0.85;0.25" dur="2.4s" repeatCount="indefinite" begin="0.25s" />
      </path>
      <path
        d="M8 44 C-6 60 -10 80 -10 100 C-10 120 -6 140 8 156"
        stroke="#FFD93D"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        opacity="0.4"
      >
        <animate attributeName="opacity" values="0.15;0.7;0.15" dur="2.4s" repeatCount="indefinite" begin="0s" />
      </path>

      {/* คลื่นสัญญาณรัศมี 3 ระดับฝั่งขวา (กระจายออกด้านข้างและกระพริบช้าๆ) */}
      <path
        d="M174 68 C184 78 188 90 188 100 C188 110 184 122 174 132"
        stroke="#FFD93D"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
        opacity="0.85"
      >
        <animate attributeName="opacity" values="0.35;0.95;0.35" dur="2.4s" repeatCount="indefinite" begin="0.5s" />
      </path>
      <path
        d="M183 56 C196 70 200 85 200 100 C200 115 196 130 183 144"
        stroke="#FFA94D"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        opacity="0.65"
      >
        <animate attributeName="opacity" values="0.25;0.85;0.25" dur="2.4s" repeatCount="indefinite" begin="0.25s" />
      </path>
      <path
        d="M192 44 C206 60 210 80 210 100 C210 120 206 140 192 156"
        stroke="#FFD93D"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        opacity="0.4"
      >
        <animate attributeName="opacity" values="0.15;0.7;0.15" dur="2.4s" repeatCount="indefinite" begin="0s" />
      </path>

      {/* วงแหวนเรืองแสงด้านนอก */}
      <circle cx="100" cy="100" r="90" fill={`url(#${glowGradId})`} />

      {/* โล่หลัก */}
      <path
        d="M100 15 L170 45 L170 105 Q170 155 100 185 Q30 155 30 105 L30 45 Z"
        fill={`url(#${fireGradId})`}
        stroke="#8B0000"
        strokeWidth="3"
        filter={`url(#${shadowId})`}
      />

      {/* สามเหลี่ยมเตือนด้านใน */}
      <path
        d="M100 65 L135 130 L65 130 Z"
        fill="#FFF8E7"
        stroke="#8B0000"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* เครื่องหมายตกใจ */}
      <rect x="96" y="85" width="8" height="25" rx="4" fill="#E63946" />
      <circle cx="100" cy="118" r="4.5" fill="#E63946" />

      {/* คลื่นสัญญาณซ้าย-ขวา ภายในโล่ */}
      <path d="M45 100 Q40 90 45 80" stroke="#FFD93D" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M155 100 Q160 90 155 80" stroke="#FFD93D" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}
