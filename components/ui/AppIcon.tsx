import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

export type AppIconName =
  | 'grid'
  | 'scroll'
  | 'horn'
  | 'coin'
  | 'hammer'
  | 'hourglass'
  | 'flame'
  | 'tower'
  | 'trophy'
  | 'chevron-right'
  | 'water'
  | 'leaf'
  | 'sparkles'
  | 'bug'
  | 'puzzle';

type Props = {
  name: AppIconName;
  size?: number;
  color?: string;
  secondaryColor?: string;
  style?: StyleProp<ViewStyle>;
};

const DEFAULT_COLOR = '#fbead4';
const DEFAULT_SECONDARY = '#d2b48c';

export function AppIcon({
  name,
  size = 24,
  color = DEFAULT_COLOR,
  secondaryColor = DEFAULT_SECONDARY,
  style,
}: Props) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={style}
      fill="none"
    >
      {renderIcon(name, color, secondaryColor)}
    </Svg>
  );
}

function renderIcon(name: AppIconName, color: string, secondary: string) {
  const commonStroke = {
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (name) {
    case 'chevron-right':
      return <Path d="M10 6l6 6-6 6" {...commonStroke} />;

    case 'grid':
      return (
        <G {...commonStroke}>
          <Rect x={5} y={5} width={14} height={14} rx={3} />
          <Path d="M12 5v14" />
          <Path d="M5 12h14" />
        </G>
      );

    case 'scroll':
      return (
        <G {...commonStroke}>
          <Path d="M7 6h10a2 2 0 012 2v10a0 0 0 010 0H9a2 2 0 01-2-2V6z" />
          <Path d="M7 6a2 2 0 100 4h1" />
          <Path d="M19 8a2 2 0 100-4h-1" />
          <Path d="M10 10h6" />
          <Path d="M10 13h5" />
          <Path d="M10 16h4" />
        </G>
      );

    case 'horn':
      return (
        <G {...commonStroke}>
          <Path d="M7 14c0-3 2-6 6-7l5-1v12l-5-1c-4-1-6-4-6-7z" />
          <Path d="M6 11v6" />
          <Path d="M18 10a3 3 0 010 4" />
          <Path d="M9 16l1.5 2" />
        </G>
      );

    case 'coin':
      return (
        <G {...commonStroke}>
          <Path d="M8 9c-1.5 1.2-2.5 2.8-2.5 4.6C5.5 17 8.3 19 12 19s6.5-2 6.5-5.4C18.5 11.8 17.5 10.2 16 9" />
          <Path d="M9 8h6" />
          <Circle cx={12} cy={14} r={2.5} stroke={secondary} />
          <Path d="M12 12.7v2.6" stroke={secondary} />
        </G>
      );

    case 'hammer':
      return (
        <G {...commonStroke}>
          <Path d="M8 7h6l1 2-2 2H8L7 9l1-2z" />
          <Path d="M12 11l5 5" />
          <Path d="M11 12l-5 5" />
          <Path d="M9.5 14.5l3 3" stroke={secondary} />
        </G>
      );

    case 'hourglass':
      return (
        <G {...commonStroke}>
          <Path d="M8 5h8" />
          <Path d="M8 19h8" />
          <Path d="M9 5c0 4 6 4 6 8s-6 4-6 6" />
          <Path d="M15 5c0 4-6 4-6 8" />
          <Path d="M10 14h4" stroke={secondary} />
        </G>
      );

    case 'flame':
      return (
        <G {...commonStroke}>
          <Path d="M12 21c4 0 7-3 7-7 0-3-2-5-3.5-6.5-.5 1.5-1.5 3-3.5 4.5.3-2-.4-3.7-1.8-5-2.2 2-4.2 4.2-4.2 7 0 4 3 7 7 7z" />
          <Path d="M10 15c0 2 1.2 3 2 3s2-1 2-3" stroke={secondary} />
        </G>
      );

    case 'tower':
      return (
        <G {...commonStroke}>
          <Path d="M9 5h6l1 2-1 1H9L8 7l1-2z" />
          <Path d="M9 8v11h6V8" />
          <Path d="M7 19h10" />
          <Path d="M11 12h2v3h-2z" stroke={secondary} />
        </G>
      );

    case 'trophy':
      return (
        <G {...commonStroke}>
          <Path d="M8 5h8v3a4 4 0 01-8 0V5z" />
          <Path d="M10 17h4" />
          <Path d="M12 12v5" />
          <Path d="M6 6h2v2a3 3 0 01-2-2z" />
          <Path d="M18 6h-2v2a3 3 0 002-2z" />
          <Path d="M9 19h6" stroke={secondary} />
        </G>
      );

    case 'water':
      return (
        <G {...commonStroke}>
          <Path d="M12 3s6 6.2 6 11a6 6 0 11-12 0c0-4.8 6-11 6-11z" />
          <Path d="M9.5 14.5c.6 1.2 1.8 2 2.5 2.2" stroke={secondary} />
        </G>
      );

    case 'leaf':
      return (
        <G {...commonStroke}>
          <Path d="M20 4C12 4 6 8 4 16c4 2 8 3 12 1 3-1.5 4.5-5 4-13z" />
          <Path d="M7 17c3-4 7-6 12-7" stroke={secondary} />
        </G>
      );

    case 'sparkles':
      return (
        <G {...commonStroke}>
          <Path d="M12 4l1.2 3.6L17 9l-3.8 1.4L12 14l-1.2-3.6L7 9l3.8-1.4L12 4z" />
          <Path d="M5 14l.7 2.1L8 17l-2.3.9L5 20l-.7-2.1L2 17l2.3-.9L5 14z" stroke={secondary} />
        </G>
      );

    case 'bug':
      return (
        <G {...commonStroke}>
          <Path d="M9 10a3 3 0 016 0v1H9v-1z" />
          <Path d="M8 11v4a4 4 0 008 0v-4" />
          <Path d="M10 9l-2-2" />
          <Path d="M14 9l2-2" />
          <Path d="M7 13h2" stroke={secondary} />
          <Path d="M15 13h2" stroke={secondary} />
        </G>
      );

    case 'puzzle':
      return (
        <G {...commonStroke}>
          <Path d="M9 7a2 2 0 114 0v1h2a2 2 0 012 2v2h-1a2 2 0 100 4h1v2a2 2 0 01-2 2h-2v-1a2 2 0 10-4 0v1H7a2 2 0 01-2-2v-2h1a2 2 0 100-4H5v-2a2 2 0 012-2h2V7z" />
          <Path d="M12 8v2" stroke={secondary} />
        </G>
      );

    default:
      return null;
  }
}
