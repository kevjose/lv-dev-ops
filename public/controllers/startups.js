angular.module('MyApp')
  .controller('StartupsCtrl', function ($scope, toastr, $uibModal, StartupService, $state) {
    $scope.startup = {};
    $scope.selectedStartup = {};
    $scope.fetchStartups = function(){
      $scope.isStartupsFetching = true;
      StartupService.getStartups()
      .then(function (response) {
          toastr.success('Startup fetched successfully');
          $scope.isStartupsFetching = false;
          $scope.startups = response.data;
      })
      .catch(function (response) {
          toastr.clear();
          toastr.error(response.data.message, response.status);
      });
    }

    $scope.sortFilter = function(sortBy, sortDir){
      $scope.isStartupsFetching = true;
      if(sortBy == 'name'){
        $scope.sortByLocation = null;
      }
      else if(sortBy == 'location'){
        $scope.sortByName = null;
      }
      var req ={
        sortBy: sortBy,
        sortDir: sortDir
      }
      StartupService.getStartups(req)
      .then(function (response) {
          var order = (sortDir == 1)?'increasing':'decreasing'
          toastr.success('Startups in '+order+' order of '+sortBy);
          $scope.startups = response.data;
          $scope.isStartupsFetching = false;
          if(sortBy == 'name'){
            $scope.sortByName = !$scope.sortByName;
          }
          else if(sortBy == 'location'){
            $scope.sortByLocation = !$scope.sortByLocation;
          }
      })
      .catch(function (response) {
          toastr.clear();
          toastr.error(response.data.message, response.status);
      });
    }

    $scope.gotoStartup = function (id){
      $state.go('dashboard.startup',{id:id});
    }

    $scope.fetchStartups();
    $scope.open = function () {

      var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: '/partials/modals/addStartupModal.html',
        controller: 'AddStartupModalCtrl',
        resolve: {
          /*startup: function () {
            return $scope.startup;
          }*/
        }
      });

      modalInstance.result.then(function (result) {
        $scope.startups.push(result);
      });
    };
  })

  .controller('AddStartupModalCtrl', function ($scope, toastr, $uibModalInstance, StartupService) {

    $scope.startup ={};
    $scope.loadSectors = function() {
      $scope.sectorsOptions = [
        {"name": "SaaS" },
        {"name": "Health" },
        {"name": "Agriculture" },
        {"name": "Food" }
      ]; 

      return $scope.sectorsOptions ;
    };
    $scope.ok = function () {
      if(!$scope.startup.sectors)
        $scope.startup.sectors =[];
      for(i in $scope.sectors){
        $scope.startup.sectors.push($scope.sectors[i].name)
      }
      
      StartupService.createStartup($scope.startup)
      .then(function (response) {
          toastr.success('Startup created successfully');
          $uibModalInstance.close(response.data);
      })
      .catch(function (response) {
          toastr.clear();
          toastr.error(response.data.message, response.status);
      });
    };

    $scope.cancel = function () {
      $uibModalInstance.dismiss('cancel');
    };
  })

  .controller('FetchedStartupCtrl', function ($scope, toastr, StartupService, $stateParams) {
    
    $scope.abbrNum =function(number, decPlaces) {
      decPlaces = Math.pow(10,decPlaces);
      var abbrev = [ "k", "m", "b", "t" ];
      for (var i=abbrev.length-1; i>=0; i--) {
        var size = Math.pow(10,(i+1)*3);
        if(size <= number) {
          number = Math.round(number*decPlaces/size)/decPlaces;
          if((number == 1000) && (i < abbrev.length - 1)) {
            number = 1;
            i++;
          }
          number += abbrev[i];
          break;
        }
      }
      return number;
    }

    $scope.selectedStartup = {};
    
    $scope.loadSectors = function() {
      $scope.sectorsOptions = [
        {"name": "SaaS" },
        {"name": "Health" },
        {"name": "Agriculture" },
        {"name": "Food" }
      ]; 
      return $scope.sectorsOptions ;
    };

    $scope.fetchStartup = function (id){
      $scope.isStartupFetching = true;
      StartupService.getStartup(id)
      .then(function(response){
        $scope.isStartupFetching = false;
        $scope.selectedStartup = response.data;
      })
      .catch(function(response){
        toastr.clear();
        toastr.error(response.data.message, response.status);
      });
    }

    $scope.updateStartup = function(fieldName, fieldValue){
      $scope.isStartupFetching = true;
      if(fieldName === "sectors"){
        var tempArr = []
        for(i in fieldValue){
          tempArr.push(fieldValue[i].name)
        }
        fieldValue = tempArr;
      }
      var req = {};
      req[fieldName] = fieldValue;
      req['id'] = $stateParams.id;
      StartupService.updateStartup(req)
      .then(function(response){
        $scope.isStartupFetching = false;
        toastr.success(response.data.message, response.status);
      })
      .catch(function(response){
        toastr.clear();
        toastr.error(response.data.message, response.status);
      })
    }

    $scope.twitterDetailsUpdate = function(twitter_handle){
      if(!twitter_handle)
        return toastr.warning("Please fill twitter handle !");
      $scope.isTwitterInfoFetching = true;
      var req = {};
      req['twitter_handle'] = twitter_handle;
      req['id'] = $stateParams.id;
      StartupService.twitterDetailsUpdate(req)
      .then(function(response){
        $scope.selectedStartup.twitterInfo[0]= response.data;
        $scope.isTwitterInfoFetching = false;
        toastr.success(response.data.message, response.status);
      })
      .catch(function(response){
        toastr.clear();
        toastr.error(response.status);
      })
    }

    $scope.alexaDetailsUpdate = function(websiteUrl){
      if(!websiteUrl)
        return toastr.warning("Please fill website URL !");
      $scope.isAlexaInfoFetching = true;
      var req = {};
      req['websiteUrl'] = websiteUrl;
      req['id'] = $stateParams.id;
      StartupService.alexaDetailsUpdate(req)
      .then(function(response){
        $scope.selectedStartup.alexaInfo[0]= response.data;
        $scope.isAlexaInfoFetching = false;
        toastr.success(response.status);
      })
      .catch(function(response){
        toastr.clear();
        toastr.error(response.status);
      })
    }

    $scope.facebookDetailsUpdate = function(facebookHandle){
      if(!facebookHandle)
        return toastr.warning("Please fill facebook handle !");
      $scope.isFacebookInfoFetching = true;
      var req = {};
      req['facebookHandle'] = facebookHandle;
      req['id'] = $stateParams.id;
      StartupService.facebookDetailsUpdate(req)
      .then(function(response){
        $scope.selectedStartup.facebookInfo[0]= response.data;
        $scope.isFacebookInfoFetching = false;
        toastr.success(response.status);
      })
      .catch(function(response){
        toastr.clear();
        toastr.error(response.status);
      })
    }

    $scope.googlePlayDetailsUpdate = function(googlePlayHandle){
      if(!googlePlayHandle)
        return toastr.warning("Please fill google play id !");
      $scope.isGooglePlayInfoFetching = true;
      var req = {};
      req['googlePlayHandle'] = googlePlayHandle;
      req['id'] = $stateParams.id;
      StartupService.googlePlayDetailsUpdate(req)
      .then(function(response){
        $scope.selectedStartup.googlePlayInfo[0]= response.data;
        $scope.isGooglePlayInfoFetching = false;
        toastr.success(response.status);
      })
      .catch(function(response){
        toastr.clear();
        toastr.error(response.status);
      })
    }
    

    $scope.fetchStartup($stateParams.id);
    
  })
  ;
