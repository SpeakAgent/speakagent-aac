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
