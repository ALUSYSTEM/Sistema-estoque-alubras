// Página de Estoque
class EstoquePage {
    constructor() {
        this.estoques = [];
        this.currentFilters = {};
        this.listeners = [];
    }

    async load(params = {}) {
        try {
            this.showLoading();
            
            // Aplicar filtros se fornecidos
            if (params.filtro) {
                this.currentFilters.filtro = params.filtro;
            }

            // Carregar estoque
            await this.loadEstoque();
            
            // Renderizar página
            this.render();
            
            // Configurar listeners para atualizações em tempo real
            this.setupRealtimeListeners();
            
        } catch (error) {
            console.error('Erro ao carregar estoque:', error);
            Utils.showMessage('Erro ao carregar estoque', 'error');
        }
    }

    showLoading() {
        document.getElementById('pageContent').innerHTML = `
            <div class="loading">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Carregando estoque...</span>
                </div>
            </div>
        `;
    }

    async loadEstoque() {
        try {
            this.estoques = await databaseManager.getEstoque(this.currentFilters);
            
            // Aplicar filtros específicos
            if (this.currentFilters.filtro === 'vencidos') {
                this.estoques = this.estoques.filter(estoque => {
                    if (!estoque.produto || !estoque.produto.perecivel || !estoque.data_vencimento) {
                        return false;
                    }
                    const hoje = new Date();
                    const dataVencimento = estoque.data_vencimento.toDate ? 
                        estoque.data_vencimento.toDate() : new Date(estoque.data_vencimento);
                    return dataVencimento < hoje && estoque.saldo > 0;
                });
            } else if (this.currentFilters.filtro === 'vencendo') {
                const data7Dias = new Date();
                data7Dias.setDate(data7Dias.getDate() + 7);
                
                this.estoques = this.estoques.filter(estoque => {
                    if (!estoque.produto || !estoque.produto.perecivel || !estoque.data_vencimento) {
                        return false;
                    }
                    const hoje = new Date();
                    const dataVencimento = estoque.data_vencimento.toDate ? 
                        estoque.data_vencimento.toDate() : new Date(estoque.data_vencimento);
                    return dataVencimento <= data7Dias && dataVencimento > hoje && estoque.saldo > 0;
                });
            } else if (this.currentFilters.filtro === 'estoque_baixo') {
                this.estoques = this.estoques.filter(estoque => {
                    return estoque.produto && estoque.saldo <= (estoque.produto.estoque_minimo || 0) && estoque.saldo > 0;
                });
            } else if (this.currentFilters.filtro === 'sem_saldo') {
                // Produtos sem saldo - buscar produtos que não têm estoque
                const produtos = await databaseManager.getProdutos({ ativo: true });
                const produtosComEstoque = new Set(this.estoques.map(e => e.produto_id));
                
                this.estoques = produtos
                    .filter(p => !produtosComEstoque.has(p.id))
                    .map(p => ({
                        id: `sem-saldo-${p.id}`,
                        produto_id: p.id,
                        produto: p,
                        saldo: 0,
                        localizacao: null,
                        projeto: null
                    }));
            }

            // Calcular estatísticas
            this.calculateStats();
            
        } catch (error) {
            console.error('Erro ao carregar estoque:', error);
            throw error;
        }
    }

    calculateStats() {
        this.stats = {
            total_produtos_com_saldo: 0,
            total_produtos_sem_saldo: 0,
            produtos_vencidos: 0,
            total_quantidade_itens: 0
        };

        const produtosComSaldo = new Set();
        
        this.estoques.forEach(estoque => {
            this.stats.total_quantidade_itens += estoque.saldo || 0;
            
            if (estoque.saldo > 0) {
                produtosComSaldo.add(estoque.produto_id);
                
                // Verificar produtos vencidos
                if (estoque.produto && estoque.produto.perecivel && estoque.data_vencimento) {
                    const hoje = new Date();
                    const dataVencimento = estoque.data_vencimento.toDate ? 
                        estoque.data_vencimento.toDate() : new Date(estoque.data_vencimento);
                    if (dataVencimento < hoje) {
                        this.stats.produtos_vencidos++;
                    }
                }
            }
        });

        this.stats.total_produtos_com_saldo = produtosComSaldo.size;
    }

