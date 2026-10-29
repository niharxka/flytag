import { Alert, Platform } from 'react-native';

/**
 * "Are you sure?" before something you can't undo (leave ride, cancel ride).
 * Phones get the native alert. On the web React Native's Alert does nothing at all, so the
 * browser's own confirm dialog is used instead.
 */
export function confirmAction({
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
}): void {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: cancelLabel, style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}
