angular.module('speakagentAAC.controllers', ['ionic'])

.controller('LocationCtrl', function($scope, $ionicPopup, $timeout) {

  $scope.locationData = { saveButtonDisabled: true, };
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
              saveButtonDisabled = false;
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
    console.log('Doing save location ', $scope.locationData);

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
      console.log("Would save " + $scope.locationData.name + " as " +
        $scope.locationData.address);
    });
  };
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
  $scope.closeLogin = function() {
    $scope.modal.hide();
  },

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

.controller('WordlistsCtrl', function($scope) {
  $scope.wordlists = [
    { title: 'Favorites', id: 1, icon: 'ion-ios7-heart' },
    { title: 'Work', id: 2, icon: 'ion-briefcase' },
    { title: 'School', id: 3, icon: 'ion-university' },
    { title: 'Medical', id: 4, icon: 'ion-medkit' },
    { title: 'Game', id: 5, icon: 'ion-game-controller-b' }
  ];
})

.controller('WordlistCtrl', function($scope, $stateParams) {
  $scope.activeWordlist = {
    verbs: [
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
    ],
    adjectives: [
      'good',
      'new',
      'first',
      'last',
      'long',
      'great',
      'little',
      'own',
      'other',
      'old',
      'right',
      'big',
      'high',
      'different',
      'small',
      'large',
      'next',
      'early',
      'young',
      'important',
      'few',
      'public',
      'bad',
      'same',
      'able'
    ],
    adverbs: [
      'up',
      'so',
      'out',
      'just',
      'now',
      'how',
      'then',
      'more',
      'also',
      'here',
      'well',
      'only',
      'very',
      'even',
      'back',
      'there',
      'down',
      'still',
      'in',
      'as',
      'too',
      'when',
      'never',
      'really',
      'most'
    ],
    prepositions: [
      'of',
      'in',
      'to',
      'for',
      'with',
      'on',
      'at',
      'from',
      'by',
      'about',
      'as',
      'into',
      'like',
      'through',
      'after',
      'over',
      'between',
      'out',
      'against',
      'during',
      'without',
      'before',
      'under',
      'around',
      'among'
    ],
    pronouns: [
      'it',
      'I',
      'you',
      'he',
      'they',
      'we',
      'she',
      'who',
      'them',
      'me',
      'him',
      'one',
      'her',
      'us',
      'something',
      'nothing',
      'anything',
      'himself',
      'everything',
      'someone',
      'themselves',
      'everyone',
      'itself',
      'anyone',
      'myself'
    ],
    conjunctions: [
      'and',
      'that',
      'but',
      'or',
      'as',
      'if',
      'when',
      'than',
      'because',
      'while',
      'where',
      'after',
      'so',
      'though',
      'since',
      'until',
      'whether',
      'before',
      'although',
      'nor',
      'like',
      'once',
      'unless',
      'now',
      'except'
    ],
    numbers: [
      '0',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9'
    ],
    ordinals: [
      'hundred',
      'thousand',
      'million',
      'billion',
      'gajillion'
    ],
    interjections: [
      'yes',
      'oh',
      'yeah',
      'no',
      'hey',
      'hi',
      'hello',
      'hmm',
      'ah',
      'wow'
    ]
  };
});
