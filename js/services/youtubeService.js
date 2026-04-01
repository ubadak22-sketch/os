/**
 * LunaOS YouTubeService — Safe YouTube iframe embedding.
 * Never attempts direct media access; uses official embed API only.
 */
'use strict';

(function (global) {
  const YoutubeService = {
    /**
     * Extract video ID from a YouTube URL or return as-is if already an ID.
     */
    extractId(urlOrId) {
      if (!urlOrId) return null;
      const patterns = [
        /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
        /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
        /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      ];
      for (const p of patterns) {
        const m = urlOrId.match(p);
        if (m) return m[1];
      }
      // May already be an ID
      if (/^[a-zA-Z0-9_-]{11}$/.test(urlOrId)) return urlOrId;
      return null;
    },

    /**
     * Build a YouTube embed URL.
     * @param {string} videoId
     * @param {Object} opts
     */
    buildEmbedUrl(videoId, opts = {}) {
      const { autoplay = 0, start = 0 } = opts;
      const params = new URLSearchParams({
        autoplay,
        start,
        modestbranding: 1,
        rel: 0,
        origin: location.origin
      });
      return `https://www.youtube-nocookie.com/embed/${videoId}?${params}`;
    },

    /**
     * Create an iframe element for embedding.
     */
    createEmbed(videoId, opts = {}) {
      const iframe = document.createElement('iframe');
      iframe.src = this.buildEmbedUrl(videoId, opts);
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      iframe.style.cssText = 'width:100%;height:100%;border:none;';
      iframe.title = 'YouTube Video Player';

      iframe.addEventListener('error', () => {
        console.warn('[YouTubeService] Embed failed for', videoId);
      });
      return iframe;
    },

    /**
     * Default playlist for Music app.
     */
    defaultPlaylist: [
      { id: 'jfKfPfyJRdk', title: '🎵 lofi hip hop — beats to study to' },
      { id: '5qap5aO4i9A', title: '🎵 lofi hip hop — relaxing beats' },
      { id: 'DWcJFNfaw9c', title: '🎵 jazz & bossa — coffee shop music' },
      { id: '7NOSDKb0HlU', title: '🎵 deep focus — coding music' },
      { id: 'rUxyKA_-grg', title: '🎵 chillhop — essentials' },
    ]
  };

  global.NovaOS = global.NovaOS || {};
  global.NovaOS.YoutubeService = YoutubeService;
})(window);
