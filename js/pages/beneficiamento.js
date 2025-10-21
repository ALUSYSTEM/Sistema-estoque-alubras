// Página de Beneficiamento
class BeneficiamentoPage {
    constructor() {
        this.beneficiamentos = [];
        this.currentFilters = {};
        this.listeners = [];
    }

    async load(params = {}) {
        try {
            this.showLoading();
            
            // Verificar se deve criar novo beneficiamento
            if (params.action === 'create') {
                this.showBeneficiamentoModal();
                return;
            }

            // Carregar beneficiamentos
            await this.loadBeneficiamentos();
            
            // Renderizar página
            this.render();
            
            // Configurar listeners para atualizações em tempo real
            this.setupRealtimeListeners();
            
        } catch (error) {
            console.error('Erro ao carregar beneficiamentos:', error);
            Utils.showMessage('Erro ao carregar beneficiamentos', 'error');
        }
    }

    showLoading() {
        document.getElementById('pageContent').innerHTML = `
            <div class="loading">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Carregando beneficiamentos...</span>
                </div>
            </div>
        `;
    }

    async loadBeneficiamentos() {
        try {
            this.beneficiamentos = await databaseManager.getBeneficiamentos(this.currentFilters);
        } catch (error) {
            console.error('Erro ao carregar beneficiamentos:', error);
            throw error;
        }
    }

