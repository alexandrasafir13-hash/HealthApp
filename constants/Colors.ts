import { palette } from './theme';

const tintColorLight = palette.teal;
const tintColorDark = palette.sageLight;

export default {
  light: {
    text: palette.slate,
    background: palette.background,
    tint: tintColorLight,
    tabIconDefault: '#6B7280',
    tabIconSelected: tintColorLight,
    card: palette.card,
    muted: palette.slateMuted,
    subtle: palette.slateSubtle,
    border: palette.border,
  },
  dark: {
    text: '#F3F4F6',
    background: '#111827',
    tint: tintColorDark,
    tabIconDefault: '#6B7280',
    tabIconSelected: tintColorDark,
    card: '#1F2937',
    muted: '#D1D5DB',
    subtle: '#9CA3AF',
    border: '#374151',
  },
};
