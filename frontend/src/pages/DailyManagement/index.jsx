import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useThemeStore from '../../store/themeStore';
import './DailyManagement.css';

/**
 * 日常管理页面
 */
const DailyManagement = () => {
    const navigate = useNavigate();
    const { darkMode, toggleDarkMode } = useThemeStore();

    const [activeTab, setActiveTab] = useState('calendar');
    const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().split('T')[0].slice(0, 7));
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('event'); // event, todo, habit, date
    const [selectedDate, setSelectedDate] = useState(null);
    const [newEvent, setNewEvent] = useState({ title: '', date: '', time: '', description: '' });
    const [newTodo, setNewTodo] = useState({ text: '', time: '', date: new Date().toISOString().split('T')[0] });
    const [newHabit, setNewHabit] = useState({ name: '', target: 30 });
    const [events, setEvents] = useState([]);
    const [todos, setTodos] = useState([]);
    const [habits, setHabits] = useState([]);

    // 加载本地数据
    useEffect(() => {
        try {
            const savedEvents = localStorage.getItem('dailyEvents');
            const savedTodos = localStorage.getItem('dailyTodos');
            const savedHabits = localStorage.getItem('dailyHabits');

            if (savedEvents) setEvents(JSON.parse(savedEvents));
            if (savedTodos) setTodos(JSON.parse(savedTodos));
            if (savedHabits) setHabits(JSON.parse(savedHabits));
        } catch (error) {
            console.error('加载本地数据失败:', error);
            // 重置数据
            setEvents([]);
            setTodos([]);
            setHabits([]);
        }
    }, []);

    // 保存数据到本地存储
    useEffect(() => {
        localStorage.setItem('dailyEvents', JSON.stringify(events));
    }, [events]);

    useEffect(() => {
        localStorage.setItem('dailyTodos', JSON.stringify(todos));
    }, [todos]);

    useEffect(() => {
        localStorage.setItem('dailyHabits', JSON.stringify(habits));
    }, [habits]);

    // 月份切换
    const handleMonthChange = (direction) => {
        const [year, month] = currentMonth.split('-').map(Number);
        let newYear = year;
        let newMonth = month + direction;
        if (newMonth > 12) { newMonth = 1; newYear++; }
        if (newMonth < 1) { newMonth = 12; newYear--; }
        const newMonthStr = `${newYear}-${String(newMonth).padStart(2, '0')}`;
        setCurrentMonth(newMonthStr);
    };

    // 生成日历
    const renderCalendar = () => {
        const [year, month] = currentMonth.split('-').map(Number);
        const firstDay = new Date(year, month - 1, 1).getDay();
        const daysInMonth = new Date(year, month, 0).getDate();

        const cells = [];
        for (let i = 0; i < firstDay; i++) {
            cells.push(<div key={`empty-${i}`} className="daily-calendar-cell empty" />);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = events.filter(e => e.date === dateStr);
            const dayTodos = todos.filter(t => t.date === dateStr && !t.completed);
            const isToday = dateStr === new Date().toISOString().split('T')[0];

            cells.push(
                <div
                    key={day}
                    className={`daily-calendar-cell ${isToday ? 'today' : ''} ${dayEvents.length > 0 ? 'has-event' : ''} ${dayTodos.length > 0 ? 'has-todo' : ''}`}
                    onClick={() => handleDateClick(dateStr)}
                >
                    <span className="daily-cell-day">{day}</span>
                    <div className="daily-cell-events">
                        {dayEvents.slice(0, 1).map((_, index) => (
                            <span key={`event-${index}`} className="daily-cell-event" />
                        ))}
                        {dayTodos.slice(0, 1).map((_, index) => (
                            <span key={`todo-${index}`} className="daily-cell-todo" />
                        ))}
                    </div>
                    {dayTodos.length > 0 && (
                        <div className="daily-cell-todo-text">有待办事项</div>
                    )}
                </div>
            );
        }
        return cells;
    };

    // 处理日期点击
    const handleDateClick = (date) => {
        setSelectedDate(date);
        setModalType('date');
        setShowModal(true);
    };

    // 格式化日期为YYYY-MM-DD
    const formatDate = (dateString) => {
        if (!dateString) return '';
        return dateString.replace(/\//g, '-');
    };

    // 添加事件
    const handleAddEvent = () => {
        if (!newEvent.title || !newEvent.date) {
            toast.error('请填写完整信息');
            return;
        }

        const event = {
            id: Date.now(),
            ...newEvent,
            date: formatDate(newEvent.date)
        };

        setEvents(prev => [...prev, event]);
        toast.success('日程添加成功！');
        setShowModal(false);
        setNewEvent({ title: '', date: '', time: '', description: '' });
    };

    // 添加待办事项
    const handleAddTodo = () => {
        if (!newTodo.text) {
            toast.error('请输入待办事项');
            return;
        }

        const todo = {
            id: Date.now(),
            text: newTodo.text,
            time: newTodo.time,
            date: formatDate(newTodo.date),
            completed: false,
            createdAt: new Date().toISOString()
        };

        console.log('添加待办事项:', todo);
        setTodos(prev => {
            const newTodos = [...prev, todo];
            console.log('新的待办事项列表:', newTodos);
            return newTodos;
        });
        toast.success('待办事项添加成功！');
        setNewTodo({ text: '', time: '', date: new Date().toISOString().split('T')[0] });
    };

    // 切换待办完成状态
    const toggleTodoComplete = (id) => {
        setTodos(prev => prev.map(todo =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
        ));
    };

    // 删除待办事项
    const deleteTodo = (id) => {
        setTodos(prev => prev.filter(todo => todo.id !== id));
        toast.success('待办事项已删除');
    };

    // 添加习惯
    const handleAddHabit = () => {
        if (!newHabit.name) {
            toast.error('请输入习惯名称');
            return;
        }

        const habit = {
            id: Date.now(),
            name: newHabit.name,
            target: newHabit.target,
            current: 0,
            streak: 0,
            lastCompleted: null
        };

        setHabits(prev => [...prev, habit]);
        toast.success('习惯添加成功！');
        setShowModal(false);
        setNewHabit({ name: '', target: 30 });
    };

    // 完成习惯
    const completeHabit = (id) => {
        setHabits(prev => prev.map(habit => {
            if (habit.id === id) {
                const today = new Date().toISOString().split('T')[0];
                const lastCompletedDate = habit.lastCompleted ? habit.lastCompleted.split('T')[0] : null;
                const isStreak = lastCompletedDate === new Date(Date.now() - 86400000).toISOString().split('T')[0];

                return {
                    ...habit,
                    current: Math.min(habit.current + 1, habit.target),
                    streak: isStreak ? habit.streak + 1 : 1,
                    lastCompleted: new Date().toISOString()
                };
            }
            return habit;
        }));
        toast.success('习惯完成！');
    };

    // 渲染空状态
    const renderEmptyState = (type) => {
        const config = {
            calendar: { icon: '📅', text: '暂无日程', subtext: '点击日期添加日程' },
            todo: { icon: '✓', text: '暂无待办事项', subtext: '添加新的待办事项' },
            habit: { icon: '🌟', text: '暂无习惯', subtext: '添加新的习惯' }
        };

        const { icon, text, subtext } = config[type];

        return (
            <div className="daily-empty-state">
                <div className="daily-empty-icon">{icon}</div>
                <div className="daily-empty-text">{text}</div>
                <div className="daily-empty-subtext">{subtext}</div>
            </div>
        );
    };

    const [year, month] = currentMonth.split('-').map(Number);
    const monthNames = ['', '一月', '二月', '三月', '四月', '五月', '六月',
        '七月', '八月', '九月', '十月', '十一月', '十二月'];

    return (
        <div className={`daily-page ${darkMode ? 'dark-mode' : ''}`}>
            {/* 顶部导航 */}
            <header className="daily-header">
                <button className="daily-back-btn" onClick={() => navigate('/home')}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                </button>
                <h1 className="daily-title">📅 日常管理</h1>
                <button className="mode-toggle-btn" onClick={toggleDarkMode} aria-label={darkMode ? '切换到白天模式' : '切换到夜间模式'}>
                    <span className={`mode-icon iconfont ${darkMode ? 'icon-taiyang' : 'icon-ansemoshi'}`}></span>
                </button>
            </header>

            {/* 标签切换 */}
            <div className="daily-tabs">
                <button
                    className={`daily-tab ${activeTab === 'calendar' ? 'active' : ''}`}
                    onClick={() => setActiveTab('calendar')}
                >
                    <span className="daily-tab-icon">📅</span>
                    日程提醒
                </button>
                <button
                    className={`daily-tab ${activeTab === 'todo' ? 'active' : ''}`}
                    onClick={() => setActiveTab('todo')}
                >
                    <span className="daily-tab-icon">✓</span>
                    待办事项
                </button>
                <button
                    className={`daily-tab ${activeTab === 'habit' ? 'active' : ''}`}
                    onClick={() => setActiveTab('habit')}
                >
                    <span className="daily-tab-icon">🌟</span>
                    习惯养成
                </button>
            </div>

            <div className="daily-content">
                {activeTab === 'calendar' && (
                    <div className="daily-card">
                        <div className="daily-calendar">
                            <div className="daily-calendar-nav">
                                <button onClick={() => handleMonthChange(-1)}>‹</button>
                                <span>{year}年{monthNames[month]}</span>
                                <button onClick={() => handleMonthChange(1)}>›</button>
                            </div>
                            <div className="daily-calendar-weekdays">
                                {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                                    <div key={d} className="daily-weekday">{d}</div>
                                ))}
                            </div>
                            <div className="daily-calendar-grid">
                                {renderCalendar()}
                            </div>
                        </div>

                        <div style={{ marginTop: '20px' }}>
                            <h3>近期日程</h3>
                            {events.length === 0 ? (
                                renderEmptyState('calendar')
                            ) : (
                                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                    {events
                                        .sort((a, b) => a.date.localeCompare(b.date))
                                        .slice(0, 5)
                                        .map(event => (
                                            <div key={event.id} style={{
                                                padding: '12px',
                                                margin: '8px 0',
                                                background: 'rgba(59, 130, 246, 0.05)',
                                                borderRadius: '8px',
                                                borderLeft: '4px solid #3B82F6'
                                            }}>
                                                <div style={{ fontWeight: '600', marginBottom: '4px' }}>{event.title}</div>
                                                <div style={{ fontSize: '12px', color: '#666' }}>
                                                    {event.date} {event.time}
                                                </div>
                                                {event.description && (
                                                    <div style={{ fontSize: '13px', marginTop: '4px', color: '#666' }}>
                                                        {event.description}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    }
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'todo' && (
                    <div className="daily-card">
                        <h3>待办事项</h3>
                        <div className="daily-form">
                            <input
                                type="text"
                                className="daily-input"
                                placeholder="添加新的待办事项..."
                                value={newTodo.text}
                                onChange={e => setNewTodo(prev => ({ ...prev, text: e.target.value }))}
                            />
                            <input
                                type="date"
                                className="daily-input"
                                style={{ width: '140px' }}
                                value={newTodo.date}
                                onChange={e => setNewTodo(prev => ({ ...prev, date: e.target.value }))}
                            />
                            <input
                                type="time"
                                className="daily-input"
                                style={{ width: '100px' }}
                                value={newTodo.time}
                                onChange={e => setNewTodo(prev => ({ ...prev, time: e.target.value }))}
                            />
                            <button
                                className="daily-btn daily-btn-primary"
                                onClick={handleAddTodo}
                            >
                                添加
                            </button>
                        </div>

                        {todos.length === 0 ? (
                            renderEmptyState('todo')
                        ) : (
                            <div className="daily-todo-list">
                                {todos.map(todo => (
                                    <div key={todo.id} className={`daily-todo-item ${todo.completed ? 'completed' : ''}`}>
                                        <input
                                            type="checkbox"
                                            className="daily-todo-checkbox"
                                            checked={todo.completed}
                                            onChange={() => toggleTodoComplete(todo.id)}
                                        />
                                        <span className="daily-todo-text">{todo.text}</span>
                                        {todo.time && (
                                            <span className="daily-todo-time">{todo.time}</span>
                                        )}
                                        <button
                                            className="daily-todo-delete"
                                            onClick={() => deleteTodo(todo.id)}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'habit' && (
                    <div className="daily-card">
                        <h3>习惯养成</h3>
                        <div className="daily-form">
                            <input
                                type="text"
                                className="daily-input"
                                placeholder="添加新的习惯..."
                                value={newHabit.name}
                                onChange={e => setNewHabit(prev => ({ ...prev, name: e.target.value }))}
                            />
                            <input
                                type="number"
                                className="daily-input"
                                style={{ width: '100px' }}
                                placeholder="目标天数"
                                value={newHabit.target}
                                onChange={e => setNewHabit(prev => ({ ...prev, target: parseInt(e.target.value) || 0 }))}
                                min="1"
                            />
                            <button
                                className="daily-btn daily-btn-primary"
                                onClick={() => {
                                    setModalType('habit');
                                    setShowModal(true);
                                }}
                            >
                                添加
                            </button>
                        </div>

                        {habits.length === 0 ? (
                            renderEmptyState('habit')
                        ) : (
                            <div className="daily-habits">
                                {habits.map(habit => {
                                    const percentage = Math.round((habit.current / habit.target) * 100);
                                    return (
                                        <div key={habit.id} className="daily-habit-card">
                                            <div className="daily-habit-header">
                                                <span className="daily-habit-name">{habit.name}</span>
                                                <span className="daily-habit-streak">{habit.streak}天</span>
                                            </div>
                                            <div className="daily-habit-progress">
                                                <div className="daily-habit-bar-wrapper">
                                                    <div
                                                        className="daily-habit-bar"
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                                <span className="daily-habit-percentage">{percentage}%</span>
                                            </div>
                                            <div className="daily-habit-actions">
                                                <button
                                                    className="daily-btn daily-btn-primary"
                                                    onClick={() => completeHabit(habit.id)}
                                                    disabled={habit.current >= habit.target}
                                                >
                                                    {habit.current >= habit.target ? '已完成' : '完成今日'}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 弹窗 */}
            {showModal && (
                <div className="daily-overlay" onClick={() => setShowModal(false)}>
                    <div className="daily-modal" onClick={e => e.stopPropagation()}>
                        <div className="daily-modal-header">
                            <h3>
                                {modalType === 'event' && '添加日程'}
                                {modalType === 'habit' && '添加习惯'}
                            </h3>
                            <button className="daily-close-btn" onClick={() => setShowModal(false)}>✕</button>
                        </div>

                        {modalType === 'event' && (
                            <>
                                <div className="daily-form-group">
                                    <label className="daily-form-label">标题</label>
                                    <input
                                        type="text"
                                        className="daily-form-input"
                                        placeholder="日程标题"
                                        value={newEvent.title}
                                        onChange={e => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                                    />
                                </div>
                                <div className="daily-form-group">
                                    <label className="daily-form-label">日期</label>
                                    <input
                                        type="date"
                                        className="daily-form-input"
                                        value={newEvent.date}
                                        onChange={e => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                                    />
                                </div>
                                <div className="daily-form-group">
                                    <label className="daily-form-label">时间</label>
                                    <input
                                        type="time"
                                        className="daily-form-input"
                                        value={newEvent.time}
                                        onChange={e => setNewEvent(prev => ({ ...prev, time: e.target.value }))}
                                    />
                                </div>
                                <div className="daily-form-group">
                                    <label className="daily-form-label">描述</label>
                                    <textarea
                                        className="daily-form-input"
                                        placeholder="日程描述（可选）"
                                        value={newEvent.description}
                                        onChange={e => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                                        rows={3}
                                    />
                                </div>
                                <div className="daily-modal-actions">
                                    <button className="daily-btn daily-btn-secondary" onClick={() => setShowModal(false)}>取消</button>
                                    <button className="daily-btn daily-btn-primary" onClick={handleAddEvent}>添加</button>
                                </div>
                            </>
                        )}

                        {modalType === 'habit' && (
                            <>
                                <div className="daily-form-group">
                                    <label className="daily-form-label">习惯名称</label>
                                    <input
                                        type="text"
                                        className="daily-form-input"
                                        placeholder="习惯名称"
                                        value={newHabit.name}
                                        onChange={e => setNewHabit(prev => ({ ...prev, name: e.target.value }))}
                                    />
                                </div>
                                <div className="daily-form-group">
                                    <label className="daily-form-label">目标天数</label>
                                    <input
                                        type="number"
                                        className="daily-form-input"
                                        placeholder="目标天数"
                                        value={newHabit.target}
                                        onChange={e => setNewHabit(prev => ({ ...prev, target: parseInt(e.target.value) || 0 }))}
                                        min="1"
                                    />
                                </div>
                                <div className="daily-modal-actions">
                                    <button className="daily-btn daily-btn-secondary" onClick={() => setShowModal(false)}>取消</button>
                                    <button className="daily-btn daily-btn-primary" onClick={handleAddHabit}>添加</button>
                                </div>
                            </>
                        )}

                        {modalType === 'date' && selectedDate && (
                            <>
                                <div className="daily-form-group">
                                    <label className="daily-form-label">日期</label>
                                    <input
                                        type="date"
                                        className="daily-form-input"
                                        value={selectedDate}
                                        readOnly
                                    />
                                </div>

                                {/* 待办事项列表 */}
                                <div className="daily-form-group">
                                    <label className="daily-form-label">待办事项</label>
                                    <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '12px' }}>
                                        {todos.filter(t => t.date === selectedDate).length === 0 ? (
                                            <div style={{ textAlign: 'center', color: '#999', padding: '16px' }}>
                                                暂无待办事项
                                            </div>
                                        ) : (
                                            todos.filter(t => t.date === selectedDate).map(todo => (
                                                <div key={todo.id} style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '12px',
                                                    padding: '12px',
                                                    margin: '4px 0',
                                                    background: 'rgba(255, 255, 255, 0.5)',
                                                    borderRadius: '8px'
                                                }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={todo.completed}
                                                        onChange={() => toggleTodoComplete(todo.id)}
                                                    />
                                                    <span style={{ flex: 1, textDecoration: todo.completed ? 'line-through' : 'none' }}>
                                                        {todo.text}
                                                    </span>
                                                    {todo.time && (
                                                        <span style={{ fontSize: '12px', color: '#666' }}>
                                                            {todo.time}
                                                        </span>
                                                    )}
                                                    <button
                                                        onClick={() => deleteTodo(todo.id)}
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            color: '#EF4444',
                                                            cursor: 'pointer',
                                                            padding: '4px'
                                                        }}
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* 日程列表 */}
                                <div className="daily-form-group">
                                    <label className="daily-form-label">日程</label>
                                    <div style={{ maxHeight: '150px', overflowY: 'auto', marginBottom: '12px' }}>
                                        {events.filter(e => e.date === selectedDate).length === 0 ? (
                                            <div style={{ textAlign: 'center', color: '#999', padding: '16px' }}>
                                                暂无日程
                                            </div>
                                        ) : (
                                            events.filter(e => e.date === selectedDate).map(event => (
                                                <div key={event.id} style={{
                                                    padding: '12px',
                                                    margin: '4px 0',
                                                    background: 'rgba(59, 130, 246, 0.05)',
                                                    borderRadius: '8px',
                                                    borderLeft: '4px solid #3B82F6'
                                                }}>
                                                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>{event.title}</div>
                                                    {event.time && (
                                                        <div style={{ fontSize: '12px', color: '#666' }}>
                                                            {event.time}
                                                        </div>
                                                    )}
                                                    {event.description && (
                                                        <div style={{ fontSize: '13px', marginTop: '4px', color: '#666' }}>
                                                            {event.description}
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* 添加新任务 */}
                                <div className="daily-form-group">
                                    <label className="daily-form-label">添加新任务</label>
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                                        <input
                                            type="text"
                                            className="daily-form-input"
                                            style={{ flex: 1 }}
                                            placeholder="输入待办事项..."
                                            value={newTodo.text}
                                            onChange={e => setNewTodo(prev => ({ ...prev, text: e.target.value, date: selectedDate }))}
                                        />
                                        <input
                                            type="time"
                                            className="daily-form-input"
                                            style={{ width: '100px' }}
                                            value={newTodo.time}
                                            onChange={e => setNewTodo(prev => ({ ...prev, time: e.target.value }))}
                                        />
                                        <button
                                            className="daily-btn daily-btn-primary"
                                            onClick={handleAddTodo}
                                            style={{ whiteSpace: 'nowrap' }}
                                        >
                                            添加
                                        </button>
                                    </div>
                                </div>

                                <div className="daily-modal-actions">
                                    <button
                                        className="daily-btn daily-btn-secondary"
                                        onClick={() => {
                                            setShowModal(false);
                                            setNewTodo({ text: '', time: '', date: new Date().toISOString().split('T')[0] });
                                        }}
                                    >
                                        关闭
                                    </button>
                                    <button
                                        className="daily-btn daily-btn-primary"
                                        onClick={() => {
                                            setNewEvent(prev => ({ ...prev, date: selectedDate }));
                                            setModalType('event');
                                        }}
                                    >
                                        添加日程
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* FAB 按钮 */}
            <button
                className="daily-fab-btn"
                onClick={() => {
                    if (activeTab === 'calendar') {
                        setNewEvent(prev => ({
                            ...prev,
                            date: new Date().toISOString().split('T')[0]
                        }));
                        setModalType('event');
                        setShowModal(true);
                    } else if (activeTab === 'habit') {
                        setModalType('habit');
                        setShowModal(true);
                    }
                }}
            >
                +
            </button>
        </div>
    );
};

export default DailyManagement;