    render() {
        const content = `
            <!-- Filtros -->
            <div class="row mb-3">
                <div class="col-md-3">
                    <select class="form-select" id="filtroStatus">
                        <option value="">Todos os status</option>
                        <option value="PENDENTE">Pendente</option>
                        <option value="EM_ANDAMENTO">Em Andamento</option>
                        <option value="CONCLUIDO">Concluído</option>
                        <option value="RETORNADO">Retornado</option>
                    </select>
                </div>
                <div class="col-md-6">
                    <div class="input-group">
                        <input type="text" class="form-control" id="searchBeneficiamentos" 
                               placeholder="Pesquisar por produto...">
                        <button class="btn btn-outline-secondary" type="button" id="clearSearchBeneficiamentos">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <div class="col-md-3 text-end">
                    <div class="btn-group" role="group">
                        <button class="btn btn-success" onclick="beneficiamentoPage.showImportModal()" title="Importar do Excel">
                            <i class="fas fa-file-excel me-2"></i>Importar Excel
                        </button>
                        <button class="btn btn-primary" onclick="beneficiamentoPage.showBeneficiamentoModal()">
                            <i class="fas fa-plus me-2"></i>Novo Beneficiamento
                        </button>
                    </div>
                </div>
            </div>

            <!-- Tabela de Beneficiamentos -->
            <div class="card shadow">
                <div class="card-header py-3">
                    <h6 class="m-0 font-weight-bold text-primary">Beneficiamentos</h6>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive" style="max-height: 70vh; overflow-y: auto;">
                        <table class="table table-bordered table-hover mb-0" id="beneficiamentosTable">
                            <thead class="table-dark sticky-top">
                                <tr>
                                    <th style="min-width: 120px;">Data</th>
                                    <th style="min-width: 200px;">Produto</th>
                                    <th style="min-width: 100px;">Quantidade</th>
                                    <th style="min-width: 150px;">Tipo</th>
                                    <th style="min-width: 100px;">Tamanho</th>
                                    <th style="min-width: 120px;">NF Entrada</th>
                                    <th style="min-width: 120px;">NF Saída</th>
                                    <th style="min-width: 150px;">Projeto</th>
                                    <th style="min-width: 120px;">Localização</th>
                                    <th style="min-width: 120px;">Destino</th>
                                    <th style="min-width: 120px;">Status</th>
                                    <th style="min-width: 120px;">Retorno</th>
                                    <th style="min-width: 120px;">Usuário</th>
                                    <th style="min-width: 100px;">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.renderBeneficiamentosTable()}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('pageContent').innerHTML = content;
        this.setupEventListeners();
        document.getElementById('pageTitle').textContent = 'Beneficiamento';
        
        // Buscar botões de ação da página
        const pageActions = document.getElementById('pageActions');
        if (pageActions) {
            pageActions.innerHTML = `
                <div class="btn-group" role="group">
                    <button class="btn btn-success" onclick="beneficiamentoPage.showImportModal()" title="Importar do Excel">
                        <i class="fas fa-file-excel me-2"></i>Importar Excel
                    </button>
                    <button class="btn btn-primary" onclick="beneficiamentoPage.showBeneficiamentoModal()">
                        <i class="fas fa-plus me-2"></i>Novo Beneficiamento
                    </button>
                    <button class="btn btn-danger" onclick="beneficiamentoPage.showClearAllModal()" title="Limpar todos os beneficiamentos">
                        <i class="fas fa-trash-alt me-2"></i>Limpar Tudo
                    </button>
                </div>
            `;
        }
    }

    renderBeneficiamentosTable() {
        if (this.beneficiamentos.length === 0) {
            return `
                <tr>
                    <td colspan="14" class="text-center py-4">
                        <i class="fas fa-paint-brush fa-3x text-muted mb-3"></i>
                        <p class="text-muted">Nenhum beneficiamento encontrado</p>
                    </td>
                </tr>
            `;
        }

        return this.beneficiamentos.map(ben => {
            const statusConfig = this.getStatusConfig(ben.status);
            
            return `
                <tr>
                    <td>${Utils.formatDate(ben.data_criacao, true)}</td>
                    <td>
                        <strong>${ben.produto?.codigo || 'N/A'}</strong><br>
                        <small>${ben.produto?.descricao || 'N/A'}</small>
                    </td>
                    <td>
                        <span class="badge bg-primary">
                            ${Utils.formatNumber(ben.quantidade || 0, 2)}
                        </span>
                    </td>
                    <td>${ben.tipo_beneficiamento || '-'}</td>
                    <td>${ben.tamanho || '-'}</td>
                    <td>${ben.nf_entrada || '-'}</td>
                    <td>${ben.nf_saida || '-'}</td>
                    <td>${ben.projeto || '-'}</td>
                    <td>${ben.localizacao || '-'}</td>
                    <td>${ben.destino || '-'}</td>
                    <td>
                        <span class="badge bg-${statusConfig.class}">
                            ${statusConfig.label}
                        </span>
                    </td>
                    <td>${ben.retorno || '-'}</td>
                    <td>
                        <small>${ben.usuario_nome || 'Sistema'}</small>
                    </td>
                    <td class="text-center">
                        <div class="btn-group" role="group">
                            <button type="button" class="btn btn-outline-info btn-sm" 
                                    onclick="beneficiamentoPage.viewBeneficiamento('${ben.id}')" 
                                    title="Visualizar">
                                <i class="fas fa-eye"></i>
                            </button>
                            ${this.canEdit(ben) ? `
                            <button type="button" class="btn btn-outline-warning btn-sm" 
                                    onclick="beneficiamentoPage.editBeneficiamento('${ben.id}')" 
                                    title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            ` : ''}
                            ${this.canUpdateStatus(ben) ? `
                            <button type="button" class="btn btn-outline-success btn-sm" 
                                    onclick="beneficiamentoPage.updateStatusModal('${ben.id}')" 
                                    title="Atualizar Status">
                                <i class="fas fa-check"></i>
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
            'PENDENTE': { class: 'warning', label: 'Pendente' },
            'EM_ANDAMENTO': { class: 'info', label: 'Em Andamento' },
            'CONCLUIDO': { class: 'success', label: 'Concluído' },
            'RETORNADO': { class: 'danger', label: 'Retornado' }
        };
        
        return configs[status] || { class: 'secondary', label: status };
    }

    canEdit(beneficiamento) {
        return authManager.hasPermission('editar') && 
               beneficiamento.status !== 'CONCLUIDO' && 
               beneficiamento.status !== 'RETORNADO';
    }

    canUpdateStatus(beneficiamento) {
        return authManager.hasPermission('editar') && 
               beneficiamento.status !== 'RETORNADO';
    }

    setupEventListeners() {
        // Pesquisa em tempo real
        const searchInput = document.getElementById('searchBeneficiamentos');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce(() => {
                this.filterBeneficiamentos(searchInput.value);
            }, 300));
        }

        // Botão limpar pesquisa
        const clearBtn = document.getElementById('clearSearchBeneficiamentos');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                document.getElementById('searchBeneficiamentos').value = '';
                this.filterBeneficiamentos('');
            });
        }

        // Filtro por status
        const filtroStatus = document.getElementById('filtroStatus');
        if (filtroStatus) {
            filtroStatus.addEventListener('change', () => {
                this.currentFilters.status = filtroStatus.value || null;
                this.load();
            });
        }
    }

    filterBeneficiamentos(searchTerm) {
        const table = document.getElementById('beneficiamentosTable');
        if (!table) return;

        const rows = table.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
        const term = searchTerm.toLowerCase();

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const cells = row.getElementsByTagName('td');
            let found = false;

            if (cells.length > 1) {
                // Buscar no produto (segunda célula)
                const produtoText = cells[1].textContent.toLowerCase();
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

        // Listener para beneficiamentos
        const beneficiamentoListener = databaseManager.onBeneficiamentoChange(async () => {
            await this.loadBeneficiamentos();
            this.updateTable();
        });

        this.listeners = [beneficiamentoListener];
    }

    updateTable() {
        const tbody = document.querySelector('#beneficiamentosTable tbody');
        if (tbody) {
            tbody.innerHTML = this.renderBeneficiamentosTable();
        }
    }

    // Modal de beneficiamento
    showBeneficiamentoModal(beneficiamentoId = null) {
        if (beneficiamentoId) {
            this.loadBeneficiamentoForEdit(beneficiamentoId);
        } else {
            this.renderBeneficiamentoModal();
        }
    }

    async loadBeneficiamentoForEdit(beneficiamentoId) {
        try {
            const beneficiamento = this.beneficiamentos.find(b => b.id === beneficiamentoId);
            if (beneficiamento) {
                this.renderBeneficiamentoModal(beneficiamento);
            }
        } catch (error) {
            console.error('Erro ao carregar beneficiamento:', error);
            Utils.showMessage('Erro ao carregar beneficiamento', 'error');
        }
    }

    async renderBeneficiamentoModal(beneficiamento = null) {
        const isEdit = beneficiamento !== null;
        const title = isEdit ? 'Editar Beneficiamento' : 'Novo Beneficiamento';
        
        // Carregar produtos
        const produtos = await databaseManager.getProdutos({ ativo: true });
        
        const content = `
            <form id="beneficiamentoForm">
                <div class="row">
                    <div class="col-md-12">
                        <div class="mb-3">
                            <label for="produto_id" class="form-label">Produto *</label>
                            <select class="form-control" id="produto_id" required ${isEdit ? 'disabled' : ''}>
                                <option value="">Selecione um produto...</option>
                                ${produtos.map(p => `
                                    <option value="${p.id}" ${beneficiamento && beneficiamento.produto_id === p.id ? 'selected' : ''}>
                                        ${p.codigo} - ${p.descricao}
                                    </option>
                                `).join('')}
                            </select>
                            ${isEdit ? '<input type="hidden" id="produto_id_hidden" value="' + beneficiamento.produto_id + '">' : ''}
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="quantidade" class="form-label">Quantidade *</label>
                            <input type="number" class="form-control" id="quantidade" required min="0.01" step="0.01" 
                                   value="${beneficiamento ? beneficiamento.quantidade : ''}">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="tipo_beneficiamento" class="form-label">Tipo de Beneficiamento</label>
                            <select class="form-control" id="tipo_beneficiamento">
                                <option value="">Selecione...</option>
                                <option value="Lavagem" ${beneficiamento && beneficiamento.tipo_beneficiamento === 'Lavagem' ? 'selected' : ''}>Lavagem</option>
                                <option value="Secagem" ${beneficiamento && beneficiamento.tipo_beneficiamento === 'Secagem' ? 'selected' : ''}>Secagem</option>
                                <option value="Corte" ${beneficiamento && beneficiamento.tipo_beneficiamento === 'Corte' ? 'selected' : ''}>Corte</option>
                                <option value="Embalagem" ${beneficiamento && beneficiamento.tipo_beneficiamento === 'Embalagem' ? 'selected' : ''}>Embalagem</option>
                                <option value="Outro" ${beneficiamento && beneficiamento.tipo_beneficiamento === 'Outro' ? 'selected' : ''}>Outro</option>
                            </select>
                        </div>
                    </div>
                </div>

                ${isEdit ? `
                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="status" class="form-label">Status</label>
                            <select class="form-control" id="status">
                                <option value="PENDENTE" ${beneficiamento.status === 'PENDENTE' ? 'selected' : ''}>Pendente</option>
                                <option value="EM_ANDAMENTO" ${beneficiamento.status === 'EM_ANDAMENTO' ? 'selected' : ''}>Em Andamento</option>
                                <option value="CONCLUIDO" ${beneficiamento.status === 'CONCLUIDO' ? 'selected' : ''}>Concluído</option>
                                <option value="RETORNADO" ${beneficiamento.status === 'RETORNADO' ? 'selected' : ''}>Retornado</option>
                            </select>
                        </div>
                    </div>
                </div>
                ` : ''}

                <div class="row">
                    <div class="col-md-12">
                        <div class="mb-3">
                            <label for="observacoes" class="form-label">Observações</label>
                            <textarea class="form-control" id="observacoes" rows="3">${beneficiamento ? beneficiamento.observacoes : ''}</textarea>
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
                action: `beneficiamentoPage.${isEdit ? 'updateBeneficiamento' : 'saveBeneficiamento'}('${beneficiamento ? beneficiamento.id : ''}')`
            }
        ];

