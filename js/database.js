// Gerenciador do banco de dados Firestore
class DatabaseManager {
    constructor() {
        this.db = db;
        this.setupOfflineSupport();
    }

    setupOfflineSupport() {
        // Habilitar persistência offline
        db.enablePersistence().catch((err) => {
            if (err.code == 'failed-precondition') {
                console.warn('Múltiplas abas abertas, persistência pode não funcionar');
            } else if (err.code == 'unimplemented') {
                console.warn('Navegador não suporta persistência offline');
            }
        });
    }

    // ========== PRODUTOS ==========

    async getProdutos(filters = {}) {
        try {
            let query = this.db.collection('produtos');
            
            // Aplicar apenas um filtro por vez para evitar necessidade de índices compostos
            if (filters.ativo !== undefined) {
                query = query.where('ativo', '==', filters.ativo);
            } else if (filters.perecivel !== undefined) {
                query = query.where('perecivel', '==', filters.perecivel);
            }

            // Buscar sem orderBy para evitar problemas de índice
            const snapshot = await query.get();
            
            const produtos = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Aplicar filtros adicionais no lado cliente se necessário
            let filteredProdutos = produtos;
            if (filters.ativo !== undefined && filters.perecivel !== undefined) {
                filteredProdutos = produtos.filter(p => 
                    p.ativo === filters.ativo && p.perecivel === filters.perecivel
                );
            }

            // Ordenar por código no lado cliente
            return filteredProdutos.sort((a, b) => {
                if (a.codigo && b.codigo) {
                    return a.codigo.localeCompare(b.codigo);
                }
                return 0;
            });
        } catch (error) {
            console.error('Erro ao buscar produtos:', error);
            throw error;
        }
    }

    async getProduto(id) {
        try {
            const doc = await this.db.collection('produtos').doc(id).get();
            
            if (doc.exists) {
                return {
                    id: doc.id,
                    ...doc.data()
                };
            }
            
            return null;
        } catch (error) {
            console.error('Erro ao buscar produto:', error);
            throw error;
        }
    }

