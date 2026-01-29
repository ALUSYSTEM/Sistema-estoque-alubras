// Aplicação Principal do Sistema de Qualidade
class App {
    constructor() {
        this.currentPage = null;
        this.pages = {};
        this.init();
    }

    async init() {
        try {
            // Mostrar loading
            Utils.showLoading();
            
            // Aguardar Firebase estar disponível
            await this.waitForFirebase();
            
            // Inicializar autenticação
            await authManager.init();
            
            // Configurar navegação
            this.setupNavigation();
            
            // Configurar sidebar
            this.setupSidebar();
            
            // Esconder loading
            Utils.hideLoading();
            
        } catch (error) {
            console.error('Erro ao inicializar aplicação:', error);
            Utils.showMessage('Erro ao inicializar aplicação', 'error');
        }
    }

    async waitForFirebase() {
        while (!window.firebase || !window.auth || !window.db) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    setupNavigation() {
        // Configurar links da sidebar
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                this.navigateToPage(page);
            });
        });

        // Função global para navegação
        window.navigateToPage = (page, params = {}) => {
            this.navigateToPage(page, params);
        };
    }

    setupSidebar() {
        // Toggle da sidebar
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');

        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('hidden');
                mainContent.classList.toggle('sidebar-hidden');
            });
        }

        // Responsividade
        window.addEventListener('resize', () => {
            if (window.innerWidth < 768) {
                sidebar.classList.add('hidden');
                mainContent.classList.add('sidebar-hidden');
            } else {
                sidebar.classList.remove('hidden');
                mainContent.classList.remove('sidebar-hidden');
            }
        });
    }

    async navigateToPage(pageName, params = {}) {
        try {
            // Limpar página atual
            if (this.currentPage && this.currentPage.unload) {
                this.currentPage.unload();
            }

            // Atualizar links ativos
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });

            const activeLink = document.querySelector(`[data-page="${pageName}"]`);
            if (activeLink) {
                activeLink.classList.add('active');
            }

            // Carregar nova página
            await this.loadPage(pageName, params);

        } catch (error) {
            console.error(`Erro ao navegar para página ${pageName}:`, error);
            Utils.showMessage(`Erro ao carregar página ${pageName}`, 'error');
        }
    }

    async loadPage(pageName, params = {}) {
        try {
            this.currentPage = this.getPageInstance(pageName);
            
            if (this.currentPage && this.currentPage.load) {
                await this.currentPage.load(params);
            } else {
                console.error(`Página ${pageName} não encontrada`);
                this.showPageNotFound();
            }

        } catch (error) {
            console.error(`Erro ao carregar página ${pageName}:`, error);
            this.showPageError(pageName, error);
        }
    }

    getPageInstance(pageName) {
        if (!this.pages[pageName]) {
            switch (pageName) {
                case 'dashboard':
                    this.pages[pageName] = dashboardPage;
                    break;
                case 'inspecoes':
                    this.pages[pageName] = inspecoesPage;
                    break;
                case 'retrabalho':
                    this.pages[pageName] = retrabalhoPage;
                    break;
                case 'defeitos':
                    this.pages[pageName] = defeitosPage;
                    break;
                case 'inspetores':
                    this.pages[pageName] = inspetoresPage;
                    break;
                case 'fornecedores':
                    this.pages[pageName] = fornecedoresPage;
                    break;
                case 'relatorios':
                    this.pages[pageName] = relatoriosPage;
                    break;
                case 'configuracoes':
                    this.pages[pageName] = configuracoesPage;
                    break;
                default:
                    return null;
            }
        }
        return this.pages[pageName];
    }

    showPageNotFound() {
        document.getElementById('pageContent').innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                <h3>Página não encontrada</h3>
                <p class="text-muted">A página solicitada não existe ou não está disponível.</p>
                <button class="btn btn-primary" onclick="navigateToPage('dashboard')">
                    <i class="fas fa-home me-2"></i>Voltar ao Dashboard
                </button>
            </div>
        `;
        document.getElementById('pageTitle').textContent = 'Página não encontrada';
    }

    showPageError(pageName, error) {
        document.getElementById('pageContent').innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-exclamation-circle fa-3x text-danger mb-3"></i>
                <h3>Erro ao carregar página</h3>
                <p class="text-muted">Ocorreu um erro ao carregar a página "${pageName}".</p>
                <p class="text-muted small">${error.message}</p>
                <button class="btn btn-primary" onclick="navigateToPage('dashboard')">
                    <i class="fas fa-home me-2"></i>Voltar ao Dashboard
                </button>
            </div>
        `;
        document.getElementById('pageTitle').textContent = 'Erro';
    }

    // Método para mostrar modal
    showModal(title, content, actions = []) {
        Utils.showModal(title, content, actions);
    }

    // Método para mostrar mensagem
    showMessage(message, type = 'info') {
        Utils.showMessage(message, type);
    }
}

// Inicializar aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});

// Exportar para uso global
window.App = App;
