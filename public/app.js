angular.module('MyApp', ['ngResource', 'ngMessages', 'ngAnimate', 'toastr', 'ui.router', 'satellizer', 'ui.bootstrap'])

.config(function ($stateProvider, $urlRouterProvider, $authProvider) {
  $stateProvider
    .state('home', {
      url: '/',
      controller: 'HomeCtrl',
      templateUrl: 'partials/home.html'
    })
    .state('login', {
      url: '/login',
      templateUrl: 'partials/login.html',
      controller: 'LoginCtrl',
      resolve: {
        skipIfLoggedIn: skipIfLoggedIn
      }
    })
    .state('signup', {
      url: '/signup',
      templateUrl: 'partials/signup.html',
      controller: 'SignupCtrl',
      resolve: {
        skipIfLoggedIn: skipIfLoggedIn
      }
    })
    .state('logout', {
      url: '/logout',
      template: null,
      controller: 'LogoutCtrl'
    })
    .state('dashboard', {
      url: '/dashboard',
      templateUrl: 'partials/dashboard.html',
      controller: 'DashboardCtrl',
      abstract: true,
      resolve: {
          loginRequired: loginRequired
      }
    })
    .state('dashboard.profile', {
      url: '/profile',

      views: {
        'dashboardContent': {
          templateUrl: 'partials/profile.html',
          controller: 'ProfileCtrl'
        }
      }
    })
    /*.state('dashboard.mytravels', {
      url: '/mytravels',

      views: {
        'dashboardContent': {
          templateUrl: 'partials/mytravels.html',
          controller: 'MyTravelCtrl'
        }
      }
    })
    .state('dashboard.mytravels.upcoming', {
      url: '/upcoming',
      templateUrl: 'partials/mytravels-upcoming.html'
    })

    // url will be /form/interests
    .state('dashboard.mytravels.past', {
      url: '/past',
      templateUrl: 'partials/mytravels-past.html'
    });*/

  $urlRouterProvider.otherwise('/');

   

  function skipIfLoggedIn($q, $auth) {
    var deferred = $q.defer();
    if ($auth.isAuthenticated()) {
      deferred.reject();
    } else {
      deferred.resolve();
    }
    return deferred.promise;
  }

  function loginRequired($q, $location, $auth) {
    var deferred = $q.defer();
    if ($auth.isAuthenticated()) {
      deferred.resolve();
    } else {
      $location.path('/login');
    }
    return deferred.promise;
  }
})

