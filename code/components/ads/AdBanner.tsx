/**
 * Top and bottom banner ad slots.
 *
 * Placements used in the app:
 * - Dashboard (logged-in): below Topbar (top), above Footer (bottom)
 * - Homepage: below header (top), above footer links (bottom)
 * - Policy pages (About, Terms, etc.): below header (top), after main content (bottom)
 *
 * To use Google AdSense: replace the placeholder div with an <ins> tag and load the
 * AdSense script in layout or _document. Standard banner sizes: 728×90, 320×50.
 */

'use client';

export type AdPosition = 'top' | 'bottom';

const AD_SLOT_IDS = {
  top: 'ad-slot-top',
  bottom: 'ad-slot-bottom',
} as const;

type Props = {
  position: AdPosition;
  className?: string;
};

export default function AdBanner({ position, className = '' }: Props) {
  const id = AD_SLOT_IDS[position];

  return (
    <div
      id={id}
      role="complementary"
      aria-label={`Advertisement ${position}`}
      className={`ad-banner no-print ad-banner--${position} ${className}`.trim()}
      data-ad-position={position}
    >
      {/* Replace this block with your ad code (e.g. AdSense ins tag + script). */}
      <div
        className="ad-banner__placeholder"
        style={{
          minHeight: 90,
          maxWidth: 728,
          margin: '0 auto',
          background: 'var(--sidebar-border, #e5e7eb)',
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ fontSize: 12, color: 'var(--topbar-muted, #6b7280)' }}>
          Advertisement
        </span>
      </div>
    </div>
  );
}
