import { Sun, Lightbulb, User, ListCheck, Sliders } from 'lucide-react-native';
import { Tabs, router, usePathname } from 'expo-router';
import { useWindowDimensions, StyleSheet, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import HeartHandshakeLogo from '@/components/HeartHandshakeLogo';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { PAGE_MAX_WIDTH, useBreakpoint } from '@/hooks/useBreakpoint';
import { palette, cardShadow } from '@/constants/theme';

function DesktopSidebar() {
  const pathname = usePathname();

  const links = [
    {
      name: 'Today',
      path: '/',
      Icon: Sun,
    },
    {
      name: 'Insights',
      path: '/insights',
      Icon: Lightbulb,
    },
    {
      name: 'Profile',
      path: '/profile',
      Icon: User,
    },
    {
      name: 'Plan',
      path: '/plan',
      Icon: ListCheck,
    },
  ];

  const bottomLinks = [
    {
      name: 'Sandbox',
      path: '/sandbox',
      Icon: Sliders,
    },
  ];

  const renderLink = (link: typeof links[0]) => {
    const isFocused = pathname === link.path;

    const onPress = () => {
      if (!isFocused) {
        router.replace(link.path as any);
      }
    };

    return (
      <Pressable
        key={link.path}
        onPress={onPress}
        style={({ pressed }) => [
          sidebarStyles.tabLink,
          isFocused && sidebarStyles.tabLinkActive,
          pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
        ]}>
        <link.Icon
          color={isFocused ? palette.teal : palette.slateMuted}
          size={22}
        />
        <Text style={[sidebarStyles.tabLabel, isFocused && sidebarStyles.tabLabelActive]}>
          {link.name}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={sidebarStyles.sidebar}>
      <View style={{ gap: 32 }}>
        {/* Brand Header */}
        <View style={sidebarStyles.brandContainer}>
          <HeartHandshakeLogo size={32} />
          <Text style={sidebarStyles.brandText}>Healthee</Text>
        </View>

        {/* Tab Links */}
        <View style={sidebarStyles.linksContainer}>
          {links.map(renderLink)}
        </View>
      </View>

      {/* Bottom Link for Desktop Sandbox */}
      <View style={sidebarStyles.linksContainer}>
        {bottomLinks.map(renderLink)}
      </View>
    </View>
  );
}

function MobileTabBar({ state, descriptors, navigation }: any) {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { isDesktop } = useBreakpoint();
  const isDark = colorScheme === 'dark';

  if (isDesktop) return null;

  const colors = Colors[colorScheme ?? 'light'];
  const activeColor = colors.tint;
  const inactiveColor = isDark ? '#9CA3AF' : '#718096';
  const tabBgColor = colors.card;
  const borderColor = colors.border;

  const gutter = Math.max(0, (width - PAGE_MAX_WIDTH) / 2);
  const tabBarWidth = Math.min(width, PAGE_MAX_WIDTH);
  
  const outerMargin = 16;
  const floatingWidth = tabBarWidth - (outerMargin * 2);

  return (
    <View
      style={[
        tabStyles.container,
        {
          bottom: Math.max(insets.bottom, 16),
          left: gutter + outerMargin,
          width: floatingWidth,
          backgroundColor: tabBgColor,
          borderColor: borderColor,
        },
      ]}>
      {state.routes
        .filter((route: any) => route.name !== 'sandbox')
        .map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
                ? options.title
                : route.name;

          const isFocused = state.routes[state.index]?.name === route.name;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        // Determine SFSymbol/Material Icon name based on route.name
        let Icon: any;
        if (route.name === 'index') {
          Icon = Sun;
        } else if (route.name === 'insights') {
          Icon = Lightbulb;
        } else if (route.name === 'profile') {
          Icon = User;
        } else if (route.name === 'plan') {
          Icon = ListCheck;
        }

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={tabStyles.tabButton}>
            {({ pressed }) => (
              <View
                style={[
                  tabStyles.tabContent,
                  pressed && { transform: [{ scale: 0.95 }], opacity: 0.9 },
                ]}>
                {/* Active Indicator Pill */}
                <View
                  style={[
                    tabStyles.iconContainer,
                    isFocused && {
                      backgroundColor: isDark
                        ? 'rgba(42, 122, 114, 0.2)'
                        : palette.sageLight,
                    },
                  ]}>
                  <Icon
                    color={isFocused ? activeColor : inactiveColor}
                    size={22}
                  />
                </View>
                <Text
                  style={[
                    tabStyles.tabLabel,
                    { color: isFocused ? activeColor : inactiveColor },
                    isFocused && tabStyles.tabLabelActive,
                  ]}>
                  {label}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  const { isDesktop } = useBreakpoint();

  return (
    <View style={layoutStyles.root}>
      {isDesktop && <DesktopSidebar />}
      <View style={layoutStyles.content}>
        <Tabs
          tabBar={(props) => <MobileTabBar {...props} />}
          screenOptions={{
            headerShown: false,
          }}>
          <Tabs.Screen
            name="index"
            options={{
              title: 'Today',
            }}
          />
          <Tabs.Screen
            name="insights"
            options={{
              title: 'Insights',
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Profile',
            }}
          />
          <Tabs.Screen
            name="plan"
            options={{
              title: 'Plan',
            }}
          />
          <Tabs.Screen
            name="sandbox"
            options={{
              title: 'Sandbox',
            }}
          />
        </Tabs>
      </View>
    </View>
  );
}

const sidebarStyles = StyleSheet.create({
  sidebar: {
    width: 250,
    backgroundColor: palette.card,
    borderRadius: 24,
    marginVertical: 20,
    marginLeft: 20,
    marginRight: 10,
    paddingTop: 36,
    paddingBottom: 24,
    paddingHorizontal: 20,
    ...cardShadow,
    justifyContent: 'space-between',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 8,
    gap: 10,
  },
  brandText: {
    fontSize: 28,
    fontWeight: '800',
    color: palette.sage,
    letterSpacing: -0.8,
  },
  linksContainer: {
    gap: 12,
  },
  tabLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 14,
    backgroundColor: 'transparent',
  },
  tabLinkActive: {
    backgroundColor: palette.sageLight,
  },
  tabIcon: {
    width: 22,
    height: 22,
  },
  tabLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.slateMuted,
  },
  tabLabelActive: {
    color: palette.teal,
    fontWeight: '700',
  },
});

const tabStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    flexDirection: 'row',
    height: 72,
    borderRadius: 36,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: palette.card,
    ...cardShadow,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  iconContainer: {
    width: 56,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  tabLabelActive: {
    fontWeight: '700',
  },
});

const layoutStyles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: palette.background,
  },
  content: {
    flex: 1,
  },
});
