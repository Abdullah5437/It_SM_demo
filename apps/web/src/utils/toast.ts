import { toast, ToastOptions } from 'react-toastify';

const defaultOptions: ToastOptions = {
  position: 'top-right',
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: 'colored',
};

export function showSuccess(message: string, options?: ToastOptions) {
  toast.success(message, { ...defaultOptions, ...options });
}

export function showError(message: string, options?: ToastOptions) {
  toast.error(message, { ...defaultOptions, ...options });
}

export function showInfo(message: string, options?: ToastOptions) {
  toast.info(message, { ...defaultOptions, ...options });
}

export function showWarning(message: string, options?: ToastOptions) {
  toast.warning(message, { ...defaultOptions, ...options });
}

export function showNetworkError() {
  toast.error('Network error occurred. Please check your connection.', { ...defaultOptions });
}

export function showDeleteSuccess(entity: string) {
  toast.success(`${entity} deleted successfully!`, { ...defaultOptions });
}

export function showSaveSuccess(entity: string, action: 'created' | 'updated' = 'updated') {
  toast.success(`${entity} ${action} successfully!`, { ...defaultOptions });
}