var urlParams = {};
var url = new URL(window.location.href);
var searchParams = new URLSearchParams(url.search);

searchParams.forEach((value, key) => {
    urlParams[key] = value;
});

if ('error' in urlParams && urlParams.error.length > 0) {
    errorNotify(urlParams.error);

    searchParams.delete('error');

    var newUrl = url.origin + url.pathname + (searchParams.toString() ? '?' + searchParams.toString() : '');
    window.history.replaceState(null, '', newUrl);
}








//closePopup

function openPopup(popupContainner,popupContent) {
    popupContainner.classList.add('active');
    requestAnimationFrame(() => {
        popupContent.classList.add('active');
    });
}
function closePopup(popupContainer, popupContent) {
    popupContent.classList.remove('active');
    setTimeout(() => {
        popupContainer.classList.remove('active');
    }, 100);
}



document.addEventListener('click',async (event) => {
    const popupContainer = await event.target.closest('.popup-containner');
    const popupContent = await event.target.closest('.popup-content');
    // if (popupContainer && !popupContent && !popupContainer.classList.contains('noClose')) {
    //     closePopup(popupContainer, await popupContainer.querySelector('.popup-content'));
    // }
    if (popupContainer && event.target.closest('.popup-close-button')) {
        closePopup(popupContainer, popupContent);
    }
});






function previewImage(input, preview) {
    try {
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
    } catch (error) {
        console.log(error);
        
    }

}







function validarDocumento(documento) {
    documento = documento.toString().replace(/\D/g, ''); 
    let tipo = documento.length === 11 ? "CPF" : documento.length === 14 ? "CNPJ" : null;

    if (!tipo) return { tipo: "Desconhecido", valido: false };

    let valido = (() => {
        if (/^(\d)\1+$/.test(documento)) return false; 
        
        let soma = 0, resto, tamanho, numeros, digitos, pos, resultado;

        if (tipo === "CPF") {
            for (let i = 1; i <= 9; i++) soma += parseInt(documento[i - 1]) * (11 - i);
            resto = (soma * 10) % 11;
            if (resto === 10 || resto === 11) resto = 0;
            if (resto !== parseInt(documento[9])) return false;

            soma = 0;
            for (let i = 1; i <= 10; i++) soma += parseInt(documento[i - 1]) * (12 - i);
            resto = (soma * 10) % 11;
            if (resto === 10 || resto === 11) resto = 0;
            return resto === parseInt(documento[10]);

        } else { 
            tamanho = documento.length - 2;
            numeros = documento.substring(0, tamanho);
            digitos = documento.substring(tamanho);
            pos = tamanho - 7;

            for (let i = tamanho; i >= 1; i--) {
                soma += numeros[tamanho - i] * pos--;
                if (pos < 2) pos = 9;
            }

            resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
            if (resultado !== parseInt(digitos[0])) return false;

            tamanho++;
            numeros = documento.substring(0, tamanho);
            soma = 0;
            pos = tamanho - 7;

            for (let i = tamanho; i >= 1; i--) {
                soma += numeros[tamanho - i] * pos--;
                if (pos < 2) pos = 9;
            }

            resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
            return resultado === parseInt(digitos[1]);
        }
    })();

    return { tipo, valido };
}












function updateQueryParam(key, value) {
    const url = new URL(window.location);
    url.searchParams.set(key, value);
    window.history.replaceState({}, '', url);
}





function copyText(texto) {
    if (navigator.clipboard && window.isSecureContext) {
        try {
            navigator.clipboard.writeText(texto)
            successNotify('Texto Copiado!')
        } catch (error) {
            errorNotify('Erro ao copiar o texto!')
        }
    } else {
        try {
            const textarea = document.createElement("textarea");
            textarea.value = texto;
            textarea.style.position = "fixed";
            textarea.style.opacity = "0";
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
            successNotify('Texto Copiado!')
        } catch (err) {
            errorNotify('Erro ao copiar o texto!')
        }
        
    }
}
