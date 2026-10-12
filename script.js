// ============================================================
// PDA - CFG CONVERTER & SIMULATOR (HACKERRANK THEME EDITION)
// ============================================================

// ------------------------------------------------------------
// Global variables — the memory of your program
// ------------------------------------------------------------
let grammar = [];
let inputString = "";
let simulationQueue = [];
let visited = new Set();
let currentStep = 0;
let simulationStarted = false;
let simulationFinished = false;
let simulationHistory = [];

// ------------------------------------------------------------
// DOM elements — connecting JavaScript to the webpage
// ------------------------------------------------------------
const variablesInput = document.getElementById("variables");
const terminalsInput = document.getElementById("terminals");
const productionsInput = document.getElementById("productions");
const inputStringInput = document.getElementById("inputString");

const convertBtn = document.getElementById("convertBtn");
const simulateBtn = document.getElementById("simulateBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const resetBtn = document.getElementById("resetBtn");

const themeToggleBtn = document.getElementById("themeToggleBtn");
const themeIcon = document.getElementById("themeIcon");
const themeLabel = document.getElementById("themeLabel");

const displayVariables = document.getElementById("displayVariables");
const displayTerminals = document.getElementById("displayTerminals");
const displayProductions = document.getElementById("displayProductions");

const stepNumber = document.getElementById("stepNumber");
const stepBadgeCounter = document.getElementById("stepBadgeCounter");
const totalStepsRecorded = document.getElementById("totalStepsRecorded");
const currentState = document.getElementById("currentState");
const inputPosition = document.getElementById("inputPosition");
const remainingInput = document.getElementById("remainingInput");
const stackVisual = document.getElementById("stackVisual");
const simulationTable = document.getElementById("simulationTable");

// Tab elements for Step Log and PDA Transition Table
const tabStepLogBtn = document.getElementById("tabStepLogBtn");
const tabTransitionTableBtn = document.getElementById("tabTransitionTableBtn");
const stepLogWrapper = document.getElementById("stepLogWrapper");
const transitionTableWrapper = document.getElementById("transitionTableWrapper");
const transitionTableBody = document.getElementById("transitionTableBody");
const totalTransitionsCount = document.getElementById("totalTransitionsCount");

const currentTransition = document.getElementById("currentTransition");
const transitionText = document.getElementById("transitionText");
const livePill = document.getElementById("livePill");

const resultBox = document.getElementById("resultBox");
const resultIcon = document.getElementById("resultIcon");
const resultText = document.getElementById("resultText");
const resultDescription = document.getElementById("resultDescription");

// ------------------------------------------------------------
// THEME TOGGLE (LIGHT / DARK MODE)
// ------------------------------------------------------------
function initTheme() {
    const saved = localStorage.getItem("pda_theme");
    if (saved === "light") {
        document.body.classList.add("light-mode");
        if (themeIcon) themeIcon.textContent = "🌙";
        if (themeLabel) themeLabel.textContent = "Dark Mode";
    } else {
        document.body.classList.remove("light-mode");
        if (themeIcon) themeIcon.textContent = "☀️";
        if (themeLabel) themeLabel.textContent = "Light Mode";
    }
}

if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
        const isLight = document.body.classList.toggle("light-mode");
        if (isLight) {
            if (themeIcon) themeIcon.textContent = "🌙";
            if (themeLabel) themeLabel.textContent = "Dark Mode";
            localStorage.setItem("pda_theme", "light");
        } else {
            if (themeIcon) themeIcon.textContent = "☀️";
            if (themeLabel) themeLabel.textContent = "Light Mode";
            localStorage.setItem("pda_theme", "dark");
        }
    });
}

