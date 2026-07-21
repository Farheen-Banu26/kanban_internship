import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import Login from '../../pages/Login';

describe('Login page', () => {
  it('renders login form and handles submit', async () => {
    const login = vi.fn().mockResolvedValue({ id: '1', name: 'Test User' });
    render(
      <AuthContext.Provider value={{ isAuthenticated: false, login, loading: false }}>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument();
    const passwordCandidates = screen.getAllByLabelText(/Password/i);
    const passwordInput = passwordCandidates.find((el) => el.tagName === 'INPUT') || passwordCandidates[0];

    fireEvent.change(screen.getByLabelText(/Email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => expect(login).toHaveBeenCalledWith('test@example.com', 'password123'));
  });

  it('routes Google and GitHub social sign-in through the auth context', async () => {
    const loginWithGoogle = vi.fn().mockResolvedValue();
    const loginWithGithub = vi.fn().mockResolvedValue();

    render(
      <AuthContext.Provider
        value={{
          isAuthenticated: false,
          login: vi.fn(),
          loginWithGoogle,
          loginWithGithub,
          loading: false,
        }}
      >
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    fireEvent.click(screen.getByRole('button', { name: /google/i }));
    await waitFor(() => expect(loginWithGoogle).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: /github/i }));
    await waitFor(() => expect(loginWithGithub).toHaveBeenCalled());
  });
});
