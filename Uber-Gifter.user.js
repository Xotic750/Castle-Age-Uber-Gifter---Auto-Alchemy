// ==UserScript==
// @name           Castle Age Uber Gifter & Auto Alchemy
// @namespace      Gifter
// @include        http://apps.facebook.com/castle_age/*
// @require        http://jqueryjs.googlecode.com/files/jquery-1.3.2.min.js
// @version        1.16.5
// ==/UserScript==

var display = false, keepGoing= true;
var is_chrome = navigator.userAgent.toLowerCase().indexOf('chrome') != -1 ? true : false;

function send(uid, num, gift) {
    if(num && keepGoing) {
        $.post("http://apps.facebook.com/castle_age/army.php?act=create&gift=" + gift, {'ids[]': uid}, function() {
            receive(uid, num, gift);
        });
    } else if(!num) {
        alert('All gifts have been delivered!!!');
        remove_sub_panel('ca_gift');
    }
}

function receive(uid, num, gift) {
    if(num--)
        $.get("http://apps.facebook.com/castle_age/army.php?act=acpt&rqtp=gift&uid=" + uid, function() {
            if(display)
                get_sub_panel('ca_gift').text(num + " gifts waiting for delivery...");
            send(uid, num, gift);
        });
}

function gift() {
    var ca_gift = get_sub_panel('ca_gift'),
        selectGift = $("<select></select>"),
        selectFreq = $("<select></select>"),
        inputID    = $("<input></input>"),
        buttonSub  = $("<button >GO!>"),
        gifts      = ['Random Soldier'],
        freq       = [1,5,10,25,50,100,250,500,1000,2500,5000,10000];

    $.ajax({
        url: 'http://apps.facebook.com/castle_age/gift.php',
        async: false,
        error:
            function (XMLHttpRequest, textStatus, errorThrown) {
                alert("Unable to get gift list: " + textStatus);
            },
        success:
            function (data, textStatus, XMLHttpRequest) {
                var friendList = [];
                $(data).find('#app46755028429_giftContainer').find('div[id*="app46755028429_gift"]').each(function (index) {
                    gifts.push($(this).children().eq(0).html());
                });
            }
    });

    $.each(gifts, function(idx) {
        selectGift.append("<option value='" + idx + "'>" + this + "</option");
    });

    $.each(freq, function() {
         selectFreq.append("<option value='"+this+"'>"+this+"</option>");
    });

    buttonSub.click(function() {
        $("<div></div>").load("party.php span.linkwhite a", function() {
            if(/id=(\d+)/.test($(this).children().attr("href"))) {
                send(RegExp.$1, selectFreq.val(), $(":selected", selectGift).attr("value"));
                ca_gift.html("Preparing gifts...");
                display = true;
            } else {
                alert("Cannot find your user ID.  CA servers are possibly busy.  Please try again later.");
                remove_sub_panel('ca_gift');
            }
        });
    });

    ca_gift.html("Select gift and amount...<br/>");
    ca_gift.append(selectGift, selectFreq, buttonSub);

}

function do_alch(form, num) {
    if(num > 0 && form.size()) {
        var data = {}, id = form.attr("id");

        form.children("input").each(function() {
            data[this.name] = this.value;
        });

        if(display)
            get_sub_panel('ca_alch').text(num + " items remaining...");

        $("<div></div>").load("alchemy.php div.results span.result_body, #"+id, data, function(responseText, textStatus, XMLHttpRequest) {
            var result = $(this), txt = $.trim(result.text());

            if(/You have created/.test(txt)) {
                setTimeout( function() {do_alch(result.children("form"), --num);}, 3000);
            } else if(txt == '') {
                setTimeout( function() {do_alch(form, num);}, 3000);
            } else {
                alert('All items could not be combined.  You do not have sufficient materials to combine ' +num+ ' itmes.');
                remove_sub_panel('ca_alch');
            }
        });
    } else {
        alert('All items have been combined.');
        remove_sub_panel('ca_alch');
    }
}

