# ReRun

A minimal VS Code extension that **remembers and re-runs your last executed command, debug session, or terminal JBang/Java run** — all with a single keystroke.

## 🚀 Features

- Automatically records your last:
  - **VS Code command** (Java, JBang, Debug, etc.)
  - **Debug session start**
  - **JBang terminal run** (`jbang ...`)
- **Ctrl+F11** → instantly repeats the last action
- **Status bar indicator** showing what’s recorded
- **Logs** all captured activity in the “ReRun” output channel
- **Persistence**: remembers your last run between sessions

## 🧠 Why
If you use `JBang`, Java, or other terminal-based workflows, this lets you:
- Run → tweak → ReRun (`Ctrl+F11`) without navigating menus
- Debug quickly after a build/run without reconfiguring

## 🖥️ Default Keybinding

| Action | Shortcut | Scope |
|---------|-----------|--------|
| ReRun last command/run/debug | **Ctrl+F11** | Editor text focus |

> ⚠️ If you use the Eclipse Keymap, `Ctrl+F11` might already be bound to *Debug*.  
> You’ll see a warning in logs — reassign `Ctrl+F11` to “Re Run” in **Keyboard Shortcuts (JSON)**.

## 🧰 Installation

Click below to open directly in VS Code Marketplace:

👉 [Install ReRun from Marketplace](https://marketplace.visualstudio.com/items?itemName=raisercostin.rerun)

or search directly inside VS Code:
`ext install raisercostin.rerun`

## 💸 Support

If you find this useful —
☕ [**Buy me a coffee**](https://buymeacoffee.com/raisercostin)

More about me https://raisercostin.org

## 🔧 License

MIT