// ------------------------------------------------------------
// LIVE DIAGRAM STATE MACHINE CONTROLLER (SVG)
// ------------------------------------------------------------
function updateDiagram(phase, details = {}) {
    const q0 = document.getElementById("stateQ0");
    const q1 = document.getElementById("stateQ1");
    const q2 = document.getElementById("stateQ2");
    const transQ0Q1 = document.getElementById("transQ0Q1");
    const transLoop = document.getElementById("transLoop");
    const transQ1Q2 = document.getElementById("transQ1Q2");
    const loopBadge = document.getElementById("transitionText");

    // Reset base SVG classes
    if (q0) q0.setAttribute("class", "svg-state-group");
    if (q1) q1.setAttribute("class", "svg-state-group");
    if (q2) q2.setAttribute("class", "svg-state-group final-group");
    if (transQ0Q1) transQ0Q1.setAttribute("class", "svg-trans-group");
    if (transLoop) transLoop.setAttribute("class", "svg-trans-group loop-group");
    if (transQ1Q2) transQ1Q2.setAttribute("class", "svg-trans-group");

    switch (phase) {
        case "idle":
            if (q0) q0.setAttribute("class", "svg-state-group active-state");
            if (livePill) {
                livePill.className = "status-pill idle";
                livePill.textContent = "IDLE";
            }
            if (currentTransition) {
                currentTransition.textContent = "Press \"Start Simulation\" to begin";
            }
            if (loopBadge && grammar.length > 0) {
                loopBadge.textContent = `ε, ${grammar[0].lhs} → ${grammar[0].rhs || "ε"}`;
            }
            break;

        case "start":
            if (q1) q1.setAttribute("class", "svg-state-group active-state");
            if (transQ0Q1) transQ0Q1.setAttribute("class", "svg-trans-group active-pulse");
            if (livePill) {
                livePill.className = "status-pill start";
                livePill.textContent = "START";
            }
            const startSymbol = details.top || (grammar[0] ? grammar[0].lhs : "S");
            if (currentTransition) {
                currentTransition.textContent = `q₀ → q₁ : Initialized stack with start symbol '${startSymbol}'`;
            }
            if (loopBadge && grammar[0]) {
                loopBadge.textContent = `ε, ${grammar[0].lhs} → ${grammar[0].rhs || "ε"}`;
            }
            break;

        case "expand":
            if (q1) q1.setAttribute("class", "svg-state-group active-state");
            if (transLoop) transLoop.setAttribute("class", "svg-trans-group loop-group active-pulse");
            if (livePill) {
                livePill.className = "status-pill expand";
                livePill.textContent = "EXPAND";
            }
            const ruleStr = `ε, ${details.variable} → ${details.rhs || "ε"}`;
            if (loopBadge) loopBadge.textContent = ruleStr;
            if (currentTransition) {
                currentTransition.textContent = `q₁ ↺ q₁ : Expand variable '${details.variable}' → '${details.rhs || "ε"}' (Pushed to stack)`;
            }
            break;

        case "match":
            if (q1) q1.setAttribute("class", "svg-state-group active-state");
            if (transLoop) transLoop.setAttribute("class", "svg-trans-group loop-group active-pulse-match");
            if (livePill) {
                livePill.className = "status-pill match";
                livePill.textContent = "MATCH";
            }
            const matchStr = `'${details.symbol}', '${details.symbol}' → ε`;
            if (loopBadge) loopBadge.textContent = matchStr;
            if (currentTransition) {
                currentTransition.textContent = `q₁ ↺ q₁ : Matched terminal '${details.symbol}' with stack top → Pop '${details.symbol}'`;
            }
            break;

        case "accept":
            if (transQ1Q2) transQ1Q2.setAttribute("class", "svg-trans-group active-accept");
            if (q2) q2.setAttribute("class", "svg-state-group final-group active-accept");
            if (livePill) {
                livePill.className = "status-pill accept";
                livePill.textContent = "ACCEPT";
            }
            if (currentTransition) {
                currentTransition.textContent = "q₁ → q₂ : ε, Z → ε — All input consumed & stack empty! ACCEPTED.";
            }
            break;

        case "reject":
            if (q1) q1.setAttribute("class", "svg-state-group rejected-state");
            if (livePill) {
                livePill.className = "status-pill reject";
                livePill.textContent = "REJECT";
            }
            if (currentTransition) {
                currentTransition.textContent = `q₁ : No valid transition for stack top '${details.top || "ε"}'. String REJECTED.`;
            }
            break;

        case "no-action":
            if (q1) q1.setAttribute("class", "svg-state-group active-state");
            if (livePill) {
                livePill.className = "status-pill reject";
                livePill.textContent = "NO ACTION";
            }
            if (currentTransition) {
                currentTransition.textContent = "q₁ : No action possible on dead-end branch → Backtracking to next configuration";
            }
            break;
    }
}

// ------------------------------------------------------------
// PARSE CFG
// ------------------------------------------------------------
function parseGrammar() {
    const text = productionsInput.value.trim();

    if (!text) {
        alert("Please enter at least one production.");
        return false;
    }

    const lines = text.split("\n");
    grammar = [];

    for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        // Support both -> and →
        line = line.replace("→", "->");

        const parts = line.split("->");
        if (parts.length !== 2) {
            alert("Invalid production:\n" + line);
            return false;
        }

        const lhs = parts[0].trim();
        let rhs = parts[1].trim();

        if (lhs.length !== 1) {
            alert("For this version, LHS must be one variable symbol.");
            return false;
        }

        // 'e' or 'ε' represents epsilon (empty string)
        if (rhs === "e" || rhs === "ε") {
            rhs = "";
        }

        grammar.push({
            lhs: lhs,
            rhs: rhs
        });
    }

    if (grammar.length === 0) {
        alert("No valid productions found.");
        return false;
    }

    return true;
}

