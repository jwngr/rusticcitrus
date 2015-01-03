(function () {
    "use strict";

    /****************************/
    /*  GAMES HUB PAGE CONTROL  */
    /****************************/
    WinJS.UI.Pages.define("/pages/gamesHub/gamesHub.html", {
        /* Responds to navigations to this page */
        ready: function (element, options) {
            // Initialize the games hub event listeners
            initializeGamesHubEventListeners();

            // Hide the delete and forfeit app bar commands
            $("#deleteGamesAppBarButton").hide();
            $("#forfeitGamesAppBarButton").hide();

            // TODO: allow the multiplayer games data sources to start being created before we load the single player file (they shouldn't be related)
            // If the games hub list view data sources are undefined, create them
            if (typeof (RC.SinglePlayerGames.dataSource) === "undefined") {
                RC.assert(typeof (RC.MultiplayerGames) === "undefined", "MultiplayerGames namespace should be undefined if single player games data source is undefined");

                getActiveMultiplayerGames().done(function (activeMultiplayerGames) {
                    WinJS.Namespace.defineWithParent(RC, "MultiplayerGames", {
                        activeMultiplayerGames: activeMultiplayerGames
                    });
                    // Create the games list views' data sources and bind them to the list views
                    RC.SinglePlayerGames.deleteFile_DEBUG(function() {
                        RC.SinglePlayerGames.load(function () {
                            createGamesListViewDataSources(element);
                        });
                    });
                });
            }
            else {
                RC.assert(typeof (RC.MultiplayerGames.yourTurnDataSource) === "object" && typeof (RC.MultiplayerGames.theirTurnDataSource) === "object", "Multiplayer games data source should be defined if single player games data source is defined");

                // Create the games list views' data sources and bind them to the list views
                createGamesListViewDataSources(element);
            }    

            var newGameSearchBox = document.getElementById("newGameSearchBox");
            newGameSearchBox.addEventListener("querysubmitted", newGameSearchBoxQuerySubmitted);
            newGameSearchBox.addEventListener("suggestionsrequested", newGameSearchBoxSuggestionsRequested);
            newGameSearchBox.addEventListener("resultsuggestionchosen", newGameSearchBoxResultSuggestionChosen);
            
            // TODO: add removeEventListeners
        },

        /* Responds to navigations away from this page */
        unload: function () {
            disposeGamesHubEventListeners();
        },

        /* Responds to changes in the view state */
        updateLayout: function (element) {
        }
    });


    /*********************/
    /*  EVENT LISTENERS  */
    /*********************/
    /* Initializes the games hub event listeners */
    function initializeGamesHubEventListeners() {
        // Delete games app bar button
        $("#deleteGamesAppBarButton").on("click", showDeleteSelectedGamesConfirmationFlyout);
        $("#confirmDeleteSelectedGamesButton").on("click", deleteSelectedGames);
        $("#cancelDeleteSelectedGamesButton").on("click", hideDeleteSelectedGamesConfirmationFlyout);

        // Forfeit games app bar button
        $("#forfeitGamesAppBarButton").on("click", showForfeitSelectedGamesConfirmationFlyout);
        $("#confirmForfeitSelectedGamesButton").on("click", forfeitSelectedGames);
        $("#cancelForfeitSelectedGamesButton").on("click", hideForfeitSelectedGamesConfirmationFlyout);

        // Clear selection app bar button
        $("#clearSelectionAppBarButton").on("click", clearSelectedGames);

        // Add a firebase listener to update the multiplayer games when they are updated by another player
    };

    /* Disposes of the games hub event listeners */
    function disposeGamesHubEventListeners() {
        // Get the list view win control
        var singlePlayerGamesListView = $("#singlePlayerGamesListView")[0].winControl;

        // Remove all event listeners on the games list view
        singlePlayerGamesListView.removeEventListener("iteminvoked", RC.startSinglePlayerGame);
        singlePlayerGamesListView.removeEventListener("selectionchanging", RC.preventNewGameItemSelection);
        singlePlayerGamesListView.removeEventListener("selectionchanged", RC.toggleSinglePlayerGamesListAppBarVisibility);

        // Remove all app bar button event listeners
        $("#deleteGamesAppBarButton").off("click");
        $("#confirmDeleteSelectedGamesButton").off("click");
        $("#cancelDeleteSelectedGamesButton").off("click");
        $("#forfeitGamesAppBarButton").off("click");
        $("#confirmForfeitSelectedGamesButton").off("click");
        $("#cancelForfeitSelectedGamesButton").off("click");
        $("#clearSelectionAppBarButton").off("click");

        // TODO: clear firebase listeners
    };


    /*************************/
    /*  NEW GAME SEARCH BOX  */
    /*************************/
    /* Responds to the new game search box query submissions */
    function newGameSearchBoxQuerySubmitted(event) {
        var queryText = event.detail.queryText;
        console.log(queryText);
    };

    /* Responds to the new game search box result submissions */
    function newGameSearchBoxResultSuggestionChosen(event) {
        // Get the opponent's data from Firebase
        RC.firebaseRoot.child("users/" + event.detail.tag + "/").once("value", function (dataSnapshot) {
            // Get the opponent's data
            var opponent = dataSnapshot.val();

            // Create the new game data
            var newGameData = {
                "roundwords": ["BREAD", "INDIGO", "DYNAMIC"], // TODO: make these dynamic; possibly create helpers.js in /common/ which creates RC.Helpers namespace
                "creator": {
                    "id": RC.loggedInUser.id,
                    "facebookId": RC.loggedInUser.facebookId,
                    "firstName": RC.loggedInUser.firstName,
                    "lastName": RC.loggedInUser.lastName,
                    "username": RC.loggedInUser.username,
                    "gender": RC.loggedInUser.gender,
                    "imageUrl": RC.loggedInUser.imageUrl,
                    "timezone": RC.loggedInUser.timezone
                },
                "opponent": {
                    "id": opponent.id,
                    "facebookId": opponent.facebookId,
                    "firstName": opponent.firstName,
                    "lastName": opponent.lastName,
                    "username": opponent.username,
                    "gender": opponent.gender,
                    "imageUrl": opponent.imageUrl,
                    "timezone": opponent.timezone
                }
            };

            // Create a new multiplayer game in Firebase
            var newGameFirebaseRoot = RC.firebaseRoot.child("multiplayerGames/").push(newGameData);

            // Add the name of the new multiplayer game to each player's multiplayer games list in Firebase
            RC.firebaseRoot.child("users/" + RC.loggedInUser.id + "/games/multiplayer/active/").push(newGameFirebaseRoot.name());
            RC.firebaseRoot.child("users/" + opponent.id + "/games/multiplayer/active/").push(newGameFirebaseRoot.name());
            
            // Add a new list item to the your turn list view
            RC.MultiplayerGames.yourTurnDataSource.insertAtEnd(newGameFirebaseRoot.name(), {
                isPlaceholder: false,
                opponentName: newGameData.opponent.firstName + " " + newGameData.opponent.lastName,
                opponentImageUrl: newGameData.opponent.imageUrl,
                scoreText: generateMultiplayerGameScoreText(newGameData.creator, newGameData.opponent, /*fIsLoggedInUsersTurn=*/ true),
                isLoggedInUsersTurn: true,
                game: newGameData
            });
        });

        // TODO: Clear the search box's input
    };

    /* Provides query suggestions for the new game search box */
    function newGameSearchBoxSuggestionsRequested(event) {
        var query = event.detail.queryText.toLowerCase();
        var suggestionCollection = event.detail.searchSuggestionCollection;

        // Random opponent
        // TODO: make this a result suggestion with a picture of the orange with the question mark
        suggestionCollection.appendQuerySuggestion("Random Opponent");

        // Recent opponents
        event.detail.setPromise(
            WinJS.Promise.join([
                getRecentOpponents(query, /*numResultsToReturn=*/ 5).then(function (recentOpponents) {
                    if (recentOpponents.length > 0) {
                        suggestionCollection.appendSearchSeparator("Recent Opponents");
                        recentOpponents.forEach(function (opponent) {
                            suggestionCollection.appendResultSuggestion(opponent.name, opponent.detailText, opponent.tag, opponent.image, opponent.imageAlternateText);
                        });
                    }
                }),

                getFacebookFriends(query, /*numResultsToReturn=*/ 5).then(function (facebookFriends) {
                    if (facebookFriends.length > 0) {
                        suggestionCollection.appendSearchSeparator("Facebook Friends");
                        facebookFriends.forEach(function (friend) {
                            suggestionCollection.appendResultSuggestion(friend.name, friend.detailText, friend.tag, friend.image, friend.imageAlternateText);
                        });
                    }
                })
            ])
        );
    };

    /* Returns a list of users who are recent opponents of the logged-in user and whose names match the inputted query */
    function getRecentOpponents(query, numResultsToReturn) {
        return new WinJS.Promise(function (complete, error) {
            RC.firebaseRoot.child("users/" + RC.loggedInUser.id + "/games/multiplayer/active/").once("value", function (activeMultiplayerGamesDataSnapshot) {
                // Create a dictionary to hold data about the logged-in user's recent opponents
                var results = [];
                var resultIds = [];

                // Get at most numResultsToReturn active opponents
                activeMultiplayerGamesDataSnapshot.forEach(function (childDataSnapshot) {
                    // Get the multiplayer game as a JavaScript object
                    var multiplayerGame = childDataSnapshot.val();

                    if (results.length < numResultsToReturn) {
                        // Determine which data actually belongs to the logged-in user's opponent
                        if (multiplayerGame.creator.id === RC.loggedInUser.id) {
                            var recentOpponent = multiplayerGame.opponent;
                        }
                        else {
                            var recentOpponent = multiplayerGame.creator;
                        }

                        // If this is a new recent opponent, add them to the recent opponents dictionary
                        if ($.inArray(recentOpponent.id, resultIds) === -1) {
                            if (query.length === 0 ||
                                (recentOpponent.firstName.substr(0, query.length).toLowerCase() === query) ||
                                (recentOpponent.lastName.substr(0, query.length).toLowerCase() === query)) {
                                // TODO: match full names as well; maybe just search for the string in the full name via name.indexOf(query)?
                                // Add the current ID to the recent opponent IDs
                                resultIds.push(recentOpponent.id);

                                // Get the opponent's image
                                var imageUri = new Windows.Foundation.Uri(recentOpponent.imageUrl);
                                var image = Windows.Storage.Streams.RandomAccessStreamReference.createFromUri(imageUri);

                                // Get the opponent's full name
                                var fullName = recentOpponent.firstName + " " + recentOpponent.lastName;

                                // Add the opponent to the recent opponents dictionary
                                results.push({
                                    name: fullName,
                                    detailText: "Start a new game now!",
                                    tag: recentOpponent.id,
                                    image: image,
                                    imageAlternateText: fullName
                                });
                            }
                        }
                    }
                });

                return complete(results);
            });
        });

        // TODO: also get opponents from completed games if there aren't enough from the active list
    };

    /* Returns a list of the logged-in user's Facebook friends whose names match the inputted query */
    function getFacebookFriends(query, numResultsToReturn) {
        return new WinJS.Promise(function (complete, error) {
            var results = [];

            if (query.length > 0) {
                // TODO: change to winjs.xhr
                $.ajax({
                    type: 'get',
                    url: 'https://graph.facebook.com/me/friends',
                    data: {
                        access_token: RC.loggedInUser.accessToken,
                        fields: "id, installed, first_name, last_name, gender, picture, timezone"
                    },
                    dataType: 'json'
                }).done(function (response, error, a, b, c) {
                    // do something with response.data
                    var numFacebookFriends = response.data.length;

                    for (var i = 0; i < numFacebookFriends; ++i) {
                        if (results.length === numResultsToReturn) {
                            break;
                        }
                        var friend = response.data[i];
                        if ((friend.first_name.substr(0, query.length).toLowerCase() === query) || (friend.last_name.substr(0, query.length).toLowerCase() === query)) {
                            // Get the opponent's image
                            var imageUri = new Windows.Foundation.Uri(friend.picture.data.url);
                            var image = Windows.Storage.Streams.RandomAccessStreamReference.createFromUri(imageUri);

                            // Get the opponent's full name
                            var fullName = friend.first_name + " " + friend.last_name;

                            // TODO: confirm
                            // If the user does not have Rustic Citrus installed, set the invite text
                            var text = "Start a new game now!";
                            if (!friend.installed) {
                                text = "Invite to Rustic Citrus!";
                            }

                            results.push({
                                name: fullName,
                                detailText: text,
                                tag: "tag",
                                image: image,
                                imageAlternateText: fullName
                            });
                        }
                    }

                    complete(results);
                });
            }
            else {
                complete(results);
            }
        });
    }

    ///*******************/
    ///*  DATA ADAPTERS  */
    ///*******************/
    ///* IListDataAdapter for retrieving the logged-in user's TODO */
    //var singlePlayerGamesDataAdapter = WinJS.Class.define(
    //    // Constructor
    //    function () {
    //        // List to hold all the logged-in player's active single player games
    //        this.items = null;
    //    },

    //    // IListDataAdapter methods
    //    {
    //        // Retrieve the item at the requested index (and possibly some items before and after it)
    //        itemsFromIndex: function (requestIndex, countBefore, countAfter) {
    //            RC.assert(typeof (RC.SinglePlayerGames.list) === "object", "Single player games list should already be defined");

    //            // Create the single player games list if it is null
    //            var _this = this;
    //            if (this.items === null) {
    //                _this.items = [];
    //                RC.SinglePlayerGames.list.forEach(function (game, i) {
    //                    _this.items.push({
    //                        key: i.toString(),
    //                        data: {
    //                            isPlaceholder: (game.currentRound === undefined),
    //                            game: game
    //                        }
    //                    });
    //                });
    //            }

    //            // Determine which results to return given the inputted values
    //            var _this = this;
    //            return new WinJS.Promise(function (complete, error) {
    //                var numItems = _this.items.length;
    //                var startIndex = requestIndex - countBefore;
    //                var endIndex = Math.min(requestIndex + countAfter, numItems - 1)
    //                return complete({
    //                    items: _this.items.slice(startIndex, endIndex + 1),
    //                    offset: requestIndex - startIndex,
    //                    totalCount: numItems
    //                });
    //            });
    //        },

    //        // Returns the number of items in the result list
    //        getCount: function () {
    //            RC.assert(typeof (RC.SinglePlayerGames.list) === "object", "Single player games list should already be defined");

    //            var _this = this;
    //            return new WinJS.Promise(function (complete, error) {
    //                if (_this.items) {
    //                    complete(_this.items.length);
    //                }
    //                else {
    //                    complete(RC.SinglePlayerGames.list.length);
    //                }
    //            });
    //        },

    //        /* Updates the data of a list item */
    //        change: function (key, data, index) {
    //            RC.assert(this.items[index].key === key, "key and index do not correspond to the same item");
    //            this.items[index].data = data;
    //            return new WinJS.Promise.wrap(null);
    //        }
    //    }
    //);

    /* IListDataAdapter for retrieving the logged-in user's current multiplayer games */
    var yourTurnMultiplayerGamesDataAdapter = WinJS.Class.define(
        // Constructor
        function () {
            // List to hold all the active multiplayer games for which it is the logged-in user's turn
            var _items = null;
        },

        // IListDataAdapter methods
        {
            // Retrieve the item at the requested index (and possibly some items before and after it)
            itemsFromIndex: function (requestIndex, countBefore, countAfter) {
                var _this = this;
                return new WinJS.Promise(function (complete, error) {
                    if (_this.items) {
                        // Determine which results to return given the inputted values
                        var numItems = _this.items.length;
                        var startIndex = requestIndex - countBefore;
                        var endIndex = Math.min(requestIndex + countAfter, numItems - 1)
                        return complete({
                            items: _this.items.slice(startIndex, endIndex + 1),
                            offset: requestIndex - startIndex,
                            totalCount: numItems
                        });
                    }
                    else {
                        // Initialize the list to hold all the active multiplayer games for which it is the logged-in user's turn
                        _this.items = [];

                        // Create an entry for the "New Game" list item
                        _this.items.push({
                            key: "newGame",
                            data: {
                                isPlaceholder: true
                            }
                        });

                        // Keep track of every promise to get the opponent's information
                        var opponentPromises = [];

                        RC.MultiplayerGames.activeMultiplayerGames.forEach(function (multiplayerGame) {
                            // Determine the logged-in player's role for the current game
                            var loggedInUserData = (multiplayerGame.creator.id == RC.loggedInUser.id) ? multiplayerGame.creator : multiplayerGame.opponent;
                            $.extend(loggedInUserData, {
                                "facebookId": RC.loggedInUser.facebookId,
                                "firstName": RC.loggedInUser.firstName,
                                "lastName": RC.loggedInUser.lastName,
                                "username": RC.loggedInUser.username,
                                "gender": RC.loggedInUser.gender,
                                "imageUrl": RC.loggedInUser.imageUrl,
                                "timezone": RC.loggedInUser.timezone
                            });
                            var opponentData = (multiplayerGame.creator.id == RC.loggedInUser.id) ? multiplayerGame.opponent : multiplayerGame.creator;
                            var opponentPromise = new WinJS.Promise(function (complete, error) {
                                RC.firebaseRoot.child("users/" + opponentData.id + "/").once("value", function (opponentDataSnapshot) {
                                    // Extend the opponent data
                                    var opponent = opponentDataSnapshot.val();
                                    $.extend(opponentData, {
                                        "facebookId": opponent.facebookId,
                                        "firstName": opponent.firstName,
                                        "lastName": opponent.lastName,
                                        "username": opponent.username,
                                        "gender": opponent.gender,
                                        "imageUrl": opponent.imageUrl,
                                        "timezone": opponent.timezone
                                    });

                                    // If it is the logged-in user's turn, add the current multiplayer game to the list
                                    var numLoggedInUserScores = (loggedInUserData.scores === undefined) ? 0 : loggedInUserData.scores.length;
                                    var numOpponentScores = (opponentData.scores === undefined) ? 0 : opponentData.scores.length;
                                    var fIsLoggedInUsersTurn = (numLoggedInUserScores <= numOpponentScores);
                                    if (fIsLoggedInUsersTurn) {
                                        _this.items.push({
                                            key: multiplayerGame.id,
                                            data: {
                                                isPlaceholder: false,
                                                opponentName: opponentData.firstName + " " + opponentData.lastName,
                                                opponentImageUrl: opponentData.imageUrl,
                                                scoreText: generateMultiplayerGameScoreText(loggedInUserData, opponentData, fIsLoggedInUsersTurn),
                                                isLoggedInUsersTurn: fIsLoggedInUsersTurn,
                                                game: multiplayerGame
                                            }
                                        });
                                    }

                                    // Complete the promise
                                    complete();
                                });
                            });

                            // Add the current promise to the opponent promises
                            opponentPromises.push(opponentPromise);
                        });

                        // Determine which results to return given the inputted values
                        WinJS.Promise.join(opponentPromises).done(function () {
                            var numItems = _this.items.length;
                            var startIndex = requestIndex - countBefore;
                            var endIndex = Math.min(requestIndex + countAfter, numItems - 1)
                            return complete({
                                items: _this.items.slice(startIndex, endIndex + 1),
                                offset: requestIndex - startIndex,
                                totalCount: numItems
                            });
                        });
                    }
                });
            },

            // Returns the number of items in the result list
            getCount: function () {
                var _this = this;
                return new WinJS.Promise(function (complete, error) {
                    if (_this.items) {
                        complete(_this.items.length);
                    }
                    else {
                        var numMultiplayerGamesLoggedInUsersTurn = 0;
                        
                        RC.MultiplayerGames.activeMultiplayerGames.forEach(function (multiplayerGame) {
                            // Determine the logged-in player's role for the current game
                            var loggedInUserData = (multiplayerGame.creator.id == RC.loggedInUser.id) ? multiplayerGame.creator : multiplayerGame.opponent;
                            var opponentData = (multiplayerGame.creator.id == RC.loggedInUser.id) ? multiplayerGame.opponent : multiplayerGame.creator;

                            // If it is the logged-in user's turn, add the current multiplayer game to the list
                            var numLoggedInUserScores = (loggedInUserData.scores === undefined) ? 0 : loggedInUserData.scores.length;
                            var numOpponentScores = (opponentData.scores === undefined) ? 0 : opponentData.scores.length;
                            var fIsLoggedInUsersTurn = (numLoggedInUserScores <= numOpponentScores);
                            if (fIsLoggedInUsersTurn) {
                                numMultiplayerGamesLoggedInUsersTurn += 1;
                            }
                        });

                        complete(numMultiplayerGamesLoggedInUsersTurn + 1);
                    }
                });
            },

            /* Inserts a new list item at the end of the list */
            insertAtEnd: function (key, data) {
                // Create the new item
                var newItem = {
                    key: key,
                    data: data
                }

                // Add the item to the data source's items list
                this.items.push(newItem);

                return new WinJS.Promise.wrap(newItem);
            },

            /* Updates the data of a list item */
            change: function (key, data, index) {
                var _this = this;
                return new WinJS.Promise(function (complete, error) {
                    _this.itemsFromIndex(index, 0, 0).done(function (promiseData) {
                        RC.assert(promiseData.items[0].key === key, "key and index do not correspond to the same item");
                        promiseData.items[0] = data;
                        complete(null);
                    });
                });
            },

            /* Removes a list item */
            remove: function (key, index) {
                var removedItems = this.items.splice(index, 1);
                RC.assert(removedItems[0].key === key, "key and index do not correspond to the same item");
                return new WinJS.Promise.wrap(null);
            }
        }
    );

    /* IListDataAdapter for retrieving the logged-in user's current multiplayer games */
    var theirTurnMultiplayerGamesDataAdapter = WinJS.Class.define(
        // Constructor
        function () {
            // List to hold all the active multiplayer games for which it is not the logged-in user's turn
            var _items = null;
        },

        // IListDataAdapter methods
        {
            // Retrieve the item at the requested index (and possibly some items before and after it)
            itemsFromIndex: function (requestIndex, countBefore, countAfter) {
                var _this = this;
                return new WinJS.Promise(function (complete, error) {
                    if (_this.items) {
                        // Determine which results to return given the inputted values
                        var numItems = _this.items.length;
                        var startIndex = requestIndex - countBefore;
                        var endIndex = Math.min(requestIndex + countAfter, numItems - 1)
                        return complete({
                            items: _this.items.slice(startIndex, endIndex + 1),
                            offset: requestIndex - startIndex,
                            totalCount: numItems
                        });
                    }
                    else {
                        // Initialize the list to hold all the active multiplayer games for which it is not the logged-in user's turn
                        _this.items = [];

                        // Keep track of every promise to get the opponent's information
                        var opponentPromises = [];

                        // Add each each active multiplayer game for which it is not the logged-in user's turn to the items list
                        RC.MultiplayerGames.activeMultiplayerGames.forEach(function (multiplayerGame) {
                            // Determine the logged-in player's role for the current game
                            var loggedInUserData = (multiplayerGame.creator.id == RC.loggedInUser.id) ? multiplayerGame.creator : multiplayerGame.opponent;
                            $.extend(loggedInUserData, {
                                "facebookId": RC.loggedInUser.facebookId,
                                "firstName": RC.loggedInUser.firstName,
                                "lastName": RC.loggedInUser.lastName,
                                "username": RC.loggedInUser.username,
                                "gender": RC.loggedInUser.gender,
                                "imageUrl": RC.loggedInUser.imageUrl,
                                "timezone": RC.loggedInUser.timezone
                            });
                            var opponentData = (multiplayerGame.creator.id == RC.loggedInUser.id) ? multiplayerGame.opponent : multiplayerGame.creator;
                            var opponentPromise = new WinJS.Promise(function (complete, error) {
                                RC.firebaseRoot.child("users/" + opponentData.id + "/").once("value", function (opponentDataSnapshot) {
                                    // Extend the opponent data
                                    var opponent = opponentDataSnapshot.val();
                                    $.extend(opponentData, {
                                        "facebookId": opponent.facebookId,
                                        "firstName": opponent.firstName,
                                        "lastName": opponent.lastName,
                                        "username": opponent.username,
                                        "gender": opponent.gender,
                                        "imageUrl": opponent.imageUrl,
                                        "timezone": opponent.timezone
                                    });

                                    // If it is the logged-in user's turn, add the current multiplayer game to the list
                                    var numLoggedInUserScores = (loggedInUserData.scores === undefined) ? 0 : loggedInUserData.scores.length;
                                    var numOpponentScores = (opponentData.scores === undefined) ? 0 : opponentData.scores.length;
                                    var fIsLoggedInUsersTurn = (numLoggedInUserScores <= numOpponentScores);
                                    if (!fIsLoggedInUsersTurn) {
                                        _this.items.push({
                                            key: multiplayerGame.id,
                                            data: {
                                                isPlaceholder: false,
                                                opponentName: opponentData.firstName + " " + opponentData.lastName,
                                                opponentImageUrl: opponentData.imageUrl,
                                                scoreText: generateMultiplayerGameScoreText(loggedInUserData, opponentData, fIsLoggedInUsersTurn),
                                                isLoggedInUsersTurn: fIsLoggedInUsersTurn,
                                                game: multiplayerGame
                                            }
                                        });
                                    }

                                    // Complete the promise
                                    complete();
                                });
                            });

                            // Add the current promise to the opponent promises
                            opponentPromises.push(opponentPromise);
                        });        

                        // Determine which results to return given the inputted values
                        WinJS.Promise.join(opponentPromises).done(function () {
                            var numItems = _this.items.length;
                            var startIndex = requestIndex - countBefore;
                            var endIndex = Math.min(requestIndex + countAfter, numItems - 1)
                            return complete({
                                items: _this.items.slice(startIndex, endIndex + 1),
                                offset: requestIndex - startIndex,
                                totalCount: numItems
                            });
                        });
                    }
                });
            },

            // Returns the number of items in the result list
            getCount: function () {
                var _this = this;
                return new WinJS.Promise(function (complete, error) {
                    if (_this.items) {
                        complete(_this.items.length);
                    }
                    else {
                        var numMultiplayerGamesOpponentsTurn = 0;

                        RC.MultiplayerGames.activeMultiplayerGames.forEach(function (multiplayerGame) {
                            // Determine the logged-in player's role for the current game
                            var loggedInUserData = (multiplayerGame.creator.id == RC.loggedInUser.id) ? multiplayerGame.creator : multiplayerGame.opponent;
                            var opponentData = (multiplayerGame.creator.id == RC.loggedInUser.id) ? multiplayerGame.opponent : multiplayerGame.creator;

                            // If it is not the logged-in user's turn, add the current multiplayer game to the list
                            var numLoggedInUserScores = (loggedInUserData.scores === undefined) ? 0 : loggedInUserData.scores.length;
                            var numOpponentScores = (opponentData.scores === undefined) ? 0 : opponentData.scores.length;
                            var fIsLoggedInUsersTurn = (numLoggedInUserScores <= numOpponentScores);
                            if (!fIsLoggedInUsersTurn) {
                                numMultiplayerGamesOpponentsTurn += 1;
                            }
                        });

                        complete(numMultiplayerGamesOpponentsTurn);
                    }
                });
            },

            /* Inserts a new list item at the end of the list */
            insertAtEnd: function (key, data) {
                // Create the new item
                var newItem = {
                    key: key,
                    data: data
                }

                // Add the item to the data source's items list
                this.items.push(newItem);

                return new WinJS.Promise.wrap(newItem);
            },

            /* Updates the data of a list item */
            change: function (key, data, index) {
                var _this = this;
                return new WinJS.Promise(function (complete, error) {
                    _this.itemsFromIndex(index, 0, 0).done(function (promiseData) {
                        RC.assert(promiseData.items[0].key === key, "key and index do not correspond to the same item");
                        promiseData.items[0] = data;
                        complete(null);
                    });
                });
            },

            /* Removes a list item */
            remove: function (key, index) {
                var removedItems = this.items.splice(index, 1);
                RC.assert(removedItems[0].key === key, "key and index do not correspond to the same item");
                return new WinJS.Promise.wrap(null);
            }
        }
    );


    /***********************************/
    /*  APP BAR / LIST VIEW SELECTION  */
    /***********************************/
    /* Prevents the single player "New Game" list items from being selected */
    RC.handleSinglePlayerGameListItemSelection = WinJS.Utilities.markSupportedForProcessing(function (event) {
        event.detail.newSelection.getItems().done(function (selectedGameItems) {
            for (var i = 0; i < selectedGameItems.length; i++) {
                if (selectedGameItems[i].data.isPlaceholder) {
                    event.preventDefault();
                }
            }
        });
    });

    /* Prevents the multiplayer "New Game" list item from being selected */
    RC.handleMultilayerGameListItemSelection = WinJS.Utilities.markSupportedForProcessing(function (event) {
        event.detail.newSelection.getItems().done(function (selectedGameItems) {
            for (var i = 0; i < selectedGameItems.length; i++) {
                if (selectedGameItems[i].data.isPlaceholder) {
                    event.preventDefault();
                }
            }
        });
    });

    /* Toggles the visibility of the games hub app bar and which icons are visible inside of it */
    RC.toggleGamesHubAppBarVisibility = WinJS.Utilities.markSupportedForProcessing(function (event) {
        // Get the games hub app bar
        var gamesHubAppBar = $("#gamesHubAppBar")[0].winControl;

        // Determine how many items in each games list are selected
        var numSinglePlayerGameItemsSelected = $("#singlePlayerGamesListView")[0].winControl.selection.count();
        var numMultiplayerGameItemsSelected = $("#yourTurnMultiplayerGamesListView")[0].winControl.selection.count() + $("#theirTurnMultiplayerGamesListView")[0].winControl.selection.count();

        // Get the app bar commands
        var deleteGamesAppBarButton = $("#deleteGamesAppBarButton");
        var forfeitGamesAppBarButton = $("#forfeitGamesAppBarButton");

        // If no items are selected, hide the app bar and the appropriate commands
        if (numSinglePlayerGameItemsSelected + numMultiplayerGameItemsSelected == 0) {
            // Hide the app bar
            gamesHubAppBar.sticky = false;
            gamesHubAppBar.hide();

            // Hide the delete and forfeit app bar commands
            deleteGamesAppBarButton.hide();
            forfeitGamesAppBarButton.hide();
        }

        // Otherwise, show the app bar and the appropriate commands
        else {
            // Show the app bar
            gamesHubAppBar.sticky = true;
            gamesHubAppBar.show();

            // Show the appropriate app bar commands
            if (numSinglePlayerGameItemsSelected == 0) {
                deleteGamesAppBarButton.hide();
                forfeitGamesAppBarButton.show();
            }
            else if (numMultiplayerGameItemsSelected == 0) {
                forfeitGamesAppBarButton.hide();
                deleteGamesAppBarButton.show();
            }
            else {
                forfeitGamesAppBarButton.hide();
                deleteGamesAppBarButton.hide();
            }
        }
    });

    /********************************/
    /*  APP BAR / LIST VIEW EVENTS  */
    /********************************/
    /* Starts a new game or loads a previous one when a single player games list item is invoked */
    RC.startSinglePlayerGame = WinJS.Utilities.markSupportedForProcessing(function (event) {
        event.detail.itemPromise.done(function (invokedItem) {
            if (invokedItem.data.isPlaceholder) {
                // Start a new game if one does not already exist
                // TODO: handle all the trial mode stuff
                //if ((RC.licenseInformation.isTrial) && (invokedItem.data.numLetters == 7)) {
                //    // If the app is in trial mode and a 7 letter game was selected, prompt the user to buy the app
                //    RC.MessageDialogs.displayAppPurchaseDialog("Upgrade to the full verison", "Only the full version of Rustic Citrus allows you to play 7-letter games. It also gives you features like high scores, achievements, and saved games. Get the full juicy version of Rustic Citrus now!", /* includeCancelButton = */ true);
                //}
                //else {
                WinJS.Navigation.navigate("/pages/gameBoard/gameBoard.html", {
                    "gameType": "singlePlayer",
                    "resumeGame": false,
                    "numLetters": invokedItem.data.game.numLetters
                });
                //}
            }
            else {
                // Otherwise, load the existing game
                WinJS.Navigation.navigate("/pages/gameBoard/gameBoard.html", {
                    "gameType": "singlePlayer",
                    "resumeGame": true,
                    "game": invokedItem.data.game
                });
            }
        });
    });

    /* Loads a multiplayer game when a multiplayer games list item is invoked */
    RC.loadMultiplayerGameSummary = WinJS.Utilities.markSupportedForProcessing(function (event) {
        event.detail.itemPromise.done(function (invokedItem) {
            if (invokedItem.data.isPlaceholder) {
                // If the clicked item was the "New Game" button, set focus to the new game search box
                // Note: setTimeout() is used here as a workaround to an IE bug which doesn't properly set focus to the input
                setTimeout(function () {
                    $("#newGameSearchBox > .win-searchbox-input").focus();
                }, 10);
            }
            else {
                // Add the ID to the game object
                invokedItem.data.game.gameId = invokedItem.key;

                // Load the multiplayer game overview for the clicked game
                WinJS.Navigation.navigate("/pages/multiplayerGameSummary/multiplayerGameSummary.html", {
                    "gameType": "multiplayer",
                    "game": invokedItem.data.game,
                    "isLoggedInUsersTurn": invokedItem.data.isLoggedInUsersTurn
                });
            }
        });
    });

    /* Shows the flyout to confirm deleting the selected single player games */
    function showDeleteSelectedGamesConfirmationFlyout() {
        // Determine whether to pluralize "game" in the flyout prompt
        if ($("#singlePlayerGamesListView")[0].winControl.selection.count() == 1) {
            $("#confirmDeleteSelectedGamesFlyout .pluralizer").hide();
        }
        else {
            $("#confirmDeleteSelectedGamesFlyout .pluralizer").show();
        }

        // Show the flyout
        confirmDeleteSelectedGamesFlyout.winControl.show($("#deleteGamesAppBarButton")[0], "top", "center");
    };

    /* Hides the flyout to confirm deleting the selected single player games */
    function hideDeleteSelectedGamesConfirmationFlyout() {
        confirmDeleteSelectedGamesFlyout.winControl.hide();
    };

    /* TODO: make sure this works */
    /* Deletes the selected single player games */
    function deleteSelectedGames() {
        // TODO: make sure this doesn't crash when starting on this page
        RC.assert(typeof (RC.SinglePlayerGames.dataSource) === "object", "Single player games data source should already be defined");

        // Delete each of the selected single player game items
        singlePlayerGamesListView.winControl.selection.getItems().done(function (selectedGameItems) {
            selectedGameItems.forEach(function (gameListItem) {
                // Get the current game's data
                var currentGameData = gameListItem.data.game;

                // Add the current game to the user's completed single player games list in Firebase
                RC.SinglePlayerGames.addToCompletedGames({
                    "numLetters": currentGameData.numLetters,
                    "score": currentGameData.score,
                    "numRoundsCompleted": currentGameData.numRoundsCompleted,
                    "numWordsFound": currentGameData.numWordsFound,
                    "dateCreated": currentGameData.dateCreated,
                    "dateModified": RC.getCurrentDateAsString(),
                    "forfeited": true
                });

                // Update the single player games data source and list and Firebase
                RC.SinglePlayerGames.updateGame(gameListItem.index, {
                    "numLetters": currentGameData.numLetters
                });

                // Update the single player games file
                // Note: this relies on RC.SinglePlayerGames.list already being updated
                RC.SinglePlayerGames.updateFile();
            });
        });

        // Clear the current selection and hide the app bar
        clearSelectedGames();

        // Hide the delete selected games confirmation flyout
        hideDeleteSelectedGamesConfirmationFlyout();
    };

    /* Shows the flyout to confirm forfeiting the selected multiplayer games */
    function showForfeitSelectedGamesConfirmationFlyout() {
        // Determine whether to pluralize "game" in the flyout prompt
        if ((yourTurnMultiplayerGamesListView.winControl.selection.count() + theirTurnMultiplayerGamesListView.winControl.selection.count()) == 1) {
            $("#confirmForfeitSelectedGamesFlyout .pluralizer").hide();
        }
        else {
            $("#confirmForfeitSelectedGamesFlyout .pluralizer").show();
        }

        // Show the flyout
        confirmForfeitSelectedGamesFlyout.winControl.show($("#forfeitGamesAppBarButton")[0], "top", "center");
    };

    /* Hides the flyout to confirm forfeiting the selected multiplayer games */
    function hideForfeitSelectedGamesConfirmationFlyout() {
        confirmForfeitSelectedGamesFlyout.winControl.hide();
    };

    /* Forfeits the selected multiplayer games */
    function forfeitSelectedGames() {
        // TODO: make sure this doesn't crash when starting on this page
        RC.assert(typeof (RC.MultiplayerGames.yourTurnDataSource) === "object", "Your turn multiplayer games data source should already be defined");
        RC.assert(typeof (RC.MultiplayerGames.theirTurnDataSource) === "object", "Their turn multiplayer games data source should already be defined");
        
        // Forfeit each of the selected your turn multiplayer game items
        yourTurnMultiplayerGamesListView.winControl.selection.getItems().done(function (selectedGameItems) {
            selectedGameItems.forEach(function (game) {
                RC.MultiplayerGames.yourTurnDataSource.remove(game.key, game.index);
                RC.firebaseRoot.child("users/" + RC.loggedInUser.id + "/games/multiplayer/active/" + game.key + "/").remove();
                // TODO: Add the games to the forfeited games list (but for each player or only for the forfeiter??)
            });
        });

        // Forfeit each of the selected their turn multiplayer game items
        theirTurnMultiplayerGamesListView.winControl.selection.getItems().done(function (selectedGameItems) {
            selectedGameItems.forEach(function (game) {
                RC.MultiplayerGames.theirTurnDataSource.remove(game.key, game.index);
                RC.firebaseRoot.child("users/" + RC.loggedInUser.id + "/games/multiplayer/active/" + game.key + "/").remove();
                // TODO: Add the games to the forfeited games list (but for each player or only for the forfeiter??)
            });
        });

        // Clear the current selection and hide the app bar
        clearSelectedGames();

        // Hide the forfeit selected games confirmation flyout
        hideForfeitSelectedGamesConfirmationFlyout();
    };

    /* Clears the currently selected games and hides the app bar */
    function clearSelectedGames() {
        // Clear the current selection for each games list
        singlePlayerGamesListView.winControl.selection.clear();
        yourTurnMultiplayerGamesListView.winControl.selection.clear();
        theirTurnMultiplayerGamesListView.winControl.selection.clear();

        // Hide the app bar
        gamesHubAppBar.winControl.sticky = false;
        gamesHubAppBar.winControl.hide();
    };


    /**********************/
    /*  HELPER FUNCTIONS  */
    /**********************/
    /* Creates the games list views' data sources once the games hub has fully loaded */
    function createGamesListViewDataSources(element) {
        // Get the games hub
        var gamesHub = element.querySelector(".hub").winControl;

        if (gamesHub.loadingState === "complete") {
            // If the games hub has already fully loaded, it is safe to create the games list views' data sources
            createSinglePlayerGamesListViewDataSource();
            createMultiplayerGamesListViewDataSources();
        }
        else {
            // Otherwise, wait to create the games list views' data sources until the hub has fully loaded
            gamesHub.onloadingstatechanged = function (args) {
                if (args.srcElement === gamesHub.element && args.detail.loadingState === "complete") {
                    gamesHub.onloadingstatechanged = null;
                    createSinglePlayerGamesListViewDataSource();
                    createMultiplayerGamesListViewDataSources();
                }
            }
        }
    };

    /* Creates the single player games list view data source and adds it to the RC.SinglePlayerGames namespace */
    function createSinglePlayerGamesListViewDataSource() {
        // Create the single player games list view data source if it hasn't already been defined
        if (RC.SinglePlayerGames.dataSource === undefined) {
            var singlePlayerGamesDataSource = WinJS.Class.derive(WinJS.UI.VirtualizedDataSource, function () {
                this._baseDataSourceConstructor(new RC.SinglePlayerGames.dataAdapter());
            });

            // Add the single player games data source to the RC.SinglePlayerGames namespace
            WinJS.Namespace.defineWithParent(RC, "SinglePlayerGames", {
                dataSource: new singlePlayerGamesDataSource
            });
        }

        // Bind the single player games data sources to the single player games list view
        $("#singlePlayerGamesListView")[0].winControl.itemDataSource = RC.SinglePlayerGames.dataSource;
    };

    /* Creates the multiplayer games list view data source and adds it to the RC.MultiplayerGames namespace */
    function createMultiplayerGamesListViewDataSources() {
        // Create the multiplayer games list view data sources if it hasn't already been defined
        if (RC.MultiplayerGames.yourTurnDataSource === undefined) {
            var yourTurnMultiplayerGamesDataSource = WinJS.Class.derive(WinJS.UI.VirtualizedDataSource, function () {
                this._baseDataSourceConstructor(new yourTurnMultiplayerGamesDataAdapter());
            });
            var theirTurnMultiplayerGamesDataSource = WinJS.Class.derive(WinJS.UI.VirtualizedDataSource, function () {
                this._baseDataSourceConstructor(new theirTurnMultiplayerGamesDataAdapter());
            });

            // Add the multiplayer games data sources to the RC.MultiplayerGames namespace
            WinJS.Namespace.defineWithParent(RC, "MultiplayerGames", {
                yourTurnDataSource: new yourTurnMultiplayerGamesDataSource,
                theirTurnDataSource: new theirTurnMultiplayerGamesDataSource
            });
        }

        // Bind the multiplayer games data sources to the multiplayer games list views
        $("#yourTurnMultiplayerGamesListView")[0].winControl.itemDataSource = RC.MultiplayerGames.yourTurnDataSource;
        $("#theirTurnMultiplayerGamesListView")[0].winControl.itemDataSource = RC.MultiplayerGames.theirTurnDataSource;
    };
   
    /* Generate multiplayer game score text */
    function generateMultiplayerGameScoreText(loggedInUser, opponent, isLoggedInUsersTurn) {
        // Get the players' scores
        var loggedInUserScores = loggedInUser.scores;
        var opponentScores = opponent.scores;

        // TODO: handle ties!!!

        // Determine the score text
        var scoreText;
        if (loggedInUserScores === undefined) {
            if (isLoggedInUsersTurn) {
                scoreText = opponent.firstName + " has invited you to play! Click here to get started.";
            }
            else {
                scoreText = opponent.firstName + " has started a game and is playing the first round. Wait for your turn!";
            }
        }
        else if (opponentScores === undefined) {
            // Make sure it is not the logged-in user's turn
            if (RC.debug) {
                console.assert(!isLoggedInUsersTurn, "This should not be a valid state");
                if (isLoggedInUsersTurn) {
                    debugger;
                }
            }

            scoreText = "You scored " + loggedInUserScores[0] + " points in the first round but " + opponent.firstName + " is yet to play.";
        }
        else {
            // Get the number of scores to count
            var numScores = Math.min(loggedInUserScores.length, opponentScores.length);

            // Get the current total score for each player
            var loggedInUserTotalScore = 0;
            for (var i = 0; i < numScores; ++i) {
                loggedInUserTotalScore += loggedInUserScores[i];
            }
            var opponentTotalScore = 0;
            for (var i = 0; i < numScores; ++i) {
                opponentTotalScore += opponentScores[i];
            }

            // Create a mapping from number of rounds to strings
            var numRoundsAsStrings = ["one", "two", "three"];

            if (loggedInUserTotalScore > opponentTotalScore) {
                scoreText = "You are winning " + loggedInUserTotalScore + " to " + opponentTotalScore + " after " + numRoundsAsStrings[numScores - 1] + " " + (numScores === 1 ? "round" : "rounds") + "!";
            }
            else {
                scoreText = "You are losing " + loggedInUserTotalScore + " to " + opponentTotalScore + " after " + numRoundsAsStrings[numScores - 1] + " " + (numScores === 1 ? "round" : "rounds") + ".";
            }
        }

        return scoreText;
    };

    /* Returns the data for all of the active multiplayer games of which the logged-in user is a part */
    function getActiveMultiplayerGames() {
        return new WinJS.Promise(function (complete, error) {
            RC.firebaseRoot.child("users/" + RC.loggedInUser.id + "/games/multiplayer/active/").once("value", function (dataSnapshot) {
                // Get the IDs of all active multiplayer games of which the logged-in user is a part
                var activeMultiplayerGameIds = dataSnapshot.val();

                // Get the data for each multiplayer game
                var multiplayerGamePromises = [];
                activeMultiplayerGameIds.forEach(function (multiplayerGameId) {
                    multiplayerGamePromises.push(getMultiplayerGameData(multiplayerGameId));
                });

                // Return the data for all of the multiplayer games
                WinJS.Promise.join(multiplayerGamePromises).done(function (multiplayerGames) {
                    complete(multiplayerGames);
                });
            });
        });
    };


    function getMultiplayerGameData(gameId) {
        return new WinJS.Promise(function (complete, error) {
            RC.firebaseRoot.child("multiplayerGames/" + gameId + "/").once("value", function(dataSnapshot) {
                var multiplayerGame = dataSnapshot.val();
                multiplayerGame.id = gameId;
                complete(multiplayerGame);
            });
        });
    };
})();