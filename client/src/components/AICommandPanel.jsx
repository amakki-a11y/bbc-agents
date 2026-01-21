import { useState } from 'react';
import { http } from '../api/http';
import { Send, Loader2 } from 'lucide-react';

const AICommandPanel = ({ onCommandSuccess }) => {
    const [command, setCommand] = useState('');
    const [loading, setLoading] = useState(false);
    const [responseMsg, setResponseMsg] = useState('');

    const handleSend = async (e) => {
        e.preventDefault();
        if (!command.trim()) return;

        setLoading(true);
        setResponseMsg('');
        try {
            const res = await http.post('/bot/message', { content: command });

            if (res.data.intent?.action === 'unknown') {
                setResponseMsg("I didn't quite catch that. Try starting with 'Create task' or 'Schedule meeting'.");
            } else {
                setResponseMsg(res.data.botMessage?.content || res.data.message || 'Done!');
                setCommand('');
                if (onCommandSuccess) onCommandSuccess();
            }
        } catch (error) {
            console.error(error);
            setResponseMsg('Something went wrong. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                ✨ AI Command
            </h3>
            <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                    type="text"
                    className="input-field"
                    placeholder="e.g., 'Remind me to call John tomorrow at 10am'..."
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    disabled={loading}
                />
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center' }}>
                    {loading ? <Loader2 className="animate-spin" /> : <Send size={18} />}
                </button>
            </form>
            {responseMsg && (
                <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: 'var(--success)' }}>
                    {responseMsg}
                </p>
            )}
        </div>
    );
};

export default AICommandPanel;
