
// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('speakagentAAC', ['ionic', 'speakagentAAC.controllers'])

.run(['$ionicPlatform', '$rootScope', '$location', '$http', '$timeout',
  '$interval', 'fetchBoardFromLocalStorage',
  function($ionicPlatform, $rootScope, $location, $http, $timeout,
    $interval, fetchBoardFromLocalStorage) {

  $rootScope.boards = [];
  $rootScope.defaultWOWBoard = 24; // Default WOW board ID
  $rootScope.defaultQuickResponseBoard = 25; // Quick response board ID
  $rootScope.defaultMainBoard = 5;

  $rootScope.currentWOWBoard = $rootScope.defaultWOWBoard;
  $rootScope.WOWOverride = false; // Switch this to true to block WOW board updates
  $rootScope.currentQuickResponseBoard = $rootScope.defaultQuickResponseBoard;

  $rootScope.beaconInterval = 30; // seconds
  $rootScope.contextInterval = 30; // seconds

  // Make sure we're always logged in
  if (!$rootScope.authToken) {
    if(localStorage.getItem('authToken') !== null) {
      $rootScope.authToken = localStorage.getItem('authToken');
      $http.defaults.headers.common.Authorization = 'Token ' + $rootScope.authToken;
    } else {
      console.log('no auth token stored');
      window.location = '#/app/login';
    }
    if(localStorage.getItem('username') !== null) {
      $rootScope.username = localStorage.getItem('username');
    } else {
      console.log('no username stored');
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

    // Moved this from ready() to run because sometimes on reload,
    // the board controller would run before the ready() function
    // which of course means that speech, estimotes, and board cache
    // aren't loaded yet.

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

    // Load the main, wow, and quick board
    //
    var boardNumber;
    for (boardNumber in [$rootScope.defaultMainBoard,
      $rootScope.defaultWOWBoard,
      $rootScope.defaultQuickResponseBoard]) {
      fetchBoardFromLocalStorage(boardNumber);
    }

    // Load the user profile
    //
    try {
      $rootScope.userProfile = JSON.parse(localStorage.getItem('userProfile'));
    } catch (e) {
      console.log('Exception while restoring user profile from cache: ', e);
    }
  }

  console.log('leaving RUN');

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
      if (Estimote) {
        $rootScope.estimoteIsAvailable = true;
        console.log('Estimote API is available. Waiting for beacons.');
        var beaconPing = 0;

        Estimote.startRangingBeacons(function(res) {
          beaconPing = beaconPing + 1;
          // console.log('Beacon ping #'+beaconPing);
          $rootScope.$broadcast('beaconsDiscovered', res);
        },
        function(res) {
          console.log('Estimote API failed to range.');
        },
        { interval : $rootScope.beaconInterval });

        // console.log('Waiting for replies.');
      }
    } catch (e) {
      $rootScope.estimoteIsAvailable = false;
      console.log('Estimote API is not available.');
    }

    $interval(function() {
      $rootScope.$broadcast('refreshWowContext');
    }, $rootScope.contextInterval);

    try {
      if (Media) {
        $rootScope.ringBell = function(){
          console.log('ringing bell');
          var bell = new Media('ding.mp3');
          bell.seekTo(0);
          bell.setVolume(0.5);
          bell.play();
        }
      }
    } catch (e) {
      console.log('Media is not available.');
      $rootScope.ringBell = function(){
        console.log('Family is all. - Hector "Tio" Salamanca');
      }
    }

    // Load the rest of the caches into memory asynchronously
    //
    $timeout(function() {
      var boardsLoaded = 0;
      try {
        var storageLength = localStorage.length;
        for(var i=0; i<storageLength; i++) {
          var key = localStorage.key(i);
          if (key.indexOf('board-') === 0) {
            var str = key.split('-')[1];
            var boardNumber = parseInt(str, 10);
            fetchBoardFromLocalStorage(boardNumber);
            boardsLoaded++;
          }
        }
        console.log(boardsLoaded + ' boards loaded from localStorage.');
      } catch (e) {
        console.log('Exception while restoring boards from cache: ', e);
      }
    });

  });

}])

.factory('fetchBoardFromLocalStorage', ['$rootScope', function($rootScope) {
  return function(boardNumber) {

    var ret = null;

    try {
      ret =  $rootScope.boards[boardNumber];
      if (ret) {
        return ret;
      }
    } catch (e) {
    }

    try {
      var key = 'board-' + boardNumber;
      ret = JSON.parse(localStorage.getItem(key));
      $rootScope.boards[boardNumber] = ret;
    } catch (e) {
      console.log('Could not load board #' + boardNumber + ' from cache.');
    }

    return ret;
  };
}])


.config(['$stateProvider', '$urlRouterProvider',
  function($stateProvider, $urlRouterProvider) {

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

    .state('app.wowoverride', {
      url: "/wow-override",
      views: {
        'menuContent' :{
          templateUrl: "templates/wow_override.html",
          controller: 'WOWOverrideCtrl'
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
  $urlRouterProvider.otherwise('/app/wordlists/' + 5);
}]);

