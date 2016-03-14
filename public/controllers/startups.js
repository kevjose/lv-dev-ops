angular.module('MyApp')
  .controller('StartupsCtrl', function ($scope, $auth, toastr, Account, $uibModal) {
    $scope.isProfileLoading = true;
    $scope.startup = {};
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
        console.log(result);
        //$scope.startups.psuh(result);
      });
    };
  })

  .controller('AddStartupModalCtrl', function ($scope, $uibModalInstance) {

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
      
      $uibModalInstance.close($scope.startup);
    };

    $scope.cancel = function () {
      $uibModalInstance.dismiss('cancel');
    };
  });

  ;
