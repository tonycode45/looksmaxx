export const scanShape = {
  id: 'string',
  createdAt: 'number',
  userId: 'number',
  imageBlobUrl: 'string',
  scores: 'object',
};

export const userShape = {
  id: 'number',
  email: 'string',
  passwordHash: 'string',
  createdAt: 'number',
};

export const prefsDefault = {
  reduceMotion: false,
  highContrast: false,
  remindersEnabled: false,
  reminderTime: '20:30',
  theme: 'dark',
  hasSeenOnboarding: false,
  activeUserId: null,
};

