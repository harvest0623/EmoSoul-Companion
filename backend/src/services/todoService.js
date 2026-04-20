const { query } = require('../config/database');

// 日常管理（待办事项）服务
class TodoService {
    async getTodos(userId, completed) {
        let sql = 'SELECT * FROM todos WHERE user_id = ?';
        const params = [userId];
        if (completed !== undefined) {
            sql += ' AND completed = ?';
            params.push(completed === 'true' || completed === true ? 1 : 0);
        }
        sql += ' ORDER BY completed ASC, priority DESC, created_at DESC';
        const rows = await query(sql, params);
        return rows;
    }

    async createTodo(userId, { title, description, due_date, priority }) {
        const result = await query(
            'INSERT INTO todos (user_id, title, description, due_date, priority) VALUES (?, ?, ?, ?, ?)',
            [userId, title, description || null, due_date || null, priority || 'medium']
        );
        return { id: result.insertId, title, description, due_date, priority: priority || 'medium', completed: false };
    }

    async updateTodo(userId, todoId, updates) {
        const fields = [];
        const values = [];
        if (updates.title !== undefined) { fields.push('title = ?'); values.push(updates.title); }
        if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description); }
        if (updates.due_date !== undefined) { fields.push('due_date = ?'); values.push(updates.due_date); }
        if (updates.priority !== undefined) { fields.push('priority = ?'); values.push(updates.priority); }
        if (updates.completed !== undefined) { fields.push('completed = ?'); values.push(updates.completed ? 1 : 0); }

        if (fields.length === 0) return null;

        values.push(todoId, userId);
        await query(`UPDATE todos SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`, values);

        const rows = await query('SELECT * FROM todos WHERE id = ? AND user_id = ?', [todoId, userId]);
        return rows[0];
    }

    async deleteTodo(userId, todoId) {
        const result = await query('DELETE FROM todos WHERE id = ? AND user_id = ?', [todoId, userId]);
        return result.affectedRows > 0;
    }
}

module.exports = new TodoService();
