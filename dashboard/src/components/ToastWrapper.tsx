import { useToast } from '../contexts/ToastContext'
import { ToastContainer } from './ui/Toast'

export function ToastWrapper() {
  const { toasts, removeToast } = useToast()
  return <ToastContainer toasts={toasts} onClose={removeToast} />
}
