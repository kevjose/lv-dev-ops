angular.module('MyApp')
    .controller('MyTravelCtrl', function ($scope, $stateParams, $state, TravelService,Account,toastr) {
        $scope.isMyTravelsLoading = true;
        $scope.travels =[];
        $scope.user ={};
        $scope.getProfile = function () {
            Account.getProfile()
                .then(function (response) {
                    $scope.user = response.data;
                    TravelService.getMyTravel(response.data.email)
                        .then(function (response) {
                            $scope.travels = response.data;
                            $scope.isMyTravelsLoading =false;
                        })
                        .catch(function (response) {
                            toastr.clear();
                            toastr.error(response.data.message, response.status);
                        });
                })
                .catch(function (response) {
                    toastr.clear();
                    toastr.error(response.data.message, response.status);
                });
        };
        $scope.getProfile();

        var COLORS = [
            '#e67e22', '#2980b9', '#47A447', '#e67e22',
            '#2980b9', '#47A447', '#e67e22', '#2980b9',
            '#47A447', '#47A447', '#e67e22', '#2980b9'
        ];
        //Generate color for the same user.
        $scope.getTitleColor= function(title) {
            // Compute hash code
            var hash = 7;
            for (var i = 0; i < title.length; i++) {
                hash = title.charCodeAt(i) + (hash << 5) - hash;
            }
            // Calculate color
            var index = Math.abs(hash % COLORS.length);
            return COLORS[index];
        }

        $scope.getTravel = function(id){
            $state.go('travel.overview', {id:id});
        }
        $scope.deleteTravel =function(id){
            TravelService.deleteTravel(id)
                .then(function(response){
                    $scope.isMyTravelsLoading = true;
                    $scope.getProfile();
                })
                .catch(function(response){
                    console.log(response);
                });
        }
    });