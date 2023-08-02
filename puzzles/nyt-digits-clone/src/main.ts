import "./style.css";

const maxDigitCount = 6;
const difficultyGranularity = 5;

function* getPermutations(digits: Set<number>) {
  const array = [...digits].sort((a, b) => b - a);
  for (let i = 0; i < maxDigitCount; i++) {
    for (let j = 0; j < maxDigitCount; j++) {
      if (i !== j) {
        yield [array[i], array[j]];
      }
    }
  }
}

class MoveNode {
  children = new Array<MoveNode>();
  score: number;

  constructor(
    public digits: Set<number>,
    public currentMoves: string,
    public value: number | undefined,
  ) {
    const moveTypeCounter = new Set<string>();
    for (const char of currentMoves
      .split(";")
      .slice(0, 3)
      .map((move) => move[0])) {
      moveTypeCounter.add(char);
    }

    // More move types = harder, more moves required = harder
    this.score = moveTypeCounter.size ** 2 * (currentMoves.length - 1);
  }

  buildChildNodes(maxDepth: number) {
    if (this.digits.size === 1 || maxDepth === 0) {
      return;
    } else {
      for (const [a, b] of getPermutations(this.digits)) {
        const usedSet = new Set(this.digits);
        usedSet.delete(a);
        usedSet.delete(b);

        if (a <= b) {
          // Commutative operations
          const plusSet = new Set(usedSet);
          plusSet.add(a + b);
          this.children.push(
            new MoveNode(plusSet, this.currentMoves + `+ ${a} ${b};`, a + b),
          );

          // Don't care about multiplying by 1
          if (a * b !== 1) {
            const multSet = new Set(usedSet);
            multSet.add(a * b);
            this.children.push(
              new MoveNode(multSet, this.currentMoves + `* ${a} ${b};`, a * b),
            );
          }
        }

        const minusSet = new Set(usedSet);
        // Only positivess are allowed
        if (a - b > 0) {
          minusSet.add(a - b);
          this.children.push(
            new MoveNode(minusSet, this.currentMoves + `- ${a} ${b};`, a - b),
          );
        }

        const divisionSet = new Set(usedSet);
        // Only integers allowed, don't care about division by 1
        if (Number.isInteger(a / b) && b !== 1) {
          divisionSet.add(a / b);
          this.children.push(
            new MoveNode(
              divisionSet,
              this.currentMoves + `/ ${a} ${b};`,
              a / b,
            ),
          );
        }
      }

      for (const childNode of this.children) {
        childNode.buildChildNodes(maxDepth - 1);
      }
    }
  }
}

/** Scoring:
 * Difficulty increses with:
 * Fewer unique solutions
 * More unique operations used
 * @param difficulty Out of difficultyGranularity
 *  */
function generateNewPuzzle(difficulty: number) {
  if (difficulty > difficultyGranularity) {
    difficulty = difficultyGranularity;
  }

  const possibleDigits = new Array<number>();
  for (let i = 1; i <= 25; i++) {
    possibleDigits.splice((possibleDigits.length + 1) * Math.random(), 0, i);
  }
  // ! Do not modify the contents of the array.
  const relevantDigits = new Set(possibleDigits.slice(0, maxDigitCount));

  const root = new MoveNode(relevantDigits, "", undefined);
  root.buildChildNodes(3);

  const scoreTracker = new Map<number, number[]>();
  function addScore(value: number, score: number) {
    let entry = scoreTracker.get(value);
    if (entry === undefined) {
      entry = [];
      scoreTracker.set(value, entry);
    }
    entry.push(score);
  }

  // Traverse tree
  const nodeQueue: MoveNode[] = [root];
  while (nodeQueue.length > 0) {
    const procNode = nodeQueue.shift();

    for (const childNode of procNode?.children ?? []) {
      addScore(childNode.value ?? 0, childNode.score);

      nodeQueue.push(childNode);
    }
  }

  const finalScores = new Map<number, number>();
  for (const [entry, scores] of scoreTracker) {
    finalScores.set(
      entry,
      // Average, but more possible solutions = easier
      scores.reduce((prev, cur) => prev * cur) ** (1 / scores.length),
    );
  }

  const rankedFinalScores = [...finalScores].sort((a, b) => b[1] - a[1]);

  return {
    digits: [...relevantDigits].sort((a, b) => a - b),
    winningValue:
      rankedFinalScores[
        ((rankedFinalScores.length / difficultyGranularity) *
          (difficulty - 1 + Math.random())) |
          0
      ][0],
    tree: root,
    scores: finalScores,
  };
}

const opMap = {
  "+": (a: number, b: number) => a + b,
  "-": (a: number, b: number) => a - b,
  "*": (a: number, b: number) => a * b,
  "/": (a: number, b: number) => a / b,
};

class GameMove {
  operator: keyof typeof opMap | null = null;
  a: number | null = null;
  b: number | null = null;

  getResult() {
    if (this.operator === null || this.a === null || this.b === null) {
      throw Error("Invalid operation");
    }

    return opMap[this.operator](this.a, this.b);
  }

  clear() {
    this.a = null;
    this.b = null;
    this.operator = null;
  }

  constructor() {}
}

type Puzzle = ReturnType<typeof generateNewPuzzle> | undefined;

