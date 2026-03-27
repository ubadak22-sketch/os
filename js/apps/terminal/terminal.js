/**
 * LunaOS — Terminal App
 * Browser-based shell with filesystem and system commands.
 */
'use strict';

(function (global) {
  const store = global.NovaOS.Storage.ns('terminal');
  const fsStore = global.NovaOS.Storage.ns('files');

  function mount(container, { windowId }) {
    let history = [];
    let histIdx = -1;
    let cwd = '/home';

    container.innerHTML = `
      <div class="terminal-app">
        <div class="terminal-output" id="term-out-${windowId}"></div>
        <div class="terminal-input-row">
          <span class="terminal-prompt" id="term-prompt-${windowId}">luna@os:${cwd}$</span>
          <input class="terminal-input" id="term-in-${windowId}" autocomplete="off" spellcheck="false" />
        </div>
      </div>
    `;

    const outEl    = container.querySelector(`#term-out-${windowId}`);
    const inputEl  = container.querySelector(`#term-in-${windowId}`);
    const promptEl = container.querySelector(`#term-prompt-${windowId}`);

    function print(text, cls = '') {
      const line = document.createElement('div');
      line.className = 'terminal-line' + (cls ? ' ' + cls : '');
      line.textContent = text;
      outEl.appendChild(line);
      outEl.scrollTop = outEl.scrollHeight;
    }

    function printHTML(html) {
      const line = document.createElement('div');
      line.className = 'terminal-line';
      line.innerHTML = html;
      outEl.appendChild(line);
      outEl.scrollTop = outEl.scrollHeight;
    }

    function updatePrompt() {
      promptEl.textContent = `luna@os:${cwd}$`;
    }

    function getFS() { return fsStore.get('tree', { '/': {}, '/home': {}, '/docs': {} }); }
    function saveFS(fs) { fsStore.set('tree', fs); }

    // Command registry
    const COMMANDS = {
      help() {
        print('Available commands:', 'info');
        [
          'help         — show this message',
          'clear        — clear terminal',
          'echo [text]  — print text',
          'date         — current date/time',
          'ls           — list directory',
          'cd [path]    — change directory',
          'mkdir [name] — create directory',
          'touch [name] — create file',
          'cat [file]   — print file contents',
          'write [file] [content] — write to file',
          'rm [name]    — remove file or dir',
          'pwd          — print working directory',
          'whoami       — current user',
          'uname        — system info',
          'uptime       — system uptime',
          'ps           — running processes',
          'kill [pid]   — kill process',
          'history      — command history',
          'open [app]   — open an app',
          'calc [expr]  — evaluate expression',
        ].forEach(l => print('  ' + l));
      },

      clear() { outEl.innerHTML = ''; },

      echo(args) { print(args.join(' ')); },

      date() { print(new Date().toString()); },

      pwd() { print(cwd); },

      whoami() { print('luna'); },

      uname() { print('LunaOS 1.0.0 — Browser kernel, ' + navigator.userAgent.split(' ').slice(-1)[0]); },

      uptime() {
        const s = Math.floor(performance.now() / 1000);
        print(`up ${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m ${s%60}s`);
      },

      ls(args) {
        const fs = getFS();
        const path = args[0] ? _resolvePath(args[0]) : cwd;
        const dir = fs[path];
        if (dir === undefined) { print(`ls: ${path}: No such directory`, 'err'); return; }
        const entries = Object.keys(dir);
        if (!entries.length) { print('(empty)'); return; }
        entries.forEach(name => {
          const isDir = typeof dir[name] === 'object';
          print((isDir ? '📁 ' : '📄 ') + name);
        });
      },

      cd(args) {
        const target = args[0] || '/home';
        const path = _resolvePath(target);
        const fs = getFS();
        if (path === '/' || fs[path] !== undefined) {
          cwd = path;
          updatePrompt();
        } else {
          print(`cd: ${target}: No such directory`, 'err');
        }
      },

      mkdir(args) {
        if (!args[0]) { print('mkdir: missing operand', 'err'); return; }
        const fs = getFS();
        const path = _resolvePath(args[0]);
        if (fs[path] !== undefined) { print(`mkdir: ${args[0]}: Already exists`, 'err'); return; }
        const parent = path.split('/').slice(0,-1).join('/') || '/';
        if (!fs[parent]) { print(`mkdir: ${parent}: No such directory`, 'err'); return; }
        fs[parent][args[0].split('/').pop()] = {};
        fs[path] = {};
        saveFS(fs);
        print(`Created directory ${path}`, 'success');
      },

      touch(args) {
        if (!args[0]) { print('touch: missing operand', 'err'); return; }
        const fs = getFS();
        const name = args[0];
        const dir = fs[cwd];
        if (!dir) { print(`touch: no such directory: ${cwd}`, 'err'); return; }
        dir[name] = '';
        saveFS(fs);
        print(`Created ${name}`, 'success');
      },

      cat(args) {
        if (!args[0]) { print('cat: missing operand', 'err'); return; }
        const fs = getFS();
        const content = fs[cwd]?.[args[0]];
        if (content === undefined) { print(`cat: ${args[0]}: No such file`, 'err'); return; }
        if (typeof content === 'object') { print(`cat: ${args[0]}: Is a directory`, 'err'); return; }
        print(content || '(empty file)');
      },

      write(args) {
        if (args.length < 2) { print('write: usage: write <file> <content>', 'err'); return; }
        const fs = getFS();
        const name = args[0];
        const content = args.slice(1).join(' ');
        if (!fs[cwd]) { print(`write: no such directory: ${cwd}`, 'err'); return; }
        fs[cwd][name] = content;
        saveFS(fs);
        print(`Written to ${name}`, 'success');
      },

      rm(args) {
        if (!args[0]) { print('rm: missing operand', 'err'); return; }
        const fs = getFS();
        const dir = fs[cwd];
        if (!dir || dir[args[0]] === undefined) { print(`rm: ${args[0]}: No such file`, 'err'); return; }
        delete dir[args[0]];
        const full = _resolvePath(args[0]);
        delete fs[full];
        saveFS(fs);
        print(`Removed ${args[0]}`, 'success');
      },

      ps() {
        const procs = global.NovaOS.ProcessManager.list();
        if (!procs.length) { print('No processes running.'); return; }
        print('PID    APP');
        procs.forEach(p => print(`${String(p.pid).padEnd(6)} ${p.appId}`));
      },

      kill(args) {
        const pid = parseInt(args[0]);
        if (isNaN(pid)) { print('kill: invalid pid', 'err'); return; }
        const proc = global.NovaOS.ProcessManager.get(pid);
        if (!proc) { print(`kill: pid ${pid}: not found`, 'err'); return; }
        global.NovaOS.ProcessManager.kill(pid);
        const win = global.NovaOS.WindowManager.getByApp(proc.appId);
        if (win) global.NovaOS.WindowManager.close(win.windowId);
        print(`Killed process ${pid} (${proc.appId})`, 'success');
      },

      history() {
        history.forEach((cmd, i) => print(`  ${i + 1}  ${cmd}`));
      },

      open(args) {
        const app = args[0];
        if (!app) { print('open: specify an app name', 'err'); return; }
        global.NovaOS.AppLoader.launch(app);
        print(`Launching ${app}...`, 'success');
      },

      calc(args) {
        const expr = args.join(' ');
        try {
          // Safe eval with no global access
          const result = Function('"use strict"; return (' + expr + ')')();
          print(`= ${result}`);
        } catch (e) {
          print('calc: invalid expression', 'err');
        }
      }
    };

    function _resolvePath(path) {
      if (path.startsWith('/')) return path.replace(/\/+$/, '') || '/';
      const parts = [...cwd.split('/').filter(Boolean), ...path.split('/').filter(Boolean)];
      const resolved = [];
      for (const p of parts) {
        if (p === '..') resolved.pop();
        else if (p !== '.') resolved.push(p);
      }
      return '/' + resolved.join('/');
    }

    function runCommand(raw) {
      const trimmed = raw.trim();
      if (!trimmed) return;

      history.unshift(trimmed);
      histIdx = -1;

      print(`$ ${trimmed}`, 'cmd');

      const [cmd, ...args] = trimmed.split(/\s+/);

      if (COMMANDS[cmd]) {
        try { COMMANDS[cmd](args); }
        catch (e) { print(`Error: ${e.message}`, 'err'); }
      } else {
        print(`${cmd}: command not found. Type 'help' for list.`, 'err');
      }
    }

    // Wire input
    inputEl.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const val = inputEl.value;
        inputEl.value = '';
        runCommand(val);
      } else if (e.key === 'ArrowUp') {
        if (histIdx < history.length - 1) histIdx++;
        inputEl.value = history[histIdx] || '';
        e.preventDefault();
      } else if (e.key === 'ArrowDown') {
        if (histIdx > 0) histIdx--;
        else histIdx = -1;
        inputEl.value = histIdx >= 0 ? history[histIdx] : '';
        e.preventDefault();
      }
    });

    // Welcome
    print('LunaOS Terminal v1.0', 'info');
    print('Type "help" for available commands.', 'info');
    print('');
    inputEl.focus();
  }

  global.NovaOS.AppLoader.register({
    id: 'terminal', title: 'Terminal', width: 600, height: 420,
    mount
  });
})(window);
