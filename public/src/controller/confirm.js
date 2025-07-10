(function() {
    // Wrap in an IIFE to avoid global scope pollution
    class Confirmation {
        static popupId = 'confirmation-popup';

        static async show({ 
            message = 'Tem certeza que deseja continuar?', 
            title = 'Confirmação', 
            onConfirm, 
            onCancel, 
            confirmText = 'Confirmar', 
            cancelText = 'Cancelar' 
        } = {}) {
            // Remove any existing popup
            const old = document.getElementById(Confirmation.popupId);
            if (old) old.remove();

            // Create popup container
            const popup = document.createElement('div');
            popup.id = Confirmation.popupId;
            popup.innerHTML = `
                <style>
                    #${Confirmation.popupId} {
                        position: fixed;
                        top: 0; 
                        left: 0; 
                        width: 100vw; 
                        height: 100vh;
                        background: rgba(0,0,0,0.8);
                        z-index: 999999;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 1rem;
                        backdrop-filter: blur(12px);
                        animation: fadeIn 0.4s ease-out;
                    }

                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }

                    @keyframes fadeOut {
                        from { opacity: 1; backdrop-filter: blur(12px); }
                        to { opacity: 0; backdrop-filter: blur(0); }
                    }

                    .conf-wrapper {
                        width: 100%;
                        max-width: 40em;
                        min-width: 320px;
                    }

                    .conf-content {
                        background: var(--secundary-color);
                        border-radius: 24px;
                        box-shadow: 
                            0 30px 60px -12px rgba(0, 0, 0, 0.3),
                            0 18px 36px -18px rgba(138, 43, 226, 0.15);
                        padding: 3rem;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 1.5rem;
                        position: relative;
                        border: 2px solid var(--main-color-purple);
                        transform: perspective(1000px);
                        animation: popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                        overflow: hidden;
                    }

                    @keyframes popIn {
                        from { 
                            opacity: 0; 
                            transform: scale(0.8) rotateX(-90deg);
                        }
                        to { 
                            opacity: 1; 
                            transform: scale(1) rotateX(0);
                        }
                    }

                    .conf-icon {
                        width: 100px;
                        height: 100px;
                        background: linear-gradient(135deg, var(--main-color-purple), var(--accent));
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin-bottom: 1.5rem;
                        box-shadow: 
                            0 15px 30px rgba(138, 43, 226, 0.3),
                            0 5px 15px rgba(138, 43, 226, 0.2);
                        transform: translateZ(50px);
                    }

                    .conf-icon svg {
                        width: 50px;
                        height: 50px;
                        color: white;
                        filter: drop-shadow(0 4px 6px rgba(0,0,0,0.2));
                    }

                    .conf-title {
                        font-size: 1.8rem;
                        font-weight: 700;
                        background: linear-gradient(90deg, var(--main-color-purple), var(--accent));
                        -webkit-background-clip: text;
                        background-clip: text;
                        color: transparent;
                        text-align: center;
                        margin-bottom: 0.5rem;
                        letter-spacing: -0.5px;
                    }

                    .conf-desc {
                        color: var(--text-gray-color-primary);
                        font-size: 1rem;
                        text-align: center;
                        margin-bottom: 1.5rem;
                        line-height: 1.6;
                    }

                    .conf-actions {
                        display: flex;
                        gap: 1.5rem;
                        width: 100%;
                    }

                    

                    @media screen and (max-width: 600px) {
                        #${Confirmation.popupId} {
                            padding: 0.5rem;
                        }

                        .conf-wrapper {
                            width: 95%;
                            max-width: 95%;
                        }

                        .conf-content {
                            padding: 2rem;
                            border-radius: 16px;
                        }

                        .conf-icon {
                            width: 80px;
                            height: 80px;
                        }

                        .conf-title {
                            font-size: 1.5rem;
                        }

                        .conf-desc {
                            font-size: 0.9rem;
                            max-width: 100%;
                        }

                        .conf-btn {
                            padding: 1rem;
                            font-size: 1rem;
                        }
                    }
                    #conf-btn-cancel{
                        width: 100% !important;
                        border-radius: var(--border-radius-min) !important;
                        height: 5em !important;
                    }
                    #conf-btn-confirm{
                        width: 100% !important;
                        border-radius: var(--border-radius-min) !important;
                        height: 5em !important;
                    }
                </style>
                <div class="conf-wrapper">
                    <div class="conf-content">
                        <div class="conf-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div class="conf-title">${title}</div>
                        <div class="conf-desc">${message}</div>
                        <div class="conf-actions">
                            <button class="secondary-button" id="conf-btn-cancel">${cancelText}</button>
                            <button class="cta-button" id="conf-btn-confirm">${confirmText}</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(popup);

            // Get DOM elements
            const confirmBtn = popup.querySelector('#conf-btn-confirm');
            const cancelBtn = popup.querySelector('#conf-btn-cancel');

            return new Promise((resolve) => {
                // Confirm button logic
                confirmBtn.onclick = () => {
                    Confirmation.#closePopup();
                    if (typeof onConfirm === 'function') onConfirm();
                    resolve(true);
                };

                // Cancel button logic
                cancelBtn.onclick = () => {
                    Confirmation.#closePopup();
                    if (typeof onCancel === 'function') onCancel();
                    resolve(false);
                };
            });
        }

        static #closePopup() {
            const popup = document.getElementById(Confirmation.popupId);
            if (popup) {
                popup.style.animation = 'fadeOut 0.3s ease-out forwards';
                setTimeout(() => popup.remove(), 300);
            }
        }
    }

    // Expose Confirmation to global scope
    window.Confirmation = Confirmation;
})();

// Exemplo de uso:
// await Confirmation.show({
//   message: 'Tem certeza que deseja excluir este item?',
//   title: 'Confirmação de Exclusão',
//   onConfirm: () => { /* ação após confirmação */ },
//   onCancel: () => { /* ação após cancelamento */ }
// });
