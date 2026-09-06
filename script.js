
// ==========================================
// 2. INICIALIZAÇÃO E CONFIGURAÇÃO DAS CIDADES
// ==========================================
const CIDADES = {
    ipatinga: { coords: [-19.4658, -42.4800], zoom: 12, ibge: '3131307', nome: "Ipatinga, MG" },
    juiz_de_fora: { coords: [-21.7642, -43.3496], zoom: 12, ibge: '3136702', nome: "Juiz de Fora, MG" }
};

let cidadeAtual = 'ipatinga'; // Começa em Ipatinga
let marcadorAtual = null;

const mapa = L.map('mapa-alerta', { zoomControl: false }).setView(CIDADES[cidadeAtual].coords, CIDADES[cidadeAtual].zoom);
L.control.zoom({ position: 'bottomleft' }).addTo(mapa);

mapa.createPane('paneLimite');
mapa.getPane('paneLimite').style.zIndex = 450;
mapa.getPane('paneLimite').style.pointerEvents = 'none';

const mapaRuas = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 20, maxNativeZoom: 19 });
const mapaSatelite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 21, maxNativeZoom: 18 });
const mapaTopografico = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { maxZoom: 17, maxNativeZoom: 17, attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)' });

// Define e adiciona ao mapa a camada inicial escolhida nas configurações
const camadaInicialPreferida = localStorage.getItem("camada_padrao") || "ruas";
let mapaBaseAtivo = mapaRuas;
if (camadaInicialPreferida === "satelite") {
    mapaBaseAtivo = mapaSatelite;
} else if (camadaInicialPreferida === "topo") {
    mapaBaseAtivo = mapaTopografico;
}
mapaBaseAtivo.addTo(mapa);
const iconeVermelho = L.divIcon({
    className: 'custom-pin-wrapper',
    html: `
        <div class="pin-moderno-container">
            <div class="pin-moderno"></div>
        </div>
    `,
    iconSize: [30, 42],
    iconAnchor: [15, 42],   
    popupAnchor: [0, -42]   
});


// ==========================================
// 3. CAMADAS DE DADOS (IPATINGA E JF)
// ==========================================
// Containers principais que ficam no mapa
const grupoLimite = L.featureGroup().addTo(mapa);
const grupoEnchente = L.featureGroup().addTo(mapa);
const grupoDeslizamento = L.featureGroup().addTo(mapa);

// Estilos padronizados
const estiloLimite = { color: 'red', fillOpacity: 0, weight: 2.5 };
const estiloEnchente = { color: 'blue', fillOpacity: 0.2, weight: 1.5 };
const estiloDeslizamento = { color: 'orange', fillOpacity: 0.2, weight: 1.5 };
// --- Dicionário e Variáveis de Solo ---
const dicionarioSolos = {
    "Latossolo amarelo distrófico": {
        nomePopular: "(Barro Amarelo)",
        corSolo: "#c9a37d",
        suscetibilidade: "Baixa",
        corSuscetibilidade: "#4CAF50"
    },
    "Latossolo vermelho-amarelo distrófico": {
        nomePopular: "(Barro Misto)",
        corSolo: "#BC8F8F",
        suscetibilidade: "Média",
        corSuscetibilidade: "#FF9800"
    },
    "Argissolo vermelho distrófico": {
        nomePopular: "(Barro Vermelho)",
        corSolo: "#A0522D",
        suscetibilidade: "Alta",
        corSuscetibilidade: "#F44336"
    }
};

let camadaSolos; 
let dadosGeoJsonSolos;
// --------------------------------------
// --- Dados de Ipatinga ---
const limiteIpa = L.geoJSON(null, { pane: 'paneLimite', style: estiloLimite, interactive: false });
const enchenteIpa = L.geoJSON(null, { filter: f => f.properties.classe && f.properties.classe.toLowerCase().includes("alt"), style: estiloEnchente });
const deslizamentoIpa = L.geoJSON(null, { filter: f => f.properties.classe && f.properties.classe.toLowerCase().includes("alt"), style: estiloDeslizamento });

fetch(`https://servicodados.ibge.gov.br/api/v3/malhas/municipios/${CIDADES.ipatinga.ibge}?formato=application/vnd.geo+json`).then(r=>r.json()).then(d=>limiteIpa.addData(d));
fetch('data/Inundacao_A1.json').then(r=>r.json()).then(d=>enchenteIpa.addData(d));
fetch('data/Movimento_de_Massa_A1.json').then(r=>r.json()).then(d=>deslizamentoIpa.addData(d));
const grupoDefesaCivil = L.featureGroup().addTo(mapa); // Nasce ligado

const estiloDefesaCivil = { 
    color: '#ef4444',     // Borda vermelha unificada
    weight: 2,            
    fillOpacity: 0.3      
};

const defesaCivilIpa = L.geoJSON(null, { style: estiloDefesaCivil });

fetch('data/areas de risco IPATINGA_MG.geojson')
    .then(r => r.json())
    .then(d => defesaCivilIpa.addData(d))
    .catch(error => console.error("Erro ao carregar o GeoJSON da Defesa Civil:", error));

grupoDefesaCivil.addLayer(defesaCivilIpa);
// --- Dados de Juiz de Fora ---
/*const limiteJF = L.geoJSON(null, { pane: 'paneLimite', style: estiloLimite, interactive: false });
const enchenteJF = L.geoJSON(null, { filter: f => f.properties.TIPOLO_G1 === 'Inundação', style: estiloEnchente });
const deslizamentoJF = L.geoJSON(null, { filter: f => f.properties.TIPOLO_G1 === 'Deslizamento', style: estiloDeslizamento });

// ===== DESATIVADO PARA A APRESENTAÇÃO NA ESCOLA =====
fetch(`https://servicodados.ibge.gov.br/api/v3/malhas/municipios/${CIDADES.juiz_de_fora.ibge}?formato=application/vnd.geo+json`).then(r=>r.json()).then(d=>limiteJF.addData(d));
fetch('data/juiz_de_fora_risco_2017.geojson').then(r=>r.json()).then(d=>{
    enchenteJF.addData(d);
    deslizamentoJF.addData(d);
});
*/


//----------------------------------------------//
// Inicialização: Ativar Ipatinga por padrão
grupoLimite.addLayer(limiteIpa);
grupoEnchente.addLayer(enchenteIpa);
grupoDeslizamento.addLayer(deslizamentoIpa);

// Adicionando controles de camadas gerais


// --- Carregamento do Mapa de Solos (Nasce desligado) ---
fetch('data/solos_ipatinga.geojson')
    .then(response => response.json())
    .then(data => {
        dadosGeoJsonSolos = data; 
        
        camadaSolos = L.geoJSON(data, {
            style: function (feature) {
                const tipo = feature.properties.legenda;
                const infoSolo = dicionarioSolos[tipo];
                
                return {
                    fillColor: infoSolo ? infoSolo.corSolo : "#999999", 
                    weight: 1, 
                    opacity: 1,
                    color: 'white', 
                    dashArray: '3', 
                    fillOpacity: 0.6 
                };
            }
        });

        // Adiciona ao menu de camadas sem ativar no mapa
        controleCamadas.addOverlay(camadaSolos, "Tipos de Solo");
    })
    .catch(error => console.error('Erro ao carregar mapa de solos:', error));


// ==========================================
// 4. LÓGICA DO SELETOR DE CIDADES
// ==========================================
document.querySelectorAll('.btn-cidade').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const novaCidade = e.target.getAttribute('data-cidade');
        if (novaCidade === cidadeAtual) return; // Evita recarregar a mesma cidade

        cidadeAtual = novaCidade;
        const config = CIDADES[cidadeAtual];

        // Atualiza a interface dos botões
        document.querySelectorAll('.btn-cidade').forEach(b => b.classList.remove('ativo'));
        e.target.classList.add('ativo');

        // Navega até a cidade
        mapa.flyTo(config.coords, config.zoom, { animate: true, duration: 1.5 });

        // Limpa os grupos e insere as camadas da cidade selecionada
        grupoLimite.clearLayers();
        grupoEnchente.clearLayers();
        grupoDeslizamento.clearLayers();

        if (cidadeAtual === 'ipatinga') {
            grupoLimite.addLayer(limiteIpa);
            grupoEnchente.addLayer(enchenteIpa);
            grupoDeslizamento.addLayer(deslizamentoIpa);
            document.getElementById('input-endereco').placeholder = "Ex: Rua Amazonita, Ipatinga";
        } else {
            grupoLimite.addLayer(limiteJF);
            grupoEnchente.addLayer(enchenteJF);
            grupoDeslizamento.addLayer(deslizamentoJF);
            document.getElementById('input-endereco').placeholder = "Ex: Rua Manoel Moreira Moraes, Juiz de Fora";
        }

        // Remove o marcador ativo, se houver, ao trocar de cidade
        if (marcadorAtual) {
            mapa.removeLayer(marcadorAtual);
            marcadorAtual = null;
        }
    });
});

