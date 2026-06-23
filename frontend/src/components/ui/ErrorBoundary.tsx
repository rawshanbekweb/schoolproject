import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import i18n from '../../i18n/config';

interface Props { children: ReactNode; }
interface State { hasError: boolean; message: string; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, message: err.message };
  }

  componentDidCatch(err: Error, info: ErrorInfo) {
    console.error('ErrorBoundary:', err, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="bg-red-50 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">{i18n.t('common.error')}</h2>
            <p className="text-sm text-gray-500 mb-4">{this.state.message || i18n.t('common.unexpectedError')}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary text-sm"
            >
              {i18n.t('common.reload')}
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