// ------------------------------------------------------------
// IS VARIABLE?
// ------------------------------------------------------------
function isVariable(symbol) {
    return grammar.some(production => production.lhs === symbol);
}

// ------------------------------------------------------------
// DISPLAY CFG
// ------------------------------------------------------------
function displayCFG() {
    if (grammar.length === 0) return;

    displayVariables.textContent = variablesInput.value || grammar[0].lhs;
    displayTerminals.textContent = terminalsInput.value || "a, b";

    displayProductions.innerHTML = grammar
        .map(production => {
            const rhs = production.rhs === "" ? "ε" : production.rhs;
            return `${production.lhs} → ${rhs}`;
        })
        .join("<br>");
}

// ------------------------------------------------------------
// CREATE INITIAL CONFIGURATION
// ------------------------------------------------------------
function createInitialConfiguration() {
    return {
        inputPos: 0,
        stack: grammar[0].lhs
    };
}

// ------------------------------------------------------------
// CONFIGURATION KEY FOR BFS VISITED SET
// ------------------------------------------------------------
function configurationKey(config) {
    return config.inputPos + "|" + config.stack;
}

// ------------------------------------------------------------
// REMAINING INPUT STRING HELPER
// ------------------------------------------------------------
function getRemainingInput(pos) {
    if (pos >= inputString.length) {
        return "ε";
    }
    return inputString.substring(pos);
}

// ------------------------------------------------------------
// RENDER REMAINING INPUT WITH CURRENT POINTER HIGHLIGHT
// ------------------------------------------------------------
function renderRemainingInput(pos) {
    if (!remainingInput) return;

    if (pos >= inputString.length) {
        remainingInput.innerHTML = `<span style="color: var(--text-muted)">ε (consumed)</span>`;
        return;
    }

    const read = inputString.substring(0, pos);
    const curr = inputString[pos];
    const rest = inputString.substring(pos + 1);

    remainingInput.innerHTML = `
        <span style="color: var(--text-muted); opacity: 0.7;">${read}</span><span style="background: var(--hr-green); color: #08121a; padding: 1px 6px; border-radius: 4px; font-weight: 700; margin: 0 2px; box-shadow: 0 0 8px rgba(0,234,100,0.4);">${curr}</span><span>${rest}</span>
    `;
}

// ------------------------------------------------------------
// SHOW STACK VISUALLY WITH TOP TAG
// ------------------------------------------------------------
function renderStack(stack) {
    if (!stackVisual) return;
    stackVisual.innerHTML = "";

    if (!stack || stack.length === 0) {
        const empty = document.createElement("div");
        empty.className = "stack-cell";
        empty.style.color = "var(--text-muted)";
        empty.textContent = "ε (Empty)";
        stackVisual.appendChild(empty);
        return;
    }

    // Display stack symbols: bottom on left, TOP on right
    for (let i = 0; i < stack.length; i++) {
        const cell = document.createElement("div");
        const isTop = (i === stack.length - 1);

        cell.className = isTop ? "stack-cell top-cell" : "stack-cell";
        cell.textContent = stack[i];

        if (isTop) {
            cell.title = "Top of Stack";
        }

        stackVisual.appendChild(cell);
    }
}

// ------------------------------------------------------------
// UPDATE STEP COUNTERS
// ------------------------------------------------------------
function updateStepCounters(step) {
    if (stepNumber) stepNumber.textContent = step;
    if (stepBadgeCounter) stepBadgeCounter.textContent = step;
}

// ------------------------------------------------------------
// ADD TABLE ROW (STRICTLY CONTAINED IN BOX)
// ------------------------------------------------------------
function addSimulationRow(config, action) {
    const row = document.createElement("tr");
    const stateName = config.state || ((action === "ACCEPT") ? "q2" : "q1");
    const isReject = (action === "REJECT" || action.startsWith("REJECT"));
    let pillClass = "action-pill";
    if (action === "ACCEPT") pillClass = "action-pill accept-action";
    else if (isReject) pillClass = "action-pill no-action";

    row.innerHTML = `
        <td class="col-step"><span class="step-num-badge">#${currentStep}</span></td>
        <td class="col-state"><span class="state-badge">${stateName}</span></td>
        <td class="col-input">${getRemainingInput(config.inputPos)}</td>
        <td class="col-stack">${config.stack || "ε"}</td>
        <td class="col-action"><span class="${pillClass}">${action}</span></td>
    `;

    simulationTable.appendChild(row);

    // Highlight current row
    document
        .querySelectorAll("#simulationTable tr")
        .forEach(r => r.classList.remove("active-row"));

    row.classList.add("active-row");

    // Strictly ensure steps DO NOT exit the box: auto-scroll inside container
    const wrapper = document.querySelector("#stepLogWrapper");
    if (wrapper) {
        wrapper.scrollTop = wrapper.scrollHeight;
    }

    if (totalStepsRecorded) {
        totalStepsRecorded.textContent = `${simulationTable.children.length} Recorded`;
    }
}

