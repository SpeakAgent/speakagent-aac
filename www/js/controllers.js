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
    // console.log("position came back ", position);
    $scope.locationData.position = position;

    var lat = parseFloat(position.coords.latitude);
    var lng = parseFloat(position.coords.longitude);

    var latlng = new google.maps.LatLng(lat, lng);

    $scope.updateDistanceToFavorites(lat, lng);

    // console.log("kicking off geocode via google maps: ", latlng);
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
              // console.log("Found location data " + $scope.locationData.address);
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
    // console.log('Doing save location ', $scope.locationData);

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
    // console.log('Saving location to local storage ', $scope.locationData);
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
      localStorage.setItem("location.favorites", '[{"name":"Grandmas House","lat":33.9052104,"lng":-83.3989904,"accuracy":53,"address":"1140 Ivywood Drive, Athens, GA 30606, USA"},{"name":"House of Barack","lat":38.897677,"lng":-77.0365298,"accuracy":17,"address":"1600 Pennsylvania Avenue Northwest, Washington, DC, USA"},{"name":"Sears Tower","lat":41.878876,"lng":-87.635915,"accuracy":89,"address":"233 S Wacker Dr, Chicago, IL 60606, USA"},{"name":"Seattle Central Library","lat":47.606701,"lng":-122.33250,"accuracy":55,"address":"1000 4th Ave, Seattle, WA 98104, USA"}]');
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

.controller('LoginCtrl', function($scope, $http, $rootScope){
  // Form data for the login modal
  $scope.loginData = {};
  $scope.authToken = $rootScope.authToken;
  // Perform logout
  $scope.doLogout = function() {
    console.log('Doing logout');
    $rootScope.authToken = null;
    $scope.authToken = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('userProfile');
    $rootScope.userProfile = null;

    console.log('Logout complete');
  };

  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {
    console.log('Doing login', $scope.loginData);
    $scope.loginData.username = $scope.loginData.username.toLowerCase();

    // Handle login
    var tokenAuthURL = $rootScope.apiBaseAuthHREF+'api-token-auth/';
    var responsePromise = $http.post(tokenAuthURL,
      {
        'username': $scope.loginData.username,
        'password': $scope.loginData.password
      });

    responsePromise.success(function(data, status, headers, config) {
        console.log(data);

        if($rootScope.AnalyticsAvailable) {
          analytics.trackEvent('System', 'LoginSuccess', $scope.loginData.username);
          analytics.setUserId($scope.loginData.username);
          analytics.addCustomDimension('userid', $scope.loginData.username);
        }
        $rootScope.authToken = data.token;
        localStorage.setItem('authToken', $rootScope.authToken);
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
          console.log('caching boards data...');
          for (var i=0; i<data.count; i++) {
            var board = data.results[i];
            localStorage.setItem('board-'+board.id, JSON.stringify(board));
            console.log('storing board: ' + board.id);
          }
          window.location = '#/app/wordlists/5/'; //TODO: Make better.
        });

        boardResponsePromise.error(function(data, status, headers, config) {
            console.log("Unable to fetch boards data for caching. " + status);
        });

        // FIXME: This could probably be encapsulated in a user object/service
        // or something, but for now, $rootScope it is.
        //
        profileResponsePromise.success(function(data, status, headers, config) {
          console.log('caching user profile...', data);
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
        console.log("Unable to fetch auth token. " + status);
    });
  };
})

.controller('AppCtrl', function($scope, $ionicModal, $timeout, $http) {
  // TODO: Eliminate this if unnecessary.

})


