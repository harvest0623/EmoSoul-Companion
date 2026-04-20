import { create } from 'zustand';

/**
 * 主题状态管理
 */
const useThemeStore = create((set) => ({
    // 主题模式：false 为亮色，true 为暗色
    darkMode: false,
    
    // 切换主题模式
    toggleDarkMode: () => set((state) => ({
        darkMode: !state.darkMode
    })),
    
    // 设置主题模式
    setDarkMode: (darkMode) => set({
        darkMode
    })
}));

export default useThemeStore;