import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { storage } from '../utils/storage';

/**
 * 认证状态管理
 */
export const useAuthStore = create(
  persist(
    (set, get) => ({
      // 状态
      user: null,
      token: null,
      isAuthenticated: false,
      isHydrated: false,

      // Actions
      login: (userData, token) => {
        storage.setToken(token);
        storage.setUser(userData);
        set({
          user: userData,
          token,
          isAuthenticated: true
        });
      },

      logout: () => {
        storage.clear();
        set({
          user: null,
          token: null,
          isAuthenticated: false
        });
      },

      updateUser: (userData) => {
        const currentUser = get().user;
        const updatedUser = { ...currentUser, ...userData };
        storage.setUser(updatedUser);
        set({ user: updatedUser });
      },

      // 初始化（用于页面刷新后恢复状态）
      init: () => {
        const token = storage.getToken();
        const user = storage.getUser();
        if (token && user) {
          set({
            user,
            token,
            isAuthenticated: true
          });
        }
        set({ isHydrated: true });
      }
    }),
    {
      name: 'auth-storage'
    }
  )
);

export default useAuthStore;