.controller('WordlistsCtrl', ['$stateParams', '$scope', '$http',
  '$rootScope', '$interval', '$timeout',
  'deleteAssemblyBarTileAtIndex', 'setClearOnAdd',
  'getAssemblyBarText', 'assemblyBarTileCount', 'addTileToAssemblyBar',
  'getAssemblyBarTiles', 'removeUnspokenFoldersFromAssemblyBar',

  function($stateParams, $scope, $http, $rootScope, $interval, $timeout,
    deleteAssemblyBarTileAtIndex, setClearOnAdd, getAssemblyBarText,
    assemblyBarTileCount, addTileToAssemblyBar, getAssemblyBarTiles,
    removeUnspokenFoldersFromAssemblyBar) {

  $scope.maxAssemblyBarTiles = 8;

  console.log('State params ', $stateParams);
  console.log('User profile ', $rootScope.userProfile);

  var board = $stateParams.board ? $stateParams.board : '1';
  board = parseInt(board, 10);

  if($rootScope.AnalyticsAvailable) {
    analytics.trackView('Board ID: '+board);
  }

  $scope.TTSAvailable = $rootScope.TTSAvailable;

  $scope.currentBoard = board;
  $scope.wordlists = [];
  var cachedBoard = $rootScope.boards[board]; //localStorage.getItem('board-'+board);
  if (cachedBoard) {
    console.log('Found cached data for board: ' + board);
    $scope.wordlists = cachedBoard.tile_set.sort(function(a, b) {
      return a.ordinal - b.ordinal;
    });
  } else {
    console.log('No cache found. Logout/login required.');
  }

  $interval(function() {
    console.log('Calling refreshWowContext(timer)');
    $rootScope.$broadcast('refreshWowContext');
    }, 5000); // make 10 more like 30 or so

  /*********
  /* Load QuickResponse Tiles
  /*********/
  var cachedQuickResponseBoard = $rootScope.boards[$rootScope.currentQuickResponseBoard];
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
  var currentWOWBoard = $rootScope.boards[$rootScope.currentWOWBoard];
  if (currentWOWBoard){
    $scope.wowResponseTiles = currentWOWBoard.tile_set.sort(function(a, b) {
      return a.ordinal - b.ordinal;
    });
  } else {
    console.log('current wow board should be ', $rootScope.currentWOWBoard);
    console.log('boards ', $rootScope.boards);
    console.log('Could not retrieve board cache for WOW tiles. Please logout and login again.');
  }
  /***** end of sidebars *************/

  $rootScope.currentBeacon = null;
  $scope.$on('beaconsDiscovered', function(e, beacons) {
    console.log('in beaconsDiscovered. e: ', e, ' beacons: ', JSON.stringify(beacons));

    try {
        var closestBeacon = null;
        var distanceThreshold = 1;
        // idunno what that value should be, we'll need to play with it.

        var theBeacon = angular.forEach(beacons.beaconList, function(b) {
          if (b.distance < distanceThreshold) {
            if ((!closestBeacon) || (b.distance < closestBeacon.distance)) {
              closestBeacon = b;
            }
          }
        });

        if (closestBeacon) {
          console.log('closest beacon is ', closestBeacon);
          if (($rootScope.currentBeacon.major != closestBeacon.major) ||
              ($rootScope.currentBeacon.minor != closestBeacon.minor)) {
            console.log('beacon changed; refreshing wow context');
            $rootScope.currentBeacon = closestBeacon;
            $scope.$broadcast('refreshWowContext');
          }
        }

        // closestBeacon.major and closestBeacon.minor have the id's you need to pair against your WOWLocation records to get the board # }
    } catch (e) {
      console.log('Exception finding closest beacon: ', e);
    }
  });

  $scope.$on('refreshWowContext', function(e) {
    console.log('Refreshing WOW Context.');

    var newBoard = null;

    try {
      // Get day of week
      //
      var date = new Date();
      var daynum = date.getDay();
      var is_weekend =(daynum === 0) || (daynum === 6);

      var hour = date.getHours();
      var hourStr = (hour < 10) ? '0' : '';
      hourStr = hourStr + hour.toString() + ':00:00';

      var wow_configs = $rootScope.userProfile.wow_configs;

      if ((wow_configs) && (wow_configs.length)) {
        var bestMatch = 0;
        angular.forEach(wow_configs, function(wow) {

          var matchCount = 0;

          if (wow.time === hourStr) {
            matchCount = matchCount + 1;
          }

          if ( (wow.day === 'all') ||
               (wow.day === 'weekend' && is_weekend) ||
               (wow.day === 'weekday' && !is_weekend) ||
               (wow.day === 'm' && daynum === 1) ||
               (wow.day === 't' && daynum === 2) ||
               (wow.day === 'w' && daynum === 3) ||
               (wow.day === 'th' && daynum === 4) ||
               (wow.day === 'f' && daynum === 5) ) {
            matchCount = matchCount + 1;
          }

          if (($rootScope.currentBeacon) && (wow.location))  {
            if ( (wow.beacon_major === $rootScope.currentBeacon.major) &&
                  (wow.beacon_minor === $rootScope.currentBeacon.minor) ) {
             matchCount = matchCount + 1;
             }
          }

          // If we matched more things than any previous match, then
          // select that board.

          if (matchCount > bestMatch) {
            newBoard = wow.board.id;
            bestMatch = matchCount;
          }
        }); //foreach
      }
    } catch (e) {
      console.log('Exception trying to figure out new WOW board: ', e);
    }

    if ((newBoard) && (newBoard !==$scope.currentWOWBoard)) {
      $timeout(function() {
        console.log('New WOW Board selected: ', newBoard);
        $scope.currentWOWBoard = newBoard;
        var board = $scope.boards[$scope.currentWOWBoard];
        if (board){
          $scope.wowResponseTiles = board.tile_set.sort(function(a, b) {
            return a.ordinal - b.ordinal;
          });
        }
      });
    }

    console.log('Done refreshing WOW Context.');
  });

  $scope.wordTileClicked = function(obj) {

    console.log('word tile clicked: ', obj);

    if (obj.phrase) {

      // Remove folders with no "phrase" value from the assembly bar.
      //
      removeUnspokenFoldersFromAssemblyBar();

      // Limit the length of the assembly bar to the most number of tiles
      // we can handle.
      //
      if (assemblyBarTileCount() < $scope.maxAssemblyBarTiles) {
        console.log('phrase to add: ' + obj.phrase);
        addTileToAssemblyBar(obj);
      }
    }

    console.log('assembly bar phrase: ', getAssemblyBarTiles());
    if($rootScope.AnalyticsAvailable) {
      analytics.trackEvent('Boards', 'TileAdd', obj.phrase);
    }
  };

  $scope.deleteButtonClicked = function() {
    console.log('delete button clicked.');

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
    console.log('speak button clicked.');

    var wordsToSpeak = getAssemblyBarText();
    console.log('about to speak: ', wordsToSpeak);

    if ($rootScope.TTSAvailable) {
      ttsPlugin.speak(wordsToSpeak);
      setClearsOnAdd(true);
    }
    if($rootScope.AnalyticsAvailable) {
      analytics.trackEvent('Boards', 'SpeakPhrase', $wordsToSpeak);
    }
  };

  $scope.quickResponseTileClicked = function(obj) {
    console.log('quick response button clicked.', obj);

    var wordsToSpeak = obj.phrase;
    console.log('about to speak: ', wordsToSpeak);

    if ($rootScope.TTSAvailable) {
      ttsPlugin.speak(wordsToSpeak);
    }
    if($rootScope.AnalyticsAvailable) {
      analytics.trackEvent('Boards', 'SpeakPhraseQuick', $wordsToSpeak);
    }
  };

  $scope.attentionRequested = function() {
    console.log('User hit the bell button');
  };


}])