// ==========================================
// 5. LEGENDA (Atualizada v1.1.5)
// ==========================================

// ==========================================
// 6. SISTEMA DE BUSCA E AUTOCOMPLETE (Photon API)
// ==========================================
const btnBuscar = document.getElementById('btn-buscar');
const inputEndereco = document.getElementById('input-endereco');

// Cria a caixa de sugestões dinamicamente e deixa o CSS estilizar
let caixaSugestoes = document.getElementById('caixa-sugestoes');
if (!caixaSugestoes && inputEndereco) {
    caixaSugestoes = document.createElement('div');
    caixaSugestoes.id = 'caixa-sugestoes';
    document.querySelector('.barra-busca-flutuante').after(caixaSugestoes); 
}

let timeoutBusca = null;
let selecionandoItem = false; // <--- TRAVA DE SEGURANÇA PARA NÃO REABRI A CAIXA

// 1. OUVINTE DE DIGITAÇÃO NA BARRA DE BUSCA
if (inputEndereco) {
    inputEndereco.addEventListener('input', function(event) {
        if (selecionandoItem) return; // <--- Se estivermos selecionando, ignora e não abre a caixa

        const termo = this.value.trim();
        clearTimeout(timeoutBusca); 

        if (termo.length < 3) {
            caixaSugestoes.style.display = 'none';
            caixaSugestoes.innerHTML = '';
            return;
        }

        timeoutBusca = setTimeout(() => {
            const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(termo + ", " + CIDADES[cidadeAtual].nome)}&limit=5`;
            
            fetch(url)
                .then(res => res.json())
                .then(dados => {
                    caixaSugestoes.innerHTML = ''; 
                    
                    if (dados && dados.features && dados.features.length > 0) {
                        caixaSugestoes.style.display = 'flex';
                        
                        const nomesJaVistos = new Set();
                        
                        dados.features.forEach(feature => {
                            const props = feature.properties;
                            const lon = feature.geometry.coordinates[0];
                            const lat = feature.geometry.coordinates[1];
                            
                            const nomeLocal = props.street || props.name || props.district || props.locality || termo;
                            
                            let nomeChecagem = nomeLocal.toLowerCase();
                            nomeChecagem = nomeChecagem.replace(" segundo", " ii").replace(" primeiro", " i").replace(" terceiro", " iii");
                            
                            if (nomesJaVistos.has(nomeChecagem)) {
                                return; 
                            }
                            nomesJaVistos.add(nomeChecagem);

                            const detalhes = CIDADES[cidadeAtual].nome; 

                            const divItem = document.createElement('div');
                            divItem.className = 'sugestao-item';
                            divItem.innerHTML = `📍 <div><strong>${nomeLocal}</strong><br><small style="color:var(--cor-texto-secundario);">${detalhes}</small></div>`;
                            
                            // CLICAR EM UM ITEM DA LISTA
                            divItem.addEventListener('click', () => {
                                selecionandoItem = true; // Ativa a trava
                                inputEndereco.value = nomeLocal;
                                inputEndereco.dispatchEvent(new Event('input')); 
                                
                                caixaSugestoes.style.display = 'none'; // Esconde a caixa imediatamente
                                processarEnderecoNoMapa(lat, lon, nomeLocal); 

                                setTimeout(() => { selecionandoItem = false; }, 400); // Libera a trava após um instante
                            });

                            caixaSugestoes.appendChild(divItem);
                        });
                        
                        if (caixaSugestoes.children.length === 0) {
                            caixaSugestoes.innerHTML = '<div style="padding: 12px 20px; color: var(--cor-texto-secundario); font-size: 0.95rem;">Nenhum endereço exato encontrado.</div>';
                        }
                        
                    } else {
                        caixaSugestoes.style.display = 'none';
                    }
                })
                .catch(err => console.error("Erro no Autocomplete:", err));
        }, 400);
    });

    // DISPARAR COM ENTER
    inputEndereco.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            caixaSugestoes.style.display = 'none'; // Esconde a caixa ao dar Enter
            
            if (caixaSugestoes.style.display === 'flex' && caixaSugestoes.firstChild) {
                caixaSugestoes.firstChild.click();
            } else if (btnBuscar) {
                btnBuscar.click();
            }
        }
    });
}

// Fecha a caixa se clicar fora dela
document.addEventListener('click', (e) => {
    if (caixaSugestoes && e.target !== inputEndereco && !caixaSugestoes.contains(e.target)) {
        caixaSugestoes.style.display = 'none';
    }
});

const iconeLupa = `<svg class="icone-lupa-svg" viewBox="0 0 24 24" width="20" height="20"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>`;
const iconeLoading = `<div class="spinner" style="width: 18px; height: 18px; margin: 0; border-width: 2px; border-top-color: var(--cor-primaria);"></div>`;

// AÇÃO DE CLICAR NO BOTÃO "BUSCAR" MANUALMENTE (LUPA)
if (btnBuscar) {
    btnBuscar.addEventListener('click', () => {
        const enderecoPesquisado = inputEndereco.value.trim();
        if (!enderecoPesquisado) return;
        
        selecionandoItem = true; // Ativa a trava
        caixaSugestoes.style.display = 'none'; // Esconde a caixa
        btnBuscar.innerHTML = iconeLoading;
        btnBuscar.disabled = true;

        const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(enderecoPesquisado + ", " + CIDADES[cidadeAtual].nome)}&limit=1`;
        
        fetch(url)
            .then(res => res.json())
            .then(dadosBusca => {
                btnBuscar.innerHTML = iconeLupa;
                btnBuscar.disabled = false;
                if (dadosBusca && dadosBusca.features && dadosBusca.features.length > 0) {
                    const props = dadosBusca.features[0].properties;
                    const lon = dadosBusca.features[0].geometry.coordinates[0];
                    const lat = dadosBusca.features[0].geometry.coordinates[1];
                    const nomeOficial = props.street || props.name || props.district || props.locality || enderecoPesquisado;
                    
                    inputEndereco.value = nomeOficial;
                    inputEndereco.dispatchEvent(new Event('input'));
                    caixaSugestoes.style.display = 'none';
                    processarEnderecoNoMapa(lat, lon, nomeOficial);
                }
                setTimeout(() => { selecionandoItem = false; }, 400); // Libera a trava
            })
            .catch(() => { 
                btnBuscar.innerHTML = iconeLupa; 
                btnBuscar.disabled = false; 
                selecionandoItem = false;
            });
    });
}

// 3. MOTOR CENTRAL DO MAPA
function processarEnderecoNoMapa(lat, lon, nomeOficial) {
    salvarNoHistorico(nomeOficial); 
    const ponto = turf.point([lon, lat]);

    mapa.flyTo([lat, lon], 19, { animate: true, duration: 2.5 });
    if (marcadorAtual) mapa.removeLayer(marcadorAtual);
    
    let riscoNome = "Baixo / Não Mapeado", fatorObs = "Área estável.", recomendacao = "Mesmo fora das áreas classificadas como de alto risco, recomenda-se atenção durante episódios de chuvas intensas e acompanhamento dos alertas da Defesa Civil.", cor = "green", poligono = null;

    const camadaAtivaDeslizamento = cidadeAtual === 'ipatinga' ? deslizamentoIpa : (typeof deslizamentoJF !== 'undefined' ? deslizamentoJF : null);
    const camadaAtivaEnchente = cidadeAtual === 'ipatinga' ? enchenteIpa : (typeof enchenteJF !== 'undefined' ? enchenteJF : null);

    if (camadaAtivaDeslizamento) {
        poligono = camadaAtivaDeslizamento.toGeoJSON().features.find(f => turf.booleanPointInPolygon(ponto, f));
    }
    
    if (poligono) { 
        riscoNome = "ALTO (Deslizamento)"; 
        fatorObs = poligono.properties.obs || poligono.properties.DESCRICAO || "Encosta com declividade."; 
        recomendacao = "Durante períodos chuvosos, observe sinais de instabilidade. Ao identificar trincas ou postes inclinados, comunique a Defesa Civil pelo 199."; 
        cor = "orange"; 
    } else if (camadaAtivaEnchente) {
        poligono = camadaAtivaEnchente.toGeoJSON().features.find(f => turf.booleanPointInPolygon(ponto, f));
        if (poligono) { 
            riscoNome = "ALTO (Inundação)"; 
            fatorObs = poligono.properties.obs || poligono.properties.DESCRICAO || "Deficiência de drenagem ou alagamento."; 
            recomendacao = "Fique atento a chuva muito forte por várias horas seguidas e aumento rápido do nível de rios e ribeirões."; 
            cor = "blue"; 
        }
    }

    marcadorAtual = L.marker([lat, lon], { icon: iconeVermelho }).addTo(mapa)
        .bindPopup(`<div style="min-width: 150px;">
            <h4 style="margin:0 0 5px;">📍 Localização</h4>
            <p style="margin:0; font-size:0.9em; text-transform: uppercase;">${nomeOficial}</p>
            <hr style="margin:10px 0;"><strong style="color:${cor};">${riscoNome}</strong></div>`)
        .openPopup();

    const elRisco = document.getElementById('txt-risco');
    const elFator = document.getElementById('txt-fator');
    const elRec = document.getElementById('txt-recomendacoes');
    if(elRisco) { elRisco.innerText = riscoNome; elRisco.style.color = cor; }
    if(elFator) elFator.innerText = fatorObs;
    if(elRec) elRec.innerText = recomendacao;

    let nomeTecnico = "Não mapeado", nomePopular = "", nivelSuscetibilidade = "-", corSolo = "var(--cor-texto-secundario)", corSus = "var(--cor-texto-secundario)";
    if (dadosGeoJsonSolos) {
        const poligonoSolo = dadosGeoJsonSolos.features.find(f => turf.booleanPointInPolygon(ponto, f));
        if (poligonoSolo) {
            nomeTecnico = poligonoSolo.properties.legenda;
            const info = dicionarioSolos[nomeTecnico];
            if (info) {
                nomePopular = info.nomePopular; 
                nivelSuscetibilidade = info.suscetibilidade;
                corSolo = info.corSolo;
                corSus = info.corSuscetibilidade;
            }
        }
    }
    const txtTipo = document.getElementById('txt-tipo-solo');
    const txtSus = document.getElementById('txt-suscetibilidade-solo');
    if (txtTipo) {
        txtTipo.innerHTML = `${nomeTecnico} <span style="font-size: 0.85em; font-weight: normal; color: var(--cor-texto);">${nomePopular}</span>`;
        txtTipo.style.color = corSolo;
    }
    if (txtSus) {
        txtSus.innerText = nivelSuscetibilidade;
        txtSus.style.color = corSus;
    }
}
// ==========================================
// 7. BOTÃO RECENTRALIZAR DINÂMICO
// ==========================================
const RecentralizarMapa = L.Control.extend({
    options: { position: 'bottomleft' },
    onAdd: function () {
        // Criamos sem a classe 'leaflet-bar' para evitar o contorno padrão indesejado
        const container = L.DomUtil.create('div', 'leaflet-control-recentralizar-wrapper');
        const botao = L.DomUtil.create('a', 'leaflet-control-recentralizar', container);
        botao.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;
        botao.title = 'Recentralizar'; 
        botao.href = '#';
        
        L.DomEvent.on(botao, 'click', function (e) {
            L.DomEvent.stopPropagation(e); L.DomEvent.preventDefault(e);
            mapa.flyTo(CIDADES[cidadeAtual].coords, CIDADES[cidadeAtual].zoom, { animate: true, duration: 1.5 });
        });
        return container;
    }
});
mapa.addControl(new RecentralizarMapa());
// ==========================================
// 8. CLIQUE NO MAPA (GEOCODIFICAÇÃO REVERSA E RISCO)
// ==========================================
mapa.on('click', async function(e) {
    const lat = e.latlng.lat;
    const lon = e.latlng.lng;

    // 1. Aproxima do local clicado (igual à busca)
    mapa.flyTo([lat, lon], 19, { animate: true, duration: 2.5 });

    // 2. Remove o marcador anterior, se houver
    if (marcadorAtual) {
        mapa.removeLayer(marcadorAtual);
    }

    // 3. Adiciona o marcador vermelho temporário
    marcadorAtual = L.marker([lat, lon], { icon: iconeVermelho }).addTo(mapa)
        .bindPopup("Calculando risco...")
        .openPopup();

    // 4. Calcula o risco para o ponto clicado usando turf.js
    const ponto = turf.point([lon, lat]);
    let riscoNome = "Baixo / Não Mapeado", fatorObs = "Área estável.", recomendacao = "Mesmo fora das áreas classificadas como de alto risco, recomenda-se atenção durante episódios de chuvas intensas e acompanhamento dos alertas da Defesa Civil.", cor = "green", poligono = null;
    
    const camadaAtivaDeslizamento = cidadeAtual === 'ipatinga' ? deslizamentoIpa : deslizamentoJF;
    const camadaAtivaEnchente = cidadeAtual === 'ipatinga' ? enchenteIpa : enchenteJF;

    poligono = camadaAtivaDeslizamento.toGeoJSON().features.find(f => turf.booleanPointInPolygon(ponto, f));
    if (poligono) { 
        riscoNome = "ALTO (Deslizamento)"; 
        fatorObs = poligono.properties.obs || poligono.properties.DESCRICAO || "Encosta com declividade."; 
        recomendacao = "Durante períodos chuvosos, observe sinais de instabilidade, como surgimento de trincas no solo ou nas edificações, movimentação de terra e inclinação anormal de árvores, muros ou postes. Ao identificar esses sinais, afaste-se da área e comunique a Defesa Civil pelo 199."; 
        cor = "orange"; 
    } else {
        poligono = camadaAtivaEnchente.toGeoJSON().features.find(f => turf.booleanPointInPolygon(ponto, f));
        if (poligono) { 
            riscoNome = "ALTO (Inundação)"; 
            fatorObs = poligono.properties.obs || poligono.properties.DESCRICAO || "Deficiência de drenagem ou alagamento."; 
            recomendacao = "Em períodos de chuva intensa ou prolongada, acompanhe os alertas oficiais e fique atento à elevação do nível de rios, córregos e canais. Evite transitar por áreas inundadas ou com correnteza e, em situação de emergência, acione a Defesa Civil pelo 199 ou o Corpo de Bombeiros pelo 193."; 
            cor = "blue"; 
        }
    }

    // Atualiza o Painel de Análise lateral
    const elRisco = document.getElementById('txt-risco');
    const elFator = document.getElementById('txt-fator');
    const elRec = document.getElementById('txt-recomendacoes');
    
    if(elRisco) { elRisco.innerText = riscoNome; elRisco.style.color = cor; }
    if(elFator) elFator.innerText = fatorObs;
    if(elRec) elRec.innerText = recomendacao;
// ==========================================
// --- MÓDULO DE INTERSEÇÃO DO SOLO (TURF.JS) ---
// ==========================================
let nomeTecnico = "Não mapeado";
let nomePopular = "";
let nivelSuscetibilidade = "-";
let corSolo = "var(--cor-texto-secundario)";
let corSus = "var(--cor-texto-secundario)";

if (dadosGeoJsonSolos) {
    // Procura em qual polígono de solo o ponto caiu
    const poligonoSolo = dadosGeoJsonSolos.features.find(f => turf.booleanPointInPolygon(ponto, f));
    
    if (poligonoSolo) {
        nomeTecnico = poligonoSolo.properties.legenda;
        const info = dicionarioSolos[nomeTecnico];
        
        if (info) {
            nomePopular = info.nomePopular; // Já vem com os parênteses do dicionário
            nivelSuscetibilidade = info.suscetibilidade;
            corSolo = info.corSolo;
            corSus = info.corSuscetibilidade;
        }
    }
}

// Injeta os dados no HTML e aplica as cores dinâmicas
const txtTipo = document.getElementById('txt-tipo-solo');
const txtSus = document.getElementById('txt-suscetibilidade-solo');

if (txtTipo) {
    txtTipo.innerHTML = `${nomeTecnico} <span style="font-size: 0.85em; font-weight: normal; color: var(--cor-texto);">${nomePopular}</span>`;
    txtTipo.style.color = corSolo;
}
if (txtSus) {
    txtSus.innerText = nivelSuscetibilidade;
    txtSus.style.color = corSus;
}
// ==========================================
    // 5. Busca o endereço real na API Nominatim
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        let localidade = "Endereço não encontrado";
        
        // Filtra para pegar apenas a rua ou bairro
        if (data && data.address) {
            localidade = data.address.road || data.address.neighbourhood || data.address.suburb || data.display_name.split(',')[0];
        } else if (data && data.display_name) {
            localidade = data.display_name.split(',')[0]; 
        }

        // ATUALIZA A BARRA DE BUSCA COM O NOME DA RUA CLICADA
        const inputEndereco = document.getElementById('input-endereco');
        if (inputEndereco) {
            selecionandoItem = true; // <--- Ativa a trava para o clique do mapa não abrir a caixa
            inputEndereco.value = localidade;
            inputEndereco.dispatchEvent(new Event('input'));
            
            // Garante que a caixa de sugestões fique fechada
            if (typeof caixaSugestoes !== 'undefined' && caixaSugestoes) {
                caixaSugestoes.style.display = 'none';
            }
            
            setTimeout(() => { selecionandoItem = false; }, 400); // <--- Libera a trava depois
        }

        // Atualiza o popup do marcador SEM cores fixas para respeitar o CSS
        marcadorAtual.bindPopup(`
            <div style="min-width: 150px; font-family: sans-serif;">
                <h4 style="margin: 0 0 5px 0; font-size: 14px;">📍 Localização</h4>
                <p style="margin: 0; font-size: 13px; text-transform: uppercase;">${localidade}</p>
                <hr style="margin: 8px 0; border: 0; border-top: 1px solid var(--cor-borda-suave);">
                <strong style="color: ${cor}; font-size: 13px;">${riscoNome}</strong>
            </div>
        `).openPopup();

    } catch (error) {
        console.error("Erro ao buscar o endereço:", error);
        marcadorAtual.bindPopup(`
            <div style="min-width: 150px; font-family: sans-serif;">
                <h4 style="margin: 0 0 5px 0; font-size: 14px;">📍 Localização</h4>
                <p style="margin: 0; font-size: 13px; text-transform: uppercase;">LOCAL SELECIONADO</p>
                <hr style="margin: 8px 0; border: 0; border-top: 1px solid var(--cor-borda-suave);">
                <strong style="color: ${cor}; font-size: 13px;">${riscoNome}</strong>
            </div>
        `).openPopup();
    }
}); 
// ==========================================
// 9. LÓGICA DE RECOLHER/EXPANDIR OS PAINÉIS
// ==========================================
const botoesPaineis = [
    { btn: document.getElementById('btn-toggle-analise'), painel: document.getElementById('painel-analise') },
    { btn: document.getElementById('btn-toggle-clima'), painel: document.getElementById('painel-clima') },
    { btn: document.getElementById('btn-toggle-solo'), painel: document.getElementById('painel-solo') },
    { btn: document.getElementById('btn-toggle-autoridades'), painel: document.getElementById('painel-autoridades') }
];

