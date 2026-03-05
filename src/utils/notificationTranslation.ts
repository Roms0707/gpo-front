import type { TFunction } from 'i18next';

interface NotificationLike {
  title: string;
  message: string;
  metadata?: Record<string, unknown> | null;
}

interface TranslatedNotification {
  title: string;
  message: string;
}

const STATUS_KEY_MAP: Record<string, Record<string, string>> = {
  'notif.tournament_status_updated': {
    upcoming: 'notif.status_upcoming',
    active: 'notif.status_active',
    past: 'notif.status_past',
  },
  'notif.registration_status': {
    pending: 'notif.reg_status_pending',
    approved: 'notif.reg_status_approved',
    rejected: 'notif.reg_status_rejected',
  },
};

const TEAM_VARIANT_MAP: Record<string, { solo: string; team: string }> = {
  'notif.bracket_advance': {
    solo: 'notif.bracket_advance_msg',
    team: 'notif.bracket_advance_team_msg',
  },
  'notif.bracket_eliminated': {
    solo: 'notif.bracket_eliminated_msg',
    team: 'notif.bracket_eliminated_team_msg',
  },
};

export function getTranslatedNotification(
  notification: NotificationLike,
  t: TFunction
): TranslatedNotification {
  const { title, message, metadata } = notification;

  if (!metadata || Object.keys(metadata).length === 0 || !title.startsWith('notif.')) {
    return { title, message };
  }

  const translatedTitle = t(title, { defaultValue: title });

  const interpolationValues = { ...metadata } as Record<string, string>;

  const statusMap = STATUS_KEY_MAP[title];
  if (statusMap && typeof metadata.status === 'string') {
    const statusKey = statusMap[metadata.status];
    if (statusKey) {
      interpolationValues.status = t(statusKey);
    }
  }

  const teamVariant = TEAM_VARIANT_MAP[title];
  if (teamVariant) {
    const msgKey = metadata.is_team ? teamVariant.team : teamVariant.solo;
    return {
      title: translatedTitle,
      message: t(msgKey, interpolationValues as Record<string, string>),
    };
  }

  let msgKey = `${title}_msg`;
  if (
    title === 'notif.team_app_received' &&
    typeof metadata.applicant_message === 'string' &&
    metadata.applicant_message !== ''
  ) {
    msgKey = 'notif.team_app_received_with_message_msg';
  }

  const translatedMessage = t(msgKey, interpolationValues as Record<string, string>);

  if (translatedMessage === msgKey) {
    return { title: translatedTitle, message };
  }

  return { title: translatedTitle, message: translatedMessage };
}
