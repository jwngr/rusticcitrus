// For an introduction to the Page Control template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232511
(function () {
    "use strict";

    /****************************/
    /*  GAMES HUB PAGE CONTROL  */
    /****************************/
    WinJS.UI.Pages.define("/pages/statsHub/statsHub.html", {
        /* Responds to navigations to this page */
        ready: function (element, options) {
            // TODO: make sure this doesn't crash when starting on this page
            RC.assert(typeof (RC.HighScores.dictionary) === "object", "High scores dictionary should already be defined");
            RC.assert(typeof (RC.Achievements.dictionary) === "object", "Achievements dictionary should already be defined");

            // Initialize the stats hub list event listeners
            initializeStatsHubEventListeners();

            // Create the stats list view data sources
            var highScoresDataSource = WinJS.Class.derive(WinJS.UI.VirtualizedDataSource, function () {
                this._baseDataSourceConstructor(new highScoresDataAdapter());
            });
            //var statsDataSource = WinJS.Class.derive(WinJS.UI.VirtualizedDataSource, function () {
            //    this._baseDataSourceConstructor(new statsDataAdapter());
            //});

            // Populate the achievements data
            populateAchievementsData();

            // Add the stats list view data sources to the RC.Stats namespace
            WinJS.Namespace.defineWithParent(RC, "Stats", {
                highScoresDataSource: new highScoresDataSource,
                //statsDataSource: new statsDataSource
            });
        },

        /* Responds to navigations away from this page */
        unload: function () {
            disposeStatsHubEventListeners();
        },

        /* Responds to changes in the view state */
        updateLayout: function (element) {
        }
    });

    /*********************/
    /*  EVENT LISTENERS  */
    /*********************/
    /* Initializes the stats hub event listeners */
    function initializeStatsHubEventListeners() {
        // Get the stats hub
        var statsHub = $(".statsHub .hub")[0];

        // Navigate to the high scores page when the high scores header is invoked
        statsHub.addEventListener("headerinvoked", navigateToStatsHubSubpage);
    };

    /* Disposes of the stats hub event listeners */
    function disposeStatsHubEventListeners() {
        // Get the stats hub
        var statsHub = $(".statsHub .hub")[0];

        // Navigate to the high scores page when the high scores header is invoked
        statsHub.removeEventListener("headerinvoked", navigateToStatsHubSubpage);
    };

    function navigateToStatsHubSubpage(event) {
        switch (event.detail.index) {
            case 0:
                WinJS.Navigation.navigate("/pages/highScores/highScores.html");
                break;
            case 1:
                WinJS.Navigation.navigate("/pages/achievements/achievements.html");
                break
        }
    };

    /*******************/
    /*  DATA ADAPTERS  */
    /*******************/
    /* Retrieves the logged-in user's high scores */
    var highScoresDataAdapter = WinJS.Class.define(
        // Constructor
        function () {
            this._maxNumHighScoresToShow = 10;
            this._numHighScores = undefined;
        },

        // IListDataAdapter methods
        {
            // Retrieve the item at the requested index (and possibly some items before and after it)
            itemsFromIndex: function (requestIndex, countBefore, countAfter) {
                RC.assert(typeof(RC.HighScores.dictionary) === "object", "High scores dictionary should already be defined");
                RC.assert(typeof(this._numHighScores) === "number", "Number of high scores should be defined in getCount()");

                var _this = this;
                return new WinJS.Promise(function (complete, error) {
                    // TODO: remove or accept the Firebase way of doing this
                    /*RC.firebaseRoot.child("users/" + RC.loggedInUserId + "/games/singlePlayer/completed").once("value", function (dataSnapshot) {
                        var completedSinglePlayerGames = dataSnapshot.val();
                        var numCompletedSinglePlayerGames = completedSinglePlayerGames.length;
                        var results = [];
                        for (var i = requestIndex - countBefore; i < requestIndex + countAfter, i < numCompletedSinglePlayerGames; ++i) {
                            var game = completedSinglePlayerGames[i];
                            game.isPlaceholder = false;
                            results.push({
                                key: i.toString(),
                                data: game
                            });

                            if (results.length == maxNumItems) {
                                break;
                            }
                        }
                        return complete({
                            items: results,
                            offset: countBefore,
                            totalCount: Math.min(numCompletedSinglePlayerGames, maxNumItems)
                        });
                    });*/


                    var highScoresDictionary = RC.HighScores.dictionary;
                    var highScoresList = [];
                    for (var key in highScoresDictionary) {
                        highScoresList = highScoresList.concat(highScoresDictionary[key]);
                    }
                    highScoresList.sort(function (a, b) {
                        return b.score - a.score
                    });
                    highScoresList = highScoresList.slice(0, _this._maxNumHighScoresToShow);

                    var results = [];
                    for (var i = requestIndex - countBefore; i < requestIndex + countAfter, i < highScoresList.length; ++i) {
                        var game = highScoresList[i];
                        game.isPlaceholder = false;
                        results.push({
                            key: i.toString(),
                            data: game
                        });
                    }

                    return complete({
                        items: results,
                        offset: countBefore,
                        totalCount: results.length
                    });
                });
            },

            // Returns the number of items in the result list
            getCount: function () {
                RC.assert(typeof (RC.HighScores.dictionary) === "object", "High scores dictionary should already be defined");

                var _this = this;
                // TODO: remove or accept the Firebase way of doing this
                /*return new WinJS.Promise(function (complete, error) {
                    RC.firebaseRoot.child("users/" + RC.loggedInUserId + "/games/singlePlayer/completed").once("value", function (dataSnapshot) {
                        complete(Math.min(dataSnapshot.numChildren(), _this._maxNumItems));
                    });
                });*/

                return new WinJS.Promise(function (complete, error) {
                    var highScoresDictionary = RC.HighScores.dictionary;
                    _this._numHighScores = 0;
                    for (var key in highScoresDictionary) {
                        _this._numHighScores += highScoresDictionary[key].length;
                    }
                    complete(Math.min(_this._numHighScores, _this._maxNumHighScoresToShow));
                });
            }
        }
    );


    /***********************/
    /*  ACHIEVEMENTS DATA  */
    /***********************/
    function populateAchievementsData() {
        RC.assert(typeof (RC.Achievements) == "object", "Achievements namespace should already be defined");
        RC.assert(typeof (RC.Achievements.dictionary) === "object", "Achievements dictionary should be undefined");

        // Get the completion ratio and percentage for each achievement type
        var completionDictionary = {};
        for (var key in RC.Achievements.dictionary) {
            // Get the current achievements list
            var achievementsList = RC.Achievements.dictionary[key];
            var numAchievements = achievementsList.length;

            // Determine how many of achievements in the current list are complete
            var numAchievementsCompleted = 0;
            for (var i = 0; i < numAchievements; ++i) {
                if (achievementsList[i].isComplete) {
                    numAchievementsCompleted += 1;
                }
            }

            // Determine the completion percentage
            var completionPercentage = (numAchievementsCompleted / numAchievements * 100).toFixed(1);
            if (completionPercentage == "100.0") {
                completionPercentage = "100";
            }

            // Add the current key to the completion dictionary
            completionDictionary[key] = {
                numAchievements: numAchievements,
                numAchievementsCompleted: numAchievementsCompleted,
                ratio: numAchievementsCompleted + "/" + numAchievements,
                percentage: completionPercentage + "%"
            }
        }

        // Populate the achievements data
        $("#fiveLetterAchievementsGrid > .ratio").text(completionDictionary["5"].ratio);
        $("#fiveLetterAchievementsGrid > .percentage").text(completionDictionary["5"].percentage);
        $("#sixLetterAchievementsGrid > .ratio").text(completionDictionary["6"].ratio);
        $("#sixLetterAchievementsGrid > .percentage").text(completionDictionary["6"].percentage);
        $("#sevenLetterAchievementsGrid > .ratio").text(completionDictionary["7"].ratio);
        $("#sevenLetterAchievementsGrid > .percentage").text(completionDictionary["7"].percentage);
        $("#miscellaneousAchievementsGrid > .ratio").text(completionDictionary["Miscellaneous"].ratio);
        $("#miscellaneousAchievementsGrid > .percentage").text(completionDictionary["Miscellaneous"].percentage);

        // Calculate and populate the all achievements data
        var numAllAchievements = completionDictionary["5"].numAchievements + completionDictionary["6"].numAchievements + completionDictionary["7"].numAchievements + completionDictionary["Miscellaneous"].numAchievements;
        var numAllAchievementsCompleted = completionDictionary["5"].numAchievementsCompleted + completionDictionary["6"].numAchievementsCompleted + completionDictionary["7"].numAchievementsCompleted + completionDictionary["Miscellaneous"].numAchievementsCompleted;
        var completionPercentage = (numAllAchievementsCompleted / numAllAchievements * 100).toFixed(1);
        if (completionPercentage == "100.0") {
            completionPercentage = "100";
        }
        $("#allAchievementsGrid > .ratio").text(numAllAchievementsCompleted + "/" + numAllAchievements);
        $("#allAchievementsGrid > .percentage").text(completionPercentage + "%");

    };
})();
