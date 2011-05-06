// ==UserScript==
// @name           Castle Age Uber Gifter & Auto Alchemy
// @icon           https://castle-age-uber-gifter-auto-alchemy.googlecode.com/files/48x48.png
// @namespace      Gifter
// @author         Xotic750
// @description    Self gifting and alchemy combining for Castle Age
// @include        http://apps.facebook.com/castle_age/*
// @include        https://apps.facebook.com/castle_age/*
// @include        http://web3.castleagegame.com/castle_ws/*
// @include        https://web3.castleagegame.com/castle_ws/*
// @require        https://ajax.googleapis.com/ajax/libs/jquery/1.6/jquery.min.js
// @version        1.19.0
// @license        GPL version 3 or any later version (http://www.gnu.org/copyleft/gpl.html)
// @compatability  Firefox 3.0+, Chrome 4+, Flock 2.0+
// ==/UserScript==

/*jslint white: true, browser: true, devel: true, undef: true, nomen: true, bitwise: true, immed: true, regexp: true */
/*global window,GM_xmlhttpRequest,GM_setValue,GM_getValue,unsafeWindow,GM_registerMenuCommand */

(function () {
    String.prototype.uniConv = function () {
        return this.replace(/\\u([0-9a-f]{4})/gmi, function ($1, $2) {
            return String.fromCharCode(parseInt($2, 16));
        });
    };

    String.prototype.unescapeDouble = function () {
        var meta = {
                "t": "\t",
                "n": "\n",
                "r": "\r",
                "f": "\f",
                "b": "\b",
                '"': '"',
                "'": "'",
                "/": "/"
            };

        return this.replace(new RegExp("\\\\(.)", "gm"), function ($1, $2) {
            var chr = meta[$2];
            return chr;
        });
    };

    String.prototype.unescapeCAHTML = function () {
        return this.uniConv().unescapeDouble();
    };

    var Uber = {
        version: '1.19.0',

        $ju: null,

        isFb: true,

        fbappid: '',

        display: false,

        keepGoing: true,

        log: function log(msg) {
            if (window.console && typeof console.log === 'function') {
                console.log('UG:' + Uber.version + ' |' + (new Date()).toLocaleTimeString() + '| ' + msg);
            }
        },

        send: function (uid, num, gift) {
            if (num && Uber.keepGoing) {
                Uber.$ju.ajax({
                    type: 'POST',
                    url: "gift_accept.php?act=create&gift=" + gift,
                    data: {'ids[]': uid},
                    error:
                        function (XMLHttpRequest, textStatus, errorThrown) {
                            Uber.alert("Error sending last gift: " + textStatus);
                            num -= 1;
                            Uber.send(uid, num, gift);
                        },
                    success:
                        function (data, textStatus, XMLHttpRequest) {
                            Uber.receive(uid, num, gift);
                        }
                });
            } else if (!num) {
                Uber.alert('All gifts have been delivered!!!');
                Uber.remove_sub_panel('ca_gift');
            }
        },

        receive: function (uid, num, gift) {
            function waiting() {
                num -= 1;
                if (Uber.display) {
                    Uber.get_sub_panel('ca_gift').text(num + " gifts waiting for delivery...");
                }

                Uber.send(uid, num, gift);
            }

            if (num) {
                Uber.$ju.ajax({
                    type: 'POST',
                    url: "gift_accept.php?act=acpt&rqtp=gift&uid=" + uid,
                    data: {'ids[]': uid},
                    error:
                        function (XMLHttpRequest, textStatus, errorThrown) {
                            Uber.alert("Error receiving last gift: " + textStatus);
                            waiting();
                        },
                    success:
                        function (data, textStatus, XMLHttpRequest) {
                            waiting();
                        }
                });
            }
        },

        gift: function () {
            var ca_gift    = Uber.get_sub_panel('ca_gift'),
                selectGift = Uber.$ju("<select></select>"),
                selectFreq = Uber.$ju("<select></select>"),
                buttonSub  = Uber.$ju("<button >GO!>"),
                gifts      = ['Random Soldier'],
                maxFreq    = 40,
                nameCnt    = {},
                it         = 0;

            Uber.$ju.ajax({
                url: 'gift.php',
                async: false,
                error:
                    function (XMLHttpRequest, textStatus, errorThrown) {
                        Uber.alert("Unable to get gift list: " + textStatus);
                    },
                success:
                    function (data, textStatus, XMLHttpRequest) {
                        data = Uber.isFb ? data.unescapeCAHTML() : data;
                        var giftDiv = Uber.$ju("#" + Uber.fbappid + "giftContainer div[id^='" + Uber.fbappid + "gift']", data);
                        if (!giftDiv.length) {
                            Uber.alert("Could not find gift list");
                        } else {
                            giftDiv.each(function (index) {
                                var giftName = Uber.$ju(this).text().trim().replace(/!/i, '');
                                nameCnt[giftName] = nameCnt[giftName] ? nameCnt[giftName] : 1;
                                if (gifts.indexOf(giftName) >= 0) {
                                    nameCnt[giftName] += 1;
                                    giftName += ' #' + nameCnt[giftName];
                                }

                                gifts.push(giftName);
                            });
                        }
                    }
            });

            for (it = 0; it < gifts.length; it += 1) {
                selectGift.append("<option value='" + it + "'>" + gifts[it] + "</option");
            }

            for (it = 1; it <= maxFreq; it += 1) {
                selectFreq.append("<option value='" + it + "'>" + it + "</option>");
            }

            buttonSub.click(function () {
                Uber.$ju.ajax({
                    url: 'index.php',
                    error:
                        function (XMLHttpRequest, textStatus, errorThrown) {
                            Uber.alert("Unable to do alchemy: " + textStatus);
                        },
                    success:
                        function (data, textStatus, XMLHttpRequest) {
                            data = Uber.isFb ? data.unescapeCAHTML() : data;
                            var accountEl = Uber.$ju('#navAccountName', data),
                                idOk      = false,
                                FBID;

                            if (Uber.isFb) {
                                if (accountEl.length) {
                                    FBID = accountEl.attr('href');
                                    FBID = FBID ? FBID.match(/id=(\d+)/i) : undefined;
                                    FBID = FBID && FBID.length === 2 ? parseInt(FBID[1], 10) : undefined;
                                    if (typeof FBID === 'number' && FBID > 0) {
                                        idOk = true;
                                    }
                                }

                                if (!idOk && data) {
                                    FBID = data.match(new RegExp('[\\s"]*?user[\\s"]*?:(\\d+),', 'i'));
                                    FBID = FBID && FBID.length === 2 ? parseInt(FBID[1], 10) : undefined;
                                    if (typeof FBID === 'number' && FBID > 0) {
                                        idOk = true;
                                    }
                                }
                            } else {
                                accountEl = Uber.$ju("img[src*='graph.facebook.com']");
                                FBID = accountEl.attr('src');
                                FBID = FBID ? FBID.match(new RegExp("facebook.com\\/(\\d+)\\/")) : undefined;
                                FBID = FBID && FBID.length === 2 ? parseInt(FBID[1], 10) : undefined;
                                if (typeof FBID === 'number' && FBID > 0) {
                                    idOk = true;
                                }
                            }

                            if (idOk) {
                                Uber.send(FBID, selectFreq.val(), Uber.$ju(":selected", selectGift).attr("value"));
                                ca_gift.html("Preparing gifts...");
                                Uber.display = true;
                            } else {
                                Uber.alert("Cannot find your user ID.  CA servers are possibly busy.  Please try again later.");
                                Uber.remove_sub_panel('ca_gift');
                            }
                        }
                });
            });

            ca_gift.html("Select gift and amount...<br/>");
            ca_gift.append(selectGift, selectFreq, buttonSub);

        },

        do_alch: function (form, num) {
            if (num > 0 && form.size()) {
                var data = {},
                    id = form.attr("id");

                form.children("input").each(function () {
                    data[this.name] = this.value;
                });

                if (Uber.display) {
                    Uber.get_sub_panel('ca_alch').text(num + " items remaining...");
                }

                Uber.$ju.ajax({
                    url: 'alchemy.php',
                    data: data,
                    error:
                        function (XMLHttpRequest, textStatus, errorThrown) {
                            Uber.alert("Unable to do alchemy: " + textStatus);
                        },
                    success:
                        function (data, textStatus, XMLHttpRequest) {
                            var result = Uber.$ju("#" + Uber.fbappid + "results_main_wrapper div.results span.result_body, #" + id, Uber.isFb ? data.unescapeCAHTML() : data),
                                txt    = result.text().trim();

                            if (/You have created/.test(txt)) {
                                setTimeout(function () {
                                    num -= 1;
                                    Uber.do_alch(form, num);
                                }, 3000);
                            } else if (txt === '') {
                                setTimeout(function () {
                                    Uber.do_alch(form, num);
                                }, 3000);
                            } else {
                                Uber.alert('All items could not be combined.  You do not have sufficient materials to combine ' + num + ' itmes.');
                                Uber.remove_sub_panel('ca_alch');
                            }
                        }
                });
            } else {
                Uber.alert('All items have been combined.');
                Uber.remove_sub_panel('ca_alch');
            }
        },

        alchemy: function () {
            var ca_alch = Uber.get_sub_panel('ca_alch');

            Uber.$ju.ajax({
                url: 'alchemy.php',
                error:
                    function (XMLHttpRequest, textStatus, errorThrown) {
                        Uber.alert("Unable to get alchemy list: " + textStatus);
                    },
                success:
                    function (data, textStatus, XMLHttpRequest) {
                        var divs       = Uber.$ju("#" + Uber.fbappid + "recipe_list div.statsT2 table div.alchemyRecipeBack", Uber.isFb ? data.unescapeCAHTML() : data),
                            selectReci = Uber.$ju("<select></select>"),
                            selectFreq = Uber.$ju("<select></select>"),
                            buttonSub  = Uber.$ju("<button>Combine</button>"),
                            freq       = [1, 2, 3, 4, 5, 10, 20, 50, 100, 200, 500];

                        divs.children().each(function () {
                            var el = Uber.$ju(this);
                            selectReci.append("<option value='" + Uber.$ju("form", el).attr("id") + "'>" + Uber.$ju("div.recipeTitle", el).text().trim().replace(/RECIPES: Create | to join your army!/g, '') + "</option>");
                        });

                        Uber.$ju.each(freq, function () {
                            selectFreq.append("<option value='" + this + "'>" + this + "</option>");
                        });

                        buttonSub.click(function () {
                            Uber.do_alch(Uber.$ju("#" + Uber.$ju(":selected", selectReci).attr("value"), divs), selectFreq.val());
                            ca_alch.html("Preparing to combine items...You will be notified upon completion.");
                            Uber.display = true;
                        });

                        ca_alch.html("Choose your item and quantity from the menu.<br/>");
                        ca_alch.append(selectReci, selectFreq, buttonSub);
                    }
            });
        },

        get_panel: function () {
            var ca_panel = Uber.$ju("#ca_panel");
            if (!ca_panel.size()) {
                ca_panel = Uber.$ju("<div id='ca_panel'></div>").css({
                    'font-family': "'Lucida Grande', tahoma, verdana, arial, sans-serif",
                    'font-size'  : '10px',
                    position     : 'absolute',
                    top          : Uber.$ju("#" + Uber.fbappid + "main_bn").offset().top + 10 + 'px',
                    left         : Uber.$ju("#" + Uber.fbappid + "main_bn").offset().left + 'px',
                    padding      : '5px',
                    border       : 'solid 1px black',
                    background   : 'white',
                    zIndex       : '4'
                });

                ca_panel.appendTo(document.body);
            }

            return ca_panel;
        },

        remove_panel: function () {
            var ca_panel = Uber.get_panel();
            if (!ca_panel.children().size()) {
                ca_panel.remove();
            }
        },

        get_sub_panel: function (id) {
            var ca_sub_panel = Uber.$ju("#" + id);
            if (!ca_sub_panel.size()) {
                ca_sub_panel = Uber.$ju("<div id='" + id + "'>loading...please wait~</div>").css({
                    'font-family': "'Lucida Grande', tahoma, verdana, arial, sans-serif",
                    'font-size'  : '10px',
                    height       : '60px',
                    width        : '300px',
                    padding      : '5px',
                    border       : 'solid 1px black',
                    background   : 'white'
                });

                Uber.get_panel().append(ca_sub_panel);
            }

            return ca_sub_panel;
        },

        remove_sub_panel: function (id) {
            var ca_sub_panel = Uber.get_sub_panel(id);
            ca_sub_panel.remove();
            Uber.remove_panel();
        },

        check_update: function (currentVersion) {
            var now = new Date().getTime(),
                /*jslint newcap: false */
                check = GM_getValue("uberUpdateLC");
                /*jslint newcap: true */

            check = (check ? parseInt(check, 10) : 0) + 86400000;
            if (check < now) {
                /*jslint newcap: false */
                GM_xmlhttpRequest({
                /*jslint newcap: true */
                    method: 'GET',
                    url: 'https://castle-age-uber-gifter-auto-alchemy.googlecode.com/files/Uber-Gifter.user.js',
                    headers: {'Cache-Control': 'no-cache'},
                    onload: function (resp) {
                        var rt = resp.responseText,
                            remote_version = (new RegExp("@version\\s*(.*?)\\s*$", "m").exec(rt))[1],
                            script_name = (new RegExp("@name\\s*(.*?)\\s*$", "m").exec(rt))[1];

                        if (remote_version > currentVersion) {
                            if (confirm("There is a newer version of " + script_name + " available.  Would you like to update?")) {
                                setTimeout(function () {
                                    unsafeWindow.location.href = "https://castle-age-uber-gifter-auto-alchemy.googlecode.com/files/Uber-Gifter.user.js";
                                }, 3000);
                            }
                        }

                        /*jslint newcap: false */
                        GM_setValue("uberUpdateLC", '' + now);
                        /*jslint newcap: true */
                    }
                });
            }
        },

        put_link: function () {
            var loc = Uber.$ju("#" + Uber.fbappid + "nvbar_nvl").find(".nvbar_middle:first");
            if (loc.length && !Uber.$ju("#uber_gifter").length) {
                var html_start = '<div id="uber_gifter" class="nvbar_start"></div>',
                    html_gift = '<div><div class="nvbar_start"></div><div class="nvbar_middle">' +
                                '<a id="uber_gift" href="#"><span class="hover_header">' +
                                'UG</span></a></div><div class="nvbar_end"></div></div>',
                    html_alchemy = '<a id="uber_alchemy" href="#">' +
                                   '<span class="hover_header">UA</span></a>';
                Uber.$ju(loc).removeAttr("style");
                Uber.$ju(html_start).css({}).prependTo(loc.parent());
                Uber.$ju(html_alchemy).css({}).appendTo(loc);
                Uber.$ju(html_gift).css({}).prependTo(loc.parent().parent());
                Uber.$ju("#uber_gift").bind('click', Uber.gift);
                Uber.$ju("#uber_alchemy").bind('click', Uber.alchemy);
            }
        },

        alert: function (message) {
            var alert_panel = Uber.$ju("#uber_alert_panel");
            if (!alert_panel.size()) {
                alert_panel = Uber.$ju("<div id='uber_alert_panel'><br />" + message +
                                "<br /><br /><br /><div><button id='uber_alert_ok'>ok</button></div></div>").css({
                    'font-family': "'Lucida Grande', tahoma, verdana, arial, sans-serif",
                    'font-size'  : '10px',
                    position     : 'fixed',
                    top          : (window.innerHeight / 2) + 'px',
                    left         : Uber.$ju("#" + Uber.fbappid + "main_bn").offset().left + 300 + 'px',
                    height       : '100px',
                    width        : '300px',
                    padding      : '5px',
                    border       : 'solid 1px black',
                    background   : 'white',
                    textAlign    : 'center',
                    zIndex       : '5'
                });

                alert_panel.appendTo(document.body);

                Uber.$ju("#uber_alert_ok").click(function () {
                    Uber.$ju("#uber_alert_panel").remove();
                });
            }
        },

        injectScript: function (url) {
            var inject = document.createElement('script');
            inject.setAttribute('type', 'text/javascript');
            inject.setAttribute('src', url);
            (document.head || document.getElementsByTagName('head')[0]).appendChild(inject);
        },

        waitForjQuery: function () {
            if (window.jQuery && window.jQuery().jquery === "1.6") {
                Uber.log("jQuery ready ...");
                if (!Uber.$ju) {
                    Uber.$ju = window.jQuery.noConflict();
                } else {
                    throw "Uber.$ju is already in use!";
                }

                Uber.$ju(function () {
                    Uber.isFb = window.location.href.indexOf('apps.facebook.com/castle_age/') >= 0;
                    Uber.fbappid = Uber.isFb ? 'app46755028429_' : '';
                    Uber.init_chrome();
                    if (window.navigator.userAgent.toLowerCase().indexOf('firefox') !== -1 ? true : false) {
                        Uber.init_firefox();
                    }
                }).ready();
            } else {
                Uber.log("Waiting for jQuery ...");
                window.setTimeout(Uber.waitForjQuery, 100);
            }
        },

        init: function () {
            if (!window.jQuery || window.jQuery().jquery !== "1.6") {
                Uber.log("Inject jQuery");
                Uber.injectScript("https://ajax.googleapis.com/ajax/libs/jquery/1.6/jquery.min.js");
            }

            Uber.waitForjQuery();
        },

        init_chrome: function () {
            Uber.put_link();
            var globalCont = Uber.$ju("#" + Uber.fbappid + "globalContainer");
            if (globalCont.length) {
                globalCont.bind('DOMNodeInserted', Uber.put_link);
            }
        },

        init_firefox: function () {
            Uber.check_update(Uber.version);
            /*jslint newcap: false */
            GM_registerMenuCommand("CA - Uber Gifter", Uber.gift);
            GM_registerMenuCommand("CA - Auto Alchemy", Uber.alchemy);
            /*jslint newcap: true */
        }
    };

    Uber.init();
}());
