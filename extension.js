const vscode = require("vscode");

/**
 * What we store:
 * last = {
 *   kind: "command" | "terminal",
 *   id?: string,           // for kind=command
 *   args?: any[],          // for kind=command
 *   line?: string,         // for kind=terminal
 *   source: string,        // "executeCommand|debug|terminal"
 *   when: string           // ISO timestamp
 * }
 */
let last = null;

function activate(context) {
  const log = vscode.window.createOutputChannel("ReRun");
  const now = () => new Date().toISOString();

  log.appendLine(`[rerun] activated at ${now()}`);

  // restore persisted state
  try {
    last = context.globalState.get("rerun.last", null);
    if (last) log.appendLine(`[restore] last=${JSON.stringify(last)}`);
  } catch (e) {
    log.appendLine(`[restore] error: ${e}`);
  }

  function save(state) {
    last = state;
    context.globalState.update("rerun.last", last);
    log.appendLine(`[save] ${JSON.stringify(last)}`);
  }

  // ---------- 1) Patch executeCommand (captures Java/JBang/debug commands if they use commands) ----------
  const origExec = vscode.commands.executeCommand;
  vscode.commands.executeCommand = async function (id, ...args) {
    try {
      // record only relevant flavors (adjust list easily)
      if (
        typeof id === "string" &&
        (
          id.startsWith("jbang.") ||
          id.startsWith("java.") ||
          id.startsWith("workbench.action.debug.") ||
          id.startsWith("debug.") // some debuggers use debug.* commands
        )
      ) {
        save({ kind: "command", id, args, source: "executeCommand", when: now() });
      }
    } catch (e) {
      log.appendLine(`[exec-hook] record error: ${e}`);
    }
    return origExec.call(this, id, ...args);
  };
  log.appendLine("[exec-hook] installed");

  // ---------- 2) Capture debug session starts (covers Java debug that bypasses commands) ----------
  try {
    const dbgStart = vscode.debug.onDidStartDebugSession((s) => {
      try {
        const meta = {
          type: s.type,
          name: s.name,
          workspaceFolder: s.workspaceFolder?.name || null,
        };
        // record a generic debug re-run action; most debuggers will start from “start” again
        save({ kind: "command", id: "workbench.action.debug.start", args: [], source: "debug", when: now(), meta });
        log.appendLine(`[debug] onDidStartDebugSession: ${JSON.stringify(meta)}`);
      } catch (e) {
        log.appendLine(`[debug] start error: ${e}`);
      }
    });
    context.subscriptions.push(dbgStart);
    log.appendLine("[debug] start listener attached");
  } catch (e) {
    log.appendLine(`[debug] attach failed: ${e}`);
  }

  // ---------- 3) Replay ----------
  const replayCmd = vscode.commands.registerCommand("rerun.run", async () => {
    log.appendLine("[replay] invoked");
    if (!last) {
      vscode.window.showWarningMessage("Rerun: nothing recorded yet.");
      log.appendLine("[replay] nothing recorded");
      return;
    }

    try {
      if (last.kind === "command") {
        log.appendLine(`[replay] command: ${last.id} args=${JSON.stringify(last.args || [])}`);
        await vscode.commands.executeCommand(last.id, ...(last.args || []));
        vscode.window.showInformationMessage(`Rerun: ${last.id}`);
      } else if (last.kind === "terminal") {
        const term = vscode.window.activeTerminal || vscode.window.createTerminal("Rerun");
        term.show(true);
        term.sendText(last.line, true);
        log.appendLine(`[replay] terminal: ${last.line}`);
        vscode.window.showInformationMessage(`Rerun: ${last.line}`);
      } else {
        log.appendLine(`[replay] unknown kind: ${last.kind}`);
        vscode.window.showWarningMessage("Rerun: unknown last kind.");
      }
    } catch (e) {
      log.appendLine(`[replay] error: ${e}`);
      vscode.window.showErrorMessage(`Rerun failed: ${e}`);
    }
  });
  context.subscriptions.push(replayCmd);

  // ---------- 4) Status bar for visibility ----------
  const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1000);
  function updateStatus() {
    if (!last) {
      status.text = "⏯ Rerun: <none>";
      status.tooltip = "No last run/debug/terminal command recorded yet";
    } else if (last.kind === "command") {
      status.text = `⏯ ${last.id}`;
      status.tooltip = `Rerun command\nArgs: ${JSON.stringify(last.args || [])}\nWhen: ${last.when}\nSource: ${last.source}`;
    } else {
      status.text = `⏯ ${last.line}`;
      status.tooltip = `Rerun terminal\nWhen: ${last.when}\nSource: ${last.source}`;
    }
  }
  updateStatus();
  status.command = "rerun.run";
  status.show();
  context.subscriptions.push(status);

  // refresh status on every save
  const saveHook = context.subscriptions.push({
    dispose() { },
  });
  const _save = save;
  save = (s) => {
    _save(s);
    updateStatus();
  };
  // ---------- 5) Detect keybinding conflicts ----------
  try {
    vscode.commands.getCommands(true).then((all) => {
      const hasDebug = all.includes("workbench.action.debug.run") || all.includes("workbench.action.debug.start");
      if (hasDebug) {
        log.appendLine("[conflict] Ctrl+F11 is likely bound to Debug (Eclipse keymap).");
        vscode.window.showWarningMessage("ReRun: Ctrl+F11 is used by Debug. Reassign it to ReRun in Keyboard Shortcuts.");
      } else {
        log.appendLine("[conflict] No Ctrl+F11 conflict detected.");
      }
    });
  } catch (e) {
    log.appendLine(`[conflict] check failed: ${e}`);
  }

  log.appendLine("[rerun] ready");
}

function deactivate() { }

module.exports = { activate, deactivate };
