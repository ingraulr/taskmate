import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';

type AnimatedViewProps = {
  style?: any;
  pointerEvents?: 'box-none' | 'none' | 'box-only' | 'auto';
  children?: React.ReactNode;
};
const AnimatedView = Animated.View as unknown as React.FC<AnimatedViewProps>;

interface Props {
  message: string;
  visible: boolean;
}

export default function Toast({ message, visible }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(1800),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, message]);

  return (
    <AnimatedView style={[s.toast, { opacity }]} pointerEvents="none">
      <Text style={s.text}>{message}</Text>
    </AnimatedView>
  );
}

const s = StyleSheet.create({
  toast: {
    position: 'absolute', bottom: 40, alignSelf: 'center',
    backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155',
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20,
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  text: { color: '#e2e8f0', fontSize: 14, fontWeight: '500' },
});
