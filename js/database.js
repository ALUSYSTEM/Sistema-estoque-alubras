// Gerenciamento de Banco de Dados Firebase para Sistema de Qualidade
class DatabaseManager {
    constructor() {
        this.cache = {};
        this.cacheTimeout = 30000; // 30 segundos
    }

    // ===== INSPEÇÕES =====
    
    // Adicionar nova inspeção
    async addInspecao(inspecaoData) {
        try {
            const docRef = await addDoc(collection(window.db, 'inspecoes'), {
                ...inspecaoData,
                data_criacao: new Date(),
                inspetor_id: window.authManager.currentUser.uid,
                inspetor_nome: window.authManager.userData.nome,
                status: 'PENDENTE'
            });
            
            this.invalidateCache('inspecoes');
            return docRef.id;
        } catch (error) {
            console.error('Erro ao adicionar inspeção:', error);
            throw error;
        }
    }

    // Obter inspeções
    async getInspecoes(filters = {}) {
        try {
            const cacheKey = `inspecoes_${JSON.stringify(filters)}`;
            const cached = this.getFromCache(cacheKey);
            if (cached) return cached;

            let q = query(collection(window.db, 'inspecoes'), orderBy('data_criacao', 'desc'));
            
            // Aplicar filtros
            if (filters.data_inicial) {
                q = query(q, where('data', '>=', filters.data_inicial));
            }
            if (filters.data_final) {
                q = query(q, where('data', '<=', filters.data_final));
            }
            if (filters.inspetor_id) {
                q = query(q, where('inspetor_id', '==', filters.inspetor_id));
            }
            if (filters.status) {
                q = query(q, where('status', '==', filters.status));
            }
            if (filters.parecer) {
                q = query(q, where('parecer', '==', filters.parecer));
            }

            const snapshot = await getDocs(q);
            const inspecoes = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            this.setCache(cacheKey, inspecoes);
            return inspecoes;
        } catch (error) {
            console.error('Erro ao obter inspeções:', error);
            throw error;
        }
    }

    // Atualizar inspeção
    async updateInspecao(inspecaoId, inspecaoData) {
        try {
            const docRef = doc(window.db, 'inspecoes', inspecaoId);
            await updateDoc(docRef, {
                ...inspecaoData,
                data_atualizacao: new Date(),
                usuario_atualizacao: window.authManager.currentUser.uid
            });
            
            this.invalidateCache('inspecoes');
        } catch (error) {
            console.error('Erro ao atualizar inspeção:', error);
            throw error;
        }
    }

    // Excluir inspeção
    async deleteInspecao(inspecaoId) {
        try {
            await deleteDoc(doc(window.db, 'inspecoes', inspecaoId));
            this.invalidateCache('inspecoes');
        } catch (error) {
            console.error('Erro ao excluir inspeção:', error);
            throw error;
        }
    }

    // ===== RETRABALHO =====
    
    // Adicionar retrabalho
    async addRetrabalho(retrabalhoData) {
        try {
            const docRef = await addDoc(collection(window.db, 'retrabalho'), {
                ...retrabalhoData,
                data_criacao: new Date(),
                responsavel_id: window.authManager.currentUser.uid,
                responsavel_nome: window.authManager.userData.nome,
                status: 'PENDENTE'
            });
            
            this.invalidateCache('retrabalho');
            return docRef.id;
        } catch (error) {
            console.error('Erro ao adicionar retrabalho:', error);
            throw error;
        }
    }

    // Obter retrabalhos
    async getRetrabalhos(filters = {}) {
        try {
            const cacheKey = `retrabalho_${JSON.stringify(filters)}`;
            const cached = this.getFromCache(cacheKey);
            if (cached) return cached;

            let q = query(collection(window.db, 'retrabalho'), orderBy('data_criacao', 'desc'));
            
            if (filters.status) {
                q = query(q, where('status', '==', filters.status));
            }
            if (filters.responsavel_id) {
                q = query(q, where('responsavel_id', '==', filters.responsavel_id));
            }

            const snapshot = await getDocs(q);
            const retrabalhos = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            this.setCache(cacheKey, retrabalhos);
            return retrabalhos;
        } catch (error) {
            console.error('Erro ao obter retrabalhos:', error);
            throw error;
        }
    }

    // Atualizar retrabalho
    async updateRetrabalho(retrabalhoId, retrabalhoData) {
        try {
            const docRef = doc(window.db, 'retrabalho', retrabalhoId);
            await updateDoc(docRef, {
                ...retrabalhoData,
                data_atualizacao: new Date(),
                usuario_atualizacao: window.authManager.currentUser.uid
            });
            
            this.invalidateCache('retrabalho');
        } catch (error) {
            console.error('Erro ao atualizar retrabalho:', error);
            throw error;
        }
    }

    // Excluir retrabalho
    async deleteRetrabalho(retrabalhoId) {
        try {
            await deleteDoc(doc(window.db, 'retrabalho', retrabalhoId));
            this.invalidateCache('retrabalho');
        } catch (error) {
            console.error('Erro ao excluir retrabalho:', error);
            throw error;
        }
    }

