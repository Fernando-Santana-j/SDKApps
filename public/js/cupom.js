


let serverID = location.pathname.replace('/server/cupom/', "")


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


document.getElementById('type-cupom-value').addEventListener('blur', function () {
    const inputValue = this.value.toLowerCase();
    const datalistOptions = Array.from(document.getElementById('type-cupom-value-list').getElementsByTagName('option'));
    const validOptions = datalistOptions.map(option => option.value.toLowerCase());

    if (!validOptions.includes(inputValue)) {
        errorNotify('Por favor, selecione um tipo de desconto válido da lista.');
        this.value = '';
    }
});

document.getElementById("create-cupom-button").addEventListener("click", function (event) {
    if (selectProdsList.length <= 0) {
        errorNotify('Selecione um ou mais produtos para continuar!')
        return
    }
    if (document.getElementById('type-cupom-value').value.trim().length <= 0) {
        errorNotify('Selecione um tipo de desconto para ser enviado o produto!')
        return
    }
    if (document.getElementById('cupom-code-value').value.trim().length <= 0) {
        errorNotify('Adicione um nome primeiro!')
        return
    }
    if (document.getElementById('cupom-number-value').value.trim().length <= 0) {
        errorNotify('Adicione uma descrição primeiro!')
        return
    }
    const opcoes = document.getElementById('type-cupom-value-list').querySelectorAll('option');
    let typeCupom = null;

    opcoes.forEach(option => {
        if (option.value === document.getElementById('type-cupom-value').value) {
            typeCupom = option.getAttribute('data-channel');
        }
    });

    
    $.ajax({
        traditional: true,
        url: '/cupom/create',
        type: 'POST',
        data: JSON.stringify({
            descontoValue:document.getElementById('cupom-number-value').value.trim(),
            descontoType:typeCupom,
            cupomCode:document.getElementById('cupom-code-value').value.trim(),
            serverID:serverID,
            productsList:selectProdsList
        }),
        contentType: 'application/json',
        success: function (response) {
            document.getElementById('select-product-row').innerHTML = ''
            selectProdsList = []
            document.getElementById('cupom-number-value').value = ''
            document.getElementById('type-cupom-value').value = ''
            document.getElementById('cupom-code-value').value = ''
            if (response.success) {
                successNotify('Cupom criado!')
            } else {
                errorNotify(response.data)
            }

        },
        error: function (xhr, status, error) {
            console.error(error);
        }
    })
})