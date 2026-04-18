import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useDiaryStore from '../../store/diaryStore';
import useThemeStore from '../../store/themeStore';
import './HealthManagement.css';

// 情绪配置
const EMOTIONS = [
  { key: 'happy', label: '开心', emoji: '😊', color: '#FFD700' },
  { key: 'sad', label: '难过', emoji: '😢', color: '#64B5F6' },
  { key: 'angry', label: '生气', emoji: '😠', color: '#FF5252' },
  { key: 'surprised', label: '惊讶', emoji: '😲', color: '#FF9800' },
  { key: 'anxious', label: '焦虑', emoji: '😰', color: '#FFC107' },
  { key: 'calm', label: '平静', emoji: '😌', color: '#81C784' },
  { key: 'thinking', label: '思考', emoji: '🤔', color: '#CE93D8' },
  { key: 'love', label: '喜爱', emoji: '🥰', color: '#F48FB1' },
];

// 睡眠质量配置
const SLEEP_QUALITY = [
  { key: 'excellent', label: '很好', emoji: '😴', color: '#4CAF50' },
  { key: 'good', label: '好', emoji: '😊', color: '#8BC34A' },
  { key: 'fair', label: '一般', emoji: '😐', color: '#FFC107' },
  { key: 'poor', label: '差', emoji: '😫', color: '#FF9800' },
  { key: 'bad', label: '很差', emoji: '😢', color: '#FF5722' },
];

// 减压建议
const STRESS_SUGGESTIONS = [
  { id: 1, title: '深呼吸练习', icon: '🌬️', description: '每天花5分钟进行4-7-8呼吸法：吸气4秒，屏气7秒，呼气8秒' },
  { id: 2, title: '冥想正念', icon: '🧘', description: '使用正念冥想，专注于当下，释放压力和焦虑' },
  { id: 3, title: '运动健身', icon: '🏃', description: '每天30分钟有氧运动，如散步、跑步或瑜伽' },
  { id: 4, title: '充足睡眠', icon: '💤', description: '保证7-9小时睡眠，建立规律的作息习惯' },
  { id: 5, title: '兴趣爱好', icon: '🎨', description: '花时间做自己喜欢的事情，如绘画、阅读或音乐' },
  { id: 6, title: '社交连接', icon: '👫', description: '与家人朋友交流，分享感受，获得情感支持' },
];

const getEmotionConfig = (key) => EMOTIONS.find(e => e.key === key) || EMOTIONS[5];
const getSleepConfig = (key) => SLEEP_QUALITY.find(s => s.key === key) || SLEEP_QUALITY[2];

/**
 * 健康管理页面
 */
