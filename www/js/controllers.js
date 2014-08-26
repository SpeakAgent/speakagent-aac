angular.module('speakagentAAC.controllers', ['ionic'])

.controller('LocationCtrl', function($scope, $ionicPopup, $timeout) {

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



.controller('SettingsCtrl', function($scope, $ionicModal) {


  // Create the Settings modal that we will use later
  $ionicModal.fromTemplateUrl('templates/settings.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });
  // Triggered in the login modal to close it
  $scope.closeModal = function() {
    $scope.modal.hide();
  };
  // Open the Settings modal
  $scope.settings = function() {
    $scope.modal.show();
  }
})

.controller('AppCtrl', function($scope, $ionicModal, $timeout) {


  // Form data for the login modal
  $scope.loginData = {};

  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('templates/login.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });



  // Triggered in the login modal to close it
  $scope.closeModal = function() {
    $scope.modal.hide();
  };

  // Open the login modal
  $scope.login = function() {
    $scope.modal.show();
  };



  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {
    console.log('Doing login', $scope.loginData);

    // Simulate a login delay. Remove this and replace with your login
    // code if using a login system
    $timeout(function() {
      $scope.closeLogin();
    }, 1000);
  };
})

.controller('WordlistsCtrl', function($scope, $http) {

  var responsePromise = $http.get('http://localhost:8000/v1/symbols/?page_size=100',
    { headers :
        { 'Authorization' : 'Token 333227a9bbbfb65be0a2e68dd7e1f1a03b368a50' },
    });

  responsePromise.success(function(data, status, headers, config) {
      // console.log(data);
      $scope.wordlists = data.results;
      console.log($scope.wordlists);
  });
  responsePromise.error(function(data, status, headers, config) {
      alert("Unable to fetch symbols for board. " + status);
  });


//   $scope.wordlists = [
//     { title: 'Hi', id: 1, type: 'lexeme', icon: 'ion-ios7-heart' },
//     { title: 'What', id: 2, type: 'lexeme', icon: 'ion-ios7-heart' },
//     { title: 'How', id: 3, type: 'lexeme', icon: 'ion-ios7-heart' },
//     { title: 'Let', id: 4, type: 'folder', icon: 'ion-ios7-heart' },
//     { title: 'I', id: 5, type: 'folder', icon: 'ion-ios7-heart' },
//     { title: 'I want to go to...', id: 6, type: 'folder', icon: 'ion-ios7-heart' },
//     { title: 'Good', id: 7, type: 'lexeme', icon: 'ion-ios7-heart' },
//     { title: 'Okay', id: 8, type: 'lexeme', icon: 'ion-ios7-heart' },
//     { title: 'Maybe', id: 9, type: 'lexeme', icon: 'ion-ios7-heart' },
//     { title: 'How are you?', id: 10, type: 'lexeme', icon: 'ion-ios7-heart' },
//     { title: 'Where', id: 11, type: 'lexeme', icon: 'ion-ios7-heart' },
//     { title: 'Can', id: 12, type: 'lexeme', icon: 'ion-ios7-heart' },
//     { title: 'Do', id: 13, type: 'lexeme', icon: 'ion-ios7-heart' },
//     { title: 'You', id: 14, type: 'folder', icon: 'ion-ios7-heart' },
//     { title: 'I want to eat...', id: 15, type: 'folder', icon: 'ion-ios7-heart' },
//     { title: 'Not', id: 16, type: 'lexeme', icon: 'ion-ios7-heart' },
//     { title: 'Or', id: 17, type: 'lexeme', icon: 'ion-ios7-heart' },
//     { title: 'More', id: 18, type: 'lexeme', icon: 'ion-ios7-heart' },
//     { title: 'I don\'t understand.', id: 19, type: 'lexeme', icon: 'ion-ios7-heart' },
//     { title: 'Why', id: 20, type: 'lexeme', icon: 'ion-ios7-heart' },
//     { title: 'Stop', id: 21, type: 'folder', icon: 'ion-ios7-heart' },
//     { title: 'Make', id: 22, type: 'folder', icon: 'ion-ios7-heart' },
//     { title: 'He', id: 23, type: 'folder', icon: 'ion-ios7-heart' },
//     { title: 'Actions', id: 24, type: 'folder', icon: 'ion-ios7-heart' },
//     { title: 'If', id: 25, type: 'lexeme', icon: 'ion-ios7-heart' },
//     { title: 'And', id: 26, type: 'lexeme', icon: 'ion-ios7-heart' },
//     { title: 'Please', id: 27, type: 'lexeme', icon: 'ion-ios7-heart' },
//     { title: 'I don\'t know.', id: 28, type: 'lexeme', icon: 'ion-ios7-heart' },
//     { title: 'Who', id: 29, type: 'lexeme', icon: 'ion-ios7-heart' },
//     { title: 'Tell', id: 30, type: 'folder', icon: 'ion-ios7-heart' },
//     { title: 'Read', id: 31, type: 'folder', icon: 'ion-ios7-heart' },
//     { title: 'She', id: 32, type: 'folder', icon: 'ion-ios7-heart' },
//     { title: 'Things', id: 33, type: 'folder', icon: 'ion-ios7-heart' },
//     { title: 'Places', id: 34, type: 'lexeme', icon: 'ion-ios7-heart' },
//     { title: 'Kinds', id: 35, type: 'lexeme', icon: 'ion-ios7-heart' },
//     { title: 'Thanks', id: 36, type: 'lexeme', icon: 'ion-ios7-heart' },
//     { title: 'I have a question.', id: 37, type: 'lexeme', icon: 'ion-ios7-heart' },
//     { title: 'When', id: 38, type: 'lexeme', icon: 'ion-ios7-heart' },
//     { title: 'Time', id: 39, type: 'folder', icon: 'ion-ios7-heart' },
//     { title: 'Give', id: 40, type: 'folder', icon: 'ion-ios7-heart' },
//     { title: 'It', id: 41, type: 'folder', icon: 'ion-ios7-heart' },
//     { title: 'People', id: 42, type: 'folder', icon: 'ion-ios7-heart' },
//     { title: 'With', id: 43, type: 'lexeme', icon: 'ion-ios7-heart' },
//     { title: 'Because', id: 44, type: 'lexeme', icon: 'ion-ios7-heart' },
//     { title: 'Bye', id: 45, type: 'lexeme', icon: 'ion-ios7-heart' },
//     { title: 'What does that say?', id: 46, type: 'lexeme', icon: 'ion-ios7-heart' },
//     { title: 'Which', id: 47, type: 'lexeme', icon: 'ion-ios7-heart' },
//     { title: 'This', id: 48, type: 'lexeme', icon: 'ion-ios7-heart' },
//     { title: 'That', id: 49, type: 'lexeme', icon: 'ion-ios7-heart' },
//     { title: 's plural', id: 50, type: 'folder', icon: 'ion-ios7-heart' },
//     { title: '\'s possesive', id: 51, type: 'folder', icon: 'ion-ios7-heart' },
//     { title: 'Again', id: 52, type: 'lexeme', icon: 'ion-ios7-heart' },
//     { title: 'But', id: 53, type: 'lexeme', icon: 'ion-ios7-heart' },
//     { title: 'Be > For', id: 54, type: 'lexeme', icon: 'ion-ios7-heart' },
//   ];
})

.controller('WordlistCtrl', function($scope, $stateParams) {
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
