/**
 * LunaOS — Calendar App
 * Monthly calendar with event management and persistent storage.
 */
'use strict';

(function (global) {
  const store = global.NovaOS.Storage.ns('calendar');

  function loadEvents() { return store.get('events', {}); }
  function saveEvents(ev) { store.set('events', ev); }

  function mount(container) {
    let events = loadEvents();
    let viewDate = new Date();
    let selectedDate = null;

    container.innerHTML = `
      <div class="calendar-app">
        <div class="calendar-header">
          <button class="btn btn-ghost btn-sm" id="cal-prev">‹</button>
          <div class="calendar-title" id="cal-title"></div>
          <button class="btn btn-ghost btn-sm" id="cal-next">›</button>
        </div>
        <div class="calendar-grid">
          <div class="calendar-weekdays">
            ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=>`<div class="calendar-weekday">${d}</div>`).join('')}
          </div>
          <div class="calendar-days" id="cal-days"></div>
        </div>
        <div class="calendar-events" id="cal-events"></div>
      </div>
    `;

    container.querySelector('#cal-prev').addEventListener('click', () => {
      viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
      render();
    });
    container.querySelector('#cal-next').addEventListener('click', () => {
      viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
      render();
    });

    function dateKey(d) {
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }

    function render() {
      const titleEl = container.querySelector('#cal-title');
      const daysEl  = container.querySelector('#cal-days');
      const evEl    = container.querySelector('#cal-events');
      const today   = new Date();

      titleEl.textContent = viewDate.toLocaleDateString('en', { month: 'long', year: 'numeric' });

      const year  = viewDate.getFullYear();
      const month = viewDate.getMonth();
      const first = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      daysEl.innerHTML = '';

      // Padding days
      for (let i = 0; i < first; i++) {
        const prev = new Date(year, month, -(first - i - 1));
        addDayCell(daysEl, prev, 'other-month');
      }
      // This month
      for (let d = 1; d <= daysInMonth; d++) {
        const dt = new Date(year, month, d);
        const cls = (dt.toDateString() === today.toDateString() ? 'today' : '') +
                    (selectedDate && dt.toDateString() === selectedDate.toDateString() ? ' selected' : '') +
                    (events[dateKey(dt)]?.length ? ' has-event' : '');
        addDayCell(daysEl, dt, cls);
      }
      // Trailing days
      const total = first + daysInMonth;
      const trailing = total % 7 === 0 ? 0 : 7 - (total % 7);
      for (let i = 1; i <= trailing; i++) {
        addDayCell(daysEl, new Date(year, month + 1, i), 'other-month');
      }

      renderEvents(evEl);
    }

    function addDayCell(parent, dt, cls) {
      const el = document.createElement('div');
      el.className = 'cal-day ' + cls;
      el.textContent = dt.getDate();
      el.addEventListener('click', () => {
        selectedDate = dt;
        render();
      });
      el.addEventListener('dblclick', () => {
        selectedDate = dt;
        addEvent(dt);
      });
      parent.appendChild(el);
    }

    function renderEvents(evEl) {
      evEl.innerHTML = '';
      if (!selectedDate) {
        evEl.innerHTML = '<div style="font-size:12px;color:var(--luna-text-3);padding:8px 0">Select a day to view events. Double-click to add one.</div>';
        return;
      }
      const key = dateKey(selectedDate);
      const dayEvs = events[key] || [];
      const header = document.createElement('div');
      header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:8px';
      header.innerHTML = `<div style="font-size:12px;font-weight:600;color:var(--luna-text-2)">${selectedDate.toLocaleDateString('en',{weekday:'long',month:'long',day:'numeric'})}</div>`;
      const addBtn = document.createElement('button');
      addBtn.className = 'btn btn-primary btn-sm';
      addBtn.textContent = '+ Event';
      addBtn.addEventListener('click', () => addEvent(selectedDate));
      header.appendChild(addBtn);
      evEl.appendChild(header);

      if (!dayEvs.length) {
        evEl.innerHTML += '<div style="font-size:12px;color:var(--luna-text-3)">No events. Double-click calendar or click + Event.</div>';
        return;
      }
      dayEvs.forEach((ev, i) => {
        const el = document.createElement('div');
        el.className = 'cal-event-item';
        el.innerHTML = `<div class="cal-event-dot"></div><div style="flex:1">${_esc(ev)}</div>`;
        const delBtn = document.createElement('button');
        delBtn.className = 'btn btn-ghost btn-sm';
        delBtn.textContent = '×';
        delBtn.addEventListener('click', () => {
          events[key].splice(i, 1);
          saveEvents(events);
          render();
        });
        el.appendChild(delBtn);
        evEl.appendChild(el);
      });
    }

    function addEvent(dt) {
      const name = prompt('Event name:', '');
      if (!name?.trim()) return;
      const key = dateKey(dt);
      if (!events[key]) events[key] = [];
      events[key].push(name.trim());
      saveEvents(events);
      render();
    }

    render();
  }

  function _esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  global.NovaOS.AppLoader.register({
    id: 'calendar', title: 'Calendar', width: 420, height: 540,
    mount
  });
})(window);
