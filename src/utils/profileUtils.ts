import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import i18n from '../locales/i18n';

// Group registrations by tournament status
export const groupRegistrationsByStatus = (registrations: any[]) => {
  return registrations.reduce((acc, reg) => {
    if (!reg.tournaments) return acc;

    const tournament = reg.tournaments;
    const status = tournament.status;

    if (!acc[status]) {
      acc[status] = [];
    }

    acc[status].push({
      id: tournament.id,
      title: tournament.title,
      date: tournament.start_date,
      registrationStatus: reg.status,
      tournamentStatus: status
    });

    return acc;
  }, {} as Record<string, any[]>);
};

// Format date
export const formatDate = (dateString: string) => {
  try {
    const currentLanguage = i18n.language || 'en';
    const locale = currentLanguage.startsWith('fr') ? fr : enUS;
    return format(new Date(dateString), 'dd MMMM yyyy', { locale });
  } catch (error) {
    return i18n.t('common.unknownDate');
  }
};