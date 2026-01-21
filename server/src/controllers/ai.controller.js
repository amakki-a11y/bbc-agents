const { parseCommand } = require('../services/ai.service');
const prisma = require('../lib/prisma');

const handleCommand = async (req, res) => {
    try {
        const { command } = req.body;
        if (!command) return res.status(400).json({ error: 'Command prompt required' });

        console.log("Processing command:", command);
        const intent = await parseCommand(command);
        console.log("Parsed intent:", intent);

        if (intent.action === 'create') {
            if (intent.entity === 'task') {
                const newTask = await prisma.task.create({
                    data: {
                        title: intent.data.title,
                        due_date: intent.data.due_date ? new Date(intent.data.due_date) : null,
                        user_id: req.user.userId,
                    },
                });
                return res.json({ message: 'Task created', result: newTask });
            }

            if (intent.entity === 'event') {
                const newEvent = await prisma.event.create({
                    data: {
                        title: intent.data.title,
                        start_time: new Date(intent.data.start_time),
                        end_time: new Date(intent.data.end_time),
                        description: intent.data.description,
                        user_id: req.user.userId,
                    },
                });
                return res.json({ message: 'Event scheduled', result: newEvent });
            }
        }

        res.json({ message: 'Command understood but action not fully supported yet', intent });

    } catch (error) {
        console.error("Command Handler Error:", error);
        res.status(500).json({ error: error.message || 'Failed to process command' });
    }
};

module.exports = { handleCommand };
