// 骑手请假系统 - 管理员逻辑

class AdminManager {
    constructor() {
        this.currentAdmin = null;
        this.users = [];
        this.leaveRecords = [];
        this.init();
    }

    init() {
        this.checkAuth();
        this.bindEvents();
        this.loadData();
        this.updateDashboard();
        this.displayUserList();
        this.displayLeaveApprovalList();
        this.displayLeaveRecordsTable();
    }

    // 检查管理员认证状态
    checkAuth() {
        const session = this.getUserSession();
        if (!session || !session.user) {
            window.location.href = 'login.html';
            return;
        }

        this.currentAdmin = session.user;
        
        // 检查用户角色，如果不是管理员则跳转
        if (this.currentAdmin.role !== 'admin') {
            window.location.href = 'index.html';
            return;
        }

        // 更新管理员名称显示
        const adminName = document.getElementById('adminName');
        if (adminName) {
            adminName.textContent = this.currentAdmin.name;
        }
    }

    // 获取用户会话
    getUserSession() {
        const localSession = localStorage.getItem('userSession');
        const sessionSession = sessionStorage.getItem('userSession');
        
        if (localSession) {
            return JSON.parse(localSession);
        } else if (sessionSession) {
            return JSON.parse(sessionSession);
        }
        
        return null;
    }

    // 绑定事件
    bindEvents() {
        // 新增用户表单
        const addUserForm = document.getElementById('addUserForm');
        if (addUserForm) {
            addUserForm.addEventListener('submit', (e) => this.handleAddUser(e));
        }

        // 退出登录
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // 成功模态框关闭
        const closeSuccessModal = document.getElementById('closeSuccessModal');
        if (closeSuccessModal) {
            closeSuccessModal.addEventListener('click', () => this.hideSuccessModal());
        }

        // 删除确认模态框
        const cancelDelete = document.getElementById('cancelDelete');
        const confirmDelete = document.getElementById('confirmDelete');
        
        if (cancelDelete) {
            cancelDelete.addEventListener('click', () => this.hideDeleteModal());
        }
        
        if (confirmDelete) {
            confirmDelete.addEventListener('click', () => this.confirmDeleteUser());
        }
    }

    // 加载数据
    loadData() {
        this.loadUsers();
        this.loadLeaveRecords();
    }

    // 加载用户数据
    loadUsers() {
        try {
            this.users = JSON.parse(localStorage.getItem('users')) || this.getDefaultUsers();
        } catch (error) {
            console.error('加载用户数据失败:', error);
            this.users = this.getDefaultUsers();
        }
    }

    // 加载请假记录
    loadLeaveRecords() {
        try {
            this.leaveRecords = JSON.parse(localStorage.getItem('leaveRecords')) || [];
        } catch (error) {
            console.error('加载请假记录失败:', error);
            this.leaveRecords = [];
        }
    }

    // 获取默认用户数据
    getDefaultUsers() {
        const defaultUsers = [
            {
                username: 'admin',
                userId: 'A001',
                name: '系统管理员',
                department: '管理部',
                password: 'admin123',
                role: 'admin',
                annualLeave: 15,
                usedAnnualLeave: 0
            },
            {
                username: 'zhangsan',
                userId: 'R001',
                name: '张三',
                department: '配送部',
                password: '123456',
                role: 'user',
                annualLeave: 15,
                usedAnnualLeave: 2
            },
            {
                username: 'lisi',
                userId: 'R002',
                name: '李四',
                department: '配送部',
                password: '123456',
                role: 'user',
                annualLeave: 15,
                usedAnnualLeave: 5
            }
        ];

        localStorage.setItem('users', JSON.stringify(defaultUsers));
        return defaultUsers;
    }

