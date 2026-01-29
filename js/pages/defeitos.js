// Página de Defeitos do Sistema de Qualidade
class DefeitosPage {
    constructor() {
        this.defeitos = [];
        this.currentFilters = {};
        this.listeners = [];
    }

    async load(params = {}) {
        try {
            this.showLoading();
            
            // Verificar se deve criar novo defeito
            if (params.action === 'create') {
                this.showDefeitoModal();
                return;
            }

            // Carregar defeitos
            await this.loadDefeitos();
            
            // Renderizar página
            this.render();
            
            // Configurar listeners para atualizações em tempo real
            this.setupRealtimeListeners();
            
        } catch (error) {
            console.error('Erro ao carregar defeitos:', error);
            Utils.showMessage('Erro ao carregar defeitos', 'error');
        }
    }

    showLoading() {
        document.getElementById('pageContent').innerHTML = `
            <div class="loading">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Carregando defeitos...</span>
                </div>
            </div>
        `;
    }

    async loadDefeitos() {
        try {
            this.defeitos = await databaseManager.getDefeitos(this.currentFilters);
        } catch (error) {
            console.error('Erro ao carregar defeitos:', error);
            throw error;
        }
    }

    render() {
        const content = `
            <!-- Filtros -->
            <div class="row mb-3">
                <div class="col-md-4">
                    <select class="form-control" id="filterCategoria">
                        <option value="">Todas as Categorias</option>
                        <option value="VISUAL">Visual</option>
                        <option value="FUNCIONAL">Funcional</option>
                        <option value="ESTRUTURAL">Estrutural</option>
                        <option value="ACABAMENTO">Acabamento</option>
                    </select>
                </div>
                <div class="col-md-4">
                    <input type="text" class="form-control" id="filterNome" placeholder="Filtrar por nome">
                </div>
                <div class="col-md-4">
                    <button class="btn btn-outline-secondary w-100" onclick="defeitosPage.clearFilters()">
                        <i class="fas fa-times me-2"></i>Limpar Filtros
                    </button>
                </div>
            </div>

            <!-- Tabela de Defeitos -->
            <div class="card shadow">
                <div class="card-header py-3">
                    <h6 class="m-0 font-weight-bold text-primary">Catálogo de Defeitos</h6>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive" style="max-height: 70vh; overflow-y: auto;">
                        <table class="table table-bordered table-hover mb-0" id="defeitosTable">
                            <thead class="table-dark sticky-top">
                                <tr>
                                    <th style="min-width: 200px;">Nome</th>
                                    <th style="min-width: 150px;">Categoria</th>
                                    <th style="min-width: 200px;">Descrição</th>
                                    <th style="min-width: 150px;">Severidade</th>
                                    <th style="min-width: 100px;">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.renderDefeitosTable()}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('pageContent').innerHTML = content;
        this.setupFilters();
        document.getElementById('pageTitle').textContent = 'Defeitos';
        
        // Buscar botões de ação da página
        const pageActions = document.getElementById('pageActions');
        if (pageActions) {
            pageActions.innerHTML = `
                <button class="btn btn-primary" onclick="showDefeitoModal()">
                    <i class="fas fa-plus me-2"></i>Novo Defeito
                </button>
            `;
        }
    }

    renderDefeitosTable() {
        if (this.defeitos.length === 0) {
            return `
                <tr>
                    <td colspan="5" class="text-center py-4">
                        <i class="fas fa-exclamation-triangle fa-3x text-muted mb-3"></i>
                        <p class="text-muted">Nenhum defeito encontrado</p>
                    </td>
                </tr>
            `;
        }

        return this.defeitos.map(defeito => {
            const canEdit = authManager.hasPermission('editar');
            const canDelete = authManager.hasPermission('excluir');
            
            return `
            <tr>
                <td>
                    <div class="fw-bold">${defeito.nome || 'N/A'}</div>
                    <small class="text-muted">${defeito.codigo || ''}</small>
                </td>
                <td>
                    <span class="badge bg-${this.getCategoriaClass(defeito.categoria)}">
                        ${Utils.formatStatus(defeito.categoria)}
                    </span>
                </td>
                <td>
                    <div class="text-truncate" style="max-width: 200px;" title="${defeito.descricao || ''}">
                        ${defeito.descricao || '-'}
                    </div>
                </td>
                <td>
                    <span class="badge bg-${this.getSeveridadeClass(defeito.severidade)}">
                        ${defeito.severidade || 'Normal'}
                    </span>
                </td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-info" onclick="viewDefeito('${defeito.id}')" title="Visualizar">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${canEdit ? `
                            <button class="btn btn-sm btn-outline-primary" onclick="editDefeito('${defeito.id}')" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                        ` : ''}
                        ${canDelete ? `
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteDefeito('${defeito.id}')" title="Excluir">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
            `;
        }).join('');
    }

    getCategoriaClass(categoria) {
        const classes = {
            'VISUAL': 'info',
            'FUNCIONAL': 'warning',
            'ESTRUTURAL': 'danger',
            'ACABAMENTO': 'secondary'
        };
        return classes[categoria] || 'secondary';
    }

    getSeveridadeClass(severidade) {
        const classes = {
            'Alta': 'danger',
            'Média': 'warning',
            'Normal': 'info',
            'Baixa': 'secondary'
        };
        return classes[severidade] || 'info';
    }

    setupFilters() {
        // Adicionar event listeners para filtros
        const filterInputs = ['filterCategoria', 'filterNome'];
        
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
            categoria: document.getElementById('filterCategoria')?.value || '',
            nome: document.getElementById('filterNome')?.value || ''
        };

        this.currentFilters = filters;
        this.loadDefeitos().then(() => {
            this.updateTable();
        });
    }

    clearFilters() {
        document.getElementById('filterCategoria').value = '';
        document.getElementById('filterNome').value = '';
        
        this.currentFilters = {};
        this.loadDefeitos().then(() => {
            this.updateTable();
        });
    }

    updateTable() {
        const tbody = document.querySelector('#defeitosTable tbody');
        if (tbody) {
            tbody.innerHTML = this.renderDefeitosTable();
        }
    }

    // Modal de defeito
    showDefeitoModal(defeitoId = null) {
        if (defeitoId) {
            this.loadDefeitoForEdit(defeitoId);
        } else {
            this.renderDefeitoModal();
        }
    }

    async loadDefeitoForEdit(defeitoId) {
        try {
            const defeito = this.defeitos.find(d => d.id === defeitoId);
            if (defeito) {
                this.renderDefeitoModal(defeito);
            } else {
                Utils.showMessage('Defeito não encontrado', 'error');
            }
        } catch (error) {
            console.error('Erro ao carregar defeito:', error);
            Utils.showMessage('Erro ao carregar defeito', 'error');
        }
    }

    async renderDefeitoModal(defeito = null) {
        const isEdit = defeito !== null;
        const title = isEdit ? 'Editar Defeito' : 'Novo Defeito';
        
        const content = `
            <form id="defeitoForm">
                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="nome" class="form-label">Nome do Defeito *</label>
                            <input type="text" class="form-control" id="nome" required 
                                   value="${defeito ? defeito.nome : ''}"
                                   placeholder="Ex: Riscos ou arranhões">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="codigo" class="form-label">Código</label>
                            <input type="text" class="form-control" id="codigo" 
                                   value="${defeito ? defeito.codigo : ''}"
                                   placeholder="Ex: DEF001">
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="categoria" class="form-label">Categoria *</label>
                            <select class="form-control" id="categoria" required>
                                <option value="">Selecione...</option>
                                <option value="VISUAL" ${defeito && defeito.categoria === 'VISUAL' ? 'selected' : ''}>Visual</option>
                                <option value="FUNCIONAL" ${defeito && defeito.categoria === 'FUNCIONAL' ? 'selected' : ''}>Funcional</option>
                                <option value="ESTRUTURAL" ${defeito && defeito.categoria === 'ESTRUTURAL' ? 'selected' : ''}>Estrutural</option>
                                <option value="ACABAMENTO" ${defeito && defeito.categoria === 'ACABAMENTO' ? 'selected' : ''}>Acabamento</option>
                            </select>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="severidade" class="form-label">Severidade *</label>
                            <select class="form-control" id="severidade" required>
                                <option value="">Selecione...</option>
                                <option value="Alta" ${defeito && defeito.severidade === 'Alta' ? 'selected' : ''}>Alta</option>
                                <option value="Média" ${defeito && defeito.severidade === 'Média' ? 'selected' : ''}>Média</option>
                                <option value="Normal" ${defeito && defeito.severidade === 'Normal' ? 'selected' : ''}>Normal</option>
                                <option value="Baixa" ${defeito && defeito.severidade === 'Baixa' ? 'selected' : ''}>Baixa</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="mb-3">
                    <label for="descricao" class="form-label">Descrição *</label>
                    <textarea class="form-control" id="descricao" rows="3" required 
                              placeholder="Descreva o defeito...">${defeito ? defeito.descricao : ''}</textarea>
                </div>

                <div class="mb-3">
                    <label for="causa_raiz" class="form-label">Causa Raiz</label>
                    <textarea class="form-control" id="causa_raiz" rows="2" 
                              placeholder="Descreva a causa raiz do defeito...">${defeito ? defeito.causa_raiz : ''}</textarea>
                </div>

                <div class="mb-3">
                    <label for="acao_corretiva" class="form-label">Ação Corretiva</label>
                    <textarea class="form-control" id="acao_corretiva" rows="2" 
                              placeholder="Descreva a ação corretiva...">${defeito ? defeito.acao_corretiva : ''}</textarea>
                </div>

                <div class="mb-3">
                    <label for="observacoes" class="form-label">Observações</label>
                    <textarea class="form-control" id="observacoes" rows="2" 
                              placeholder="Observações adicionais...">${defeito ? defeito.observacoes : ''}</textarea>
                </div>
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
                onclick: isEdit ? `saveDefeitoUpdate('${defeito.id}')` : 'saveDefeito()'
            }
        ];

        Utils.showModal(title, content, actions);
    }

    async saveDefeito() {
        try {
            if (!Utils.validateForm('defeitoForm')) {
                Utils.showMessage('Por favor, preencha todos os campos obrigatórios', 'warning');
                return;
            }

            const defeitoData = {
                nome: document.getElementById('nome').value,
                codigo: document.getElementById('codigo').value.trim() || null,
                categoria: document.getElementById('categoria').value,
                severidade: document.getElementById('severidade').value,
                descricao: document.getElementById('descricao').value,
                causa_raiz: document.getElementById('causa_raiz').value.trim() || null,
                acao_corretiva: document.getElementById('acao_corretiva').value.trim() || null,
                observacoes: document.getElementById('observacoes').value.trim() || null
            };

            await databaseManager.addDefeito(defeitoData);
            Utils.showMessage('Defeito salvo com sucesso!', 'success');
            
            // Recarregar página
            await this.loadDefeitos();
            this.updateTable();
            
        } catch (error) {
            console.error('Erro ao salvar defeito:', error);
            Utils.showMessage('Erro ao salvar defeito', 'error');
        }
    }

    async saveDefeitoUpdate(defeitoId) {
        try {
            if (!Utils.validateForm('defeitoForm')) {
                Utils.showMessage('Por favor, preencha todos os campos obrigatórios', 'warning');
                return;
            }

            const defeitoData = {
                nome: document.getElementById('nome').value,
                codigo: document.getElementById('codigo').value.trim() || null,
                categoria: document.getElementById('categoria').value,
                severidade: document.getElementById('severidade').value,
                descricao: document.getElementById('descricao').value,
                causa_raiz: document.getElementById('causa_raiz').value.trim() || null,
                acao_corretiva: document.getElementById('acao_corretiva').value.trim() || null,
                observacoes: document.getElementById('observacoes').value.trim() || null
            };

            await databaseManager.updateDefeito(defeitoId, defeitoData);
            Utils.showMessage('Defeito atualizado com sucesso!', 'success');
            
            // Recarregar página
            await this.loadDefeitos();
            this.updateTable();
            
        } catch (error) {
            console.error('Erro ao atualizar defeito:', error);
            Utils.showMessage('Erro ao atualizar defeito', 'error');
        }
    }

    async deleteDefeito(defeitoId) {
        const confirmed = await Utils.confirm(
            'Confirmar Exclusão',
            'Tem certeza que deseja excluir este defeito? Esta ação não pode ser desfeita.'
        );

        if (confirmed) {
            try {
                await databaseManager.deleteDefeito(defeitoId);
                Utils.showMessage('Defeito excluído com sucesso!', 'success');
                
                // Recarregar página
                await this.loadDefeitos();
                this.updateTable();
                
            } catch (error) {
                console.error('Erro ao excluir defeito:', error);
                Utils.showMessage('Erro ao excluir defeito', 'error');
            }
        }
    }

    viewDefeito(defeitoId) {
        const defeito = this.defeitos.find(d => d.id === defeitoId);
        if (!defeito) {
            Utils.showMessage('Defeito não encontrado', 'error');
            return;
        }

        // Implementar visualização detalhada
        Utils.showMessage('Funcionalidade de visualização será implementada', 'info');
    }

    editDefeito(defeitoId) {
        this.showDefeitoModal(defeitoId);
    }

    setupRealtimeListeners() {
        // Listener para defeitos
        const unsubscribe = databaseManager.setupDefeitosListener((defeitos) => {
            this.defeitos = defeitos;
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

// Inicializar página de defeitos
const defeitosPage = new DefeitosPage();

// Exportar para uso global
window.DefeitosPage = DefeitosPage;
window.defeitosPage = defeitosPage;

// Exportar funções específicas para uso em onclick
window.showDefeitoModal = () => defeitosPage.showDefeitoModal();
window.saveDefeito = () => defeitosPage.saveDefeito();
window.saveDefeitoUpdate = (id) => defeitosPage.saveDefeitoUpdate(id);
window.editDefeito = (id) => defeitosPage.editDefeito(id);
window.deleteDefeito = (id) => defeitosPage.deleteDefeito(id);
window.viewDefeito = (id) => defeitosPage.viewDefeito(id);
