// Achievement definitions and tracking system
import { getApiUrl } from './config';

export const ACHIEVEMENTS = {
  'first-login': {
    id: 'first-login',
    name: 'First Steps',
    description: 'Welcome to MoodyChimp!',
    icon: '👋',
    trigger: 'login'
  },
  'quiz-complete': {
    id: 'quiz-complete',
    name: 'Know Thyself',
    description: 'Completed the questionnaire',
    icon: '🎯',
    trigger: 'quiz'
  },
  'first-bookmark': {
    id: 'first-bookmark',
    name: 'Bookworm',
    description: 'Bookmarked your first course',
    icon: '📚',
    trigger: 'bookmark'
  },
  'first-service-view': {
    id: 'first-service-view',
    name: 'Curious Explorer',
    description: 'Viewed your first service',
    icon: '👀',
    trigger: 'service-view'
  },
  'profile-complete': {
    id: 'profile-complete',
    name: 'All About You',
    description: 'Completed your profile',
    icon: '✨',
    trigger: 'profile'
  },
  'first-order': {
    id: 'first-order',
    name: 'First Purchase',
    description: 'Placed your first order',
    icon: '🛒',
    trigger: 'order'
  },
  'first-review': {
    id: 'first-review',
    name: 'Voice of Experience',
    description: 'Left your first review',
    icon: '⭐',
    trigger: 'review'
  },
  'three-bookmarks': {
    id: 'three-bookmarks',
    name: 'Collector',
    description: 'Bookmarked 3 courses',
    icon: '📖',
    trigger: 'bookmark-count',
    threshold: 3
  },
  'unemployment': {
    id: 'unemployment',
    name: 'Unemployment',
    description: 'Clicked the banana 500 times',
    icon: '🍌',
    trigger: 'banana-clicks',
    threshold: 500
  }
};

// Get unlocked achievements from database
export const getUnlockedAchievements = async (userEmail) => {
  if (!userEmail) return {};
  
  try {
    const response = await fetch(getApiUrl(`api/user/${encodeURIComponent(userEmail)}/achievements`));
    if (response.ok) {
      const data = await response.json();
      return data.achievements || {};
    }
  } catch (err) {
    console.error('Error loading achievements:', err);
  }
  return {};
};

// Save unlocked achievements to database
export const saveUnlockedAchievements = async (userEmail, achievements, discountGranted = null, discountAvailable = null) => {
  if (!userEmail) return;
  
  try {
    const body = { achievements };
    if (discountGranted !== null) body.discountGranted = discountGranted;
    if (discountAvailable !== null) body.discountAvailable = discountAvailable;
    
    await fetch(getApiUrl(`api/user/${encodeURIComponent(userEmail)}/achievements`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error('Error saving achievements:', err);
  }
};

// Check if an achievement is unlocked
export const isAchievementUnlocked = async (userEmail, achievementId) => {
  const unlocked = await getUnlockedAchievements(userEmail);
  return unlocked[achievementId] === true;
};

// Unlock an achievement and return notification data
export const unlockAchievement = async (userEmail, achievementId) => {
  if (!userEmail || !ACHIEVEMENTS[achievementId]) return null;

  const unlocked = await getUnlockedAchievements(userEmail);
  
  // If already unlocked, don't create duplicate notification
  if (unlocked[achievementId]) {
    return null;
  }

  // Mark as unlocked
  unlocked[achievementId] = true;
  await saveUnlockedAchievements(userEmail, unlocked);

  // Return notification data
  const achievement = ACHIEVEMENTS[achievementId];
  return {
    id: `achievement-${achievementId}`,
    message: `🏆 ${achievement.name}: ${achievement.description}`,
    read: false,
    timestamp: new Date().toISOString(),
    type: 'achievement',
    achievementId: achievementId
  };
};

// Check if user has unlocked all achievements
export const hasAllAchievements = async (userEmail) => {
  if (!userEmail) return false;
  const unlocked = await getUnlockedAchievements(userEmail);
  const totalAchievements = Object.keys(ACHIEVEMENTS).length;
  const unlockedCount = Object.keys(unlocked).filter(key => unlocked[key] === true).length;
  return unlockedCount === totalAchievements;
};

// Check and grant discount if all achievements are unlocked
export const checkAllAchievementsDiscount = async (userEmail) => {
  if (!userEmail) return null;

  try {
    // Get current discount status from database
    const response = await fetch(getApiUrl(`api/user/${encodeURIComponent(userEmail)}/achievements`));
    if (response.ok) {
      const data = await response.json();
      
      // Check if discount has already been granted
      if (data.discountGranted) {
        return null; // Discount already granted
      }

      // Check if all achievements are unlocked
      const allUnlocked = await hasAllAchievements(userEmail);
      if (allUnlocked) {
        // Grant discount
        await saveUnlockedAchievements(userEmail, data.achievements, true, true);
        
        // Return notification
        return {
          id: `all-achievements-discount-${userEmail}`,
          message: '🎉 Congratulations! You\'ve unlocked all achievements! You\'ve earned a one-time 30% discount on your next order!',
          read: false,
          timestamp: new Date().toISOString(),
          type: 'achievement'
        };
      }
    }
  } catch (err) {
    console.error('Error checking discount:', err);
  }

  return null;
};

// Check and unlock achievements based on trigger
export const checkAchievements = async (userEmail, trigger, data = {}) => {
  if (!userEmail) return [];

  const notifications = [];
  const unlocked = await getUnlockedAchievements(userEmail);

  // Check each achievement
  for (const achievement of Object.values(ACHIEVEMENTS)) {
    // Skip if already unlocked
    if (unlocked[achievement.id]) continue;

    // Check trigger match
    if (achievement.trigger === trigger) {
      // Special handling for threshold-based achievements
      if (achievement.threshold && data.count !== undefined) {
        if (data.count >= achievement.threshold) {
          const notification = await unlockAchievement(userEmail, achievement.id);
          if (notification) {
            notifications.push(notification);
          }
        }
      } else {
        // Standard trigger-based achievement
        const notification = await unlockAchievement(userEmail, achievement.id);
        if (notification) {
          notifications.push(notification);
        }
      }
    }
  }

  // After unlocking achievements, check if all are completed
  if (notifications.length > 0) {
    const discountNotification = await checkAllAchievementsDiscount(userEmail);
    if (discountNotification) {
      notifications.push(discountNotification);
    }
  }

  return notifications;
};

