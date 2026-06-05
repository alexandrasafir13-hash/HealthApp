import { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import {
  Plus,
  PanelLeft,
  MessageSquare,
  User,
  Trash2,
  FileText,
  Clock,
  Search,
  Pill,
  Calendar,
  Stethoscope,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Bookmark,
  Settings,
  LogIn,
  LogOut,
} from 'lucide-react-native';
import { router, useNavigation } from 'expo-router';
import { Text } from '@/components/Themed';
import HeartHandshakeLogo from '@/components/HeartHandshakeLogo';
import { useChat } from '@/context/ChatContext';
import { useHealth } from '@/context/HealthContext';
import { useAuth } from '@/context/AuthContext';
import { sidebarPalette, palette } from '@/constants/theme';
import { confirmDestructiveAction } from '@/lib/confirmDestructiveAction';


interface Props {
  width?: number;
  onToggleRightPanel: () => void;
  rightPanelOpen: boolean;
  onToggleSidebar?: () => void;
}

export default function ChatSidebar({ width: sidebarWidth = 300, onToggleSidebar }: Props) {
  const { sessions, activeSessionId, newSession, selectSession, deleteSession, hasUnreadSavedConversations } = useChat();
  const { profile, resetAllData } = useHealth();
  const { isAuthenticated, signInWithGoogle, signOutUser, loading: authLoading, showAuthModal, setShowAuthModal } = useAuth();
  const navigation = useNavigation();
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || !profileMenuOpen) return;
    const handleClick = (e: any) => {
      const target = e.target as HTMLElement;
      if (!target.closest?.('#sidebar-profile') && !target.closest?.('#sidebar-profile-dropdown')) {
        setProfileMenuOpen(false);
      }
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [profileMenuOpen]);
  
  const handleNewSession = () => {
    newSession();
    (navigation as any).navigate('(tabs)', { screen: 'index' });
  };

  const handleSelectSession = (id: string) => {
    selectSession(id);
    (navigation as any).navigate('(tabs)', { screen: 'index' });
  };

  const handleSignOut = async () => {
    const confirmed = await confirmDestructiveAction({
      title: 'Log out and clear local data?',
      message: 'This will log you out and clear local profile info, documents, providers, conversations, saved items, logs, and plans from this device.',
      confirmText: 'Log out',
    });
    if (!confirmed) return;

    setProfileMenuOpen(false);
    await signOutUser();
    await resetAllData();
    router.replace('/');
  };



  return (
    <View style={[styles.sidebar, { width: sidebarWidth - 24 }]}>
      {/* Brand */}
      <View style={styles.header}>
        <Pressable
          style={styles.brand}
          onPress={() => (navigation as any).navigate('(tabs)', { screen: 'index' })}
        >
          <HeartHandshakeLogo size={22} />
          <Text style={styles.brandText}>{`Healthy`}</Text>
        </Pressable>
        {onToggleSidebar && (
          <Pressable 
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]} 
            onPress={onToggleSidebar}
          >
            <PanelLeft size={17} color={sidebarPalette.textMuted} />
          </Pressable>
        )}
      </View>

      {/* New Chat */}
      <Pressable
        style={({ pressed }) => [styles.newChatBtn, pressed && { opacity: 0.8 }]}
        onPress={handleNewSession}
        id="sidebar-new-chat"
      >
        <Plus size={14} color={palette.teal} />
        <Text style={styles.newChatLabel}>{`New Conversation`}</Text>
      </Pressable>

      {/* Search */}
      {Platform.OS === 'web' && (
        <Pressable
          style={({ pressed }) => [styles.searchBtn, pressed && { opacity: 0.8 }]}
          onPress={() => window.dispatchEvent(new Event('open-global-search'))}
        >
          <Search size={14} color={sidebarPalette.textMuted} />
          <Text style={styles.searchLabel}>{`Search`}</Text>
          <View style={{flex: 1}} />
          <Text style={styles.searchShortcut}>⌘K</Text>
        </Pressable>
      )}

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Recent conversations */}
        {sessions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{`CONVERSATIONS`}</Text>
            {sessions.slice(0, 20).map((session) => (
              <ConversationRow
                key={session.id}
                title={session.title}
                isActive={session.id === activeSessionId}
                 onPress={() => handleSelectSession(session.id)}
                 onDelete={() => deleteSession(session.id)}
              />
            ))}
          </View>
        )}




      </ScrollView>

      {/* Bottom actions */}
      <View style={styles.bottom}>
        {!isAuthenticated ? (
          <Pressable
            style={({ pressed }) => [styles.signupCta, pressed && { opacity: 0.85 }]}
            onPress={() => setShowAuthModal(true)}
            accessibilityRole="button"
            accessibilityLabel={`Create account`}>
            <LogIn size={16} color="#FFFFFF" />
            <Text style={styles.signupCtaLabel}>{`Create account`}</Text>
          </Pressable>
        ) : (
          <View style={{ position: 'relative' }}>
          {profileMenuOpen && (
            <View style={styles.profileDropdown} id="sidebar-profile-dropdown">
              {/* Health Records Section */}
              <View style={{ paddingHorizontal: 6, paddingTop: 4, paddingBottom: 2 }}>
                <Text style={[styles.sectionLabel, { paddingVertical: 4, paddingHorizontal: 4 }]}>{`HEALTH RECORDS`}</Text>
              </View>
              <DropdownItem icon={Clock} label={`Timeline`} onPress={() => { setProfileMenuOpen(false); router.push('/timeline'); }} />
              <DropdownItem icon={FileText} label={`Documents`} onPress={() => { setProfileMenuOpen(false); router.push('/documents'); }} />
              <DropdownItem icon={Bookmark} label={`Saved Conversations`} hasDot={hasUnreadSavedConversations} onPress={() => { setProfileMenuOpen(false); router.push('/plans'); }} />
              <DropdownItem icon={Pill} label={`Medications`} onPress={() => { setProfileMenuOpen(false); if (typeof window !== 'undefined') window.alert(`Coming soon — this feature will be launched soon.`); }} />
              <DropdownItem icon={Calendar} label={`Appointments`} onPress={() => { setProfileMenuOpen(false); if (typeof window !== 'undefined') window.alert(`Coming soon — this feature will be launched soon.`); }} />
              <DropdownItem icon={Stethoscope} label={`Providers`} onPress={() => { setProfileMenuOpen(false); router.push('/providers'); }} />

              <View style={[styles.divider, { marginVertical: 4, marginHorizontal: 4 }]} />

              <DropdownItem icon={User} label={`Profile`} onPress={() => { setProfileMenuOpen(false); router.push('/profile'); }} />
              <DropdownItem icon={LogOut} label={`Log out`} onPress={handleSignOut} />
            </View>
          )}
          <Pressable
            style={({ pressed }) => [styles.bottomLink, pressed && { opacity: 0.7 }]}
            onPress={() => setProfileMenuOpen(!profileMenuOpen)}
            id="sidebar-profile"
          >
            <View>
              <User size={15} color={sidebarPalette.textMuted} />
              {hasUnreadSavedConversations && <View style={styles.profileUnreadDot} />}
            </View>
            <Text style={[styles.bottomLinkLabel, { flex: 1 }]} numberOfLines={1}>
              {profile?.name ?? `Profile`}
            </Text>
            {profileMenuOpen ? (
              <ChevronDown size={14} color={sidebarPalette.textMuted} />
            ) : (
              <ChevronUp size={14} color={sidebarPalette.textMuted} />
            )}
          </Pressable>
          </View>
        )}
      </View>
      <CreateAccountModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        signInWithGoogle={signInWithGoogle}
        authLoading={authLoading}
      />
    </View>
  );
}

