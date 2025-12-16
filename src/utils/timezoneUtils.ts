export const getUserTimezoneAbbreviation = (): string => {
  try {
    const formatter = new Intl.DateTimeFormat(undefined, {
      timeZoneName: 'short'
    });
    const parts = formatter.formatToParts(new Date());
    const timeZonePart = parts.find(part => part.type === 'timeZoneName');
    return timeZonePart?.value || '';
  } catch {
    return '';
  }
};

export const getUserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
};
