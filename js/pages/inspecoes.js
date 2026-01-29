// Página de Inspeções do Sistema de Qualidade
class InspecoesPage {
    constructor() {
        this.inspecoes = [];
        this.currentFilters = {};
        this.listeners = [];
    }

    async load(params = {}) {
        try {
            this.showLoading();
            
            // Verificar se deve criar nova inspeção
            if (params.action === 'create') {
                this.showInspecaoModal();
                return;
            }

            // Carregar inspeções
            await this.loadInspecoes();
            
            // Renderizar página
            this.render();
            
            // Configurar listeners para atualizações em tempo real
            this.setupRealtimeListeners();
            
        } catch (error) {
            console.error('Erro ao carregar inspeções:', error);
            Utils.showMessage('Erro ao carregar inspeções', 'error');
        }
    }

    showLoading() {
        document.getElementById('pageContent').innerHTML = `
            <div class="loading">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Carregando inspeções...</span>
                </div>
            </div>
        `;
    }

    async loadInspecoes() {
        try {
            this.inspecoes = await databaseManager.getInspecoes(this.currentFilters);
        } catch (error) {
            console.error('Erro ao carregar inspeções:', error);
            throw error;
        }
    }

    render() {
        const content = `
            <!-- Filtros -->
            <div class="row mb-3">
                <div class="col-md-3">
                    <input type="date" class="form-control" id="filterDataInicial" placeholder="Data Inicial">
                </div>
                <div class="col-md-3">
                    <input type="date" class="form-control" id="filterDataFinal" placeholder="Data Final">
                </div>
                <div class="col-md-3">
                    <select class="form-control" id="filterStatus">
                        <option value="">Todos os Status</option>
                        <option value="PENDENTE">Pendente</option>
                        <option value="APROVADO">Aprovado</option>
                        <option value="REPROVADO">Reprovado</option>
                        <option value="APROVADO_PARCIALMENTE">Aprovado Parcialmente</option>
                    </select>
                </div>
                <div class="col-md-3">
                    <button class="btn btn-outline-secondary w-100" onclick="inspecoesPage.clearFilters()">
                        <i class="fas fa-times me-2"></i>Limpar Filtros
                    </button>
                </div>
            </div>

            <!-- Tabela de Inspeções -->
            <div class="card shadow">
                <div class="card-header py-3">
                    <h6 class="m-0 font-weight-bold text-primary">Inspeções de Qualidade</h6>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive" style="max-height: 70vh; overflow-y: auto;">
                        <table class="table table-bordered table-hover mb-0" id="inspecoesTable">
                            <thead class="table-dark sticky-top">
                                <tr>
                                    <th style="min-width: 120px;">Numero</th>
                                    <th style="min-width: 100px;">Data</th>
                                    <th style="min-width: 150px;">Responsavel</th>
                                    <th style="min-width: 150px;">Produto</th>
                                    <th style="min-width: 120px;">Codigo Item</th>
                                    <th style="min-width: 120px;">Obra</th>
                                    <th style="min-width: 100px;">Qtd Inspecionadas</th>
                                    <th style="min-width: 100px;">Qtd Boas</th>
                                    <th style="min-width: 100px;">Qtd Defeitos</th>
                                    <th style="min-width: 100px;">Parecer</th>
                                    <th style="min-width: 100px;">Qtd Bloqueada</th>
                                    <th style="min-width: 150px;">Observacoes</th>
                                    <th style="min-width: 100px;">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.renderInspecoesTable()}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('pageContent').innerHTML = content;
        this.setupFilters();
        document.getElementById('pageTitle').textContent = 'Inspeções';
        
        // Buscar botões de ação da página
        const pageActions = document.getElementById('pageActions');
        if (pageActions) {
            pageActions.innerHTML = `
                <button class="btn btn-primary" onclick="showInspecaoModal()">
                    <i class="fas fa-plus me-2"></i>Nova Inspeção
                </button>
                <button class="btn btn-success" onclick="showImportModal()">
                    <i class="fas fa-file-excel me-2"></i>Importar Planilha
                </button>
                <button class="btn btn-info" onclick="downloadTemplate()">
                    <i class="fas fa-download me-2"></i>Baixar Modelo
                </button>
                <button class="btn btn-danger" onclick="clearAllInspecoes()">
                    <i class="fas fa-trash me-2"></i>Limpar Tudo
                </button>
            `;
        }
    }

    renderInspecoesTable() {
        if (this.inspecoes.length === 0) {
            return `
                <tr>
                    <td colspan="13" class="text-center py-4">
                        <i class="fas fa-search fa-3x text-muted mb-3"></i>
                        <p class="text-muted">Nenhuma inspeção encontrada</p>
                    </td>
                </tr>
            `;
        }

        return this.inspecoes.map(inspecao => {
            const canEdit = authManager.canEditInspecao(inspecao);
            const canDelete = authManager.canDeleteInspecao(inspecao);
            
            return `
            <tr>
                <td>
                    <strong>${inspecao.numero || 'N/A'}</strong>
                </td>
                <td>${Utils.formatDate(inspecao.data)}</td>
                <td>
                    <div class="fw-bold">${inspecao.responsavel || inspecao.inspetor_nome || 'N/A'}</div>
                </td>
                <td>
                    <div class="fw-bold">${inspecao.produto || 'N/A'}</div>
                </td>
                <td>
                    <div class="fw-bold">${inspecao.codigo_item || inspecao.cod_item || 'N/A'}</div>
                </td>
                <td>
                    <div class="fw-bold">${inspecao.obra || 'N/A'}</div>
                </td>
                <td class="text-end">${Utils.formatNumber(inspecao.qtd_inspecionadas || 0, 0)}</td>
                <td class="text-end">${Utils.formatNumber(inspecao.qtd_boas || 0, 0)}</td>
                <td class="text-end">${Utils.formatNumber(inspecao.qtd_defeitos || 0, 0)}</td>
                <td>
                    <span class="badge bg-${Utils.getStatusClass(inspecao.parecer)}">
                        ${Utils.formatStatus(inspecao.parecer)}
                    </span>
                </td>
                <td class="text-end">${Utils.formatNumber(inspecao.qtd_bloqueada || 0, 0)}</td>
                <td>
                    <div class="text-truncate" style="max-width: 150px;" title="${inspecao.observacoes || ''}">
                        ${inspecao.observacoes || '-'}
                    </div>
                </td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-info" onclick="viewInspecao('${inspecao.id}')" title="Visualizar">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-primary" onclick="editInspecao('${inspecao.id}')" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteInspecao('${inspecao.id}')" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                        ${this.shouldShowRetrabalhoButton(inspecao) ? `
                            <button class="btn btn-sm btn-outline-warning" onclick="sendToRetrabalho('${inspecao.id}')" title="Enviar para Retrabalho">
                                <i class="fas fa-tools"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
            `;
        }).join('');
    }

    shouldShowRetrabalhoButton(inspecao) {
        // Mostrar botão se:
        // 1. Parecer for "Reprovado" (total ou parcial)
        // 2. OU se tiver quantidade de defeitos > 0
        // 3. OU se tiver quantidade bloqueada > 0
        const parecer = (inspecao.parecer || '').toLowerCase();
        const qtdDefeitos = parseInt(inspecao.qtd_defeitos) || 0;
        const qtdBloqueada = parseInt(inspecao.qtd_bloqueada) || 0;
        
        return parecer.includes('reprovado') || qtdDefeitos > 0 || qtdBloqueada > 0;
    }

    setupFilters() {
        // Adicionar event listeners para filtros
        const filterInputs = ['filterDataInicial', 'filterDataFinal', 'filterStatus'];
        
        filterInputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => this.applyFilters());
            }
        });
    }

    applyFilters() {
        const filters = {
            data_inicial: document.getElementById('filterDataInicial')?.value || '',
            data_final: document.getElementById('filterDataFinal')?.value || '',
            status: document.getElementById('filterStatus')?.value || ''
        };

        this.currentFilters = filters;
        this.loadInspecoes().then(() => {
            this.updateTable();
        });
    }

    clearFilters() {
        document.getElementById('filterDataInicial').value = '';
        document.getElementById('filterDataFinal').value = '';
        document.getElementById('filterStatus').value = '';
        
        this.currentFilters = {};
        this.loadInspecoes().then(() => {
            this.updateTable();
        });
    }

    updateTable() {
        const tbody = document.querySelector('#inspecoesTable tbody');
        if (tbody) {
            tbody.innerHTML = this.renderInspecoesTable();
        }
    }

    // Modal de inspeção
    showInspecaoModal(inspecaoId = null) {
        if (inspecaoId) {
            this.loadInspecaoForEdit(inspecaoId);
        } else {
            this.renderInspecaoModal();
        }
    }

    async loadInspecaoForEdit(inspecaoId) {
        try {
            const inspecao = this.inspecoes.find(i => i.id === inspecaoId);
            if (inspecao) {
                this.renderInspecaoModal(inspecao);
            } else {
                Utils.showMessage('Inspeção não encontrada', 'error');
            }
        } catch (error) {
            console.error('Erro ao carregar inspeção:', error);
            Utils.showMessage('Erro ao carregar inspeção', 'error');
        }
    }

    async renderInspecaoModal(inspecao = null) {
        const isEdit = inspecao !== null;
        const title = isEdit ? 'Editar Inspeção' : 'Nova Inspeção';
        
        const content = `
            <form id="inspecaoForm">
                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="data" class="form-label">Data *</label>
                            <input type="date" class="form-control" id="data" required 
                                   value="${inspecao ? inspecao.data : Utils.formatDate(new Date()).split('/').reverse().join('-')}">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="numero" class="form-label">Número da Inspeção</label>
                            <input type="text" class="form-control" id="numero" readonly
                                   value="${inspecao ? inspecao.numero : 'Será gerado automaticamente'}">
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="produto" class="form-label">Produto *</label>
                            <input type="text" class="form-control" id="produto" required 
                                   value="${inspecao ? inspecao.produto : ''}"
                                   placeholder="Ex: Esquadria de Alumínio">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="cod_item" class="form-label">Código do Item *</label>
                            <input type="text" class="form-control" id="cod_item" required 
                                   value="${inspecao ? inspecao.cod_item : ''}"
                                   placeholder="Ex: ALU001">
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="obra" class="form-label">Obra *</label>
                            <input type="text" class="form-control" id="obra" required 
                                   value="${inspecao ? inspecao.obra : ''}"
                                   placeholder="Ex: Residencial ABC">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="qtd_inspecionadas" class="form-label">Qtd Inspecionadas *</label>
                            <input type="number" class="form-control" id="qtd_inspecionadas" required 
                                   value="${inspecao ? inspecao.qtd_inspecionadas : ''}"
                                   onchange="inspecoesPage.calcularQtdBoas()">
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="qtd_defeitos" class="form-label">Qtd Defeitos *</label>
                            <input type="number" class="form-control" id="qtd_defeitos" required 
                                   value="${inspecao ? inspecao.qtd_defeitos : ''}"
                                   onchange="inspecoesPage.calcularQtdBoas()">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="qtd_boas" class="form-label">Qtd Boas</label>
                            <input type="number" class="form-control" id="qtd_boas" readonly 
                                   value="${inspecao ? inspecao.qtd_boas : ''}"
                                   style="background:#f0f0f0">
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="parecer" class="form-label">Parecer</label>
                            <input type="text" class="form-control" id="parecer" readonly 
                                   value="${inspecao ? inspecao.parecer : ''}"
                                   style="background:#f0f0f0;font-weight:bold;">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="qtd_bloqueada" class="form-label">Qtd Bloqueada</label>
                            <input type="number" class="form-control" id="qtd_bloqueada" readonly 
                                   value="${inspecao ? inspecao.qtd_bloqueada : ''}"
                                   style="background:#f0f0f0">
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="data_reliberacao" class="form-label">Data Re-liberação</label>
                            <input type="date" class="form-control" id="data_reliberacao" 
                                   value="${inspecao ? inspecao.data_reliberacao : ''}">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="status" class="form-label">Status</label>
                            <select class="form-control" id="status">
                                <option value="PENDENTE" ${inspecao && inspecao.status === 'PENDENTE' ? 'selected' : ''}>Pendente</option>
                                <option value="APROVADO" ${inspecao && inspecao.status === 'APROVADO' ? 'selected' : ''}>Aprovado</option>
                                <option value="REPROVADO" ${inspecao && inspecao.status === 'REPROVADO' ? 'selected' : ''}>Reprovado</option>
                                <option value="APROVADO_PARCIALMENTE" ${inspecao && inspecao.status === 'APROVADO_PARCIALMENTE' ? 'selected' : ''}>Aprovado Parcialmente</option>
                            </select>
                        </div>
                    </div>
                </div>

                <h5>Tipos de Defeitos:</h5>
                <div class="row">
                    <div class="col-md-6">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="riscos" ${inspecao && inspecao.riscos ? 'checked' : ''}>
                            <label class="form-check-label" for="riscos">Riscos ou arranhões</label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="danos_pintura" ${inspecao && inspecao.danos_pintura ? 'checked' : ''}>
                            <label class="form-check-label" for="danos_pintura">Danos de Pintura</label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="amassado" ${inspecao && inspecao.amassado ? 'checked' : ''}>
                            <label class="form-check-label" for="amassado">Amassado ou Empeno</label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="falta_guarnicao" ${inspecao && inspecao.falta_guarnicao ? 'checked' : ''}>
                            <label class="form-check-label" for="falta_guarnicao">Falta de Guarnição</label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="furacao_inadequada" ${inspecao && inspecao.furacao_inadequada ? 'checked' : ''}>
                            <label class="form-check-label" for="furacao_inadequada">Furação Inadequada</label>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="esquadria_suja" ${inspecao && inspecao.esquadria_suja ? 'checked' : ''}>
                            <label class="form-check-label" for="esquadria_suja">Esquadria Suja</label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="falha_acabamento" ${inspecao && inspecao.falha_acabamento ? 'checked' : ''}>
                            <label class="form-check-label" for="falha_acabamento">Falha de Acabamento</label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="falha_fixacao" ${inspecao && inspecao.falha_fixacao ? 'checked' : ''}>
                            <label class="form-check-label" for="falha_fixacao">Falha de Fixação</label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="falha_colagem" ${inspecao && inspecao.falha_colagem ? 'checked' : ''}>
                            <label class="form-check-label" for="falha_colagem">Falha de Colagem</label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="mau_funcionamento" ${inspecao && inspecao.mau_funcionamento ? 'checked' : ''}>
                            <label class="form-check-label" for="mau_funcionamento">Mau Funcionamento</label>
                        </div>
                    </div>
                </div>

                <div class="mb-3">
                    <label for="observacoes" class="form-label">Observações</label>
                    <textarea class="form-control" id="observacoes" rows="3" 
                              placeholder="Observações adicionais...">${inspecao ? inspecao.observacoes : ''}</textarea>
                </div>
            </form>
        `;

        const actions = [
            {
                text: 'Cancelar',
                class: 'secondary',
                onclick: 'closeModal()'
            },
            {
                text: isEdit ? 'Atualizar' : 'Salvar',
                class: 'primary',
                onclick: isEdit ? `saveInspecaoUpdate('${inspecao.id}')` : 'saveInspecao()'
            }
        ];

        Utils.showModal(title, content, actions);
    }

    calcularQtdBoas() {
        const inspecionadas = parseInt(document.getElementById('qtd_inspecionadas').value) || 0;
        const defeitos = parseInt(document.getElementById('qtd_defeitos').value) || 0;
        const boas = Math.max(0, inspecionadas - defeitos);
        
        document.getElementById('qtd_boas').value = boas;
        
        // Calcular parecer automaticamente
        if (inspecionadas === 0) {
            document.getElementById('parecer').value = '';
            document.getElementById('qtd_bloqueada').value = '';
        } else if (defeitos === 0) {
            document.getElementById('parecer').value = 'Aprovado';
            document.getElementById('qtd_bloqueada').value = 0;
        } else if (defeitos < inspecionadas) {
            document.getElementById('parecer').value = 'Aprovado Parcialmente';
            document.getElementById('qtd_bloqueada').value = defeitos;
        } else {
            document.getElementById('parecer').value = 'Reprovado';
            document.getElementById('qtd_bloqueada').value = defeitos;
        }
    }

    async saveInspecao() {
        try {
            if (!Utils.validateForm('inspecaoForm')) {
                Utils.showMessage('Por favor, preencha todos os campos obrigatórios', 'warning');
                return;
            }

            const inspecaoData = {
                data: document.getElementById('data').value,
                produto: document.getElementById('produto').value,
                cod_item: document.getElementById('cod_item').value,
                obra: document.getElementById('obra').value,
                qtd_inspecionadas: parseInt(document.getElementById('qtd_inspecionadas').value),
                qtd_defeitos: parseInt(document.getElementById('qtd_defeitos').value),
                qtd_boas: parseInt(document.getElementById('qtd_boas').value),
                parecer: document.getElementById('parecer').value,
                qtd_bloqueada: parseInt(document.getElementById('qtd_bloqueada').value),
                data_reliberacao: document.getElementById('data_reliberacao').value || null,
                status: document.getElementById('status').value,
                riscos: document.getElementById('riscos').checked,
                danos_pintura: document.getElementById('danos_pintura').checked,
                amassado: document.getElementById('amassado').checked,
                falta_guarnicao: document.getElementById('falta_guarnicao').checked,
                furacao_inadequada: document.getElementById('furacao_inadequada').checked,
                esquadria_suja: document.getElementById('esquadria_suja').checked,
                falha_acabamento: document.getElementById('falha_acabamento').checked,
                falha_fixacao: document.getElementById('falha_fixacao').checked,
                falha_colagem: document.getElementById('falha_colagem').checked,
                mau_funcionamento: document.getElementById('mau_funcionamento').checked,
                observacoes: document.getElementById('observacoes').value.trim() || null
            };

            // Gerar número da inspeção
            const ano = new Date().getFullYear();
            const mes = String(new Date().getMonth() + 1).padStart(2, '0');
            const total = this.inspecoes.length + 1;
            inspecaoData.numero = `${ano}${mes}${String(total).padStart(3, '0')}`;

            await databaseManager.addInspecao(inspecaoData);
            Utils.showMessage('Inspeção salva com sucesso!', 'success');
            
            // Recarregar página
            await this.loadInspecoes();
            this.updateTable();
            
        } catch (error) {
            console.error('Erro ao salvar inspeção:', error);
            Utils.showMessage('Erro ao salvar inspeção', 'error');
        }
    }

    async saveInspecaoUpdate(inspecaoId) {
        try {
            if (!Utils.validateForm('inspecaoForm')) {
                Utils.showMessage('Por favor, preencha todos os campos obrigatórios', 'warning');
                return;
            }

            const inspecaoData = {
                data: document.getElementById('data').value,
                produto: document.getElementById('produto').value,
                cod_item: document.getElementById('cod_item').value,
                obra: document.getElementById('obra').value,
                qtd_inspecionadas: parseInt(document.getElementById('qtd_inspecionadas').value),
                qtd_defeitos: parseInt(document.getElementById('qtd_defeitos').value),
                qtd_boas: parseInt(document.getElementById('qtd_boas').value),
                parecer: document.getElementById('parecer').value,
                qtd_bloqueada: parseInt(document.getElementById('qtd_bloqueada').value),
                data_reliberacao: document.getElementById('data_reliberacao').value || null,
                status: document.getElementById('status').value,
                riscos: document.getElementById('riscos').checked,
                danos_pintura: document.getElementById('danos_pintura').checked,
                amassado: document.getElementById('amassado').checked,
                falta_guarnicao: document.getElementById('falta_guarnicao').checked,
                furacao_inadequada: document.getElementById('furacao_inadequada').checked,
                esquadria_suja: document.getElementById('esquadria_suja').checked,
                falha_acabamento: document.getElementById('falha_acabamento').checked,
                falha_fixacao: document.getElementById('falha_fixacao').checked,
                falha_colagem: document.getElementById('falha_colagem').checked,
                mau_funcionamento: document.getElementById('mau_funcionamento').checked,
                observacoes: document.getElementById('observacoes').value.trim() || null
            };

            await databaseManager.updateInspecao(inspecaoId, inspecaoData);
            Utils.showMessage('Inspeção atualizada com sucesso!', 'success');
            
            // Recarregar página
            await this.loadInspecoes();
            this.updateTable();
            
        } catch (error) {
            console.error('Erro ao atualizar inspeção:', error);
            Utils.showMessage('Erro ao atualizar inspeção', 'error');
        }
    }

    async deleteInspecao(inspecaoId) {
        const confirmed = await Utils.confirm(
            'Confirmar Exclusão',
            'Tem certeza que deseja excluir esta inspeção? Esta ação não pode ser desfeita.'
        );

        if (confirmed) {
            try {
                await databaseManager.deleteInspecao(inspecaoId);
                Utils.showMessage('Inspeção excluída com sucesso!', 'success');
                
                // Recarregar página
                await this.loadInspecoes();
                this.updateTable();
                
            } catch (error) {
                console.error('Erro ao excluir inspeção:', error);
                Utils.showMessage('Erro ao excluir inspeção', 'error');
            }
        }
    }

    viewInspecao(inspecaoId) {
        const inspecao = this.inspecoes.find(i => i.id === inspecaoId);
        if (!inspecao) {
            Utils.showMessage('Inspeção não encontrada', 'error');
            return;
        }

        // Implementar visualização detalhada
        Utils.showMessage('Funcionalidade de visualização será implementada', 'info');
    }

    editInspecao(inspecaoId) {
        this.showInspecaoModal(inspecaoId);
    }

    setupRealtimeListeners() {
        // Listener para inspeções
        const unsubscribe = databaseManager.setupInspecoesListener((inspecoes) => {
            this.inspecoes = inspecoes;
            this.updateTable();
        });

        this.listeners.push(unsubscribe);
    }

    // Modal de importação
    showImportModal() {
        const content = `
            <div class="mb-3">
                <label for="importFile" class="form-label">Selecionar Arquivo Excel/CSV</label>
                <input type="file" class="form-control" id="importFile" accept=".xlsx,.xls,.csv">
                <div class="form-text">
                    Formatos aceitos: Excel (.xlsx, .xls) ou CSV (.csv)
                </div>
            </div>
            
            <div class="alert alert-info">
                <h6><i class="fas fa-info-circle me-2"></i>Formato da Planilha</h6>
                <p class="mb-2">A planilha deve conter as seguintes colunas (nesta ordem):</p>
                <ul class="mb-0">
                    <li><strong>Numero:</strong> Número da inspeção (ex: INS-001)</li>
                    <li><strong>Data:</strong> Data da inspeção (formato: AAAA-MM-DD)</li>
                    <li><strong>Responsavel:</strong> Nome do responsável</li>
                    <li><strong>Produto:</strong> Nome do produto</li>
                    <li><strong>Codigo Item:</strong> Código do item</li>
                    <li><strong>Obra:</strong> Nome da obra/projeto</li>
                    <li><strong>Qtd Inspecionadas:</strong> Quantidade inspecionada</li>
                    <li><strong>Qtd Boas:</strong> Quantidade aprovada</li>
                    <li><strong>Qtd Defeitos:</strong> Quantidade com defeitos</li>
                    <li><strong>Parecer:</strong> Aprovado/Reprovado/Pendente</li>
                    <li><strong>Qtd Bloqueada:</strong> Quantidade bloqueada</li>
                    <li><strong>Observacoes:</strong> Observações da inspeção</li>
                </ul>
            </div>
            
            <div id="importPreview" class="mt-3" style="display: none;">
                <h6>Preview dos Dados:</h6>
                <div class="table-responsive" style="max-height: 300px; overflow-y: auto;">
                    <table class="table table-sm table-bordered" id="previewTable">
                        <thead class="table-dark">
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
                text: 'Importar Dados',
                class: 'success',
                onclick: 'processImport()'
            }
        ];

        Utils.showModal('Importar Inspeções', content, actions);
        
        // Configurar evento do arquivo
        document.getElementById('importFile').addEventListener('change', (e) => {
            this.handleFileSelect(e);
        });
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = this.parseFileData(e.target.result, file.name);
                this.showImportPreview(data);
            } catch (error) {
                console.error('Erro ao processar arquivo:', error);
                Utils.showMessage('Erro ao processar arquivo. Verifique o formato.', 'error');
            }
        };
        
        if (file.name.endsWith('.csv')) {
            reader.readAsText(file);
        } else {
            reader.readAsArrayBuffer(file);
        }
    }

    parseFileData(content, filename) {
        if (filename.endsWith('.csv')) {
            return this.parseCSV(content);
        } else {
            // Para Excel, seria necessário uma biblioteca como SheetJS
            // Por enquanto, vamos focar no CSV
            throw new Error('Arquivos Excel não suportados ainda. Use formato CSV.');
        }
    }

    parseCSV(content) {
        const lines = content.split('\n').filter(line => line.trim());
        if (lines.length < 2) throw new Error('Arquivo vazio ou inválido');

        const headers = lines[0].split(',').map(h => h.trim());
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            if (values.length === headers.length) {
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index];
                });
                data.push(row);
            }
        }

        return data;
    }

    showImportPreview(data) {
        if (data.length === 0) {
            Utils.showMessage('Nenhum dado encontrado no arquivo', 'warning');
            return;
        }

        const preview = document.getElementById('importPreview');
        const header = document.getElementById('previewHeader');
        const body = document.getElementById('previewBody');

        // Cabeçalho
        const headers = Object.keys(data[0]);
        header.innerHTML = headers.map(h => `<th>${h}</th>`).join('');

        // Dados (máximo 10 linhas)
        const previewData = data.slice(0, 10);
        body.innerHTML = previewData.map(row => 
            `<tr>${headers.map(h => `<td>${row[h] || ''}</td>`).join('')}</tr>`
        ).join('');

        preview.style.display = 'block';
        
        // Armazenar dados para importação
        this.importData = data;
    }

    async processImport() {
        if (!this.importData || this.importData.length === 0) {
            Utils.showMessage('Nenhum dado para importar', 'warning');
            return;
        }

        try {
            Utils.showMessage('Iniciando importação...', 'info');
            
            let successCount = 0;
            let errorCount = 0;

            for (const row of this.importData) {
                try {
                    const inspecaoData = this.mapImportData(row);
                    await databaseManager.addInspecao(inspecaoData);
                    successCount++;
                } catch (error) {
                    console.error('Erro ao importar linha:', row, error);
                    errorCount++;
                }
            }

            Utils.showMessage(
                `Importação concluída! ${successCount} inspeções importadas com sucesso. ${errorCount} erros.`, 
                successCount > 0 ? 'success' : 'warning'
            );

            // Recarregar dados
            await this.loadInspecoes();
            this.updateTable();

        } catch (error) {
            console.error('Erro na importação:', error);
            Utils.showMessage('Erro durante a importação', 'error');
        }
    }

    mapImportData(row) {
        return {
            numero: row['Numero'] || '',
            data: new Date(row['Data'] || new Date()),
            responsavel: row['Responsavel'] || '',
            produto: row['Produto'] || '',
            codigo_item: row['Codigo Item'] || '',
            obra: row['Obra'] || '',
            qtd_inspecionadas: parseInt(row['Qtd Inspecionadas']) || 0,
            qtd_boas: parseInt(row['Qtd Boas']) || 0,
            qtd_defeitos: parseInt(row['Qtd Defeitos']) || 0,
            parecer: row['Parecer'] || 'Pendente',
            qtd_bloqueada: parseInt(row['Qtd Bloqueada']) || 0,
            observacoes: row['Observacoes'] || '',
            status: 'CONCLUIDO'
        };
    }

    downloadTemplate() {
        const csvContent = `Numero,Data,Responsavel,Produto,Codigo Item,Obra,Qtd Inspecionadas,Qtd Boas,Qtd Defeitos,Parecer,Qtd Bloqueada,Observacoes
INS-001,2025-01-21,João Silva,Perfil Alumínio,PA-001,Projeto A,100,95,5,Aprovado,0,Inspeção visual completa
INS-002,2025-01-21,Maria Santos,Chapa Metálica,CM-002,Projeto B,50,48,2,Aprovado,0,Algumas imperfeições menores
INS-003,2025-01-21,Pedro Costa,Tubo Estrutural,TE-003,Projeto A,75,70,5,Reprovado,5,Defeitos estruturais encontrados`;

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'modelo_inspecoes.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        Utils.showMessage('Modelo baixado com sucesso!', 'success');
    }

    async clearAllInspecoes() {
        const confirmed = await Utils.confirm(
            'Confirmar Limpeza',
            'Tem certeza que deseja excluir TODAS as inspeções? Esta ação não pode ser desfeita e removerá todos os dados de inspeção do sistema.'
        );

        if (confirmed) {
            try {
                Utils.showMessage('Iniciando limpeza...', 'info');
                
                // Buscar todas as inspeções
                const allInspecoes = await databaseManager.getInspecoes();
                let deletedCount = 0;
                let errorCount = 0;

                for (const inspecao of allInspecoes) {
                    try {
                        await databaseManager.deleteInspecao(inspecao.id);
                        deletedCount++;
                    } catch (error) {
                        console.error('Erro ao excluir inspeção:', inspecao.id, error);
                        errorCount++;
                    }
                }

                Utils.showMessage(
                    `Limpeza concluída! ${deletedCount} inspeções removidas. ${errorCount} erros.`, 
                    deletedCount > 0 ? 'success' : 'warning'
                );

                // Recarregar dados
                await this.loadInspecoes();
                this.updateTable();

            } catch (error) {
                console.error('Erro na limpeza:', error);
                Utils.showMessage('Erro durante a limpeza', 'error');
            }
        }
    }

    async sendToRetrabalho(inspecaoId) {
        try {
            // Buscar dados da inspeção
            const inspecao = this.inspecoes.find(i => i.id === inspecaoId);
            if (!inspecao) {
                Utils.showMessage('Inspeção não encontrada', 'error');
                return;
            }

            // Verificar se já existe retrabalho para esta inspeção
            const existingRetrabalho = await this.checkExistingRetrabalho(inspecaoId);
            if (existingRetrabalho) {
                Utils.showMessage('Já existe um retrabalho para esta inspeção', 'warning');
                return;
            }

            // Abrir modal para configurar retrabalho
            this.showRetrabalhoModal(inspecao);

        } catch (error) {
            console.error('Erro ao enviar para retrabalho:', error);
            Utils.showMessage('Erro ao enviar para retrabalho', 'error');
        }
    }

    async checkExistingRetrabalho(inspecaoId) {
        try {
            const retrabalhos = await databaseManager.getRetrabalhos();
            return retrabalhos.find(r => r.inspecao_id === inspecaoId);
        } catch (error) {
            console.error('Erro ao verificar retrabalho existente:', error);
            return null;
        }
    }

    determinePriority(inspecao) {
        const qtdDefeitos = parseInt(inspecao.qtd_defeitos) || 0;
        const qtdBloqueada = parseInt(inspecao.qtd_bloqueada) || 0;
        const parecer = (inspecao.parecer || '').toLowerCase();
        
        if (parecer.includes('reprovado') && qtdBloqueada > 0) {
            return 'ALTA';
        } else if (qtdDefeitos > 0) {
            return 'MEDIA';
        } else {
            return 'BAIXA';
        }
    }

    determineDefectType(inspecao) {
        const parecer = (inspecao.parecer || '').toLowerCase();
        
        if (parecer.includes('reprovado')) {
            return 'REPROVADO_TOTAL';
        } else if (parseInt(inspecao.qtd_defeitos) > 0) {
            return 'REPROVADO_PARCIAL';
        } else {
            return 'DEFEITO_QUALIDADE';
        }
    }

    showRetrabalhoModal(inspecao) {
        const qtdDefeitos = parseInt(inspecao.qtd_defeitos) || 0;
        const qtdBloqueada = parseInt(inspecao.qtd_bloqueada) || 0;
        const totalReprovado = qtdDefeitos + qtdBloqueada;
        
        const content = `
            <div class="row">
                <div class="col-md-6">
                    <h6 class="text-primary">📋 Dados da Inspeção</h6>
                    <div class="mb-2">
                        <strong>Número da Inspeção:</strong> ${inspecao.numero || 'N/A'}
                    </div>
                    <div class="mb-2">
                        <strong>Número do Retrabalho:</strong> <span class="text-success fw-bold">${inspecao.numero || inspecao.id}</span>
                    </div>
                    <div class="mb-2">
                        <strong>Produto:</strong> ${inspecao.produto || 'N/A'}
                    </div>
                    <div class="mb-2">
                        <strong>Código Item:</strong> ${inspecao.codigo_item || inspecao.cod_item || 'N/A'}
                    </div>
                    <div class="mb-2">
                        <strong>Obra:</strong> ${inspecao.obra || 'N/A'}
                    </div>
                </div>
                <div class="col-md-6">
                    <h6 class="text-warning">⚠️ Quantidades Reprovadas</h6>
                    <div class="mb-2">
                        <strong>Qtd Defeitos:</strong> ${qtdDefeitos}
                    </div>
                    <div class="mb-2">
                        <strong>Qtd Bloqueada:</strong> ${qtdBloqueada}
                    </div>
                    <div class="mb-2">
                        <strong>Total Reprovado:</strong> <span class="text-danger fw-bold">${totalReprovado}</span>
                    </div>
                </div>
            </div>

            <hr>

            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <label for="retrabalhoQuantidade" class="form-label">Quantidade para Retrabalho *</label>
                        <input type="number" class="form-control" id="retrabalhoQuantidade" 
                               value="${totalReprovado}" min="1" required>
                        <div class="form-text">Quantidade de itens que serão enviados para retrabalho</div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="mb-3">
                        <label for="retrabalhoPrazo" class="form-label">Prazo para Retrabalho *</label>
                        <input type="date" class="form-control" id="retrabalhoPrazo" required>
                        <div class="form-text">Data limite para conclusão do retrabalho</div>
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <label for="retrabalhoResponsavel" class="form-label">Responsável pelo Retrabalho *</label>
                        <input type="text" class="form-control" id="retrabalhoResponsavel" 
                               placeholder="Nome do responsável" required>
                        <div class="form-text">Pessoa responsável por executar o retrabalho</div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="mb-3">
                        <label for="retrabalhoPrioridade" class="form-label">Prioridade</label>
                        <select class="form-select" id="retrabalhoPrioridade">
                            <option value="ALTA">🔴 Alta</option>
                            <option value="MEDIA" selected>🟡 Média</option>
                            <option value="BAIXA">🟢 Baixa</option>
                        </select>
                    </div>
                </div>
            </div>

            <div class="mb-3">
                <label for="retrabalhoObservacoes" class="form-label">Observações</label>
                <textarea class="form-control" id="retrabalhoObservacoes" rows="3" 
                          placeholder="Detalhes sobre o retrabalho, tipo de defeito, etc.">Retrabalho gerado da inspeção ${inspecao.numero || inspecao.id}. ${inspecao.observacoes || ''}</textarea>
            </div>

            <div class="alert alert-info">
                <i class="fas fa-info-circle"></i>
                <strong>Informação:</strong> O retrabalho será criado com base nos dados da inspeção. 
                Você pode ajustar as informações acima conforme necessário.
            </div>
        `;

        const actions = [
            {
                text: 'Cancelar',
                class: 'btn-secondary',
                onclick: 'closeModal()'
            },
            {
                text: 'Enviar para Retrabalho',
                class: 'btn-warning',
                onclick: `confirmarRetrabalho('${inspecao.id}')`
            }
        ];

        Utils.showModal('🔧 Enviar para Retrabalho', content, actions);
        
        // Definir data mínima como hoje
        const hoje = new Date().toISOString().split('T')[0];
        document.getElementById('retrabalhoPrazo').min = hoje;
    }

    async confirmarRetrabalho(inspecaoId) {
        console.log('confirmarRetrabalho chamada para:', inspecaoId);
        try {
            // Validar campos obrigatórios
            const quantidade = document.getElementById('retrabalhoQuantidade').value;
            const prazo = document.getElementById('retrabalhoPrazo').value;
            const responsavel = document.getElementById('retrabalhoResponsavel').value;

            console.log('Dados capturados:', { quantidade, prazo, responsavel });

            if (!quantidade || !prazo || !responsavel) {
                Utils.showMessage('Preencha todos os campos obrigatórios', 'error');
                return;
            }

            if (parseInt(quantidade) < 1) {
                Utils.showMessage('A quantidade deve ser maior que zero', 'error');
                return;
            }

            // Buscar dados da inspeção
            const inspecao = this.inspecoes.find(i => i.id === inspecaoId);
            if (!inspecao) {
                Utils.showMessage('Inspeção não encontrada', 'error');
                return;
            }

            // Criar dados do retrabalho
            const retrabalhoData = {
                inspecao_id: inspecaoId,
                numero: inspecao.numero || inspecaoId, // Usar o mesmo número da inspeção
                inspecao_numero: inspecao.numero || '',
                produto: inspecao.produto || '',
                codigo_item: inspecao.codigo_item || inspecao.cod_item || '',
                obra: inspecao.obra || '',
                quantidade_retrabalho: parseInt(quantidade),
                quantidade_defeitos: parseInt(inspecao.qtd_defeitos) || 0,
                quantidade_bloqueada: parseInt(inspecao.qtd_bloqueada) || 0,
                responsavel_retrabalho: responsavel,
                prazo_retrabalho: new Date(prazo),
                prioridade: document.getElementById('retrabalhoPrioridade').value,
                observacoes: document.getElementById('retrabalhoObservacoes').value,
                tipo_defeito: this.determineDefectType(inspecao),
                data_inspecao: inspecao.data || new Date(),
                status: 'PENDENTE'
            };

            // Adicionar retrabalho
            await databaseManager.addRetrabalho(retrabalhoData);
            
            Utils.showMessage('Retrabalho criado com sucesso!', 'success');
            
            // Fechar modal
            Utils.closeModal();
            
            // Atualizar status da inspeção
            await databaseManager.updateInspecao(inspecaoId, {
                status: 'ENVIADO_RETRABALHO',
                data_atualizacao: new Date()
            });

        } catch (error) {
            console.error('Erro ao criar retrabalho:', error);
            Utils.showMessage('Erro ao criar retrabalho', 'error');
        }
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

// Inicializar página de inspeções
const inspecoesPage = new InspecoesPage();

// Exportar para uso global
window.InspecoesPage = InspecoesPage;
window.inspecoesPage = inspecoesPage;

// Exportar funções específicas para uso em onclick
window.showInspecaoModal = () => inspecoesPage.showInspecaoModal();
window.saveInspecao = () => inspecoesPage.saveInspecao();
window.saveInspecaoUpdate = (id) => inspecoesPage.saveInspecaoUpdate(id);
window.editInspecao = (id) => inspecoesPage.editInspecao(id);
window.deleteInspecao = (id) => inspecoesPage.deleteInspecao(id);
window.viewInspecao = (id) => inspecoesPage.viewInspecao(id);
window.showImportModal = () => inspecoesPage.showImportModal();
window.processImport = () => inspecoesPage.processImport();
window.downloadTemplate = () => inspecoesPage.downloadTemplate();
window.clearAllInspecoes = () => inspecoesPage.clearAllInspecoes();
window.sendToRetrabalho = (id) => inspecoesPage.sendToRetrabalho(id);
window.confirmarRetrabalho = (id) => {
    console.log('Função global confirmarRetrabalho chamada com ID:', id);
    inspecoesPage.confirmarRetrabalho(id);
};
