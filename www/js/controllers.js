angular.module('speakagentAAC.controllers', ['ionic', 'speakagentAAC.controllers.AssemblyBar' ])

.controller('LocationCtrl', function($scope, $ionicPopup, $timeout) {
  if($rootScope.AnalyticsAvailable) {
    analytics.trackView('Location');
  }
  $scope.locationData = { saveButtonDisabled: true,
                          proximityThreshold: 16.0/1000,
                          debug: true };
  $scope.geocoder = new google.maps.Geocoder();

  // Called when the user taps the location button in the interface

  $scope.getLocation = function() {
    navigator.geolocation.getCurrentPosition($scope.locationRetrieved,
      $scope.locationFailed, { enableHighAccuracy: true });
  };

  // Called when the browser is granted permissions for the location
  //
  $scope.locationRetrieved = function(position) {
    $scope.locationData.position = position;

    var lat = parseFloat(position.coords.latitude);
    var lng = parseFloat(position.coords.longitude);

    var latlng = new google.maps.LatLng(lat, lng);

    $scope.updateDistanceToFavorites(lat, lng);

    $scope.geocoder.geocode({'latLng': latlng}, function(results, status) {
      $scope.geocodeComplete(results, status);
    });


  };

  // Called when the geocoder finishes
  //
  $scope.geocodeComplete = function(results, status) {

    // Pessimistically assume no place was found
    //
    var address = null;
    var saveButtonDisabled = true;

    if (status == google.maps.GeocoderStatus.OK) {
      if (results[0]) {
        angular.forEach(results, function (location,i ) {
          angular.forEach(location.types, function (locationType, j) {
            if (locationType == "street_address") {
              // Set the address from the address
              address = location.formatted_address;
              // Enable the save button
              if ($scope.locationData.favorites) {
                saveButtonDisabled = false;
              }
              return false;
            }
          });
        });
      } else {
        $scope.locationUnavailable("Could not determine an address for this location.");
      }
    } else {
        $scope.locationUnavailable("Could not determine an address for this location.");
    }

    // Make sure the interface updates correctly.
    //
    $scope.$apply(function(s) {
      // Set the address from the address
      s.locationData.address = address;
      // Enable the save button
      s.locationData.saveButtonDisabled = saveButtonDisabled;
    });

  };

  // Figure out what blew up, if possible, and let the user know.
  $scope.locationFailed = function(error) {
    $scope.locationData.saveButtonDisabled = true;
    $scope.locationData.address = null;

    if (error == PositionError.PERMISSION_DENIED) {
      $scope.locationUnavailable("Access to location data was denied by user.");
    } else if (error == PositionError.POSITION_UNAVAILABLE) {
      $scope.locationUnavailable("Location temporarily unavailable.");
    } else {
      $scope.locationUnavailable("Could not determine location.");
    }
  };

  // Display pop-up
  $scope.locationUnavailable = function(message) {
    var alertPopup = $ionicPopup.alert({
      title: "Location Unavailable",
      template: message
    });
    alertPopup.then(function(res) {
      $scope.locationData.saveButtonDisabled = true;
      $scope.locationData.address = null;
    });
  };

  // Save the location when the user taps the save button
  $scope.doSaveLocation = function() {

    var savePopup = $ionicPopup.show({
      template: '<input type="text" ng-model="locationData.name">',
      title: 'Save Location',
      subTitle: 'Enter a name for this address',
      scope: $scope,
      buttons: [
        { text: 'Cancel' },
        {
          text: '<b>Save</b>',
          type: 'button-positive',
          onTap: function(e) {
            if (!$scope.locationData.name) {
              e.preventDefault();
            } else {
              return $scope.locationData.name;
            }
          }
        },
      ]
    });
    savePopup.then(function(res) {
      $scope.addLocationToFavorites();
    });
  };

  // Create a favorite entry and store it for later.
  $scope.addLocationToFavorites = function() {

    // If we have no favorites, then bail.
    if (!$scope.locationData.favorites) {
      return false;
    }

    var fave = { name : $scope.locationData.name,
                 lat : $scope.locationData.position.coords.latitude,
                 lng : $scope.locationData.position.coords.longitude,
                 accuracy : $scope.locationData.position.coords.accuracy,
                 address: $scope.locationData.address,
                 distance: 0 };

    $scope.locationData.favorites.push(fave);
    $scope.storeFavoriteLocations();
    return true;
  };

  $scope.storeFavoriteLocations = function() {
    var saved = [];
    if ($scope.locationData.favorites) {
      angular.forEach($scope.locationData.favorites, function(fave, i) {
        var saveFave = angular.copy(fave);
        delete(saveFave.distance);
        delete(saveFave.distanceStr);
        saved.push(saveFave);
      });

      localStorage.setItem("location.favorites", angular.toJson(saved));
    }
  };

  // Retrieve our favorite locations from local storage, if possible.
  $scope.fetchFavoriteLocations = function() {

    // If there is debugging on AND we don't have any saved faves, then
    // add a few to play with.
    //
    if ($scope.locationData.debug && !localStorage.getItem("location.favorites")) {
      localStorage.setItem("location.favorites", '[{"name":"Sears Tower","lat":41.878876,"lng":-87.635915,"accuracy":89,"address":"233 S Wacker Dr, Chicago, IL 60606, USA"},{"name":"Seattle Central Library","lat":47.606701,"lng":-122.33250,"accuracy":55,"address":"1000 4th Ave, Seattle, WA 98104, USA"}]');
    }

    var faves = angular.fromJson(localStorage.getItem("location.favorites")) || [];

    return faves;
  };

  // Updates the favorites array with distance from current location.
  $scope.updateDistanceToFavorites = function(lat, lng) {

    var closest = null;

    angular.forEach($scope.locationData.favorites, function(fave, i) {
      var distance = Util.distanceLatLng(lat, lng, fave.lat, fave.lng);
      fave.distance = distance;
      if ((!closest) || (distance < closest.distance)) {
        closest = fave;
      }

      fave.distanceStr = (distance < 1.5) ?
        Math.floor(distance*1000) + 'm' :
        (Math.floor(distance*10)/10) + 'km';
    });

    if (closest && closest.distance <= $scope.locationData.proximityThreshold) {
      $scope.locationData.myLocation = closest;
    } else {
      $scope.locationData.myLocation = null;
    }
  };


  // If we have local storage support, fetch the favorites, otherwise
  // make sure save is disabled and our storage is null.
  if(typeof(Storage) !== "undefined") {
    $scope.locationData.favorites = $scope.fetchFavoriteLocations();
  } else {
    $scope.locationData.saveButtonDisabled = true;
    $scope.locationData.favorites = null;
  }


})