botoesPaineis.forEach(item => {
    if(!item.btn || !item.painel) return; // Segurança caso algum não exista no HTML

    item.btn.addEventListener('click', () => {
        // Se o painel clicado já está aberto, a gente só fecha ele (limpa a tela)
        if (item.btn.classList.contains('ativo')) {
            item.painel.classList.add('painel-oculto');
            item.btn.classList.remove('ativo');
        } else {
            // Se estava fechado, primeiro FECHAMOS TODOS os outros...
            botoesPaineis.forEach(outro => {
                outro.painel.classList.add('painel-oculto');
                outro.btn.classList.remove('ativo');
            });
            // ...e então ABIRMOS apenas o que foi clicado
            item.painel.classList.remove('painel-oculto');
            item.btn.classList.add('ativo');
        }
    });
});

// ==========================================
// 10. MOTOR METEOROLÓGICO, GRÁFICO E SATURAÇÃO DO SOLO
// ==========================================
let dadosClimaGlobais = null;
let modoGraficoAtual = 'diario'; // 'diario' (horas) ou 'semanal' (dias)

function mudarModoGrafico(modo) {
    modoGraficoAtual = modo;
    
    const btnDiario = document.getElementById('btn-modo-diario');
    const btnSemanal = document.getElementById('btn-modo-semanal');
    
    if (btnDiario && btnSemanal) {
        if (modo === 'diario') {
            btnDiario.classList.add('active');
            btnSemanal.classList.remove('active');
        } else {
            btnSemanal.classList.add('active');
            btnDiario.classList.remove('active');
        }
    }
    
    if (dadosClimaGlobais) {
        desenharGraficoBarras(dadosClimaGlobais);
    }
}

