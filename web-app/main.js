const startGame_button = document.getElementById("startGame");

const colors = ['Red', 'Green', 'Blue', 'Yellow']

let currentCard = getRandomCard();
console.log(currentCard);

let numPlayers = 2;
const numPlayersInput = document.getElementById('numPlayersInput');
let hands =[];
let turn = 0 ;

startGame_button.onclick = function () {
    numPlayers = parseInt(numPlayersInput.value) || 2;
    changeCurrentCard();
    hands = Array.from({ length: numPlayers }, () => []);
    turn = 0;
    startTurn();
    renderAllHands();
}


function startTurn(){
    const currentDiv = document.getElementById('currentTurn');
    currentDiv.textContent = `Player ${turn + 1}'s turn`;
    console.log(`Turn: Player ${turn}`);
}


function nextTurn(){
    turn = (turn + 1) % numPlayers;
    startTurn();
}

function getRandomCard(){
    const color = colors[Math.floor(Math.random() * colors.length)];
    const number = Math.floor(Math.random() * 9) +1;
    return {color, number};
}
function currentCardDisplay(){
    const div = document.getElementById('currentCard');
    styleCardDiv(div, currentCard);
   
}

function styleCardDiv(div, card){
    div.style.backgroundColor = card.color.toLowerCase();
    div.textContent = card.number;
}

function changeCurrentCard(){
    currentCard = getRandomCard();
    currentCardDisplay();
}

function drawCard(playerIndex){
    const card = getRandomCard();
    hands[playerIndex].push(card);
    console.log(hands[playerIndex]);
    renderHand(playerIndex);

}


function renderAllHands() {
    const handsContainer = document.getElementById('handsContainer');
    handsContainer.innerHTML= '';

    hands.forEach((_, index) => {
        const handSection = document.createElement('div');
        handSection.classList.add('hand-section');

        const title = document.createElement('h2');
        title.textContent = `Player ${index + 1}'s cards:`;

        const button = document.createElement('button');
        button.className = 'buttoncss';
        button.textContent = 'Draw';
        button.onclick = () => {
            if (turn === index) drawCard(index);
        };
        
        const headerDiv = document.createElement('div');
        headerDiv.className = 'hand-header';
        headerDiv.appendChild(title);
        headerDiv.appendChild(button);

        handSection.appendChild(headerDiv);

        const handDiv = document.createElement('div');
        handDiv.id = `hand-${index}`;
        handSection.appendChild(handDiv);

        const hr = document.createElement('hr');
        handSection.appendChild(hr);

        handsContainer.appendChild(handSection);

        renderHand(index)

    });
}

function renderHand(index){
    const handDiv = document.getElementById(`hand-${index}`);
    handDiv.innerHTML = '';

    hands[index].forEach((card, cardIndex) => {
        const div = document.createElement('div');
        div.className = 'card';
        styleCardDiv(div, card);

        div.onclick = () => {
            if ((card.color === currentCard.color || card.number === currentCard.number) && turn === index) {
                hands[index].splice(cardIndex, 1);
                currentCard = card;
                currentCardDisplay();
                renderHand(index);
                nextTurn();
            }
        };
        handDiv.appendChild(div);
    });
}

