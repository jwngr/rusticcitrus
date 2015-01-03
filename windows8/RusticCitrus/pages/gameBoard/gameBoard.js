(function () {
    "use strict";

    /********************************/
    /*  PAGE-WIDE GLOBAL VARIABLES  */
    /********************************/
    // Raphael SVG paper
    var g_PAPERS;

    
    /*****************************/
    /*  GAME BOARD PAGE CONTROL  */
    /*****************************/
    WinJS.UI.Pages.define("/pages/gameBoard/gameBoard.html", {
        /* Responds to navigations to this page */
        ready: function (element, options) {
            // Initialize the event listeners
            initializeGameBoardEventListeners();

            // Stop the main menu music and restart the game board music
            if (RC.Music.musicOn) {
                RC.Music.mainMenuMusic.pause();
                RC.Music.gameBoardMusic.currentTime = 0;
                RC.Music.gameBoardMusic.play();
            }

            // Hide the login container
            $("#loginContainer").hide();

            // Create the Raphael SVG papers
            g_PAPERS = {
                "subsetWords": Raphael("subsetWordsPaper", 0, 0),
                "availableLetters": Raphael("availableLettersPaper", 900, window.innerHeight)
            }

            // Set the current game to null
            RC.currentGame = null;

            // If the game type is multiplayer, load the current round; otherwise, either load or start a single player game
            RC.assert(options.gameType === "multiplayer" || options.gameType === "singlePlayer", "gameType must be \"singlePlayer\" or \"multiplayer\"");
            if (options.gameType === "multiplayer") {
                // Multiplayer
                loadMultiplayerRound(options.game);
            }
            else {
                // Single player
                if (options.resumeGame) {
                    loadSinglePlayerGame(options);
                }
                else {
                    startNewSinglePlayerGame(options.numLetters);
                }
            }
        },

        /* Responds to navigations away from this page */
        unload: function () {
            // Dispose of the game board event listeners
            disposeGameBoardEventListeners();

            // Remove the Raphael papers from the DOM
            g_PAPERS["subsetWords"].remove();
            g_PAPERS["availableLetters"].remove();
            g_PAPERS = null;

            // Reset the current round and game
            RC.currentGame.currentRound = null;
            RC.currentGame = null;

            // Stop the game board music and restart the main menu music
            if (RC.Music.musicOn) {
                RC.Music.mainMenuMusic.currentTime = 0;
                RC.Music.mainMenuMusic.play();
                RC.Music.gameBoardMusic.pause();
            }

            // Un-hide the login container
            $("#loginContainer").show();
        },

        /* Responds to changes in the view state */
        updateLayout: function (element, newViewState, oldViewState) {
            // TODO: update this
            // Pause the game if we are in an unplayable view state
            if ((newViewState != Windows.UI.ViewManagement.ApplicationViewState.fullScreenLandscape) && (!RC.currentGame.currentRound.isPaused)) {
                RC.currentGame.currentRound.pause();
            }

            // Otherwise, if the game is over, pause or play the music when the view state changes
            else if (RC.currentGame.currentRound.isOver && RC.Music.musicOn) {
                if (newViewState == Windows.UI.ViewManagement.ApplicationViewState.fullScreenLandscape) {
                    RC.Music.gameBoardMusic.play();
                }
                else {
                    RC.Music.gameBoardMusic.pause();
                }
            }
        }
    });

    /**********************/
    /*  HELPER FUNCTIONS  */
    /**********************/
    /* Initializes the game board event listeners */
    function initializeGameBoardEventListeners() {
        // Prevent the game board images from being dragged
        $("#gameBoard img").on("dragstart", function (event) {
            event.preventDefault();
        });

        // Pause menu
        $("#pauseMenu #resumeGameButton").on("click", function () {
            RC.currentGame.currentRound.resume(/* menuIdToFadeOut */ "pauseMenu");
        });
        $("#pauseMenu #pauseMenuSaveAndExitButton").on("click", function () {
            // If the app is in trial mode, prompt the user to buy the app
            if (RC.licenseInformation.isTrial) {
                RC.MessageDialogs.displayAppPurchaseDialog("Upgrade to the full verison", "Only the full version of Rustic Citrus allows you to save and exit games. It also gives you features like 7-letter games, high scores, and achievements. Get the full juicy version of Rustic Citrus now!", /* includeCancelButton = */ true);
            }

            // Otherwise, save and exit the game
            else {
                saveAndExitSinglePlayerGame();
            }
        });

        // Give up menu
        $("#endRoundMenu #endRoundMenuCancelButton").on("click", function () {
            RC.currentGame.currentRound.resume(/* menuIdToFadeOut */ "endRoundMenu");
        });
        $("#endRoundMenu #endRoundMenuConfirmButton").on("click", function () {
            RC.currentGame.currentRound.secondsRemaining = 0;
            RC.currentGame.currentRound.endRound();
        });

        // Game over menu
        $("#gameOverMenu .exitButton").on("click", exitGame);

        // Next round menu
        $("#nextRoundMenu #nextRoundButton").on("click", function () {
            $("#nextRoundMenu").fadeOut(400, startNextRound);
        });
        $("#nextRoundMenu #nextRoundMenuSaveAndExitButton").on("click", function () {
            // If the app is in trial mode, prompt the user to buy the app
            if (RC.licenseInformation.isTrial) {
                RC.MessageDialogs.displayAppPurchaseDialog("Upgrade to the full verison", "Only the full version of Rustic Citrus allows you to save and exit a game. It also gives you features like 7-letter games, high scores, and achievements. Get the full juicy version of Rustic Citrus now!", /* includeCancelButton = */ true);
            }

            // Otherwise, save and exit the game
            else {
                saveAndExitSinglePlayerGame();
            }
        });

        // Animate the game board buttons
        $("#gameBoard").on({
            "mouseenter": function () {
                var scale = 1.1;
                if (this.id == "pauseGameButton") {
                    scale = 1.2;
                }
                $(this).transition({
                    scale: scale,
                    duration: 150,
                    easing: "ease",
                    queue: false
                });
            },

            "mouseleave": function () {
                $(this).transition({
                    scale: 1.0,
                    duration: 150,
                    easing: "ease",
                    queue: false
                });
            },

            "mousedown": function () {
                $(this).transition({
                    scale: 0.9,
                    duration: 100,
                    easing: "ease",
                    queue: false
                });
            }
        }, ".gameBoardButton");
    };

    /* Disposes of the game board event listeners */
    function disposeGameBoardEventListeners() {
        // Remove all DOM event listeners
        $("#gameBoard img").off("dragstart");
        $("#pauseMenu #resumeGameButton").off("click");
        $("#pauseMenu #pauseMenuSaveAndExitButton").off("click");
        $("#endRoundMenu #endRoundMenuCancelButton").off("click");
        $("#endRoundMenu #endRoundMenuConfirmButton").off("click");
        $("#gameOverMenu .exitButton").off("click");
        $("#nextRoundMenu #nextRoundButton").off("click");
        $("#nextRoundMenu #nextRoundMenuSaveAndExitButton").off("click");
        $("#gameBoard").off("mouseenter");
        $("#gameBoard").off("mouseleave");
        $("#gameBoard").off("mousedown");
    };

    /* Cleans up the DOM after a round ends */
    function cleanUpRound(callback) {
        // Hide the game board
        $("#gameBoard").hide(1, function () {
            // Clear the Raphael papers from the DOM
            g_PAPERS["subsetWords"].clear();
            g_PAPERS["availableLetters"].clear();

            // Clear the stats sections
            $("#round").text("");
            $("#score").text("");
            $("#timeRemaining").text("");

            // Clean up the current round object (to avoid a bad memory leak)
            RC.currentGame.currentRound.subsetWords = null;
            RC.currentGame.currentRound.letters = null;
            RC.currentGame.currentRound.previousGuess = null;
            RC.currentGame.currentRound.game = null;

            // Set the current game's round to null
            RC.currentGame.currentRound = null;

            // Call the callback function if it's defined
            if (callback) {
                callback();
            }
        });
    };

    /***************************/
    /*  STARTING/LOADING GAME  */
    /***************************/
    /* Starts a new single player game */
    function startNewSinglePlayerGame(numLetters) {
        // Create a new game
        RC.currentGame = new RC.Classes.SinglePlayerGame(g_PAPERS, numLetters);

        // Create the game's first round
        RC.currentGame.createRound(RC.defaultRoundLengthInSeconds);

        // Add the new game to Firebase
        RC.currentGame.save(/*fGameIsOver=*/ false);
    }

    /* Loads a previously saved single player game and removes it from the single player saved games list */
    function loadSinglePlayerGame(options) {
        // Get the game from the options
        var game = options.game;

        // Restore the previous game and round
        RC.currentGame = new RC.Classes.SinglePlayerGame(g_PAPERS, game.numLetters, /*loadGameData*/ game);

        if (game.startNewRound) {
            // Start with a fresh round if we had saved the game at the end of a round
            RC.currentGame.createRound(RC.defaultRoundLengthInSeconds);
        }
        else {
            // Otherwise, resume the current round if it is not finished (or if we just got teminated at the end of a round)
            RC.currentGame.createRound(game.currentRound.secondsRemaining, {
                "word": game.currentRound.word,
                "foundWords": game.currentRound.foundWords,
                "startRoundPaused": (options.startRoundPaused === undefined) ? false : options.startRoundPaused,
                "startRoundDone": (options.startRoundDone === undefined) ? false : options.startRoundDone
            });
        }

        // Remove the game from the single player saved games list
        RC.SinglePlayerGames.list[game.numLetters - RC.smallestNumLetters] = {
            "numLetters": game.numLetters
        }
    };

    /* Starts a new round for the current game */
    function startNextRound() {
        // Clean up after the just-finished round
        cleanUpRound(function () {
            // Start a new round
            RC.currentGame.createRound(RC.defaultRoundLengthInSeconds);
        });
     };

    /* Loads a round for a multiplayer game */
    function loadMultiplayerRound(gameData) {
        // Create a new multiplayer game and load the current round
        RC.currentGame = new RC.Classes.MultiplayerGame(g_PAPERS, gameData);
        RC.currentGame.createRound(gameData.currentRound);
    }

    /*****************/
    /*  SAVING GAME  */
    /*****************/
    /* Saves the current single player game's data */
    function saveAndExitSinglePlayerGame() {
        // Save the current game, updating the single player games data source and list and Firebase
        RC.currentGame.save();

        // Exit the current game and return to the games list
        exitGame();
    };

    /* Exits the current game and navigates back to the games list view */
    function exitGame() {
        // Clean up from the just-finished round and the navigate to the games list
        cleanUpRound(function () {
            WinJS.Navigation.back(1);
        });
    };
})();
