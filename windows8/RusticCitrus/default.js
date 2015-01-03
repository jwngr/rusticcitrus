//*****************************************************************************************************************************
//  Title: Rustic Citrus
//
//  Version: 1.1 for Windows 8
//  Author: Jacob Wenger
//  Publisher: Floating House Studios
//  Description: Rustic Citrus is a fast-paced, visually beautiful word game where you have two minutes to make as many words
//               as you can from the provided set of letters. Find at least one word which uses every letter to move on to the
//               next round and make your score climb even higher.
//
//*****************************************************************************************************************************

(function () {
    "use strict";

    // Set this flag to avoid WinJS memory leak
    WinJS.Binding.optimizeBindingReferences = true;

    /********************************/
    /*  PAGE-WIDE GLOBAL VARIABLES  */
    /********************************/
    // WinJS variables
    var g_NAV = WinJS.Navigation;
    var g_APP = WinJS.Application;
    var g_LOCAL_FOLDER = Windows.Storage.ApplicationData.current.localFolder;
    var g_LOCAL_SETTINGS = Windows.Storage.ApplicationData.current.localSettings;

    // TODO: make sure all calls to isTrial are properly handled

    // Declare the RC namespace with some global debug flags
    // TODO: make sure these flags are set to false
    WinJS.Namespace.define("RC", {
        debug: true,
        useDebugLicense: false,
        useDevFirebaseRoot: true,
        assert: function (expressionResult, message) {
            if (RC.debug && !expressionResult) {
                console.error(message);
                debugger;
            }
        }
    });

    /****************/
    /*  APP EVENTS  */
    /****************/
    /* Activates or reactivates the app */
    g_APP.onactivated = function (args) {
        if (args.detail.kind === Windows.ApplicationModel.Activation.ActivationKind.launch) {
            // The application has been newly launched
            if (args.detail.previousExecutionState !== Windows.ApplicationModel.Activation.ApplicationExecutionState.terminated) {
            }

            // The application has been reactivated from suspension so restore application state
            else {
                // Restore the navigation history
                if (g_APP.sessionState.history) {
                    g_NAV.history = g_APP.sessionState.history;
                }
            }

            // Otherwise, process the WinJS UI and navigate to the main menu
            args.setPromise(WinJS.UI.processAll().then(function () {
                // Initialize the music and sound effects
                initializeSounds();

                // Initialize the events for the settings flyout
                initializeSettingsEvents();

                // If we are resume from termination, navigate to where we left off
                if (g_NAV.location) {
                    g_NAV.history.current.initialPlaceholder = true;

                    return g_NAV.navigate(g_NAV.location, g_NAV.state);
                }

                // Otherwise, just navigate to the main menu
                else {
                    return g_NAV.navigate(Application.navigator.home);
                }
            }));
        }
    };

    /* Saves app state when the application is about to be suspended */
    g_APP.oncheckpoint = function (args) {
        // Save the navigation history
        g_APP.sessionState.history = g_NAV.history;

        // Update the navigation's state if we are currently playing a game so that we we will resume that same game with no data loss
        if (RC.currentGame) {
            // Cache the current game and round
            var currentGame = RC.currentGame;
            var currentRound = currentGame.currentRound;

            // Make sure all values are valid
            if (RC.debug) {
                console.assert(typeof(currentGame) == "object", "currentGame is not an object");
                console.assert(typeof(currentRound) == "object", "currentRound is not an object");
                console.assert(typeof(currentGame.score) == "number", "score is not a number");
                console.assert(typeof(currentGame.numLetters) == "number", "numLetters is not a number");
                console.assert(typeof(currentGame.numRoundsCompleted) == "number", "numRoundsCompleted is not a number");
                console.assert(typeof(currentGame.numWordsFound) == "number", "numWordsFound is not a number");
                console.assert(typeof(currentRound.secondsRemaining) == "number", "secondsRemaining is not a number");
                console.assert(typeof(currentRound.word) == "string", "currentRoundWord is not a string");
                console.assert(typeof(currentGame.pastRoundWords) == "object", "pastRoundWords is not an object");
                console.assert(typeof(currentGame.numConsecutivePerfectRounds) == "number", "numConsecutivePerfectRounds is not a number");
                console.assert(typeof(currentGame.dateCreated) == "string", "dateCreated is not a string");
                console.assert(typeof (currentRound.foundWords) == "object", "foundWords is not an object");

                if ((typeof(currentGame) != "object") || (typeof(currentRound) != "object") || (typeof(currentGame.score) != "number") || (typeof(currentGame.numLetters) != "number") || (typeof(currentGame.numRoundsCompleted) != "number") || (typeof(currentGame.numWordsFound) != "number") || (typeof(currentRound.secondsRemaining) != "number") || (typeof(currentRound.word) != "string") || (typeof(currentGame.pastRoundWords) != "object") || (typeof(currentGame.numConsecutivePerfectRounds) != "number") || (typeof(currentGame.dateCreated) != "string") || (typeof(currentRound.foundWords) != "object")) {
                    debugger;
                }
            }

            // Save the current game and round information
            var savedGame = {
                // Game information
                numLetters: currentGame.numLetters,
                score: currentGame.score,
                numRoundsCompleted: currentGame.numRoundsCompleted,
                numWordsFound: currentGame.numWordsFound,
                pastRoundWords: currentGame.pastRoundWords,
                dateCreated: currentGame.dateCreated,
                dateModified: RC.getCurrentDateAsString(),
                numConsecutivePerfectRounds: currentGame.numConsecutivePerfectRounds,

                // Round information
                currentRoundWord: currentRound.word,
                secondsRemaining: currentRound.secondsRemaining,
                foundWords: currentRound.foundWords
            };

            // Set the navigation state such that we will resume the current game
            g_APP.sessionState.history.current.state = {
                "mode": "load",
                "startRoundPaused": true,
                "startRoundDone": (currentRound.secondsRemaining == 0),
                "game": savedGame
            }
        }
    };

    /* Populates the settings flyout */
    g_APP.onsettings = function (event) {
        event.detail.applicationcommands = {
            "optionsSettingsFlyout": { title: "Options", href: "/html/default.html" },
            "helpSettingsFlyout": { title: "Help", href: "/html/default.html" },
            "creditsSettingsFlyout": { title: "Credits", href: "/html/default.html" },
            "privacyPolicySettingsFlyout": { title: "Privacy Policy", href: "/html/default.html" }
        };
        WinJS.UI.SettingsFlyout.populateSettings(event);
    };

    /* Handles unhandled exceptions from across the app */
    g_APP.onerror = function (event) {
        // Break if we are in debug mode so we can inspect the event.detail information
        if (RC.debug) {
            console.error(event.detail.errorMessage);
            debugger;
        }

        // Return true if I want to suppress unhandled exceptions
        return false;
    };

    /**********************/
    /*  HELPER FUNCTIONS  */
    /**********************/
    /* Initializes the app */
    document.addEventListener("DOMContentLoaded", initializeApp, false);
    function initializeApp() {
        // Prevent the view state warning images from being dragged
        $("#unplayableViewStateWarning img").on("dragstart", function (event) {
            event.preventDefault();
        });

        // Store a reference to the base of the RC firebase
        if (RC.useDevFirebaseRoot) {
            RC.firebaseRoot = new Firebase("https://rusticcitrus.firebaseio.com/dev");
        }
        else {
            RC.firebaseRoot = new Firebase("https://rusticcitrus.firebaseio.com/prod");
        }

        // Store the smallest number of letters in a round
        RC.smallestNumLetters = 5;

        // Store the default round length
        RC.defaultRoundLengthInSeconds = 120;

        // TODO: get the correct logged in user ID from the auth variable
        // TODO: I may be able to remove the users' id field from firebaseData.json
        // TODO: I may want to store the firebase root for this user as well so I can easily get back to it without doing a long .child(../../..) call every time
        RC.firebaseRoot.child("users/0/").once("value", function (dataSnapshot) {
            // Store the logged in user
            RC.loggedInUser = dataSnapshot.val();

            RC.loggedInUser.id = dataSnapshot.name()

            // Populate the login container
            var loggedInUserContainer = $("#loginContainer");
            loggedInUserContainer.find("img").attr("src", RC.loggedInUser.imageUrl);
            loggedInUserContainer.find(".name").text(RC.loggedInUser.firstName + " " + RC.loggedInUser.lastName);
            loggedInUserContainer.find(".username").text(RC.loggedInUser.username);
        });

        // Authenticate the user
        RC.auth = new FirebaseSimpleLogin(RC.firebaseRoot, function (error, user) {
            if (error) {
                console.log(error);
                debugger;
            } else if (user) {
                // user authenticated with Firebase
                //RC.loggedInUser = user; // TODO: uncomment
                // TODO: change firstName and lastName to givenName and familyName, respectively?
                RC.firebaseRoot.child("users/").once("value", function (dataSnapshot) {
                    if (!dataSnapshot.hasChild(user.uid)) {
                        // create new user
                        debugger;
                    }
                });

                console.log('User ID: ' + user.id + ', Provider: ' + user.provider);
            } else {
                // user is logged out
                console.log("logged out");
                RC.auth.login("facebook");
            }
        });

        // Add some global music-related variables to the RC namespace
        WinJS.Namespace.defineWithParent(RC, "Music", {
            mainMenuMusic: $("#mainMenuMusic")[0],
            gameBoardMusic: $("#gameBoardMusic")[0],
            musicOn: undefined,
            soundEffectsOn: undefined
        });

        // Change the volume of the music
        RC.Music.mainMenuMusic.volume = 0.2;
        RC.Music.gameBoardMusic.volume = 0.1;

        // Define a function to save the current date as a string
        WinJS.Namespace.define("RC", {
            getCurrentDateAsString: function(date) {
                return new Date().toISOString().split(".")[0];
            }
        });

        // Initialize the user's license for this app
        initializeLicense();

        // TODO: find a better way to send live tile updates
        // Register a background task to update the live tile periodically
        requestLockScreenAccess();
        registerUpdateLiveTileBackgroundTask();

        if (RC.debug) {
            // Load the high scores and achievements
            RC.HighScores.deleteFile_DEBUG(RC.HighScores.load);
            RC.Achievements.deleteFile_DEBUG(RC.Achievements.load);

            // Re-create the Firebase data before starting the app
            createDevFirebaseData(g_APP.start());
        }
        else {
            // Load the high scores and achievements
            RC.HighScores.load();
            RC.Achievements.load();

            // Start the app
            g_APP.start();
        }
    };

    /* Initializes the music and sound effects */
    function initializeSounds() {
        // If the options composite does not exist, create the initial options omposite
        var options = g_LOCAL_SETTINGS.values["soundOptions"];
        if (!options) {
            // Create the initial options composite and store it in the local app settings
            var optionsComposite = new Windows.Storage.ApplicationDataCompositeValue();
            optionsComposite["musicOn"] = true;
            optionsComposite["soundEffectsOn"] = true;
            g_LOCAL_SETTINGS.values["soundOptions"] = optionsComposite;

            // Set the option toggles
            $("#musicToggleSwitch")[0].winControl.checked = true;
            $("#soundEffectsToggleSwitch")[0].winControl.checked = true;

            // Store the sound options in global variables
            RC.Music.musicOn = true;
            RC.Music.soundEffectsOn = true;
        }

        // Otherwise, read from the existing options composite
        else {
            // Set the option toggles
            $("#musicToggleSwitch")[0].winControl.checked = options["musicOn"];
            $("#soundEffectsToggleSwitch")[0].winControl.checked = options["soundEffectsOn"];

            // Store the sound options in global variables
            RC.Music.musicOn = options["musicOn"];
            RC.Music.soundEffectsOn = options["soundEffectsOn"];
        }
    };

    /* Initializes the events for the settings flyout */
    function initializeSettingsEvents() {
        // Music option toggle switch
        $("#musicToggleSwitch")[0].winControl.onchange = function () {
            // Update the app settings
            var optionsComposite = new Windows.Storage.ApplicationDataCompositeValue();
            optionsComposite["musicOn"] = $("#musicToggleSwitch")[0].winControl.checked;
            optionsComposite["soundEffectsOn"] = RC.Music.soundEffectsOn;
            g_LOCAL_SETTINGS.values["soundOptions"] = optionsComposite;

            // Update the music global variable
            RC.Music.musicOn = !RC.Music.musicOn;

            // Restart the music if we just toggled it on
            if (RC.Music.musicOn) {
                if (WinJS.Navigation.location == "/html/gameBoard.html") {
                    RC.Music.gameBoardMusic.currentTime = 0;
                    RC.Music.gameBoardMusic.play();
                }
                else {
                    RC.Music.mainMenuMusic.currentTime = 0;
                    RC.Music.mainMenuMusic.play();
                }
            }

            // Otherwise, turn off the music
            else {
                RC.Music.mainMenuMusic.pause();
                RC.Music.gameBoardMusic.pause();
            }
        };

        // Sound effects option toggle switch
        $("#soundEffectsToggleSwitch")[0].winControl.onchange = function () {
            // Update the app settings
            var optionsComposite = new Windows.Storage.ApplicationDataCompositeValue();
            optionsComposite["musicOn"] = RC.Music.musicOn;
            optionsComposite["soundEffectsOn"] = $("#soundEffectsToggleSwitch")[0].winControl.checked;
            g_LOCAL_SETTINGS.values["soundOptions"] = optionsComposite;

            // Update the sound effects global variable
            RC.Music.soundEffectsOn = !RC.Music.soundEffectsOn;
        };

        // Hide the reset game button if this is a trial version
        if (RC.licenseInformation.isTrial) {
            $("#resetGame").hide();
        }

        // Reset game data button
        $("#resetGameDataButton").on("click", function () {
            confirmResetDataFlyout.winControl.show($(this)[0], "bottom", "left");
        });

        $("#cancelResetDataButton").on("click", function () {
            confirmResetDataFlyout.winControl.hide();
        });

        $("#confirmResetDataButton").on("click", function () {
            // Reset the saved games, high scores, and achievements files
            RC.SinglePlayerGames.reset();
            //RC.MultiplayerGames.reset(); // TODO
            RC.HighScores.reset();
            RC.Achievements.reset();

            // Hide the confirmation flyout
            confirmResetDataFlyout.winControl.hide();
        });
    };

    /******************/
    /*  SEEDING DATA  */
    /******************/
    /* Deletes all the files and settings associated with the app (debug only) */
    function deleteAllFilesAndSettings_DEBUG() {
        // Delete the settings
        g_LOCAL_SETTINGS.values.remove("soundOptions");

        // Delete the single player games, high scores, and achievements files
        Windows.Storage.ApplicationData.current.localFolder.getFileAsync("singlePlayerGames.txt").done(
            /* File exists */
            function (file) {
                file.deleteAsync();
            },

            /* File does not exist */
            function (error) {
            }
        );
        Windows.Storage.ApplicationData.current.localFolder.getFileAsync("scores.2.0.txt").done(
            /* File exists */
            function (file) {
                file.deleteAsync();
            },

            /* File does not exist */
            function (error) {
            }
        );
        Windows.Storage.ApplicationData.current.localFolder.getFileAsync("achievements.2.0.txt").done(
            /* File exists */
            function (file) {
                file.deleteAsync();
            },

            /* File does not exist */
            function (error) {
            }
        );
    };

    /* Populates the dev Firebase root with testing data */
    function createDevFirebaseData(callback) {
        var url = new Windows.Foundation.Uri("ms-appx:///resources/files/firebaseData.json");
        Windows.Storage.StorageFile.getFileFromApplicationUriAsync(url).then(function (file) {
            Windows.Storage.FileIO.readTextAsync(file).then(function (text) {
                RC.firebaseRoot.set(JSON.parse(text), function () {
                    if (callback) {
                        callback();
                    }
                });
            });
        });
    };

    /*******************/
    /*  APP LICENSING  */
    /*******************/
    /* Initializes the user's license for this app */
    function initializeLicense() {
        // Initialize the license info according to whether or not we are in debug mode
        var currentApp;
        if (RC.useDebugLicense) {
            RC.currentApp = Windows.ApplicationModel.Store.CurrentAppSimulator;
        }
        else {
            RC.currentApp = Windows.ApplicationModel.Store.CurrentApp;
        }
        
        // Get the license info
        RC.licenseInformation = RC.currentApp.licenseInformation;

        // Register for the license state change event
        RC.licenseInformation.addEventListener("licensechanged", reloadLicense);

        // If the users's license has expired, prompt them to purchase the full version of the app
        if (!RC.licenseInformation.isActive) {
            RC.MessageDialogs.displayAppPurchaseDialog("Your trial version has expired", "Your trial period for Rustic Citrus has expired. Please purchase the full game to continue the addictive, jumbled madness and get extra features like 7-letter games, high scores, achievements, and saved games!", /* includeCancelButton = */ false);
        }
    };

    /* Reloads the user's license for this app */
    function reloadLicense() {
        // If the users's license has expired, prompt them to purchase the full version of the app
        if (!RC.licenseInformation.isActive) {
            RC.MessageDialogs.displayAppPurchaseDialog("Your trial version has expired", "Your trial period for Rustic Citrus has expired. Please purchase the full game to continue the addictive, jumbled madness and get extra features like 7-letter games, high scores, achievements, and saved games!", /* includeCancelButton = */ false);
        }
    };

    /**********************/
    /*  BACKGROUND TASKS  */
    /**********************/
    /* Adds app to the lock screen since time events require the app to be on the lock screen to fire */
    function requestLockScreenAccess() {
        // An app will only present the dialog box to the user one time, although this can get called many times
        var Background = Windows.ApplicationModel.Background;
        Background.BackgroundExecutionManager.requestAccessAsync().then(function (result) {
            if (RC.debug) {
                switch (result) {
                    case Background.BackgroundAccessStatus.denied:
                        console.log("This user clicked \"Don't allow\" and the app is not allowed on the lock screen.");
                        break;

                    case Background.BackgroundAccessStatus.allowedWithAlwaysOnRealTimeConnectivity:
                        console.log("This app is on the lock screen, can set up background tasks, and has access to the Real Time Connectivity broker.");
                        break;

                    case Background.BackgroundAccessStatus.allowedMayUseActiveRealTimeConnectivity:
                        console.log("This app is on the lock screen, can set up background tasks, but does not have access to the Real Time Connectivity broker.");
                        break;

                    case Background.BackgroundAccessStatus.unspecified:
                        console.log("The user has not yet taken any action. This is the default setting and the app is not on the lock screen.");
                        break;
                }
            }
        }, function (e) {
            if (RC.debug) {
                console.error(e);
                debugger;
            }
        });
    };

    /* Registers the background task for updating the live tile periodically */
    function registerUpdateLiveTileBackgroundTask() {
        // Store the name of the task to be registered
        var taskName = "updateLiveTileBackgroundTask";

        // Unregister all the currently registered background tasks with the stored task name
        var backgroundTaskIterator = Windows.ApplicationModel.Background.BackgroundTaskRegistration.allTasks.first();
        while (backgroundTaskIterator.hasCurrent) {
            var currentBackgroundTask = backgroundTaskIterator.current.value;
            if (currentBackgroundTask.name === taskName) {
                currentBackgroundTask.unregister(true);
            }
            backgroundTaskIterator.moveNext();
        }
 
        // Create the background task builder
        var backgroundTaskBuilder = new Windows.ApplicationModel.Background.BackgroundTaskBuilder();
        backgroundTaskBuilder.name = taskName;
        backgroundTaskBuilder.taskEntryPoint = "updateLiveTileBackgroundTask.js";

        // TODO: make sure the internet connectivity works
        // Require internet connectivity
        var internetCondition = new Windows.ApplicationModel.Background.SystemCondition(Windows.ApplicationModel.Background.SystemConditionType.internetAvailable);
        backgroundTaskBuilder.addCondition(internetCondition);

        // Create a time trigger that repeats at 15-minute intervals and add it to the background task builder
        var timeTrigger = new Windows.ApplicationModel.Background.TimeTrigger(/*freshnessTime=*/ 15, /*oneShot=*/ false);
        backgroundTaskBuilder.setTrigger(timeTrigger);

        // Register the background task
        backgroundTaskBuilder.register();
    };
})();