.controller('SettingsCtrl', function($scope, $ionicModal, $rootScope, $timeout) {
  $scope.authToken = $rootScope.authToken;

  // Create the Settings modal that we will use later
  $ionicModal.fromTemplateUrl('templates/settings.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.settingsModal = modal;
  });
  // Triggered in the login modal to close it
  $scope.closeSettings = function() {
    $scope.settingsModal.hide();
  };
  // Open the Settings modal
  $scope.showSettings = function() {
    $scope.settingsModal.show();
    if($rootScope.AnalyticsAvailable) {
      analytics.trackView('Settings');
    }
  };

  $scope.switchToLogin = function() {
    $scope.settingsModal.hide();
    $scope.loginModal.show();
  };

})

.controller('LoginCtrl', function($scope, $http, $rootScope, $ionicLoading){
  // Form data for the login modal
  $scope.loginData = {};
  $scope.authToken = $rootScope.authToken;
  $scope.username = $rootScope.username;
  // Perform logout
  $scope.doLogout = function() {
    $rootScope.authToken = null;
    $scope.authToken = null;

    var clearKeys = [
      'authToken',
      'username',
      'userProfile',
      'location.favorites',
    ];

    var storageLength = localStorage.length;
    for(var i=0; i<storageLength; i++) {
      var key = localStorage.key(i);
      if (key.indexOf('board-') === 0) {
        clearKeys.push(key);
      }
    }

    angular.forEach(clearKeys, function(key) {
      localStorage.removeItem(key);
    });

    $rootScope.userProfile = null;

  };

  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {
    $scope.loginData.username = $scope.loginData.username.toLowerCase();
    $scope.loginError = '';

    $ionicLoading.show({
          template: 'Logging in...'
        });
    // Handle login
    var tokenAuthURL = $rootScope.apiBaseAuthHREF+'api-token-auth/';
    var responsePromise = $http.post(tokenAuthURL,
      {
        'username': $scope.loginData.username,
        'password': $scope.loginData.password
      });

    responsePromise.success(function(data, status, headers, config) {
        $ionicLoading.hide();
        $ionicLoading.show({
              template: 'Caching data & profile from server...'
            });

        if($rootScope.AnalyticsAvailable) {
          analytics.trackEvent('System', 'LoginSuccess', $scope.loginData.username);
          analytics.setUserId($scope.loginData.username);
          analytics.addCustomDimension('dimension1', $scope.loginData.username);
        }
        $rootScope.authToken = data.token;
        $rootScope.username = $scope.loginData.username;
        localStorage.setItem('authToken', $rootScope.authToken);
        localStorage.setItem('username', $rootScope.username);
        $http.defaults.headers.common.Authorization = 'Token ' + $rootScope.authToken;

        // Cache Data for Offline Use
        // TODO: Fix this to be much nicer
        var boardResponsePromise = $http.get($rootScope.apiBaseHREF + 'boards/?page_size=100',
          { cache: true }
        );

        // FIXME: We need some way to get the profile either by username or
        // to have the api token to return the id or profile link back so that we
        // can fetch it.  This works for now, tho, I think.
        //
        var profileResponsePromise = $http.get($rootScope.apiBaseAuthHREF + 'userprofile/',
          { cache: true }
        );
        boardResponsePromise.success(function(data, status, headers, config) {
          for (var i=0; i<data.count; i++) {
            var board = data.results[i];
            localStorage.setItem('board-'+board.id, JSON.stringify(board));
            $rootScope.boards[board.id] = board;
          }
          $ionicLoading.hide();
          window.location = '#/app/wordlists/5/'; //TODO: Make better.
        });

        boardResponsePromise.error(function(data, status, headers, config) {
          $ionicLoading.hide();
          console.log("Unable to fetch boards data for caching. " + status);
        });

        // FIXME: This could probably be encapsulated in a user object/service
        // or something, but for now, $rootScope it is.
        //
        profileResponsePromise.success(function(data, status, headers, config) {
          var results = data.results[0];
          var user = {};
          user.first_name = results.first_name;
          user.last_name = results.last_name;
          user.email = results.email;
          user.avatar = results.avatar;
          user.wow_configs = results.wow_configs;
          localStorage.setItem('userProfile', JSON.stringify(user));
          $rootScope.userProfile = user;
        });

        profileResponsePromise.error(function(data, status, headers, config) {
            console.log("Unable to fetch user profile for caching. " + status);
        });

    });

    responsePromise.error(function(data, status, headers, config) {
        $ionicLoading.hide();
        console.log("Unable to fetch auth token. " + status);
        $scope.loginError = "Unable to fetch auth token. " + status;
    });
  };
})

