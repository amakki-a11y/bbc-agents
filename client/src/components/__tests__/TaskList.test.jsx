import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TaskList from '../TaskList';

describe('TaskList Component', () => {
    const mockTasks = [
        { id: 1, title: 'Test Task 1', status: 'todo', priority: 'high' },
        { id: 2, title: 'Test Task 2', status: 'done', priority: 'normal', assignee: 'JD' }
    ];
    const mockOnToggle = vi.fn();
    const mockOnOpen = vi.fn();

    it('renders empty message when no tasks', () => {
        render(<TaskList tasks={[]} />);
        expect(screen.getByText(/No tasks yet/i)).toBeInTheDocument();
    });

    it('renders tasks correctly', () => {
        render(<TaskList tasks={mockTasks} onToggleStatus={mockOnToggle} onOpenTask={mockOnOpen} />);

        expect(screen.getByText('Test Task 1')).toBeInTheDocument();
        expect(screen.getByText('Test Task 2')).toBeInTheDocument();
        expect(screen.getByText('JD')).toBeInTheDocument(); // Assignee
    });

    it('calls onOpenTask when clicked', () => {
        render(<TaskList tasks={mockTasks} onToggleStatus={mockOnToggle} onOpenTask={mockOnOpen} />);

        fireEvent.click(screen.getByText('Test Task 1'));
        expect(mockOnOpen).toHaveBeenCalledWith(mockTasks[0]);
    });
});
