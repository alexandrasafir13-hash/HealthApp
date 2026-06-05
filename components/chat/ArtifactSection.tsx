import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  Activity,
  BicepsFlexed,
  BookText,
  ChevronDown,
  ChefHat,
  ClipboardList,
  FileText,
  HelpCircle,
  Layers,
  Lightbulb,
  ListChecks,
  Stethoscope,
  Trash2,
} from 'lucide-react-native';
import { Text } from '@/components/Themed';
import { palette } from '@/constants/theme';
import type { CaseArtifact, CaseArtifactType, PanelItem } from '@/types/chat';

type ArtifactSectionProps = {
  title: string;
  types: CaseArtifactType[];
  artifacts: CaseArtifact[];
  onDelete?: (id: string) => void;
};

export function ArtifactSection({ title, types, artifacts, onDelete }: ArtifactSectionProps) {
  const matched = artifacts.filter((artifact) => types.includes(artifact.type));

  if (matched.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        {title === 'Plan' ? (
          <ListChecks size={20} color={palette.teal} />
        ) : (
          <Layers size={20} color={palette.teal} />
        )}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionList}>
        {[...matched].reverse().map((artifact) => (
          <ArtifactCard key={artifact.id} artifact={artifact} onDelete={onDelete} />
        ))}
      </View>
    </View>
  );
}

function ArtifactCard({ artifact, onDelete }: { artifact: CaseArtifact; onDelete?: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = getArtifactIcon(artifact);
  const description = useMemo(() => getArtifactDescription(artifact), [artifact]);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => setExpanded((value) => !value)}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
    >
      <View style={styles.cardTopRow}>
        <View style={styles.iconWrap}>
          <Icon size={18} color={palette.teal} />
        </View>
        <View style={styles.cardCopy}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {artifact.title || 'Saved item'}
          </Text>
          <Text style={styles.cardDescription} numberOfLines={expanded ? undefined : 2}>
            {description}
          </Text>
        </View>
        <View style={styles.cardActions}>
          {onDelete ? (
            <Pressable
              onPress={(event) => {
                event.stopPropagation();
                onDelete(artifact.id);
              }}
              hitSlop={8}
              style={styles.deleteBtn}
            >
              <Trash2 size={14} color={palette.slateSubtle} />
            </Pressable>
          ) : null}
          <ChevronDown
            size={16}
            color={palette.slateSubtle}
            style={[styles.chevron, expanded && styles.chevronExpanded]}
          />
        </View>
      </View>

      {expanded && artifact.items?.length > 0 ? (
        <View style={styles.details}>
          {artifact.items.map((item, index) => (
            <ArtifactDetail key={item.id || index} item={item} />
          ))}
        </View>
      ) : null}
    </Pressable>
  );
}

function ArtifactDetail({ item }: { item: PanelItem }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailBullet} />
      <View style={styles.detailCopy}>
        <View style={styles.detailTitleRow}>
          <Text style={styles.detailLabel}>{item.label}</Text>
          {item.value ? <Text style={styles.detailValue}>{item.value}</Text> : null}
        </View>
        {item.sub ? <Text style={styles.detailSub}>{item.sub}</Text> : null}
      </View>
    </View>
  );
}

function getArtifactDescription(artifact: CaseArtifact): string {
  const firstUsefulItem = artifact.items?.find((item) => item.sub || item.value || item.label);
  if (!firstUsefulItem) return 'Tap to view the full saved information.';
  if (firstUsefulItem.sub) return firstUsefulItem.sub;
  if (firstUsefulItem.value) return `${firstUsefulItem.label}: ${firstUsefulItem.value}`;
  return firstUsefulItem.label;
}

