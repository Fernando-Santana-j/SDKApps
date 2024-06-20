let serverID = location.pathname.replace('/server/analytics/', "")


let getLast7Days = () => [...Array(7)].map((_, i) => {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    return `${('0' + date.getDate()).slice(-2)}/${('0' + (date.getMonth() + 1)).slice(-2)}`;
});


let colorsBack = [getComputedStyle(document.querySelector(`[data-theme=${document.body.getAttribute('data-theme')}]`)).getPropertyValue('--color-text-primary'), getComputedStyle(document.querySelector(`[data-theme=${document.body.getAttribute('data-theme')}]`)).getPropertyValue('--text-gray-color-primary')]


let comprasConcluidasArray = Object.values(comprasConcluidas)
let comprasCanceladasArray = Object.values(comprasCanceladas)
completeChart(getLast7Days(), colorsBack)
function completeChart(lastDays, colorsBack) {
    var options = {
        series: [{
            name: "Vendas",
            color: '#6E58C7',
            data: comprasConcluidasArray
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
            data: comprasCanceladasArray// valores
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



let reebolsosArr = Object.values(reebolsos)
reebolsoChart(getLast7Days(), colorsBack)
function reebolsoChart(lastDays, colorsBack) {
    var options = {
        series: [{
            name: "Reembolsos",
            color: '#6E58C7',
            data: reebolsosArr// valores
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
            text: 'Reembolsos',
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

    var chart = new ApexCharts(document.querySelector("#reebolso-chart"), options);
    chart.render();
}



let canceladosEstoqueArr = Object.values(canceladosEstoque)
canceladoEstoque(getLast7Days(), colorsBack)
function canceladoEstoque(lastDays, colorsBack) {
    var options = {
        series: [{
            name: "Cancelados",
            color: '#6E58C7',
            data: canceladosEstoqueArr// valores
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
            text: 'Cancelados por falta de estoque',
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

    var chart = new ApexCharts(document.querySelector("#estoque-chart"), options);
    chart.render();
}









let paymentMetodArr = Object.values(paymentMetod)
payment(colorsBack)
function payment(colorsBack) {
    var options = {
        series: [{
            name: "Metodos",
            color: '#6E58C7',
            data: paymentMetodArr
        }],
        chart: {
            type: 'bar',
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
            text: 'Metodos de pagamento mais usados',
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
            categories: ['PIX','Cartão','Boleto'],
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

    var chart = new ApexCharts(document.querySelector("#payment-chart"), options);
    chart.render();
}
