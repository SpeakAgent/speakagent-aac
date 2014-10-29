
// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('speakagentAAC', ['ionic', 'speakagentAAC.controllers'])

.run(function($ionicPlatform, $rootScope, $location, $http) {
  $rootScope.boards = [];
  $rootScope.currentWOWBoard = 24; // Default WOW board ID
  $rootScope.quickResponseBoard = 25; // Quick response board ID

  // Make sure we're always logged in
  if (!$rootScope.authToken) {
    if(localStorage.getItem('authToken') !== null) {
      $rootScope.authToken = localStorage.getItem('authToken');
      $http.defaults.headers.common.Authorization = 'Token ' + $rootScope.authToken;
    } else {
      console.log('no auth token stored');
      window.location = '#/app/login';
    }
    if ((localStorage.getItem('apiBaseHREF') !== null) &&
        (localStorage.getItem('apiBaseAuthHREF') !== null) &&
        (localStorage.getItem('staticBaseHREF') !== null)) {
      $rootScope.apiBaseHREF = localStorage.getItem('apiBaseHREF');
      $rootScope.apiBaseAuthHREF = localStorage.getItem('apiBaseAuthHREF');
      $rootScope.staticBaseHREF = localStorage.getItem('staticBaseHREF');
    } else {
      $rootScope.apiBaseHREF = 'http://active-listener.herokuapp.com/v1/';
      $rootScope.apiBaseAuthHREF = 'http://active-listener.herokuapp.com/';
      $rootScope.staticBaseHREF = 'http://active-listener.herokuapp.com/static/';
      localStorage.setItem('apiBaseHREF', $rootScope.apiBaseHREF);
      localStorage.setItem('apiBaseAuthHREF', $rootScope.apiBaseAuthHREF);
      localStorage.setItem('staticBaseHREF', $rootScope.staticBaseHREF);
      console.log('set apiBaseHREF and apiBaseAuthHREF and staticBaseHREF');
    }

  }

  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      // org.apache.cordova.statusbar required
      ionic.Platform.fullScreen();
      StatusBar.hide();
    }
    try {
      if(analytics) {
        analytics.startTrackerWithId('UA-54749327-1');
        $rootScope.AnalyticsAvailable = true;
        console.log('Analytics instantiated.');
      }
    } catch (e) {
      $rootScope.AnalyticsAvailable = false;
      console.log('Analytics is unavailable.');
    }

    try {
      if(ttsPlugin) {
        var ret = ttsPlugin.initTTS(function ttsInitialized() {
          $rootScope.TTSAvailable = true;
          console.log('TTS is now Available');
        });
      }
    } catch (e) {
      console.log('TTS is not available.');
    }

    try {
      if (Estimote) {
        $rootScope.estimoteIsAvailable = true;
        console.log('Estimote API is available.');
        var beaconPing = 0;

        Estimote.startRangingBeacons(function(res) {
          beaconPing = beaconPing + 1;
          console.log('Beacon ping #'+beaconPing);
          $rootScope.$broadcast('beaconsDiscovered', res);
        },
        function(res) {
          console.log('Estimote API failed to range.');
        },
        { interval : 5 });

        console.log('Waiting for replies.');
      }
    } catch (e) {
      $rootScope.estimoteIsAvailable = false;
      console.log('Estimote API is not available.');
    }

    // Load caches into memory
    //

    var boardsLoaded = 0;
    try {
      var storageLength = localStorage.length;
      for(var i=0; i<storageLength; i++) {
        var key = localStorage.key(i);
        if (key.indexOf('board-') === 0) {
          var str = key.split('-')[1];
          var boardNumber = parseInt(str, 10);
          $rootScope.boards[boardNumber] = JSON.parse(localStorage.getItem(key));
          boardsLoaded++;
        }
      }

      console.log(boardsLoaded + ' boards loaded from cache.');
    } catch (e) {
      console.log('Exception while restoring cache...', e);
    }
  });

})

.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider
    .state('app', {
      url: "/app",
      abstract: true,
      templateUrl: "templates/menu.html",
      controller: 'AppCtrl'
    })

    .state('app.search', {
      url: "/search",
      views: {
        'menuContent' :{
          templateUrl: "templates/search.html",
          controller: 'SearchCtrl'
        }
      }
    })

    .state('app.login', {
      url: "/login",
      views: {
        'menuContent' :{
          templateUrl: "templates/login.html",
          controller: 'LoginCtrl'
        }
      }
    })

    .state('app.wordlists', {
      url: "/wordlists/{board}",
      views: {
        'menuContent' :{
          templateUrl: "templates/wordlists.html",
          controller: 'WordlistsCtrl'
        }
      }
    })

    .state('app.location', {
      url: "/location",
      views: {
        'menuContent' :{
          templateUrl: "templates/location.html",
          controller: 'LocationCtrl'
        }
      }
    });
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/wordlists/5');
});

