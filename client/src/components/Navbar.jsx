import { useNavigate } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';
import NotificationBell from './NotificationBell';

const Navbar = () => {
    const navigate = useNavigate();

    return (
        <header style={{
            height: '48px',
            background: 'var(--header-bg, #4a148c)', // Fallback to purple if var not set
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1rem',
            color: 'white',
            flexShrink: 0
        }}>
            {/* Left: Branding & Nav */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div
                    onClick={() => navigate('/')}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}
                >
                    <div style={{ background: 'white', color: '#4a148c', width: 20, height: 20, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>A</div>
                    AI Workspace
                </div>

                <div
                    onClick={() => navigate('/')}
                    className="hover:text-gray-200 cursor-pointer flex items-center gap-2 text-sm"
                >
                    <LayoutDashboard size={16} /> Dashboard
                </div>
            </div>

            {/* Right: User & Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <NotificationBell />
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <div style={{ width: 28, height: 28, background: '#4ecdc4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>
                        A
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
