require.config({
    // app entry point
    //deps: ["main"],
    paths: {
        StackTrace: './dependencies/stacktrace',
        SyntaxHighlighterGLSL: './dependencies/syntaxhighlighter_3.0.83/shBrushGLSL',
        SyntaxHighlighterCore: './dependencies/syntaxhighlighter_3.0.83/shCore',
    },
    shim: {
        StackTrace: {
            "exports": 'printStackTrace',
        },
        SyntaxHighlighterCore: {
            "exports": 'SyntaxHighlighter',
        },
        SyntaxHighlighterGLSL: {
            "deps": ["SyntaxHighlighterCore"],
        },
    }
});

define([
    './host/CaptureContext',
    './host/HostUI',
], function(
    captureContext,
    HostUI) {

    window.gli = window.gli || {};
    //window.gli.host = window.gli.host || {};
    //window.gli.host.inspectContext = captureContext.inspectContext.bind(captureContext);
    //window.gli.host.HostUI = HostUI;
    window.gli.wrapContextAndStartUI = function(canvas, rawgl, options) {
        // Is it already wrapped?
        if (rawgl.gliWrapper) {
          // return wrapper
          return rawgl.gliWrapper;
        }

        const wrapper = captureContext.inspectContext(canvas, rawgl, options);
        // NOTE: execute in a timeout so that if the dom is not yet
        // loaded this won't error out.
        window.setTimeout(() => {
          wrapper.hostUI = new HostUI(wrapper);
        }, 0);
        return wrapper;
    };
});
