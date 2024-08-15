
let serverID = location.pathname.replace('/server/sales/', "")



document.getElementById('add-pix-popup-tutorial').addEventListener('click', () => {
    window.open('https://www.youtube.com/watch?v=jK4JmvWDvAc', "_blank")
})

if (document.getElementById('bank-input-list')) {
    loadBanks();
    async function loadBanks() {
        try {
            const response = await fetch('https://brasilapi.com.br/api/banks/v1');
            const banks = await response.json();
            banks.forEach(bank => {
                if (bank.code != null) {
                    const option = new Option(bank.code + " - " + bank.name, bank.code)
                    document.getElementById('bank-input-list').appendChild(option);
                }
            });
        } catch (error) {
            console.error('Erro ao carregar os bancos:', error);
        }
    }
}




if (document.getElementById('cpf-input')) {
    document.getElementById('cpf-input').addEventListener('input', (e) => {
        let cpf = e.target.value.replace(/\D/g, '');
        cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
        cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
        cpf = cpf.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        e.target.value = cpf;
    });
}
if (document.getElementById('account-number')) {
    document.getElementById('account-number').addEventListener('input', (e) => {
        let numeroConta = e.target.value.replace(/\D/g, '');
        numeroConta = numeroConta.replace(/(\d{8})(\d{1})/, '$1-$2');
        e.target.value = numeroConta;
    })

}


async function verifyData(name, cpf, bank, numero, agencia) {
    const response = await fetch('https://brasilapi.com.br/api/banks/v1');
    const banks = await response.json();
    let findbank = await banks.find(element => element.code == bank)
    if (checkbox.checked == false) {
        errorNotify('Aceite os termos de uso!')
        return false
    }
    if (name.trim().length < 1) {
        errorNotify('Escreva seu nome primeiro!')
        return false
    }
    if (cpf.trim().length <= 13) {
        errorNotify('Escreva seu CPF primeiro!')
        return false
    }
    if (bank.trim().length < 1 || findbank == undefined || findbank == null) {
        errorNotify('Coloque o nome do seu banco primeiro!')
        return false
    }
    if (numero.trim().length <= 9) {
        errorNotify('Escreva o numero da sua conta primeiro!')
        return false
    }
    if (agencia.trim().length <= 3) {
        errorNotify('Escreva o numero da agencia primeiro!')
        return false
    }
    return true
}

if (document.getElementById('save-button')) {
    document.getElementById('save-button').addEventListener('click', async () => {
        let name = document.getElementById('complete-name').value
        let cpf = document.getElementById('cpf-input').value
        let bank = document.getElementById('bank-name-input').value
        let numero = document.getElementById('account-number').value
        let agencia = document.getElementById('bank-agenc').value
        let verify = await verifyData(name, cpf, bank, numero, agencia)
        if (verify == false) { return }


        await $.ajax({
            traditional: true,
            url: '/addDadosBanc',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                name: name,
                cpf: cpf,
                bank: bank,
                numero: numero,
                agencia: agencia,
                serverID: serverID
            }),
            dataType: 'json',
            success: function (response) {
                console.log(response);
                if (response.success == true) {
                    successNotify('Dados Bancarios Salvos!')
                    if (response.data) {
                        successNotify('Vamos te redirecionar para concluir o seu primeiro cadastro!')
                        setTimeout(() => {
                            location.href = response.data
                        }, 800);
                    }
                } else {
                    errorNotify("Erro ao salvar os dados bancarios verifique se digitou corretamente os dados!")
                }
            },
            error: function (xhr, status, error) {
                console.error(error);
            }
        })

    })
}

if (document.getElementById('add-pix-popup-close-button')) {
    document.getElementById('add-pix-popup-close-button').addEventListener('click', () => {
        document.getElementById('add-pix-popup-cotainner').style.display = 'none'
    })
}
if (document.getElementById('add-pix-popup-close')) {
    document.getElementById('add-pix-popup-close').addEventListener('click', () => {
        document.getElementById('add-pix-popup-cotainner').style.display = 'none'
    })
}
if (document.getElementById('pix-add-button')) {

    document.getElementById('pix-add-button').addEventListener('click', () => {
        document.getElementById('add-pix-popup-cotainner').style.display = 'flex'
    })
}
if (document.getElementById('add-pix-button')) {
    document.getElementById('add-pix-button').addEventListener('click', async () => {
        let token = document.getElementById('add-pix-popup-input').value
        document.getElementById('add-pix-popup-input').value = ''
        console.log(token);
        await $.ajax({
            traditional: true,
            url: '/mercadopago/add',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                serverID: serverID,
                token: token
            }),
            dataType: 'json',
            success: function (response) {
                console.log(response);
                if (response.success == true) {
                    successNotify(response.data)
                } else {
                    errorNotify(response.data)
                }
            },
            error: function (xhr, status, error) {
                console.error(error);
            }
        })
    })

}

if (document.getElementById('desativar-pix-button')) {
    document.getElementById('desativar-pix-button').addEventListener('click', async () => {
        await $.ajax({
            traditional: true,
            url: '/mercadopago/desative',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                serverID: serverID,
            }),
            dataType: 'json',
            success: function (response) {
                if (response.success == true) {
                    successNotify(response.data)
                } else {
                    errorNotify(response.data)
                }
            },
            error: function (xhr, status, error) {
                console.error(error);
            }
        })
    })



}









if (document.getElementById('alt-button')) {
    document.getElementById('alt-button').addEventListener('click', async () => {
        try {
            let session = await fetch('/account/modify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    serverID: serverID,
                }),
            }).then(response => { return response.json() })
            if (session.success == true) {
                successNotify('Você sera redirecionado para a pagina de cadastro de novo pagamento!')
                setTimeout(async () => {
                    location.href = session.data
                }, 3000)
            } else {
                errorNotify(session.data)
            }
        } catch (error) {
            console.log(error);
            errorNotify('Erro ao redirecionar para a pagina de pagamento!')
        }
    })
}












