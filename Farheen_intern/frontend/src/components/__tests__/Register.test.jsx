import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import Register from '../../pages/Register';

describe('Register page', () => {
  it('renders register form and validates passwords', () => {
    const register = vi.fn().mockResolvedValue({ id: '1', name: 'Test User' });
    render(
      <AuthContext.Provider value={{ register, loading: false }}>
        <MemoryRouter>
          <Register />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    fireEvent.change(screen.getByLabelText(/Full name/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/Email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/Confirm password/i), { target: { value: 'password321' } });

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });
});
