// Página de Retrabalho do Sistema de Qualidade
// Custo médio da hora de produção (R$) - valor padrão para cálculo de custo do retrabalho
const CUSTO_HORA_MEDIO = 10.28;

class RetrabalhoPage {
    constructor() {
        this.retrabalhos = [];
        this.currentFilters = {};
        this.listeners = [];
    }

    async load(params = {}) {
        try {
            this.showLoading();
            
            // Verificar se deve criar novo retrabalho
            if (params.action === 'create') {
                this.showRetrabalhoModal();
                return;
            }

            // Carregar retrabalhos
            await this.loadRetrabalhos();
            
            // Renderizar página
            this.render();
            
            // Configurar listeners para atualizações em tempo real
            this.setupRealtimeListeners();
            
        } catch (error) {
            console.error('Erro ao carregar retrabalhos:', error);
            Utils.showMessage('Erro ao carregar retrabalhos', 'error');
        }
    }

    showLoading() {
        document.getElementById('pageContent').innerHTML = `
            <div class="loading">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Carregando retrabalhos...</span>
                </div>
            </div>
        `;
    }

    async loadRetrabalhos() {
        try {
            this.retrabalhos = await databaseManager.getRetrabalhos(this.currentFilters);
        } catch (error) {
            console.error('Erro ao carregar retrabalhos:', error);
            throw error;
        }
    }

