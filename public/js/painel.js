
let serverID = location.pathname.replace('/server/', "")


let getLast7Days = () => [...Array(7)].map((_, i) => {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    return `${('0' + date.getDate()).slice(-2)}/${('0' + (date.getMonth() + 1)).slice(-2)}`;
});


let colorsBack = [getComputedStyle(document.querySelector(`[data-theme=${document.body.getAttribute('data-theme')}]`)).getPropertyValue('--color-text-primary'), getComputedStyle(document.querySelector(`[data-theme=${document.body.getAttribute('data-theme')}]`)).getPropertyValue('--text-gray-color-primary')]




completeChart(getLast7Days(), colorsBack)
function completeChart(lastDays, colorsBack) {
    var options = {
        series: [{
            name: "Vendas",
            color: '#6E58C7',
            data: [0, 0, 0, 0, 0, 0, 0]
        }],
        chart: {
            type: 'line',
            zoom: {
                enabled: false
            }
        },
        dataLabels: {
            enabled: false
        },
        stroke: {
            curve: 'straight'
        },
        title: {
            text: 'Vendas Completas',
            align: 'center',
            style: {

                fontWeight: 'bold',
                fontFamily: 'ubuntu',
                color: colorsBack[0]
            },
        },
        grid: {
            row: {
                colors: colorsBack,
                opacity: 0.7
            },
        },
        xaxis: {
            categories: lastDays,
            labels: {
                style: {
                    colors: colorsBack[1],
                    fontWeight: 400,
                },
            }
        },
        yaxis: {
            labels: {
                style: {
                    colors: colorsBack[1]
                }
            }
        }
    };

    var chart = new ApexCharts(document.querySelector("#vendas-completas-chart"), options);
    chart.render();
}


cancelChart(getLast7Days(), colorsBack)
function cancelChart(lastDays, colorsBack) {
    var options = {
        series: [{
            name: "Canceladas",
            color: '#6E58C7',
            data: [0, 0, 0, 0, 0, 0, 0] // valores
        }],
        chart: {
            type: 'line',
            zoom: {
                enabled: false
            }
        },
        dataLabels: {
            enabled: false
        },
        stroke: {
            curve: 'straight'
        },
        title: {
            text: 'Vendas Canceladas',
            align: 'center',
            style: {

                fontWeight: 'bold',
                fontFamily: 'ubuntu',
                color: colorsBack[0]
            },
        },
        grid: {
            row: {
                colors: colorsBack,
                opacity: 0.7
            },
        },
        xaxis: {
            categories: lastDays,
            labels: {
                style: {
                    colors: colorsBack[1],
                    fontWeight: 400,
                },
            }
        },
        yaxis: {
            labels: {
                style: {
                    colors: colorsBack[1]
                }
            }
        },
        responsive: [{
            breakpoint: 1000,
            options: {
                plotOptions: {
                    bar: {
                        horizontal: false
                    }
                },
            }
        }]

    };

    var chart = new ApexCharts(document.querySelector("#vendas-canceladas-chart"), options);
    chart.render();
}



document.getElementById('top-header-theme').addEventListener('click', async () => {
    colorsBack = [getComputedStyle(document.querySelector(`[data-theme=${document.body.getAttribute('data-theme')}]`)).getPropertyValue('--color-text-primary'), getComputedStyle(document.querySelector(`[data-theme=${document.body.getAttribute('data-theme')}]`)).getPropertyValue('--text-gray-color-primary')]
    document.querySelector("#vendas-completas-chart").innerHTML = ''
    document.querySelector("#vendas-canceladas-chart").innerHTML = ''
    completeChart(getLast7Days(), colorsBack)
    cancelChart(getLast7Days(), colorsBack)
})

document.getElementById("notify-signature").addEventListener("click",async()=>{
    fetch('/config/notify', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            serverID: serverID,
        }),
    })
    successNotify('Você sera notificado 3 dias antes no seu privado do discord!')
    
})


document.getElementById('signature-situation-button').addEventListener('click', async() => {

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
        console.log(session);

        successNotify('Você sera redirecionado para a pagina do stripe!')
        setInterval(async () => {
            window.open(session.data, "_blank");
        }, 3000)
    } else {
        errorNotify(session.data)
    }
})