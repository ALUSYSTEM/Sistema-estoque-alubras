// Página de Fornecedores do Sistema de Qualidade
class FornecedoresPage {
    constructor() {
        this.fornecedores = [];
        this.currentFilters = {};
        this.listeners = [];
    }

    async load(params = {}) {
        try {
            this.showLoading();
            
            // Verificar se deve criar novo fornecedor
            if (params.action === 'create') {
                this.showFornecedorModal();
                return;
            }

            // Carregar fornecedores
            await this.loadFornecedores();
            
            // Renderizar página
            this.render();
            
            // Configurar listeners para atualizações em tempo real
            this.setupRealtimeListeners();
            
        } catch (error) {
            console.error('Erro ao carregar fornecedores:', error);
            Utils.showMessage('Erro ao carregar fornecedores', 'error');
        }
    }

    showLoading() {
        document.getElementById('pageContent').innerHTML = `
            <div class="loading">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Carregando fornecedores...</span>
                </div>
            </div>
        `;
    }

    async loadFornecedores() {
        try {
            this.fornecedores = await databaseManager.getFornecedores(this.currentFilters);
        } catch (error) {
            console.error('Erro ao carregar fornecedores:', error);
            throw error;
        }
    }

    render() {
        const content = `
            <!-- Filtros -->
            <div class="row mb-3">
                <div class="col-md-3">
                    <input type="text" class="form-control" id="filterNome" placeholder="Filtrar por nome">
                </div>
                <div class="col-md-3">
                    <input type="text" class="form-control" id="filterCnpj" placeholder="Filtrar por CNPJ">
                </div>
                <div class="col-md-3">
                    <select class="form-control" id="filterStatus">
                        <option value="">Todos os Status</option>
                        <option value="ativo">Ativo</option>
                        <option value="inativo">Inativo</option>
                        <option value="suspenso">Suspenso</option>
                    </select>
                </div>
                <div class="col-md-3">
                    <button class="btn btn-outline-secondary w-100" onclick="fornecedoresPage.clearFilters()">
                        <i class="fas fa-times me-2"></i>Limpar Filtros
                    </button>
                </div>
            </div>

            <!-- Tabela de Fornecedores -->
            <div class="card shadow">
                <div class="card-header py-3">
                    <h6 class="m-0 font-weight-bold text-primary">Fornecedores</h6>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive" style="max-height: 70vh; overflow-y: auto;">
                        <table class="table table-bordered table-hover mb-0" id="fornecedoresTable">
                            <thead class="table-dark sticky-top">
                                <tr>
                                    <th style="min-width: 200px;">Nome/Razão Social</th>
                                    <th style="min-width: 150px;">CNPJ</th>
                                    <th style="min-width: 150px;">Contato</th>
                                    <th style="min-width: 120px;">Status</th>
                                    <th style="min-width: 100px;">Avaliação</th>
                                    <th style="min-width: 100px;">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.renderFornecedoresTable()}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('pageContent').innerHTML = content;
        this.setupFilters();
        document.getElementById('pageTitle').textContent = 'Fornecedores';
        
        // Buscar botões de ação da página
        const pageActions = document.getElementById('pageActions');
        if (pageActions) {
            pageActions.innerHTML = `
                <button class="btn btn-primary" onclick="showFornecedorModal()">
                    <i class="fas fa-plus me-2"></i>Novo Fornecedor
                </button>
            `;
        }
    }

    renderFornecedoresTable() {
        if (this.fornecedores.length === 0) {
            return `
                <tr>
                    <td colspan="6" class="text-center py-4">
                        <i class="fas fa-truck fa-3x text-muted mb-3"></i>
                        <p class="text-muted">Nenhum fornecedor encontrado</p>
                    </td>
                </tr>
            `;
        }

        return this.fornecedores.map(fornecedor => {
            const canEdit = authManager.hasPermission('editar');
            const canDelete = authManager.hasPermission('excluir');
            
            return `
            <tr>
                <td>
                    <div class="fw-bold">${fornecedor.nome || 'N/A'}</div>
                    <small class="text-muted">${fornecedor.nome_fantasia || ''}</small>
                </td>
                <td>
                    <div>${fornecedor.cnpj || '-'}</div>
                </td>
                <td>
                    <div>${fornecedor.contato_nome || '-'}</div>
                    <small class="text-muted">${fornecedor.contato_email || ''}</small>
                </td>
                <td>
                    <span class="badge bg-${this.getStatusClass(fornecedor.status)}">
                        ${Utils.formatStatus(fornecedor.status)}
                    </span>
                </td>
                <td>
                    <div class="d-flex align-items-center">
                        <span class="me-2">${fornecedor.avaliacao || 0}</span>
                        <div class="stars">
                            ${this.renderStars(fornecedor.avaliacao || 0)}
                        </div>
                    </div>
                </td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-info" onclick="fornecedoresPage.viewFornecedor('${fornecedor.id}')" title="Visualizar">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${canEdit ? `
                            <button class="btn btn-sm btn-outline-primary" onclick="fornecedoresPage.editFornecedor('${fornecedor.id}')" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                        ` : ''}
                        ${canDelete ? `
                            <button class="btn btn-sm btn-outline-danger" onclick="fornecedoresPage.deleteFornecedor('${fornecedor.id}')" title="Excluir">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
            `;
        }).join('');
    }

    getStatusClass(status) {
        const classes = {
            'ativo': 'success',
            'inativo': 'secondary',
            'suspenso': 'warning'
        };
        return classes[status] || 'secondary';
    }

    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        let stars = '';
        
        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars += '<i class="fas fa-star text-warning"></i>';
            } else if (i === fullStars && hasHalfStar) {
                stars += '<i class="fas fa-star-half-alt text-warning"></i>';
            } else {
                stars += '<i class="far fa-star text-warning"></i>';
            }
        }
        
        return stars;
    }

    setupFilters() {
        // Adicionar event listeners para filtros
        const filterInputs = ['filterNome', 'filterCnpj', 'filterStatus'];
        
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
            nome: document.getElementById('filterNome')?.value || '',
            cnpj: document.getElementById('filterCnpj')?.value || '',
            status: document.getElementById('filterStatus')?.value || ''
        };

        this.currentFilters = filters;
        this.loadFornecedores().then(() => {
            this.updateTable();
        });
    }

    clearFilters() {
        document.getElementById('filterNome').value = '';
        document.getElementById('filterCnpj').value = '';
        document.getElementById('filterStatus').value = '';
        
        this.currentFilters = {};
        this.loadFornecedores().then(() => {
            this.updateTable();
        });
    }

    updateTable() {
        const tbody = document.querySelector('#fornecedoresTable tbody');
        if (tbody) {
            tbody.innerHTML = this.renderFornecedoresTable();
        }
    }

    // Modal de fornecedor
    showFornecedorModal(fornecedorId = null) {
        if (fornecedorId) {
            this.loadFornecedorForEdit(fornecedorId);
        } else {
            this.renderFornecedorModal();
        }
    }

    async loadFornecedorForEdit(fornecedorId) {
        try {
            const fornecedor = this.fornecedores.find(f => f.id === fornecedorId);
            if (fornecedor) {
                this.renderFornecedorModal(fornecedor);
            } else {
                Utils.showMessage('Fornecedor não encontrado', 'error');
            }
        } catch (error) {
            console.error('Erro ao carregar fornecedor:', error);
            Utils.showMessage('Erro ao carregar fornecedor', 'error');
        }
    }

    async renderFornecedorModal(fornecedor = null) {
        const isEdit = fornecedor !== null;
        const title = isEdit ? 'Editar Fornecedor' : 'Novo Fornecedor';
        
        const content = `
            <form id="fornecedorForm">
                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="nome" class="form-label">Razão Social *</label>
                            <input type="text" class="form-control" id="nome" required 
                                   value="${fornecedor ? fornecedor.nome : ''}"
                                   placeholder="Ex: Empresa ABC Ltda">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="nome_fantasia" class="form-label">Nome Fantasia</label>
                            <input type="text" class="form-control" id="nome_fantasia" 
                                   value="${fornecedor ? fornecedor.nome_fantasia : ''}"
                                   placeholder="Ex: ABC Materiais">
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="cnpj" class="form-label">CNPJ *</label>
                            <input type="text" class="form-control" id="cnpj" required 
                                   value="${fornecedor ? fornecedor.cnpj : ''}"
                                   placeholder="00.000.000/0000-00">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="inscricao_estadual" class="form-label">Inscrição Estadual</label>
                            <input type="text" class="form-control" id="inscricao_estadual" 
                                   value="${fornecedor ? fornecedor.inscricao_estadual : ''}"
                                   placeholder="Ex: 123456789">
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="contato_nome" class="form-label">Nome do Contato</label>
                            <input type="text" class="form-control" id="contato_nome" 
                                   value="${fornecedor ? fornecedor.contato_nome : ''}"
                                   placeholder="Ex: João Silva">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="contato_email" class="form-label">Email do Contato</label>
                            <input type="email" class="form-control" id="contato_email" 
                                   value="${fornecedor ? fornecedor.contato_email : ''}"
                                   placeholder="Ex: joao@empresa.com">
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="contato_telefone" class="form-label">Telefone do Contato</label>
                            <input type="text" class="form-control" id="contato_telefone" 
                                   value="${fornecedor ? fornecedor.contato_telefone : ''}"
                                   placeholder="Ex: (11) 99999-9999">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="status" class="form-label">Status *</label>
                            <select class="form-control" id="status" required>
                                <option value="">Selecione...</option>
                                <option value="ativo" ${fornecedor && fornecedor.status === 'ativo' ? 'selected' : ''}>Ativo</option>
                                <option value="inativo" ${fornecedor && fornecedor.status === 'inativo' ? 'selected' : ''}>Inativo</option>
                                <option value="suspenso" ${fornecedor && fornecedor.status === 'suspenso' ? 'selected' : ''}>Suspenso</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="endereco" class="form-label">Endereço</label>
                            <input type="text" class="form-control" id="endereco" 
                                   value="${fornecedor ? fornecedor.endereco : ''}"
                                   placeholder="Ex: Rua das Flores, 123">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="cidade" class="form-label">Cidade</label>
                            <input type="text" class="form-control" id="cidade" 
                                   value="${fornecedor ? fornecedor.cidade : ''}"
                                   placeholder="Ex: São Paulo">
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="estado" class="form-label">Estado</label>
                            <input type="text" class="form-control" id="estado" 
                                   value="${fornecedor ? fornecedor.estado : ''}"
                                   placeholder="Ex: SP">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="cep" class="form-label">CEP</label>
                            <input type="text" class="form-control" id="cep" 
                                   value="${fornecedor ? fornecedor.cep : ''}"
                                   placeholder="Ex: 01234-567">
                        </div>
                    </div>
                </div>

                <div class="mb-3">
                    <label for="observacoes" class="form-label">Observações</label>
                    <textarea class="form-control" id="observacoes" rows="3" 
                              placeholder="Observações sobre o fornecedor...">${fornecedor ? fornecedor.observacoes : ''}</textarea>
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
                onclick: isEdit ? `fornecedoresPage.saveFornecedorUpdate('${fornecedor.id}')` : 'fornecedoresPage.saveFornecedor()'
            }
        ];

        Utils.showModal(title, content, actions);
    }

    async saveFornecedor() {
        try {
            if (!Utils.validateForm('fornecedorForm')) {
                Utils.showMessage('Por favor, preencha todos os campos obrigatórios', 'warning');
                return;
            }

            const fornecedorData = {
                nome: document.getElementById('nome').value,
                nome_fantasia: document.getElementById('nome_fantasia').value.trim() || null,
                cnpj: document.getElementById('cnpj').value,
                inscricao_estadual: document.getElementById('inscricao_estadual').value.trim() || null,
                contato_nome: document.getElementById('contato_nome').value.trim() || null,
                contato_email: document.getElementById('contato_email').value.trim() || null,
                contato_telefone: document.getElementById('contato_telefone').value.trim() || null,
                status: document.getElementById('status').value,
                endereco: document.getElementById('endereco').value.trim() || null,
                cidade: document.getElementById('cidade').value.trim() || null,
                estado: document.getElementById('estado').value.trim() || null,
                cep: document.getElementById('cep').value.trim() || null,
                observacoes: document.getElementById('observacoes').value.trim() || null
            };

            await databaseManager.addFornecedor(fornecedorData);
            Utils.showMessage('Fornecedor salvo com sucesso!', 'success');
            
            // Recarregar página
            await this.loadFornecedores();
            this.updateTable();
            
        } catch (error) {
            console.error('Erro ao salvar fornecedor:', error);
            Utils.showMessage('Erro ao salvar fornecedor', 'error');
        }
    }

    async saveFornecedorUpdate(fornecedorId) {
        try {
            if (!Utils.validateForm('fornecedorForm')) {
                Utils.showMessage('Por favor, preencha todos os campos obrigatórios', 'warning');
                return;
            }

            const fornecedorData = {
                nome: document.getElementById('nome').value,
                nome_fantasia: document.getElementById('nome_fantasia').value.trim() || null,
                cnpj: document.getElementById('cnpj').value,
                inscricao_estadual: document.getElementById('inscricao_estadual').value.trim() || null,
                contato_nome: document.getElementById('contato_nome').value.trim() || null,
                contato_email: document.getElementById('contato_email').value.trim() || null,
                contato_telefone: document.getElementById('contato_telefone').value.trim() || null,
                status: document.getElementById('status').value,
                endereco: document.getElementById('endereco').value.trim() || null,
                cidade: document.getElementById('cidade').value.trim() || null,
                estado: document.getElementById('estado').value.trim() || null,
                cep: document.getElementById('cep').value.trim() || null,
                observacoes: document.getElementById('observacoes').value.trim() || null
            };

            await databaseManager.updateFornecedor(fornecedorId, fornecedorData);
            Utils.showMessage('Fornecedor atualizado com sucesso!', 'success');
            
            // Recarregar página
            await this.loadFornecedores();
            this.updateTable();
            
        } catch (error) {
            console.error('Erro ao atualizar fornecedor:', error);
            Utils.showMessage('Erro ao atualizar fornecedor', 'error');
        }
    }

    async deleteFornecedor(fornecedorId) {
        const confirmed = await Utils.confirm(
            'Confirmar Exclusão',
            'Tem certeza que deseja excluir este fornecedor? Esta ação não pode ser desfeita.'
        );

        if (confirmed) {
            try {
                await databaseManager.deleteFornecedor(fornecedorId);
                Utils.showMessage('Fornecedor excluído com sucesso!', 'success');
                
                // Recarregar página
                await this.loadFornecedores();
                this.updateTable();
                
            } catch (error) {
                console.error('Erro ao excluir fornecedor:', error);
                Utils.showMessage('Erro ao excluir fornecedor', 'error');
            }
        }
    }

    viewFornecedor(fornecedorId) {
        const fornecedor = this.fornecedores.find(f => f.id === fornecedorId);
        if (!fornecedor) {
            Utils.showMessage('Fornecedor não encontrado', 'error');
            return;
        }

        // Implementar visualização detalhada
        Utils.showMessage('Funcionalidade de visualização será implementada', 'info');
    }

    editFornecedor(fornecedorId) {
        this.showFornecedorModal(fornecedorId);
    }

    setupRealtimeListeners() {
        // Listener para fornecedores
        const unsubscribe = databaseManager.setupFornecedoresListener((fornecedores) => {
            this.fornecedores = fornecedores;
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

// Inicializar página de fornecedores
const fornecedoresPage = new FornecedoresPage();

// Exportar para uso global
window.FornecedoresPage = FornecedoresPage;
window.fornecedoresPage = fornecedoresPage;

// Exportar funções específicas para uso em onclick
window.showFornecedorModal = () => fornecedoresPage.showFornecedorModal();
window.saveFornecedor = () => fornecedoresPage.saveFornecedor();
window.saveFornecedorUpdate = (id) => fornecedoresPage.saveFornecedorUpdate(id);
window.editFornecedor = (id) => fornecedoresPage.editFornecedor(id);
window.deleteFornecedor = (id) => fornecedoresPage.deleteFornecedor(id);
window.viewFornecedor = (id) => fornecedoresPage.viewFornecedor(id);
