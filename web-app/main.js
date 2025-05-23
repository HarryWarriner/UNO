const changeCurrentCard_button = document.getElementById("changeCurrentCard");
const drawCard_button = document.getElementById("drawCard");
const ops_drawCard_button = document.getElementById("ops-drawCard");




const colors = ['Red', 'Green', 'Blue', 'Yellow']

let currentCard = getRandomCard();
console.log(getRandomCard());
let hand = [];
let ops_hand =[];

changeCurrentCard_button.onclick = function () {
    changeCurrentCard()
    
}
drawCard_button.onclick = function () {
    drawCard()
    
}
ops_drawCard_button.onclick = function () {
    drawOpsCard()
}



function getRandomCard(){
    const color = colors[Math.floor(Math.random() * colors.length)];
    const number = Math.floor(Math.random() * 9) +1;
    return {color, number};
}
function currentCardDisplay(){
    const currentDiv = document.getElementById('currentCard');
    currentDiv.style.backgroundColor = currentCard.color.toLowerCase();
    currentDiv.textContent = currentCard.number;
}

function changeCurrentCard(){
    currentCard = getRandomCard();
    currentCardDisplay();
}

function drawCard(){
    const card = getRandomCard();
    hand.push(card);
    console.log(hand);
    updatehand();
}

function drawOpsCard(){
    const card = getRandomCard();
    ops_hand.push(card);
    console.log(ops_hand);
    updateopshand();
}


function updatehand(){
    const handDiv = document.getElementById('hand');
    handDiv.innerHTML = '';
    hand.forEach((card, index) => {
        const div = renderCard(card, index);
        handDiv.appendChild(div)
    })
}

function updateopshand(){
    const opshandDiv = document.getElementById('ops-hand');
    opshandDiv.innerHTML = '';
    ops_hand.forEach((card, index) => {
        const div = renderOpsCard(card, index);
        opshandDiv.appendChild(div)
    })
}

function renderCard(card, index) {
    const div = document.createElement('div');
    div.className ='card';
    div.style.backgroundColor = card.color.toLowerCase();
    div.textContent = card.number;

    div.onclick = () => {
        if (card.color === currentCard.color || card.number === currentCard.number) {
            hand.splice(index, 1);
            currentCard = card;
            currentCardDisplay();
            updatehand();
        }
    };
    return div
}

function renderOpsCard(card, index) {
    const div = document.createElement('div');
    div.className ='card';
    div.style.backgroundColor = card.color.toLowerCase();
    div.textContent = card.number;
    div.onclick = () => {
        if (card.color === currentCard.color || card.number === currentCard.number) {
            ops_hand.splice(index, 1);
            currentCard = card;
            currentCardDisplay();
            updateopshand();
        }
    };

    return div
}