

const LoadingSpinner = () => (
    <div className="flex items-center justify-center h-screen w-full bg-gray-50">
        <div className="relative">
            <div className="h-12 w-12 rounded-full border-b-2 border-indigo-600 animate-spin"></div>
        </div>
    </div>
);

export default LoadingSpinner;
