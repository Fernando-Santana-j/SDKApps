
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









if (document.getElementById('alt-button')) {
    document.getElementById('alt-button').addEventListener('click', async () => {
        try {
            let session = await fetch('/account/modify', {
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























document.addEventListener('click', async (event) => {
    const target = event.target;

    if (target.closest('#desativar-pix-button')) {
        passVerify(()=>{
            $.ajax({
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
        },'admin',null)
    }
    if (target.closest('#add-pix-button')) {
        passVerify(()=>{
            let token = document.getElementById('add-pix-popup-input').value
            document.getElementById('add-pix-popup-input').value = ''
            $.ajax({
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
                        document.getElementById('add-pix-popup-cotainner').style.display = 'none'
                        successNotify(response.data)
                    } else {
                        errorNotify(response.data)
                    }
                },
                error: function (xhr, status, error) {
                    console.error(error);
                }
            })
        },'admin',null)
    }
});


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
        credentials: 'include',
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
        credentials: 'include',
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







let multiCreateProductsSelect = new DropdownMulti('select-menu-multi-product',productsString);
let channelInputCreateProduct = new DropdownSingle('select-menu-channel-create-product', channelItensSelectMenu);
let cargoInputCreateProduct = new DropdownSingle('select-cargo-assinatura', cargoItensSelectMenu);
//{ label: 'Assinatura', value: 'subscription', title: 'Use esse tipo para criar produtos que sejam assinaturas!', rightImage: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-info"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>',imageClass:'infos-select-list', imageId:'info-select-assinatura' },
let createProductOptions = {}
const productTypeOptions = [
    { label: 'Normal', value: 'normal', title: 'Use esse tipo para criar um produto unico e com conteudos diferentes!', checked: true, rightImage: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-info"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>',imageClass:'infos-select-list', imageId:'info-select-normal' },
    { label: 'Single', value: 'single', title: 'Use esse tipo para criar produtos com mesmo conteudo!', rightImage: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-info"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>',imageClass:'infos-select-list', imageId:'info-select-single' },
    { label: 'Multiple', value: 'multiple', title: 'Use para criar uma mensagem com varios produtos selecionaveis!', rightImage: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-info"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>',imageClass:'infos-select-list', imageId:'info-select-multiple' }
];

const selectProductType = new RadioList('type-product-select-content', 'productSelectType' ,productTypeOptions, (selectedOption, index) => {
    let estoqueNormalContainner = document.getElementById('cadastro-estoque-config-containner')
    let estoqueNumberContainner = document.getElementById('cadastro-number-estoque-config-containner')
    let estoqueAssinaturaContainner = document.getElementById('cadastro-assinatura-estoque-config-containner')
    let estoqueMultiContainner = document.getElementById('cadastro-estoque-multi-product')
    function HideAll() {
        estoqueNormalContainner.style.display = 'none';
        estoqueNumberContainner.style.display = 'none';
        estoqueAssinaturaContainner.style.display = 'none';
        estoqueMultiContainner.style.display = 'none';
        document.getElementById('product-price-content').style.display = 'block';
    }
    switch (selectedOption.value) {
        case 'normal':
            HideAll()
            estoqueNormalContainner.style.display = 'flex';
            break;
        case 'single':
            HideAll()
            estoqueNumberContainner.style.display = 'flex';
            break;
        case 'subscription':
            HideAll()
            estoqueAssinaturaContainner.style.display = 'flex';
            break;
        case 'multiple':
            HideAll()
            document.getElementById('product-price-content').style.display = 'none';
            estoqueMultiContainner.style.display = 'flex';
            break;
        default:
            break;
    } 
});



const embendTypeOptions = [
    { label: 'Mensagem', value: '0', title: 'Use esse tipo para criar uma mensagem de embend padrao do discord!', checked: true, rightImage: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-info"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>',imageClass:'infos-select-list', imageId:'info-select-mensagem' },
    { label: 'Imagem', value: '1', title: 'Use esse tipo para criar uma mensagem em formato de imagem, mais moderna e visualmente agradavel!', rightImage: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-info"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>',imageClass:'infos-select-list', imageId:'info-select-imagem' },
 
];

const selectEmbendType = new RadioList('type-embend-select-content', 'embendSelectType' ,embendTypeOptions);

const embendTypeEditOptions = [
    { label: 'Mensagem', value: '0', title: 'Use esse tipo para criar uma mensagem de embend padrao do discord!', checked: true, rightImage: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-info"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>',imageClass:'infos-select-list', imageId:'info-select-mensagem' },
    { label: 'Imagem', value: '1', title: 'Use esse tipo para criar uma mensagem em formato de imagem, mais moderna e visualmente agradavel!', rightImage: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-info"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>',imageClass:'infos-select-list', imageId:'info-select-imagem' },
 
];

const selectEmbendTypeEdit = new RadioList('produtos-config-new-style-content', 'embendSelectTypeEdit' ,embendTypeEditOptions);

const subscriptionTimeOptions = [
    { label: 'Horas', value: '0', title: 'Use esse tipo para criar uma mensagem de embend padrao do discord!'},
    { label: 'Dias', value: '1', title: 'Use esse tipo para criar uma mensagem em formato de imagem, mais moderna e visualmente agradavel!'},
    { label: 'Meses', value: '2', title: 'Use esse tipo para criar uma mensagem de embend padrao do discord!', checked: true},
    { label: 'Vitalicio', value: '3', title: 'Use esse tipo para criar uma mensagem em formato de imagem, mais moderna e visualmente agradavel!'},
];

const selectsubscriptionTimeOptions = new RadioList('subscription-time-select-content', 'subscriptionSelectTime' ,subscriptionTimeOptions);



document.addEventListener('change', (event) => {
    if (event.target.name == 'type-time-select') {
        let timeInput = document.getElementById('time-number-input-assinatura')
        if (event.target.id == 'time-option-vitalicio') {
            timeInput.style.opacity = 0.8
            timeInput.setAttribute('disabled','')
        }else{
            timeInput.style.opacity = 1
            timeInput.removeAttribute('disabled','')
        }
    }
    if (event.target.id == 'select-null-stock-checkbox') {
        let inputTitle = document.getElementById('estoque-config-input-title-txt')
        let buttonFile = document.getElementById('estoque-config-text-file')
        let inputFile = document.getElementById('estoque-config-input-file')
        if (event.target.checked) {
            createProductOptions.estoque = false
            inputTitle.setAttribute('disabled','')
            inputTitle.style.opacity = 0.5
            buttonFile.setAttribute('disabled','')
            buttonFile.style.opacity = 0.5
            inputFile.setAttribute('disabled','')
            buttonFile.style.cursor = 'not-allowed'
        }else{
            createProductOptions.estoque = true
            inputTitle.removeAttribute('disabled')
            inputTitle.style.opacity = 1
            buttonFile.removeAttribute('disabled')
            buttonFile.style.opacity = 1
            inputFile.removeAttribute('disabled') 
            buttonFile.style.cursor = 'pointer'
        }
    }
});


//TODO evento para exibir a informacao do tipo de produto e estilo

document.querySelectorAll('.infos-select-list').forEach((element) => {
    element.addEventListener('mousemove', (event) => {
        let infosSelectPopup = document.getElementById('infos-select-popup')
        infosSelectPopup.style.left = `${(event.pageX + 20) - 448}px`; 
        infosSelectPopup.style.top = `${event.pageY + 30}px`; 
        infosSelectPopup.style.opacity = 1;
        infosSelectPopup.style.zIndex = 9999999;
        infosSelectPopup.style.animation = 'scale-up-center 0.3s forwards';
        
        let name = element.id.replace('info-select-','')
        let type = name == 'imagem' ? 'Image' : 'Embend' 
        name = name == 'imagem' || name == 'mensagem' ? 'normal' : name 

        document.getElementById('info-select-popup-img').src = `/public/img/${name + 'Product' + type}.jpeg`
        document.getElementById('info-select-popup-text').innerText = "Abaixo está a prévia do tipo " + name + ': '
    })
    element.addEventListener('mouseleave', () => {
        let infosSelectPopup = document.getElementById('infos-select-popup')
        infosSelectPopup.style.animation = 'scale-down-center 0.3s forwards';
        setTimeout(() => {
            infosSelectPopup.style.opacity = 0;
            infosSelectPopup.style.zIndex = -1;
        },60)
        
    });
})


//TODO Formatacao do input de preco
document.getElementById('product-price').addEventListener('input', () => {
    var valor = document.getElementById('product-price').value.replace(/\D/g, ''); 
    var cents = valor.slice(-2);
    var integerPart = valor.slice(0, -2);
    integerPart = integerPart.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    document.getElementById('product-price').value = integerPart + ',' + cents;
})


document.getElementById('product-config-new-price').addEventListener('input', () => {
    var valor = document.getElementById('product-config-new-price').value.replace(/\D/g, ''); 
    var cents = valor.slice(-2);
    var integerPart = valor.slice(0, -2);
    integerPart = integerPart.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    document.getElementById('product-config-new-price').value = integerPart + ',' + cents;
})





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

document.getElementById('new-logo-input').addEventListener('change', function () {
    previewImage(this, document.getElementById('new-logo-preview'));
});

document.getElementById('new-background-input').addEventListener('change', function () {
    previewImage(this, document.getElementById('new-background-preview'));
});

document.getElementById('estoque-config-input-file').addEventListener('change', function () {
    let file = this.files[0]
    if (!file.name.endsWith('.txt')) return errorNotify('O arquivo que você selecionou não é um txt!');
    document.getElementById('estoque-config-txt-file-selected').innerText = file.name
});

document.getElementById('produtos-estoque-edit-normal-txt-file').addEventListener('change', function () {
    let file = this.files[0]
    if (!file.name.endsWith('.txt')) return errorNotify('O arquivo que você selecionou não é um txt!');
    document.getElementById('estoque-config-txt-file-selected-edit').innerText = file.name
});

function clearCadastroProduct() {
    document.getElementById('product-price').value = ''
    document.getElementById('product-desc').value = ''
    document.getElementById('product-name').value = ''
    document.getElementById('logo-input').value = ''
    document.getElementById('image-input').value = ''
    document.getElementById('logo-preview').src = 'https://res.cloudinary.com/dgcnfudya/image/upload/v1704981573/gxorbaldn7fw5ojcv1s0.jpg'
    document.getElementById('image-preview').src = 'https://res.cloudinary.com/dgcnfudya/image/upload/v1704981573/gxorbaldn7fw5ojcv1s0.jpg'
    document.getElementById('estoque-config-input-title-txt').value = ''
    document.getElementById('estoque-config-input-file').value = ''
    document.getElementById('estoque-config-txt-file-selected').innerText = 'Nenhum arquivo selecionado :('
    document.getElementById('content-number-estoque-input').value = ''
    document.getElementById('number-estoque-input').value = ''
    document.getElementById('time-number-input-assinatura').value = ''
    channelInputCreateProduct.clearSelection()
    cargoInputCreateProduct.clearSelection()
    multiCreateProductsSelect.clearSelection()
}

document.getElementById('clear-product-cadastro').addEventListener('click', () => {
    clearCadastroProduct()
})

async function getProducts() {
    setTimeout(async () => {
        let productData = await fetch('/product/get', {
            method: 'POST',
            credentials: 'include',
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
                            <p class="produtos-estoque-value">${'typeProduct' in element ? element.typeProduct == 'normal' ? element.estoque.length + ' em estoque' : element.typeProduct == 'multiple' ? element.estoque : element.estoque + ' em estoque' : element.estoque.length + ' em estoque'}</p>
                        </div>
                        <button data-id='${element.productID}' class="produtos-configure-button">Configure</button>
                    </div>
                    <div class="linha"></div>
                `
            })
        }
    }, 1000)

}

document.getElementById('save-product-cadastro').addEventListener('click', async() => {
    let name = document.getElementById('product-name').value
    let desc = document.getElementById('product-desc').value
    let price = document.getElementById('product-price').value.replace(/\D/g, '')
    const typeProduct = await selectProductType.getValue().value
    let channelID = channelInputCreateProduct.getValue()


    if (!document.getElementById('logo-input').files[0]) return errorNotify('Nenhuma logo foi inserida!');
    if (name.trim().length <= 0)return errorNotify('Escreva o nome do seu produto primeiro!');
    if (desc.trim().length <= 0)return errorNotify('Escreva a descrição do seu produto primeiro!');
    if (price.trim().length <= 0 && typeProduct != 'multiple')return errorNotify('Escreva o valor do seu produto primeiro!');
    if (channelID == null) return errorNotify('Escolha o canal do seu produto primeiro!');

    
    var formData = new FormData();

    await formData.append('price', parseInt(document.getElementById('product-price').value.replace(/[^\d,]/g, '').replace(',', '')));
    await formData.append('productName', document.getElementById('product-name').value.trim());
    await formData.append('producDesc', document.getElementById('product-desc').value.trim());
    await formData.append('serverID', serverID);
    await formData.append('channelID', channelID.value);
    await formData.append('typeProduct', typeProduct);
    await formData.append('productLogo', document.getElementById('logo-input').files[0]);
    await formData.append('embendType', await selectEmbendType.getValue().value);
    
    if (document.getElementById('image-input').files[0]) {
        formData.append('backGround', document.getElementById('image-input').files[0]);
    }

    switch (typeProduct) {
        case 'normal':
            let normalTitle = document.getElementById('estoque-config-input-title-txt').value
            let txtFileEstoque = document.getElementById('estoque-config-input-file')
            if (!document.getElementById('select-null-stock-checkbox').checked) {
                if (normalTitle.trim().length <= 0) normalTitle = 'Itens';
                if (!txtFileEstoque.files[0]) return errorNotify('Escolha o arquivo do seu estoque primeiro!'); 
                let file = txtFileEstoque.files[0]
                if (!file.name.toLowerCase().endsWith('.txt')) return errorNotify('O arquivo não e um txt valido!');
                let linhas = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                        
                    reader.onload = async function (event) {
                            const conteudo = event.target.result;
                            const linhasArray = [];
                            
                            const linhasArquivo = conteudo.split('\n');
                            
                            for (const linha of linhasArquivo) {
                                const linhaTratada = linha.replace(/\r/g, '').trim();
                                if (linhaTratada.length > 0) {
                                    await new Promise(resolve => setTimeout(resolve, 0)); 
                                    linhasArray.push(linhaTratada);
                                }
                            }
                            
                            resolve(linhasArray);
                        };



                        reader.onerror = function (error) {
                            reject(error); 
                        };

                        reader.readAsText(file);
                });
                await formData.append('normalTitleEstoque', normalTitle);
                await formData.append('normalTxtEstoque', JSON.stringify(linhas));
            }
            break;
        case 'single':
            await formData.append('singleEstoqueNumber', document.getElementById('number-estoque-input').value.trim())
            await formData.append('singleContent', document.getElementById('content-number-estoque-input').value.trim())
            break;
        case 'subscription':
            
            break;
        case 'multiple':
            let arrayProdutos = multiCreateProductsSelect.getValue().map((itens)=>{
                return itens.value
            })
            await formData.append('arrayProdutos', JSON.stringify(arrayProdutos))
            break;
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



//TODO configuracoes do produto
let newChannelInputProduct = null
let editTypeProduct = null
document.addEventListener('click', async (event) => {   
    const target = event.target;  

    if (target.closest('.produtos-configure-button')) {
       
        let productID = target.closest('.produtos-configure-button').getAttribute('data-id')
        document.getElementById('delete-product').setAttribute('data-productID',productID )
        document.getElementById('send-new-mensage').setAttribute('data-productID',productID )
        document.getElementById('save-new-product').setAttribute('data-productID',productID )
        let productData = await fetch('/product/getOne', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                productID: productID,
                serverID: serverID
            }),
        }).then(response => { return response.json() })
        console.log(productData, productID);
        
        if (productData.success == true) {
            productData = productData.data
            function formatarMoeda(numeroCentavos) {
                const valorReal = numeroCentavos / 100;
                return valorReal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            }
            document.getElementById('product-config-new-name').value = productData.productName
            document.getElementById('product-config-new-price').value = formatarMoeda(productData.price)
            document.getElementById('new-product-config-desc').value = productData.producDesc
            document.getElementById('new-logo-preview').src = location.origin +  productData.productLogo
            document.getElementById('new-background-preview').src = productData.backGround == null ? 'https://res.cloudinary.com/dgcnfudya/image/upload/v1704981573/gxorbaldn7fw5ojcv1s0.jpg' : location.origin + productData.backGround 
            
            channelItensSelectMenuEdited = channelItensSelectMenu.map(item => ({
                ...item,
                selected: item.value == productData.channel
            }))
            document.getElementById(`radio-option-embendSelectTypeEdit-${productData.embendType}`).setAttribute('checked', 'checked')
            newChannelInputProduct = new DropdownSingle('produtos-config-new-channel', channelItensSelectMenuEdited);
            document.getElementById('produtos-config-containner').style.display = 'flex'
            document.getElementById('produtos-estoque-edit-normal').style.display = 'none'
            document.getElementById('produtos-estoque-edit-single').style.display = 'none'
            let typeProduct = 'typeProduct' in productData ? productData.typeProduct : 'normal'
            editTypeProduct = typeProduct
            if (typeProduct == 'normal') {
                document.getElementById('produtos-estoque-edit-normal').style.display = 'flex'
                document.getElementById('produtos-estoque-edit-normal-txt-title').value = productData.estoqueModel.conteudo[0].title
            }

            if (typeProduct == 'single') {
                document.getElementById('produtos-estoque-edit-single').style.display = 'flex'
                document.getElementById('product-config-new-single-content').value = productData.estoqueModel.conteudo[0].content
                document.getElementById('product-config-new-single-number').value = productData.estoque
            }

        }else{
            errorNotify('Ocorreu um erro ao buscar o produto!')
        }
    }

    
    if (target.closest('.close-config-popup')) {
        document.getElementById('produtos-config-containner').style.display = 'none'
    }

    if (target.closest('#send-new-mensage')) {
        let session = await fetch('/product/mensage', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                productID: target.closest('#send-new-mensage').getAttribute('data-productID'),
                serverID: serverID,
            }),
        }).then(response => { return response.json() })
        if (session.success == true) {
            successNotify(session.data)
        }else{
            errorNotify(session.data)
        }
    }
    if (target.closest('#delete-product')) {
        passVerify(async()=>{
            document.getElementById('produtos-config-containner').style.display = 'none'
            let session = await fetch('/product/delete', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    productID: target.closest('#delete-product').getAttribute('data-productID'),
                    serverID: serverID,
                }),
            }).then(response => { return response.json() })
            if (session.success == true) {
                successNotify(session.data)
            }else{
                errorNotify(session.data)
            }
        }, 'admin', null, false)
    }
    
})

document.getElementById('save-new-product').addEventListener('click', async () => {
   
        passVerify(async()=>{
            
            let channelID = newChannelInputProduct.getValue()
            
            var formData = new FormData();

            await formData.append('price', parseInt(document.getElementById('product-config-new-price').value.replace(/[^\d,]/g, '').replace('R$','').replace(',', '')));
            await formData.append('productName', document.getElementById('product-config-new-name').value.trim());
            await formData.append('producDesc', document.getElementById('new-product-config-desc').value.trim());
            await formData.append('serverID', serverID);
            formData.append('productID',document.getElementById('save-new-product').getAttribute('data-productID'))
            if (channelID) {
                await formData.append('channelID', channelID.value);
            }

            await formData.append('productLogo', document.getElementById('new-logo-input').files[0]);
            await formData.append('embendType', await selectEmbendType.getValue().value);

            if (document.getElementById('new-background-input').files[0]) {
                formData.append('backGround', document.getElementById('new-background-input').files[0]);
            }
            
            switch (editTypeProduct) {
                case 'normal':
                    let normalTitle = document.getElementById('produtos-estoque-edit-normal-txt-title').value
                    let txtFileEstoque = document.getElementById('produtos-estoque-edit-normal-txt-file')
                    if (normalTitle.trim().length <= 0) normalTitle = 'Itens';
                        if (!txtFileEstoque.files[0]) return errorNotify('Escolha o arquivo do seu estoque primeiro!'); 
                        let file = txtFileEstoque.files[0]
                        if (!file.name.toLowerCase().endsWith('.txt')) return errorNotify('O arquivo não e um txt valido!');
                        let linhas = await new Promise((resolve, reject) => {
                            const reader = new FileReader();
                                
                            reader.onload = async function (event) {
                                    const conteudo = event.target.result;
                                    const linhasArray = [];
                                    
                                    const linhasArquivo = conteudo.split('\n');
                                    
                                    for (const linha of linhasArquivo) {
                                        const linhaTratada = linha.replace(/\r/g, '').trim();
                                        if (linhaTratada.length > 0) {
                                            await new Promise(resolve => setTimeout(resolve, 0)); 
                                            linhasArray.push(linhaTratada);
                                        }
                                    }
                                    
                                    resolve(linhasArray);
                                };



                                reader.onerror = function (error) {
                                    reject(error); 
                                };

                                reader.readAsText(file);
                        });
                        console.log(linhas);
                        
                        await formData.append('normalTitleEstoque', normalTitle);
                        await formData.append('normalTxtEstoque', JSON.stringify(linhas));
                    break;
                case 'single':
                    await formData.append('singleEstoqueNumber', document.getElementById('product-config-new-single-number').value.trim())
                    await formData.append('singleContent', document.getElementById('product-config-new-single-content').value.trim())
                    break;
                case 'subscription':
                    
                    break;
                case 'multiple':
                    let arrayProdutos = multiCreateProductsSelect.getValue().map((itens)=>{
                        return itens.value
                    })
                    await formData.append('arrayProdutos', JSON.stringify(arrayProdutos))
                    break;
            }
        
            
            
            $.ajax({
                traditional: true,
                url: '/product/update',
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function (response) {
                    if (response.success) {
                        successNotify('Produto atualizado!')
                        getProducts()
                    } else {
                        errorNotify(response.data)
                    }

                },
                error: function (xhr, status, error) {
                    console.error(error);
                }
            })
            

        }, 'geral', null, false)
    
})