.controller('SearchCtrl',  ['$scope', '$rootScope', '$window',
   'addTileToAssemblyBar',

  function($scope, $rootScope, $window, addTileToAssemblyBar) {

  $scope.searchForTile = "";
  $scope.matchedTiles = [];

  console.log("scope ", $scope);

  $scope.findMatchingTiles = function() {
    $scope.matchedTiles = [];
    if (!$scope.searchForTile) {
      return;
    }

    var matchStr = $scope.searchForTile.toLowerCase();
    var matchedTiles = [];

    console.log('findMatchingTiles', $scope);
    console.log('looking for ', matchStr);

    angular.forEach($rootScope.boards, function(boardTiles, boardNumber) {
      console.log('board ', boardNumber);
      angular.forEach(boardTiles.tile_set, function(tile) {
        var m = tile.name.toLowerCase().indexOf(matchStr);
        if (m >= 0) {
          matchedTiles.push({'board' : boardNumber, 'tile': tile});
        }
      });
    });

    // de-duplicate

    var seen = {};

    var dedupedTiles = matchedTiles.filter(function(item) {
        return seen.hasOwnProperty(item.tile.name) ? false : (seen[item.tile.name] = true);
    });

    // Sort remaining into view

    $scope.matchedTiles = dedupedTiles.sort(function(a, b) {
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

      console.log('Navigate to ....', match);
      $window.location.href = "#/app/wordlists/" + target;
    }
    // <a href="#/app/wordlists/{{match.board}}">

  }

}]);