    // 更新仪表板统计
    updateDashboard() {
        // 总用户数
        const totalUsers = document.getElementById('totalUsers');
        if (totalUsers) {
            totalUsers.textContent = this.users.filter(u => u.role === 'user').length;
        }

        // 请假统计
        const pendingLeaves = document.getElementById('pendingLeaves');
        const approvedLeaves = document.getElementById('approvedLeaves');
        const rejectedLeaves = document.getElementById('rejectedLeaves');

        if (pendingLeaves) {
            pendingLeaves.textContent = this.leaveRecords.filter(r => r.status === 'pending').length;
        }
        
        if (approvedLeaves) {
            approvedLeaves.textContent = this.leaveRecords.filter(r => r.status === 'approved').length;
        }
        
        if (rejectedLeaves) {
            rejectedLeaves.textContent = this.leaveRecords.filter(r => r.status === 'rejected').length;
        }
    }

    // 显示用户列表
    displayUserList() {
        const userList = document.getElementById('userList');
        if (!userList) return;

        const usersHTML = this.users
            .filter(user => user.role === 'user')
            .map(user => this.createUserListItemHTML(user))
            .join('');

        userList.innerHTML = usersHTML;

        // 绑定删除按钮事件
        this.bindDeleteUserEvents();
    }

    // 创建用户列表项HTML
    createUserListItemHTML(user) {
        return `
            <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg" data-user-id="${user.userId}">
                <div>
                    <p class="font-medium text-gray-900">${user.name}</p>
                    <p class="text-sm text-gray-600">工号: ${user.userId} | 部门: ${user.department}</p>
                    <p class="text-sm text-gray-500">年假: ${user.usedAnnualLeave}/${user.annualLeave}天</p>
                </div>
                <button class="delete-user-btn bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors" data-user-id="${user.userId}">
                    删除
                </button>
            </div>
        `;
    }

