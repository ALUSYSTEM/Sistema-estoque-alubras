// Página Dashboard
class DashboardPage {
    constructor() {
        this.stats = {};
        this.listeners = [];
    }

    async load() {
        try {
            this.showLoading();
            
            // Carregar estatísticas
            this.stats = await databaseManager.getDashboardStats();
            
            // Renderizar dashboard
            this.render();
            
            // Configurar listeners para atualizações em tempo real
            this.setupRealtimeListeners();
            
        } catch (error) {
            console.error('Erro ao carregar dashboard:', error);
            Utils.showMessage('Erro ao carregar dashboard', 'error');
        }
    }

    showLoading() {
        document.getElementById('pageContent').innerHTML = `
            <div class="loading">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Carregando...</span>
                </div>
            </div>
        `;
    }

    render() {
        const content = `
            <div class="row">
                <div class="col-xl-2 col-lg-4 col-md-6 mb-4">
                    <div class="card border-left-primary shadow h-100 py-2">
                        <div class="card-body">
                            <div class="row no-gutters align-items-center">
                                <div class="col mr-2">
                                    <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">
                                        Total de Produtos</div>
                                    <div class="h5 mb-0 font-weight-bold text-gray-800" id="totalProdutos">${this.stats.totalProdutos || 0}</div>
                                </div>
                                <div class="col-auto">
                                    <i class="fas fa-boxes fa-2x text-gray-300"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-xl-2 col-lg-4 col-md-6 mb-4">
                    <div class="card border-left-success shadow h-100 py-2">
                        <div class="card-body">
                            <div class="row no-gutters align-items-center">
                                <div class="col mr-2">
                                    <div class="text-xs font-weight-bold text-success text-uppercase mb-1">
                                        Total de Movimentações</div>
                                    <div class="h5 mb-0 font-weight-bold text-gray-800" id="totalMovimentacoes">${this.stats.totalMovimentacoes || 0}</div>
                                </div>
                                <div class="col-auto">
                                    <i class="fas fa-exchange-alt fa-2x text-gray-300"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-xl-2 col-lg-4 col-md-6 mb-4">
                    <div class="card border-left-info shadow h-100 py-2">
                        <div class="card-body">
                            <div class="row no-gutters align-items-center">
                                <div class="col mr-2">
                                    <div class="text-xs font-weight-bold text-info text-uppercase mb-1">
                                        Localizações</div>
                                    <div class="h5 mb-0 font-weight-bold text-gray-800" id="totalLocalizacoes">${this.stats.totalLocalizacoes || 0}</div>
                                </div>
                                <div class="col-auto">
                                    <i class="fas fa-map-marker-alt fa-2x text-gray-300"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-xl-3 col-lg-6 col-md-6 mb-4">
                    <div class="card border-left-warning shadow h-100 py-2">
                        <div class="card-body">
                            <div class="row no-gutters align-items-center">
                                <div class="col mr-2">
                                    <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">
                                        Projetos Ativos</div>
                                    <div class="h5 mb-0 font-weight-bold text-gray-800" id="totalProjetos">${this.stats.totalProjetos || 0}</div>
                                </div>
                                <div class="col-auto">
                                    <i class="fas fa-project-diagram fa-2x text-gray-300"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-xl-3 col-lg-6 col-md-6 mb-4">
                    <div class="card border-left-success shadow h-100 py-2">
                        <div class="card-body">
                            <div class="row no-gutters align-items-center">
                                <div class="col mr-2">
                                    <div class="text-xs font-weight-bold text-success text-uppercase mb-1">
                                        Saldo Total em Estoque</div>
                                    <div class="h5 mb-0 font-weight-bold text-gray-800" id="totalEstoque">${Utils.formatNumber(this.stats.totalEstoque || 0, 0)}</div>
                                </div>
                                <div class="col-auto">
                                    <i class="fas fa-warehouse fa-2x text-gray-300"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Cards de Alertas de Estoque -->
            <div class="row mt-4">
                <div class="col-12">
                    <h5 class="text-primary mb-3">
                        <i class="fas fa-exclamation-triangle me-2"></i>Alertas de Estoque
                    </h5>
                </div>
            </div>

            <div class="row">
                <div class="col-xl-3 col-lg-4 col-md-6 mb-4">
                    <div class="card border-left-danger shadow h-100 py-2 estoque-card" onclick="navigateToPage('estoque', {filtro: 'estoque_baixo'})">
                        <div class="card-body">
                            <div class="row no-gutters align-items-center">
                                <div class="col mr-2">
                                    <div class="text-xs font-weight-bold text-danger text-uppercase mb-1">
                                        Estoque Baixo</div>
                                    <div class="h5 mb-0 font-weight-bold text-gray-800" id="produtosEstoqueBaixo">${this.stats.produtosEstoqueBaixo || 0}</div>
                                </div>
                                <div class="col-auto">
                                    <i class="fas fa-exclamation-triangle fa-2x text-gray-300"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-xl-3 col-lg-4 col-md-6 mb-4">
                    <div class="card border-left-danger shadow h-100 py-2 estoque-card" onclick="navigateToPage('estoque', {filtro: 'vencidos'})">
                        <div class="card-body">
                            <div class="row no-gutters align-items-center">
                                <div class="col mr-2">
                                    <div class="text-xs font-weight-bold text-danger text-uppercase mb-1">
                                        Produtos Vencidos</div>
                                    <div class="h5 mb-0 font-weight-bold text-gray-800" id="produtosVencidos">${this.stats.produtosVencidos || 0}</div>
                                </div>
                                <div class="col-auto">
                                    <i class="fas fa-skull-crossbones fa-2x text-gray-300"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-xl-3 col-lg-4 col-md-6 mb-4">
                    <div class="card border-left-warning shadow h-100 py-2 estoque-card" onclick="navigateToPage('estoque', {filtro: 'vencendo'})">
                        <div class="card-body">
                            <div class="row no-gutters align-items-center">
                                <div class="col mr-2">
                                    <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">
                                        Vencendo em 7 dias</div>
                                    <div class="h5 mb-0 font-weight-bold text-gray-800" id="produtosVencendo7Dias">${this.stats.produtosVencendo7Dias || 0}</div>
                                </div>
                                <div class="col-auto">
                                    <i class="fas fa-clock fa-2x text-gray-300"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-xl-3 col-lg-4 col-md-6 mb-4">
                    <div class="card border-left-info shadow h-100 py-2 estoque-card" onclick="navigateToPage('beneficiamento')">
                        <div class="card-body">
                            <div class="row no-gutters align-items-center">
                                <div class="col mr-2">
                                    <div class="text-xs font-weight-bold text-info text-uppercase mb-1">
                                        Aguardando Beneficiamento</div>
                                    <div class="h5 mb-0 font-weight-bold text-gray-800" id="totalBeneficiamento">${this.stats.totalBeneficiamento || 0}</div>
                                </div>
                                <div class="col-auto">
                                    <i class="fas fa-paint-brush fa-2x text-gray-300"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            ${this.renderQuickActions()}

            ${this.renderUserInfo()}
        `;

        document.getElementById('pageContent').innerHTML = content;
        this.setupEventListeners();
    }