// produtos

















document.getElementById('estoque-config-add-button').addEventListener('click', () => {
    let numberEstoque = document.getElementById('estoque-config-row').childElementCount + 1
    var novoDiv = document.createElement("div");
    novoDiv.classList.add("estoque-config-col");
    novoDiv.setAttribute("data-index", numberEstoque);
    novoDiv.innerHTML = `
            <div class="estoque-config-col-top-content">
                <h1 class="title-col">Estoque ${numberEstoque}</h1>
                <div class="estoque-config-exclud-estoque">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0,0,256,256"><g fill-rule="nonzero" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" font-family="none" font-weight="none" font-size="none" text-anchor="none" style="mix-blend-mode: normal"><g transform="scale(2,2)"><path d="M49,1c-1.66,0 -3,1.34 -3,3c0,1.66 1.34,3 3,3h30c1.66,0 3,-1.34 3,-3c0,-1.66 -1.34,-3 -3,-3zM24,15c-7.17,0 -13,5.83 -13,13c0,7.17 5.83,13 13,13h77v63c0,9.37 -7.63,17 -17,17h-40c-9.37,0 -17,-7.63 -17,-17v-52c0,-1.66 -1.34,-3 -3,-3c-1.66,0 -3,1.34 -3,3v52c0,12.68 10.32,23 23,23h40c12.68,0 23,-10.32 23,-23v-63.35937c5.72,-1.36 10,-6.50062 10,-12.64062c0,-7.17 -5.83,-13 -13,-13zM24,21h80c3.86,0 7,3.14 7,7c0,3.86 -3.14,7 -7,7h-80c-3.86,0 -7,-3.14 -7,-7c0,-3.86 3.14,-7 7,-7zM50,55c-1.66,0 -3,1.34 -3,3v46c0,1.66 1.34,3 3,3c1.66,0 3,-1.34 3,-3v-46c0,-1.66 -1.34,-3 -3,-3zM78,55c-1.66,0 -3,1.34 -3,3v46c0,1.66 1.34,3 3,3c1.66,0 3,-1.34 3,-3v-46c0,-1.66 -1.34,-3 -3,-3z"></path></g></g></svg>
                </div>
            </div>
            <div class="estoque-config-inputs-containner">
                <div class="estoque-config-inputs">
                    <div class="estoque-config-input-content-title">
                        <label class="lable-padrao" title="Aqui você vai colocar um titulo para o conteudo que sera fornecido ao usuario!" for="product-price">Titulo do conteudo</label>
                        <input name="estoque-title-input" required placeholder="EX: Email, senha, username" maxlength="20" class="input-padrao title-estoque-input" type="text">
                    </div>
                    <div class="estoque-config-input-content-conteudo">
                        <label class="lable-padrao" title="E aqui onde você ira colocar o conteudo que vai ser enviado para o usuario!" for="product-price">Conteudo</label>
                        <input name="estoque-content-input" required placeholder="EX: test@gmail.com" class="input-padrao conteudo-estoque-input" type="text">
                    </div>
                    <div class="estoque-config-exclud-input">
                        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0,0,256,256"><g fill-rule="nonzero" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" font-family="none" font-weight="none" font-size="none" text-anchor="none" style="mix-blend-mode: normal"><g transform="scale(2,2)"><path d="M49,1c-1.66,0 -3,1.34 -3,3c0,1.66 1.34,3 3,3h30c1.66,0 3,-1.34 3,-3c0,-1.66 -1.34,-3 -3,-3zM24,15c-7.17,0 -13,5.83 -13,13c0,7.17 5.83,13 13,13h77v63c0,9.37 -7.63,17 -17,17h-40c-9.37,0 -17,-7.63 -17,-17v-52c0,-1.66 -1.34,-3 -3,-3c-1.66,0 -3,1.34 -3,3v52c0,12.68 10.32,23 23,23h40c12.68,0 23,-10.32 23,-23v-63.35937c5.72,-1.36 10,-6.50062 10,-12.64062c0,-7.17 -5.83,-13 -13,-13zM24,21h80c3.86,0 7,3.14 7,7c0,3.86 -3.14,7 -7,7h-80c-3.86,0 -7,-3.14 -7,-7c0,-3.86 3.14,-7 7,-7zM50,55c-1.66,0 -3,1.34 -3,3v46c0,1.66 1.34,3 3,3c1.66,0 3,-1.34 3,-3v-46c0,-1.66 -1.34,-3 -3,-3zM78,55c-1.66,0 -3,1.34 -3,3v46c0,1.66 1.34,3 3,3c1.66,0 3,-1.34 3,-3v-46c0,-1.66 -1.34,-3 -3,-3z"></path></g></g></svg>
                    </div>
                </div>
            </div>
            <div class="estoque-config-new-data">
                <button type="button" class="estoque-config-new-data-button">
                    <svg class="SvgFill" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="50px" height="50px" viewBox="0,0,256,256"><g fill-rule="nonzero" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" font-family="none" font-weight="none" font-size="none" text-anchor="none" style="mix-blend-mode: normal"><g transform="scale(5.12,5.12)"><path d="M25,2c-12.6907,0 -23,10.3093 -23,23c0,12.69071 10.3093,23 23,23c12.69071,0 23,-10.30929 23,-23c0,-12.6907 -10.30929,-23 -23,-23zM25,4c11.60982,0 21,9.39018 21,21c0,11.60982 -9.39018,21 -21,21c-11.60982,0 -21,-9.39018 -21,-21c0,-11.60982 9.39018,-21 21,-21zM24.98438,16.98633c-0.55152,0.00862 -0.99193,0.46214 -0.98437,1.01367v6h-6c-0.36064,-0.0051 -0.69608,0.18438 -0.87789,0.49587c-0.18181,0.3115 -0.18181,0.69676 0,1.00825c0.18181,0.3115 0.51725,0.50097 0.87789,0.49587h6v6c-0.0051,0.36064 0.18438,0.69608 0.49587,0.87789c0.3115,0.18181 0.69676,0.18181 1.00825,0c0.3115,-0.18181 0.50097,-0.51725 0.49587,-0.87789v-6h6c0.36064,0.0051 0.69608,-0.18438 0.87789,-0.49587c0.18181,-0.3115 0.18181,-0.69676 0,-1.00825c-0.18181,-0.3115 -0.51725,-0.50097 -0.87789,-0.49587h-6v-6c0.0037,-0.2703 -0.10218,-0.53059 -0.29351,-0.72155c-0.19133,-0.19097 -0.45182,-0.29634 -0.72212,-0.29212z"></path></g></g></svg>
                    Adicionar novo conteudo
                </button>
            </div>
    `
    document.getElementById('estoque-config-row').appendChild(novoDiv)
    addNewData()
})



