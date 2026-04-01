/**
 * Nova OS Storage — Centralized localStorage wrapper.
 * All keys prefixed with "nova_" for isolation.
 * Provides set/get/remove with JSON encoding + namespaced sub-stores.
 */
'use strict';

(function (global) {
  const PREFIX = 'nova_';

  const Storage = {
    /** Read and JSON-parse a stored value. Returns defaultValue if missing/corrupt. */
    get(key, defaultValue = null) {
      try {
        const raw = localStorage.getItem(PREFIX + key);
        if (raw === null) return defaultValue;
        return JSON.parse(raw);
      } catch (err) {
        console.warn(`[Storage] get("${key}") failed:`, err);
        return defaultValue;
      }
    },

    /** JSON-serialize and store a value. Returns true on success. */
    set(key, value) {
      try {
        localStorage.setItem(PREFIX + key, JSON.stringify(value));
        return true;
      } catch (err) {
        console.error(`[Storage] set("${key}") failed:`, err);
        return false;
      }
    },

    /** Remove a stored key. */
    remove(key) {
      try {
        localStorage.removeItem(PREFIX + key);
        return true;
      } catch (err) {
        console.warn(`[Storage] remove("${key}") failed:`, err);
        return false;
      }
    },

    /** Check if a key exists. */
    has(key) {
      try { return localStorage.getItem(PREFIX + key) !== null; }
      catch { return false; }
    },

    /** List all Nova OS storage keys (without prefix). */
    keys() {
      try {
        return Object.keys(localStorage)
          .filter(k => k.startsWith(PREFIX))
          .map(k => k.slice(PREFIX.length));
      } catch { return []; }
    },

    /**
     * Get a namespaced sub-store.
     * All operations are scoped to "namespace." prefix.
     * @param {string} namespace
     */
    ns(namespace) {
      const pfx = namespace + '.';
      return {
        get:    (k, def) => Storage.get(pfx + k, def),
        set:    (k, v)   => Storage.set(pfx + k, v),
        remove: (k)      => Storage.remove(pfx + k),
        has:    (k)      => Storage.has(pfx + k),
        keys:   ()       => Storage.keys().filter(k => k.startsWith(pfx)).map(k => k.slice(pfx.length)),
      };
    }
  };

  global.NovaOS = global.NovaOS || {};
  global.NovaOS.Storage = Storage;
})(window);
