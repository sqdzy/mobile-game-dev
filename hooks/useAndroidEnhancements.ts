import Constants from 'expo-constants';
import type { NotificationResponse, TimeIntervalTriggerInput } from 'expo-notifications';
import * as Notifications from 'expo-notifications';
import * as QuickActions from 'expo-quick-actions';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import {
  REWARD_NOTIFICATION_ACTION,
  REWARD_NOTIFICATION_CHANNEL_ID,
  REWARD_NOTIFICATION_DELAY_SECONDS,
  REWARD_NOTIFICATION_KIND_MANUAL,
  REWARD_NOTIFICATION_KIND_RECURRING,
  REWARD_NOTIFICATION_SOUND,
  SHORTCUT_ID_GRID,
  SHORTCUT_ID_UPGRADES,
} from '@/constants/PlatformEnhancements';

type RouterType = ReturnType<typeof useRouter>;

const GRID_ROUTE = '/(tabs)' as const satisfies Href;
const UPGRADES_ROUTE = '/(tabs)/explore' as const satisfies Href;
const IS_EXPO_GO = Constants.appOwnership === 'expo';

function handleShortcutNavigation(router: RouterType, shortcut: QuickActions.ShortcutItem | null | undefined) {
  if (!shortcut) {
    return;
  }

  switch (shortcut.id) {
    case SHORTCUT_ID_UPGRADES:
      router.push(UPGRADES_ROUTE);
      break;
    case SHORTCUT_ID_GRID:
      router.push(GRID_ROUTE);
      break;
    default:
      break;
  }
}

async function ensureNotificationPermissions(): Promise<boolean> {
  const existingPermissions = await Notifications.getPermissionsAsync();
  let status = existingPermissions.status;

  if (status !== Notifications.PermissionStatus.GRANTED) {
    const request = await Notifications.requestPermissionsAsync();
    status = request.status;
  }

  return status === Notifications.PermissionStatus.GRANTED;
}

async function configureNotificationChannel() {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(REWARD_NOTIFICATION_CHANNEL_ID, {
    name: 'Напоминания о наградах',
    importance: Notifications.AndroidImportance.DEFAULT,
    enableLights: true,
    enableVibrate: true,
    sound: IS_EXPO_GO ? undefined : REWARD_NOTIFICATION_SOUND,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

async function scheduleRewardReminder() {
  const existing = await Notifications.getAllScheduledNotificationsAsync();
  const hasActiveReminder = existing.some(item =>
    isRecurringRewardReminder(item as ScheduledNotificationLike)
  );
  if (hasActiveReminder) {
    return;
  }

  const trigger: TimeIntervalTriggerInput =
    Platform.OS === 'android'
      ? ({
          seconds: REWARD_NOTIFICATION_DELAY_SECONDS,
          repeats: true,
          channelId: REWARD_NOTIFICATION_CHANNEL_ID,
        } as TimeIntervalTriggerInput)
      : ({
          seconds: REWARD_NOTIFICATION_DELAY_SECONDS,
          repeats: true,
        } as TimeIntervalTriggerInput);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'В казне ждут сокровища',
      body: 'Загляните в Башню улучшений, чтобы забрать награды и усилить отряд.',
      sound: Platform.OS === 'android' ? (IS_EXPO_GO ? 'default' : REWARD_NOTIFICATION_SOUND) : 'default',
      data: { action: REWARD_NOTIFICATION_ACTION, kind: REWARD_NOTIFICATION_KIND_RECURRING },
    },
    trigger: trigger as Notifications.NotificationTriggerInput,
  });
}

function isRecurringRewardReminderData(data: Record<string, unknown> | undefined): boolean {
  return data?.action === REWARD_NOTIFICATION_ACTION && data?.kind === REWARD_NOTIFICATION_KIND_RECURRING;
}

type ScheduledNotificationLike = {
  content: Notifications.NotificationContent;
  trigger: Notifications.NotificationTrigger | null;
};