.controller('AppCtrl', function($scope, $ionicModal, $timeout, $http) {
  // TODO: Eliminate this if unnecessary.

})


.controller('WordlistsCtrl', ['$stateParams', '$scope', '$http',
  '$rootScope', '$interval', '$timeout', 'fetchBoardFromLocalStorage',
  'deleteAssemblyBarTileAtIndex', 'setClearOnAdd', 'clearAssemblyBar',
  'getAssemblyBarText', 'assemblyBarTileCount', 'addTileToAssemblyBar',
  'getAssemblyBarTiles', 'removeUnspokenFoldersFromAssemblyBar', '$ionicLoading',

  function($stateParams, $scope, $http, $rootScope, $interval, $timeout,
    fetchBoardFromLocalStorage,
    deleteAssemblyBarTileAtIndex, setClearOnAdd, clearAssemblyBar,
    getAssemblyBarText, assemblyBarTileCount, addTileToAssemblyBar,
    getAssemblyBarTiles, removeUnspokenFoldersFromAssemblyBar, $ionicLoading) {

  $scope.maxAssemblyBarTiles = 8;
  $scope.WOWOverride = $rootScope.WOWOverride;

  var board = $stateParams.board ? $stateParams.board : '5';
  board = parseInt(board, 10);
  $scope.currentBoard = board;
  $rootScope.currentBoard = board;
  $scope.wordlists = [];

  if($rootScope.AnalyticsAvailable) {
    analytics.trackView('Board ID: '+board);
  }

  $scope.TTSAvailable = $rootScope.TTSAvailable;

  var cachedBoard = fetchBoardFromLocalStorage(board);
  if (cachedBoard) {
    $scope.wordlists = cachedBoard.tile_set.sort(function(a, b) {
      return a.ordinal - b.ordinal;
    });
  } else {
    console.log('No cache found. Logout/login required.');
  }

  /*********
  /* Load QuickResponse Tiles
  /*********/
  var cachedQuickResponseBoard = fetchBoardFromLocalStorage($rootScope.currentQuickResponseBoard);
  if (cachedQuickResponseBoard){
    $scope.quickResponseTiles = cachedQuickResponseBoard.tile_set.sort(function(a, b) {
      return a.ordinal - b.ordinal;
    });
  } else {
    console.log('Could not retrieve board cache for Quick Response tiles. Please logout and login again.');
  }
  /*********
  /* Load WoW Tiles
  /*********/
  var currentWOWBoard = fetchBoardFromLocalStorage($rootScope.currentWOWBoard);
  if (currentWOWBoard){
    $scope.wowResponseTiles = currentWOWBoard.tile_set.sort(function(a, b) {
      return a.ordinal - b.ordinal;
    });
  } else {
    console.log('Could not retrieve board cache for WOW tiles. Please logout and login again.');
  }
  /***** end of sidebars *************/

  $rootScope.currentBeacon = null;

  $timeout(function() {
    $scope.$broadcast('refreshWowContext');
  });

  $scope.$on('beaconsDiscovered', function(e, beacons) {

    var closestBeacons = [];

    try {


      // FIXME!!!!! SHOULD BE 10 METERS vvvvv  but .2 is for dev
      var distanceThreshold = .2; // meters


      angular.forEach(beacons.beaconList, function(b) {
        if ((b.distance >= 0.0) && (b.distance < distanceThreshold)) {
          closestBeacons.push(b);
        }
      });

      closestBeacons = closestBeacons.sort(function(a, b) {
        return a.distance - b.distance;
      });

      var beaconsChanged = false;
      if (closestBeacons.length == $rootScope.closestBeacons.length) {

        var len = closestBeacons.length;

        for(var i=0; (i<len) && (!beaconsChanged); i++) {
          var b1 = closestBeacons[i];
          var b2 = $rootScope.closestBeacons[i];
          if ((b1.major != b2.major) || (b1.minor != b2.minor)) {
            beaconsChanged = true;
          }
        }
      } else {
        beaconsChanged = true;
      }

      if (beaconsChanged) {
        // console.log('Beacons changed. old: ', JSON.stringify($rootScope.closestBeacons), 'new: ', JSON.stringify(closestBeacons));
        $rootScope.closestBeacons = closestBeacons;
        $scope.$broadcast('refreshWowContext');
      }
    } catch (e) {
      console.log('Exception finding closest beacon: ', e);
    }
  });

 $scope.$on('refreshWowContext', function(e) {

    var newBoard = $rootScope.defaultWOWBoard;
    // console.log('Default wow board '+ newBoard);
    // console.log('Current WOW board '+ $rootScope.currentWOWBoard);

    try {
      // Get day of week
      //
      var date = new Date();
      var daynum = date.getDay();
      var is_weekend =(daynum === 0) || (daynum === 6);


      var hour = date.getHours();
      var hourStr = (hour < 10) ? '0' : '';
      hourStr = hourStr + hour.toString();
      var min  = date.getMinutes();
      var minStr  = (min  < 10) ? '0' : '';
      minStr = minStr + min.toString();
      var nowTime = hourStr + minStr;

      // This is tricky -- the logic is
      // if we have a location, that's a strong affinity.
      // if we have a time, that's a medium-high affinity
      // if we have a specific day, that's a medium affinity
      // if we have an "any" day and nothing else, that's a low affinity

      // This yields:

      // match none: 0
      // match any day: 3
      // a specific day: 5
      // specific time, any day: 11
      // any day and location: 15
      // specifc day and time: 16
      // specific day and location: 20
      // time and location: 26
      // all 3: 31

      var wow_configs = $rootScope.userProfile.wow_configs;

      if ((wow_configs) && (wow_configs.length) && (!$rootScope.WOWOverride)) {

        var maxStrength = 0;

        angular.forEach(wow_configs, function(wow) {

          var matchStrength = 0;

          // Match strength is less (12) or stronger (15) based on the
          // position of the beacon in the (already sorted) list of
          // nearest beacons. This means 12-15, 17-20, 23-26, or 28-31
          // which still fits all of the above stuff.
          //
          if ((wow.location) && ($rootScope.closestBeacons.length)) {
            // console.log('Checking beacons for ', JSON.stringify(wow));
            angular.forEach($rootScope.closestBeacons, function(beacon, index) {
              // console.log('index ' + index + ', ', JSON.stringify(beacon));

              if ( (wow.beacon_major == beacon.major) &&
                  (wow.beacon_minor == beacon.minor) ) {
                matchStrength = 15 - Math.floor(3*index/$rootScope.closestBeacons.length*100)/100;
              console.log('Matched beacon maj: ' + beacon.major + ' min: ' + beacon.minor +
                 ' with strength of ' + matchStrength);
              }
            });
          }

          if (wow.time) {

            var times = wow.time.split(':');
            var startTime = times[0]+times[1];
            var duration = wow.duration ? wow.duration : 30;
            var endDate = new Date();
            endDate.setHours(times[0]);
            endDate.setMinutes(times[1]);
            endDate = new Date(endDate.getTime() + duration*60000);
            var endHours = endDate.getHours();
            endHours = (endHours < 10) ? '0' + endHours.toString() : endHours.toString();
            var endMins = endDate.getMinutes();
            endMins = (endMins < 10) ? '0' + endMins.toString() : endMins.toString();
            var endTime = endHours + endMins;

            if ((nowTime >= startTime) && (nowTime < endTime)) {
              // console.log('Matched time: ',  startTime, nowTime, endTime, duration);
              matchStrength = matchStrength + 11;
            } else {
              // console.log('Time comparison (notmatched): ', startTime, nowTime, endTime, duration);
            }
          }

          if ((matchStrength == 1) && (wow.day === 'all')) {
            matchStrength = maxStrength + 3;
          }

          if ( (wow.day === 'weekend' && is_weekend) ||
               (wow.day === 'weekday' && !is_weekend) ||
               (wow.day === 'm' && daynum === 1) ||
               (wow.day === 't' && daynum === 2) ||
               (wow.day === 'w' && daynum === 3) ||
               (wow.day === 'th' && daynum === 4) ||
               (wow.day === 'f' && daynum === 5) ) {
            matchStrength = matchStrength + 5;
          }

          if ((matchStrength > 0) && (matchStrength >= maxStrength)) {
            maxStrength = matchStrength;
            // console.log('New board might now be: ', wow.board.id, ' because strength is ', matchStrength);;
            newBoard = wow.board.id;
            $rootScope.currentWOWBoard = newBoard;
          }

        }); //foreach
      } else {
        newBoard = $rootScope.currentWOWBoard;
      }
    } catch (e) {
      console.log('Exception trying to figure out new WOW board: ', e);
    }

    if ((newBoard) && (newBoard !== $rootScope.currentWOWBoard)) {
      $timeout(function() {

        console.log('SWITCHING WOW: from: ' + $rootScope.currentWOWBoard +
          ' to: ' + newBoard);
        $rootScope.currentWOWBoard = newBoard;
        var board = fetchBoardFromLocalStorage($rootScope.currentWOWBoard);
        if (board) {
          console.log('board loaded and we are go!');
          $scope.wowResponseTiles = board.tile_set.sort(function(a, b) {
            return a.ordinal - b.ordinal;
          });
        }
      });
    }
  });

  $scope.wordTileClicked = function(evt, number) {

    var match = $scope.wordlists.filter(
      function(o) {
        return o.id === number;
      }
    );

    if (match.length < 1) {
      return;
    }

    obj = match[0];

    // If we're in edit mode, we wanna set the hidden status on
    // the tile.
    //
    if ($rootScope.editMode) {
      // flag tile as  dirty so when edit is turned off it will save
      //
      obj.dirty = true;
      obj.hidden = obj.hidden ? false : true;
      evt.preventDefault();
      return;
    }

    // If the item is hidden, don't fire an href or any other link.
    //
    if (obj.hidden) {
      evt.preventDefault();
      return;
    }

    if (obj.phrase) {

      // Remove folders with no "phrase" value from the assembly bar.
      //
      removeUnspokenFoldersFromAssemblyBar();

      // Clear the assembly bar if clear-on-add was set.
      //
      clearAssemblyBar(false);

      // Limit the length of the assembly bar to the most number of tiles
      // we can handle.
      //
      if (assemblyBarTileCount() < $scope.maxAssemblyBarTiles) {
        addTileToAssemblyBar(obj);
      }
    }

    if($rootScope.AnalyticsAvailable) {
      analytics.trackEvent('Boards', 'TileAdd', obj.phrase);
    }
  };

  $scope.wowTileClicked = function(evt, number) {
    var currentWOWBoard = fetchBoardFromLocalStorage($rootScope.currentWOWBoard);

    var match = currentWOWBoard.tile_set.filter(
      function(o) {
        return o.id === number;
      }
    );

    if (match.length < 1) {
      return;
    }

    obj = match[0];

    if (obj.phrase) {
      removeUnspokenFoldersFromAssemblyBar();

      // Clear the assembly bar if clear-on-add was set.
      //
      clearAssemblyBar(false);

      if (assemblyBarTileCount() < $scope.maxAssemblyBarTiles) {
        addTileToAssemblyBar(obj);
      }
    }

    if($rootScope.AnalyticsAvailable) {
      analytics.trackEvent('Boards', 'WOWTileAdd', obj.phrase);
    }
  };

  $scope.deleteButtonClicked = function() {

    deleteAssemblyBarTileAtIndex(-1);

    // var removed = $scope.assemblyBarPhrase.pop();
    $scope.TTSAvailable = $rootScope.TTSAvailable;

    // If they delete something, then let's assume they don't want
    // to clear the phrase if they add a new tile.
    //
    setClearOnAdd(false);

    // $rootScope.assemblyBarPhrase = $scope.assemblyBarPhrase;
    if($rootScope.AnalyticsAvailable) {
      analytics.trackEvent('Boards', 'DeleteClick', removed);
    }
  };

  $scope.speakButtonClicked = function() {

    var wordsToSpeak = getAssemblyBarText();
    setClearOnAdd(true);

    if ($rootScope.TTSAvailable) {
      ttsPlugin.speak(wordsToSpeak);
    }
    if($rootScope.AnalyticsAvailable) {
      analytics.trackEvent('Boards', 'SpeakPhrase', wordsToSpeak);
    }
  };

  $scope.quickResponseTileClicked = function(obj) {

    var wordsToSpeak = obj.phrase;

    if ($rootScope.TTSAvailable) {
      ttsPlugin.speak(wordsToSpeak);
    }
    if($rootScope.AnalyticsAvailable) {
      analytics.trackEvent('Boards', 'SpeakPhraseQuick', wordsToSpeak);
    }
  };

  $scope.attentionRequested = function() {
    $rootScope.ringBell();
  };

  $rootScope.toggleEdit = function() {

    // Save "dirty" tiles back to the cache and reset the dirty flag.
    //
    if ($rootScope.editMode) {

      var board = $scope.currentBoard;

      angular.forEach($scope.wordlists, function(tile) {
        if (tile.dirty) {
          var cachedTiles = $rootScope.boards[board].tile_set.filter(
            function(tempTile) {
              return (tempTile.id === tile.id);
            });
          cachedTiles[0].hidden = tile.hidden;
          delete(tile.dirty);
        }
      });

      // Persist it to local storage
      localStorage.setItem('board-'+board, JSON.stringify($rootScope.boards[board]));
    }

    $rootScope.editMode = !$rootScope.editMode;
  };

}])