addNewData()
function addNewData() {
    document.querySelectorAll('.estoque-config-new-data-button').forEach((element) => {
        element.addEventListener('click', () => {
            let DocumentCol = element.parentElement.parentElement
            let estoque = DocumentCol.getAttribute('data-index')
            let ESTQcontainner = DocumentCol.querySelector('.estoque-config-inputs-containner')
            var novoDiv = document.createElement("div");
            novoDiv.setAttribute("data-estoque", estoque);
            novoDiv.setAttribute("data-input", (ESTQcontainner.childElementCount + 1));
            novoDiv.classList.add("estoque-config-inputs");

            novoDiv.innerHTML = `
                <div class="estoque-config-input-content-title">
                    <label class="lable-padrao" title="Aqui você vai colocar um titulo para o conteudo que sera fornecido ao usuario!" for="product-price">Titulo do conteudo</label>
                    <input name="estoque-title-input" required placeholder="EX: Email, senha, username" maxlength="20" class="input-padrao title-estoque-input" type="text">
                </div>
                <div class="estoque-config-input-content-conteudo">
                    <label class="lable-padrao" title="E aqui onde você ira colocar o conteudo que vai ser enviado para o usuario!" for="product-price">Conteudo</label>
                    <input name="estoque-content-input" required placeholder="EX: test@gmail.com" class="input-padrao conteudo-estoque-input" type="text">
                </div>
                <div class="estoque-config-exclud-input">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0,0,256,256"><g fill-rule="nonzero" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" font-family="none" font-weight="none" font-size="none" text-anchor="none" style="mix-blend-mode: normal"><g transform="scale(2,2)"><path d="M49,1c-1.66,0 -3,1.34 -3,3c0,1.66 1.34,3 3,3h30c1.66,0 3,-1.34 3,-3c0,-1.66 -1.34,-3 -3,-3zM24,15c-7.17,0 -13,5.83 -13,13c0,7.17 5.83,13 13,13h77v63c0,9.37 -7.63,17 -17,17h-40c-9.37,0 -17,-7.63 -17,-17v-52c0,-1.66 -1.34,-3 -3,-3c-1.66,0 -3,1.34 -3,3v52c0,12.68 10.32,23 23,23h40c12.68,0 23,-10.32 23,-23v-63.35937c5.72,-1.36 10,-6.50062 10,-12.64062c0,-7.17 -5.83,-13 -13,-13zM24,21h80c3.86,0 7,3.14 7,7c0,3.86 -3.14,7 -7,7h-80c-3.86,0 -7,-3.14 -7,-7c0,-3.86 3.14,-7 7,-7zM50,55c-1.66,0 -3,1.34 -3,3v46c0,1.66 1.34,3 3,3c1.66,0 3,-1.34 3,-3v-46c0,-1.66 -1.34,-3 -3,-3zM78,55c-1.66,0 -3,1.34 -3,3v46c0,1.66 1.34,3 3,3c1.66,0 3,-1.34 3,-3v-46c0,-1.66 -1.34,-3 -3,-3z"></path></g></g></svg>
                </div>`;
            ESTQcontainner.appendChild(novoDiv);

        })
    })
}






