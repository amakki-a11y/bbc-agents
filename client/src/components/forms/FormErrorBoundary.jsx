import React from 'react';

class FormErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Form Error Caught:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-4 border border-red-200 bg-red-50 rounded-md text-red-700">
                    <h3 className="font-bold mb-2">Something went wrong with this form.</h3>
                    <p className="text-sm">{this.state.error?.message}</p>
                    <button
                        className="mt-3 px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-xs font-medium"
                        onClick={() => this.setState({ hasError: false, error: null })}
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default FormErrorBoundary;