// ── Conversation row ──────────────────────────────────────────────────────────

function ConversationRow({
  title,
  isActive,
  onPress,
  onDelete,
}: {
  title: string;
  isActive: boolean;
  onPress: () => void;
  onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.convRow,
        isActive && styles.convRowActive,
        pressed && { opacity: 0.8 },
      ]}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
    >
      <Text style={[styles.convTitle, isActive && styles.convTitleActive]} numberOfLines={1}>
        {title}
      </Text>
      {(hovered || isActive) && (
        <Pressable
          style={styles.deleteBtn}
          onPress={(e) => {
            e.stopPropagation?.();
            onDelete();
          }}
          hitSlop={8}
        >
          <Trash2 size={11} color={sidebarPalette.textMuted} />
        </Pressable>
      )}
    </Pressable>
  );
}



// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  sidebar: {
    flex: 1,
    alignSelf: 'flex-start',
    backgroundColor: sidebarPalette.bg,
    borderRadius: 16,
    margin: 12,
    borderWidth: 1,
    borderColor: sidebarPalette.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 12,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    marginTop: 4,
  },
  brandText: {
    fontSize: 17,
    fontWeight: '700',
    color: sidebarPalette.text,
    fontFamily: 'Nunito_700Bold',
    letterSpacing: -0.3,
  },
  newChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 12,
    marginBottom: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(42,122,114,0.15)',
    backgroundColor: 'rgba(42,122,114,0.06)',
  },
  newChatLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.teal,
    fontFamily: 'Nunito_600SemiBold',
  },
  searchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 12,
    marginBottom: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  searchLabel: {
    fontSize: 15,
    color: sidebarPalette.textMuted,
    fontFamily: 'Nunito_500Medium',
  },
  searchShortcut: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.3)',
    fontFamily: 'Nunito_600SemiBold',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 8,
    paddingBottom: 16,
    gap: 4,
  },
  section: {
    marginBottom: 12,
    gap: 2,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: sidebarPalette.textLabel,
    letterSpacing: 1.2,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontFamily: 'Nunito_700Bold',
  },
  expandableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 8,
  },
  convRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 7,
  },
  convRowActive: {
    backgroundColor: sidebarPalette.active,
  },
  convTitle: {
    flex: 1,
    fontSize: 15,
    color: sidebarPalette.text,
    fontFamily: 'Nunito_500Medium',
  },
  convTitleActive: {
    color: sidebarPalette.text,
    fontFamily: 'Nunito_600SemiBold',
  },
  navLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 7,
  },
  navLinkLabel: {
    fontSize: 15,
    color: sidebarPalette.text,
    fontFamily: 'Nunito_500Medium',
  },
  deleteBtn: {
    padding: 3,
    borderRadius: 4,
  },
  savedFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    paddingHorizontal: 8,
    marginBottom: 6,
  },
  filterChip: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  filterChipActive: {
    backgroundColor: 'rgba(42,122,114,0.1)',
  },
  filterChipLabel: {
    fontSize: 11,
    color: sidebarPalette.textMuted,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
  },
  filterChipLabelActive: {
    color: sidebarPalette.text,
  },
  savedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 7,
  },
  savedIcon: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  savedTitle: {
    flex: 1,
    fontSize: 13,
    color: sidebarPalette.textMuted,
    fontFamily: 'Nunito_400Regular',
  },
  emptySection: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  emptySectionText: {
    fontSize: 13,
    color: sidebarPalette.textMuted,
    fontFamily: 'Nunito_400Regular',
  },
  bottom: {
    paddingHorizontal: 8,
    paddingBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: sidebarPalette.border,
    gap: 2,
  },
  divider: {
    height: 1,
    backgroundColor: sidebarPalette.border,
    marginBottom: 8,
  },
  bottomLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 7,
  },
  bottomLinkLabel: {
    fontSize: 15,
    color: sidebarPalette.text,
    fontFamily: 'Nunito_500Medium',
  },
  signupCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: palette.teal,
  },
  signupCtaLabel: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
  },
  profileDropdown: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    marginBottom: 8,
    backgroundColor: sidebarPalette.bg,
    borderRadius: 16,
    padding: 6,
    borderWidth: 1,
    borderColor: sidebarPalette.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
    zIndex: 50,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  dropdownLabel: {
    fontSize: 15,
    color: sidebarPalette.text,
    fontFamily: 'Nunito_500Medium',
  },
  dropdownDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.teal,
    marginLeft: 'auto',
  },
  profileUnreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.teal,
    borderWidth: 1,
    borderColor: sidebarPalette.bg,
  },
  backBtn: {
    fontSize: 13,
    color: sidebarPalette.textMuted,
    fontFamily: 'Nunito_600SemiBold',
  },
  savedDetailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  savedDetailBadgeLabel: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
  },
  savedDetailTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: sidebarPalette.text,
    fontFamily: 'Nunito_700Bold',
    lineHeight: 20,
    marginBottom: 4,
  },
  savedDetailDate: {
    fontSize: 11,
    color: sidebarPalette.textMuted,
    fontFamily: 'Nunito_400Regular',
  },
  savedDetailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: sidebarPalette.border,
  },
  savedDetailDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 6,
    flexShrink: 0,
  },
  savedDetailItemLabel: {
    flex: 1,
    fontSize: 12,
    color: sidebarPalette.textMuted,
    lineHeight: 18,
    fontFamily: 'Nunito_400Regular',
  },
  savedDetailItemValue: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
  },
  deleteFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 7,
  },
  deleteFullBtnLabel: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: palette.card,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: palette.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: palette.slate,
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Nunito_700Bold',
  },
  modalSubtitle: {
    fontSize: 15,
    color: palette.slateMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 18,
    fontFamily: 'Nunito_400Regular',
  },
  benefitsList: {
    gap: 10,
    marginBottom: 22,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  benefitIcon: {
    color: palette.teal,
    fontSize: 18,
    lineHeight: 22,
  },
  benefitText: {
    flex: 1,
    color: palette.slate,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Nunito_400Regular',
  },
  modalButton: {
    backgroundColor: palette.teal,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalButtonDisabled: {
    opacity: 0.55,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
  },
  modalDismiss: {
    alignItems: 'center',
    paddingTop: 14,
  },
  modalDismissText: {
    color: palette.slateMuted,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
  },
});

