import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { palette } from '@/constants/theme';
import { DataSource } from '@/types/health';

interface Props {
  source: DataSource;
  onToggle?: (id: string) => void;
}

export default function DataSourceCard({ source, onToggle }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
      onPress={() => onToggle?.(source.id)}
      disabled={!onToggle}>
      <View style={[styles.iconWrap, source.connected && styles.iconConnected]}>
        <SymbolView name={source.icon as 'heart.fill'} tintColor={palette.teal} size={24} />
      </View>
      <View style={styles.content}>
        <Text style={styles.name}>{source.name}</Text>
        {source.description ? (
          <Text style={styles.metrics}>{source.description}</Text>
        ) : (
          <Text style={styles.metrics}>{source.metrics.join(' · ')}</Text>
        )}
        {source.lastSync && (
          <Text style={styles.sync}>Last sync: {source.lastSync}</Text>
        )}
      </View>
      <View style={[styles.status, source.connected ? styles.connected : styles.disconnected]}>
        <Text style={styles.statusText}>{source.connected ? 'Connected' : 'Connect'}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 12,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: palette.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconConnected: {
    backgroundColor: palette.sageLight,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    color: palette.slate,
  },
  metrics: {
    fontSize: 12,
    color: palette.slateMuted,
  },
  sync: {
    fontSize: 11,
    color: palette.slateSubtle,
    marginTop: 4,
  },
  status: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  connected: {
    backgroundColor: palette.sageLight,
  },
  disconnected: {
    backgroundColor: palette.background,
    borderWidth: 1,
    borderColor: palette.teal,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.teal,
  },
});
