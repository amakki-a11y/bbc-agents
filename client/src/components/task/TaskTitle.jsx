import { useState, useEffect } from 'react';

const TaskTitle = ({ title, onUpdate }) => {
    const [localTitle, setLocalTitle] = useState(title);

    useEffect(() => { setLocalTitle(title); }, [title]);

    const handleBlur = () => {
        if (localTitle !== title) {
            onUpdate(localTitle);
        }
    };

    return (
        <input
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
            onBlur={handleBlur}
            style={{
                width: '100%',
                fontSize: '1.8rem',
                fontWeight: 600,
                color: '#333',
                border: 'none',
                outline: 'none',
                background: 'transparent',
                marginBottom: '0.5rem',
                padding: '0.2rem 0'
            }}
            placeholder="Task Title"
        />
    );
};

export default TaskTitle;
