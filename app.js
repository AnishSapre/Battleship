const FlipButton = document.querySelector("#flip");
const startButton = document.querySelector("#start");
const optionContainer = document.querySelector(".option-container");
const gamesBoardContainer = document.querySelector("#gamesboard-container");
const infoDisplay = document.querySelector("#display-info");
const turnDisplay = document.querySelector("#display-turn");

let angle = 0;

//option choosing
function flip() {
  const optionShips = Array.from(optionContainer.children);
  if (angle == 0) {
    angle = 90;
  } else {
    angle = 0;
  }
  optionShips.forEach(
    (optionShip) => (optionShip.style.transform = `rotate(${angle}deg)`)
  );
}
FlipButton.addEventListener("click", flip);

//create boards
const width = 10;
function createBoard(color, user) {
  const gameBoardContainer = document.createElement("div");
  gameBoardContainer.classList.add("game-board");
  gameBoardContainer.style.backgroundColor = color;
  gameBoardContainer.id = user;

  for (let i = 0; i < width * width; i++) {
    const block = document.createElement("div");
    block.classList.add("block");
    block.id = i;
    gameBoardContainer.append(block);
  }

  gamesBoardContainer.append(gameBoardContainer);
}
createBoard("rgb(76, 127, 134)", "player");
createBoard("rgb(17, 45, 49)", "cpu");

//create ships
class Ship {
  constructor(name, length) {
    this.name = name;
    this.length = length;
  }
}

const destroyer = new Ship("destroyer", 2);
const submarine = new Ship("submarine", 3);
const cruiser = new Ship("cruiser", 3);
const battleship = new Ship("battleship", 4);
const carrier = new Ship("carrier", 5);

const ships = [destroyer, submarine, cruiser, battleship, carrier];

function getValidity(allBoardBlocks, isHorizontal, startIndex, ship) {
  let ValidStart = isHorizontal
    ? startIndex <= width * width - ship.length
      ? startIndex
      : width * width - ship.length
    : startIndex <= width * width - width * ship.length
    ? startIndex
    : startIndex - ship.length * width + width;

  let shipBlocks = [];

  for (let i = 0; i < ship.length; i++) {
    if (isHorizontal) {
      shipBlocks.push(allBoardBlocks[Number(ValidStart) + i]);
    } else {
      shipBlocks.push(allBoardBlocks[Number(ValidStart) + i * width]);
    }
  }
  let valid;
  if (isHorizontal) {
    shipBlocks.every(
      (_shipBlock, index) =>
        (valid =
          shipBlocks[0].id % width !==
          width - (shipBlocks.length - (index + 1)))
    );
  } else {
    shipBlocks.every(
      (_shipBlock, index) =>
        (valid = shipBlocks[0].id < 90 + (width * index + 1))
    );
  }

  const notTaken = shipBlocks.every(
    (shipBlock) => !shipBlock.classList.contains("taken")
  );

  return { shipBlocks, valid, notTaken };
}

let notDropped;

function addShipPiece(user, ship, startID) {
  const allBoardBlocks = document.querySelectorAll(`#${user} div`);
  let randomBool = Math.random() < 0.5;
  let isHorizontal = user == "player" ? angle === 0 : randomBool;
  let randomStartIndex = Math.floor(Math.random() * width * width);

  let startIndex = startID ? startID : randomStartIndex;

  const { shipBlocks, valid, notTaken } = getValidity(
    allBoardBlocks,
    isHorizontal,
    startIndex,
    ship
  );

  if (valid && notTaken) {
    shipBlocks.forEach((shipBlock) => {
      shipBlock.classList.add(ship.name);
      shipBlock.classList.add("taken");
    });
  } else {
    if (user === "cpu") {
      addShipPiece("cpu", ship, startID);
    } else {
      addShipPiece("player", ship, startID);
    }
  }
}
ships.forEach((ship) => addShipPiece("cpu", ship));

let draggedShip;
const OptionShips = Array.from(optionContainer.children);
OptionShips.forEach((OptionShip) =>
  OptionShip.addEventListener("dragstart", dragStart)
);

const allPlayerBlocks = document.querySelectorAll("#player div");
allPlayerBlocks.forEach((PlayerBlock) => {
  PlayerBlock.addEventListener("dragover", dragOver);
  PlayerBlock.addEventListener("drop", dropShip);
});

function dragStart(e) {
  notDropped = false;
  draggedShip = e.target;
}

function dragOver(e) {
  e.preventDefault();
  const ship = ships[draggedShip.id];
  highlightArea(e.target.id, ship);
}
function dropShip(e) {
  const startID = e.target.id;
  const ship = ships[draggedShip.id];
  addShipPiece("player", ship, startID);
  if (!notDropped) {
    draggedShip.remove();
  }
}

