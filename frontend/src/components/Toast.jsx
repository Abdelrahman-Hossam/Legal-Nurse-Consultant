import { useEffect } from 'react';


const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
    const icon = type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info';

    return (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
            <div className={`${bgColor} text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 min-w-[300px] max-w-md`}>
                <span className="material-icons">{icon}</span>
                <p className="flex-1 font-medium">{message}</p>
                <button
                    onClick={onClose}
                    className="material-icons hover:bg-white/20 rounded p-1 transition-colors"
                >
                    close
                </button>
            </div>
        </div>
    );
};

export default Toast;
