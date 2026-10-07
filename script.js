// ============================================================
// PDA - CFG CONVERTER & SIMULATOR (HACKERRANK THEME EDITION)
// ============================================================

// ------------------------------------------------------------
// GLOBAL STATE
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
// DOM ELEMENTS
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
    const stateName = (action === "ACCEPT") ? "q2" : "q1";

    row.innerHTML = `
        <td class="col-step"><span class="step-num-badge">#${currentStep}</span></td>
        <td class="col-state"><span class="state-badge">${stateName}</span></td>
        <td class="col-input">${getRemainingInput(config.inputPos)}</td>
        <td class="col-stack">${config.stack || "ε"}</td>
        <td class="col-action"><span class="action-pill">${action}</span></td>
    `;

    simulationTable.appendChild(row);

    // Highlight current row
    document
        .querySelectorAll("#simulationTable tr")
        .forEach(r => r.classList.remove("active-row"));

    row.classList.add("active-row");

    // Strictly ensure steps DO NOT exit the box: auto-scroll inside container
    const wrapper = document.querySelector(".table-container-wrapper");
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

    if (currentState) currentState.textContent = "q1";
    if (inputPosition) inputPosition.textContent = config.inputPos;

    renderRemainingInput(config.inputPos);
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
// CONVERT CFG TO PDA
// ------------------------------------------------------------
function convertToPDA() {
    if (!parseGrammar()) return;

    displayCFG();
    updateDiagram("idle");

    if (currentTransition) {
        currentTransition.textContent = `CFG converted! Start rule: q₀ → q₁, Push '${grammar[0].lhs}'`;
    }

    alert("CFG successfully converted to PDA!\nClick 'Start Simulation' to run step-by-step.");
}

// ------------------------------------------------------------
// START SIMULATION
// ------------------------------------------------------------
function startSimulation() {
    if (!parseGrammar()) return;

    inputString = inputStringInput.value.trim();

    if (inputString === "e" || inputString === "ε") {
        inputString = "";
    }

    displayCFG();

    // Reset simulation variables
    simulationQueue = [];
    visited = new Set();
    simulationHistory = [];
    currentStep = 0;
    simulationStarted = true;
    simulationFinished = false;

    if (prevBtn) prevBtn.disabled = true;

    simulationTable.innerHTML = "";
    if (totalStepsRecorded) totalStepsRecorded.textContent = "0 Recorded";
    hideResult();

    const initial = createInitialConfiguration();

    simulationQueue.push(initial);
    visited.add(configurationKey(initial));

    nextBtn.disabled = false;

    // Show initial state (Step 1)
    currentStep = 1;
    showConfiguration(initial);
    addSimulationRow(initial, "Start (Push " + initial.stack + ")");

    updateDiagram("start", { top: initial.stack });
    recordStepSnapshot(initial, "Start (Push " + initial.stack + ")", "start", { top: initial.stack }, null);
}

// ------------------------------------------------------------
// NEXT SIMULATION STEP
// ------------------------------------------------------------
function nextStep() {
    if (!simulationStarted) return;
    if (simulationFinished) return;

    if (simulationQueue.length === 0) {
        simulationFinished = true;
        showResult(false);
        nextBtn.disabled = true;
        recordStepSnapshot(
            { inputPos: inputPosition ? parseInt(inputPosition.textContent, 10) || 0 : 0, stack: "" },
            "REJECT",
            "reject",
            {},
            false
        );
        return;
    }

    const current = simulationQueue.shift();

    // --------------------------------------------------------
    // ACCEPT CHECK: Input consumed & Stack empty
    // --------------------------------------------------------
    if (current.inputPos === inputString.length && current.stack.length === 0) {
        currentStep++;
        showConfiguration(current);
        addSimulationRow(current, "ACCEPT");
        showResult(true);

        simulationFinished = true;
        nextBtn.disabled = true;
        recordStepSnapshot(current, "ACCEPT", "accept", {}, true);
        return;
    }

    // --------------------------------------------------------
    // EMPTY STACK BUT INPUT STILL REMAINS -> CANNOT MATCH
    // --------------------------------------------------------
    if (current.stack.length === 0) {
        processNextConfiguration();
        return;
    }

    const top = current.stack[current.stack.length - 1];

    // --------------------------------------------------------
    // VARIABLE EXPANSION
    // --------------------------------------------------------
    if (isVariable(top)) {
        let generated = false;
        let primaryChild = null;

        for (const production of grammar) {
            if (production.lhs !== top) continue;

            let newStack = current.stack.substring(0, current.stack.length - 1);

            // Push RHS in reverse order
            for (let i = production.rhs.length - 1; i >= 0; i--) {
                newStack += production.rhs[i];
            }

            const next = {
                inputPos: current.inputPos,
                stack: newStack,
                action: `Expand ${top} → ${production.rhs || "ε"}`,
                rule: {
                    type: "expand",
                    variable: top,
                    rhs: production.rhs
                }
            };

            const key = configurationKey(next);

            if (!visited.has(key)) {
                visited.add(key);
                simulationQueue.push(next);
                generated = true;
                if (!primaryChild) {
                    primaryChild = next;
                }
            }
        }

        if (generated && primaryChild) {
            currentStep++;
            showConfiguration(primaryChild);
            addSimulationRow(primaryChild, primaryChild.action);
            updateDiagram("expand", primaryChild.rule);
            recordStepSnapshot(primaryChild, primaryChild.action, "expand", primaryChild.rule, null);
        } else {
            processNextConfiguration();
        }

        return;
    }

    // --------------------------------------------------------
    // TERMINAL MATCHING
    // --------------------------------------------------------
    if (
        current.inputPos < inputString.length &&
        inputString[current.inputPos] === top
    ) {
        const newStack = current.stack.substring(0, current.stack.length - 1);

        const next = {
            inputPos: current.inputPos + 1,
            stack: newStack,
            action: `Match '${top}' (Pop)`,
            rule: {
                type: "match",
                symbol: top
            }
        };

        const key = configurationKey(next);

        if (!visited.has(key)) {
            visited.add(key);
            simulationQueue.push(next);

            currentStep++;
            showConfiguration(next);
            addSimulationRow(next, next.action);
            updateDiagram("match", next.rule);
            recordStepSnapshot(next, next.action, "match", next.rule, null);
        } else {
            processNextConfiguration();
        }

        return;
    }

    // --------------------------------------------------------
    // NO DIRECT TRANSITION
    // --------------------------------------------------------
    updateDiagram("reject", { top: top });
    processNextConfiguration();
}