// ------------------------------------------------------------
// SHOW CONFIGURATION IN DASHBOARD
// ------------------------------------------------------------
function showConfiguration(config) {
    updateStepCounters(currentStep);

    if (currentState) currentState.textContent = config.state || "q1";
    if (inputPosition) inputPosition.textContent = config.inputPos !== undefined ? config.inputPos : 0;

    renderRemainingInput(config.inputPos !== undefined ? config.inputPos : 0);
    renderStack(config.stack);
}

// ------------------------------------------------------------
// RECORD STEP SNAPSHOT (FOR PREVIOUS STEP NAVIGATION)
// ------------------------------------------------------------
function recordStepSnapshot(config, action, diagramPhase, diagramDetails, isAccepted = null) {
    simulationHistory.push({
        stepNumber: currentStep,
        config: { inputPos: config.inputPos, stack: config.stack },
        action: action,
        diagramPhase: diagramPhase,
        diagramDetails: diagramDetails || {},
        isAccepted: isAccepted,
        currentState: currentState ? currentState.textContent : "q1",
        simulationQueue: simulationQueue.map(item => ({ ...item })),
        visited: new Set(visited),
        simulationFinished: simulationFinished,
        currentTransitionText: currentTransition ? currentTransition.textContent : "",
        livePillClass: livePill ? livePill.className : "",
        livePillText: livePill ? livePill.textContent : ""
    });

    if (prevBtn) {
        prevBtn.disabled = (simulationHistory.length <= 1);
    }
}

// ------------------------------------------------------------
// SET RESULT BANNER
// ------------------------------------------------------------
function showResult(accepted) {
    resultBox.classList.remove("hidden");
    resultBox.classList.remove("rejected");

    if (accepted) {
        resultIcon.textContent = "✓";
        resultText.textContent = "ACCEPTED";
        resultDescription.textContent = "The input string is accepted by the Pushdown Automaton.";
        if (currentState) currentState.textContent = "q2";
        updateDiagram("accept");
    } else {
        resultBox.classList.add("rejected");
        resultIcon.textContent = "✕";
        resultText.textContent = "REJECTED";
        resultDescription.textContent = "No valid accepting PDA computation branch exists.";
        updateDiagram("reject");
    }
}

// ------------------------------------------------------------
// HIDE RESULT BANNER
// ------------------------------------------------------------
function hideResult() {
    resultBox.classList.add("hidden");
}

// ------------------------------------------------------------
// TAB SWITCHING (STEP LOG <-> PDA TRANSITION TABLE)
// ------------------------------------------------------------
function switchTab(tab) {
    if (tab === "transitionTable") {
        if (tabTransitionTableBtn) {
            tabTransitionTableBtn.classList.add("active");
            tabTransitionTableBtn.setAttribute("aria-selected", "true");
        }
        if (tabStepLogBtn) {
            tabStepLogBtn.classList.remove("active");
            tabStepLogBtn.setAttribute("aria-selected", "false");
        }
        if (stepLogWrapper) stepLogWrapper.style.display = "none";
        if (transitionTableWrapper) transitionTableWrapper.style.display = "block";
    } else {
        if (tabStepLogBtn) {
            tabStepLogBtn.classList.add("active");
            tabStepLogBtn.setAttribute("aria-selected", "true");
        }
        if (tabTransitionTableBtn) {
            tabTransitionTableBtn.classList.remove("active");
            tabTransitionTableBtn.setAttribute("aria-selected", "false");
        }
        if (stepLogWrapper) stepLogWrapper.style.display = "block";
        if (transitionTableWrapper) transitionTableWrapper.style.display = "none";
    }
}

