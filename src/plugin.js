import videojs from 'video.js';
import {version as VERSION} from '../package.json';

// Default options for the plugin.
const PLUGIN_CONFIG = {
  key: 'persist-controls',
  defaultOptions: {
    muted: true,
    volume: true,
    playbackRate: true,
  },
  persistOptions: ['volume', 'muted', 'playbackRate']
};

// Player actions
const PLAYER_ACTIONS = {
  volumeChange: 'volumechange',
  rateChange: 'ratechange',
};

/**
 * Function to check if local storage is available
 *
 * @return {boolean} whether available
 */
const checkLocalStorageAvailability = () => {
  const testKey = 'persist-controls-test';

  try {
    window.localStorage.setItem(testKey, '.');
    window.localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Function to invoke when the player is ready.
 *
 * This is a great place for your plugin to initialize itself. When this
 * function is called, the player will have its DOM and child components
 * in place.
 *
 * @function onPlayerReady
 * @param    {Player} player
 *           A video.js player object.
 *
 * @param    {Object} [options={}]
 *           A plain object containing options for the plugin.
 */
const onPlayerReady = (player, options, localStorage) => {
  player.addClass('vjs-persist-controls');

  const { volume, muted, playbackRate, captions } = options;
  const { persistOptions, key } = PLUGIN_CONFIG;

  const data = JSON.parse(localStorage.getItem(key)) || {};

  const playerRates = player.playbackRates ? player.playbackRates() : player.options_.playbackRates || [];

  persistOptions.forEach(option => {
    if (!options[option]) return;

    const value = data[option];

    if (value) { 
      if (option === 'playbackRate' && !playerRates.includes(value)) {
        return;
      }

      player[option](value);
    }
  });

  if (muted || volume) {
    player.on(PLAYER_ACTIONS.volumeChange, () => {
      if (muted) {
        const isMuted = player.muted()

        player.defaultMuted(isMuted);
        data.muted = isMuted;
      }
      if (volume) {
        data.volume = player.volume();
      }
      localStorage.setItem(key, JSON.stringify(data));
    });
  }

  if (playbackRate) {
    player.on(PLAYER_ACTIONS.rateChange, () => {
      const _playbackRate = player.playbackRate();

      player.defaultPlaybackRate(_playbackRate);
      data.playbackRate = _playbackRate;

      localStorage.setItem(key, JSON.stringify(data));
    })
  }
};

/**
 * A video.js plugin.
 *
 * In the plugin function, the value of `this` is a video.js `Player`
 * instance. You cannot rely on the player being in a "ready" state here,
 * depending on how the plugin is invoked. This may or may not be important
 * to you; if not, remove the wait for "ready"!
 *
 * @function persistControls
 * @param    {Object} [options={}]
 *           An object of options left to the plugin author to define.
 */
const persistControls = function(options) {
  const isLocalStorageAvailable = checkLocalStorageAvailability()

  if (!isLocalStorageAvailable) {
    videojs.log('localStorage unavailable.');
    return;
  }

  this.ready(() => {
    onPlayerReady(this, videojs.obj.merge(PLUGIN_CONFIG.defaultOptions, options), window.localStorage);
  });
};

// Register the plugin with video.js.
videojs.registerPlugin('persistControls', persistControls);

// Include the version number.
persistControls.VERSION = VERSION;

export default persistControls;
