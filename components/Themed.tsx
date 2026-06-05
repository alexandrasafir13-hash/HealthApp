/**
 * Learn more about Light and Dark modes:
 * https://docs.expo.io/guides/color-schemes/
 */
import { Text as DefaultText, View as DefaultView, StyleSheet } from 'react-native';

import { capitalizeSentences } from '@/lib/formatText';

import { useColorScheme } from './useColorScheme';

import Colors from '@/constants/Colors';

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

export type TextProps = ThemeProps & DefaultText['props'];
export type ViewProps = ThemeProps & DefaultView['props'];

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useColorScheme();
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}

function getFontFamily(fontWeight: any) {
  if (fontWeight === '800' || fontWeight === '900') return 'Nunito_700Bold';
  if (fontWeight === '700' || fontWeight === 'bold') return 'Nunito_700Bold';
  if (fontWeight === '600') return 'Nunito_600SemiBold';
  if (fontWeight === '500') return 'Nunito_500Medium';
  return 'Nunito_400Regular';
}

export function Text(props: TextProps) {
  const { style, lightColor, darkColor, children, ...otherProps } = props;
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const content = typeof children === 'string' ? capitalizeSentences(children) : children;

  const flatStyle = StyleSheet.flatten(style) || {};
  const fontFamily = flatStyle.fontFamily ? undefined : getFontFamily(flatStyle.fontWeight);

  return (
    <DefaultText style={[{ color, fontFamily }, style]} {...otherProps}>
      {content}
    </DefaultText>
  );
}

export function View(props: ViewProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  return <DefaultView style={[{ backgroundColor }, style]} {...otherProps} />;
}
