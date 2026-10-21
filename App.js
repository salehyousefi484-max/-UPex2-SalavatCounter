import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  StyleSheet,
  Alert,
  StatusBar,
  Easing,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GOLD = '#E8C26A';
const GOLD_DARK = '#B8922F';
const SOFT_WHITE = '#F4EFE0';
const TARGETS = [33, 100, 313, 1000];

const SIZE = 300;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const STORAGE_KEY = 'salavat_state_v1';

export default function App() {
  useKeepAwake();

  const [loaded, setLoaded] = useState(false);
  const [count, setCount] = useState(0);
  const [rounds, setRounds] = useState(0);
  const [total, setTotal] = useState(0);
  const [target, setTarget] = useState(33);

  const progress = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  // بارگذاری اطلاعات ذخیره‌شده
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const s = JSON.parse(raw);
          setCount(s.count ?? 0);
          setRounds(s.rounds ?? 0);
          setTotal(s.total ?? 0);
          setTarget(s.target ?? 33);
        }
      } catch (e) {}
      setLoaded(true);
    })();
  }, []);

  // ذخیره با هر تغییر
  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ count, rounds, total, target })
    ).catch(() => {});
  }, [count, rounds, total, target, loaded]);

  // انیمیشن حلقه
  useEffect(() => {
    Animated.timing(progress, {
      toValue: count / target,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [count, target]);

  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMFERENCE, 0],
  });

  const addOne = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.95, duration: 60, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 90, useNativeDriver: true }),
    ]).start();

    const next = count + 1;
    setTotal((t) => t + 1);

    if (next >= target) {
      setRounds((r) => r + 1);
      setCount(0);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      setCount(next);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const changeTarget = (t) => {
    if (t === target) return;
    setTarget(t);
    setCount(0);
    Haptics.selectionAsync();
  };

  const resetAll = () => {
    Alert.alert('شروع از اول', 'شمارنده، دورها و مجموع صفر شود؟', [
      { text: 'خیر', style: 'cancel' },
      {
        text: 'بله',
        style: 'destructive',
        onPress: () => {
          setCount(0);
          setRounds(0);
          setTotal(0);
        },
      },
    ]);
  };

  return (
    <LinearGradient colors={['#0F4D3A', '#04170F']} style={styles.container}>
      <StatusBar barStyle="light-content" />

      <Text style={styles.title}>صلوات‌شمار</Text>
      <Text style={styles.subtitle}>
        اللهم صل علی محمد و آل محمد و عجل فرجهم
      </Text>

      {/* انتخاب هدف */}
      <View style={styles.targets}>
        {TARGETS.map((t) => {
          const active = t === target;
          return (
            <Pressable
              key={t}
              onPress={() => changeTarget(t)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {t}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* حلقه و دکمه اصلی */}
      <Animated.View style={[styles.ringWrap, { transform: [{ scale }] }]}>
        <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={STROKE}
            fill="none"
          />
          <AnimatedCircle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={GOLD}
            strokeWidth={STROKE}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            rotation="-90"
            origin={`${SIZE / 2}, ${SIZE / 2}`}
          />
        </Svg>

        <Pressable onPress={addOne} style={styles.tapOuter}>
          {({ pressed }) => (
            <LinearGradient
              colors={pressed ? ['#26926F', '#0F4D3A'] : ['#1D7A5C', '#0B3D2E']}
              style={styles.tapButton}
            >
              <Text style={styles.count}>{count}</Text>
              <Text style={styles.ofTarget}>از {target}</Text>
            </LinearGradient>
          )}
        </Pressable>
      </Animated.View>

      <Text style={styles.hint}>برای شمردن، دایره را لمس کنید</Text>

      {/* آمار */}
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{rounds}</Text>
          <Text style={styles.statLabel}>دور کامل</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{total}</Text>
          <Text style={styles.statLabel}>مجموع صلوات</Text>
        </View>
      </View>

      <Pressable onPress={resetAll} style={styles.resetBtn}>
        <Text style={styles.resetText}>شروع از اول</Text>
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 70,
    paddingHorizontal: 24,
  },
  title: {
    color: GOLD,
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    color: SOFT_WHITE,
    fontSize: 15,
    marginTop: 6,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  targets: {
    flexDirection: 'row',
    marginTop: 22,
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: GOLD_DARK,
  },
  chipActive: {
    backgroundColor: GOLD,
  },
  chipText: {
    color: GOLD,
    fontSize: 15,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#0B3D2E',
  },
  ringWrap: {
    width: SIZE,
    height: SIZE,
    marginTop: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapOuter: {
    width: SIZE - 44,
    height: SIZE - 44,
    borderRadius: (SIZE - 44) / 2,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: GOLD_DARK,
  },
  tapButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    color: SOFT_WHITE,
    fontSize: 72,
    fontWeight: 'bold',
  },
  ofTarget: {
    color: GOLD,
    fontSize: 16,
    writingDirection: 'rtl',
  },
  hint: {
    color: 'rgba(244,239,224,0.6)',
    fontSize: 12,
    marginTop: 18,
    writingDirection: 'rtl',
  },
  stats: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 24,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    color: GOLD,
    fontSize: 26,
    fontWeight: 'bold',
  },
  statLabel: {
    color: SOFT_WHITE,
    fontSize: 13,
    writingDirection: 'rtl',
  },
  resetBtn: {
    marginTop: 22,
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(244,239,224,0.4)',
  },
  resetText: {
    color: SOFT_WHITE,
    fontSize: 14,
    writingDirection: 'rtl',
  },
});