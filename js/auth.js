// Sistema de Autenticação para Sistema de Qualidade
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.userData = null;
        this.listeners = [];
    }

    // Inicializar sistema de autenticação
    async init() {
        try {
            // Aguardar Firebase estar disponível
            while (!window.auth) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Escutar mudanças no estado de autenticação
            onAuthStateChanged(window.auth, (user) => {
                this.currentUser = user;
                if (user) {
                    this.loadUserData(user.uid);
                } else {
                    this.userData = null;
                    this.showLoginForm();
                }
                this.notifyListeners();
            });

        } catch (error) {
            console.error('Erro ao inicializar autenticação:', error);
            Utils.showMessage('Erro ao inicializar sistema de autenticação', 'error');
        }
    }

    // Carregar dados do usuário
    async loadUserData(uid) {
        try {
            const userDoc = await getDoc(doc(window.db, 'usuarios', uid));
            if (userDoc.exists()) {
                this.userData = userDoc.data();
                this.updateUserInterface();
            } else {
                // Criar dados básicos do usuário
                this.userData = {
                    nome: this.currentUser.displayName || this.currentUser.email,
                    email: this.currentUser.email,
                    role: 'inspetor',
                    ativo: true,
                    data_criacao: new Date()
                };
                await this.createUserProfile();
            }
        } catch (error) {
            console.error('Erro ao carregar dados do usuário:', error);
        }
    }

    // Criar perfil do usuário
    async createUserProfile() {
        try {
            await setDoc(doc(window.db, 'usuarios', this.currentUser.uid), {
                ...this.userData,
                data_criacao: new Date()
            });
        } catch (error) {
            console.error('Erro ao criar perfil do usuário:', error);
        }
    }

    // Fazer login
    async login(email, password) {
        try {
            Utils.showLoading();
            const userCredential = await signInWithEmailAndPassword(window.auth, email, password);
            Utils.showMessage('Login realizado com sucesso!', 'success');
            return userCredential.user;
        } catch (error) {
            console.error('Erro no login:', error);
            let errorMessage = 'Erro ao fazer login';
            
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'Usuário não encontrado';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Senha incorreta';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Email inválido';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Muitas tentativas. Tente novamente mais tarde';
                    break;
            }
            
            Utils.showMessage(errorMessage, 'error');
            throw error;
        } finally {
            Utils.hideLoading();
        }
    }

    // Fazer logout
    async logout() {
        try {
            await signOut(window.auth);
            Utils.showMessage('Logout realizado com sucesso!', 'success');
        } catch (error) {
            console.error('Erro no logout:', error);
            Utils.showMessage('Erro ao fazer logout', 'error');
        }
    }

    // Verificar se usuário está logado
    isLoggedIn() {
        return this.currentUser !== null;
    }

    // Verificar permissões
    hasPermission(permission) {
        if (!this.userData) return false;
        
        const permissions = {
            'admin': ['criar', 'editar', 'excluir', 'visualizar', 'relatorios'],
            'inspetor_chefe': ['criar', 'editar', 'visualizar', 'relatorios'],
            'inspetor': ['criar', 'visualizar']
        };

        const userPermissions = permissions[this.userData.role] || permissions['inspetor'];
        return userPermissions.includes(permission);
    }

    // Verificar se é admin
    isAdmin() {
        return this.userData && this.userData.role === 'admin';
    }

    // Verificar se é inspetor chefe
    isInspetorChefe() {
        return this.userData && this.userData.role === 'inspetor_chefe';
    }

    // Mostrar formulário de login
    showLoginForm() {
        const content = `
            <div class="login-container">
                <div class="login-card">
                    <div class="logo-container">
                        <div class="logo-text">Sistema de Qualidade</div>
                        <div class="logo-subtitle">Alubras</div>
                        <div class="logo-line"></div>
                    </div>
                    
                    <form id="loginForm">
                        <div class="mb-3">
                            <label for="email" class="form-label">Email</label>
                            <input type="email" class="form-control" id="email" required>
                        </div>
                        <div class="mb-3">
                            <label for="password" class="form-label">Senha</label>
                            <input type="password" class="form-control" id="password" required>
                        </div>
                        <button type="submit" class="btn btn-primary w-100">
                            <i class="fas fa-sign-in-alt me-2"></i>
                            Entrar
                        </button>
                    </form>
                    
                    <div class="login-footer">
                        <small class="text-muted">
                            Sistema de Controle de Qualidade e Retrabalho
                        </small>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('pageContent').innerHTML = content;
        document.getElementById('pageTitle').textContent = 'Login';
        
        // Configurar evento de login
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                await this.login(email, password);
            } catch (error) {
                // Erro já tratado no método login
            }
        });
    }

    // Atualizar interface do usuário
    updateUserInterface() {
        if (this.userData) {
            document.getElementById('userName').textContent = this.userData.nome;
            document.getElementById('userRole').textContent = this.getRoleDisplayName(this.userData.role);
        }
    }

    // Obter nome de exibição da role
    getRoleDisplayName(role) {
        const roles = {
            'admin': 'Administrador',
            'inspetor_chefe': 'Inspetor Chefe',
            'inspetor': 'Inspetor'
        };
        return roles[role] || 'Usuário';
    }

    // Adicionar listener para mudanças de autenticação
    addAuthListener(callback) {
        this.listeners.push(callback);
    }

    // Remover listener
    removeAuthListener(callback) {
        const index = this.listeners.indexOf(callback);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }

    // Notificar listeners
    notifyListeners() {
        this.listeners.forEach(callback => {
            try {
                callback(this.currentUser, this.userData);
            } catch (error) {
                console.error('Erro em listener de autenticação:', error);
            }
        });
    }

    // Obter dados do usuário atual
    getCurrentUser() {
        return {
            user: this.currentUser,
            data: this.userData
        };
    }

    // Verificar se pode editar inspeção
    canEditInspecao(inspecao) {
        if (!this.userData) return false;
        
        // Admin pode editar qualquer inspeção
        if (this.isAdmin()) return true;
        
        // Inspetor chefe pode editar inspeções de outros inspetores
        if (this.isInspetorChefe()) return true;
        
        // Inspetor só pode editar suas próprias inspeções
        return inspecao.inspetor_id === this.currentUser.uid;
    }

    // Verificar se pode excluir inspeção
    canDeleteInspecao(inspecao) {
        if (!this.userData) return false;
        
        // Apenas admin e inspetor chefe podem excluir
        return this.isAdmin() || this.isInspetorChefe();
    }

    // Verificar se pode editar retrabalho
    canEditRetrabalho(retrabalho) {
        if (!this.userData) return false;
        
        // Admin pode editar qualquer retrabalho
        if (this.isAdmin()) return true;
        
        // Inspetor chefe pode editar qualquer retrabalho
        if (this.isInspetorChefe()) return true;
        
        // Inspetor comum só pode editar seus próprios retrabalhos
        if (this.userData.role === 'inspetor') {
            return retrabalho.responsavel_id === this.currentUser.uid;
        }
        
        return false;
    }

    // Verificar se pode excluir retrabalho
    canDeleteRetrabalho(retrabalho) {
        if (!this.userData) return false;
        
        // Admin pode excluir qualquer retrabalho
        if (this.isAdmin()) return true;
        
        // Inspetor chefe pode excluir qualquer retrabalho
        if (this.isInspetorChefe()) return true;
        
        // Inspetor comum só pode excluir seus próprios retrabalhos
        if (this.userData.role === 'inspetor') {
            return retrabalho.responsavel_id === this.currentUser.uid;
        }
        
        return false;
    }
}

// Instanciar e tornar disponível globalmente
const authManager = new AuthManager();
window.authManager = authManager;

// Função global para logout
window.logout = () => authManager.logout();