    // 绑定删除用户事件
    bindDeleteUserEvents() {
        const deleteButtons = document.querySelectorAll('.delete-user-btn');
        deleteButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const userId = e.target.dataset.userId;
                this.showDeleteModal(userId);
            });
        });
    }

    // 显示删除确认模态框
    showDeleteModal(userId) {
        const modal = document.getElementById('deleteModal');
        if (modal) {
            modal.dataset.userId = userId;
            modal.classList.remove('hidden');
        }
    }

    // 隐藏删除确认模态框
    hideDeleteModal() {
        const modal = document.getElementById('deleteModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    // 确认删除用户
    confirmDeleteUser() {
        const modal = document.getElementById('deleteModal');
        const userId = modal.dataset.userId;
        
        try {
            // 从用户列表中删除
            this.users = this.users.filter(u => u.userId !== userId);
            localStorage.setItem('users', JSON.stringify(this.users));
            
            // 从请假记录中删除该用户的记录
            this.leaveRecords = this.leaveRecords.filter(r => r.userId !== userId);
            localStorage.setItem('leaveRecords', JSON.stringify(this.leaveRecords));
            
            // 更新显示
            this.displayUserList();
            this.updateDashboard();
            this.displayLeaveApprovalList();
            this.displayLeaveRecordsTable();
            
            // 隐藏模态框
            this.hideDeleteModal();
            
            // 显示成功提示
            this.showSuccessModal('删除用户成功', '用户已成功删除');
            
        } catch (error) {
            console.error('删除用户失败:', error);
            alert('删除失败，请稍后重试');
        }
    }

    // 显示请假审批列表
    displayLeaveApprovalList() {
        const approvalList = document.getElementById('leaveApprovalList');
        if (!approvalList) return;

        const pendingLeaves = this.leaveRecords.filter(r => r.status === 'pending');
        
        if (pendingLeaves.length === 0) {
            approvalList.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <p>暂无待审批的请假申请</p>
                </div>
            `;
            return;
        }

        const approvalHTML = pendingLeaves.map(leave => this.createApprovalItemHTML(leave)).join('');
        approvalList.innerHTML = approvalHTML;

        // 绑定审批按钮事件
        this.bindApprovalEvents();
    }

    // 创建审批项HTML
    createApprovalItemHTML(leave) {
        const startDate = new Date(leave.startDate).toLocaleDateString('zh-CN');
        const applyDate = new Date(leave.applyTime).toLocaleDateString('zh-CN');

        return `
            <div class="border border-gray-200 rounded-lg p-4" data-leave-id="${leave.id}">
                <div class="flex justify-between items-start mb-3">
                    <div>
                        <h4 class="font-medium text-gray-900">${leave.userName} - ${leave.leaveType}</h4>
                        <p class="text-sm text-gray-600">${startDate} (${leave.leaveDays}天)</p>
                        <p class="text-sm text-gray-500">部门: ${leave.userDept}</p>
                    </div>
                    <span class="status-pending">待审批</span>
                </div>
                <p class="text-gray-700 mb-3">${leave.leaveReason}</p>
                <p class="text-sm text-gray-500 mb-3">申请时间: ${applyDate}</p>
                <div class="flex space-x-2">
                    <button class="approve-btn bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm transition-colors" data-leave-id="${leave.id}">
                        通过
                    </button>
                    <button class="reject-btn bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm transition-colors" data-leave-id="${leave.id}">
                        拒绝
                    </button>
                </div>
            </div>
        `;
    }

    // 绑定审批事件
    bindApprovalEvents() {
        const approveButtons = document.querySelectorAll('.approve-btn');
        const rejectButtons = document.querySelectorAll('.reject-btn');

        approveButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const leaveId = e.target.dataset.leaveId;
                this.approveLeave(leaveId);
            });
        });

        rejectButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const leaveId = e.target.dataset.leaveId;
                this.rejectLeave(leaveId);
            });
        });
    }

    // 审批通过
    approveLeave(leaveId) {
        const leave = this.leaveRecords.find(r => r.id === leaveId);
        if (!leave) return;

        leave.status = 'approved';
        leave.approvalTime = new Date().toISOString();
        leave.approver = this.currentAdmin.name;
        leave.approvalComment = '审批通过';

        this.saveLeaveRecords();
        this.updateDashboard();
        this.displayLeaveApprovalList();
        this.displayLeaveRecordsTable();

        this.showSuccessModal('审批成功', '请假申请已通过');
    }

    // 审批拒绝
    rejectLeave(leaveId) {
        const leave = this.leaveRecords.find(r => r.id === leaveId);
        if (!leave) return;

        const comment = prompt('请输入拒绝原因:');
        if (comment === null) return; // 用户取消

        leave.status = 'rejected';
        leave.approvalTime = new Date().toISOString();
        leave.approver = this.currentAdmin.name;
        leave.approvalComment = comment || '审批拒绝';

        this.saveLeaveRecords();
        this.updateDashboard();
        this.displayLeaveApprovalList();
        this.displayLeaveRecordsTable();

        this.showSuccessModal('审批完成', '请假申请已拒绝');
    }

    // 显示请假记录表格
    displayLeaveRecordsTable() {
        const tableBody = document.getElementById('leaveRecordsTable');
        if (!tableBody) return;

        const recordsHTML = this.leaveRecords
            .sort((a, b) => new Date(b.applyTime) - new Date(a.applyTime))
            .map(record => this.createLeaveRecordRowHTML(record))
            .join('');

        tableBody.innerHTML = recordsHTML;
    }

    // 创建请假记录行HTML
    createLeaveRecordRowHTML(record) {
        const statusClass = this.getStatusClass(record.status);
        const statusText = this.getStatusText(record.status);
        const applyDate = new Date(record.applyTime).toLocaleDateString('zh-CN');
        const startDate = new Date(record.startDate).toLocaleDateString('zh-CN');

        return `
            <tr class="hover:bg-gray-50">
                <td class="table-cell">${record.userName}</td>
                <td class="table-cell">${record.leaveType}</td>
                <td class="table-cell">${record.leaveDays}天</td>
                <td class="table-cell">${startDate}</td>
                <td class="table-cell"><span class="${statusClass}">${statusText}</span></td>
                <td class="table-cell">${applyDate}</td>
            </tr>
        `;
    }

    // 获取状态样式类
    getStatusClass(status) {
        const statusMap = {
            'pending': 'status-pending',
            'approved': 'status-approved',
            'rejected': 'status-rejected',
            'cancelled': 'status-cancelled'
        };
        return statusMap[status] || 'status-pending';
    }

    // 获取状态文本
    getStatusText(status) {
        const statusMap = {
            'pending': '待审批',
            'approved': '已通过',
            'rejected': '已拒绝',
            'cancelled': '已取消'
        };
        return statusMap[status] || '待审批';
    }

    // 处理新增用户
    async handleAddUser(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const userData = {
            username: formData.get('newUserName') || document.getElementById('newUserName').value,
            userId: formData.get('newUserId') || document.getElementById('newUserId').value,
            department: formData.get('newUserDept') || document.getElementById('newUserDept').value,
            password: formData.get('newUserPassword') || document.getElementById('newUserPassword').value
        };

        // 验证数据
        if (!this.validateUserData(userData)) {
            return;
        }

        // 检查用户ID是否已存在
        if (this.users.find(u => u.userId === userData.userId)) {
            alert('工号已存在，请使用其他工号');
            return;
        }

        // 检查用户名是否已存在
        if (this.users.find(u => u.username === userData.username)) {
            alert('用户名已存在，请使用其他用户名');
            return;
        }

        // 创建新用户
        const newUser = {
            ...userData,
            name: userData.username, // 默认使用用户名作为姓名
            role: 'user',
            annualLeave: 15,
            usedAnnualLeave: 0
        };

        try {
            // 保存用户
            this.users.push(newUser);
            localStorage.setItem('users', JSON.stringify(this.users));
            
            // 更新显示
            this.displayUserList();
            this.updateDashboard();
            
            // 重置表单
            e.target.reset();
            
            // 显示成功提示
            this.showSuccessModal('新增用户成功', '用户已成功创建');
            
        } catch (error) {
            console.error('新增用户失败:', error);
            alert('新增失败，请稍后重试');
        }
    }

    // 验证用户数据
    validateUserData(data) {
        if (!data.username || data.username.trim().length < 2) {
            alert('用户名至少需要2个字符');
            return false;
        }
        
        if (!data.userId || data.userId.trim().length < 2) {
            alert('工号至少需要2个字符');
            return false;
        }
        
        if (!data.department || data.department.trim().length < 2) {
            alert('部门至少需要2个字符');
            return false;
        }
        
        if (!data.password || data.password.length < 6) {
            alert('密码至少需要6个字符');
            return false;
        }
        
        return true;
    }

    // 保存请假记录
    saveLeaveRecords() {
        try {
            localStorage.setItem('leaveRecords', JSON.stringify(this.leaveRecords));
        } catch (error) {
            console.error('保存请假记录失败:', error);
            throw error;
        }
    }

    // 显示成功模态框
    showSuccessModal(title, message) {
        const modal = document.getElementById('successModal');
        const titleElement = document.getElementById('successModalTitle');
        const messageElement = document.getElementById('successModalMessage');
        
        if (modal && titleElement && messageElement) {
            titleElement.textContent = title;
            messageElement.textContent = message;
            modal.classList.remove('hidden');
        }
    }

    // 隐藏成功模态框
    hideSuccessModal() {
        const modal = document.getElementById('successModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    // 处理退出登录
    handleLogout() {
        if (confirm('确定要退出登录吗？')) {
            // 清除会话
            localStorage.removeItem('userSession');
            sessionStorage.removeItem('userSession');
            
            // 跳转到登录页
            window.location.href = 'login.html';
        }
    }

    // 工具方法：生成唯一ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // 工具方法：格式化日期
    formatDate(date) {
        return new Date(date).toLocaleDateString('zh-CN');
    }
}

// 页面加载完成后初始化管理员管理器
document.addEventListener('DOMContentLoaded', () => {
    new AdminManager();
});

// 导出类供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminManager;
}
