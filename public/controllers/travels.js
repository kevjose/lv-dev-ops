angular.module('MyApp')
    .controller('TravelCtrl', function ($scope) {
        /**
         * Sidebar Toggle
         */
        var mobileView = 992;

        $scope.getWidth = function () {
            return window.innerWidth;
        };

        $scope.$watch($scope.getWidth, function (newValue, oldValue) {
            if (newValue >= mobileView) {
                $scope.toggle = true;
            } else {
                $scope.toggle = false;
            }

        });

        $scope.toggleSidebar = function () {
            $scope.toggle = !$scope.toggle;
        };

        window.onresize = function () {
            $scope.$apply();
        };
    });