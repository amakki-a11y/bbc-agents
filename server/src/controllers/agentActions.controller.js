const prisma = require('../lib/prisma');

/**
 * Get agent actions with pagination and filters
 * GET /api/v1/agent-actions
 */
const getAgentActions = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 50,
            agent_name,
            agentName,
            action,
            entity_type,
            entityType,
            status,
            min_confidence,
            max_confidence,
            start_date,
            end_date,
            needs_review
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const where = {};

        // Filters
        if (agent_name || agentName) where.agent_name = agent_name || agentName;
        if (action) where.action = action;
        if (entity_type || entityType) where.entity_type = entity_type || entityType;
        if (status) where.status = status;

        // Confidence score range
        if (min_confidence || max_confidence) {
            where.confidence_score = {};
            if (min_confidence) where.confidence_score.gte = parseFloat(min_confidence);
            if (max_confidence) where.confidence_score.lte = parseFloat(max_confidence);
        }

        // Date range
        if (start_date || end_date) {
            where.created_at = {};
            if (start_date) where.created_at.gte = new Date(start_date);
            if (end_date) where.created_at.lte = new Date(end_date);
        }

        // Filter for items needing review
        if (needs_review === 'true') {
            where.status = 'flagged_for_review';
            where.reviewed_at = null;
        }

        const [actions, total] = await Promise.all([
            prisma.agentAction.findMany({
                where,
                skip,
                take: parseInt(limit),
                orderBy: { created_at: 'desc' },
                include: {
                    reviewer: {
                        select: { id: true, name: true }
                    }
                }
            }),
            prisma.agentAction.count({ where })
        ]);

        res.json({
            actions,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get agent actions error:', error);
        res.status(500).json({ error: 'Failed to fetch agent actions', details: error.message });
    }
};

/**
 * Get low confidence actions for human review
 * GET /api/v1/agent-actions/low-confidence
 */
const getLowConfidenceActions = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 50,
            threshold = 0.7,
            include_reviewed = false
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const where = {
            confidence_score: { lt: parseFloat(threshold) }
        };

        // Optionally exclude already reviewed actions
        if (include_reviewed !== 'true') {
            where.reviewed_at = null;
        }

        const [actions, total] = await Promise.all([
            prisma.agentAction.findMany({
                where,
                skip,
                take: parseInt(limit),
                orderBy: [
                    { confidence_score: 'asc' },
                    { created_at: 'desc' }
                ],
                include: {
                    reviewer: {
                        select: { id: true, name: true }
                    }
                }
            }),
            prisma.agentAction.count({ where })
        ]);

        res.json({
            actions,
            threshold: parseFloat(threshold),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get low confidence actions error:', error);
        res.status(500).json({ error: 'Failed to fetch low confidence actions', details: error.message });
    }
};

/**
 * Get a single agent action by ID
 * GET /api/v1/agent-actions/:id
 */
const getAgentAction = async (req, res) => {
    try {
        const { id } = req.params;

        const action = await prisma.agentAction.findUnique({
            where: { id: parseInt(id) },
            include: {
                reviewer: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        if (!action) {
            return res.status(404).json({ error: 'Agent action not found' });
        }

        res.json(action);
    } catch (error) {
        console.error('Get agent action error:', error);
        res.status(500).json({ error: 'Failed to fetch agent action', details: error.message });
    }
};

/**
 * Review an agent action (mark as reviewed by human)
 * POST /api/v1/agent-actions/:id/review
 */
const reviewAgentAction = async (req, res) => {
    try {
        const { id } = req.params;
        const { review_notes, new_status } = req.body;
        const reviewerId = req.employee?.id;

        if (!reviewerId) {
            return res.status(400).json({ error: 'Reviewer employee ID required' });
        }

        const action = await prisma.agentAction.update({
            where: { id: parseInt(id) },
            data: {
                reviewed_by: reviewerId,
                reviewed_at: new Date(),
                review_notes: review_notes || null,
                status: new_status || undefined
            },
            include: {
                reviewer: {
                    select: { id: true, name: true }
                }
            }
        });

        res.json({
            success: true,
            message: 'Agent action reviewed',
            action
        });
    } catch (error) {
        console.error('Review agent action error:', error);
        res.status(500).json({ error: 'Failed to review agent action', details: error.message });
    }
};

/**
 * Get agent action statistics
 * GET /api/v1/agent-actions/stats
 */
const getAgentStats = async (req, res) => {
    try {
        const { days = 7 } = req.query;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        const [
            totalActions,
            successCount,
            failedCount,
            flaggedCount,
            avgConfidence,
            byAgent,
            lowConfidenceCount
        ] = await Promise.all([
            prisma.agentAction.count({
                where: { created_at: { gte: startDate } }
            }),
            prisma.agentAction.count({
                where: { created_at: { gte: startDate }, status: 'success' }
            }),
            prisma.agentAction.count({
                where: { created_at: { gte: startDate }, status: 'failed' }
            }),
            prisma.agentAction.count({
                where: { created_at: { gte: startDate }, status: 'flagged_for_review' }
            }),
            prisma.agentAction.aggregate({
                where: { created_at: { gte: startDate } },
                _avg: { confidence_score: true }
            }),
            prisma.agentAction.groupBy({
                by: ['agent_name'],
                where: { created_at: { gte: startDate } },
                _count: { agent_name: true },
                _avg: { confidence_score: true }
            }),
            prisma.agentAction.count({
                where: {
                    created_at: { gte: startDate },
                    confidence_score: { lt: 0.7 },
                    reviewed_at: null
                }
            })
        ]);

        res.json({
            period: `${days} days`,
            totalActions,
            successRate: totalActions > 0 ? ((successCount / totalActions) * 100).toFixed(1) + '%' : '0%',
            statusBreakdown: {
                success: successCount,
                failed: failedCount,
                flagged_for_review: flaggedCount
            },
            averageConfidence: avgConfidence._avg.confidence_score?.toFixed(3) || 0,
            needsReview: lowConfidenceCount,
            byAgent: byAgent.map(a => ({
                agent: a.agent_name,
                count: a._count.agent_name,
                avgConfidence: a._avg.confidence_score?.toFixed(3) || 0
            }))
        });
    } catch (error) {
        console.error('Get agent stats error:', error);
        res.status(500).json({ error: 'Failed to fetch agent stats', details: error.message });
    }
};

/**
 * Rollback an agent action (mark as rolled back)
 * POST /api/v1/agent-actions/:id/rollback
 */
const rollbackAgentAction = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const reviewerId = req.employee?.id;

        const action = await prisma.agentAction.update({
            where: { id: parseInt(id) },
            data: {
                status: 'rolled_back',
                reviewed_by: reviewerId || null,
                reviewed_at: new Date(),
                review_notes: reason || 'Action rolled back'
            }
        });

        res.json({
            success: true,
            message: 'Agent action marked as rolled back',
            action
        });
    } catch (error) {
        console.error('Rollback agent action error:', error);
        res.status(500).json({ error: 'Failed to rollback agent action', details: error.message });
    }
};

module.exports = {
    getAgentActions,
    getLowConfidenceActions,
    getAgentAction,
    reviewAgentAction,
    getAgentStats,
    rollbackAgentAction
};
