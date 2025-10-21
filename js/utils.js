// Utilitários gerais do sistema
class Utils {
    // Formatar data para exibição
    static formatDate(date, includeTime = false) {
        if (!date) return '-';
        
        let d;
        if (date.toDate) {
            // Firebase Timestamp
            d = date.toDate();
        } else if (date instanceof Date) {
            d = date;
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

    // Formatar moeda
    static formatCurrency(value) {
        if (value === null || value === undefined) return 'R$ 0,00';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }

    // Formatar número
    static formatNumber(value, decimals = 2) {
        if (value === null || value === undefined) return '0';
        return new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(value);
    }

    // Mostrar mensagem de sucesso
    static showMessage(message, type = 'success') {
        const messageArea = document.getElementById('messageArea');
        if (!messageArea) return;

        const alertClass = type === 'success' ? 'alert-success' : 
                          type === 'error' ? 'alert-danger' : 
                          type === 'warning' ? 'alert-warning' : 'alert-info';

        const messageHtml = `
            <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
                <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : 'info'}-circle me-2"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;

        messageArea.innerHTML = messageHtml;

        // Auto-hide após 5 segundos
        setTimeout(() => {
            const alert = messageArea.querySelector('.alert');
            if (alert) {
                alert.remove();
            }
        }, 5000);
    }

    // Mostrar modal
    static showModal(title, content, actions = []) {
        const modalId = 'modal-' + Date.now();
        const modalsContainer = document.getElementById('modalsContainer');
        
        const modalHtml = `
            <div class="modal fade" id="${modalId}" tabindex="-1">
                <div class="modal-dialog">
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
                                        id="modal-btn-${modalId}-${index}"
                                        ${action.action ? '' : 'data-bs-dismiss="modal"'}>
                                    ${action.text}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        modalsContainer.innerHTML = modalHtml;
        
        const modal = new bootstrap.Modal(document.getElementById(modalId));
        modal.show();

        // Configurar event listeners para botões com ações
        actions.forEach((action, index) => {
            if (action.action) {
                const button = document.getElementById(`modal-btn-${modalId}-${index}`);
                if (button) {
                    button.addEventListener('click', (e) => {
                        e.preventDefault();
                        // Executar a ação
                        try {
                            eval(action.action);
                        } catch (error) {
                            console.error('Erro ao executar ação do modal:', error);
                        }
                        // Fechar modal apenas se a ação for bem-sucedida
                        modal.hide();
                    });
                }
            }
        });

        // Limpar modal após fechar
        document.getElementById(modalId).addEventListener('hidden.bs.modal', function() {
            this.remove();
        });

        return modal;
    }

    // Confirmar ação
    static async confirm(title, message) {
        return new Promise((resolve) => {
            const modalId = 'confirm-modal-' + Date.now();
            const modalsContainer = document.getElementById('modalsContainer');
            
            const modalHtml = `
                <div class="modal fade" id="${modalId}" tabindex="-1" data-bs-backdrop="static">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">${title}</h5>
                            </div>
                            <div class="modal-body text-center">
                                <i class="fas fa-question-circle fa-3x text-warning mb-3"></i>
                                <p>${message}</p>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" id="confirm-cancel-${modalId}">
                                    Cancelar
                                </button>
                                <button type="button" class="btn btn-primary" id="confirm-ok-${modalId}">
                                    OK
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            modalsContainer.innerHTML = modalHtml;
            
            const modal = new bootstrap.Modal(document.getElementById(modalId));
            modal.show();

            // Event listeners para os botões
            document.getElementById(`confirm-cancel-${modalId}`).addEventListener('click', () => {
                modal.hide();
                resolve(false);
            });

            document.getElementById(`confirm-ok-${modalId}`).addEventListener('click', () => {
                modal.hide();
                resolve(true);
            });

            // Limpar modal após fechar
            document.getElementById(modalId).addEventListener('hidden.bs.modal', function() {
                this.remove();
            });
        });
    }

    // Debounce para search
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

    // Validar email
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Validar CPF
    static isValidCPF(cpf) {
        cpf = cpf.replace(/[^\d]/g, '');
        
        if (cpf.length !== 11) return false;
        
        // Verificar se todos os dígitos são iguais
        if (/^(\d)\1{10}$/.test(cpf)) return false;
        
        // Validar dígitos verificadores
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cpf.charAt(i)) * (10 - i);
        }
        let remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cpf.charAt(9))) return false;
        
        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(cpf.charAt(i)) * (11 - i);
        }
        remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cpf.charAt(10))) return false;
        
        return true;
    }

    // Calcular dias para vencimento
    static getDaysUntilExpiration(expirationDate) {
        if (!expirationDate) return null;
        
        const today = new Date();
        const expDate = expirationDate.toDate ? expirationDate.toDate() : new Date(expirationDate);
        
        const diffTime = expDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays;
    }

    // Obter status de vencimento
    static getExpirationStatus(expirationDate, isPerishable = true) {
        if (!isPerishable || !expirationDate) return 'N/A';
        
        const days = this.getDaysUntilExpiration(expirationDate);
        
        if (days === null) return 'N/A';
        
        if (days < 0) return 'VENCIDO';
        if (days <= 7) return 'CRÍTICO';
        if (days <= 30) return 'ATENÇÃO';
        return 'EM DIA';
    }

    // Obter classe CSS para status de vencimento
    static getExpirationStatusClass(status) {
        switch (status) {
            case 'VENCIDO': return 'status-vencido';
            case 'CRÍTICO': return 'status-critico';
            case 'ATENÇÃO': return 'status-atencao';
            case 'EM DIA': return 'status-em-dia';
            default: return 'text-muted';
        }
    }

    // Exportar dados para CSV
    static exportToCSV(data, filename) {
        if (!data || data.length === 0) {
            Utils.showMessage('Nenhum dado para exportar', 'warning');
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
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Carregar dados de arquivo
    static loadFileContent(file, callback) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            callback(e.target.result);
        };
        
        reader.onerror = function() {
            Utils.showMessage('Erro ao carregar arquivo', 'error');
        };
        
        reader.readAsText(file);
    }

    // Aplicar filtros na tabela
    static filterTable(inputId, tableId) {
        const input = document.getElementById(inputId);
        const table = document.getElementById(tableId);
        
        if (!input || !table) return;
        
        input.addEventListener('keyup', function() {
            const filter = this.value.toLowerCase();
            const rows = table.getElementsByTagName('tr');
            
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                const cells = row.getElementsByTagName('td');
                let found = false;
                
                for (let j = 0; j < cells.length; j++) {
                    if (cells[j].textContent.toLowerCase().indexOf(filter) > -1) {
                        found = true;
                        break;
                    }
                }
                
                row.style.display = found ? '' : 'none';
            }
        });
    }

    // Inicializar tooltips do Bootstrap
    static initTooltips() {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }

    // Limpar formulários
    static clearForm(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.reset();
            // Limpar classes de validação
            form.querySelectorAll('.is-invalid').forEach(el => {
                el.classList.remove('is-invalid');
            });
        }
    }

    // Validar formulário
    static validateForm(formId) {
        const form = document.getElementById(formId);
        if (!form) return false;
        
        let isValid = true;
        const requiredFields = form.querySelectorAll('[required]');
        
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
}

// Exportar para uso global
window.Utils = Utils;
