let serverID = location.pathname.replace('/server/personalize/', "")



if ('personalize' in server) {
    if ('colorDest' in server.personalize) {
        document.getElementById('color-dest-preview').style.backgroundColor = server.personalize.colorDest
    }   
    if ('cargoPay' in server.personalize) {
        const opcoes = document.getElementById('cargos-input-list').querySelectorAll('option');
        opcoes.forEach(option => {
            if (option.getAttribute('data-cargos') == server.personalize.cargoPay) {
                document.getElementById('cargos-name-input').value = option.value
            }
        });
    }
}



async function sendPersonalize(type,data) {
    let session = await fetch('/personalize/change', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            [type]: data,
            serverID:serverID
        }),
    }).then(response => { return response.json() })
    if (session.success == true) {
        successNotify('Personalização alterada!')
    }else{
        errorNotify(session.data)
    }
}

document.getElementById('saveCargoPay').addEventListener('click',async()=>{
    const opcoes = document.getElementById('cargos-input-list').querySelectorAll('option');
    let cargosID = null;

    await opcoes.forEach(option => {
        if (option.value === document.getElementById('cargos-name-input').value) {
            cargosID = option.getAttribute('data-cargos');
        }
    });
    if (!cargosID) {
        errorNotify("Selecione um cargo primeiro")
        return
    }
    sendPersonalize('cargoPay',cargosID)
})

document.getElementById('color-dest-input').addEventListener('change',()=>{
    sendPersonalize('colorDest',document.getElementById('color-dest-input').value)
})

document.getElementById('color-dest-input').addEventListener('input',()=>{
    document.getElementById('color-dest-preview').style.backgroundColor = document.getElementById('color-dest-input').value
})