angular.module('app.routes', [])

.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider
    

      .state('menu.home', {
    url: '/home',
    views: {
      'side-menu21': {
        templateUrl: 'templates/home.html',
        controller: 'homeCtrl'
      }
    }
  })

  .state('menu', {
    url: '/side-menu21',
    templateUrl: 'templates/menu.html',
    controller: 'menuCtrl'
  })

  .state('menu.settings', {
    url: '/settings',
    views: {
      'side-menu21': {
        templateUrl: 'templates/settings.html',
        controller: 'settingsCtrl'
      }
    }
  })

  .state('menu.details', {
    url: '/device-details',
	params: {
		deviceId: "deviceId"		
},
    views: {
      'side-menu21': {
        templateUrl: 'templates/details.html',
        controller: 'detailsCtrl'
      }
    }
  })

  .state('menu.rename', {
    url: '/rename',
	params: {
		deviceId: "deviceId"		
},
    views: {
      'side-menu21': {
        templateUrl: 'templates/rename.html',
        controller: 'renameCtrl'
      }
    }
  })

  .state('menu.devices', {
    url: '/result',
    views: {
      'side-menu21': {
        templateUrl: 'templates/devices.html',
        controller: 'devicesCtrl'
      }
    }
  })

$urlRouterProvider.otherwise('/side-menu21/home')


});