// Página de Inspetores do Sistema de Qualidade
class InspetoresPage {
    constructor() {
        this.inspetores = [];
        this.currentFilters = {};
        this.listeners = [];
    }

    async load(params = {}) {
        try {
            this.showLoading();
            
            // Verificar se deve criar novo inspetor
            if (params.action === 'create') {
                this.showInspetorModal();
                return;
            }

            // Carregar inspetores
            await this.loadInspetores();
            
            // Renderizar página
            this.render();
            
            // Configurar listeners para atualizações em tempo real
            this.setupRealtimeListeners();
            
        } catch (error) {
            console.error('Erro ao carregar inspetores:', error);
            Utils.showMessage('Erro ao carregar inspetores', 'error');
        }
    }

    showLoading() {
        document.getElementById('pageContent').innerHTML = `
            <div class="loading">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Carregando inspetores...</span>
                </div>
            </div>
        `;
    }

    async loadInspetores() {
        try {
            this.inspetores = await databaseManager.getInspetores(this.currentFilters);
        } catch (error) {
            console.error('Erro ao carregar inspetores:', error);
            throw error;
        }
    }

    render() {
        const content = `
            <!-- Filtros -->
            <div class="row mb-3">
                <div class="col-md-4">
                    <select class="form-control" id="filterRole">
                        <option value="">Todas as Funções</option>
                        <option value="admin">Administrador</option>
                        <option value="inspetor_chefe">Inspetor Chefe</option>
                        <option value="inspetor">Inspetor</option>
                    </select>
                </div>
                <div class="col-md-4">
                    <input type="text" class="form-control" id="filterNome" placeholder="Filtrar por nome">
                </div>
                <div class="col-md-4">
                    <button class="btn btn-outline-secondary w-100" onclick="inspetoresPage.clearFilters()">
                        <i class="fas fa-times me-2"></i>Limpar Filtros
                    </button>
                </div>
            </div>

            <!-- Tabela de Inspetores -->
            <div class="card shadow">
                <div class="card-header py-3">
                    <h6 class="m-0 font-weight-bold text-primary">Inspetores de Qualidade</h6>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive" style="max-height: 70vh; overflow-y: auto;">
                        <table class="table table-bordered table-hover mb-0" id="inspetoresTable">
                            <thead class="table-dark sticky-top">
                                <tr>
                                    <th style="min-width: 200px;">Nome</th>
                                    <th style="min-width: 150px;">Email</th>
                                    <th style="min-width: 120px;">Função</th>
                                    <th style="min-width: 100px;">Status</th>
                                    <th style="min-width: 120px;">Último Acesso</th>
                                    <th style="min-width: 100px;">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.renderInspetoresTable()}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('pageContent').innerHTML = content;
        this.setupFilters();
        document.getElementById('pageTitle').textContent = 'Inspetores';
        
        // Buscar botões de ação da página
        const pageActions = document.getElementById('pageActions');
        if (pageActions) {
            pageActions.innerHTML = `
                <button class="btn btn-primary" onclick="showInspetorModal()">
                    <i class="fas fa-plus me-2"></i>Novo Inspetor
                </button>
            `;
        }
    }

    renderInspetoresTable() {
        if (this.inspetores.length === 0) {
            return `
                <tr>
                    <td colspan="6" class="text-center py-4">
                        <i class="fas fa-users fa-3x text-muted mb-3"></i>
                        <p class="text-muted">Nenhum inspetor encontrado</p>
                    </td>
                </tr>
            `;
        }

        return this.inspetores.map(inspetor => {
            const canEdit = authManager.hasPermission('editar');
            const canDelete = authManager.hasPermission('excluir');
            
            return `
            <tr>
                <td>
                    <div class="fw-bold">${inspetor.nome || 'N/A'}</div>
                    <small class="text-muted">${inspetor.telefone || ''}</small>
                </td>
                <td>
                    <div>${inspetor.email || '-'}</div>
                </td>
                <td>
                    <span class="badge bg-${this.getRoleClass(inspetor.role)}">
                        ${Utils.formatStatus(inspetor.role)}
                    </span>
                </td>
                <td>
                    <span class="badge bg-${inspetor.ativo ? 'success' : 'danger'}">
                        ${inspetor.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                </td>
                <td>
                    ${inspetor.ultimo_acesso ? Utils.formatDate(inspetor.ultimo_acesso, true) : '-'}
                </td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-info" onclick="inspetoresPage.viewInspetor('${inspetor.id}')" title="Visualizar">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${canEdit ? `
                            <button class="btn btn-sm btn-outline-primary" onclick="inspetoresPage.editInspetor('${inspetor.id}')" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                        ` : ''}
                        ${canDelete ? `
                            <button class="btn btn-sm btn-outline-danger" onclick="inspetoresPage.deleteInspetor('${inspetor.id}')" title="Excluir">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
            `;
        }).join('');
    }

    getRoleClass(role) {
        const classes = {
            'admin': 'danger',
            'inspetor_chefe': 'warning',
            'inspetor': 'info'
        };
        return classes[role] || 'secondary';
    }

    setupFilters() {
        // Adicionar event listeners para filtros
        const filterInputs = ['filterRole', 'filterNome'];
        
        filterInputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', () => this.applyFilters());
                element.addEventListener('change', () => this.applyFilters());
            }
        });
    }

    applyFilters() {
        const filters = {
            role: document.getElementById('filterRole')?.value || '',
            nome: document.getElementById('filterNome')?.value || ''
        };

        this.currentFilters = filters;
        this.loadInspetores().then(() => {
            this.updateTable();
        });
    }

    clearFilters() {
        document.getElementById('filterRole').value = '';
        document.getElementById('filterNome').value = '';
        
        this.currentFilters = {};
        this.loadInspetores().then(() => {
            this.updateTable();
        });
    }

    updateTable() {
        const tbody = document.querySelector('#inspetoresTable tbody');
        if (tbody) {
            tbody.innerHTML = this.renderInspetoresTable();
        }
    }

    // Modal de inspetor
    showInspetorModal(inspetorId = null) {
        if (inspetorId) {
            this.loadInspetorForEdit(inspetorId);
        } else {
            this.renderInspetorModal();
        }
    }

    async loadInspetorForEdit(inspetorId) {
        try {
            const inspetor = this.inspetores.find(i => i.id === inspetorId);
            if (inspetor) {
                this.renderInspetorModal(inspetor);
            } else {
                Utils.showMessage('Inspetor não encontrado', 'error');
            }
        } catch (error) {
            console.error('Erro ao carregar inspetor:', error);
            Utils.showMessage('Erro ao carregar inspetor', 'error');
        }
    }

    async renderInspetorModal(inspetor = null) {
        const isEdit = inspetor !== null;
        const title = isEdit ? 'Editar Inspetor' : 'Novo Inspetor';
        
        const content = `
            <form id="inspetorForm">
                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="nome" class="form-label">Nome Completo *</label>
                            <input type="text" class="form-control" id="nome" required 
                                   value="${inspetor ? inspetor.nome : ''}"
                                   placeholder="Ex: João Silva">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="email" class="form-label">Email *</label>
                            <input type="email" class="form-control" id="email" required 
                                   value="${inspetor ? inspetor.email : ''}"
                                   placeholder="Ex: joao@alubras.com">
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="telefone" class="form-label">Telefone</label>
                            <input type="text" class="form-control" id="telefone" 
                                   value="${inspetor ? inspetor.telefone : ''}"
                                   placeholder="Ex: (11) 99999-9999">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="role" class="form-label">Função *</label>
                            <select class="form-control" id="role" required>
                                <option value="">Selecione...</option>
                                <option value="admin" ${inspetor && inspetor.role === 'admin' ? 'selected' : ''}>Administrador</option>
                                <option value="inspetor_chefe" ${inspetor && inspetor.role === 'inspetor_chefe' ? 'selected' : ''}>Inspetor Chefe</option>
                                <option value="inspetor" ${inspetor && inspetor.role === 'inspetor' ? 'selected' : ''}>Inspetor</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="setor" class="form-label">Setor</label>
                            <input type="text" class="form-control" id="setor" 
                                   value="${inspetor ? inspetor.setor : ''}"
                                   placeholder="Ex: Qualidade, Produção">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="ativo" class="form-label">Status</label>
                            <select class="form-control" id="ativo">
                                <option value="true" ${inspetor && inspetor.ativo !== false ? 'selected' : ''}>Ativo</option>
                                <option value="false" ${inspetor && inspetor.ativo === false ? 'selected' : ''}>Inativo</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="mb-3">
                    <label for="observacoes" class="form-label">Observações</label>
                    <textarea class="form-control" id="observacoes" rows="3" 
                              placeholder="Observações sobre o inspetor...">${inspetor ? inspetor.observacoes : ''}</textarea>
                </div>
            </form>
        `;

        const actions = [
            {
                text: 'Cancelar',
                class: 'secondary',
                onclick: 'closeModal()'
            },
            {
                text: isEdit ? 'Atualizar' : 'Salvar',
                class: 'primary',
                onclick: isEdit ? `saveInspetorUpdate('${inspetor.id}')` : 'saveInspetor()'
            }
        ];

        Utils.showModal(title, content, actions);
    }

    async saveInspetor() {
        console.log('saveInspetor chamada');
        try {
            const formValid = Utils.validateForm('inspetorForm');
            console.log('Formulário válido:', formValid);
            
            if (!formValid) {
                Utils.showMessage('Por favor, preencha todos os campos obrigatórios', 'warning');
                return;
            }

            const inspetorData = {
                nome: document.getElementById('nome').value,
                email: document.getElementById('email').value,
                telefone: document.getElementById('telefone').value.trim() || null,
                role: document.getElementById('role').value,
                setor: document.getElementById('setor').value.trim() || null,
                ativo: document.getElementById('ativo').value === 'true',
                observacoes: document.getElementById('observacoes').value.trim() || null
            };

            console.log('Dados do inspetor:', inspetorData);

            await databaseManager.addInspetor(inspetorData);
            Utils.showMessage('Inspetor salvo com sucesso!', 'success');
            
            // Recarregar página
            await this.loadInspetores();
            this.updateTable();
            
        } catch (error) {
            console.error('Erro ao salvar inspetor:', error);
            Utils.showMessage('Erro ao salvar inspetor', 'error');
        }
    }

    async saveInspetorUpdate(inspetorId) {
        try {
            if (!Utils.validateForm('inspetorForm')) {
                Utils.showMessage('Por favor, preencha todos os campos obrigatórios', 'warning');
                return;
            }

            const inspetorData = {
                nome: document.getElementById('nome').value,
                email: document.getElementById('email').value,
                telefone: document.getElementById('telefone').value.trim() || null,
                role: document.getElementById('role').value,
                setor: document.getElementById('setor').value.trim() || null,
                ativo: document.getElementById('ativo').value === 'true',
                observacoes: document.getElementById('observacoes').value.trim() || null
            };

            await databaseManager.updateInspetor(inspetorId, inspetorData);
            Utils.showMessage('Inspetor atualizado com sucesso!', 'success');
            
            // Recarregar página
            await this.loadInspetores();
            this.updateTable();
            
        } catch (error) {
            console.error('Erro ao atualizar inspetor:', error);
            Utils.showMessage('Erro ao atualizar inspetor', 'error');
        }
    }

    async deleteInspetor(inspetorId) {
        const confirmed = await Utils.confirm(
            'Confirmar Exclusão',
            'Tem certeza que deseja excluir este inspetor? Esta ação não pode ser desfeita.'
        );

        if (confirmed) {
            try {
                await databaseManager.deleteInspetor(inspetorId);
                Utils.showMessage('Inspetor excluído com sucesso!', 'success');
                
                // Recarregar página
                await this.loadInspetores();
                this.updateTable();
                
            } catch (error) {
                console.error('Erro ao excluir inspetor:', error);
                Utils.showMessage('Erro ao excluir inspetor', 'error');
            }
        }
    }

    viewInspetor(inspetorId) {
        const inspetor = this.inspetores.find(i => i.id === inspetorId);
        if (!inspetor) {
            Utils.showMessage('Inspetor não encontrado', 'error');
            return;
        }

        // Implementar visualização detalhada
        Utils.showMessage('Funcionalidade de visualização será implementada', 'info');
    }

    editInspetor(inspetorId) {
        this.showInspetorModal(inspetorId);
    }

    setupRealtimeListeners() {
        // Listener para inspetores
        const unsubscribe = databaseManager.setupInspetoresListener((inspetores) => {
            this.inspetores = inspetores;
            this.updateTable();
        });

        this.listeners.push(unsubscribe);
    }

    unload() {
        // Limpar listeners quando sair da página
        this.listeners.forEach(unsubscribe => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        });
        this.listeners = [];
    }
}

// Inicializar página de inspetores
const inspetoresPage = new InspetoresPage();

// Exportar para uso global
window.InspetoresPage = InspetoresPage;
window.inspetoresPage = inspetoresPage;

// Exportar funções específicas para uso em onclick
window.showInspetorModal = () => inspetoresPage.showInspetorModal();
window.saveInspetor = () => inspetoresPage.saveInspetor();
window.saveInspetorUpdate = (id) => inspetoresPage.saveInspetorUpdate(id);
window.editInspetor = (id) => inspetoresPage.editInspetor(id);
window.deleteInspetor = (id) => inspetoresPage.deleteInspetor(id);
window.viewInspetor = (id) => inspetoresPage.viewInspetor(id);
