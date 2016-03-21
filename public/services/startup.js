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
      },
      twitterDetailsUpdate: function(data){
        return $http.put('/api/twitter/details', data); 
      },
      alexaDetailsUpdate: function(data){
        return $http.put('/api/alexa/details', data);
      },
      facebookDetailsUpdate: function(data){
        return $http.put('/api/facebook/details', data);
      },
      googlePlayDetailsUpdate: function(data){
        return $http.put('/api/google-play/details', data);
      }

      /*getProfile: function() {
        return $http.get('/api/me');
      },
      updateProfile: function(profileData) {
        return $http.put('/api/me', profileData);
      }*/
    };
  });