    // ===== DEFEITOS =====
    
    // Adicionar defeito
    async addDefeito(defeitoData) {
        try {
            const docRef = await addDoc(collection(window.db, 'defeitos'), {
                ...defeitoData,
                data_criacao: new Date(),
                ativo: true
            });
            
            this.invalidateCache('defeitos');
            return docRef.id;
        } catch (error) {
            console.error('Erro ao adicionar defeito:', error);
            throw error;
        }
    }

    // Obter defeitos
    async getDefeitos(filters = {}) {
        try {
            const cacheKey = `defeitos_${JSON.stringify(filters)}`;
            const cached = this.getFromCache(cacheKey);
            if (cached) return cached;

            let q = query(collection(window.db, 'defeitos'), where('ativo', '==', true));
            
            if (filters.categoria) {
                q = query(q, where('categoria', '==', filters.categoria));
            }

            const snapshot = await getDocs(q);
            const defeitos = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            this.setCache(cacheKey, defeitos);
            return defeitos;
        } catch (error) {
            console.error('Erro ao obter defeitos:', error);
            throw error;
        }
    }

    // ===== INSPETORES =====
    
    // Adicionar inspetor
    async addInspetor(inspetorData) {
        try {
            const docRef = await addDoc(collection(window.db, 'inspetores'), {
                ...inspetorData,
                data_criacao: new Date(),
                ativo: true
            });
            
            this.invalidateCache('inspetores');
            return docRef.id;
        } catch (error) {
            console.error('Erro ao adicionar inspetor:', error);
            throw error;
        }
    }

    // Obter inspetores
    async getInspetores(filters = {}) {
        try {
            const cacheKey = `inspetores_${JSON.stringify(filters)}`;
            const cached = this.getFromCache(cacheKey);
            if (cached) return cached;

            let q = query(collection(window.db, 'inspetores'));
            
            if (filters.role) {
                q = query(q, where('role', '==', filters.role));
            }
            if (filters.nome) {
                q = query(q, where('nome', '>=', filters.nome), where('nome', '<=', filters.nome + '\uf8ff'));
            }

            const snapshot = await getDocs(q);
            const inspetores = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            this.setCache(cacheKey, inspetores);
            return inspetores;
        } catch (error) {
            console.error('Erro ao obter inspetores:', error);
            throw error;
        }
    }

    // Atualizar inspetor
    async updateInspetor(inspetorId, inspetorData) {
        try {
            const docRef = doc(window.db, 'inspetores', inspetorId);
            await updateDoc(docRef, {
                ...inspetorData,
                data_atualizacao: new Date()
            });
            
            this.invalidateCache('inspetores');
        } catch (error) {
            console.error('Erro ao atualizar inspetor:', error);
            throw error;
        }
    }

    // Excluir inspetor
    async deleteInspetor(inspetorId) {
        try {
            await deleteDoc(doc(window.db, 'inspetores', inspetorId));
            this.invalidateCache('inspetores');
        } catch (error) {
            console.error('Erro ao excluir inspetor:', error);
            throw error;
        }
    }

    // ===== FORNECEDORES =====
    
    // Adicionar fornecedor
    async addFornecedor(fornecedorData) {
        try {
            const docRef = await addDoc(collection(window.db, 'fornecedores'), {
                ...fornecedorData,
                data_criacao: new Date(),
                avaliacao: 0
            });
            
            this.invalidateCache('fornecedores');
            return docRef.id;
        } catch (error) {
            console.error('Erro ao adicionar fornecedor:', error);
            throw error;
        }
    }

    // Obter fornecedores
    async getFornecedores(filters = {}) {
        try {
            const cacheKey = `fornecedores_${JSON.stringify(filters)}`;
            const cached = this.getFromCache(cacheKey);
            if (cached) return cached;

            let q = query(collection(window.db, 'fornecedores'));
            
            if (filters.status) {
                q = query(q, where('status', '==', filters.status));
            }
            if (filters.nome) {
                q = query(q, where('nome', '>=', filters.nome), where('nome', '<=', filters.nome + '\uf8ff'));
            }
            if (filters.cnpj) {
                q = query(q, where('cnpj', '>=', filters.cnpj), where('cnpj', '<=', filters.cnpj + '\uf8ff'));
            }

            const snapshot = await getDocs(q);
            const fornecedores = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            this.setCache(cacheKey, fornecedores);
            return fornecedores;
        } catch (error) {
            console.error('Erro ao obter fornecedores:', error);
            throw error;
        }
    }

    // Atualizar fornecedor
    async updateFornecedor(fornecedorId, fornecedorData) {
        try {
            const docRef = doc(window.db, 'fornecedores', fornecedorId);
            await updateDoc(docRef, {
                ...fornecedorData,
                data_atualizacao: new Date()
            });
            
            this.invalidateCache('fornecedores');
        } catch (error) {
            console.error('Erro ao atualizar fornecedor:', error);
            throw error;
        }
    }

