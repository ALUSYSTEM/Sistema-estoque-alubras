// Página de Configurações do Sistema de Qualidade
class ConfiguracoesPage {
    constructor() {
        this.settings = {};
        this.currentTab = 'parametros';
    }

    async load(params = {}) {
        try {
            this.showLoading();
            
            // Renderizar página
            this.render();
            
        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
            Utils.showMessage('Erro ao carregar configurações', 'error');
        }
    }

    showLoading() {
        document.getElementById('pageContent').innerHTML = `
            <div class="loading">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Carregando configurações...</span>
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
                            <h6 class="m-0 font-weight-bold text-primary">Configurações do Sistema</h6>
                        </div>
                        <div class="card-body">
                            <!-- Navegação por abas -->
                            <ul class="nav nav-tabs mb-4" id="configTabs" role="tablist">
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link active" id="parametros-tab" data-bs-toggle="tab" 
                                            data-bs-target="#parametros" type="button" role="tab" aria-controls="parametros" aria-selected="true">
                                        <i class="fas fa-sliders-h me-2"></i>Parâmetros de Qualidade
                                    </button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" id="defeitos-tab" data-bs-toggle="tab" 
                                            data-bs-target="#defeitos" type="button" role="tab" aria-controls="defeitos" aria-selected="false">
                                        <i class="fas fa-exclamation-triangle me-2"></i>Tipos de Defeitos
                                    </button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" id="criterios-tab" data-bs-toggle="tab" 
                                            data-bs-target="#criterios" type="button" role="tab" aria-controls="criterios" aria-selected="false">
                                        <i class="fas fa-check-circle me-2"></i>Critérios de Aprovação
                                    </button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" id="notificacoes-tab" data-bs-toggle="tab" 
                                            data-bs-target="#notificacoes" type="button" role="tab" aria-controls="notificacoes" aria-selected="false">
                                        <i class="fas fa-bell me-2"></i>Notificações
                                    </button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" id="usuarios-tab" data-bs-toggle="tab" 
                                            data-bs-target="#usuarios" type="button" role="tab" aria-controls="usuarios" aria-selected="false">
                                        <i class="fas fa-users me-2"></i>Usuários
                                    </button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" id="integracao-tab" data-bs-toggle="tab" 
                                            data-bs-target="#integracao" type="button" role="tab" aria-controls="integracao" aria-selected="false">
                                        <i class="fas fa-plug me-2"></i>Integração
                                    </button>
                                </li>
                            </ul>

                            <!-- Conteúdo das abas -->
                            <div class="tab-content" id="configTabContent">
                                <!-- Parâmetros de Qualidade -->
                                <div class="tab-pane fade show active" id="parametros" role="tabpanel" aria-labelledby="parametros-tab">
                                    ${this.renderParametrosQualidade()}
                                </div>

                                <!-- Tipos de Defeitos -->
                                <div class="tab-pane fade" id="defeitos" role="tabpanel" aria-labelledby="defeitos-tab">
                                    ${this.renderTiposDefeitos()}
                                </div>

                                <!-- Critérios de Aprovação -->
                                <div class="tab-pane fade" id="criterios" role="tabpanel" aria-labelledby="criterios-tab">
                                    ${this.renderCriteriosAprovacao()}
                                </div>

                                <!-- Notificações -->
                                <div class="tab-pane fade" id="notificacoes" role="tabpanel" aria-labelledby="notificacoes-tab">
                                    ${this.renderNotificacoes()}
                                </div>

                                <!-- Usuários -->
                                <div class="tab-pane fade" id="usuarios" role="tabpanel" aria-labelledby="usuarios-tab">
                                    ${this.renderUsuarios()}
                                </div>

                                <!-- Integração -->
                                <div class="tab-pane fade" id="integracao" role="tabpanel" aria-labelledby="integracao-tab">
                                    ${this.renderIntegracao()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('pageContent').innerHTML = content;
        document.getElementById('pageTitle').textContent = 'Configurações';
        
        // Limpar ações da página
        const pageActions = document.getElementById('pageActions');
        if (pageActions) {
            pageActions.innerHTML = '';
        }

        // Configurar event listeners
        this.setupEventListeners();
    }

    // ===== RENDERIZAÇÃO DAS ABAS =====

    renderParametrosQualidade() {
        return `
            <div class="row">
                <div class="col-12">
                    <h5><i class="fas fa-sliders-h text-primary me-2"></i>Parâmetros de Qualidade</h5>
                    <p class="text-muted">Configure os parâmetros gerais do sistema de qualidade</p>
                </div>
            </div>

            <form id="parametrosForm">
                <div class="row">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h6 class="mb-0">Limites de Qualidade</h6>
                            </div>
                            <div class="card-body">
                                <div class="mb-3">
                                    <label for="taxaAprovacaoMinima" class="form-label">Taxa de Aprovação Mínima (%)</label>
                                    <input type="number" class="form-control" id="taxaAprovacaoMinima" 
                                           value="90" min="0" max="100" step="0.1">
                                    <div class="form-text">Percentual mínimo para considerar boa qualidade</div>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="taxaDefeitosMaxima" class="form-label">Taxa de Defeitos Máxima (%)</label>
                                    <input type="number" class="form-control" id="taxaDefeitosMaxima" 
                                           value="5" min="0" max="100" step="0.1">
                                    <div class="form-text">Percentual máximo aceitável de defeitos</div>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="toleranciaDefeitos" class="form-label">Tolerância de Defeitos (unidades)</label>
                                    <input type="number" class="form-control" id="toleranciaDefeitos" 
                                           value="2" min="0" step="1">
                                    <div class="form-text">Número máximo de defeitos aceitáveis por lote</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h6 class="mb-0">Configurações de Inspeção</h6>
                            </div>
                            <div class="card-body">
                                <div class="mb-3">
                                    <label for="amostragemMinima" class="form-label">Amostragem Mínima (%)</label>
                                    <input type="number" class="form-control" id="amostragemMinima" 
                                           value="10" min="1" max="100" step="1">
                                    <div class="form-text">Percentual mínimo de itens a inspecionar</div>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="prazoInspecao" class="form-label">Prazo Máximo para Inspeção (dias)</label>
                                    <input type="number" class="form-control" id="prazoInspecao" 
                                           value="7" min="1" step="1">
                                    <div class="form-text">Prazo limite para realizar inspeções</div>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="reinspecaoObrigatoria" class="form-label">Reinspeção Obrigatória</label>
                                    <select class="form-select" id="reinspecaoObrigatoria">
                                        <option value="true">Sim</option>
                                        <option value="false">Não</option>
                                    </select>
                                    <div class="form-text">Se deve exigir reinspeção em casos de reprovação</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="row mt-3">
                    <div class="col-12">
                        <button type="button" class="btn btn-primary" onclick="configuracoesPage.salvarParametros()">
                            <i class="fas fa-save me-2"></i>Salvar Parâmetros
                        </button>
                        <button type="button" class="btn btn-secondary ms-2" onclick="configuracoesPage.resetarParametros()">
                            <i class="fas fa-undo me-2"></i>Resetar Padrões
                        </button>
                    </div>
                </div>
            </form>
        `;
    }

    renderTiposDefeitos() {
        return `
            <div class="row">
                <div class="col-12">
                    <h5><i class="fas fa-exclamation-triangle text-warning me-2"></i>Tipos de Defeitos Padrão</h5>
                    <p class="text-muted">Configure os tipos de defeitos disponíveis no sistema</p>
                </div>
            </div>

            <div class="row">
                <div class="col-md-8">
                    <div class="card">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h6 class="mb-0">Defeitos Cadastrados</h6>
                            <button class="btn btn-sm btn-primary" onclick="configuracoesPage.adicionarDefeito()">
                                <i class="fas fa-plus me-1"></i>Adicionar Defeito
                            </button>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>Nome</th>
                                            <th>Categoria</th>
                                            <th>Severidade</th>
                                            <th>Ativo</th>
                                            <th>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody id="defeitosTable">
                                        <tr>
                                            <td>Riscos ou arranhões</td>
                                            <td><span class="badge bg-secondary">Visual</span></td>
                                            <td><span class="badge bg-warning">Média</span></td>
                                            <td><span class="badge bg-success">Sim</span></td>
                                            <td>
                                                <button class="btn btn-sm btn-outline-primary" onclick="configuracoesPage.editarDefeito('riscos')">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button class="btn btn-sm btn-outline-danger" onclick="configuracoesPage.removerDefeito('riscos')">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Danos de Pintura</td>
                                            <td><span class="badge bg-secondary">Visual</span></td>
                                            <td><span class="badge bg-danger">Alta</span></td>
                                            <td><span class="badge bg-success">Sim</span></td>
                                            <td>
                                                <button class="btn btn-sm btn-outline-primary" onclick="configuracoesPage.editarDefeito('danos_pintura')">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button class="btn btn-sm btn-outline-danger" onclick="configuracoesPage.removerDefeito('danos_pintura')">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Amassado ou Empeno</td>
                                            <td><span class="badge bg-info">Estrutural</span></td>
                                            <td><span class="badge bg-danger">Alta</span></td>
                                            <td><span class="badge bg-success">Sim</span></td>
                                            <td>
                                                <button class="btn btn-sm btn-outline-primary" onclick="configuracoesPage.editarDefeito('amassado')">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button class="btn btn-sm btn-outline-danger" onclick="configuracoesPage.removerDefeito('amassado')">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0">Categorias de Defeitos</h6>
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <label class="form-label">Visual</label>
                                <div class="progress mb-2" style="height: 20px;">
                                    <div class="progress-bar bg-secondary" style="width: 40%">40%</div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Estrutural</label>
                                <div class="progress mb-2" style="height: 20px;">
                                    <div class="progress-bar bg-info" style="width: 30%">30%</div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Funcional</label>
                                <div class="progress mb-2" style="height: 20px;">
                                    <div class="progress-bar bg-warning" style="width: 20%">20%</div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Acabamento</label>
                                <div class="progress mb-2" style="height: 20px;">
                                    <div class="progress-bar bg-success" style="width: 10%">10%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderCriteriosAprovacao() {
        return `
            <div class="row">
                <div class="col-12">
                    <h5><i class="fas fa-check-circle text-success me-2"></i>Critérios de Aprovação/Reprovação</h5>
                    <p class="text-muted">Configure os critérios para aprovação e reprovação de inspeções</p>
                </div>
            </div>

            <form id="criteriosForm">
                <div class="row">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h6 class="mb-0">Critérios de Aprovação</h6>
                            </div>
                            <div class="card-body">
                                <div class="mb-3">
                                    <label for="defeitosAprovacao" class="form-label">Máximo de Defeitos para Aprovação</label>
                                    <input type="number" class="form-control" id="defeitosAprovacao" 
                                           value="0" min="0" step="1">
                                    <div class="form-text">Número máximo de defeitos para aprovação total</div>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="taxaAprovacaoTotal" class="form-label">Taxa de Aprovação Total (%)</label>
                                    <input type="number" class="form-control" id="taxaAprovacaoTotal" 
                                           value="100" min="0" max="100" step="0.1">
                                    <div class="form-text">Percentual mínimo para aprovação total</div>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="severidadeAprovacao" class="form-label">Severidade Máxima Aceita</label>
                                    <select class="form-select" id="severidadeAprovacao">
                                        <option value="baixa">Baixa</option>
                                        <option value="media" selected>Média</option>
                                        <option value="alta">Alta</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h6 class="mb-0">Critérios de Reprovação</h6>
                            </div>
                            <div class="card-body">
                                <div class="mb-3">
                                    <label for="defeitosReprovacao" class="form-label">Mínimo de Defeitos para Reprovação</label>
                                    <input type="number" class="form-control" id="defeitosReprovacao" 
                                           value="3" min="0" step="1">
                                    <div class="form-text">Número mínimo de defeitos para reprovação</div>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="taxaReprovacao" class="form-label">Taxa de Reprovação (%)</label>
                                    <input type="number" class="form-control" id="taxaReprovacao" 
                                           value="10" min="0" max="100" step="0.1">
                                    <div class="form-text">Percentual de defeitos para reprovação</div>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="severidadeReprovacao" class="form-label">Severidade Crítica</label>
                                    <select class="form-select" id="severidadeReprovacao">
                                        <option value="baixa">Baixa</option>
                                        <option value="media">Média</option>
                                        <option value="alta" selected>Alta</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="row mt-3">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-header">
                                <h6 class="mb-0">Critérios de Aprovação Parcial</h6>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-md-4">
                                        <div class="mb-3">
                                            <label for="defeitosParcialMin" class="form-label">Defeitos Mínimos</label>
                                            <input type="number" class="form-control" id="defeitosParcialMin" 
                                                   value="1" min="0" step="1">
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="mb-3">
                                            <label for="defeitosParcialMax" class="form-label">Defeitos Máximos</label>
                                            <input type="number" class="form-control" id="defeitosParcialMax" 
                                                   value="2" min="0" step="1">
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="mb-3">
                                            <label for="taxaParcial" class="form-label">Taxa de Aprovação Parcial (%)</label>
                                            <input type="number" class="form-control" id="taxaParcial" 
                                                   value="80" min="0" max="100" step="0.1">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="row mt-3">
                    <div class="col-12">
                        <button type="button" class="btn btn-primary" onclick="configuracoesPage.salvarCriterios()">
                            <i class="fas fa-save me-2"></i>Salvar Critérios
                        </button>
                        <button type="button" class="btn btn-secondary ms-2" onclick="configuracoesPage.testarCriterios()">
                            <i class="fas fa-flask me-2"></i>Testar Critérios
                        </button>
                    </div>
                </div>
            </form>
        `;
    }

    renderNotificacoes() {
        return `
            <div class="row">
                <div class="col-12">
                    <h5><i class="fas fa-bell text-info me-2"></i>Notificações e Alertas</h5>
                    <p class="text-muted">Configure as notificações e alertas do sistema</p>
                </div>
            </div>

            <form id="notificacoesForm">
                <div class="row">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h6 class="mb-0">Alertas de Qualidade</h6>
                            </div>
                            <div class="card-body">
                                <div class="mb-3">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="alertaTaxaDefeitos" checked>
                                        <label class="form-check-label" for="alertaTaxaDefeitos">
                                            Alerta quando taxa de defeitos exceder limite
                                        </label>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="alertaReprovacao" checked>
                                        <label class="form-check-label" for="alertaReprovacao">
                                            Notificar sobre inspeções reprovadas
                                        </label>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="alertaRetrabalho" checked>
                                        <label class="form-check-label" for="alertaRetrabalho">
                                            Alertar sobre necessidade de retrabalho
                                        </label>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="alertaPrazo" checked>
                                        <label class="form-check-label" for="alertaPrazo">
                                            Alertar sobre prazos de inspeção
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h6 class="mb-0">Configurações de Email</h6>
                            </div>
                            <div class="card-body">
                                <div class="mb-3">
                                    <label for="emailNotificacoes" class="form-label">Email para Notificações</label>
                                    <input type="email" class="form-control" id="emailNotificacoes" 
                                           placeholder="qualidade@alubras.com">
                                </div>
                                
                                <div class="mb-3">
                                    <label for="frequenciaAlertas" class="form-label">Frequência dos Alertas</label>
                                    <select class="form-select" id="frequenciaAlertas">
                                        <option value="imediato">Imediato</option>
                                        <option value="diario" selected>Diário</option>
                                        <option value="semanal">Semanal</option>
                                    </select>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="horarioAlertas" class="form-label">Horário dos Alertas</label>
                                    <input type="time" class="form-control" id="horarioAlertas" value="08:00">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="row mt-3">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-header">
                                <h6 class="mb-0">Relatórios Automáticos</h6>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-md-4">
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="relatorioDiario" checked>
                                            <label class="form-check-label" for="relatorioDiario">
                                                Relatório Diário
                                            </label>
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="relatorioSemanal">
                                            <label class="form-check-label" for="relatorioSemanal">
                                                Relatório Semanal
                                            </label>
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="relatorioMensal">
                                            <label class="form-check-label" for="relatorioMensal">
                                                Relatório Mensal
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="row mt-3">
                    <div class="col-12">
                        <button type="button" class="btn btn-primary" onclick="configuracoesPage.salvarNotificacoes()">
                            <i class="fas fa-save me-2"></i>Salvar Configurações
                        </button>
                        <button type="btn btn-info ms-2" onclick="configuracoesPage.testarNotificacoes()">
                            <i class="fas fa-paper-plane me-2"></i>Testar Notificações
                        </button>
                    </div>
                </div>
            </form>
        `;
    }

    renderUsuarios() {
        return `
            <div class="row">
                <div class="col-12">
                    <h5><i class="fas fa-users text-secondary me-2"></i>Gerenciamento de Usuários</h5>
                    <p class="text-muted">Gerencie usuários e permissões do sistema</p>
                </div>
            </div>

            <div class="row">
                <div class="col-md-8">
                    <div class="card">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h6 class="mb-0">Usuários Cadastrados</h6>
                            <button class="btn btn-sm btn-primary" onclick="novoUsuario()">
                                <i class="fas fa-plus me-1"></i>Novo Usuário
                            </button>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>Nome</th>
                                            <th>Email</th>
                                            <th>Função</th>
                                            <th>Status</th>
                                            <th>Último Acesso</th>
                                            <th>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody id="usuariosTable">
                                        <tr>
                                            <td>Admin Sistema</td>
                                            <td>admin@alubras.com</td>
                                            <td><span class="badge bg-danger">Administrador</span></td>
                                            <td><span class="badge bg-success">Ativo</span></td>
                                            <td>Hoje, 14:30</td>
                                            <td>
                                                <button class="btn btn-sm btn-outline-primary" onclick="editarUsuario('admin')">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button class="btn btn-sm btn-outline-warning" onclick="alterarSenha('admin')">
                                                    <i class="fas fa-key"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0">Permissões por Função</h6>
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <h6 class="text-danger">Administrador</h6>
                                <ul class="list-unstyled small">
                                    <li><i class="fas fa-check text-success me-1"></i>Acesso total ao sistema</li>
                                    <li><i class="fas fa-check text-success me-1"></i>Gerenciar usuários</li>
                                    <li><i class="fas fa-check text-success me-1"></i>Configurar sistema</li>
                                    <li><i class="fas fa-check text-success me-1"></i>Relatórios avançados</li>
                                </ul>
                            </div>
                            
                            <div class="mb-3">
                                <h6 class="text-info">Inspetor Chefe</h6>
                                <ul class="list-unstyled small">
                                    <li><i class="fas fa-check text-success me-1"></i>Gerenciar inspeções</li>
                                    <li><i class="fas fa-check text-success me-1"></i>Relatórios básicos</li>
                                    <li><i class="fas fa-check text-success me-1"></i>Gerenciar retrabalhos</li>
                                    <li><i class="fas fa-times text-danger me-1"></i>Configurar sistema</li>
                                </ul>
                            </div>
                            
                            <div class="mb-3">
                                <h6 class="text-warning">Inspetor</h6>
                                <ul class="list-unstyled small">
                                    <li><i class="fas fa-check text-success me-1"></i>Realizar inspeções</li>
                                    <li><i class="fas fa-check text-success me-1"></i>Visualizar relatórios</li>
                                    <li><i class="fas fa-times text-danger me-1"></i>Gerenciar usuários</li>
                                    <li><i class="fas fa-times text-danger me-1"></i>Configurar sistema</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderIntegracao() {
        return `
            <div class="row">
                <div class="col-12">
                    <h5><i class="fas fa-plug text-success me-2"></i>Integração com Outros Sistemas</h5>
                    <p class="text-muted">Configure integrações com sistemas externos</p>
                </div>
            </div>

            <div class="row">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0">Sistema de Estoque</h6>
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="integraEstoque" checked>
                                    <label class="form-check-label" for="integraEstoque">
                                        Integrar com Sistema de Estoque
                                    </label>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label for="urlEstoque" class="form-label">URL do Sistema de Estoque</label>
                                <input type="url" class="form-control" id="urlEstoque" 
                                       placeholder="http://localhost:8080" value="http://localhost:8080">
                            </div>
                            
                            <div class="mb-3">
                                <label for="tokenEstoque" class="form-label">Token de Autenticação</label>
                                <input type="password" class="form-control" id="tokenEstoque" 
                                       placeholder="Token de acesso">
                            </div>
                            
                            <button class="btn btn-sm btn-outline-primary" onclick="configuracoesPage.testarIntegracao('estoque')">
                                <i class="fas fa-flask me-1"></i>Testar Conexão
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0">Sistema ERP</h6>
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="integraERP">
                                    <label class="form-check-label" for="integraERP">
                                        Integrar com Sistema ERP
                                    </label>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label for="urlERP" class="form-label">URL do Sistema ERP</label>
                                <input type="url" class="form-control" id="urlERP" 
                                       placeholder="https://erp.alubras.com">
                            </div>
                            
                            <div class="mb-3">
                                <label for="usuarioERP" class="form-label">Usuário ERP</label>
                                <input type="text" class="form-control" id="usuarioERP" 
                                       placeholder="usuario_erp">
                            </div>
                            
                            <div class="mb-3">
                                <label for="senhaERP" class="form-label">Senha ERP</label>
                                <input type="password" class="form-control" id="senhaERP" 
                                       placeholder="Senha de acesso">
                            </div>
                            
                            <button class="btn btn-sm btn-outline-primary" onclick="configuracoesPage.testarIntegracao('erp')">
                                <i class="fas fa-flask me-1"></i>Testar Conexão
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row mt-3">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0">Configurações de Sincronização</h6>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label for="frequenciaSync" class="form-label">Frequência de Sincronização</label>
                                        <select class="form-select" id="frequenciaSync">
                                            <option value="manual">Manual</option>
                                            <option value="hora">A cada hora</option>
                                            <option value="diario" selected>Diário</option>
                                            <option value="semanal">Semanal</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label for="horarioSync" class="form-label">Horário de Sincronização</label>
                                        <input type="time" class="form-control" id="horarioSync" value="02:00">
                                    </div>
                                </div>
                                
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label for="timeoutSync" class="form-label">Timeout (segundos)</label>
                                        <input type="number" class="form-control" id="timeoutSync" 
                                               value="30" min="5" max="300">
                                    </div>
                                </div>
                            </div>
                            
                            <div class="row">
                                <div class="col-12">
                                    <button type="button" class="btn btn-primary" onclick="configuracoesPage.salvarIntegracao()">
                                        <i class="fas fa-save me-2"></i>Salvar Configurações
                                    </button>
                                    <button type="button" class="btn btn-info ms-2" onclick="configuracoesPage.sincronizarAgora()">
                                        <i class="fas fa-sync me-2"></i>Sincronizar Agora
                                    </button>
                                    <button type="button" class="btn btn-warning ms-2" onclick="configuracoesPage.verLogsIntegracao()">
                                        <i class="fas fa-file-alt me-2"></i>Ver Logs
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // ===== FUNÇÕES DE CONFIGURAÇÃO =====

    setupEventListeners() {
        // Aguardar um pouco para garantir que o DOM está carregado
        setTimeout(() => {
            console.log('Configurando event listeners das abas...');
            
            // Event listeners para as abas
            const tabs = document.querySelectorAll('#configTabs button[data-bs-toggle="tab"]');
            console.log('Encontradas abas:', tabs.length);
            
            if (tabs.length === 0) {
                console.error('Nenhuma aba encontrada! Verificando DOM...');
                const configTabs = document.getElementById('configTabs');
                if (configTabs) {
                    console.log('Elemento configTabs encontrado:', configTabs);
                } else {
                    console.error('Elemento configTabs não encontrado!');
                }
                return;
            }
            
            tabs.forEach((tab, index) => {
                console.log(`Configurando aba ${index + 1}:`, tab.id);
                
                // Remover classes ativas de todas as abas
                tab.classList.remove('active');
                
                tab.addEventListener('click', (event) => {
                    console.log('Clique na aba:', event.target.id);
                    
                    // Remover classe active de todas as abas
                    tabs.forEach(t => {
                        t.classList.remove('active');
                        t.setAttribute('aria-selected', 'false');
                    });
                    
                    // Adicionar classe active na aba clicada
                    event.target.classList.add('active');
                    event.target.setAttribute('aria-selected', 'true');
                    
                    // Mostrar/ocultar conteúdo das abas
                    const targetId = event.target.getAttribute('data-bs-target').replace('#', '');
                    const allPanes = document.querySelectorAll('#configTabContent .tab-pane');
                    
                    allPanes.forEach(pane => {
                        pane.classList.remove('active', 'show');
                    });
                    
                    const targetPane = document.getElementById(targetId);
                    if (targetPane) {
                        targetPane.classList.add('active', 'show');
                    }
                });
                
                tab.addEventListener('shown.bs.tab', (event) => {
                    const target = event.target.getAttribute('data-bs-target');
                    this.currentTab = target.replace('#', '');
                    console.log('Aba ativa:', this.currentTab);
                });
            });

            // Verificar se Bootstrap está carregado
            if (typeof bootstrap === 'undefined') {
                console.warn('Bootstrap não está carregado');
            } else {
                console.log('Bootstrap carregado');
            }
            
            // Testar se as abas estão funcionando
            const usuariosTab = document.getElementById('usuarios-tab');
            if (usuariosTab) {
                console.log('Aba Usuários encontrada:', usuariosTab);
            } else {
                console.error('Aba Usuários não encontrada!');
            }
            
            // Ativar a primeira aba por padrão
            if (tabs.length > 0) {
                const firstTab = tabs[0];
                firstTab.classList.add('active');
                firstTab.setAttribute('aria-selected', 'true');
                
                const firstPane = document.getElementById('parametros');
                if (firstPane) {
                    firstPane.classList.add('active', 'show');
                }
            }
            
        }, 300);
    }

    // Parâmetros de Qualidade
    salvarParametros() {
        const parametros = {
            taxaAprovacaoMinima: document.getElementById('taxaAprovacaoMinima').value,
            taxaDefeitosMaxima: document.getElementById('taxaDefeitosMaxima').value,
            toleranciaDefeitos: document.getElementById('toleranciaDefeitos').value,
            amostragemMinima: document.getElementById('amostragemMinima').value,
            prazoInspecao: document.getElementById('prazoInspecao').value,
            reinspecaoObrigatoria: document.getElementById('reinspecaoObrigatoria').value
        };
        
        console.log('Salvando parâmetros:', parametros);
        Utils.showMessage('Parâmetros de qualidade salvos com sucesso!', 'success');
    }

    resetarParametros() {
        document.getElementById('taxaAprovacaoMinima').value = 90;
        document.getElementById('taxaDefeitosMaxima').value = 5;
        document.getElementById('toleranciaDefeitos').value = 2;
        document.getElementById('amostragemMinima').value = 10;
        document.getElementById('prazoInspecao').value = 7;
        document.getElementById('reinspecaoObrigatoria').value = 'true';
        
        Utils.showMessage('Parâmetros resetados para valores padrão!', 'info');
    }

    // Tipos de Defeitos
    adicionarDefeito() {
        Utils.showMessage('Funcionalidade de adicionar defeito será implementada', 'info');
    }

    editarDefeito(tipo) {
        Utils.showMessage(`Editando defeito: ${tipo}`, 'info');
    }

    removerDefeito(tipo) {
        Utils.showMessage(`Removendo defeito: ${tipo}`, 'info');
    }

    // Critérios de Aprovação
    salvarCriterios() {
        const criterios = {
            defeitosAprovacao: document.getElementById('defeitosAprovacao').value,
            taxaAprovacaoTotal: document.getElementById('taxaAprovacaoTotal').value,
            severidadeAprovacao: document.getElementById('severidadeAprovacao').value,
            defeitosReprovacao: document.getElementById('defeitosReprovacao').value,
            taxaReprovacao: document.getElementById('taxaReprovacao').value,
            severidadeReprovacao: document.getElementById('severidadeReprovacao').value
        };
        
        console.log('Salvando critérios:', criterios);
        Utils.showMessage('Critérios de aprovação salvos com sucesso!', 'success');
    }

    testarCriterios() {
        Utils.showMessage('Testando critérios de aprovação...', 'info');
    }

    // Notificações
    salvarNotificacoes() {
        const notificacoes = {
            alertaTaxaDefeitos: document.getElementById('alertaTaxaDefeitos').checked,
            alertaReprovacao: document.getElementById('alertaReprovacao').checked,
            alertaRetrabalho: document.getElementById('alertaRetrabalho').checked,
            alertaPrazo: document.getElementById('alertaPrazo').checked,
            emailNotificacoes: document.getElementById('emailNotificacoes').value,
            frequenciaAlertas: document.getElementById('frequenciaAlertas').value,
            horarioAlertas: document.getElementById('horarioAlertas').value
        };
        
        console.log('Salvando notificações:', notificacoes);
        Utils.showMessage('Configurações de notificação salvas com sucesso!', 'success');
    }

    testarNotificacoes() {
        Utils.showMessage('Enviando notificação de teste...', 'info');
    }

    // Usuários
    novoUsuario() {
        Utils.showMessage('Abrindo formulário de novo usuário...', 'info');
    }

    editarUsuario(id) {
        Utils.showMessage(`Editando usuário: ${id}`, 'info');
    }

    alterarSenha(id) {
        Utils.showMessage(`Alterando senha do usuário: ${id}`, 'info');
    }

    // Integração
    salvarIntegracao() {
        const integracao = {
            integraEstoque: document.getElementById('integraEstoque').checked,
            urlEstoque: document.getElementById('urlEstoque').value,
            tokenEstoque: document.getElementById('tokenEstoque').value,
            integraERP: document.getElementById('integraERP').checked,
            urlERP: document.getElementById('urlERP').value,
            usuarioERP: document.getElementById('usuarioERP').value,
            senhaERP: document.getElementById('senhaERP').value,
            frequenciaSync: document.getElementById('frequenciaSync').value,
            horarioSync: document.getElementById('horarioSync').value,
            timeoutSync: document.getElementById('timeoutSync').value
        };
        
        console.log('Salvando integração:', integracao);
        Utils.showMessage('Configurações de integração salvas com sucesso!', 'success');
    }

    testarIntegracao(sistema) {
        Utils.showMessage(`Testando conexão com ${sistema}...`, 'info');
    }

    sincronizarAgora() {
        Utils.showMessage('Iniciando sincronização...', 'info');
    }

    verLogsIntegracao() {
        Utils.showMessage('Abrindo logs de integração...', 'info');
    }

    unload() {
        // Limpar recursos quando sair da página
    }
}

// Inicializar página de configurações
const configuracoesPage = new ConfiguracoesPage();

// Exportar para uso global
window.ConfiguracoesPage = ConfiguracoesPage;
window.configuracoesPage = configuracoesPage;

// Exportar funções específicas para uso em onclick
window.salvarParametros = () => configuracoesPage.salvarParametros();
window.resetarParametros = () => configuracoesPage.resetarParametros();
window.adicionarDefeito = () => configuracoesPage.adicionarDefeito();
window.editarDefeito = (tipo) => configuracoesPage.editarDefeito(tipo);
window.removerDefeito = (tipo) => configuracoesPage.removerDefeito(tipo);
window.salvarCriterios = () => configuracoesPage.salvarCriterios();
window.testarCriterios = () => configuracoesPage.testarCriterios();
window.salvarNotificacoes = () => configuracoesPage.salvarNotificacoes();
window.testarNotificacoes = () => configuracoesPage.testarNotificacoes();
window.novoUsuario = () => configuracoesPage.novoUsuario();
window.editarUsuario = (id) => configuracoesPage.editarUsuario(id);
window.alterarSenha = (id) => configuracoesPage.alterarSenha(id);
window.salvarIntegracao = () => configuracoesPage.salvarIntegracao();
window.testarIntegracao = (sistema) => configuracoesPage.testarIntegracao(sistema);
window.sincronizarAgora = () => configuracoesPage.sincronizarAgora();
window.verLogsIntegracao = () => configuracoesPage.verLogsIntegracao();

