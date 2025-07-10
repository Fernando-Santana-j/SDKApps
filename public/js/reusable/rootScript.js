// Initialize loader for page transitions
function initializeLoader() {
    // Show loader when page starts loading
    if (window.globalLoader) {
        window.globalLoader.show('Carregando página...');
    }

    // Hide loader when page is fully loaded
    window.addEventListener('load', () => {
        if (window.globalLoader) {
            window.globalLoader.hide();
        }
    });
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link && !link.target && !e.ctrlKey && !e.shiftKey && !e.metaKey && window.globalLoader) {
            window.globalLoader.show('Carregando página...');
        }
    });
}

// Wait for both DOM and loader to be ready
// if (document.readyState === 'loading') {
//     document.addEventListener('DOMContentLoaded', () => {
//         if (window.globalLoader) {
//             initializeLoader();
//         } else {
//             // If loader isn't ready yet, wait for it
//             const checkLoader = setInterval(() => {
//                 if (window.globalLoader) {
//                     clearInterval(checkLoader);
//                     initializeLoader();
//                 }
//             }, 100);
//         }
//     });
// } else {
//     initializeLoader();
// }


var urlParams = {};
var url = new URL(window.location.href);
var searchParams = new URLSearchParams(url.search);

searchParams.forEach((value, key) => {
    urlParams[key] = value;
});
if ('error' in urlParams && urlParams.error.length > 0) {

    searchParams.delete('error');

    var newUrl = url.origin + url.pathname + (searchParams.toString() ? '?' + searchParams.toString() : '');
    window.history.replaceState(null, '', newUrl);
    errorNotify(urlParams.error)
}

gsap.registerPlugin(window.CustomEase);



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



function formatarMoeda(centavos) {
    return (centavos / 100).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}