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
  background: '#F7FAF9',
  card: '#FFFFFF',
  high: '#C45C4A',
  medium: '#D4A24A',
  low: '#3D6B5E',
};

export const categoryColors: Record<string, string> = {
  sleep: '#5B7FD4',
  recovery: '#2A7A72',
  immunity: '#C45C4A',
  stress: '#9B6BB8',
  activity: '#D4A24A',
};

export const severityColors: Record<string, string> = {
  high: palette.high,
  medium: palette.amber,
  low: palette.low,
};
