// Página de Relatórios do Sistema de Qualidade
class RelatoriosPage {
    constructor() {
        this.currentReport = null;
        this.reportData = null;
    }

    async load(params = {}) {
        try {
            this.showLoading();
            
            // Renderizar página
            this.render();
            
        } catch (error) {
            console.error('Erro ao carregar relatórios:', error);
            Utils.showMessage('Erro ao carregar relatórios', 'error');
        }
    }

    showLoading() {
        document.getElementById('pageContent').innerHTML = `
            <div class="loading">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Carregando relatórios...</span>
                </div>
            </div>
        `;
    }

    render() {
        const content = `
            <div class="row">
                <div class="col-12">
                    <div class="card shadow">
                        <div class="card-header py-3">
                            <h6 class="m-0 font-weight-bold text-primary">Relatórios de Qualidade</h6>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-4 mb-4">
                                    <div class="card h-100 border-left-primary">
                                        <div class="card-body text-center">
                                            <i class="fas fa-search fa-2x text-primary mb-3"></i>
                                            <h5 class="card-title">Inspeções por Período</h5>
                                            <p class="card-text">Relatório de inspeções realizadas em um período específico</p>
                                            <button class="btn btn-primary" onclick="relatoriosPage.generateInspecoesPeriodo()">
                                                <i class="fas fa-chart-bar me-2"></i>Gerar Relatório
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="col-md-4 mb-4">
                                    <div class="card h-100 border-left-warning">
                                        <div class="card-body text-center">
                                            <i class="fas fa-exclamation-triangle fa-2x text-warning mb-3"></i>
                                            <h5 class="card-title">Defeitos Mais Frequentes</h5>
                                            <p class="card-text">Análise dos tipos de defeitos mais comuns</p>
                                            <button class="btn btn-warning" onclick="relatoriosPage.generateDefeitosFrequentes()">
                                                <i class="fas fa-chart-pie me-2"></i>Gerar Relatório
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="col-md-4 mb-4">
                                    <div class="card h-100 border-left-info">
                                        <div class="card-body text-center">
                                            <i class="fas fa-users fa-2x text-info mb-3"></i>
                                            <h5 class="card-title">Performance de Inspetores</h5>
                                            <p class="card-text">Avaliação da produtividade dos inspetores</p>
                                            <button class="btn btn-info" onclick="relatoriosPage.generatePerformanceInspetores()">
                                                <i class="fas fa-chart-line me-2"></i>Gerar Relatório
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="col-md-4 mb-4">
                                    <div class="card h-100 border-left-success">
                                        <div class="card-body text-center">
                                            <i class="fas fa-star fa-2x text-success mb-3"></i>
                                            <h5 class="card-title">Indicadores de Qualidade</h5>
                                            <p class="card-text">Métricas gerais de qualidade da produção</p>
                                            <button class="btn btn-success" onclick="relatoriosPage.generateIndicadoresQualidade()">
                                                <i class="fas fa-chart-area me-2"></i>Gerar Relatório
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="col-md-4 mb-4">
                                    <div class="card h-100 border-left-danger">
                                        <div class="card-body text-center">
                                            <i class="fas fa-tools fa-2x text-danger mb-3"></i>
                                            <h5 class="card-title">Retrabalhos por Produto</h5>
                                            <p class="card-text">Análise de retrabalhos por tipo de produto</p>
                                            <button class="btn btn-danger" onclick="relatoriosPage.generateRetrabalhosProduto()">
                                                <i class="fas fa-chart-bar me-2"></i>Gerar Relatório
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="col-md-4 mb-4">
                                    <div class="card h-100 border-left-secondary">
                                        <div class="card-body text-center">
                                            <i class="fas fa-truck fa-2x text-secondary mb-3"></i>
                                            <h5 class="card-title">Avaliação de Fornecedores</h5>
                                            <p class="card-text">Performance e qualidade dos fornecedores</p>
                                            <button class="btn btn-secondary" onclick="relatoriosPage.generateAvaliacaoFornecedores()">
                                                <i class="fas fa-chart-pie me-2"></i>Gerar Relatório
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('pageContent').innerHTML = content;
        document.getElementById('pageTitle').textContent = 'Relatórios';
        
        // Limpar ações da página
        const pageActions = document.getElementById('pageActions');
        if (pageActions) {
            pageActions.innerHTML = '';
        }
    }

    // ===== RELATÓRIOS =====

    // Inspeções por Período
    async generateInspecoesPeriodo() {
        try {
            Utils.showMessage('Carregando dados das inspeções...', 'info');
            
            const inspecoes = await databaseManager.getInspecoes();
            const hoje = new Date();
            const ultimoMes = new Date(hoje.getFullYear(), hoje.getMonth() - 1, hoje.getDate());
            
            const inspecoesFiltradas = inspecoes.filter(inspecao => {
                const dataInspecao = new Date(inspecao.data);
                return dataInspecao >= ultimoMes && dataInspecao <= hoje;
            });

            const totalInspecoes = inspecoesFiltradas.length;
            const aprovadas = inspecoesFiltradas.filter(i => i.parecer === 'Aprovado').length;
            const reprovadas = inspecoesFiltradas.filter(i => i.parecer === 'Reprovado').length;
            const aprovadasParcial = inspecoesFiltradas.filter(i => i.parecer === 'Aprovado Parcialmente').length;

            const content = `
                <div class="row">
                    <div class="col-12">
                        <h4><i class="fas fa-search text-primary me-2"></i>Relatório de Inspeções por Período</h4>
                        <p class="text-muted">Período: ${Utils.formatDate(ultimoMes)} até ${Utils.formatDate(hoje)}</p>
                    </div>
                </div>
                
                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="card bg-primary text-white">
                            <div class="card-body text-center">
                                <h3>${totalInspecoes}</h3>
                                <p class="mb-0">Total de Inspeções</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-success text-white">
                            <div class="card-body text-center">
                                <h3>${aprovadas}</h3>
                                <p class="mb-0">Aprovadas</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-warning text-white">
                            <div class="card-body text-center">
                                <h3>${aprovadasParcial}</h3>
                                <p class="mb-0">Aprovadas Parcialmente</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-danger text-white">
                            <div class="card-body text-center">
                                <h3>${reprovadas}</h3>
                                <p class="mb-0">Reprovadas</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Número</th>
                                <th>Data</th>
                                <th>Responsável</th>
                                <th>Produto</th>
                                <th>Parecer</th>
                                <th>Qtd Inspecionadas</th>
                                <th>Qtd Defeitos</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${inspecoesFiltradas.map(inspecao => `
                                <tr>
                                    <td>${inspecao.numero || 'N/A'}</td>
                                    <td>${Utils.formatDate(inspecao.data)}</td>
                                    <td>${inspecao.responsavel || 'N/A'}</td>
                                    <td>${inspecao.produto || 'N/A'}</td>
                                    <td><span class="badge bg-${inspecao.parecer === 'Aprovado' ? 'success' : inspecao.parecer === 'Reprovado' ? 'danger' : 'warning'}">${inspecao.parecer}</span></td>
                                    <td>${inspecao.qtd_inspecionadas || 0}</td>
                                    <td>${inspecao.qtd_defeitos || 0}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;

            this.showReportModal('Inspeções por Período', content);
            
        } catch (error) {
            console.error('Erro ao gerar relatório de inspeções:', error);
            Utils.showMessage('Erro ao gerar relatório', 'error');
        }
    }

    // Defeitos Mais Frequentes
    async generateDefeitosFrequentes() {
        try {
            Utils.showMessage('Carregando dados dos defeitos...', 'info');
            
            const inspecoes = await databaseManager.getInspecoes();
            
            // Contar tipos de defeitos
            const defeitosCount = {};
            inspecoes.forEach(inspecao => {
                if (inspecao.riscos) defeitosCount['Riscos ou arranhões'] = (defeitosCount['Riscos ou arranhões'] || 0) + 1;
                if (inspecao.danos_pintura) defeitosCount['Danos de Pintura'] = (defeitosCount['Danos de Pintura'] || 0) + 1;
                if (inspecao.amassado) defeitosCount['Amassado ou Empeno'] = (defeitosCount['Amassado ou Empeno'] || 0) + 1;
                if (inspecao.falta_guarnicao) defeitosCount['Falta de Guarnição'] = (defeitosCount['Falta de Guarnição'] || 0) + 1;
                if (inspecao.furacao_inadequada) defeitosCount['Furação Inadequada'] = (defeitosCount['Furação Inadequada'] || 0) + 1;
                if (inspecao.esquadria_suja) defeitosCount['Esquadria Suja'] = (defeitosCount['Esquadria Suja'] || 0) + 1;
                if (inspecao.falha_acabamento) defeitosCount['Falha de Acabamento'] = (defeitosCount['Falha de Acabamento'] || 0) + 1;
                if (inspecao.falha_fixacao) defeitosCount['Falha de Fixação'] = (defeitosCount['Falha de Fixação'] || 0) + 1;
                if (inspecao.falha_colagem) defeitosCount['Falha de Colagem'] = (defeitosCount['Falha de Colagem'] || 0) + 1;
                if (inspecao.mau_funcionamento) defeitosCount['Mau Funcionamento'] = (defeitosCount['Mau Funcionamento'] || 0) + 1;
            });

            const defeitosOrdenados = Object.entries(defeitosCount)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 10);

            const content = `
                <div class="row">
                    <div class="col-12">
                        <h4><i class="fas fa-exclamation-triangle text-warning me-2"></i>Defeitos Mais Frequentes</h4>
                        <p class="text-muted">Top 10 defeitos mais comuns encontrados nas inspeções</p>
                    </div>
                </div>

                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Posição</th>
                                <th>Tipo de Defeito</th>
                                <th>Quantidade</th>
                                <th>Percentual</th>
                                <th>Barra de Progresso</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${defeitosOrdenados.map(([defeito, quantidade], index) => {
                                const total = Object.values(defeitosCount).reduce((a, b) => a + b, 0);
                                const percentual = total > 0 ? ((quantidade / total) * 100).toFixed(1) : 0;
                                return `
                                    <tr>
                                        <td><span class="badge bg-primary">${index + 1}º</span></td>
                                        <td>${defeito}</td>
                                        <td><strong>${quantidade}</strong></td>
                                        <td>${percentual}%</td>
                                        <td>
                                            <div class="progress" style="height: 20px;">
                                                <div class="progress-bar bg-warning" style="width: ${percentual}%"></div>
                                            </div>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `;

            this.showReportModal('Defeitos Mais Frequentes', content);
            
        } catch (error) {
            console.error('Erro ao gerar relatório de defeitos:', error);
            Utils.showMessage('Erro ao gerar relatório', 'error');
        }
    }

    // Performance de Inspetores
    async generatePerformanceInspetores() {
        try {
            Utils.showMessage('Carregando dados dos inspetores...', 'info');
            
            const inspecoes = await databaseManager.getInspecoes();
            const inspetores = await databaseManager.getInspetores();
            
            // Calcular performance por inspetor
            const performance = {};
            inspetores.forEach(inspetor => {
                const inspecoesInspetor = inspecoes.filter(i => i.responsavel_id === inspetor.id);
                const totalInspecoes = inspecoesInspetor.length;
                const aprovadas = inspecoesInspetor.filter(i => i.parecer === 'Aprovado').length;
                const taxaAprovacao = totalInspecoes > 0 ? ((aprovadas / totalInspecoes) * 100).toFixed(1) : 0;
                
                performance[inspetor.id] = {
                    nome: inspetor.nome,
                    totalInspecoes,
                    aprovadas,
                    taxaAprovacao: parseFloat(taxaAprovacao),
                    totalDefeitos: inspecoesInspetor.reduce((sum, i) => sum + (parseInt(i.qtd_defeitos) || 0), 0)
                };
            });

            const performanceOrdenada = Object.values(performance)
                .sort((a, b) => b.taxaAprovacao - a.taxaAprovacao);

            const content = `
                <div class="row">
                    <div class="col-12">
                        <h4><i class="fas fa-users text-info me-2"></i>Performance de Inspetores</h4>
                        <p class="text-muted">Avaliação da produtividade e qualidade dos inspetores</p>
                    </div>
                </div>

                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Inspetor</th>
                                <th>Total Inspeções</th>
                                <th>Inspeções Aprovadas</th>
                                <th>Taxa de Aprovação</th>
                                <th>Total Defeitos</th>
                                <th>Classificação</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${performanceOrdenada.map((perf, index) => {
                                let classificacao = 'Regular';
                                let badgeClass = 'secondary';
                                
                                if (perf.taxaAprovacao >= 90) {
                                    classificacao = 'Excelente';
                                    badgeClass = 'success';
                                } else if (perf.taxaAprovacao >= 80) {
                                    classificacao = 'Bom';
                                    badgeClass = 'info';
                                } else if (perf.taxaAprovacao >= 70) {
                                    classificacao = 'Regular';
                                    badgeClass = 'warning';
                                } else {
                                    classificacao = 'Precisa Melhorar';
                                    badgeClass = 'danger';
                                }
                                
                                return `
                                    <tr>
                                        <td><strong>${perf.nome}</strong></td>
                                        <td>${perf.totalInspecoes}</td>
                                        <td>${perf.aprovadas}</td>
                                        <td>
                                            <div class="progress" style="height: 20px;">
                                                <div class="progress-bar bg-${badgeClass}" style="width: ${perf.taxaAprovacao}%">
                                                    ${perf.taxaAprovacao}%
                                                </div>
                                            </div>
                                        </td>
                                        <td>${perf.totalDefeitos}</td>
                                        <td><span class="badge bg-${badgeClass}">${classificacao}</span></td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `;

            this.showReportModal('Performance de Inspetores', content);
            
        } catch (error) {
            console.error('Erro ao gerar relatório de performance:', error);
            Utils.showMessage('Erro ao gerar relatório', 'error');
        }
    }

    // Indicadores de Qualidade
    async generateIndicadoresQualidade() {
        try {
            Utils.showMessage('Carregando indicadores de qualidade...', 'info');
            
            const inspecoes = await databaseManager.getInspecoes();
            const retrabalhos = await databaseManager.getRetrabalhos();
            
            // Calcular indicadores
            const totalInspecoes = inspecoes.length;
            const totalItensInspecionados = inspecoes.reduce((sum, i) => sum + (parseInt(i.qtd_inspecionadas) || 0), 0);
            const totalDefeitos = inspecoes.reduce((sum, i) => sum + (parseInt(i.qtd_defeitos) || 0), 0);
            const totalBloqueados = inspecoes.reduce((sum, i) => sum + (parseInt(i.qtd_bloqueada) || 0), 0);
            
            const taxaDefeitos = totalItensInspecionados > 0 ? ((totalDefeitos / totalItensInspecionados) * 100).toFixed(2) : 0;
            const taxaBloqueio = totalItensInspecionados > 0 ? ((totalBloqueados / totalItensInspecionados) * 100).toFixed(2) : 0;
            const taxaRetrabalho = totalInspecoes > 0 ? ((retrabalhos.length / totalInspecoes) * 100).toFixed(2) : 0;
            
            const aprovadas = inspecoes.filter(i => i.parecer === 'Aprovado').length;
            const taxaAprovacao = totalInspecoes > 0 ? ((aprovadas / totalInspecoes) * 100).toFixed(1) : 0;

            const content = `
                <div class="row">
                    <div class="col-12">
                        <h4><i class="fas fa-star text-success me-2"></i>Indicadores de Qualidade</h4>
                        <p class="text-muted">Métricas gerais de qualidade da produção</p>
                    </div>
                </div>

                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="card bg-primary text-white">
                            <div class="card-body text-center">
                                <h3>${totalInspecoes}</h3>
                                <p class="mb-0">Total de Inspeções</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-info text-white">
                            <div class="card-body text-center">
                                <h3>${totalItensInspecionados}</h3>
                                <p class="mb-0">Itens Inspecionados</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-warning text-white">
                            <div class="card-body text-center">
                                <h3>${totalDefeitos}</h3>
                                <p class="mb-0">Total de Defeitos</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-danger text-white">
                            <div class="card-body text-center">
                                <h3>${totalBloqueados}</h3>
                                <p class="mb-0">Itens Bloqueados</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title">Taxa de Aprovação</h5>
                                <div class="progress mb-3" style="height: 30px;">
                                    <div class="progress-bar bg-success" style="width: ${taxaAprovacao}%">
                                        ${taxaAprovacao}%
                                    </div>
                                </div>
                                <p class="text-muted">Percentual de inspeções aprovadas</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title">Taxa de Defeitos</h5>
                                <div class="progress mb-3" style="height: 30px;">
                                    <div class="progress-bar bg-warning" style="width: ${taxaDefeitos}%">
                                        ${taxaDefeitos}%
                                    </div>
                                </div>
                                <p class="text-muted">Percentual de itens com defeitos</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row mt-3">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title">Taxa de Bloqueio</h5>
                                <div class="progress mb-3" style="height: 30px;">
                                    <div class="progress-bar bg-danger" style="width: ${taxaBloqueio}%">
                                        ${taxaBloqueio}%
                                    </div>
                                </div>
                                <p class="text-muted">Percentual de itens bloqueados</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title">Taxa de Retrabalho</h5>
                                <div class="progress mb-3" style="height: 30px;">
                                    <div class="progress-bar bg-secondary" style="width: ${taxaRetrabalho}%">
                                        ${taxaRetrabalho}%
                                    </div>
                                </div>
                                <p class="text-muted">Percentual de inspeções que geraram retrabalho</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            this.showReportModal('Indicadores de Qualidade', content);
            
        } catch (error) {
            console.error('Erro ao gerar relatório de indicadores:', error);
            Utils.showMessage('Erro ao gerar relatório', 'error');
        }
    }

    // Retrabalhos por Produto
    async generateRetrabalhosProduto() {
        try {
            Utils.showMessage('Carregando dados de retrabalhos...', 'info');
            
            const retrabalhos = await databaseManager.getRetrabalhos();
            
            // Agrupar por produto
            const retrabalhosPorProduto = {};
            retrabalhos.forEach(retrabalho => {
                const produto = retrabalho.produto || 'Produto não especificado';
                if (!retrabalhosPorProduto[produto]) {
                    retrabalhosPorProduto[produto] = {
                        total: 0,
                        pendentes: 0,
                        emAndamento: 0,
                        concluidos: 0,
                        quantidadeTotal: 0
                    };
                }
                
                retrabalhosPorProduto[produto].total++;
                retrabalhosPorProduto[produto].quantidadeTotal += parseInt(retrabalho.quantidade_retrabalho) || 0;
                
                switch(retrabalho.status) {
                    case 'PENDENTE':
                        retrabalhosPorProduto[produto].pendentes++;
                        break;
                    case 'EM_ANDAMENTO':
                        retrabalhosPorProduto[produto].emAndamento++;
                        break;
                    case 'CONCLUIDO':
                        retrabalhosPorProduto[produto].concluidos++;
                        break;
                }
            });

            const produtosOrdenados = Object.entries(retrabalhosPorProduto)
                .sort(([,a], [,b]) => b.total - a.total);

            const content = `
                <div class="row">
                    <div class="col-12">
                        <h4><i class="fas fa-tools text-danger me-2"></i>Retrabalhos por Produto</h4>
                        <p class="text-muted">Análise de retrabalhos por tipo de produto</p>
                    </div>
                </div>

                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Produto</th>
                                <th>Total Retrabalhos</th>
                                <th>Quantidade Total</th>
                                <th>Pendentes</th>
                                <th>Em Andamento</th>
                                <th>Concluídos</th>
                                <th>Taxa de Conclusão</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${produtosOrdenados.map(([produto, dados]) => {
                                const taxaConclusao = dados.total > 0 ? ((dados.concluidos / dados.total) * 100).toFixed(1) : 0;
                                return `
                                    <tr>
                                        <td><strong>${produto}</strong></td>
                                        <td><span class="badge bg-primary">${dados.total}</span></td>
                                        <td><strong>${dados.quantidadeTotal}</strong></td>
                                        <td><span class="badge bg-warning">${dados.pendentes}</span></td>
                                        <td><span class="badge bg-info">${dados.emAndamento}</span></td>
                                        <td><span class="badge bg-success">${dados.concluidos}</span></td>
                                        <td>
                                            <div class="progress" style="height: 20px;">
                                                <div class="progress-bar bg-success" style="width: ${taxaConclusao}%">
                                                    ${taxaConclusao}%
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `;

            this.showReportModal('Retrabalhos por Produto', content);
            
        } catch (error) {
            console.error('Erro ao gerar relatório de retrabalhos:', error);
            Utils.showMessage('Erro ao gerar relatório', 'error');
        }
    }

    // Avaliação de Fornecedores
    async generateAvaliacaoFornecedores() {
        try {
            Utils.showMessage('Carregando dados de fornecedores...', 'info');
            
            const fornecedores = await databaseManager.getFornecedores();
            const inspecoes = await databaseManager.getInspecoes();
            
            // Calcular avaliação por fornecedor
            const avaliacaoFornecedores = {};
            fornecedores.forEach(fornecedor => {
                const inspecoesFornecedor = inspecoes.filter(i => 
                    i.fornecedor_id === fornecedor.id || 
                    i.fornecedor_nome === fornecedor.nome
                );
                
                const totalInspecoes = inspecoesFornecedor.length;
                const aprovadas = inspecoesFornecedor.filter(i => i.parecer === 'Aprovado').length;
                const reprovadas = inspecoesFornecedor.filter(i => i.parecer === 'Reprovado').length;
                const totalDefeitos = inspecoesFornecedor.reduce((sum, i) => sum + (parseInt(i.qtd_defeitos) || 0), 0);
                
                const taxaAprovacao = totalInspecoes > 0 ? ((aprovadas / totalInspecoes) * 100).toFixed(1) : 0;
                const mediaDefeitos = totalInspecoes > 0 ? (totalDefeitos / totalInspecoes).toFixed(2) : 0;
                
                avaliacaoFornecedores[fornecedor.id] = {
                    nome: fornecedor.nome,
                    totalInspecoes,
                    aprovadas,
                    reprovadas,
                    taxaAprovacao: parseFloat(taxaAprovacao),
                    totalDefeitos,
                    mediaDefeitos: parseFloat(mediaDefeitos),
                    classificacao: this.classificarFornecedor(parseFloat(taxaAprovacao), parseFloat(mediaDefeitos))
                };
            });

            const fornecedoresOrdenados = Object.values(avaliacaoFornecedores)
                .sort((a, b) => b.taxaAprovacao - a.taxaAprovacao);

            const content = `
                <div class="row">
                    <div class="col-12">
                        <h4><i class="fas fa-truck text-secondary me-2"></i>Avaliação de Fornecedores</h4>
                        <p class="text-muted">Performance e qualidade dos fornecedores</p>
                    </div>
                </div>

                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Fornecedor</th>
                                <th>Total Inspeções</th>
                                <th>Aprovadas</th>
                                <th>Reprovadas</th>
                                <th>Taxa Aprovação</th>
                                <th>Média Defeitos</th>
                                <th>Classificação</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${fornecedoresOrdenados.map(fornecedor => {
                                let badgeClass = 'secondary';
                                switch(fornecedor.classificacao) {
                                    case 'Excelente':
                                        badgeClass = 'success';
                                        break;
                                    case 'Bom':
                                        badgeClass = 'info';
                                        break;
                                    case 'Regular':
                                        badgeClass = 'warning';
                                        break;
                                    case 'Ruim':
                                        badgeClass = 'danger';
                                        break;
                                }
                                
                                return `
                                    <tr>
                                        <td><strong>${fornecedor.nome}</strong></td>
                                        <td>${fornecedor.totalInspecoes}</td>
                                        <td><span class="badge bg-success">${fornecedor.aprovadas}</span></td>
                                        <td><span class="badge bg-danger">${fornecedor.reprovadas}</span></td>
                                        <td>
                                            <div class="progress" style="height: 20px;">
                                                <div class="progress-bar bg-${badgeClass}" style="width: ${fornecedor.taxaAprovacao}%">
                                                    ${fornecedor.taxaAprovacao}%
                                                </div>
                                            </div>
                                        </td>
                                        <td>${fornecedor.mediaDefeitos}</td>
                                        <td><span class="badge bg-${badgeClass}">${fornecedor.classificacao}</span></td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `;

            this.showReportModal('Avaliação de Fornecedores', content);
            
        } catch (error) {
            console.error('Erro ao gerar relatório de fornecedores:', error);
            Utils.showMessage('Erro ao gerar relatório', 'error');
        }
    }

    // Classificar fornecedor
    classificarFornecedor(taxaAprovacao, mediaDefeitos) {
        if (taxaAprovacao >= 95 && mediaDefeitos <= 1) return 'Excelente';
        if (taxaAprovacao >= 90 && mediaDefeitos <= 2) return 'Bom';
        if (taxaAprovacao >= 80 && mediaDefeitos <= 3) return 'Regular';
        return 'Ruim';
    }

    // Mostrar modal de relatório
    showReportModal(title, content) {
        const actions = [
            {
                text: 'Fechar',
                class: 'secondary',
                onclick: 'closeModal()'
            },
            {
                text: 'Exportar PDF',
                class: 'primary',
                onclick: 'relatoriosPage.exportToPDF()'
            }
        ];

        Utils.showModal(title, content, actions);
    }

    // Exportar para PDF (placeholder)
    exportToPDF() {
        Utils.showMessage('Funcionalidade de exportação será implementada em breve', 'info');
    }

    unload() {
        // Limpar recursos quando sair da página
    }
}

// Inicializar página de relatórios
const relatoriosPage = new RelatoriosPage();

// Exportar para uso global
window.RelatoriosPage = RelatoriosPage;
window.relatoriosPage = relatoriosPage;

// Exportar funções específicas para uso em onclick
window.generateInspecoesPeriodo = () => relatoriosPage.generateInspecoesPeriodo();
window.generateDefeitosFrequentes = () => relatoriosPage.generateDefeitosFrequentes();
window.generatePerformanceInspetores = () => relatoriosPage.generatePerformanceInspetores();
window.generateIndicadoresQualidade = () => relatoriosPage.generateIndicadoresQualidade();
window.generateRetrabalhosProduto = () => relatoriosPage.generateRetrabalhosProduto();
window.generateAvaliacaoFornecedores = () => relatoriosPage.generateAvaliacaoFornecedores();
window.exportToPDF = () => relatoriosPage.exportToPDF();

