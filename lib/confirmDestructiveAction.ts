import { Alert, Platform } from 'react-native';

type ConfirmDestructiveActionOptions = {
  title: string;
  message: string;
  confirmText?: string;
};

export function confirmDestructiveAction({
  title,
  message,
  confirmText = 'Delete',
}: ConfirmDestructiveActionOptions): Promise<boolean> {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }

  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: confirmText, style: 'destructive', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}
