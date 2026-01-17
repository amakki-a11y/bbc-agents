import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, registerSchema } from '../schemas/authSchemas';
import ValidatedInput from '../components/forms/ValidatedInput';

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    // Rename register from useAuth to authRegister to avoid conflict with react-hook-form's register
    const { login, register: authRegister } = useAuth();
    const navigate = useNavigate();
    const [globalError, setGlobalError] = useState('');

    // Initialize react-hook-form
    const {
        register, // Use 'register' directly for input binding
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm({
        // Integration with Zod schema for validation
        resolver: zodResolver(isLogin ? loginSchema : registerSchema),
        mode: 'onBlur',
    });

    // Reset form when switching between login and register
    useEffect(() => {
        reset({});
        setGlobalError('');
    }, [isLogin, reset]);

    const onSubmit = async (data) => {
        setGlobalError('');
        try {
            const success = isLogin
                ? await login(data.email, data.password)
                : await authRegister(data.email, data.password, data.firstName, data.lastName);

            if (success) {
                navigate('/');
            } else {
                setGlobalError('Authentication failed. Please check your credentials.');
            }
        } catch (error) {
            setGlobalError('An unexpected error occurred.');
        }
    };

    return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="glass-panel" style={{ padding: '2rem', width: '100%', maxWidth: '400px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                </h2>

                {globalError && (
                    <div style={{ color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center' }}>
                        {globalError}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {!isLogin && (
                        <>
                            <ValidatedInput
                                label="First Name"
                                type="text"
                                className="input-field"
                                error={errors.firstName}
                                {...register('firstName')}
                            />
                            <ValidatedInput
                                label="Last Name"
                                type="text"
                                className="input-field"
                                error={errors.lastName}
                                {...register('lastName')}
                            />
                        </>
                    )}

                    <ValidatedInput
                        label="Email"
                        type="email"
                        className="input-field"
                        error={errors.email}
                        {...register('email')}
                        id="email"
                    />

                    <ValidatedInput
                        label="Password"
                        type="password"
                        className="input-field"
                        error={errors.password}
                        {...register('password')}
                        id="password"
                    />

                    {!isLogin && (
                        <ValidatedInput
                            label="Confirm Password"
                            type="password"
                            className="input-field"
                            error={errors.confirmPassword}
                            {...register('confirmPassword')}
                            id="confirmPassword" // Added id
                        />
                    )}

                    <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                        {isLogin ? 'Sign In' : 'Sign Up'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: '600' }}
                    >
                        {isLogin ? 'Sign Up' : 'Sign In'}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Login;
