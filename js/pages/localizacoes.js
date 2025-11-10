// Página de Localizações
class LocalizacoesPage {
    constructor() {
        this.localizacoes = [];
        this.currentFilters = {};
        this.listeners = [];
    }

    async load(params = {}) {
        try {
            this.showLoading();
            
            // Verificar se deve criar nova localização
            if (params.action === 'create') {
                this.showLocalizacaoModal();
                return;
            }

            // Carregar localizações
            await this.loadLocalizacoes();
            
            // Renderizar página
            this.render();
            
            // Configurar listeners para atualizações em tempo real
            this.setupRealtimeListeners();
            
        } catch (error) {
            console.error('Erro ao carregar localizações:', error);
            Utils.showMessage('Erro ao carregar localizações', 'error');
        }
    }

    showLoading() {
        document.getElementById('pageContent').innerHTML = `
            <div class="loading">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Carregando localizações...</span>
                </div>
            </div>
        `;
    }

    async loadLocalizacoes() {
        try {
            this.localizacoes = await databaseManager.getLocalizacoes({ ativo: true });
        } catch (error) {
            console.error('Erro ao carregar localizações:', error);
            throw error;
        }
    }

    render() {
        const content = `
            <div class="row mb-3">
                <div class="col-md-6">
                    <div class="input-group">
                        <input type="text" class="form-control" id="searchLocalizacoes" 
                               placeholder="Pesquisar por código ou descrição...">
                        <button class="btn btn-outline-secondary" type="button" id="clearSearchLocalizacoes">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <div class="col-md-6 text-end">
                    ${authManager.hasPermission('criar') ? `
                        <button class="btn btn-primary" onclick="localizacoesPage.showLocalizacaoModal()">
                            <i class="fas fa-plus me-2"></i>Nova Localização
                        </button>
                    ` : ''}
                </div>
            </div>

            <div class="card shadow">
                <div class="card-header py-3">
                    <h6 class="m-0 font-weight-bold text-primary">Lista de Localizações</h6>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive" style="max-height: 70vh; overflow-y: auto;">
                        <table class="table table-bordered table-hover mb-0" id="localizacoesTable">
                            <thead class="table-dark sticky-top">
                                <tr>
                                    <th style="min-width: 100px;">Código</th>
                                    <th style="min-width: 200px;">Descrição</th>
                                    <th style="min-width: 150px;">Endereço</th>
                                    <th style="min-width: 120px;">Responsável</th>
                                    <th style="min-width: 120px;">Telefone</th>
                                    <th style="min-width: 150px;">Observações</th>
                                    <th style="min-width: 100px;">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.renderLocalizacoesTable()}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('pageContent').innerHTML = content;
        this.setupEventListeners();
        document.getElementById('pageTitle').textContent = 'Localizações';
        
        // Buscar botões de ação da página
        const pageActions = document.getElementById('pageActions');
        if (pageActions) {
            pageActions.innerHTML = authManager.hasPermission('criar') ? `
                <button class="btn btn-primary" onclick="localizacoesPage.showLocalizacaoModal()">
                    <i class="fas fa-plus me-2"></i>Nova Localização
                </button>
            ` : '';
        }
    }

    renderLocalizacoesTable() {
        if (this.localizacoes.length === 0) {
            return `
                <tr>
                    <td colspan="7" class="text-center py-4">
                        <i class="fas fa-map-marker-alt fa-3x text-muted mb-3"></i>
                        <p class="text-muted">Nenhuma localização encontrada</p>
                    </td>
                </tr>
            `;
        }

        return this.localizacoes.map(local => `
            <tr>
                <td>${local.codigo || '-'}</td>
                <td>${local.descricao || '-'}</td>
                <td>${local.endereco || '-'}</td>
                <td>${local.responsavel || '-'}</td>
                <td>${local.telefone || '-'}</td>
                <td>
                    <small>${local.observacoes || '-'}</small>
                </td>
                <td class="text-center">
                    <div class="btn-group" role="group">
                        <button type="button" class="btn btn-outline-info btn-sm" 
                                onclick="localizacoesPage.viewLocalizacao('${local.id}')" 
                                title="Visualizar">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${authManager.hasPermission('editar') ? `
                        <button type="button" class="btn btn-outline-warning btn-sm" 
                                onclick="localizacoesPage.editLocalizacao('${local.id}')" 
                                title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        ` : ''}
                        ${authManager.isAdmin() ? `
                        <button type="button" class="btn btn-outline-danger btn-sm" 
                                onclick="localizacoesPage.deleteLocalizacao('${local.id}')" 
                                title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    }

    setupEventListeners() {
        // Pesquisa em tempo real
        const searchInput = document.getElementById('searchLocalizacoes');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce(() => {
                this.filterLocalizacoes(searchInput.value);
            }, 300));
        }

        // Botão limpar pesquisa
        const clearBtn = document.getElementById('clearSearchLocalizacoes');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                document.getElementById('searchLocalizacoes').value = '';
                this.filterLocalizacoes('');
            });
        }
    }

    filterLocalizacoes(searchTerm) {
        const table = document.getElementById('localizacoesTable');
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

        // Listener para localizações (simulado, já que não temos listener específico)
        // Em um sistema real, você implementaria onLocalizacoesChange no databaseManager
        const localizacoesListener = () => {
            // Simular listener - em produção, usar databaseManager.onLocalizacoesChange
            // Por enquanto, recarregamos manualmente quando necessário
        };

        this.listeners = [localizacoesListener];
    }

    updateTable() {
        const tbody = document.querySelector('#localizacoesTable tbody');
        if (tbody) {
            tbody.innerHTML = this.renderLocalizacoesTable();
        }
    }

    // Modal de localização
    showLocalizacaoModal(localizacaoId = null) {
        if (localizacaoId) {
            this.loadLocalizacaoForEdit(localizacaoId);
        } else {
            this.renderLocalizacaoModal();
        }
    }

    async loadLocalizacaoForEdit(localizacaoId) {
        try {
            const localizacao = await databaseManager.getLocalizacao(localizacaoId);
            if (localizacao) {
                this.renderLocalizacaoModal(localizacao);
            }
        } catch (error) {
            console.error('Erro ao carregar localização:', error);
            Utils.showMessage('Erro ao carregar localização', 'error');
        }
    }

    renderLocalizacaoModal(localizacao = null) {
        const isEdit = localizacao !== null;
        const title = isEdit ? 'Editar Localização' : 'Nova Localização';
        
        const content = `
            <form id="localizacaoForm">
                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="codigo" class="form-label">Código *</label>
                            <input type="text" class="form-control" id="codigo" required 
                                   value="${localizacao ? localizacao.codigo : ''}">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="descricao" class="form-label">Descrição *</label>
                            <input type="text" class="form-control" id="descricao" required 
                                   value="${localizacao ? localizacao.descricao : ''}">
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-12">
                        <div class="mb-3">
                            <label for="endereco" class="form-label">Endereço</label>
                            <input type="text" class="form-control" id="endereco" 
                                   value="${localizacao ? localizacao.endereco : ''}">
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="responsavel" class="form-label">Responsável</label>
                            <input type="text" class="form-control" id="responsavel" 
                                   value="${localizacao ? localizacao.responsavel : ''}">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="telefone" class="form-label">Telefone</label>
                            <input type="text" class="form-control" id="telefone" 
                                   value="${localizacao ? localizacao.telefone : ''}">
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-12">
                        <div class="mb-3">
                            <label for="observacoes" class="form-label">Observações</label>
                            <textarea class="form-control" id="observacoes" rows="3">${localizacao ? localizacao.observacoes : ''}</textarea>
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
                action: `localizacoesPage.${isEdit ? 'updateLocalizacao' : 'saveLocalizacao'}('${localizacao ? localizacao.id : ''}')`
            }
        ];

