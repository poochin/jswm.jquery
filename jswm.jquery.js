/**
 * @fileoverview JavaScript Window Manager with jQuery
 * @author Ed Sanders
 * @writer poochin
 * @version 0.5-
 * @version 0.1.1
 * @lisence GPLv2
 * @depend jquery
 * @depend jquery-ui/draggable
 */

var JSWM;

(function ($) {
    /*
    JSWMLib = {
        Version: '0.1',
        load: function() {}
    };
    JSWMLib.load();
    */

    TextButton = function (f, text, title) {
        var a = document.createElement('A');
        $(a).text(text).click(f).attr('href', '#').attr({
            title: title
        });
        return a;
    };

    ImageButton = function (f, src, alt, title, hoverSrc) {
        var img = document.createElement('IMG');
        $(img).click(f).css({
            cursor: 'pointer'
        }).attr({
            src: src,
            title: title
        });
        if (hoverSrc) {
            // new mage().src = hoverSRC; // preload hover image
            $(img).mouseover(function () {
                img.src = hoverSrc;
            }).mouseout(function () {
                img.src = src;
            });
        }
        return img;
    };

    /**
     * Truncate text inside a span using log a binary search
     * @method
     * @param {string} text  text to truncate
     * @param {Element} element  in-line element containing text
     * @param {Element} container  block element containing text element (to test height change)
     * @param {int} w  Maximum width
     * @param {int} h  Maximum height
     */
    JSWMtruncate = function (text, element, container, w, h) {
        if ($(element).width() > w || $(container).height() > h) {
            var len = text.length;
            var i = Math.floor(len / 4);
            var lasti = 0;
            while (lasti != i && i < len && i >= 0) {
                var i2 = i;
                element.replaceChild(document.createTextNode(text.substring(0, text.length - i) + ''), element.firstChild);
                if ($(element).width() > w || $(container).height() > h) {
                    i += Math.ceil(Math.abs(lasti - i) / 2);
                } else if (Math.abs(lasti - i) > 1) {
                    i -= Math.ceil(Math.abs(lasti - i) / 2);
                } else {
                    break;
                }
                lasti = i2;
            }
            element.replaceChild(document.createTextNode(text.substring(0, text.length - i) + ''), element.firstChild);
        }
    };

    BrowserDetect = {
        init: function () {
            this.browser = this.searchString(this.dataBrowser) || "An unknown browser";
            this.version = this.searchVersion(navigator.userAgent) || this.searchVersion(navigator.appVersion) || "an unknown version";
            this.OS = this.searchString(this.dataOS) || "an unknown OS";
        },
        searchString: function (data) {
            for (var i = 0; i < data.length; i++) {
                var dataString = data[i].string;
                var dataProp = data[i].prop;
                this.versionSearchString = data[i].versionSearch || data[i].identity;
                if (dataString) {
                    if (dataString.indexOf(data[i].subString) != -1)
                        return data[i].identity;
                } else if (dataProp)
                    return data[i].identity;
            }
        },
        searchVersion: function (dataString) {
            var index = dataString.indexOf(this.versionSearchString);
            if (index == -1)
                return;
            return parseFloat(dataString.substring(index + this.versionSearchString.length + 1));
        },
        dataBrowser: [{
            // not exists in origin
            string: navigator.userAgent,
            subString: "Chrome",
            identity: "Google chrome"
        }, {
            string: navigator.userAgent,
            subString: "OmniWeb",
            versionSearch: "OmniWeb/",
            identity: "OmniWeb"
        }, {
            string: navigator.vendor,
            subString: "Apple",
            identity: "Safari"
        }, {
            prop: window.opera,
            identity: "Opera"
        }, {
            string: navigator.vendor,
            subString: "iCab",
            identity: "iCab"
        }, {
            string: navigator.vendor,
            subString: "KDE",
            identity: "Konqueror"
        }, {
            string: navigator.userAgent,
            subString: "Firefox",
            identity: "Firefox"
        }, {
            string: navigator.vendor,
            subString: "Camino",
            identity: "Camino"
        }, { // for newer Netscapes (6+)
            string: navigator.userAgent,
            subString: "Netscape",
            identity: "Netscape"
        }, {
            string: navigator.userAgent,
            subString: "MSIE",
            identity: "Explorer",
            versionSearch: "MSIE"
        }, {
            string: navigator.userAgent,
            subString: "Gecko",
            identity: "Mozilla",
            versionSearch: "rv"
        }, { // for older Netscapes (4-)
            string: navigator.userAgent,
            subString: "Mozilla",
            identity: "Netscape",
            versionSearch: "Mozilla"
        }],
        dataOS: [{
            string: navigator.platform,
            subString: "Win",
            identity: "Windows"
        }, {
            string: navigator.platform,
            subString: "Mac",
            identity: "Mac"
        }, {
            string: navigator.platform,
            subString: "Linux",
            identity: "Linux"
        }]
    };
    BrowserDetect.init();

    pngSupport = !(BrowserDetect.browser == 'Explorer' && BrowserDetect.OS == 'Windows' && BrowserDetect.version < 7);

    /**
     * Expand/collapse button (v/^)
     * @constructor
     * @param {Function} f  Function to be fired by the onclick event
     */
    ExpandButton = function (f) {
        this.img = document.createElement('IMG');
        $(this.img).click(f).css({
            cursor: 'pointer'
        }).attr({
            alt: '+/-'
        });
        return this;
    };


    /**
     * Get Element
     * @method
     * @return {Element}  The expand button
     */
    ExpandButton.prototype.getButton = function () {
        return this.img;
    };

    /**
     * Set the expand button graphic
     * @method
     * @param {boolean} isExpanded  New state
     * @param {boolean} isNode  Item is a node (can't be expanded)
     */
    ExpandButton.prototype.set = function (isExpanded, isNode) {
        var _this = this;
        var icon = isExpanded ? JSWMImages.collapse : JSWMImages.expand;
        var iconhover = isExpanded ? JSWMImagesHover.collapse : JSWMImagesHover.expand;

        $(this.img).attr({
            src: icon
        });
        $(this.img).mouseover(function () {
            $(this).attr({
                src: iconhover
            });
        }).mouseout(function () {
            $(this).attr({
                src: icon
            });
        });
    };

    /**
     * Construct a window manager
     * @constructor
     * @param {int[]} margins  Window manager margins [top, right, bottom, left], default [0, 0, 0, 0]
     * @param {boolean[]} constraints  Window manager edge constraints [top, right, bottom, left], default [true, false, false, false]
     */
    JSWM = function (margins, constraints) {
        this.contents = document.body.appendChild(document.createElement('DIV'));
        $(this.contents).addClass('JSWM_manager');
        this.windows = new Array();
        this.topZIndex = 100;
        this.lastActiveWindow = null;
        if (!margins)
            margins = [0, 0, 0, 0];
        this.margins = margins;
        if (!constraints)
            constraints = [true, false, false, false];
        this.constraints = constraints;
        return this;
    };

    /**
     * Tile all windows across the viewport
     * @method
     */
    JSWM.prototype.tile = function () {
        var gridSizeW = Math.ceil(Math.sqrt(this.windows.length));
        var gridSizeH = Math.ceil(this.windows.length / gridSizeW);
        var windowSize = this.getWindowSize();
        var w = Math.floor((windowSize.width - 10) / gridSizeW);
        var h = Math.floor((windowSize.height - 10) / gridSizeH);

        for (var i = 0; i < this.windows.length; i++) {
            this.windows[i].setSize(w, h - 20);
            this.windows[i].setPosition((i % gridSizeW) * w, Math.floor(i / gridSizeW) * h);
            this.windows[i].redrawShadow();
            this.windows[i].setActive();
        }
    };

    /**
     * Cascade all windows across the viewport
     * @method
     */
    JSWM.prototype.cascade = function () {
        var windowSize = this.getWindowSize();
        var w = Math.floor((windowSize.width - 10) * 2 / 3);
        var h = Math.floor((windowSize.height - 10) * 2 / 3);
        var l = Math.floor((windowSize.width - 10 - w) / (this.windows.length - 1));
        var t = Math.floor((windowSize.height - 10 - h) / (this.windows.length - 1));
        if (this.windows.length == 1) {
            l = 0;
            t = 0;
        }
        for (var i = 0; i < this.windows.length; i++) {
            this.windows[i].setSize(w, h - 20);
            this.windows[i].setPosition(i * l, i * t);
            this.windows[i].redrawShadow();
            this.windows[i].setActive();
        }
    };

    /**
     * Collapse all collapsible windows
     * @method
     */
    JSWM.prototype.collapseAll = function () {
        for (var i = 0; i < this.windows.length; i++)
        if (!this.windows[i].noCollapse)
            this.windows[i].expand(false);
    };

    /**
     * Expand all collapsible windows
     * @method
     */
    JSWM.prototype.expandAll = function () {
        for (var i = 0; i < this.windows.length; i++)
        if (!this.windows[i].noCollapse)
            this.windows[i].expand(true);
    };

    /**
     * Create a new empty window
     * @method
     * @param {int} w  Window width
     * @param {int} h  Window height
     * @param {JSWindowOptions} options  Initial options
     */
    JSWM.prototype.openNew = function (w, h, l, t, options) {
        var jsWindow = new JSWindow(this, w, h, l, t, options);
        this.addWindow(jsWindow);
    };

    /**
     * Create a new window with an iframe
     * @method
     * @param {string} uri  URI to load in iframe
     * @param {int} w  Window width
     * @param {int} h  Window height
     * @param {JSWindowOptions} options  Initial options
     */
    JSWM.prototype.openURI = function (uri, w, h, l, t, options) {
        var iFrame = document.createElement('IFRAME');
        iFrame.src = uri;
        iFrame.name = 'iframe' + Math.round(Math.random() * 1000000);
        $(iFrame).css({
            border: '0',
            width: '100%',
            height: '100%'
        });
        var jsWindow = new JSWindow(this, w, h, l, t, options, iFrame);
        $(jsWindow.lastActiveTab.contents).css({
            overflow: 'hidden'
        });
        this.addWindow(jsWindow);
    };

    /**
     * Determines if an element is already wrapped
     * @method
     * @param {Element} contents  Contents to look for
     * @return {boolean}  True if element is wrapped in a window
     */
    JSWM.prototype.isWrapped = function (contents) {
        contents = $(contents).get(0) || $('#' + contents).get(0);
        for (var i = 0; i < this.windows.length; i++)
        for (var j = 0; j < this.windows[i].tabs.length; j++)
        if (this.windows[i].tabs[j].contents.firstChild == contents)
            return true;
        return false;
    };

    /**
     * Create a new window around an existing content
     * @method
     * @param {Element} contents  Element to wrap
     * @param {int} w  Window width
     * @param {int} h  Window height
     * @param {JSWindowOptions} options  Initial options
     * @param {boolean} force  Re wrap contents even if already wrapped
     */
    JSWM.prototype.openElement = function (contents, w, h, l, t, options, force) {
        if (!force && this.isWrapped(contents))
            return; // return if content already wrapped
        var jsWindow = new JSWindow(this, w, h, l, t, options, contents);
        this.addWindow(jsWindow)
    };

    /**
     * Add a window to the manager
     * @method
     * @param {JSWindow} jsWindow  Window to add
     */
    JSWM.prototype.addWindow = function (jsWindow) {
        this.windows.push(jsWindow);
        jsWindow.redrawShadow();
        jsWindow.setActive();
    };

    /**
     * Set target window as active
     * @method
     * @param {JSWindow} jsWindow  Window to make active
     */
    JSWM.prototype.setActiveWindow = function (jsWindow) {
        jsWindow.container.style.zIndex = this.topZIndex;
        this.topZIndex++;

        $(jsWindow.container).addClass('JSWM_window_active');
        if (this.lastActiveWindow && this.lastActiveWindow != jsWindow)
            $(this.lastActiveWindow.container).removeClass('JSWM_window_active');
        this.lastActiveWindow = jsWindow;
    };

    /**
     * Get size of viewport (less margins)
     * @method
     * @returns {Object}  Dimension of viewport
     */
    JSWM.prototype.getWindowSize = function () {
        if (window.innerWidth) {
            w = window.innerWidth;
            h = window.innerHeight;
        } else if (window.document.documentElement && window.document.documentElement.clientWidth) {
            w = window.document.documentElement.clientWidth;
            h = window.document.documentElement.clientHeight;
        } else {
            w = body.offsetWidth;
            h = body.offsetHeight;
        }
        w -= this.margins[1] + this.margins[3];
        h -= this.margins[0] + this.margins[2];
        return {
            width: w,
            height: h
        };
    };

    /**
     * Write object state data for serialisation
     * @method
     * @returns {Object} serialData  Object serialisation data
     */
    JSWM.prototype.writeObject = function () {
        var serialData = new Object();
        serialData.windows = new Array();
        for (var i = 0; i < this.windows.length; i++) {
            serialData.windows[i] = this.windows[i].writeObject();
            if (this.windows[i] == this.lastActiveWindow)
                serialData.lastActiveWindow = i;
        }
        return serialData;
    };

    /**
     * Read serialised object state data into the window manager
     * @method
     * @param {String} serialData  Object serialisation data
     */
    JSWM.prototype.readObject = function (serialData) {
        for (var i = 0; i < serialData.windows.length; i++) {
            var w = serialData.windows[i];
            var jsWindow = new JSWindow(this, w.size.width, w.size.height, w.position.left, w.position.top, w.options);
            this.addWindow(jsWindow)
            if (serialData.lastActiveWindow == i)
                jsWindow.setActive();
            jsWindow.readObject(w);
        }
    };

    /**
     * Window class
     * @constructor
     * @param {Element} element  Container window or contents (if contentExists)
     * @param {int} w  Window width
     * @param {int} h  Window height
     * @param {JSWindowOptions} options  Window options
     * @param {boolean} contentExists  Flag to indicate element points to existing content to be wrapped
     */
    JSWindow = function (manager, w, h, l, t, options, contents) {
        var _this = this;
        this.minWidth = 200;
        this.minHeight = 50;
        this.tabs = new Array();
        this.minTabButtonWidth = 100;
        this.maxTabButtonWidth = 200;
        this.manager = manager;
        this.options = options;

        this.container = this.manager.contents.appendChild(document.createElement('DIV'));
        this.innerContainer = this.container.appendChild(document.createElement('DIV'));
        if (this.options.noCollapse) {
            this.slide = this.innerContainer.appendChild(document.createElement('DIV'));
            var nest = this.slide.appendChild(document.createElement('DIV'));
            this.contents = nest.appendChild(document.createElement('DIV'));
        } else {
            this.contents = this.innerContainer.appendChild(document.createElement('DIV'));
            this.slide = this.contents;
        }
        this.tabList = this.contents.appendChild(document.createElement('UL'));
        $(this.tabList).addClass('JSWM_tabList');
        $(this.tabList).sortable({axis: 'x', containment: 'parent'});

        if (!contents)
            contents = document.createElement('DIV');
        this.openTab(contents);

        $(this.container).css({
            position: 'absolute'
        }); // IE fix
        $(this.container).addClass('JSWM_window');
        this.handle = this.innerContainer.insertBefore(document.createElement('DIV'), this.slide);
        $(this.handle).addClass('JSWM_window_handle');
        handleRight = this.handle.appendChild(document.createElement('DIV'));
        $(handleRight).addClass('JSWM_window_handle_right');

        if (!this.options.noResize) {
            this.resizeNW = this.innerContainer.appendChild(document.createElement('DIV'));
            $(this.resizeNW).addClass('JSWM_window_resize JSWM_window_resizeNW').css({
                position: 'absolute' /* IE fix*/
            });
            this.resizeNE = this.innerContainer.appendChild(document.createElement('DIV'));
            $(this.resizeNE).addClass('JSWM_window_resize JSWM_window_resizeNE').css({
                position: 'absolute' /* IE fix*/
            });
            this.resizeSW = this.innerContainer.appendChild(document.createElement('DIV'));
            $(this.resizeSW).addClass('JSWM_window_resize JSWM_window_resizeSW').css({
                position: 'absolute' /* IE fix*/
            });
            this.resizeSE = this.innerContainer.appendChild(document.createElement('DIV'));
            $(this.resizeSE).addClass('JSWM_window_resize JSWM_window_resizeSE').css({
                position: 'absolute' /* IE fix*/
            });

            var dragNW = function (drag, ui) {
                    var relative = {
                        left: $(this.parentNode).offset().left - ui.offset.left,
                        top: $(this.parentNode).offset().top - ui.offset.top
                    },
                        absolute = {
                            left: null,
                            top: null
                        };
                    _this.setSize(relative.left, relative.top, 3, true);
                    _this.setSize(absolute.left, absolute.top, 3);
                    ui.position = {
                        left: 0,
                        top: 0
                    };
                };
            var dragNE = function (drag, ui) {
                    var relative = {
                        left: null,
                        top: $(this.parentNode).offset().top - ui.offset.top
                    },
                        absolute = {
                            left: $(this).offset().left - $(this.parentNode).offset().left + $(this).width(),
                            top: null
                        };
                    _this.setSize(relative.left, relative.top, 2, true);
                    _this.setSize(absolute.left, absolute.top, 2);
                    ui.position.top = 0;
                };
            var dragSW = function (drag, ui) {
                    var relative = {
                        left: $(this.parentNode).offset().left - ui.offset.left,
                        top: 0
                    },
                        absolute = {
                            left: null,
                            top: $(this).offset().top - $(this.parentNode).offset().top + $(this).height() - 20
                        };
                    _this.setSize(relative.left, relative.top, 1, true);
                    _this.setSize(absolute.left, absolute.top, 1);
                    ui.position.left = 0;
                };
            var dragSE = function (drag, ui) {
                    var relative = {
                        left: null,
                        top: null
                    },
                        absolute = {
                            left: $(this).offset().left - $(this.parentNode).offset().left + $(this).width(),
                            top: $(this).offset().top - $(this.parentNode).offset().top + $(this).height() - 20
                        };
                    _this.setSize(relative.left, relative.top, 0, true);
                    _this.setSize(absolute.left, absolute.top, 0);
                };

            if (!this.options.noResizeRedraw) {
                $(this.resizeNW).draggable({
                    drag: dragNW,
                    stop: dragNW
                });
                $(this.resizeNE).draggable({
                    drag: dragNE,
                    stop: dragNE
                });
                $(this.resizeSW).draggable({
                    drag: dragSW,
                    stop: dragSW
                });
                $(this.resizeSE).draggable({
                    drag: dragSE,
                    stop: dragSE
                });
            } else {
                $(this.resizeNW).draggable({
                    stop: dragNW
                });
                $(this.resizeNE).draggable({
                    stop: dragNE
                });
                $(this.resizeSW).draggable({
                    stop: dragSW
                });
                $(this.resizeSE).draggable({
                    stop: dragSE
                });
            }
            $(this.resizeNW).mousedown(function () {
                _this.setActive();
            });
            $(this.resizeNE).mousedown(function () {
                _this.setActive();
            });
            $(this.resizeSW).mousedown(function () {
                _this.setActive();
            });
            $(this.resizeSE).mousedown(function () {
                _this.setActive();
            });
            $(this.handle).dblclick(function () {
                _this.maximise();
            });
            $(window).resize(function () {
                _this.updateMaximise();
            });
        }

        handleRight.appendChild(new ImageButton(function () {
            _this.openTab();
        }, JSWMImages.add, '+', 'add tab', JSWMImagesHover.add));

        if (!this.options.noCollapse) {
            this.slideOptions = {
                afterFinish: function () {
                    _this.redrawTabList(true);
                    _this.redrawShadow();
                },
                afterUpdate: function () {
                    _this.redrawShadow();
                },
                duration: 0.3,
            };
            this.expanded = true;
            this.expandButton = new ExpandButton(function () {
                _this.expand();
            });
            this.expandButton.set(true);
            handleRight.appendChild(this.expandButton.getButton());
        }

        if (!this.options.noShadow && pngSupport) {
            var shadowContainer = this.container.insertBefore(document.createElement('DIV'), this.innerContainer);
            $(shadowContainer).addClass('JSWM_shadow_container');

            this.shadowNE = shadowContainer.appendChild(document.createElement('DIV'));
            $(this.shadowNE).addClass('JSWM_shadowNE');
            this.shadowSW = shadowContainer.appendChild(document.createElement('DIV'));
            $(this.shadowSW).addClass('JSWM_shadowSW');
            this.shadowSE = shadowContainer.appendChild(document.createElement('DIV'));
            $(this.shadowSE).addClass('JSWM_shadowSE');

            this.shadowS = shadowContainer.appendChild(document.createElement('DIV'));
            $(this.shadowS).addClass('JSWM_shadowS');
            this.shadowE = shadowContainer.appendChild(document.createElement('DIV'));
            $(this.shadowE).addClass('JSWM_shadowE');
        }

        if (!this.options.noClose) {
            var closeButton = handleRight.appendChild(new ImageButton(function () {
                _this.close();
            }, JSWMImages.closeWindow, 'x', 'close', JSWMImagesHover.closeWindow));
            $(closeButton).addClass('close');
        }

        $(this.contents).addClass('JSWM_window_contents');

        this.titleLabel = this.handle.appendChild(document.createElement('DIV'));
        $(this.titleLabel).addClass('JSWM_window_title');
        if (!this.options.title)
            this.options.title = '';
        this.setTitle(this.options.title, this.options.icon);

        if (!this.options.noDrag) {
            $(this.container).draggable({
                handle: this.handle,
                start: function () {
                    _this.startPos = $(this).offset();
                },
                drag: function (drag, ui) {
                    ui.position.top = Math.max(0 + _this.manager.margins[0], ui.position.top);
                },
                stop: function () {
                    _this.ondrop();
                    _this.setActive();
                }
            });
            $(this.innerContainer).mousedown(function () {
                _this.setActive();
            });
            $(this.handle).mousedown(function () {
                _this.setActive();
            });
        }
        switch (String(l).toLowerCase()) {
        case 'left':
            l = 0;
            break;
        case 'center':
        case 'middle':
            l = (this.manager.getWindowSize().width - w) / 2;
            break;
        case 'right':
            l = this.manager.getWindowSize().width - w - 10;
            break;
        }

        switch (String(t).toLowerCase()) {
        case 'top':
            t = 0;
            break;
        case 'center':
        case 'middle':
            t = (this.manager.getWindowSize().height - h) / 2;
            break;
        case 'bottom':
            t = this.manager.getWindowSize().height - h - 10;
            break;
        }
        t = Math.max(t, 0);
        this.setPosition(l, t);
        this.setSize(w, h, 0);

        return this;
    };

    /**
     * Open a new tab in a window
     * @method
     * @param {Element} contents  Contents to place in tab
     * @param {boolean} force  Add even if contents are already wrapped
     */
    JSWindow.prototype.openTab = function (contents, force) {
        var _this = this;
        contents = $(contents).get(0) || $('#' + contents).get(0);
        if (!force && contents && this.manager.isWrapped(contents))
            return false;
        var tabContents = document.createElement('DIV');
        if (contents)
            tabContents.appendChild(contents);
        var jsTab = new JSTab(this, tabContents, this.tabs.length + 'long tab name ' + this.tabs.length, 'images/tab.png');
        this.addTab(jsTab)
    };

    /**
     * Add a tab to the tab manager
     * @method
     * @param {JSTab} jsTab  Tab to add
     */
    JSWindow.prototype.addTab = function (jsTab) {
        jsTab.i = this.tabs.length;
        this.tabs.push(jsTab);
        this.tabList.appendChild(jsTab.getButton());
        this.redrawTabList();
        jsTab.setActive();
        this.contents.appendChild(jsTab.contents);
    };

    /**
     * Sets a tab as active
     * @method
     * @param {Element} jsTab  Tab to make active
     */
    JSWindow.prototype.setActiveTab = function (jsTab) {
        var redraw = false;
        if (this.fadeTabs)
            var scope = "tab" + Math.random();

        if (this.lastActiveTab && this.lastActiveTab != jsTab) {
            if (this.fadeTabs) {
                $(this.lastActiveTab.contents).animate({display: 'block'}, {duration: 200});
            } else {
                $(this.lastActiveTab.contents).css({display: 'none'});
            }
            $(this.lastActiveTab.tabButton).removeClass('JSWM_tabButton_active');
            redraw = true;
        }

        if (this.fadeTabs && this.lastActiveTab != jsTab) {
            $(jsTab.contents).css({display: 'none'}, {duration: 200});
        } else {
            $(jsTab.contents).css({
                display: 'block'
            });
        }

        $(jsTab.tabButton).addClass('JSWM_tabButton_active');
        this.lastActiveTab = jsTab;
        if (redraw)
            this.setSize(0, 0, 0, true);
    };

    /**
     * Redraw the tab list
     * @method
     * @param {boolean} force  Recalculate tab name truncation even if width hasn't changed (for post collapse event) 
     */
    JSWindow.prototype.redrawTabList = function (force) {
        if (this.tabs.length <= 1) {
            $(this.tabList).css({display: 'none'});
        } else {
            $(this.tabList).css({display: 'block'});
            var w = this.getSize().width - 20;
            var tabWidth = Math.floor(w / this.tabs.length);
            tabWidth = Math.min(tabWidth, this.maxTabButtonWidth);
            tabWidth = Math.max(tabWidth, this.minTabButtonWidth);
            tabWidth -= JSWMTabMargins;
            tabsRemoved = 0;
            while (tabWidth * (this.tabs.length - tabsRemoved) > w)
            tabsRemoved++;

            var i = 0;
            // remove tabs before active one
            while (this.tabs[i] != this.lastActiveTab && i < this.tabs.length && i < tabsRemoved) {
                $(this.tabs[i].tabButton).css({
                    display: 'none'
                });
                i++;
            }
            // draw as many tabs as can fit
            var drawTo = this.tabs.length - (tabsRemoved - i);
            while (i < drawTo) {
                $(this.tabs[i].tabButton).css({
                    display: 'block'
                });
                var curWidth = parseInt($(this.tabs[i].tabButton).width());
                if (curWidth != tabWidth || force) {
                    $(this.tabs[i].tabButton).css({
                        width: tabWidth + 'px'
                    });
                    this.tabs[i].setTitle(this.tabs[i].title, this.tabs[i].icon);
                }
                i++;
            }
            // remove remaining tabs
            while (i < this.tabs.length) {
                $(this.tabs[i].tabButton).css({
                    display: 'none'
                });
                i++;
            }
        }
    };

    /**
     * Expand/collapse a collapsible window
     * @method
     * @param {boolean} expand  Mode to expand to, null to toggle
     */
    JSWindow.prototype.expand = function (expand) {
        if (expand == null || expand != this.expanded) {
            if (expand == null)
                this.expanded = !this.expanded;
            else
                this.expanded = expand
            $(this.slide).animate({
                height: 'toggle'
            }, {
                duration: this.slideOptions.duration * 1000,
                step: this.slideOptions.afterUpdate,
                complete: this.slideOptions.afterFinish
            });
            this.expandButton.set(this.expanded);
        }
    };

    /**
     * Maximise / restore window
     * @method
     */
    JSWindow.prototype.maximise = function () {
        // change to: if ($(this.container).hasClass('JSWM_window_maximised'))
        if (this.maximised) {
            this.maximised = false;
            $(this.container).removeClass('JSWM_window_maximised');
            this.setPosition(this.restorePosition.left, this.restorePosition.top);
            this.setSize(this.restoreSize.width, this.restoreSize.height, 0);
        } else {
            $(this.container).addClass('JSWM_window_maximised');
            this.restoreSize = this.getSize();
            this.restorePosition = this.getPosition();
            this.setPosition(0, 0);
            var windowSize = this.manager.getWindowSize();
            this.setSize(windowSize.width - 2, windowSize.height - 4 - 20, 0);
            this.maximised = true;
        }
    };


    /**
     * Update maximise size if window is resized
     * @method
     */
    JSWindow.prototype.updateMaximise = function () {
        if (this.maximised) {
            var windowSize = this.manager.getWindowSize();
            this.maximised = false;
            this.setSize(windowSize.width - 2, windowSize.height - 4 - 20, 0);
            this.maximised = true;
        }
    };

    /**
     * Get the current size
     * @method
     * @return {object}  Object containing .width and .height
     */
    JSWindow.prototype.getSize = function () {
        return {
            width: parseInt($(this.slide).width()),
            height: parseInt($(this.slide).height())
        };
    };

    /**
     * Get the current position
     * @method
     * @return {object}  Object containing .left and .top
     */
    JSWindow.prototype.getPosition = function () {
        // can i use $.offset().left ?
        return {
            left: parseInt(this.container.style.left) - this.manager.margins[3],
            top: parseInt(this.container.style.top) - this.manager.margins[0]
        };
    };

    /**
     * Set window as active, shortcut to JSWM.setActiveWindow()
     * @method
     */
    JSWindow.prototype.setActive = function () {
        this.manager.setActiveWindow(this);
    };

    /**
     * Resize a window
     * @method
     * @param {int} w  New width, null indicates no change
     * @param {int} h  New height, null indicates no change
     * @param {int} fixedCorner  The corner to fix while resizing 0 = NW, 1 = NE, 2 = SW, 3 = SE
     * @param {boolean} relative  Indicates that the supplied size is relative to the current size
     */
    JSWindow.prototype.setSize = function (w, h, fixedCorner, relative) {
        var size = this.getSize();
        if (relative) {
            w += size.width;
            h += size.height;
        }
        if (this.maximised) {
            w = size.width;
            h = size.height;
        }
        if (w == null)
            w = size.width;
        if (h == null || !this.expanded)
            h = size.height;

        w = Math.max(w, this.minWidth);
        h = Math.max(h, this.minHeight);

        $(this.handle).css({
            width: w + 'px'
        });
        $(this.slide).css({
            width: w + 'px',
            height: h + 'px'
        });
        $(this.contents).css({
            width: w + 'px'
        });
        $(this.innerContainer).css({
            width: (w + 2) + 'px'
        });
        $(this.lastActiveTab.contents).css({
            width: w + 'px'
        });
        $(this.lastActiveTab.contents).css({
            height: (h - (this.tabs.length > 1 ? $(this.tabList).height() : 0)) + 'px'
        });

        if (fixedCorner % 2 == 1) // right of window fixed
        this.setPosition(size.width - w, 0, true)

        if (fixedCorner >= 2) // bottom of window fixed
        this.setPosition(0, size.height - h, true)

        w += 2; //total horizontal border width
        h += 4; //total vertical border height
        h += 20; //title bar
        $(this.resizeNW).css({
            left: 0,
            top: 0
        });
        $(this.resizeNE).css({
            left: (w - 10) + 'px',
            top: '0'
        });
        $(this.resizeSW).css({
            left: '0',
            top: (h - 10) + 'px'
        });
        $(this.resizeSE).css({
            left: (w - 10) + 'px',
            top: (h - 10) + 'px'
        });
        this.redrawShadow();
        this.redrawTabList();
        this.setTitle(this.title, this.icon);
    };

    /**
     * Position the window aboslutely or relatively
     * @method
     * @param {int} l  Distance from the left of the viewport
     * @param {int} t  Distance from the top of the viewport
     * @param {boolean} relative  Indicates that the supplied coordinates a relative to the current position
     */
    JSWindow.prototype.setPosition = function (l, t, relative) {
        if (relative) {
            var position = this.getPosition();
            if (l != null)
                l += position.left;
            if (t != null)
                t += position.top;
        }
        if (l != null) {
            l += this.manager.margins[3];
            this.container.style.left = l + 'px';
        }
        if (t != null) {
            t += this.manager.margins[0]
            this.container.style.top = t + 'px';
        }
    };

    /**
     * Set the window title
     * @method
     * @param {string} title  The new title
     * @param {string} icon  Window icon uri
     */
    JSWindow.prototype.setTitle = function (title, icon) {
        this.title = title;

        // $(this.titlelabel).html('<span>' + title + '</span');
        $(this.titleLabel).empty();
        var span = this.titleLabel.appendChild(document.createElement('SPAN'));
        span.appendChild(document.createTextNode(this.title));
        var titleSpace = $(this.titleLabel).width() - 20;
        JSWMtruncate(title, span, this.handle, titleSpace, 25);
        this.titleLabel.title = title;

        this.icon = icon;
        $(this.titleLabel).css({
            backgroundImage: 'url("' + this.icon + '")'
        });
    };

    /**
     * Fires when component is moved (if set to draggable)
     * @method
     */
    JSWindow.prototype.onmove = function (drag) {};

    /**
     * Fires when component is dropped (if set to draggable)
     * @method
     */
    JSWindow.prototype.ondrop = function (drag) {};

    /**
     * Redraws the drop shadow
     * @method
     */
    JSWindow.prototype.redrawShadow = function () {
        if (!this.options.noShadow && pngSupport) {
            var w = $(this.innerContainer).width();
            var h = $(this.innerContainer).height();
            /*
            if(this.expanded)
                h += 2; // combined border width of top and bottom
            */
            this.shadowNE.style.left = w + 'px';
            this.shadowSE.style.left = w + 'px';
            this.shadowE.style.left = w + 'px';
            this.shadowSW.style.top = h + 'px';
            this.shadowSE.style.top = h + 'px';
            this.shadowS.style.top = h + 'px';
            if (w > 6)
                this.shadowS.style.width = (w - 6) + 'px'
            if (h > 6)
                this.shadowE.style.height = (h - 6) + 'px';
        }
    };

    /**
     * Start of tab dragging, calculate inital positions
     * @method
     * @param {Element} item  Tab being dragged
     */
    JSWindow.prototype.dragTabStart = function (item) {
        this.tabPositions = new Array();
        for (var i = 0; i < this.tabs.length; i++) {
            offset = $(this.tabs[i].tabButton).position();
            this.tabPositions[i] = [offset.left, offset.top]; //Position.positionedOffset(this.tabs[i].tabButton);
        }
        offset = $(item).position();
        this.start = [offset.left, offset.top]; //Position.positionedOffset(item);
    };

    /**
     * Read serialised object state data into the window
     * @method
     * @param {String} serialData  Object serialisation data
     */
    JSWindow.prototype.readObject = function (serialData) {
        this.setSize(serialData.size.width, serialData.size.height);
        this.setPosition(serialData.position.left, serialData.position.top);
        this.options = serialData.options;

        this.expand(serialData.expanded);
        if (serialData.maximised) {
            this.maximise();
            this.restoreSize = serialData.restoreSize;
            this.restorePosition = serialData.restorePosition;
        }
        this.contents.style.zIndex = serialData.zIndex;
        this.tabs[0].close();
        for (var i = 0; i < serialData.tabs.length; i++) {
            var t = serialData.tabs[i];
            var jsTab = new JSTab(this, document.createElement('DIV'), t.title, t.icon);
            this.addTab(jsTab);
            jsTab.readObject(t);
            if (serialData.lastActiveWindow == i)
                jsWindow.setActive();
        }
    };

    /**
     * Write object state data for serialisation
     * @method
     * @returns {Object} serialData  Object serialisation data
     */
    JSWindow.prototype.writeObject = function () {
        var serialData = new Object();
        serialData.size = this.getSize();
        serialData.position = this.getPosition();
        serialData.options = this.options;
        serialData.options.title = this.title;
        serialData.options.icon = this.icon;
        if (this.maximised) {
            serialData.maximised = this.maximised;
            serialData.restoreSize = this.restoreSize;
            serialData.restorePosition = this.restorePosition;
        }

        serialData.expanded = this.expanded;
        serialData.zIndex = this.container.style.zIndex;
        serialData.tabs = new Array();
        for (var i = 0; i < this.tabs.length; i++) {
            serialData.tabs[i] = this.tabs[i].writeObject();
            if (this.tabs[i] == this.lastActiveTab)
                serialData.lastActiveTab = i;
        }
        return serialData;
    };

    /**
     * Close window
     * @method
     */
    JSWindow.prototype.close = function () {
        _this = this;
        this.manager.windows = $(this.manager.windows).map(function () {
            if (this != _this)
                return this;
        });
        this.container.parentNode.removeChild(this.container);
    };

    /**
     * Window tab
     * @constructor
     * @param {JSWindow} jsWindow  Tab title
     * @param {Element} contents  Element to wrap
     * @param {string} title  Tab title
     * @param {string} icon  Tab icon uri
     */

    JSTab = function (jsWindow, contents, title, icon) {
        var _this = this;
        this.jsWindow = jsWindow;
        this.contents = contents;
        $(this.contents).addClass('JSWM_window_tab');
        this.tabButton = document.createElement('LI');
        $(this.tabButton).addClass('JSWM_tabButton');
        this.tabButton.jsTab = this;

        this.tabLabel = this.tabButton.appendChild(document.createElement('DIV'));
        var closeButton = this.tabLabel.appendChild(new ImageButton(function () {
            _this.close();
        }, JSWMImages.closeTab, 'x', 'close', JSWMImagesHover.closeTab));
        $(closeButton).addClass('JSWM_tabClose');

        this.titleLabel = this.tabLabel.appendChild(document.createElement('DIV'));
        this.setTitle(title, icon);
        $(this.tabLabel).addClass('JSWM_tabLabel');
        $(this.tabButton).mousedown(function () {
            _this.setActive();
            _this.jsWindow.setActive();
        });
       return this;
    };

    /**
     * Set the tab title
     * @method
     * @param {string} title  The new title
     * @param {string} icon  Tab icon uri
     */
    JSTab.prototype.setTitle = function (title, icon) {
        this.title = title;
        $(this.titleLabel).empty();
        var span = this.titleLabel.appendChild(document.createElement('SPAN'));
        span.appendChild(document.createTextNode(this.title));
        var titleSpace = $(this.titleLabel).width() - 20;
        JSWMtruncate(title, span, this.tabButton, titleSpace, 25);
        this.titleLabel.title = title;
        this.icon = icon;
        $(this.tabLabel).css({
            backgroundImage: 'url("' + this.icon + '")'
        });
    };

    /**
     * Set tab as active, shortcut to JSWindow.setActiveTab()
     * @method
     */
    JSTab.prototype.setActive = function () {
        this.jsWindow.setActiveTab(this);
    };

    /**
     * Return the tab button HTML object
     * @method
     * @return {Element}  The tab button
     */
    JSTab.prototype.getButton = function () {
        return this.tabButton;
    };

    /**
     * Close the tab
     * @method
     */
    JSTab.prototype.close = function () {
        _this = this;
        this.jsWindow.contents.removeChild(this.contents); // remove contents
        this.tabButton.parentNode.removeChild(this.tabButton); // remove button
        this.jsWindow.tabs = $(this.jsWindow.tabs).map(function () {
            if (this != _this)
                return this;
        });

        if (this.jsWindow.lastActiveTab == this && this.jsWindow.tabs.length)
            this.jsWindow.tabs[0].setActive();
        this.jsWindow.redrawTabList();
    };

    /**
     * Write object state data for serialisation
     * @method
     * @returns {Object} serialData  Object serialisation data
     */
    JSTab.prototype.writeObject = function () {
        var serialData = new Object();
        serialData.title = this.title;
        serialData.icon = this.icon;
        serialData.innerHTML = this.contents.innerHTML;
        return serialData;
    };


    /**
     * Read serialised object state data into the tab
     * @method
     * @param {String} serialData  Object serialisation data
     */
    JSTab.prototype.readObject = function (serialData) {
        this.setTitle(serialData.title, serialData.icon)
        this.contents.innerHTML = serialData.innerHTML;
    };

})(jQuery);
