// Variáveis e constantes globais
let grafico = null;
let animacaoRadar = null;
let offset = 0;
const intensidade = Array(1000).fill(0);
let valor_atual = null;
let dados_finais = null;
const alturaGrafico = 1000;
const larguraGrafico = 600;

// Objeto para armazenar as instâncias dos gráficos de rosca
const pieCharts = {};

// Cache de elementos do DOM
const sidebar = document.getElementById("sidebar");
const openBtn = document.getElementById("open-btn");
const closeBtn = document.getElementById("close-btn");
const content = document.querySelector(".content");
const toggleItemsBtns = [
  document.getElementById("toggle-items"),
  document.getElementById("toggle-items1"),
  document.getElementById("toggle-items2"),
];
const itemLists = [
  document.getElementById("itemlist"),
  document.getElementById("itemlist1"),
  document.getElementById("itemlist2"),
];
const toggleDetalhamentoBtn = document.getElementById("toggle-detalhamento");
const detalhamentoContainer = document.getElementById("detalhamento-container");
const ofensoresBtn = document.getElementById("ofensores-btn");
const rotasBtn = document.getElementById("rotas-btn");
const timeSlider = document.getElementById("timeSlider");
const timeLabel = document.getElementById("timeLabel");
const showCalendarBtn = document.getElementById("show-calendar-btn");
const calendar = document.getElementById("calendar");

// Função debounce para limitar a frequência de execução
const debounce = (fn, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
};

// Funções utilitárias
const toggleVisibility = (element) => element.classList.toggle("show");

const redirectToPage = (url) => (window.location.href = url);

const toggleSidebar = (action) => {
  const method = action === "open" ? "add" : "remove";
  sidebar.classList[method]("open");
  content.classList[method]("open");
};

// Eventos relacionados à sidebar
openBtn.addEventListener("click", () => toggleSidebar("open"));
closeBtn.addEventListener("click", () => toggleSidebar("close"));
document.addEventListener("click", (event) => {
  if (
    !sidebar.contains(event.target) &&
    !openBtn.contains(event.target) &&
    sidebar.classList.contains("open")
  ) {
    toggleSidebar("close");
  }
});
toggleItemsBtns.forEach((btn, index) => {
  btn.addEventListener("click", () => toggleVisibility(itemLists[index]));
});
toggleDetalhamentoBtn.addEventListener("click", () => {
  detalhamentoContainer.style.display =
    detalhamentoContainer.style.display === "none" ? "block" : "none";
});
ofensoresBtn.addEventListener("click", () => redirectToPage("OFENSORES.html"));
rotasBtn.addEventListener("click", () =>
  redirectToPage("ROTAS POR SETOR.html")
);

// Função para carregar JSON usando async/await
const carregarJson = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Erro ao carregar o JSON");
    return await response.json();
  } catch (error) {
    console.error(error);
  }
};

// Funções relacionadas ao gráfico de linhas (Radar NAT)
const atualizarGrafico = (labels, valores, nivelMeta, tipo) => {
  const ctx = document.getElementById("graficoLinha").getContext("2d");
  const nome = `${tipo} %`;
  const gradient = criarDegradeRadar(ctx, alturaGrafico);

  if (grafico) {
    atualizarGraficoExistente(
      grafico,
      labels,
      valores,
      gradient,
      nome,
      nivelMeta
    );
  } else {
    grafico = new Chart(
      ctx,
      criarGraficoConfig(labels, valores, gradient, nome, nivelMeta)
    );
  }
  animarRadar(ctx, grafico.data.datasets[0], alturaGrafico);
};

const atualizarGraficoExistente = (
  grafico,
  labels,
  valores,
  gradient,
  nome,
  nivelMeta
) => {
  grafico.data.labels = labels;
  grafico.data.datasets[0].data = valores;
  grafico.data.datasets[0].backgroundColor = gradient;
  grafico.data.datasets[0].label = nome;
  const metaLine = grafico.options.plugins.annotation.annotations.linhaMeta;
  metaLine.yMin = nivelMeta;
  metaLine.yMax = nivelMeta;
  metaLine.label.content = `${nivelMeta}`;
  grafico.update();
};

const criarDegradeRadar = (ctx, largura) => {
  const gradient = ctx.createLinearGradient(0, 0, largura, 0);
  for (let i = 0; i < largura; i++) {
    const alpha = intensidade[i] || 0;
    gradient.addColorStop(i / largura, `rgba(0, 255, 255, ${alpha})`);
  }
  return gradient;
};

