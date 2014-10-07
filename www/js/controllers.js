angular.module('speakagentAAC.controllers', ['ionic'])

.controller('LocationCtrl', function($scope, $ionicPopup, $timeout) {
  analytics.trackView('Location');
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
    analytics.trackView('Settings');
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
    console.log('Logout complete');
  }
  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {
    console.log('Doing login', $scope.loginData);

    // Simulate a login delay. Remove this and replace with your login
    // code if using a login system
    var tokenAuthURL = $rootScope.apiBaseAuthHREF+'api-token-auth/';
    var responsePromise = $http.post(tokenAuthURL,
      {
        'username': $scope.loginData.username,
        'password': $scope.loginData.password
      });

    responsePromise.success(function(data, status, headers, config) {
        console.log(data);
        analytics.trackEvent('System', 'LoginSuccess', $scope.loginData.username);
        analytics.setUserId($scope.loginData.username);
        $rootScope.authToken = data.token;
        localStorage.setItem('authToken', $rootScope.authToken);
        $http.defaults.headers.common.Authorization = 'Token ' + $rootScope.authToken;
        window.location = '#/app/wordlists/1/'; //TODO: Make better.
    });

    responsePromise.error(function(data, status, headers, config) {
        console.log("Unable to fetch auth token. " + status);
    });
  };
})

.controller('AppCtrl', function($scope, $ionicModal, $timeout, $http) {
  // TODO: Eliminate this if unnecessary.

})

