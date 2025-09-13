import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, AppStateStatus, Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';

type Pipe = {
  id: number;
  x: number;
  gapY: number;
};

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');


const BIRD_X = Math.floor(SCREEN_W * 0.25);
const BIRD_SIZE = 28;
const GRAVITY = 1800;
const JUMP_VELOCITY = -520;
const MAX_FALL_SPEED = 900;
const PIPE_SPEED = 180;
const PIPE_GAP = Math.max(140, Math.floor(SCREEN_H * 0.22));
const PIPE_WIDTH = 70;
const PIPE_SPAWN_INTERVAL = 1600;
const FLOOR_Y = SCREEN_H - Math.floor(SCREEN_H * 0.1);

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function FlappyBird() {
  const [running, setRunning] = useState(true);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);


  const [birdY, setBirdY] = useState(SCREEN_H * 0.45);


  const velocityY = useRef(0);
  const pipesRef = useRef<Pipe[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const lastSpawnRef = useRef<number>(0);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  const resetGame = useCallback(() => {
    setRunning(true);
    setScore(0);
    setBirdY(SCREEN_H * 0.45);
    velocityY.current = 0;
    pipesRef.current = [];
    lastTsRef.current = null;
    lastSpawnRef.current = 0;
  }, []);


  const spawnPipe = useCallback(() => {
    const margin = 80;
    const gapCenter = clamp(
      Math.floor(margin + Math.random() * (FLOOR_Y - margin - PIPE_GAP)),
      margin + PIPE_GAP / 2,
      FLOOR_Y - margin - PIPE_GAP / 2
    );
    const id = Date.now() + Math.floor(Math.random() * 1000);
    pipesRef.current.push({ id, x: SCREEN_W + PIPE_WIDTH, gapY: gapCenter });
  }, []);


  const checkCollision = useCallback((by: number): boolean => {
    const birdRect = {
      left: BIRD_X - BIRD_SIZE / 2,
      right: BIRD_X + BIRD_SIZE / 2,
      top: by - BIRD_SIZE / 2,
      bottom: by + BIRD_SIZE / 2,
    };


    if (birdRect.top < 0 || birdRect.bottom > FLOOR_Y) return true;


    for (const p of pipesRef.current) {
      const topPipeRect = {
        left: p.x,
        right: p.x + PIPE_WIDTH,
        top: 0,
        bottom: p.gapY - PIPE_GAP / 2,
      };
      const bottomPipeRect = {
        left: p.x,
        right: p.x + PIPE_WIDTH,
        top: p.gapY + PIPE_GAP / 2,
        bottom: FLOOR_Y,
      };

      const overlap = (a: any, b: any) =>
        a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

      if (overlap(birdRect, topPipeRect) || overlap(birdRect, bottomPipeRect)) {
        return true;
      }
    }
    return false;
  }, []);


  const onTap = useCallback(() => {
    if (!running) {
      resetGame();
      return;
    }
    velocityY.current = JUMP_VELOCITY;
  }, [running, resetGame]);


  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (appState.current.match(/active/) && nextState.match(/inactive|background/)) {
        if (rafRef.current != null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      }
      appState.current = nextState;
    });
    return () => sub.remove();
  }, []);


  useEffect(() => {
    if (!running) {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    const loop = (ts: number) => {
      if (lastTsRef.current == null) {
        lastTsRef.current = ts;
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      let dt = (ts - lastTsRef.current) / 1000;
      dt = clamp(dt, 0, 0.05);
      lastTsRef.current = ts;


      velocityY.current = clamp(velocityY.current + GRAVITY * dt, -Infinity, MAX_FALL_SPEED);
      const nextBirdY = clamp(birdY + velocityY.current * dt, 0, FLOOR_Y - BIRD_SIZE / 2);
      setBirdY(nextBirdY);


      pipesRef.current = pipesRef.current
        .map((p) => ({ ...p, x: p.x - PIPE_SPEED * dt }))
        .filter((p) => p.x + PIPE_WIDTH > 0);

      if (lastSpawnRef.current === 0) lastSpawnRef.current = ts;
      if (ts - lastSpawnRef.current > PIPE_SPAWN_INTERVAL) {
        spawnPipe();
        lastSpawnRef.current = ts;
      }


      for (const p of pipesRef.current) {

        if (p.x + PIPE_WIDTH < BIRD_X && (p as any)._scored !== true) {
          (p as any)._scored = true;
          setScore((s) => {
            const ns = s + 1;
            setBest((b) => Math.max(b, ns));
            return ns;
          });
        }
      }


      if (checkCollision(nextBirdY)) {
        setRunning(false);
        if (rafRef.current != null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        return;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [birdY, running, spawnPipe, checkCollision]);


  const pipes = useMemo(() => pipesRef.current, [score, running, birdY]);

  return (
    <Pressable style={styles.container} onPress={onTap}>
      {/* Sky */}
      <View style={styles.sky} />
      {/* Floor */}
      <View style={[styles.floor, { top: FLOOR_Y }]} />

      {/* Pipes */}
      {pipes.map((p) => {
        const topHeight = Math.max(0, p.gapY - PIPE_GAP / 2);
        const bottomTop = p.gapY + PIPE_GAP / 2;
        return (
          <React.Fragment key={p.id}>
            <View
              style={[
                styles.pipe,
                {
                  left: p.x,
                  top: 0,
                  height: topHeight,
                },
              ]}
            />
            <View
              style={[
                styles.pipe,
                {
                  left: p.x,
                  top: bottomTop,
                  height: Math.max(0, FLOOR_Y - bottomTop),
                },
              ]}
            />
          </React.Fragment>
        );
      })}

      {/* Bird */}
      <View
        style={[
          styles.bird,
          { left: BIRD_X - BIRD_SIZE / 2, top: birdY - BIRD_SIZE / 2 },
        ]}
      />

      {/* HUD */}
      <View style={styles.hud}>
        <Text style={styles.hudText}>Score: {score}</Text>
        <Text style={styles.hudText}>Best: {best}</Text>
      </View>

      {/* Game Over Overlay */}
      {!running && (
        <View style={styles.overlay}>
          <Text style={styles.title}>Game Over</Text>
          <Text style={styles.sub}>Tap to restart</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#70c5ce' },
  sky: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#70c5ce' },
  floor: { position: 'absolute', left: 0, right: 0, height: Math.floor(SCREEN_H * 0.1), backgroundColor: '#ded895' },
  bird: { position: 'absolute', width: BIRD_SIZE, height: BIRD_SIZE, borderRadius: BIRD_SIZE / 2, backgroundColor: '#ffeb3b', borderWidth: 2, borderColor: '#f0c000' },
  pipe: { position: 'absolute', width: PIPE_WIDTH, backgroundColor: '#5cb85c', borderColor: '#4cae4c', borderWidth: 2, borderRadius: 4 },
  hud: { position: 'absolute', top: 40, alignSelf: 'center', alignItems: 'center' },
  hudText: { color: '#fff', fontSize: 22, fontWeight: 'bold', textShadowColor: '#0006', textShadowRadius: 3 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#0008', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#fff', fontSize: 40, fontWeight: 'bold', marginBottom: 8 },
  sub: { color: '#fff', fontSize: 18 },
});
