(function () {
    "use strict";

    /*******************************/
    /*  ACHIEVEMENTS PAGE CONTROL  */
    /*******************************/
    WinJS.UI.Pages.define("/pages/achievements/achievements.html", {
        /* Responds to navigations to this page */
        ready: function (element, options) {
            if (RC.Achievements.dictionary === undefined) {
                // If we are resuming from suspension, the achievements dictionary may not be defined, so
                // define it before we bind the data to the list view
                loadAchievements(function () {
                    createAchievementsBindingData(bindDataToAchievementsListView);

                    // Unlock the "Uber Meta" achievement
                    unlockAchievements([{
                        achievement: RC.Achievements.dictionary["Miscellaneous"][9],
                        expectedName: "Uber Meta"
                    }]);
                })
            }
            else {
                // Otherwise, we should bind the data to the list view once the binding data is defined
                if (RC.Achievements.groupedList === undefined) {
                    createAchievementsBindingData(bindDataToAchievementsListView);

                    // Unlock the "Uber Meta" achievement
                    unlockAchievements([{
                        achievement: RC.Achievements.dictionary["Miscellaneous"][9],
                        expectedName: "Uber Meta"
                    }]);
                }
                else {
                    bindDataToAchievementsListView();
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


    /************************************/
    /*  ACHIEVEMENTS LIST VIEW BINDING  */
    /************************************/
    /* Loads the achievements data and binds it to the corresponding list view */
    function loadAchievements(callback) {
        RC.assert(typeof (RC.Achievements) == "object", "Achievements namespace should already be defined");
        RC.assert(typeof (RC.Achievements.dictionary) === "undefined", "Achievements dictionary should be undefined");

        // Create the achievements dictionary and binding data from file
        Windows.Storage.ApplicationData.current.localFolder.getFileAsync("achievements.2.0.txt")
            /* Read the input file */
            .then(function (inputFile) {
                return Windows.Storage.FileIO.readTextAsync(inputFile);
            })

            /* Successfully retrieved data */
            .done(function (data) {
                RC.assert(typeof (data) == "string" && data != "", "Achievements text file should not be empty");
                WinJS.Namespace.defineWithParent(RC, "Achievements", {
                    dictionary: $.parseJSON(data)
                });
                if (callback) {
                    callback();
                }
            },

            /* File not found */
            function () {
                createInitialAchievementsFile();
            }
        );
    };

    /* Turns a dictionary of achievements into a WinJS list which is then binded to the achievements list view */
    function createAchievementsBindingData(callback) {
        // Get the achievements dictionary
        var achievementsDictionary = RC.Achievements.dictionary;

        // Concatenate the dictionary items into a list
        var achievementsList = [];
        for (var key in achievementsDictionary) {
            achievementsList = achievementsList.concat(achievementsDictionary[key]);
        }

        // Convert the list into a WinJS list
        achievementsList = new WinJS.Binding.List(achievementsList);

        // Group the achievements list
        var groupedAchievementsList = achievementsList.createGrouped(
            /* Returns the key of the group to which an item belongs */
            function (dataItem) {
                return dataItem.groupName;
            },

            /* Returns the title of the group to which an item belongs */
            function (dataItem) {
                return {
                    title: dataItem.groupName
                };
            },

            /* Sorts the groups */
            function (leftKey, rightKey) {
                return leftKey.charCodeAt(0) - rightKey.charCodeAt(0);
                
            }
        );

        // Make the data publicly accessible
        WinJS.Namespace.defineWithParent(RC, "Achievements", {
            groupedList: groupedAchievementsList
        });

        if (callback) {
            callback();
        }
    };

    /* Binds the achievements data to the achievements list view */
    function bindDataToAchievementsListView(element) {
        // Get the achievements list view
        var achievementsListView = $("#achievementsListView")[0].winControl;

        // Bind the data to the achievements list view
        achievementsListView.itemDataSource = RC.Achievements.groupedList.dataSource;
        achievementsListView.groupDataSource = RC.Achievements.groupedList.groups.dataSource;
    };


    /**********************/
    /*  HELPER FUNCTIONS  */
    /**********************/
    /* Creates the initial achievements file */
    function createInitialAchievementsFile() {
        Windows.Storage.ApplicationData.current.localFolder.createFileAsync("achievements.2.0.txt", Windows.Storage.CreationCollisionOption.replaceExisting)
            /* Write to the output file */
            .then(function (outputFile) {
                // Create the empty achievements dictionary
                var achievementsDictionary = {};

                // Store the achievements which are common for each word length so that there are no copy and past errors among them
                var commonAchievements = [
                    { name: "High Scorer", description: "Score at least 5,000 points in a single game" },
                    { name: "Allstar", description: "Score at least 10,000 points in a single game" },
                    { name: "Champion", description: "Score at least 50,000 points in a single game" },
                    { name: "El Presidente", description: "Score at least 100,000 points in a single game" },
                    { name: "World Class", description: "Score at least 250,000 points in a single game" },
                    { name: "Just A Spark", description: "Complete 5 rounds in a single game" },
                    { name: "Heating Up", description: "Complete 10 rounds in a single game" },
                    { name: "On Fire", description: "Complete 15 rounds in a single game" },
                    { name: "Inferno", description: "Complete 25 rounds in a single game" },
                    { name: "Supernova", description: "Complete 50 rounds in a single game" },
                    { name: "Lazy Stroll", description: "Complete a round in 100 seconds or less" },
                    { name: "Pep In Your Step", description: "Complete a round in 80 seconds or less" },
                    { name: "Major Hustle", description: "Complete a round in 60 seconds or less" },
                    { name: "Speed Demon", description: "Complete a round in 45 seconds or less" },
                    { name: "Seriously Slow Down", description: "Complete a round in 30 seconds or less" }
                ];

                // Create the achievements lists for each possible number of letters and add them to the achievements dictionary
                var possibleNumLetters = ["5", "6", "7"];
                var numPossibleNumLetters = possibleNumLetters.length;
                var numCommonAchievements = commonAchievements.length;
                for (var i = 0; i < numPossibleNumLetters; ++i) {
                    var numLetters = possibleNumLetters[i];
                    var currentAchievementsList = [];
                    for (var j = 0; j < numCommonAchievements; ++j) {
                        var achievement = commonAchievements[j];
                        currentAchievementsList.push({
                            groupName: numLetters + " Letters",
                            name: achievement.name,
                            description: achievement.description,
                            isComplete: false,
                            dateAchieved: ""
                        });
                    }
                    achievementsDictionary[numLetters] = currentAchievementsList;
                }

                // Add the miscellaneous achievements
                achievementsDictionary["Miscellaneous"] = [
                    { groupName: "Miscellaneous", name: "High Five", description: "Find every word in a five letter round", isComplete: false, dateAchieved: "" },
                    { groupName: "Miscellaneous", name: "Double Sixes", description: "Find every word in a six letter round", isComplete: false, dateAchieved: "" },
                    { groupName: "Miscellaneous", name: "Lucky Seven", description: "Find every word in a seven letter round", isComplete: false, dateAchieved: "" },
                    { groupName: "Miscellaneous", name: "Double Perfecto", description: "Find every word in two consecutive rounds of a single game", isComplete: false, dateAchieved: "" },
                    { groupName: "Miscellaneous", name: "Triple Perfecto", description: "Find every word in three consecutive rounds of a single game", isComplete: false, dateAchieved: "" },
                    { groupName: "Miscellaneous", name: "Going Solo", description: "Qualify for the next round by finding only a single word", isComplete: false, dateAchieved: "" },
                    { groupName: "Miscellaneous", name: "Buzzer Beater", description: "Qualify for the next round by finding the word in the final three seconds", isComplete: false, dateAchieved: "" },
                    { groupName: "Miscellaneous", name: "Bushel of Words", description: "Find 30 words in a single round", isComplete: false, dateAchieved: "" },
                    { groupName: "Miscellaneous", name: "So Meta", description: "Find the words \"RUSTIC\" and \"CITRUS\" in the same round", isComplete: false, dateAchieved: "" },
                    { groupName: "Miscellaneous", name: "Uber Meta", description: "View this achievement (thanks for playing!)", isComplete: false, dateAchieved: "" }
                ]

                // If we are in debug mode, seed the achievements file with some fake data
                if (RC.debug) {
                    seedAchievementsFile_DEBUG(achievementsDictionary);
                }

                // Write the achievements JSON string to the output file
                return Windows.Storage.FileIO.writeTextAsync(outputFile, JSON.stringify(achievementsDictionary));
            })

            /* Done writing */
            .done(function () {
                loadAchievements();
            }
        );
    };

    /* Seed the achievements file by marking some achievements as completed */
    function seedAchievementsFile_DEBUG(achievementsDictionary) {
        if (!RC.debug) {
            console.error("This is a debug only function and should not be called when debug is set to false.");
            debug;
        }

        achievementsDictionary["5"][0].isComplete = true;
        achievementsDictionary["5"][0].dateAchieved = "Tue Sep 17 22:03:03 PDT 2013";
        achievementsDictionary["5"][1].isComplete = true;
        achievementsDictionary["5"][1].dateAchieved = "Mon Sep 16 21:00:55 PDT 2013";
        achievementsDictionary["5"][2].isComplete = true;
        achievementsDictionary["5"][2].dateAchieved = "Tue Sep 17 22:03:03 PDT 2013";
        achievementsDictionary["5"][5].isComplete = true;
        achievementsDictionary["5"][5].dateAchieved = "Mon Sep 16 21:00:55 PDT 2013";
        achievementsDictionary["5"][6].isComplete = true;
        achievementsDictionary["5"][6].dateAchieved = "Mon Sep 16 21:00:55 PDT 2013";
        achievementsDictionary["5"][10].isComplete = true;
        achievementsDictionary["5"][10].dateAchieved = "Tue Sep 17 22:03:03 PDT 2013";
        achievementsDictionary["6"][0].isComplete = true;
        achievementsDictionary["6"][0].dateAchieved = "Mon Sep 16 21:00:55 PDT 2013";
        achievementsDictionary["6"][1].isComplete = true;
        achievementsDictionary["6"][1].dateAchieved = "Mon Sep 16 21:00:55 PDT 2013";
        achievementsDictionary["6"][2].isComplete = true;
        achievementsDictionary["6"][2].dateAchieved = "Mon Sep 16 21:00:55 PDT 2013";
        achievementsDictionary["6"][3].isComplete = true;
        achievementsDictionary["6"][3].dateAchieved = "Tue Sep 17 22:03:03 PDT 2013";
        achievementsDictionary["6"][5].isComplete = true;
        achievementsDictionary["6"][5].dateAchieved = "Tue Sep 17 22:03:03 PDT 2013";
        achievementsDictionary["6"][6].isComplete = true;
        achievementsDictionary["6"][6].dateAchieved = "Tue Sep 17 22:03:03 PDT 2013";
        achievementsDictionary["6"][7].isComplete = true;
        achievementsDictionary["6"][7].dateAchieved = "Tue Sep 17 22:03:03 PDT 2013";
        achievementsDictionary["6"][8].isComplete = true;
        achievementsDictionary["6"][8].dateAchieved = "Mon Sep 16 21:00:55 PDT 2013";
        achievementsDictionary["6"][9].isComplete = true;
        achievementsDictionary["6"][9].dateAchieved = "Tue Sep 17 22:03:13 PDT 2013";
        achievementsDictionary["6"][10].isComplete = true;
        achievementsDictionary["6"][10].dateAchieved = "Mon Sep 16 21:00:15 PDT 2013";
        achievementsDictionary["6"][11].isComplete = true;
        achievementsDictionary["6"][11].dateAchieved = "Mon Sep 16 21:00:25 PDT 2013";
        achievementsDictionary["6"][12].isComplete = true;
        achievementsDictionary["6"][12].dateAchieved = "Tue Sep 17 22:03:23 PDT 2013";
        achievementsDictionary["7"][0].isComplete = true;
        achievementsDictionary["7"][0].dateAchieved = "Tue Sep 17 22:03:02 PDT 2013";
        achievementsDictionary["7"][5].isComplete = true;
        achievementsDictionary["7"][5].dateAchieved = "Tue Sep 17 22:03:12 PDT 2013";
        achievementsDictionary["Miscellaneous"][0].isComplete = true;
        achievementsDictionary["Miscellaneous"][0].dateAchieved = "Tue Sep 17 22:13:03 PDT 2013";
        achievementsDictionary["Miscellaneous"][1].isComplete = true;
        achievementsDictionary["Miscellaneous"][1].dateAchieved = "Mon Sep 16 21:02:55 PDT 2013";
        achievementsDictionary["Miscellaneous"][3].isComplete = true;
        achievementsDictionary["Miscellaneous"][3].dateAchieved = "Mon Sep 16 21:20:55 PDT 2013";
        achievementsDictionary["Miscellaneous"][5].isComplete = true;
        achievementsDictionary["Miscellaneous"][5].dateAchieved = "Mon Sep 16 22:00:55 PDT 2013";
        achievementsDictionary["Miscellaneous"][8].isComplete = true;
        achievementsDictionary["Miscellaneous"][8].dateAchieved = "Mon Sep 16 01:00:55 PDT 2013";
    };

    /* Unlocks an individual achievement and displays a toast notification to the user */
    function unlockAchievements(achievementsList) {
        // We only should update the achievements file if at least one achievement has been unlocked
        var fNeedToUpdateAchievementsFile = false;

        // Unlock each of the achievements in the inputted dictionary
        var numAchievements = achievementsList.length;
        for (var i = 0; i < numAchievements; ++i) {
            // Get the current achievement
            var achievement = achievementsList[i].achievement;
            var expectedName = achievementsList[i].expectedName;
            RC.assert(achievement.name === expectedName, "Achievement \"" + achievement.name + "\" incorrectly indexed. Expected this to be the \"" + expectedName + "\" achievement.");

            // Unlock the achievement if it has not yet been completed
            //if (!RC.licenseInformation.isTrial && !achievement.isComplete) {
            if (!achievement.isComplete) {
                achievement.isComplete = true;
                achievement.dateAchieved = RC.getCurrentDateAsString();
                RC.MessageDialogs.displayAchievementToastNotification(achievement);

                // Signify that the achievements file should be updated since our data has changed
                fNeedToUpdateAchievementsFile = true;
            }
        }

        // Update the achievements file if the achievements data changed
        if (fNeedToUpdateAchievementsFile) {
            updateAchievementsFile();
        }
    };

    /* Resets the achievements by marking them all as incomplete */
    function resetAchievements() {
        // Reset the achievements dictionary
        var achievementsDictionary = RC.Achievements.dictionary;
        for (var key in achievementsDictionary) {
            var achievementsSublist = achievementsDictionary[key];
            var numAchievements = achievementsSublist.length;
            for (var i = 0; i < numAchievements; ++i) {
                achievementsSublist[i].isComplete = false;
            }
        }

        // TODO: delete the achievements in firebase

        // Re-create the achievements binding data
        createAchievementsBindingData();

        // Update the achievements file
        updateAchievementsFile();
    };

    /* Writes over the current achievements file with the inputted achievements dictionary */
    function updateAchievementsFile(callback) {
        Windows.Storage.ApplicationData.current.localFolder.createFileAsync("achievements.2.0.txt", Windows.Storage.CreationCollisionOption.replaceExisting)
            /* Write to output file */
            .then(function (outputFile) {
                // Write the achievements JSON string to the output file
                return Windows.Storage.FileIO.writeTextAsync(outputFile, JSON.stringify(RC.Achievements.dictionary));
            })

            /* Done writing */
            .done(function () {
                if (callback) {
                    callback();
                }
            }
        );
    };

    /* Deletes the achievements file (debug only) */
    function deleteAchievementsFile_DEBUG(callback) {
        if (!RC.debug) {
            console.error("This is a debug only function and should not be called when debug is set to false.");
            debug;
        }

        Windows.Storage.ApplicationData.current.localFolder.getFileAsync("achievements.2.0.txt").done(
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
                        console.log("achievements.2.0.txt already deleted");
                    }
                );
            },

            /* File does not exist */
            function (err) {
                console.warn("achievements.2.0.txt has already been deleted.");

                if (callback) {
                    callback();
                }
            }
        )
    };

    /// Create the Achievements sub-namespace
    WinJS.Namespace.defineWithParent(RC, "Achievements", {
        load: loadAchievements,
        reset: resetAchievements,
        unlock: unlockAchievements,
        deleteFile_DEBUG: deleteAchievementsFile_DEBUG
    });
})();