    render() {
        const content = `
            <!-- Filtros -->
            <div class="row mb-3">
                <div class="col-md-3">
                    <select class="form-control" id="filterStatus">
                        <option value="">Todos os Status</option>
                        <option value="PENDENTE">Pendente</option>
                        <option value="EM_ANDAMENTO">Em Andamento</option>
                        <option value="CONCLUIDO">Concluído</option>
                        <option value="CANCELADO">Cancelado</option>
                    </select>
                </div>
                <div class="col-md-3">
                    <input type="text" class="form-control" id="filterProduto" placeholder="Filtrar por produto">
                </div>
                <div class="col-md-3">
                    <input type="text" class="form-control" id="filterResponsavel" placeholder="Filtrar por responsável">
                </div>
                <div class="col-md-3">
                    <button class="btn btn-outline-secondary w-100" onclick="retrabalhoPage.clearFilters()">
                        <i class="fas fa-times me-2"></i>Limpar Filtros
                    </button>
                </div>
            </div>

            <!-- Tabela de Retrabalhos -->
            <div class="card shadow">
                <div class="card-header py-3">
                    <h6 class="m-0 font-weight-bold text-primary">Controle de Retrabalho</h6>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive" style="max-height: 70vh; overflow-y: auto;">
                        <table class="table table-bordered table-hover mb-0" id="retrabalhosTable">
                            <thead class="table-dark sticky-top">
                                <tr>
                                    <th style="min-width: 120px;">Número</th>
                                    <th style="min-width: 100px;">Data</th>
                                    <th style="min-width: 200px;">Produto</th>
                                    <th style="min-width: 150px;">Responsável</th>
                                    <th style="min-width: 100px;">Qtd Itens</th>
                                    <th style="min-width: 120px;">Status</th>
                                    <th style="min-width: 100px;">Prioridade</th>
                                    <th style="min-width: 120px;">Prazo</th>
                                    <th style="min-width: 100px;">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.renderRetrabalhosTable()}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('pageContent').innerHTML = content;
        this.setupFilters();
        document.getElementById('pageTitle').textContent = 'Retrabalho';
        
        // Buscar botões de ação da página
        const pageActions = document.getElementById('pageActions');
        if (pageActions) {
            pageActions.innerHTML = `
                <button class="btn btn-warning" onclick="showRetrabalhoModal()">
                    <i class="fas fa-tools me-2"></i>Novo Retrabalho
                </button>
            `;
        }
    }

    renderRetrabalhosTable() {
        if (this.retrabalhos.length === 0) {
            return `
                <tr>
                    <td colspan="9" class="text-center py-4">
                        <i class="fas fa-tools fa-3x text-muted mb-3"></i>
                        <p class="text-muted">Nenhum retrabalho encontrado</p>
                    </td>
                </tr>
            `;
        }

        return this.retrabalhos.map(retrabalho => {
            const canEdit = authManager.canEditRetrabalho(retrabalho);
            const canDelete = authManager.canDeleteRetrabalho(retrabalho);
            
            return `
            <tr>
                <td>
                    <strong>${retrabalho.numero || 'N/A'}</strong>
                </td>
                <td>${Utils.formatDate(retrabalho.data_criacao)}</td>
                <td>
                    <div class="fw-bold">${retrabalho.produto || 'N/A'}</div>
                    <small class="text-muted">${retrabalho.cod_item || ''}</small>
                </td>
                <td>
                    <div class="fw-bold">${retrabalho.responsavel_nome || 'N/A'}</div>
                    <small class="text-muted">${retrabalho.setor || ''}</small>
                </td>
                <td class="text-end">${Utils.formatNumber(retrabalho.qtd_itens || 0, 0)}</td>
                <td>
                    <span class="badge bg-${Utils.getStatusClass(retrabalho.status)}">
                        ${Utils.formatStatus(retrabalho.status)}
                    </span>
                </td>
                <td>
                    <span class="badge bg-${this.getPrioridadeClass(retrabalho.prioridade)}">
                        ${retrabalho.prioridade || 'Normal'}
                    </span>
                </td>
                <td>
                    ${retrabalho.prazo ? Utils.formatDate(retrabalho.prazo) : '-'}
                    ${this.isPrazoVencido(retrabalho.prazo) ? '<br><small class="text-danger">Vencido</small>' : ''}
                </td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-info" onclick="retrabalhoPage.viewRetrabalho('${retrabalho.id}')" title="Visualizar">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${canEdit ? `
                            <button class="btn btn-sm btn-outline-primary" onclick="retrabalhoPage.editRetrabalho('${retrabalho.id}')" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                        ` : ''}
                        ${canDelete ? `
                            <button class="btn btn-sm btn-outline-danger" onclick="retrabalhoPage.deleteRetrabalho('${retrabalho.id}')" title="Excluir">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
            `;
        }).join('');
    }

    getPrioridadeClass(prioridade) {
        const classes = {
            'Alta': 'danger',
            'Média': 'warning',
            'Normal': 'info',
            'Baixa': 'secondary'
        };
        return classes[prioridade] || 'info';
    }

    isPrazoVencido(prazo) {
        if (!prazo) return false;
        const prazoDate = prazo.toDate ? prazo.toDate() : new Date(prazo);
        return prazoDate < new Date();
    }

    setupFilters() {
        // Adicionar event listeners para filtros
        const filterInputs = ['filterStatus', 'filterProduto', 'filterResponsavel'];
        
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
            status: document.getElementById('filterStatus')?.value || '',
            produto: document.getElementById('filterProduto')?.value || '',
            responsavel: document.getElementById('filterResponsavel')?.value || ''
        };

        this.currentFilters = filters;
        this.loadRetrabalhos().then(() => {
            this.updateTable();
        });
    }

    clearFilters() {
        document.getElementById('filterStatus').value = '';
        document.getElementById('filterProduto').value = '';
        document.getElementById('filterResponsavel').value = '';
        
        this.currentFilters = {};
        this.loadRetrabalhos().then(() => {
            this.updateTable();
        });
    }

    updateTable() {
        const tbody = document.querySelector('#retrabalhosTable tbody');
        if (tbody) {
            tbody.innerHTML = this.renderRetrabalhosTable();
        }
    }

    // Modal de retrabalho
    showRetrabalhoModal(retrabalhoId = null) {
        if (retrabalhoId) {
            this.loadRetrabalhoForEdit(retrabalhoId);
        } else {
            this.renderRetrabalhoModal();
        }
    }

    async loadRetrabalhoForEdit(retrabalhoId) {
        try {
            const retrabalho = this.retrabalhos.find(r => r.id === retrabalhoId);
            if (retrabalho) {
                this.renderRetrabalhoModal(retrabalho);
            } else {
                Utils.showMessage('Retrabalho não encontrado', 'error');
            }
        } catch (error) {
            console.error('Erro ao carregar retrabalho:', error);
            Utils.showMessage('Erro ao carregar retrabalho', 'error');
        }
    }

    async renderRetrabalhoModal(retrabalho = null) {
        const isEdit = retrabalho !== null;
        const title = isEdit ? 'Editar Retrabalho' : 'Novo Retrabalho';
        
        const content = `
            <form id="retrabalhoForm">
                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="data_criacao" class="form-label">Data *</label>
                            <input type="date" class="form-control" id="data_criacao" required 
                                   value="${retrabalho ? retrabalho.data_criacao : Utils.formatDate(new Date()).split('/').reverse().join('-')}">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="numero" class="form-label">Número do Retrabalho</label>
                            <input type="text" class="form-control" id="numero" readonly
                                   value="${retrabalho ? retrabalho.numero : 'Será gerado automaticamente'}">
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="produto" class="form-label">Produto *</label>
                            <input type="text" class="form-control" id="produto" required 
                                   value="${retrabalho ? retrabalho.produto : ''}"
                                   placeholder="Ex: Esquadria de Alumínio">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="cod_item" class="form-label">Código do Item</label>
                            <input type="text" class="form-control" id="cod_item" 
                                   value="${retrabalho ? retrabalho.cod_item : ''}"
                                   placeholder="Ex: ALU001">
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="qtd_itens" class="form-label">Quantidade de Itens *</label>
                            <input type="number" class="form-control" id="qtd_itens" required 
                                   value="${retrabalho ? retrabalho.qtd_itens : ''}"
                                   min="1">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="prioridade" class="form-label">Prioridade *</label>
                            <select class="form-control" id="prioridade" required>
                                <option value="">Selecione...</option>
                                <option value="Alta" ${retrabalho && retrabalho.prioridade === 'Alta' ? 'selected' : ''}>Alta</option>
                                <option value="Média" ${retrabalho && retrabalho.prioridade === 'Média' ? 'selected' : ''}>Média</option>
                                <option value="Normal" ${retrabalho && retrabalho.prioridade === 'Normal' ? 'selected' : ''}>Normal</option>
                                <option value="Baixa" ${retrabalho && retrabalho.prioridade === 'Baixa' ? 'selected' : ''}>Baixa</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="setor" class="form-label">Setor Responsável *</label>
                            <input type="text" class="form-control" id="setor" required 
                                   value="${retrabalho ? retrabalho.setor : ''}"
                                   placeholder="Ex: Produção, Qualidade">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="prazo" class="form-label">Prazo</label>
                            <input type="date" class="form-control" id="prazo" 
                                   value="${retrabalho ? retrabalho.prazo : ''}">
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="status" class="form-label">Status *</label>
                            <select class="form-control" id="status" required>
                                <option value="PENDENTE" ${retrabalho && retrabalho.status === 'PENDENTE' ? 'selected' : ''}>Pendente</option>
                                <option value="EM_ANDAMENTO" ${retrabalho && retrabalho.status === 'EM_ANDAMENTO' ? 'selected' : ''}>Em Andamento</option>
                                <option value="CONCLUIDO" ${retrabalho && retrabalho.status === 'CONCLUIDO' ? 'selected' : ''}>Concluído</option>
                                <option value="CANCELADO" ${retrabalho && retrabalho.status === 'CANCELADO' ? 'selected' : ''}>Cancelado</option>
                            </select>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="custo_hora_media" class="form-label">Custo por hora (R$) – valor médio</label>
                            <input type="number" class="form-control" id="custo_hora_media" 
                                   value="${(retrabalho && (retrabalho.custo_hora_media !== undefined && retrabalho.custo_hora_media !== null && retrabalho.custo_hora_media !== '')) ? retrabalho.custo_hora_media : CUSTO_HORA_MEDIO}"
                                   step="0.01" min="0" placeholder="${CUSTO_HORA_MEDIO}">
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="custo_estimado" class="form-label">Custo total estimado (R$)</label>
                            <input type="number" class="form-control" id="custo_estimado" 
                                   value="${retrabalho ? retrabalho.custo_estimado : ''}"
                                   step="0.01" min="0" title="Pode ser preenchido manualmente ou calculado (hora-homem × custo/hora)">
                        </div>
                    </div>
                </div>

                <div class="mb-3">
                    <label for="descricao_problema" class="form-label">Descrição do Problema *</label>
                    <textarea class="form-control" id="descricao_problema" rows="3" required 
                              placeholder="Descreva o problema que necessita retrabalho...">${retrabalho ? retrabalho.descricao_problema : ''}</textarea>
                </div>

                <div class="mb-3">
                    <label for="acoes_corretivas" class="form-label">Ações Corretivas</label>
                    <textarea class="form-control" id="acoes_corretivas" rows="3" 
                              placeholder="Descreva as ações que serão tomadas para corrigir o problema...">${retrabalho ? retrabalho.acoes_corretivas : ''}</textarea>
                </div>

                <div class="mb-3">
                    <label for="observacoes" class="form-label">Observações</label>
                    <textarea class="form-control" id="observacoes" rows="2" 
                              placeholder="Observações adicionais...">${retrabalho ? retrabalho.observacoes : ''}</textarea>
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
                onclick: isEdit ? `retrabalhoPage.saveRetrabalhoUpdate('${retrabalho.id}')` : 'retrabalhoPage.saveRetrabalho()'
            }
        ];

        Utils.showModal(title, content, actions);
    }

    async saveRetrabalho() {
        try {
            if (!Utils.validateForm('retrabalhoForm')) {
                Utils.showMessage('Por favor, preencha todos os campos obrigatórios', 'warning');
                return;
            }

            const custoHoraMedia = parseFloat(document.getElementById('custo_hora_media').value) || CUSTO_HORA_MEDIO;
            const retrabalhoData = {
                data_criacao: document.getElementById('data_criacao').value,
                produto: document.getElementById('produto').value,
                cod_item: document.getElementById('cod_item').value || null,
                qtd_itens: parseInt(document.getElementById('qtd_itens').value),
                prioridade: document.getElementById('prioridade').value,
                setor: document.getElementById('setor').value,
                prazo: document.getElementById('prazo').value || null,
                status: document.getElementById('status').value,
                custo_hora_media: custoHoraMedia,
                custo_estimado: parseFloat(document.getElementById('custo_estimado').value) || null,
                descricao_problema: document.getElementById('descricao_problema').value,
                acoes_corretivas: document.getElementById('acoes_corretivas').value.trim() || null,
                observacoes: document.getElementById('observacoes').value.trim() || null
            };

            // Gerar número do retrabalho
            const ano = new Date().getFullYear();
            const mes = String(new Date().getMonth() + 1).padStart(2, '0');
            const total = this.retrabalhos.length + 1;
            retrabalhoData.numero = `RT${ano}${mes}${String(total).padStart(3, '0')}`;

            await databaseManager.addRetrabalho(retrabalhoData);
            Utils.showMessage('Retrabalho salvo com sucesso!', 'success');
            
            // Recarregar página
            await this.loadRetrabalhos();
            this.updateTable();
            
        } catch (error) {
            console.error('Erro ao salvar retrabalho:', error);
            Utils.showMessage('Erro ao salvar retrabalho', 'error');
        }
    }

    async saveRetrabalhoUpdate(retrabalhoId) {
        try {
            if (!Utils.validateForm('retrabalhoForm')) {
                Utils.showMessage('Por favor, preencha todos os campos obrigatórios', 'warning');
                return;
            }

            const custoHoraMedia = parseFloat(document.getElementById('custo_hora_media').value) || CUSTO_HORA_MEDIO;
            const retrabalhoData = {
                data_criacao: document.getElementById('data_criacao').value,
                produto: document.getElementById('produto').value,
                cod_item: document.getElementById('cod_item').value || null,
                qtd_itens: parseInt(document.getElementById('qtd_itens').value),
                prioridade: document.getElementById('prioridade').value,
                setor: document.getElementById('setor').value,
                prazo: document.getElementById('prazo').value || null,
                status: document.getElementById('status').value,
                custo_hora_media: custoHoraMedia,
                custo_estimado: parseFloat(document.getElementById('custo_estimado').value) || null,
                descricao_problema: document.getElementById('descricao_problema').value,
                acoes_corretivas: document.getElementById('acoes_corretivas').value.trim() || null,
                observacoes: document.getElementById('observacoes').value.trim() || null
            };

            await databaseManager.updateRetrabalho(retrabalhoId, retrabalhoData);
            Utils.showMessage('Retrabalho atualizado com sucesso!', 'success');
            
            // Recarregar página
            await this.loadRetrabalhos();
            this.updateTable();
            
        } catch (error) {
            console.error('Erro ao atualizar retrabalho:', error);
            Utils.showMessage('Erro ao atualizar retrabalho', 'error');
        }
    }

    async deleteRetrabalho(retrabalhoId) {
        const confirmed = await Utils.confirm(
            'Confirmar Exclusão',
            'Tem certeza que deseja excluir este retrabalho? Esta ação não pode ser desfeita.'
        );

        if (confirmed) {
            try {
                await databaseManager.deleteRetrabalho(retrabalhoId);
                Utils.showMessage('Retrabalho excluído com sucesso!', 'success');
                
                // Recarregar página
                await this.loadRetrabalhos();
                this.updateTable();
                
            } catch (error) {
                console.error('Erro ao excluir retrabalho:', error);
                Utils.showMessage('Erro ao excluir retrabalho', 'error');
            }
        }
    }

    viewRetrabalho(retrabalhoId) {
        const retrabalho = this.retrabalhos.find(r => r.id === retrabalhoId);
        if (!retrabalho) {
            Utils.showMessage('Retrabalho não encontrado', 'error');
            return;
        }

        // Implementar visualização detalhada
        Utils.showMessage('Funcionalidade de visualização será implementada', 'info');
    }

    editRetrabalho(retrabalhoId) {
        this.showRetrabalhoModal(retrabalhoId);
    }

    setupRealtimeListeners() {
        // Listener para retrabalhos
        const unsubscribe = databaseManager.setupRetrabalhosListener((retrabalhos) => {
            this.retrabalhos = retrabalhos;
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

// Inicializar página de retrabalho
const retrabalhoPage = new RetrabalhoPage();

// Exportar para uso global
window.RetrabalhoPage = RetrabalhoPage;
window.retrabalhoPage = retrabalhoPage;

// Exportar funções específicas para uso em onclick
window.showRetrabalhoModal = () => retrabalhoPage.showRetrabalhoModal();
window.saveRetrabalho = () => retrabalhoPage.saveRetrabalho();
window.saveRetrabalhoUpdate = (id) => retrabalhoPage.saveRetrabalhoUpdate(id);
window.editRetrabalho = (id) => retrabalhoPage.editRetrabalho(id);
window.deleteRetrabalho = (id) => retrabalhoPage.deleteRetrabalho(id);
window.viewRetrabalho = (id) => retrabalhoPage.viewRetrabalho(id);
window.updateStatus = (id) => retrabalhoPage.updateStatus(id);
