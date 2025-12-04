import toast from 'react-hot-toast';
import i18n from '../locales/i18n';

export const toastSuccess = (key: string, options?: any) => {
  return toast.success(i18n.t(`toast.${key}`), options);
};

export const toastError = (key: string, options?: any) => {
  return toast.error(i18n.t(`toast.${key}`), options);
};

export const toastLoading = (key: string, options?: any) => {
  return toast.loading(i18n.t(`toast.${key}`), options);
};

export const toast_t = (key: string) => {
  return i18n.t(`toast.${key}`);
};
