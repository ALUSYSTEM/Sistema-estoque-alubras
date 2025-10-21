// Aplicação principal do sistema
class EstoqueApp {
    constructor() {
        this.currentPage = 'dashboard';
        this.currentParams = {};
        this.pageClasses = {
            'dashboard': DashboardPage,
            'produtos': ProdutosPage,
            'movimentacoes': MovimentacoesPage,
            'estoque': EstoquePage,
            'beneficiamento': BeneficiamentoPage,
            'localizacoes': LocalizacoesPage,
            'projetos': ProjetosPage,
            'usuarios': UsuariosPage
        };
        this.currentPageInstance = null;
    }

    init() {
        this.setupSidebar();
        this.setupNavigation();
        this.loadInitialPage();
    }

    setupSidebar() {
        // Prevent sidebar duplication
        document.addEventListener('DOMContentLoaded', function() {
            const sidebars = document.querySelectorAll('.sidebar');
            if (sidebars.length > 1) {
                for (let i = 1; i < sidebars.length; i++) {
                    sidebars[i].remove();
                }
            }
            
            const sidebarInitial = document.querySelector('.sidebar');
            if (sidebarInitial) {
                sidebarInitial.style.display = 'block';
                sidebarInitial.style.visibility = 'visible';
            }
            
            // Sidebar toggle functionality
            const sidebarToggle = document.getElementById('sidebarToggle');
            const sidebar = document.getElementById('sidebar');
            const mainContent = document.getElementById('mainContent');
            const toggleIcon = document.getElementById('toggleIcon');
            
            let sidebarHidden = false;
            
            if (sidebarToggle && sidebar && mainContent && toggleIcon) {
                sidebarToggle.addEventListener('click', function() {
                    sidebarHidden = !sidebarHidden;
                    
                    if (sidebarHidden) {
                        sidebar.classList.add('hidden');
                        mainContent.classList.add('sidebar-hidden');
                        toggleIcon.className = 'fas fa-bars';
                        sidebarToggle.title = 'Revelar Menu';
                    } else {
                        sidebar.classList.remove('hidden');
                        mainContent.classList.remove('sidebar-hidden');
                        toggleIcon.className = 'fas fa-times';
                        sidebarToggle.title = 'Ocultar Menu';
                    }
                });
                
                // Save preference in localStorage
                const savedState = localStorage.getItem('sidebarHidden');
                if (savedState === 'true') {
                    sidebarHidden = true;
                    sidebar.classList.add('hidden');
                    mainContent.classList.add('sidebar-hidden');
                    toggleIcon.className = 'fas fa-bars';
                    sidebarToggle.title = 'Revelar Menu';
                } else {
                    toggleIcon.className = 'fas fa-times';
                    sidebarToggle.title = 'Ocultar Menu';
                }
                
                // Update localStorage when changed
                sidebarToggle.addEventListener('click', function() {
                    localStorage.setItem('sidebarHidden', sidebarHidden.toString());
                });
            }
        });
    }

    setupNavigation() {
        // Setup navigation links
        const navLinks = document.querySelectorAll('.sidebar .nav-link[data-page]');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                this.navigateToPage(page);
            });
        });

        // Make navigation function globally available
        window.navigateToPage = (page, params = {}) => {
            this.navigateToPage(page, params);
        };
    }

    navigateToPage(page, params = {}) {
        // Update active nav link
        document.querySelectorAll('.sidebar .nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`.sidebar .nav-link[data-page="${page}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        // Unload current page
        if (this.currentPageInstance && typeof this.currentPageInstance.unload === 'function') {
            this.currentPageInstance.unload();
        }

        // Load new page
        this.loadPage(page, params);
    }

    async loadPage(page, params = {}) {
        try {
            this.currentPage = page;
            this.currentParams = params;

            // Clear messages area
            const messageArea = document.getElementById('messageArea');
            if (messageArea) {
                messageArea.innerHTML = '';
            }

            // Show loading if page class exists
            if (this.pageClasses[page]) {
                const PageClass = this.pageClasses[page];
                this.currentPageInstance = new PageClass();
                
                // Load page content
                await this.currentPageInstance.load(params);
            } else {
                // Page not found
                document.getElementById('pageContent').innerHTML = `
                    <div class="alert alert-danger" role="alert">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Página não encontrada.
                    </div>
                `;
                document.getElementById('pageTitle').textContent = 'Página Não Encontrada';
            }

        } catch (error) {
            console.error('Erro ao carregar página:', error);
            Utils.showMessage('Erro ao carregar página', 'error');
        }
    }

    loadInitialPage() {
        // Load dashboard by default when authenticated
        if (authManager.currentUser) {
            this.navigateToPage('dashboard');
        }
    }

    // Utility method to check if user is authenticated and has required permissions
    checkPermissions(requiredPermission = null) {
        if (!authManager.currentUser) {
            Utils.showMessage('Você precisa estar logado para acessar esta funcionalidade', 'warning');
            return false;
        }

        if (requiredPermission && !authManager.hasPermission(requiredPermission)) {
            Utils.showMessage('Você não tem permissão para realizar esta ação', 'warning');
            return false;
        }

        return true;
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the main application
    window.app = new EstoqueApp();
    
    // Initialize app after authentication
    auth.onAuthStateChanged((user) => {
        if (user && window.app) {
            // Small delay to ensure DOM is ready
            setTimeout(() => {
                window.app.init();
            }, 100);
        }
    });
});

// Global error handler
window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
    if (event.error && event.error.message) {
        Utils.showMessage('Erro: ' + event.error.message, 'error');
    }
});

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    if (event.reason && event.reason.message) {
        Utils.showMessage('Erro: ' + event.reason.message, 'error');
    }
});

// Export app class for global use
window.EstoqueApp = EstoqueApp;
