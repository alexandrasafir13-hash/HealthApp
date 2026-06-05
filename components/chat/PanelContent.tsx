import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text } from '@/components/Themed';
import {
  Lightbulb,
  Target,
  ListChecks,
  Layers,
  BarChart2,
  CheckSquare,
  FileText,
  HelpCircle,
  Footprints,
  Bookmark,
  ChevronUp,
  Check
} from 'lucide-react-native';
import type { PanelItem, PanelOutput } from '@/types/chat';
import { palette } from '@/constants/theme';

interface Props {
  output: PanelOutput;
  onSave?: () => void;
  saveLabel?: string;
  isSaved?: boolean;
  defaultExpanded?: boolean;
  forceExpanded?: boolean;
}

export default function PanelContent({ output, onSave, saveLabel, isSaved = false, defaultExpanded = false, forceExpanded = false }: Props) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded || forceExpanded);
    const actualSaveLabel = saveLabel || `Save`;
  const TypeIcon = panelTypeIcon(output.type);
  const typeColor = panelTypeColor(output.type);

  if (!isExpanded) {
    return (
      <View style={styles.generatedBlock}>
        <View style={styles.compactHeader}>
          <View style={[styles.compactInfo, { flex: 1 }]}>
            <View style={styles.compactIconWrap}>
              <TypeIcon size={14} color={typeColor} />
            </View>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.compactTitle}>
                {output.title || output.type.charAt(0).toUpperCase() + output.type.slice(1)}
              </Text>
              <Text style={styles.compactMeta}>
                {output.items.length} {output.items.length === 1 ? `item` : `items`}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.compactActions}>
          <Pressable style={styles.viewBtn} onPress={() => setIsExpanded(true)}>
            <Text style={styles.viewBtnLabel}>{`View`} {output.type === 'insight' ? `summary` : output.type === 'next_step' ? `steps` : `plan`}</Text>
          </Pressable>
          {onSave && (
            <Pressable 
              style={[styles.saveInlineBtn, isSaved && styles.savedInlineBtn]} 
              onPress={isSaved ? undefined : onSave}
            >
              <Bookmark size={13} color={isSaved ? palette.slateSubtle : palette.teal} />
              <Text style={[styles.saveInlineBtnLabel, isSaved && styles.savedInlineBtnLabel]}>
                {actualSaveLabel}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.generatedBlock, { borderColor: `${typeColor}25` }]}>
      <View style={styles.generatedHeader}>
        <View style={[styles.compactInfo, { flex: 1 }]}>
          <View style={styles.compactIconWrap}>
            <TypeIcon size={14} color={typeColor} />
          </View>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={styles.compactTitle}>
              {output.title || output.type.charAt(0).toUpperCase() + output.type.slice(1)}
            </Text>
            <Text style={styles.compactMeta}>
              {output.items.length} {output.items.length === 1 ? `item` : `items`}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {!forceExpanded && (
            <Pressable style={styles.collapseBtn} onPress={() => setIsExpanded(false)}>
              <ChevronUp size={16} color={palette.slateMuted} />
            </Pressable>
          )}
          {onSave && (
            <Pressable 
              style={[styles.saveInlineBtn, isSaved && styles.savedInlineBtn, !isSaved && { backgroundColor: `${typeColor}15` }]} 
              onPress={isSaved ? undefined : onSave}
            >
              <Bookmark size={13} color={isSaved ? palette.slateSubtle : typeColor} />
              <Text style={[styles.saveInlineBtnLabel, isSaved && styles.savedInlineBtnLabel, { color: isSaved ? palette.slateSubtle : typeColor }]}>
                {actualSaveLabel}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      <View style={contentStyles.items}>
        {output.items.map((item) => (
          <PanelItemRow key={item.id} item={item} typeColor={typeColor} />
        ))}
      </View>
    </View>
  );
}