// ------------------------------------------------------------
// AUTOMATIC PDA TRANSITION TABLE GENERATOR
// ------------------------------------------------------------
function generatePDATransitionTable() {
    if (!transitionTableBody) return [];
    if (grammar.length === 0) return [];

    const startVar = grammar[0].lhs || "S";

    // Extract terminals: from terminals input AND grammar RHS
    const terminalsSet = new Set();
    const rawTerms = terminalsInput ? terminalsInput.value : "a,b";
    rawTerms.split(/[, \t]+/).forEach(t => {
        const clean = t.trim();
        if (clean && clean !== "e" && clean !== "ε") terminalsSet.add(clean);
    });

    // Also scan productions for terminals
    grammar.forEach(prod => {
        for (const ch of prod.rhs) {
            if (!isVariable(ch) && ch !== "e" && ch !== "ε") {
                terminalsSet.add(ch);
            }
        }
    });

    const terminalsList = Array.from(terminalsSet).sort();
    const transitions = [];

    // 1. Start rule: q0 -> q1
    transitions.push({
        type: "start",
        typeLabel: "Start",
        currentState: "q₀",
        inputSymbol: "ε",
        stackTop: "Z",
        nextState: "q₁",
        stackOp: `Push ${startVar} (SZ)`,
        delta: `δ(q₀, ε, Z) = {(q₁, ${startVar}Z)}`,
        note: `Initialize stack with start symbol '${startVar}' on marker 'Z'`
    });

    // 2. CFG Productions: Expansion on q1
    grammar.forEach(prod => {
        const rhsDisplay = prod.rhs === "" ? "ε" : prod.rhs;
        const opDesc = prod.rhs === "" ? `Pop ${prod.lhs} (ε)` : `Replace ${prod.lhs} → ${prod.rhs}`;
        transitions.push({
            type: "expand",
            typeLabel: "Expand",
            currentState: "q₁",
            inputSymbol: "ε",
            stackTop: prod.lhs,
            nextState: "q₁",
            stackOp: opDesc,
            delta: `δ(q₁, ε, ${prod.lhs}) = {(q₁, ${rhsDisplay})}`,
            note: `Derivation rule: ${prod.lhs} → ${rhsDisplay}`
        });
    });

    // 3. Match rules: Matching terminals on q1
    terminalsList.forEach(t => {
        transitions.push({
            type: "match",
            typeLabel: "Match",
            currentState: "q₁",
            inputSymbol: t,
            stackTop: t,
            nextState: "q₁",
            stackOp: `Pop '${t}' (ε)`,
            delta: `δ(q₁, ${t}, ${t}) = {(q₁, ε)}`,
            note: `Read input '${t}', match and pop from stack`
        });
    });

    // 4. Accept rule: q1 -> q2
    transitions.push({
        type: "accept",
        typeLabel: "Accept",
        currentState: "q₁",
        inputSymbol: "ε",
        stackTop: "Z",
        nextState: "q₂",
        stackOp: "Pop Z (ε)",
        delta: "δ(q₁, ε, Z) = {(q₂, ε)}",
        note: "Empty stack acceptance into final state q₂"
    });

    // Render table rows
    transitionTableBody.innerHTML = "";
    transitions.forEach((trans, index) => {
        const tr = document.createElement("tr");

        const idTd = document.createElement("td");
        idTd.className = "col-trans-id";
        idTd.innerHTML = `<span class="step-num-badge">#${index + 1}</span>`;

        const typeTd = document.createElement("td");
        typeTd.className = "col-trans-type";
        typeTd.innerHTML = `<span class="type-badge ${trans.type}">${trans.typeLabel}</span>`;

        const stateTd = document.createElement("td");
        stateTd.className = "col-trans-state";
        stateTd.innerHTML = `<span class="state-badge">${trans.currentState}</span>`;

        const inputTd = document.createElement("td");
        inputTd.className = "col-trans-input";
        inputTd.innerHTML = `<span class="symbol-code">${trans.inputSymbol}</span>`;

        const topTd = document.createElement("td");
        topTd.className = "col-trans-top";
        topTd.innerHTML = `<span class="symbol-code">${trans.stackTop}</span>`;

        const nextTd = document.createElement("td");
        nextTd.className = "col-trans-next";
        nextTd.innerHTML = `<span class="state-badge">${trans.nextState}</span>`;

        const opTd = document.createElement("td");
        opTd.className = "col-trans-op";
        opTd.innerHTML = `<span class="op-text">${trans.stackOp}</span>`;

        const deltaTd = document.createElement("td");
        deltaTd.className = "col-trans-delta";
        deltaTd.innerHTML = `<code class="delta-code">${trans.delta}</code>`;

        tr.appendChild(idTd);
        tr.appendChild(typeTd);
        tr.appendChild(stateTd);
        tr.appendChild(inputTd);
        tr.appendChild(topTd);
        tr.appendChild(nextTd);
        tr.appendChild(opTd);
        tr.appendChild(deltaTd);

        transitionTableBody.appendChild(tr);
    });

    if (totalTransitionsCount) {
        totalTransitionsCount.textContent = `${transitions.length} Rules`;
    }

    return transitions;
}

