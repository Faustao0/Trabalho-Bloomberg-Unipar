let stompClient = null; 
let connected = false;
let stocksLoaded = false;
const previousPrices = {};  // Armazena os preços anteriores das ações

// Função para conectar ao WebSocket
function connect() {
    const socket = new SockJS('http://localhost:8080/stock-prices', {
        headers: {
            'ngrok-skip-browser-warning': 'true'
        }
    });
    stompClient = Stomp.over(socket);

    stompClient.connect({}, function (frame) {
        console.log('Connected: ' + frame);

        stompClient.send("/app/connect", {}, JSON.stringify({ name: 'user' }));
        
        // Assina o tópico para receber as atualizações das ações
        stompClient.subscribe('/topic/stock-prices', function(response) {
            const stocks = JSON.parse(response.body);           
            console.log('Received stocks:', stocks);
            if (!stocksLoaded) {
                createStockBlocks(stocks);
                stocksLoaded = true;
            } else {
                updateStockBlocks(stocks);
            }
        });
    }, function (error) {
        console.log('Connection lost, retrying in 5 seconds...', error);
        connected = false;
        setTimeout(reconnect, 5000); // Tenta reconectar após 5 segundos
    });
}

// Função para reconectar ao WebSocket
function reconnect() {
    if (!connected) {
        console.log('Reconnecting...');
        connect();
    }
}

// Função para gerar blocos de ações na tela
function createStockBlocks(stocks) {
    const container = document.getElementById('stock-container');
    container.innerHTML = ''; // Limpa o container antes de adicionar novos blocos

    stocks.forEach(stock => {
        const stockBlock = document.createElement('div');
        stockBlock.className = 'stock-block';
        stockBlock.id = stock.name.replace(/\s+/g, '-').toLowerCase(); // Normaliza o ID

        const stockName = document.createElement('h2');
        stockName.innerText = stock.name;

        const stockPrice = document.createElement('p');
        stockPrice.innerText = stock.price.toFixed(2);

        const stockImage = document.createElement('img');  // Imagem que será alterada
        stockImage.src = '';  // Inicialmente, sem imagem
        stockImage.alt = 'Stock trend';

        stockBlock.appendChild(stockName);
        stockBlock.appendChild(stockPrice);
        stockBlock.appendChild(stockImage); // Adiciona a imagem ao bloco

        container.appendChild(stockBlock);

        // Armazena o preço inicial do produto
        previousPrices[stock.name] = stock.price;
    });
}

// Função para atualizar os blocos de ações na tela
function updateStockBlocks(stocks) {
    stocks.forEach(stock => {
        const stockId = stock.name.replace(/\s+/g, '-').toLowerCase();
        const stockBlock = document.getElementById(stockId);

        if (stockBlock) {
            const stockPriceElement = stockBlock.querySelector('p');
            const previousPrice = previousPrices[stock.name];
            const newPrice = stock.price;

            // Atualiza o preço da ação existente
            stockPriceElement.innerText = newPrice.toFixed(2);

            // Remove classes anteriores
            stockBlock.classList.remove('up', 'down');

            // Seleciona o elemento da imagem corretamente
            const stockImage = stockBlock.querySelector('img');

            // Adiciona a classe apropriada (up ou down) e atualiza a imagem
            if (newPrice > previousPrice) {
                stockBlock.classList.add('up');
                stockImage.src = 'imagens/arrows-up.png';  
            } else if (newPrice < previousPrice) {
                stockBlock.classList.add('down');
                stockImage.src = 'imagens/arrows-down.png';  
            }

            // Atualiza o preço anterior para o próximo ciclo
            previousPrices[stock.name] = newPrice;
        }
    });
}

window.onload = function() {
    connect();
};