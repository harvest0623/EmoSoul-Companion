import { create } from 'zustand';
import { diaryApi } from '../services/diaryService';

/**
 * 情绪日记状态管理
 */
export const useDiaryStore = create((set, get) => ({
    // 状态
    calendarData: [],
    stats: null,
    diaryEntries: [],
    isLoading: false,
    currentMonth: new Date().toISOString().slice(0, 7), // '2026-04'

    // 加载日历数据
    loadCalendar: async (month) => {
    const targetMonth = month || get().currentMonth;
    set({ isLoading: true, currentMonth: targetMonth });
    try {
        const result = await diaryApi.getCalendar(targetMonth);
        if (result.code === 200) {
            set({ calendarData: result.data || [] });
        }
    } catch (error) {
        console.error('加载日历数据失败:', error);
    } finally {
        set({ isLoading: false });
    }
  },

    // 加载统计数据
    loadStats: async (period = 'weekly') => {
        try {
            const result = await diaryApi.getStats(period);
            if (result.code === 200) {
                set({ stats: result.data });
            }
        } catch (error) {
            console.error('加载统计失败:', error);
        }
    },

    // 加载日记条目
    loadEntries: async (startDate, endDate) => {
    try {
        const result = await diaryApi.getDiary(startDate, endDate);
        if (result.code === 200) {
            set({ diaryEntries: result.data || [] });
        }
    } catch (error) {
        console.error('加载日记失败:', error);
    }
  },

    // 手动记录
    createEntry: async (data) => {
        try {
            const result = await diaryApi.createEntry(data);
            // 重新加载当月数据
            const month = get().currentMonth;
            get().loadCalendar(month);
            get().loadStats();
            return result;
        } catch (error) {
            console.error('记录失败:', error);
            throw error;
        }
    },

    // 删除日记
    deleteEntry: async (id) => {
        try {
            await diaryApi.deleteEntry(id);
            const month = get().currentMonth;
            get().loadCalendar(month);
            get().loadStats();
        } catch (error) {
            console.error('删除失败:', error);
            throw error;
        }
    },

    // 切换月份
    setMonth: (month) => {
        set({ currentMonth: month });
    }
}));

export default useDiaryStore;