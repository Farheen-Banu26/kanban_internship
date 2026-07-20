import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProtectedRoute from '../../components/ProtectedRoute';
import { AuthContext } from '../../context/AuthContext';

describe('ProtectedRoute', () => {
  it('renders children when authenticated', () => {
    render(
      <AuthContext.Provider value={{ isAuthenticated: true, loading: false }}>
        <MemoryRouter>
          <ProtectedRoute>
            <div>Protected content</div>
          </ProtectedRoute>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText(/Protected content/i)).toBeInTheDocument();
  });
});
