(function () {
    "use strict";

    /* IListDataAdapter for retrieving the logged-in user's single player games */
    var singlePlayerGamesDataAdapter = WinJS.Class.define(
        // Constructor
        function () {
            // List to hold all the logged-in player's active single player games
            this.items = null;
        },

        // IListDataAdapter methods
        {
            // Retrieve the item at the requested index (and possibly some items before and after it)
            itemsFromIndex: function (requestIndex, countBefore, countAfter) {
                RC.assert(typeof (RC.SinglePlayerGames.list) === "object", "Single player games list should already be defined");

                // Create the single player games list if it is null
                var _this = this;
                if (this.items === null) {
                    _this.items = [];
                    RC.SinglePlayerGames.list.forEach(function (game, i) {
                        _this.items.push({
                            key: i.toString(),
                            data: {
                                isPlaceholder: (game.currentRound === undefined),
                                game: game
                            }
                        });
                    });
                }

                // Determine which results to return given the inputted values
                var _this = this;
                return new WinJS.Promise(function (complete, error) {
                    var numItems = _this.items.length;
                    var startIndex = requestIndex - countBefore;
                    var endIndex = Math.min(requestIndex + countAfter, numItems - 1)
                    return complete({
                        items: _this.items.slice(startIndex, endIndex + 1),
                        offset: requestIndex - startIndex,
                        totalCount: numItems
                    });
                });
            },

            // Returns the number of items in the result list
            getCount: function () {
                RC.assert(typeof (RC.SinglePlayerGames.list) === "object", "Single player games list should already be defined");

                var _this = this;
                return new WinJS.Promise(function (complete, error) {
                    if (_this.items) {
                        complete(_this.items.length);
                    }
                    else {
                        complete(RC.SinglePlayerGames.list.length);
                    }
                });
            },

            /* Updates the data of a list item */
            change: function (key, data, index) {
                RC.assert(this.items[index].key === key, "key and index do not correspond to the same item");
                this.items[index].data = data;
                return new WinJS.Promise.wrap(null);
            }
        }
    );

    /* Loads the single player games into the global RC namespace */
    function loadSinglePlayerGames(callback) {
        Windows.Storage.ApplicationData.current.localFolder.getFileAsync("singlePlayerGames.txt")
            /* Read the input file */
            .then(function (inputFile) {
                return Windows.Storage.FileIO.readTextAsync(inputFile);
            })

            /* Successfully retrieved data */
            .done(function (data) {
                RC.assert(typeof (data) == "string" && data != "", "Single players games text file should not be empty");
                WinJS.Namespace.defineWithParent(RC, "SinglePlayerGames", {
                    list: $.parseJSON(data)
                });

                if (callback) {
                    callback();
                }
            },

            /* File not found */
            function () {
                createInitialSinglePlayerGamesFile(function () {
                    loadSinglePlayerGames(function () {
                        if (callback) {
                            callback();
                        }
                    });
                });
            }
        );
    };

    /* Creates the initial single player games file with empty games for each letter length */
    function createInitialSinglePlayerGamesFile(callback) {
        Windows.Storage.ApplicationData.current.localFolder.createFileAsync("singlePlayerGames.txt", Windows.Storage.CreationCollisionOption.replaceExisting)
            /* Write to output file */
            .then(function (outputFile) {
                var games = [
                    {
                        "numLetters": 5
                    },
                    {
                        "numLetters": 6
                    },
                    {
                        "numLetters": 7
                    }
                ];

                // If we are in debug mode, seed the single player games file with some fake data
                if (RC.debug) {
                    games = seedSinglePlayerGamesFile_DEBUG();
                }

                return Windows.Storage.FileIO.writeTextAsync(outputFile, JSON.stringify(games));
            })

            /* Done writing */
            .done(function () {
                if (callback) {
                    callback();
                }
            }
        );
    };

    /* Seeds the single player games file by adding a bunch of fake games */
    function seedSinglePlayerGamesFile_DEBUG() {
        if (!RC.debug) {
            console.error("This is a debug only function and should not be called when debug is set to false.");
            debug;
        }

        return [
            {
                "score": 18340,
                "numLetters": 5,
                "numRoundsCompleted": 14,
                "numWordsFound": 138,
                "pastRoundWords": ["BRAGS", "PAGED", "PAINT", "PAINS", "OUSTS", "OUTER", "ORDER", "NICER", "UNDER", "MOTEL", "MOTOR", "MALLS", "HOURS", "HONKS"],
                "numConsecutivePerfectRounds": 2,
                "dateCreated": "Mon Sep 16 20:00:00 PDT 2013",
                "dateModified": "Tue Sep 17 22:03:03 PDT 2013",
                "currentRound": {
                    "word": "ZEBRA",
                    "secondsRemaining": 3,
                    "foundWords": []
                },
                "startNewRound": false
            },
            {
                "numLetters": 6
            },
            {
                "score": 24990,
                "numLetters": 7,
                "numRoundsCompleted": 14,
                "numWordsFound": 158,
                "pastRoundWords": ["BRAGGED", "PIGEONS", "PAINTED", "PAINFUL", "OUTSETS", "OUTRUNS", "ORDINAL", "NUCLEAR", "NUANCES", "MOTIONS", "MOTIVES", "MALLETS", "HORRIFY", "HONKING"],
                "numConsecutivePerfectRounds": 0,
                "dateCreated": "Mon Sep 16 20:00:00 PDT 2013",
                "dateModified": "Tue Sep 17 22:03:03 PDT 2013",
                "currentRound": {
                    "word": "PERSONA",
                    "secondsRemaining": 70,
                    "foundWords": ["ONE", "PAN", "PER", "SON", "ROSE", "NOSE", "PERSON", "PERSONA"]
                },
                "startNewRound": false
            }
        ]
    };

    /* Resets the single player game corresponding to the inputted list index in the single player games data source */
    function updateSinglePlayerGame(singlePlayerGamesListIndex, updatedGameData) {
        RC.assert(singlePlayerGamesListIndex + RC.smallestNumLetters == updatedGameData.numLetters, "Incorrect single player games data list index passed in");
        
        // Update the game data in Firebase
        RC.firebaseRoot.child("users/" + RC.loggedInUser.id + "/games/singlePlayer/active/" + singlePlayerGamesListIndex).set(updatedGameData);

        // Create the updated single player game list item
        var updatedListItemData = {
            "isPlaceholder": updatedGameData.score === undefined,
            "game": updatedGameData
        };

        // Update the single player games data source
        RC.SinglePlayerGames.dataSource.change(singlePlayerGamesListIndex.toString(), updatedListItemData, singlePlayerGamesListIndex);

        // Update the single player games list
        RC.SinglePlayerGames.list[singlePlayerGamesListIndex] = updatedGameData;
    };

    /* Adds the inputted game data to the completed single player games list in Firebase */
    function addToCompletedSinglePlayerGames(gameData) {
        RC.firebaseRoot.child("users/" + RC.loggedInUser.id + "/games/singlePlayer/completed/").push(gameData);
    };

    /* Resets the single player games by deleting them all */
    function resetSinglePlayerGames() {
        // Update the single player games data source and list and Firebase
        for (var i = 0; i < 3; ++i) {
            this.updateSinglePlayerGame(i, {
                "numLetters": i + RC.smallestNumLetters
            });
        }

        // Update the single player games file
        // Note: this relies on RC.SinglePlayerGames.list already being updated
        updateSinglePlayerGamesFile();
    };

    /* Writes over the current single player games file with the global single player games list */
    function updateSinglePlayerGamesFile() {
        RC.assert(typeof (RC.SinglePlayerGames.list) === "object", "Single player games list should already be defined");

        Windows.Storage.ApplicationData.current.localFolder.createFileAsync("singlePlayerGames.txt", Windows.Storage.CreationCollisionOption.replaceExisting)
            /* Write to output file */
            .then(function (outputFile) {
                return Windows.Storage.FileIO.writeTextAsync(outputFile, JSON.stringify(RC.SinglePlayerGames.list));
            })

            /* Done writing */
            .done(function () {
            }
        );
    };

    /* Deletes the single player games file (debug only) */
    function deleteSinglePlayerGamesFile_DEBUG(callback) {
        if (!RC.debug) {
            // Don't do anything if we are not in debug mode
            if (callback()) {
                callback();
            }
        }
        else {
            // If we are in debug mode, delete the single player games file
            return Windows.Storage.ApplicationData.current.localFolder.getFileAsync("singlePlayerGames.txt").done(
                /* File exists */
                function (file) {
                    file.deleteAsync().done(function() {
                        if (callback()) {
                            callback();
                        }
                    });
                },

                /* File does not exist */
                function (err) {
                    console.warn("singlePlayerGames.txt has already been deleted.");
                    if (callback()) {
                        callback();
                    }
                }
            );
        }
    };

    // Create the SinglePlayerGames sub-namespace
    WinJS.Namespace.defineWithParent(RC, "SinglePlayerGames", {
        dataAdapter: singlePlayerGamesDataAdapter,
        load: loadSinglePlayerGames,
        reset: resetSinglePlayerGames,
        updateGame: updateSinglePlayerGame,
        addToCompletedGames: addToCompletedSinglePlayerGames,
        updateFile: updateSinglePlayerGamesFile,
        deleteFile_DEBUG: deleteSinglePlayerGamesFile_DEBUG
    });
})();