export type FeelingFollowUp = {
  symptomsTitle: string;
  showSymptoms: boolean;
  symptomsShowNone: boolean;
};

export function feelingFollowUp(value: number): FeelingFollowUp {
  return {
    symptomsTitle: 'Any symptoms?',
    showSymptoms: value <= 2,
    symptomsShowNone: false,
  };
}
