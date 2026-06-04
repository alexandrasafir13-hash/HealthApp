import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  View,
  TextInput,
  Pressable,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import PageTitle from '@/components/PageTitle';
import { Text } from '@/components/Themed';
import { useHealth } from '@/context/HealthContext';
import { useAuth } from '@/context/AuthContext';
import { pageStyles, usePageLayout } from '@/hooks/usePageLayout';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { palette, typography, cardShadow } from '@/constants/theme';
import { BiologicalSex } from '@/types/onboarding';
import {
  Calendar,
  ChevronRight,
  RefreshCw,
  CloudUpload,
  Pencil,
  X,
  CheckCircle,
  User,
  Scale,
  Ruler,
  Moon,
  Heart,
} from 'lucide-react-native';

const bmiPosition = (bmi: number) => Math.min(95, Math.max(5, ((bmi - 15) / 25) * 100));

export default function ProfileScreen() {
  const { contentContainerStyle, pageStyle } = usePageLayout();
  const { isTabletUp } = useBreakpoint();
  const router = useRouter();
  const {
    profile,
    personalPlan,
    updateProfile,
    resetAllData,
    planCheckInLog,
  } = useHealth();

  const { user, isAuthenticated, signOutUser, signInWithGoogle, loading: authLoading } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOutUser();
      await resetAllData();
      router.replace('/onboarding');
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const [isEditing, setIsEditing] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<BiologicalSex | null>(null);
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [restingHeartRate, setRestingHeartRate] = useState('');
  const [waist, setWaist] = useState('');
  const [sleepDuration, setSleepDuration] = useState('');

  // UI state
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showCreateAccount, setShowCreateAccount] = useState(false);

  // Prepopulate form if profile data is available
  useEffect(() => {
    if (profile) {
      setName(profile.name ?? '');
      setAge(profile.age != null ? String(profile.age) : '');
      setSex(profile.sex ?? null);
      setWeight(profile.weightKg != null ? String(profile.weightKg) : '');
      setHeight(profile.heightCm != null ? String(profile.heightCm) : '');
      setRestingHeartRate(profile.restingHeartRate != null ? String(profile.restingHeartRate) : '');
      setWaist(profile.waistCm != null ? String(profile.waistCm) : '');
      if (profile.sleepDurationHrs != null) {
        setSleepDuration(String(profile.sleepDurationHrs));
      } else {
        const onboardingSleep = profile.goalDetails?.['sleep-schedule']?.['sleep-hours'];
        if (onboardingSleep != null && onboardingSleep !== '') {
          setSleepDuration(String(onboardingSleep));
        } else {
          setSleepDuration('');
        }
      }
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const updatedFields = {
        name: name.trim() || undefined,
        age: age.trim() ? parseInt(age.trim(), 10) : undefined,
        sex: sex ?? undefined,
        weightKg: weight.trim() ? parseFloat(weight.trim()) : undefined,
        heightCm: height.trim() ? parseFloat(height.trim()) : undefined,
        restingHeartRate: restingHeartRate.trim() ? parseInt(restingHeartRate.trim(), 10) : undefined,
        waistCm: waist.trim() ? parseFloat(waist.trim()) : undefined,
        sleepDurationHrs: sleepDuration.trim() ? parseFloat(sleepDuration.trim()) : undefined,
      };
      await updateProfile(updatedFields);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setIsEditing(false);
      }, 1500);
    } catch (e) {
      console.error('Failed to update profile:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setName(profile.name ?? '');
      setAge(profile.age != null ? String(profile.age) : '');
      setSex(profile.sex ?? null);
      setWeight(profile.weightKg != null ? String(profile.weightKg) : '');
      setHeight(profile.heightCm != null ? String(profile.heightCm) : '');
      setRestingHeartRate(profile.restingHeartRate != null ? String(profile.restingHeartRate) : '');
      setWaist(profile.waistCm != null ? String(profile.waistCm) : '');
      if (profile.sleepDurationHrs != null) {
        setSleepDuration(String(profile.sleepDurationHrs));
      } else {
        const onboardingSleep = profile.goalDetails?.['sleep-schedule']?.['sleep-hours'];
        setSleepDuration(onboardingSleep != null && onboardingSleep !== '' ? String(onboardingSleep) : '');
      }
    }
    setIsEditing(false);
  };

  const userInitial = name.trim() ? name.trim().charAt(0).toUpperCase() : 'U';

  const formattedSex = sex === 'male' ? 'Male' :
                       sex === 'female' ? 'Female' :
                       sex === 'prefer-not-say' ? 'Prefer not to say' :
                       sex === 'other' ? 'Other' :
                       sex ? (sex.charAt(0).toUpperCase() + sex.slice(1)) : '—';

  const biometricsData = [
    { label: 'Age', value: age ? `${age} yrs` : '—', Icon: Calendar, tint: '#3B82F6', bg: 'rgba(59, 130, 246, 0.08)' },
    { label: 'Biological Sex', value: formattedSex, Icon: User, tint: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.08)' },
    { label: 'Weight', value: weight ? `${weight} kg` : '—', Icon: Scale, tint: '#10B981', bg: 'rgba(16, 185, 129, 0.08)' },
    { label: 'Height', value: height ? `${height} cm` : '—', Icon: Ruler, tint: '#EC4899', bg: 'rgba(236, 72, 153, 0.08)' },
    { label: 'Resting HR', value: restingHeartRate ? `${restingHeartRate} BPM` : '—', Icon: Heart, tint: '#EF4444', bg: 'rgba(239, 68, 68, 0.08)' },
    { label: 'Sleep Target', value: sleepDuration ? `${sleepDuration} hrs` : '—', Icon: Moon, tint: '#6366F1', bg: 'rgba(99, 102, 241, 0.08)' },
    { label: 'Waist Line', value: waist ? `${waist} cm` : '—', Icon: Ruler, tint: '#F59E0B', bg: 'rgba(245, 158, 11, 0.08)' },
  ];

  const profileData = useProfileData(profile, planCheckInLog, personalPlan);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={pageStyles.scroll}
        contentContainerStyle={contentContainerStyle}
        keyboardShouldPersistTaps="handled">
        <View style={pageStyle}>
          <PageTitle title="Your Profile" />

          <ProfileHeroCard name={name} userInitial={userInitial} userPhotoUrl={isAuthenticated ? user?.photoURL : null} />

          {isAuthenticated && user ? (
            <View style={styles.promoCard}>
              <View style={[styles.promoIconContainer, { backgroundColor: 'rgba(20, 184, 166, 0.1)' }]}>
                <CheckCircle color={palette.teal} size={18} />
              </View>
              <View style={styles.promoTextContainer}>
                <Text style={styles.promoTitle}>Cloud Backup Sync Active</Text>
                <Text style={styles.promoSubtitle}>Synced securely as {user.email}</Text>
              </View>
              <Pressable style={styles.signOutButton} onPress={handleSignOut}>
                <Text style={styles.signOutButtonText}>Sign Out</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.promoCard} onPress={() => setShowCreateAccount(true)}>
              <View style={styles.promoIconContainer}>
                <CloudUpload color={palette.teal} size={18} />
              </View>
              <View style={styles.promoTextContainer}>
                <Text style={styles.promoTitle}>Back Up Your Health Data</Text>
                <Text style={styles.promoSubtitle}>Create a secure account to sync your progress.</Text>
              </View>
              <ChevronRight color={palette.slateSubtle} size={12} />
            </Pressable>
          )}

          <BiometricsSection
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            name={name} setName={setName}
            age={age} setAge={setAge}
            sex={sex} setSex={setSex}
            weight={weight} setWeight={setWeight}
            height={height} setHeight={setHeight}
            restingHeartRate={restingHeartRate} setRestingHeartRate={setRestingHeartRate}
            waist={waist} setWaist={setWaist}
            sleepDuration={sleepDuration} setSleepDuration={setSleepDuration}
            saving={saving}
            saveSuccess={saveSuccess}
            handleSave={handleSave}
            handleCancel={handleCancel}
            setConfirmReset={setConfirmReset}
            biometricsData={biometricsData}
          />

          {!isEditing && (
            <>
              <CalculatedBiometricsCard data={profileData} onPressEdit={() => setIsEditing(true)} />
              <CheckInAnalyticsCard analytics={profileData.analytics} onPressCheckIn={() => router.push('/')} />
            </>
          )}

        </View>
      </ScrollView>

      <CreateAccountModal
        visible={showCreateAccount}
        onClose={() => setShowCreateAccount(false)}
        signInWithGoogle={signInWithGoogle}
        authLoading={authLoading}
      />
    </KeyboardAvoidingView>
  );
}