document.addEventListener('click', async (event) => {
    const target = event.target;
    if (target.closest('.estoque-config-exclud-input')) {
        const parentDiv = target.closest('.estoque-config-inputs');
        let containnerArr = parentDiv.parentElement.children
        if (parentDiv.parentElement.childElementCount === 1) {
            errorNotify('O estoque precisa de pelo menos 1 dado!');
            return;
        }
        parentDiv.remove();
        Array.from(containnerArr).forEach((inputs, index) => {
            inputs.setAttribute('data-input', index + 1);
        });
    }

    if (target.closest('.estoque-config-exclud-estoque')) {
        const parentDiv = target.closest('.estoque-config-col');
        let containnerArr = parentDiv.parentElement.children
        if (parentDiv.parentElement.childElementCount === 1) {
            errorNotify('E necessario pelo menos 1 estoque!');
            return;
        }
        parentDiv.remove();
        Array.from(containnerArr).forEach((inputs, index) => {
            inputs.setAttribute('data-index', index + 1);
            inputs.querySelector('.title-col').innerText = `Estoque ${index + 1}`
        });
    }


    if (target.closest('#product-excluir-edit-button')) {
        let productID = document.getElementById('confirm-exclud-produto-containner').getAttribute('data-id')
        document.getElementById('confirm-exclud-produto-containner').style.display = 'flex'
        document.getElementById('product-cancel-exclud-button').addEventListener('click', () => {
            document.getElementById('confirm-exclud-produto-containner').style.display = 'none'
        })
    }
    if (target.closest('#product-confirm-exclud-button')) {
        let productID = document.getElementById('confirm-exclud-produto-containner').getAttribute('data-id')
        document.getElementById('confirm-exclud-produto-containner').style.display = 'none'
        let productData = await fetch('/product/delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                productID: productID,
                serverID: serverID
            }),
        }).then(response => { return response.json() })
        if (productData.success == true) {
            successNotify('Produto apagado')
            getProducts()
        } else {
            errorNotify(productData.data)
        }
        document.getElementById('produtos-config-containner').style.display = 'none'

    }




    //produto Config


    if (target.closest('.produtos-configure-button')) {
        let element = target.closest('.produtos-configure-button')
        var productID = element.getAttribute('data-id')
        let productData = await fetch('/product/getOne', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                productID: productID,
                serverID: serverID
            }),
        }).then(response => { return response.json() })
        if (productData.success == true) {
            let data = productData.data
            function formatarMoeda(numeroCentavos) {
                const valorReal = numeroCentavos / 100;
                return valorReal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            }
            document.getElementById('confirm-exclud-produto-containner').setAttribute('data-id', productID)
            document.getElementById('product-price-edit').value = formatarMoeda(data.price)
            document.getElementById('product-desc-edit').value = data.producDesc
            document.getElementById('product-name-edit').value = data.productName
            document.getElementById('logo-preview-edit').src = location.origin + data.productLogo
            document.getElementById('backGround-preview-edit').src = data.backGround == null ? 'https://res.cloudinary.com/dgcnfudya/image/upload/v1704981573/gxorbaldn7fw5ojcv1s0.jpg' : location.origin + data.backGround
            document.getElementById('produtos-config-containner').style.display = 'flex'
            document.getElementById('edit-estoque-inputs-containner').innerHTML = ''
            document.getElementById('produtos-config-content').setAttribute('data-product', productID)
            for (let index = 0; index < data.estoqueModel.conteudo.length; index++) {
                document.getElementById('edit-estoque-inputs-containner').innerHTML += `
                    <div class="estoque-config-inputs">
                        <div class="estoque-config-input-content-title">
                            <label class="lable-padrao" title="Aqui você vai colocar um titulo para o conteudo que sera fornecido ao usuario!" for="product-price">Titulo do conteudo</label>
                            <input value="${data.estoqueModel.conteudo[index].title}" name="edit-estoque-title-input" required placeholder="EX: Email, senha, username" maxlength="20" class="input-padrao title-estoque-input" type="text">
                        </div>
                        <div class="estoque-config-input-content-conteudo">
                            <label class="lable-padrao" title="E aqui onde você ira colocar o conteudo que vai ser enviado para o usuario!" for="product-price">Conteudo</label>
                            <input name="edit-estoque-content-input" required placeholder="EX: test@gmail.com" class="input-padrao conteudo-estoque-input" type="text">
                        </div>
                    </div>
                `
            }
            if (data.estoqueModel.conteudo.length == 1) {
                document.getElementById('add-estoque-txt-containner').style.marginTop = '2em'
                document.getElementById('add-estoque-txt-containner').style.marginBottom = '3em'
                document.getElementById('add-estoque-txt-containner').innerHTML = `
                    <h1 class="title-col">Adicionar estoque por txt!</h1>
                    <div id="add-estoque-txt">
                        <div id="add-estoque-txt-content">
                            <div style="display: flex; flex-direction: column; width: 100%;">
                                <label for="input-title-txt" class="lable-padrao">Titulo dos itens do txt</label>
                                <input type="text" required id="input-title-txt" class="input-padrao" value='${data.estoqueModel.conteudo[0].title}'>
                            </div>

                            <label type="button" class="main-button-product" for="add-txt-input-file" id="add-estoque-text-file">Adiconar arquivo txt!</label>
                            <input multiple="false" type="file" hidden accept=".txt" id="add-txt-input-file">
                        </div>
                        <button type="button" class="main-button-product" id="new-estoque-text">Adiconar estoque por txt!</button>
                    </div>
                `
            }

        }
    }
    if (target.closest('#new-estoque-text')) {
        const fileInput = document.getElementById('add-txt-input-file');
        const files = fileInput.files;
        if (document.getElementById('input-title-txt').value.length <= 0) {
            errorNotify('Adicione um titulo primeiro')
            return
        }
        if (files.length > 0) {
            let file = files[0]
            if (file.name.toLowerCase().endsWith('.txt')) {
                const reader = new FileReader();

                reader.onload = async function (event) {
                    const conteudo = event.target.result;
                    let linhas = conteudo.split('\n').map(linha => linha.replace(/\r/g, '').trim()).filter(linha => linha.length > 0);
                    console.log(linhas);
                    let productID = document.getElementById('produtos-config-content').getAttribute('data-product')
                    let productData = await fetch('/estoque/txt', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            productID: productID,
                            serverID: serverID,
                            txt: linhas,
                            title: document.getElementById('input-title-txt').value
                        }),
                    }).then(response => { return response.json() })
                    if (productData.success == true) {
                        successNotify('Estoque adicionado!')
                    } else {
                        errorNotify('Erro ao adicionar estoque!')
                    }
                };
                reader.readAsText(file);

            } else {
                errorNotify('O arquivo não e um txt valido!')
            }
        } else {
            errorNotify('Adicione um arquivo txt primeiro!')
        }
    }
    if (target.closest('#product-save-edit-button')) {
        let productID = document.getElementById('produtos-config-content').getAttribute('data-product')
        var formData = new FormData();
        if (document.getElementById('logo-input-edit').files[0]) {
            formData.append('productLogo', document.getElementById('logo-input-edit').files[0]);
        }
        formData.append('productName', document.getElementById('product-name-edit').value.trim());
        formData.append('producDesc', document.getElementById('product-desc-edit').value.trim());
        formData.append('serverID', serverID);
        formData.append('productID', productID);
        formData.append('price', parseInt(document.getElementById('product-price-edit').value.replace(/[^\d,]/g, '').replace(',', '').replace('R$ ', '')));
        // if (parseInt(document.getElementById('product-price-edit').value.replace(/[^\d,]/g, '').replace(',', '').replace('R$ ', '')) < 100) {
        //     errorNotify('O valor do produto não pode ser menor que R$ 1,00')
        //     return
        // }
        if (document.getElementById('backGround-input-edit').files[0]) {
            formData.append('backGround', document.getElementById('backGround-input-edit').files[0]);
        }
        document.getElementById('product-price-edit').value = ''
        document.getElementById('product-desc-edit').value = ''
        document.getElementById('product-name-edit').value = ''
        document.getElementById('logo-input-edit').value = ''
        document.getElementById('backGround-input-edit').value = ''
        document.getElementById('produtos-config-containner').style.display = 'none'
        $.ajax({
            traditional: true,
            url: '/product/update',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function (response) {
                if (response.success) {
                    successNotify('Produto Alterado!')
                    getProducts()
                } else {
                    errorNotify(response.data)
                }

            },
            error: function (xhr, status, error) {
                console.error(error);
            }
        })

    }
    if (target.closest('#send-mensage-edit')) {
        let productID = document.getElementById('produtos-config-content').getAttribute('data-product')
        let productData = await fetch('/product/getOne', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                productID: productID,
                serverID: serverID
            }),
        }).then(response => { return response.json() })
        if (productData.success == true) {
            let data = productData.data
            await fetch('/product/mensage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    productID: productID,
                    serverID: serverID,
                    channelID: data.channel
                }),
            }).then(response => { return response.json() }).then((res) => {
                if (res.success == true) {
                    successNotify("Mensagem enviada")
                } else {
                    errorNotify(res.data)
                }
            })
        }
    }

    if (target.closest('#produtos-config-background') || target.closest('#close-button-popup-config-produc')) {
        document.getElementById('produtos-config-containner').style.display = 'none'
    }

    if (target.closest('#new-estoque-create')) {
        let productID = document.getElementById('produtos-config-content').getAttribute('data-product')
        let row = document.querySelector('#edit-estoque-inputs-containner')
        let productData = await fetch('/product/getOne', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                productID: productID,
                serverID: serverID
            }),
        }).then(response => { return response.json() })
        if (productData.success == true) {
            let data = productData.data
            var EstoqueData = {
                estoque: data.estoque.length + 1,
                conteudo: []
            }

            Array.from(row.children).forEach((element, index) => {
                var title = element.querySelector('input[name="edit-estoque-title-input"]').value;
                var content = element.querySelector('input[name="edit-estoque-content-input"]').value;
                EstoqueData.conteudo.push({ index: index + 1, title: title, content: content })
            })

            await fetch('/product/estoqueAdd', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    productID: productID,
                    serverID: serverID,
                    estoque: EstoqueData
                }),
            }).then(response => { return response.json() }).then((res) => {
                if (res.success == true) {
                    for (let index = 0; index < data.estoqueModel.conteudo.length; index++) {
                        document.getElementById('edit-estoque-inputs-containner').innerHTML = `
                            <div class="estoque-config-inputs">
                                <div class="estoque-config-input-content-title">
                                    <label class="lable-padrao" title="Aqui você vai colocar um titulo para o conteudo que sera fornecido ao usuario!" for="product-price">Titulo do conteudo</label>
                                    <input value="${data.estoqueModel.conteudo[index].title}" name="edit-estoque-title-input" required placeholder="EX: Email, senha, username" maxlength="20" class="input-padrao title-estoque-input" type="text">
                                </div>
                                <div class="estoque-config-input-content-conteudo">
                                    <label class="lable-padrao" title="E aqui onde você ira colocar o conteudo que vai ser enviado para o usuario!" for="product-price">Conteudo</label>
                                    <input name="edit-estoque-content-input" required placeholder="EX: test@gmail.com" class="input-padrao conteudo-estoque-input" type="text">
                                </div>
                            </div>
                        `
                    }
                    successNotify('Estoque adicionado!')
                    getProducts()
                } else {
                    errorNotify(res.data)
                }
            })
        }



    }
});