function CreateAccountModal({
  visible,
  onClose,
  signInWithGoogle,
  authLoading,
}: {
  visible: boolean;
  onClose: () => void;
  signInWithGoogle: () => Promise<void>;
  authLoading: boolean;
}) {
    return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{`Create your account`}</Text>
          <Text style={styles.modalSubtitle}>{`Save your progress and sync your data across devices.`}</Text>
          <View style={styles.benefitsList}>
            {[
              `Sync your data across all your devices`,
              `Back up your conversations, documents, and plans`,
              `Keep your history and progress in one place`,
            ].map((benefit) => (
              <View key={benefit} style={styles.benefitRow}>
                <Text style={styles.benefitIcon}>•</Text>
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>
          <Pressable
            style={[styles.modalButton, authLoading && styles.modalButtonDisabled]}
            onPress={async () => {
              await signInWithGoogle();
              onClose();
            }}
            disabled={authLoading}
            accessibilityRole="button"
            accessibilityLabel={`Sign in with Google`}>
            {authLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.modalButtonText}>{`Sign in with Google`}</Text>
            )}
          </Pressable>
          <Pressable style={styles.modalDismiss} onPress={onClose}>
            <Text style={styles.modalDismissText}>{`Maybe later`}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ── Dropdown Item ─────────────────────────────────────────────────────────────

function DropdownItem({ onPress, icon: Icon, label, hasDot }: { onPress: () => void, icon: any, label: string, hasDot?: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      style={({ pressed }) => [
        styles.dropdownItem,
        (pressed || hovered) && { backgroundColor: 'rgba(0,0,0,0.06)' }
      ]}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
    >
      <Icon size={15} color={sidebarPalette.textMuted} />
      <Text style={styles.dropdownLabel}>{label}</Text>
      {hasDot && <View style={styles.dropdownDot} />}
    </Pressable>
  );
}