    // Excluir fornecedor
    async deleteFornecedor(fornecedorId) {
        try {
            await deleteDoc(doc(window.db, 'fornecedores', fornecedorId));
            this.invalidateCache('fornecedores');
        } catch (error) {
            console.error('Erro ao excluir fornecedor:', error);
            throw error;
        }
    }

    // Atualizar defeito
    async updateDefeito(defeitoId, defeitoData) {
        try {
            const docRef = doc(window.db, 'defeitos', defeitoId);
            await updateDoc(docRef, {
                ...defeitoData,
                data_atualizacao: new Date()
            });
            
            this.invalidateCache('defeitos');
        } catch (error) {
            console.error('Erro ao atualizar defeito:', error);
            throw error;
        }
    }

    // Excluir defeito
    async deleteDefeito(defeitoId) {
        try {
            const docRef = doc(window.db, 'defeitos', defeitoId);
            await updateDoc(docRef, { ativo: false });
            this.invalidateCache('defeitos');
        } catch (error) {
            console.error('Erro ao excluir defeito:', error);
            throw error;
        }
    }

    // ===== ESTATÍSTICAS =====
    
    // Obter estatísticas do dashboard
    async getDashboardStats() {
        try {
            const cacheKey = 'dashboard_stats';
            const cached = this.getFromCache(cacheKey);
            if (cached) return cached;

            const [inspecoes, retrabalhos] = await Promise.all([
                this.getInspecoes(),
                this.getRetrabalhos()
            ]);

            const stats = Utils.calculateQualityStats(inspecoes);
            
            // Estatísticas de retrabalho
            const retrabalhosPendentes = retrabalhos.filter(r => r.status === 'PENDENTE').length;
            const retrabalhosConcluidos = retrabalhos.filter(r => r.status === 'CONCLUIDO').length;
            const retrabalhosEmAndamento = retrabalhos.filter(r => r.status === 'EM_ANDAMENTO').length;

            const dashboardStats = {
                ...stats,
                retrabalhos_pendentes: retrabalhosPendentes,
                retrabalhos_concluidos: retrabalhosConcluidos,
                retrabalhos_em_andamento: retrabalhosEmAndamento,
                total_retrabalhos: retrabalhos.length
            };

            this.setCache(cacheKey, dashboardStats);
            return dashboardStats;
        } catch (error) {
            console.error('Erro ao obter estatísticas:', error);
            throw error;
        }
    }

    // ===== CACHE =====
    
    getFromCache(key) {
        const cached = this.cache[key];
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        return null;
    }

    setCache(key, data) {
        this.cache[key] = {
            data,
            timestamp: Date.now()
        };
    }

    invalidateCache(pattern) {
        Object.keys(this.cache).forEach(key => {
            if (key.includes(pattern)) {
                delete this.cache[key];
            }
        });
    }

    // ===== LISTENERS EM TEMPO REAL =====
    
    // Listener para inspeções
    setupInspecoesListener(callback) {
        const q = query(collection(window.db, 'inspecoes'), orderBy('data_criacao', 'desc'));
        return onSnapshot(q, (snapshot) => {
            const inspecoes = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(inspecoes);
        });
    }

    // Listener para retrabalhos
    setupRetrabalhosListener(callback) {
        const q = query(collection(window.db, 'retrabalho'), orderBy('data_criacao', 'desc'));
        return onSnapshot(q, (snapshot) => {
            const retrabalhos = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(retrabalhos);
        });
    }

    // Listener para estatísticas
    setupStatsListener(callback) {
        const debouncedCallback = Utils.debounce(async () => {
            try {
                const stats = await this.getDashboardStats();
                callback(stats);
            } catch (error) {
                console.error('Erro ao atualizar estatísticas:', error);
            }
        }, 1000);

        // Listener para inspeções
        const inspecoesUnsubscribe = this.setupInspecoesListener(debouncedCallback);
        
        // Listener para retrabalhos
        const retrabalhosUnsubscribe = this.setupRetrabalhosListener(debouncedCallback);

        // Retornar função para cancelar listeners
        return () => {
            inspecoesUnsubscribe();
            retrabalhosUnsubscribe();
        };
    }

    // Listener para inspetores
    setupInspetoresListener(callback) {
        const q = query(collection(window.db, 'inspetores'));
        return onSnapshot(q, (snapshot) => {
            const inspetores = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(inspetores);
        });
    }

    // Listener para fornecedores
    setupFornecedoresListener(callback) {
        const q = query(collection(window.db, 'fornecedores'));
        return onSnapshot(q, (snapshot) => {
            const fornecedores = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(fornecedores);
        });
    }

    // Listener para defeitos
    setupDefeitosListener(callback) {
        const q = query(collection(window.db, 'defeitos'), where('ativo', '==', true));
        return onSnapshot(q, (snapshot) => {
            const defeitos = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(defeitos);
        });
    }
}

// Instanciar e tornar disponível globalmente
const databaseManager = new DatabaseManager();
window.databaseManager = databaseManager;