productsConfig()
function productsConfig() {
    document.querySelectorAll('.produtos-configure-button').forEach(element => {

    })
}



async function getProducts() {
    setTimeout(async () => {
        let productData = await fetch('/product/get', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                serverID: serverID
            }),
        }).then(response => { return response.json() })
        if (productData.success == true) {
            function formatarMoeda(numeroCentavos) {
                const valorReal = numeroCentavos / 100;
                return valorReal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            }
            document.getElementById('produtos-row').innerHTML = ''
            productData.data.forEach((element) => {
                document.getElementById('produtos-row').innerHTML += `
                    <div class="produtos-col">
                        <div class="produtos-left">
                            <img src="${location.origin + element.productLogo}">
                            <div class="produtos-name-price-content">
                                <p class="produtos-name" title='${element.productName}'>${element.productName}</p>
                                <p class="produtos-price" title='${formatarMoeda(element.price)}'>${formatarMoeda(element.price)}</p>
                            </div>
                        </div>
                        
                        <div class="produtos-estoque-content">
                            <p class="produtos-estoque-value">${element.estoque.length} em estoque</p>
                        </div>
                        <button data-id="${element.productID}" class="produtos-configure-button">Configure</button>
                    </div>
                    <div class="linha"></div>
                `
            })
        }
    }, 1000)

}

document.getElementById('product-price').addEventListener('input', () => {
    var valor = document.getElementById('product-price').value.replace(/\D/g, ''); // Remove todos os caracteres que não sejam números
    var cents = valor.slice(-2);
    var integerPart = valor.slice(0, -2);
    integerPart = integerPart.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    document.getElementById('product-price').value = integerPart + ',' + cents;
})


document.getElementById('product-price-edit').addEventListener('input', () => {
    var valor = document.getElementById('product-price-edit').value.replace(/\D/g, ''); // Remove todos os caracteres que não sejam números
    var cents = valor.slice(-2);
    var integerPart = valor.slice(0, -2);
    integerPart = integerPart.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    document.getElementById('product-price-edit').value = integerPart + ',' + cents;
})