const HealthManagement = () => {
  const navigate = useNavigate();
  const { calendarData, stats, isLoading, currentMonth, loadCalendar, loadStats, createEntry, setMonth } = useDiaryStore();
  const { darkMode, toggleDarkMode } = useThemeStore();

  const [statsPeriod, setStatsPeriod] = useState('weekly');
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [recordForm, setRecordForm] = useState({ emotion: 'calm', intensity: 3, note: '', sleepQuality: 'fair', sleepHours: 7, exercise: false });
  const [activeTab, setActiveTab] = useState('mood');
  const [localData, setLocalData] = useState({
    sleepRecords: {},
    exerciseRecords: {},
  });

  // 加载本地数据
  useEffect(() => {
    const savedSleep = localStorage.getItem('sleepRecords');
    const savedExercise = localStorage.getItem('exerciseRecords');
    if (savedSleep) setLocalData(prev => ({ ...prev, sleepRecords: JSON.parse(savedSleep) }));
    if (savedExercise) setLocalData(prev => ({ ...prev, exerciseRecords: JSON.parse(savedExercise) }));
  }, []);

  useEffect(() => {
    loadCalendar();
    loadStats(statsPeriod);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePeriodChange = (period) => {
    setStatsPeriod(period);
    loadStats(period);
  };

  const handleMonthChange = (direction) => {
    const [year, month] = currentMonth.split('-').map(Number);
    let newYear = year;
    let newMonth = month + direction;
    if (newMonth > 12) { newMonth = 1; newYear++; }
    if (newMonth < 1) { newMonth = 12; newYear--; }
    const newMonthStr = `${newYear}-${String(newMonth).padStart(2, '0')}`;
    setMonth(newMonthStr);
    loadCalendar(newMonthStr);
  };

  const handleRecord = async () => {
    try {
      await createEntry(recordForm);
      
      // 保存睡眠记录
      const dateKey = new Date().toISOString().split('T')[0];
      const updatedSleep = { ...localData.sleepRecords, [dateKey]: { quality: recordForm.sleepQuality, hours: recordForm.sleepHours } };
      const updatedExercise = { ...localData.exerciseRecords, [dateKey]: recordForm.exercise };
      
      setLocalData({ sleepRecords: updatedSleep, exerciseRecords: updatedExercise });
      localStorage.setItem('sleepRecords', JSON.stringify(updatedSleep));
      localStorage.setItem('exerciseRecords', JSON.stringify(updatedExercise));
      
      toast.success('健康记录成功！');
      setShowRecordModal(false);
      setRecordForm({ emotion: 'calm', intensity: 3, note: '', sleepQuality: 'fair', sleepHours: 7, exercise: false });
    } catch (err) {
      toast.error('记录失败');
    }
  };

  // 点击日期打开记录弹窗
  const handleDateClick = (date) => {
    setSelectedDate(date);
    setShowRecordModal(true);
  };

  // 生成日历格子
  const renderCalendar = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();

    const calendarMap = {};
    calendarData.forEach(item => {
      const day = new Date(item.date).getDate();
      calendarMap[day] = item;
    });

    const cells = [];
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="health-calendar-cell empty" />);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const data = calendarMap[day];
      const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const emotionConfig = data ? getEmotionConfig(data.primaryEmotion) : null;
      const isToday = new Date().getDate() === day &&
        new Date().getMonth() + 1 === month &&
        new Date().getFullYear() === year;

      const hasSleepRecord = localData.sleepRecords[dateKey];
      const hasExerciseRecord = localData.exerciseRecords[dateKey];

      cells.push(
        <div
          key={day}
          className={`health-calendar-cell ${isToday ? 'today' : ''} ${data ? 'has-data' : ''} ${hasSleepRecord ? 'has-sleep' : ''} ${hasExerciseRecord ? 'has-exercise' : ''}`}
          onClick={() => handleDateClick(dateKey)}
          style={data ? { '--emotion-color': emotionConfig.color } : {}}
        >
          <span className="health-cell-day">{day}</span>
          <div className="health-cell-indicators">
            {data && <span className="health-cell-emoji">{emotionConfig.emoji}</span>}
            {hasSleepRecord && <span className="health-cell-sleep">😴</span>}
            {hasExerciseRecord && <span className="health-cell-exercise">💪</span>}
          </div>
        </div>
      );
    }
    return cells;
  };

  // 情绪分布
  const renderDistribution = () => {
    if (!stats || !stats.distribution || stats.distribution.length === 0) {
      return <div className="health-empty-stats">暂无数据，开始记录心情吧~</div>;
    }

    return (
      <div className="health-emotion-distribution">
        {stats.distribution.map(item => {
          const config = getEmotionConfig(item.emotion);
          return (
            <div key={item.emotion} className="health-dist-item">
              <div className="health-dist-bar-wrapper">
                <div
                  className="health-dist-bar"
                  style={{ width: `${item.percentage}%`, background: config.color }}
                />
              </div>
              <span className="health-dist-emoji">{config.emoji}</span>
              <span className="health-dist-label">{config.label}</span>
              <span className="health-dist-percent">{item.percentage}%</span>
            </div>
          );
        })}
      </div>
    );
  };

  // 趋势指示
  const renderTrend = () => {
    if (!stats) return null;
    const trendMap = {
      improving: { text: '情绪趋势向好 📈', className: 'health-trend-up' },
      declining: { text: '情绪有所波动 📉', className: 'health-trend-down' },
      stable: { text: '情绪保持稳定 ➡️', className: 'health-trend-stable' }
    };
    const trend = trendMap[stats.overallTrend] || trendMap.stable;
    return (
      <div className={`health-trend-indicator ${trend.className}`}>
        {trend.text}
      </div>
    );
  };

  // 睡眠统计
  const renderSleepStats = () => {
    const sleepRecords = Object.values(localData.sleepRecords);
    if (sleepRecords.length === 0) {
      return <div className="health-empty-stats">暂无睡眠数据，开始记录吧~</div>;
    }

    const avgHours = sleepRecords.reduce((sum, r) => sum + (r.hours || 0), 0) / sleepRecords.length;
    const qualityCount = {};
    sleepRecords.forEach(r => {
      qualityCount[r.quality] = (qualityCount[r.quality] || 0) + 1;
    });

    return (
      <div className="health-sleep-stats">
        <div className="health-sleep-avg">
          <span className="health-sleep-icon">😴</span>
          <div>
            <div className="health-sleep-value">{avgHours.toFixed(1)}小时</div>
            <div className="health-sleep-label">平均睡眠</div>
          </div>
        </div>
        <div className="health-sleep-quality">
          {SLEEP_QUALITY.map(q => {
            const count = qualityCount[q.key] || 0;
            const percent = sleepRecords.length > 0 ? (count / sleepRecords.length) * 100 : 0;
            return (
              <div key={q.key} className="health-sleep-item">
                <span className="health-sleep-emoji">{q.emoji}</span>
                <span className="health-sleep-name">{q.label}</span>
                <div className="health-sleep-bar-wrapper">
                  <div className="health-sleep-bar" style={{ width: `${percent}%`, background: q.color }} />
                </div>
                <span className="health-sleep-percent">{count}天</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const [year, month] = currentMonth.split('-').map(Number);
  const monthNames = ['', '一月', '二月', '三月', '四月', '五月', '六月',
    '七月', '八月', '九月', '十月', '十一月', '十二月'];

  return (
    <div className={`health-page ${darkMode ? 'dark-mode' : ''}`}>
      {/* 顶部导航 */}
      <header className="health-header">
        <button className="health-back-btn" onClick={() => navigate('/home')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="health-title">🩺 健康管理</h1>
        <button className="mode-toggle-btn" onClick={toggleDarkMode} aria-label={darkMode ? '切换到白天模式' : '切换到夜间模式'}>
          <span className={`mode-icon iconfont ${darkMode ? 'icon-taiyang' : 'icon-ansemoshi'}`}></span>
        </button>
      </header>

      {/* 标签切换 */}
      <div className="health-tabs">
        <button 
          className={`health-tab ${activeTab === 'mood' ? 'active' : ''}`}
          onClick={() => setActiveTab('mood')}
        >
          <span className="health-tab-icon">😊</span>
          心情记录
        </button>
        <button 
          className={`health-tab ${activeTab === 'sleep' ? 'active' : ''}`}
          onClick={() => setActiveTab('sleep')}
        >
          <span className="health-tab-icon">😴</span>
          睡眠追踪
        </button>
        <button 
          className={`health-tab ${activeTab === 'stress' ? 'active' : ''}`}
          onClick={() => setActiveTab('stress')}
        >
          <span className="health-tab-icon">🧘</span>
          减压建议
        </button>
      </div>

      <div className="health-content">
        {activeTab === 'mood' && (
          <>
            {/* 统计周期切换 */}
            <div className="health-period-tabs">
              <button
                className={`health-period-tab ${statsPeriod === 'weekly' ? 'active' : ''}`}
                onClick={() => handlePeriodChange('weekly')}
              >近一周</button>
              <button
                className={`health-period-tab ${statsPeriod === 'monthly' ? 'active' : ''}`}
                onClick={() => handlePeriodChange('monthly')}
              >近一月</button>
            </div>

            {/* 趋势 + 情绪分布 */}
            <div className="health-stats-section">
              {renderTrend()}
              <div className="health-stats-card">
                <h3>情绪分布</h3>
                {renderDistribution()}
              </div>
            </div>

            {/* 日历 */}
            <div className="health-calendar-section">
              <div className="health-calendar-nav">
                <button onClick={() => handleMonthChange(-1)}>‹</button>
                <span>{year}年{monthNames[month]}</span>
                <button onClick={() => handleMonthChange(1)}>›</button>
              </div>
              <div className="health-calendar-weekdays">
                {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                  <div key={d} className="health-weekday">{d}</div>
                ))}
              </div>
              <div className="health-calendar-grid">
                {renderCalendar()}
              </div>
            </div>
          </>
        )}

        {activeTab === 'sleep' && (
          <>
            {/* 睡眠统计 */}
            <div className="health-sleep-section">
              <div className="health-stats-card">
                <h3>睡眠统计</h3>
                {renderSleepStats()}
              </div>
              
              {/* 睡眠建议 */}
              <div className="health-sleep-tips">
                <h3>💤 睡眠小贴士</h3>
                <div className="health-sleep-tips-list">
                  <div className="health-sleep-tip">
                    <span className="health-tip-icon">🌙</span>
                    <p>保持规律的作息时间，每天在相同的时间上床和起床</p>
                  </div>
                  <div className="health-sleep-tip">
                    <span className="health-tip-icon">📵</span>
                    <p>睡前1小时避免使用电子设备，蓝光会影响褪黑素分泌</p>
                  </div>
                  <div className="health-sleep-tip">
                    <span className="health-tip-icon">🍵</span>
                    <p>睡前避免饮用咖啡、浓茶等刺激性饮品</p>
                  </div>
                  <div className="health-sleep-tip">
                    <span className="health-tip-icon">🛏️</span>
                    <p>保持卧室安静、黑暗、凉爽，营造良好的睡眠环境</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'stress' && (
          <>
            {/* 减压建议 */}
            <div className="health-stress-section">
              <div className="health-stress-header">
                <h3>🧘 减压建议</h3>
                <p className="health-stress-desc">选择适合您的方式放松身心</p>
              </div>
              <div className="health-stress-suggestions">
                {STRESS_SUGGESTIONS.map(suggestion => (
                  <div key={suggestion.id} className="health-stress-card">
                    <div className="health-stress-icon">{suggestion.icon}</div>
                    <h4>{suggestion.title}</h4>
                    <p>{suggestion.description}</p>
                    <button 
                      className="health-stress-btn"
                      onClick={() => toast.success(`开始实践：${suggestion.title}`)}
                    >
                      开始实践
                    </button>
                  </div>
                ))}
              </div>
              
              {/* 呼吸练习 */}
              <div className="health-breathing-section">
                <h3>🌬️ 深呼吸练习</h3>
                <div className="health-breathing-guide">
                  <div className="health-breathing-circle">
                    <div className="health-breathing-text">
                      <p>4-7-8呼吸法</p>
                      <small>吸气4秒 • 屏气7秒 • 呼气8秒</small>
                    </div>
                  </div>
                  <button 
                    className="health-breathing-btn"
                    onClick={() => toast.success('开始4-7-8呼吸练习！')}
                  >
                    开始练习
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 记录弹窗 */}
      {showRecordModal && (
        <div className="health-overlay" onClick={() => setShowRecordModal(false)}>
          <div className="health-record-modal" onClick={e => e.stopPropagation()}>
            <div className="health-modal-header">
              <h3>记录今日健康</h3>
              <button className="health-close-btn" onClick={() => setShowRecordModal(false)}>✕</button>
            </div>

            {/* 情绪选择 */}
            <div className="health-section-label">今日心情</div>
            <div className="health-emotion-selector">
              {EMOTIONS.map(e => (
                <button
                  key={e.key}
                  className={`health-emotion-option ${recordForm.emotion === e.key ? 'active' : ''}`}
                  onClick={() => setRecordForm(prev => ({ ...prev, emotion: e.key }))}
                  style={recordForm.emotion === e.key ? { borderColor: e.color, background: `${e.color}15` } : {}}
                >
                  <span className="health-emo-emoji">{e.emoji}</span>
                  <span className="health-emo-label">{e.label}</span>
                </button>
              ))}
            </div>

            {/* 情绪强度 */}
            <div className="health-intensity-slider">
              <div className="health-slider-label">
                <span>情绪强度</span>
                <span className="health-intensity-value">{recordForm.intensity}/5</span>
              </div>
              <input
                type="range"
                min="1" max="5"
                value={recordForm.intensity}
                onChange={e => setRecordForm(prev => ({ ...prev, intensity: parseInt(e.target.value) }))}
              />
              <div className="health-intensity-labels">
                <span>轻微</span><span>强烈</span>
              </div>
            </div>

            {/* 睡眠质量 */}
            <div className="health-section-label">睡眠质量</div>
            <div className="health-sleep-selector">
              {SLEEP_QUALITY.map(s => (
                <button
                  key={s.key}
                  className={`health-sleep-option ${recordForm.sleepQuality === s.key ? 'active' : ''}`}
                  onClick={() => setRecordForm(prev => ({ ...prev, sleepQuality: s.key }))}
                  style={recordForm.sleepQuality === s.key ? { borderColor: s.color, background: `${s.color}15` } : {}}
                >
                  <span className="health-sleep-emoji">{s.emoji}</span>
                  <span className="health-sleep-label">{s.label}</span>
                </button>
              ))}
            </div>

            {/* 睡眠时长 */}
            <div className="health-sleep-hours">
              <div className="health-hours-label">睡眠时长</div>
              <div className="health-hours-selector">
                <button 
                  className={`health-hour-btn ${recordForm.sleepHours === 5 ? 'active' : ''}`}
                  onClick={() => setRecordForm(prev => ({ ...prev, sleepHours: 5 }))}
                >5h</button>
                <button 
                  className={`health-hour-btn ${recordForm.sleepHours === 6 ? 'active' : ''}`}
                  onClick={() => setRecordForm(prev => ({ ...prev, sleepHours: 6 }))}
                >6h</button>
                <button 
                  className={`health-hour-btn ${recordForm.sleepHours === 7 ? 'active' : ''}`}
                  onClick={() => setRecordForm(prev => ({ ...prev, sleepHours: 7 }))}
                >7h</button>
                <button 
                  className={`health-hour-btn ${recordForm.sleepHours === 8 ? 'active' : ''}`}
                  onClick={() => setRecordForm(prev => ({ ...prev, sleepHours: 8 }))}
                >8h</button>
                <button 
                  className={`health-hour-btn ${recordForm.sleepHours === 9 ? 'active' : ''}`}
                  onClick={() => setRecordForm(prev => ({ ...prev, sleepHours: 9 }))}
                >9h</button>
                <button 
                  className={`health-hour-btn ${recordForm.sleepHours === 10 ? 'active' : ''}`}
                  onClick={() => setRecordForm(prev => ({ ...prev, sleepHours: 10 }))}
                >10h</button>
              </div>
            </div>

            {/* 运动记录 */}
            <div className="health-exercise-section">
              <label className="health-exercise-label">
                <input
                  type="checkbox"
                  checked={recordForm.exercise}
                  onChange={e => setRecordForm(prev => ({ ...prev, exercise: e.target.checked }))}
                />
                <span className="health-exercise-icon">💪</span>
                <span>今天有运动</span>
              </label>
            </div>

            {/* 心情笔记 */}
            <textarea
              className="health-note-input"
              placeholder="写点什么吧...（可选）"
              value={recordForm.note}
              onChange={e => setRecordForm(prev => ({ ...prev, note: e.target.value }))}
              rows={3}
            />

            <div className="health-modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowRecordModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleRecord}>记录</button>
            </div>
          </div>
        </div>
      )}

      {/* FAB 按钮 */}
      <button className="health-fab-btn" onClick={() => setShowRecordModal(true)}>
        <span>+</span>
      </button>

      {isLoading && <div className="health-loading">加载中...</div>}
    </div>
  );
};

export default HealthManagement;