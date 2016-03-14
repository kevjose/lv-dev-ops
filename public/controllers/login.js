angular.module('MyApp')
    .controller('LoginCtrl', function ($scope, $location, $auth, toastr) {
        $scope.login = function () {
            $auth.login($scope.user)
                .then(function () {
                    toastr.clear();
                    toastr.success('You have successfully signed in');
                    $location.path('/dashboard/mytravels/upcoming');
                })
                .catch(function (response) {
                    toastr.clear();
                    toastr.error(response.data.message, response.status);
                });
        };
        $scope.authenticate = function (provider) {
            $auth.authenticate(provider)
                .then(function () {
                    toastr.clear();
                    toastr.success('You have successfully signed in with ' + provider);
                    $location.path('/dashboard/mytravels/upcoming');
                })
                .catch(function (response) {
                    toastr.clear();
                    toastr.error(response.data.message);
                });
        };
    });