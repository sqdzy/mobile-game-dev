import Match3Board from '@/components/match3/Match3Board';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function Match3Screen() {
  const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [finalScore, setFinalScore] = useState(0);
  const restart = () => {
    setStatus('playing');
    setFinalScore(0);
    // Remount board via key change by toggling state
    setBoardKey((k) => k + 1);
  };
  const [boardKey, setBoardKey] = useState(0);

  return (
    <View style={styles.container}>
      {status === 'playing' && (
        <Match3Board
          key={boardKey}
          onLevelComplete={(score) => {
            setFinalScore(score);
            setStatus('won');
          }}
          onGameOver={(score) => {
            setFinalScore(score);
            setStatus('lost');
          }}
        />
      )}
      {status !== 'playing' && (
        <View style={styles.overlay}>
          <Text style={styles.title}>{status === 'won' ? 'Уровень пройден!' : 'Игра окончена'}</Text>
          <Text style={styles.sub}>Очки: {finalScore}</Text>
          <Pressable style={styles.button} onPress={restart}>
            <Text style={styles.buttonText}>Играть снова</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121216' },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000a' },
  title: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginBottom: 12 },
  sub: { color: '#fff', fontSize: 18, marginBottom: 24 },
  button: { backgroundColor: '#2563eb', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 30 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