// ------------------------------------------------------------
// CONVERT CFG TO PDA
// ------------------------------------------------------------
function convertToPDA() {
    if (!parseGrammar()) return;

    displayCFG();
    const transitions = generatePDATransitionTable();
    updateDiagram("idle");

    // Automatically display the transition table tab to show conversion
    switchTab("transitionTable");

    if (currentTransition) {
        currentTransition.textContent = `CFG successfully converted to PDA! Generated ${transitions.length} transition rules.`;
    }
}

// ------------------------------------------------------------
// FIND PDA SIMULATION PATH (NONDETERMINISTIC BRANCH EXPLORATION)
// ------------------------------------------------------------
function findPDASimulationPath(targetGrammar, rawInput) {
    if (!targetGrammar || targetGrammar.length === 0) {
        return { accepted: false, steps: [] };
    }

    const startSymbol = targetGrammar[0].lhs || "S";
    const cleanInput = (rawInput === "e" || rawInput === "ε") ? "" : rawInput;

    const initialNode = {
        state: "q1",
        inputPos: 0,
        stack: startSymbol,
        action: `Start (Push ${startSymbol})`,
        rule: { type: "start", top: startSymbol },
        path: [
            {
                stepNumber: 1,
                state: "q1",
                inputPos: 0,
                stack: startSymbol,
                action: `Start (Push ${startSymbol})`,
                rule: { type: "start", top: startSymbol },
                isAccepted: null,
                diagramPhase: "start",
                diagramDetails: { top: startSymbol }
            }
        ]
    };

    const queue = [initialNode];
    const visited = new Set();
    visited.add("0|" + startSymbol);

    let bestDeadEnd = initialNode;
    let maxInputConsumed = -1;
    let acceptingNode = null;
    let iterations = 0;
    const maxIterations = 5000;

    while (queue.length > 0 && iterations < maxIterations) {
        iterations++;
        const curr = queue.shift();

        // 1. Acceptance condition: input consumed AND stack completely empty!
        if (curr.inputPos === cleanInput.length && curr.stack.length === 0) {
            acceptingNode = curr;
            break;
        }

        if (curr.inputPos > maxInputConsumed) {
            maxInputConsumed = curr.inputPos;
            bestDeadEnd = curr;
        }

        if (curr.stack.length === 0) {
            continue; // Cannot transition further if stack is empty but input remains
        }

        const top = curr.stack[curr.stack.length - 1];

        // 2. Variable Expansion
        if (isVariable(top)) {
            for (const prod of targetGrammar) {
                if (prod.lhs !== top) continue;

                let nextStack = curr.stack.substring(0, curr.stack.length - 1);
                // Push RHS in reverse order
                for (let i = prod.rhs.length - 1; i >= 0; i--) {
                    nextStack += prod.rhs[i];
                }

                // Pruning 1: count terminals in nextStack vs remaining input length
                let termCount = 0;
                for (let j = 0; j < nextStack.length; j++) {
                    if (!isVariable(nextStack[j])) termCount++;
                }
                const remainingLength = cleanInput.length - curr.inputPos;
                if (termCount > remainingLength) {
                    continue; // Prune: more terminals on stack than characters left to match
                }

                // Pruning 2: stack depth safety limit
                if (nextStack.length > Math.max(cleanInput.length * 3 + 10, 20)) {
                    continue;
                }

                const key = curr.inputPos + "|" + nextStack;
                if (visited.has(key)) continue;
                visited.add(key);

                const actionText = `Expand ${top} → ${prod.rhs || "ε"}`;
                const nextStepObj = {
                    stepNumber: curr.path.length + 1,
                    state: "q1",
                    inputPos: curr.inputPos,
                    stack: nextStack,
                    action: actionText,
                    rule: { type: "expand", variable: top, rhs: prod.rhs },
                    isAccepted: null,
                    diagramPhase: "expand",
                    diagramDetails: { variable: top, rhs: prod.rhs }
                };

                const childNode = {
                    state: "q1",
                    inputPos: curr.inputPos,
                    stack: nextStack,
                    action: actionText,
                    rule: { type: "expand", variable: top, rhs: prod.rhs },
                    path: [...curr.path, nextStepObj]
                };

                // Quick accept check if this rule emptied stack and input is consumed
                if (curr.inputPos === cleanInput.length && nextStack.length === 0) {
                    acceptingNode = childNode;
                    break;
                }

                queue.push(childNode);
            }

            if (acceptingNode) break;
            continue;
        }

        // 3. Terminal Match
        if (curr.inputPos < cleanInput.length && cleanInput[curr.inputPos] === top) {
            const nextStack = curr.stack.substring(0, curr.stack.length - 1);
            const nextPos = curr.inputPos + 1;
            const key = nextPos + "|" + nextStack;

            if (!visited.has(key)) {
                visited.add(key);
                const actionText = `Match '${top}' (Pop)`;
                const nextStepObj = {
                    stepNumber: curr.path.length + 1,
                    state: "q1",
                    inputPos: nextPos,
                    stack: nextStack,
                    action: actionText,
                    rule: { type: "match", symbol: top },
                    isAccepted: null,
                    diagramPhase: "match",
                    diagramDetails: { symbol: top }
                };

                const childNode = {
                    state: "q1",
                    inputPos: nextPos,
                    stack: nextStack,
                    action: actionText,
                    rule: { type: "match", symbol: top },
                    path: [...curr.path, nextStepObj]
                };

                if (nextPos === cleanInput.length && nextStack.length === 0) {
                    acceptingNode = childNode;
                    break;
                }

                queue.push(childNode);
            }
        }
    }

    if (acceptingNode) {
        const acceptStep = {
            stepNumber: acceptingNode.path.length + 1,
            state: "q2",
            inputPos: cleanInput.length,
            stack: "",
            action: "ACCEPT",
            rule: { type: "accept" },
            isAccepted: true,
            diagramPhase: "accept",
            diagramDetails: {}
        };
        return {
            accepted: true,
            steps: [...acceptingNode.path, acceptStep]
        };
    }

    // No branch accepted: build clean reject trace from deepest branch explored
    const rejectPath = [...bestDeadEnd.path];
    rejectPath.push({
        stepNumber: rejectPath.length + 1,
        state: "q1",
        inputPos: bestDeadEnd.inputPos,
        stack: bestDeadEnd.stack,
        action: "REJECT",
        rule: { type: "reject" },
        isAccepted: false,
        diagramPhase: "reject",
        diagramDetails: {}
    });

    return {
        accepted: false,
        steps: rejectPath
    };
}

