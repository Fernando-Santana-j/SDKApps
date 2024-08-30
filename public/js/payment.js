
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
if (document.getElementById('signature-situation-button')) {
    document.getElementById('signature-situation-button').addEventListener('click', async () => {

        let session = await fetch('/subscription/update', {
            method: 'POST',
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
}
if (document.getElementById('signature-pix-button')) {
    document.getElementById('signature-pix-button').addEventListener('click', async () => {
        console.log(1);
        
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
                timeMultiply:multply,
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

if (document.getElementById('time-input-renovar')) {
    document.getElementById('time-input-renovar').addEventListener('blur', function () {
        const inputValue = this.value.toLowerCase();
        const datalistOptions = Array.from(document.getElementById('time-input-list-renovar').getElementsByTagName('option'));
        const validOptions = datalistOptions.map(option => option.value.toLowerCase());

        if (!validOptions.includes(inputValue)) {
            errorNotify('Por favor, selecione um tempo válido da lista.');
            this.value = '';
        }
    });

}


if (document.getElementById(`plans-section`)) {

    function verifyPrice() {
        let time = document.getElementById('time-input').value
        let plan = document.getElementById('plan-input').value
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

    document.getElementById('plan-input').addEventListener('blur', function () {
        const inputValue = this.value.toLowerCase();
        const datalistOptions = Array.from(document.getElementById('plan-input-list').getElementsByTagName('option'));
        const validOptions = datalistOptions.map(option => option.value.toLowerCase());

        if (!validOptions.includes(inputValue)) {
            errorNotify('Por favor, selecione um plano válido da lista.');
            this.value = '';
        } else {
            verifyPrice()
        }
    });
    document.getElementById('method-input').addEventListener('blur', function () {
        const inputValue = this.value.toLowerCase();
        const datalistOptions = Array.from(document.getElementById('method-input-list').getElementsByTagName('option'));
        const validOptions = datalistOptions.map(option => option.value.toLowerCase());

        if (!validOptions.includes(inputValue)) {
            errorNotify('Por favor, selecione um metodo válido da lista.');
            this.value = '';
        }
    });
    document.getElementById('time-input').addEventListener('blur', function () {
        const inputValue = this.value.toLowerCase();
        const datalistOptions = Array.from(document.getElementById('time-input-list').getElementsByTagName('option'));
        const validOptions = datalistOptions.map(option => option.value.toLowerCase());

        if (!validOptions.includes(inputValue)) {
            errorNotify('Por favor, selecione um tempo válido da lista.');
            this.value = '';
        } else {
            verifyPrice()
        }
    });
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
        if (document.getElementById(`plan-input`).value.trim().length < 0) {
            errorNotify('Selecione um plano primeiro!')
            return
        }
        if (document.getElementById(`time-input`).value.trim().length < 0) {
            errorNotify('Selecione um tempo primeiro!')
            return
        }
        if (document.getElementById(`method-input`).value.trim().length < 0) {
            errorNotify('Selecione um metodo primeiro!')
            return
        }
        let time = document.getElementById('time-input').value
        let multply = 1
        if (time.trim().length > 0) {
            if (time.includes("trimestral")) {
                multply = 3
            } else if (time.includes("anual")) {
                multply = 12
            }
        }
        if (document.getElementById(`method-input`).value.trim() == 'stripe') {
            await $.ajax({
                traditional: true,
                url: '/subscription/create',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    serverID: serverID,
                    uid: uid,
                    plan: document.getElementById(`plan-input`).value,
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
                    plan: document.getElementById(`plan-input`).value,
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



}