.controller('WordlistsCtrl', function($stateParams, $scope, $http, $rootScope) {
  console.log('State params ', $stateParams);

  var board = $stateParams.board ? $stateParams.board : '1';
  analytics.trackView('Board ID: '+board);
  $scope.assemblyBarPhrase = $rootScope.assemblyBarPhrase;

  $scope.wordlists = [];
  var boardsListURL = $rootScope.apiBaseHREF+'boards/';
  var responsePromise = $http.get(boardsListURL + board + '/?page_size=100');

  responsePromise.success(function(data, status, headers, config) {
      console.log(data);
      $scope.wordlists = data.tile_set.sort(function(a, b) {
        return a.ordinal - b.ordinal;
      });
  });

  responsePromise.error(function(data, status, headers, config) {
      console.log("Unable to fetch symbols for board. " + status);
  });

  if ($rootScope.estimoteIsAvailable) {
      console.log('Estimotes are available; starting up.');
      Estimote.startRangingBeacons(function(res) {
          console.log('Estimote response: ', res);
      });
      console.log('Waiting for replies.');
  } else {
    console.log('Estimotes are not available. ');
  }

  ionic.onGesture('dragstart', function(e) {

    // find our element in the list, and make sure it's the tile and not
    // something inside it.
    //
    $scope.draggedElement = angular.element(e.srcElement);

    while (!$scope.draggedElement.hasClass('tile') && !$scope.draggedElement.hasClass('assembly-bar')) {
      $scope.draggedElement = $scope.draggedElement.parent();
    }

    if ($scope.draggedElement.hasClass('tile')) {

      // Mark it as being dragged
      $scope.draggedElement.addClass('dragging');

      // Record where the user touched it so we can track where it
      // moves to.
      //
      $scope.dragStartX =  e.gesture.touches[0].pageX;

      // Record which tile is actually moving
      //
      $scope.moveMeIndex = $scope.draggedElement.data('$scope').$index;

      // console.log('Moving tile #'+$scope.moveMeIndex);
      // var tiles = [];
      // $scope.assemblyBarPhrase.forEach(function(element) {
      //   tiles.push(element.name);
      // });

      // console.log('AssemblyBarPhrases are ', tiles);

      // Update our display.
      //
      $scope.$apply();

    } else {
      $scope.draggedElement = null;
      $scope.dragStartX = null;
      $scope.moveMeIndex = null;
    }
  }, document.getElementById('assembly-bar'));

  // Handle the actual DRAG
  //
  ionic.onGesture('drag', function(e) {

    if ($scope.nowMoving !== null) {

      // How far have we moved, horizontally speaking?
      var x = e.gesture.touches[0].pageX - $scope.dragStartX;

      // Find the tile that we're moving OVER

      var tile = $scope.findTileXY(e.gesture.touches[0].pageX, 0);

      if (tile) {

        // Find out which tile we will put the moving tile in front of.
        //
        var insertBeforeIndex = tile.data('$scope').$index;

        // Find and yoink the tile we are moving (the one under our finger)
        // from the list.
        var moved = $scope.assemblyBarPhrase.splice($scope.moveMeIndex, 1);


        // console.log('tile ', tile);
        // console.log('insertBeforeIndex ' + insertBeforeIndex);
        // console.log('moved ', moved);

        // Move the tile into position.
        //
        $scope.assemblyBarPhrase.splice(insertBeforeIndex, 0, moved[0]);

        // Update the index to reflect that we've moved it.
        //
        $scope.moveMeIndex = insertBeforeIndex;

        // var tiles = [];
        // $scope.assemblyBarPhrase.forEach(function(element) {
        //   tiles.push(element.name);
        // });

        // console.log('AssemblyBarPhrases are ', tiles);

        // Update the phrase.
        //
        $rootScope.assemblyBarPhrase = $scope.assemblyBarPhrase;
        $scope.$apply();
        }
    }

  }, document.getElementById('assembly-bar'));


  // We're done dragging.
  ionic.onGesture('dragend', function(e) {
    if ($scope.draggedElement) {
      $scope.draggedElement.css(ionic.CSS.TRANSFORM, '');
      angular.element($scope.draggedElement).removeClass('dragging');
    }
    $scope.draggedElement = null;
    $scope.dragStartX = null;
    $scope.moveMeIndex = null;
  }, document.getElementById('assembly-bar'));

  // Look in our list of tiles and find the tile that is under the x, y
  // coordinates.
  //
  $scope.findTileXY = function(x, y) {

      /* this is old school; we can do it better i am sure */
      console.log('in findtilexy');
      var bar = angular.element(document.getElementById('assembly-bar'));
      var kids = angular.element(bar.children()[0]).children();

      for (var index = 0; index < kids.length; index++) {
        var rect = kids[index].getBoundingClientRect();
        if ((x > rect.left) && (x < rect.right)) {
          var child = angular.element(kids[index]);
          // Of course, we want to ignore the tile that is currently
          // being dragged around.
          //
          if (!child.hasClass('dragging')) {
            return child;
          }
        }
      }
      return null;
  };

  $scope.wordTileClicked = function(obj) {
    console.log('word tile clicked: ', obj);
    $scope.TTSAvailable = $rootScope.TTSAvailable;

    if (obj.phrase) {
      console.log('phrase to add: ' + obj.phrase);
      $scope.assemblyBarPhrase.push(obj);
      $rootScope.assemblyBarPhrase = $scope.assemblyBarPhrase;
    }
    console.log('assembly bar phrase: ', $scope.assemblyBarPhrase);
    analytics.trackEvent('Boards', 'TileAdd', obj.phrase);
  };

  $scope.speechTileClicked = function(index, obj) {
    console.log('speech tile clicked: ',  obj);
    console.log('phrase to remove: ' + obj.phrase);
    $scope.TTSAvailable = $rootScope.TTSAvailable;

    $scope.assemblyBarPhrase.splice(index, 1);
    $rootScope.assemblyBarPhrase = $scope.assemblyBarPhrase;
    analytics.trackEvent('Boards', 'TileRemove', obj.phrase);
  };

  $scope.deleteButtonClicked = function() {
    console.log('delete button clicked.');
    var removed = $scope.assemblyBarPhrase.pop();
    $scope.TTSAvailable = $rootScope.TTSAvailable;
    if (removed) {
      console.log('phrase removed: ' + removed.phrase);
    } else {
      $scope.assemblyBarPhrase = [];
    }

    $rootScope.assemblyBarPhrase = $scope.assemblyBarPhrase;
    analytics.trackEvent('Boards', 'DeleteClick', removed);
  };
  $scope.speakButtonClicked = function() {
    console.log('speak button clicked.');

    var $wordsToSpeak = "";

    angular.forEach($scope.assemblyBarPhrase, function (tile,i) {
      /* Of course, this will need to be glued better but for proof
         of concept, concatenation works for now. */
      $wordsToSpeak = $wordsToSpeak + tile.phrase + ' ';
    });

    if ($rootScope.TTSAvailable) {
      ttsPlugin.speak($wordsToSpeak);
    }
    analytics.trackEvent('Boards', 'SpeakPhrase', $wordsToSpeak);
  };
})

.controller('WordlistCtrl', function($scope, $stateParams, $rootScope) {
  // TODO: This is vestigal. Factor out.
  $scope.activeWordlist = {
    homeBoard: [
      'be',
      'have',
      'do',
      'say',
      'get',
      'make',
      'go',
      'know',
      'take',
      'see',
      'come',
      'think',
      'look',
      'want',
      'give',
      'use',
      'find',
      'tell',
      'ask',
      'work',
      'seem',
      'feel',
      'try',
      'leave',
      'call'
    ],
    nouns: [
      'time',
      'person',
      'year',
      'way',
      'day',
      'thing',
      'man',
      'world',
      'life',
      'hand',
      'part',
      'child',
      'eye',
      'woman',
      'place',
      'work',
      'week',
      'case',
      'point',
      'government',
      'company',
      'number',
      'group',
      'problem',
      'fact'
    ]
  };
});
