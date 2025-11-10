// Página de Projetos
class ProjetosPage {
    constructor() {
        this.projetos = [];
        this.currentFilters = {};
        this.listeners = [];
    }

    async load(params = {}) {
        try {
            this.showLoading();
            
            // Verificar se deve criar novo projeto
            if (params.action === 'create') {
                this.showProjetoModal();
                return;
            }

            // Carregar projetos
            await this.loadProjetos();
            
            // Renderizar página
            this.render();
            
            // Configurar listeners para atualizações em tempo real
            this.setupRealtimeListeners();
            
        } catch (error) {
            console.error('Erro ao carregar projetos:', error);
            Utils.showMessage('Erro ao carregar projetos', 'error');
        }
    }

    showLoading() {
        document.getElementById('pageContent').innerHTML = `
            <div class="loading">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Carregando projetos...</span>
                </div>
            </div>
        `;
    }

    async loadProjetos() {
        try {
            this.projetos = await databaseManager.getProjetos({ ativo: true });
        } catch (error) {
            console.error('Erro ao carregar projetos:', error);
            throw error;
        }
    }

    render() {
        const content = `
            <div class="row mb-3">
                <div class="col-md-6">
                    <div class="input-group">
                        <input type="text" class="form-control" id="searchProjetos" 
                               placeholder="Pesquisar por código ou descrição...">
                        <button class="btn btn-outline-secondary" type="button" id="clearSearchProjetos">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <div class="col-md-6 text-end">
                    ${authManager.hasPermission('criar') ? `
                        <button class="btn btn-success me-2" onclick="projetosPage.showImportModal()">
                            <i class="fas fa-file-excel me-2"></i>Importar Projetos
                        </button>
                        <button class="btn btn-primary" onclick="projetosPage.showProjetoModal()">
                            <i class="fas fa-plus me-2"></i>Novo Projeto
                        </button>
                    ` : ''}
                </div>
            </div>

            <div class="card shadow">
                <div class="card-header py-3">
                    <h6 class="m-0 font-weight-bold text-primary">Lista de Projetos</h6>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive" style="max-height: 70vh; overflow-y: auto;">
                        <table class="table table-bordered table-hover mb-0" id="projetosTable">
                            <thead class="table-dark sticky-top">
                                <tr>
                                    <th style="min-width: 100px;">Código</th>
                                    <th style="min-width: 200px;">Descrição</th>
                                    <th style="min-width: 120px;">Cliente</th>
                                    <th style="min-width: 120px;">Status</th>
                                    <th style="min-width: 120px;">Data Início</th>
                                    <th style="min-width: 120px;">Data Fim</th>
                                    <th style="min-width: 150px;">Observações</th>
                                    <th style="min-width: 100px;">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.renderProjetosTable()}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('pageContent').innerHTML = content;
        this.setupEventListeners();
        document.getElementById('pageTitle').textContent = 'Projetos';
        
        // Buscar botões de ação da página
        const pageActions = document.getElementById('pageActions');
        if (pageActions) {
            pageActions.innerHTML = authManager.hasPermission('criar') ? `
                <button class="btn btn-primary" onclick="projetosPage.showProjetoModal()">
                    <i class="fas fa-plus me-2"></i>Novo Projeto
                </button>
            ` : '';
        }
    }

    renderProjetosTable() {
        if (this.projetos.length === 0) {
            return `
                <tr>
                    <td colspan="8" class="text-center py-4">
                        <i class="fas fa-project-diagram fa-3x text-muted mb-3"></i>
                        <p class="text-muted">Nenhum projeto encontrado</p>
                    </td>
                </tr>
            `;
        }

        return this.projetos.map(projeto => {
            const statusConfig = this.getStatusConfig(projeto.status);
            
            return `
                <tr>
                    <td>${projeto.codigo || '-'}</td>
                    <td>${projeto.descricao || '-'}</td>
                    <td>${projeto.cliente || '-'}</td>
                    <td>
                        <span class="badge bg-${statusConfig.class}">
                            ${statusConfig.label}
                        </span>
                    </td>
                    <td>${projeto.data_inicio ? Utils.formatDate(projeto.data_inicio) : '-'}</td>
                    <td>${projeto.data_fim ? Utils.formatDate(projeto.data_fim) : '-'}</td>
                    <td>
                        <small>${projeto.observacoes || '-'}</small>
                    </td>
                    <td class="text-center">
                        <div class="btn-group" role="group">
                            <button type="button" class="btn btn-outline-info btn-sm" 
                                    onclick="projetosPage.viewProjeto('${projeto.id}')" 
                                    title="Visualizar">
                                <i class="fas fa-eye"></i>
                            </button>
                            ${authManager.hasPermission('editar') ? `
                            <button type="button" class="btn btn-outline-warning btn-sm" 
                                    onclick="projetosPage.editProjeto('${projeto.id}')" 
                                    title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            ` : ''}
                            ${authManager.isAdmin() ? `
                            <button type="button" class="btn btn-outline-danger btn-sm" 
                                    onclick="projetosPage.deleteProjeto('${projeto.id}')" 
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

    getStatusConfig(status) {
        const configs = {
            'ATIVO': { class: 'success', label: 'Ativo' },
            'PAUSADO': { class: 'warning', label: 'Pausado' },
            'CONCLUIDO': { class: 'info', label: 'Concluído' },
            'CANCELADO': { class: 'danger', label: 'Cancelado' }
        };
        
        return configs[status] || { class: 'secondary', label: status || 'Não definido' };
    }

    setupEventListeners() {
        // Pesquisa em tempo real
        const searchInput = document.getElementById('searchProjetos');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce(() => {
                this.filterProjetos(searchInput.value);
            }, 300));
        }

        // Botão limpar pesquisa
        const clearBtn = document.getElementById('clearSearchProjetos');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                document.getElementById('searchProjetos').value = '';
                this.filterProjetos('');
            });
        }
    }

    filterProjetos(searchTerm) {
        const table = document.getElementById('projetosTable');
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

        // Listener para projetos (simulado, já que não temos listener específico)
        const projetosListener = () => {
            // Simular listener - em produção, usar databaseManager.onProjetosChange
        };

        this.listeners = [projetosListener];
    }

    updateTable() {
        const tbody = document.querySelector('#projetosTable tbody');
        if (tbody) {
            tbody.innerHTML = this.renderProjetosTable();
        }
    }

    // Modal de projeto
    showProjetoModal(projetoId = null) {
        if (projetoId) {
            this.loadProjetoForEdit(projetoId);
        } else {
            this.renderProjetoModal();
        }
    }

    showImportModal() {
        const content = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i>
                <strong>Importar Projetos do Excel</strong>
                <br><br>
                <p>Selecione um arquivo Excel (.xlsx) com os projetos para importar.</p>
                <p><strong>Formato esperado:</strong> Uma coluna com os nomes dos projetos (ex: "1264 - LA ISLA", "1260 - CLARIS")</p>
            </div>
            
            <div class="mb-3">
                <label for="excelFile" class="form-label">Arquivo Excel</label>
                <input type="file" class="form-control" id="excelFile" accept=".xlsx,.xls">
                <div class="form-text">Formatos suportados: .xlsx, .xls</div>
            </div>
            
            <div class="mb-3">
                <label for="columnIndex" class="form-label">Coluna dos Projetos</label>
                <select class="form-control" id="columnIndex">
                    <option value="0">Coluna A (1)</option>
                    <option value="1">Coluna B (2)</option>
                    <option value="2">Coluna C (3)</option>
                    <option value="3">Coluna D (4)</option>
                    <option value="4">Coluna E (5)</option>
                    <option value="5">Coluna F (6)</option>
                    <option value="6">Coluna G (7)</option>
                    <option value="7">Coluna H (8)</option>
                    <option value="8">Coluna I (9)</option>
                    <option value="9">Coluna J (10)</option>
                    <option value="10">Coluna K (11)</option>
                    <option value="11">Coluna L (12)</option>
                    <option value="12">Coluna M (13)</option>
                    <option value="13">Coluna N (14)</option>
                </select>
                <div class="form-text">Selecione a coluna que contém os nomes dos projetos</div>
            </div>
            
            <div id="importPreview" class="mt-3" style="display: none;">
                <h6>Pré-visualização dos projetos encontrados:</h6>
                <div class="table-responsive" style="max-height: 200px; overflow-y: auto;">
                    <table class="table table-sm table-bordered">
                        <thead class="table-light">
                            <tr>
                                <th>Nome do Projeto</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody id="previewBody">
                        </tbody>
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
                text: 'Importar Projetos',
                class: 'success',
                action: 'projetosPage.processImport()'
            }
        ];

        Utils.showModal('Importar Projetos do Excel', content, actions);
        
        // Configurar listener do arquivo
        const fileInput = document.getElementById('excelFile');
        fileInput.addEventListener('change', (e) => {
            this.previewExcelFile(e.target.files[0]);
        });
    }

    async previewExcelFile(file) {
        if (!file) return;

        try {
            const data = await this.readExcelFile(file);
            const columnIndex = parseInt(document.getElementById('columnIndex').value);
            
            // Extrair projetos da coluna selecionada
            const projetos = [];
            for (let i = 1; i < data.length; i++) { // Pular cabeçalho
                const row = data[i];
                if (row && row[columnIndex]) {
                    const nomeProjeto = row[columnIndex].toString().trim();
                    if (nomeProjeto && nomeProjeto !== '') {
                        projetos.push(nomeProjeto);
                    }
                }
            }

            // Mostrar preview
            const previewDiv = document.getElementById('importPreview');
            const previewBody = document.getElementById('previewBody');
            
            if (projetos.length > 0) {
                previewBody.innerHTML = projetos.map(projeto => `
                    <tr>
                        <td>${projeto}</td>
                        <td><span class="badge bg-info">Novo</span></td>
                    </tr>
                `).join('');
                previewDiv.style.display = 'block';
            } else {
                previewDiv.style.display = 'none';
            }
        } catch (error) {
            console.error('Erro ao processar arquivo:', error);
            Utils.showMessage('Erro ao processar arquivo Excel', 'error');
        }
    }

    async readExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    resolve(jsonData);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
            reader.readAsArrayBuffer(file);
        });
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
            const columnIndex = parseInt(document.getElementById('columnIndex').value);
            
            // Extrair projetos únicos
            const projetosUnicos = new Set();
            for (let i = 1; i < data.length; i++) { // Pular cabeçalho
                const row = data[i];
                if (row && row[columnIndex]) {
                    const nomeProjeto = row[columnIndex].toString().trim();
                    if (nomeProjeto && nomeProjeto !== '') {
                        projetosUnicos.add(nomeProjeto);
                    }
                }
            }

            // Verificar quais projetos já existem
            const projetosExistentes = await databaseManager.getProjetos({ ativo: true });
            const codigosExistentes = new Set(projetosExistentes.map(p => p.codigo));

            let importados = 0;
            let jaExistentes = 0;

            // Criar projetos que não existem
            for (const nomeProjeto of projetosUnicos) {
                if (!codigosExistentes.has(nomeProjeto)) {
                    try {
                        const novoProjeto = {
                            codigo: nomeProjeto,
                            descricao: nomeProjeto,
                            ativo: true,
                            tipo: 'IMPORTADO',
                            observacoes: 'Projeto importado do Excel'
                        };
                        
                        await databaseManager.addProjeto(novoProjeto);
                        importados++;
                    } catch (error) {
                        console.error(`Erro ao criar projeto "${nomeProjeto}":`, error);
                    }
                } else {
                    jaExistentes++;
                }
            }

            // Fechar modal
            const modalElement = document.querySelector('.modal');
            if (modalElement) {
                const modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) modal.hide();
            }

            // Mostrar resultado
            if (importados > 0) {
                Utils.showMessage(`Importação concluída! ${importados} projetos importados, ${jaExistentes} já existiam.`, 'success');
                
                // Recarregar página
                await this.loadProjetos();
                this.updateTable();
            } else {
                Utils.showMessage('Nenhum projeto novo foi importado. Todos os projetos já existem no sistema.', 'warning');
            }
                    
        } catch (error) {
            console.error('Erro na importação:', error);
            Utils.showMessage(`Erro na importação: ${error.message}`, 'error');
        }
    }

    async loadProjetoForEdit(projetoId) {
        try {
            const projeto = await databaseManager.getProjeto(projetoId);
            if (projeto) {
                this.renderProjetoModal(projeto);
            }
        } catch (error) {
            console.error('Erro ao carregar projeto:', error);
            Utils.showMessage('Erro ao carregar projeto', 'error');
        }
    }

    renderProjetoModal(projeto = null) {
        const isEdit = projeto !== null;
        const title = isEdit ? 'Editar Projeto' : 'Novo Projeto';
        
        const content = `
            <form id="projetoForm">
                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="codigo" class="form-label">Código *</label>
                            <input type="text" class="form-control" id="codigo" required 
                                   value="${projeto ? projeto.codigo : ''}">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="descricao" class="form-label">Descrição *</label>
                            <input type="text" class="form-control" id="descricao" required 
                                   value="${projeto ? projeto.descricao : ''}">
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="cliente" class="form-label">Cliente</label>
                            <input type="text" class="form-control" id="cliente" 
                                   value="${projeto ? projeto.cliente : ''}">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="status" class="form-label">Status</label>
                            <select class="form-control" id="status">
                                <option value="ATIVO" ${projeto && projeto.status === 'ATIVO' ? 'selected' : ''}>Ativo</option>
                                <option value="PAUSADO" ${projeto && projeto.status === 'PAUSADO' ? 'selected' : ''}>Pausado</option>
                                <option value="CONCLUIDO" ${projeto && projeto.status === 'CONCLUIDO' ? 'selected' : ''}>Concluído</option>
                                <option value="CANCELADO" ${projeto && projeto.status === 'CANCELADO' ? 'selected' : ''}>Cancelado</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="data_inicio" class="form-label">Data de Início</label>
                            <input type="date" class="form-control" id="data_inicio" 
                                   value="${projeto && projeto.data_inicio ? this.formatDateForInput(projeto.data_inicio) : ''}">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="data_fim" class="form-label">Data de Fim</label>
                            <input type="date" class="form-control" id="data_fim" 
                                   value="${projeto && projeto.data_fim ? this.formatDateForInput(projeto.data_fim) : ''}">
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-12">
                        <div class="mb-3">
                            <label for="observacoes" class="form-label">Observações</label>
                            <textarea class="form-control" id="observacoes" rows="3">${projeto ? projeto.observacoes : ''}</textarea>
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
                action: `projetosPage.${isEdit ? 'updateProjeto' : 'saveProjeto'}('${projeto ? projeto.id : ''}')`
            }
        ];