function ProfileHeroCard({ name, userInitial, userPhotoUrl }: any) {
  return (
    <View style={styles.heroCard}>
      <View style={styles.avatarContainer}>
        {userPhotoUrl ? (
          <Image source={{ uri: userPhotoUrl }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarText}>{userInitial}</Text>
        )}
      </View>
      <View style={styles.heroMeta}>
        <Text style={styles.heroName}>{name || 'Healthee User'}</Text>
        <Text style={styles.heroSub}>Wellness Companion Plan Active</Text>
      </View>
    </View>
  );
}

function CreateAccountModal({ visible, onClose, signInWithGoogle, authLoading }: any) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Create Your Account</Text>
          <Text style={styles.modalSubtitle}>Unlock the full potential of your wellness journey.</Text>
          <View style={styles.benefitsList}>
            {[
              { text: 'Sync your data across all your devices seamlessly' },
              { text: 'Back up your daily check-ins, progress, and history' },
              { text: 'Access personalized insights and long-term trend analysis' },
              { text: 'Get reminders and notifications to stay on track' },
            ].map((benefit, idx) => (
              <View key={idx} style={styles.benefitRow}>
                <Text style={styles.benefitIcon}>✦</Text>
                <Text style={styles.benefitText}>{benefit.text}</Text>
              </View>
            ))}
          </View>
          <Pressable
            style={[styles.modalButton, authLoading && styles.modalButtonDisabled]}
            onPress={async () => { await signInWithGoogle(); onClose(); }}
            disabled={authLoading}>
            {authLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.modalButtonText}>Sign up with Google</Text>
            )}
          </Pressable>
          <Pressable style={styles.modalDismiss} onPress={onClose}>
            <Text style={styles.modalDismissText}>Maybe later</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function BiometricsSection({
  isEditing, setIsEditing, name, setName, age, setAge, sex, setSex,
  weight, setWeight, height, setHeight, restingHeartRate, setRestingHeartRate,
  waist, setWaist, sleepDuration, setSleepDuration, saving, saveSuccess,
  handleSave, handleCancel, setConfirmReset, biometricsData,
}: any) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeading}>Personal Biometrics</Text>
        <Pressable
          onPress={() => {
            if (isEditing) handleCancel();
            else setIsEditing(true);
            setConfirmReset(false);
          }}
          style={styles.editToggleBtn}>
          {isEditing ? <X color={palette.teal} size={12} /> : <Pencil color={palette.teal} size={12} />}
          <Text style={styles.editToggleText}>{isEditing ? 'Cancel' : 'Edit'}</Text>
        </Pressable>
      </View>

      {isEditing ? (
        <View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter your name"
              placeholderTextColor={palette.slateSubtle}
              value={name}
              onChangeText={(text) => { setName(text); setConfirmReset(false); }}
              maxLength={80}
            />
          </View>
          <View style={styles.metricsRow}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Age</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Years"
                placeholderTextColor={palette.slateSubtle}
                value={age}
                onChangeText={(text) => { setAge(text.replace(/[^0-9]/g, '')); setConfirmReset(false); }}
                keyboardType="number-pad"
                maxLength={3}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginHorizontal: 12 }]}>
              <Text style={styles.inputLabel}>Weight (kg)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="kg"
                placeholderTextColor={palette.slateSubtle}
                value={weight}
                onChangeText={(text) => { setWeight(text.replace(/[^0-9.]/g, '')); setConfirmReset(false); }}
                keyboardType="decimal-pad"
                maxLength={5}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Height (cm)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="cm"
                placeholderTextColor={palette.slateSubtle}
                value={height}
                onChangeText={(text) => { setHeight(text.replace(/[^0-9.]/g, '')); setConfirmReset(false); }}
                keyboardType="decimal-pad"
                maxLength={5}
              />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Biological Sex</Text>
            <View style={styles.chipsTray}>
              {[
                { id: 'male', label: 'Male' },
                { id: 'female', label: 'Female' },
                { id: 'other', label: 'Other' },
                { id: 'prefer-not-say', label: 'Prefer not to say' },
              ].map((option) => {
                const isSelected = option.id === 'other'
                  ? (sex === 'other' || (sex !== null && sex !== undefined && sex !== '' && sex !== 'male' && sex !== 'female' && sex !== 'prefer-not-say'))
                  : sex === option.id;

                return (
                  <Pressable
                    key={option.id}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => {
                      if (option.id === 'other') {
                        const isCurrentlyCustom = sex !== null && sex !== undefined && sex !== '' && sex !== 'male' && sex !== 'female' && sex !== 'prefer-not-say';
                        if (!isCurrentlyCustom) setSex('other');
                      } else {
                        setSex(option.id as BiologicalSex);
                      }
                      setConfirmReset(false);
                    }}>
                    <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>{option.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            {sex !== null && sex !== undefined && sex !== 'male' && sex !== 'female' && sex !== 'prefer-not-say' && (
              <View style={styles.customSexContainer}>
                <Text style={styles.customSexLabel}>Please specify:</Text>
                <TextInput
                  style={styles.customSexInput}
                  placeholder="Enter biological sex..."
                  placeholderTextColor={palette.slateSubtle}
                  value={sex === 'other' ? '' : sex}
                  onChangeText={(text) => { setSex(text); setConfirmReset(false); }}
                  maxLength={50}
                />
              </View>
            )}
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Resting Heart Rate (BPM)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 68"
              placeholderTextColor={palette.slateSubtle}
              value={restingHeartRate}
              onChangeText={(text) => { setRestingHeartRate(text.replace(/[^0-9]/g, '')); setConfirmReset(false); }}
              keyboardType="number-pad"
              maxLength={3}
            />
            <View style={styles.infoBox}>
              <Text style={styles.infoBoxText}>
                ❤️ <Text style={{ fontWeight: '600' }}>Measure manually:</Text> Place index and middle finger on your wrist below the thumb base. Count beats for 15 seconds, then multiply by 4.
              </Text>
            </View>
          </View>
          <View style={styles.metricsRow}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Waist Circumference (cm)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 82"
                placeholderTextColor={palette.slateSubtle}
                value={waist}
                onChangeText={(text) => { setWaist(text.replace(/[^0-9.]/g, '')); setConfirmReset(false); }}
                keyboardType="decimal-pad"
                maxLength={5}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
              <Text style={styles.inputLabel}>Sleep Duration (hours)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 7.5"
                placeholderTextColor={palette.slateSubtle}
                value={sleepDuration}
                onChangeText={(text) => { setSleepDuration(text.replace(/[^0-9.]/g, '')); setConfirmReset(false); }}
                keyboardType="decimal-pad"
                maxLength={4}
              />
            </View>
          </View>
          <View style={styles.formActionsRow}>
            <Pressable style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.saveButton, saving && styles.saveButtonLoading, saveSuccess && styles.saveButtonSuccess, { flex: 1 }]}
              onPress={handleSave}
              disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : saveSuccess ? (
                <View style={styles.saveBtnContent}>
                  <CheckCircle color="#fff" size={16} />
                  <Text style={styles.saveButtonText}>Saved!</Text>
                </View>
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.metricGrid}>
          {biometricsData.map((metric: any, idx: number) => (
            <View key={idx} style={styles.metricCard}>
              <View style={[styles.metricIconContainer, { backgroundColor: metric.bg }]}>
                <metric.Icon color={metric.tint} size={16} />
              </View>
              <View style={styles.metricInfo}>
                <Text style={styles.metricLabel}>{metric.label}</Text>
                <Text style={styles.metricValue}>{metric.value}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function CalculatedBiometricsCard({ data, onPressEdit }: any) {
  if (!data.hasBiometrics) {
    return (
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Physiological Biometrics</Text>
        <Text style={styles.emptyText}>Add your age, weight, and height to unlock automatic BMI, BMR, and hydration calculations.</Text>
        <Pressable onPress={onPressEdit}>
          <Text style={styles.linkText}>Edit Profile</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>Calculated Metrics</Text>
      <View style={styles.calcGrid}>
        {data.bmi != null && data.bmiCategory && (
          <View style={styles.calcTile}>
            <Text style={styles.calcTileLabel}>BMI</Text>
            <Text style={styles.calcTileValue}>{data.bmi}</Text>
            <View style={styles.bmiScaleWrap}>
              <View style={styles.bmiScaleBar}>
                <View style={styles.bmiSegments}>
                  <View style={[styles.bmiSegment, { flex: 3.5, backgroundColor: '#3B82F6' }]} />
                  <View style={[styles.bmiSegment, { flex: 6.5, backgroundColor: '#10B981' }]} />
                  <View style={[styles.bmiSegment, { flex: 5, backgroundColor: '#F59E0B' }]} />
                  <View style={[styles.bmiSegment, { flex: 10, backgroundColor: '#EF4444' }]} />
                </View>
                <View style={[styles.bmiLine, { left: `${bmiPosition(data.bmi)}%` }]} />
              </View>
              <View style={styles.bmiLabelRow}>
                <View style={[styles.bmiLabelWrap, { left: `${bmiPosition(data.bmi)}%` }]}>
                  <Text style={[styles.calcTileStatus, { color: data.bmiCategory.color }]}>
                    {data.bmiCategory.label}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
        {data.hydrationTarget && (
          <View style={styles.calcTile}>
            <Text style={styles.calcTileLabel}>Hydration</Text>
            <Text style={styles.calcTileValue}>{Number((data.hydrationTarget.ml / 1000).toFixed(1))}L</Text>
            <Text style={styles.calcTileSub}>{data.hydrationTarget.glasses} glasses</Text>
          </View>
        )}
        {data.bmr != null && (
          <View style={styles.calcTile}>
            <Text style={styles.calcTileLabel}>BMR</Text>
            <Text style={styles.calcTileValue}>{data.bmr}</Text>
            <Text style={styles.calcTileSub}>kcal resting</Text>
          </View>
        )}
        {data.rhrCategory && (
          <View style={styles.calcTile}>
            <Text style={styles.calcTileLabel}>Resting HR Category</Text>
            <Text style={[styles.calcTileStatus, { color: data.rhrCategory.color }]}>{data.rhrCategory.label}</Text>
          </View>
        )}
        {data.whtr != null && data.whtrCategory && (
          <View style={styles.calcTile}>
            <Text style={styles.calcTileLabel}>Waist/Height</Text>
            <Text style={styles.calcTileValue}>{data.whtr}</Text>
            <Text style={[styles.calcTileStatus, { color: data.whtrCategory.color }]}>{data.whtrCategory.label}</Text>
          </View>
        )}
        {data.sleepAnalysis && (
          <View style={styles.calcTile}>
            <Text style={styles.calcTileLabel}>Sleep Analysis</Text>
            <Text style={[styles.calcTileStatus, { color: data.sleepAnalysis.color }]}>
              {data.sleepAnalysis.label.replace(/\(.*?\)/, '').trim()}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

function CheckInAnalyticsCard({ analytics, onPressCheckIn }: any) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>Check-In Analytics</Text>

      {analytics ? (
        <View style={styles.analyticsList}>
          {[
            { label: 'Consistency', value: `${analytics.consistency}%`, tag: `${analytics.totalDays} day${analytics.totalDays === 1 ? '' : 's'} logged` },
            analytics.recognitionRate !== null && { label: 'Adherence', value: `${analytics.recognitionRate}%`, tag: 'observation rate' },
            analytics.avgEffort !== null && {
              label: 'Resistance',
              value: `${analytics.avgEffort}/5`,
              tag: analytics.avgEffort <= 2.5 ? 'Low friction' : analytics.avgEffort <= 3.8 ? 'Moderate friction' : 'High resistance',
            },
            analytics.peakBucket && { label: 'Peak trigger', value: analytics.peakBucket, tag: 'most frequent window' },
          ].filter((m): m is { label: string; value: string; tag: string } => !!m).map((m, i, arr) => (
            <View key={m.label} style={[styles.analyticsRow, i === arr.length - 1 && styles.rowLast]}>
              <Text style={styles.analyticsLabel}>{m.label}</Text>
              <Text style={styles.analyticsValue}>
                {m.value}
                <Text style={styles.analyticsTag}>  {m.tag}</Text>
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <View>
          <Text style={styles.emptyText}>Submit daily check-ins on the Today screen to populate your trend dashboard.</Text>
          <Pressable onPress={onPressCheckIn}>
            <Text style={styles.linkText}>Check In Today</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function useProfileData(profile: any, planCheckInLog: any, personalPlan: any) {
  const hasBiometrics = !!(profile?.weightKg && profile?.heightCm && profile?.age);

  const bmi = useMemo(() => {
    if (!profile?.weightKg || !profile?.heightCm) return null;
    const hMeter = profile.heightCm / 100;
    return Number((profile.weightKg / (hMeter * hMeter)).toFixed(1));
  }, [profile?.weightKg, profile?.heightCm]);

  const bmiCategory = useMemo(() => {
    if (!bmi) return null;
    if (bmi < 18.5) return { label: 'Underweight', color: '#3B82F6' };
    if (bmi < 25.0) return { label: 'Optimal Weight', color: '#10B981' };
    if (bmi < 30.0) return { label: 'Overweight', color: '#F59E0B' };
    return { label: 'Elevated Weight', color: '#EF4444' };
  }, [bmi]);

  const hydrationTarget = useMemo(() => {
    if (!profile?.weightKg) return null;
    const ml = Math.round(profile.weightKg * 35);
    return { ml, glasses: Math.round(ml / 250) };
  }, [profile?.weightKg]);

  const bmr = useMemo(() => {
    if (!profile?.weightKg || !profile?.heightCm || !profile?.age) return null;
    const wPart = 10 * profile.weightKg;
    const hPart = 6.25 * profile.heightCm;
    const aPart = 5 * profile.age;
    const s = profile.sex;
    if (s === 'male') return Math.round(wPart + hPart - aPart + 5);
    if (s === 'female') return Math.round(wPart + hPart - aPart - 161);
    return Math.round(wPart + hPart - aPart - 78);
  }, [profile?.weightKg, profile?.heightCm, profile?.age, profile?.sex]);

  const whtr = useMemo(() => {
    if (!profile?.waistCm || !profile?.heightCm) return null;
    return Number((profile.waistCm / profile.heightCm).toFixed(2));
  }, [profile?.waistCm, profile?.heightCm]);

  const whtrCategory = useMemo(() => {
    if (!whtr) return null;
    return whtr <= 0.49
      ? { label: 'Optimal', color: '#10B981' }
      : { label: 'Increased Risk', color: '#F59E0B' };
  }, [whtr]);

  const rhrCategory = useMemo(() => {
    if (!profile?.restingHeartRate) return null;
    const r = profile.restingHeartRate;
    if (r < 60) return { label: 'Athletic / Efficient', color: '#10B981' };
    if (r < 70) return { label: 'Excellent Baseline', color: '#10B981' };
    if (r < 80) return { label: 'Good / Normal', color: '#3B82F6' };
    return { label: 'Elevated', color: '#EF4444' };
  }, [profile?.restingHeartRate]);

  const sleepAnalysis = useMemo(() => {
    if (!profile?.sleepDurationHrs) return null;
    const s = profile.sleepDurationHrs;
    if (s < 7.0) return { label: `Sleep Deficit (${s} hrs)`, color: '#EF4444' };
    if (s <= 9.0) return { label: `Optimal (${s} hrs)`, color: '#10B981' };
    return { label: `Extended (${s} hrs)`, color: '#3B82F6' };
  }, [profile?.sleepDurationHrs]);

  const analytics = useMemo(() => {
    const entries = Object.values(planCheckInLog || {});
    if (entries.length === 0) return null;

    let totalDays = entries.length;
    let effortSum = 0, effortCount = 0;
    let observeYes = 0, observePartial = 0;
    let observeTotal = 0;
    const timeBuckets: Record<string, number> = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 };

    entries.forEach((entry: any) => {
      Object.entries(entry.answers || {}).forEach(([qId, val]) => {
        if ((qId.includes('observe-step') || qId.includes('noticed-trigger')) && typeof val === 'string') {
          observeTotal++;
          if (val === 'Yes') observeYes++;
          else if (val === 'Partially') observePartial++;
        }
        if (qId.includes('effort') && typeof val === 'number') {
          effortSum += val;
          effortCount++;
        }
        if ((qId.includes('pattern-time') || qId.includes('first-scroll') || qId.includes('time')) && typeof val === 'string' && val.includes(':')) {
          const hr = parseInt(val.split(':')[0], 10);
          if (!Number.isNaN(hr)) {
            if (hr >= 5 && hr < 12) timeBuckets.Morning++;
            else if (hr >= 12 && hr < 17) timeBuckets.Afternoon++;
            else if (hr >= 17 && hr < 21) timeBuckets.Evening++;
            else timeBuckets.Night++;
          }
        }
      });
    });

    const currentPhaseNum = personalPlan?.activeWeekNumber ?? 1;
    const activePhaseObj = personalPlan?.phases?.[currentPhaseNum - 1];
    const durationDays = activePhaseObj?.durationDays ?? 7;

    const consistency = Math.min(100, Math.round((totalDays / durationDays) * 100));
    const recognitionRate = observeTotal > 0 ? Math.round(((observeYes + observePartial * 0.5) / observeTotal) * 100) : null;
    const avgEffort = effortCount > 0 ? Number((effortSum / effortCount).toFixed(1)) : null;
    let peakBucket: string | null = null;
    let maxCount = 0;
    Object.entries(timeBuckets).forEach(([b, c]) => { if (c > maxCount) { maxCount = c; peakBucket = b; } });

    return { totalDays, consistency, recognitionRate, avgEffort, peakBucket: maxCount > 0 ? peakBucket : null };
  }, [planCheckInLog, personalPlan]);

  return {
    hasBiometrics,
    bmi, bmiCategory, hydrationTarget, bmr,
    whtr, whtrCategory, rhrCategory, sleepAnalysis,
    analytics,
  };
}

const styles = StyleSheet.create({
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.sageLight,
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
  },
  avatarContainer: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: palette.teal,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: {
    color: '#fff', fontSize: typography.heading, fontWeight: '800',
  },
  heroMeta: {
    marginLeft: 16, flex: 1,
  },
  heroName: {
    fontSize: typography.title, fontWeight: '800', color: palette.slate,
  },
  heroSub: {
    fontSize: typography.body, color: palette.slateMuted, marginTop: 2,
  },
  promoCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: palette.card, borderRadius: 16, padding: 16, marginBottom: 20, gap: 12,
    ...cardShadow,
  },
  promoIconContainer: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(42, 122, 114, 0.06)',
    justifyContent: 'center', alignItems: 'center',
  },
  promoTextContainer: { flex: 1, gap: 1 },
  promoTitle: { fontSize: typography.body, fontWeight: '700', color: palette.slate },
  promoSubtitle: { fontSize: typography.body - 1, color: palette.slateSubtle, lineHeight: 14 },
  sectionCard: {
    backgroundColor: palette.card, borderRadius: 20, padding: 20, marginBottom: 20,
    ...cardShadow,
  },
  sectionTitle: {
    fontSize: 17, fontWeight: '700', color: palette.slate, marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, width: '100%',
  },
  sectionHeading: {
    fontSize: typography.subtitle, fontWeight: '700', color: palette.slate, marginBottom: 0,
  },
  editToggleBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(42, 122, 114, 0.06)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10,
  },
  editToggleText: { fontSize: typography.body - 1, fontWeight: '700', color: palette.teal },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, width: '100%' },
  metricCard: {
    width: '48%', flexGrow: 1, backgroundColor: palette.background, borderRadius: 14, padding: 12,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  metricIconContainer: {
    width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center',
  },
  metricInfo: { flex: 1, gap: 1 },
  metricLabel: {
    fontSize: typography.caption, fontWeight: '700', color: palette.slateSubtle, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  metricValue: { fontSize: typography.subtitle, fontWeight: '700', color: palette.slate },
  inputGroup: { marginBottom: 14 },
  inputLabel: { fontSize: typography.body, fontWeight: '600', color: palette.slateMuted, marginBottom: 6 },
  textInput: { backgroundColor: palette.background, borderRadius: 12, padding: 12, fontSize: 16, color: palette.slate },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  chipsTray: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: palette.background },
  chipSelected: { backgroundColor: palette.sageLight },
  chipLabel: { fontSize: typography.body - 1, color: palette.slateMuted, fontWeight: '500' },
  chipLabelSelected: { color: palette.tealDark, fontWeight: '700' },
  infoBox: { backgroundColor: 'rgba(239, 68, 68, 0.03)', borderRadius: 10, padding: 10, marginTop: 6 },
  infoBoxText: { fontSize: typography.body - 1, color: palette.slateSubtle, lineHeight: 15 },
  formActionsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  cancelButton: { backgroundColor: palette.background, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  cancelButtonText: { color: palette.slateMuted, fontSize: typography.body, fontWeight: '600' },
  saveButton: { backgroundColor: palette.teal, borderRadius: 12, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  saveButtonLoading: { opacity: 0.8 },
  saveButtonSuccess: { backgroundColor: '#16A34A' },
  saveBtnContent: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  saveButtonText: { color: '#fff', fontSize: typography.body, fontWeight: '700' },
  customSexContainer: { marginTop: 8, backgroundColor: palette.background, borderRadius: 10, padding: 10 },
  customSexLabel: { fontSize: typography.body - 1, fontWeight: '600', color: palette.slateMuted, marginBottom: 4 },
  customSexInput: { fontSize: 16, color: palette.slate, padding: 0 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  modalContent: { width: '100%', maxWidth: 400, backgroundColor: palette.card, borderRadius: 24, padding: 28, alignItems: 'center', ...cardShadow },
  modalTitle: { fontSize: typography.heading, fontWeight: '800', color: palette.slate, marginBottom: 6 },
  modalSubtitle: { fontSize: typography.body, color: palette.slateMuted, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  benefitsList: { width: '100%', gap: 14, marginBottom: 28 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  benefitIcon: { fontSize: typography.subtitle, color: palette.teal, width: 24, textAlign: 'center' },
  benefitText: { flex: 1, fontSize: typography.body, color: palette.slate, lineHeight: 20 },
  modalButton: { width: '100%', backgroundColor: palette.teal, borderRadius: 24, paddingVertical: 14, alignItems: 'center' },
  modalButtonText: { fontSize: typography.subtitle, fontWeight: '700', color: '#fff' },
  modalDismiss: { marginTop: 16, paddingVertical: 8 },
  modalDismissText: { fontSize: typography.body, color: palette.slateMuted, fontWeight: '600' },
  signOutButton: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: palette.border, backgroundColor: 'transparent' },
  signOutButtonText: { fontSize: typography.body - 1, fontWeight: '700', color: palette.high },
  avatarImage: { width: 56, height: 56, borderRadius: 28 },
  modalButtonDisabled: { opacity: 0.5 },

  calcGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  calcTile: {
    width: '48%', flexGrow: 1, backgroundColor: palette.sageLight, borderRadius: 16, padding: 16, gap: 2,
  },
  calcTileLabel: { fontSize: 12, fontWeight: '600', color: palette.slateSubtle, letterSpacing: 0.3, marginBottom: 2 },
  calcTileValue: { fontSize: 22, fontWeight: '800', color: palette.slate, letterSpacing: -0.3 },
  calcTileSub: { fontSize: 12, fontWeight: '500', color: palette.slateMuted, marginTop: 1 },
  calcTileStatus: { fontSize: 11, fontWeight: '600', marginTop: 1 },
  bmiScaleWrap: { marginTop: 10, gap: 6 },
  bmiScaleBar: { height: 6, borderRadius: 3, overflow: 'hidden', position: 'relative', backgroundColor: palette.border },
  bmiSegments: { flexDirection: 'row', height: '100%' },
  bmiSegment: { height: '100%' },
  bmiLine: { position: 'absolute', top: -3, width: 2, height: 12, backgroundColor: palette.slate, borderRadius: 1, marginLeft: -1 },
  bmiLabelRow: { position: 'relative', height: 16, width: '100%' },
  bmiLabelWrap: { position: 'absolute', alignItems: 'center', transform: [{ translateX: -50 }] },

  analyticsList: { gap: 0 },
  analyticsRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E8EDEB' },
  analyticsLabel: { fontSize: 14, fontWeight: '600', color: palette.slateSubtle, flex: 1 },
  analyticsValue: { fontSize: 15, fontWeight: '700', color: palette.slate, textAlign: 'right' },
  analyticsTag: { fontSize: 12, fontWeight: '500', color: palette.slateMuted },
  rowLast: { borderBottomWidth: 0 },

  emptyText: { fontSize: 14, lineHeight: 20, color: palette.slateMuted, marginBottom: 12 },
  linkText: { fontSize: 14, fontWeight: '700', color: palette.teal },
});