function desenharGraficoBarras(dados) {
    const container = document.getElementById('grafico-barras-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    let itensParaExibir = [];
    
    if (modoGraficoAtual === 'diario') {
        const chuvas = dados.hourly.precipitation;
        
        // Eixo X fixo: 24 horas do dia atual (00h às 23h)
        for (let i = 0; i < 24; i++) {
            const horaFormatada = i.toString().padStart(2, '0') + 'h';
            itensParaExibir.push({
                rotulo: horaFormatada,
                valor: chuvas[i] || 0
            });
        }
    } else {
        const dias = dados.daily.time;
        const somasChuvas = dados.daily.precipitation_sum;
        const nomesDias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        
        // Eixo X Dinâmico: Começa de Hoje e avança os dias da API
        for (let i = 0; i < dias.length; i++) {
            const dataObj = new Date(dias[i] + 'T00:00:00'); 
            const diaSemana = dataObj.getDay(); 
            const diaMes = dataObj.getDate().toString().padStart(2, '0');
            
            // O primeiro item da lista sempre será rotulado como "Hoje"
            let rotuloDia = i === 0 ? 'Hoje' : nomesDias[diaSemana];
            
            itensParaExibir.push({
                rotulo: `${rotuloDia}<br><span style="font-size: 0.9em; opacity: 0.7;">${diaMes}</span>`,
                valor: somasChuvas[i] || 0
            });
        }
    }
    
    if (itensParaExibir.length === 0) {
        container.innerHTML = '<div class="grafico-vazio">Sem dados disponíveis.</div>';
        return;
    }
    
    // Encontra o maior valor para calcular a altura percentual das barras
    const maxValor = Math.max(...itensParaExibir.map(item => item.valor), 1);
    
    // Renderiza as barras
    itensParaExibir.forEach(item => {
        const alturaPercent = Math.min(Math.round((item.valor / maxValor) * 90), 90);
        
        const barraItem = document.createElement('div');
        barraItem.className = 'barra-item';
        
        barraItem.innerHTML = `
            <div class="barra-coluna-wrapper">
                <div class="barra-coluna" style="height: ${Math.max(alturaPercent, 4)}%;">
                    <span class="barra-valor">${item.valor}mm</span>
                </div>
            </div>
            <span class="barra-rotulo">${item.rotulo}</span>
        `;
        
        container.appendChild(barraItem);
    });
}

function atualizarClimaParaLocalNoMapa() {
    const centro = mapa.getCenter();
    const lat = centro.lat;
    const lon = centro.lng;
    
    const txtClima = document.getElementById('txt-clima');
    const txtPrevisao = document.getElementById('txt-proxima-chuva');
    const iconeStatus = document.getElementById('icone-clima-status');
    const containerGrafico = document.getElementById('grafico-barras-container');
    
    // Elementos do Painel de Solo
    const barraSaturacao = document.getElementById('barra-saturacao');
    const txtSaturacao = document.getElementById('txt-saturacao');
    const txtAlertaSolo = document.getElementById('txt-alerta-solo');
    const painelAlerta = txtAlertaSolo ? txtAlertaSolo.parentElement : null;

    if (txtClima) txtClima.innerText = "A consultar satélite...";
    if (txtPrevisao) txtPrevisao.innerText = "A analisar previsão...";
    if (txtSaturacao) txtSaturacao.innerText = "Calculando umidade superficial...";
    
    if (containerGrafico && !dadosClimaGlobais) {
        containerGrafico.innerHTML = '<div class="grafico-loading">A carregar dados do gráfico...</div>';
    }

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=precipitation&hourly=precipitation,soil_moisture_0_to_7cm&daily=precipitation_sum&forecast_days=7&timezone=America/Sao_Paulo`;

    fetch(url)
        .then(resposta => resposta.json())
        .then(dados => {
            dadosClimaGlobais = dados;
            
            // --- 1. ATUALIZA O CARD DE CONDIÇÃO ATUAL ---
            if (txtClima) {
                const chuvaAtual = dados.current.precipitation;
                if (chuvaAtual > 0) {
                    if (iconeStatus) iconeStatus.innerText = '🌧️';
                    txtClima.innerHTML = `Chovendo agora<br><strong style="color: #3b82f6;">${chuvaAtual} mm</strong>`;
                } else {
                    if (iconeStatus) iconeStatus.innerText = '☀️';
                    txtClima.innerHTML = `Tempo seco<br><strong>0 mm</strong>`;
                }
            }

            // --- 2. ATUALIZA A PRÓXIMA PREVISÃO ---
            if (txtPrevisao) {
                const tempos = dados.hourly.time;
                const chuvas = dados.hourly.precipitation;
                const agora = new Date();
                let proximaChuva = null;

                for (let i = 0; i < tempos.length; i++) {
                    const horaPrevisao = new Date(tempos[i]);
                    if (horaPrevisao > agora && chuvas[i] > 0) {
                        proximaChuva = { data: horaPrevisao, volume: chuvas[i] };
                        break;
                    }
                }

                if (proximaChuva) {
                    let diaNome = proximaChuva.data.toLocaleDateString('pt-BR', { weekday: 'long' });
                    diaNome = diaNome.charAt(0).toUpperCase() + diaNome.slice(1);
                    const horaFormatada = proximaChuva.data.getHours().toString().padStart(2, '0') + "h";
                    txtPrevisao.innerHTML = `⏳ <strong>Alerta:</strong> ${diaNome} às ${horaFormatada} (~${proximaChuva.volume}mm)`;
                } else {
                    txtPrevisao.innerHTML = `☀️ Nenhuma chuva prevista para os próximos dias.`;
                }
            }

            // --- 3. ATUALIZA O PAINEL DE SATURAÇÃO DO SOLO ---
            if (barraSaturacao && txtSaturacao && txtAlertaSolo) {
                const agoraHora = new Date().getHours();
                const humidade = dados.hourly.soil_moisture_0_to_7cm[agoraHora]; 

                let percentagem = (humidade / 0.40) * 100;
                if (percentagem > 100) percentagem = 100;
                if (percentagem < 0) percentagem = 0;

                barraSaturacao.style.width = `${percentagem}%`;

                if (percentagem < 50) {
                    barraSaturacao.style.backgroundColor = "#4CAF50"; 
                    txtSaturacao.innerText = `${Math.round(percentagem)}% - Solo Estável`;
                    txtSaturacao.style.color = "#4CAF50";
                    if(painelAlerta) painelAlerta.style.borderLeftColor = "#4CAF50";
                    txtAlertaSolo.innerText = "Alta capacidade de infiltração. Risco de escoamento superficial (runoff) mínimo neste momento.";
                } else if (percentagem < 80) {
                    barraSaturacao.style.backgroundColor = "#ff9800"; 
                    txtSaturacao.innerText = `${Math.round(percentagem)}% - Pré-saturação`;
                    txtSaturacao.style.color = "#ff9800";
                    if(painelAlerta) painelAlerta.style.borderLeftColor = "#ff9800";
                    txtAlertaSolo.innerText = "Infiltração reduzida. O solo apresenta acumulação de eventos de chuva recentes. Atenção em caso de novas precipitações.";
                } else {
                    barraSaturacao.style.backgroundColor = "#f44336"; 
                    txtSaturacao.innerText = `${Math.round(percentagem)}% - Solo Saturado`;
                    txtSaturacao.style.color = "#f44336";
                    if(painelAlerta) painelAlerta.style.borderLeftColor = "#f44336";
                    txtAlertaSolo.innerHTML = "<strong>ALERTA HIDROLÓGICO:</strong> Capacidade de infiltração esgotada. Risco máximo de sobrecarga no sistema de drenagem da bacia caso ocorram chuvas.";
                }
            }

            // --- 4. DESENHA O GRÁFICO DE BARRAS ---
            desenharGraficoBarras(dados);
        })
        .catch(erro => {
            console.error("Erro na API:", erro);
            if (containerGrafico) {
                containerGrafico.innerHTML = '<div class="grafico-vazio" style="color: #ef4444;">Erro ao carregar dados do gráfico.</div>';
            }
        });
}

// Inicializa no carregamento e no movimento do mapa
setTimeout(atualizarClimaParaLocalNoMapa, 1000); 
mapa.on('moveend', atualizarClimaParaLocalNoMapa);
// ==========================================
// 11. PERSISTÊNCIA DE PREFERÊNCIAS (Atualizado v1.1.6)
// ==========================================
function carregarPreferencias() {
    const temaGuardado = localStorage.getItem('tema_app');
    document.body.classList.remove('dark-mode', 'alt-mode');
    if (temaGuardado === 'dark') {
        document.body.classList.add('dark-mode');
    } else if (temaGuardado === 'alternativo') {
        document.body.classList.add('alt-mode');
    }

    const fonteSalva = localStorage.getItem('tamanho_fonte');
    if (fonteSalva) {
        document.body.classList.remove('font-small', 'font-large');
        if (fonteSalva === 'small') document.body.classList.add('font-small');
        if (fonteSalva === 'large') document.body.classList.add('font-large');
    }
}

// Quando a página carrega, ele aplica as preferências salvas
window.onload = () => {
    carregarPreferencias();
};

// ==========================================
// 12. SISTEMA DO MODAL DE CONFIGURAÇÕES (v1.1.6 Corrigido)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const btnConfig = document.getElementById('btn-config');
    const modalOverlay = document.getElementById('modal-overlay');
    const btnFecharModal = document.getElementById('btn-fechar-modal');

    if (btnConfig && modalOverlay) {
        // Abrir o modal ao clicar na engrenagem
        btnConfig.addEventListener('click', () => {
            modalOverlay.classList.remove('modal-oculto'); 
            modalOverlay.classList.add('modal-ativo'); 
        });
    }

    if (btnFecharModal && modalOverlay) {
        // Fechar o modal ao clicar no 'X'
        btnFecharModal.addEventListener('click', () => {
            modalOverlay.classList.remove('modal-ativo');
            modalOverlay.classList.add('modal-oculto');
        });
    }

    if (modalOverlay) {
        // Fechar o modal se clicar fora da caixinha (no fundo borrado)
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.classList.remove('modal-ativo');
                modalOverlay.classList.add('modal-oculto');
            }
        });
    }
});

// ==========================================
// 13. CONFIGURAÇÕES: TEMA E ACESSIBILIDADE (v1.1.6)
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    const btnLight = document.getElementById("btn-theme-light");
    const btnDark = document.getElementById("btn-theme-dark");
    const btnAlt = document.getElementById("btn-theme-alt");

    const temaSalvo = localStorage.getItem("tema_app");

    document.body.classList.remove('dark-mode', 'alt-mode');
    if(btnLight) btnLight.classList.remove("active");
    if(btnDark) btnDark.classList.remove("active");
    if(btnAlt) btnAlt.classList.remove("active");

    if (temaSalvo === "dark") {
        document.body.classList.add('dark-mode');
        if(btnDark) btnDark.classList.add('active');
    } else if (temaSalvo === "alternativo") {
        document.body.classList.add('alt-mode');
        if(btnAlt) btnAlt.classList.add('active');
    } else {
        if(btnLight) btnLight.classList.add('active');
    }

    if (btnLight && btnDark && btnAlt) {
        btnLight.addEventListener("click", () => alterarTema("light"));
        btnDark.addEventListener("click", () => alterarTema("dark"));
        btnAlt.addEventListener("click", () => alterarTema("alternativo"));
    }

    // --- CONTROLE DE TAMANHO DE FONTE ---
    const btnFontDecrease = document.getElementById("btn-font-decrease");
    const btnFontDefault = document.getElementById("btn-font-default");
    const btnFontIncrease = document.getElementById("btn-font-increase");

    if (btnFontDecrease && btnFontDefault && btnFontIncrease) {
        btnFontDecrease.addEventListener("click", () => alterarFonte("small"));
        btnFontDefault.addEventListener("click", () => alterarFonte("normal"));
        btnFontIncrease.addEventListener("click", () => alterarFonte("large"));
    }

    // --- BOTÃO DE LIMPAR HISTÓRICO ---
    const btnClearHistory = document.getElementById("btn-clear-history");
    if (btnClearHistory) {
        btnClearHistory.addEventListener("click", () => {
            localStorage.removeItem("historicoPesquisas");
            atualizarInterfaceHistorico();
        });
    }
});

function alterarTema(tema) {
    const btnLight = document.getElementById("btn-theme-light");
    const btnDark = document.getElementById("btn-theme-dark");
    const btnAlt = document.getElementById("btn-theme-alt");

    document.body.classList.remove("dark-mode", "alt-mode");
    if(btnLight) btnLight.classList.remove("active");
    if(btnDark) btnDark.classList.remove("active");
    if(btnAlt) btnAlt.classList.remove("active");

    if (tema === "dark") {
        document.body.classList.add("dark-mode");
        if(btnDark) btnDark.classList.add("active");
        localStorage.setItem("tema_app", "dark");
    } else if (tema === "alternativo") {
        document.body.classList.add("alt-mode");
        if(btnAlt) btnAlt.classList.add("active");
        localStorage.setItem("tema_app", "alternativo");
    } else {
        if(btnLight) btnLight.classList.add("active");
        localStorage.setItem("tema_app", "light");
    }
}

function alterarFonte(tamanho) {
    const btnDecrease = document.getElementById("btn-font-decrease");
    const btnDefault = document.getElementById("btn-font-default");
    const btnIncrease = document.getElementById("btn-font-increase");

    document.body.classList.remove("font-small", "font-normal", "font-large");
    if(btnDecrease) btnDecrease.classList.remove("active");
    if(btnDefault) btnDefault.classList.remove("active");
    if(btnIncrease) btnIncrease.classList.remove("active");

    if (tamanho === "small") {
        document.body.classList.add("font-small");
        if(btnDecrease) btnDecrease.classList.add("active");
        localStorage.setItem("tamanho_fonte", "small");
    } else if (tamanho === "large") {
        document.body.classList.add("font-large");
        if(btnIncrease) btnIncrease.classList.add("active");
        localStorage.setItem("tamanho_fonte", "large");
    } else {
        document.body.classList.add("font-normal");
        if(btnDefault) btnDefault.classList.add("active");
        localStorage.setItem("tamanho_fonte", "normal");
    }
}

// ==========================================
// 14. SISTEMA DE HISTÓRICO DE PESQUISAS (v1.1.6)
// ==========================================
const listaHistorico = document.getElementById('history-list'); // Atualizado para o novo ID do HTML

function atualizarInterfaceHistorico() {
    if (!listaHistorico) return;

    let historico = JSON.parse(localStorage.getItem('historicoPesquisas')) || [];
    listaHistorico.innerHTML = '';

    if (historico.length === 0) {
        listaHistorico.innerHTML = '<li class="empty-state">Nenhuma pesquisa recente.</li>';
        return;
    }

    historico.forEach(endereco => {
        const li = document.createElement('li');
        li.textContent = endereco;

        // Clicar no item do histórico dispara a busca automaticamente
        li.addEventListener('click', () => {
            const input = document.getElementById('input-endereco');
            const btnBusca = document.getElementById('btn-buscar');
            if (input && btnBusca) {
                input.value = endereco;
                btnBusca.click();
                
                // Fecha o modal
                const modalOverlay = document.getElementById('modal-overlay');
                if (modalOverlay) {
                    modalOverlay.classList.remove('modal-ativo');
                    modalOverlay.classList.add('modal-oculto');
                }
            }
        });

        listaHistorico.appendChild(li);
    });
}

function salvarNoHistorico(endereco) {
    let historico = JSON.parse(localStorage.getItem('historicoPesquisas')) || [];
    
    historico = historico.filter(item => item.toLowerCase() !== endereco.toLowerCase());
    historico.unshift(endereco);
    
    if (historico.length > 5) {
        historico.pop();
    }
    
    localStorage.setItem('historicoPesquisas', JSON.stringify(historico));
    atualizarInterfaceHistorico();
}

// Inicializa a lista ao carregar a página
atualizarInterfaceHistorico();
// ==========================================
// 15. BOTTOM SHEET ARRASTÁVEL PARA TODOS OS PAINÉIS
// ==========================================
const paineisMobile = document.querySelectorAll('.painel-flutuante');
let startY = 0;
let currentY = 0;
let isDragging = false;
let activePanel = null; // Guarda qual painel está sendo arrastado

paineisMobile.forEach(painel => {
    // Quando o usuário toca a tela
    painel.addEventListener('touchstart', (e) => {
        if (window.innerWidth > 768) return; 
        
        if (painel.scrollTop === 0) {
            startY = e.touches[0].clientY;
            isDragging = true;
            activePanel = painel;
            painel.classList.add('arrastando');
        }
    }, { passive: true });

    // Enquanto o dedo se move
    painel.addEventListener('touchmove', (e) => {
        if (!isDragging || activePanel !== painel) return;
        currentY = e.touches[0].clientY;
        const deltaY = currentY - startY;
        const isExpanded = painel.classList.contains('expandido');

        if (!isExpanded && deltaY < 0) {
            painel.style.transform = `translateY(calc(75vh - 110px + ${deltaY}px))`;
        } else if (isExpanded && deltaY > 0) {
            painel.style.transform = `translateY(${deltaY}px)`;
        }
    }, { passive: true });

    // Quando o usuário solta a tela
    painel.addEventListener('touchend', (e) => {
        if (!isDragging || activePanel !== painel) return;
        isDragging = false;
        painel.classList.remove('arrastando');
        painel.style.transform = ''; 

        const deltaY = currentY - startY;
        const isExpanded = painel.classList.contains('expandido');

        if (!isExpanded && deltaY < -40) {
            painel.classList.add('expandido');
        } else if (isExpanded && deltaY > 40) {
            painel.classList.remove('expandido');
        }
        activePanel = null;
    });

    // Clicar no topo também abre/fecha
    painel.addEventListener('click', (e) => {
        if (window.innerWidth > 768) return;
        if (e.offsetY < 40) { 
            painel.classList.toggle('expandido');
        }
    });
});
// ==========================================
// 16. TIMEOUT das mensagens de atualização e da bolinha da versao
// ==========================================
// Aguarda a página carregar para garantir que a tag de versão existe no HTML
document.addEventListener("DOMContentLoaded", function() {
    
    // Data de lançamento da versão: 16 de Julho de 2026 (Ano, Mês - 1, Dia)
    const dataLancamento = new Date(2026, 7, 16);
    
    // Quantidade de dias que a bolinha vai ficar visível
    const diasDeValidade = 10;

    // Calcula a data de expiração somando os dias
    const dataExpiracao = new Date(dataLancamento);
    dataExpiracao.setDate(dataLancamento.getDate() + diasDeValidade);

    // Pega a data atual do computador do usuário
    const hoje = new Date();

    // Se o prazo passou, esconde a bolinha automaticamente
    if (hoje > dataExpiracao) {
        const bolinha = document.querySelector('.bolinha-nova');
        if (bolinha) {
            bolinha.style.display = 'none';
        }
    }
});
// ==========================================
// FUNÇÃO DO TOAST DE NOVIDADES (v1.1.8)
// ==========================================
function verificarNovidades() {
    const toast = document.getElementById('toast-novidades');
    const btnFecharToast = document.getElementById('btn-fechar-toast');
    
    // ATUALIZADO PARA v1.1.9
    const toastJaVisto = localStorage.getItem('toast_v119_visto');
    
    const dataLancamento = new Date(2026, 7, 27); 
    const dataExpiracao = new Date(dataLancamento);
    dataExpiracao.setDate(dataLancamento.getDate() + 12);
    const hoje = new Date();

    if (hoje <= dataExpiracao && !toastJaVisto && toast) {
        setTimeout(() => {
            toast.classList.add('mostrar');
        }, 500); 
    }

    if (btnFecharToast && toast) {
        btnFecharToast.addEventListener('click', () => {
            toast.classList.remove('mostrar');
            // ATUALIZADO PARA v1.1.9
            localStorage.setItem('toast_v119_visto', 'true');
        });
    }
}

// ==========================================
// CONTROLE COMPLETO: TELA INICIAL E BOTÃO HOME
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const btnComecar = document.getElementById("btn-começar");
    const loader = document.getElementById("loader");
    const telaInicial = document.getElementById("tela-inicial");
    
    const btnVoltarHome = document.getElementById("btn-voltar-home");
    const modalConfirm = document.getElementById("modal-confirm-overlay");
    const btnFecharConfirm = document.getElementById("btn-fechar-confirm");
    const btnCancelarSaida = document.getElementById("btn-cancelar-saida");
    const btnConfirmarSaida = document.getElementById("btn-confirmar-saida");

    // 1. Ação de Entrar no Sistema
    if (btnComecar) {
        btnComecar.addEventListener("click", () => {
            btnComecar.classList.add("hidden");
            if (loader) loader.classList.remove("hidden");
            
            setTimeout(() => {
                if (telaInicial) telaInicial.classList.add("fade-out");
                
                setTimeout(() => {
                    if (typeof mapa !== 'undefined' && mapa.invalidateSize) {
                        mapa.invalidateSize();
                    }
                    if (telaInicial) telaInicial.style.display = "none"; 
                    
                    // Exibe os botões flutuantes do sistema
                    const btnConfig = document.getElementById("btn-config");
                    const btnMetodologia = document.getElementById("btn-metodologia");
                    
                    if (btnConfig) btnConfig.style.display = "flex";
                    if (btnMetodologia) btnMetodologia.style.display = "flex";
                    if (btnVoltarHome) btnVoltarHome.style.display = "flex";
                    
                    if (typeof verificarNovidades === "function") {
                        verificarNovidades();
                    }
                    
                }, 800);
            }, 2000);
        });
    }

    // 2. Ação de Abrir o Modal de Confirmação da Home
    if (btnVoltarHome && modalConfirm) {
        btnVoltarHome.addEventListener("click", () => {
            modalConfirm.classList.remove("modal-oculto");
            modalConfirm.classList.add("modal-ativo");
        });
    }

    // 3. Fechar o Modal sem sair
    const fecharModalConfirm = () => {
        if (modalConfirm) {
            modalConfirm.classList.remove("modal-ativo");
            modalConfirm.classList.add("modal-oculto");
        }
    };

    if (btnFecharConfirm) btnFecharConfirm.addEventListener("click", fecharModalConfirm);
    if (btnCancelarSaida) btnCancelarSaida.addEventListener("click", fecharModalConfirm);
    if (modalConfirm) {
        modalConfirm.addEventListener("click", (e) => {
            if (e.target === modalConfirm) fecharModalConfirm();
        });
    }

    // 4. Confirmar a saída e retornar para a Tela Inicial
    if (btnConfirmarSaida && telaInicial) {
        btnConfirmarSaida.addEventListener("click", () => {
            fecharModalConfirm();

            // Mostra novamente a tela inicial limpa
            telaInicial.style.display = "flex";
            telaInicial.classList.remove("fade-out");

            if (btnComecar) btnComecar.classList.remove("hidden");
            if (loader) loader.classList.add("hidden");

            // Esconde os botões flutuantes novamente
            const btnConfig = document.getElementById("btn-config");
            const btnMetodologia = document.getElementById("btn-metodologia");
            if (btnConfig) btnConfig.style.display = "none";
            if (btnMetodologia) btnMetodologia.style.display = "none";
            if (btnVoltarHome) btnVoltarHome.style.display = "none";
        });
    }
});
// ==========================================
// LÓGICA DO POPUP DE DETALHES (v1.1.6)
// ==========================================

document.addEventListener('click', (event) => {
    const alvo = event.target; 

    // 1. SE CLICOU NO BOTÃO "VER DETALHES" DENTRO DO TOAST
    if (alvo.id === 'btn-abrir-popup') {
        const fundoBlur = document.getElementById('fundo-blur');
        const popupDetalhes = document.getElementById('popup-detalhes-v116'); 
        const toast = document.getElementById('toast-novidades');
        
        if (fundoBlur && popupDetalhes) {
            fundoBlur.classList.remove('escondido');
            popupDetalhes.classList.remove('escondido');
            
            setTimeout(() => {
                fundoBlur.classList.add('mostrar-blur');
                popupDetalhes.classList.add('mostrar-popup');
            }, 10);
        }
        
        if(toast) {
            toast.classList.remove('mostrar');
            localStorage.setItem('toast_v119_visto', 'true');
        }
    }

    // 2. SE CLICOU NO "X" DO POPUP OU FORA DELE (NO FUNDO BLUR)
    if (alvo.id === 'btn-fechar-popup' || alvo.id === 'fundo-blur') {
        const fundoBlur = document.getElementById('fundo-blur');
        // ATUALIZADO PARA O ID DO SEU HTML v116
        const popupDetalhes = document.getElementById('popup-detalhes-v116'); 

        if (fundoBlur && popupDetalhes) {
            fundoBlur.classList.remove('mostrar-blur');
            popupDetalhes.classList.remove('mostrar-popup');
            
            setTimeout(() => {
                fundoBlur.classList.add('escondido');
                popupDetalhes.classList.add('escondido');
            }, 300);
        }
    }
});
// ==========================================
// CONTROLE DE TELAS DO MODAL (CONFIG / FAVORITOS)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const viewConfig = document.getElementById("modal-view-config");
    const viewFavorites = document.getElementById("modal-view-favorites");
    
    const btnAbrirFav = document.getElementById("btn-abrir-favoritos");
    const btnVoltarConfig = document.getElementById("btn-voltar-config");
    
    const btnFecharFav = document.getElementById("btn-fechar-modal-fav");

    // Ir para a tela de favoritos
    if (btnAbrirFav) {
        btnAbrirFav.addEventListener("click", () => {
            viewConfig.classList.remove("active-view");
            viewFavorites.classList.add("active-view");
        });
    }

    // Voltar para a tela de configurações
    if (btnVoltarConfig) {
        btnVoltarConfig.addEventListener("click", () => {
            viewFavorites.classList.remove("active-view");
            viewConfig.classList.add("active-view");
        });
    }

    // Fechar o modal inteiro a partir da aba de favoritos também
    if (btnFecharFav) {
        btnFecharFav.addEventListener("click", () => {
            const modalOverlay = document.getElementById("modal-overlay");
            if (modalOverlay) {
                modalOverlay.classList.remove("modal-ativo");
                modalOverlay.classList.add("modal-oculto");
            }
        });
    }
});
// ==========================================
// LÓGICA DE FAVORITAR ENDEREÇOS (ATUALIZADA)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const btnFavoritar = document.getElementById("btn-favoritar");
    const inputEndereco = document.getElementById("input-endereco");

    if (btnFavoritar && inputEndereco) {
        
        // checa se o texto atual está nos favoritos e ajusta a estrela
        function checarSeFavorito() {
            const enderecoAtual = inputEndereco.value.trim().toLowerCase();
            const iconeVazio = btnFavoritar.querySelector('.icone-vazio');
            const iconeCheio = btnFavoritar.querySelector('.icone-cheio');
            
            if (enderecoAtual === "") {
                if(iconeVazio) iconeVazio.style.display = 'block';
                if(iconeCheio) iconeCheio.style.display = 'none';
                btnFavoritar.classList.remove("salvo");
                return;
            }

            let favoritos = JSON.parse(localStorage.getItem("enderecos_favoritos")) || [];
            const existe = favoritos.some(fav => fav.nome.toLowerCase() === enderecoAtual);

            if (existe) {
                if(iconeVazio) iconeVazio.style.display = 'none';
                if(iconeCheio) iconeCheio.style.display = 'block';
                btnFavoritar.classList.add("salvo");
            } else {
                if(iconeVazio) iconeVazio.style.display = 'block';
                if(iconeCheio) iconeCheio.style.display = 'none';
                btnFavoritar.classList.remove("salvo");
            }
        }

        // Toda vez que você digitar ou apagar algo no campo, ele roda a checagem
        inputEndereco.addEventListener("input", checarSeFavorito);

        // Ação de clicar na estrela
        btnFavoritar.addEventListener("click", () => {
            const enderecoAtual = inputEndereco.value.trim();
            
            if (enderecoAtual === "") {
                alert("Por favor, digite ou busque um endereço primeiro.");
                return;
            }

            let favoritos = JSON.parse(localStorage.getItem("enderecos_favoritos")) || [];
            const index = favoritos.findIndex(fav => fav.nome.toLowerCase() === enderecoAtual.toLowerCase());

            if (index === -1) {
                // Adiciona aos favoritos
                favoritos.push({ nome: enderecoAtual, data: new Date().toISOString() });
            } else {
                // Remove dos favoritos
                favoritos.splice(index, 1);
            }

            localStorage.setItem("enderecos_favoritos", JSON.stringify(favoritos));
            
            // Atualiza a cor da estrela e a lista do painel
            checarSeFavorito();
            atualizarListaFavoritosUI();
        });
    }
});

// Função para desenhar a lista no Modal de Favoritos
function atualizarListaFavoritosUI() {
    const listaContainer = document.getElementById("lista-enderecos-favoritos");
    if (!listaContainer) return;

    let favoritos = JSON.parse(localStorage.getItem("enderecos_favoritos")) || [];

    if (favoritos.length === 0) {
        listaContainer.innerHTML = '<div class="empty-state">Nenhum endereço favorito salvo ainda.</div>';
        return;
    }

    listaContainer.innerHTML = ""; // Limpa a lista atual

    // Cria os itens da lista
    favoritos.forEach((fav, index) => {
        const item = document.createElement("li");
        item.style.display = "flex";
        item.style.justifyContent = "space-between";
        item.style.alignItems = "center";
        item.style.padding = "8px 0";
        item.style.borderBottom = "1px solid var(--cor-borda-suave, #eaeaea)";
        
        item.innerHTML = `
            <span style="cursor: pointer; flex-grow: 1; font-size: 0.95rem;">📍 ${fav.nome}</span>
            <button class="btn-remover-fav" data-index="${index}" style="background: transparent; border: none; color: #ef4444; cursor: pointer; font-size: 1.2rem; padding: 0 8px;" title="Remover">&times;</button>
        `;

        // Clicar no texto coloca o endereço na busca e atualiza a estrela
        item.querySelector("span").addEventListener("click", () => {
            const input = document.getElementById("input-endereco");
            if (input) {
                input.value = fav.nome;
                
                // Dispara o evento de "input" manualmente para a estrela acender
                input.dispatchEvent(new Event('input'));
            }
            
            // Fecha o modal ao selecionar
            const modalOverlay = document.getElementById("modal-overlay");
            if (modalOverlay) {
                modalOverlay.classList.remove("modal-ativo");
                modalOverlay.classList.add("modal-oculto");
            }
        });

        // Clicar no X remove da lista
        item.querySelector(".btn-remover-fav").addEventListener("click", () => {
            favoritos.splice(index, 1);
            localStorage.setItem("enderecos_favoritos", JSON.stringify(favoritos));
            atualizarListaFavoritosUI(); // Recarrega a lista do painel
            
            // Atualiza a estrela principal caso você tenha apagado o endereço que está ativo no momento
            const input = document.getElementById("input-endereco");
            if (input) input.dispatchEvent(new Event('input'));
        });

        listaContainer.appendChild(item);
    });
}

// Inicializa a lista ao carregar a página
window.addEventListener("load", atualizarListaFavoritosUI);
// ==========================================
// LÓGICA DO NOVO PAINEL DE CAMADAS (ESTILO MAPS)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const btnAbrir = document.getElementById("btn-camadas-maps");
    const btnFechar = document.getElementById("btn-fechar-camadas-maps");
    const painel = document.getElementById("painel-camadas-maps");
    const sliderSolo = document.getElementById("slider-opacidade-solo");
    const controleOpacidadeSolo = document.getElementById("controle-opacidade-solo");

    // 1. Abre e fecha o painel principal
    if (btnAbrir && painel) {
        btnAbrir.addEventListener("click", () => painel.classList.toggle("painel-fechado"));
    }
    if (btnFechar && painel) {
        btnFechar.addEventListener("click", () => painel.classList.add("painel-fechado"));
    }

    // 2. Lógica dos Cards (Base e Overlays)
    document.querySelectorAll(".card-maps").forEach(card => {
        card.addEventListener("click", function() {
            const tipo = this.dataset.tipo;
            const camadaStr = this.dataset.layer;

            // Se for MAPA BASE (Só pode um ativo por vez)
            if (tipo === "base") {
                document.querySelectorAll('.card-maps[data-tipo="base"]').forEach(c => c.classList.remove("ativo"));
                this.classList.add("ativo");

                // Remove todas as bases primeiro para evitar sobreposição
                mapa.removeLayer(mapaRuas);
                mapa.removeLayer(mapaSatelite);
                mapa.removeLayer(mapaTopografico);

                // Adiciona apenas a escolhida
                if (camadaStr === "ruas") {
                    mapa.addLayer(mapaRuas);
                } else if (camadaStr === "satelite") {
                    mapa.addLayer(mapaSatelite);
                } else if (camadaStr === "topo") {
                    mapa.addLayer(mapaTopografico);
                }
            }
            
            // Se for OVERLAY/INFORMAÇÃO (Pode ter vários ativos)
            else if (tipo === "overlay") {
                this.classList.toggle("ativo");
                const estaAtivo = this.classList.contains("ativo");

                if (camadaStr === "enchente") {
                    estaAtivo ? grupoEnchente.addTo(mapa) : mapa.removeLayer(grupoEnchente);
                } 
                else if (camadaStr === "deslizamento") {
                    estaAtivo ? grupoDeslizamento.addTo(mapa) : mapa.removeLayer(grupoDeslizamento);
                } 
                else if (camadaStr === "defesacivil") {
                    estaAtivo ? grupoDefesaCivil.addTo(mapa) : mapa.removeLayer(grupoDefesaCivil);
                }
                else if (camadaStr === "solo") {
                    // Lógica especial para o Solo e seu Slider
                    if (estaAtivo) {
                        if (camadaSolos) camadaSolos.addTo(mapa);
                        controleOpacidadeSolo.classList.remove("escondido");
                    } else {
                        if (camadaSolos) mapa.removeLayer(camadaSolos);
                        controleOpacidadeSolo.classList.add("escondido");
                    }
                }
            }
        });
    });

    // 3. Lógica do Slider de Opacidade (Ideia 3 concretizada)
    if (sliderSolo) {
        sliderSolo.addEventListener("input", (e) => {
            const valor = parseFloat(e.target.value);
            if (camadaSolos) {
                // Altera a opacidade de todos os polígonos desenhados
                camadaSolos.eachLayer(layer => {
                    layer.setStyle({ fillOpacity: valor, opacity: valor === 0 ? 0 : 1 });
                });
            }
        });
    }
});
// ==========================================
// SISTEMA DO MODAL DE OBSERVAÇÃO METODOLÓGICA
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const btnMetodologia = document.getElementById('btn-metodologia');
    const modalMetodologiaOverlay = document.getElementById('modal-metodologia-overlay');
    const btnFecharMetodologia = document.getElementById('btn-fechar-metodologia');

    if (btnMetodologia && modalMetodologiaOverlay) {
        btnMetodologia.addEventListener('click', () => {
            modalMetodologiaOverlay.classList.remove('modal-oculto'); 
            modalMetodologiaOverlay.classList.add('modal-ativo'); 
        });
    }

    if (btnFecharMetodologia && modalMetodologiaOverlay) {
        btnFecharMetodologia.addEventListener('click', () => {
            modalMetodologiaOverlay.classList.remove('modal-ativo');
            modalMetodologiaOverlay.classList.add('modal-oculto');
        });
    }

    // Fechar ao clicar na área escura (fundo desfocado)
    if (modalMetodologiaOverlay) {
        modalMetodologiaOverlay.addEventListener('click', (e) => {
            if (e.target === modalMetodologiaOverlay) {
                modalMetodologiaOverlay.classList.remove('modal-ativo');
                modalMetodologiaOverlay.classList.add('modal-oculto');
            }
        });
    }
});
// ==========================================
// CONFIGURAÇÃO DE CAMADA INICIAL PADRÃO
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const btnLayerRuas = document.getElementById("btn-layer-ruas");
    const btnLayerSatelite = document.getElementById("btn-layer-satelite");
    const btnLayerTopo = document.getElementById("btn-layer-topo");

    if (btnLayerRuas && btnLayerSatelite && btnLayerTopo) {
        const camadaSalva = localStorage.getItem("camada_padrao") || "ruas";
        atualizarBotoesCamadaPadrao(camadaSalva);

        btnLayerRuas.addEventListener("click", () => definirCamadaPadrao("ruas"));
        btnLayerSatelite.addEventListener("click", () => definirCamadaPadrao("satelite"));
        btnLayerTopo.addEventListener("click", () => definirCamadaPadrao("topo"));
    }
});

function definirCamadaPadrao(tipo) {
    localStorage.setItem("camada_padrao", tipo);
    atualizarBotoesCamadaPadrao(tipo);
}

function atualizarBotoesCamadaPadrao(tipo) {
    const botoes = {
        ruas: document.getElementById("btn-layer-ruas"),
        satelite: document.getElementById("btn-layer-satelite"),
        topo: document.getElementById("btn-layer-topo")
    };

    Object.keys(botoes).forEach(k => {
        if (botoes[k]) {
            if (k === tipo) {
                botoes[k].classList.add("active");
            } else {
                botoes[k].classList.remove("active");
            }
        }
    });
}
// ==========================================
// NOVO CONTROLE: TELA INICIAL E BOTÃO HOME
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const btnComecar = document.getElementById("btn-começar");
    const loader = document.getElementById("loader");
    const telaInicial = document.getElementById("tela-inicial");
    
    // Novos elementos limpos
    const btnNovaHome = document.getElementById("btn-nova-home");
    const modalNovaHome = document.getElementById("modal-nova-home");
    const btnFecharNovaHome = document.getElementById("btn-fechar-nova-home");
    const btnCancelarNovaHome = document.getElementById("btn-cancelar-nova-home");
    const btnConfirmarNovaHome = document.getElementById("btn-confirmar-nova-home");

    // 1. Entrar no sistema
    if (btnComecar) {
        // Remove listeners duplicados clonando o botão (Limpeza forçada)
        const novoBtnComecar = btnComecar.cloneNode(true);
        btnComecar.parentNode.replaceChild(novoBtnComecar, btnComecar);
        
        novoBtnComecar.addEventListener("click", () => {
            novoBtnComecar.classList.add("hidden");
            if (loader) loader.classList.remove("hidden");
            
            setTimeout(() => {
                if (telaInicial) telaInicial.classList.add("fade-out");
                
                setTimeout(() => {
                    if (typeof mapa !== 'undefined' && mapa.invalidateSize) mapa.invalidateSize();
                    if (telaInicial) telaInicial.style.display = "none"; 
                    
                    // Mostra a UI do Mapa
                    const btnConfig = document.getElementById("btn-config");
                    const btnMetodologia = document.getElementById("btn-metodologia");
                    
                    if (btnConfig) btnConfig.style.display = "flex";
                    if (btnMetodologia) btnMetodologia.style.display = "flex";
                    if (btnNovaHome) btnNovaHome.style.display = "flex"; // Mostra o novo botão
                    
                    if (typeof verificarNovidades === "function") verificarNovidades();
                }, 800);
            }, 2000);
        });
    }

    // 2. Abrir Modal de Saída
    if (btnNovaHome && modalNovaHome) {
        btnNovaHome.addEventListener("click", (e) => {
            e.preventDefault(); 
            modalNovaHome.classList.add("aberto");
        });
    }

    // 3. Fechar Modal de Saída (Cancelar)
    const fecharModalHome = () => {
        if (modalNovaHome) modalNovaHome.classList.remove("aberto");
    };

    if (btnFecharNovaHome) btnFecharNovaHome.addEventListener("click", fecharModalHome);
    if (btnCancelarNovaHome) btnCancelarNovaHome.addEventListener("click", fecharModalHome);
    if (modalNovaHome) {
        modalNovaHome.addEventListener("click", (e) => {
            if (e.target === modalNovaHome) fecharModalHome();
        });
    }

    // 4. Confirmar Saída e Resetar a Tela
    if (btnConfirmarNovaHome) {
        btnConfirmarNovaHome.addEventListener("click", () => {
            fecharModalHome();
            
            if (telaInicial) {
                telaInicial.style.display = "flex";
                setTimeout(() => { telaInicial.classList.remove("fade-out"); }, 50);
            }

            // Reseta botão de iniciar
            const atualBtnComecar = document.getElementById("btn-começar");
            if (atualBtnComecar) atualBtnComecar.classList.remove("hidden");
            if (loader) loader.classList.add("hidden");

            // Esconde botões do mapa
            const btnConfig = document.getElementById("btn-config");
            const btnMetodologia = document.getElementById("btn-metodologia");
            if (btnConfig) btnConfig.style.display = "none";
            if (btnMetodologia) btnMetodologia.style.display = "none";
            if (btnNovaHome) btnNovaHome.style.display = "none";
        });
    }
});