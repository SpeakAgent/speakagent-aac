angular.module('speakagentAAC.controllers', [])


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

.controller('WordlistsCtrl', function($scope) {
  $scope.wordlists = [
    { title: 'Hi', id: 1, type: 'lexeme', icon: 'ion-ios7-heart' },
    { title: 'What', id: 2, type: 'lexeme', icon: 'ion-ios7-heart' },
    { title: 'How', id: 3, type: 'lexeme', icon: 'ion-ios7-heart' },
    { title: 'Let', id: 4, type: 'folder', icon: 'ion-ios7-heart' },
    { title: 'I', id: 5, type: 'folder', icon: 'ion-ios7-heart' },
    { title: 'I want to go to...', id: 6, type: 'folder', icon: 'ion-ios7-heart' },
    { title: 'Good', id: 7, type: 'lexeme', icon: 'ion-ios7-heart' },
    { title: 'Okay', id: 8, type: 'lexeme', icon: 'ion-ios7-heart' },
    { title: 'Maybe', id: 9, type: 'lexeme', icon: 'ion-ios7-heart' },
    { title: 'How are you?', id: 10, type: 'lexeme', icon: 'ion-ios7-heart' },
    { title: 'Where', id: 11, type: 'lexeme', icon: 'ion-ios7-heart' },
    { title: 'Can', id: 12, type: 'lexeme', icon: 'ion-ios7-heart' },
    { title: 'Do', id: 13, type: 'lexeme', icon: 'ion-ios7-heart' },
    { title: 'You', id: 14, type: 'folder', icon: 'ion-ios7-heart' },
    { title: 'I want to eat...', id: 15, type: 'folder', icon: 'ion-ios7-heart' },
    { title: 'Not', id: 16, type: 'lexeme', icon: 'ion-ios7-heart' },
    { title: 'Or', id: 17, type: 'lexeme', icon: 'ion-ios7-heart' },
    { title: 'More', id: 18, type: 'lexeme', icon: 'ion-ios7-heart' },
    { title: 'I don\'t understand.', id: 19, type: 'lexeme', icon: 'ion-ios7-heart' },
    { title: 'Why', id: 20, type: 'lexeme', icon: 'ion-ios7-heart' },
    { title: 'Stop', id: 21, type: 'folder', icon: 'ion-ios7-heart' },
    { title: 'Make', id: 22, type: 'folder', icon: 'ion-ios7-heart' },
    { title: 'He', id: 23, type: 'folder', icon: 'ion-ios7-heart' },
    { title: 'Actions', id: 24, type: 'folder', icon: 'ion-ios7-heart' },
    { title: 'If', id: 25, type: 'lexeme', icon: 'ion-ios7-heart' },
    { title: 'And', id: 26, type: 'lexeme', icon: 'ion-ios7-heart' },
    { title: 'Please', id: 27, type: 'lexeme', icon: 'ion-ios7-heart' },
    { title: 'I don\'t know.', id: 28, type: 'lexeme', icon: 'ion-ios7-heart' },
    { title: 'Who', id: 29, type: 'lexeme', icon: 'ion-ios7-heart' },
    { title: 'Tell', id: 30, type: 'folder', icon: 'ion-ios7-heart' },
    { title: 'Read', id: 31, type: 'folder', icon: 'ion-ios7-heart' },
    { title: 'She', id: 32, type: 'folder', icon: 'ion-ios7-heart' },
    { title: 'Things', id: 33, type: 'folder', icon: 'ion-ios7-heart' },
    { title: 'Places', id: 34, type: 'lexeme', icon: 'ion-ios7-heart' },
    { title: 'Kinds', id: 35, type: 'lexeme', icon: 'ion-ios7-heart' },
    { title: 'Thanks', id: 36, type: 'lexeme', icon: 'ion-ios7-heart' },
    { title: 'I have a question.', id: 37, type: 'lexeme', icon: 'ion-ios7-heart' },
    { title: 'When', id: 38, type: 'lexeme', icon: 'ion-ios7-heart' },
    { title: 'Time', id: 39, type: 'folder', icon: 'ion-ios7-heart' },
    { title: 'Give', id: 40, type: 'folder', icon: 'ion-ios7-heart' },
    { title: 'It', id: 41, type: 'folder', icon: 'ion-ios7-heart' },
    { title: 'People', id: 42, type: 'folder', icon: 'ion-ios7-heart' },
    { title: 'With', id: 43, type: 'lexeme', icon: 'ion-ios7-heart' },
    { title: 'Because', id: 44, type: 'lexeme', icon: 'ion-ios7-heart' },
    { title: 'Bye', id: 45, type: 'lexeme', icon: 'ion-ios7-heart' },
    { title: 'What does that say?', id: 46, type: 'lexeme', icon: 'ion-ios7-heart' },
    { title: 'Which', id: 47, type: 'lexeme', icon: 'ion-ios7-heart' },
    { title: 'This', id: 48, type: 'lexeme', icon: 'ion-ios7-heart' },
    { title: 'That', id: 49, type: 'lexeme', icon: 'ion-ios7-heart' },
    { title: 's plural', id: 50, type: 'folder', icon: 'ion-ios7-heart' },
    { title: '\'s possesive', id: 51, type: 'folder', icon: 'ion-ios7-heart' },
    { title: 'Again', id: 52, type: 'lexeme', icon: 'ion-ios7-heart' },
    { title: 'But', id: 53, type: 'lexeme', icon: 'ion-ios7-heart' },
    { title: 'Be > For', id: 54, type: 'lexeme', icon: 'ion-ios7-heart' },
  ];
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
