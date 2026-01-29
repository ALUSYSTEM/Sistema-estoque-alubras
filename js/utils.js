// Utilitários do Sistema de Qualidade
class Utils {
    // Formatação de datas
    static formatDate(date, includeTime = false) {
        if (!date) return '-';
        
        let d;
        if (date.toDate) {
            d = date.toDate();
        } else if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
            const [year, month, day] = date.split('-').map(Number);
            d = new Date(year, month - 1, day);
        } else {
            d = new Date(date);
        }
        const options = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        };
        
        if (includeTime) {
            options.hour = '2-digit';
            options.minute = '2-digit';
        }
        
        return d.toLocaleDateString('pt-BR', options);
    }

    // Formatação de números
    static formatNumber(number, decimals = 2) {
        if (number === null || number === undefined) return '0';
        return parseFloat(number).toLocaleString('pt-BR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    }

    // Formatação de porcentagem
    static formatPercentage(value, total) {
        if (!total || total === 0) return '0%';
        const percentage = (value / total) * 100;
        return `${percentage.toFixed(1)}%`;
    }

    // Exibir mensagens
    static showMessage(message, type = 'info', duration = 5000) {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;

        const toastId = 'toast-' + Date.now();
        const toastHtml = `
            <div class="toast" id="${toastId}" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header">
                    <i class="fas fa-${this.getIconForType(type)} text-${type === 'error' ? 'danger' : type} me-2"></i>
                    <strong class="me-auto">Sistema de Qualidade</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">
                    ${message}
                </div>
            </div>
        `;

        toastContainer.insertAdjacentHTML('beforeend', toastHtml);
        
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, { delay: duration });
        toast.show();

        // Remover elemento após ser escondido
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }

    static getIconForType(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    // Validação de formulários
    static validateForm(formId) {
        const form = document.getElementById(formId);
        if (!form) return false;

        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.classList.add('is-invalid');
                isValid = false;
            } else {
                field.classList.remove('is-invalid');
            }
        });

        return isValid;
    }

    // Limpar validações
    static clearValidations(formId) {
        const form = document.getElementById(formId);
        if (!form) return;

        const fields = form.querySelectorAll('.is-invalid');
        fields.forEach(field => field.classList.remove('is-invalid'));
    }

    // Debounce para otimização
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Gerar ID único
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Calcular status de qualidade
    static calculateQualityStatus(total, defects) {
        if (!total || total === 0) return 'N/A';
        
        const goodItems = total - defects;
        const percentage = (goodItems / total) * 100;
        
        if (percentage >= 95) return 'Excelente';
        if (percentage >= 90) return 'Bom';
        if (percentage >= 80) return 'Regular';
        return 'Ruim';
    }

    // Obter classe CSS para status
    static getStatusClass(status) {
        const classes = {
            'Excelente': 'success',
            'Bom': 'info',
            'Regular': 'warning',
            'Ruim': 'danger',
            'Aprovado': 'success',
            'Aprovado Parcialmente': 'warning',
            'Reprovado': 'danger',
            'Pendente': 'secondary',
            'Em Andamento': 'primary',
            'Concluído': 'success',
            'Bloqueado': 'danger'
        };
        return classes[status] || 'secondary';
    }

    // Formatação de status
    static formatStatus(status) {
        const statusMap = {
            'PENDENTE': 'Pendente',
            'EM_ANDAMENTO': 'Em Andamento',
            'CONCLUIDO': 'Concluído',
            'BLOQUEADO': 'Bloqueado',
            'APROVADO': 'Aprovado',
            'REPROVADO': 'Reprovado',
            'APROVADO_PARCIALMENTE': 'Aprovado Parcialmente'
        };
        return statusMap[status] || status;
    }

    // Calcular estatísticas de qualidade
    static calculateQualityStats(inspecoes) {
        const total = inspecoes.length;
        const aprovadas = inspecoes.filter(i => i.parecer === 'Aprovado').length;
        const aprovadasParcial = inspecoes.filter(i => i.parecer === 'Aprovado Parcialmente').length;
        const reprovadas = inspecoes.filter(i => i.parecer === 'Reprovado').length;
        
        const totalEsquadrias = inspecoes.reduce((sum, i) => sum + (i.qtd_inspecionadas || 0), 0);
        const totalDefeitos = inspecoes.reduce((sum, i) => sum + (i.qtd_defeitos || 0), 0);
        const totalBloqueadas = inspecoes.reduce((sum, i) => sum + (i.qtd_bloqueada || 0), 0);
        
        return {
            total_inspecoes: total,
            aprovadas,
            aprovadas_parcial: aprovadasParcial,
            reprovadas,
            total_esquadrias: totalEsquadrias,
            total_defeitos: totalDefeitos,
            total_bloqueadas: totalBloqueadas,
            taxa_aprovacao: total > 0 ? ((aprovadas + aprovadasParcial) / total * 100).toFixed(1) : 0,
            taxa_defeitos: totalEsquadrias > 0 ? (totalDefeitos / totalEsquadrias * 100).toFixed(1) : 0
        };
    }

    // Exportar dados para CSV
    static exportToCSV(data, filename) {
        if (!data || data.length === 0) {
            this.showMessage('Nenhum dado para exportar', 'warning');
            return;
        }

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => {
                const value = row[header];
                return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
            }).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Mostrar loading
    static showLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
        }
    }

    // Esconder loading
    static hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    // Confirmar ação
    static async confirm(title, message) {
        return new Promise((resolve) => {
            const modalHtml = `
                <div class="modal fade" id="confirmModal" tabindex="-1">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">${title}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                ${message}
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                                <button type="button" class="btn btn-primary" id="confirmBtn">Confirmar</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHtml);
            const modal = new bootstrap.Modal(document.getElementById('confirmModal'));
            
            document.getElementById('confirmBtn').onclick = () => {
                modal.hide();
                resolve(true);
            };

            document.getElementById('confirmModal').addEventListener('hidden.bs.modal', () => {
                document.getElementById('confirmModal').remove();
                resolve(false);
            });

            modal.show();
        });
    }

    // Mostrar modal genérico
    static showModal(title, content, actions = []) {
        const modalId = 'customModal-' + Date.now();
        const modalHtml = `
            <div class="modal fade" id="${modalId}" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${title}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${content}
                        </div>
                        <div class="modal-footer">
                            ${actions.map((action, index) => `
                                <button type="button" class="btn btn-${action.class || 'secondary'}" 
                                        id="modalAction${index}" 
                                        ${action.onclick ? `onclick="${action.onclick}"` : ''}>
                                    ${action.text}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById(modalId));
        
        // Remover modal quando fechado
        document.getElementById(modalId).addEventListener('hidden.bs.modal', () => {
            document.getElementById(modalId).remove();
        });

        modal.show();
    }

    // Fechar modal
    static closeModal() {
        const modal = document.querySelector('.modal.show');
        if (modal) {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) {
                bsModal.hide();
            }
        }
    }
}

// Tornar disponível globalmente
window.Utils = Utils;

// Função global para fechar modal
window.closeModal = () => {
    Utils.closeModal();
};

// Funções globais para os modais (fallback)
window.showInspecaoModal = () => {
    if (window.inspecoesPage) {
        window.inspecoesPage.showInspecaoModal();
    } else {
        console.error('inspecoesPage não encontrada');
    }
};

window.showDefeitoModal = () => {
    if (window.defeitosPage) {
        window.defeitosPage.showDefeitoModal();
    } else {
        console.error('defeitosPage não encontrada');
    }
};

window.showInspetorModal = () => {
    if (window.inspetoresPage) {
        window.inspetoresPage.showInspetorModal();
    } else {
        console.error('inspetoresPage não encontrada');
    }
};

window.showFornecedorModal = () => {
    if (window.fornecedoresPage) {
        window.fornecedoresPage.showFornecedorModal();
    } else {
        console.error('fornecedoresPage não encontrada');
    }
};

window.showRetrabalhoModal = () => {
    if (window.retrabalhoPage) {
        window.retrabalhoPage.showRetrabalhoModal();
    } else {
        console.error('retrabalhoPage não encontrada');
    }
};

// Funções de salvar
window.saveInspecao = () => {
    if (window.inspecoesPage) {
        window.inspecoesPage.saveInspecao();
    }
};

window.saveDefeito = () => {
    if (window.defeitosPage) {
        window.defeitosPage.saveDefeito();
    }
};

window.saveInspetor = () => {
    console.log('Função global saveInspetor chamada');
    if (window.inspetoresPage) {
        window.inspetoresPage.saveInspetor();
    } else {
        console.error('inspetoresPage não encontrada');
    }
};

window.saveFornecedor = () => {
    if (window.fornecedoresPage) {
        window.fornecedoresPage.saveFornecedor();
    }
};

window.saveRetrabalho = () => {
    if (window.retrabalhoPage) {
        window.retrabalhoPage.saveRetrabalho();
    }
};

// Funções de atualizar
window.saveInspecaoUpdate = (id) => {
    if (window.inspecoesPage) {
        window.inspecoesPage.saveInspecaoUpdate(id);
    }
};

window.saveDefeitoUpdate = (id) => {
    if (window.defeitosPage) {
        window.defeitosPage.saveDefeitoUpdate(id);
    }
};

window.saveInspetorUpdate = (id) => {
    console.log('Função global saveInspetorUpdate chamada com ID:', id);
    if (window.inspetoresPage) {
        window.inspetoresPage.saveInspetorUpdate(id);
    } else {
        console.error('inspetoresPage não encontrada');
    }
};

window.saveFornecedorUpdate = (id) => {
    if (window.fornecedoresPage) {
        window.fornecedoresPage.saveFornecedorUpdate(id);
    }
};

window.saveRetrabalhoUpdate = (id) => {
    if (window.retrabalhoPage) {
        window.retrabalhoPage.saveRetrabalhoUpdate(id);
    }
};

// Funções de editar
window.editInspecao = (id) => {
    if (window.inspecoesPage) {
        window.inspecoesPage.editInspecao(id);
    }
};

window.editDefeito = (id) => {
    if (window.defeitosPage) {
        window.defeitosPage.editDefeito(id);
    }
};

window.editInspetor = (id) => {
    if (window.inspetoresPage) {
        window.inspetoresPage.editInspetor(id);
    }
};

window.editFornecedor = (id) => {
    if (window.fornecedoresPage) {
        window.fornecedoresPage.editFornecedor(id);
    }
};

window.editRetrabalho = (id) => {
    if (window.retrabalhoPage) {
        window.retrabalhoPage.editRetrabalho(id);
    }
};

// Funções de excluir
window.deleteInspecao = (id) => {
    if (window.inspecoesPage) {
        window.inspecoesPage.deleteInspecao(id);
    }
};

// Funções de relatórios
window.generateInspecoesPeriodo = () => {
    if (window.relatoriosPage) {
        window.relatoriosPage.generateInspecoesPeriodo();
    }
};

window.generateDefeitosFrequentes = () => {
    if (window.relatoriosPage) {
        window.relatoriosPage.generateDefeitosFrequentes();
    }
};

window.generatePerformanceInspetores = () => {
    if (window.relatoriosPage) {
        window.relatoriosPage.generatePerformanceInspetores();
    }
};

window.generateIndicadoresQualidade = () => {
    if (window.relatoriosPage) {
        window.relatoriosPage.generateIndicadoresQualidade();
    }
};

window.generateRetrabalhosProduto = () => {
    if (window.relatoriosPage) {
        window.relatoriosPage.generateRetrabalhosProduto();
    }
};

window.generateAvaliacaoFornecedores = () => {
    if (window.relatoriosPage) {
        window.relatoriosPage.generateAvaliacaoFornecedores();
    }
};

window.exportToPDF = () => {
    if (window.relatoriosPage) {
        window.relatoriosPage.exportToPDF();
    }
};

// Funções de configurações
window.salvarParametros = () => {
    if (window.configuracoesPage) {
        window.configuracoesPage.salvarParametros();
    }
};

window.resetarParametros = () => {
    if (window.configuracoesPage) {
        window.configuracoesPage.resetarParametros();
    }
};

window.adicionarDefeito = () => {
    if (window.configuracoesPage) {
        window.configuracoesPage.adicionarDefeito();
    }
};

window.editarDefeito = (tipo) => {
    if (window.configuracoesPage) {
        window.configuracoesPage.editarDefeito(tipo);
    }
};

window.removerDefeito = (tipo) => {
    if (window.configuracoesPage) {
        window.configuracoesPage.removerDefeito(tipo);
    }
};

window.salvarCriterios = () => {
    if (window.configuracoesPage) {
        window.configuracoesPage.salvarCriterios();
    }
};

window.testarCriterios = () => {
    if (window.configuracoesPage) {
        window.configuracoesPage.testarCriterios();
    }
};

window.salvarNotificacoes = () => {
    if (window.configuracoesPage) {
        window.configuracoesPage.salvarNotificacoes();
    }
};

window.testarNotificacoes = () => {
    if (window.configuracoesPage) {
        window.configuracoesPage.testarNotificacoes();
    }
};

window.novoUsuario = () => {
    if (window.configuracoesPage) {
        window.configuracoesPage.novoUsuario();
    }
};

window.editarUsuario = (id) => {
    if (window.configuracoesPage) {
        window.configuracoesPage.editarUsuario(id);
    }
};

window.alterarSenha = (id) => {
    if (window.configuracoesPage) {
        window.configuracoesPage.alterarSenha(id);
    }
};

window.salvarIntegracao = () => {
    if (window.configuracoesPage) {
        window.configuracoesPage.salvarIntegracao();
    }
};

window.testarIntegracao = (sistema) => {
    if (window.configuracoesPage) {
        window.configuracoesPage.testarIntegracao(sistema);
    }
};

window.sincronizarAgora = () => {
    if (window.configuracoesPage) {
        window.configuracoesPage.sincronizarAgora();
    }
};

window.verLogsIntegracao = () => {
    if (window.configuracoesPage) {
        window.configuracoesPage.verLogsIntegracao();
    }
};

window.deleteDefeito = (id) => {
    if (window.defeitosPage) {
        window.defeitosPage.deleteDefeito(id);
    }
};

window.deleteInspetor = (id) => {
    if (window.inspetoresPage) {
        window.inspetoresPage.deleteInspetor(id);
    }
};

window.deleteFornecedor = (id) => {
    if (window.fornecedoresPage) {
        window.fornecedoresPage.deleteFornecedor(id);
    }
};

window.deleteRetrabalho = (id) => {
    if (window.retrabalhoPage) {
        window.retrabalhoPage.deleteRetrabalho(id);
    }
};

// Funções de visualizar
window.viewInspecao = (id) => {
    if (window.inspecoesPage) {
        window.inspecoesPage.viewInspecao(id);
    }
};

window.viewDefeito = (id) => {
    if (window.defeitosPage) {
        window.defeitosPage.viewDefeito(id);
    }
};

window.viewInspetor = (id) => {
    if (window.inspetoresPage) {
        window.inspetoresPage.viewInspetor(id);
    }
};

window.viewFornecedor = (id) => {
    if (window.fornecedoresPage) {
        window.fornecedoresPage.viewFornecedor(id);
    }
};

window.viewRetrabalho = (id) => {
    if (window.retrabalhoPage) {
        window.retrabalhoPage.viewRetrabalho(id);
    }
};

// Função específica do retrabalho
window.updateStatus = (id) => {
    if (window.retrabalhoPage) {
        window.retrabalhoPage.updateStatus(id);
    }
};

// Funções de importação
window.showImportModal = () => {
    if (window.inspecoesPage) {
        window.inspecoesPage.showImportModal();
    }
};

window.processImport = () => {
    if (window.inspecoesPage) {
        window.inspecoesPage.processImport();
    }
};

window.downloadTemplate = () => {
    if (window.inspecoesPage) {
        window.inspecoesPage.downloadTemplate();
    }
};

window.clearAllInspecoes = () => {
    if (window.inspecoesPage) {
        window.inspecoesPage.clearAllInspecoes();
    }
};

window.sendToRetrabalho = (id) => {
    if (window.inspecoesPage) {
        window.inspecoesPage.sendToRetrabalho(id);
    }
};

window.confirmarRetrabalho = (id) => {
    console.log('Utils confirmarRetrabalho chamada com ID:', id);
    if (window.inspecoesPage) {
        window.inspecoesPage.confirmarRetrabalho(id);
    } else {
        console.error('inspecoesPage não encontrada');
    }
};

window.deleteInspecao = (id) => {
    if (window.inspecoesPage) {
        window.inspecoesPage.deleteInspecao(id);
    }
};

// Funções de relatórios
window.generateInspecoesPeriodo = () => {
    if (window.relatoriosPage) {
        window.relatoriosPage.generateInspecoesPeriodo();
    }
};

window.generateDefeitosFrequentes = () => {
    if (window.relatoriosPage) {
        window.relatoriosPage.generateDefeitosFrequentes();
    }
};

window.generatePerformanceInspetores = () => {
    if (window.relatoriosPage) {
        window.relatoriosPage.generatePerformanceInspetores();
    }
};

window.generateIndicadoresQualidade = () => {
    if (window.relatoriosPage) {
        window.relatoriosPage.generateIndicadoresQualidade();
    }
};

window.generateRetrabalhosProduto = () => {
    if (window.relatoriosPage) {
        window.relatoriosPage.generateRetrabalhosProduto();
    }
};

window.generateAvaliacaoFornecedores = () => {
    if (window.relatoriosPage) {
        window.relatoriosPage.generateAvaliacaoFornecedores();
    }
};

window.exportToPDF = () => {
    if (window.relatoriosPage) {
        window.relatoriosPage.exportToPDF();
    }
};

// Funções de configurações
window.salvarParametros = () => {
    if (window.configuracoesPage) {
        window.configuracoesPage.salvarParametros();
    }
};

window.resetarParametros = () => {
    if (window.configuracoesPage) {
        window.configuracoesPage.resetarParametros();
    }
};

window.adicionarDefeito = () => {
    if (window.configuracoesPage) {
        window.configuracoesPage.adicionarDefeito();
    }
};

window.editarDefeito = (tipo) => {
    if (window.configuracoesPage) {
        window.configuracoesPage.editarDefeito(tipo);
    }
};

window.removerDefeito = (tipo) => {
    if (window.configuracoesPage) {
        window.configuracoesPage.removerDefeito(tipo);
    }
};

window.salvarCriterios = () => {
    if (window.configuracoesPage) {
        window.configuracoesPage.salvarCriterios();
    }
};

window.testarCriterios = () => {
    if (window.configuracoesPage) {
        window.configuracoesPage.testarCriterios();
    }
};

window.salvarNotificacoes = () => {
    if (window.configuracoesPage) {
        window.configuracoesPage.salvarNotificacoes();
    }
};

window.testarNotificacoes = () => {
    if (window.configuracoesPage) {
        window.configuracoesPage.testarNotificacoes();
    }
};

window.novoUsuario = () => {
    if (window.configuracoesPage) {
        window.configuracoesPage.novoUsuario();
    }
};

window.editarUsuario = (id) => {
    if (window.configuracoesPage) {
        window.configuracoesPage.editarUsuario(id);
    }
};

window.alterarSenha = (id) => {
    if (window.configuracoesPage) {
        window.configuracoesPage.alterarSenha(id);
    }
};

window.salvarIntegracao = () => {
    if (window.configuracoesPage) {
        window.configuracoesPage.salvarIntegracao();
    }
};

window.testarIntegracao = (sistema) => {
    if (window.configuracoesPage) {
        window.configuracoesPage.testarIntegracao(sistema);
    }
};

window.sincronizarAgora = () => {
    if (window.configuracoesPage) {
        window.configuracoesPage.sincronizarAgora();
    }
};

window.verLogsIntegracao = () => {
    if (window.configuracoesPage) {
        window.configuracoesPage.verLogsIntegracao();
    }
};
