import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Keyboard, Platform, ScrollView, TextInput, type ScrollViewProps } from 'react-native';

// Breathing room between the focused field and the top of the keyboard (Android).
const FIELD_GAP = 16;

type Props = ScrollViewProps & { className?: string; contentContainerClassName?: string };

/**
 * A ScrollView that keeps the field you're typing in above the keyboard, with everything above
 * still scrollable. It *adds scroll room* for the hidden part instead of resizing the view:
 * inside a native sheet the sheet sets its content's height, so shrinking the view does nothing.
 *
 * iOS: React Native's native `automaticallyAdjustKeyboardInsets` measures this view's real
 * on-screen frame against the keyboard, adds the overlap as bottom inset and scrolls the focused
 * input into view, animated with the keyboard.
 * Android: the same idea in JS: pad the content by the overlap, then scroll the input into view.
 * Keep it the screen's root view: wrapping a sheet's content in another flex view breaks it.
 */
export function KeyboardScrollView({ onScroll, scrollEventThrottle, contentContainerStyle, ...rest }: Props) {
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const offsetY = useRef(0);
  const [androidPad, setAndroidPad] = useState(0);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onShow = (keyboardTop: number) => {
      scroll.current?.measureInWindow((_x, y, _w, height) => {
        setAndroidPad(Math.max(0, y + height - keyboardTop));
        // After the padding lays out, scroll the focused field above the keyboard.
        requestAnimationFrame(() => {
          TextInput.State.currentlyFocusedInput()?.measureInWindow((_ix, iy, _iw, ih) => {
            const hiddenBy = iy + ih + FIELD_GAP - keyboardTop;
            if (hiddenBy > 0) scroll.current?.scrollTo({ y: offsetY.current + hiddenBy, animated: true });
          });
        });
      });
    };

    const subs = [
      Keyboard.addListener('keyboardDidShow', (e) => onShow(e.endCoordinates.screenY)),
      Keyboard.addListener('keyboardDidHide', () => setAndroidPad(0)),
    ];
    return () => subs.forEach((s) => s.remove());
  }, []);

  return (
    <ScrollView
      {...rest}
      ref={scroll}
      automaticallyAdjustKeyboardInsets
      contentContainerStyle={[contentContainerStyle, androidPad ? { paddingBottom: androidPad } : null]}
      scrollEventThrottle={scrollEventThrottle ?? 16}
      onScroll={(e) => {
        offsetY.current = e.nativeEvent.contentOffset.y;
        onScroll?.(e);
      }}
    />
  );
}