const animarRadar = (ctx, dataset, largura) => {
  const frame = () => {
    // Decai a intensidade de cada ponto
    for (let i = 0; i < largura; i++) {
      intensidade[i] *= 0.95;
    }
    // Atualiza intensidade em posições específicas
    intensidade[offset] = 1;
    if (offset + 1 < largura) intensidade[offset + 1] = 1.01;
    if (offset + 2 < largura) intensidade[offset + 2] = 1;

    offset += 3;
    if (offset >= largura) {
      offset = 0;
      atualizarGrafico_1(valor_atual);
      fetchNATSetor();
      atualizarRosquinhas("07:30");
    }
    dataset.backgroundColor = criarDegradeRadar(ctx, largura);
    if (grafico) grafico.update();
    animacaoRadar = requestAnimationFrame(frame);
  };
  cancelAnimationFrame(animacaoRadar);
  animacaoRadar = requestAnimationFrame(frame);
};

const criarGraficoConfig = (labels, valores, gradient, nome, nivelMeta) => ({
  type: "line",
  data: {
    labels,
    datasets: [
      {
        label: nome,
        data: valores,
        borderColor: "rgb(0, 255, 255)",
        backgroundColor: gradient,
        fill: true,
        tension: 0,
        borderWidth: 2,
      },
    ],
  },
  options: {
    responsive: true,
    interaction: { mode: "index", intersect: false },
    plugins: {
      tooltip: { enabled: true, position: "nearest" },
      annotation: {
        annotations: {
          linhaMeta: {
            type: "line",
            yMin: nivelMeta,
            yMax: nivelMeta,
            borderColor: "rgb(214, 110, 15)",
            borderWidth: 2,
            label: {
              content: `${nivelMeta}`,
              enabled: true,
              position: "start",
              backgroundColor: "black",
              color: "white",
              font: { weight: "bold" },
            },
          },
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: "Hora" },
        ticks: { autoSkip: true, maxRotation: 45, minRotation: 0 },
      },
      y: {
        title: { display: true, text: "Valor" },
        min: 0,
        ticks: { stepSize: 1 },
      },
    },
  },
});

// Atualiza o gráfico com base na categoria
let selectedTime = "07:30";
const atualizarGrafico_1 = async (categoria) => {
  const data = await carregarJson("vscode/Configuracoes_grafico.json");
  if (!data) return;
  categoria = categoria === "DROPS" ? "DROP'S" : categoria;
  const soma = data.GRAFICO[categoria];
  const labels = Object.keys(soma);
  const valores = Object.values(soma);
  const nivelMeta = data.META[categoria] || 6;

  atualizarGrafico(labels, valores, nivelMeta, categoria);
  carregarTabela();
  atualizarRosquinhas(selectedTime);
  valor_atual = categoria;
};

// Funções de manipulação da tabela
const carregarTabela = async () => {
  const data = await carregarJson("vscode/3ofensores.json");
  if (!data) return;

  document.getElementById(
    "sugestao"
  ).textContent = `Sugestão: ${data.sugestao.toLocaleString("pt-BR")}`;
  document.getElementById(
    "escaneado"
  ).textContent = `Escaneado: ${data.escaneado.toLocaleString("pt-BR")}`;
  document.getElementById("nat").textContent = `NAT: ${data.nat.toLocaleString(
    "pt-BR"
  )}`;

  const container = document.getElementById("top1");
  container.innerHTML = "";
  data.sku.forEach((sku, index) => {
    container.appendChild(
      criarLinhaTabela(
        sku,
        data.descrição[index],
        data.sugestaoValores[index],
        data.faturada[index],
        data.NAT[index]
      )
    );
  });
};

const criarLinhaTabela = (sku, descricao, sugestao, faturada, nat) => {
  const linha = document.createElement("div");
  linha.style.cssText = "display: flex; flex-direction: row; gap: 20px;";
  linha.appendChild(criarItem(sku));
  linha.appendChild(criarItem(descricao));
  linha.appendChild(criarItemComTitulo("Sugestão", sugestao));
  linha.appendChild(criarItemComTitulo("Faturada", faturada));
  linha.appendChild(criarItemComTitulo("NAT", nat));
  return linha;
};

const criarItem = (value) => {
  const item = document.createElement("div");
  item.textContent = value;
  return item;
};

const criarItemComTitulo = (label, value) => {
  const item = document.createElement("div");
  item.textContent = `${label.toUpperCase()}: ${value}`;
  return item;
};

// Atualiza dados dos "maiores" a cada segundo
const carregarDadosMaiores = () => {
  fetch(".vscode/maiores.json")
    .then((response) => response.json())
    .then((data) => {
      document.getElementById("previsao").textContent = data.previsão;
      document.getElementById(
        "1"
      ).textContent = `${data.ofensores["1"][0]}: ${data.ofensores["1"][1]}`;
      document.getElementById(
        "2"
      ).textContent = `${data.ofensores["2"][0]}: ${data.ofensores["2"][1]}`;
      document.getElementById(
        "3"
      ).textContent = `${data.ofensores["3"][0]}: ${data.ofensores["3"][1]}`;
      document.getElementById(
        "4"
      ).textContent = `${data.ofensores["FATURADO%"][0]}: ${data.ofensores["FATURADO%"][1]}`;
    })
    .catch((error) => console.error("Erro ao carregar o arquivo JSON:", error));
};
setInterval(carregarDadosMaiores, 1000);
window.onload = carregarDadosMaiores;

