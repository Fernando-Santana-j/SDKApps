const confetti = new Confetti(document.getElementById('confetti'));
const feedbackOnboarding = new feedbackAction('#feedback-onboarding-containner')

















document.getElementById('link-copy-button').addEventListener('click', (e) => {
    copyText(e.target.innerText)
})



document.getElementById('display-name').addEventListener('input', (event) => {
    updateOnboardingData('displayName', event.target.value)
})

document.getElementById('id-name').addEventListener('input', (event) => {
    updateOnboardingData('idName', event.target.value)
})





async function updateLinesStep() {
    let step = parseInt(localStorage.getItem('OnboardingStep'))
    if (step) {

        await document.querySelectorAll('.progress-bar-line').forEach(elemento => {
            if (elemento.classList.contains('active')) {
                elemento.classList.remove('active');
            }
        });
        for (let i = 1; i <= step; i++) {
            let line = document.getElementById(`progress-bar-line-${i}`)
            if (line) {
                line.classList.add('active')
            }
        }
    }
}















document.addEventListener('DOMContentLoaded', () => {
    new NameChecker('id-name', {
        colecao: 'stores',
        itemID: 'IDName'
    }, async (result) => {
        let ActualInput = document.getElementById('id-name')

        errorToolTip.hide('id-name');
        ActualInput.setAttribute('error', null)
        if (result === null) {
            errorToolTip.hide('id-name');
            ActualInput.setAttribute('error', null)
            return;
        }

        if (result.error) {
            console.error(result.error);
            errorToolTip.hide('id-name');
            ActualInput.setAttribute('error', null)
            return;
        }

        if (ActualInput.value.trim().length > 30) {

            errorToolTip.show('id-name', 'Nome de identificação muito longo')
            ActualInput.setAttribute('error', 'long')
        } else {
            if (ActualInput.hasAttribute('error') && ActualInput.getAttribute('error') == 'long') {
                ActualInput.setAttribute('error', null)
            }
        }

        if (ActualInput.value.trim().length < 5) {
            errorToolTip.show('id-name', 'Nome de identificação muito curto')
            ActualInput.setAttribute('error', 'short')
        } else {
            if (ActualInput.hasAttribute('error') && ActualInput.getAttribute('error') == 'short') {
                ActualInput.setAttribute('error', null)
            }
        }

        if (!result.isAvailable) {
            errorToolTip.show('id-name', 'Nome de identificação indisponível')
            ActualInput.setAttribute('error', 'exist')
        } else {
            if (ActualInput.hasAttribute('error') && ActualInput.getAttribute('error') == 'exist') {
                ActualInput.setAttribute('error', null)
            }
        }
    })


    let timeoutDisplayName = null
    document.getElementById('display-name').addEventListener('input', () => {
        document.getElementById('display-name').value = document.getElementById('display-name').value.replace(/[!@#$%^*)_=>?<,./'";:\\|`~(&)]/g, "")
        clearTimeout(timeoutDisplayName)
        timeoutDisplayName = setTimeout(() => {
            checkDisplayName()
        }, 500)
    })

    document.getElementById('id-name').addEventListener('input', () => {
        document.getElementById('id-name').value = document.getElementById('id-name').value.replace(/[!@#$%^*)_=>?<,./'";:\\|`~(&)]/g, "")
        document.getElementById('id-name').value = document.getElementById('id-name').value.replace(/\s+/g, '-')
    })

    function checkDisplayName() {
        let ActualInput = document.getElementById('display-name')
        if (ActualInput.value.trim().length > 30) {

            errorToolTip.show('display-name', 'Nome de identificação muito longo')
            ActualInput.setAttribute('error', 'long')
        } else {
            if (ActualInput.hasAttribute('error') && ActualInput.getAttribute('error') == 'long') {
                ActualInput.setAttribute('error', null)
            }
        }

        if (ActualInput.value.trim().length < 5) {
            errorToolTip.show('display-name', 'Nome de identificação muito curto')
            ActualInput.setAttribute('error', 'short')
        } else {
            if (ActualInput.hasAttribute('error') && ActualInput.getAttribute('error') == 'short') {
                ActualInput.setAttribute('error', null)
            }
        }
    }

})

























document.addEventListener('DOMContentLoaded', async () => {
    gsap.set("#step-1", { x: "100vw" });
    gsap.set("#step-2", { x: "100vw" });
    gsap.set("#step-3", { x: "100vw" });
    gsap.set("#step-4", { x: "100vw" });
    gsap.set("#step-5", { x: "100vw" });
    gsap.set("#step-6", { x: "100vw" });
    gsap.set("#step-7", { x: "100vw" });
    gsap.set("#step-8", { x: "100vw" });
    let step = localStorage.getItem('OnboardingStep')
    if (step) {
        let stepElement = document.getElementById(`step-${step}`)
        if (stepElement) {
            gsap.set(stepElement, { x: 0 });
            updateLinesStep()
            if (step == 6) {
                setTimeout(async () => {
                    confetti.start('#step-6');
                }, 1000)

                setTimeout(async () => {
                    await confetti.pause()
                    confetti.clear();
                }, 15000)
            }
        }
    } else {
        await localStorage.setItem('OnboardingStep', 1)
        gsap.set("#step-1", { x: 0 });
        updateLinesStep()
    }
    let onboardingData = localStorage.getItem('OnboardingData')
    if (onboardingData) {
        onboardingData = JSON.parse(onboardingData)
        if (onboardingData.displayName) {
            document.getElementById('display-name').value = onboardingData.displayName
        }
        if (onboardingData.idName) {
            document.getElementById('id-name').value = onboardingData.idName
        }
    }
})



document.addEventListener('click', async (event) => {
    let target = event.target
    if (target.closest('.progress-bar-line') && target.classList.contains('active')) {
        let step = target.id.replace('progress-bar-line-', '')
        let currentStep = parseInt(localStorage.getItem('OnboardingStep'))
        if (currentStep == step) return;
        const currentElement = document.getElementById(`step-${currentStep}`);
        const prevElement = document.getElementById(`step-${step}`);

        if (prevElement) {
            const tl = gsap.timeline({
                defaults: {
                    duration: 0.7,
                    ease: "power2.inOut"
                }
            });

            // Animar saída da etapa atual
            tl.to(currentElement, {
                x: "100vw",
                opacity: 0,
                scale: 0.8,
                rotationY: 15,
                transformOrigin: "center left"
            });

            // Animar entrada da etapa anterior
            tl.fromTo(prevElement,
                {
                    x: "-100vw",
                    opacity: 0,
                    scale: 0.8,
                    rotationY: -15,
                    transformOrigin: "center right"
                },
                {
                    x: "0%",
                    opacity: 1,
                    scale: 1,
                    rotationY: 0
                },
                "-=0.5"
            );


        }

        await localStorage.setItem('OnboardingStep', step);
        updateLinesStep()
    }

})




document.addEventListener('click', async (event) => {
    let target = event.target
    let buttonNext = target.closest('.onboarding-button-next')
    let buttonPrev = target.closest('.onboarding-button-prev')
    if (buttonNext || buttonPrev) {

        if (buttonPrev && buttonPrev.id.includes('prev-step')) {
            let step = parseInt(buttonPrev.id.replace('prev-step-', ''))
            if (step) {
                function prevStep(currentStep) {
                    errorToolTip.hideAll();
                    const currentElement = document.getElementById(`step-${currentStep}`);
                    const prevElement = document.getElementById(`step-${currentStep - 1}`);

                    if (prevElement) {
                        const tl = gsap.timeline({
                            defaults: {
                                duration: 0.7,
                                ease: "power2.inOut"
                            }
                        });

                        // Animar saída da etapa atual
                        tl.to(currentElement, {
                            x: "100vw",
                            opacity: 0,
                            scale: 0.8,
                            rotationY: 15,
                            transformOrigin: "center left"
                        });

                        // Animar entrada da etapa anterior
                        tl.fromTo(prevElement,
                            {
                                x: "-100vw",
                                opacity: 0,
                                scale: 0.8,
                                rotationY: -15,
                                transformOrigin: "center right"
                            },
                            {
                                x: "0%",
                                opacity: 1,
                                scale: 1,
                                rotationY: 0
                            },
                            "-=0.5"
                        );


                    }
                }
                switch (step) {
                    case 1:
                        await localStorage.setItem('OnboardingStep', 1);
                        updateLinesStep()
                        prevStep(2)
                        break;
                    case 2:
                        await localStorage.setItem('OnboardingStep', 2);
                        updateLinesStep()
                        prevStep(3)
                        break;
                    case 3:
                        await localStorage.setItem('OnboardingStep', 3);
                        updateLinesStep()
                        prevStep(4)
                        break;
                    case 4:
                        await localStorage.setItem('OnboardingStep', 4);
                        updateLinesStep()
                        prevStep(5)
                        break;
                    case 5:
                        await localStorage.setItem('OnboardingStep', 5);
                        updateLinesStep()
                        prevStep(6)
                        break;
                }
            }
        }

        if (buttonNext && buttonNext.id.includes('next-step')) {
            let step = parseInt(buttonNext.id.replace('next-step-', ''))
            if (step) {
                function nextStep(currentStep) {
                    errorToolTip.hideAll();
                    const currentElement = document.getElementById(`step-${currentStep}`);
                    const nextElement = document.getElementById(`step-${currentStep + 1}`);

                    if (nextElement) {
                        const tl = gsap.timeline({
                            defaults: {
                                duration: 0.7,
                                ease: "power2.inOut"
                            }
                        });

                        // Animar saída da etapa atual
                        tl.to(currentElement, {
                            x: "-100vw",
                            opacity: 0,
                            scale: 0.8,
                            rotationY: -15,
                            transformOrigin: "center right"
                        });

                        // Animar entrada da próxima etapa
                        tl.fromTo(nextElement,
                            {
                                x: "100vw",
                                opacity: 0,
                                scale: 0.8,
                                rotationY: 15,
                                transformOrigin: "center left"
                            },
                            {
                                x: "0%",
                                opacity: 1,
                                scale: 1,
                                rotationY: 0
                            },
                            "-=0.5"
                        );
                    }
                }
                
                switch (step) {
                    case 2:
                        await localStorage.setItem('OnboardingStep', 2);
                        nextStep(1)
                        updateLinesStep()
                        break
                    case 3:
                        if (!document.getElementById('display-name').value.trim() || !document.getElementById('id-name').value.trim()) {
                            errorNotify('Adicione o nome e a descrição primeiro!')
                            return
                        }

                        if (document.getElementById('id-name').hasAttribute('error') && document.getElementById('id-name').getAttribute('error') != null) {
                            switch (document.getElementById('id-name').getAttribute('error')) {
                                case 'exist':
                                    errorNotify('O nome de identificação já existe!')
                                return
                                    
                                case 'long':
                                    errorNotify('O nome de identificação é muito grande!')
                                return
                                case 'short':
                                    errorNotify('O nome de identificação é muito pequeno!')
                                return
                            }
                        }
                        if (document.getElementById('display-name').hasAttribute('error') && document.getElementById('display-name').getAttribute('error') != null) {
                            switch (document.getElementById('display-name').getAttribute('error')) {
                                case 'long':
                                    errorNotify('O nome de identificação é muito grande!')
                                return
                                case 'short':
                                    errorNotify('O nome de identificação é muito pequeno!')
                                return
                            }
                        }
                        await localStorage.setItem('OnboardingStep', 3);
                        nextStep(2)
                        updateLinesStep()
                        break;
                    case 4:
                        let logoInput = document.getElementById('image-logo-input')
                        let backgroundInput = document.getElementById('image-background-input')
                        if (logoInput.files.length == 0) {
                            errorNotify('Adicione uma logo primeiro!')
                            return
                        }
                        if (backgroundInput.files.length == 0) {
                            errorNotify('Adicione um plano de fundo primeiro!')
                            return
                        }

                        await localStorage.setItem('OnboardingStep', 4);
                        nextStep(3)
                        updateLinesStep()
                        break;
                    case 5:

                        let name = document.getElementById('Rname')
                        let uid = document.getElementById('identify-user')
                        let street = document.getElementById('adress-street')
                        let number = document.getElementById('address-number')
                        errorToolTip.hideAll()
                        let error = false
                        if (name.value.trim().length <= 0 ) {
                            errorToolTip.show('name', 'Digite um nome')
                            error = true
                        }
                        
                        if (street.value.trim().length <= 0 ) {
                            errorToolTip.show('adress-street', 'Digite um endereço')
                            error = true
                        }
                        if (number.value.trim().length <= 0 ) {
                            errorToolTip.show('address-number', 'Digite um numero')
                            error = true
                        }

                        if (name.value.trim().length >= 50 ) {
                            errorToolTip.show('name', 'Nome muito grande')
                            error = true
                        }
                        if (validarDocumento(uid.value).valido == false) {    
                            errorToolTip.show('identify-user', 'CPF ou CNPJ inválido')
                            error = true
                        }
                        if (street.value.trim().length >= 30 ) {
                            errorToolTip.show('adress-street', 'Endereço muito grande')
                            error = true
                        }
                        if (number.value.trim().length >= 10 ) {
                            errorToolTip.show('address-number', 'Numero muito grande')
                            error = true
                        }

                        if (error == true) return;

                        await localStorage.setItem('OnboardingStep', 5);
                        updateLinesStep()
                        nextStep(4)
                        break;
                    case 6:
                        await localStorage.setItem('OnboardingStep', 6);
                        updateLinesStep()
                        nextStep(5)
                        setTimeout(async () => {
                            confetti.start('#step-6');
                        }, 1000)

                        setTimeout(async () => {
                            await confetti.pause()
                            confetti.clear();
                        }, 15000)
                        break;
                }
            }
        }
    }

})