    renderQuickActions() {
        if (!authManager.hasPermission('criar')) {
            return '';
        }

        return `
            <div class="row">
                <div class="col-12">
                    <div class="card shadow mb-4">
                        <div class="card-header py-3">
                            <h6 class="m-0 font-weight-bold text-primary">Ações Rápidas</h6>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-3">
                                    <button class="btn btn-primary btn-lg btn-block mb-3 w-100" onclick="navigateToPage('produtos', {action: 'create'})">
                                        <i class="fas fa-plus me-2"></i>Novo Produto
                                    </button>
                                </div>
                                <div class="col-md-3">
                                    <button class="btn btn-success btn-lg btn-block mb-3 w-100" onclick="navigateToPage('movimentacoes', {action: 'create'})">
                                        <i class="fas fa-exchange-alt me-2"></i>Nova Movimentação
                                    </button>
                                </div>
                                <div class="col-md-3">
                                    <button class="btn btn-info btn-lg btn-block mb-3 w-100" onclick="navigateToPage('projetos', {action: 'create'})">
                                        <i class="fas fa-project-diagram me-2"></i>Novo Projeto
                                    </button>
                                </div>
                                <div class="col-md-3">
                                    <button class="btn btn-warning btn-lg btn-block mb-3 w-100" onclick="navigateToPage('localizacoes', {action: 'create'})">
                                        <i class="fas fa-map-marker-alt me-2"></i>Nova Localização
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderUserInfo() {
        return `
            <div class="row">
                <div class="col-12">
                    <div class="card shadow">
                        <div class="card-header py-3">
                            <h6 class="m-0 font-weight-bold text-primary">
                                <i class="fas fa-user me-2"></i>Informações da Sessão
                            </h6>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <p><strong>Usuário:</strong> ${window.currentUserData ? window.currentUserData.nome : 'N/A'}</p>
                                    <p><strong>Função:</strong> 
                                        <span class="badge bg-${window.currentUserData && window.currentUserData.role === 'admin' ? 'danger' : 'primary'}">
                                            ${window.currentUserData ? window.currentUserData.role.toUpperCase() : 'USER'}
                                        </span>
                                    </p>
                                    <p><strong>Email:</strong> ${window.currentUserData ? window.currentUserData.email : 'N/A'}</p>
                                </div>
                                <div class="col-md-6">
                                    <p><strong>Permissões:</strong></p>
                                    <ul class="list-unstyled">
                                        <li><i class="fas fa-check text-success me-2"></i>Visualizar dados</li>
                                        ${authManager.hasPermission('criar') ? '<li><i class="fas fa-check text-success me-2"></i>Criar registros</li>' : ''}
                                        ${authManager.hasPermission('editar') ? '<li><i class="fas fa-check text-success me-2"></i>Editar registros</li>' : ''}
                                        ${authManager.isAdmin() ? '<li><i class="fas fa-check text-success me-2"></i>Administrar sistema</li>' : ''}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Adicionar tooltips
        Utils.initTooltips();
    }

