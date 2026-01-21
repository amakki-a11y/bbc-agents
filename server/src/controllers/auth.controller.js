const prisma = require('../lib/prisma');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { logLogin, logRegister } = require('../services/activityLogger');


// Zod Schemas
const passwordSchema = z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

const registerSchema = z.object({
    email: z.string().email(),
    password: passwordSchema,
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' } // Extended for better production UX
    );
    const refreshToken = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        { expiresIn: '7d' } // Long-lived refresh token
    );
    return { accessToken, refreshToken };
};

const register = async (req, res) => {
    try {
        const validation = registerSchema.safeParse(req.body);
        if (!validation.success) {
            // console.error('Validation Error:', JSON.stringify(validation.error)); 
            const errorMessage = validation.error.errors?.[0]?.message || 'Input validation failed';
            return res.status(400).json({ error: errorMessage });
        }

        const { email, password } = validation.data;

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email,
                password_hash: hashedPassword,
            },
        });

        const tokens = generateTokens(user);

        // Log registration (non-blocking - don't fail registration if logging fails)
        logRegister(user.id, email, req).catch(err => {
            console.error('[Auth] Activity logging failed (non-blocking):', err.message);
        });

        res.status(201).json({ ...tokens, user: { id: user.id, email: user.email } });
    } catch (error) {
        console.error('[Auth] Registration Error:', error);
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'Email already exists' });
        }
        res.status(500).json({ error: 'Registration failed' });
    }
};

const login = async (req, res) => {
    try {
        const validation = loginSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: 'Invalid email or password format' });
        }
        const { email, password } = validation.data;

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const tokens = generateTokens(user);

        // Log successful login (non-blocking - don't fail login if logging fails)
        logLogin(user.id, req, { email: user.email }).catch(err => {
            console.error('[Auth] Activity logging failed (non-blocking):', err.message);
        });

        res.json({ ...tokens, user: { id: user.id, email: user.email } });
    } catch (error) {
        console.error('[Auth] Login error:', error.message, error.code);
        res.status(500).json({ error: 'Login failed' });
    }
};

const refreshToken = async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.sendStatus(401);

    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);

        // We could fetch user from DB here to check revocation
        const tokens = generateTokens({ id: user.userId, email: user.email });
        res.json(tokens);
    });
};

module.exports = { register, login, refreshToken };

