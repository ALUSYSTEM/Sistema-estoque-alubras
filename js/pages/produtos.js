// Página de Produtos
class ProdutosPage {
    constructor() {
        this.produtos = [];
        this.currentFilters = {};
        this.listeners = [];
    }

    async load(params = {}) {
        try {
            this.showLoading();
            
            // Verificar se deve criar novo produto
            if (params.action === 'create') {
                this.showProdutoModal();
                return;
            }

            // Carregar produtos
            await this.loadProdutos();
            
            // Renderizar página
            this.render();
            
            // Configurar listeners para atualizações em tempo real
            this.setupRealtimeListeners();
            
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            Utils.showMessage('Erro ao carregar produtos', 'error');
        }
    }

    showLoading() {
        document.getElementById('pageContent').innerHTML = `
            <div class="loading">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Carregando produtos...</span>
                </div>
            </div>
        `;
    }

    async loadProdutos() {
        this.produtos = await databaseManager.getProdutos({ ativo: true });
        
        // OTIMIZAÇÃO: Buscar todo o estoque de uma vez em vez de fazer consulta por produto
        console.log(`Carregando estoque para ${this.produtos.length} produtos...`);
        const todosEstoques = await databaseManager.getEstoque({});
        
        // Criar mapa de estoque por produto para busca rápida
        const estoqueMap = new Map();
        todosEstoques.forEach(estoque => {
            if (estoque.produto_id) {
                if (!estoqueMap.has(estoque.produto_id)) {
                    estoqueMap.set(estoque.produto_id, []);
                }
                estoqueMap.get(estoque.produto_id).push(estoque);
            }
        });
        
        // Calcular estoque total para cada produto usando o mapa
        for (let i = 0; i < this.produtos.length; i++) {
            const produto = this.produtos[i];
            const estoquesProduto = estoqueMap.get(produto.id) || [];
            produto.estoque_total = estoquesProduto.reduce((total, e) => total + (e.saldo || 0), 0);
            produto.estoque_baixo = produto.estoque_total <= (produto.estoque_minimo || 0);
        }
        
        console.log(`Estoque calculado para ${this.produtos.length} produtos.`);
    }

