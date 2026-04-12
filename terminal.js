(function () {
  // filesystem tree
  var FS = {
    '~':        { url: '/',            children: ['blogs', 'photos'] },
    '~/blogs':  { url: '/blogs.html',  children: [] },
    '~/photos': { url: '/photos.html', children: [] },
  };

  // detect current path from URL
  function detectPath() {
    var p = window.location.pathname;
    for (var key in FS) {
      if (FS[key].url === p) return key;
    }
    if (p === '/index.html' || p === '') return '~';
    return '~';
  }

  var cwd = detectPath();
  var node = FS[cwd];
  var PROMPT = 'visitor@shelby ' + cwd + '$ ';

  var output = document.querySelector('.terminal-output');
  var input = document.querySelector('.terminal-input');
  var placeholder = document.querySelector('.terminal-placeholder');
  var dropdown = document.querySelector('.terminal-dropdown');
  var promptEl = document.querySelector('.terminal-prompt');

  // set the live prompt
  promptEl.innerHTML = PROMPT.replace(/ $/, '&nbsp;');

  var dropdownIndex = -1;
  var dropdownItems = [];

  // restore history from sessionStorage
  var saved = sessionStorage.getItem('terminal-history');
  if (saved) {
    output.innerHTML = saved;
  }

  function saveHistory() {
    sessionStorage.setItem('terminal-history', output.innerHTML);
  }

  function appendLine(html) {
    var div = document.createElement('div');
    div.className = 'terminal-line';
    div.innerHTML = html;
    output.appendChild(div);
    output.scrollTop = output.scrollHeight;
    saveHistory();
  }

  function appendPromptLine(cmd) {
    appendLine('<span class="prompt">' + escapeHtml(PROMPT) + '</span><span class="cmd">' + escapeHtml(cmd) + '</span>');
  }

  function appendResult(text) {
    appendLine('<span class="result">' + escapeHtml(text) + '</span>');
  }

  function appendError(text) {
    appendLine('<span class="error">' + escapeHtml(text) + '</span>');
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // resolve a path relative to cwd
  function resolvePath(target) {
    if (target === '~' || target.startsWith('~/')) return target;
    if (target === '..') {
      if (cwd === '~') return null;
      var parts = cwd.split('/');
      parts.pop();
      return parts.join('/') || '~';
    }
    return cwd === '~' ? '~/' + target : cwd + '/' + target;
  }

  // get valid cd targets for dropdown
  function getCdTargets() {
    var targets = [];
    if (cwd !== '~') targets.push('..');
    if (node && node.children) targets = targets.concat(node.children);
    return targets;
  }

  function showDropdown(options) {
    dropdown.innerHTML = '';
    dropdownItems = [];
    dropdownIndex = -1;
    options.forEach(function (opt) {
      var item = document.createElement('div');
      item.className = 'terminal-dropdown-item';
      item.textContent = opt;
      item.addEventListener('mousedown', function (e) {
        e.preventDefault();
        selectDropdownItem(opt);
      });
      dropdown.appendChild(item);
      dropdownItems.push(item);
    });
    dropdown.classList.add('open');
  }

  function hideDropdown() {
    dropdown.classList.remove('open');
    dropdown.innerHTML = '';
    dropdownItems = [];
    dropdownIndex = -1;
  }

  function highlightDropdown(index) {
    dropdownItems.forEach(function (item, i) {
      item.classList.toggle('active', i === index);
    });
  }

  function selectDropdownItem(name) {
    input.value = 'cd ' + name;
    hideDropdown();
    executeCommand(input.value.trim());
    input.value = '';
    updatePlaceholder();
  }

  function updatePlaceholder() {
    placeholder.style.display = input.value.length > 0 ? 'none' : '';
  }

  function navigateTo(path) {
    var dest = FS[path];
    if (!dest) return false;
    saveHistory();
    window.location.href = dest.url;
    return true;
  }

  function executeCommand(raw) {
    var cmd = raw.trim();
    if (!cmd) return;

    appendPromptLine(cmd);
    hideDropdown();

    if (cmd === 'help') {
      appendResult('available commands:');
      appendResult('  cd <dir>    navigate to directory');
      appendResult('  cd ..       go up one level');
      appendResult('  ls          list contents');
      appendResult('  help        show this message');
      appendResult('  clear       clear terminal');
      if (node && node.children.length > 0) {
        appendResult('');
        appendResult('directories: ' + node.children.join(', '));
      }
      return;
    }

    if (cmd === 'clear') {
      output.innerHTML = '';
      saveHistory();
      return;
    }

    if (cmd === 'ls') {
      if (node && node.children.length > 0) {
        appendResult(node.children.join('  '));
      } else {
        appendResult('');
      }
      return;
    }

    if (cmd === 'cd' || cmd === 'cd ~') {
      if (cwd === '~') return;
      navigateTo('~');
      return;
    }

    if (cmd.startsWith('cd ')) {
      var target = cmd.slice(3).trim();
      if (!target) return;

      var resolved = resolvePath(target);

      if (resolved === null) {
        appendError('already at root');
        return;
      }

      if (FS[resolved]) {
        if (resolved === cwd) return;
        navigateTo(resolved);
        return;
      }

      appendError('no such directory: ' + target);
      if (node && node.children.length > 0) {
        appendResult('try: ' + node.children.join(', '));
      } else if (cwd !== '~') {
        appendResult('try: cd ..');
      }
      return;
    }

    appendError('command not found: ' + cmd.split(' ')[0]);
    appendResult('type "help" for available commands');
  }

  function getDropdownOptions(partial) {
    // absolute path completion
    if (partial.startsWith('~/')) {
      var sub = partial.slice(2);
      return Object.keys(FS)
        .filter(function (k) { return k !== '~' && k.startsWith('~/' + sub); });
    }
    var targets = getCdTargets();
    if (partial.length === 0) return targets;
    return targets.filter(function (t) { return t.startsWith(partial); });
  }

  input.addEventListener('input', function () {
    updatePlaceholder();
    var val = input.value;
    if (val.startsWith('cd ')) {
      var partial = val.slice(3);
      var options = getDropdownOptions(partial);
      if (options.length > 0) {
        showDropdown(options);
      } else {
        hideDropdown();
      }
    } else {
      hideDropdown();
    }
  });

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (dropdownIndex >= 0 && dropdownItems.length > 0) {
        selectDropdownItem(dropdownItems[dropdownIndex].textContent);
      } else {
        executeCommand(input.value.trim());
        input.value = '';
        updatePlaceholder();
      }
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      if (dropdown.classList.contains('open') && dropdownItems.length > 0) {
        var target = dropdownIndex >= 0 ? dropdownItems[dropdownIndex].textContent : dropdownItems[0].textContent;
        input.value = 'cd ' + target;
        hideDropdown();
        updatePlaceholder();
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (dropdown.classList.contains('open') && dropdownItems.length > 0) {
        dropdownIndex = dropdownIndex <= 0 ? dropdownItems.length - 1 : dropdownIndex - 1;
        highlightDropdown(dropdownIndex);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (dropdown.classList.contains('open') && dropdownItems.length > 0) {
        dropdownIndex = dropdownIndex >= dropdownItems.length - 1 ? 0 : dropdownIndex + 1;
        highlightDropdown(dropdownIndex);
      }
      return;
    }
  });

  document.querySelector('.terminal').addEventListener('click', function () {
    input.focus();
  });

  updatePlaceholder();
})();
