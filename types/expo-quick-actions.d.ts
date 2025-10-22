declare module 'expo-quick-actions' {
  export type ShortcutItem = {
    id: string;
    title: string;
    subtitle?: string;
    icon?: string;
    data?: Record<string, unknown>;
  };

  export type QuickActionListener = (shortcut: ShortcutItem | null) => void;

  export function setShortcutItemsAsync(items: ShortcutItem[]): Promise<void>;
  export function clearShortcutItemsAsync(): Promise<void>;
  export function getInitialShortcutAsync(): Promise<ShortcutItem | null>;
  export function addListener(listener: QuickActionListener): {
    remove: () => void;
  };
}