    render() {
        const content = `
            <div class="row mb-3">
                <div class="col-md-6">
                    <div class="input-group">
                        <input type="text" class="form-control" id="searchProdutos" 
                               placeholder="Pesquisar por código ou nome do produto...">
                        <button class="btn btn-outline-secondary" type="button" id="clearSearch">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <div class="col-md-6 text-end">
                    ${authManager.hasPermission('criar') ? `
                        <button class="btn btn-primary" onclick="produtosPage.showProdutoModal()">
                            <i class="fas fa-plus me-2"></i>Novo Produto
                        </button>
                    ` : ''}
                </div>
            </div>

            <div class="card shadow">
                <div class="card-header py-3">
                    <h6 class="m-0 font-weight-bold text-primary">Lista de Produtos</h6>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive" style="max-height: 70vh; overflow-y: auto;">
                        <table class="table table-bordered table-hover mb-0" id="produtosTable">
                            <thead class="table-dark sticky-top">
                                <tr>
                                    <th style="min-width: 100px;">Código</th>
                                    <th style="min-width: 200px;">Descrição</th>
                                    <th style="min-width: 120px;">Variante</th>
                                    <th style="min-width: 100px;">Tamanho</th>
                                    <th style="min-width: 80px;">Unidade</th>
                                    <th style="min-width: 80px;">Perecível</th>
                                    <th style="min-width: 100px;">Estoque Mínimo</th>
                                    <th style="min-width: 100px;">Estoque Atual</th>
                                    <th style="min-width: 120px;">Preço Unitário</th>
                                    <th style="min-width: 150px;">Fornecedor</th>
                                    <th style="min-width: 100px; text-align: center;">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.renderProdutosTable()}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('pageContent').innerHTML = content;
        this.setupEventListeners();
        document.getElementById('pageTitle').textContent = 'Produtos';
        
        // Buscar botões de ação da página
        const pageActions = document.getElementById('pageActions');
        if (pageActions) {
            pageActions.innerHTML = authManager.hasPermission('criar') ? `
                <button class="btn btn-primary" onclick="produtosPage.showProdutoModal()">
                    <i class="fas fa-plus me-2"></i>Novo Produto
                </button>
            ` : '';
        }
    }

    renderProdutosTable() {
        if (this.produtos.length === 0) {
            return `
                <tr>
                    <td colspan="11" class="text-center py-4">
                        <i class="fas fa-boxes fa-3x text-muted mb-3"></i>
                        <p class="text-muted">Nenhum produto encontrado</p>
                    </td>
                </tr>
            `;
        }

        return this.produtos.map(produto => `
            <tr>
                <td>${produto.codigo || '-'}</td>
                <td>${produto.descricao || '-'}</td>
                <td>${produto.variante || '-'}</td>
                <td>${produto.tamanho || '-'}</td>
                <td>${produto.unidade_medida || '-'}</td>
                <td>
                    ${produto.perecivel ? 
                        '<span class="badge bg-warning">Sim</span>' : 
                        '<span class="badge bg-secondary">Não</span>'
                    }
                </td>
                <td>${produto.estoque_minimo || 0}</td>
                <td>
                    <span class="badge bg-${produto.estoque_baixo && produto.estoque_total > 0 ? 'danger' : 'success'}">
                        ${Utils.formatNumber(produto.estoque_total || 0, 0)}
                    </span>
                </td>
                <td>${Utils.formatCurrency(produto.preco_unitario || 0)}</td>
                <td>${produto.fornecedor || '-'}</td>
                <td class="text-center">
                    <div class="btn-group" role="group">
                        <button type="button" class="btn btn-outline-info btn-sm" 
                                onclick="produtosPage.viewProduto('${produto.id}')" 
                                title="Visualizar">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${authManager.hasPermission('editar') ? `
                        <button type="button" class="btn btn-outline-warning btn-sm" 
                                onclick="produtosPage.editProduto('${produto.id}')" 
                                title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        ` : ''}
                        ${authManager.isAdmin() ? `
                        <button type="button" class="btn btn-outline-danger btn-sm" 
                                onclick="produtosPage.deleteProduto('${produto.id}')" 
                                title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    }

    setupEventListeners() {
        // Pesquisa em tempo real
        const searchInput = document.getElementById('searchProdutos');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce(() => {
                this.filterProdutos(searchInput.value);
            }, 300));
        }

        // Botão limpar pesquisa
        const clearBtn = document.getElementById('clearSearch');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                document.getElementById('searchProdutos').value = '';
                this.filterProdutos('');
            });
        }
    }

    filterProdutos(searchTerm) {
        const table = document.getElementById('produtosTable');
        if (!table) return;

        // OTIMIZAÇÃO: Usar requestAnimationFrame para evitar bloqueio da UI
        requestAnimationFrame(() => {
            const tbody = table.getElementsByTagName('tbody')[0];
            if (!tbody) return;

            const rows = tbody.getElementsByTagName('tr');
            const term = searchTerm.toLowerCase();

            // OTIMIZAÇÃO: Processar em lotes para não travar a interface
            const batchSize = 50;
            let currentIndex = 0;

            const processBatch = () => {
                const endIndex = Math.min(currentIndex + batchSize, rows.length);
                
                for (let i = currentIndex; i < endIndex; i++) {
                    const row = rows[i];
                    const cells = row.getElementsByTagName('td');
                    let found = false;

                    if (cells.length > 2) { // Verificar se tem pelo menos 3 células
                        // OTIMIZAÇÃO: Busca mais eficiente
                        const codigo = cells[0].textContent.toLowerCase();
                        const descricao = cells[1].textContent.toLowerCase();
                        
                        found = codigo.includes(term) || descricao.includes(term);
                    }

                    // OTIMIZAÇÃO: Usar classList para melhor performance
                    row.style.display = found ? '' : 'none';
                }

                currentIndex = endIndex;

                // Continuar processamento em próximo frame se necessário
                if (currentIndex < rows.length) {
                    requestAnimationFrame(processBatch);
                }
            };

            processBatch();
        });
    }

    setupRealtimeListeners() {
        // Limpar listeners anteriores
        this.listeners.forEach(unsubscribe => unsubscribe());

        // Listener para produtos
        const produtosListener = databaseManager.onProdutosChange(async (snapshot) => {
            await this.loadProdutos();
            this.updateTable();
        });

        // Listener para estoque (atualizar estoque atual dos produtos)
        const estoqueListener = databaseManager.onEstoqueChange(async () => {
            await this.loadProdutos();
            this.updateTable();
        });

        this.listeners = [produtosListener, estoqueListener];
    }

    updateTable() {
        const tbody = document.querySelector('#produtosTable tbody');
        if (tbody) {
            tbody.innerHTML = this.renderProdutosTable();
        }
    }

    // Modal de produto
    showProdutoModal(produtoId = null) {
        if (produtoId) {
            this.loadProdutoForEdit(produtoId);
        } else {
            this.renderProdutoModal();
        }
    }

    async loadProdutoForEdit(produtoId) {
        try {
            const produto = await databaseManager.getProduto(produtoId);
            if (produto) {
                this.renderProdutoModal(produto);
            }
        } catch (error) {
            console.error('Erro ao carregar produto:', error);
            Utils.showMessage('Erro ao carregar produto', 'error');
        }
    }

    renderProdutoModal(produto = null) {
        const isEdit = produto !== null;
        const title = isEdit ? 'Editar Produto' : 'Novo Produto';
        
        const content = `
            <form id="produtoForm">
                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="codigo" class="form-label">Código *</label>
                            <input type="text" class="form-control" id="codigo" required 
                                   value="${produto ? produto.codigo : ''}">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="descricao" class="form-label">Descrição *</label>
                            <input type="text" class="form-control" id="descricao" required 
                                   value="${produto ? produto.descricao : ''}">
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="variante" class="form-label">Variante</label>
                            <input type="text" class="form-control" id="variante" 
                                   value="${produto ? produto.variante : ''}">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="tamanho" class="form-label">Tamanho</label>
                            <input type="text" class="form-control" id="tamanho" 
                                   value="${produto ? produto.tamanho : ''}">
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="unidade_medida" class="form-label">Unidade de Medida *</label>
                            <select class="form-control" id="unidade_medida" required>
                                <option value="">Selecione...</option>
                                <option value="UN" ${produto && produto.unidade_medida === 'UN' ? 'selected' : ''}>Unidade</option>
                                <option value="KG" ${produto && produto.unidade_medida === 'KG' ? 'selected' : ''}>Quilograma</option>
                                <option value="G" ${produto && produto.unidade_medida === 'G' ? 'selected' : ''}>Gramas</option>
                                <option value="L" ${produto && produto.unidade_medida === 'L' ? 'selected' : ''}>Litros</option>
                                <option value="ML" ${produto && produto.unidade_medida === 'ML' ? 'selected' : ''}>Mililitros</option>
                                <option value="M" ${produto && produto.unidade_medida === 'M' ? 'selected' : ''}>Metros</option>
                                <option value="CM" ${produto && produto.unidade_medida === 'CM' ? 'selected' : ''}>Centímetros</option>
                                <option value="M²" ${produto && produto.unidade_medida === 'M²' ? 'selected' : ''}>Metros Quadrados</option>
                                <option value="M³" ${produto && produto.unidade_medida === 'M³' ? 'selected' : ''}>Metros Cúbicos</option>
                            </select>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="estoque_minimo" class="form-label">Estoque Mínimo</label>
                            <input type="number" class="form-control" id="estoque_minimo" min="0" step="0.01" 
                                   value="${produto ? produto.estoque_minimo : ''}">
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="preco_unitario" class="form-label">Preço Unitário</label>
                            <input type="number" class="form-control" id="preco_unitario" min="0" step="0.01" 
                                   value="${produto ? produto.preco_unitario : ''}">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="fornecedor" class="form-label">Fornecedor</label>
                            <input type="text" class="form-control" id="fornecedor" 
                                   value="${produto ? produto.fornecedor : ''}">
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-12">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="perecivel" 
                                   ${produto && produto.perecivel ? 'checked' : ''}>
                            <label class="form-check-label" for="perecivel">
                                Produto Perecível
                            </label>
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
                action: `produtosPage.${isEdit ? 'updateProduto' : 'saveProduto'}('${produto ? produto.id : ''}')`
            }
        ];

