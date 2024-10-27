
let serverID = location.pathname.replace('/payment/', "")

$.ajax({
    traditional: true,
    url: '/subscription/exist',
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({
        serverID: serverID,
    }),
    dataType: 'json',
    success: function (response) {
        if (response.success == true) {
            window.location.href = location.origin + '/dashboard';
        }
    },
    error: function (xhr, status, error) {
        console.error(error);
    }
})

let server = null
$.ajax({
    traditional: true,
    url: '/get/server',
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({
        serverID: serverID,
    }),
    dataType: 'json',
    success: function (response) {
        if (response.success == true) {
            let data = response.data
            server = data
            if (data.error == true) {
                document.getElementById('change-containner').innerHTML = `
                <section id="plans-section">
                        <div id="plans-title-containner">
                            <h1 id="plans-title">Seu servidor esta inativo escolha um dos nossos planos!</h1>
                        </div>
                        <div id="plans-row-containner">
                            <div id="plans-row">
                                <div class="plans-col">
                                    <div class="plans-col-top-fit"></div>
                                    <div class="plans-col-wrap">
                                        <div class="plans-col-mini-title">
                                            <p class="mini-title">
                                                Plano inicial
                                            </p>
                                        </div>
                                        <div class="plans-col-precos-containner">
                                            <div class="precos-moeda">R$</div>
                                            <div class="precos-valor">12,99</div>
                                            <div class="precos-tempo">/ Mês</div>
                                        </div>
                                        <div class="plans-col-beneficios">
                                            <p class="beneficios-title">Benefícios:</p>
                                            <ul class="beneficios-list">
                                                <li class="beneficios-list-item">Bot de vendas</li>
                                                <li class="beneficios-list-item">Suporte</li>
                                            </ul>
                                        </div>
                                        <div class="plans-col-button">
                                            <a class="button-assinar" href="#" id="plan-init">Assinar</a>
                                        </div>
                                    </div>
                                </div>
                                <div class="plans-col" id="details">
                                    <div class="plans-col-top-fit"></div>
                                    <div class="plans-col-wrap">
                                        <div class="plans-col-mini-title">
                                            <p class="mini-title">
                                                Dados do seu plano!
                                            </p>
                                        </div>
                                        <div id="data-subscription">
                                            <div id="data-subscription-plan">
                                                <label class="lable-padrao" for="plan-input">Escolha seu plano</label>
                                                <div id="plan-input-containner"></div>
                                                
                                            </div>
                                            <div id="data-subscription-time">
                                                <label class="lable-padrao" for="time-input">Escolha o tempo de assinatura</label>
                                                <div id="plan-time-input-containner"></div>
                                                
                                            </div>
                                            <div id="data-subscription-method">
                                                <label class="lable-padrao" for="method-input">Escolha o metodo de pagamento</label>
                                                <div id="plan-method-input-containner"></div>
                                            </div>
                                        </div>
                                        <div id="final-price">
                                            <p class="desc-col" id="total-price"
                                                style="text-decoration: line-through !important;">R$ 0,00</p>
                                            <h1 class="title-col" id="desconto-price">R$ 0,00</h1>
                                        </div>
                                        <div class="plans-col-button">
                                            <a class="button-assinar" id="confirm-subscription"
                                                href="#">Confirmar</a>
                                        </div>
                                    </div>
                                </div>
                                <div class="plans-col" id="mid-col">
                                    <div class="plans-col-top-fit"></div>
                                    <div class="plans-col-wrap">
                                        <div class="plans-col-mini-title">
                                            <p class="mini-title">
                                                Plano premium
                                            </p>

                                        </div>
                                        <div class="plans-col-precos-containner">
                                            <div class="precos-moeda">R$</div>
                                            <div class="precos-valor">26,99</div>
                                            <div class="precos-tempo">/ Mês</div>
                                        </div>
                                        <div class="plans-col-beneficios">
                                            <p class="beneficios-title">Benefícios:</p>
                                            <ul class="beneficios-list">
                                                <li class="beneficios-list-item">Tudo do primeiro plano e +</li>
                                                <li class="beneficios-list-item">Configurações premium</li>
                                                <li class="beneficios-list-item">Bot personalizavel</li>
                                                <li class="beneficios-list-item">Bot de tickets</li>
                                                <li class="beneficios-list-item">Sistema de cupons</li>
                                            </ul>
                                        </div>
                                        <div class="plans-col-button">
                                            <a class="button-assinar" id="plan-premium" href="#">Assinar</a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                `
                function verifyPrice(type,value) {
                    let plan = type == 'plan' ? value : selectPlanInput.getValue() ? selectPlanInput.getValue().value : ''
                    let time = type == 'time' ? value : selectTimePlanInput.getValue() ? selectTimePlanInput.getValue().value : ''
                    let multply = 1
                    let valueBase = null
                    if (time.trim().length > 0) {
                        if (time.includes("trimestral")) {
                            multply = 3
                        } else if (time.includes("anual")) {
                            multply = 12
                        }
                    }
                    if (plan.trim().length > 0) {
                        if (plan.includes("inicial")) {
                            valueBase = 12.99
                        } else {
                            valueBase = 26.99
                        }
                    }

                    if (valueBase) {
                        let total = valueBase * multply
                        document.getElementById('total-price').innerText = `R$ ${total}`
                        let desconto = multply > 1 ? (total - (total * 0.05)).toFixed(2) : total
                        document.getElementById('desconto-price').innerText = `R$ ${desconto}`
                        return desconto
                    } else {
                        document.getElementById('total-price').innerText = `R$ 0.00`
                        document.getElementById('desconto-price').innerText = `R$ 0.00`
                    }
                }

                let selectPlanInput = new DropdownSingle('plan-input-containner', [
                    {
                        value: 'inicial',
                        name: 'Plano inicial'
                    },
                    {
                        value: 'premium',
                        name: 'Plano premium'
                    }
                ],(selectedOption)=>{
                    
                    verifyPrice('plan',selectedOption.value)
                });
                let selectTimePlanInput = new DropdownSingle('plan-time-input-containner', [
                    {
                        value: 'mensal',
                        name: 'Mensal'
                    },
                    {
                        value: 'trimestral',
                        name: 'Trimestral'
                    },
                    {
                        value: 'anual',
                        name: 'Anual'
                    },
                    
                ],(selectedOption)=>{
                    verifyPrice('time',selectedOption.value)
                });
                let selectMethodPlanInput = new DropdownSingle('plan-method-input-containner', [
                    {
                        value: 'pix',
                        name: 'PIX'
                    },
                    {
                        value: 'stripe',
                        name: 'Cartão ou Boleto'
                    }
                ]);

                
                document.getElementById('plan-init').addEventListener('click', async () => {
                    document.getElementById(`plan-input`).value = 'inicial'
                    successNotify('Plano selecionado!')
                    verifyPrice()
                })
                document.getElementById('plan-premium').addEventListener('click', async () => {
                    document.getElementById(`plan-input`).value = 'premium'
                    successNotify('Plano selecionado!')
                    verifyPrice()
                })
                document.getElementById('confirm-subscription').addEventListener('click', async () => {
                    if (!selectPlanInput.getValue()) {
                        errorNotify('Selecione um plano primeiro!')
                        return
                    }
                    if (!selectTimePlanInput.getValue()) {
                        errorNotify('Selecione um tempo primeiro!')
                        return
                    }
                    if (!selectMethodPlanInput.getValue()) {
                        errorNotify('Selecione um metodo primeiro!')
                        return
                    }
                    let time = selectTimePlanInput.getValue().value
                    let multply = 1
                    if (time.trim().length > 0) {
                        if (time.includes("trimestral")) {
                            multply = 3
                        } else if (time.includes("anual")) {
                            multply = 12
                        }
                    }
                    if (selectMethodPlanInput.getValue().value == 'stripe') {
                        await $.ajax({
                            traditional: true,
                            url: '/subscription/create',
                            type: 'POST',
                            contentType: 'application/json',
                            data: JSON.stringify({
                                serverID: serverID,
                                uid: uid,
                                plan: selectPlanInput.getValue().value,
                                time: multply,
                                host: location.origin
                            }),
                            dataType: 'json',
                            success: function (response) {
                                console.log(response);
                                if (response.success == true) {
                                    window.location.href = response.url;
                                }
                            },
                            error: function (xhr, status, error) {
                                console.error(error);
                            }
                        })
                    } else {
                        await $.ajax({
                            traditional: true,
                            url: '/pix/create',
                            type: 'POST',
                            contentType: 'application/json',
                            data: JSON.stringify({
                                serverID: serverID,
                                uid: uid,
                                plan: selectPlanInput.getValue().value,
                                timeMultiply: multply,
                                time: time,
                                host: location.origin
                            }),
                            dataType: 'json',
                            success: function (response) {
                                if (response.success == true) {
                                    console.log(response);
                                    document.getElementById(`popup-pix-pay-containner`).style.display = 'flex'
                                    document.getElementById(`cpc-pix`).innerText = response.cpc
                                    document.getElementById(`qrcode-image`).src = 'data:image/png;base64,' + response.qrcode
                                }
                            },
                            error: function (xhr, status, error) {
                                console.error(error);
                            }
                        })
                    }
                });



            } else {
                if (server.type == 'stripe') {
                    document.getElementById('change-containner').innerHTML = `
                        <div class="mensage-containner">
                            <div class="mensage-content">
                                <h1 class="title-col">Sua assinatura esta vencida clique no botao abaixo para ser redirecionado para a pagina do stripe para renovar sua assinatura!</h1>
                                <button class="button-padrao" id="signature-situation-button">Renovar</button>
                            </div>
                        </div>
                    `
                    document.getElementById('signature-situation-button').addEventListener('click', async () => {

                        let session = await fetch('/subscription/update', {
                            method: 'POST',
                            credentials: 'include',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                serverID: serverID,
                            }),
                        }).then(response => { return response.json() })
                        if (session.success == true) {
                            successNotify('Você sera redirecionado para a pagina do stripe!')
                            setTimeout(async () => {
                                window.open(session.data, "_blank");
                            }, 3000)
                        } else {
                            errorNotify(session.data)
                        }
                    })
                } else {
                    document.getElementById('change-containner').innerHTML = `
                        <div class="mensage-containner">
                            <div class="mensage-content">
                                <h1 class="title-col">Sua assinatura esta vencida clique no botao abaixo para pagar realizar o pagamento via pix para renovar sua assinatura!</h1>
                                <label class="lable-padrao" for="time-input">Escolha o tempo de assinatura</label>
                                <input required type="text" class="input-padrao" list="time-input-list-renovar" placeholder="Pesquise o tempo..."  id="time-input-renovar">
                                <datalist id="time-input-list-renovar">
                                    <option value="mensal">Mensal</option>
                                    <option value="trimestral">Trimestral</option>
                                    <option value="anual">Anual</option>
                                </datalist>
                                <button class="button-padrao" id="signature-pix-button">Renovar</button>
                            </div>
                        </div>
                    `
                    document.getElementById('time-input-renovar').addEventListener('blur', function () {
                        const inputValue = this.value.toLowerCase();
                        const datalistOptions = Array.from(document.getElementById('time-input-list-renovar').getElementsByTagName('option'));
                        const validOptions = datalistOptions.map(option => option.value.toLowerCase());
                
                        if (!validOptions.includes(inputValue)) {
                            errorNotify('Por favor, selecione um tempo válido da lista.');
                            this.value = '';
                        }
                    });
                    document.getElementById('signature-pix-button').addEventListener('click', async () => {
                        let time = document.getElementById('time-input-renovar').value
                        let plan = document.getElementById('plan-server').value
                        let multply = 1
                        if (time.trim().length > 0) {
                            if (time.includes("trimestral")) {
                                multply = 3
                            } else if (time.includes("anual")) {
                                multply = 12
                            }
                        }
                        await $.ajax({
                            traditional: true,
                            url: '/pix/create',
                            type: 'POST',
                            contentType: 'application/json',
                            data: JSON.stringify({
                                serverID: serverID,
                                uid: uid,
                                plan: plan,
                                time: time,
                                timeMultiply: multply,
                                host: location.origin
                            }),
                            dataType: 'json',
                            success: function (response) {
                                console.log(response);

                                if (response.success == true) {
                                    document.getElementById(`popup-pix-pay-containner`).style.display = 'flex'
                                    document.getElementById(`cpc-pix`).innerText = response.cpc
                                    document.getElementById(`qrcode-image`).src = 'data:image/png;base64,' + response.qrcode
                                }
                            },
                            error: function (xhr, status, error) {
                                console.error(error);
                            }
                        })
                    })
                }
            }
        }
    },
    error: function (xhr, status, error) {
        console.error(error);
    }
})