document.getElementById('channel-name-input').addEventListener('blur', function () {
    const inputValue = this.value.toLowerCase();
    const datalistOptions = Array.from(document.getElementById('channels-input-list').getElementsByTagName('option'));
    const validOptions = datalistOptions.map(option => option.value.toLowerCase());

    if (!validOptions.includes(inputValue)) {
        errorNotify('Por favor, selecione um canal válido da lista.');
        this.value = '';
    }
});
document.getElementById('button-image-input').addEventListener('click', () => {
    let plan = document.getElementById('button-image-input').getAttribute('data-plan')
    if (plan == 1) {
        mensageNotify('O plano 1 não atende a essa função, assine outro plano para obter essa personalização!')
    }
})
document.getElementById('button-backGround-input-edit').addEventListener('click', () => {
    let plan = document.getElementById('button-backGround-input-edit').getAttribute('data-plan')
    if (plan == 1) {
        mensageNotify('O plano 1 não atende a essa função, assine outro plano para obter essa personalização!')
    }
})

document.getElementById('embend-type-input').addEventListener('blur', function () {
    const inputValue = this.value.toLowerCase();
    const datalistOptions = Array.from(document.getElementById('embend-input-list').getElementsByTagName('option'));
    const validOptions = datalistOptions.map(option => option.value.toLowerCase());

    if (!validOptions.includes(inputValue)) {
        errorNotify('Por favor, selecione uma embend válida da lista.');
        this.value = '';
    }
});

function previewImage(input, preview) {
    if (input.files && input.files[0]) {
        let file = input.files[0]
        var fileType = file.type;
        var validImageTypes = ['image/jpeg', 'image/png', 'image/gif'];

        if (validImageTypes.includes(fileType)) {
            var reader = new FileReader();
            reader.onload = function (e) {
                preview.setAttribute('src', e.target.result);
            }
            reader.readAsDataURL(file);
        } else {
            input.value = ''
            errorNotify('O arquivo que você selecinou não e uma imagem!')
        }
    } else {
        input.value = ''
        errorNotify('O arquivo não pode ser carregado tente novamente ou insira outro arquivo!')
    }

}
document.getElementById('logo-input').addEventListener('change', function () {
    previewImage(this, document.getElementById('logo-preview'));
});
document.getElementById('image-input').addEventListener('change', function () {
    previewImage(this, document.getElementById('image-preview'));
});
document.getElementById('logo-input-edit').addEventListener('change', function () {
    previewImage(this, document.getElementById('logo-preview-edit'));
});
document.getElementById('backGround-input-edit').addEventListener('change', function () {
    previewImage(this, document.getElementById('backGround-preview-edit'));
});


document.getElementById('image-input-multi').addEventListener('change', function () {
    previewImage(this, document.getElementById('image-preview-multi'));
});
document.getElementById('logo-input-multi').addEventListener('change', function () {
    previewImage(this, document.getElementById('logo-preview-multi'));
});





function clearCadastroProduct() {
    document.getElementById('product-price').value = ''
    document.getElementById('product-desc').value = ''
    document.getElementById('product-name').value = ''
    document.getElementById('channel-name-input').value = ''
    document.getElementById('logo-input').value = ''
    document.getElementById('image-input').value = ''
    document.getElementById('logo-preview').src = 'https://res.cloudinary.com/dgcnfudya/image/upload/v1704981573/gxorbaldn7fw5ojcv1s0.jpg'
    document.getElementById('image-preview').src = 'https://res.cloudinary.com/dgcnfudya/image/upload/v1704981573/gxorbaldn7fw5ojcv1s0.jpg'

    document.querySelector('.product-cadastro-containner #estoque-config-row').innerHTML = `
        <div class="estoque-config-col" data-index="1"> 
            <h1 class="title-col">Estoque 1</h1>
            <div class="estoque-config-inputs-containner">
                <div class="estoque-config-inputs">
                    <div class="estoque-config-input-content-title">
                        <label class="lable-padrao" title="Aqui você vai colocar um titulo para o conteudo que sera fornecido ao usuario!" for="product-price">Titulo do conteudo</label>
                        <input name="estoque-title-input" required placeholder="EX: Email, senha, username" maxlength="20" class="input-padrao title-estoque-input" type="text">
                    </div>
                    <div class="estoque-config-input-content-conteudo">
                        <label class="lable-padrao" title="E aqui onde você ira colocar o conteudo que vai ser enviado para o usuario!" for="product-price">Conteudo</label>
                        <input name="estoque-content-input" required placeholder="EX: test@gmail.com" class="input-padrao conteudo-estoque-input" type="text">
                    </div>
                </div>
            </div>
            <div class="estoque-config-new-data">
                <button type="button" data-indice="1" class="estoque-config-new-data-button">
                    <svg class="SvgFill" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="50px" height="50px" viewBox="0,0,256,256"><g fill-rule="nonzero" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" font-family="none" font-weight="none" font-size="none" text-anchor="none" style="mix-blend-mode: normal"><g transform="scale(5.12,5.12)"><path d="M25,2c-12.6907,0 -23,10.3093 -23,23c0,12.69071 10.3093,23 23,23c12.69071,0 23,-10.30929 23,-23c0,-12.6907 -10.30929,-23 -23,-23zM25,4c11.60982,0 21,9.39018 21,21c0,11.60982 -9.39018,21 -21,21c-11.60982,0 -21,-9.39018 -21,-21c0,-11.60982 9.39018,-21 21,-21zM24.98438,16.98633c-0.55152,0.00862 -0.99193,0.46214 -0.98437,1.01367v6h-6c-0.36064,-0.0051 -0.69608,0.18438 -0.87789,0.49587c-0.18181,0.3115 -0.18181,0.69676 0,1.00825c0.18181,0.3115 0.51725,0.50097 0.87789,0.49587h6v6c-0.0051,0.36064 0.18438,0.69608 0.49587,0.87789c0.3115,0.18181 0.69676,0.18181 1.00825,0c0.3115,-0.18181 0.50097,-0.51725 0.49587,-0.87789v-6h6c0.36064,0.0051 0.69608,-0.18438 0.87789,-0.49587c0.18181,-0.3115 0.18181,-0.69676 0,-1.00825c-0.18181,-0.3115 -0.51725,-0.50097 -0.87789,-0.49587h-6v-6c0.0037,-0.2703 -0.10218,-0.53059 -0.29351,-0.72155c-0.19133,-0.19097 -0.45182,-0.29634 -0.72212,-0.29212z"></path></g></g></svg>
                    Adicionar novo conteudo
                </button>
            </div>
        </div>
    `
}


