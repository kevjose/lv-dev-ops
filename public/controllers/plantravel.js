angular.module('MyApp')
    .controller('PlanTravelCtrl', function ($scope, $location, $auth, toastr, TravelService, Account, $state) {

        $scope.title = '';
        $scope.travelMates = [];
        /**
         * get user
         * @type {{}}
         */

        $scope.user = {};
        $scope.getProfile = function () {
            Account.getProfile()
                .then(function (response) {
                    $scope.user = response.data;
                    $scope.travelMates = $scope.travelMates.concat($scope.user.email);
                })
                .catch(function (response) {
                    toastr.clear();
                    toastr.error(response.data.message, response.status);
                });
        };
        $scope.getProfile();
        var map = new google.maps.Map(document.getElementById('map'), {
            zoom: 4,
            center: new google.maps.LatLng(23.200000, 79.225487),
            mapTypeId: google.maps.MapTypeId.ROADMAP,
        });

        var infowindow = new google.maps.InfoWindow({
            maxWidth: 160
        });
        /**
         * Adding places on map
         */
        $scope.colors = [
            {name: 'Red', url: 'red-dot.png'},
            {name: 'Green', url: 'green-dot.png'},
            {name: 'Blue', url: 'blue-dot.png'}
        ];
        $scope.place = {
            name: '',
            description: '',
            color: ''
        }
        $scope.lat = '';
        $scope.lng = '';
        $scope.locations = [];
        $scope.addLocation = function (place) {
            if ($scope.locations.indexOf(place) == -1) {
                /**
                 * get Coordinates
                 */
                var geocoder = new google.maps.Geocoder();
                geocoder.geocode({'address': place.name},
                    function (results, status) {
                        if (status == google.maps.GeocoderStatus.OK) {
                            var latitude = results[0].geometry.location.lat();
                            var longitude = results[0].geometry.location.lng();
                            $scope.$apply(function () {
                                place.lat = latitude;
                                place.lng = longitude;
                                $scope.locations.push(place);
                                var markers = new Array();
                                // Add the markers and infowindows to the map
                                for (var i = 0; i < $scope.locations.length; i++) {
                                    var marker = new google.maps.Marker({
                                        position: new google.maps.LatLng($scope.locations[i].lat, $scope.locations[i].lng),
                                        map: map,
                                        icon: 'https://maps.google.com/mapfiles/ms/icons/' + $scope.locations[i].color
                                    });
                                    markers.push(marker);
                                    google.maps.event.addListener(marker, 'click', (function (marker, i) {
                                        return function () {
                                            infowindow.setContent($scope.locations[i].name);
                                            infowindow.open(map, marker);
                                        }
                                    })(marker, i));
                                }

                                function autoCenter() {
                                    //  Create a new viewpoint bound
                                    var bounds = new google.maps.LatLngBounds();
                                    //  Go through each...
                                    for (var i = 0; i < markers.length; i++) {
                                        bounds.extend(markers[i].position);
                                    }
                                    //  Fit these bounds to the map
                                    map.fitBounds(bounds);
                                }

                                autoCenter();
                            });
                        }
                    }
                );
            } else {
                toastr.clear();
                toastr.info('Location already exists');

            }
            $scope.place = {};
            $scope.lat = '';
            $scope.lng = '';

        }
        $scope.isCreatingTravel = false;

        $scope.addTravelMate = function(travellerEmail){
            $scope.travelMates.push(travellerEmail);
        }
        $scope.createTravel = function () {
            console.log($scope.travelMates);
            $scope.isCreatingTravel = true;
            $scope.travel = {
                title: $scope.title,
                locations: $scope.locations,
                createdBy: $scope.user.email,
                travelMates: $scope.travelMates
            }

            TravelService.createTravel($scope.travel)
                .then(function (response) {
                    return $state.go('travel.overview', {id: response.data._id});
                })
                .catch(function (response) {
                    toastr.clear();
                    toastr.error(response.data.message, response.status);
                });
        }

    });