.directive('onLongPress', function($timeout) {
  return {
    restrict: 'A',
    link: function($scope, $elm, $attrs) {
      $elm.bind('touchstart', function(evt) {
        $scope.longPress = true;
        $timeout(function() {
          if ($scope.longPress) {
            $scope.$apply(function() {
              $scope.$eval($attrs.onLongPress);
            });
          }
        }, 600);
      });

      $elm.bind('touchend', function(evt) {
        $scope.longPress = false;
        if ($attrs.onTouchEnd) {
          $scope.$apply(function() {
            $scope.$eval($attrs.onTouchEnd);
          });
        }
      });
    }
  };
})

.controller('WOWOverrideCtrl', function($scope, $rootScope, $timeout) {
  // Controller for WOW Overrides
  $scope.wowConfigs = $rootScope.userProfile.wow_configs;
  $scope.currentWOWBoard = $rootScope.currentWOWBoard;
  $scope.WOWOverride = $rootScope.WOWOverride;

  $scope.setWOWBoard = function(boardIndex){
    $rootScope.WOWOverride = true;
    $scope.currentWOWBoard = boardIndex;
    $rootScope.currentWOWBoard = $scope.currentWOWBoard;
    $scope.$broadcast('refreshWowContext');
    window.location = '#/app/wordlists/'+$rootScope.currentBoard; //TODO: Make better.
  }

  $scope.clearWOWOverride = function(){
    $rootScope.WOWOverride = false;
    $scope.WOWOverride = $rootScope.WOWOverride;
    $scope.$broadcast('refreshWowContext');
    window.location = '#/app/wordlists/'+$rootScope.currentBoard; //TODO: Make better.
  }
})