    render() {
        const content = `
            <!-- Cards de Estatísticas -->
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card border-left-success shadow h-100 py-2 estoque-card" onclick="estoquePage.applyFilter('com_saldo')">
                        <div class="card-body">
                            <div class="row no-gutters align-items-center">
                                <div class="col mr-2">
                                    <div class="text-xs font-weight-bold text-success text-uppercase mb-1">
                                        Total de Produtos com Saldo</div>
                                    <div class="h5 mb-0 font-weight-bold text-gray-800">
                                        ${this.stats.total_produtos_com_saldo}
                                    </div>
                                </div>
                                <div class="col-auto">
                                    <i class="fas fa-boxes fa-2x text-gray-300"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-3">
                    <div class="card border-left-danger shadow h-100 py-2 estoque-card" onclick="estoquePage.applyFilter('sem_saldo')">
                        <div class="card-body">
                            <div class="row no-gutters align-items-center">
                                <div class="col mr-2">
                                    <div class="text-xs font-weight-bold text-danger text-uppercase mb-1">
                                        Total de Produtos sem Saldo</div>
                                    <div class="h5 mb-0 font-weight-bold text-gray-800">
                                        ${this.stats.total_produtos_sem_saldo}
                                    </div>
                                </div>
                                <div class="col-auto">
                                    <i class="fas fa-box-open fa-2x text-gray-300"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-3">
                    <div class="card border-left-warning shadow h-100 py-2 estoque-card" onclick="estoquePage.applyFilter('vencidos')">
                        <div class="card-body">
                            <div class="row no-gutters align-items-center">
                                <div class="col mr-2">
                                    <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">
                                        Produtos Vencidos</div>
                                    <div class="h5 mb-0 font-weight-bold text-gray-800">
                                        ${this.stats.produtos_vencidos}
                                    </div>
                                </div>
                                <div class="col-auto">
                                    <i class="fas fa-skull-crossbones fa-2x text-gray-300"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-3">
                    <div class="card border-left-primary shadow h-100 py-2 estoque-card" onclick="estoquePage.applyFilter('todos')">
                        <div class="card-body">
                            <div class="row no-gutters align-items-center">
                                <div class="col mr-2">
                                    <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">
                                        Total de Itens no Estoque</div>
                                    <div class="h5 mb-0 font-weight-bold text-gray-800">
                                        ${Utils.formatNumber(this.stats.total_quantidade_itens, 0)}
                                    </div>
                                </div>
                                <div class="col-auto">
                                    <i class="fas fa-cubes fa-2x text-gray-300"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            ${this.renderFilterIndicator()}

            <!-- Barra de Pesquisa -->
            <div class="row mb-3">
                <div class="col-md-6">
                    <div class="input-group">
                        <input type="text" class="form-control" id="searchEstoque" 
                               placeholder="Pesquisar por código ou nome do produto...">
                        <button class="btn btn-outline-secondary" type="button" id="clearSearchEstoque">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Tabela de Estoque -->
            <div class="card shadow">
                <div class="card-header py-3">
                    <h6 class="m-0 font-weight-bold text-primary">Saldo Atual do Estoque</h6>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive" style="max-height: 60vh; overflow-y: auto;">
                        <table class="table table-bordered table-hover mb-0" id="estoqueTable">
                            <thead class="table-dark sticky-top">
                                <tr>
                                    <th style="min-width: 200px;">Produto</th>
                                    <th style="min-width: 120px;">Variante</th>
                                    <th style="min-width: 100px;">Tamanho</th>
                                    <th style="min-width: 120px;">Localização</th>
                                    <th style="min-width: 120px;">Projeto</th>
                                    <th style="min-width: 80px;">Lote</th>
                                    <th style="min-width: 80px;">Saldo</th>
                                    <th style="min-width: 120px;">Data Vencimento</th>
                                    <th style="min-width: 120px;">Status Vencimento</th>
                                    <th style="min-width: 150px;">Última Atualização</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.renderEstoqueTable()}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('pageContent').innerHTML = content;
        this.setupEventListeners();
        document.getElementById('pageTitle').textContent = 'Estoque Atual';
        
        // Buscar botões de ação da página
        const pageActions = document.getElementById('pageActions');
        if (pageActions) {
            pageActions.innerHTML = authManager.hasPermission('criar') ? `
                <button class="btn btn-primary" onclick="navigateToPage('movimentacoes', {action: 'create'})">
                    <i class="fas fa-plus me-2"></i>Nova Movimentação
                </button>
            ` : '';
        }
    }

    renderFilterIndicator() {
        if (!this.currentFilters.filtro) {
            return '';
        }

        const filterLabels = {
            'vencidos': 'Mostrando apenas produtos vencidos',
            'com_saldo': 'Mostrando apenas produtos com saldo',
            'sem_saldo': 'Mostrando apenas produtos sem saldo',
            'estoque_baixo': 'Mostrando apenas produtos com estoque baixo',
            'vencendo': 'Mostrando produtos vencendo em 7 dias',
            'todos': 'Mostrando todos os produtos'
        };

        return `
            <div class="row mb-3">
                <div class="col-12">
                    <div class="alert alert-info d-flex justify-content-between align-items-center">
                        <span>
                            <i class="fas fa-filter me-2"></i>
                            ${filterLabels[this.currentFilters.filtro] || 'Filtro aplicado'}
                        </span>
                        <button class="btn btn-sm btn-outline-secondary" onclick="estoquePage.clearFilter()">
                            <i class="fas fa-times me-1"></i>Limpar Filtro
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderEstoqueTable() {
        if (this.estoques.length === 0) {
            return `
                <tr>
                    <td colspan="10" class="text-center py-4">
                        <i class="fas fa-warehouse fa-3x text-muted mb-3"></i>
                        <p class="text-muted">Nenhum item encontrado no estoque</p>
                    </td>
                </tr>
            `;
        }

        return this.estoques.map(estoque => {
            const statusVencimento = estoque.produto && estoque.produto.perecivel && estoque.data_vencimento ? 
                Utils.getExpirationStatus(estoque.data_vencimento, true) : 'N/A';
            
            const statusClass = Utils.getExpirationStatusClass(statusVencimento);
            
            return `
                <tr class="${estoque.saldo <= (estoque.produto?.estoque_minimo || 0) && estoque.saldo > 0 ? 'table-warning' : ''}">
                    <td>
                        <strong>${estoque.produto?.codigo || 'N/A'}</strong><br>
                        <small>${estoque.produto?.descricao || 'N/A'}</small>
                    </td>
                    <td>${estoque.variante || '-'}</td>
                    <td>${estoque.tamanho || '-'}</td>
                    <td>${estoque.localizacao?.codigo || '-'}</td>
                    <td>${estoque.projeto?.codigo || '-'}</td>
                    <td>${estoque.lote || '-'}</td>
                    <td>
                        <span class="badge bg-${estoque.saldo <= (estoque.produto?.estoque_minimo || 0) && estoque.saldo > 0 ? 'danger' : 'success'}">
                            ${Utils.formatNumber(estoque.saldo || 0, 0)}
                        </span>
                    </td>
                    <td>
                        ${estoque.data_vencimento ? Utils.formatDate(estoque.data_vencimento) : '-'}
                    </td>
                    <td>
                        ${statusVencimento !== 'N/A' ? `
                            <span class="status-vencimento ${statusClass}">${statusVencimento}</span>
                        ` : '<span class="badge bg-secondary">N/A</span>'}
                    </td>
                    <td>
                        ${estoque.data_atualizacao ? Utils.formatDate(estoque.data_atualizacao, true) : '-'}
                    </td>
                </tr>
            `;
        }).join('');
    }

    setupEventListeners() {
        // Pesquisa em tempo real
        const searchInput = document.getElementById('searchEstoque');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce(() => {
                this.filterEstoque(searchInput.value);
            }, 300));
        }

