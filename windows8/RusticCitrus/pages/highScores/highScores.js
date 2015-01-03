(function () {
    "use strict";

    /******************************/
    /*  HIGH SCORES PAGE CONTROL  */
    /******************************/
    WinJS.UI.Pages.define("/pages/highScores/highScores.html", {
        /* Responds to navigations to this page */
        ready: function (element, options) {
            if (RC.HighScores.dictionary === undefined) {
                // If we are resuming from suspension, the high scores dictionary may not be defined, so
                // define it before we bind the data to the list view
                loadHighScores(function () {
                    createHighScoresBindingData(bindDataToHighScoresListView);
                })
            }
            else {
                // Otherwise, we should bind the data to the list view once the binding data is defined
                if (RC.HighScores.groupedList === undefined) {
                    createHighScoresBindingData(bindDataToHighScoresListView);
                }
                else {
                    bindDataToHighScoresListView();
                }
            }
        },

        /* Responds to navigations away from this page */
        unload: function () {
        },

        /* Responds to changes in the view state */
        updateLayout: function (element) {
        }
    });


    /***********************************/
    /*  HIGH SCORES LIST VIEW BINDING  */
    /***********************************/
    /* Loads the high scores data and binds it to the corresponding list view */
    function loadHighScores(callback) {
        RC.assert(typeof (RC.HighScores) === "object", "HighScores namespace should already be defined");
        RC.assert(typeof (RC.HighScores.dictionary) === "undefined", "High scores dictionary should be undefined");

        // Create the high scores dictionary and binding data from file
        Windows.Storage.ApplicationData.current.localFolder.getFileAsync("scores.2.0.txt")
            /* Read the input file */
            .then(function (inputFile) {
                return Windows.Storage.FileIO.readTextAsync(inputFile);
            })

            /* Successfully retrieved data */
            .done(function (data) {
                RC.assert(typeof (data) == "string" && data != "", "High scores text file should not be empty");
                WinJS.Namespace.defineWithParent(RC, "HighScores", {
                    dictionary: $.parseJSON(data)
                });
                if (callback) {
                    callback();
                }
            },

            /* File not found */
            function () {
                createInitialHighScoresFile();
            }
        );
    };

    /* Binds the data in the high scores dictinoary to the high scores list view */
    function createHighScoresBindingData(callback) {
        // Get the high scores dictionary
        var highScoresDictionary = RC.HighScores.dictionary;

        // Concatenate the dictionary items into a list (only including the top ten scores for each key)
        var highScoresList = [];
        for (var key in highScoresDictionary) {
            // Get the current scores list and its length
            var currentScoresList = highScoresDictionary[key];
            var numCurrentScores = currentScoresList.length;

            // If there are no scores for the current number of letters, create an empty placeholder so the group header shows up
            if (numCurrentScores == 0) {
                highScoresList = highScoresList.concat({ numLetters: parseInt(key), isPlaceholder: true });
            }
            else {
                // Make sure each score has a date created and set isPlaceholder to false
                // Note: this is for versioning purposes as these fields didn't exist in version 1.0
                for (var i = 0; i < numCurrentScores; ++i) {
                    var currentScore = currentScoresList[i];
                    if (currentScore.dateCreated === undefined) {
                        currentScore.dateCreated = RC.getCurrentDateAsString();
                    }
                    currentScore.isPlaceholder = false;
                }

                // Only add the top ten scores to the high scores list
                highScoresList = highScoresList.concat(currentScoresList.slice(0, 10));
            }
        }

        // Convert the list into a WinJS list
        highScoresList = new WinJS.Binding.List(highScoresList);

        // Group the high scores list
        var groupedHighScoresList = highScoresList.createGrouped(
            /* Returns the key of the group to which an item belongs */
            function (dataItem) {
                return dataItem.numLetters;
            },

            /* Returns the title of the group to which an item belongs */
            function (dataItem) {
                return {
                    title: dataItem.numLetters + " Letters"
                };
            },

            /* Sorts the groups */
            function (leftKey, rightKey) {
                return leftKey - rightKey;
            }
        );

        // Make the data publicly accessible
        WinJS.Namespace.defineWithParent(RC, "HighScores", {
            groupedList: groupedHighScoresList
        });

        if (callback) {
            callback();
        }
    };

    /* Binds the high scores data to the high scores list view */
    function bindDataToHighScoresListView(element) {
        // Get the high scores list view
        var highScoresListView = $("#highScoresListView")[0].winControl;

        // Bind the data to the high scores list view
        highScoresListView.itemDataSource = RC.HighScores.groupedList.dataSource;
        highScoresListView.groupDataSource = RC.HighScores.groupedList.groups.dataSource;
    };


    /**********************/
    /*  HELPER FUNCTIONS  */
    /**********************/
    /* Creates the initial high scores file */
    function createInitialHighScoresFile() {
        Windows.Storage.ApplicationData.current.localFolder.createFileAsync("scores.2.0.txt", Windows.Storage.CreationCollisionOption.replaceExisting)
            /* Write to the output file */
            .then(function (outputFile) {
                // Start with an empty high scores dictionary
                var highScoresDictionary = {
                    "5": [],
                    "6": [],
                    "7": []
                };

                // If we are in debug mode, seed the high scores file with some fake data
                if (RC.debug) {
                    seedHighScoresFile_DEBUG(highScoresDictionary);
                }

                // Write the high scores JSON string to the output file
                return Windows.Storage.FileIO.writeTextAsync(outputFile, JSON.stringify(highScoresDictionary));
            })

            /* Done writing */
            .done(function () {
                loadHighScores();
            }
        );
    };

    /* Seeds the high scores file by adding a bunch of fake high scores */
    function seedHighScoresFile_DEBUG(highScoresDictionary) {
        if (!RC.debug) {
            console.error("This is a debug only function and should not be called when debug is set to false.");
            debug;
        }

        highScoresDictionary["5"] = [
            { score: 18340, numLetters: 5, numRoundsCompleted: 14, numWordsFound: 280, dateCreated: "Mon Sep 16 20:00:00 PDT 2013" },
            { score: 13200, numLetters: 5, numRoundsCompleted: 12, numWordsFound: 197, dateCreated: "Wed Sep 18 22:00:00 PDT 2013" },
            { score: 8920, numLetters: 5, numRoundsCompleted: 9, numWordsFound: 141, dateCreated: "Mon Sep 16 10:54:00 PDT 2013" },
            { score: 1800, numLetters: 5, numRoundsCompleted: 4, numWordsFound: 50, dateCreated: "Mon Sep 16 20:43:00 PDT 2013" },
            { score: 1270, numLetters: 5, numRoundsCompleted: 3, numWordsFound: 43, dateCreated: "Mon Sep 16 20:00:00 PDT 2013" },
            { score: 670, numLetters: 5, numRoundsCompleted: 2, numWordsFound: 17, dateCreated: "Sun Sep 15 21:00:00 PDT 2013" },
            { score: 670, numLetters: 5, numRoundsCompleted: 1, numWordsFound: 25, dateCreated: "Mon Sep 16 20:00:00 PDT 2013" },
            { score: 670, numLetters: 5, numRoundsCompleted: 2, numWordsFound: 15, dateCreated: "Mon Sep 16 12:00:00 PDT 2013" },
            { score: 550, numLetters: 5, numRoundsCompleted: 1, numWordsFound: 18, dateCreated: "Mon Sep 16 09:00:00 PDT 2013" },
            { score: 30, numLetters: 5, numRoundsCompleted: 0, numWordsFound: 1, dateCreated: "Mon Sep 16 07:09:00 PDT 2013" },
            { score: 0, numLetters: 5, numRoundsCompleted: 0, numWordsFound: 0, dateCreated: "Mon Sep 16 07:09:00 PDT 2013" }
        ];

        highScoresDictionary["6"] = [
            { score: 20670, numLetters: 6, numRoundsCompleted: 16, numWordsFound: 340, dateCreated: "Mon Sep 16 20:02:00 PDT 2013" },
            { score: 13450, numLetters: 6, numRoundsCompleted: 12, numWordsFound: 202, dateCreated: "Mon Sep 16 05:02:01 PDT 2013" },
            { score: 13430, numLetters: 6, numRoundsCompleted: 11, numWordsFound: 180, dateCreated: "Mon Sep 16 20:01:10 PDT 2013" },
            { score: 11890, numLetters: 6, numRoundsCompleted: 10, numWordsFound: 170, dateCreated: "Mon Sep 16 03:01:55 PDT 2013" },
            { score: 8770, numLetters: 6, numRoundsCompleted: 8, numWordsFound: 132, dateCreated: "Mon Sep 16 20:03:02 PDT 2013" },
            { score: 7880, numLetters: 6, numRoundsCompleted: 6, numWordsFound: 126, dateCreated: "Mon Sep 16 02:20:30 PDT 2013" },
            { score: 800, numLetters: 6, numRoundsCompleted: 2, numWordsFound: 18, dateCreated: "Mon Sep 16 20:03:00 PDT 2013" },
            { score: 460, numLetters: 6, numRoundsCompleted: 1, numWordsFound: 8, dateCreated: "Mon Sep 16 10:00:03 PDT 2013" }
        ];

        highScoresDictionary["7"] = [
            { score: 18280, numLetters: 7, numRoundsCompleted: 14, numWordsFound: 282, dateCreated: "Mon Sep 16 10:00:50 PDT 2013" },
            { score: 10250, numLetters: 7, numRoundsCompleted: 8, numWordsFound: 165, dateCreated: "Mon Sep 16 22:00:00 PDT 2013" },
            { score: 4120, numLetters: 7, numRoundsCompleted: 5, numWordsFound: 79, dateCreated: "Mon Sep 16 21:00:55 PDT 2013" },
            { score: 2410, numLetters: 7, numRoundsCompleted: 6, numWordsFound: 56, dateCreated: "Mon Sep 16 20:04:00 PDT 2013" },
            { score: 300, numLetters: 7, numRoundsCompleted: 1, numWordsFound: 7, dateCreated: "Mon Sep 16 22:40:00 PDT 2013" },
            { score: 0, numLetters: 7, numRoundsCompleted: 0, numWordsFound: 0, dateCreated: "Mon Sep 16 20:00:32 PDT 2013" }
        ];
    };

    /* Inserts a new score into the high scores dictionary */
    function insertNewScore(newScore) {
        RC.assert(typeof (newScore) == "object", "newScore is not an object");
        RC.assert(typeof (newScore.score) == "number", "score is not a number");
        RC.assert(typeof (newScore.numLetters) == "number", "numLetters is not a number");
        RC.assert(typeof (newScore.numRoundsCompleted) == "number", "numRoundsCompleted is not a number");
        RC.assert(typeof (newScore.numWordsFound) == "number", "numWordsFound is not a number");
        RC.assert(typeof (newScore.dateCreated) == "string", "dateCreated is not a string");

        // Get the high scores dictionary
        var highScoresDictionary = RC.HighScores.dictionary;

        // Get the high scores list for the corresponding number of letters
        var highScoresList = highScoresDictionary[newScore.numLetters.toString()];
        RC.assert(typeof (highScoresList) === "object", "High scores list for " + newScore.numLetters + " letters is not defined");

        // Insert the new score in the correct position
        highScoresList.push(newScore);
        highScoresList.sort(function (a, b) {
            return b.score - a.score;
        })

        // Re-create the high scores binding data
        createHighScoresBindingData();

        // Update the high scores file
        updateHighScoresFile();
    };

    /* Resets the high scores by deleting them all */
    function resetHighScores() {
        // Reset the high scores dictionary
        var highScoresDictionary = RC.HighScores.dictionary;
        for (var key in highScoresDictionary) {
            highScoresDictionary[key] = [];
        }

        // TODO: delete the high scores in firebase
        
        // Re-create the high scores binding data
        createHighScoresBindingData();

        // Update the high scores file
        updateHighScoresFile();
    };

    /* Writes over the current high scores file with the inputted high scores dictionary */
    function updateHighScoresFile(callback) {
        Windows.Storage.ApplicationData.current.localFolder.createFileAsync("scores.2.0.txt", Windows.Storage.CreationCollisionOption.replaceExisting)
            /* Write to output file */
            .then(function (outputFile) {
                return Windows.Storage.FileIO.writeTextAsync(outputFile, JSON.stringify(RC.HighScores.dictionary));
            })

            /* Done writing */
            .done(function () {
                if (callback) {
                    callback();
                }
            }
        );
    };

    /* Deletes the high scores file (debug only) */
    function deleteHighScoresFile_DEBUG(callback) {
        if (!RC.debug) {
            console.error("This is a debug only function and should not be called when debug is set to false.");
            debug;
        }
        
        Windows.Storage.ApplicationData.current.localFolder.getFileAsync("scores.2.0.txt").done(
            /* File exists */
            function (file) {
                file.deleteAsync().done(
                    /* File deleted */
                    function () {
                        if (callback) {
                            callback();
                        }
                    },
                    /* File not deleted */
                    function (error) {
                        console.log("scores.2.0.txt has already been deleted");
                    }
                );
            },
            
            /* File does not exist */
            function (err) {
                console.warn("scores.2.0.txt has already been deleted.");

                if (callback) {
                    callback();
                }
            }
        )
    };

    // Create the HighScores sub-namespace
    WinJS.Namespace.defineWithParent(RC, "HighScores", {
        load: loadHighScores,
        reset: resetHighScores,
        insertNewScore: insertNewScore,
        deleteFile_DEBUG: deleteHighScoresFile_DEBUG
    });
})();