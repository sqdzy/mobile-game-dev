import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import { Dimensions, Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';

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
}

const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
    'water': 'water',
    'flame': 'flame',
    'leaf': 'leaf',
    'sparkles': 'sparkles',
    'bug': 'bug',
    'extension-puzzle': 'extension-puzzle',
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
}) => {
    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { scale: withSpring(selected ? 1.15 : 1, { damping: 10, stiffness: 100 }) }
            ],
            opacity: withTiming(selected ? 0.8 : 1, { duration: 200 }),
        };
    });

    const positionStyle = useAnimatedStyle(() => {
        return {
            top: `${top}%` as any,
            left: `${left}%` as any,
        };
    });

    const iconName = iconMap[icon] || 'extension-puzzle';

    return (
        <Animated.View
            style={[
                styles.cell,
                {
                    backgroundColor,
                    zIndex,
                },
                positionStyle,
                animatedStyle,
            ] as any}
        >
            <Pressable
                onPress={() => select(x, y)}
                style={styles.pressable}
            >
                <Ionicons name={iconName} size={CELL_SIZE * 0.5} color={color} />
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
        prevProps.selected === nextProps.selected
    );
});