    setupRealtimeListeners() {
        // Limpar listeners anteriores
        this.listeners.forEach(unsubscribe => unsubscribe());

        // OTIMIZAÇÃO: Debounce para evitar muitas atualizações
        let debounceTimeout = null;
        const debouncedUpdate = () => {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(async () => {
                try {
                    const stats = await databaseManager.getDashboardStats();
                    this.updateAllStats(stats);
                } catch (error) {
                    console.error('Erro ao atualizar estatísticas:', error);
                }
            }, 1000); // Aguarda 1 segundo antes de atualizar
        };

        // Listener para produtos - OTIMIZADO: apenas contagem
        const produtosListener = databaseManager.onProdutosChange((snapshot) => {
            this.updateStat('totalProdutos', snapshot.size);
            debouncedUpdate(); // Só atualiza stats gerais após debounce
        });

        // Listener para movimentações - OTIMIZADO: apenas contagem
        const movimentacoesListener = databaseManager.onMovimentacoesChange((snapshot) => {
            this.updateStat('totalMovimentacoes', snapshot.size);
        });

        // Listener para estoque - OTIMIZADO: sem consulta pesada imediata
        const estoqueListener = databaseManager.onEstoqueChange((snapshot) => {
            // Apenas dispara atualização com debounce, sem consulta imediata
            debouncedUpdate();
        });

        // Listener para beneficiamento - OTIMIZADO: apenas contagem
        const beneficiamentoListener = databaseManager.onBeneficiamentoChange((snapshot) => {
            this.updateStat('totalBeneficiamento', snapshot.size);
        });

        this.listeners = [produtosListener, movimentacoesListener, estoqueListener, beneficiamentoListener];
    }

    updateStat(statId, value) {
        const element = document.getElementById(statId);
        if (element) {
            // Animação de mudança
            element.style.transform = 'scale(1.1)';
            element.style.transition = 'transform 0.2s';
            
            setTimeout(() => {
                element.textContent = Utils.formatNumber(value, 0);
                element.style.transform = 'scale(1)';
            }, 100);
        }
    }

    updateAllStats(stats) {
        // Atualizar todas as estatísticas
        const statMappings = {
            totalProdutos: stats.totalProdutos,
            totalMovimentacoes: stats.totalMovimentacoes,
            totalLocalizacoes: stats.totalLocalizacoes,
            totalProjetos: stats.totalProjetos,
            totalEstoque: stats.totalEstoque,
            produtosEstoqueBaixo: stats.produtosEstoqueBaixo,
            produtosVencidos: stats.produtosVencidos,
            produtosVencendo7Dias: stats.produtosVencendo7Dias,
            totalBeneficiamento: stats.totalBeneficiamento
        };

        Object.entries(statMappings).forEach(([key, value]) => {
            const element = document.getElementById(key);
            if (element) {
                element.textContent = key === 'totalEstoque' ? Utils.formatNumber(value, 0) : Utils.formatNumber(value, 0);
            }
        });

        this.stats = stats;
    }

    unload() {
        // Limpar listeners quando sair da página
        this.listeners.forEach(unsubscribe => unsubscribe());
        this.listeners = [];
    }
}

// Exportar para uso global
window.DashboardPage = DashboardPage;
