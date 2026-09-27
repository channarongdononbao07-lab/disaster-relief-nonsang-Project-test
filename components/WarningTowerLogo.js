'use client';
import Image from 'next/image';

export default function WarningTowerLogo({ size = 36, className = '' }) {
  return (
    <Image
      src="/logo.png"
      alt="โลโก้เทศบาลตำบลโนนสัง"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain', borderRadius: '50%' }}
      priority
    />
  );
}
