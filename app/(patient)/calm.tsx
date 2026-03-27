/**
 * Calm Screen — Sensory/Therapeutic
 * Slow breathing pacer with calming colors. No scoring, purely therapeutic.
 * Accessible from SOS screen and home for moments of agitation.
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { MBButton } from '../../components/ui/MBButton';
import { COLORS } from '../../constants/colors';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CalmScreen() {
  const router = useRouter();
  const breathAnim = useRef(new Animated.Value(0.4)).current;
  const labelAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Breathing loop: expand 4s, hold 2s, contract 4s = 10s cycle
    const loop = Animated.loop(
      Animated.sequence([
        // Inhale
        Animated.parallel([
          Animated.timing(breathAnim, { toValue: 1, duration: 4000, easing: Easing.bezier(0.25, 0.1, 0.25, 1), useNativeDriver: true }),
          Animated.timing(labelAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]),
        // Hold
        Animated.parallel([
          Animated.timing(breathAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
          Animated.timing(labelAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]),
        // Exhale
        Animated.parallel([
          Animated.timing(breathAnim, { toValue: 0.4, duration: 4000, easing: Easing.bezier(0.25, 0.1, 0.25, 1), useNativeDriver: true }),
          Animated.timing(labelAnim, { toValue: 2, duration: 200, useNativeDriver: true }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // Label text based on animation phase
  const labelText = labelAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0, 1, 2],
  });

  return (
    <SafeAreaView style={st.container}>
      <View style={st.content}>
        {/* Breathing circle */}
        <Animated.View
          style={[
            st.circle,
            { transform: [{ scale: breathAnim }] },
          ]}
        >
          <BreathLabel anim={labelAnim} />
        </Animated.View>
      </View>

      <View style={st.bottomBar}>
        <MBButton
          label="I'm feeling better"
          variant="ghost"
          size="compact"
          onPress={() => router.replace('/(patient)')}
          textStyle={{ color: COLORS.cream }}
        />
      </View>
    </SafeAreaView>
  );
}

// Separate component to display breath phase label
function BreathLabel({ anim }: { anim: Animated.Value }) {
  const [phase, setPhase] = React.useState('Breathe In...');

  useEffect(() => {
    const id = anim.addListener(({ value }) => {
      if (value < 0.5) setPhase('Breathe In...');
      else if (value < 1.5) setPhase('Hold...');
      else setPhase('Breathe Out...');
    });
    return () => anim.removeListener(id);
  }, []);

  return <Text style={st.breathText}>{phase}</Text>;
}

const st = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1B2A4A',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#2A9D8F40',
    borderWidth: 3,
    borderColor: '#2A9D8F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  breathText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.cream,
    textAlign: 'center',
  },
  bottomBar: {
    paddingBottom: 24,
    alignItems: 'center',
  },
});
