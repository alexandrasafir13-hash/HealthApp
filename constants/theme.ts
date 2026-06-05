/** Brand leaf accent on page titles */
export const leafGreen = '#3D6B5E';

/**
 * Dark sidebar palette — used by the collapsible left navigation rail
 * and mirrored in the right panel header strip.
 */
export const sidebarPalette = {
  /** Main sidebar background */
  bg: '#F8FAF9',
  /** Subtle separator lines */
  border: 'rgba(0,0,0,0.06)',
  /** Hover state for nav items */
  hover: 'rgba(42,122,114,0.05)',
  /** Active / selected nav item */
  active: 'rgba(42,122,114,0.10)',
  /** Active item left-edge accent bar */
  activeAccent: '#2A7A72',
  /** Primary text on light sidebar */
  text: '#2C3338',
  /** Secondary / muted text */
  textMuted: '#5C6570',
  /** Section label text */
  textLabel: '#8C9BA5',
  /** Status dot — checked in */
  dotGreen: '#10B981',
  /** Status dot — missed */
  dotGray: '#D1D5DB',
  /** Logo / brand name gradient start */
  brandFrom: '#2A7A72',
  /** Logo / brand name gradient end */
  brandTo: '#5BA89E',
};

/**
 * Right-panel palette — the toggleable generate/insights drawer.
 */
export const rightPanelPalette = {
  bg: '#F8FAF9',
  border: '#E2E8E6',
  headerBg: '#FFFFFF',
  tabActive: '#2A7A72',
  tabInactive: '#718096',
  tabActiveBg: '#E8F2EE',
  inputBg: '#F0F4F3',
  inputBorder: '#D1DBD8',
};

export const palette = {
  sage: '#3D6B5E',
  sageLight: '#E8F2EE',
  teal: '#2A7A72',
  tealDark: '#1F5C56',
  coral: '#E07A5F',
  amber: '#D4A24A',
  slate: '#2C3338',
  /** Secondary body text — readable on light backgrounds (mobile/outdoor) */
  slateMuted: '#4A5568',
  /** Captions, metadata, bullets */
  slateSubtle: '#5C6570',
  border: '#E2E8E6',
  white: '#FFFFFF',
  background: '#FFFFFF',
  card: '#FFFFFF',
  high: '#C45C4A',
  medium: '#D4A24A',
  low: '#3D6B5E',
  slateDark: '#1A202C',
  danger: '#E53E3E',
};

export const categoryColors: Record<string, string> = {
  sleep: '#5B7FD4',
  recovery: '#2A7A72',
  immunity: '#C45C4A',
  stress: '#9B6BB8',
  activity: '#D4A24A',
};

/** Categories with medium/high insights — section headers & Today priority */
export const categoryAttentionColor = '#EA580C';
/** Today top-priority heart + pulse line */
export const priorityHeartAmber = '#E8CF94';

export const severityColors: Record<string, string> = {
  high: palette.high,
  medium: palette.amber,
  low: palette.low,
};


/** Metric scale: good / not good / take action */
export const metricScaleColors = {
  good: '#16A34A',
  goodBg: '#BBF7D0',
  caution: '#EA580C',
  cautionBg: '#FED7AA',
  /** Soft orange tint for routine check-in banner */
  cautionBgLight: '#FFF4EB',
  action: '#DC2626',
  actionBg: '#FECACA',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };
export const radii = { sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, pill: 9999 };
export const typography = { 
  caption: 12, body: 15, subtitle: 17, title: 22, heading: 24, hero: 34 
};

/**
 * Ultra-subtle card shadow — just enough lift to separate white cards from
 * the off-white #F9FAFB background without being distracting.
 * Use on any View that has backgroundColor: palette.card.
 */
export const cardShadow = {
  boxShadow: '0px 1px 4px 0px rgba(44, 51, 56, 0.06)',
  elevation: 2,
};

/** Sidebar panel shadow — right edge lift for the dark left nav */
export const sidebarShadow = {
  boxShadow: '2px 0px 12px 0px rgba(0,0,0,0.18)',
  elevation: 8,
};

/** Right panel shadow — left edge lift for the right drawer */
export const rightPanelShadow = {
  boxShadow: '-2px 0px 12px 0px rgba(44,51,56,0.08)',
  elevation: 6,
};