export function PanelItemRow({ item, typeColor }: { item: PanelItem; typeColor: string }) {
  const MarkerWrapper = ({ children }: { children: React.ReactNode }) => (
    <View style={itemStyles.markerWrapper}>
      {children}
    </View>
  );

  switch (item.kind) {
    case 'metric':
      return (
        <View style={itemStyles.metricRow}>
          <MarkerWrapper>
            <View style={[itemStyles.metricIcon, { backgroundColor: `${typeColor}15` }]}>
              <BarChart2 size={12} color={typeColor} />
            </View>
          </MarkerWrapper>
          <View style={itemStyles.metricInfo}>
            <Text style={itemStyles.metricLabel}>{item.label}</Text>
            {item.value ? (
              <View style={[itemStyles.valueCallout, { borderLeftColor: typeColor }]}>
                <Text style={itemStyles.valueText}>{item.value}</Text>
              </View>
            ) : null}
          </View>
        </View>
      );
    case 'todo':
      return (
        <View style={itemStyles.todoRow}>
          <MarkerWrapper>
            <View style={[itemStyles.todoIconWrap, { backgroundColor: `${typeColor}15` }]}>
              <ListChecks size={12} color={typeColor} />
            </View>
          </MarkerWrapper>
          <View style={itemStyles.todoInfo}>
            <Text style={[itemStyles.todoLabel, item.done && itemStyles.todoDone]}>{item.label}</Text>
            {item.sub ? <Text style={itemStyles.todoSub}>{item.sub}</Text> : null}
          </View>
        </View>
      );
    case 'phase':
      return (
        <View style={itemStyles.phaseRow}>
          <MarkerWrapper>
            <View style={[itemStyles.phaseDot, { backgroundColor: typeColor }]} />
          </MarkerWrapper>
          <View style={itemStyles.phaseInfo}>
            <Text style={itemStyles.phaseLabel}>{item.label}</Text>
            {item.sub ? <Text style={itemStyles.phaseSub}>{item.sub}</Text> : null}
            {item.value ? (
              <View style={[itemStyles.valueCallout, { borderLeftColor: typeColor }]}>
                <Text style={itemStyles.valueText}>{item.value}</Text>
              </View>
            ) : null}
          </View>
        </View>
      );
    case 'bullet':
    default:
      return (
        <View style={itemStyles.bulletRow}>
          <MarkerWrapper>
            <View style={[itemStyles.bulletDot, { backgroundColor: typeColor }]} />
          </MarkerWrapper>
          <View style={itemStyles.bulletInfo}>
            <Text style={itemStyles.bulletLabel}>{item.label}</Text>
            {item.sub ? <Text style={itemStyles.bulletSub}>{item.sub}</Text> : null}
          </View>
        </View>
      );
  }
}

export function panelTypeIcon(type: string) {
  switch (type) {
    case 'insight': return Lightbulb;
    case 'plan': return Layers;
    case 'routine': return ListChecks;
    case 'goal': return Target;
    case 'checklist': return CheckSquare;
    case 'question': return HelpCircle;
    case 'next_step': return Footprints;
    case 'fact': return FileText;
    default: return Layers;
  }
}

export function panelTypeColor(type: string) {
  switch (type) {
    case 'insight': return palette.sage;
    case 'routine': return palette.teal;
    case 'plan': return palette.teal;
    case 'goal': return palette.amber;
    case 'checklist': return palette.teal;
    case 'fact': return palette.slateMuted;
    case 'question': return palette.coral;
    case 'next_step': return palette.teal;
    default: return palette.teal;
  }
}

const styles = StyleSheet.create({
  generatedBlock: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(42,122,114,0.15)',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  generatedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  typeBadgeLabel: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
    flexShrink: 1,
  },
  saveInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(42,122,114,0.08)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  savedInlineBtn: {
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  saveInlineBtnLabel: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
  },
  savedInlineBtnLabel: {
    color: palette.slateSubtle,
  },
  compactHeader: {
    marginBottom: 12,
  },
  compactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  compactIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.slate,
    fontFamily: 'Nunito_700Bold',
    lineHeight: 20,
  },
  compactMeta: {
    fontSize: 12,
    color: palette.slateMuted,
    fontFamily: 'Nunito_500Medium',
  },
  compactActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewBtn: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.04)',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  viewBtnLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.slate,
    fontFamily: 'Nunito_700Bold',
  },
  collapseBtn: {
    padding: 4,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 4,
  }
});

const contentStyles = StyleSheet.create({
  items: {
    gap: 2,
  },
});

const itemStyles = StyleSheet.create({
  markerWrapper: { width: 24, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },

  metricRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#FAFBFA', borderRadius: 8, marginBottom: 4 },
  metricIcon: { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  metricInfo: { flex: 1 },
  metricLabel: { fontSize: 13, fontWeight: '600', color: palette.slateMuted, fontFamily: 'Nunito_600SemiBold' },

  todoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#FAFBFA', borderRadius: 8, marginBottom: 4 },
  todoIconWrap: { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  todoInfo: { flex: 1 },
  todoLabel: { fontSize: 13, fontWeight: '600', color: palette.slate, fontFamily: 'Nunito_600SemiBold', lineHeight: 19 },
  todoSub: { fontSize: 11, color: palette.slateMuted, marginTop: 2 },
  todoDone: { textDecorationLine: 'line-through', opacity: 0.5 },

  phaseRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#FAFBFA', borderRadius: 8, marginBottom: 4 },
  phaseDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  phaseInfo: { flex: 1 },
  phaseLabel: { fontSize: 13, fontWeight: '600', color: palette.slate, fontFamily: 'Nunito_600SemiBold' },
  phaseSub: { fontSize: 11, color: palette.slateMuted, marginTop: 1 },

  valueCallout: { borderLeftWidth: 3, paddingLeft: 8, marginTop: 6 },
  valueText: { fontSize: 13, fontWeight: '600', color: palette.slate, fontFamily: 'Nunito_600SemiBold', lineHeight: 18 },

  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#FAFBFA', borderRadius: 8, marginBottom: 4 },
  bulletDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  bulletInfo: { flex: 1 },
  bulletLabel: { fontSize: 13, fontWeight: '500', color: palette.slate, fontFamily: 'Nunito_500Medium', lineHeight: 19 },
  bulletSub: { fontSize: 11, color: palette.slateMuted, marginTop: 2 },
});
