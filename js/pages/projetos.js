// Página de Projetos
class ProjetosPage {
    constructor() {
        this.projetos = [];
        this.currentFilters = {};
        this.listeners = [];
    }

    async load(params = {}) {
        try {
            this.showLoading();
            
            // Verificar se deve criar novo projeto
            if (params.action === 'create') {
                this.showProjetoModal();
                return;
            }

            // Carregar projetos
            await this.loadProjetos();
            
            // Renderizar página
            this.render();
            
            // Configurar listeners para atualizações em tempo real
            this.setupRealtimeListeners();
            
        } catch (error) {
            console.error('Erro ao carregar projetos:', error);
            Utils.showMessage('Erro ao carregar projetos', 'error');
        }
    }

    showLoading() {
        document.getElementById('pageContent').innerHTML = `
            <div class="loading">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Carregando projetos...</span>
                </div>
            </div>
        `;
    }

    async loadProjetos() {
        try {
            this.projetos = await databaseManager.getProjetos({ ativo: true });
        } catch (error) {
            console.error('Erro ao carregar projetos:', error);
            throw error;
        }
    }

    render() {
        const content = `
            <div class="row mb-3">
                <div class="col-md-6">
                    <div class="input-group">
                        <input type="text" class="form-control" id="searchProjetos" 
                               placeholder="Pesquisar por código ou descrição...">
                        <button class="btn btn-outline-secondary" type="button" id="clearSearchProjetos">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <div class="col-md-6 text-end">
                    ${authManager.hasPermission('criar') ? `
                        <button class="btn btn-primary" onclick="projetosPage.showProjetoModal()">
                            <i class="fas fa-plus me-2"></i>Novo Projeto
                        </button>
                    ` : ''}
                </div>
            </div>

            <div class="card shadow">
                <div class="card-header py-3">
                    <h6 class="m-0 font-weight-bold text-primary">Lista de Projetos</h6>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive" style="max-height: 70vh; overflow-y: auto;">
                        <table class="table table-bordered table-hover mb-0" id="projetosTable">
                            <thead class="table-dark sticky-top">
                                <tr>
                                    <th style="min-width: 100px;">Código</th>
                                    <th style="min-width: 200px;">Descrição</th>
                                    <th style="min-width: 120px;">Cliente</th>
                                    <th style="min-width: 120px;">Status</th>
                                    <th style="min-width: 120px;">Data Início</th>
                                    <th style="min-width: 120px;">Data Fim</th>
                                    <th style="min-width: 150px;">Observações</th>
                                    <th style="min-width: 100px;">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.renderProjetosTable()}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('pageContent').innerHTML = content;
        this.setupEventListeners();
        document.getElementById('pageTitle').textContent = 'Projetos';
        
        // Buscar botões de ação da página
        const pageActions = document.getElementById('pageActions');
        if (pageActions) {
            pageActions.innerHTML = authManager.hasPermission('criar') ? `
                <button class="btn btn-primary" onclick="projetosPage.showProjetoModal()">
                    <i class="fas fa-plus me-2"></i>Novo Projeto
                </button>
            ` : '';
        }
    }

    renderProjetosTable() {
        if (this.projetos.length === 0) {
            return `
                <tr>
                    <td colspan="8" class="text-center py-4">
                        <i class="fas fa-project-diagram fa-3x text-muted mb-3"></i>
                        <p class="text-muted">Nenhum projeto encontrado</p>
                    </td>
                </tr>
            `;
        }

        return this.projetos.map(projeto => {
            const statusConfig = this.getStatusConfig(projeto.status);
            
            return `
                <tr>
                    <td>${projeto.codigo || '-'}</td>
                    <td>${projeto.descricao || '-'}</td>
                    <td>${projeto.cliente || '-'}</td>
                    <td>
                        <span class="badge bg-${statusConfig.class}">
                            ${statusConfig.label}
                        </span>
                    </td>
                    <td>${projeto.data_inicio ? Utils.formatDate(projeto.data_inicio) : '-'}</td>
                    <td>${projeto.data_fim ? Utils.formatDate(projeto.data_fim) : '-'}</td>
                    <td>
                        <small>${projeto.observacoes || '-'}</small>
                    </td>
                    <td class="text-center">
                        <div class="btn-group" role="group">
                            <button type="button" class="btn btn-outline-info btn-sm" 
                                    onclick="projetosPage.viewProjeto('${projeto.id}')" 
                                    title="Visualizar">
                                <i class="fas fa-eye"></i>
                            </button>
                            ${authManager.hasPermission('editar') ? `
                            <button type="button" class="btn btn-outline-warning btn-sm" 
                                    onclick="projetosPage.editProjeto('${projeto.id}')" 
                                    title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            ` : ''}
                            ${authManager.isAdmin() ? `
                            <button type="button" class="btn btn-outline-danger btn-sm" 
                                    onclick="projetosPage.deleteProjeto('${projeto.id}')" 
                                    title="Excluir">
                                <i class="fas fa-trash"></i>
                            </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    getStatusConfig(status) {
        const configs = {
            'ATIVO': { class: 'success', label: 'Ativo' },
            'PAUSADO': { class: 'warning', label: 'Pausado' },
            'CONCLUIDO': { class: 'info', label: 'Concluído' },
            'CANCELADO': { class: 'danger', label: 'Cancelado' }
        };
        
        return configs[status] || { class: 'secondary', label: status || 'Não definido' };
    }

    setupEventListeners() {
        // Pesquisa em tempo real
        const searchInput = document.getElementById('searchProjetos');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce(() => {
                this.filterProjetos(searchInput.value);
            }, 300));
        }

        // Botão limpar pesquisa
        const clearBtn = document.getElementById('clearSearchProjetos');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                document.getElementById('searchProjetos').value = '';
                this.filterProjetos('');
            });
        }
    }

    filterProjetos(searchTerm) {
        const table = document.getElementById('projetosTable');
        if (!table) return;

        const rows = table.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
        const term = searchTerm.toLowerCase();

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const cells = row.getElementsByTagName('td');
            let found = false;

            if (cells.length > 1) {
                // Buscar no código e descrição
                const codigo = cells[0].textContent.toLowerCase();
                const descricao = cells[1].textContent.toLowerCase();
                
                if (codigo.includes(term) || descricao.includes(term)) {
                    found = true;
                }
            }

            row.style.display = found ? '' : 'none';
        }
    }

    setupRealtimeListeners() {
        // Limpar listeners anteriores
        this.listeners.forEach(unsubscribe => unsubscribe());

        // Listener para projetos (simulado, já que não temos listener específico)
        const projetosListener = () => {
            // Simular listener - em produção, usar databaseManager.onProjetosChange
        };

        this.listeners = [projetosListener];
    }

    updateTable() {
        const tbody = document.querySelector('#projetosTable tbody');
        if (tbody) {
            tbody.innerHTML = this.renderProjetosTable();
        }
    }

    // Modal de projeto
    showProjetoModal(projetoId = null) {
        if (projetoId) {
            this.loadProjetoForEdit(projetoId);
        } else {
            this.renderProjetoModal();
        }
    }

    async loadProjetoForEdit(projetoId) {
        try {
            const projeto = await databaseManager.getProjeto(projetoId);
            if (projeto) {
                this.renderProjetoModal(projeto);
            }
        } catch (error) {
            console.error('Erro ao carregar projeto:', error);
            Utils.showMessage('Erro ao carregar projeto', 'error');
        }
    }

    renderProjetoModal(projeto = null) {
        const isEdit = projeto !== null;
        const title = isEdit ? 'Editar Projeto' : 'Novo Projeto';
        
        const content = `
            <form id="projetoForm">
                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="codigo" class="form-label">Código *</label>
                            <input type="text" class="form-control" id="codigo" required 
                                   value="${projeto ? projeto.codigo : ''}">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="descricao" class="form-label">Descrição *</label>
                            <input type="text" class="form-control" id="descricao" required 
                                   value="${projeto ? projeto.descricao : ''}">
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="cliente" class="form-label">Cliente</label>
                            <input type="text" class="form-control" id="cliente" 
                                   value="${projeto ? projeto.cliente : ''}">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="status" class="form-label">Status</label>
                            <select class="form-control" id="status">
                                <option value="ATIVO" ${projeto && projeto.status === 'ATIVO' ? 'selected' : ''}>Ativo</option>
                                <option value="PAUSADO" ${projeto && projeto.status === 'PAUSADO' ? 'selected' : ''}>Pausado</option>
                                <option value="CONCLUIDO" ${projeto && projeto.status === 'CONCLUIDO' ? 'selected' : ''}>Concluído</option>
                                <option value="CANCELADO" ${projeto && projeto.status === 'CANCELADO' ? 'selected' : ''}>Cancelado</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="data_inicio" class="form-label">Data de Início</label>
                            <input type="date" class="form-control" id="data_inicio" 
                                   value="${projeto && projeto.data_inicio ? this.formatDateForInput(projeto.data_inicio) : ''}">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="data_fim" class="form-label">Data de Fim</label>
                            <input type="date" class="form-control" id="data_fim" 
                                   value="${projeto && projeto.data_fim ? this.formatDateForInput(projeto.data_fim) : ''}">
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-12">
                        <div class="mb-3">
                            <label for="observacoes" class="form-label">Observações</label>
                            <textarea class="form-control" id="observacoes" rows="3">${projeto ? projeto.observacoes : ''}</textarea>
                        </div>
                    </div>
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
                action: `projetosPage.${isEdit ? 'updateProjeto' : 'saveProjeto'}('${projeto ? projeto.id : ''}')`
            }
        ];