// ------------------------------------------------------------
// PROCESS NEXT CONFIGURATION (BRANCH SEARCH)
// ------------------------------------------------------------
function processNextConfiguration() {
    if (simulationQueue.length === 0) {
        simulationFinished = true;
        showResult(false);
        nextBtn.disabled = true;
        recordStepSnapshot(
            { inputPos: inputPosition ? parseInt(inputPosition.textContent, 10) || 0 : 0, stack: "" },
            "REJECT",
            "reject",
            {},
            false
        );
        return;
    }

    const next = simulationQueue[0];

    currentStep++;
    showConfiguration(next);
    addSimulationRow(next, next.action || "Try next branch");
    if (next.rule) {
        updateDiagram(next.rule.type, next.rule);
    }
    recordStepSnapshot(
        next,
        next.action || "Try next branch",
        next.rule ? next.rule.type : "idle",
        next.rule || {},
        null
    );
}

// ------------------------------------------------------------
// PREVIOUS SIMULATION STEP (BACKWARD NAVIGATION)
// ------------------------------------------------------------
function prevStep() {
    if (!simulationStarted) return;
    if (simulationHistory.length <= 1) return;

    // Pop the current step snapshot
    simulationHistory.pop();

    // The new top is the previous step state
    const targetState = simulationHistory[simulationHistory.length - 1];
    if (!targetState) return;

    // Restore step state
    currentStep = targetState.stepNumber;
    updateStepCounters(currentStep);

    // Restore queue and visited set
    simulationQueue = targetState.simulationQueue.map(item => ({ ...item }));
    visited = new Set(targetState.visited);
    simulationFinished = !!targetState.simulationFinished;
    nextBtn.disabled = targetState.simulationFinished;

    // Restore configuration (dashboard, stack, tape)
    showConfiguration(targetState.config);

    // Restore state badge text
    if (currentState) {
        currentState.textContent = targetState.currentState || "q1";
    }

    // Restore diagram
    if (targetState.diagramPhase) {
        updateDiagram(targetState.diagramPhase, targetState.diagramDetails);
    }

    // Restore result banner
    if (targetState.isAccepted === true) {
        showResult(true);
        simulationFinished = true;
        nextBtn.disabled = true;
    } else if (targetState.isAccepted === false) {
        showResult(false);
        simulationFinished = true;
        nextBtn.disabled = true;
    } else {
        hideResult();
    }

    // Restore transition pill and text if available
    if (currentTransition && targetState.currentTransitionText) {
        currentTransition.textContent = targetState.currentTransitionText;
    }
    if (livePill && targetState.livePillClass) {
        livePill.className = targetState.livePillClass;
        livePill.textContent = targetState.livePillText;
    }

    // Remove the last table row from simulationTable
    if (simulationTable && simulationTable.lastElementChild) {
        simulationTable.removeChild(simulationTable.lastElementChild);

        // Highlight new last row
        document
            .querySelectorAll("#simulationTable tr")
            .forEach(r => r.classList.remove("active-row"));

        if (simulationTable.lastElementChild) {
            simulationTable.lastElementChild.classList.add("active-row");
        }

        // Auto-scroll inside wrapper
        const wrapper = document.querySelector(".table-container-wrapper");
        if (wrapper) {
            wrapper.scrollTop = wrapper.scrollHeight;
        }

        if (totalStepsRecorded) {
            totalStepsRecorded.textContent = `${simulationTable.children.length} Recorded`;
        }
    }

    // Update prevBtn disabled state
    if (prevBtn) {
        prevBtn.disabled = (simulationHistory.length <= 1);
    }
}

// ------------------------------------------------------------
// RESET
// ------------------------------------------------------------
function resetSimulation() {
    simulationQueue = [];
    visited = new Set();
    simulationHistory = [];
    currentStep = 0;
    simulationStarted = false;
    simulationFinished = false;

    if (prevBtn) prevBtn.disabled = true;

    updateStepCounters(0);

    if (currentState) currentState.textContent = "q1";
    if (inputPosition) inputPosition.textContent = "0";

    const defaultStr = inputStringInput.value || "aabb";
    if (remainingInput) {
        remainingInput.textContent = (defaultStr === "e" || defaultStr === "ε") ? "ε" : defaultStr;
    }

    if (stackVisual) {
        const topSymbol = (grammar.length > 0) ? grammar[0].lhs : "S";
        stackVisual.innerHTML = `<div class="stack-cell top-cell">${topSymbol}</div>`;
    }

    if (simulationTable) simulationTable.innerHTML = "";
    if (totalStepsRecorded) totalStepsRecorded.textContent = "0 Recorded";

    hideResult();
    nextBtn.disabled = true;

    updateDiagram("idle");
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

// ------------------------------------------------------------
// INITIAL DISPLAY ON PAGE LOAD
// ------------------------------------------------------------
initTheme();
parseGrammar();
displayCFG();
updateDiagram("idle");