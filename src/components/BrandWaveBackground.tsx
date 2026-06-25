interface Props {
  className?: string;
}

const ELECTROLYTE_BLUE = '#00D8FF';

export default function BrandWaveBackground({ className = '' }: Props) {
  return (
    <svg
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      viewBox="0 0 430 120"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Radial cockpit glow behind logo */}
        <radialGradient id="cockpitGlow" cx="18%" cy="50%" r="55%">
          <stop offset="0%" stopColor={ELECTROLYTE_BLUE} stopOpacity="0.14" />
          <stop offset="35%" stopColor={ELECTROLYTE_BLUE} stopOpacity="0.06" />
          <stop offset="100%" stopColor={ELECTROLYTE_BLUE} stopOpacity="0" />
        </radialGradient>

        {/* Electrolyte accent radial */}
        <radialGradient id="tealGlow" cx="60%" cy="40%" r="35%">
          <stop offset="0%" stopColor={ELECTROLYTE_BLUE} stopOpacity="0.08" />
          <stop offset="100%" stopColor={ELECTROLYTE_BLUE} stopOpacity="0" />
        </radialGradient>

        {/* Telemetry line gradient */}
        <linearGradient id="trackGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={ELECTROLYTE_BLUE} stopOpacity="0" />
          <stop offset="15%" stopColor={ELECTROLYTE_BLUE} stopOpacity="0.18" />
          <stop offset="40%" stopColor={ELECTROLYTE_BLUE} stopOpacity="0.32" />
          <stop offset="65%" stopColor={ELECTROLYTE_BLUE} stopOpacity="0.22" />
          <stop offset="85%" stopColor={ELECTROLYTE_BLUE} stopOpacity="0.10" />
          <stop offset="100%" stopColor={ELECTROLYTE_BLUE} stopOpacity="0" />
        </linearGradient>

        {/* Electrolyte track gradient */}
        <linearGradient id="tealTrackGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={ELECTROLYTE_BLUE} stopOpacity="0" />
          <stop offset="30%" stopColor={ELECTROLYTE_BLUE} stopOpacity="0.14" />
          <stop offset="55%" stopColor={ELECTROLYTE_BLUE} stopOpacity="0.26" />
          <stop offset="80%" stopColor={ELECTROLYTE_BLUE} stopOpacity="0.12" />
          <stop offset="100%" stopColor={ELECTROLYTE_BLUE} stopOpacity="0" />
        </linearGradient>

        {/* Soft glow filter for HUD rings */}
        <filter id="hudGlow" x="-15%" y="-15%" width="130%" height="130%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Stronger glow for data nodes */}
        <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ===== BACKGROUND LAYER ===== */}
      {/* Cockpit radial glow behind logo */}
      <rect x="0" y="0" width="430" height="120" fill="url(#cockpitGlow)" />
      <rect x="0" y="0" width="430" height="120" fill="url(#tealGlow)" />

      {/* ===== HUD RING SYSTEM — Left side behind logo ===== */}
      {/* Outer HUD arc */}
      <path
        d="M -15,60 A 75,75 0 0,1 135,60"
        fill="none"
        stroke={ELECTROLYTE_BLUE}
        strokeWidth="1.0"
        opacity="0.20"
        strokeLinecap="round"
        filter="url(#hudGlow)"
      />
      {/* Mid HUD arc */}
      <path
        d="M -5,60 A 65,65 0 0,1 125,60"
        fill="none"
        stroke={ELECTROLYTE_BLUE}
        strokeWidth="1.4"
        opacity="0.14"
        strokeLinecap="round"
      />
      {/* Inner HUD arc — electrolyte accent */}
      <path
        d="M 10,60 A 50,50 0 0,1 110,60"
        fill="none"
        stroke={ELECTROLYTE_BLUE}
        strokeWidth="1.0"
        opacity="0.22"
        strokeLinecap="round"
        filter="url(#hudGlow)"
      />

      {/* HUD tick marks on outer arc */}
      <line x1="15" y1="15" x2="20" y2="20" stroke={ELECTROLYTE_BLUE} strokeWidth="1.0" opacity="0.28" strokeLinecap="round" />
      <line x1="55" y1="-5" x2="55" y2="3" stroke={ELECTROLYTE_BLUE} strokeWidth="1.0" opacity="0.24" strokeLinecap="round" />
      <line x1="100" y1="12" x2="95" y2="18" stroke={ELECTROLYTE_BLUE} strokeWidth="1.0" opacity="0.28" strokeLinecap="round" />
      <line x1="-5" y1="40" x2="5" y2="42" stroke={ELECTROLYTE_BLUE} strokeWidth="1.0" opacity="0.30" strokeLinecap="round" />

      {/* ===== TELEMETRY TRACKS — Flowing right from HUD ===== */}
      {/* Track 1: Upper energy stream — telemetry-style segmented path */}
      <path
        d="M 125,32 L 155,28 L 180,38 L 210,22 L 240,30 L 275,18 L 310,26 L 345,16 L 380,22 L 415,14 L 445,18"
        fill="none"
        stroke="url(#trackGrad)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#hudGlow)"
      />
      {/* Track 1 data nodes */}
      <circle cx="155" cy="28" r="2.5" fill={ELECTROLYTE_BLUE} opacity="0.45" filter="url(#nodeGlow)" />
      <circle cx="180" cy="38" r="1.5" fill={ELECTROLYTE_BLUE} opacity="0.35" />
      <circle cx="210" cy="22" r="2.5" fill={ELECTROLYTE_BLUE} opacity="0.50" filter="url(#nodeGlow)" />
      <circle cx="240" cy="30" r="1.5" fill={ELECTROLYTE_BLUE} opacity="0.30" />
      <circle cx="275" cy="18" r="2.5" fill={ELECTROLYTE_BLUE} opacity="0.38" filter="url(#nodeGlow)" />
      <circle cx="310" cy="26" r="1.5" fill={ELECTROLYTE_BLUE} opacity="0.35" />
      <circle cx="345" cy="16" r="2.5" fill={ELECTROLYTE_BLUE} opacity="0.45" filter="url(#nodeGlow)" />
      <circle cx="380" cy="22" r="1.5" fill={ELECTROLYTE_BLUE} opacity="0.30" />
      <circle cx="415" cy="14" r="2" fill={ELECTROLYTE_BLUE} opacity="0.32" filter="url(#nodeGlow)" />

      {/* Track 2: Mid primary route — bolder, more prominent */}
      <path
        d="M 125,60 L 165,55 L 200,68 L 235,50 L 275,62 L 315,45 L 355,58 L 395,42 L 435,52 L 465,46"
        fill="none"
        stroke="url(#trackGrad)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#hudGlow)"
      />
      {/* Track 2 data nodes — larger, more prominent */}
      <circle cx="165" cy="55" r="3" fill={ELECTROLYTE_BLUE} opacity="0.55" filter="url(#nodeGlow)" />
      <circle cx="200" cy="68" r="2" fill={ELECTROLYTE_BLUE} opacity="0.40" />
      <circle cx="235" cy="50" r="3" fill={ELECTROLYTE_BLUE} opacity="0.60" filter="url(#nodeGlow)" />
      <circle cx="275" cy="62" r="2" fill={ELECTROLYTE_BLUE} opacity="0.35" />
      <circle cx="315" cy="45" r="3" fill={ELECTROLYTE_BLUE} opacity="0.42" filter="url(#nodeGlow)" />
      <circle cx="355" cy="58" r="2" fill={ELECTROLYTE_BLUE} opacity="0.40" />
      <circle cx="395" cy="42" r="3" fill={ELECTROLYTE_BLUE} opacity="0.50" filter="url(#nodeGlow)" />
      <circle cx="435" cy="52" r="2" fill={ELECTROLYTE_BLUE} opacity="0.36" filter="url(#nodeGlow)" />

      {/* Track 3: Lower data stream */}
      <path
        d="M 125,88 L 160,92 L 195,80 L 230,95 L 265,82 L 300,98 L 340,85 L 380,94 L 420,80 L 455,88"
        fill="none"
        stroke="url(#trackGrad)"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.75"
        filter="url(#hudGlow)"
      />
      {/* Track 3 data nodes */}
      <circle cx="160" cy="92" r="2" fill={ELECTROLYTE_BLUE} opacity="0.35" />
      <circle cx="195" cy="80" r="2.5" fill={ELECTROLYTE_BLUE} opacity="0.45" filter="url(#nodeGlow)" />
      <circle cx="230" cy="95" r="1.5" fill={ELECTROLYTE_BLUE} opacity="0.30" />
      <circle cx="265" cy="82" r="2.5" fill={ELECTROLYTE_BLUE} opacity="0.40" filter="url(#nodeGlow)" />
      <circle cx="300" cy="98" r="1.5" fill={ELECTROLYTE_BLUE} opacity="0.28" />
      <circle cx="340" cy="85" r="2.5" fill={ELECTROLYTE_BLUE} opacity="0.38" filter="url(#nodeGlow)" />
      <circle cx="380" cy="94" r="2" fill={ELECTROLYTE_BLUE} opacity="0.30" />
      <circle cx="420" cy="80" r="2" fill={ELECTROLYTE_BLUE} opacity="0.30" filter="url(#nodeGlow)" />

      {/* ===== ELECTROLYTE CONNECTOR BRIDGE — between tracks ===== */}
      <path
        d="M 210,22 L 235,50 M 240,30 L 275,62 M 275,18 L 315,45 M 345,16 L 355,58"
        fill="none"
        stroke={ELECTROLYTE_BLUE}
        strokeWidth="0.8"
        opacity="0.18"
        strokeLinecap="round"
      />

      {/* ===== FAINT GRID LINES — depth layer ===== */}
      <line x1="160" y1="0" x2="160" y2="120" stroke={ELECTROLYTE_BLUE} strokeWidth="0.5" opacity="0.06" />
      <line x1="270" y1="0" x2="270" y2="120" stroke={ELECTROLYTE_BLUE} strokeWidth="0.5" opacity="0.05" />
      <line x1="360" y1="0" x2="360" y2="120" stroke={ELECTROLYTE_BLUE} strokeWidth="0.5" opacity="0.06" />
      <line x1="0" y1="40" x2="430" y2="40" stroke={ELECTROLYTE_BLUE} strokeWidth="0.5" opacity="0.04" />
      <line x1="0" y1="80" x2="430" y2="80" stroke={ELECTROLYTE_BLUE} strokeWidth="0.5" opacity="0.04" />

      {/* ===== DIRECTION ARROW — small cockpit indicator on right ===== */}
      <polygon points="410,10 418,14 410,18" fill={ELECTROLYTE_BLUE} opacity="0.20" />
      <circle cx="405" cy="14" r="1.5" fill={ELECTROLYTE_BLUE} opacity="0.35" filter="url(#nodeGlow)" />

    </svg>
  );
}