        Utils.showModal(title, content, actions);
    }

    async saveProduto() {
        try {
            if (!Utils.validateForm('produtoForm')) {
                Utils.showMessage('Por favor, preencha todos os campos obrigatórios', 'warning');
                return;
            }

            const produtoData = {
                codigo: document.getElementById('codigo').value.trim(),
                descricao: document.getElementById('descricao').value.trim(),
                variante: document.getElementById('variante').value.trim() || null,
                tamanho: document.getElementById('tamanho').value.trim() || null,
                unidade_medida: document.getElementById('unidade_medida').value,
                estoque_minimo: parseFloat(document.getElementById('estoque_minimo').value) || 0,
                preco_unitario: parseFloat(document.getElementById('preco_unitario').value) || 0,
                fornecedor: document.getElementById('fornecedor').value.trim() || null,
                perecivel: document.getElementById('perecivel').checked
            };

            await databaseManager.addProduto(produtoData);
            Utils.showMessage('Produto criado com sucesso!', 'success');
            
            // Recarregar página
            await this.loadProdutos();
            this.updateTable();
            
        } catch (error) {
            console.error('Erro ao salvar produto:', error);
            Utils.showMessage('Erro ao salvar produto', 'error');
        }
    }

    async updateProduto(produtoId) {
        try {
            if (!Utils.validateForm('produtoForm')) {
                Utils.showMessage('Por favor, preencha todos os campos obrigatórios', 'warning');
                return;
            }

            const produtoData = {
                codigo: document.getElementById('codigo').value.trim(),
                descricao: document.getElementById('descricao').value.trim(),
                variante: document.getElementById('variante').value.trim() || null,
                tamanho: document.getElementById('tamanho').value.trim() || null,
                unidade_medida: document.getElementById('unidade_medida').value,
                estoque_minimo: parseFloat(document.getElementById('estoque_minimo').value) || 0,
                preco_unitario: parseFloat(document.getElementById('preco_unitario').value) || 0,
                fornecedor: document.getElementById('fornecedor').value.trim() || null,
                perecivel: document.getElementById('perecivel').checked
            };

            await databaseManager.updateProduto(produtoId, produtoData);
            Utils.showMessage('Produto atualizado com sucesso!', 'success');
            
            // Recarregar página
            await this.loadProdutos();
            this.updateTable();
            
        } catch (error) {
            console.error('Erro ao atualizar produto:', error);
            Utils.showMessage('Erro ao atualizar produto', 'error');
        }
    }

    async deleteProduto(produtoId) {
        try {
            const confirmed = await Utils.confirm(
                'Confirmar Exclusão',
                'Tem certeza que deseja excluir este produto?'
            );

            if (confirmed) {
                await databaseManager.deleteProduto(produtoId);
                Utils.showMessage('Produto excluído com sucesso!', 'success');
                
                // Recarregar página
                await this.loadProdutos();
                this.updateTable();
            }
        } catch (error) {
            console.error('Erro ao excluir produto:', error);
            Utils.showMessage('Erro ao excluir produto', 'error');
        }
    }

    viewProduto(produtoId) {
        // Implementar visualização detalhada do produto
        Utils.showMessage('Funcionalidade de visualização será implementada em breve', 'info');
    }

    editProduto(produtoId) {
        this.showProdutoModal(produtoId);
    }

    unload() {
        // Limpar listeners quando sair da página
        this.listeners.forEach(unsubscribe => unsubscribe());
        this.listeners = [];
    }
}

// Inicializar página de produtos
const produtosPage = new ProdutosPage();

// Exportar para uso global
window.ProdutosPage = ProdutosPage;
window.produtosPage = produtosPage;
