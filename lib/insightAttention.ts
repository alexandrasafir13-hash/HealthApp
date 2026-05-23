import { BodyInsight, InsightCategory, InsightSeverity } from '@/types/health';

export const ATTENTION_SEVERITIES: InsightSeverity[] = ['high', 'medium'];

const SEVERITY_RANK: Record<InsightSeverity, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export const CATEGORY_DISPLAY_NAMES: Record<InsightCategory, string> = {
  sleep: 'Sleep',
  recovery: 'Recovery',
  immunity: 'Prevention',
  stress: 'Stress',
  activity: 'Activity',
};

const CATEGORY_ORDER: InsightCategory[] = ['sleep', 'recovery', 'immunity', 'stress', 'activity'];

export function insightNeedsAttention(insight: BodyInsight): boolean {
  return insight.severity === 'high' || insight.severity === 'medium';
}

export function categoryNeedsAttention(insights: BodyInsight[], category: InsightCategory): boolean {
  return insights.some((i) => i.category === category && insightNeedsAttention(i));
}

export function getTopInsightForCategory(
  insights: BodyInsight[],
  category: InsightCategory,
): BodyInsight | undefined {
  return insights
    .filter((i) => i.category === category)
    .sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity])[0];
}

export interface AttentionCategory {
  category: InsightCategory;
  title: string;
  topInsight: BodyInsight;
}

export function getAttentionCategories(insights: BodyInsight[]): AttentionCategory[] {
  const items: AttentionCategory[] = [];

  for (const category of CATEGORY_ORDER) {
    if (!categoryNeedsAttention(insights, category)) continue;
    const topInsight = getTopInsightForCategory(insights, category);
    if (!topInsight) continue;
    items.push({
      category,
      title: CATEGORY_DISPLAY_NAMES[category],
      topInsight,
    });
  }

  return items.sort(
    (a, b) => SEVERITY_RANK[b.topInsight.severity] - SEVERITY_RANK[a.topInsight.severity],
  );
}
