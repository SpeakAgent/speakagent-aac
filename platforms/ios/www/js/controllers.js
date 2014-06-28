angular.module('speakagentAAC.controllers', [])

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
})
