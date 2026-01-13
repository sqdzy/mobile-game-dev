import React, { memo, useEffect } from 'react';
import { Dimensions, Pressable, StyleSheet } from 'react-native';
import Animated, {
    cancelAnimation,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

import { AppIcon, type AppIconName } from '../ui/AppIcon';

const { width: SCREEN_W } = Dimensions.get('window');
const CELL_SIZE = Math.min((SCREEN_W * 0.9) / 8, 50);

interface RoundCellProps {
    backgroundColor: string;
    color: string;
    selected: boolean;
    x: number;
    y: number;
    top: number;
    left: number;
    zIndex: number;
    icon: string;
    select: (x: number, y: number) => void;
    isRemoving?: boolean;
    isHinted?: boolean;
}

const iconMap: Record<string, AppIconName> = {
    water: 'water',
    flame: 'flame',
    leaf: 'leaf',
    sparkles: 'sparkles',
    bug: 'bug',
    'extension-puzzle': 'puzzle',
};

const RoundCellComponent: React.FC<RoundCellProps> = ({
    backgroundColor,
    color,
    selected,
    x,
    y,
    top,
    left,
    zIndex,
    icon,
    select,
    isRemoving = false,
    isHinted = false,
}) => {
    const hintScale = useSharedValue(1);
    const hintGlow = useSharedValue(0);

    useEffect(() => {
        if (isHinted) {
            hintScale.value = withRepeat(
                withSequence(
                    withTiming(1.15, { duration: 400 }),
                    withTiming(1, { duration: 400 })
                ),
                -1,
                true
            );
            hintGlow.value = withRepeat(
                withSequence(
                    withTiming(1, { duration: 400 }),
                    withTiming(0.3, { duration: 400 })
                ),
                -1,
                true
            );
        } else {
            cancelAnimation(hintScale);
            cancelAnimation(hintGlow);
            hintScale.value = withTiming(1, { duration: 150 });
            hintGlow.value = withTiming(0, { duration: 150 });
        }
    }, [isHinted, hintScale, hintGlow]);

    const selectionStyle = useAnimatedStyle(() => {
        if (top < 0) {
            return {
                transform: [{ scale: 1 }],
                opacity: 0,
            };
        }
        
        if (isRemoving) {
            return {
                transform: [{ scale: withSpring(0, { damping: 15, stiffness: 150, mass: 0.5 }) }],
                opacity: withTiming(0, { duration: 300 }),
            };
        }

        const baseScale = selected ? 1.15 : 1;
        
        return {
            transform: [{ scale: isHinted ? hintScale.value : withSpring(baseScale, { damping: 15, stiffness: 150, mass: 0.5 }) }],
            opacity: withTiming(selected ? 0.85 : 1, { duration: 200 }),
        };
    });

    const glowStyle = useAnimatedStyle(() => {
        return {
            shadowOpacity: hintGlow.value * 0.8,
            shadowRadius: 8 + hintGlow.value * 8,
        };
    });

    const positionStyle = useAnimatedStyle(() => {
        return {
            top: withSpring(`${top}%` as unknown as number, {
                damping: 20,
                stiffness: 90,
                mass: 0.8,
            }),
            left: withSpring(`${left}%` as unknown as number, {
                damping: 20,
                stiffness: 90,
                mass: 0.8,
            }),
        };
    });

    const iconName = iconMap[icon] || 'puzzle';

    return (
        <Animated.View
            style={[
                styles.cell,
                {
                    backgroundColor,
                    zIndex,
                    borderWidth: isHinted ? 3 : 0,
                    borderColor: isHinted ? '#FFD700' : 'transparent',
                    shadowColor: isHinted ? '#FFD700' : '#000',
                },
                positionStyle,
                selectionStyle,
                isHinted && glowStyle,
            ]}
        >
            <Pressable
                onPress={() => select(x, y)}
                style={styles.pressable}
            >
                <AppIcon name={iconName} size={CELL_SIZE * 0.5} color={color} secondaryColor={color} />
            </Pressable>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    cell: {
        position: 'absolute',
        width: CELL_SIZE - 4,
        height: CELL_SIZE - 4,
        borderRadius: CELL_SIZE / 2,
        margin: 2,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    pressable: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default memo(RoundCellComponent, (prevProps, nextProps) => {
    return (
        prevProps.top === nextProps.top &&
        prevProps.left === nextProps.left &&
        prevProps.x === nextProps.x &&
        prevProps.y === nextProps.y &&
        prevProps.selected === nextProps.selected &&
        prevProps.isRemoving === nextProps.isRemoving &&
        prevProps.isHinted === nextProps.isHinted &&
        prevProps.backgroundColor === nextProps.backgroundColor &&
        prevProps.color === nextProps.color &&
        prevProps.icon === nextProps.icon &&
        prevProps.zIndex === nextProps.zIndex
    );
});
