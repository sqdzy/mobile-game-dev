import { ImageSourcePropType } from 'react-native';

export type UpgradeId = 'coin-magnet' | 'combo-charger' | 'quantum-refinery';

type UpgradeEffectType = 'coinMultiplier' | 'comboFlatBonus' | 'animationSpeed';

export interface UpgradeDefinition {
    id: UpgradeId;
    title: string;
    description: string;
    icon: string;
    baseCost: number;
    costGrowth: number;
    maxLevel: number;
    effectType: UpgradeEffectType;
    valuePerLevel: number;
    heroImage: ImageSourcePropType;
    previewVideo: string;
}

const heroImage = require('../assets/images/partial-react-logo.png');

export const UPGRADE_DEFINITIONS: UpgradeDefinition[] = [
    {
        id: 'coin-magnet',
        title: 'Coin Magnet',
        description: 'Электромагнитная катушка перенаправляет энергию сетки и увеличивает монеты за каждое совпадение.',
        icon: 'cash-outline',
        baseCost: 80,
        costGrowth: 1.6,
        maxLevel: 5,
        effectType: 'coinMultiplier',
        valuePerLevel: 0.15,
        heroImage,
        previewVideo: 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4',
    },
    {
        id: 'combo-charger',
        title: 'Combo Charger',
        description: 'Каждая комбо-цепочка генерирует всплеск энергии, конвертируемой в дополнительные монеты.',
        icon: 'flash-outline',
        baseCost: 120,
        costGrowth: 1.7,
        maxLevel: 4,
        effectType: 'comboFlatBonus',
        valuePerLevel: 3,
        heroImage,
        previewVideo: 'https://cdn.pixabay.com/vimeo/338171082/retro-24111.mp4?width=640&hash=39073beaef33297d6e843b52e4e97413b8478c2f',
    },
    {
        id: 'quantum-refinery',
        title: 'Quantum Refinery',
        description: 'Ускоряет переработку сетки и сокращает задержки падения новых блоков.',
        icon: 'speedometer-outline',
        baseCost: 150,
        costGrowth: 1.8,
        maxLevel: 3,
        effectType: 'animationSpeed',
        valuePerLevel: 40,
        heroImage,
        previewVideo: 'https://cdn.pixabay.com/vimeo/466203799/space-57367.mp4?width=640&hash=452def595409a9ec7593db4ee6a2d4bb6b948a35',
    },
];

export const PURCHASE_SOUND_URL = 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0df07bd60c.mp3?filename=coin-collect-1-191977.mp3';
