(function () {
  var originalGetContext = HTMLCanvasElement.prototype.getContext;
  var gliCssUrl = document.querySelector("[data-gli-css-url]").dataset.gliCssUrl;
  var contextNames = ["webgl2", "webgl", "experimental-webgl","moz-webgl"];
  var link = document.createElement("link");
  link.rel = "stylesheet";

  if (!HTMLCanvasElement.prototype.getContextRaw) {
    HTMLCanvasElement.prototype.getContextRaw = originalGetContext;
  }

  HTMLCanvasElement.prototype.getContext = function () {
    if (this.internalInspectorSurface) {
      return originalGetContext.apply(this, arguments);
    }

    var result = originalGetContext.apply(this, arguments);
    if (result === null) return null;

    var requestingWebGL = contextNames.indexOf(arguments[0]) !== -1;
    if (requestingWebGL) {
      // TODO: pull options from extension
      result = gli.wrapContextAndStartUI(this, result);
    }

    return result;
  };

  if (!window.gliCssUrl) window.gliCssUrl = gliCssUrl;

  document.addEventListener("DOMContentLoaded", function () {
    link.href = gliCssUrl;
    document.head.appendChild(link);
  });
})();

