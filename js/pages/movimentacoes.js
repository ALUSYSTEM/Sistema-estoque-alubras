// Página de Movimentações
class MovimentacoesPage {
    constructor() {
        this.movimentacoes = [];
        this.currentFilters = {};
        this.listeners = [];
    }

    async load(params = {}) {
        try {
            this.showLoading();
            
            // Verificar se deve criar nova movimentação
            if (params.action === 'create') {
                this.showMovimentacaoModal();
                return;
            }

            // Carregar movimentações
            await this.loadMovimentacoes();
            
            // Renderizar página
            this.render();
            
            // Configurar listeners para atualizações em tempo real
            this.setupRealtimeListeners();
            
        } catch (error) {
            console.error('Erro ao carregar movimentações:', error);
            Utils.showMessage('Erro ao carregar movimentações', 'error');
        }
    }

    showLoading() {
        document.getElementById('pageContent').innerHTML = `
            <div class="loading">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Carregando movimentações...</span>
                </div>
            </div>
        `;
    }

    async loadMovimentacoes() {
        try {
            console.log('Carregando movimentações com filtros:', this.currentFilters);
            this.movimentacoes = await databaseManager.getMovimentacoes(this.currentFilters);
            console.log('Movimentações carregadas do banco:', this.movimentacoes.length);
            
            // Log detalhado das movimentações para debug
            if (this.movimentacoes.length > 0) {
                console.log('=== DEBUG CARREGAMENTO MOVIMENTAÇÕES ===');
                console.log('Total de movimentações:', this.movimentacoes.length);
                
                // Verificar campos específicos nas primeiras 3 movimentações
                this.movimentacoes.slice(0, 3).forEach((mov, index) => {
                    console.log(`Movimentação ${index + 1}:`);
                    console.log('  - ID:', mov.id);
                    console.log('  - Lote:', mov.lote, '(tipo:', typeof mov.lote, ')');
                    console.log('  - Projeto:', mov.projeto, '(tipo:', typeof mov.projeto, ')');
                    console.log('  - Variante:', mov.variante, '(tipo:', typeof mov.variante, ')');
                    console.log('  - Tamanho:', mov.tamanho, '(tipo:', typeof mov.tamanho, ')');
                    console.log('  - Tipo Movimento:', mov.tipo_movimento, '(tipo:', typeof mov.tipo_movimento, ')');
                    console.log('  - LIB:', mov.lib, '(tipo:', typeof mov.lib, ')');
                    console.log('  - Destino:', mov.destino, '(tipo:', typeof mov.destino, ')');
                    console.log('  - Data Vencimento:', mov.data_vencimento, '(tipo:', typeof mov.data_vencimento, ')');
                    console.log('  - Observações:', mov.observacoes, '(tipo:', typeof mov.observacoes, ')');
                    console.log('  - Objeto completo:', mov);
                });
                console.log('==========================================');
            }
        } catch (error) {
            console.error('Erro ao carregar movimentações:', error);
            throw error;
        }
    }

