document.addEventListener("DOMContentLoaded", function () {
    // Função para obter o horário atual em minutos
    const getCurrentTimeInMinutes = () => {
        const currentDate = new Date();
        return currentDate.getHours() * 60 + currentDate.getMinutes();
    }

    // Função para carregar os dados JSON e aplicar as atualizações
    function loadAndUpdateTable() {
        const currentTime = getCurrentTimeInMinutes(); // Obter o horário atual

        // Carregar o arquivo configuracoes.json (horários limites)
        fetch('.vscode/configuracoes.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao carregar configuracoes.json');
                }
                return response.json();
            })
            .then(configuracoes => {
                // Carregar o arquivo (status das rotas)
                fetch('.vscode/Acompamento_de_rotas.json')
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Erro ao carregar Acompanhamento_de_rotas.json');
                        }
                        return response.json();
                    })
                    .then(rotas => {
                        // Função para converter o horário "HH:MM" para minutos
                        function timeToMinutes(time) {
                            const [hours, minutes] = time.split(":");
                            return parseInt(hours) * 60 + parseInt(minutes);
                        }

                        // Função para calcular a cor baseada na diferença de tempo
                        function calculateColor(difference, timeLimitInMinutes, status) {
                            const maxDifference = 100; // Diferença máxima em minutos para calcular a cor
                            const ratio = Math.min(difference / maxDifference, 1);

                            // Se o status for "Rota 100% produzida", a célula será verde
                            if (status.toLowerCase() === "rota 100% produzida") {
                                return "green";
                            }

                            // Se o horário limite já passou e o status não for "Rota 100% produzida", a célula ficará vermelha
                            if (timeLimitInMinutes < currentTime) {
                                return "red";
                            }

                            // Caso o horário ainda não tenha passado, a cor será calculada com base na diferença de tempo
                            const r = Math.floor(255 * (1 - ratio));
                            const g = Math.floor(255 * ratio);
                            const b = 0;
                            return `rgb(${r}, ${g}, ${b})`;
                        }

                        // Função para aplicar as cores e os textos nas tabelas
                        function applyColors() {
                            const sectors = ["M", "Y", "V", "H"];

                            sectors.forEach(sector => {
                                const sectorData = configuracoes[sector];
                                const routesData = rotas[sector];
                                const rows = document.querySelectorAll(`table.${sector} tbody tr`);

                                rows.forEach((row, index) => {
                                    const routeName = row.cells[0].textContent.trim();

                                    // Obter horário limite e status da rota
                                    const { horario } = sectorData[routeName];
                                    const status = routesData[routeName] || ""; // Verifica se o status existe, caso contrário, usa um valor vazio

                                    const timeLimitInMinutes = timeToMinutes(horario);
                                    const timeDifference = Math.abs(timeLimitInMinutes - currentTime);
                                    const color = calculateColor(timeDifference, timeLimitInMinutes, status);

                                    // Aplica a cor de fundo na célula de status
                                    row.cells[1].style.backgroundColor = color;

                                    // Exibe o texto de status (indicando se está atrasado ou não)
                                    if (timeLimitInMinutes < currentTime && status.toLowerCase() !== "rota 100% produzida") {
                                        row.cells[1].textContent = "Atrasado";
                                    } else if (status === "") {
                                        row.cells[1].textContent = "Sem status"; // Quando não houver status, mostra "Sem status"
                                    } else {
                                        row.cells[1].textContent = status;
                                    }
                                });
                            });
                        }

                        // Chama a função para aplicar as cores e textos assim que os dados estiverem carregados
                        applyColors();
                    })
                    .catch(error => console.error(error));
            })
            .catch(error => console.error(error));
    }

    // Chama a função de atualização inicial
    loadAndUpdateTable();

    // Atualiza a tabela a cada 30 segundos (10000 ms)
    setInterval(loadAndUpdateTable, 10000);  // 10 segundos
});

// Selecionando os elementos da sidebar e do conteúdo 
const sidebar = document.getElementById('sidebar');
const openBtn = document.getElementById('open-btn');
const closeBtn = document.getElementById('close-btn');
const content = document.querySelector('.content');
const toggleItemsBtn = document.getElementById('toggle-items');
const toggleItemsBtn1 = document.getElementById('toggle-items1');
const toggleItemsBtn2 = document.getElementById('toggle-items2');
const itemList = document.getElementById('itemlist');
const itemList1 = document.getElementById('itemlist1');
const itemList2 = document.getElementById('itemlist2');
const toggleDetalhamentoBtn = document.getElementById('toggle-detalhamento');
const detalhamentoContainer = document.getElementById('detalhamento-container');
const ofensoresBtn = document.getElementById('ofensores-btn');
const rotasBtn = document.getElementById('rotas-btn'); 

// Abrir a sidebar
openBtn.addEventListener('click', () => {
    sidebar.classList.add('open');
    content.classList.add('open');
});

// Fechar a sidebar
closeBtn.addEventListener('click', () => {
    sidebar.classList.remove('open');
    content.classList.remove('open');
});

// Fechar a sidebar ao clicar fora dela
document.addEventListener('click', (event) => {
    if (!sidebar.contains(event.target) && !openBtn.contains(event.target) && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
        content.classList.remove('open');
    }
});

// Mostrar ou esconder os itens na sidebar
toggleItemsBtn.addEventListener('click', () => {
    itemList.classList.toggle('show');
});

toggleItemsBtn1.addEventListener('click', () => {
    itemList1.classList.toggle('show');
});

toggleItemsBtn2.addEventListener('click', () => {
    itemList2.classList.toggle('show');
});

// Mostrar ou esconder os botões MÁQUINA, MEZANINO e EXTERNO ao clicar em "DETALHAMENTO DE ERROS"
toggleDetalhamentoBtn.addEventListener('click', () => {
    detalhamentoContainer.style.display = detalhamentoContainer.style.display === "none" ? "block" : "none";
});

// Redirecionar para a página OFENSORES.html ao clicar no botão "OFENSORES"
ofensoresBtn.addEventListener('click', () => {
    window.location.href = "OFENSORES.html";
});

// Redirecionar para a página ROTAS POR SETOR.html ao clicar no botão "ROTAS POR SETOR"
rotasBtn.addEventListener('click', () => {
    window.location.href = "ROTAS POR SETOR.html";
});
