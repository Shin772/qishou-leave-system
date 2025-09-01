// 骑手请假系统 - 登录逻辑

class LoginManager {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkRememberMe();
        this.setMinDate();
    }

    bindEvents() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // 记住我功能
        const rememberMe = document.getElementById('rememberMe');
        if (rememberMe) {
            rememberMe.addEventListener('change', (e) => this.handleRememberMe(e));
        }
    }

    // 设置开始日期最小值为今天
    setMinDate() {
        const today = new Date().toISOString().split('T')[0];
        const startDateInput = document.getElementById('startDate');
        if (startDateInput) {
            startDateInput.min = today;
        }
    }

    // 处理登录表单提交
    async handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        const rememberMe = document.getElementById('rememberMe').checked;

        // 验证输入
        if (!username || !password) {
            this.showError('请输入用户名和密码');
            return;
        }

        // 显示加载状态
        this.showLoading(true);
        this.hideError();

        try {
            // 模拟API调用延迟
            await this.simulateApiCall();
            
            // 验证用户凭据
            const user = await this.validateCredentials(username, password);
            
            if (user) {
                // 保存用户信息到localStorage
                this.saveUserSession(user, rememberMe);
                
                // 根据用户角色跳转
                this.redirectUser(user);
            } else {
                this.showError('用户名或密码错误');
            }
        } catch (error) {
            console.error('登录错误:', error);
            this.showError('登录失败，请稍后重试');
        } finally {
            this.showLoading(false);
        }
    }

    // 模拟API调用
    simulateApiCall() {
        return new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 验证用户凭据
    async validateCredentials(username, password) {
        try {
            // 从本地存储获取用户数据
            const users = JSON.parse(localStorage.getItem('users')) || this.getDefaultUsers();
            
            // 查找匹配的用户
            const user = users.find(u => 
                (u.username === username || u.userId === username) && 
                u.password === password
            );

            if (user) {
                // 返回用户信息（不包含密码）
                const { password: _, ...userInfo } = user;
                return userInfo;
            }
            
            return null;
        } catch (error) {
            console.error('验证凭据错误:', error);
            return null;
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

        // 保存到localStorage
        localStorage.setItem('users', JSON.stringify(defaultUsers));
        return defaultUsers;
    }

    // 保存用户会话
    saveUserSession(user, rememberMe) {
        const sessionData = {
            user: user,
            loginTime: new Date().toISOString(),
            rememberMe: rememberMe
        };

        if (rememberMe) {
            localStorage.setItem('userSession', JSON.stringify(sessionData));
        } else {
            sessionStorage.setItem('userSession', JSON.stringify(sessionData));
        }
    }

    // 检查记住我功能
    checkRememberMe() {
        const rememberedSession = localStorage.getItem('userSession');
        if (rememberedSession) {
            try {
                const session = JSON.parse(rememberedSession);
                document.getElementById('username').value = session.user.username || session.user.userId;
                document.getElementById('rememberMe').checked = true;
            } catch (error) {
                console.error('解析记住的会话失败:', error);
                localStorage.removeItem('userSession');
            }
        }
    }

    // 处理记住我复选框变化
    handleRememberMe(e) {
        if (!e.target.checked) {
            localStorage.removeItem('userSession');
        }
    }

    // 根据用户角色跳转
    redirectUser(user) {
        if (user.role === 'admin') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'index.html';
        }
    }

    // 显示错误信息
    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        const errorText = document.getElementById('errorText');
        
        if (errorDiv && errorText) {
            errorText.textContent = message;
            errorDiv.classList.remove('hidden');
            
            // 自动隐藏错误信息
            setTimeout(() => {
                this.hideError();
            }, 5000);
        }
    }

    // 隐藏错误信息
    hideError() {
        const errorDiv = document.getElementById('errorMessage');
        if (errorDiv) {
            errorDiv.classList.add('hidden');
        }
    }

    // 显示/隐藏加载状态
    showLoading(show) {
        const loadingSpinner = document.getElementById('loadingSpinner');
        const loginForm = document.getElementById('loginForm');
        
        if (loadingSpinner && loginForm) {
            if (show) {
                loadingSpinner.classList.remove('hidden');
                loginForm.style.opacity = '0.6';
                loginForm.style.pointerEvents = 'none';
            } else {
                loadingSpinner.classList.add('hidden');
                loginForm.style.opacity = '1';
                loginForm.style.pointerEvents = 'auto';
            }
        }
    }

    // 工具方法：格式化日期
    formatDate(date) {
        return new Date(date).toLocaleDateString('zh-CN');
    }

    // 工具方法：生成唯一ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}

// 页面加载完成后初始化登录管理器
document.addEventListener('DOMContentLoaded', () => {
    new LoginManager();
});

// 导出类供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoginManager;
}
