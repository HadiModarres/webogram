/*!
 * Webogram v0.7.0 - messaging web application for MTProto
 * https://github.com/zhukov/webogram
 * Copyright (C) 2014 Igor Zhukov <igor.beatle@gmail.com>
 * https://github.com/zhukov/webogram/blob/master/LICENSE
 */

'use strict';
/* global Config, templateUrl */

var extraModules = [];
if (Config.Modes.animations) {
    extraModules.push('ngAnimate');
}

// Declare app level module which depends on filters, and services
angular.module('myApp', [
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'ui.bootstrap',
    'mediaPlayer',
    'toaster',
    'izhukov.utils',
    'izhukov.mtproto',
    'izhukov.mtproto.wrapper',
    'myApp.filters',
    'myApp.services',
    /*PRODUCTION_ONLY_BEGIN
    'myApp.templates',
    PRODUCTION_ONLY_END*/
    'myApp.directives',
    'myApp.controllers'
].concat(extraModules)).config(['$locationProvider', '$routeProvider', '$compileProvider', 'StorageProvider', function ($locationProvider, $routeProvider, $compileProvider, StorageProvider) {
    $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|file|blob|filesystem|chrome-extension|app):|data:image\//);
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|file|tg|mailto|blob|filesystem|chrome-extension|app):|data:/);

    /*PRODUCTION_ONLY_BEGIN
    $compileProvider.debugInfoEnabled(false)
    PRODUCTION_ONLY_END*/

    if (Config.Modes.test) {
        StorageProvider.setPrefix('t_');
    }

    // parse the specified url and retrieve the decoded value of the specified parameter name
    function param(name, url) {
        var results = (new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)')).exec(url);

        if (!results) {
            return null;
        }

        if (!results[2]) {
            return '';
        }

        try {
            return JSON.parse(atob(decodeURIComponent(results[2].replace(/\+/g, ' '))));
        } catch (e) {
            return null;
        }
    }

    // open the auth popup, if we're in an iframe or open the popup in the master window on the current page
    // if webogram is opened directly, open the popup by redirecting to the homepage first
    function auth() {
        if (window.top.location.href === document.location.href) {
            document.location = '/#!auth';
        } else {
            window.top.location = window.top.location.href.split('#')[0] + '#!auth';
        }
    }

    // get the bot & user status from the URL passed as JSON - then Base64 encoded - string in parameter "b" and "u"
    var botStatus = param('b', document.location.href),
        userStatus = param('u', document.location.href);

    // if user isn't logged in, show the auth popup right away
    if (!userStatus || !userStatus.a) {
        auth();
        return;
    }

    // at this point we think the user is logged in, but we only know that by the user status URL parameter
    // we continue operations as normal but also spawn an AJAX request to check for the actual user status
    // when done, if needed we show the auth popup again, otherwise we do nothing
    $.ajax({
        method: 'GET',
        url: '/wp-admin/admin-ajax.php',
        data: {
            action: 'webogram_user_status'
        },
        dataType: 'json'
    }).done(function (response) {
        if (!response['authenticated']) {
            auth();
        }
    });

    // expose params to the rest of the app
    window.__webogram = {
        botStatus: botStatus,
        userStatus: userStatus
    };

    $routeProvider.when('/', {template: '', controller: 'AppWelcomeController'});
    $routeProvider.when('/login', {templateUrl: templateUrl('login'), controller: 'AppLoginController'});
    $routeProvider.when('/im', {templateUrl: templateUrl('im'), controller: 'AppIMController', reloadOnSearch: false});
    $routeProvider.otherwise({redirectTo: '/'});
}]);