        Utils.showModal(title, content, actions);
    }

    async saveBeneficiamento() {
        try {
            if (!Utils.validateForm('beneficiamentoForm')) {
                Utils.showMessage('Por favor, preencha todos os campos obrigatórios', 'warning');
                return;
            }

            const beneficiamentoData = {
                produto_id: document.getElementById('produto_id').value,
                quantidade: parseFloat(document.getElementById('quantidade').value),
                tipo_beneficiamento: document.getElementById('tipo_beneficiamento').value || null,
                observacoes: document.getElementById('observacoes').value.trim() || null,
                usuario_nome: window.currentUserData ? window.currentUserData.nome : 'Sistema'
            };

            await databaseManager.addBeneficiamento(beneficiamentoData);
            Utils.showMessage('Beneficiamento criado com sucesso!', 'success');
            
            // Recarregar página
            await this.loadBeneficiamentos();
            this.updateTable();
            
        } catch (error) {
            console.error('Erro ao salvar beneficiamento:', error);
            Utils.showMessage('Erro ao salvar beneficiamento', 'error');
        }
    }

    async updateBeneficiamento(beneficiamentoId) {
        try {
            if (!Utils.validateForm('beneficiamentoForm')) {
                Utils.showMessage('Por favor, preencha todos os campos obrigatórios', 'warning');
                return;
            }

            const beneficiamentoData = {
                quantidade: parseFloat(document.getElementById('quantidade').value),
                tipo_beneficiamento: document.getElementById('tipo_beneficiamento').value || null,
                observacoes: document.getElementById('observacoes').value.trim() || null
            };

            // Se há campo de status, incluir na atualização
            const statusField = document.getElementById('status');
            if (statusField) {
                beneficiamentoData.status = statusField.value;
            }

            await databaseManager.updateBeneficiamento(beneficiamentoId, beneficiamentoData);
            Utils.showMessage('Beneficiamento atualizado com sucesso!', 'success');
            
            // Recarregar página
            await this.loadBeneficiamentos();
            this.updateTable();
            
        } catch (error) {
            console.error('Erro ao atualizar beneficiamento:', error);
            Utils.showMessage('Erro ao atualizar beneficiamento', 'error');
        }
    }

    async updateStatusModal(beneficiamentoId) {
        const beneficiamento = this.beneficiamentos.find(b => b.id === beneficiamentoId);
        if (!beneficiamento) return;

        const content = `
            <form id="statusForm">
                <div class="mb-3">
                    <label for="novo_status" class="form-label">Novo Status *</label>
                    <select class="form-control" id="novo_status" required>
                        ${this.getStatusOptions(beneficiamento.status)}
                    </select>
                </div>
                <div class="mb-3">
                    <label for="observacao_status" class="form-label">Observação sobre a mudança</label>
                    <textarea class="form-control" id="observacao_status" rows="2" 
                              placeholder="Descrição sobre a mudança de status..."></textarea>
                </div>
            </form>
        `;

        const actions = [
            {
                text: 'Cancelar',
                class: 'secondary'
            },
            {
                text: 'Atualizar Status',
                class: 'success',
                action: `beneficiamentoPage.updateStatus('${beneficiamentoId}')`
            }
        ];

        Utils.showModal('Atualizar Status', content, actions);
    }

    getStatusOptions(currentStatus) {
        const options = [
            { value: 'PENDENTE', label: 'Pendente' },
            { value: 'EM_ANDAMENTO', label: 'Em Andamento' },
            { value: 'CONCLUIDO', label: 'Concluído' },
            { value: 'RETORNADO', label: 'Retornado' }
        ];

        return options.map(option => `
            <option value="${option.value}" ${option.value === currentStatus ? 'selected' : ''}>
                ${option.label}
            </option>
        `).join('');
    }

    async updateStatus(beneficiamentoId) {
        try {
            const novoStatus = document.getElementById('novo_status').value;
            const observacao = document.getElementById('observacao_status').value;

            const updates = {
                status: novoStatus
            };

            if (observacao.trim()) {
                const beneficiamento = this.beneficiamentos.find(b => b.id === beneficiamentoId);
                const observacoesAtual = beneficiamento.observacoes || '';
                updates.observacoes = observacoesAtual + 
                    (observacoesAtual ? '\n\n' : '') + 
                    `[${Utils.formatDate(new Date(), true)}] ${observacao}`;
            }

            await databaseManager.updateBeneficiamento(beneficiamentoId, updates);
            Utils.showMessage('Status atualizado com sucesso!', 'success');
            
            // Recarregar página
            await this.loadBeneficiamentos();
            this.updateTable();
            
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            Utils.showMessage('Erro ao atualizar status', 'error');
        }
    }

    viewBeneficiamento(beneficiamentoId) {
        const beneficiamento = this.beneficiamentos.find(b => b.id === beneficiamentoId);
        if (!beneficiamento) return;

        const statusConfig = this.getStatusConfig(beneficiamento.status);

        const content = `
            <div class="row">
                <div class="col-md-6">
                    <p><strong>Data:</strong> ${Utils.formatDate(beneficiamento.data_criacao, true)}</p>
                    <p><strong>Produto:</strong> ${beneficiamento.produto?.codigo} - ${beneficiamento.produto?.descricao}</p>
                    <p><strong>Quantidade:</strong> ${Utils.formatNumber(beneficiamento.quantidade, 2)}</p>
                    <p><strong>Tipo:</strong> ${beneficiamento.tipo_beneficiamento || '-'}</p>
                    <p><strong>Tamanho:</strong> ${beneficiamento.tamanho || '-'}</p>
                    <p><strong>NF Entrada:</strong> ${beneficiamento.nf_entrada || '-'}</p>
                </div>
                <div class="col-md-6">
                    <p><strong>Status:</strong> 
                        <span class="badge bg-${statusConfig.class}">
                            ${statusConfig.label}
                        </span>
                    </p>
                    <p><strong>NF Saída:</strong> ${beneficiamento.nf_saida || '-'}</p>
                    <p><strong>Projeto:</strong> ${beneficiamento.projeto || '-'}</p>
                    <p><strong>Localização:</strong> ${beneficiamento.localizacao || '-'}</p>
                    <p><strong>Destino:</strong> ${beneficiamento.destino || '-'}</p>
                    <p><strong>Retorno:</strong> ${beneficiamento.retorno || '-'}</p>
                    <p><strong>Usuário:</strong> ${beneficiamento.usuario_nome || 'Sistema'}</p>
                </div>
            </div>
            ${beneficiamento.observacoes ? `<p><strong>Observações:</strong> ${beneficiamento.observacoes}</p>` : ''}
        `;

        Utils.showModal('Detalhes do Beneficiamento', content, [
            { text: 'Fechar', class: 'secondary' }
        ]);
    }

    editBeneficiamento(beneficiamentoId) {
        this.showBeneficiamentoModal(beneficiamentoId);
    }

    // Modal de importação Excel
    showImportModal() {
        const content = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i>
                <strong>Formato da Planilha:</strong><br>
                Colunas necessárias (15 colunas): DATA, CODE, GO, DESCRIÇÃO, VARIANTES, ESPECIFICAÇÃO PARA A PINT, TAMANHO, QUANTIDAD, NF DE ENTRADA, NF DE SAÍDA, PROJET, LOCALIZAÇÃO, DESTINO, STATUS, RETORNO<br>
                <strong>Obrigatórias:</strong> CODE (código do produto) e QUANTIDAD (quantidade).<br>
                <small class="text-muted">Produtos que não existem no sistema são criados automaticamente durante a importação.</small>
            </div>
            
            <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <label for="excelFileBeneficiamento" class="form-label mb-0">Selecione o arquivo Excel (.xlsx)</label>
                    <button type="button" class="btn btn-outline-primary btn-sm" onclick="beneficiamentoPage.downloadTemplate()">
                        <i class="fas fa-download me-1"></i>Baixar Planilha Exemplo
                    </button>
                </div>
                <input type="file" class="form-control" id="excelFileBeneficiamento" accept=".xlsx,.xls" required>
                <div class="form-text">Formato aceito: Excel (.xlsx, .xls) - Use a planilha exemplo como base</div>
            </div>
            
            <div id="importPreviewBeneficiamento" class="mt-3" style="display: none;">
                <h6>Pré-visualização dos dados:</h6>
                <div class="table-responsive" style="max-height: 300px; overflow-y: auto;">
                    <table class="table table-sm table-bordered" id="previewTableBeneficiamento">
                        <thead class="table-light">
                            <tr id="previewHeaderBeneficiamento"></tr>
                        </thead>
                        <tbody id="previewBodyBeneficiamento"></tbody>
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
                action: 'beneficiamentoPage.processImport()'
            }
        ];

        Utils.showModal('Importar Beneficiamentos do Excel', content, actions);
        
        // Configurar listener do arquivo
        const fileInput = document.getElementById('excelFileBeneficiamento');
        fileInput.addEventListener('change', (e) => {
            this.previewExcelFile(e.target.files[0]);
        });
    }

    async downloadTemplate() {
        try {
            // Buscar produtos reais para criar exemplos mais úteis
            const produtos = await databaseManager.getProdutos({ ativo: true });

            // Criar dados de exemplo baseados nos dados reais do sistema
            const hoje = new Date();
            const dataExemplo1 = new Date(hoje.getTime() - (24 * 60 * 60 * 1000)); // Ontem
            const dataExemplo2 = new Date(hoje.getTime() - (2 * 24 * 60 * 60 * 1000)); // 2 dias atrás

            const dadosExemplo = [
                // Cabeçalho - EXATAMENTE como na planilha original (baseado na imagem)
                ['DATA', 'CODE', 'GO', 'DESCRIÇÃO', 'VARIANTES', 'ESPECIFICAÇÃO PARA A PINT', 'TAMANHO', 'QUANTIDAD', 'NF DE ENTRADA', 'NF DE SAÍDA', 'PROJET', 'LOCALIZAÇÃO', 'DESTINO', 'STATUS', 'RETORNO'],
                // Dados de exemplo - 16 colunas exatamente como na planilha original
                [
                    this.formatDateTimeForExcel(dataExemplo1),                                           // 0: DATA
                    produtos.length > 0 ? produtos[0].codigo : 'T-KP116',                               // 1: CODE
                    'GO001',                                                                            // 2: GO
                    produtos.length > 0 ? produtos[0].descricao : 'PISTA PARA TRILHO CLICADO',          // 3: DESCRIÇÃO
                    'FOSCO',                                                                            // 4: VARIANTES
                    'ESPECIFICAÇÃO DE PINTURA',                                                         // 5: ESPECIFICAÇÃO PARA A PINT
                    '6000',                                                                             // 6: TAMANHO
                    '100',                                                                              // 7: QUANTIDAD
                    'NF001',                                                                            // 8: NF DE ENTRADA
                    '',                                                                                 // 9: NF DE SAÍDA
                    '1260 - CLARIS',                                                                    // 10: PROJET
                    'P-B07',                                                                            // 11: LOCALIZAÇÃO
                    'PRODUÇÃO',                                                                         // 12: DESTINO
                    'PENDENTE',                                                                         // 13: STATUS
                    ''                                                                                  // 14: RETORNO
                ],
                [
                    this.formatDateTimeForExcel(dataExemplo2),                                           // 0: DATA
                    produtos.length > 1 ? produtos[1].codigo : 'BROCAC9.64',                            // 1: CODE
                    'GO002',                                                                            // 2: GO
                    produtos.length > 1 ? produtos[1].descricao : 'BROCA AÇO RÁPIDO 9/64',              // 3: DESCRIÇÃO
                    'PADRAO',                                                                           // 4: VARIANTES
                    '',                                                                                 // 5: ESPECIFICAÇÃO PARA A PINT
                    '3000',                                                                             // 6: TAMANHO
                    '50',                                                                               // 7: QUANTIDAD
                    '',                                                                                 // 8: NF DE ENTRADA
                    'NF002',                                                                            // 9: NF DE SAÍDA
                    '1100 - EXPANSO',                                                                   // 10: PROJET
                    'P-A05',                                                                            // 11: LOCALIZAÇÃO
                    'EXPEDIÇÃO',                                                                        // 12: DESTINO
                    'CONCLUIDO',                                                                        // 13: STATUS
                    'RETORNO OK'                                                                        // 14: RETORNO
                ],
                [
                    this.formatDateTimeForExcel(hoje),                                                  // 0: DATA
                    produtos.length > 0 ? produtos[0].codigo : 'T-KP116',                               // 1: CODE
                    'GO003',                                                                            // 2: GO
                    produtos.length > 0 ? produtos[0].descricao : 'PISTA PARA TRILHO CLICADO',          // 3: DESCRIÇÃO
                    'FOSCO',                                                                            // 4: VARIANTES
                    'ACABAMENTO FINAL',                                                                 // 5: ESPECIFICAÇÃO PARA A PINT
                    '6000',                                                                             // 6: TAMANHO
                    '25',                                                                               // 7: QUANTIDAD
                    'NF003',                                                                            // 8: NF DE ENTRADA
                    'NF004',                                                                            // 9: NF DE SAÍDA
                    '1260 - CLARIS',                                                                    // 10: PROJET
                    'P-B07',                                                                            // 11: LOCALIZAÇÃO
                    'PRODUÇÃO',                                                                         // 12: DESTINO
                    'EM_ANDAMENTO',                                                                     // 13: STATUS
                    ''                                                                                  // 14: RETORNO
                ]
            ];

            // Criar arquivo Excel
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(dadosExemplo);

            // Ajustar largura das colunas - 15 colunas exatamente como na planilha original
            const colWidths = [
                { wch: 20 }, // 0: DATA
                { wch: 12 }, // 1: CODE
                { wch: 10 }, // 2: GO
                { wch: 35 }, // 3: DESCRIÇÃO
                { wch: 15 }, // 4: VARIANTES
                { wch: 25 }, // 5: ESPECIFICAÇÃO PARA A PINT
                { wch: 12 }, // 6: TAMANHO
                { wch: 12 }, // 7: QUANTIDAD
                { wch: 15 }, // 8: NF DE ENTRADA
                { wch: 15 }, // 9: NF DE SAÍDA
                { wch: 20 }, // 10: PROJET
                { wch: 15 }, // 11: LOCALIZAÇÃO
                { wch: 15 }, // 12: DESTINO
                { wch: 15 }, // 13: STATUS
                { wch: 15 }  // 14: RETORNO
            ];
            ws['!cols'] = colWidths;

            XLSX.utils.book_append_sheet(wb, ws, 'Beneficiamentos');

            // Gerar e baixar arquivo
            const filename = 'Beneficiamentos_Exemplo.xlsx';
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
        const preview = document.getElementById('importPreviewBeneficiamento');
        const headerRow = document.getElementById('previewHeaderBeneficiamento');
        const body = document.getElementById('previewBodyBeneficiamento');

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
        const fileInput = document.getElementById('excelFileBeneficiamento');
        const file = fileInput.files[0];

        if (!file) {
            Utils.showMessage('Selecione um arquivo Excel', 'warning');
            return;
        }

        try {
            Utils.showMessage('Processando arquivo...', 'info');
            
            // Ler arquivo
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                    if (jsonData.length < 2) {
                        Utils.showMessage('Planilha deve ter pelo menos uma linha de cabeçalho e uma linha de dados', 'warning');
                        return;
                    }

                    // Processar dados
                    await this.processBeneficiamentosData(jsonData);
                    
                } catch (error) {
                    console.error('Erro ao processar arquivo:', error);
                    Utils.showMessage('Erro ao processar arquivo Excel', 'error');
                }
            };
            reader.readAsArrayBuffer(file);

        } catch (error) {
            console.error('Erro na importação:', error);
            Utils.showMessage('Erro na importação', 'error');
        }
    }

    async processBeneficiamentosData(data) {
        const headers = data[0];
        const rows = data.slice(1);

        // Carregar produtos uma única vez para melhor performance
        console.log('Carregando produtos para beneficiamento...');
        const produtos = await databaseManager.getProdutos({ ativo: true });
        console.log(`Carregados: ${produtos.length} produtos`);
        
        // Criar mapa para busca rápida por código
        const produtoMap = new Map();
        produtos.forEach(p => produtoMap.set(p.codigo.trim(), p));

        // Mapear colunas (buscar por nome similar)
        const columnMap = this.mapBeneficiamentosColumns(headers);
        
        let imported = 0;
        let errors = 0;
        const errorMessages = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const lineNumber = i + 2; // +2 porque linha 1 é cabeçalho e começamos do 0
            
            try {
                console.log(`Processando linha ${lineNumber}:`, row);
                const beneficiamentoData = await this.parseBeneficiamentoRow(row, columnMap, produtoMap);
                if (beneficiamentoData) {
                    await databaseManager.addBeneficiamento(beneficiamentoData);
                    imported++;
                    console.log(`Linha ${lineNumber} processada com sucesso`);
                } else {
                    errors++;
                    errorMessages.push(`Linha ${lineNumber}: Dados inválidos ou vazios`);
                }
            } catch (error) {
                console.error(`Erro na linha ${lineNumber}:`, error.message, row);
                errors++;
                errorMessages.push(`Linha ${lineNumber}: ${error.message}`);
            }
        }

        // Resultado detalhado
        const result = {
            imported: imported,
            errors: errors,
            errorMessages: errorMessages
        };

        if (errors > 0) {
            Utils.showMessage(`Beneficiamentos importados com sucesso! ${imported} beneficiamentos importados, ${errors} erros`, 'warning');
            this.showImportErrorsModal(result);
        } else {
            Utils.showMessage(`Beneficiamentos importados com sucesso! ${imported} beneficiamentos importados`, 'success');
            // Recarregar dados após importação
            await this.refreshDataAfterImport();
        }
        
        return result;
    }

    mapBeneficiamentosColumns(headers) {
        const map = {};
        
        console.log('Mapeando headers de beneficiamento:', headers);
        
        headers.forEach((header, index) => {
            if (!header) return;
            
            const h = header.toString().trim();
            const hLower = h.toLowerCase();
            console.log(`Analisando header [${index}]: "${h}"`);
            
            // Mapeamento baseado na estrutura da planilha de beneficiamento (15 colunas)
            // 0: DATA, 1: CODE/GO, 2: DESCRIÇÃO, 3: VARIANTES, 4: ESPECIFICAÇÃO PARA A PINT,
            // 5: TAMANHO, 6: QUANTIDAD, 7: NF DE ENTRADA, 8: NF DE SAÍDA,
            // 9: PROJET, 10: LOCALIZAÇÃO, 11: DESTINO, 12: STATUS, 13: RETORNO
            
            // Coluna 0: DATA
            if ((h === 'DATA' || hLower.includes('data')) && map.data === undefined) {
                map.data = index;
                console.log(`DATA mapeada para coluna ${index}`);
            }
            // Coluna 1: CODE/GO (código do produto)
            else if ((h === 'CODE' || h === 'CÓD.' || h === 'COD.' || h === 'GO' || hLower.includes('code') || hLower.includes('codigo') || hLower.includes('produto')) && map.produto === undefined) {
                map.produto = index;
                console.log(`CODE mapeado para coluna ${index}`);
            }
            // Coluna 2: DESCRIÇÃO
            else if ((h === 'DESCRIÇÃO' || h === 'DESCRICAO' || hLower.includes('descricao')) && map.descricao === undefined) {
                map.descricao = index;
                console.log(`DESCRIÇÃO mapeada para coluna ${index}`);
            }
            // Coluna 3: VARIANTES
            else if ((h === 'VARIANTES' || h === 'VARIANTE' || hLower.includes('variante')) && map.variante === undefined) {
                map.variante = index;
                console.log(`VARIANTES mapeada para coluna ${index}`);
            }
            // Coluna 4: ESPECIFICAÇÃO PARA A PINT
            else if ((h === 'ESPECIFICAÇÃO PARA A PINT' || h.toLowerCase().includes('especificacao') || hLower.includes('pint')) && map.especificacao === undefined) {
                map.especificacao = index;
                console.log(`ESPECIFICAÇÃO PARA PINT mapeada para coluna ${index}`);
            }
            // Coluna 6: TAMANHO
            else if ((h === 'TAMANHO' || hLower.includes('tamanho')) && map.tamanho === undefined) {
                map.tamanho = index;
                console.log(`TAMANHO mapeado para coluna ${index}`);
            }
            // Coluna 7: QUANTIDAD
            else if ((h === 'QUANTIDAD' || h === 'QUANTIDADE' || hLower.includes('quantidade') || hLower.includes('qtd')) && map.quantidade === undefined) {
                map.quantidade = index;
                console.log(`QUANTIDADE mapeada para coluna ${index}`);
            }
            // Coluna 8: NF DE ENTRADA
            else if ((h === 'NF DE ENTRADA' || hLower.includes('nf') && hLower.includes('entrada')) && map.nfEntrada === undefined) {
                map.nfEntrada = index;
                console.log(`NF DE ENTRADA mapeada para coluna ${index}`);
            }
            // Coluna 9: NF DE SAÍDA
            else if ((h === 'NF DE SAÍDA' || hLower.includes('nf') && hLower.includes('saida')) && map.nfSaida === undefined) {
                map.nfSaida = index;
                console.log(`NF DE SAÍDA mapeada para coluna ${index}`);
            }
            // Coluna 10: PROJET
            else if ((h === 'PROJET' || h === 'PROJETO' || hLower.includes('projeto')) && map.projeto === undefined) {
                map.projeto = index;
                console.log(`PROJETO mapeado para coluna ${index}`);
            }
            // Coluna 11: LOCALIZAÇÃO
            else if ((h === 'LOCALIZAÇÃO' || h === 'LOCALIZACAO' || hLower.includes('localizacao')) && map.localizacao === undefined) {
                map.localizacao = index;
                console.log(`LOCALIZAÇÃO mapeada para coluna ${index}`);
            }
            // Coluna 12: DESTINO
            else if ((h === 'DESTINO' || hLower.includes('destino')) && map.destino === undefined) {
                map.destino = index;
                console.log(`DESTINO mapeado para coluna ${index}`);
            }
            // Coluna 13: STATUS
            else if ((h === 'STATUS' || hLower.includes('status')) && map.status === undefined) {
                map.status = index;
                console.log(`STATUS mapeado para coluna ${index}`);
            }
            // Coluna 14: RETORNO
            else if ((h === 'RETORNO' || hLower.includes('retorno')) && map.retorno === undefined) {
                map.retorno = index;
                console.log(`RETORNO mapeado para coluna ${index}`);
            }
        });

        // Tentar mapeamento por posição baseado na estrutura da planilha (16 colunas)
        if (Object.keys(map).length === 0) {
            console.log('Nenhum header identificado, tentando mapeamento por posição...');
            
            if (headers.length >= 8) {
                map.data = 0;           // 0: DATA
                map.produto = 1;        // 1: CÓD./GO
                map.descricao = 2;      // 2: DESCRIÇÃO
                map.variante = 3;       // 3: VARIANTES
                map.especificacao = 4;  // 4: ESPECIFICAÇÃO PARA A PINT
                map.tamanho = 5;        // 5: TAMANHO
                map.quantidade = 6;     // 6: QUANTIDAD
                map.nfEntrada = 7;      // 7: NF DE ENTRADA
                map.nfSaida = 8;        // 8: NF DE SAÍDA
                map.projeto = 9;        // 9: PROJET
                map.localizacao = 10;   // 10: LOCALIZAÇÃO
                map.destino = 11;       // 11: DESTINO
                map.status = 12;        // 12: STATUS
                map.retorno = 13;       // 13: RETORNO
                console.log('Mapeamento por posição aplicado (15 colunas):', map);
            }
        }

        // Validação final: garantir que colunas importantes estejam mapeadas
        if (headers.length >= 8) {
            // Forçar mapeamento das colunas essenciais se não foram mapeadas
            if (map.produto === undefined && headers.length > 1) map.produto = 1;
            if (map.quantidade === undefined && headers.length > 7) map.quantidade = 7;
            if (map.data === undefined && headers.length > 0) map.data = 0;
        }
        
        console.log('Mapeamento final de beneficiamento:', map);
        return map;
    }

    async parseBeneficiamentoRow(row, columnMap, produtoMap) {
        try {
            // Verificar se temos dados mínimos
            if (!row || row.length === 0) return null;
            
            // Verificar se o mapeamento foi feito corretamente
            if (columnMap.produto === undefined) {
                throw new Error('Coluna CÓDIGO (produto) não foi mapeada corretamente');
            }
            if (columnMap.quantidade === undefined) {
                throw new Error('Coluna QUANTIDADE não foi mapeada corretamente');
            }

            // Buscar produto por código usando o mapa - tentar múltiplas colunas se necessário
            let produtoCodigo = null;
            
            // Primeiro tentar na coluna mapeada
            if (columnMap.produto !== undefined && row[columnMap.produto]) {
                produtoCodigo = row[columnMap.produto];
            }
            
            // Se não encontrou, tentar na coluna 1 (CODE) e depois na coluna 2 (GO)
            if ((!produtoCodigo || produtoCodigo.toString().trim() === '') && row.length > 1) {
                produtoCodigo = row[1]; // Coluna CODE
            }
            if ((!produtoCodigo || produtoCodigo.toString().trim() === '') && row.length > 2) {
                produtoCodigo = row[2]; // Coluna GO
            }
            
            if (!produtoCodigo || produtoCodigo.toString().trim() === '') {
                throw new Error(`Código do produto vazio. Tentado nas colunas CODE e GO`);
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
                    categoria: 'IMPORTADO_BENEFICIAMENTO', // identificar produtos importados
                    observacoes: 'Produto criado automaticamente durante importação de beneficiamento'
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

            // Determinar status baseado na coluna STATUS ou usar padrão
            let status = 'PENDENTE';
            if (columnMap.status !== undefined && row[columnMap.status]) {
                const statusRaw = row[columnMap.status].toString().trim().toUpperCase();
                const statusMap = {
                    'PENDENTE': 'PENDENTE',
                    'EM_ANDAMENTO': 'EM_ANDAMENTO',
                    'CONCLUIDO': 'CONCLUIDO',
                    'CONCLUÍDO': 'CONCLUIDO',
                    'RETORNADO': 'RETORNADO'
                };
                if (statusMap[statusRaw]) {
                    status = statusMap[statusRaw];
                }
            }

            // Coletar campos separadamente para melhor organização na tabela
            const observacoesParts = [];
            
            // Tipo de beneficiamento baseado na especificação ou variante
            let tipoBeneficiamento = '';
            if (columnMap.especificacao !== undefined && row[columnMap.especificacao]) {
                tipoBeneficiamento = row[columnMap.especificacao].toString().trim();
            } else if (columnMap.variante !== undefined && row[columnMap.variante]) {
                tipoBeneficiamento = row[columnMap.variante].toString().trim();
            }

            // Extrair outros campos separadamente
            const tamanho = columnMap.tamanho !== undefined && row[columnMap.tamanho] ? row[columnMap.tamanho].toString().trim() : null;
            const nfEntrada = columnMap.nfEntrada !== undefined && row[columnMap.nfEntrada] ? row[columnMap.nfEntrada].toString().trim() : null;
            const nfSaida = columnMap.nfSaida !== undefined && row[columnMap.nfSaida] ? row[columnMap.nfSaida].toString().trim() : null;
            const projeto = columnMap.projeto !== undefined && row[columnMap.projeto] ? row[columnMap.projeto].toString().trim() : null;
            const localizacao = columnMap.localizacao !== undefined && row[columnMap.localizacao] ? row[columnMap.localizacao].toString().trim() : null;
            const destino = columnMap.destino !== undefined && row[columnMap.destino] ? row[columnMap.destino].toString().trim() : null;
            const retorno = columnMap.retorno !== undefined && row[columnMap.retorno] ? row[columnMap.retorno].toString().trim() : null;

            const beneficiamentoData = {
                data: data,
                produto_id: produto.id,
                quantidade: quantidade,
                tipo_beneficiamento: tipoBeneficiamento || null,
                status: status,
                tamanho: tamanho,
                nf_entrada: nfEntrada,
                nf_saida: nfSaida,
                projeto: projeto,
                localizacao: localizacao,
                destino: destino,
                retorno: retorno,
                observacoes: observacoesParts.length > 0 ? observacoesParts.join('\n') : null,
                usuario_nome: window.currentUserData ? window.currentUserData.nome : 'Sistema'
            };

            console.log('Beneficiamento parseado:', beneficiamentoData);
            return beneficiamentoData;
            
        } catch (error) {
            console.error('Erro ao parsear linha:', error, row);
            throw error;
        }
    }

    showImportErrorsModal(importResult) {
        const errorList = importResult.errorMessages.slice(0, 20).map(error => 
            `<li class="text-danger small">${error}</li>`
        ).join('');

        const hasMoreErrors = importResult.errorMessages.length > 20;
        const moreErrorsText = hasMoreErrors ? 
            `<p class="text-muted small mt-2">... e mais ${importResult.errorMessages.length - 20} erros</p>` : '';

        const content = `
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <strong>Detalhes dos Erros de Importação</strong>
            </div>
            
            <div class="mb-3">
                <p><strong>Resultado:</strong> ${importResult.imported} beneficiamentos importados, ${importResult.errors} erros</p>
            </div>
            
            ${importResult.errors > 0 ? `
            <div class="mb-3">
                <h6>Principais erros encontrados:</h6>
                <ul class="list-unstyled" style="max-height: 300px; overflow-y: auto;">
                    ${errorList}
                </ul>
                ${moreErrorsText}
            </div>
            
            <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i>
                <strong>Dica:</strong> Produtos que não existem no sistema são criados automaticamente durante a importação. 
                Verifique se há problemas de formato nos dados (quantidades inválidas, datas incorretas, etc.).
            </div>
            ` : ''}
        `;

        Utils.showModal('Erros de Importação', content, [
            { text: 'Fechar', class: 'primary' }
        ]);
    }

    async refreshDataAfterImport() {
        try {
            console.log('Atualizando dados após importação...');
            
            // Tentar recarregar dados múltiplas vezes com delays para garantir que o Firebase processou
            for (let attempt = 1; attempt <= 3; attempt++) {
                console.log(`Tentativa ${attempt}/3 de atualização dos dados`);
                
                await this.loadBeneficiamentos();
                this.updateTable();
                
                // Aguardar um pouco antes da próxima tentativa se não for a última
                if (attempt < 3) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                }
            }
            
            console.log('Dados atualizados com sucesso após importação');
        } catch (error) {
            console.error('Erro ao atualizar dados após importação:', error);
        }
    }

    showClearAllModal() {
        const content = `
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <strong>Atenção!</strong> Esta ação irá excluir <strong>TODOS</strong> os beneficiamentos do sistema.
                <br><br>
                <strong>Esta ação não pode ser desfeita!</strong>
                <br><br>
                <small class="text-muted">
                    Serão deletados todos os beneficiamentos em qualquer status (Pendente, Concluído, etc.), 
                    incluindo histórico completo, mas os produtos e outros dados permanecerão.
                </small>
            </div>
            
            <div class="mb-3">
                <label for="confirmClearTextBeneficiamento" class="form-label">
                    Para confirmar, digite: <strong>LIMPAR TUDO</strong>
                </label>
                <input type="text" class="form-control" id="confirmClearTextBeneficiamento" placeholder="Digite aqui para confirmar">
            </div>
        `;

        const actions = [
            {
                text: 'Cancelar',
                class: 'secondary'
            },
            {
                text: 'Limpar Todos os Beneficiamentos',
                class: 'danger',
                action: 'beneficiamentoPage.clearAllBeneficiamentos()'
            }
        ];

        Utils.showModal('Limpar Todos os Beneficiamentos', content, actions);
        
        // Validar confirmação antes de executar
        const confirmInput = document.getElementById('confirmClearTextBeneficiamento');
        const confirmButton = document.querySelector('.modal .btn-danger');
        
        if (confirmButton) {
            confirmButton.disabled = true;
            
            confirmInput.addEventListener('input', () => {
                confirmButton.disabled = confirmInput.value.trim() !== 'LIMPAR TUDO';
            });
        }
    }

    async clearAllBeneficiamentos() {
        try {
            Utils.showMessage('Limpando todos os beneficiamentos...', 'info');
            
            const result = await databaseManager.clearAllBeneficiamentos();
            
            Utils.showMessage(`${result.count} beneficiamentos foram excluídos com sucesso!`, 'success');
            
            // Fechar modal
            const modalElement = document.querySelector('.modal');
            if (modalElement) {
                const modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) modal.hide();
            }
            
            // Recarregar página
            await this.loadBeneficiamentos();
            this.updateTable();
            
        } catch (error) {
            console.error('Erro ao limpar beneficiamentos:', error);
            Utils.showMessage('Erro ao limpar beneficiamentos', 'error');
        }
    }

    unload() {
        // Limpar listeners quando sair da página
        this.listeners.forEach(unsubscribe => unsubscribe());
        this.listeners = [];
    }
}

// Inicializar página de beneficiamento
const beneficiamentoPage = new BeneficiamentoPage();

// Exportar para uso global
window.BeneficiamentoPage = BeneficiamentoPage;
window.beneficiamentoPage = beneficiamentoPage;

