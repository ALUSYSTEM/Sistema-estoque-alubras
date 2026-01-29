// Página Dashboard do Sistema de Qualidade
class DashboardPage {
    constructor() {
        this.stats = {};
        this.listeners = [];
    }

    async load(params = {}) {
        try {
            this.showLoading();
            
            // Carregar estatísticas
            await this.loadStats();
            
            // Renderizar página
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
                    <span class="visually-hidden">Carregando dashboard...</span>
                </div>
            </div>
        `;
    }

    async loadStats() {
        try {
            this.stats = await databaseManager.getDashboardStats();
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
            throw error;
        }
    }

    render() {
        const content = `
            <!-- Cards de Estatísticas -->
            <div class="row mb-4">
                <div class="col-xl-3 col-md-6 mb-4">
                    <div class="card border-left-primary shadow h-100 py-2">
                        <div class="card-body">
                            <div class="row no-gutters align-items-center">
                                <div class="col mr-2">
                                    <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">
                                        Total de Inspeções
                                    </div>
                                    <div class="h5 mb-0 font-weight-bold text-gray-800" data-stat="total_inspecoes">
                                        ${this.stats.total_inspecoes || 0}
                                    </div>
                                </div>
                                <div class="col-auto">
                                    <i class="fas fa-search fa-2x text-gray-300"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-xl-3 col-md-6 mb-4">
                    <div class="card border-left-success shadow h-100 py-2">
                        <div class="card-body">
                            <div class="row no-gutters align-items-center">
                                <div class="col mr-2">
                                    <div class="text-xs font-weight-bold text-success text-uppercase mb-1">
                                        Aprovadas
                                    </div>
                                    <div class="h5 mb-0 font-weight-bold text-gray-800" data-stat="aprovadas">
                                        ${this.stats.aprovadas || 0}
                                    </div>
                                </div>
                                <div class="col-auto">
                                    <i class="fas fa-check-circle fa-2x text-gray-300"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-xl-3 col-md-6 mb-4">
                    <div class="card border-left-danger shadow h-100 py-2">
                        <div class="card-body">
                            <div class="row no-gutters align-items-center">
                                <div class="col mr-2">
                                    <div class="text-xs font-weight-bold text-danger text-uppercase mb-1">
                                        Reprovadas
                                    </div>
                                    <div class="h5 mb-0 font-weight-bold text-gray-800" data-stat="reprovadas">
                                        ${this.stats.reprovadas || 0}
                                    </div>
                                </div>
                                <div class="col-auto">
                                    <i class="fas fa-times-circle fa-2x text-gray-300"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-xl-3 col-md-6 mb-4">
                    <div class="card border-left-warning shadow h-100 py-2">
                        <div class="card-body">
                            <div class="row no-gutters align-items-center">
                                <div class="col mr-2">
                                    <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">
                                        Taxa de Aprovação
                                    </div>
                                    <div class="h5 mb-0 font-weight-bold text-gray-800" data-stat="taxa_aprovacao">
                                        ${this.stats.taxa_aprovacao || 0}%
                                    </div>
                                </div>
                                <div class="col-auto">
                                    <i class="fas fa-percentage fa-2x text-gray-300"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Cards de Retrabalho -->
            <div class="row mb-4">
                <div class="col-xl-3 col-md-6 mb-4">
                    <div class="card border-left-info shadow h-100 py-2">
                        <div class="card-body">
                            <div class="row no-gutters align-items-center">
                                <div class="col mr-2">
                                    <div class="text-xs font-weight-bold text-info text-uppercase mb-1">
                                        Retrabalhos Pendentes
                                    </div>
                                    <div class="h5 mb-0 font-weight-bold text-gray-800" data-stat="retrabalhos_pendentes">
                                        ${this.stats.retrabalhos_pendentes || 0}
                                    </div>
                                </div>
                                <div class="col-auto">
                                    <i class="fas fa-clock fa-2x text-gray-300"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-xl-3 col-md-6 mb-4">
                    <div class="card border-left-primary shadow h-100 py-2">
                        <div class="card-body">
                            <div class="row no-gutters align-items-center">
                                <div class="col mr-2">
                                    <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">
                                        Em Andamento
                                    </div>
                                    <div class="h5 mb-0 font-weight-bold text-gray-800" data-stat="retrabalhos_em_andamento">
                                        ${this.stats.retrabalhos_em_andamento || 0}
                                    </div>
                                </div>
                                <div class="col-auto">
                                    <i class="fas fa-tools fa-2x text-gray-300"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-xl-3 col-md-6 mb-4">
                    <div class="card border-left-success shadow h-100 py-2">
                        <div class="card-body">
                            <div class="row no-gutters align-items-center">
                                <div class="col mr-2">
                                    <div class="text-xs font-weight-bold text-success text-uppercase mb-1">
                                        Concluídos
                                    </div>
                                    <div class="h5 mb-0 font-weight-bold text-gray-800" data-stat="retrabalhos_concluidos">
                                        ${this.stats.retrabalhos_concluidos || 0}
                                    </div>
                                </div>
                                <div class="col-auto">
                                    <i class="fas fa-check fa-2x text-gray-300"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-xl-3 col-md-6 mb-4">
                    <div class="card border-left-secondary shadow h-100 py-2">
                        <div class="card-body">
                            <div class="row no-gutters align-items-center">
                                <div class="col mr-2">
                                    <div class="text-xs font-weight-bold text-secondary text-uppercase mb-1">
                                        Total de Retrabalhos
                                    </div>
                                    <div class="h5 mb-0 font-weight-bold text-gray-800" data-stat="total_retrabalhos">
                                        ${this.stats.total_retrabalhos || 0}
                                    </div>
                                </div>
                                <div class="col-auto">
                                    <i class="fas fa-list fa-2x text-gray-300"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Gráficos e Ações Rápidas -->
            <div class="row">
                <div class="col-lg-8">
                    <div class="card shadow mb-4">
                        <div class="card-header py-3 d-flex flex-row align-items-center justify-content-between">
                            <h6 class="m-0 font-weight-bold text-primary">Resumo de Qualidade</h6>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6>Esquadrias Inspecionadas</h6>
                                    <div class="progress mb-3">
                                        <div class="progress-bar bg-success" role="progressbar" 
                                             style="width: ${this.stats.taxa_aprovacao || 0}%">
                                            ${this.stats.taxa_aprovacao || 0}%
                                        </div>
                                    </div>
                                    <small class="text-muted">
                                        Total: ${Utils.formatNumber(this.stats.total_esquadrias || 0, 0)} | 
                                        Aprovadas: ${Utils.formatNumber((this.stats.aprovadas || 0) + (this.stats.aprovadas_parcial || 0), 0)}
                                    </small>
                                </div>
                                <div class="col-md-6">
                                    <h6>Taxa de Defeitos</h6>
                                    <div class="progress mb-3">
                                        <div class="progress-bar bg-danger" role="progressbar" 
                                             style="width: ${this.stats.taxa_defeitos || 0}%">
                                            ${this.stats.taxa_defeitos || 0}%
                                        </div>
                                    </div>
                                    <small class="text-muted">
                                        Total de Defeitos: ${Utils.formatNumber(this.stats.total_defeitos || 0, 0)}
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-lg-4">
                    <div class="card shadow mb-4">
                        <div class="card-header py-3">
                            <h6 class="m-0 font-weight-bold text-primary">Ações Rápidas</h6>
                        </div>
                        <div class="card-body">
                            <div class="d-grid gap-2">
                                <button class="btn btn-primary" onclick="navigateToPage('inspecoes', {action: 'create'})">
                                    <i class="fas fa-plus me-2"></i>
                                    Nova Inspeção
                                </button>
                                <button class="btn btn-warning" onclick="navigateToPage('retrabalho', {action: 'create'})">
                                    <i class="fas fa-tools me-2"></i>
                                    Novo Retrabalho
                                </button>
                                <button class="btn btn-info" onclick="navigateToPage('relatorios')">
                                    <i class="fas fa-chart-bar me-2"></i>
                                    Ver Relatórios
                                </button>
                                <button class="btn btn-secondary" onclick="navigateToPage('defeitos')">
                                    <i class="fas fa-exclamation-triangle me-2"></i>
                                    Gerenciar Defeitos
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Últimas Atividades -->
            <div class="row">
                <div class="col-12">
                    <div class="card shadow mb-4">
                        <div class="card-header py-3">
                            <h6 class="m-0 font-weight-bold text-primary">Últimas Atividades</h6>
                        </div>
                        <div class="card-body">
                            <div id="ultimasAtividades">
                                <div class="text-center">
                                    <div class="spinner-border text-primary" role="status">
                                        <span class="visually-hidden">Carregando atividades...</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('pageContent').innerHTML = content;
        document.getElementById('pageTitle').textContent = 'Dashboard';
        
        // Carregar últimas atividades
        this.loadUltimasAtividades();
    }

    async loadUltimasAtividades() {
        try {
            const [inspecoes, retrabalhos] = await Promise.all([
                databaseManager.getInspecoes({ limit: 5 }),
                databaseManager.getRetrabalhos({ limit: 5 })
            ]);

            const atividades = [
                ...inspecoes.map(i => ({
                    tipo: 'inspecao',
                    titulo: `Inspeção ${i.numero}`,
                    descricao: `${i.produto} - ${i.parecer}`,
                    data: i.data_criacao,
                    status: i.parecer,
                    usuario: i.inspetor_nome
                })),
                ...retrabalhos.map(r => ({
                    tipo: 'retrabalho',
                    titulo: `Retrabalho ${r.numero}`,
                    descricao: `${r.produto} - ${r.status}`,
                    data: r.data_criacao,
                    status: r.status,
                    usuario: r.responsavel_nome
                }))
            ].sort((a, b) => new Date(b.data) - new Date(a.data)).slice(0, 10);

            this.renderUltimasAtividades(atividades);
        } catch (error) {
            console.error('Erro ao carregar últimas atividades:', error);
            document.getElementById('ultimasAtividades').innerHTML = 
                '<p class="text-muted">Erro ao carregar atividades</p>';
        }
    }

    renderUltimasAtividades(atividades) {
        if (atividades.length === 0) {
            document.getElementById('ultimasAtividades').innerHTML = 
                '<p class="text-muted">Nenhuma atividade recente</p>';
            return;
        }

        const html = atividades.map(atividade => `
            <div class="d-flex align-items-center mb-3">
                <div class="flex-shrink-0">
                    <i class="fas fa-${atividade.tipo === 'inspecao' ? 'search' : 'tools'} 
                       text-${Utils.getStatusClass(atividade.status)}"></i>
                </div>
                <div class="flex-grow-1 ms-3">
                    <div class="fw-bold">${atividade.titulo}</div>
                    <div class="text-muted small">${atividade.descricao}</div>
                    <div class="text-muted small">
                        ${Utils.formatDate(atividade.data, true)} - ${atividade.usuario}
                    </div>
                </div>
                <div class="flex-shrink-0">
                    <span class="badge bg-${Utils.getStatusClass(atividade.status)}">
                        ${Utils.formatStatus(atividade.status)}
                    </span>
                </div>
            </div>
        `).join('');

        document.getElementById('ultimasAtividades').innerHTML = html;
    }

    setupRealtimeListeners() {
        // Listener para estatísticas
        const unsubscribe = databaseManager.setupStatsListener((stats) => {
            this.stats = stats;
            this.updateStatsCards();
        });

        this.listeners.push(unsubscribe);
    }

    updateStatsCards() {
        // Atualizar valores nos cards
        const statsElements = {
            'total_inspecoes': this.stats.total_inspecoes,
            'aprovadas': this.stats.aprovadas,
            'reprovadas': this.stats.reprovadas,
            'taxa_aprovacao': `${this.stats.taxa_aprovacao || 0}%`,
            'retrabalhos_pendentes': this.stats.retrabalhos_pendentes,
            'retrabalhos_em_andamento': this.stats.retrabalhos_em_andamento,
            'retrabalhos_concluidos': this.stats.retrabalhos_concluidos,
            'total_retrabalhos': this.stats.total_retrabalhos
        };

        Object.entries(statsElements).forEach(([key, value]) => {
            const elements = document.querySelectorAll(`[data-stat="${key}"]`);
            elements.forEach(el => {
                el.textContent = value;
            });
        });

        // Atualizar barras de progresso
        const progressBars = document.querySelectorAll('.progress-bar');
        progressBars.forEach(bar => {
            if (bar.classList.contains('bg-success')) {
                bar.style.width = `${this.stats.taxa_aprovacao || 0}%`;
                bar.textContent = `${this.stats.taxa_aprovacao || 0}%`;
            } else if (bar.classList.contains('bg-danger')) {
                bar.style.width = `${this.stats.taxa_defeitos || 0}%`;
                bar.textContent = `${this.stats.taxa_defeitos || 0}%`;
            }
        });
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

// Inicializar página de dashboard
const dashboardPage = new DashboardPage();

// Exportar para uso global
window.DashboardPage = DashboardPage;
window.dashboardPage = dashboardPage;
