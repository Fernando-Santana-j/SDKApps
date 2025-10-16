// Verifica se a classe já existe no escopo global
if (typeof window.CodeVerifier === 'undefined') {
    window.CodeVerifier = class {
        static sessionKey = 'code_verified';
        static verifying = false;
        static popupId = 'code-verifier-popup';

        static async verify({ onSuccess, onError, force = false, type = null, redirect = null, others = null } = {}) {
            if (!force && sessionStorage.getItem(CodeVerifier.sessionKey) === 'true') {
                if (typeof onSuccess === 'function') onSuccess();
                return true;
            }
            if (CodeVerifier.verifying) return;
            CodeVerifier.verifying = true;

            // Primeiro gerar e enviar o código
            try {
                const res = await fetch('/security/email/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include'
                });
                const data = await res.json();
                
                if (!data.success) {
                    if (typeof onError === 'function') onError(data.data || 'Erro ao enviar código de verificação.');
                    CodeVerifier.verifying = false;
                    return;
                }
            } catch (error) {
                if (typeof onError === 'function') onError('Erro ao enviar código de verificação.');
                CodeVerifier.verifying = false;
                return;
            }

            // Depois mostrar o popup
            CodeVerifier.#showPopup({ onSuccess, onError, type, redirect, others });
        }

        static #showPopup({ onSuccess, onError, type, redirect, others }) {
            // Remove any existing popup
            const old = document.getElementById(CodeVerifier.popupId);
            if (old) old.remove();

            // Create popup container
            const popup = document.createElement('div');
            popup.id = CodeVerifier.popupId;
            popup.innerHTML = `
                <style>
                    #${CodeVerifier.popupId} {
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

                    .cv-wrapper {
                        width: 100%;
                        max-width: 60em;
                        min-width: 320px;
                    }

                    .cv-content {
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

                    .cv-icon {
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

                    .cv-icon svg {
                        width: 50px;
                        height: 50px;
                        color: white;
                        filter: drop-shadow(0 4px 6px rgba(0,0,0,0.2));
                    }

                    .cv-title {
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

                    .cv-desc {
                        color: var(--text-gray-color-primary);
                        font-size: 1rem;
                        text-align: center;
                        margin-bottom: 1.5rem;
                        line-height: 1.6;
                    }

                    .cv-input-container {
                        display: flex;
                        justify-content: center;
                        gap: 1em;
                        margin-bottom: 1.5rem;
                    }

                    .cv-input {
                        width: 3em;
                        height: 3.5em;
                        font-size: 1.6em;
                        text-align: center;
                        border: 2px solid var(--main-color-purple);
                        border-radius: var(--border-radius-min);
                        background: var(--color-text-primary);
                        color: var(--primary-color);
                        transition: all 0.3s ease;
                    }

                    .cv-input:focus {
                        border-color: var(--accent);
                        box-shadow: 0 0 0 3px rgba(138, 43, 226, 0.2);
                        outline: none;
                    }

                    .cv-input.error {
                        border-color: var(--red-color);
                        animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
                    }

                    @keyframes shake {
                        10%, 90% { transform: translate3d(-1px, 0, 0); }
                        20%, 80% { transform: translate3d(2px, 0, 0); }
                        30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                        40%, 60% { transform: translate3d(4px, 0, 0); }
                    }

                    .cv-error {
                        color: var(--red-color);
                        font-size: 0.9rem;
                        text-align: center;
                        height: 1.2rem;
                        opacity: 0;
                        transition: opacity 0.3s ease;
                        margin-bottom: 1rem;
                    }

                    .cv-error.show {
                        opacity: 1;
                    }

                    .cv-btn {
                        width: 100%;
                        padding: 1.2rem;
                        background: linear-gradient(135deg, var(--main-color-purple), var(--accent));
                        color: white;
                        border: none;
                        border-radius: 16px;
                        font-size: 1.1rem;
                        font-weight: 700;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        box-shadow: 
                            0 15px 30px rgba(138, 43, 226, 0.2),
                            0 5px 15px rgba(138, 43, 226, 0.1);
                        text-transform: uppercase;
                        letter-spacing: 1px;
                    }

                    .cv-btn:hover {
                        transform: translateY(-4px);
                        box-shadow: 
                            0 20px 40px rgba(138, 43, 226, 0.3),
                            0 7px 20px rgba(138, 43, 226, 0.15);
                    }

                    .cv-btn:active {
                        transform: scale(0.97);
                    }

                    .cv-btn:disabled {
                        opacity: 0.6;
                        cursor: not-allowed;
                        transform: none;
                    }

                    @media screen and (max-width: 600px) {
                        #${CodeVerifier.popupId} {
                            padding: 0.5rem;
                        }

                        .cv-wrapper {
                            width: 95%;
                            max-width: 95%;
                        }

                        .cv-content {
                            padding: 2rem;
                            border-radius: 16px;
                        }

                        .cv-icon {
                            width: 80px;
                            height: 80px;
                        }

                        .cv-title {
                            font-size: 1.5rem;
                        }

                        .cv-desc {
                            font-size: 0.9rem;
                            max-width: 100%;
                        }

                        .cv-input {
                            width: 2.5em;
                            height: 3em;
                            font-size: 1.4em;
                        }

                        .cv-btn {
                            padding: 1rem;
                            font-size: 1rem;
                        }
                    }
                </style>
                <div class="cv-wrapper">
                    <div class="cv-content">
                        <div class="cv-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <div class="cv-title">Verificação de Email</div>
                        <div class="cv-desc">Digite o código de verificação enviado para seu email.</div>
                        <div class="cv-input-container">
                            <input type="text" maxlength="1" class="cv-input" inputmode="numeric" pattern="[0-9]*">
                            <input type="text" maxlength="1" class="cv-input" inputmode="numeric" pattern="[0-9]*">
                            <input type="text" maxlength="1" class="cv-input" inputmode="numeric" pattern="[0-9]*">
                            <input type="text" maxlength="1" class="cv-input" inputmode="numeric" pattern="[0-9]*">
                            <input type="text" maxlength="1" class="cv-input" inputmode="numeric" pattern="[0-9]*">
                            <input type="text" maxlength="1" class="cv-input" inputmode="numeric" pattern="[0-9]*">
                        </div>
                        <div class="cv-error" id="cv-error"></div>
                        <button class="cv-btn" id="cv-btn-confirm">Verificar Código</button>
                    </div>
                </div>
            `;
            document.body.appendChild(popup);

            // Get DOM elements
            const btn = popup.querySelector('#cv-btn-confirm');
            const inputs = popup.querySelectorAll('.cv-input');
            const errorDiv = popup.querySelector('#cv-error');

            // Setup input behavior
            inputs.forEach((input, index) => {
                // Handle paste
                input.addEventListener('paste', (event) => {
                    event.preventDefault();
                    const pasteData = (event.clipboardData || window.clipboardData).getData('text');
                    const cleanedData = pasteData.replace(/\D/g, '').slice(0, 6);
                    
                    if (cleanedData.length > 0) {
                        cleanedData.split('').forEach((char, i) => {
                            if (i < inputs.length) {
                                inputs[i].value = char;
                            }
                        });
                        if (cleanedData.length === 6) {
                            inputs[5].focus();
                        }
                    }
                });

                // Handle input
                input.addEventListener('input', () => {
                    input.value = input.value.replace(/\D/g, '').slice(0, 1);
                    
                    if (input.value && index < inputs.length - 1) {
                        inputs[index + 1].focus();
                    }
                });

                // Handle backspace
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Backspace' && !input.value && index > 0) {
                        inputs[index - 1].focus();
                    }
                });

                // Handle arrow keys
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'ArrowLeft' && index > 0) {
                        inputs[index - 1].focus();
                    }
                    if (e.key === 'ArrowRight' && index < inputs.length - 1) {
                        inputs[index + 1].focus();
                    }
                });
            });

            // Confirm logic
            btn.onclick = async () => {
                // Reset previous error states
                errorDiv.textContent = '';
                errorDiv.classList.remove('show');
                inputs.forEach(input => input.classList.remove('error'));

                // Get code
                const code = Array.from(inputs).map(input => input.value).join('');

                if (code.length !== 6) {
                    errorDiv.textContent = 'Por favor, digite o código completo.';
                    errorDiv.classList.add('show');
                    inputs.forEach(input => {
                        if (!input.value) input.classList.add('error');
                    });
                    return;
                }

                btn.disabled = true;
                btn.textContent = 'Verificando...';

                try {
                    const res = await fetch('/security/code/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ code, type })
                    });
                    const data = await res.json();
                    
                    if (data.success) {
                        sessionStorage.setItem(CodeVerifier.sessionKey, 'true');
                        CodeVerifier.#closePopup();
                        CodeVerifier.verifying = false;
                        if (typeof onSuccess === 'function') onSuccess();
                        if (redirect) location.href = redirect;
                    } else {
                        errorDiv.textContent = data.data || 'Código inválido.';
                        errorDiv.classList.add('show');
                        inputs.forEach(input => input.classList.add('error'));
                        btn.disabled = false;
                        btn.textContent = 'Verificar Código';
                        if (typeof onError === 'function') onError(data.data);
                    }
                } catch (e) {
                    errorDiv.textContent = 'Erro ao verificar código.';
                    errorDiv.classList.add('show');
                    inputs.forEach(input => input.classList.add('error'));
                    btn.disabled = false;
                    btn.textContent = 'Verificar Código';
                    if (typeof onError === 'function') onError('Erro ao verificar código.');
                }
            };
        }

        static #closePopup() {
            const popup = document.getElementById(CodeVerifier.popupId);
            if (popup) {
                popup.style.animation = 'fadeOut 0.3s ease-out forwards';
                setTimeout(() => popup.remove(), 300);
            }
            CodeVerifier.verifying = false;
        }
    }

    // Add global styles for fade out animation if not already present
    if (!document.getElementById('code-verifier-styles')) {
        const style = document.createElement('style');
        style.id = 'code-verifier-styles';
        style.innerHTML = `
            @keyframes fadeOut {
                from { opacity: 1; backdrop-filter: blur(12px); }
                to { opacity: 0; backdrop-filter: blur(0); }
            }
        `;
        document.head.appendChild(style);
    }
}

// Example usage:
// await CodeVerifier.verify({
//   onSuccess: () => { /* action after success */ },
//   onError: (msg) => { /* action on error */ },
//   force: false, // if true, always asks for code
//   type: 'someType',
//   redirect: '/some-route',
//   others: null
// }); 