document.getElementById("form-prodc").addEventListener("submit", function (event) {
    event.preventDefault();
    if (!document.getElementById('logo-input').files[0]) {
        return errorNotify('Nenhuma logo foi inserida!')
    }

    // coletar os dados do estoque
    let row = document.querySelector('.product-cadastro-containner #estoque-config-row')
    var EstoqueData = [];

    Array.from(row.children).forEach((element, index) => {
        let inputsContainner = element.querySelector('.estoque-config-inputs-containner')
        let model = {
            estoque: index + 1,
            conteudo: []
        }
        Array.from(inputsContainner.children).forEach((inputs, indexinput) => {
            var title = inputs.querySelector('input[name="estoque-title-input"]').value;
            var content = inputs.querySelector('input[name="estoque-content-input"]').value;
            model.conteudo.push({ index: indexinput + 1, title: title, content: content })
        })
        EstoqueData.push(model)
    })
    // coletar o id do canal
    const opcoes = document.getElementById('channels-input-list').querySelectorAll('option');
    let channelID = null;

    opcoes.forEach(option => {
        if (option.value === document.getElementById('channel-name-input').value) {
            channelID = option.getAttribute('data-channel');
        }
    });


    const opcoesEmbend = document.getElementById('embend-input-list').querySelectorAll('option');
    let EmbendID = null;

    opcoesEmbend.forEach(option => {
        if (option.value === document.getElementById('embend-type-input').value) {
            EmbendID = option.getAttribute('data-embend');
        }
    });

    var formData = new FormData();
    formData.append('estoque', JSON.stringify(EstoqueData));
    formData.append('productLogo', document.getElementById('logo-input').files[0]);
    formData.append('channelID', channelID);
    formData.append('productName', document.getElementById('product-name').value.trim());
    formData.append('producDesc', document.getElementById('product-desc').value.trim());
    formData.append('serverID', serverID);
    formData.append('embend', EmbendID)
    formData.append('price', parseInt(document.getElementById('product-price').value.replace(/[^\d,]/g, '').replace(',', '')));
    // if (parseInt(document.getElementById('product-price').value.replace(/[^\d,]/g, '').replace(',', '')) < 100) {
    //     errorNotify('O valor do produto não pode ser menor que R$ 1,00')
    //     return
    // }
    if (document.getElementById('image-input').files[0]) {
        formData.append('backGround', document.getElementById('image-input').files[0]);
    }

    clearCadastroProduct()

    $.ajax({
        traditional: true,
        url: '/product/create',
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        success: function (response) {
            if (response.success) {
                successNotify('Produto criado!')
                getProducts()
            } else {
                errorNotify(response.data)
            }

        },
        error: function (xhr, status, error) {
            console.error(error);
        }
    })
})





document.getElementById('private-log-input').addEventListener('blur', function () {
    const inputValue = this.value.toLowerCase();
    const datalistOptions = Array.from(document.getElementById('private-log-list').getElementsByTagName('option'));
    const validOptions = datalistOptions.map(option => option.value.toLowerCase());

    if (!validOptions.includes(inputValue)) {
        errorNotify('Por favor, selecione um canal válido da lista.');
        this.value = '';
    }
});

document.getElementById('save-button-private-log').addEventListener('click', async () => {
    if (document.getElementById('private-log-input').value <= 0) {
        errorNotify('Selecione um canal primeiro!')
        return
    }
    const opcoes = document.getElementById('private-log-list').querySelectorAll('option');
    let channelID = null;

    opcoes.forEach(option => {
        if (option.value === document.getElementById('private-log-input').value) {
            channelID = option.getAttribute('data-channel');
        }
    });
    let session = await fetch('/sales/privateLog', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            channelID: channelID,
            serverID: serverID
        }),
    }).then(response => { return response.json() })
    if (session.success == true) {
        successNotify(session.data)
    } else {
        errorNotify(session.data)
    }
})


document.getElementById('public-log-input').addEventListener('blur', function () {
    const inputValue = this.value.toLowerCase();
    const datalistOptions = Array.from(document.getElementById('public-log-list').getElementsByTagName('option'));
    const validOptions = datalistOptions.map(option => option.value.toLowerCase());

    if (!validOptions.includes(inputValue)) {
        errorNotify('Por favor, selecione um canal válido da lista.');
        this.value = '';
    }
});

document.getElementById('save-button-public-log').addEventListener('click', async () => {
    if (document.getElementById('public-log-input').value <= 0) {
        errorNotify('Selecione um canal primeiro!')
        return
    }
    const opcoes = document.getElementById('public-log-list').querySelectorAll('option');
    let channelID = null;

    opcoes.forEach(option => {
        if (option.value === document.getElementById('public-log-input').value) {
            channelID = option.getAttribute('data-channel');
        }
    });
    let session = await fetch('/sales/publicLog', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            channelID: channelID,
            serverID: serverID
        }),
    }).then(response => { return response.json() })
    if (session.success == true) {
        successNotify(session.data)
    } else {
        errorNotify(session.data)
    }
})


















let selectProdsList = []

