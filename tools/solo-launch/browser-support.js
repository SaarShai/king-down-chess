/* This script uses old syntax so the message can precede an unsupported module graph. */
(function () {
  var ua = navigator.userAgent, match, supported = true;
  if ((match = /(?:iPhone|iPad|iPod).*OS (\d+)[_\.](\d+)/.exec(ua))) supported = +match[1] > 16 || +match[1] === 16 && +match[2] >= 4;
  else if ((match = /(?:Chrome|Chromium|Edg)\/(\d+)/.exec(ua))) supported = +match[1] >= 111;
  else if ((match = /Firefox\/(\d+)/.exec(ua))) supported = +match[1] >= 114;
  else if (/Safari\//.test(ua) && (match = /Version\/(\d+)\.(\d+)/.exec(ua))) supported = +match[1] > 16 || +match[1] === 16 && +match[2] >= 4;
  supported = supported && typeof Promise !== 'undefined' && 'noModule' in document.createElement('script');
  window.kingdownSupported = supported;
  if (!supported) document.addEventListener('DOMContentLoaded', function () { document.getElementById('browser-support').hidden = false; });
}());
