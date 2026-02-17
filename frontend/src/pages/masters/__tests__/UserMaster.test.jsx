import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import UserMaster from '../UserMaster';
import { adminAPI } from '../../../services/api';
import useStore from '../../../store';

// Mock dependencies
vi.mock('../../../services/api');
vi.mock('../../../store', () => ({
  __esModule: true,
  default: vi.fn()
}));
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn()
}));
vi.mock('../../../components/common', () => ({
  DataTable: ({ data, actions }) => (
    <div data-testid="user-table">
      {data.map((user, idx) => (
        <div key={user.id || idx} data-testid="user-row">
          <span>{user.username}</span>
          {actions && actions.map((action, actionIdx) => {
             // Heuristic to identify delete button based on label or className (red)
             const isDelete = action.className?.includes('red');
             return (
               <button 
                 key={actionIdx} 
                 onClick={() => action.onClick(user)}
                 aria-label={isDelete ? "delete-btn" : "action-btn"}
               >
                 {isDelete ? "Delete" : "Edit"}
               </button>
             );
          })}
        </div>
      ))}
    </div>
  ),
  Modal: ({ children, isOpen }) => isOpen ? <div>{children}</div> : null,
  DeleteConfirmDialog: ({ isOpen, onConfirm }) => isOpen ? (
    <div data-testid="delete-dialog">
      <button onClick={onConfirm} aria-label="confirm-delete">Confirm Delete</button>
    </div>
  ) : null
}));
vi.mock('react-icons/fa', () => ({
  FaPlus: () => null,
  FaEdit: () => null,
  FaTrash: () => null,
  FaSignOutAlt: () => null
}));

describe('UserMaster Component', () => {
  beforeEach(() => {
    useStore.mockReturnValue({
      users: [],
      setUsers: vi.fn(),
      showToast: vi.fn()
    });
  });

  test('fetches all pages of users correctly', async () => {
    // Mock API to return 2 pages of data
    adminAPI.getUsers.mockImplementation(({ page }) => {
      if (page === 1) {
        return Promise.resolve({
          data: {
            data: {
              data: [{ _id: '1', name: 'User 1' }],
              meta: { hasNextPage: true }
            }
          }
        });
      } else if (page === 2) {
        return Promise.resolve({
          data: {
            data: {
              data: [{ _id: '2', name: 'User 2' }],
              meta: { hasNextPage: false }
            }
          }
        });
      }
      return Promise.resolve({ data: { data: { data: [] } } });
    });

    const setUsersMock = vi.fn();
    useStore.mockReturnValue({
      users: [],
      setUsers: setUsersMock,
      showToast: vi.fn()
    });

    render(<UserMaster />);

    // Wait for effect to run and fetch loop to complete
    await waitFor(() => {
      expect(adminAPI.getUsers).toHaveBeenCalledTimes(2);
      expect(setUsersMock).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ username: 'User 1' }),
        expect.objectContaining({ username: 'User 2' })
      ]));
    });
  });

  test('handles user deletion correctly', async () => {
    // Setup store with one user
    const mockUser = { id: 'user-123', username: 'Test User' };
    const setUsersMock = vi.fn();
    
    useStore.mockReturnValue({
      users: [mockUser],
      setUsers: setUsersMock,
      showToast: vi.fn(), 
      deleteUser: vi.fn() // We mock the store action too
    });

    // Mock delete API success
    adminAPI.deleteUser = vi.fn().mockResolvedValue({ data: { success: true } });
    
    // We also need to mock getUsers for the refresh call after delete
    adminAPI.getUsers.mockResolvedValue({ data: { data: { data: [] } } }); // Return empty after delete

    render(<UserMaster />);

    // Check if user row is rendered
    expect(screen.getByText('Test User')).toBeTruthy();

    // Click Delete button
    const deleteBtns = screen.getAllByLabelText('delete-btn');
    expect(deleteBtns.length).toBeGreaterThan(0);
    deleteBtns[0].click();

    // Check if dialog opens
    expect(await screen.findByTestId('delete-dialog')).toBeTruthy();

    // Confirm Delete
    const confirmBtn = screen.getByLabelText('confirm-delete');
    confirmBtn.click();

    // Verify API call
    await waitFor(() => {
       expect(adminAPI.deleteUser).toHaveBeenCalledWith('user-123');
    });
    
    // Verify refresh called (getUsers)
    await waitFor(() => {
       expect(adminAPI.getUsers).toHaveBeenCalled(); 
    });
  });
});
