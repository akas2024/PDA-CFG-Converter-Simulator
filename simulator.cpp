#include <iostream>
#include <string>
#include <vector>
#include <queue>
#include <set>

using namespace std;

struct Production {
    char lhs;
    string rhs;
};

struct Configuration {
    int inputPos;
    string stack;
    vector<Configuration> history;
};

bool isVariable(char c, const vector<Production>& grammar) {
    for (const auto& p : grammar) {
        if (p.lhs == c)
            return true;
    }
    return false;
}

string remainingInput(const string& input, int pos) {
    if (pos >= input.length())
        return "ε";

    return input.substr(pos);
}

void showConfiguration(
    int step,
    const Configuration& config,
    const string& input
) {
    cout << "\n";
    cout << "========================================\n";
    cout << "              STEP " << step << "\n";
    cout << "========================================\n";

    cout << "Current State   : q1\n";
    cout << "Remaining Input : "
         << remainingInput(input, config.inputPos)
         << "\n";

    cout << "Stack           : ";

    if (config.stack.empty())
        cout << "ε";
    else
        cout << config.stack;

    cout << "\n";

    cout << "========================================\n";
}

bool simulate(
    const vector<Production>& grammar,
    const string& input
) {
    if (grammar.empty()) {
        cout << "Grammar is empty.\n";
        return false;
    }

    Configuration start;

    start.inputPos = 0;

    // Start stack with start variable
    start.stack = "";

    start.stack += grammar[0].lhs;

    queue<Configuration> q;

    q.push(start);

    set<string> visited;

    visited.insert(
        to_string(start.inputPos) + "|" + start.stack
    );

    int step = 1;

    while (!q.empty()) {

        Configuration current = q.front();
        q.pop();

        showConfiguration(step, current, input);

        cout << "\nPress ENTER for next step...";

        cin.get();

        // ------------------------------------
        // ACCEPT
        // ------------------------------------

        if (
            current.inputPos == input.length()
            &&
            current.stack.empty()
        ) {

            cout << "\n";
            cout << "========================================\n";
            cout << "          ACCEPTED ✓\n";
            cout << "========================================\n";

            return true;
        }

        // ------------------------------------
        // STACK EMPTY BUT INPUT REMAINS
        // ------------------------------------

        if (current.stack.empty()) {

            cout << "\nNo valid transition.\n";
            continue;
        }

        char top = current.stack.back();

        // ------------------------------------
        // VARIABLE ON STACK
        // ------------------------------------

        if (isVariable(top, grammar)) {

            for (const auto& production : grammar) {

                if (production.lhs != top)
                    continue;

                Configuration next = current;

                // Remove variable
                next.stack.pop_back();

                // Push RHS in reverse
                for (
                    int i = production.rhs.length() - 1;
                    i >= 0;
                    i--
                ) {
                    next.stack += production.rhs[i];
                }

                string key =
                    to_string(next.inputPos)
                    + "|"
                    + next.stack;

                if (visited.find(key) == visited.end()) {

                    visited.insert(key);

                    next.history.push_back(current);

                    q.push(next);
                }
            }
        }

        // ------------------------------------
        // TERMINAL ON STACK
        // ------------------------------------

        else {

            if (
                current.inputPos < input.length()
                &&
                input[current.inputPos] == top
            ) {

                Configuration next = current;

                // Consume input
                next.inputPos++;

                // Pop stack
                next.stack.pop_back();

                string key =
                    to_string(next.inputPos)
                    + "|"
                    + next.stack;

                if (visited.find(key) == visited.end()) {

                    visited.insert(key);

                    next.history.push_back(current);

                    q.push(next);
                }
            }
        }

        step++;

        // Safety limit
        if (step > 1000) {

            cout << "\nSimulation stopped.\n";
            cout << "Too many configurations.\n";

            return false;
        }
    }

    cout << "\n";
    cout << "========================================\n";
    cout << "          REJECTED ✗\n";
    cout << "========================================\n";

    return false;
}

int main() {

    cout << "==============================================\n";
    cout << "       PDA - CFG SIMULATOR\n";
    cout << "==============================================\n";

    int n;

    cout << "\nEnter number of productions: ";
    cin >> n;

    vector<Production> grammar;

    cout << "\nEnter productions.\n";
    cout << "Example: S->aSb\n";
    cout << "Use e for epsilon.\n\n";

    for (int i = 0; i < n; i++) {

        string production;

        cout << "Production "
             << i + 1
             << ": ";

        cin >> production;

        char lhs = production[0];

        size_t arrow =
            production.find("->");

        if (arrow == string::npos) {

            cout << "Invalid production!\n";
            return 0;
        }

        string rhs =
            production.substr(arrow + 2);

        if (rhs == "e")
            rhs = "";

        grammar.push_back({
            lhs,
            rhs
        });
    }

    string input;

    cout << "\nEnter input string: ";
    cin >> input;

    if (input == "e")
        input = "";

    cout << "\n\n";
    cout << "==============================================\n";
    cout << "           STARTING PDA SIMULATION\n";
    cout << "==============================================\n";

    cout << "\nGrammar:\n";

    for (const auto& p : grammar) {

        cout << p.lhs
             << " -> ";

        if (p.rhs.empty())
            cout << "ε";
        else
            cout << p.rhs;

        cout << "\n";
    }

    cout << "\nInput: ";

    if (input.empty())
        cout << "ε";
    else
        cout << input;

    cout << "\n";

    cout << "\nPress ENTER to start...";
    cin.ignore();
    cin.get();

    simulate(grammar, input);

    cout << "\n\nProgram finished.\n";

    return 0;
}