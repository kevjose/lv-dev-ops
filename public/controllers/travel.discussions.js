angular.module('MyApp')
    .controller('TravelDiscussionsCtrl', function ($scope, $stateParams, $state, TravelService, Account, socket) {

        $scope.isTravelLoading = true;
        $scope.travel = {};
        $scope.title = '';
        $scope.locations = [];
        $scope.msgs = [];

        TravelService.getTravel($stateParams.id)
            .then(function (response) {
                console.log(response);
                $scope.travel = response.data;
                $scope.msgs = $scope.msgs.concat($scope.travel.discussions);
                $scope.title = $scope.travel.title;
                $scope.locations = $scope.travel.locations;

                $scope.isTravelLoading = false;
            })
            .catch(function (response) {
                console.log(response);

            });
        /**
         * get user
         * @type {{}}
         */
        $scope.user = {};
        $scope.getProfile = function () {
            Account.getProfile()
                .then(function (response) {
                    $scope.user = response.data;
                })
                .catch(function (response) {
                    toastr.clear();
                    toastr.error(response.data.message, response.status);
                });
        };
        $scope.getProfile();

        /**
         * socket things
         */
        socket.on('connect', function () {
            console.log("Connected " + $stateParams.id);
            //socket.emit('room',$stateParams.id);
        });
        $scope.msgs = [];

        $scope.sendMsg = function () {
            socket.emit('send msg', {
                'message': $scope.chat.msg,
                'room': $stateParams.id,
                'createdBy': $scope.user.displayName,
                'createdByEmail': $scope.user.email,
                'createdAt': new Date()
            });
            $scope.chat.msg = '';
        };


        socket.on('get msg', function (data) {
            $scope.msgs.push(data);
            $scope.$digest();
        });
        $scope.searchObject = {};
        $scope.searchResults = [];
        $scope.isSearching = false;
        $scope.search = function () {
            $scope.isSearching = true;
            var date = new Date($scope.searchObject.date);
            var properlyFormatted = date.getFullYear() + ("0" + (date.getMonth() + 1)).slice(-2) + ("0" + date.getDate()).slice(-2);
            console.log($scope.searchObject);
            console.log(properlyFormatted);
            if ($scope.searchObject.source != null && $scope.searchObject.dest != null && $scope.searchObject.date != null) {
                TravelService.getBus($scope.searchObject, properlyFormatted)
                    .then(function (response) {
                        console.log(response.data.data.onwardflights);
                        $scope.searchResults = response.data.data.onwardflights;
                        $scope.isSearching = false;
                    })
                    .catch(function (response) {
                        console.log(response);
                        $scope.isSearching = false;
                    });
            } else {
                $scope.isSearching = false;
                return;
            }
        }
    });