.controller('SearchCtrl',  ['$scope', '$rootScope', '$window',
   'addTileToAssemblyBar',

  function($scope, $rootScope, $window, addTileToAssemblyBar) {

  $scope.searchForTile = "";
  $scope.previousSearchForTile = "";

  $scope.matchedTiles = [];

  $scope.findMatchingTiles = function() {

    if (!$scope.searchForTile) {
      return;
    }

    var seen = {};

    // If we don't have the list of all tiles, build it the first
    // time here.
    //
    if (!$scope.allSearchableTiles) {
      $scope.allSearchableTiles = [];
      angular.forEach($rootScope.boards, function(boardTiles, boardNumber) {
        if (boardTiles) {
          var filteredTiles = boardTiles.tile_set.filter(function(tile) {
            return seen.hasOwnProperty(tile.name) ? false : (seen[tile.name] = true);
          });
          angular.forEach(filteredTiles, function(tile) {
            $scope.allSearchableTiles.push({ 'board' : boardNumber, 'tile' : tile });
          });
        }
      });
    }

    // Default search to all tiles that we built when the controller
    // loaded
    //
    var searchTiles = $scope.allSearchableTiles;
    var matchStr = $scope.searchForTile.toLowerCase();
    if ((matchStr.length > 1) && ($scope.previousSearchForTile.length<$scope.searchForTile.length)) {
      searchTiles = $scope.matchedTiles;
    }
    $scope.previousSearchForTile = $scope.searchForTile;

    var matchedTiles = [];

    angular.forEach(searchTiles, function(potential) {
      var m = potential.tile.name.toLowerCase().indexOf(matchStr);
      if (m >= 0) {
        matchedTiles.push(potential);
      }
    });

    // Sort remaining into view

    $scope.matchedTiles = matchedTiles.sort(function(a, b) {
      if (a.tile.name < b.tile.name) {
        return -1;
      }
      if (a.tile.name > b.tile.name) {
        return 1;
      }
      return 0;
    });

  };

  $scope.clearButtonClicked = function(evt) {
    $scope.searchForTile = "";
    $scope.matchedTiles = [];
    var input = document.getElementById('searchForTile');

    // This will wait half a second to refocus, i'm sure there's a better
    // way to do this angulary-like, but I CBA right now. It works.
    //
    setTimeout(function() { input.focus(); }, 500);
  };

  $scope.matchedTileClicked = function(index) {

    var match = $scope.matchedTiles[index];
    if (match) {
      addTileToAssemblyBar(match.tile);

      var target = match.tile.target ? match.tile.target : match.board;

      $window.location.href = "#/app/wordlists/" + target;
    }

  }

}]);