    render() {
        const content = `
            ${authManager.hasPermission('editar') ? `
            <div class="alert alert-info alert-dismissible fade show" role="alert">
                <i class="fas fa-info-circle me-2"></i>
                <strong>Edição de Movimentações:</strong>
                ${authManager.isAdmin() ? 
                    'Você é administrador e pode editar qualquer movimentação.' : 
                    'Você pode editar movimentações dos últimos 30 dias. Movimentações mais antigas são protegidas por questões de auditoria.'
                }
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
            ` : ''}
            
            <!-- Filtros -->
            <div class="row mb-3">
                <div class="col-md-3">
                    <select class="form-select" id="filtroTipo">
                        <option value="">Todos os tipos</option>
                        <option value="ENTRADA">Apenas Entradas</option>
                        <option value="SAIDA">Apenas Saídas</option>
                    </select>
                </div>
                <div class="col-md-6">
                    <div class="input-group">
                        <input type="text" class="form-control" id="searchMovimentacoes" 
                               placeholder="Pesquisar por produto...">
                        <button class="btn btn-outline-secondary" type="button" id="clearSearchMovimentacoes">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <div class="col-md-3 text-end">
                    <div class="btn-group" role="group">
                        <button class="btn btn-success" onclick="movimentacoesPage.showImportModal()" title="Importar do Excel">
                            <i class="fas fa-file-excel me-2"></i>Importar Excel
                        </button>
                        <button class="btn btn-primary" onclick="movimentacoesPage.showMovimentacaoModal()">
                            <i class="fas fa-plus me-2"></i>Nova Movimentação
                        </button>
                    </div>
                </div>
            </div>

            <!-- Tabela de Movimentações -->
            <div class="card shadow">
                <div class="card-header py-3">
                    <h6 class="m-0 font-weight-bold text-primary">Histórico de Movimentações</h6>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive" style="max-height: 70vh; overflow-y: auto;">
                        <table class="table table-bordered table-hover mb-0" id="movimentacoesTable">
                            <thead class="table-dark sticky-top">
                                <tr>
                                    <th style="min-width: 120px;">Data</th>
                                    <th style="min-width: 80px;">Tipo</th>
                                    <th style="min-width: 200px;">Produto</th>
                                    <th style="min-width: 100px;">Quantidade</th>
                                    <th style="min-width: 120px;">Variante</th>
                                    <th style="min-width: 100px;">Tamanho</th>
                                    <th style="min-width: 100px;">Lote</th>
                                    <th style="min-width: 150px;">Localização</th>
                                    <th style="min-width: 150px;">Projeto</th>
                                    <th style="min-width: 120px;">Data Vencimento</th>
                                    <th style="min-width: 120px;">Tipo Movimento</th>
                                    <th style="min-width: 80px;">LIB</th>
                                    <th style="min-width: 120px;">Destino</th>
                                    <th style="min-width: 150px;">Observações</th>
                                    <th style="min-width: 120px;">Usuário</th>
                                    <th style="min-width: 100px;">Ações</th>
                                </tr>
                                <tr class="table-light">
                                    <th>
                                        <input type="date" class="form-control form-control-sm" id="filter-data" placeholder="Filtrar data">
                                    </th>
                                    <th>
                                        <select class="form-control form-control-sm" id="filter-tipo">
                                            <option value="">Todos</option>
                                            <option value="ENTRADA">Entrada</option>
                                            <option value="SAIDA">Saída</option>
                                        </select>
                                    </th>
                                    <th>
                                        <input type="text" class="form-control form-control-sm" id="filter-produto" placeholder="Filtrar produto">
                                    </th>
                                    <th>
                                        <input type="number" class="form-control form-control-sm" id="filter-quantidade" placeholder="Qtd">
                                    </th>
                                    <th>
                                        <input type="text" class="form-control form-control-sm" id="filter-variante" placeholder="Filtrar variante">
                                    </th>
                                    <th>
                                        <input type="text" class="form-control form-control-sm" id="filter-tamanho" placeholder="Filtrar tamanho">
                                    </th>
                                    <th>
                                        <input type="text" class="form-control form-control-sm" id="filter-lote" placeholder="Filtrar lote">
                                    </th>
                                    <th>
                                        <select class="form-control form-control-sm" id="filter-localizacao">
                                            <option value="">Todas</option>
                                        </select>
                                    </th>
                                    <th>
                                        <select class="form-control form-control-sm" id="filter-projeto">
                                            <option value="">Todos</option>
                                        </select>
                                    </th>
                                    <th>
                                        <input type="date" class="form-control form-control-sm" id="filter-vencimento" placeholder="Vencimento">
                                    </th>
                                    <th>
                                        <select class="form-control form-control-sm" id="filter-tipo-movimento">
                                            <option value="">Todos</option>
                                            <option value="Compra">Compra</option>
                                            <option value="Venda">Venda</option>
                                            <option value="Produção">Produção</option>
                                            <option value="Transferência">Transferência</option>
                                            <option value="Ajuste">Ajuste</option>
                                            <option value="Perda">Perda</option>
                                            <option value="Outro">Outro</option>
                                        </select>
                                    </th>
                                    <th>
                                        <select class="form-control form-control-sm" id="filter-lib">
                                            <option value="">Todos</option>
                                            <option value="Sim">Sim</option>
                                            <option value="Não">Não</option>
                                        </select>
                                    </th>
                                    <th>
                                        <input type="text" class="form-control form-control-sm" id="filter-destino" placeholder="Filtrar destino">
                                    </th>
                                    <th>
                                        <input type="text" class="form-control form-control-sm" id="filter-observacoes" placeholder="Filtrar obs">
                                    </th>
                                    <th>
                                        <input type="text" class="form-control form-control-sm" id="filter-usuario" placeholder="Filtrar usuário">
                                    </th>
                                    <th>
                                        <button class="btn btn-sm btn-outline-secondary" onclick="movimentacoesPage.clearFilters()" title="Limpar filtros">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.renderMovimentacoesTable()}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('pageContent').innerHTML = content;
        this.setupEventListeners();
        this.setupFilters();
        document.getElementById('pageTitle').textContent = 'Movimentações';
        
        // Buscar botões de ação da página
        const pageActions = document.getElementById('pageActions');
        if (pageActions) {
            pageActions.innerHTML = `
                <div class="btn-group" role="group">
                    <button class="btn btn-success" onclick="movimentacoesPage.showImportModal()" title="Importar do Excel">
                        <i class="fas fa-file-excel me-2"></i>Importar Excel
                    </button>
                    <button class="btn btn-primary" onclick="movimentacoesPage.showMovimentacaoModal()">
                        <i class="fas fa-plus me-2"></i>Nova Movimentação
                    </button>
                    <button class="btn btn-danger" onclick="movimentacoesPage.showClearAllModal()" title="Limpar todas as movimentações">
                        <i class="fas fa-trash-alt me-2"></i>Limpar Tudo
                    </button>
                </div>
            `;
        }
    }

    renderMovimentacoesTable() {
        console.log('Renderizando tabela com', this.movimentacoes.length, 'movimentações');
        
        if (this.movimentacoes.length === 0) {
            console.log('Nenhuma movimentação para renderizar');
            return `
                <tr>
                    <td colspan="16" class="text-center py-4">
                        <i class="fas fa-exchange-alt fa-3x text-muted mb-3"></i>
                        <p class="text-muted">Nenhuma movimentação encontrada</p>
                    </td>
                </tr>
            `;
        }

        console.log('Renderizando', this.movimentacoes.length, 'linhas de movimentações');

        return this.movimentacoes.map(mov => {
            const canEdit = this.canEditMovimentacao(mov);
            const hasEditPermission = authManager.hasPermission('editar');
            const isAdmin = authManager.isAdmin();
            
            // Debug: Log dos dados da movimentação
            console.log('=== DEBUG MOVIMENTAÇÃO ===');
            console.log('ID:', mov.id);
            console.log('Lote:', mov.lote);
            console.log('Projeto:', mov.projeto);
            console.log('Variante:', mov.variante);
            console.log('Tamanho:', mov.tamanho);
            console.log('Tipo Movimento:', mov.tipo_movimento);
            console.log('LIB:', mov.lib);
            console.log('Destino:', mov.destino);
            console.log('Data Vencimento:', mov.data_vencimento);
            console.log('Observações:', mov.observacoes);
            console.log('========================');
            
            return `
            <tr>
                <td>${Utils.formatDate(mov.data, true)}</td>
                <td>
                    <span class="badge bg-${mov.entrada_saida === 'ENTRADA' ? 'success' : 'danger'}">
                        ${mov.entrada_saida === 'ENTRADA' ? 'Entrada' : 'Saída'}
                    </span>
                </td>
                <td>
                    <strong>${mov.produto?.codigo || 'N/A'}</strong><br>
                    <small>${mov.produto?.descricao || 'N/A'}</small>
                </td>
                <td>
                    <span class="badge bg-primary">
                        ${Utils.formatNumber(mov.quantidade || 0, 2)}
                    </span>
                </td>
                <td>${mov.variante || '-'}</td>
                <td>${mov.tamanho || '-'}</td>
                <td>${mov.lote || '-'}</td>
                <td>${mov.localizacao?.codigo || '-'}</td>
                <td>${mov.projeto?.codigo || '-'}</td>
                <td>
                    ${mov.data_vencimento ? Utils.formatDate(mov.data_vencimento) : '-'}
                </td>
                <td>
                    <span class="badge bg-info">${mov.tipo_movimento || '-'}</span>
                </td>
                <td>
                    <span class="badge bg-${mov.lib === 'Sim' ? 'success' : 'secondary'}">${mov.lib || '-'}</span>
                </td>
                <td>
                    <small>${mov.destino || '-'}</small>
                </td>
                <td>
                    <small>${mov.observacoes || '-'}</small>
                </td>
                <td>
                    <small>${mov.usuario_nome || 'Sistema'}</small>
                </td>
                <td class="text-center">
                    <div class="btn-group" role="group">
                        <button type="button" class="btn btn-outline-info btn-sm" 
                                onclick="movimentacoesPage.viewMovimentacao('${mov.id}')" 
                                title="Visualizar">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${canEdit ? `
                        <button type="button" class="btn btn-outline-warning btn-sm edit-mov-btn" 
                                data-mov-id="${mov.id}"
                                title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        ` : hasEditPermission ? `
                        <button type="button" class="btn btn-outline-secondary btn-sm disabled" 
                                title="Não é possível editar movimentações antigas (mais de 30 dias)">
                            <i class="fas fa-lock"></i>
                        </button>
                        ` : ''}
                        ${isAdmin ? `
                        <button type="button" class="btn btn-outline-danger btn-sm" 
                                onclick="movimentacoesPage.deleteMovimentacao('${mov.id}')" 
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

    setupEventListeners() {
        // Pesquisa em tempo real
        const searchInput = document.getElementById('searchMovimentacoes');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce(() => {
                this.filterMovimentacoes(searchInput.value);
            }, 300));
        }

        // Botão limpar pesquisa
        const clearBtn = document.getElementById('clearSearchMovimentacoes');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                document.getElementById('searchMovimentacoes').value = '';
                this.filterMovimentacoes('');
            });
        }

        // Filtro por tipo
        const filtroTipo = document.getElementById('filtroTipo');
        if (filtroTipo) {
            filtroTipo.addEventListener('change', () => {
                this.currentFilters.entrada_saida = filtroTipo.value || null;
                this.load();
            });
        }

        // Event listener para botões de edição (usando event delegation)
        document.addEventListener('click', (e) => {
            if (e.target.closest('.edit-mov-btn')) {
                const button = e.target.closest('.edit-mov-btn');
                const movId = button.getAttribute('data-mov-id');
                if (movId) {
                    this.editMovimentacao(movId);
                }
            }
        });
    }

    filterMovimentacoes(searchTerm) {
        const table = document.getElementById('movimentacoesTable');
        if (!table) return;

        const rows = table.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
        const term = searchTerm.toLowerCase();

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const cells = row.getElementsByTagName('td');
            let found = false;

            if (cells.length > 2) {
                // Buscar no produto (terceira célula)
                const produtoText = cells[2].textContent.toLowerCase();
                if (produtoText.includes(term)) {
                    found = true;
                }
            }

            row.style.display = found ? '' : 'none';
        }
    }

    setupRealtimeListeners() {
        // Limpar listeners anteriores
        this.listeners.forEach(unsubscribe => unsubscribe());

        // Listener para movimentações
        const movimentacoesListener = databaseManager.onMovimentacoesChange(async () => {
            await this.loadMovimentacoes();
            this.updateTable();
        });

        this.listeners = [movimentacoesListener];
    }

    updateTable() {
        console.log('Atualizando tabela de movimentações...');
        console.log('Movimentações disponíveis:', this.movimentacoes.length);
        
        const tbody = document.querySelector('#movimentacoesTable tbody');
        if (tbody) {
            tbody.innerHTML = this.renderMovimentacoesTable();
            console.log('Tabela atualizada com', this.movimentacoes.length, 'movimentações');
        } else {
            console.error('Elemento tbody não encontrado para atualizar tabela');
        }
    }

    // Modal de movimentação
    showMovimentacaoModal(movimentacaoId = null) {
        if (movimentacaoId) {
            this.loadMovimentacaoForEdit(movimentacaoId);
        } else {
            this.renderMovimentacaoModal();
        }
    }

    async loadMovimentacaoForEdit(movimentacaoId) {
        try {
            console.log('Buscando movimentação para edição:', movimentacaoId);
            console.log('Movimentações disponíveis:', this.movimentacoes.length);
            
            // Buscar movimentação específica
            const movimentacao = this.movimentacoes.find(m => m.id === movimentacaoId);
            if (movimentacao) {
                console.log('Movimentação encontrada:', movimentacao);
                this.renderMovimentacaoModal(movimentacao);
            } else {
                console.error('Movimentação não encontrada:', movimentacaoId);
                Utils.showMessage('Movimentação não encontrada', 'error');
            }
        } catch (error) {
            console.error('Erro ao carregar movimentação:', error);
            Utils.showMessage('Erro ao carregar movimentação', 'error');
        }
    }

    async renderMovimentacaoModal(movimentacao = null) {
        const isEdit = movimentacao !== null;
        const title = isEdit ? 'Editar Movimentação' : 'Nova Movimentação';
        
        // Carregar dados necessários
        const [produtos, localizacoes, projetos] = await Promise.all([
            databaseManager.getProdutos({ ativo: true }),
            databaseManager.getLocalizacoes({ ativo: true }),
            databaseManager.getProjetos({ ativo: true })
        ]);
        
        const content = `
            <form id="movimentacaoForm">
                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="data" class="form-label">Data *</label>
                            <input type="datetime-local" class="form-control" id="data" required 
                                   value="${movimentacao ? this.formatDateTimeForInput(movimentacao.data) : this.formatDateTimeForInput(new Date())}">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="entrada_saida" class="form-label">Tipo *</label>
                            <select class="form-control" id="entrada_saida" required>
                                <option value="">Selecione...</option>
                                <option value="ENTRADA" ${movimentacao && movimentacao.entrada_saida === 'ENTRADA' ? 'selected' : ''}>Entrada</option>
                                <option value="SAIDA" ${movimentacao && movimentacao.entrada_saida === 'SAIDA' ? 'selected' : ''}>Saída</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-12">
                        <div class="mb-3">
                            <label for="produto_id" class="form-label">Produto *</label>
                            <select class="form-control" id="produto_id" required>
                                <option value="">Selecione um produto...</option>
                                ${produtos.map(p => `
                                    <option value="${p.id}" ${movimentacao && movimentacao.produto_id === p.id ? 'selected' : ''}>
                                        ${p.codigo} - ${p.descricao}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="quantidade" class="form-label">Quantidade *</label>
                            <input type="number" class="form-control" id="quantidade" required min="0.01" step="0.01" 
                                   value="${movimentacao ? movimentacao.quantidade : ''}">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="localizacao_id" class="form-label">Localização *</label>
                            <select class="form-control" id="localizacao_id" required>
                                <option value="">Selecione uma localização...</option>
                                ${localizacoes.map(l => `
                                    <option value="${l.id}" ${movimentacao && movimentacao.localizacao_id === l.id ? 'selected' : ''}>
                                        ${l.codigo} - ${l.descricao}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="projeto_id" class="form-label">Projeto</label>
                            <select class="form-control" id="projeto_id">
                                <option value="">Selecione um projeto...</option>
                                ${projetos.map(p => `
                                    <option value="${p.id}" ${movimentacao && movimentacao.projeto_id === p.id ? 'selected' : ''}>
                                        ${p.codigo} - ${p.descricao}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="lote" class="form-label">Lote</label>
                            <input type="text" class="form-control" id="lote" 
                                   value="${movimentacao ? movimentacao.lote : ''}">
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="variante" class="form-label">Variante</label>
                            <input type="text" class="form-control" id="variante" 
                                   value="${movimentacao ? movimentacao.variante : ''}">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="tamanho" class="form-label">Tamanho</label>
                            <input type="text" class="form-control" id="tamanho" 
                                   value="${movimentacao ? movimentacao.tamanho : ''}">
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="data_vencimento" class="form-label">Data de Vencimento</label>
                            <input type="date" class="form-control" id="data_vencimento" 
                                   value="${movimentacao && movimentacao.data_vencimento ? this.formatDateForInput(movimentacao.data_vencimento) : ''}">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="tipo_movimento" class="form-label">Tipo de Movimento</label>
                            <select class="form-control" id="tipo_movimento">
                                <option value="">Selecione...</option>
                                <option value="Compra" ${movimentacao && movimentacao.tipo_movimento === 'Compra' ? 'selected' : ''}>Compra</option>
                                <option value="Venda" ${movimentacao && movimentacao.tipo_movimento === 'Venda' ? 'selected' : ''}>Venda</option>
                                <option value="Produção" ${movimentacao && movimentacao.tipo_movimento === 'Produção' ? 'selected' : ''}>Produção</option>
                                <option value="Transferência" ${movimentacao && movimentacao.tipo_movimento === 'Transferência' ? 'selected' : ''}>Transferência</option>
                                <option value="Ajuste" ${movimentacao && movimentacao.tipo_movimento === 'Ajuste' ? 'selected' : ''}>Ajuste</option>
                                <option value="Perda" ${movimentacao && movimentacao.tipo_movimento === 'Perda' ? 'selected' : ''}>Perda</option>
                                <option value="Outro" ${movimentacao && movimentacao.tipo_movimento === 'Outro' ? 'selected' : ''}>Outro</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="lib" class="form-label">LIB</label>
                            <select class="form-control" id="lib">
                                <option value="">Selecione...</option>
                                <option value="Sim" ${movimentacao && movimentacao.lib === 'Sim' ? 'selected' : ''}>Sim</option>
                                <option value="Não" ${movimentacao && movimentacao.lib === 'Não' ? 'selected' : ''}>Não</option>
                            </select>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="destino" class="form-label">Destino</label>
                            <input type="text" class="form-control" id="destino" 
                                   value="${movimentacao ? movimentacao.destino : ''}"
                                   placeholder="Ex: Estoque Principal, Linha de Produção">
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-12">
                        <div class="mb-3">
                            <label for="observacoes" class="form-label">Observações</label>
                            <textarea class="form-control" id="observacoes" rows="3">${movimentacao ? movimentacao.observacoes : ''}</textarea>
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
                action: isEdit ? `movimentacoesPage.saveMovimentacaoUpdate('${movimentacao.id}')` : 'movimentacoesPage.saveMovimentacao()'
            }
        ];

        Utils.showModal(title, content, actions);
    }

    formatDateTimeForInput(date) {
        if (!date) return '';
        
        const d = date.toDate ? date.toDate() : new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    formatDateForInput(date) {
        if (!date) return '';
        
        const d = date.toDate ? date.toDate() : new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    }

    async saveMovimentacao() {
        try {
            if (!Utils.validateForm('movimentacaoForm')) {
                Utils.showMessage('Por favor, preencha todos os campos obrigatórios', 'warning');
                return;
            }

            const movimentacaoData = {
                data: new Date(document.getElementById('data').value),
                entrada_saida: document.getElementById('entrada_saida').value,
                produto_id: document.getElementById('produto_id').value,
                quantidade: parseFloat(document.getElementById('quantidade').value),
                localizacao_id: document.getElementById('localizacao_id').value,
                projeto_id: document.getElementById('projeto_id').value || null,
                lote: document.getElementById('lote').value.trim() || null,
                variante: document.getElementById('variante').value.trim() || null,
                tamanho: document.getElementById('tamanho').value.trim() || null,
                data_vencimento: document.getElementById('data_vencimento').value ? 
                    new Date(document.getElementById('data_vencimento').value) : null,
                tipo_movimento: document.getElementById('tipo_movimento').value.trim() || null,
                lib: document.getElementById('lib').value.trim() || null,
                destino: document.getElementById('destino').value.trim() || null,
                observacoes: document.getElementById('observacoes').value.trim() || null,
                usuario_nome: window.currentUserData ? window.currentUserData.nome : 'Sistema'
            };

            await databaseManager.addMovimentacao(movimentacaoData);
            Utils.showMessage('Movimentação criada com sucesso!', 'success');
            
            // Recarregar página
            await this.loadMovimentacoes();
            this.updateTable();
            
        } catch (error) {
            console.error('Erro ao salvar movimentação:', error);
            Utils.showMessage('Erro ao salvar movimentação', 'error');
        }
    }

    canEditMovimentacao(movimentacao) {
        // Verificar se o usuário tem permissão para editar
        if (!authManager.hasPermission('editar')) {
            return false;
        }
        
        // Permitir edição apenas para admin ou se a movimentação for recente (últimos 30 dias)
        if (authManager.isAdmin()) {
            return true;
        }
        
        // Verificar se a movimentação é recente (últimos 30 dias)
        const agora = new Date();
        const dataMovimentacao = new Date(movimentacao.data);
        const diasDiferenca = (agora - dataMovimentacao) / (1000 * 60 * 60 * 24);
        
        return diasDiferenca <= 30;
    }

    async updateMovimentacao(movimentacaoId) {
        console.log('updateMovimentacao chamada com ID:', movimentacaoId);
        console.log('Movimentações carregadas:', this.movimentacoes.length);
        console.log('IDs das movimentações:', this.movimentacoes.map(m => m.id));
        
        // Garantir que as movimentações estão carregadas
        if (this.movimentacoes.length === 0) {
            console.log('Movimentações não carregadas, tentando recarregar...');
            await this.loadMovimentacoes();
        }
        
        const movimentacao = this.movimentacoes.find(m => m.id === movimentacaoId);
        if (!movimentacao) {
            console.error('Movimentação não encontrada com ID:', movimentacaoId);
            console.log('Movimentações disponíveis:', this.movimentacoes);
            Utils.showMessage('Movimentação não encontrada. Tente recarregar a página.', 'error');
            return;
        }
        
        // Verificar se pode editar
        if (!this.canEditMovimentacao(movimentacao)) {
            if (!authManager.hasPermission('editar')) {
                Utils.showMessage('Você não tem permissão para editar movimentações', 'warning');
            } else {
                Utils.showMessage('Esta movimentação não pode ser editada por questões de auditoria (mais de 30 dias)', 'warning');
            }
            return;
        }
        
        // Mostrar aviso sobre impacto no estoque usando modal adequado
        const confirmacao = await Utils.confirm(
            'Confirmar Edição de Movimentação',
            'ATENÇÃO: Editar esta movimentação irá recalcular automaticamente o estoque.<br><br>' +
            'Isso pode afetar:<br>' +
            '• Quantidades em estoque<br>' +
            '• Histórico de movimentação<br><br>' +
            'Tem certeza que deseja continuar?'
        );
        
        if (!confirmacao) {
            return;
        }
        
        // Abrir modal de edição
        try {
            await this.loadMovimentacaoForEdit(movimentacaoId);
        } catch (error) {
            console.error('Erro ao carregar movimentação para edição:', error);
            Utils.showMessage('Erro ao carregar movimentação', 'error');
        }
    }

    async saveMovimentacaoUpdate(movimentacaoId) {
        try {
            if (!Utils.validateForm('movimentacaoForm')) {
                Utils.showMessage('Por favor, preencha todos os campos obrigatórios', 'warning');
                return;
            }

            const movimentacaoOriginal = this.movimentacoes.find(m => m.id === movimentacaoId);
            if (!movimentacaoOriginal) {
                Utils.showMessage('Movimentação original não encontrada', 'error');
                return;
            }

            const movimentacaoData = {
                data: new Date(document.getElementById('data').value),
                entrada_saida: document.getElementById('entrada_saida').value,
                produto_id: document.getElementById('produto_id').value,
                quantidade: parseFloat(document.getElementById('quantidade').value),
                localizacao_id: document.getElementById('localizacao_id').value,
                projeto_id: document.getElementById('projeto_id').value || null,
                lote: document.getElementById('lote').value.trim() || null,
                variante: document.getElementById('variante').value.trim() || null,
                tamanho: document.getElementById('tamanho').value.trim() || null,
                data_vencimento: document.getElementById('data_vencimento').value ? new Date(document.getElementById('data_vencimento').value) : null,
                tipo_movimento: document.getElementById('tipo_movimento').value.trim() || null,
                lib: document.getElementById('lib').value.trim() || null,
                destino: document.getElementById('destino').value.trim() || null,
                observacoes: document.getElementById('observacoes').value.trim() || null,
                usuario_atualizacao: authManager.currentUser?.uid || null
            };

            await databaseManager.updateMovimentacao(movimentacaoId, movimentacaoData, movimentacaoOriginal);
            Utils.showMessage('Movimentação atualizada com sucesso!', 'success');
            
            // Recarregar página
            await this.loadMovimentacoes();
            this.updateTable();
            
            // Fechar modal
            const modal = document.querySelector('.modal');
            if (modal) {
                const modalInstance = bootstrap.Modal.getInstance(modal);
                if (modalInstance) {
                    modalInstance.hide();
                }
            }
            
        } catch (error) {
            console.error('Erro ao atualizar movimentação:', error);
            Utils.showMessage('Erro ao atualizar movimentação: ' + error, 'error');
        }
    }

    deleteMovimentacao(movimentacaoId) {
        // Por segurança, não permitir exclusão de movimentações
        Utils.showMessage('Exclusão de movimentações não permitida por questões de auditoria', 'warning');
    }

    viewMovimentacao(movimentacaoId) {
        const movimentacao = this.movimentacoes.find(m => m.id === movimentacaoId);
        if (!movimentacao) return;

        const content = `
            <div class="row">
                <div class="col-md-6">
                    <p><strong>Data:</strong> ${Utils.formatDate(movimentacao.data, true)}</p>
                    <p><strong>Tipo:</strong> 
                        <span class="badge bg-${movimentacao.entrada_saida === 'ENTRADA' ? 'success' : 'danger'}">
                            ${movimentacao.entrada_saida === 'ENTRADA' ? 'Entrada' : 'Saída'}
                        </span>
                    </p>
                    <p><strong>Quantidade:</strong> ${Utils.formatNumber(movimentacao.quantidade, 2)}</p>
                </div>
                <div class="col-md-6">
                    <p><strong>Produto:</strong> ${movimentacao.produto?.codigo} - ${movimentacao.produto?.descricao}</p>
                    <p><strong>Localização:</strong> ${movimentacao.localizacao?.codigo}</p>
                    <p><strong>Projeto:</strong> ${movimentacao.projeto?.codigo || '-'}</p>
                </div>
            </div>
            ${movimentacao.observacoes ? `<p><strong>Observações:</strong> ${movimentacao.observacoes}</p>` : ''}
        `;

        Utils.showModal('Detalhes da Movimentação', content, [
            { text: 'Fechar', class: 'secondary' }
        ]);
    }

    editMovimentacao(movimentacaoId) {
        this.updateMovimentacao(movimentacaoId);
    }

    // Modal de importação Excel
    showImportModal() {
        const content = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i>
                <strong>Formato da Planilha:</strong><br>
                Colunas necessárias: DATA, CÓDIGO, DESCRIÇÃO, VARIANTE, TAMANHO, LOTE, DATA DE VENCIMENTO, QUANTIDADE, ENTRADA/SAÍDA, TIPO, PROJETO, LOCALIZAÇÃO, LIB, DESTINO<br>
                <small class="text-muted">
                    <i class="fas fa-magic me-1"></i>Produtos e localizações que não existem serão criados automaticamente!
                </small>
            </div>
            
            <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <label for="excelFile" class="form-label mb-0">Selecione o arquivo Excel (.xlsx)</label>
                    <button type="button" class="btn btn-outline-primary btn-sm" onclick="movimentacoesPage.downloadTemplate()">
                        <i class="fas fa-download me-1"></i>Baixar Planilha Exemplo
                    </button>
                </div>
                <input type="file" class="form-control" id="excelFile" accept=".xlsx,.xls" required>
                <div class="form-text">Formato aceito: Excel (.xlsx, .xls) - Use a planilha exemplo como base</div>
            </div>
            
            <div id="importPreview" class="mt-3" style="display: none;">
                <h6>Pré-visualização dos dados:</h6>
                <div class="table-responsive" style="max-height: 300px; overflow-y: auto;">
                    <table class="table table-sm table-bordered" id="previewTable">
                        <thead class="table-light">
                            <tr id="previewHeader"></tr>
                        </thead>
                        <tbody id="previewBody"></tbody>
                    </table>
                </div>
            </div>
        `;

        const actions = [
            {
                text: 'Cancelar',
                class: 'secondary'
            },
            {
                text: 'Importar',
                class: 'success',
                action: 'movimentacoesPage.processImport()'
            }
        ];

        Utils.showModal('Importar Movimentações do Excel', content, actions);
        
        // Configurar listener do arquivo
        const fileInput = document.getElementById('excelFile');
        fileInput.addEventListener('change', (e) => {
            this.previewExcelFile(e.target.files[0]);
        });
    }

    async downloadTemplate() {
        try {
            // Buscar dados reais para criar exemplos mais úteis
            const [produtos, localizacoes, projetos] = await Promise.all([
                databaseManager.getProdutos({ ativo: true }),
                databaseManager.getLocalizacoes({ ativo: true }),
                databaseManager.getProjetos({ ativo: true })
            ]);

            // Criar dados de exemplo baseados nos dados reais do sistema
            const hoje = new Date();
            const dataExemplo1 = new Date(hoje.getTime() - (24 * 60 * 60 * 1000)); // Ontem
            const dataExemplo2 = new Date(hoje.getTime() - (2 * 24 * 60 * 60 * 1000)); // 2 dias atrás

            const dadosExemplo = [
                // Cabeçalho - EXATAMENTE como na planilha original
                ['DATA', 'CÓDIGO', 'DESCRIÇÃO', 'VARIANTE', 'TAMANHO', 'LOTE', 'DATA DE VENCIMENTO', 'QUANTIDADE', 'ENTRADA/SAÍDA', 'TIPO', 'PROJETO', 'LOCALIZAÇÃO', 'LIB', 'DESTINO'],
                // Dados de exemplo - 14 colunas exatamente como na planilha original
                [
                    this.formatDateTimeForExcel(dataExemplo1),                                           // 0: DATA
                    produtos.length > 0 ? produtos[0].codigo : 'T-KP116',                               // 1: CÓDIGO
                    produtos.length > 0 ? produtos[0].descricao : 'PISTA PARA TRILHO CLICADO',          // 2: DESCRIÇÃO
                    'FOSCO',                                                                            // 3: VARIANTE
                    '6000',                                                                             // 4: TAMANHO
                    'LOTE-001',                                                                         // 5: LOTE
                    this.formatDateForExcel(new Date(hoje.getTime() + (30 * 24 * 60 * 60 * 1000))),     // 6: DATA DE VENCIMENTO
                    '100',                                                                              // 7: QUANTIDADE
                    'ENTRADA',                                                                          // 8: ENTRADA/SAÍDA
                    'CONTAGEM',                                                                         // 9: TIPO
                    projetos.length > 0 ? projetos[0].codigo : '1260 - CLARIS',                        // 10: PROJETO
                    localizacoes.length > 0 ? localizacoes[0].codigo : 'P-B07',                         // 11: LOCALIZAÇÃO
                    'L16',                                                                              // 12: LIB
                    'PRODUÇÃO'                                                                          // 13: DESTINO
                ],
                [
                    this.formatDateTimeForExcel(dataExemplo2),                                           // 0: DATA
                    produtos.length > 1 ? produtos[1].codigo : 'BROCAC9.64',                            // 1: CÓDIGO
                    produtos.length > 1 ? produtos[1].descricao : 'BROCA AÇO RÁPIDO 9/64',              // 2: DESCRIÇÃO
                    'PADRAO',                                                                           // 3: VARIANTE
                    '3000',                                                                             // 4: TAMANHO
                    'LOTE-002',                                                                         // 5: LOTE
                    '',                                                                                 // 6: DATA DE VENCIMENTO (vazio)
                    '50',                                                                               // 7: QUANTIDADE
                    'ENTRADA',                                                                          // 8: ENTRADA/SAÍDA
                    'MAT FÁBRICA',                                                                      // 9: TIPO
                    projetos.length > 1 ? projetos[1].codigo : '1100 - EXPANSO',                       // 10: PROJETO
                    localizacoes.length > 1 ? localizacoes[1].codigo : 'P-A05',                         // 11: LOCALIZAÇÃO
                    'L12',                                                                              // 12: LIB
                    'PRODUÇÃO'                                                                          // 13: DESTINO
                ],
                [
                    this.formatDateTimeForExcel(hoje),                                                  // 0: DATA
                    produtos.length > 0 ? produtos[0].codigo : 'T-KP116',                               // 1: CÓDIGO
                    produtos.length > 0 ? produtos[0].descricao : 'PISTA PARA TRILHO CLICADO',          // 2: DESCRIÇÃO
                    'FOSCO',                                                                            // 3: VARIANTE
                    '6000',                                                                             // 4: TAMANHO
                    'LOTE-001',                                                                         // 5: LOTE
                    '',                                                                                 // 6: DATA DE VENCIMENTO (vazio)
                    '25',                                                                               // 7: QUANTIDADE
                    'SAIDA',                                                                            // 8: ENTRADA/SAÍDA
                    'LIBERAÇÃO',                                                                        // 9: TIPO
                    projetos.length > 0 ? projetos[0].codigo : '1260 - CLARIS',                        // 10: PROJETO
                    localizacoes.length > 0 ? localizacoes[0].codigo : 'P-B07',                         // 11: LOCALIZAÇÃO
                    'L16',                                                                              // 12: LIB
                    'PRODUÇÃO'                                                                          // 13: DESTINO
                ]
            ];

            // Criar arquivo Excel
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(dadosExemplo);

            // Ajustar largura das colunas - 14 colunas exatamente como na planilha original
            const colWidths = [
                { wch: 20 }, // 0: DATA
                { wch: 15 }, // 1: CÓDIGO
                { wch: 35 }, // 2: DESCRIÇÃO
                { wch: 15 }, // 3: VARIANTE
                { wch: 12 }, // 4: TAMANHO
                { wch: 15 }, // 5: LOTE
                { wch: 18 }, // 6: DATA DE VENCIMENTO
                { wch: 12 }, // 7: QUANTIDADE
                { wch: 15 }, // 8: ENTRADA/SAÍDA
                { wch: 15 }, // 9: TIPO
                { wch: 20 }, // 10: PROJETO
                { wch: 15 }, // 11: LOCALIZAÇÃO
                { wch: 8 },  // 12: LIB
                { wch: 15 }  // 13: DESTINO
            ];
            ws['!cols'] = colWidths;

            XLSX.utils.book_append_sheet(wb, ws, 'Movimentações');

            // Gerar e baixar arquivo
            const filename = 'Movimentacoes_Exemplo.xlsx';
            XLSX.writeFile(wb, filename);

            Utils.showMessage('Planilha exemplo baixada com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao gerar planilha exemplo:', error);
            Utils.showMessage('Erro ao gerar planilha exemplo', 'error');
        }
    }

    formatDateTimeForExcel(date) {
        // Formatar data no formato Excel (YYYY-MM-DD HH:MM:SS)
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    formatDateForExcel(date) {
        // Formatar apenas data no formato Excel (YYYY-MM-DD)
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    }

    previewExcelFile(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                if (jsonData.length === 0) {
                    Utils.showMessage('Planilha vazia', 'warning');
                    return;
                }

                // Mostrar pré-visualização
                this.showPreview(jsonData);
            } catch (error) {
                console.error('Erro ao ler arquivo:', error);
                Utils.showMessage('Erro ao ler arquivo Excel', 'error');
            }
        };
        reader.readAsArrayBuffer(file);
    }

    showPreview(data) {
        const preview = document.getElementById('importPreview');
        const headerRow = document.getElementById('previewHeader');
        const body = document.getElementById('previewBody');

        if (data.length === 0) return;

        // Header
        const headers = data[0];
        headerRow.innerHTML = headers.map(h => `<th>${h || ''}</th>`).join('');

        // Body (primeiras 10 linhas)
        const rows = data.slice(1, 11);
        body.innerHTML = rows.map(row => `
            <tr>
                ${row.map(cell => `<td>${cell || ''}</td>`).join('')}
            </tr>
        `).join('');

        preview.style.display = 'block';
    }

    async processImport() {
        const fileInput = document.getElementById('excelFile');
        const file = fileInput.files[0];

        if (!file) {
            Utils.showMessage('Selecione um arquivo Excel', 'warning');
            return;
        }

        try {
            Utils.showMessage('Processando arquivo...', 'info');
            
            // Ler arquivo
            const data = await this.readExcelFile(file);
            
            if (data.length < 2) {
                Utils.showMessage('Planilha deve ter pelo menos uma linha de cabeçalho e uma linha de dados', 'warning');
                return;
            }

            // Processar dados
            const importResult = await this.processMovimentacoesData(data);
            
            // Fechar modal primeiro
            const modalElement = document.querySelector('.modal');
            if (modalElement) {
                const modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) modal.hide();
            }
            
            // Mostrar resultado da importação
            if (importResult.errors > 0) {
                // Se há erros, mostrar detalhes
                Utils.showMessage(`Importação concluída! ${importResult.message}`, 'warning');
                
                // Mostrar detalhes dos primeiros erros
                const errorDetails = importResult.errorMessages.slice(0, 5).join('\n');
                console.log('Detalhes dos primeiros erros:', errorDetails);
                
                // Criar modal com detalhes dos erros
                setTimeout(() => {
                    this.showImportErrorsModal(importResult);
                }, 1500);
            } else {
                Utils.showMessage(`Movimentações importadas com sucesso! ${importResult.message}`, 'success');
            }
            
            // Aguardar um pouco para garantir que o Firebase processou e então recarregar
            this.refreshDataAfterImport();
                    
        } catch (error) {
            console.error('Erro na importação:', error);
            Utils.showMessage(`Erro na importação: ${error.message}`, 'error');
        }
    }

    showImportErrorsModal(importResult) {
        const errorList = importResult.errorMessages.slice(0, 20).map((error, index) => 
            `<li class="text-danger">${error}</li>`
        ).join('');
        
        const moreErrors = importResult.errorMessages.length > 20 ? 
            `<li class="text-muted">... e mais ${importResult.errorMessages.length - 20} erros</li>` : '';

        const content = `
            <div class="alert alert-warning">
                <h6><i class="fas fa-exclamation-triangle me-2"></i>Erros durante a importação</h6>
                <p><strong>Resultado:</strong> ${importResult.imported} movimentações importadas, ${importResult.errors} erros</p>
            </div>
            
            <div class="mb-3">
                <h6>Principais erros encontrados:</h6>
                <div style="max-height: 300px; overflow-y: auto;">
                    <ul class="list-unstyled">
                        ${errorList}
                        ${moreErrors}
                    </ul>
                </div>
                <small class="text-muted">
                    Dica: Produtos e localizações que não existem no sistema são criados automaticamente durante a importação. 
                    Verifique se há problemas de formato nos dados (quantidades inválidas, datas incorretas, etc.).
                </small>
            </div>
        `;

        const actions = [
            {
                text: 'OK',
                class: 'primary'
            }
        ];

        Utils.showModal('Detalhes dos Erros de Importação', content, actions);
    }

    async refreshDataAfterImport() {
        console.log('Iniciando processo de atualização após importação...');
        
        // Múltiplas tentativas com delays crescentes
        const attempts = [1000, 3000, 5000];
        let success = false;
        
        for (let i = 0; i < attempts.length && !success; i++) {
            try {
                console.log(`Tentativa ${i + 1} de recarregamento após ${attempts[i]}ms...`);
                
                await new Promise(resolve => setTimeout(resolve, attempts[i]));
                
                // Limpar cache interno se necessário
                this.movimentacoes = [];
                
                // Recarregar dados
                await this.loadMovimentacoes();
                console.log(`Movimentações carregadas na tentativa ${i + 1}:`, this.movimentacoes.length);
                
                // Atualizar tabela
                this.updateTable();
                
                // Verificar se temos dados agora
                if (this.movimentacoes.length > 0) {
                    success = true;
                    console.log('✅ Dados atualizados com sucesso após importação');
                } else {
                    console.log(`⚠️ Tentativa ${i + 1} não retornou dados`);
                }
                
            } catch (error) {
                console.error(`Erro na tentativa ${i + 1}:`, error);
            }
        }
        
        if (!success) {
            console.warn('⚠️ Não foi possível recarregar os dados automaticamente. Tente recarregar a página.');
            Utils.showMessage('Importação concluída. Se os dados não apareceram, recarregue a página.', 'warning');
        }
    }

    readExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    console.log('Planilhas encontradas:', workbook.SheetNames);
                    
                    // Tentar encontrar a planilha certa
                    let worksheet = null;
                    let sheetName = workbook.SheetNames[0];
                    
                    // Procurar por planilha com dados
                    for (const name of workbook.SheetNames) {
                        worksheet = workbook.Sheets[name];
                        const testData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                        if (testData.length > 1 && testData[0].some(cell => cell)) {
                            sheetName = name;
                            console.log(`Usando planilha: ${sheetName}`);
                            break;
                        }
                    }
                    
                    if (!worksheet) {
                        worksheet = workbook.Sheets[sheetName];
                    }
                    
                    // Configurações diferentes de leitura
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
                        header: 1, 
                        defval: '', 
                        blankrows: false 
                    });
                    
                    console.log('Dados brutos da planilha:', jsonData);
                    
                    // Filtrar linhas vazias e encontrar a primeira linha com cabeçalhos
                    let startRow = 0;
                    for (let i = 0; i < jsonData.length; i++) {
                        const row = jsonData[i];
                        if (row && row.some(cell => cell && cell.toString().trim() !== '')) {
                            startRow = i;
                            break;
                        }
                    }
                    
                    const finalData = jsonData.slice(startRow);
                    console.log('Dados finais processados:', finalData);
                    
                    resolve(finalData);
                } catch (error) {
                    console.error('Erro ao processar arquivo Excel:', error);
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
            reader.readAsArrayBuffer(file);
        });
    }

    async processMovimentacoesData(data) {
        if (!data || data.length === 0) {
            throw new Error('Planilha está vazia ou não pôde ser lida');
        }

        // Carregar dados uma única vez para melhor performance
        console.log('Carregando dados de referência...');
        const [produtos, localizacoes, projetos] = await Promise.all([
            databaseManager.getProdutos({ ativo: true }),
            databaseManager.getLocalizacoes({ ativo: true }),
            databaseManager.getProjetos({ ativo: true })
        ]);
        
        console.log(`Carregados: ${produtos.length} produtos, ${localizacoes.length} localizações, ${projetos.length} projetos`);

        // Criar mapas para busca rápida por código
        const produtoMap = new Map();
        produtos.forEach(p => produtoMap.set(p.codigo.trim(), p));
        
        const localizacaoMap = new Map();
        localizacoes.forEach(l => localizacaoMap.set(l.codigo.trim(), l));
        
        const projetoMap = new Map();
        projetos.forEach(p => projetoMap.set(p.codigo.trim(), p));

        // Encontrar a primeira linha com cabeçalhos válidos
        let headerRow = 0;
        let headers = null;
        
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            if (row && row.some(cell => cell && cell.toString().trim() !== '')) {
                headers = row;
                headerRow = i;
                console.log(`Cabeçalhos encontrados na linha ${i + 1}:`, headers);
                break;
            }
        }

        if (!headers) {
            throw new Error('Não foi possível identificar os cabeçalhos da planilha');
        }

        const rows = data.slice(headerRow + 1);
        
        // Mapear colunas (buscar por nome similar)
        const columnMap = this.mapMovimentacoesColumns(headers);
        console.log('Mapeamento das colunas:', columnMap);
        
        // Verificar se temos pelo menos os campos básicos mapeados
        const requiredFields = ['data', 'produto', 'quantidade', 'localizacao'];
        const missingFields = requiredFields.filter(field => columnMap[field] === undefined);
        
        if (missingFields.length > 0) {
            console.error('Campos obrigatórios não encontrados:', missingFields);
            console.error('Headers disponíveis:', headers);
            console.error('Mapeamento atual:', columnMap);
            
            // Tentar criar um mapeamento básico se possível
            if (headers.length >= 4) {
                console.log('Tentando usar mapeamento básico por posição');
                columnMap.data = columnMap.data ?? 0;
                columnMap.tipo = columnMap.tipo ?? 1;
                columnMap.produto = columnMap.produto ?? 2;
                columnMap.quantidade = columnMap.quantidade ?? 3;
                columnMap.localizacao = columnMap.localizacao ?? (headers.length > 4 ? 4 : null);
                
                const stillMissing = requiredFields.filter(field => columnMap[field] === undefined || columnMap[field] === null);
                if (stillMissing.length > 0) {
                    throw new Error(`Campos obrigatórios ainda não encontrados: ${stillMissing.join(', ')}. Headers encontrados: ${headers.join(', ')}`);
                }
            } else {
                throw new Error(`Colunas obrigatórias não encontradas. Necessário: ${missingFields.join(', ')}. Headers encontrados: ${headers.join(', ')}`);
            }
        }
        
        let imported = 0;
        let errors = 0;
        const errorMessages = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            
            // Pular linhas vazias
            if (!row || row.every(cell => !cell || cell.toString().trim() === '')) {
                continue;
            }
            
            try {
                console.log(`Processando linha ${i + 2}:`, row);
                const movimentacaoData = await this.parseMovimentacaoRow(row, columnMap, produtoMap, localizacaoMap, projetoMap);
                
                if (movimentacaoData) {
                    console.log('Dados da movimentação:', movimentacaoData);
                    await databaseManager.addMovimentacao(movimentacaoData);
                    imported++;
                    console.log(`Movimentação ${imported} importada com sucesso`);
                } else {
                    console.warn(`Linha ${i + 2} ignorada - dados inválidos`);
                    errors++;
                    errorMessages.push(`Linha ${i + 2}: Dados inválidos ou produto/localização não encontrados`);
                }
            } catch (error) {
                console.error(`Erro na linha ${i + 2}:`, error, row);
                errors++;
                errorMessages.push(`Linha ${i + 2}: ${error.message}`);
            }
        }

        if (errors > 0) {
            console.log('Erros encontrados:', errorMessages);
        }

        const resultMessage = `${imported} movimentações importadas, ${errors} erros`;
        
        if (errors > 0) {
            console.log('Erros encontrados:', errorMessages);
            console.log('Primeiros 5 erros detalhados:', errorMessages.slice(0, 5));
        }
        
        console.log('Importação finalizada:', resultMessage);
        
        // Retornar tanto a mensagem quanto os detalhes dos erros
        return {
            message: resultMessage,
            imported: imported,
            errors: errors,
            errorMessages: errorMessages
        };
    }

    mapMovimentacoesColumns(headers) {
        const map = {};
        
        console.log('Mapeando headers:', headers);
        
        headers.forEach((header, index) => {
            if (!header) return;
            
            const h = header.toString().trim();
            const hLower = h.toLowerCase();
            console.log(`Analisando header [${index}]: "${h}"`);
            
            // Mapeamento baseado nos nomes exatos da planilha original (14 colunas)
            // Coluna 0: DATA
            if ((h === 'DATA' || hLower.includes('data')) && map.data === undefined) {
                map.data = index;
                console.log(`DATA mapeada para coluna ${index}`);
            }
            // Coluna 1: CÓDIGO
            else if ((h === 'CÓDIGO' || h === 'CODIGO' || hLower.includes('codigo')) && map.produto === undefined) {
                map.produto = index;
                console.log(`CÓDIGO mapeado para coluna ${index}`);
            }
            // Coluna 2: DESCRIÇÃO
            else if ((h === 'DESCRIÇÃO' || h === 'DESCRICAO' || hLower.includes('descricao')) && map.descricao === undefined) {
                map.descricao = index;
                console.log(`DESCRIÇÃO mapeada para coluna ${index}`);
            }
            // Coluna 3: VARIANTE
            else if ((h === 'VARIANTE' || hLower.includes('variante')) && map.variante === undefined) {
                map.variante = index;
                console.log(`VARIANTE mapeada para coluna ${index}`);
            }
            // Coluna 4: TAMANHO
            else if ((h === 'TAMANHO' || hLower.includes('tamanho')) && map.tamanho === undefined) {
                map.tamanho = index;
                console.log(`TAMANHO mapeado para coluna ${index}`);
            }
            // Coluna 5: LOTE
            else if ((h === 'LOTE' || hLower.includes('lote')) && map.lote === undefined) {
                map.lote = index;
                console.log(`LOTE mapeado para coluna ${index}`);
            }
            // Coluna 6: DATA DE VENCIMENTO
            else if ((h === 'DATA DE VENCIMENTO' || hLower.includes('vencimento')) && map.dataVencimento === undefined) {
                map.dataVencimento = index;
                console.log(`DATA DE VENCIMENTO mapeada para coluna ${index}`);
            }
            // Coluna 7: QUANTIDADE
            else if ((h === 'QUANTIDADE' || hLower.includes('quantidade') || hLower.includes('qtd')) && map.quantidade === undefined) {
                map.quantidade = index;
                console.log(`QUANTIDADE mapeada para coluna ${index}`);
            }
            // Coluna 8: ENTRADA/SAÍDA
            else if ((h === 'ENTRADA/SAÍDA' || h === 'ENTRADA/SAIDA' || hLower.includes('entrada') || hLower.includes('saida')) && map.tipo === undefined) {
                map.tipo = index;
                console.log(`ENTRADA/SAÍDA mapeado para coluna ${index}`);
            }
            // Coluna 9: TIPO
            else if ((h === 'TIPO' || hLower.includes('tipo')) && map.tipoMovimento === undefined) {
                map.tipoMovimento = index;
                console.log(`TIPO mapeado para coluna ${index}`);
            }
            // Coluna 10: PROJETO
            else if ((h === 'PROJETO' || hLower.includes('projeto')) && map.projeto === undefined) {
                map.projeto = index;
                console.log(`PROJETO mapeado para coluna ${index}`);
            }
            // Coluna 11: LOCALIZAÇÃO - ser mais específico para evitar conflitos
            else if ((h === 'LOCALIZAÇÃO' || h === 'LOCALIZACAO') && map.localizacao === undefined) {
                map.localizacao = index;
                console.log(`LOCALIZAÇÃO mapeada para coluna ${index}`);
            }
            else if ((hLower === 'localizacao' || hLower === 'localização') && map.localizacao === undefined) {
                map.localizacao = index;
                console.log(`LOCALIZAÇÃO (lowercase) mapeada para coluna ${index}`);
            }
            // Coluna 12: LIB
            else if ((h === 'LIB' || hLower.includes('lib')) && map.lib === undefined) {
                map.lib = index;
                console.log(`LIB mapeado para coluna ${index}`);
            }
            // Coluna 13: DESTINO
            else if ((h === 'DESTINO' || hLower.includes('destino')) && map.destino === undefined) {
                map.destino = index;
                console.log(`DESTINO mapeado para coluna ${index}`);
            }
        });

        // Tentar mapeamento por posição baseado na estrutura exata da planilha original (14 colunas)
        if (Object.keys(map).length === 0) {
            console.log('Nenhum header identificado, tentando mapeamento por posição...');
            
            // Mapeamento baseado na estrutura exata da planilha original:
            // 0: DATA, 1: CÓDIGO, 2: DESCRIÇÃO, 3: VARIANTE, 4: TAMANHO, 5: LOTE, 
            // 6: DATA DE VENCIMENTO, 7: QUANTIDADE, 8: ENTRADA/SAÍDA, 9: TIPO, 
            // 10: PROJETO, 11: LOCALIZAÇÃO, 12: LIB, 13: DESTINO
            if (headers.length >= 8) {
                map.data = 0;        // 0: DATA
                map.produto = 1;     // 1: CÓDIGO
                map.descricao = 2;   // 2: DESCRIÇÃO
                map.variante = 3;    // 3: VARIANTE
                map.tamanho = 4;     // 4: TAMANHO
                map.lote = 5;        // 5: LOTE
                map.dataVencimento = 6;  // 6: DATA DE VENCIMENTO
                map.quantidade = 7;  // 7: QUANTIDADE
                map.tipo = 8;        // 8: ENTRADA/SAÍDA
                map.tipoMovimento = 9;   // 9: TIPO
                map.projeto = 10;    // 10: PROJETO
                map.localizacao = 11;    // 11: LOCALIZAÇÃO
                map.lib = 12;        // 12: LIB
                map.destino = 13;    // 13: DESTINO
                console.log('Mapeamento por posição aplicado (14 colunas):', map);
            } else if (headers.length >= 4) {
                // Fallback para planilhas menores
                map.data = 0;        
                map.produto = 1;     
                map.quantidade = 7;  // Volta para posição 7 se disponível
                if (headers.length >= 11) map.localizacao = 11; 
                if (headers.length >= 10) map.projeto = 10;     
                console.log('Mapeamento básico por posição aplicado:', map);
            }
        }

        // Validação final: garantir que colunas importantes estejam mapeadas corretamente
        if (headers.length >= 12) {
            // Sempre forçar mapeamento baseado na estrutura conhecida da planilha
            // 0: DATA, 1: CÓDIGO, 2: DESCRIÇÃO, 3: VARIANTE, 4: TAMANHO, 5: LOTE, 
            // 6: DATA DE VENCIMENTO, 7: QUANTIDADE, 8: ENTRADA/SAÍDA, 9: TIPO, 
            // 10: PROJETO, 11: LOCALIZAÇÃO, 12: LIB, 13: DESTINO
            
            // Corrigir localização
            if (map.localizacao === undefined || map.localizacao !== 11) {
                console.log(`Corrigindo mapeamento de LOCALIZAÇÃO de ${map.localizacao} para 11`);
                map.localizacao = 11;
            }
            
            // Corrigir data de vencimento
            if (map.dataVencimento === undefined && headers.length >= 7) {
                console.log('Forçando mapeamento de DATA DE VENCIMENTO para posição 6');
                map.dataVencimento = 6;
            }
            
            // Corrigir variante e tamanho
            if (map.variante === undefined && headers.length >= 4) {
                console.log('Forçando mapeamento de VARIANTE para posição 3');
                map.variante = 3;
            }
            if (map.tamanho === undefined && headers.length >= 5) {
                console.log('Forçando mapeamento de TAMANHO para posição 4');
                map.tamanho = 4;
            }
        }
        
        // Log detalhado do mapeamento
        console.log('Mapeamento final:', map);
        console.log('Headers completos:', headers);
        console.log(`Localização mapeada para coluna ${map.localizacao} (deve ser 11)`);
        console.log(`Data de vencimento mapeada para coluna ${map.dataVencimento} (deve ser 6)`);
        
        return map;
    }

    async parseMovimentacaoRow(row, columnMap, produtoMap, localizacaoMap, projetoMap) {
        try {
            // Verificar se temos dados mínimos
            if (!row || row.length === 0) return null;
            
            // Verificar se o mapeamento foi feito corretamente
            if (columnMap.produto === undefined) {
                throw new Error('Coluna CÓDIGO (produto) não foi mapeada corretamente');
            }
            if (columnMap.localizacao === undefined) {
                throw new Error('Coluna LOCALIZAÇÃO não foi mapeada corretamente');
            }
            if (columnMap.quantidade === undefined) {
                throw new Error('Coluna QUANTIDADE não foi mapeada corretamente');
            }

            // Buscar produto por código usando o mapa
            const produtoCodigo = row[columnMap.produto];
            if (!produtoCodigo || produtoCodigo.toString().trim() === '') {
                throw new Error(`Código do produto vazio na coluna ${columnMap.produto + 1} (CÓDIGO)`);
            }

            const produtoCodigoTrimmed = produtoCodigo.toString().trim();
            let produto = produtoMap.get(produtoCodigoTrimmed);
            
            if (!produto) {
                console.log(`Produto "${produtoCodigoTrimmed}" não encontrado, criando automaticamente...`);
                
                // Buscar descrição do produto na planilha
                const descricao = row[columnMap.descricao] ? row[columnMap.descricao].toString().trim() : produtoCodigoTrimmed;
                
                // Criar produto automaticamente
                const novoProduto = {
                    codigo: produtoCodigoTrimmed,
                    descricao: descricao,
                    ativo: true,
                    perecivel: false, // padrão
                    estoque_minimo: 0,
                    unidade: 'UN', // padrão
                    categoria: 'IMPORTADO', // identificar produtos importados
                    observacoes: 'Produto criado automaticamente durante importação'
                };
                
                try {
                    const produtoId = await databaseManager.addProduto(novoProduto);
                    
                    // Criar objeto produto para usar no resto do código
                    produto = {
                        id: produtoId,
                        ...novoProduto
                    };
                    
                    // Atualizar o mapa para evitar criar o mesmo produto várias vezes
                    produtoMap.set(produtoCodigoTrimmed, produto);
                    
                    console.log(`Produto "${produtoCodigoTrimmed}" criado com sucesso!`);
                } catch (error) {
                    throw new Error(`Erro ao criar produto "${produtoCodigoTrimmed}": ${error.message}`);
                }
            }

            // Buscar localização - sempre tentar primeiro na posição 11 (estrutura conhecida)
            let localizacaoCodigo = null;
            const posicoesTestadas = [];
            
            // Tentar na posição 11 primeiro (estrutura correta da planilha)
            if (row.length > 11) {
                localizacaoCodigo = row[11];
                posicoesTestadas.push(12); // +1 para mostrar número da coluna (índice 11 = coluna 12)
                console.log(`Tentando localização na coluna 12 (posição 11):`, localizacaoCodigo);
            }
            
            // Se vazio, tentar na posição mapeada (caso esteja diferente)
            if ((!localizacaoCodigo || localizacaoCodigo.toString().trim() === '') && 
                columnMap.localizacao !== undefined && 
                columnMap.localizacao !== 11 && 
                row[columnMap.localizacao] !== undefined) {
                localizacaoCodigo = row[columnMap.localizacao];
                posicoesTestadas.push(columnMap.localizacao + 1);
                console.log(`Tentando localização na coluna ${columnMap.localizacao + 1} (mapeada):`, localizacaoCodigo);
            }
            
            // Se ainda vazio, tentar na posição 12 como fallback
            if ((!localizacaoCodigo || localizacaoCodigo.toString().trim() === '') && row.length > 12) {
                localizacaoCodigo = row[12];
                posicoesTestadas.push(13); // +1 para mostrar número da coluna
                console.log(`Tentando localização na coluna 13 (posição 12):`, localizacaoCodigo);
            }
            
            // Se não encontrou localização em nenhuma coluna, usar uma padrão
            if (!localizacaoCodigo || localizacaoCodigo.toString().trim() === '') {
                console.log('Localização não encontrada em nenhuma coluna, usando localização padrão');
                localizacaoCodigo = 'IMPORTADO-DEFAULT';
            }
            
            const localizacaoCodigoTrimmed = localizacaoCodigo.toString().trim();
            let localizacao = localizacaoMap.get(localizacaoCodigoTrimmed);
            
            if (!localizacao) {
                console.log(`Localização "${localizacaoCodigoTrimmed}" não encontrada, criando automaticamente...`);
                
                // Criar localização automaticamente
                const novaLocalizacao = {
                    codigo: localizacaoCodigoTrimmed,
                    descricao: localizacaoCodigoTrimmed === 'IMPORTADO-DEFAULT' 
                        ? 'Localização Padrão (Importação)' 
                        : localizacaoCodigoTrimmed,
                    ativo: true,
                    tipo: 'IMPORTADO', // identificar localizações importadas
                    observacoes: localizacaoCodigoTrimmed === 'IMPORTADO-DEFAULT'
                        ? 'Localização padrão criada para importações sem localização específica'
                        : 'Localização criada automaticamente durante importação'
                };
                
                try {
                    const localizacaoId = await databaseManager.addLocalizacao(novaLocalizacao);
                    
                    // Criar objeto localização para usar no resto do código
                    localizacao = {
                        id: localizacaoId,
                        ...novaLocalizacao
                    };
                    
                    // Atualizar o mapa para evitar criar a mesma localização várias vezes
                    localizacaoMap.set(localizacaoCodigoTrimmed, localizacao);
                    
                    console.log(`Localização "${localizacaoCodigoTrimmed}" criada com sucesso!`);
                } catch (error) {
                    throw new Error(`Erro ao criar localização "${localizacaoCodigoTrimmed}": ${error.message}`);
                }
            }

            // Buscar projeto (opcional) usando o mapa
            let projeto = null;
            const projetoCodigo = row[columnMap.projeto];
            if (projetoCodigo && columnMap.projeto !== undefined) {
                const projetoCodigoTrimmed = projetoCodigo.toString().trim();
                projeto = projetoMap.get(projetoCodigoTrimmed);
            }

            // Parsear data
            let data = new Date();
            if (columnMap.data !== undefined && row[columnMap.data]) {
                const dataValue = row[columnMap.data];
                if (dataValue) {
                    // Tentar diferentes formatos de data
                    if (typeof dataValue === 'number') {
                        // Excel serial date
                        data = new Date((dataValue - 25569) * 86400 * 1000);
                    } else {
                        data = new Date(dataValue);
                    }
                    
                    if (isNaN(data.getTime())) {
                        data = new Date();
                        console.warn('Data inválida, usando data atual');
                    }
                }
            }

            // Verificar quantidade
            const quantidadeRaw = row[columnMap.quantidade];
            if (!quantidadeRaw || quantidadeRaw.toString().trim() === '') {
                throw new Error(`Quantidade vazia na coluna ${columnMap.quantidade + 1} (QUANTIDADE)`);
            }
            
            const quantidade = parseFloat(quantidadeRaw);
            if (isNaN(quantidade)) {
                throw new Error(`Quantidade inválida na coluna ${columnMap.quantidade + 1} (QUANTIDADE): "${quantidadeRaw}" - deve ser um número`);
            }
            if (quantidade <= 0) {
                throw new Error(`Quantidade deve ser maior que zero na coluna ${columnMap.quantidade + 1} (QUANTIDADE): "${quantidadeRaw}"`);
            }

            // Parsear data de vencimento
            let dataVencimento = null;
            if (columnMap.dataVencimento !== undefined && row[columnMap.dataVencimento]) {
                const dataVencimentoRaw = row[columnMap.dataVencimento];
                if (dataVencimentoRaw && dataVencimentoRaw.toString().trim() !== '') {
                    try {
                        // Tentar diferentes formatos de data
                        if (typeof dataVencimentoRaw === 'number') {
                            // Excel serial date
                            dataVencimento = new Date((dataVencimentoRaw - 25569) * 86400 * 1000);
                        } else {
                            dataVencimento = new Date(dataVencimentoRaw);
                        }
                        
                        if (isNaN(dataVencimento.getTime())) {
                            console.warn('Data de vencimento inválida, ignorando:', dataVencimentoRaw);
                            dataVencimento = null;
                        } else {
                            console.log('Data de vencimento parseada:', dataVencimento);
                        }
                    } catch (error) {
                        console.warn('Erro ao parsear data de vencimento:', error, dataVencimentoRaw);
                        dataVencimento = null;
                    }
                }
            }

            // Determinar tipo de movimentação
            const tipoRaw = row[columnMap.tipo];
            let entrada_saida = 'SAIDA'; // padrão
            if (tipoRaw) {
                const tipo = tipoRaw.toString().toLowerCase().trim();
                if (tipo.includes('entrada') || tipo === 'entrada' || tipo === 'ent') {
                    entrada_saida = 'ENTRADA';
                }
            }

            const movimentacaoData = {
                data: data,
                entrada_saida: entrada_saida,
                produto_id: produto.id,
                quantidade: quantidade,
                localizacao_id: localizacao.id,
                projeto_id: projeto ? projeto.id : null,
                lote: row[columnMap.lote] ? row[columnMap.lote].toString().trim() : null,
                variante: row[columnMap.variante] ? row[columnMap.variante].toString().trim() : null,
                tamanho: row[columnMap.tamanho] ? row[columnMap.tamanho].toString().trim() : null,
                data_vencimento: dataVencimento,
                observacoes: row[columnMap.observacoes] ? row[columnMap.observacoes].toString().trim() : null,
                usuario_nome: window.currentUserData ? window.currentUserData.nome : 'Sistema'
            };

            console.log('Movimentação parseada:', movimentacaoData);
            return movimentacaoData;
            
        } catch (error) {
            console.error('Erro ao parsear linha:', error, row);
            throw error;
        }
    }

    showClearAllModal() {
        const content = `
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <strong>Atenção!</strong> Esta ação irá excluir <strong>TODAS</strong> as movimentações do sistema.
                <br><br>
                <strong>Esta ação não pode ser desfeita!</strong>
                <br><br>
                <small class="text-muted">
                    Serão deletadas todas as movimentações de entrada e saída, 
                    incluindo histórico completo, mas os produtos, localizações e projetos permanecerão.
                </small>
            </div>
            
            <div class="mb-3">
                <label for="confirmClearText" class="form-label">
                    Para confirmar, digite: <strong>LIMPAR TUDO</strong>
                </label>
                <input type="text" class="form-control" id="confirmClearText" placeholder="Digite aqui para confirmar">
            </div>
        `;

        const actions = [
            {
                text: 'Cancelar',
                class: 'secondary'
            },
            {
                text: 'Limpar Todas as Movimentações',
                class: 'danger',
                action: 'movimentacoesPage.clearAllMovimentacoes()'
            }
        ];

        Utils.showModal('Limpar Todas as Movimentações', content, actions);
        
        // Validar confirmação antes de executar
        const confirmInput = document.getElementById('confirmClearText');
        const confirmButton = document.querySelector('.modal .btn-danger');
        
        if (confirmButton) {
            confirmButton.disabled = true;
            
            confirmInput.addEventListener('input', () => {
                confirmButton.disabled = confirmInput.value.trim() !== 'LIMPAR TUDO';
            });
        }
    }

    async clearAllMovimentacoes() {
        try {
            Utils.showMessage('Limpando todas as movimentações...', 'info');
            
            const result = await databaseManager.clearAllMovimentacoes();
            
            Utils.showMessage(`${result.count} movimentações foram excluídas com sucesso!`, 'success');
            
            // Fechar modal
            const modalElement = document.querySelector('.modal');
            if (modalElement) {
                const modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) modal.hide();
            }
            
            // Recarregar página
            await this.loadMovimentacoes();
            this.updateTable();
            
        } catch (error) {
            console.error('Erro ao limpar movimentações:', error);
            Utils.showMessage('Erro ao limpar movimentações', 'error');
        }
    }

    // Funções de filtro
    async setupFilters() {
        // Carregar opções para os selects
        const [localizacoes, projetos] = await Promise.all([
            databaseManager.getLocalizacoes({ ativo: true }),
            databaseManager.getProjetos({ ativo: true })
        ]);

        // Preencher select de localizações
        const filterLocalizacao = document.getElementById('filter-localizacao');
        if (filterLocalizacao) {
            filterLocalizacao.innerHTML = '<option value="">Todas</option>' + 
                localizacoes.map(l => `<option value="${l.id}">${l.codigo} - ${l.descricao}</option>`).join('');
        }

        // Preencher select de projetos
        const filterProjeto = document.getElementById('filter-projeto');
        if (filterProjeto) {
            filterProjeto.innerHTML = '<option value="">Todos</option>' + 
                projetos.map(p => `<option value="${p.id}">${p.codigo} - ${p.descricao}</option>`).join('');
        }

        // Adicionar event listeners para filtros
        const filterInputs = [
            'filter-data', 'filter-tipo', 'filter-produto', 'filter-quantidade',
            'filter-localizacao', 'filter-projeto', 'filter-lote', 
            'filter-vencimento', 'filter-observacoes', 'filter-usuario'
        ];

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
            data: document.getElementById('filter-data')?.value || '',
            tipo: document.getElementById('filter-tipo')?.value || '',
            produto: document.getElementById('filter-produto')?.value || '',
            quantidade: document.getElementById('filter-quantidade')?.value || '',
            localizacao: document.getElementById('filter-localizacao')?.value || '',
            projeto: document.getElementById('filter-projeto')?.value || '',
            lote: document.getElementById('filter-lote')?.value || '',
            vencimento: document.getElementById('filter-vencimento')?.value || '',
            observacoes: document.getElementById('filter-observacoes')?.value || '',
            usuario: document.getElementById('filter-usuario')?.value || ''
        };

        // Filtrar movimentações
        let filteredMovimentacoes = [...this.movimentacoes];

        if (filters.data) {
            const filterDate = new Date(filters.data);
            filteredMovimentacoes = filteredMovimentacoes.filter(mov => {
                const movDate = new Date(mov.data);
                return movDate.toDateString() === filterDate.toDateString();
            });
        }

        if (filters.tipo) {
            filteredMovimentacoes = filteredMovimentacoes.filter(mov => mov.entrada_saida === filters.tipo);
        }

        if (filters.produto) {
            filteredMovimentacoes = filteredMovimentacoes.filter(mov => 
                mov.produto_codigo?.toLowerCase().includes(filters.produto.toLowerCase()) ||
                mov.produto_descricao?.toLowerCase().includes(filters.produto.toLowerCase())
            );
        }

        if (filters.quantidade) {
            const qtd = parseFloat(filters.quantidade);
            filteredMovimentacoes = filteredMovimentacoes.filter(mov => mov.quantidade >= qtd);
        }

        if (filters.localizacao) {
            filteredMovimentacoes = filteredMovimentacoes.filter(mov => mov.localizacao_id === filters.localizacao);
        }

        if (filters.projeto) {
            filteredMovimentacoes = filteredMovimentacoes.filter(mov => mov.projeto_id === filters.projeto);
        }

        if (filters.lote) {
            filteredMovimentacoes = filteredMovimentacoes.filter(mov => 
                mov.lote?.toLowerCase().includes(filters.lote.toLowerCase())
            );
        }

        if (filters.vencimento) {
            const filterDate = new Date(filters.vencimento);
            filteredMovimentacoes = filteredMovimentacoes.filter(mov => {
                if (!mov.data_vencimento) return false;
                const movDate = new Date(mov.data_vencimento);
                return movDate.toDateString() === filterDate.toDateString();
            });
        }

        if (filters.observacoes) {
            filteredMovimentacoes = filteredMovimentacoes.filter(mov => 
                mov.observacoes?.toLowerCase().includes(filters.observacoes.toLowerCase())
            );
        }

        if (filters.usuario) {
            filteredMovimentacoes = filteredMovimentacoes.filter(mov => 
                mov.usuario_nome?.toLowerCase().includes(filters.usuario.toLowerCase())
            );
        }

        // Atualizar tabela com dados filtrados
        this.renderFilteredTable(filteredMovimentacoes);
    }

    renderFilteredTable(filteredMovimentacoes) {
        const tbody = document.querySelector('#movimentacoesTable tbody');
        if (!tbody) return;

        if (filteredMovimentacoes.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="16" class="text-center py-4">
                        <i class="fas fa-search fa-3x text-muted mb-3"></i>
                        <p class="text-muted">Nenhuma movimentação encontrada com os filtros aplicados</p>
                    </td>
                </tr>
            `;
            return;
        }

        // Renderizar linhas filtradas
        tbody.innerHTML = filteredMovimentacoes.map(mov => {
            const canEdit = this.canEditMovimentacao(mov);
            const hasEditPermission = authManager.hasPermission('editar');
            const isAdmin = authManager.isAdmin();
            
            return `
            <tr>
                <td>${Utils.formatDate(mov.data, true)}</td>
                <td>
                    <span class="badge bg-${mov.entrada_saida === 'ENTRADA' ? 'success' : 'danger'}">
                        ${mov.entrada_saida === 'ENTRADA' ? 'Entrada' : 'Saída'}
                    </span>
                </td>
                <td>
                    <div class="fw-bold">${mov.produto_codigo || 'N/A'}</div>
                    <small class="text-muted">${mov.produto_descricao || 'Sem descrição'}</small>
                </td>
                <td class="text-end">${mov.quantidade.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td>
                    <span class="badge bg-info">${mov.localizacao_codigo || 'N/A'}</span>
                    <div class="small text-muted">${mov.localizacao_descricao || ''}</div>
                </td>
                <td>
                    ${mov.projeto_codigo ? `
                        <span class="badge bg-secondary">${mov.projeto_codigo}</span>
                        <div class="small text-muted">${mov.projeto_descricao || ''}</div>
                    ` : '<span class="text-muted">-</span>'}
                </td>
                <td>${mov.lote || '-'}</td>
                <td>${mov.data_vencimento ? Utils.formatDate(mov.data_vencimento) : '-'}</td>
                <td>
                    <div class="text-truncate" style="max-width: 150px;" title="${mov.observacoes || ''}">
                        ${mov.observacoes || '-'}
                    </div>
                </td>
                <td>
                    <small class="text-muted">${mov.usuario_nome || 'Sistema'}</small>
                </td>
                <td>
                    ${hasEditPermission ? `
                        ${canEdit ? `
                            <button class="btn btn-sm btn-outline-primary edit-mov-btn" 
                                    data-mov-id="${mov.id}" title="Editar movimentação">
                                <i class="fas fa-edit"></i>
                            </button>
                        ` : `
                            <button class="btn btn-sm btn-outline-secondary" disabled title="Edição não permitida (movimentação antiga)">
                                <i class="fas fa-lock"></i>
                            </button>
                        `}
                    ` : ''}
                </td>
            </tr>
            `;
        }).join('');
    }

    clearFilters() {
        // Limpar todos os campos de filtro
        const filterInputs = [
            'filter-data', 'filter-tipo', 'filter-produto', 'filter-quantidade',
            'filter-localizacao', 'filter-projeto', 'filter-lote', 
            'filter-vencimento', 'filter-observacoes', 'filter-usuario'
        ];

        filterInputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.value = '';
            }
        });

        // Recarregar tabela com todos os dados
        this.updateTable();
    }

    unload() {
        // Limpar listeners quando sair da página
        this.listeners.forEach(unsubscribe => unsubscribe());
        this.listeners = [];
    }
}

// Inicializar página de movimentações
const movimentacoesPage = new MovimentacoesPage();

// Exportar para uso global
window.MovimentacoesPage = MovimentacoesPage;
window.movimentacoesPage = movimentacoesPage;
