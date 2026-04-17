const TodoService = require('../services/todoService');
const ResponseUtil = require('../utils/response');

/**
 * 待办事项控制器
 * 处理用户待办事项相关的请求
 */
class TodoController {
    /**
     * 获取待办列表
     * GET /api/todos?completed=true/false
     */
    static async getTodos(ctx) {
        try {
            const { userId } = ctx.state.user;
            const { completed } = ctx.query;

            const todos = await TodoService.getTodos(userId, completed);
            ResponseUtil.success(ctx, todos, '获取待办列表成功');
        } catch (error) {
            console.error('获取待办列表失败:', error);
            ResponseUtil.error(ctx, '获取待办列表失败', 500);
        }
    }

    /**
     * 创建待办
     * POST /api/todos
     */
    static async createTodo(ctx) {
        try {
            const { userId } = ctx.state.user;
            const { title, description, due_date, priority } = ctx.request.body;

            if (!title) {
                ResponseUtil.badRequest(ctx, '待办标题不能为空');
                return;
            }

            const todo = await TodoService.createTodo(userId, { title, description, due_date, priority });
            ResponseUtil.success(ctx, todo, '创建待办成功');
        } catch (error) {
            console.error('创建待办失败:', error);
            ResponseUtil.error(ctx, '创建待办失败', 500);
        }
    }

    /**
     * 更新待办
     * PUT /api/todos/:id
     */
    static async updateTodo(ctx) {
        try {
            const { userId } = ctx.state.user;
            const { id } = ctx.params;
            const { title, description, due_date, priority, completed } = ctx.request.body;

            const updates = {};
            if (title !== undefined) updates.title = title;
            if (description !== undefined) updates.description = description;
            if (due_date !== undefined) updates.due_date = due_date;
            if (priority !== undefined) updates.priority = priority;
            if (completed !== undefined) updates.completed = completed;

            const todo = await TodoService.updateTodo(userId, id, updates);
            
            if (!todo) {
                ResponseUtil.notFound(ctx, '待办事项不存在');
                return;
            }

            ResponseUtil.success(ctx, todo, '更新待办成功');
        } catch (error) {
            console.error('更新待办失败:', error);
            ResponseUtil.error(ctx, '更新待办失败', 500);
        }
    }

    /**
     * 删除待办
     * DELETE /api/todos/:id
     */
    static async deleteTodo(ctx) {
        try {
            const { userId } = ctx.state.user;
            const { id } = ctx.params;

            const success = await TodoService.deleteTodo(userId, id);
            
            if (!success) {
                ResponseUtil.notFound(ctx, '待办事项不存在');
                return;
            }

            ResponseUtil.success(ctx, null, '删除待办成功');
        } catch (error) {
            console.error('删除待办失败:', error);
            ResponseUtil.error(ctx, '删除待办失败', 500);
        }
    }
}

module.exports = TodoController;
