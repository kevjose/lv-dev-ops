angular.module('MyApp')
    .controller('ProfileCtrl', function ($scope, $auth, toastr, Account) {
        $scope.isProfileLoading = true;
        $scope.getProfile = function () {
            Account.getProfile()
                .then(function (response) {
                    $scope.user = response.data;
                    $scope.isProfileLoading = false;
                })
                .catch(function (response) {
                    toastr.clear();
                    toastr.error(response.data.message, response.status);
                });
        };
        $scope.updateProfile = function () {
            $scope.isProfileLoading =true;
            Account.updateProfile($scope.user)
                .then(function () {
                    toastr.clear();
                    $scope.isProfileLoading =false;
                    toastr.success('Profile has been updated');
                })
                .catch(function (response) {
                    toastr.clear();
                    toastr.error(response.data.message, response.status);
                });
        };

        $scope.getProfile();
    });
