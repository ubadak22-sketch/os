/**
 * LunaOS EventBus — Global publish/subscribe event system.
 * Decouples modules from each other.
 */
'use strict';

(function (global) {
  const _listeners = new Map();

  const EventBus = {
    /**
     * Subscribe to an event.
     * @param {string} event
     * @param {Function} handler
     * @returns {Function} unsubscribe function
     */
    on(event, handler) {
      if (!_listeners.has(event)) _listeners.set(event, new Set());
      _listeners.get(event).add(handler);
      return () => this.off(event, handler);
    },

    /** Unsubscribe a specific handler */
    off(event, handler) {
      _listeners.get(event)?.delete(handler);
    },

    /** Emit an event with optional payload */
    emit(event, payload) {
      _listeners.get(event)?.forEach(fn => {
        try { fn(payload); }
        catch (err) { console.error(`[EventBus] Error in handler for "${event}":`, err); }
      });
    },

    /** Subscribe once, then auto-remove */
    once(event, handler) {
      const wrapper = (payload) => {
        handler(payload);
        this.off(event, wrapper);
      };
      this.on(event, wrapper);
    },

    /** Remove all listeners for an event */
    clear(event) {
      if (event) _listeners.delete(event);
      else _listeners.clear();
    }
  };

  global.NovaOS = global.NovaOS || {};
  global.NovaOS.EventBus = EventBus;
})(window);