function isRecurringRewardReminderTrigger(trigger: ScheduledNotificationLike['trigger']): boolean {
  if (!trigger || typeof trigger !== 'object') {
    return false;
  }
  if ('type' in trigger && trigger.type === 'timeInterval') {
    return trigger.repeats === true;
  }
  return false;
}

function isRecurringRewardReminder(notification: ScheduledNotificationLike): boolean {
  const data = notification.content.data as Record<string, unknown> | undefined;
  return isRecurringRewardReminderData(data) && isRecurringRewardReminderTrigger(notification.trigger);
}

async function initialiseQuickActions(router: RouterType) {
  if (Platform.OS !== 'android') {
    if (typeof QuickActions.clearShortcutItemsAsync === 'function') {
      await QuickActions.clearShortcutItemsAsync();
    }
    return;
  }

  const quickActionsAvailable =
    typeof QuickActions.setShortcutItemsAsync === 'function' &&
    typeof QuickActions.getInitialShortcutAsync === 'function' &&
    typeof QuickActions.addListener === 'function';

  if (!quickActionsAvailable) {
    console.info('Быстрые действия недоступны в этой сборке.');
    return;
  }

  try {
    await QuickActions.setShortcutItemsAsync([
      {
        id: SHORTCUT_ID_GRID,
        title: 'Поле',
        subtitle: 'Продолжить битву',
      },
      {
        id: SHORTCUT_ID_UPGRADES,
        title: 'Башня улучшений',
        subtitle: 'Усилить союзников',
      },
    ]);

    const initialShortcut = await QuickActions.getInitialShortcutAsync();
    handleShortcutNavigation(router, initialShortcut);

    const subscription = QuickActions.addListener(shortcut => {
      handleShortcutNavigation(router, shortcut);
    });

    return () => {
      subscription.remove();
    };
  } catch (error) {
    console.error('Не удалось инициализировать быстрые действия', error);
  }
}

export function useAndroidEnhancements() {
  const router = useRouter();

  useEffect(() => {
    let cleanup: VoidFunction | undefined;

    void (async () => {
      cleanup = await initialiseQuickActions(router);
    })();

    return () => {
      cleanup?.();
    };
  }, [router]);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        const granted = await ensureNotificationPermissions();
        if (!granted || !isMounted) {
          return;
        }

        await configureNotificationChannel();
        await scheduleRewardReminder();
      } catch (error) {
        console.error('Не удалось настроить уведомления', error);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleResponse = (response: NotificationResponse) => {
      const data = response.notification.request.content.data as Record<string, unknown> | undefined;
      const action = typeof data?.action === 'string' ? (data.action as string) : undefined;

      if (action === REWARD_NOTIFICATION_ACTION) {
        router.push(UPGRADES_ROUTE);
      }
    };

    const subscription = Notifications.addNotificationResponseReceivedListener(handleResponse);

    void (async () => {
      const lastResponse = await Notifications.getLastNotificationResponseAsync();
      if (lastResponse) {
        handleResponse(lastResponse);
      }
    })();

    return () => {
      subscription.remove();
    };
  }, [router]);
}

export async function triggerRewardReminderNow(): Promise<boolean> {
  try {
    const granted = await ensureNotificationPermissions();
    if (!granted) {
      return false;
    }

    await configureNotificationChannel();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'В казне ждут сокровища',
        body: 'Напоминание: загляните в Башню улучшений и соберите выручку.',
        sound: Platform.OS === 'android' ? (IS_EXPO_GO ? 'default' : REWARD_NOTIFICATION_SOUND) : 'default',
        data: { action: REWARD_NOTIFICATION_ACTION, kind: REWARD_NOTIFICATION_KIND_MANUAL },
      },
      trigger: null,
    });

    return true;
  } catch (error) {
    console.error('Не удалось отправить напоминание', error);
    return false;
  }
}