// ------------------------------------------------------------
// START SIMULATION
// ------------------------------------------------------------
function startSimulation() {
    if (!parseGrammar()) return;

    // Switch to step log tab to display live simulation
    switchTab("stepLog");

    inputString = inputStringInput.value.trim();
    if (inputString === "e" || inputString === "ε") {
        inputString = "";
    }

    displayCFG();

    // Reset simulation variables
    simulationHistory = [];
    currentStep = 0;
    simulationStarted = true;
    simulationFinished = false;

    if (prevBtn) prevBtn.disabled = true;

    simulationTable.innerHTML = "";
    if (totalStepsRecorded) totalStepsRecorded.textContent = "0 Recorded";
    hideResult();

    // Compute input-dependent nondeterministic PDA path
    const simResult = findPDASimulationPath(grammar, inputString);
    plannedSimulationSteps = simResult.steps;

    if (!plannedSimulationSteps || plannedSimulationSteps.length === 0) {
        showResult(false);
        nextBtn.disabled = true;
        return;
    }

    // Show initial configuration (Step 1)
    currentStep = 1;
    const initialStep = plannedSimulationSteps[0];
    showConfiguration(initialStep);
    addSimulationRow(initialStep, initialStep.action);
    updateDiagram(initialStep.diagramPhase, initialStep.diagramDetails);
    recordStepSnapshot(initialStep, initialStep.action, initialStep.diagramPhase, initialStep.diagramDetails, initialStep.isAccepted);

    if (plannedSimulationSteps.length === 1) {
        simulationFinished = true;
        nextBtn.disabled = true;
        if (initialStep.isAccepted !== null) {
            showResult(initialStep.isAccepted);
        }
    } else {
        nextBtn.disabled = false;
    }
}

// ------------------------------------------------------------
// NEXT SIMULATION STEP
// ------------------------------------------------------------
function nextStep() {
    if (!simulationStarted) return;
    if (simulationFinished) return;

    if (currentStep >= plannedSimulationSteps.length) {
        simulationFinished = true;
        nextBtn.disabled = true;
        return;
    }

    const nextStepObj = plannedSimulationSteps[currentStep];
    currentStep++;

    showConfiguration(nextStepObj);
    addSimulationRow(nextStepObj, nextStepObj.action);
    updateDiagram(nextStepObj.diagramPhase, nextStepObj.diagramDetails);
    recordStepSnapshot(nextStepObj, nextStepObj.action, nextStepObj.diagramPhase, nextStepObj.diagramDetails, nextStepObj.isAccepted);

    if (prevBtn) prevBtn.disabled = false;

    // Check if we reached the final step
    if (currentStep === plannedSimulationSteps.length) {
        simulationFinished = true;
        nextBtn.disabled = true;
        if (nextStepObj.isAccepted === true) {
            showResult(true);
        } else if (nextStepObj.isAccepted === false) {
            showResult(false);
        }
    }
}

