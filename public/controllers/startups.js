angular.module('MyApp')
  .controller('StartupsCtrl', function ($scope, toastr, $uibModal, StartupService) {
    $scope.isStartupsFetching = true;
    $scope.startup = {};
    $scope.fetchStartups = function(){
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
  });

  ;
