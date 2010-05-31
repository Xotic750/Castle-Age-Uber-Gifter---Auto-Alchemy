// ==UserScript==
// @name           Castle Age Uber Gifter & Auto Alchemy
// @namespace      Gifter
// @include        http://apps.facebook.com/castle_age/*
// @exclude        *#iframe*
// @require        http://jqueryjs.googlecode.com/files/jquery-1.3.2.min.js
// @version        1.17.3
// @license        GPL version 3 or any later version; http://www.gnu.org/copyleft/gpl.html
// @compatability  Firefox 3.0+, Chrome 4+, Flock 2.0+
// ==/UserScript==

/*jslint white: true, browser: true, devel: true, undef: true, nomen: true, bitwise: true, immed: true, regexp: true */
/*global $,GM_xmlhttpRequest,unsafeWindow,GM_registerMenuCommand */

var Uber = {
    version: '1.17.3',

    display: false,

    keepGoing: true,

    send: function (uid, num, gift) {
        if (num && this.keepGoing) {
            $.post("http://apps.facebook.com/castle_age/gift_accept.php?act=create&gift=" + gift, {'ids[]': uid}, function() {
                Uber.receive(uid, num, gift);
            });
        } else if (!num) {
            this.alert('All gifts have been delivered!!!');
            this.remove_sub_panel('ca_gift');
        }
    },

    receive: function (uid, num, gift) {
        if (num--) {
            $.get("http://apps.facebook.com/castle_age/gift_accept.php?act=acpt&rqtp=gift&uid=" + uid, function() {
                if (Uber.display) {
                    Uber.get_sub_panel('ca_gift').text(num + " gifts waiting for delivery...");
                }

                Uber.send(uid, num, gift);
            });
        }
    },

    gift: function () {
        var ca_gift = Uber.get_sub_panel('ca_gift'),
            selectGift = $("<select></select>"),
            selectFreq = $("<select></select>"),
            inputID    = $("<input></input>"),
            buttonSub  = $("<button >GO!>"),
            gifts      = ['Random Soldier'],
            freq       = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ,11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 25, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40];

        $.ajax({
            url: 'http://apps.facebook.com/castle_age/gift.php',
            async: false,
            error:
                function (XMLHttpRequest, textStatus, errorThrown) {
                    Uber.alert("Unable to get gift list: " + textStatus);
                },
            success:
                function (data, textStatus, XMLHttpRequest) {
                    data = data.split('<div style="clear: both;"></div>');
                    var j = -1;
                    for (var i = 0; i < data.length; i++) {
                        if (/app46755028429_gift1/.test(data[i])) {
                            j = i;
                            break;
                        }
                    }

                    if (j === -1) {
                        Uber.alert("Could not find gift list");
                    } else {
                        $('<div></div>').html(data[j]).find('div[id^="app46755028429_gift"]').each(function (index) {
                            var giftName = $.trim($(this).children().eq(0).html()).replace(/!/i, '');
                            if (gifts.indexOf(giftName) >= 0) {
                                giftName += ' #2';
                            }

                            gifts.push(giftName);
                        });
                    }
                }
        });

        $.each(gifts, function (idx) {
            selectGift.append("<option value='" + idx + "'>" + this + "</option");
        });

        $.each(freq, function () {
            selectFreq.append("<option value='" + this + "'>" + this + "</option>");
        });

        buttonSub.click(function () {
            $("<div></div>").load("party.php span.linkwhite a", function () {
                if (/id=(\d+)/.test($(this).children().attr("href"))) {
                    Uber.send(RegExp.$1, selectFreq.val(), $(":selected", selectGift).attr("value"));
                    ca_gift.html("Preparing gifts...");
                    Uber.display = true;
                } else {
                    Uber.alert("Cannot find your user ID.  CA servers are possibly busy.  Please try again later.");
                    Uber.remove_sub_panel('ca_gift');
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

            if (this.display) {
                this.get_sub_panel('ca_alch').text(num + " items remaining...");
            }

            $("<div></div>").load("alchemy.php div.results span.result_body, #" + id, data, function (responseText, textStatus, XMLHttpRequest) {
                var result = $(this), txt = $.trim(result.text());

                if (/You have created/.test(txt)) {
                    setTimeout(function () {
                        Uber.do_alch(result.children("form"), --num);
                    }, 3000);
                } else if (txt === '') {
                    setTimeout(function () {
                        Uber.do_alch(form, num);
                    }, 3000);
                } else {
                    Uber.alert('All items could not be combined.  You do not have sufficient materials to combine ' + num + ' itmes.');
                    Uber.remove_sub_panel('ca_alch');
                }
            });
        } else {
            this.alert('All items have been combined.');
            this.remove_sub_panel('ca_alch');
        }
    },

    alchemy: function () {
        var ca_alch = Uber.get_sub_panel('ca_alch'),
            divs = $("<div></div>");

        divs.load("alchemy.php div.statsT2 table div.alchemyRecipeBack", function (responseText, textStatus, XMLHttpRequest) {
            var selectReci = $("<select></select>"),
                selectFreq = $("<select></select>"),
                buttonSub  = $("<button>Combine</button>"),
                freq       = [1, 2, 3, 4, 5, 10, 20, 50, 100, 200, 500];

            divs.children().each(function (idx) {
                selectReci.append("<option value='" + $("form", $(this)).attr("id") + "'>" + $("div.recipeTitle", $(this)).text().replace(/RECIPES: Create | to join your army!/g, '') + "</option>");
            });

            $.each(freq, function () {
                selectFreq.append("<option value='" + this + "'>" + this + "</option>");
            });

            buttonSub.click(function () {
                Uber.do_alch($("#" + $(":selected", selectReci).attr("value"), divs), selectFreq.val());
                ca_alch.html("Preparing to combine items...You will be notified upon completion.");
                Uber.display = true;
            });

            ca_alch.html("Choose your item and quantity from the menu.<br/>");
            ca_alch.append(selectReci, selectFreq, buttonSub);
        });
    },

    get_panel: function () {
        var ca_panel = $("#ca_panel");
        if (!ca_panel.size()) {
            ca_panel = $("<div id='ca_panel'></div>").css({
                position : 'absolute',
                top      : $("#app46755028429_main_bn").offset().top + 10 + 'px',
                left     : $("#app46755028429_main_bn").offset().left + 'px',
                padding  : '5px',
                border   : 'solid 1px black',
                background : 'white',
                zIndex: '4'
            });

            ca_panel.appendTo(document.body);
        }

        return ca_panel;
    },

    remove_panel: function () {
        var ca_panel = this.get_panel();
        if (!ca_panel.children().size()) {
            ca_panel.remove();
        }
    },

    get_sub_panel: function (id) {
        var ca_sub_panel = $("#" + id);
        if (!ca_sub_panel.size()) {
            ca_sub_panel = $("<div id='" + id + "'>loading...please wait~</div>").css({
                height   : '60px',
                width    : '300px',
                padding  : '5px',
                border   : 'solid 1px black',
                background : 'white'
            });

            this.get_panel().append(ca_sub_panel);
        }

        return ca_sub_panel;
    },

    remove_sub_panel: function (id) {
        var ca_sub_panel = this.get_sub_panel(id);
        ca_sub_panel.remove();
        this.remove_panel();
    },

    check_update: function (currentVersion) {
        GM_xmlhttpRequest({
            method: 'GET',
            url: 'http://github.com/Xotic750/Castle-Age-Uber-Gifter---Auto-Alchemy/raw/master/Uber-Gifter.user.js',
            headers: {'Cache-Control': 'no-cache'},
            onload: function (resp) {
                var rt = resp.responseText,
                    remote_version = new RegExp("@version\\s*(.*?)\\s*$", "m").exec(rt)[1],
                    script_name = (new RegExp("@name\\s*(.*?)\\s*$", "m").exec(rt))[1];
                if (remote_version > currentVersion) {
                    if (confirm("There is a newer version of this script available.  Would you like to update?")) {
                        setTimeout(function () {
                            unsafeWindow.location.href = "http://github.com/Xotic750/Castle-Age-Uber-Gifter---Auto-Alchemy/raw/master/Uber-Gifter.user.js";
                        }, 3000);
                    }
                }
            }
        });
    },

    put_link: function () {
        var loc = $("#app46755028429_nvbar_nvl").find(".nvbar_middle:first");
        if (loc.length && !$("#uber_gifter").length) {
            var html_start = '<div id="uber_gifter" class="nvbar_start"></div>',
                html_gift = '<div><div class="nvbar_start"></div><div class="nvbar_middle">' +
                            '<a id="uber_gift" href="javascript:;"><span class="hover_header">' +
                            'UGift</span></a></div><div class="nvbar_end"></div></div>',
                html_alchemy = '<a id="uber_alchemy" href="javascript:;">' +
                               '<span class="hover_header">UAlchemy</span></a>';
            $(loc).removeAttr("style");
            $(html_start).css({}).prependTo(loc.parent());
            $(html_alchemy).css({}).appendTo(loc);
            $(html_gift).css({}).prependTo(loc.parent().parent());
            $("#uber_gift").bind('click', Uber.gift);
            $("#uber_alchemy").bind('click', Uber.alchemy);
        }
    },

    alert: function (message) {
        var alert_panel = $("#uber_alert_panel");
        if (!alert_panel.size()) {
            alert_panel = $("<div id='uber_alert_panel'><br />" + message +
                            "<br /><br /><br /><div><button id='uber_alert_ok'>ok</button></div></div>").css({
                position   : 'fixed',
                top        : (window.innerHeight / 2) + 'px',
                left       : $("#app46755028429_main_bn").offset().left + 300 + 'px',
                height     : '100px',
                width      : '300px',
                padding    : '5px',
                border     : 'solid 1px black',
                background : 'white',
                textAlign  : 'center',
                zIndex     : '5'
            });

            alert_panel.appendTo(document.body);

            $("#uber_alert_ok").click(function () {
                $("#uber_alert_panel").remove()
            });
        }
    },

    init_chrome: function () {
        this.put_link();
        var globalCont = $("#app46755028429_globalContainer");
        if (globalCont.length) {
            globalCont.bind('DOMNodeInserted', this.put_link);
        }
    },

    init_firefox: function () {
        this.check_update(this.version);
        GM_registerMenuCommand("CA - Uber Gifter", this.gift);
        GM_registerMenuCommand("CA - Auto Alchemy", this.alchemy);
    }
};

$(function () {
    if (navigator.userAgent.toLowerCase().indexOf('chrome') !== -1 ? true : false) {
        Uber.init_chrome();
    } else {
        Uber.init_firefox();
    }
});