// ------------------------------------------------------------
// PREVIOUS SIMULATION STEP (BACKWARD NAVIGATION)
// ------------------------------------------------------------
function prevStep() {
    if (!simulationStarted) return;
    if (currentStep <= 1) return;

    // Remove the current step from history and table
    simulationHistory.pop();
    if (simulationTable && simulationTable.lastElementChild) {
        simulationTable.removeChild(simulationTable.lastElementChild);
        if (simulationTable.lastElementChild) {
            document
                .querySelectorAll("#simulationTable tr")
                .forEach(r => r.classList.remove("active-row"));
            simulationTable.lastElementChild.classList.add("active-row");
        }
    }

    currentStep--;
    simulationFinished = false;
    hideResult();
    nextBtn.disabled = false;

    const targetStep = plannedSimulationSteps[currentStep - 1];
    if (targetStep) {
        showConfiguration(targetStep);
        updateDiagram(targetStep.diagramPhase, targetStep.diagramDetails);
    }

    if (totalStepsRecorded) {
        totalStepsRecorded.textContent = `${simulationTable.children.length} Recorded`;
    }

    if (prevBtn) {
        prevBtn.disabled = (currentStep <= 1);
    }
}

// ------------------------------------------------------------
// RESET SIMULATION
// ------------------------------------------------------------
function resetSimulation() {
    plannedSimulationSteps = [];
    simulationHistory = [];
    currentStep = 0;
    simulationStarted = false;
    simulationFinished = false;

    if (prevBtn) prevBtn.disabled = true;
    if (nextBtn) nextBtn.disabled = true;

    updateStepCounters(0);

    if (currentState) currentState.textContent = "q1";
    if (inputPosition) inputPosition.textContent = "0";

    const defaultStr = inputStringInput ? inputStringInput.value : "";
    if (remainingInput) {
        remainingInput.textContent = (defaultStr === "e" || defaultStr === "ε" || !defaultStr) ? "ε" : defaultStr;
    }

    if (stackVisual) {
        const topSymbol = (grammar.length > 0) ? grammar[0].lhs : "S";
        stackVisual.innerHTML = `<div class="stack-cell top-cell">${topSymbol}</div>`;
    }

    if (simulationTable) simulationTable.innerHTML = "";
    if (totalStepsRecorded) totalStepsRecorded.textContent = "0 Recorded";

    hideResult();
    updateDiagram("idle");

    if (currentTransition) {
        currentTransition.textContent = "Press \"Start Simulation\" to begin";
    }
}

// ------------------------------------------------------------
// EXAMPLE PRESET BUTTONS
// ------------------------------------------------------------
document.querySelectorAll(".example-buttons button").forEach(button => {
    button.addEventListener("click", () => {
        const exampleVal = button.dataset.example;
        inputStringInput.value = exampleVal;
        resetSimulation();
    });
});

// ------------------------------------------------------------
// ATTACH EVENT LISTENERS
// ------------------------------------------------------------
convertBtn.addEventListener("click", convertToPDA);
simulateBtn.addEventListener("click", startSimulation);
if (prevBtn) prevBtn.addEventListener("click", prevStep);
nextBtn.addEventListener("click", nextStep);
resetBtn.addEventListener("click", resetSimulation);

if (tabStepLogBtn) {
    tabStepLogBtn.addEventListener("click", () => switchTab("stepLog"));
}
if (tabTransitionTableBtn) {
    tabTransitionTableBtn.addEventListener("click", () => switchTab("transitionTable"));
}

// Reset simulation on input string change (keeps Transition Table unchanged)
if (inputStringInput) {
    inputStringInput.addEventListener("input", () => {
        resetSimulation();
    });
}

// When CFG definitions change, regenerate transition table & CFG display
[variablesInput, terminalsInput, productionsInput].forEach(inp => {
    if (inp) {
        inp.addEventListener("input", () => {
            if (parseGrammar()) {
                displayCFG();
                generatePDATransitionTable();
                resetSimulation();
            }
        });
    }
});

// ------------------------------------------------------------
// INITIAL DISPLAY ON PAGE LOAD
// ------------------------------------------------------------
initTheme();
parseGrammar();
displayCFG();
updateDiagram("idle");
generatePDATransitionTable();