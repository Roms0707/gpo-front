import React from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, CheckCircle, XCircle, AlertTriangle, Users } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  showTooltip?: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, showTooltip = false }) => {
  const { t } = useTranslation();

  const getStatusConfig = () => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return {
          icon: Clock,
          label: t('status.pending'),
          color: 'bg-warning-500',
          tooltip: t('status.pendingTooltip')
        };
      case 'approved':
        return {
          icon: CheckCircle,
          label: t('status.approved'),
          color: 'bg-success-500',
          tooltip: t('status.approvedTooltip')
        };
      case 'validated':
        return {
          icon: CheckCircle,
          label: t('status.validated'),
          color: 'bg-success-500',
          tooltip: t('status.validatedTooltip')
        };
      case 'rejected':
        return {
          icon: XCircle,
          label: t('status.rejected'),
          color: 'bg-error-500',
          tooltip: t('status.rejectedTooltip')
        };
      case 'refused':
        return {
          icon: XCircle,
          label: t('status.refused'),
          color: 'bg-error-500',
          tooltip: t('status.refusedTooltip')
        };
      case 'backup':
        return {
          icon: Users,
          label: t('status.backup'),
          color: 'bg-blue-500',
          tooltip: t('status.backupTooltip')
        };
      default:
        return {
          icon: AlertTriangle,
          label: t('status.unknown'),
          color: 'bg-gray-500',
          tooltip: t('status.unknownTooltip')
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full ${config.color} text-white text-xs font-medium`}
      title={showTooltip ? config.tooltip : undefined}
    >
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </span>
  );
};

export default StatusBadge;