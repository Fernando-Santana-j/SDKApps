function copyText(div) {
    try {
        const texto = div.querySelector('.textToCopy').innerText;
        const elementoTemp = document.createElement("textarea");
        elementoTemp.value = texto;
        document.body.appendChild(elementoTemp);
        elementoTemp.select();
        elementoTemp.setSelectionRange(0, 99999); 
        document.execCommand("copy");
        document.body.removeChild(elementoTemp);

        successNotify('Texto Copiado!')
    } catch (error) {
        errorNotify('Erro ao copiar o texto!')
    }
}



async function sendResponse(accept) {
    let session = await fetch('/control/login/response', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            user:user,
            ip:ip,
            accept:accept,
            id:id
        }),
    }).then(response => { return response.json() })
    if (session.success == true) {
        successNotify(session.data + ', Voce sera redirecionado!')
        setTimeout(()=>{
            location.href = '/dashboard'
        },2000)
    } else {
        errorNotify(session.data)
    }
}


document.getElementById('aceitar-login-button').addEventListener('click',()=>{
    sendResponse(true)
})
document.getElementById('recusar-login-button').addEventListener('click',()=>{
    sendResponse(true)
})