function getArtifactIcon(artifact: CaseArtifact) {
  const title = artifact.title.toLowerCase();
  const text = artifactText(artifact);

  if (isPlanArtifact(artifact)) {
    if (matchesAnyWord(text, READING_TERMS)) return BookText;
    if (matchesAny(title, EXERCISE_TERMS) || matchesAny(text, EXERCISE_TERMS)) return BicepsFlexed;
    if (matchesAny(title, FOOD_TERMS) || matchesAny(text, FOOD_TERMS)) return ChefHat;
    if (matchesAny(title, MEDICAL_TERMS) || matchesAny(text, MEDICAL_TERMS)) return Stethoscope;
    return ClipboardList;
  }

  if (matchesAny(title, EXERCISE_TERMS) || matchesAny(text, EXERCISE_TERMS)) return BicepsFlexed;
  if (matchesAny(title, FOOD_TERMS)) return ChefHat;
  if (matchesAny(title, MEDICAL_TERMS)) return Stethoscope;
  if (matchesAny(text, FOOD_TERMS)) return ChefHat;
  if (matchesAny(text, MEDICAL_TERMS)) return Stethoscope;

  if (artifact.skill === 'meal-prep') return ChefHat;
  if (artifact.skill === 'exercise') return BicepsFlexed;
  if (artifact.skill === 'medical') return Stethoscope;

  if (isPlanArtifact(artifact)) return ClipboardList;
  if (artifact.type === 'next_step') return Activity;
  if (artifact.type === 'question') return HelpCircle;
  if (artifact.type === 'document_note') return FileText;
  return Lightbulb;
}

function isPlanArtifact(artifact: CaseArtifact): boolean {
  return artifact.type === 'plan' || artifact.type === 'routine' || artifact.type === 'goal' || artifact.type === 'checklist';
}

function artifactText(artifact: CaseArtifact): string {
  return [
    artifact.title,
    ...(artifact.items ?? []).flatMap((item) => [item.label, item.sub, item.value]),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function matchesAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

function matchesAnyWord(text: string, terms: string[]): boolean {
  return terms.some((term) => new RegExp(`\\b${escapeRegExp(term)}\\b`, 'i').test(text));
}

function escapeRegExp(term: string): string {
  return term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const EXERCISE_TERMS = [
  'exercise',
  'workout',
  'squat',
  'push-up',
  'pushup',
  'plank',
  'walk',
  'cardio',
  'strength',
  'mobility',
];

const FOOD_TERMS = [
  'meal',
  'breakfast',
  'lunch',
  'dinner',
  'snack',
  'food',
  'cook',
  'prep',
  'recipe',
  'grocery',
  'oats',
  'chicken',
  'quinoa',
];

const READING_TERMS = [
  'read',
  'reading',
  'book',
  'books',
  'novel',
  'novels',
  'chapter',
  'chapters',
  'pages',
  'audiobook',
  'audiobooks',
  'library',
];

const MEDICAL_TERMS = [
  'medical',
  'lab',
  'lipid',
  'ldl',
  'cholesterol',
  'ultrasound',
  'blood',
  'result',
  'doctor',
  'diagnosis',
  'scan',
];

const styles = StyleSheet.create({
  section: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    color: palette.slate,
    fontFamily: 'Nunito_700Bold',
  },
  sectionList: {
    gap: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    borderRadius: 10,
    padding: 14,
  },
  cardPressed: {
    backgroundColor: '#F8FAF9',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(42,122,114,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCopy: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 15,
    lineHeight: 20,
    color: palette.slate,
    fontFamily: 'Nunito_700Bold',
  },
  cardDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: palette.slateMuted,
    fontFamily: 'Nunito_400Regular',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteBtn: {
    padding: 2,
  },
  chevron: {
    transform: [{ rotate: '0deg' }],
  },
  chevronExpanded: {
    transform: [{ rotate: '180deg' }],
  },
  details: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  detailBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.teal,
    marginTop: 8,
  },
  detailCopy: {
    flex: 1,
    gap: 4,
  },
  detailTitleRow: {
    gap: 4,
  },
  detailLabel: {
    fontSize: 14,
    lineHeight: 20,
    color: palette.slate,
    fontFamily: 'Nunito_700Bold',
  },
  detailValue: {
    fontSize: 13,
    lineHeight: 18,
    color: palette.tealDark,
    fontFamily: 'Nunito_700Bold',
  },
  detailSub: {
    fontSize: 13,
    lineHeight: 19,
    color: palette.slateMuted,
    fontFamily: 'Nunito_400Regular',
  },
});