        Utils.showModal(title, content, actions);
    }

    formatDateForInput(date) {
        if (!date) return '';
        
        const d = date.toDate ? date.toDate() : new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    }

    async saveProjeto() {
        try {
            if (!Utils.validateForm('projetoForm')) {
                Utils.showMessage('Por favor, preencha todos os campos obrigatórios', 'warning');
                return;
            }

            const projetoData = {
                codigo: document.getElementById('codigo').value.trim(),
                descricao: document.getElementById('descricao').value.trim(),
                cliente: document.getElementById('cliente').value.trim() || null,
                status: document.getElementById('status').value || 'ATIVO',
                data_inicio: document.getElementById('data_inicio').value ? 
                    new Date(document.getElementById('data_inicio').value + 'T00:00:00') : null,
                data_fim: document.getElementById('data_fim').value ? 
                    new Date(document.getElementById('data_fim').value + 'T00:00:00') : null,
                observacoes: document.getElementById('observacoes').value.trim() || null
            };

            await databaseManager.addProjeto(projetoData);
            Utils.showMessage('Projeto criado com sucesso!', 'success');
            
            // Recarregar página
            await this.loadProjetos();
            this.updateTable();
            
        } catch (error) {
            console.error('Erro ao salvar projeto:', error);
            Utils.showMessage('Erro ao salvar projeto', 'error');
        }
    }

    async updateProjeto(projetoId) {
        try {
            if (!Utils.validateForm('projetoForm')) {
                Utils.showMessage('Por favor, preencha todos os campos obrigatórios', 'warning');
                return;
            }

            const projetoData = {
                codigo: document.getElementById('codigo').value.trim(),
                descricao: document.getElementById('descricao').value.trim(),
                cliente: document.getElementById('cliente').value.trim() || null,
                status: document.getElementById('status').value || 'ATIVO',
                data_inicio: document.getElementById('data_inicio').value ? 
                    new Date(document.getElementById('data_inicio').value + 'T00:00:00') : null,
                data_fim: document.getElementById('data_fim').value ? 
                    new Date(document.getElementById('data_fim').value + 'T00:00:00') : null,
                observacoes: document.getElementById('observacoes').value.trim() || null
            };

            await databaseManager.updateProjeto(projetoId, projetoData);
            Utils.showMessage('Projeto atualizado com sucesso!', 'success');
            
            // Recarregar página
            await this.loadProjetos();
            this.updateTable();
            
        } catch (error) {
            console.error('Erro ao atualizar projeto:', error);
            Utils.showMessage('Erro ao atualizar projeto', 'error');
        }
    }

    async deleteProjeto(projetoId) {
        try {
            const confirmed = await Utils.confirm(
                'Confirmar Exclusão',
                'Tem certeza que deseja excluir este projeto?'
            );

            if (confirmed) {
                await databaseManager.updateProjeto(projetoId, { ativo: false });
                Utils.showMessage('Projeto excluído com sucesso!', 'success');
                
                // Recarregar página
                await this.loadProjetos();
                this.updateTable();
            }
        } catch (error) {
            console.error('Erro ao excluir projeto:', error);
            Utils.showMessage('Erro ao excluir projeto', 'error');
        }
    }

    viewProjeto(projetoId) {
        const projeto = this.projetos.find(p => p.id === projetoId);
        if (!projeto) return;

        const statusConfig = this.getStatusConfig(projeto.status);

        const content = `
            <div class="row">
                <div class="col-md-6">
                    <p><strong>Código:</strong> ${projeto.codigo}</p>
                    <p><strong>Descrição:</strong> ${projeto.descricao}</p>
                    <p><strong>Cliente:</strong> ${projeto.cliente || '-'}</p>
                </div>
                <div class="col-md-6">
                    <p><strong>Status:</strong> 
                        <span class="badge bg-${statusConfig.class}">
                            ${statusConfig.label}
                        </span>
                    </p>
                    <p><strong>Data Início:</strong> ${projeto.data_inicio ? Utils.formatDate(projeto.data_inicio) : '-'}</p>
                    <p><strong>Data Fim:</strong> ${projeto.data_fim ? Utils.formatDate(projeto.data_fim) : '-'}</p>
                </div>
            </div>
            ${projeto.observacoes ? `<p><strong>Observações:</strong> ${projeto.observacoes}</p>` : ''}
        `;

        Utils.showModal('Detalhes do Projeto', content, [
            { text: 'Fechar', class: 'secondary' }
        ]);
    }

    editProjeto(projetoId) {
        this.showProjetoModal(projetoId);
    }

    unload() {
        // Limpar listeners quando sair da página
        this.listeners.forEach(unsubscribe => unsubscribe());
        this.listeners = [];
    }
}

// Inicializar página de projetos
const projetosPage = new ProjetosPage();

// Exportar para uso global
window.ProjetosPage = ProjetosPage;
window.projetosPage = projetosPage;
