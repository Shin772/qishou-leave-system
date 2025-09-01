// 骑手请假系统 - 用户首页逻辑

class UserHomeManager {
    constructor() {
        this.currentUser = null;
        this.leaveRecords = [];
        this.init();
    }

    init() {
        this.checkAuth();
        this.bindEvents();
        this.loadUserInfo();
        this.loadLeaveRecords();
        this.updatePersonalCenter();
    }

    // 检查用户认证状态
    checkAuth() {
        const session = this.getUserSession();
        if (!session || !session.user) {
            window.location.href = 'login.html';
            return;
        }

        this.currentUser = session.user;
        
        // 检查用户角色，如果不是普通用户则跳转
        if (this.currentUser.role === 'admin') {
            window.location.href = 'admin.html';
            return;
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
        // 请假表单提交
        const leaveForm = document.getElementById('leaveForm');
        if (leaveForm) {
            leaveForm.addEventListener('submit', (e) => this.handleLeaveSubmit(e));
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

        // 日期交互功能
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');
        const leaveDaysInput = document.getElementById('leaveDays');
        
        if (startDateInput) {
            const today = new Date().toISOString().split('T')[0];
            startDateInput.min = today;
            startDateInput.addEventListener('change', () => this.handleDateChange());
        }
        
        if (endDateInput) {
            endDateInput.addEventListener('change', () => this.handleDateChange());
        }
        
        if (leaveDaysInput) {
            leaveDaysInput.addEventListener('input', () => this.handleDaysChange());
        }
    }

    // 加载用户信息
    loadUserInfo() {
        if (this.currentUser) {
            const userName = document.getElementById('userName');
            if (userName) {
                userName.textContent = `欢迎，${this.currentUser.name}`;
            }
        }
    }

    // 加载请假记录
    loadLeaveRecords() {
        try {
            const records = JSON.parse(localStorage.getItem('leaveRecords')) || [];
            this.leaveRecords = records.filter(record => 
                record.userId === this.currentUser.userId
            );
            this.displayLeaveRecords();
        } catch (error) {
            console.error('加载请假记录失败:', error);
            this.leaveRecords = [];
        }
    }

    // 显示请假记录
    displayLeaveRecords() {
        const recordsContainer = document.getElementById('leaveRecords');
        if (!recordsContainer) return;

        if (this.leaveRecords.length === 0) {
            recordsContainer.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                    </svg>
                    <p>暂无请假记录</p>
                </div>
            `;
            return;
        }

        const recordsHTML = this.leaveRecords
            .sort((a, b) => new Date(b.applyTime) - new Date(a.applyTime))
            .map(record => this.createLeaveRecordHTML(record))
            .join('');

        recordsContainer.innerHTML = recordsHTML;
    }

    // 创建请假记录HTML
    createLeaveRecordHTML(record) {
        const statusClass = this.getStatusClass(record.status);
        const statusText = this.getStatusText(record.status);
        const applyDate = new Date(record.applyTime).toLocaleDateString('zh-CN');
        const startDate = new Date(record.startDate).toLocaleDateString('zh-CN');

        return `
            <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div class="flex justify-between items-start mb-3">
                    <div>
                        <h4 class="font-medium text-gray-900">${record.leaveType}</h4>
                        <p class="text-sm text-gray-600">${startDate} (${record.leaveDays}天)</p>
                    </div>
                    <span class="${statusClass}">${statusText}</span>
                </div>
                <p class="text-gray-700 mb-3">${record.leaveReason}</p>
                <div class="flex justify-between items-center text-sm text-gray-500">
                    <span>申请时间: ${applyDate}</span>
                    ${record.approvalTime ? `<span>审批时间: ${new Date(record.approvalTime).toLocaleDateString('zh-CN')}</span>` : ''}
                </div>
                ${record.approvalComment ? `<p class="text-sm text-gray-600 mt-2">审批意见: ${record.approvalComment}</p>` : ''}
            </div>
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

    // 处理请假申请提交
    async handleLeaveSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const leaveData = {
            leaveType: formData.get('leaveType') || document.getElementById('leaveType').value,
            leaveDays: parseFloat(formData.get('leaveDays') || document.getElementById('leaveDays').value),
            startDate: formData.get('startDate') || document.getElementById('startDate').value,
            endDate: formData.get('endDate') || document.getElementById('endDate').value,
            leaveReason: formData.get('leaveReason') || document.getElementById('leaveReason').value
        };

        // 验证数据
        if (!this.validateLeaveData(leaveData)) {
            return;
        }

        // 创建请假记录
        const leaveRecord = {
            id: this.generateId(),
            userId: this.currentUser.userId,
            userName: this.currentUser.name,
            userDept: this.currentUser.department,
            ...leaveData,
            status: 'pending',
            applyTime: new Date().toISOString(),
            approvalTime: null,
            approvalComment: null,
            approver: null
        };

        try {
            // 保存请假记录
            this.saveLeaveRecord(leaveRecord);
            
            // 更新显示
            this.leaveRecords.unshift(leaveRecord);
            this.displayLeaveRecords();
            this.updatePersonalCenter();
            
            // 重置表单
            e.target.reset();
            
            // 显示成功提示
            this.showSuccessModal();
            
        } catch (error) {
            console.error('提交请假申请失败:', error);
            alert('提交失败，请稍后重试');
        }
    }

    // 验证请假数据
    validateLeaveData(data) {
        if (!data.leaveType) {
            alert('请选择请假类型');
            return false;
        }
        
        if (!data.leaveDays || data.leaveDays <= 0) {
            alert('请输入有效的请假天数');
            return false;
        }
        
        if (!data.startDate) {
            alert('请选择开始日期');
            return false;
        }
        
        if (!data.endDate) {
            alert('请选择结束日期');
            return false;
        }
        
        // 验证日期有效性
        const startDate = new Date(data.startDate);
        const endDate = new Date(data.endDate);
        if (endDate < startDate) {
            alert('结束日期不能早于开始日期');
            return false;
        }
        
        if (!data.leaveReason || data.leaveReason.trim().length < 10) {
            alert('请假原因至少需要10个字符');
            return false;
        }
        
        // 检查开始日期是否为今天或之后
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (startDate < today) {
            alert('开始日期不能早于今天');
            return false;
        }
        
        return true;
    }

    // 保存请假记录
    saveLeaveRecord(record) {
        try {
            const allRecords = JSON.parse(localStorage.getItem('leaveRecords')) || [];
            allRecords.push(record);
            localStorage.setItem('leaveRecords', JSON.stringify(allRecords));
        } catch (error) {
            console.error('保存请假记录失败:', error);
            throw error;
        }
    }

    // 更新个人中心
    updatePersonalCenter() {
        if (!this.currentUser) return;

        // 基本信息
        const userNameDisplay = document.getElementById('userNameDisplay');
        const userIdDisplay = document.getElementById('userIdDisplay');
        const userDeptDisplay = document.getElementById('userDeptDisplay');

        if (userNameDisplay) userNameDisplay.textContent = this.currentUser.name;
        if (userIdDisplay) userIdDisplay.textContent = this.currentUser.userId;
        if (userDeptDisplay) userDeptDisplay.textContent = this.currentUser.department;

        // 请假统计
        this.updateLeaveStatistics();
    }

    // 更新请假统计
    updateLeaveStatistics() {
        const usedAnnualLeave = document.getElementById('usedAnnualLeave');
        const remainingAnnualLeave = document.getElementById('remainingAnnualLeave');
        const monthlyLeaveCount = document.getElementById('monthlyLeaveCount');

        if (this.currentUser) {
            // 年假统计
            if (usedAnnualLeave) usedAnnualLeave.textContent = `${this.currentUser.usedAnnualLeave}天`;
            if (remainingAnnualLeave) remainingAnnualLeave.textContent = `${this.currentUser.annualLeave - this.currentUser.usedAnnualLeave}天`;

            // 本月请假次数
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            const monthlyCount = this.leaveRecords.filter(record => {
                const recordDate = new Date(record.applyTime);
                return recordDate.getMonth() === currentMonth && 
                       recordDate.getFullYear() === currentYear;
            }).length;

            if (monthlyLeaveCount) monthlyLeaveCount.textContent = `${monthlyCount}次`;
        }
    }

    // 显示成功模态框
    showSuccessModal() {
        const modal = document.getElementById('successModal');
        if (modal) {
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

    // 处理日期变化
    handleDateChange() {
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');
        const leaveDaysInput = document.getElementById('leaveDays');
        const dateInfoSpan = document.getElementById('dateInfo');
        
        if (!startDateInput || !endDateInput || !leaveDaysInput) return;
        
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;
        
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            
            // 验证日期有效性
            if (end < start) {
                endDateInput.value = '';
                dateInfoSpan.textContent = '结束日期不能早于开始日期';
                dateInfoSpan.className = 'text-sm text-red-600';
                leaveDaysInput.value = '';
                return;
            }
            
            // 计算请假天数（包含开始和结束日期）
            const timeDiff = end.getTime() - start.getTime();
            const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
            
            leaveDaysInput.value = daysDiff;
            dateInfoSpan.textContent = `请假时间：${this.formatDate(start)} 至 ${this.formatDate(end)}，共 ${daysDiff} 天`;
            dateInfoSpan.className = 'text-sm text-green-600';
            
            // 设置结束日期最小值为开始日期
            endDateInput.min = startDate;
        } else {
            dateInfoSpan.textContent = '请选择开始和结束日期，系统将自动计算请假天数';
            dateInfoSpan.className = 'text-sm text-gray-600';
        }
    }
    
    // 处理请假天数变化
    handleDaysChange() {
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');
        const leaveDaysInput = document.getElementById('leaveDays');
        const dateInfoSpan = document.getElementById('dateInfo');
        
        if (!startDateInput || !endDateInput || !leaveDaysInput) return;
        
        const startDate = startDateInput.value;
        const days = parseFloat(leaveDaysInput.value);
        
        if (startDate && days && days > 0) {
            const start = new Date(startDate);
            const end = new Date(start);
            end.setDate(start.getDate() + days - 1);
            
            endDateInput.value = end.toISOString().split('T')[0];
            dateInfoSpan.textContent = `请假时间：${this.formatDate(start)} 至 ${this.formatDate(end)}，共 ${days} 天`;
            dateInfoSpan.className = 'text-sm text-green-600';
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

// 页面加载完成后初始化用户首页管理器
document.addEventListener('DOMContentLoaded', () => {
    new UserHomeManager();
});

// 导出类供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserHomeManager;
}