// Make GUI
const gameState = {
  puzzle: undefined as Puzzle,
  moves: new Array<GameMove>(),
  currentMove: new GameMove(),

  unselectAll() {
    // Unselect all
    for (const item of document.querySelectorAll(".selected")) {
      item.setAttribute(
        "class",
        item.getAttribute("class")?.replace("selected", "") ?? "",
      );
    }

    this.currentMove = new GameMove();
  },

  evaluateMove(simulationMode: boolean) {
    if (
      this.currentMove.operator !== null &&
      this.currentMove.a !== null &&
      this.currentMove.b !== null
    ) {
      const result = this.currentMove.getResult();
      if (!Number.isInteger(result) || result <= 0) {
        this.unselectAll();
        return;
      }

      if (!simulationMode) {
        this.moves.push(this.currentMove);
      }

      // Delete a, replace b with result
      document
        .querySelector(`.digit-input[data-value='${this.currentMove.a}']`)
        ?.remove();
      const bElement = document.querySelector(
        `.digit-input[data-value='${this.currentMove.b}']`,
      ) as HTMLDivElement;
      bElement.textContent = result.toString();
      bElement.dataset.value = bElement.textContent;

      this.unselectAll();

      if (
        bElement.textContent === (this.puzzle?.winningValue.toString() ?? "")
      ) {
        alert("Puzzle cleared.");
      }
    }
  },

  makeDigitButton(value: number) {
    const child: HTMLDivElement = document.createElement("div");
    child.setAttribute("class", "digit-input input-button");
    child.textContent = value.toString();
    child.dataset.value = value.toString();

    child.addEventListener("click", (evt) => {
      const element = evt.target as HTMLDivElement;
      const digitDisplay = Number.parseInt(element.textContent ?? "0");
      const buttonClass = element.getAttribute("class");
      const isSelected = buttonClass?.includes("selected") ?? false;

      if (isSelected) {
        element.setAttribute(
          "class",
          buttonClass?.replace("selected", "") ?? "",
        );
        if (this.currentMove.a === digitDisplay) {
          this.currentMove.a = null;
        } else if (this.currentMove.b === digitDisplay) {
          this.currentMove.b = null;
        }
        return;
      }

      if (this.currentMove.a === null) {
        this.currentMove.a = digitDisplay;
      } else {
        this.currentMove.b = digitDisplay;
      }
      element.setAttribute("class", `${buttonClass} selected`);

      this.evaluateMove(false);
    });

    return child;
  },

  resetDigits() {
    const digitParent = document.getElementById("usable-digits");

    if (digitParent == null) {
      throw Error("No place for digits");
    }

    digitParent.innerHTML = "";

    if (this.puzzle == null) {
      throw Error("No puzzle generated");
    }

    for (const digit of this.puzzle.digits) {
      digitParent.appendChild(this.makeDigitButton(digit));
    }
  },

  generateGame(difficulty: number) {
    this.puzzle = generateNewPuzzle(difficulty);
    this.resetDigits();

    // console.log(
    //   `Puzzle target score: ${this.puzzle.scores.get(
    //     this.puzzle.winningValue,
    //   )}`,
    // );
  },
};

let difficulty;
do {
  difficulty = parseInt(
    prompt(
      `Please input a difficulty (out of ${difficultyGranularity})`,
      "1",
    ) ?? "1",
  );
} while (Number.isNaN(difficulty));
gameState.generateGame(difficulty);

if (gameState.puzzle == null) {
  throw Error("No puzzle generated.");
}

document.getElementById("target-number")!.textContent =
  gameState.puzzle.winningValue.toString() ?? "";

const operatorIds = ["add-btn", "sub-btn", "mul-btn", "div-btn"];
for (const id of operatorIds) {
  document.getElementById(id)!.addEventListener("click", (evt) => {
    const target = evt.target as HTMLDivElement;
    const operator = target.dataset.opChar as keyof typeof opMap;

    const targetClass = target.getAttribute("class");
    const needClear = gameState.currentMove.operator !== null;
    if (needClear) {
      const clearMe = document.querySelector(
        `div.selected[data-op-char='${gameState.currentMove.operator}']`,
      ) as HTMLDivElement;
      clearMe.setAttribute(
        "class",
        clearMe.getAttribute("class")?.replace("selected", "") ?? "",
      );
      if (target === clearMe) {
        gameState.currentMove.operator = null;
        return;
      }
    }

    target.setAttribute("class", `${targetClass} selected`);

    gameState.currentMove.operator = operator;
    gameState.evaluateMove(false);
  });
}

document.getElementById("undo-btn")?.addEventListener("click", (_) => {
  gameState.unselectAll();

  if (gameState.moves.length === 0) {
    return;
  }

  gameState.resetDigits();
  gameState.moves.pop();

  for (const move of gameState.moves) {
    gameState.currentMove = move;
    gameState.evaluateMove(true);
  }

  gameState.currentMove = new GameMove();
});

document.getElementById("view-solution-btn")?.addEventListener("click", (_) => {
  if (gameState.puzzle == null) {
    throw Error("No puzzle generated.");
  }

  if (confirm("View one possible shortest solution?")) {
    const searchQueue = [gameState.puzzle.tree];

    // console.log(gameState.puzzle.scores);

    while (searchQueue.length > 0) {
      const procNode = searchQueue.shift();

      for (const childNode of procNode?.children ?? []) {
        if (childNode.value === gameState.puzzle.winningValue) {
          alert(
            `One possible solution: ${childNode.currentMoves.replace(
              /;/g,
              "\n",
            )}`,
          );
          return;
        }
        searchQueue.push(childNode);
      }
    }

    alert("Nothing found...?");
  }
});

document.body.style.display = "";
