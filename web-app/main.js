const startGame_button = document.getElementById("startGame");
// const drawCard_button = document.getElementById("drawCard");
// const ops_drawCard_button = document.getElementById("ops-drawCard");




const colors = ['Red', 'Green', 'Blue', 'Yellow']

let currentCard = getRandomCard();
console.log(getRandomCard());

let numPlayers = 4;
let hands =[];
let turn = 0 ;

startGame_button.onclick = function () {
    changeCurrentCard();
    hands = Array.from({ length: numPlayers }, () => []);
    turn = 0;
    startTurn();
    renderAllHands();
}



// drawCard_button.onclick = function () {
//     if (turn === 1){
//         drawCard();
//     }
    
    
// }
// ops_drawCard_button.onclick = function () {
//     if (turn === 2){
//         drawOpsCard();
//     } 
    
// }

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
    const currentDiv = document.getElementById('currentCard');
    currentDiv.style.backgroundColor = currentCard.color.toLowerCase();
    currentDiv.textContent = currentCard.number;
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
        handSection.appendChild(title);

        const button = document.createElement('button');
        button.className = 'buttoncss';
        button.textContent = 'Draw';
        button.onclick = () => {
            if (turn === index) drawCard(index);
        };
        handSection.appendChild(button);

        const handDiv = document.createElement('div');
        handDiv.id = `hand-${index}`;
        handSection.appendChild(handDiv);
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
        div.style.backgroundColor = card.color.toLowerCase();
        div.textContent = card.number;

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



// function updatehand(){
//     const handDiv = document.getElementById('hand');
//     handDiv.innerHTML = '';
//     hand.forEach((card, index) => {
//         const div = renderCard(card, index);
//         handDiv.appendChild(div)
//     })
// }

// function updateopshand(){
//     const opshandDiv = document.getElementById('ops-hand');
//     opshandDiv.innerHTML = '';
//     ops_hand.forEach((card, index) => {
//         const div = renderOpsCard(card, index);
//         opshandDiv.appendChild(div)
//     })
// }

// function renderCard(card, index) {
//     const div = document.createElement('div');
//     div.className ='card';
//     div.style.backgroundColor = card.color.toLowerCase();
//     div.textContent = card.number;

//     div.onclick = () => {
//         if ((card.color === currentCard.color || card.number === currentCard.number) && turn === 1 ){
//             hand.splice(index, 1);
//             currentCard = card;
//             currentCardDisplay();
//             updatehand();
//             currentTurn()
//         }
//     };
//     return div
// }

// function renderOpsCard(card, index) {
//     const div = document.createElement('div');
//     div.className ='card';
//     div.style.backgroundColor = card.color.toLowerCase();
//     div.textContent = card.number;
//     div.onclick = () => {
//         if ((card.color === currentCard.color || card.number === currentCard.number) && turn === 2 ) {
//             ops_hand.splice(index, 1);
//             currentCard = card;
//             currentCardDisplay();
//             updateopshand();
//             currentTurn()
//         }
//     };

//     return div
// }