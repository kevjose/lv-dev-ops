angular.module('MyApp')
    .controller('SignupCtrl', function ($scope, $location, $auth, toastr) {
        $scope.signup = function () {
            $auth.signup($scope.user)
                .then(function () {
                    $location.path('/login');
                    toastr.clear();
                    toastr.info('You have successfully created a new account');
                })
                .catch(function (response) {
                    toastr.clear();
                    toastr.error(response.data.message);
                });
        };
    });