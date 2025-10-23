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
            
            // Anexar dados de produtos aos registros de estoque quando disponíveis
            const produtoIds = Array.from(new Set(
                (this.estoques || [])
                    .map(e => e.produto_id)
                    .filter(id => !!id)
            ));
            
            console.log('=== DEBUG ESTOQUE ===');
            console.log('Total de itens de estoque:', this.estoques.length);
            console.log('IDs de produtos encontrados:', produtoIds);
            console.log('Primeiros 3 itens de estoque:', this.estoques.slice(0, 3));
            
            if (produtoIds.length > 0) {
                try {
                    // Tentar primeiro com getProdutosByIds
                    let produtos = await databaseManager.getProdutosByIds(produtoIds);
                    console.log('Produtos carregados via getProdutosByIds:', produtos.length);
                    
                    // Se não encontrou produtos, tentar buscar todos e filtrar
                    if (produtos.length === 0) {
                        console.log('Tentando buscar todos os produtos e filtrar...');
                        const todosProdutos = await databaseManager.getProdutos({ ativo: true });
                        produtos = todosProdutos.filter(p => produtoIds.includes(p.id));
                        console.log('Produtos encontrados via filtro:', produtos.length);
                    }
                    
                    console.log('Primeiros 3 produtos:', produtos.slice(0, 3));
                    
                    const produtoMap = new Map(produtos.map(p => [p.id, p]));
                    this.estoques = this.estoques.map(e => {
                        const produto = e.produto || produtoMap.get(e.produto_id);
                        console.log(`Item ${e.id}: produto_id=${e.produto_id}, produto encontrado=`, !!produto);
                        if (produto) {
                            console.log(`  Produto encontrado: ${produto.codigo} - ${produto.descricao}`);
                        }
                        return {
                            ...e,
                            produto: produto || e.produto
                        };
                    });
                    
                    console.log('Estoques após merge:', this.estoques.slice(0, 3));
                } catch (err) {
                    console.error('Erro ao anexar produtos ao estoque:', err);
                }
            } else {
                console.log('Nenhum produto_id encontrado nos itens de estoque');
            }
            console.log('========================');
            
            // Aplicar filtros específicos
            if (this.currentFilters.filtro === 'vencidos') {
                this.estoques = this.estoques.filter(estoque => {
                    if (!estoque.data_vencimento) {
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
                    if (!estoque.data_vencimento) {
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
                if (estoque.data_vencimento) {
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
                                <tr class="table-light">
                                    <th>
                                        <input type="text" class="form-control form-control-sm" id="filter-produto" placeholder="Filtrar produto">
                                    </th>
                                    <th>
                                        <input type="text" class="form-control form-control-sm" id="filter-variante" placeholder="Filtrar variante">
                                    </th>
                                    <th>
                                        <input type="text" class="form-control form-control-sm" id="filter-tamanho" placeholder="Filtrar tamanho">
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
                                        <input type="text" class="form-control form-control-sm" id="filter-lote" placeholder="Filtrar lote">
                                    </th>
                                    <th>
                                        <input type="number" class="form-control form-control-sm" id="filter-saldo" placeholder="Saldo min">
                                    </th>
                                    <th>
                                        <input type="date" class="form-control form-control-sm" id="filter-vencimento" placeholder="Vencimento">
                                    </th>
                                    <th>
                                        <select class="form-control form-control-sm" id="filter-status">
                                            <option value="">Todos</option>
                                            <option value="VENCIDO">Vencido</option>
                                            <option value="PROXIMO_VENCIMENTO">Próximo Vencimento</option>
                                            <option value="OK">OK</option>
                                        </select>
                                    </th>
                                    <th>
                                        <button class="btn btn-sm btn-outline-secondary" onclick="estoquePage.clearFilters()" title="Limpar filtros">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </th>
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
        this.setupFilters();
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
            const statusVencimento = estoque.data_vencimento ? 
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
                    <td>${estoque.projeto?.descricao || estoque.projeto?.codigo || '-'}</td>
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

        // OTIMIZAÇÃO: Debounce e throttle para evitar muitas recargas
        let reloadTimeout = null;
        let isReloading = false;
        
        const debouncedReload = async () => {
            if (isReloading) return; // Evita múltiplas recargas simultâneas
            
            clearTimeout(reloadTimeout);
            reloadTimeout = setTimeout(async () => {
                isReloading = true;
                try {
                    await this.loadEstoque();
                    this.updateTable();
                } catch (error) {
                    console.error('Erro ao recarregar estoque:', error);
                } finally {
                    isReloading = false;
                }
            }, 500); // Aguarda 500ms antes de recarregar
        };

        // OTIMIZAÇÃO: Apenas um listener para estoque (o principal)
        const estoqueListener = databaseManager.onEstoqueChange(() => {
            debouncedReload();
        });

        // OTIMIZAÇÃO: Removido listener redundante de produtos
        // O estoque já carrega dados de produtos, não precisa de listener separado
        
        this.listeners = [estoqueListener];
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

    // Funções de filtro da tabela
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
            'filter-produto', 'filter-variante', 'filter-tamanho', 'filter-localizacao',
            'filter-projeto', 'filter-lote', 'filter-saldo', 'filter-vencimento', 'filter-status'
        ];

        filterInputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', () => this.applyTableFilters());
                element.addEventListener('change', () => this.applyTableFilters());
            }
        });
    }

    applyTableFilters() {
        const filters = {
            produto: document.getElementById('filter-produto')?.value || '',
            variante: document.getElementById('filter-variante')?.value || '',
            tamanho: document.getElementById('filter-tamanho')?.value || '',
            localizacao: document.getElementById('filter-localizacao')?.value || '',
            projeto: document.getElementById('filter-projeto')?.value || '',
            lote: document.getElementById('filter-lote')?.value || '',
            saldo: document.getElementById('filter-saldo')?.value || '',
            vencimento: document.getElementById('filter-vencimento')?.value || '',
            status: document.getElementById('filter-status')?.value || ''
        };

        // Filtrar estoques
        let filteredEstoques = [...this.estoques];

        if (filters.produto) {
            filteredEstoques = filteredEstoques.filter(estoque => 
                estoque.produto?.codigo?.toLowerCase().includes(filters.produto.toLowerCase()) ||
                estoque.produto?.descricao?.toLowerCase().includes(filters.produto.toLowerCase())
            );
        }

        if (filters.variante) {
            filteredEstoques = filteredEstoques.filter(estoque => 
                estoque.variante?.toLowerCase().includes(filters.variante.toLowerCase())
            );
        }

        if (filters.tamanho) {
            filteredEstoques = filteredEstoques.filter(estoque => 
                estoque.tamanho?.toLowerCase().includes(filters.tamanho.toLowerCase())
            );
        }

        if (filters.localizacao) {
            filteredEstoques = filteredEstoques.filter(estoque => estoque.localizacao_id === filters.localizacao);
        }

        if (filters.projeto) {
            filteredEstoques = filteredEstoques.filter(estoque => estoque.projeto_id === filters.projeto);
        }

        if (filters.lote) {
            filteredEstoques = filteredEstoques.filter(estoque => 
                estoque.lote?.toLowerCase().includes(filters.lote.toLowerCase())
            );
        }

        if (filters.saldo) {
            const saldoMin = parseFloat(filters.saldo);
            filteredEstoques = filteredEstoques.filter(estoque => estoque.saldo >= saldoMin);
        }

        if (filters.vencimento) {
            const filterDate = new Date(filters.vencimento);
            filteredEstoques = filteredEstoques.filter(estoque => {
                if (!estoque.data_vencimento) return false;
                const estoqueDate = new Date(estoque.data_vencimento);
                return estoqueDate.toDateString() === filterDate.toDateString();
            });
        }

        if (filters.status) {
            filteredEstoques = filteredEstoques.filter(estoque => {
                if (!estoque.data_vencimento) return filters.status === 'OK';
                
                const statusVencimento = Utils.getExpirationStatus(estoque.data_vencimento, true);
                return statusVencimento === filters.status;
            });
        }

        // Atualizar tabela com dados filtrados
        this.renderFilteredTable(filteredEstoques);
    }

    renderFilteredTable(filteredEstoques) {
        const tbody = document.querySelector('#estoqueTable tbody');
        if (!tbody) return;

        if (filteredEstoques.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" class="text-center py-4">
                        <i class="fas fa-search fa-3x text-muted mb-3"></i>
                        <p class="text-muted">Nenhum item encontrado com os filtros aplicados</p>
                    </td>
                </tr>
            `;
            return;
        }

        // Renderizar linhas filtradas
        tbody.innerHTML = filteredEstoques.map(estoque => {
            const statusVencimento = estoque.data_vencimento ? 
                Utils.getExpirationStatus(estoque.data_vencimento, true) : 'N/A';
            
            const statusClass = Utils.getExpirationStatusClass(statusVencimento);
            
            return `
                <tr class="${estoque.saldo <= (estoque.produto?.estoque_minimo || 0) && estoque.saldo > 0 ? 'table-warning' : ''}">
                    <td>
                        <div class="fw-bold">${estoque.produto?.codigo || 'N/A'}</div>
                        <small class="text-muted">${estoque.produto?.descricao || 'Sem descrição'}</small>
                    </td>
                    <td>${estoque.variante || '-'}</td>
                    <td>${estoque.tamanho || '-'}</td>
                    <td>
                        <span class="badge bg-info">${estoque.localizacao?.codigo || 'N/A'}</span>
                        <div class="small text-muted">${estoque.localizacao?.descricao || ''}</div>
                    </td>
                    <td>
                        ${estoque.projeto ? `
                            <span class="badge bg-secondary">${estoque.projeto.codigo}</span>
                            <div class="small text-muted">${estoque.projeto.descricao || ''}</div>
                        ` : '<span class="text-muted">-</span>'}
                    </td>
                    <td>${estoque.lote || '-'}</td>
                    <td class="text-end fw-bold ${estoque.saldo <= 0 ? 'text-danger' : ''}">
                        ${Utils.formatNumber(estoque.saldo, 2)}
                    </td>
                    <td>${estoque.data_vencimento ? Utils.formatDate(estoque.data_vencimento) : '-'}</td>
                    <td>
                        <span class="badge ${statusClass}">${statusVencimento}</span>
                    </td>
                    <td>
                        <small class="text-muted">${Utils.formatDate(estoque.ultima_atualizacao, true)}</small>
                    </td>
                </tr>
            `;
        }).join('');
    }

    clearFilters() {
        // Limpar todos os campos de filtro
        const filterInputs = [
            'filter-produto', 'filter-variante', 'filter-tamanho', 'filter-localizacao',
            'filter-projeto', 'filter-lote', 'filter-saldo', 'filter-vencimento', 'filter-status'
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

// Inicializar página de estoque
const estoquePage = new EstoquePage();

// Exportar para uso global
window.EstoquePage = EstoquePage;
window.estoquePage = estoquePage;