    async addProduto(produto) {
        try {
            const docRef = await this.db.collection('produtos').add({
                ...produto,
                ativo: true,
                data_criacao: firebase.firestore.FieldValue.serverTimestamp(),
                data_atualizacao: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            return docRef.id;
        } catch (error) {
            console.error('Erro ao adicionar produto:', error);
            throw error;
        }
    }

    async updateProduto(id, produto) {
        try {
            await this.db.collection('produtos').doc(id).update({
                ...produto,
                data_atualizacao: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Erro ao atualizar produto:', error);
            throw error;
        }
    }

    async deleteProduto(id) {
        try {
            await this.db.collection('produtos').doc(id).update({
                ativo: false,
                data_atualizacao: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Erro ao deletar produto:', error);
            throw error;
        }
    }

    // ========== ESTOQUE ==========

    async getEstoque(filters = {}) {
        try {
            let query = this.db.collection('estoque');
            
            // Aplicar apenas um filtro por vez para evitar índices compostos
            if (filters.produto_id) {
                query = query.where('produto_id', '==', filters.produto_id);
            } else if (filters.localizacao_id) {
                query = query.where('localizacao_id', '==', filters.localizacao_id);
            } else if (filters.projeto_id) {
                query = query.where('projeto_id', '==', filters.projeto_id);
            } else if (filters.com_saldo) {
                query = query.where('saldo', '>', 0);
            }

            const snapshot = await query.get();
            let estoques = [];
            
            // Converter docs para array primeiro
            for (const doc of snapshot.docs) {
                const estoqueData = { id: doc.id, ...doc.data() };
                estoques.push(estoqueData);
            }
            
            // Aplicar filtros adicionais no lado cliente se necessário
            if (filters.produto_id && filters.localizacao_id) {
                estoques = estoques.filter(e => 
                    e.produto_id === filters.produto_id && e.localizacao_id === filters.localizacao_id
                );
            }
            if (filters.projeto_id && !filters.produto_id && !filters.localizacao_id) {
                estoques = estoques.filter(e => e.projeto_id === filters.projeto_id);
            }
            if (filters.com_saldo && !filters.produto_id && !filters.localizacao_id && !filters.projeto_id) {
                estoques = estoques.filter(e => e.saldo > 0);
            }
            
            // Buscar dados relacionados
            for (const estoqueData of estoques) {
                if (estoqueData.produto_id) {
                    const produto = await this.getProduto(estoqueData.produto_id);
                    estoqueData.produto = produto;
                }
                
                if (estoqueData.localizacao_id) {
                    const localizacao = await this.getLocalizacao(estoqueData.localizacao_id);
                    estoqueData.localizacao = localizacao;
                }
                
                if (estoqueData.projeto_id) {
                    const projeto = await this.getProjeto(estoqueData.projeto_id);
                    estoqueData.projeto = projeto;
                }
            }
            
            return estoques;
        } catch (error) {
            console.error('Erro ao buscar estoque:', error);
            throw error;
        }
    }

    async updateEstoque(produtoId, localizacaoId, projetoId, lote, variante, tamanho, quantidade, dataVencimento = null) {
        try {
            console.log('Atualizando estoque:', { produtoId, localizacaoId, projetoId, lote, variante, tamanho, quantidade });
            
            // Buscar estoque existente usando apenas produto_id para evitar índices compostos
            const query = this.db.collection('estoque')
                .where('produto_id', '==', produtoId);

            const snapshot = await query.get();
            console.log('Encontrados registros de estoque:', snapshot.size);
            
            // Filtrar no lado do cliente os registros que correspondem exatamente
            let matchingDoc = null;
            for (const doc of snapshot.docs) {
                const data = doc.data();
                
                // Verificar se corresponde à localização
                if (data.localizacao_id !== localizacaoId) {
                    continue;
                }
                
                const matchesProjeto = (projetoId === null || projetoId === undefined) ? 
                    (!data.projeto_id) : (data.projeto_id === projetoId);
                const matchesLote = (!lote || lote.trim() === '') ? 
                    (!data.lote) : (data.lote === lote);
                const matchesVariante = (!variante || variante.trim() === '') ? 
                    (!data.variante) : (data.variante === variante);
                const matchesTamanho = (!tamanho || tamanho.trim() === '') ? 
                    (!data.tamanho) : (data.tamanho === tamanho);
                    
                if (matchesProjeto && matchesLote && matchesVariante && matchesTamanho) {
                    matchingDoc = doc;
                    break;
                }
            }
            
            if (!matchingDoc) {
                // Criar novo registro de estoque
                console.log('Criando novo registro de estoque');
                await this.db.collection('estoque').add({
                    produto_id: produtoId,
                    localizacao_id: localizacaoId,
                    projeto_id: projetoId || null,
                    lote: lote || null,
                    variante: variante || null,
                    tamanho: tamanho || null,
                    saldo: Math.max(0, quantidade), // Garantir que saldo não seja negativo
                    data_vencimento: dataVencimento,
                    data_atualizacao: firebase.firestore.FieldValue.serverTimestamp()
                });
            } else {
                // Atualizar estoque existente
                const currentData = matchingDoc.data();
                const currentSaldo = currentData.saldo || 0;
                const newSaldo = currentSaldo + quantidade;
                
                console.log(`Atualizando estoque existente: ${currentSaldo} + ${quantidade} = ${newSaldo}`);
                
                await matchingDoc.ref.update({
                    saldo: Math.max(0, newSaldo), // Garantir que saldo não seja negativo
                    data_vencimento: dataVencimento || currentData.data_vencimento,
                    data_atualizacao: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            
            console.log('Estoque atualizado com sucesso');
        } catch (error) {
            console.error('Erro ao atualizar estoque:', error);
            throw error;
        }
    }

    // ========== MOVIMENTAÇÕES ==========

    async getMovimentacoes(filters = {}) {
        try {
            console.log('Buscando movimentações com filtros:', filters);
            let query = this.db.collection('movimentacoes');
            
            // Aplicar apenas um filtro por vez para evitar necessidade de índices compostos
            if (filters.produto_id) {
                query = query.where('produto_id', '==', filters.produto_id);
            } else if (filters.entrada_saida) {
                query = query.where('entrada_saida', '==', filters.entrada_saida);
            } else if (filters.data_inicio) {
                // Usar apenas um filtro de data para evitar índice composto
                query = query.where('data', '>=', filters.data_inicio);
            }

            // Buscar sem orderBy para evitar problemas de índice
            const snapshot = await query.get();
            console.log('Snapshot retornou', snapshot.docs.length, 'documentos');
            
            const movimentacoes = [];
            const produtoIds = new Set();
            const localizacaoIds = new Set();
            const projetoIds = new Set();
            
            // Primeiro, coletar todos os IDs únicos que precisamos buscar
            for (const doc of snapshot.docs) {
                const movData = { id: doc.id, ...doc.data() };
                
                // Aplicar filtros adicionais no lado do cliente se necessário
                let includeMov = true;
                
                if (filters.produto_id && movData.produto_id !== filters.produto_id) {
                    includeMov = false;
                }
                if (filters.entrada_saida && movData.entrada_saida !== filters.entrada_saida) {
                    includeMov = false;
                }
                if (filters.data_inicio && filters.data_fim) {
                    const movDate = movData.data?.toDate ? movData.data.toDate() : new Date(movData.data);
                    if (movDate < filters.data_inicio || movDate > filters.data_fim) {
                        includeMov = false;
                    }
                }
                
                if (includeMov) {
                    movimentacoes.push(movData);
                    
                    if (movData.produto_id) produtoIds.add(movData.produto_id);
                    if (movData.localizacao_id) localizacaoIds.add(movData.localizacao_id);
                    if (movData.projeto_id) projetoIds.add(movData.projeto_id);
                }
            }
            
            // Buscar todos os dados relacionados de uma vez para melhor performance
            const [produtos, localizacoes, projetos] = await Promise.all([
                this.getProdutos({ ativo: true }),
                this.getLocalizacoes({ ativo: true }),
                this.getProjetos({ ativo: true })
            ]);
            
            // Criar mapas para busca rápida
            const produtoMap = new Map();
            produtos.forEach(p => produtoMap.set(p.id, p));
            
            const localizacaoMap = new Map();
            localizacoes.forEach(l => localizacaoMap.set(l.id, l));
            
            const projetoMap = new Map();
            projetos.forEach(p => projetoMap.set(p.id, p));
            
            // Agora associar os dados relacionados
            for (const movData of movimentacoes) {
                if (movData.produto_id) {
                    movData.produto = produtoMap.get(movData.produto_id);
                }
                if (movData.localizacao_id) {
                    movData.localizacao = localizacaoMap.get(movData.localizacao_id);
                }
                if (movData.projeto_id) {
                    movData.projeto = projetoMap.get(movData.projeto_id);
                }
            }
            
            // Ordenar no lado do cliente por data descrescente
            movimentacoes.sort((a, b) => {
                const dateA = a.data?.toDate ? a.data.toDate() : new Date(a.data);
                const dateB = b.data?.toDate ? b.data.toDate() : new Date(b.data);
                return dateB - dateA;
            });
            
            console.log('Movimentações processadas:', movimentacoes.length);
            return movimentacoes;
        } catch (error) {
            console.error('Erro ao buscar movimentações:', error);
            throw error;
        }
    }

    async addMovimentacao(movimentacao) {
        try {
            console.log('Adicionando movimentação:', movimentacao);
            
            // Salvar movimentação
            const docRef = await this.db.collection('movimentacoes').add({
                ...movimentacao,
                data_criacao: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('Movimentação salva com ID:', docRef.id);
            
            // Atualizar estoque automaticamente
            const quantidade = movimentacao.entrada_saida === 'ENTRADA' ? 
                movimentacao.quantidade : -movimentacao.quantidade;
            
            console.log('Quantidade para estoque:', quantidade, '(tipo:', movimentacao.entrada_saida, ')');
            
            await this.updateEstoque(
                movimentacao.produto_id,
                movimentacao.localizacao_id,
                movimentacao.projeto_id || null,
                movimentacao.lote || null,
                movimentacao.variante || null,
                movimentacao.tamanho || null,
                quantidade,
                movimentacao.data_vencimento || null
            );
            
            console.log('Estoque atualizado para movimentação:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('Erro ao adicionar movimentação:', error);
            throw error;
        }
    }

    async clearAllMovimentacoes() {
        try {
            console.log('Iniciando limpeza de todas as movimentações...');
            
            // Buscar todas as movimentações
            const snapshot = await this.db.collection('movimentacoes').get();
            
            if (snapshot.empty) {
                console.log('Nenhuma movimentação encontrada para deletar');
                return { count: 0 };
            }

            // Deletar em lotes para evitar timeout
            const batchSize = 500;
            const batches = [];
            let batch = this.db.batch();
            let count = 0;

            snapshot.docs.forEach((doc, index) => {
                batch.delete(doc.ref);
                count++;
                
                if (count % batchSize === 0) {
                    batches.push(batch);
                    batch = this.db.batch();
                }
            });

            // Adicionar último batch se não estiver vazio
            if (count % batchSize !== 0) {
                batches.push(batch);
            }

            // Executar todos os batches
            for (const batchToCommit of batches) {
                await batchToCommit.commit();
            }

            console.log(`${count} movimentações deletadas com sucesso`);
            return { count };
            
        } catch (error) {
            console.error('Erro ao limpar movimentações:', error);
            throw error;
        }
    }

    // ========== LOCALIZAÇÕES ==========

    async getLocalizacoes(filters = {}) {
        try {
            let query = this.db.collection('localizacoes');
            
            if (filters.ativo !== undefined) {
                query = query.where('ativo', '==', filters.ativo);
            }

            // Buscar sem orderBy para evitar problemas de índice
            const snapshot = await query.get();
            
            const localizacoes = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Ordenar por código no lado cliente
            return localizacoes.sort((a, b) => {
                if (a.codigo && b.codigo) {
                    return a.codigo.localeCompare(b.codigo);
                }
                return 0;
            });
        } catch (error) {
            console.error('Erro ao buscar localizações:', error);
            throw error;
        }
    }

    async getLocalizacao(id) {
        try {
            const doc = await this.db.collection('localizacoes').doc(id).get();
            
            if (doc.exists) {
                return {
                    id: doc.id,
                    ...doc.data()
                };
            }
            
            return null;
        } catch (error) {
            console.error('Erro ao buscar localização:', error);
            throw error;
        }
    }

    async addLocalizacao(localizacao) {
        try {
            const docRef = await this.db.collection('localizacoes').add({
                ...localizacao,
                ativo: true,
                data_criacao: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            return docRef.id;
        } catch (error) {
            console.error('Erro ao adicionar localização:', error);
            throw error;
        }
    }

    async updateLocalizacao(id, localizacao) {
        try {
            await this.db.collection('localizacoes').doc(id).update({
                ...localizacao,
                data_atualizacao: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Erro ao atualizar localização:', error);
            throw error;
        }
    }

    // ========== PROJETOS ==========

    async getProjetos(filters = {}) {
        try {
            let query = this.db.collection('projetos');
            
            if (filters.ativo !== undefined) {
                query = query.where('ativo', '==', filters.ativo);
            }

            // Buscar sem orderBy para evitar problemas de índice
            const snapshot = await query.get();
            
            const projetos = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Ordenar por código no lado cliente
            return projetos.sort((a, b) => {
                if (a.codigo && b.codigo) {
                    return a.codigo.localeCompare(b.codigo);
                }
                return 0;
            });
        } catch (error) {
            console.error('Erro ao buscar projetos:', error);
            throw error;
        }
    }

    async getProjeto(id) {
        try {
            const doc = await this.db.collection('projetos').doc(id).get();
            
            if (doc.exists) {
                return {
                    id: doc.id,
                    ...doc.data()
                };
            }
            
            return null;
        } catch (error) {
            console.error('Erro ao buscar projeto:', error);
            throw error;
        }
    }

    async addProjeto(projeto) {
        try {
            const docRef = await this.db.collection('projetos').add({
                ...projeto,
                ativo: true,
                data_criacao: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            return docRef.id;
        } catch (error) {
            console.error('Erro ao adicionar projeto:', error);
            throw error;
        }
    }

    async updateProjeto(id, projeto) {
        try {
            await this.db.collection('projetos').doc(id).update({
                ...projeto,
                data_atualizacao: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Erro ao atualizar projeto:', error);
            throw error;
        }
    }

    // ========== BENEFICIAMENTO ==========

    async getBeneficiamentos(filters = {}) {
        try {
            let query = this.db.collection('beneficiamento');
            
            if (filters.status) {
                query = query.where('status', '==', filters.status);
            }

            const snapshot = await query.get();
            const beneficiamentos = [];
            
            for (const doc of snapshot.docs) {
                const benData = { id: doc.id, ...doc.data() };
                
                // Buscar dados do produto
                if (benData.produto_id) {
                    benData.produto = await this.getProduto(benData.produto_id);
                }
                
                beneficiamentos.push(benData);
            }
            
            // Ordenar no lado do cliente por data de criação descrescente
            beneficiamentos.sort((a, b) => {
                const dateA = a.data_criacao?.toDate ? a.data_criacao.toDate() : new Date(a.data_criacao);
                const dateB = b.data_criacao?.toDate ? b.data_criacao.toDate() : new Date(b.data_criacao);
                return dateB - dateA;
            });
            
            return beneficiamentos;
        } catch (error) {
            console.error('Erro ao buscar beneficiamentos:', error);
            throw error;
        }
    }

    async addBeneficiamento(beneficiamento) {
        try {
            const docRef = await this.db.collection('beneficiamento').add({
                ...beneficiamento,
                status: 'PENDENTE',
                data_criacao: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            return docRef.id;
        } catch (error) {
            console.error('Erro ao adicionar beneficiamento:', error);
            throw error;
        }
    }

    async updateBeneficiamento(id, updates) {
        try {
            await this.db.collection('beneficiamento').doc(id).update({
                ...updates,
                data_atualizacao: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Erro ao atualizar beneficiamento:', error);
            throw error;
        }
    }

    async clearAllBeneficiamentos() {
        try {
            console.log('Iniciando limpeza de todos os beneficiamentos...');
            
            // Buscar todos os beneficiamentos
            const snapshot = await this.db.collection('beneficiamento').get();
            
            if (snapshot.empty) {
                console.log('Nenhum beneficiamento encontrado para deletar');
                return { count: 0 };
            }

            // Deletar em lotes para evitar timeout
            const batchSize = 500;
            const batches = [];
            let batch = this.db.batch();
            let count = 0;

            snapshot.docs.forEach((doc, index) => {
                batch.delete(doc.ref);
                count++;
                
                if (count % batchSize === 0) {
                    batches.push(batch);
                    batch = this.db.batch();
                }
            });

            // Adicionar último batch se não estiver vazio
            if (count % batchSize !== 0) {
                batches.push(batch);
            }

            // Executar todos os batches
            for (const batchToCommit of batches) {
                await batchToCommit.commit();
            }

            console.log(`${count} beneficiamentos deletados com sucesso`);
            return { count };
            
        } catch (error) {
            console.error('Erro ao limpar beneficiamentos:', error);
            throw error;
        }
    }

    // ========== USUÁRIOS ==========

    async getUsuarios() {
        try {
            const snapshot = await this.db.collection('usuarios').orderBy('nome').get();
            
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
            throw error;
        }
    }

    async updateUsuario(id, userData) {
        try {
            await this.db.collection('usuarios').doc(id).update({
                ...userData,
                data_atualizacao: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Erro ao atualizar usuário:', error);
            throw error;
        }
    }

    // ========== ESTATÍSTICAS ==========

    async getDashboardStats() {
        try {
            const [
                produtosSnapshot,
                movimentacoesSnapshot,
                localizacoesSnapshot,
                projetosSnapshot,
                estoqueSnapshot,
                beneficiamentoSnapshot
            ] = await Promise.all([
                this.db.collection('produtos').where('ativo', '==', true).get(),
                this.db.collection('movimentacoes').get(),
                this.db.collection('localizacoes').where('ativo', '==', true).get(),
                this.db.collection('projetos').where('ativo', '==', true).get(),
                this.db.collection('estoque').get(),
                this.db.collection('beneficiamento').where('status', '!=', 'RETORNADO').get()
            ]);

            // Calcular totais
            const totalProdutos = produtosSnapshot.size;
            const totalMovimentacoes = movimentacoesSnapshot.size;
            const totalLocalizacoes = localizacoesSnapshot.size;
            const totalProjetos = projetosSnapshot.size;
            const totalBeneficiamento = beneficiamentoSnapshot.size;

            // Calcular total do estoque
            let totalEstoque = 0;
            let produtosEstoqueBaixo = 0;
            let produtosVencidos = 0;
            let produtosVencendo7Dias = 0;

            const hoje = new Date();
            const data7Dias = new Date();
            data7Dias.setDate(hoje.getDate() + 7);

            for (const doc of estoqueSnapshot.docs) {
                const estoque = doc.data();
                totalEstoque += estoque.saldo || 0;

                // Verificar estoque baixo e produtos vencidos
                if (estoque.produto_id) {
                    const produto = await this.getProduto(estoque.produto_id);
                    if (produto && produto.estoque_minimo && estoque.saldo <= produto.estoque_minimo && estoque.saldo > 0) {
                        produtosEstoqueBaixo++;
                    }

                    if (produto && produto.perecivel && estoque.data_vencimento) {
                        const dataVencimento = estoque.data_vencimento.toDate ? estoque.data_vencimento.toDate() : new Date(estoque.data_vencimento);
                        
                        if (dataVencimento < hoje && estoque.saldo > 0) {
                            produtosVencidos++;
                        } else if (dataVencimento <= data7Dias && dataVencimento > hoje && estoque.saldo > 0) {
                            produtosVencendo7Dias++;
                        }
                    }
                }
            }

            return {
                totalProdutos,
                totalMovimentacoes,
                totalLocalizacoes,
                totalProjetos,
                totalEstoque,
                totalBeneficiamento,
                produtosEstoqueBaixo,
                produtosVencidos,
                produtosVencendo7Dias
            };
        } catch (error) {
            console.error('Erro ao buscar estatísticas:', error);
            throw error;
        }
    }

    // ========== LISTENERS EM TEMPO REAL ==========

    onProdutosChange(callback) {
        return this.db.collection('produtos')
            .where('ativo', '==', true)
            .onSnapshot(callback);
    }

    onEstoqueChange(callback) {
        return this.db.collection('estoque')
            .onSnapshot(callback);
    }

    onMovimentacoesChange(callback) {
        return this.db.collection('movimentacoes')
            .onSnapshot(callback);
    }

    onBeneficiamentoChange(callback) {
        return this.db.collection('beneficiamento')
            .onSnapshot(callback);
    }
}

// Inicializar gerenciador do banco de dados
const databaseManager = new DatabaseManager();

// Exportar para uso global
window.databaseManager = databaseManager;
