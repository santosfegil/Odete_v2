import { forwardRef } from 'react';
import { getIconComponent } from '../lib/iconMap';

interface ShareableMedalCardProps {
  medal: {
    name: string;
    icon: string;
    description: string;
    earned_at?: string;
  };
}

const ShareableMedalCard = forwardRef<HTMLDivElement, ShareableMedalCardProps>(
  ({ medal }, ref) => {
    const earnedDate = medal.earned_at
      ? new Date(medal.earned_at).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })
      : null;

    return (
      <div
        ref={ref}
        style={{
          width: 400,
          padding: 40,
          background: 'linear-gradient(145deg, #FFFBEB, #FEF3C7, #FDE68A)',
          borderRadius: 32,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'rgba(251, 191, 36, 0.2)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -30,
            left: -30,
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'rgba(251, 191, 36, 0.15)',
          }}
        />

        {/* Icon */}
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'rgba(253, 230, 138, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#D97706',
            boxShadow: '0 8px 32px rgba(217, 119, 6, 0.2)',
          }}
        >
          {getIconComponent(medal.icon, '', 56)}
        </div>

        {/* Title */}
        <h2
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: '#78350F',
            textAlign: 'center',
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          {medal.name}
        </h2>

        {/* Description */}
        <p
          style={{
            fontSize: 14,
            color: '#92400E',
            textAlign: 'center',
            margin: 0,
            lineHeight: 1.5,
            maxWidth: 300,
          }}
        >
          {medal.description}
        </p>

        {/* Date */}
        {earnedDate && (
          <p
            style={{
              fontSize: 11,
              color: '#B45309',
              textAlign: 'center',
              margin: 0,
              fontWeight: 600,
              letterSpacing: 1,
              textTransform: 'uppercase',
            }}
          >
            Conquistada em {earnedDate}
          </p>
        )}

        {/* Divider */}
        <div
          style={{
            width: '60%',
            height: 1,
            background: 'rgba(180, 83, 9, 0.2)',
          }}
        />

        {/* Branding */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: '#78350F',
              letterSpacing: -0.5,
            }}
          >
            Odete
          </span>
          <span
            style={{
              fontSize: 11,
              color: '#B45309',
              fontWeight: 500,
            }}
          >
            Sua assistente financeira
          </span>
        </div>
      </div>
    );
  }
);

ShareableMedalCard.displayName = 'ShareableMedalCard';

export default ShareableMedalCard;
