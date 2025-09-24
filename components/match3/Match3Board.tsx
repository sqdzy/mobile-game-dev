import { LEVEL_MOVES, LEVEL_TARGET_SCORE } from '@/game/match3/constants';
import { activateCombinedSpecial, activateSpecial, attemptSwap, initBoard, peekMatches, resolveBoard } from '@/game/match3/logic';
import { BoardState, Position } from '@/game/match3/types';
import { cloneBoard, createEmptyBoard, positionsEqual, swapTiles } from '@/game/match3/utils';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, LayoutAnimation, Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
// Optional dynamic Skia import (keeps bundle working when Skia not installed / web)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Skia: any;
try {
    Skia = require('@shopify/react-native-skia');
} catch {}

// Simple color palette mapping for visual; can be replaced with assets later
const COLOR_MAP: Record<string, string> = {
    red: '#ff5252',
    blue: '#42a5f5',
    green: '#66bb6a',
    yellow: '#ffca28',
    purple: '#ab47bc',
};

const SPECIAL_EMOJI: Record<string, string> = {
    rocketH: '➡️',
    rocketV: '⬆️',
    lightning: '⚡',
    bomb: '💣',
};

interface Props {
    onLevelComplete(score: number): void;
    onGameOver(score: number): void;
}

export const Match3Board: React.FC<Props> = ({ onLevelComplete, onGameOver }) => {
    const [board, setBoard] = useState<BoardState>(() => initBoard(createEmptyBoard()));
    const [selected, setSelected] = useState<Position | null>(null);
    const [score, setScore] = useState(0);
    const [moves, setMoves] = useState(LEVEL_MOVES);
    const [started, setStarted] = useState(false); // игрок сделал первый валидный ход
    const resolvingRef = useRef(false);
    const chainRef = useRef(1);
    const animatingRef = useRef(false); // блокируем повторные действия во время анимации
    const [tick, setTick] = useState(0); // force re-render when new animated nodes created
    const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
    const skiaAvailable = !!Skia && Platform.OS !== 'web';
    const [useSkia, setUseSkia] = useState<boolean>(skiaAvailable); // disable on web to avoid crashes
    const [skiaFrame, setSkiaFrame] = useState(0); // lightweight ticker for Skia canvas
    const skiaSubsRef = useRef<Map<string, {x?: string; y?: string; opacity?: string; scale?: string}>>(new Map());
    const boardRef = useRef(board);
    useEffect(() => { boardRef.current = board; });

    // Каскадное разрешение (запускаем вручную только после успешного хода / комбо / активации)
    const runResolveLoop = useCallback((startChain = 1) => {
        if (resolvingRef.current || animatingRef.current) return;
        resolvingRef.current = true;
        const step = (chain: number) => {
            const matches = peekMatches(boardRef.current);
            if (matches.length === 0) {
                resolvingRef.current = false;
                setRemovingIds(new Set());
                return;
            }
            // Collect IDs to remove
            const ids: string[] = [];
            matches.forEach(p => {
                const t = boardRef.current.tiles[p.row][p.col];
                if (t) ids.push(t.id);
            });
            const removing = new Set(ids);
            setRemovingIds(removing);
            // Animate removal (fade+scale) then apply resolve
            setTimeout(() => {
                // Apply single resolve step (which may also create specials)
                const res = resolveBoard(boardRef.current, chain);
                if (res) setScore(s => s + res.scoreGain);
                // Update board state to trigger position animations
                setBoard({ ...boardRef.current, tiles: boardRef.current.tiles.map(r => [...r]) });
                setRemovingIds(new Set());
                if (res) {
                    // schedule next cascade after tiles have fallen/appeared
                    setTimeout(() => step(chain + 1), 260);
                } else {
                    resolvingRef.current = false;
                }
            }, 260); // duration matches removal animation
        };
        step(startChain);
    }, []);

    // Удалили авто-резолв на старте: initBoard гарантирует отсутствие стартовых матчей

    useEffect(() => {
        if (started && score >= LEVEL_TARGET_SCORE) {
            onLevelComplete(score);
        } else if (started && moves <= 0) {
            onGameOver(score);
        }
    }, [score, moves, onLevelComplete, onGameOver, started]);

    const handleSelect = (pos: Position) => {
    if (resolvingRef.current || animatingRef.current) return;
        const tile = board.tiles[pos.row][pos.col];
        if (selected && positionsEqual(selected, pos)) {
            // same tile second tap; activate special if any
            if (tile.special) {
                const copy = { ...board, tiles: board.tiles.map((r) => r.map((t) => ({ ...t }))) };
                const res = activateSpecial(copy, pos);
                if (res) {
                    setBoard(copy);
                    setScore((s) => s + res.scoreGain);
                    setSelected(null);
                    return;
                }
            }
            setSelected(null);
            return;
        }
        if (!selected) {
            setSelected(pos);
            return;
        }
        if (isAdjacent(selected, pos)) {
            const aTile = board.tiles[selected.row][selected.col];
            const bTile = board.tiles[pos.row][pos.col];
            const bothSpecial = !!aTile.special && !!bTile.special;
            if (bothSpecial) {
                const copy = { ...board, tiles: board.tiles.map(r => r.map(t => ({ ...t }))) };
                // swap
                const tmp = copy.tiles[selected.row][selected.col];
                copy.tiles[selected.row][selected.col] = copy.tiles[pos.row][pos.col];
                copy.tiles[pos.row][pos.col] = tmp;
                const combo = activateCombinedSpecial(copy, selected, pos);
                if (!started) setStarted(true);
                if (combo) setScore(s => s + combo.scoreGain);
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setBoard(copy);
                setMoves(m => m - 1);
                setTimeout(() => runResolveLoop(1), 0);
            } else {
                const attempt = attemptSwap(board, selected, pos);
                if (attempt.valid) {
                    if (!started) setStarted(true);
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setBoard(attempt.board);
                    setMoves(m => m - 1); // удачный ход расходует попытку
                    chainRef.current = 1;
                    setTimeout(() => runResolveLoop(1), 0);
                } else {
                    // Визуализируем невалидный свап и откатываем обратно, ход не тратим
                    animatingRef.current = true;
                    const temp = cloneBoard(board);
                    swapTiles(temp, selected, pos);
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setBoard(temp);
                    setTimeout(() => {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                        setBoard(board); // откат к исходному
                        animatingRef.current = false;
                    }, 250);
                }
            }
            setSelected(null);
        } else {
            setSelected(pos);
        }
    };

    // Animated positions
    const SPACING = 4;
    const TILE_SIZE = 46; // чуть крупнее под канвас
    const boardWidth = board.cols * (TILE_SIZE + SPACING) + SPACING;
    const boardHeight = board.rows * (TILE_SIZE + SPACING) + SPACING;
    const posMap = useRef(new Map<string, { x: Animated.Value; y: Animated.Value; opacity: Animated.Value; scale: Animated.Value }>());

    useEffect(() => {
        let added = false;
        const existingIds = new Set<string>();
        for (let r = 0; r < board.rows; r++) {
            for (let c = 0; c < board.cols; c++) {
                const tile = board.tiles[r][c];
                existingIds.add(tile.id);
                if (!posMap.current.has(tile.id)) {
                    added = true;
                    const entry = {
                        x: new Animated.Value(SPACING + c * (TILE_SIZE + SPACING)),
                        y: new Animated.Value(-70),
                        opacity: new Animated.Value(0),
                        scale: new Animated.Value(1),
                    };
                    posMap.current.set(tile.id, entry);
                    Animated.parallel([
                        Animated.spring(entry.y, { toValue: SPACING + r * (TILE_SIZE + SPACING), damping: 14, stiffness: 160, mass: 0.55, useNativeDriver: false }),
                        Animated.timing(entry.opacity, { toValue: 1, duration: 240, useNativeDriver: false }),
                    ]).start();
                    // attach listeners immediately if in Skia mode
                    if (useSkia) {
                        const subs: any = {};
                        subs.x = entry.x.addListener(()=> setSkiaFrame(f=> (f+1)%100000));
                        subs.y = entry.y.addListener(()=> setSkiaFrame(f=> (f+1)%100000));
                        subs.opacity = entry.opacity.addListener(()=> setSkiaFrame(f=> (f+1)%100000));
                        subs.scale = entry.scale.addListener(()=> setSkiaFrame(f=> (f+1)%100000));
                        skiaSubsRef.current.set(tile.id, subs);
                    }
                } else {
                    const targetX = SPACING + c * (TILE_SIZE + SPACING);
                    const targetY = SPACING + r * (TILE_SIZE + SPACING);
                    const anim = posMap.current.get(tile.id)!;
                    if (!removingIds.has(tile.id)) {
                        Animated.parallel([
                            Animated.spring(anim.x, { toValue: targetX, damping: 15, stiffness: 180, mass: 0.55, useNativeDriver: false }),
                            Animated.spring(anim.y, { toValue: targetY, damping: 15, stiffness: 180, mass: 0.55, useNativeDriver: false }),
                        ]).start();
                    }
                }
            }
        }
        // cleanup stale animations
        for (const key of Array.from(posMap.current.keys())) {
            if (!existingIds.has(key)) posMap.current.delete(key);
        }
        if (added) setTick(t => t + 1);
    }, [board, removingIds, useSkia]);

    // When toggling Skia on, attach listeners for existing animations; when off, remove them.
    useEffect(() => {
        if (!useSkia) {
            // cleanup
            skiaSubsRef.current.forEach((subs, id) => {
                const anim = posMap.current.get(id);
                if (anim) {
                    try { subs.x && anim.x.removeListener(subs.x); } catch {}
                    try { subs.y && anim.y.removeListener(subs.y); } catch {}
                    try { subs.opacity && anim.opacity.removeListener(subs.opacity); } catch {}
                    try { subs.scale && anim.scale.removeListener(subs.scale); } catch {}
                }
            });
            skiaSubsRef.current.clear();
            return;
        }
        // attach to all existing
        posMap.current.forEach((anim, id) => {
            if (skiaSubsRef.current.has(id)) return;
            const subs: any = {};
            subs.x = anim.x.addListener(()=> setSkiaFrame(f=> (f+1)%100000));
            subs.y = anim.y.addListener(()=> setSkiaFrame(f=> (f+1)%100000));
            subs.opacity = anim.opacity.addListener(()=> setSkiaFrame(f=> (f+1)%100000));
            subs.scale = anim.scale.addListener(()=> setSkiaFrame(f=> (f+1)%100000));
            skiaSubsRef.current.set(id, subs);
        });
        return () => {
            skiaSubsRef.current.forEach((subs, id) => {
                const anim = posMap.current.get(id);
                if (anim) {
                    try { subs.x && anim.x.removeListener(subs.x); } catch {}
                    try { subs.y && anim.y.removeListener(subs.y); } catch {}
                    try { subs.opacity && anim.opacity.removeListener(subs.opacity); } catch {}
                    try { subs.scale && anim.scale.removeListener(subs.scale); } catch {}
                }
            });
            skiaSubsRef.current.clear();
        };
    }, [useSkia]);

    // Animate removal phase when removingIds changes
    useEffect(() => {
        if (removingIds.size === 0) return;
        removingIds.forEach(id => {
            const anim = posMap.current.get(id);
            if (!anim) return;
            Animated.parallel([
                Animated.sequence([
                    Animated.timing(anim.scale, { toValue: 1.15, duration: 120, useNativeDriver: false }),
                    Animated.timing(anim.scale, { toValue: 0.1, duration: 160, useNativeDriver: false }),
                ]),
                Animated.timing(anim.opacity, { toValue: 0, duration: 260, useNativeDriver: false }),
            ]).start();
        });
    }, [removingIds]);

    // SKIA RENDERER ===========================================================
    const renderSkia = () => {
    if (!Skia) return null;
        const { Canvas, Group, RoundedRect, Text: SkText, useFont } = Skia;
        // lazy font load fallback (system font path not guaranteed); using emoji specials directly inside overlay
        const tiles: React.ReactElement[] = [];
        const removing = removingIds;
        for (let r = 0; r < board.rows; r++) {
            for (let c = 0; c < board.cols; c++) {
                const tile = board.tiles[r][c];
                const anim = posMap.current.get(tile.id);
                if (!anim) continue;
                const key = tile.id;
                const isSel = selected && positionsEqual(selected, { row: r, col: c });
                const isRemoving = removing.has(tile.id);
                // We rely on Animated values – read via __getValue for Skia (not ideal but workable).
                // Access internal current values. In production you could mirror via useRef + addListener.
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const getVal = (v: any) => (typeof v?.__getValue === 'function' ? v.__getValue() : v._value ?? 0);
                const x = getVal(anim.x);
                const y = getVal(anim.y);
                const scale = getVal(anim.scale);
                const opacity = getVal(anim.opacity);
                const size = TILE_SIZE * scale;
                const cx = x + (TILE_SIZE - size) / 2;
                const cy = y + (TILE_SIZE - size) / 2;
                tiles.push(
                    <Group key={key} opacity={opacity}>
                        <RoundedRect x={cx} y={cy} r={10} width={size} height={size} color={COLOR_MAP[tile.color] || '#999'} strokeWidth={isSel ? 3 : 2} stroke={isSel ? '#ffffff' : '#00000055'} />
                        {tile.special && (
                            <SkText x={cx + size / 2 - 8} y={cy + size / 2 + 6} text={SPECIAL_EMOJI[tile.special]} color={'#fff'} />
                        )}
                    </Group>
                );
            }
        }
        return <Canvas style={{ position: 'absolute', width: boardWidth, height: boardHeight }}>{tiles}</Canvas>;
    };

    const renderTiles = () => {
        const items: React.ReactElement[] = [];
        for (let r = 0; r < board.rows; r++) {
            for (let c = 0; c < board.cols; c++) {
                const tile = board.tiles[r][c];
                const anim = posMap.current.get(tile.id);
                if (!anim) {
                    // Fallback immediate static tile (first paint)
                    items.push(
                        <View
                            key={tile.id}
                            style={[styles.tile, {
                                position: 'absolute',
                                left: SPACING + c * (TILE_SIZE + SPACING),
                                top: SPACING + r * (TILE_SIZE + SPACING),
                                width: TILE_SIZE,
                                height: TILE_SIZE,
                                backgroundColor: COLOR_MAP[tile.color] || '#999',
                                borderColor: positionsEqual(selected, { row: r, col: c }) ? '#fff' : '#0003',
                            }]}
                        >
                            <Pressable style={styles.pressFill} onPress={() => handleSelect({ row: r, col: c })}>
                                <Text style={styles.tileText}>{tile.special ? SPECIAL_EMOJI[tile.special] : ''}</Text>
                            </Pressable>
                        </View>
                    );
                    continue;
                }
                const isRemoving = removingIds.has(tile.id);
                items.push(
                    <Animated.View
                        key={tile.id}
                        style={[
                            styles.tile,
                            {
                                position: 'absolute',
                                left: anim.x,
                                top: anim.y,
                                width: TILE_SIZE,
                                height: TILE_SIZE,
                                backgroundColor: COLOR_MAP[tile.color] || '#999',
                                borderColor: positionsEqual(selected, { row: r, col: c }) ? '#fff' : '#0003',
                                opacity: anim.opacity,
                                transform: [{ scale: anim.scale }],
                            },
                        ]}
                    >
                        <Pressable disabled={isRemoving} style={styles.pressFill} onPress={() => handleSelect({ row: r, col: c })}>
                            <Text style={styles.tileText}>{tile.special ? SPECIAL_EMOJI[tile.special] : ''}</Text>
                        </Pressable>
                    </Animated.View>
                );
            }
        }
        return items;
    };

    return (
        <View style={styles.wrapper}>
            <View style={styles.hud}>
                <Text style={styles.hudText}>Score: {score}</Text>
                <Text style={styles.hudText}>Moves: {moves}</Text>
                <Text style={styles.hudText}>Target: {LEVEL_TARGET_SCORE}</Text>
                                {skiaAvailable && (
                  <View style={styles.toggleRow}>
                    <Text style={styles.toggleLabel}>Skia</Text>
                    <Switch value={useSkia} onValueChange={setUseSkia} />
                  </View>) }
            </View>
            <View style={[styles.board, { width: boardWidth, height: boardHeight }]}>
                {useSkia ? renderSkia() : renderTiles()}
            </View>
            <View style={styles.footer}>
                <Text style={styles.footerText}>Match-3 Level 1</Text>
            </View>
        </View>
    );
};

// (Old TileView removed; using absolute Animated tiles)

function isAdjacent(a: Position, b: Position) {
    return (Math.abs(a.row - b.row) === 1 && a.col === b.col) || (Math.abs(a.col - b.col) === 1 && a.row === b.row);
}

const styles = StyleSheet.create({
    wrapper: { flex: 1, backgroundColor: '#1e1e24', paddingTop: 50 },
    hud: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
    hudText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    board: { alignSelf: 'center', padding: 4, backgroundColor: '#2c2c34', borderRadius: 12, elevation: 4, overflow: 'hidden' },
    tile: { borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
    pressFill: { flex: 1, width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
    tileText: { fontSize: 16 },
    footer: { marginTop: 16, alignItems: 'center' },
    toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    toggleLabel: { color: '#fff', marginRight: 4 },
    footerText: { color: '#fff', opacity: 0.7 },
});

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && (LayoutAnimation as any).setLayoutAnimationEnabledExperimental) {
    try {
        (LayoutAnimation as any).setLayoutAnimationEnabledExperimental(true);
    } catch (e) {
        // ignore
    }
}

export default Match3Board;
