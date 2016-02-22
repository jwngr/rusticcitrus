(function () {
    "use strict";

    /********************************/
    /*  PAGE-WIDE GLOBAL VARIABLES  */
    /********************************/
    // Orange button scale and rotation animation timeouts and intervals
    var g_ORANGE_BUTTON_SCALE_TIMEOUT;
    var g_PLAY_BUTTON_ROTATION_TIMEOUT;
    var g_WINDOWS_STORE_BUTTON_ROTATION_TIMEOUT;
    var g_PLAY_BUTTON_ROTATION_INTERVAL;
    var g_WINDOWS_STORE_BUTTON_ROTATION_INTERVAL;


    /****************************/
    /*  MAIN MENU PAGE CONTROL  */
    /****************************/
    $(document).ready(function() {
        // Create the global RC namespace
        if (!$.RC) {
            $.RC = {};
        }

        $("#dimensions").text($(window).width() + " x " + $(window).height());
        $(window).resize(function() {
            $("#dimensions").text($(window).width() + " x " + $(window).height());
        });

        // Don't load game board music until now
        var gameBoardMenuMusic = new Audio("./resources/sounds/music/gameBoardMusic.mp3");
        gameBoardMenuMusic.loop = true;

        // Add some global music-related variables to the RC namespace
        $.RC.Music = {
            mainMenuMusic: $("#mainMenuMusic")[0],
            gameBoardMusic: gameBoardMenuMusic,
            musicOn: false,
            soundEffectsOn: true
        };

        // Change the volume of the music
        try {
            $.RC.Music.mainMenuMusic.volume = 0.2;
            $.RC.Music.gameBoardMusic.volume = 0.1;
        }
        catch(error) {
        }


        // Initialize the main menu event listeners
        initializeMainMenuEventListeners();

        // Show the main menu
        showMainMenu();
    });


    /**********************/
    /*  HELPER FUNCTIONS  */
    /**********************/
    /* Initializes the main menu event listeners */
    function initializeMainMenuEventListeners() {
        // Prevent the main menu images from being dragged
        $("#mainMenu img").on("dragstart", function (event) {
            event.preventDefault();
        });

        // Play button
        $("#mainMenuPlayButton").on("click", function () {
            $("#mainMenu").fadeOut(400, function() {
                $("#startGameMenu").fadeIn();
            });
            $("#helpOverlay").hide();
        });

        // Windows Store button
        $("#mainMenuWindowsStoreButton").on("click", function () {
            window.open("http://apps.microsoft.com/windows/app/rustic-citrus/c7f73eae-9de1-48ef-a99d-6a61105d8349");
        });

        // Help button
        $("#mainMenuHelpButton").on("click", function () {
            $("#helpOverlay").fadeIn(400);
        });
        $("#closeHelpOverlayButton").on("click", function() {
            $("#helpOverlay").fadeOut(400);
        });

        // Music button
        $("#mainMenuMusicButton").on("click", function () {
            $.RC.Music.musicOn = !$.RC.Music.musicOn;
            if ($.RC.Music.musicOn) {
                $(this).attr("src", "./resources/images/buttons/mainMenu/mainMenuMusicOnButton.png");
            }
            else {
                $(this).attr("src", "./resources/images/buttons/mainMenu/mainMenuMusicOffButton.png");
            }
            try {
                if ($.RC.Music.musicOn) {
                    $.RC.Music.mainMenuMusic.currentTime = 0;
                    $.RC.Music.mainMenuMusic.play();
                }
                else {
                    $.RC.Music.mainMenuMusic.pause();
                }
            }
            catch(error) {
            }
        });

        // Sound effects button
        $("#mainMenuSoundEffectsButton").on("click", function () {
            $.RC.Music.soundEffectsOn = !$.RC.Music.soundEffectsOn;

            if ($.RC.Music.soundEffectsOn) {
                $(this).attr("src", "./resources/images/buttons/mainMenu/mainMenuSoundEffectsOnButton.png");
            }
            else {
                $(this).attr("src", "./resources/images/buttons/mainMenu/mainMenuSoundEffectsOffButton.png");
            }
        });

        // Start game buttons
        $("#startFiveLetterGameButton").on("click", function() {
            $("#startGameMenu").fadeOut(400, function() {
                $("#gameBoard").fadeIn(function() {
                    initializeGameBoard(5);
                });
            });
        });

        $("#startSixLetterGameButton").on("click", function() {
            $("#startGameMenu").fadeOut(400, function() {
                $("#gameBoard").fadeIn(function() {
                    initializeGameBoard(6);
                });
            });
        });

        $("#startSevenLetterGameButton").on("click", function() {
            window.open("http://apps.microsoft.com/windows/app/rustic-citrus/c7f73eae-9de1-48ef-a99d-6a61105d8349");
        });
    };

    /* Shows the main menu */
    function showMainMenu() {
        // Unhide the main menu
        $("#mainMenu").show();

        // Start the main menu music
        if ($.RC.Music.musicOn) {
            try {
                $.RC.Music.mainMenuMusic.play();
            }
            catch(error) {
            }
        }

        // Animate the Rustic Citrus logo
        $("#rusticCitrusLogo").transition({
            y: -50,
            duration: 1
        }).transition({
            y: 0,
            opacity: "1",
            delay: 200,
            duration: 1000
        });

        // Animate the play button
        $("#mainMenuPlayButton").transition({
            y: 50,
            duration: 1
        }).transition({
            y: 0,
            opacity: 1,
            delay: 500,
            duration: 1300
        });

        // Animate the Windows store button
        $("#mainMenuWindowsStoreButton").transition({
            y: 50,
            duration: 1
        }).transition({
            y: 0,
            opacity: 1,
            delay: 700,
            duration: 1300
        });

        // Animate the achievements button
        $("#mainMenuAchievementsButton").transition({
            y: 50,
            duration: 1
        }).transition({
            y: 0,
            opacity: 1,
            delay: 900,
            duration: 1300
        });

        // Animate the Floating House Studios logo
        $("#floatingHouseStudiosLogo").transition({
            y: 50,
            duration: 1
        }).transition({
            y: 0,
            opacity: 1,
            delay: 900,
            duration: 1300
        });

        // Animate the music button
        $("#mainMenuMusicButton").transition({
            y: 50,
            duration: 1
        }).transition({
            y: 0,
            opacity: 1,
            delay: 900,
            duration: 1300
        });

        // Animate the sound effects button
        $("#mainMenuSoundEffectsButton").transition({
            y: 50,
            duration: 1
        }).transition({
            y: 0,
            opacity: 1,
            delay: 1000,
            duration: 1300
        });

        // Animate the help button
        $("#mainMenuHelpButton").transition({
            y: 50,
            duration: 1
        }).transition({
            y: 0,
            opacity: 1,
            delay: 1100,
            duration: 1300
        });

        // Change the scale of the orange buttons on mouse events (once the two large main menu buttons are in their correct spot)
        var g_ORANGE_BUTTON_SCALE_TIMEOUT = window.setTimeout(function () {
            $(".mainMenuOrangeButton").on("mouseover", function () {
                $(this).transition({
                    scale: 1.2,
                    duration: 150,
                    easing: "ease",
                    queue: false
                });
            });

            $(".mainMenuOrangeButton").on("mouseout", function () {
                $(this).transition({
                    scale: 1.0,
                    duration: 150,
                    easing: "ease",
                    queue: false
                });
            });

            $(".mainMenuOrangeButton").on("mousedown", function () {
                var mouseDownScale = 0.8;
                if ($(this)[0] == $("#mainMenuHelpButton")[0] || $(this)[0] == $("#mainMenuMusicButton")[0] || $(this)[0] == $("#mainMenuSoundEffectsButton")[0]) {
                    mouseDownScale = 0.9;
                }
                $(this).transition({
                    scale: mouseDownScale,
                    duration: 100,
                    easing: "ease",
                    queue: false
                });
            });
        }, 800);

        // Rotate the play and Windows store buttons (once the two large main menu buttons are in their correct spot)
        var mainMenuPlayButtonRotation = "-10deg";
        g_PLAY_BUTTON_ROTATION_TIMEOUT = window.setTimeout(function () {
            g_PLAY_BUTTON_ROTATION_INTERVAL = window.setInterval(function () {
                mainMenuPlayButtonRotation = (mainMenuPlayButtonRotation == "-10deg") ? "5deg" : "-10deg";
                $("#mainMenuPlayButton").transition({
                    rotate: mainMenuPlayButtonRotation,
                    easing: "ease",
                    duration: 400,
                    queue: false
                });
            }, 500);
        }, 1300);

        var mainMenuWindowsStoreButtonRotation = "-10deg";
        g_WINDOWS_STORE_BUTTON_ROTATION_TIMEOUT = window.setTimeout(function () {
            g_WINDOWS_STORE_BUTTON_ROTATION_INTERVAL = window.setInterval(function () {
                mainMenuWindowsStoreButtonRotation = (mainMenuWindowsStoreButtonRotation == "-10deg") ? "5deg" : "-10deg";
                $("#mainMenuWindowsStoreButton").transition({
                    rotate: mainMenuWindowsStoreButtonRotation,
                    easing: "ease",
                    duration: 400,
                    queue: false
                });
            }, 500);
        }, 1550);
    };




    /********************************/
    /*  PAGE-WIDE GLOBAL VARIABLES  */
    /********************************/
    // Raphael SVG paper
    var g_PAPERS;


    /*****************************/
    /*  GAME BOARD PAGE CONTROL  */
    /*****************************/
    function initializeGameBoard(numLetters) {
        // Initialize the event listeners
        initializeGameBoardEventListeners();

        // Stop the main menu music and restart the game board music
        if ($.RC.Music.musicOn) {
            try {
                $.RC.Music.mainMenuMusic.pause();
                $.RC.Music.gameBoardMusic.currentTime = 0;
                $.RC.Music.gameBoardMusic.play();
            }
            catch(error) {
            }
        }

        // Create the Raphael SVG papers
        g_PAPERS = {
            "subsetWords": Raphael("subsetWordsPaper", 0, 0),
            "availableLetters": Raphael("availableLettersPaper", 900, window.innerHeight)
        }

        // Add a current game var to the RC namespace
        $.RC.currentGame = null;

        // Start a brand new game
        startNewGame(numLetters);
    };

    /**********************/
    /*  HELPER FUNCTIONS  */
    /**********************/
    /* Initializes the game board event listeners */
    function initializeGameBoardEventListeners() {
        // Prevent the game board images from being dragged
        $("#gameBoard img").on("dragstart", function (event) {
            event.preventDefault();
        });

        // Link to the Windows Store in each menu
        $(".gameOverlayMenu .downloadGameButton").on("click", function () {
            window.open("http://apps.microsoft.com/windows/app/rustic-citrus/c7f73eae-9de1-48ef-a99d-6a61105d8349");
        });

        // Pause menu
        $("#pauseMenu #resumeGameButton").on("click", function () {
            $.RC.currentGame.currentRound.resume();
        });

        // Game over menu
        $("#gameOverMenu .exitButton").on("click", exitGame);

        // Next round menu
        $("#nextRoundMenu #nextRoundButton").on("click", function () {
            $("#nextRoundMenu").fadeOut(400, startNextRound);
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
        $(".gameOverlayMenu .downloadGameButton").off("click");
        $("#pauseMenu #resumeGameButton").off("click");
        $("#gameOverMenu .exitButton").off("click");
        $("#nextRoundMenu #nextRoundButton").off("click");
        $("#gameBoard").off("mouseenter");
        $("#gameBoard").off("mouseleave");
        $("#gameBoard").off("mousedown");
    };

    /* Cleans up the DOM after a round ends */
    function cleanUpRound(callback) {
        // Clear the Raphael papers from the DOM
        g_PAPERS["subsetWords"].clear();
        g_PAPERS["availableLetters"].clear();

        // Clear the stats sections
        $("#round").text("");
        $("#score").text("");
        $("#timeRemaining").text("");

        // Clean up the current round object (to avoid a bad memory leak)
        $.RC.currentGame.currentRound.subsetWords = null;
        $.RC.currentGame.currentRound.letters = null;
        $.RC.currentGame.currentRound.previousGuess = null;
        $.RC.currentGame.currentRound.game = null;

        // Set the current game's round to null
        $.RC.currentGame.currentRound = null;

        // Call the callback function if it's defined
        if (callback) {
            callback();
        }
    };

    /***************************/
    /*  STARTING/LOADING GAME  */
    /***************************/
    /* Starts a new game */
    function startNewGame(numLetters) {
        // Create a new game
        $.RC.currentGame = new $.RC.Classes.Game(g_PAPERS, numLetters);

        // Create a new round
        if (numLetters == 5) {
            $.RC.currentGame.createRound(120);
        }
        else if (numLetters == 6) {
            $.RC.currentGame.createRound(120);
        }
        else if (numLetters == 7) {
            $.RC.currentGame.createRound(120);
        }
    }

    /* Starts a new round for the current game */
    function startNextRound() {
        // Clean up after the just-finished round
        cleanUpRound(function () {
            // Start a new round
            $.RC.currentGame.createRound(120);
        });
     };


    /******************/
    /*  EXITING GAME  */
    /******************/
    /* Exits the current game and navigates back to the games list view */
    function exitGame() {
        // Hide the game board and show the main menu
        $("#gameBoard").fadeOut(400);
        $("#gameOverMenu").fadeOut(400, function() {
            // Clean up from the just-finished round
            cleanUpRound(function() {
                // Dispose of the game board event listeners
                disposeGameBoardEventListeners();

                // Remove the Raphael papers from the DOM
                g_PAPERS["subsetWords"].remove();
                g_PAPERS["availableLetters"].remove();
                g_PAPERS = null;

                // Reset the current round and game
                $.RC.currentGame.currentRound = null;
                $.RC.currentGame = null;

                // Stop the game board music and restart the main menu music
                if ($.RC.Music.musicOn) {
                    try {
                        $.RC.Music.mainMenuMusic.currentTime = 0;
                        $.RC.Music.mainMenuMusic.play();
                        $.RC.Music.gameBoardMusic.pause();
                    }
                    catch(error) {
                    }
                }
            });

            // Fade in the main menu
            $("#mainMenu").fadeIn(400);
        });
    };
})();