        Utils.showModal(title, content, actions);
    }

    async saveLocalizacao() {
        try {
            if (!Utils.validateForm('localizacaoForm')) {
                Utils.showMessage('Por favor, preencha todos os campos obrigatórios', 'warning');
                return;
            }

            const localizacaoData = {
                codigo: document.getElementById('codigo').value.trim(),
                descricao: document.getElementById('descricao').value.trim(),
                endereco: document.getElementById('endereco').value.trim() || null,
                responsavel: document.getElementById('responsavel').value.trim() || null,
                telefone: document.getElementById('telefone').value.trim() || null,
                observacoes: document.getElementById('observacoes').value.trim() || null
            };

            await databaseManager.addLocalizacao(localizacaoData);
            Utils.showMessage('Localização criada com sucesso!', 'success');
            
            // Recarregar página
            await this.loadLocalizacoes();
            this.updateTable();
            
        } catch (error) {
            console.error('Erro ao salvar localização:', error);
            Utils.showMessage('Erro ao salvar localização', 'error');
        }
    }

    async updateLocalizacao(localizacaoId) {
        try {
            if (!Utils.validateForm('localizacaoForm')) {
                Utils.showMessage('Por favor, preencha todos os campos obrigatórios', 'warning');
                return;
            }

            const localizacaoData = {
                codigo: document.getElementById('codigo').value.trim(),
                descricao: document.getElementById('descricao').value.trim(),
                endereco: document.getElementById('endereco').value.trim() || null,
                responsavel: document.getElementById('responsavel').value.trim() || null,
                telefone: document.getElementById('telefone').value.trim() || null,
                observacoes: document.getElementById('observacoes').value.trim() || null
            };

            await databaseManager.updateLocalizacao(localizacaoId, localizacaoData);
            Utils.showMessage('Localização atualizada com sucesso!', 'success');
            
            // Recarregar página
            await this.loadLocalizacoes();
            this.updateTable();
            
        } catch (error) {
            console.error('Erro ao atualizar localização:', error);
            Utils.showMessage('Erro ao atualizar localização', 'error');
        }
    }

    async deleteLocalizacao(localizacaoId) {
        try {
            const confirmed = await Utils.confirm(
                'Confirmar Exclusão',
                'Tem certeza que deseja excluir esta localização?'
            );

            if (confirmed) {
                await databaseManager.updateLocalizacao(localizacaoId, { ativo: false });
                Utils.showMessage('Localização excluída com sucesso!', 'success');
                
                // Recarregar página
                await this.loadLocalizacoes();
                this.updateTable();
            }
        } catch (error) {
            console.error('Erro ao excluir localização:', error);
            Utils.showMessage('Erro ao excluir localização', 'error');
        }
    }

    viewLocalizacao(localizacaoId) {
        const localizacao = this.localizacoes.find(l => l.id === localizacaoId);
        if (!localizacao) return;

        const content = `
            <div class="row">
                <div class="col-md-6">
                    <p><strong>Código:</strong> ${localizacao.codigo}</p>
                    <p><strong>Descrição:</strong> ${localizacao.descricao}</p>
                    <p><strong>Endereço:</strong> ${localizacao.endereco || '-'}</p>
                </div>
                <div class="col-md-6">
                    <p><strong>Responsável:</strong> ${localizacao.responsavel || '-'}</p>
                    <p><strong>Telefone:</strong> ${localizacao.telefone || '-'}</p>
                </div>
            </div>
            ${localizacao.observacoes ? `<p><strong>Observações:</strong> ${localizacao.observacoes}</p>` : ''}
        `;

        Utils.showModal('Detalhes da Localização', content, [
            { text: 'Fechar', class: 'secondary' }
        ]);
    }

    editLocalizacao(localizacaoId) {
        this.showLocalizacaoModal(localizacaoId);
    }

    unload() {
        // Limpar listeners quando sair da página
        this.listeners.forEach(unsubscribe => unsubscribe());
        this.listeners = [];
    }
}

// Inicializar página de localizações
const localizacoesPage = new LocalizacoesPage();

// Exportar para uso global
window.LocalizacoesPage = LocalizacoesPage;
window.localizacoesPage = localizacoesPage;
