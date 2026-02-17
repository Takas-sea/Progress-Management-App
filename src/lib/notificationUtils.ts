/**
 * Notification utility functions for client-side Web Notification API
 */

/**
 * Request browser permission for notifications
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  return false;
}

/**
 * Send a notification to the user
 */
export function sendNotification(
  title: string,
  options?: NotificationOptions
): Notification | null {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return null;
  }

  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted');
    return null;
  }

  try {
    const notification = new Notification(title, {
      icon: '/favicon.ico',
      ...options,
    });

    return notification;
  } catch (error) {
    console.error('Error sending notification:', error);
    return null;
  }
}

/**
 * Send learning reminder notification
 */
export function sendLearningReminder(): Notification | null {
  return sendNotification('時間ですよ！📚', {
    body: '今日も学習を続けましょう。頑張ってください！',
    tag: 'learning-reminder',
    requireInteraction: false,
  });
}

/**
 * Send milestone achievement notification
 */
export function sendMilestoneNotification(
  milestoneLabel: string
): Notification | null {
  return sendNotification('🎉 マイルストーン達成！', {
    body: `${milestoneLabel}を達成しました！`,
    tag: 'milestone-achievement',
    requireInteraction: true,
  });
}

/**
 * Check if notifications are supported and enabled
 */
export function areNotificationsSupported(): boolean {
  return 'Notification' in window;
}

/**
 * Get current notification permission status
 */
export function getNotificationPermissionStatus(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Register service worker for background notifications (future enhancement)
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Workers are not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registered:', registration);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Check if Service Worker is available
 */
export function isServiceWorkerAvailable(): boolean {
  return 'serviceWorker' in navigator;
}
