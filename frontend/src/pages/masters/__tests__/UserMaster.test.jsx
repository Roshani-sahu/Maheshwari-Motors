import { render, screen, waitFor } from '@testing-library/react';
import UserMaster from '../UserMaster';
import { adminAPI } from '../../../services/api';
import useStore from '../../../store';

// Mock dependencies
jest.mock('../../../services/api');
jest.mock('../../../store', () => ({
  __esModule: true,
  default: jest.fn()
}));
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn()
}));
jest.mock('../../../components/common', () => ({
  DataTable: ({ data }) => <div data-testid="user-table">{data.length} users</div>,
  Modal: ({ children, isOpen }) => isOpen ? <div>{children}</div> : null,
  DeleteConfirmDialog: () => null
}));
jest.mock('react-icons/fa', () => ({
  FaPlus: () => null,
  FaEdit: () => null,
  FaTrash: () => null,
  FaSignOutAlt: () => null
}));

describe('UserMaster Component', () => {
  beforeEach(() => {
    useStore.mockReturnValue({
      users: [],
      setUsers: jest.fn(),
      showToast: jest.fn()
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

    const setUsersMock = jest.fn();
    useStore.mockReturnValue({
      users: [],
      setUsers: setUsersMock,
      showToast: jest.fn()
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
});