function alchemy() {
    var ca_alch = get_sub_panel('ca_alch'), divs = $("<div></div>");

    divs.load("alchemy.php div.statsT2 table div.alchemyRecipeBack", function(responseText, textStatus, XMLHttpRequest) {
        var selectReci = $("<select></select>"),
            selectFreq = $("<select></select>"),
            buttonSub  = $("<button>Combine</button>"),
            freq       = [1,2,3,4,5,10,20,50,100,200,500]
            ;

        divs.children().each(function(idx) {
            selectReci.append("<option value='"+$("form",$(this)).attr("id")+"'>"+$("div.recipeTitle", $(this)).text().replace(/RECIPES: Create | to join your army!/g,'')+"</option>");
        });

        $.each(freq, function() {
             selectFreq.append("<option value='"+this+"'>"+this+"</option>");
        });

        buttonSub.click(function() {
            do_alch($("#"+$(":selected", selectReci).attr("value"), divs), selectFreq.val());
            ca_alch.html("Preparing to combine items...You will be notified upon completion.");
            display = true;
        });
        ca_alch.html("Choose your item and quantity from the menu.<br/>");
        ca_alch.append(selectReci, selectFreq, buttonSub);
    });

}

function get_panel() {
    var ca_panel = $("#ca_panel");
    if(!ca_panel.size()) {
        ca_panel = $("<div id='ca_panel'></div>").css({
            position : 'absolute',
            top      : $("#app46755028429_main_bn").position().top + 10 + 'px',
            left     : $("#app46755028429_main_bn").position().left + 'px',
            padding  : '5px',
            border   : 'solid 1px black',
            background : 'white',
            zIndex: '4'
        });
        ca_panel.appendTo("#app_content_46755028429");
    }
    return ca_panel;
}

function remove_panel() {
    var ca_panel = get_panel();
    if(!ca_panel.children().size())
        ca_panel.remove();
}

function get_sub_panel(id) {
    var ca_sub_panel = $("#" + id);
    if(!ca_sub_panel.size()) {
        ca_sub_panel = $("<div id='"+id+"'>loading...please wait~</div>").css({
            height   : '60px',
            width    : '300px',
            padding  : '5px',
            border   : 'solid 1px black',
            background : 'white'
        });
        get_panel().append(ca_sub_panel);
    }
    return ca_sub_panel;
}

function remove_sub_panel(id) {
    var ca_sub_panel = get_sub_panel(id);
    ca_sub_panel.remove();
    remove_panel();
}

function check_update(currentVersion) {
    GM_xmlhttpRequest({
        method: 'GET',
        url: 'http://github.com/Xotic750/Castle-Age-Uber-Gifter---Auto-Alchemy/raw/master/Uber-Gifter.user.js',
        headers: {'Cache-Control': 'no-cache'},
        onload: function (resp) {
            var rt = resp.responseText;
            var remote_version = new RegExp("@version\\s*(.*?)\\s*$", "m").exec(rt)[1];
            var script_name = (new RegExp("@name\\s*(.*?)\\s*$", "m").exec(rt))[1];
            if (remote_version > currentVersion) {
                if(confirm("There is a newer version of this script available.  Would you like to update?")) {
                    setTimeout(function() {unsafeWindow.location.href = "http://github.com/Xotic750/Castle-Age-Uber-Gifter---Auto-Alchemy/raw/master/Uber-Gifter.user.js";}, 3000);
                }
            }
        }
    });
}

function put_link() {
    var loc = $("#app46755028429_nvbar_nvl").find(".nvbar_middle:first");
    if (loc.length && !$("#uber_gifter").length) {
        var html_start = '<div id="uber_gifter" class="nvbar_start"></div>';
        var html_gift = '<div><div class="nvbar_start"></div><div class="nvbar_middle"><a id="uber_gift" href="javascript:;"><span class="hover_header">Gift</span></a></div><div class="nvbar_end"></div></div>';
        var html_alchemy = '<a id="uber_alchemy" href="javascript:;"><span class="hover_header">Alchemy</span></a>';
        $(loc).removeAttr("style");
        $(html_start).css({}).prependTo(loc.parent());
        $(html_alchemy).css({}).appendTo(loc);
        $(html_gift).css({}).prependTo(loc.parent().parent());
        $("#uber_gift").bind('click', gift);
        $("#uber_alchemy").bind('click', alchemy);
    }
}

if (!is_chrome) {
    GM_registerMenuCommand("CA - Uber Gifter", gift );
    GM_registerMenuCommand("CA - Auto Alchemy", alchemy);
}

$(document).ready(function() {
    if (!is_chrome) {
        check_update('1.16.5');
    } else {
        put_link();
        var globalCont = $("#app46755028429_globalContainer");
        if (globalCont.length) {
            globalCont.bind('DOMNodeInserted', put_link);
        }
    }
});
