// Página de Usuários
class UsuariosPage {
    constructor() {
        this.usuarios = [];
        this.currentFilters = {};
        this.listeners = [];
    }

    async load(params = {}) {
        try {
            this.showLoading();
            
            // Verificar se deve criar novo usuário
            if (params.action === 'create') {
                this.showUsuarioModal();
                return;
            }

            // Carregar usuários
            await this.loadUsuarios();
            
            // Renderizar página
            this.render();
            
            // Configurar listeners para atualizações em tempo real
            this.setupRealtimeListeners();
            
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
            Utils.showMessage('Erro ao carregar usuários', 'error');
        }
    }

    showLoading() {
        document.getElementById('pageContent').innerHTML = `
            <div class="loading">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Carregando usuários...</span>
                </div>
            </div>
        `;
    }

    async loadUsuarios() {
        try {
            this.usuarios = await databaseManager.getUsuarios();
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
            throw error;
        }
    }

    render() {
        // Verificar permissão de admin
        if (!authManager.isAdmin()) {
            document.getElementById('pageContent').innerHTML = `
                <div class="alert alert-danger" role="alert">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Você não tem permissão para acessar esta página.
                </div>
            `;
            document.getElementById('pageTitle').textContent = 'Usuários';
            return;
        }

        const content = `
            <div class="row mb-3">
                <div class="col-md-6">
                    <div class="input-group">
                        <input type="text" class="form-control" id="searchUsuarios" 
                               placeholder="Pesquisar por nome ou email...">
                        <button class="btn btn-outline-secondary" type="button" id="clearSearchUsuarios">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <div class="col-md-6 text-end">
                    <button class="btn btn-primary" onclick="usuariosPage.showUsuarioModal()">
                        <i class="fas fa-plus me-2"></i>Novo Usuário
                    </button>
                </div>
            </div>

            <div class="card shadow">
                <div class="card-header py-3">
                    <h6 class="m-0 font-weight-bold text-primary">Lista de Usuários</h6>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive" style="max-height: 70vh; overflow-y: auto;">
                        <table class="table table-bordered table-hover mb-0" id="usuariosTable">
                            <thead class="table-dark sticky-top">
                                <tr>
                                    <th style="min-width: 200px;">Nome</th>
                                    <th style="min-width: 200px;">Email</th>
                                    <th style="min-width: 120px;">Função</th>
                                    <th style="min-width: 120px;">Status</th>
                                    <th style="min-width: 150px;">Data Criação</th>
                                    <th style="min-width: 150px;">Última Atualização</th>
                                    <th style="min-width: 100px;">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.renderUsuariosTable()}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('pageContent').innerHTML = content;
        this.setupEventListeners();
        document.getElementById('pageTitle').textContent = 'Usuários';
        
        // Buscar botões de ação da página
        const pageActions = document.getElementById('pageActions');
        if (pageActions) {
            pageActions.innerHTML = `
                <button class="btn btn-primary" onclick="usuariosPage.showUsuarioModal()">
                    <i class="fas fa-plus me-2"></i>Novo Usuário
                </button>
            `;
        }
    }

    renderUsuariosTable() {
        if (this.usuarios.length === 0) {
            return `
                <tr>
                    <td colspan="7" class="text-center py-4">
                        <i class="fas fa-users fa-3x text-muted mb-3"></i>
                        <p class="text-muted">Nenhum usuário encontrado</p>
                    </td>
                </tr>
            `;
        }

        return this.usuarios.map(usuario => `
            <tr>
                <td>${usuario.nome || usuario.email}</td>
                <td>${usuario.email}</td>
                <td>
                    <span class="badge bg-${this.getRoleColor(usuario.role)}">
                        ${usuario.role ? usuario.role.toUpperCase() : 'USER'}
                    </span>
                </td>
                <td>
                    <span class="badge bg-${usuario.ativo ? 'success' : 'danger'}">
                        ${usuario.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                </td>
                <td>${usuario.data_criacao ? Utils.formatDate(usuario.data_criacao) : '-'}</td>
                <td>${usuario.data_atualizacao ? Utils.formatDate(usuario.data_atualizacao) : '-'}</td>
                <td class="text-center">
                    <div class="btn-group" role="group">
                        <button type="button" class="btn btn-outline-warning btn-sm" 
                                onclick="usuariosPage.editUsuario('${usuario.id}')" 
                                title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" class="btn btn-outline-${usuario.ativo ? 'danger' : 'success'} btn-sm" 
                                onclick="usuariosPage.toggleUsuarioStatus('${usuario.id}', ${usuario.ativo})" 
                                title="${usuario.ativo ? 'Desativar' : 'Ativar'}">
                            <i class="fas fa-${usuario.ativo ? 'ban' : 'check'}"></i>
                        </button>
                        ${usuario.id !== authManager.currentUser?.uid ? `
                        <button type="button" class="btn btn-outline-info btn-sm" 
                                onclick="usuariosPage.resetPasswordModal('${usuario.id}')" 
                                title="Redefinir Senha">
                            <i class="fas fa-key"></i>
                        </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    }

    getRoleColor(role) {
        const colors = {
            'admin': 'danger',
            'editor': 'primary',
            'user': 'secondary'
        };
        return colors[role] || 'secondary';
    }

    setupEventListeners() {
        // Pesquisa em tempo real
        const searchInput = document.getElementById('searchUsuarios');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce(() => {
                this.filterUsuarios(searchInput.value);
            }, 300));
        }

        // Botão limpar pesquisa
        const clearBtn = document.getElementById('clearSearchUsuarios');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                document.getElementById('searchUsuarios').value = '';
                this.filterUsuarios('');
            });
        }
    }

    filterUsuarios(searchTerm) {
        const table = document.getElementById('usuariosTable');
        if (!table) return;

        const rows = table.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
        const term = searchTerm.toLowerCase();

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const cells = row.getElementsByTagName('td');
            let found = false;

            if (cells.length > 1) {
                // Buscar no nome e email
                const nome = cells[0].textContent.toLowerCase();
                const email = cells[1].textContent.toLowerCase();
                
                if (nome.includes(term) || email.includes(term)) {
                    found = true;
                }
            }

            row.style.display = found ? '' : 'none';
        }
    }

    setupRealtimeListeners() {
        // Limpar listeners anteriores
        this.listeners.forEach(unsubscribe => unsubscribe());

        // Listener para usuários (simulado)
        const usuariosListener = () => {
            // Em produção, implementar listener real
        };

        this.listeners = [usuariosListener];
    }

    updateTable() {
        const tbody = document.querySelector('#usuariosTable tbody');
        if (tbody) {
            tbody.innerHTML = this.renderUsuariosTable();
        }
    }

    // Modal de usuário
    showUsuarioModal(usuarioId = null) {
        if (usuarioId) {
            this.loadUsuarioForEdit(usuarioId);
        } else {
            this.renderUsuarioModal();
        }
    }

    async loadUsuarioForEdit(usuarioId) {
        try {
            const usuario = this.usuarios.find(u => u.id === usuarioId);
            if (usuario) {
                this.renderUsuarioModal(usuario);
            }
        } catch (error) {
            console.error('Erro ao carregar usuário:', error);
            Utils.showMessage('Erro ao carregar usuário', 'error');
        }
    }

    renderUsuarioModal(usuario = null) {
        const isEdit = usuario !== null;
        const title = isEdit ? 'Editar Usuário' : 'Novo Usuário';
        const isCurrentUser = usuario && usuario.id === authManager.currentUser?.uid;
        
        const content = `
            <form id="usuarioForm">
                ${!isEdit ? `
                <div class="mb-3">
                    <label for="email" class="form-label">Email *</label>
                    <input type="email" class="form-control" id="email" required 
                           value="${usuario ? usuario.email : ''}">
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="password" class="form-label">Senha *</label>
                            <input type="password" class="form-control" id="password" required>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="confirmPassword" class="form-label">Confirmar Senha *</label>
                            <input type="password" class="form-control" id="confirmPassword" required>
                        </div>
                    </div>
                </div>
                ` : ''}
                
                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="nome" class="form-label">Nome Completo *</label>
                            <input type="text" class="form-control" id="nome" required 
                                   value="${usuario ? usuario.nome : ''}">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="role" class="form-label">Função *</label>
                            <select class="form-control" id="role" required ${isCurrentUser ? 'disabled' : ''}>
                                <option value="user" ${usuario && usuario.role === 'user' ? 'selected' : ''}>Usuário</option>
                                <option value="editor" ${usuario && usuario.role === 'editor' ? 'selected' : ''}>Editor</option>
                                <option value="admin" ${usuario && usuario.role === 'admin' ? 'selected' : ''}>Administrador</option>
                            </select>
                            ${isCurrentUser ? '<input type="hidden" id="role_hidden" value="' + usuario.role + '">' : ''}
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-12">
                        <h6>Permissões:</h6>
                        <div class="row">
                            <div class="col-md-4">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="permissao_criar" 
                                           ${usuario && usuario.permissoes && usuario.permissoes.criar ? 'checked' : ''}>
                                    <label class="form-check-label" for="permissao_criar">
                                        Criar registros
                                    </label>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="permissao_editar" 
                                           ${usuario && usuario.permissoes && usuario.permissoes.editar ? 'checked' : ''}>
                                    <label class="form-check-label" for="permissao_editar">
                                        Editar registros
                                    </label>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="permissao_admin" 
                                           ${usuario && usuario.permissoes && usuario.permissoes.admin ? 'checked' : ''}
                                           ${isCurrentUser ? 'disabled' : ''}>
                                    <label class="form-check-label" for="permissao_admin">
                                        Administrar sistema
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                ${isEdit ? `
                <div class="row">
                    <div class="col-md-12">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="ativo" 
                                   ${usuario.ativo ? 'checked' : ''} ${isCurrentUser ? 'disabled' : ''}>
                            <label class="form-check-label" for="ativo">
                                Usuário ativo
                            </label>
                            ${isCurrentUser ? '<input type="hidden" id="ativo_hidden" value="' + usuario.ativo + '">' : ''}
                        </div>
                    </div>
                </div>
                ` : ''}
            </form>
        `;

        const actions = [
            {
                text: 'Cancelar',
                class: 'secondary'
            },
            {
                text: isEdit ? 'Atualizar' : 'Salvar',
                class: 'primary',
                action: `usuariosPage.${isEdit ? 'updateUsuario' : 'saveUsuario'}('${usuario ? usuario.id : ''}')`
            }
        ];

        Utils.showModal(title, content, actions);
    }

    async saveUsuario() {
        try {
            if (!Utils.validateForm('usuarioForm')) {
                Utils.showMessage('Por favor, preencha todos os campos obrigatórios', 'warning');
                return;
            }

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (password !== confirmPassword) {
                Utils.showMessage('As senhas não coincidem', 'warning');
                return;
            }

            const usuarioData = {
                nome: document.getElementById('nome').value.trim(),
                role: document.getElementById('role').value,
                permissoes: {
                    criar: document.getElementById('permissao_criar').checked,
                    editar: document.getElementById('permissao_editar').checked,
                    admin: document.getElementById('permissao_admin').checked
                }
            };

            await authManager.register(email, password, usuarioData);
            Utils.showMessage('Usuário criado com sucesso!', 'success');
            
            // Recarregar página
            await this.loadUsuarios();
            this.updateTable();
            
        } catch (error) {
            console.error('Erro ao salvar usuário:', error);
            Utils.showMessage('Erro ao salvar usuário: ' + error, 'error');
        }
    }

    async updateUsuario(usuarioId) {
        try {
            if (!Utils.validateForm('usuarioForm')) {
                Utils.showMessage('Por favor, preencha todos os campos obrigatórios', 'warning');
                return;
            }

            const usuarioData = {
                nome: document.getElementById('nome').value.trim(),
                role: document.getElementById('role_hidden') ? 
                    document.getElementById('role_hidden').value : 
                    document.getElementById('role').value,
                permissoes: {
                    criar: document.getElementById('permissao_criar').checked,
                    editar: document.getElementById('permissao_editar').checked,
                    admin: document.getElementById('permissao_admin').checked
                },
                ativo: document.getElementById('ativo_hidden') ? 
                    document.getElementById('ativo_hidden').value === 'true' : 
                    document.getElementById('ativo').checked
            };

            await databaseManager.updateUsuario(usuarioId, usuarioData);
            Utils.showMessage('Usuário atualizado com sucesso!', 'success');
            
            // Recarregar página
            await this.loadUsuarios();
            this.updateTable();
            
        } catch (error) {
            console.error('Erro ao atualizar usuário:', error);
            Utils.showMessage('Erro ao atualizar usuário', 'error');
        }
    }

    async toggleUsuarioStatus(usuarioId, currentStatus) {
        try {
            if (usuarioId === authManager.currentUser?.uid) {
                Utils.showMessage('Você não pode alterar seu próprio status', 'warning');
                return;
            }

            const newStatus = !currentStatus;
            const action = newStatus ? 'ativar' : 'desativar';
            
            const confirmed = await Utils.confirm(
                `Confirmar ${action.charAt(0).toUpperCase() + action.slice(1)}`,
                `Tem certeza que deseja ${action} este usuário?`
            );

            if (confirmed) {
                await databaseManager.updateUsuario(usuarioId, { ativo: newStatus });
                Utils.showMessage(`Usuário ${action}do com sucesso!`, 'success');
                
                // Recarregar página
                await this.loadUsuarios();
                this.updateTable();
            }
        } catch (error) {
            console.error('Erro ao alterar status do usuário:', error);
            Utils.showMessage('Erro ao alterar status do usuário', 'error');
        }
    }

    async resetPasswordModal(usuarioId) {
        const usuario = this.usuarios.find(u => u.id === usuarioId);
        if (!usuario) return;

        const content = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i>
                Um email será enviado para <strong>${usuario.email}</strong> com instruções para redefinir a senha.
            </div>
            <p>Tem certeza que deseja enviar o email de redefinição de senha?</p>
        `;

        const actions = [
            {
                text: 'Cancelar',
                class: 'secondary'
            },
            {
                text: 'Enviar Email',
                class: 'primary',
                action: `usuariosPage.resetPassword('${usuarioId}')`
            }
        ];

        Utils.showModal('Redefinir Senha', content, actions);
    }

    async resetPassword(usuarioId) {
        try {
            const usuario = this.usuarios.find(u => u.id === usuarioId);
            if (!usuario) {
                Utils.showMessage('Usuário não encontrado', 'error');
                return;
            }

            await authManager.resetPassword(usuario.email);
            Utils.showMessage('Email de redefinição enviado com sucesso!', 'success');
            
        } catch (error) {
            console.error('Erro ao redefinir senha:', error);
            Utils.showMessage('Erro ao enviar email de redefinição: ' + error, 'error');
        }
    }

    editUsuario(usuarioId) {
        this.showUsuarioModal(usuarioId);
    }

    unload() {
        // Limpar listeners quando sair da página
        this.listeners.forEach(unsubscribe => unsubscribe());
        this.listeners = [];
    }
}

// Inicializar página de usuários
const usuariosPage = new UsuariosPage();

// Exportar para uso global
window.UsuariosPage = UsuariosPage;
window.usuariosPage = usuariosPage;
