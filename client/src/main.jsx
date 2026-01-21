import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ProjectProvider } from './context/ProjectContext';
import { ThemeProvider } from './context/ThemeContext';
import reportWebVitals from './utils/performance';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ThemeProvider>
            <ProjectProvider>
                <App />
            </ProjectProvider>
        </ThemeProvider>
    </React.StrictMode>,
)

reportWebVitals(console.log);