// Função para buscar os dados do NAT_setor
const fetchNATSetor = async () => {
  try {
    const dados = await carregarJson("vscode/NAT_setor.json");
    dados_finais = dados;
  } catch (error) {
    console.error("Erro ao carregar NAT_setor.json:", error);
  }
};
fetchNATSetor();

// Função para criar/atualizar os gráficos de rosca (pie charts)
// Utiliza debounce no listener do slider para evitar travamentos
const atualizarRosquinhas = (cat = "07:30") => {
  const horarios = [
    "07:30",
    "08:30",
    "09:30",
    "10:30",
    "11:30",
    "12:30",
    "13:30",
    "14:30",
    "15:30",
    "16:30",
    "17:30",
  ];

  if (timeSlider) {
    timeSlider.addEventListener(
      "input",
      debounce(() => {
        selectedTime = horarios[timeSlider.value];
        if (timeLabel) timeLabel.textContent = selectedTime;
        console.time("Atualização dos gráficos");
        criarGraficoRosquinha(
          dados_finais,
          "MAQUINA",
          "grafico1",
          selectedTime
        );
        criarGraficoRosquinha(
          dados_finais,
          "MEZANINO",
          "grafico2",
          selectedTime
        );
        criarGraficoRosquinha(
          dados_finais,
          "EXTERNO",
          "grafico3",
          selectedTime
        );
        console.timeEnd("Atualização dos gráficos");
      }, 50)
    );
  }
  // Inicializa os gráficos com o horário padrão ou informado
  criarGraficoRosquinha(dados_finais, "MAQUINA", "grafico1", cat);
  criarGraficoRosquinha(dados_finais, "MEZANINO", "grafico2", cat);
  criarGraficoRosquinha(dados_finais, "EXTERNO", "grafico3", cat);
};

const criarGraficoRosquinha = (data, tipo, containerId, horario) => {
  if (!data) return;

  const safeToFixed = (value) =>
    typeof value === "number" && !isNaN(value) ? value.toFixed(2) : 0;
  let valores = [];
  let labels = [];

  if (tipo === "MAQUINA") {
    valores = [
      safeToFixed(data[horario]["M"]),
      safeToFixed(data[horario]["Y"]),
      safeToFixed(data[horario]["V"]),
      safeToFixed(data[horario]["H"]),
    ];
    labels = ["M", "Y", "V", "H"];
  } else if (tipo === "MEZANINO") {
    valores = [
      safeToFixed(data[horario]["A"]),
      safeToFixed(data[horario]["X"]),
      safeToFixed(data[horario]["N"]),
      safeToFixed(data[horario]["J"]),
      safeToFixed(data[horario]["W"]),
    ];
    labels = ["A", "X", "N", "J", "W"];
  } else if (tipo === "EXTERNO") {
    valores = [
      safeToFixed(data[horario]["D"]),
      safeToFixed(data[horario]["K"]),
      safeToFixed(data[horario]["Z"]),
    ];
    labels = ["D", "K", "Z"];
  }

  const chartData = valores.map((valor, index) => ({
    x: labels[index],
    value: valor,
  }));
  const containerElem = document.getElementById(containerId);

  // Se o gráfico já existe, atualiza os dados; caso contrário, cria um novo gráfico
  if (pieCharts[containerId]) {
    const chart = pieCharts[containerId];
    chart.data(chartData);
    chart.draw();
  } else {
    const chart = anychart.pie(chartData);
    chart.animation(false);
    chart.interactivity().hoverMode("none");
    chart.innerRadius("30%");
    chart.legend().enabled(false);
    chart.title({
      text: tipo,
      fontSize: 20,
      fontColor: "white",
      fontWeight: "bold",
      alignment: "center",
      padding: [0, 0, 10, 0],
    });
    chart
      .labels()
      .position("outside")
      .format("{%x}: \n {%value}%")
      .fontSize(15)
      .fontColor("white");
    chart.connectorStroke({ color: "white", thickness: 2, dash: "2 2" });
    chart.background().fill("rgb(20, 20, 20)");
    chart.container(containerId);
    chart.draw();
    pieCharts[containerId] = chart;
  }
};

// Inicialização única dos eventos após o carregamento do DOM
document.addEventListener("DOMContentLoaded", () => {
  atualizarGrafico_1("NAT");
  carregarTabela();
  atualizarRosquinhas();
  if (showCalendarBtn && calendar) {
    showCalendarBtn.addEventListener("click", () => {
      calendar.style.display =
        calendar.style.display === "none" || calendar.style.display === ""
          ? "inline"
          : "none";
    });
  }
});