        Utils.showModal(title, content, actions);
    }

    formatDateForInput(date) {
        if (!date) return '';
        
        const d = date.toDate ? date.toDate() : new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    }

    async saveProjeto() {
        try {
            if (!Utils.validateForm('projetoForm')) {
                Utils.showMessage('Por favor, preencha todos os campos obrigatórios', 'warning');
                return;
            }

            const projetoData = {
                codigo: document.getElementById('codigo').value.trim(),
                descricao: document.getElementById('descricao').value.trim(),
                cliente: document.getElementById('cliente').value.trim() || null,
                status: document.getElementById('status').value || 'ATIVO',
                data_inicio: document.getElementById('data_inicio').value ? 
                    new Date(document.getElementById('data_inicio').value + 'T00:00:00') : null,
                data_fim: document.getElementById('data_fim').value ? 
                    new Date(document.getElementById('data_fim').value + 'T00:00:00') : null,
                observacoes: document.getElementById('observacoes').value.trim() || null
            };

            await databaseManager.addProjeto(projetoData);
            Utils.showMessage('Projeto criado com sucesso!', 'success');
            
            // Recarregar página
            await this.loadProjetos();
            this.updateTable();
            
        } catch (error) {
            console.error('Erro ao salvar projeto:', error);
            Utils.showMessage('Erro ao salvar projeto', 'error');
        }
    }

    async updateProjeto(projetoId) {
        try {
            if (!Utils.validateForm('projetoForm')) {
                Utils.showMessage('Por favor, preencha todos os campos obrigatórios', 'warning');
                return;
            }

            const projetoData = {
                codigo: document.getElementById('codigo').value.trim(),
                descricao: document.getElementById('descricao').value.trim(),
                cliente: document.getElementById('cliente').value.trim() || null,
                status: document.getElementById('status').value || 'ATIVO',
                data_inicio: document.getElementById('data_inicio').value ? 
                    new Date(document.getElementById('data_inicio').value + 'T00:00:00') : null,
                data_fim: document.getElementById('data_fim').value ? 
                    new Date(document.getElementById('data_fim').value + 'T00:00:00') : null,
                observacoes: document.getElementById('observacoes').value.trim() || null
            };

            await databaseManager.updateProjeto(projetoId, projetoData);
            Utils.showMessage('Projeto atualizado com sucesso!', 'success');
            
            // Recarregar página
            await this.loadProjetos();
            this.updateTable();
            
        } catch (error) {
            console.error('Erro ao atualizar projeto:', error);
            Utils.showMessage('Erro ao atualizar projeto', 'error');
        }
    }

    async deleteProjeto(projetoId) {
        try {
            const confirmed = await Utils.confirm(
                'Confirmar Exclusão',
                'Tem certeza que deseja excluir este projeto?'
            );

            if (confirmed) {
                await databaseManager.updateProjeto(projetoId, { ativo: false });
                Utils.showMessage('Projeto excluído com sucesso!', 'success');
                
                // Recarregar página
                await this.loadProjetos();
                this.updateTable();
            }
        } catch (error) {
            console.error('Erro ao excluir projeto:', error);
            Utils.showMessage('Erro ao excluir projeto', 'error');
        }
    }

    viewProjeto(projetoId) {
        const projeto = this.projetos.find(p => p.id === projetoId);
        if (!projeto) return;

        const statusConfig = this.getStatusConfig(projeto.status);

        const content = `
            <div class="row">
                <div class="col-md-6">
                    <p><strong>Código:</strong> ${projeto.codigo}</p>
                    <p><strong>Descrição:</strong> ${projeto.descricao}</p>
                    <p><strong>Cliente:</strong> ${projeto.cliente || '-'}</p>
                </div>
                <div class="col-md-6">
                    <p><strong>Status:</strong> 
                        <span class="badge bg-${statusConfig.class}">
                            ${statusConfig.label}
                        </span>
                    </p>
                    <p><strong>Data Início:</strong> ${projeto.data_inicio ? Utils.formatDate(projeto.data_inicio) : '-'}</p>
                    <p><strong>Data Fim:</strong> ${projeto.data_fim ? Utils.formatDate(projeto.data_fim) : '-'}</p>
                </div>
            </div>
            ${projeto.observacoes ? `<p><strong>Observações:</strong> ${projeto.observacoes}</p>` : ''}
        `;

        Utils.showModal('Detalhes do Projeto', content, [
            { text: 'Fechar', class: 'secondary' }
        ]);
    }

    editProjeto(projetoId) {
        this.showProjetoModal(projetoId);
    }

    unload() {
        // Limpar listeners quando sair da página
        this.listeners.forEach(unsubscribe => unsubscribe());
        this.listeners = [];
    }
}

// Inicializar página de projetos
const projetosPage = new ProjetosPage();

// Exportar para uso global
window.ProjetosPage = ProjetosPage;
window.projetosPage = projetosPage;
