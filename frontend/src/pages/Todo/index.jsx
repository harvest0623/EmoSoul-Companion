import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import todoApi from '../../services/todoService';
import useThemeStore from '../../store/themeStore';
import './Todo.css';

// 优先级配置
const PRIORITIES = {
  low: { label: '低', color: '#10B981', bgColor: '#D1FAE5' },
  medium: { label: '中', color: '#F59E0B', bgColor: '#FEF3C7' },
  high: { label: '高', color: '#EF4444', bgColor: '#FEE2E2' },
};

// 筛选标签
const FILTER_TABS = [
  { key: 'all', label: '全部' },
  { key: 'active', label: '未完成' },
  { key: 'completed', label: '已完成' },
];

/**
 * 日常管理（待办事项）页面
 */
const Todo = () => {
  const navigate = useNavigate();
  const { darkMode } = useThemeStore();

  const [todos, setTodos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState(null);

  // 新增表单
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium',
  });

  // 加载待办列表
  useEffect(() => {
    loadTodos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const loadTodos = async () => {
    setIsLoading(true);
    try {
      let completed;
      if (activeTab === 'active') completed = false;
      else if (activeTab === 'completed') completed = true;
      
      const res = await todoApi.getTodos(completed);
      setTodos(res.data || []);
    } catch (err) {
      toast.error('加载待办事项失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 切换完成状态
  const handleToggleComplete = async (todo) => {
    try {
      await todoApi.updateTodo(todo.id, { completed: !todo.completed });
      setTodos(prev => prev.map(t => 
        t.id === todo.id ? { ...t, completed: !t.completed } : t
      ));
      toast.success(todo.completed ? '已标记为未完成' : '已完成！');
    } catch (err) {
      toast.error('操作失败');
    }
  };

  // 删除待办
  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除这个待办事项吗？')) return;
    try {
      await todoApi.deleteTodo(id);
      setTodos(prev => prev.filter(t => t.id !== id));
      toast.success('删除成功');
    } catch (err) {
      toast.error('删除失败');
    }
  };

  // 创建待办
  const handleCreate = async () => {
    if (!formData.title.trim()) {
      toast.error('请输入标题');
      return;
    }
    try {
      await todoApi.createTodo({
        title: formData.title.trim(),
        description: formData.description.trim(),
        dueDate: formData.dueDate || null,
        priority: formData.priority,
      });
      toast.success('添加成功');
      setShowModal(false);
      setFormData({ title: '', description: '', dueDate: '', priority: 'medium' });
      loadTodos();
    } catch (err) {
      toast.error('添加失败');
    }
  };

  // 长按处理
  const handleTouchStart = (todo) => {
    const timer = setTimeout(() => {
      handleDelete(todo.id);
    }, 800);
    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // 格式化日期
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return '今天';
    if (date.toDateString() === tomorrow.toDateString()) return '明天';
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  // 获取优先级配置
  const getPriorityConfig = (priority) => PRIORITIES[priority] || PRIORITIES.medium;

  // 过滤后的待办列表
  const filteredTodos = todos;

  return (
    <div className={`todo-page ${darkMode ? 'dark-mode' : ''}`}>
      {/* 顶部导航 */}
      <header className="todo-header">
        <button className="todo-back-btn" onClick={() => navigate(-1)}>
          <span className="iconfont icon-fanhui"></span>
        </button>
        <h1 className="todo-title">日常管理</h1>
        <button className="todo-add-btn" onClick={() => setShowModal(true)}>
          <span className="iconfont icon-jia"></span>
        </button>
      </header>

      {/* 内容区 */}
      <div className="todo-content">
        {/* 待办列表 */}
        <div className="todo-list">
          {filteredTodos.length === 0 ? (
            <div className="todo-empty">
              <div className="todo-empty-icon">📝</div>
              <p>暂无待办，点击 + 添加</p>
            </div>
          ) : (
            filteredTodos.map(todo => {
              const priorityConfig = getPriorityConfig(todo.priority);
              return (
                <div
                  key={todo.id}
                  className={`todo-item ${todo.completed ? 'completed' : ''}`}
                  style={{ '--priority-color': priorityConfig.color }}
                  onTouchStart={() => handleTouchStart(todo)}
                  onTouchEnd={handleTouchEnd}
                  onMouseDown={() => handleTouchStart(todo)}
                  onMouseUp={handleTouchEnd}
                  onMouseLeave={handleTouchEnd}
                >
                  {/* 左侧彩色边条 */}
                  <div className="todo-priority-bar" style={{ background: priorityConfig.color }}></div>
                  
                  {/* 勾选框 */}
                  <button
                    className={`todo-checkbox ${todo.completed ? 'checked' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleComplete(todo);
                    }}
                  >
                    {todo.completed && <span className="iconfont icon-duihao"></span>}
                  </button>

                  {/* 内容区 */}
                  <div className="todo-info">
                    <h3 className="todo-item-title">{todo.title}</h3>
                    {todo.description && (
                      <p className="todo-item-desc">{todo.description}</p>
                    )}
                    {todo.due_date && (
                      <span className="todo-item-date">
                        <span className="iconfont icon-rili"></span>
                        {formatDate(todo.due_date)}
                      </span>
                    )}
                  </div>

                  {/* 优先级标签 */}
                  <span 
                    className="todo-priority-tag"
                    style={{ 
                      color: priorityConfig.color, 
                      background: priorityConfig.bgColor 
                    }}
                  >
                    {priorityConfig.label}
                  </span>

                  {/* 删除按钮 */}
                  <button
                    className="todo-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(todo.id);
                    }}
                  >
                    <span className="iconfont icon-shanchu"></span>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 底部筛选 Tab */}
      <div className="todo-filter-tabs">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.key}
            className={`todo-filter-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 新增弹窗 */}
      {showModal && (
        <div className="todo-overlay" onClick={() => setShowModal(false)}>
          <div className="todo-modal" onClick={e => e.stopPropagation()}>
            <h3>新增待办</h3>
            
            <div className="todo-form-group">
              <label>标题 <span className="required">*</span></label>
              <input
                type="text"
                placeholder="请输入待办事项"
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                autoFocus
              />
            </div>

            <div className="todo-form-group">
              <label>描述</label>
              <textarea
                placeholder="添加描述（可选）"
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="todo-form-group">
              <label>截止日期</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={e => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>

            <div className="todo-form-group">
              <label>优先级</label>
              <div className="todo-priority-selector">
                {Object.entries(PRIORITIES).map(([key, config]) => (
                  <button
                    key={key}
                    className={`todo-priority-option ${formData.priority === key ? 'active' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, priority: key }))}
                    style={{
                      color: formData.priority === key ? config.color : 'var(--text-secondary)',
                      borderColor: formData.priority === key ? config.color : 'var(--border-color)',
                      background: formData.priority === key ? config.bgColor : 'transparent',
                    }}
                  >
                    {config.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="todo-modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleCreate}>
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading && <div className="todo-loading">加载中...</div>}
    </div>
  );
};

export default Todo;