//add highlight
function highlightArea(startIndex, ship) {
  const allBoardBlocks = document.querySelectorAll("#player div");
  let isHorizontal = angle === 0;

  const { shipBlocks, valid, notTaken } = getValidity(
    allBoardBlocks,
    isHorizontal,
    startIndex,
    ship
  );

  if (valid && notTaken) {
    shipBlocks.forEach((shipBlock) => {
      shipBlock.classList.add("hover");
      setTimeout(() => shipBlock.classList.remove("hover"), 500);
    });
  }
}

//game logic

let gameOver = false;
let playerTurn;

function startGame() {
  if (playerTurn === undefined) {
    if (optionContainer.children.length != 0) {
      infoDisplay.textContent = "Place all your pieces!";
    } else {
      const allBoardBlocks = document.querySelectorAll("#cpu div");
      allBoardBlocks.forEach((block) =>
        block.addEventListener("click", handleClick)
      );
      playerTurn = true;
      turnDisplay.textContent = "Your turn first";
      infoDisplay.textContent = "The game has started";
    }
  }
}

startButton.addEventListener("click", startGame);

let playerHits = [];
let computerHits = [];
const playerSunkShips = [];
const computerSunkShips = [];

function handleClick(e) {
  if (!gameOver) {
    if (e.target.classList.contains("taken")) {
      e.target.classList.add("boom");  // Add this line to turn the block red
      infoDisplay.textContent = "HIT!";
      let classes = Array.from(e.target.classList);
      classes = classes.filter((className) => className !== "block");
      classes = classes.filter((className) => className !== "boom");
      classes = classes.filter((className) => className !== "taken");
      playerHits.push(...classes);
      checkScore("player", playerHits, playerSunkShips);
    }
    if (!e.target.classList.contains("taken")) {
      infoDisplay.textContent = "Miss!";
      e.target.classList.add("empty");
    }
    playerTurn = false;
    const allBoardBlocks = document.querySelectorAll("#cpu div");
    allBoardBlocks.forEach((block) => block.replaceWith(block.cloneNode(true)));
    setTimeout(computerGo, 3000);
  }
}

//Computer turn
function computerGo() {
  if (!gameOver) {
    turnDisplay.textContent = "CPUs turn";
    infoDisplay.textContent = "Calculating...";

    setTimeout(() => {
      let randomGo = Math.floor(Math.random() * width * width);
      const allBoardBlocks = document.querySelectorAll("#player div");

      if (
        allBoardBlocks[randomGo].classList.contains("taken") &&
        allBoardBlocks[randomGo].classList.contains("boom")
      ) {
        computerGo();
        return;
      } else if (
        allBoardBlocks[randomGo].classList.contains("taken") &&
        !allBoardBlocks[randomGo].classList.contains("boom")
      ) {
        allBoardBlocks[randomGo].classList.add("boom");
        infoDisplay.textContent = "You have been hit";
        let classes = Array.from(allBoardBlocks[randomGo].classList);
        classes = classes.filter((className) => className !== "block");
        classes = classes.filter((className) => className !== "boom");
        classes = classes.filter((className) => className !== "taken");
        computerHits.push(...classes);
        checkScore("cpu", computerHits, computerSunkShips);
      } else {
        infoDisplay.textContent = "Miss!";
        allBoardBlocks[randomGo].classList.add("empty");
      }
    }, 1000);
    setTimeout(() => {
      playerTurn = true;
      turnDisplay.textContent = "Your turn";
      infoDisplay.textContent = "Try hitting a ship";
      const allBoardBlocks = document.querySelectorAll("#cpu div");
      allBoardBlocks.forEach((block) =>
        block.addEventListener("click", handleClick)
      );
    }, 1000);
  }
}

function checkScore(user, userHits, userSunkShips) {
  function checkShip(shipName, shipLength) {
    if (
      userHits.filter((storedShipName) => storedShipName == shipName).length ===
      shipLength
    ) {
      infoDisplay.textContent = `${shipName} has been sunk`;
      if (user == "player") {
        playerHits = userHits.filter(
          (storedShipName) => storedShipName !== shipName
        );
      }
      if (user == "cpu") {
        playerHits = userHits.filter(
          (storedShipName) => storedShipName !== shipName
        );
      }
      userSunkShips.push(shipName);
    }
  }
  checkShip("destroyer", 2);
  checkShip("submarine", 3);
  checkShip("cruiser", 3);
  checkShip("battleship", 4);
  checkShip("carrier", 5);

  if (playerSunkShips.length == 5) {
    infoDisplay.textContent = "Won";
    gameOver = true;
  }
  if (computerSunkShips.length == 5) {
    infoDisplay.textContent = "Cpu won";
    gameOver = true;
  }
}