let optionsIsOpen = false
function exibOptionsSelect() {
    optionsIsOpen = true
    let selectProdOptions = document.getElementById('select-product-options-containner')
    let selectProdContent = document.getElementById('select-product-content')
    document.getElementById('select-product-options-containner').style.display = 'flex'
    selectProdOptions.style.width = (selectProdContent.offsetWidth + 3) + 'px'
    selectProdOptions.style.left = (selectProdContent.offsetLeft - 2) + 'px'
    selectProdOptions.style.top = selectProdContent.offsetTop + selectProdContent.offsetHeight + 5 + 'px'
}
document.addEventListener('click', async (event) => {
    const target = event.target;
    if (target.closest('.select-product-col-exclud-button')) {
        let deleteTarget = target.closest('.select-product-col-exclud-button')
        let id = deleteTarget.getAttribute('data-id')

        selectProdsList.splice(selectProdsList.indexOf(id), 1);
        document.getElementById('select-product-row').removeChild(deleteTarget.parentNode.parentNode)
    }
    if (target.closest('.select-product-options-col')) {
        let targetSelect = target.closest('.select-product-options-col')
        let prodID = targetSelect.getAttribute('data-id')
        selectProdsList.push(prodID)

        document.getElementById('select-product-row').innerHTML += `
            <div class="select-product-col">
                <div class="select-product-col-text">
                    <h1 class="select-product-col-title">${targetSelect.querySelector('.select-product-options-col-title').textContent}</h1>
                    <p class="select-product-col-desc">${targetSelect.querySelector('.select-product-options-col-desc').textContent}</p>
                </div>
                <div class="select-product-col-exclud">
                    <button type="button" data-id='${targetSelect.getAttribute('data-id')}' class="select-product-col-exclud-button">X</button>
                </div>
            </div>
        `
        exibOptionsSelect()
        document.getElementById('select-product-options-row').removeChild(targetSelect)
    }
    if (optionsIsOpen == true && !target.closest('.select-product-options-col') && !target.closest('#select-product-focus-button')) {
        document.getElementById('select-product-options-containner').style.display = 'none'
        optionsIsOpen = false
    }
})


document.getElementById('select-product-focus-button').addEventListener('click', async () => {
    exibOptionsSelect()

    let productData = await fetch('/product/get', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            serverID: serverID
        }),
    }).then(response => { return response.json() })
    if (productData.success == true) {
        function formatarMoeda(numeroCentavos) {
            const valorReal = numeroCentavos / 100;
            return valorReal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        }
        document.getElementById('select-product-options-row').innerHTML = ''
        productData.data.forEach((element) => {
            if (!selectProdsList.includes(element.productID)) {
                document.getElementById('select-product-options-row').innerHTML += `
                    <div class="select-product-options-col" data-id='${element.productID}'>
                        <img class="select-product-options-col-image" src="${location.origin + element.productLogo}" alt="">

                        <h1 class="select-product-options-col-title" title="${element.productName}">${element.productName}</h1> 
                        <div style="color: var(--color-text-primary);">•</div>
                        <p class="select-product-options-col-desc" title='${formatarMoeda(element.price)}'>${formatarMoeda(element.price)}</p>
                    </div>
                `
            }
        })
    }
})
document.getElementById('channel-multi-input').addEventListener('blur', function () {
    const inputValue = this.value.toLowerCase();
    const datalistOptions = Array.from(document.getElementById('channel-multi-list').getElementsByTagName('option'));
    const validOptions = datalistOptions.map(option => option.value.toLowerCase());

    if (!validOptions.includes(inputValue)) {
        errorNotify('Por favor, selecione um canal válido da lista.');
        this.value = '';
    }
});
document.getElementById("form-prodc-mult").addEventListener("submit", async function (event) {
    event.preventDefault();
    let serverData = await fetch('/get/server', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            serverID: serverID
        }),
    }).then(response => { return response.json() })
    if (selectProdsList.length <= 0) {
        errorNotify('Selecione um ou mais produtos para continuar!')
        return
    }
    if (document.getElementById('channel-multi-input').value.trim().length <= 0) {
        errorNotify('Selecione um canal para ser enviado o produto!')
        return
    }
    if (document.getElementById('product-name-mult').value.trim().length <= 0) {
        errorNotify('Adicione um nome primeiro!')
        return
    }
    if (document.getElementById('product-desc-multi').value.trim().length <= 0) {
        errorNotify('Adicione uma descrição primeiro!')
        return
    }
    // coletar o id do canal
    const opcoes = document.getElementById('channel-multi-list').querySelectorAll('option');
    let channelID = null;

    opcoes.forEach(option => {
        if (option.value === document.getElementById('channel-multi-input').value) {
            channelID = option.getAttribute('data-channel');
        }
    });




    var formData = new FormData();


    formData.append('channelID', channelID);
    formData.append('productName', document.getElementById('product-name-mult').value.trim());
    formData.append('producDesc', document.getElementById('product-desc-multi').value.trim());
    formData.append('serverID', serverID);
    formData.append('productsList',selectProdsList)
    if (document.getElementById('logo-input-multi').files[0]) {
        formData.append('productLogo', document.getElementById('logo-input-multi').files[0]);
    }
    if (document.getElementById('image-input-multi').files[0]) {
        formData.append('backGround', document.getElementById('image-input-multi').files[0]);
    }

    document.getElementById('select-product-row').innerHTML = ''
    selectProdsList = []
    document.getElementById('logo-input-multi').value = ''
    document.getElementById('product-name-mult').value = ''
    document.getElementById('channel-multi-input').value = ''
    document.getElementById('product-desc-multi').value = ''
    document.getElementById('image-preview-multi').src = 'https://res.cloudinary.com/dgcnfudya/image/upload/v1704981573/gxorbaldn7fw5ojcv1s0.jpg'
    document.getElementById('logo-preview-multi').src = 'https://res.cloudinary.com/dgcnfudya/image/upload/v1704981573/gxorbaldn7fw5ojcv1s0.jpg'
    $.ajax({
        traditional: true,
        url: '/product/mult',
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        success: function (response) {
            if (response.success) {
                successNotify('Multiproduto criado!')
            } else {
                errorNotify(response.data)
            }

        },
        error: function (xhr, status, error) {
            console.error(error);
        }
    })
})