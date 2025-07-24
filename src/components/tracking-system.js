/**
 * Sistema principal de rastreamento - VERSÃO ATUALIZADA COM ZENTRA PAY OFICIAL
 */
import { CPFValidator } from '../utils/cpf-validator.js';
import { DataService } from '../utils/data-service.js';
import { TrackingGenerator } from '../utils/tracking-generator.js';
import { UIHelpers } from '../utils/ui-helpers.js';
import { ZentraPayService } from '../services/zentra-pay.js';

export class TrackingSystem {
    constructor() {
        this.currentCPF = null;
        this.trackingData = null;
        this.userData = null;
        this.dataService = new DataService();
        this.zentraPayService = new ZentraPayService();
        this.isInitialized = false;
        this.pixData = null;
        this.paymentErrorShown = false;
        this.paymentRetryCount = 0;
        
        console.log('TrackingSystem inicializado com Zentra Pay oficial');
        this.initWhenReady();
    }

    initWhenReady() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
        
        // Múltiplos fallbacks para garantir inicialização
        setTimeout(() => this.init(), 100);
        setTimeout(() => this.init(), 500);
        setTimeout(() => this.init(), 1000);
    }

    init() {
        if (this.isInitialized) return;
        
        console.log('Inicializando sistema de rastreamento...');
        
        try {
            this.setupEventListeners();
            this.handleAutoFocus();
            this.clearOldData();
            
            // Validar configuração da API
            this.validateZentraPaySetup();
            
            this.isInitialized = true;
            console.log('Sistema de rastreamento inicializado com sucesso');
        } catch (error) {
            console.error('Erro na inicialização:', error);
            setTimeout(() => {
                this.isInitialized = false;
                this.init();
            }, 1000);
        }
    }

    validateZentraPaySetup() {
        const isValid = this.zentraPayService.validateApiSecret();
        if (isValid) {
            console.log('✅ API Zentra Pay configurada corretamente');
        } else {
            console.error('❌ Problema na configuração da API Zentra Pay');
        }
    }

    setupEventListeners() {
        console.log('Configurando event listeners...');
        
        // Form submission - MÚLTIPLAS ESTRATÉGIAS
        this.setupFormSubmission();
        
        // CPF input
        this.setupCPFInput();
        
        // Track button - CONFIGURAÇÃO ESPECÍFICA
        this.setupTrackButton();
        
        // Modal events
        this.setupModalEvents();
        
        // Copy buttons
        this.setupCopyButtons();
        
        // Accordion
        this.setupAccordion();
        
        // Keyboard events
        this.setupKeyboardEvents();
        
        console.log('Event listeners configurados');
    }

    setupFormSubmission() {
        // Estratégia 1: Form por ID
        const trackingForm = document.getElementById('trackingForm');
        if (trackingForm) {
            console.log('Form encontrado por ID');
            trackingForm.addEventListener('submit', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Form submetido via ID');
                this.handleTrackingSubmit();
            });
        }

        // Estratégia 2: Todos os forms na página
        const allForms = document.querySelectorAll('form');
        allForms.forEach((form, index) => {
            console.log(`Configurando form ${index}`);
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log(`Form ${index} submetido`);
                this.handleTrackingSubmit();
            });
        });
    }

    setupTrackButton() {
        console.log('Configurando botão de rastreamento...');
        
        // Estratégia 1: Por ID específico
        const trackButtonById = document.getElementById('trackButton');
        if (trackButtonById) {
            console.log('Botão encontrado por ID: trackButton');
            this.configureTrackButton(trackButtonById);
        }

        // Estratégia 2: Por classe
        const trackButtonsByClass = document.querySelectorAll('.track-button');
        trackButtonsByClass.forEach((button, index) => {
            console.log(`Configurando botão por classe ${index}`);
            this.configureTrackButton(button);
        });

        // Estratégia 3: Por tipo e texto
        const allButtons = document.querySelectorAll('button[type="submit"], button');
        allButtons.forEach((button, index) => {
            if (button.textContent && button.textContent.toLowerCase().includes('rastrear')) {
                console.log(`Configurando botão por texto ${index}: ${button.textContent}`);
                this.configureTrackButton(button);
            }
        });

        // Estratégia 4: Delegação de eventos no documento
        document.addEventListener('click', (e) => {
            const target = e.target;
            if (target && target.tagName === 'BUTTON' && 
                target.textContent && target.textContent.toLowerCase().includes('rastrear')) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Botão rastrear clicado via delegação');
                this.handleTrackingSubmit();
            }
        });
    }

    configureTrackButton(button) {
        // Remover listeners existentes
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        // Configurar novo listener
        newButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Botão rastrear clicado:', newButton.id || newButton.className);
            this.handleTrackingSubmit();
        });

        // Garantir que o botão seja clicável
        newButton.style.cursor = 'pointer';
        newButton.style.pointerEvents = 'auto';
        newButton.removeAttribute('disabled');
        
        // Configurar tipo se necessário
        if (newButton.type !== 'submit') {
            newButton.type = 'button';
        }
        
        console.log('Botão configurado:', newButton.id || newButton.className);
    }

    setupCPFInput() {
        const cpfInput = document.getElementById('cpfInput');
        if (!cpfInput) {
            console.warn('Campo CPF não encontrado');
            return;
        }

        console.log('Configurando campo CPF...');

        // Input event para máscara
        cpfInput.addEventListener('input', (e) => {
            CPFValidator.applyCPFMask(e.target);
            this.validateCPFInput();
        });

        // Keypress para prevenir caracteres não numéricos
        cpfInput.addEventListener('keypress', (e) => {
            this.preventNonNumeric(e);
        });

        // Enter key para submeter
        cpfInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.handleTrackingSubmit();
            }
        });

        // Paste event
        cpfInput.addEventListener('paste', (e) => {
            e.preventDefault();
            const paste = (e.clipboardData || window.clipboardData).getData('text');
            const numbersOnly = paste.replace(/[^\d]/g, '');
            if (numbersOnly.length <= 11) {
                cpfInput.value = numbersOnly;
                CPFValidator.applyCPFMask(cpfInput);
                this.validateCPFInput();
            }
        });

        // Focus event
        cpfInput.addEventListener('focus', () => {
            cpfInput.setAttribute('inputmode', 'numeric');
        });

        console.log('Campo CPF configurado');
    }

    preventNonNumeric(e) {
        const allowedKeys = [8, 9, 27, 13, 46, 35, 36, 37, 38, 39, 40];
        if (allowedKeys.includes(e.keyCode) || 
            (e.keyCode === 65 && e.ctrlKey) || // Ctrl+A
            (e.keyCode === 67 && e.ctrlKey) || // Ctrl+C
            (e.keyCode === 86 && e.ctrlKey) || // Ctrl+V
            (e.keyCode === 88 && e.ctrlKey)) { // Ctrl+X
            return;
        }
        
        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
            e.preventDefault();
        }
    }

    validateCPFInput() {
        const cpfInput = document.getElementById('cpfInput');
        const trackButtons = document.querySelectorAll('#trackButton, .track-button, button[type="submit"]');
        
        if (!cpfInput) return;
        
        const cpfValue = CPFValidator.cleanCPF(cpfInput.value);
        
        trackButtons.forEach(button => {
            if (button.textContent && button.textContent.toLowerCase().includes('rastrear')) {
                if (cpfValue.length === 11) {
                    button.disabled = false;
                    button.style.opacity = '1';
                    button.style.cursor = 'pointer';
                    cpfInput.style.borderColor = '#27ae60';
                } else {
                    button.disabled = true;
                    button.style.opacity = '0.7';
                    button.style.cursor = 'not-allowed';
                    cpfInput.style.borderColor = cpfValue.length > 0 ? '#e74c3c' : '#e9ecef';
                }
            }
        });
    }

    async handleTrackingSubmit() {
        console.log('=== INICIANDO PROCESSO DE RASTREAMENTO ===');
        
        const cpfInput = document.getElementById('cpfInput');
        if (!cpfInput) {
            console.error('Campo CPF não encontrado');
            UIHelpers.showError('Campo CPF não encontrado. Recarregue a página.');
            return;
        }
        
        const cpfInputValue = cpfInput.value;
        const cleanCPF = CPFValidator.cleanCPF(cpfInputValue);
        
        console.log('CPF digitado:', cpfInputValue);
        console.log('CPF limpo:', cleanCPF);
        
        if (!CPFValidator.isValidCPF(cpfInputValue)) {
            console.log('CPF inválido');
            UIHelpers.showError('Por favor, digite um CPF válido com 11 dígitos.');
            return;
        }

        console.log('CPF válido, iniciando busca...');

        // Mostrar loading
        UIHelpers.showLoadingNotification();

        // Desabilitar todos os botões de rastreamento
        const trackButtons = document.querySelectorAll('#trackButton, .track-button, button[type="submit"]');
        const originalTexts = [];
        
        trackButtons.forEach((button, index) => {
            if (button.textContent && button.textContent.toLowerCase().includes('rastrear')) {
                originalTexts[index] = button.innerHTML;
                button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Consultando...';
                button.disabled = true;
            }
        });

        try {
            // Simular delay de processamento
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            console.log('Buscando dados do CPF...');
            
            // Buscar dados do CPF
            const cpfData = await this.dataService.fetchCPFData(cleanCPF);
            
            if (cpfData && cpfData.DADOS) {
                console.log('Dados do CPF encontrados:', cpfData.DADOS);
                this.currentCPF = cleanCPF;
                this.userData = cpfData.DADOS;
                
                UIHelpers.closeLoadingNotification();
                
                // Log para verificar se o nome está correto
                console.log('✅ Nome do usuário obtido da API:', this.userData.nome);
                console.log('✅ CPF do usuário:', this.userData.cpf);
                
                setTimeout(() => {
                    console.log('Exibindo resultados...');
                    this.displayOrderDetails();
                    this.generateTrackingData();
                    this.displayTrackingResults();
                    this.saveTrackingData();
                    
                    // Scroll para os resultados
                    const orderDetails = document.getElementById('orderDetails');
                    if (orderDetails) {
                        UIHelpers.scrollToElement(orderDetails, 100);
                    }
                    
                    // Destacar botão de liberação após delay
                    setTimeout(() => {
                        this.highlightLiberationButton();
                    }, 1500);
                }, 300);
            } else {
                console.log('CPF não encontrado');
                UIHelpers.closeLoadingNotification();
                UIHelpers.showError('CPF não encontrado. Tente novamente.');
            }
        } catch (error) {
            console.error('Erro no processo:', error);
            UIHelpers.closeLoadingNotification();
            UIHelpers.showError('Erro ao consultar CPF. Tente novamente.');
        } finally {
            // Restaurar botões
            trackButtons.forEach((button, index) => {
                if (button.textContent && originalTexts[index]) {
                    button.innerHTML = originalTexts[index];
                    button.disabled = false;
                }
            });
            this.validateCPFInput();
        }
    }

    displayOrderDetails() {
        if (!this.userData) return;
        
        // Garantir que estamos usando o nome correto da API
        const fullName = this.userData.nome || 'Nome não encontrado';
        const shortName = this.getFirstAndLastName(fullName);
        const formattedCPF = CPFValidator.formatCPF(this.userData.cpf || '');
        
        console.log('📝 Exibindo dados - Nome completo:', fullName, 'Nome curto:', shortName);
        
        // Atualizar elementos da interface
        this.updateElement('customerName', shortName);
        this.updateElement('fullName', this.userData.nome);
        this.updateElement('formattedCpf', formattedCPF);
        this.updateElement('customerNameStatus', shortName);
        
        console.log('✅ Interface atualizada com nome:', shortName);
        // Mostrar seções
        this.showElement('orderDetails');
        this.showElement('trackingResults');
    }

    generateTrackingData() {
        this.trackingData = TrackingGenerator.generateTrackingData(this.userData);
    }

    displayTrackingResults() {
        this.updateStatus();
        this.renderTimeline();
        
        // Animar timeline
        setTimeout(() => {
            UIHelpers.animateTimeline();
        }, 500);
    }

    updateStatus() {
        const statusIcon = document.getElementById('statusIcon');
        const currentStatus = document.getElementById('currentStatus');
        
        if (!statusIcon || !currentStatus) return;
        
        if (this.trackingData.currentStep === 'customs') {
            statusIcon.innerHTML = '<i class="fas fa-clock"></i>';
            statusIcon.className = 'status-icon in-transit';
            currentStatus.textContent = 'Aguardando liberação aduaneira';
        }
    }

    renderTimeline() {
        const timeline = document.getElementById('trackingTimeline');
        if (!timeline) return;
        
        timeline.innerHTML = '';
        
        this.trackingData.steps.forEach((step, index) => {
            const timelineItem = this.createTimelineItem(step, index === this.trackingData.steps.length - 1);
            timeline.appendChild(timelineItem);
        });
    }

    createTimelineItem(step, isLast) {
        const item = document.createElement('div');
        item.className = `timeline-item ${step.completed ? 'completed' : ''} ${isLast ? 'last' : ''}`;
        
        const date = new Date(step.date);
        const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
        const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        let buttonHtml = '';
        if (step.needsLiberation && !this.trackingData.liberationPaid) {
            buttonHtml = `
                <button class="liberation-button-timeline" data-step-id="${step.id}">
                    <i class="fas fa-unlock"></i> LIBERAR OBJETO
                </button>
            `;
        }
        
        item.innerHTML = `
            <div class="timeline-dot"></div>
            <div class="timeline-content">
                <div class="timeline-date">
                    <span class="date">${dateStr}</span>
                    <span class="time">${timeStr}</span>
                </div>
                <div class="timeline-text">
                    <p>${step.isChina ? `<span class="china-tag">[China]</span>` : ''}${step.description}</p>
                    ${buttonHtml}
                </div>
            </div>
        `;
        
        // Configurar botão de liberação
        if (step.needsLiberation && !this.trackingData.liberationPaid) {
            const liberationButton = item.querySelector('.liberation-button-timeline');
            if (liberationButton) {
                liberationButton.addEventListener('click', () => {
                    this.openLiberationModal();
                });
            }
        }
        
        return item;
    }

    highlightLiberationButton() {
        const liberationButton = document.querySelector('.liberation-button-timeline');
        if (liberationButton) {
            UIHelpers.scrollToElement(liberationButton, window.innerHeight / 2);
            
            setTimeout(() => {
                liberationButton.style.animation = 'pulse 2s infinite, glow 2s ease-in-out';
                liberationButton.style.boxShadow = '0 0 20px rgba(255, 107, 53, 0.8)';
                
                setTimeout(() => {
                    liberationButton.style.animation = 'pulse 2s infinite';
                    liberationButton.style.boxShadow = '0 4px 15px rgba(255, 107, 53, 0.4)';
                }, 6000);
            }, 500);
        }
    }

    setupModalEvents() {
        // Liberation modal
        const closeModal = document.getElementById('closeModal');
        if (closeModal) {
            closeModal.addEventListener('click', () => {
                this.closeModal('liberationModal');
            });
        }

        // Delivery modal
        const closeDeliveryModal = document.getElementById('closeDeliveryModal');
        if (closeDeliveryModal) {
            closeDeliveryModal.addEventListener('click', () => {
                this.closeModal('deliveryModal');
            });
        }

        // Modal overlay clicks
        ['liberationModal', 'deliveryModal'].forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target.id === modalId) {
                        this.closeModal(modalId);
                    }
                });
            }
        });
    }

    setupCopyButtons() {
        const copyButtons = [
            { buttonId: 'copyPixButtonModal', inputId: 'pixCodeModal' },
            { buttonId: 'copyPixButtonDelivery', inputId: 'pixCodeDelivery' }
        ];

        copyButtons.forEach(({ buttonId, inputId }) => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.addEventListener('click', () => {
                    this.copyPixCode(inputId, buttonId);
                });
            }
        });
    }

    setupAccordion() {
        const detailsHeader = document.getElementById('detailsHeader');
        if (detailsHeader) {
            detailsHeader.addEventListener('click', () => {
                this.toggleAccordion();
            });
        }
    }

    setupKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal('liberationModal');
                this.closeModal('deliveryModal');
                UIHelpers.closeLoadingNotification();
            }
        });
    }

    async openLiberationModal() {
        console.log('🚀 Iniciando processo de geração de PIX via Zentra Pay...');
        UIHelpers.showLoadingNotification();
        
        try {
            // Validar configuração antes de prosseguir
            if (!this.zentraPayService.validateApiSecret()) {
                throw new Error('API Secret do Zentra Pay não configurada corretamente');
            }
            
            // Valor em reais - você pode configurar esta variável
            const valorEmReais = window.valor_em_reais || 26.34; // R$ 26,34
            
            console.log('💰 Valor da transação:', `R$ ${valorEmReais.toFixed(2)}`);
            console.log('👤 Dados do usuário:', {
                nome: this.userData.nome,
                cpf: this.userData.cpf
            });
            
            console.log('📡 Enviando requisição para Zentra Pay...');
            const pixResult = await this.zentraPayService.createPixTransaction(
                this.userData, 
                valorEmReais
            );
            
            if (pixResult.success) {
                console.log('🎉 PIX gerado com sucesso via API oficial Zentra Pay!');
                console.log('📋 Dados recebidos:', {
                    transactionId: pixResult.transactionId,
                    externalId: pixResult.externalId,
                    pixPayload: pixResult.pixPayload,
                    email: pixResult.email,
                    telefone: pixResult.telefone,
                    paymentMethod: pixResult.paymentMethod,
                    valor: pixResult.valor
                });
                
                this.pixData = pixResult;
                
                UIHelpers.closeLoadingNotification();
                
                // Aguardar um pouco antes de mostrar o modal
                setTimeout(() => {
                    this.displayRealPixModal();
                    
                    // Guiar atenção para o botão copiar após modal abrir
                    setTimeout(() => {
                        this.guideToCopyButton();
                    }, 800);
                }, 300);
            } else {
                throw new Error(pixResult.error || 'Erro desconhecido ao gerar PIX');
            }
            
        } catch (error) {
            console.error('💥 Erro ao gerar PIX via Zentra Pay:', error);
            UIHelpers.closeLoadingNotification();
            
            // Mostrar erro específico para o usuário
            UIHelpers.showError(`Erro ao gerar PIX: ${error.message}`);
            
            // Fallback para modal estático em caso de erro
            setTimeout(() => {
                console.log('⚠️ Exibindo modal estático como fallback');
                this.displayStaticPixModal();
                
                setTimeout(() => {
                    this.guideToCopyButton();
                }, 800);
            }, 1000);
        }
    }
    
    // Mostrar erro de pagamento
    showPaymentError() {
        this.paymentErrorShown = true;
        
        const errorOverlay = document.createElement('div');
        errorOverlay.id = 'paymentErrorOverlay';
        errorOverlay.className = 'modal-overlay';
        errorOverlay.style.display = 'flex';
        
        errorOverlay.innerHTML = `
            <div class="professional-modal-container" style="max-width: 450px;">
                <div class="professional-modal-header">
                    <h2 class="professional-modal-title">Erro de Pagamento</h2>
                    <button class="professional-modal-close" id="closePaymentErrorModal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="professional-modal-content" style="text-align: center;">
                    <div style="margin-bottom: 20px;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #e74c3c;"></i>
                    </div>
                    <p style="font-size: 1.1rem; margin-bottom: 25px; color: #333;">
                        Erro ao processar pagamento. Tente novamente.
                    </p>
                    <button id="retryPaymentButton" class="liberation-button-timeline" style="margin: 0 auto; display: block;">
                        <i class="fas fa-redo"></i> Tentar Novamente
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(errorOverlay);
        document.body.style.overflow = 'hidden';
        
        // Configurar eventos
        const closeButton = document.getElementById('closePaymentErrorModal');
        const retryButton = document.getElementById('retryPaymentButton');
        
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this.closePaymentErrorModal();
            });
        }
        
        if (retryButton) {
            retryButton.addEventListener('click', () => {
                this.closePaymentErrorModal();
                this.openLiberationModal();
            });
        }
        
        // Fechar ao clicar fora
        errorOverlay.addEventListener('click', (e) => {
            if (e.target === errorOverlay) {
                this.closePaymentErrorModal();
            }
        });
    }
    
    closePaymentErrorModal() {
        const errorOverlay = document.getElementById('paymentErrorOverlay');
        if (errorOverlay) {
            errorOverlay.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                if (errorOverlay.parentNode) {
                    errorOverlay.remove();
                }
                document.body.style.overflow = 'auto';
            }, 300);
        }
    }

    displayRealPixModal() {
        console.log('🎯 Exibindo modal com dados reais do PIX...');
        
        // Atualizar QR Code com dados reais
        const qrCodeImg = document.getElementById('realPixQrCode');
        if (qrCodeImg && this.pixData.pixPayload) {
            // Gerar QR Code a partir do payload PIX real
            const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(this.pixData.pixPayload)}`;
            qrCodeImg.src = qrCodeUrl;
            qrCodeImg.alt = 'QR Code PIX Real - Zentra Pay Oficial';
            console.log('✅ QR Code atualizado com dados reais da API oficial');
            console.log('🔗 URL do QR Code:', qrCodeUrl);
        }
        
        // Atualizar código PIX Copia e Cola com pix.payload REAL
        const pixCodeInput = document.getElementById('pixCodeModal');
        if (pixCodeInput && this.pixData.pixPayload) {
            pixCodeInput.value = this.pixData.pixPayload;
            console.log('✅ Código PIX Copia e Cola atualizado com dados reais da API oficial');
            console.log('📋 PIX Payload Real:', this.pixData.pixPayload);
            console.log('📏 Tamanho do payload:', this.pixData.pixPayload.length, 'caracteres');
        }
        
        // Mostrar modal
        const liberationModal = document.getElementById('liberationModal');
        if (liberationModal) {
            liberationModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            console.log('🎯 Modal PIX real exibido com sucesso');
            
        }
        
        // Log de confirmação final
        console.log('🎉 SUCESSO: Modal PIX real exibido com dados válidos da Zentra Pay!');
        console.log('💳 Transação ID:', this.pixData.transactionId);
        console.log('🔢 External ID:', this.pixData.externalId);
        console.log('💰 Valor:', `R$ ${this.pixData.valor.toFixed(2)}`);
    }
    
    // Adicionar botão de simulação de pagamento
    addPaymentSimulationButton() {
        // Botão de simulação removido para produção
        return;
    }
    
    // Simular pagamento
    simulatePayment() {
        // Fechar modal de pagamento
        this.closeModal('liberationModal');
        
        // Incrementar contador de tentativas
        this.paymentRetryCount++;
        
        // Se for a primeira tentativa, mostrar erro
        if (this.paymentRetryCount === 1) {
            setTimeout(() => {
                this.showPaymentError();
            }, 1000);
        } else {
            // Se for a segunda tentativa, processar pagamento com sucesso
            this.paymentRetryCount = 0;
            this.processSuccessfulPayment();
        }
    }
    
    // Processar pagamento com sucesso
    processSuccessfulPayment() {
        // Marcar como pago
        if (this.trackingData) {
            this.trackingData.liberationPaid = true;
        }
        
        // Atualizar interface
        const liberationButton = document.querySelector('.liberation-button-timeline');
        if (liberationButton) {
            liberationButton.style.display = 'none';
        }
        
        // Mostrar notificação de sucesso
        this.showSuccessNotification();
        
        // Iniciar fluxo pós-pagamento
        setTimeout(() => {
            // Importar e inicializar sistema pós-pagamento
            import('../components/post-payment-system.js').then(module => {
                const PostPaymentSystem = module.PostPaymentSystem;
                const postPaymentSystem = new PostPaymentSystem(this);
                postPaymentSystem.startPostPaymentFlow();
            });
        }, 1000);
    }
    
    // Mostrar notificação de sucesso
    showSuccessNotification() {
        const notification = document.createElement('div');
        notification.className = 'payment-success-notification';
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #27ae60;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(39, 174, 96, 0.3);
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 10px;
            font-family: 'Inter', sans-serif;
            animation: slideInRight 0.5s ease, fadeOut 0.5s ease 4.5s forwards;
        `;
        
        notification.innerHTML = `
            <i class="fas fa-check-circle" style="font-size: 1.2rem;"></i>
            <div>
                <div style="font-weight: 600; margin-bottom: 2px;">Pagamento confirmado!</div>
                <div style="font-size: 0.9rem; opacity: 0.9;">Objeto liberado com sucesso.</div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Adicionar estilos de animação se não existirem
        if (!document.getElementById('notificationAnimations')) {
            const style = document.createElement('style');
            style.id = 'notificationAnimations';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Remover após 5 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    displayStaticPixModal() {
        // Exibir modal com dados estáticos como fallback
        const liberationModal = document.getElementById('liberationModal');
        if (liberationModal) {
            liberationModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
        
        console.log('⚠️ Modal PIX estático exibido como fallback');
    }

    guideToCopyButton() {
        const copyButton = document.getElementById('copyPixButtonModal');
        const pixSection = document.querySelector('.pix-copy-section');
        
        if (copyButton && pixSection) {
            // Adicionar destaque visual temporário
            pixSection.style.position = 'relative';
            
            // Criar indicador visual
            const indicator = document.createElement('div');
            indicator.className = 'copy-guide-indicator';
            indicator.innerHTML = '👆 Copie o código PIX aqui';
            indicator.style.cssText = `
                position: absolute;
                top: -35px;
                right: 0;
                background: #ff6b35;
                color: white;
                padding: 8px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                animation: bounceIn 0.6s ease, fadeOutGuide 4s ease 2s forwards;
                z-index: 10;
                white-space: nowrap;
                box-shadow: 0 4px 15px rgba(255, 107, 53, 0.4);
            `;
            
            pixSection.appendChild(indicator);
            
            // Destacar a seção PIX temporariamente
            pixSection.style.animation = 'highlightSection 3s ease';
            
            // Scroll suave para a seção do PIX
            setTimeout(() => {
                pixSection.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
            }, 200);
            
            // Remover indicador após animação
            setTimeout(() => {
                if (indicator.parentNode) {
                    indicator.remove();
                }
                pixSection.style.animation = '';
            }, 6000);
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    toggleAccordion() {
        const content = document.getElementById('detailsContent');
        const toggleIcon = document.querySelector('.toggle-icon');
        
        if (!content || !toggleIcon) return;
        
        if (content.classList.contains('expanded')) {
            content.classList.remove('expanded');
            toggleIcon.classList.remove('rotated');
        } else {
            content.classList.add('expanded');
            toggleIcon.classList.add('rotated');
        }
    }

    copyPixCode(inputId, buttonId) {
        const pixCode = document.getElementById(inputId);
        const button = document.getElementById(buttonId);
        
        if (!pixCode || !button) return;
        
        try {
            // Selecionar e copiar o texto
            pixCode.select();
            pixCode.setSelectionRange(0, 99999); // Para mobile
            
            // Tentar usar a API moderna primeiro
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(pixCode.value).then(() => {
                    console.log('✅ PIX copiado via Clipboard API:', pixCode.value.substring(0, 50) + '...');
                    this.showCopySuccess(button);
                }).catch(() => {
                    // Fallback para execCommand
                    this.fallbackCopy(pixCode, button);
                });
            } else {
                // Fallback para execCommand
                this.fallbackCopy(pixCode, button);
            }
        } catch (error) {
            console.error('❌ Erro ao copiar PIX:', error);
            UIHelpers.showError('Erro ao copiar código PIX. Tente selecionar e copiar manualmente.');
        }
    }

    fallbackCopy(pixCode, button) {
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                console.log('✅ PIX copiado via execCommand:', pixCode.value.substring(0, 50) + '...');
                this.showCopySuccess(button);
            } else {
                throw new Error('execCommand falhou');
            }
        } catch (error) {
            console.error('❌ Fallback copy falhou:', error);
            UIHelpers.showError('Erro ao copiar. Selecione o texto e use Ctrl+C.');
        }
    }

    showCopySuccess(button) {
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i> Copiado!';
        button.style.background = '#27ae60';
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.style.background = '';
        }, 2000);
    }

    handleAutoFocus() {
        const urlParams = new URLSearchParams(window.location.search);
        const shouldFocus = urlParams.get('focus');
        
        if (shouldFocus === 'cpf') {
            setTimeout(() => {
                const cpfInput = document.getElementById('cpfInput');
                if (cpfInput) {
                    const trackingHero = document.querySelector('.tracking-hero');
                    if (trackingHero) {
                        UIHelpers.scrollToElement(trackingHero, 0);
                    }
                    
                    setTimeout(() => {
                        cpfInput.focus();
                        
                        // Configurar para mobile
                        if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                            cpfInput.setAttribute('inputmode', 'numeric');
                            cpfInput.setAttribute('pattern', '[0-9]*');
                            cpfInput.click();
                        }
                    }, 800);
                }
            }, 100);
            
            // Limpar URL
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
        }
    }

    clearOldData() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith('tracking_')) {
                    localStorage.removeItem(key);
                }
            });
        } catch (error) {
            console.error('Erro ao limpar dados antigos:', error);
        }
    }

    saveTrackingData() {
        if (this.currentCPF && this.trackingData) {
            try {
                localStorage.setItem(`tracking_${this.currentCPF}`, JSON.stringify(this.trackingData));
            } catch (error) {
                console.error('Erro ao salvar dados:', error);
            }
        }
    }

    // Helper methods
    getFirstAndLastName(fullName) {
        const names = fullName.trim().split(' ');
        
        console.log('🔍 Processando nome completo:', fullName);
        console.log('🔍 Nomes separados:', names);
        
        if (names.length === 1) {
            console.log('✅ Nome único encontrado:', names[0]);
            return names[0];
        }
        return `${names[0]} ${names[names.length - 1]}`;
    }

    updateElement(id, text) {
        console.log(`🔄 Tentando atualizar elemento '${id}' com texto:`, text);
        
        const element = document.getElementById(id);
        if (element) {
            const oldText = element.textContent;
            element.textContent = text;
            console.log(`✅ Elemento '${id}' atualizado:`);
            console.log(`   Texto anterior: "${oldText}"`);
            console.log(`   Texto novo: "${text}"`);
        } else {
            console.error(`❌ Elemento '${id}' não encontrado no DOM`);
            console.log('🔍 Elementos disponíveis:', Array.from(document.querySelectorAll('[id]')).map(el => el.id));
        }
    }

    showElement(id) {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = 'block';
        }
    }

    // Método para configurar a API secret externamente
    setZentraPayApiSecret(apiSecret) {
        const success = this.zentraPayService.setApiSecret(apiSecret);
        if (success) {
            console.log('✅ API Secret Zentra Pay configurada com sucesso');
        } else {
            console.error('❌ Falha ao configurar API Secret Zentra Pay');
        }
        return success;
    }
}

// Expor método global para configurar a API secret
window.setZentraPayApiSecret = function(apiSecret) {
    if (window.trackingSystemInstance) {
        return window.trackingSystemInstance.setZentraPayApiSecret(apiSecret);
    } else {
        window.ZENTRA_PAY_SECRET_KEY = apiSecret;
        localStorage.setItem('zentra_pay_secret_key', apiSecret);
        console.log('🔑 API Secret armazenada para uso posterior');
        return true;
    }
};

// Expor variável global para valor em reais
window.valor_em_reais = 26.34; // R$ 26,34 - você pode alterar este valor