        // Botão limpar pesquisa
        const clearBtn = document.getElementById('clearSearchEstoque');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                document.getElementById('searchEstoque').value = '';
                this.filterEstoque('');
            });
        }
    }

    filterEstoque(searchTerm) {
        const table = document.getElementById('estoqueTable');
        if (!table) return;

        const rows = table.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
        const term = searchTerm.toLowerCase();

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const cells = row.getElementsByTagName('td');
            let found = false;

            if (cells.length > 0) {
                // Buscar no código e descrição do produto (primeira célula)
                const produtoText = cells[0].textContent.toLowerCase();
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

        // Listener para estoque
        const estoqueListener = databaseManager.onEstoqueChange(async () => {
            await this.loadEstoque();
            this.updateTable();
        });

        // Listener para produtos (para atualizar dados dos produtos)
        const produtosListener = databaseManager.onProdutosChange(async () => {
            await this.loadEstoque();
            this.updateTable();
        });

        this.listeners = [estoqueListener, produtosListener];
    }

    updateTable() {
        const tbody = document.querySelector('#estoqueTable tbody');
        if (tbody) {
            tbody.innerHTML = this.renderEstoqueTable();
        }
        
        // Atualizar estatísticas nos cards
        this.updateStatsCards();
    }

    updateStatsCards() {
        // Atualizar os valores nos cards de estatísticas
        const statsElements = {
            'total_produtos_com_saldo': this.stats.total_produtos_com_saldo,
            'total_produtos_sem_saldo': this.stats.total_produtos_sem_saldo,
            'produtos_vencidos': this.stats.produtos_vencidos,
            'total_quantidade_itens': Utils.formatNumber(this.stats.total_quantidade_itens, 0)
        };

        Object.entries(statsElements).forEach(([key, value]) => {
            const elements = document.querySelectorAll(`[data-stat="${key}"]`);
            elements.forEach(el => {
                el.textContent = value;
            });
        });
    }

    applyFilter(filterType) {
        this.currentFilters.filtro = filterType;
        this.load();
    }

    clearFilter() {
        this.currentFilters.filtro = null;
        this.load();
    }

    unload() {
        // Limpar listeners quando sair da página
        this.listeners.forEach(unsubscribe => unsubscribe());
        this.listeners = [];
    }
}

// Inicializar página de estoque
const estoquePage = new EstoquePage();

// Exportar para uso global
window.EstoquePage = EstoquePage;
window.estoquePage = estoquePage;
