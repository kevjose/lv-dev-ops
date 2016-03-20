angular.module('MyApp')
  .factory('StartupService', function($http) {
    return {
      getStartups: function() {
        return $http.get('/api/startups');
      },
      createStartup: function(data) {
        return $http.post('/api/startup/create',data);
      },
      getStartup: function (id) {
        return $http.get('/api/startups/' + id);
      },
      updateStartup: function(data){
        return $http.put('/api/startup', data);
      }

      /*getProfile: function() {
        return $http.get('/api/me');
      },
      updateProfile: function(profileData) {
        return $http.put('/api/me', profileData);
      }*/
    };
  });