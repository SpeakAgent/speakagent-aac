angular.module('speakagentAAC.controllers.AssemblyBar', ['ionic'])

.controller('AssemblyBar', ['$scope', '$window', '$rootScope',
  'clearAssemblyBar', 'addTileToAssemblyBar', 'getAssemblyBarTiles',
  'assemblyBarTileCount', 'setClearOnAdd', 'moveTileInFrontOfIndex',
  'deleteAssemblyBarTileAtIndex',

  function($scope, win, $rootScope, clearAssemblyBar, addTileToAssemblyBar,
    getAssemblyBarTiles, assemblyBarTileCount, setClearOnAdd,
    moveTileInFrontOfIndex, deleteAssemblyBarTileAtIndex) {

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

        moveTileInFrontOfIndex($scope.moveMeIndex, insertBeforeIndex);
        // var moved = $scope.assemblyBarPhrase.splice($scope.moveMeIndex, 1);


        // // console.log('tile ', tile);
        // // console.log('insertBeforeIndex ' + insertBeforeIndex);
        // // console.log('moved ', moved);

        // // Move the tile into position.
        // //
        // $scope.assemblyBarPhrase.splice(insertBeforeIndex, 0, moved[0]);

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
        // $rootScope.assemblyBarPhrase = $scope.assemblyBarPhrase;
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

    // They changed the phrase, so let's not clear it
    //
    setClearOnAdd(false);

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

  $scope.barTileClicked = function(index, obj) {
    console.log('bar tile clicked: ',  obj);

    newTiles = deleteAssemblyBarTileAtIndex(index);

    if($rootScope.AnalyticsAvailable) {
      analytics.trackEvent('Boards', 'TileRemove', obj.phrase);
    }
  };

  $scope.barContents = function() {
    return getAssemblyBarTiles();
  };
}])

.factory('addTileToAssemblyBar', ['$window', 'setClearOnAdd',
  function(win, setClearOnAdd) {
  return function(obj) {

    if ((!win.assemblyBarTiles) || (win.assemblyBarClearOnAdd)) {
        win.assemblyBarTiles = [];
        setClearOnAdd(false);
    }

    win.assemblyBarTiles.push(obj);
  };
}])

.factory('getAssemblyBarTiles', ['$window', function(win) {
  return function() {
    if (!win.assemblyBarTiles) {
      win.assemblyBarTiles = [];
    }


    return win.assemblyBarTiles;
  };
}])

.factory('getAssemblyBarText', ['$window', function(win) {
  return function() {
    if (!win.assemblyBarTiles) {
      win.assemblyBarTiles = [];
    }

    var ret = "";

    angular.forEach(win.assemblyBarTiles, function(tile) {
      if (tile.phrase) {
        ret = ret + tile.phrase + ' ';
      }
    });
    return ret;
  };
}])



.factory('clearAssemblyBar', ['$window', function(win) {
  return function() {
    win.assemblyBarTiles = [];
    setClearOnAdd(false);
    return win.assemblyBarTiles;
  };
}])

.factory('moveTileInFrontOfIndex', ['$window', function(win) {
  return function(moveTileIndex, beforeTileIndex) {
    if (win.assemblyBarTiles) {
      var moved = win.assemblyBarTiles.splice(moveTileIndex, 1);
      win.assemblyBarTiles.splice(beforeTileIndex, 0, moved[0]);
    } else {
      win.assemblyBarTiles = [];
    }

    return win.assemblyBarTiles;
  };
}])

.factory('deleteAssemblyBarTileAtIndex', ['$window', function(win) {

  // Remove the tile at the index, or if -1, yanks the item off the end
  // of the array.
  //
  return function(index) {
    if (win.assemblyBarTiles) {
      if (index == -1) {
        win.assemblyBarTiles.pop();
      } else {
        win.assemblyBarTiles.splice(index, 1);
      }
    } else {
      win.assemblyBarTiles = [];
    }
    return win.assemblyBarTiles;
  };
}])

.factory('assemblyBarTileCount', ['$window', function(win) {
  return function() {
    if (!win.assemblyBarTiles) {
      win.assemblyBarTiles = [];
    }

    return win.assemblyBarTiles.length ;
  };
}])

.factory('setClearOnAdd', ['$window', function(win) {
  return function(clearOnAdd) {
    win.assemblyBarClearOnAdd = clearOnAdd;
    return clearOnAdd;
  };
}]);
