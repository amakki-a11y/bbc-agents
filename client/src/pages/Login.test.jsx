import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Login from './Login';
import { BrowserRouter } from 'react-router-dom';
// import * as AuthContext from '../context/AuthContext';

// Mock the AuthContext
const mockLogin = vi.fn();
const mockRegister = vi.fn();

vi.mock('../context/AuthContext', () => ({
    useAuth: () => ({
        login: mockLogin,
        register: mockRegister,
    })
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('Login Page', () => {
    it('renders login form by default', () => {
        render(
            <BrowserRouter>
                <Login />
            </BrowserRouter>
        );
        expect(screen.getByText(/Welcome Back/i)).toBeInTheDocument();
        // expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument(); // Assuming implicit role or add label check
        // Actually the code has explicit labels
        expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    });

    it('switches to sign up', () => {
        render(
            <BrowserRouter>
                <Login />
            </BrowserRouter>
        );

        const toggleButton = screen.getByRole('button', { name: /Sign Up/i });
        fireEvent.click(toggleButton);

        expect(screen.getByText(/Create Account/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Sign Up/i })).toBeInTheDocument();
    });

    // Add more tests for submission...
});
