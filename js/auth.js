// Sistema de autenticação
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.setupAuthListeners();
    }

    setupAuthListeners() {
        // Escutar mudanças no estado de autenticação
        auth.onAuthStateChanged((user) => {
            if (user) {
                this.currentUser = user;
                this.loadUserData(user);
                this.showMainSystem();
            } else {
                this.currentUser = null;
                this.showLoginPage();
            }
        });
    }

    async loadUserData(user) {
        try {
            // Buscar dados do usuário no Firestore
            const userDoc = await db.collection('usuarios').doc(user.uid).get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                // Verificar se é admin baseado no email (fallback)
                const isAdminEmail = user.email === 'admin@estoque.com' || user.email === 'admin@alubras.com';
                const finalRole = isAdminEmail && !userData.role ? 'admin' : (userData.role || 'user');
                
                this.displayUserInfo({
                    nome: userData.nome || user.displayName || user.email,
                    role: finalRole,
                    email: user.email,
                    permissoes: userData.permissoes || { criar: isAdminEmail, editar: isAdminEmail, admin: isAdminEmail }
                });
            } else {
                // Criar usuário padrão se não existir
                await this.createDefaultUser(user);
                const isAdminEmail = user.email === 'admin@estoque.com' || user.email === 'admin@alubras.com';
                this.displayUserInfo({
                    nome: user.displayName || user.email,
                    role: isAdminEmail ? 'admin' : 'user',
                    email: user.email,
                    permissoes: { criar: isAdminEmail, editar: isAdminEmail, admin: isAdminEmail }
                });
            }
        } catch (error) {
            console.error('Erro ao carregar dados do usuário:', error);
            this.displayUserInfo({
                nome: user.displayName || user.email,
                role: 'user',
                email: user.email
            });
        }
    }

    async createDefaultUser(user) {
        try {
            // Verificar se é o primeiro usuário admin
            const isAdminEmail = user.email === 'admin@estoque.com' || user.email === 'admin@alubras.com';
            const userRole = isAdminEmail ? 'admin' : 'user';
            
            await db.collection('usuarios').doc(user.uid).set({
                nome: user.displayName || user.email,
                email: user.email,
                role: userRole,
                ativo: true,
                data_criacao: firebase.firestore.FieldValue.serverTimestamp(),
                permissoes: {
                    criar: isAdminEmail,
                    editar: isAdminEmail,
                    admin: isAdminEmail
                }
            });
        } catch (error) {
            console.error('Erro ao criar usuário padrão:', error);
        }
    }

    displayUserInfo(userData) {
        document.getElementById('userName').textContent = userData.nome;
        document.getElementById('userRole').textContent = userData.role.toUpperCase();
        window.currentUserData = userData;
    }

    // Método de login
    async login(email, password) {
        try {
            const result = await auth.signInWithEmailAndPassword(email, password);
            return result;
        } catch (error) {
            throw this.getErrorMessage(error.code);
        }
    }

    // Método de logout
    async logout() {
        try {
            await auth.signOut();
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        }
    }

    // Método de registro (para administradores)
    async register(email, password, userData) {
        try {
            const result = await auth.createUserWithEmailAndPassword(email, password);
            
            // Salvar dados adicionais do usuário
            await db.collection('usuarios').doc(result.user.uid).set({
                ...userData,
                email: email,
                data_criacao: firebase.firestore.FieldValue.serverTimestamp(),
                ativo: true
            });

            return result;
        } catch (error) {
            throw this.getErrorMessage(error.code);
        }
    }

    // Verificar permissões
    hasPermission(permission) {
        if (!this.currentUser || !window.currentUserData) {
            return false;
        }

        const userData = window.currentUserData;
        
        if (userData.role === 'admin') {
            return true;
        }

        return userData.permissoes && userData.permissoes[permission] === true;
    }

    // Verificar se é admin
    isAdmin() {
        return window.currentUserData && window.currentUserData.role === 'admin';
    }

    // Obter mensagens de erro em português
    getErrorMessage(errorCode) {
        const errorMessages = {
            'auth/user-not-found': 'Usuário não encontrado.',
            'auth/wrong-password': 'Senha incorreta.',
            'auth/invalid-email': 'Email inválido.',
            'auth/user-disabled': 'Usuário desabilitado.',
            'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
            'auth/weak-password': 'Senha muito fraca.',
            'auth/email-already-in-use': 'Este email já está em uso.',
            'auth/operation-not-allowed': 'Operação não permitida.',
            'auth/network-request-failed': 'Erro de conexão. Verifique sua internet.'
        };

        return errorMessages[errorCode] || 'Erro de autenticação. Tente novamente.';
    }

    // Mostrar página de login
    showLoginPage() {
        document.getElementById('loginPage').style.display = 'block';
        document.getElementById('mainSystem').style.display = 'none';
    }

    // Mostrar sistema principal
    showMainSystem() {
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('mainSystem').style.display = 'block';
        
        // Reinicializar aplicação se necessário
        if (window.app) {
            window.app.init();
        }
    }

    // Redefinir senha
    async resetPassword(email) {
        try {
            await auth.sendPasswordResetEmail(email);
            return true;
        } catch (error) {
            throw this.getErrorMessage(error.code);
        }
    }
}

// Inicializar gerenciador de autenticação
const authManager = new AuthManager();

// Event listeners para o formulário de login
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const logoutBtn = document.getElementById('logoutBtn');

    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                loginError.style.display = 'none';
                loginError.textContent = '';
                
                // Mostrar loading no botão
                const submitBtn = loginForm.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Entrando...';
                submitBtn.disabled = true;
                
                await authManager.login(email, password);
                
                // Reset do botão (não será executado se login falhar)
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                
            } catch (error) {
                loginError.textContent = error;
                loginError.style.display = 'block';
                
                // Reset do botão
                const submitBtn = loginForm.querySelector('button[type="submit"]');
                submitBtn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Entrar';
                submitBtn.disabled = false;
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function() {
            if (confirm('Tem certeza que deseja sair?')) {
                await authManager.logout();
            }
        });
    }
});

// Exportar para uso global
window.authManager = authManager;
