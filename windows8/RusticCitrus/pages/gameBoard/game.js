(function () {
    "use strict";

    /**********************/
    /*  SinglePlayerGame  */
    /**********************/
    var SinglePlayerGame = (function () {
        /* SinglePlayerGame class constructor */
        function SinglePlayerGame(papers, numLetters, loadGameData) {
            if (RC.debug) {
                RC.assert(typeof (papers) == "object", "papers is not an object");
                RC.assert(typeof (numLetters) == "number", "numLetters is not a number");
            }

            // Initialize the game data
            this.singlePlayerGamesListIndex = numLetters - RC.smallestNumLetters;
            this.gameType = "singlePlayer";
            this.papers = papers;
            this.numLetters = numLetters;
            this.currentRound = null;

            if (loadGameData === undefined) {
                // If we are starting a new game, initialize all members to their default values
                this.score = 0;
                this.numRoundsCompleted = 0;
                this.numWordsFound = 0;
                this.pastRoundWords = [];
                this.numConsecutivePerfectRounds = 0;    // Used for the Double/Triple Perfecto achievements
                this.dateCreated = RC.getCurrentDateAsString();
                this.dateModified = RC.getCurrentDateAsString();
            }
            else {
                // Otherwise, load the members from the game data
                if (RC.debug) {
                    RC.assert(typeof (loadGameData) == "object", "loadGameData is not an object");
                    RC.assert(typeof (loadGameData.score) === "number", "score is not a number");
                    RC.assert(typeof (loadGameData.numRoundsCompleted) === "number", "numRoundsCompleted is not a number");
                    RC.assert(typeof (loadGameData.numWordsFound) === "number", "numWordsFound is not a number");
                    RC.assert(typeof (loadGameData.pastRoundWords) === "object", "pastRoundWords is not an object");
                    RC.assert(typeof (loadGameData.numConsecutivePerfectRounds) === "number", "numConsecutivePerfectRounds is not a number");
                    RC.assert(typeof (loadGameData.dateCreated) === "string", "dateCreated is not a string");
                    RC.assert(typeof (loadGameData.dateModified) === "string", "dateModified is not a string");
                }

                this.score = loadGameData.score;
                this.numRoundsCompleted = loadGameData.numRoundsCompleted;
                this.numWordsFound = loadGameData.numWordsFound;
                this.pastRoundWords = loadGameData.pastRoundWords;
                this.numConsecutivePerfectRounds = loadGameData.numConsecutivePerfectRounds;    // Used for the Double/Triple Perfecto achievements
                this.dateCreated = loadGameData.dateCreated;
                this.dateModified = loadGameData.dateModified;
            }
        }

        /* Creates a new round for the current single player game */
        SinglePlayerGame.prototype.createRound = function (secondsRemaining, loadRoundData) {
            this.currentRound = new RC.Classes.Round(this, this.numLetters, secondsRemaining, loadRoundData);
        };

        /* Saves the current single player game, updating the single player games data source, list, and Firebase*/
        SinglePlayerGame.prototype.save = function (fGameIsOver) {
            if (RC.debug) {
                RC.assert(typeof (this.score) === "number", "score is not a number");
                RC.assert(typeof (this.numLetters) === "number", "numLetters is not a number");
                RC.assert(typeof (this.numRoundsCompleted) === "number", "numRoundsCompleted is not a number");
                RC.assert(typeof (this.numWordsFound) === "number", "numWordsFound is not a number");
                RC.assert(typeof (this.pastRoundWords) === "object", "pastRoundWords is not an object");
                RC.assert(typeof (this.numConsecutivePerfectRounds) === "number", "numConsecutivePerfectRounds is not a number");
                RC.assert(typeof (this.dateCreated) === "string", "dateCreated is not a string");
                RC.assert(typeof (this.dateModified) === "string", "dateModified is not a string");
            }

            if (fGameIsOver) {
                // Add the game to the completed single player games list in Firebase
                RC.SinglePlayerGames.addToCompletedGames({
                    "score": this.score,
                    "numLetters": this.numLetters,
                    "numRoundsCompleted": this.numRoundsCompleted,
                    "numWordsFound": this.numWordsFound,
                    "dateCreated": this.dateCreated,
                    "dateModified": RC.getCurrentDateAsString()
                });

                // Update the single player games data source and list and Firebase
                RC.SinglePlayerGames.updateGame(this.singlePlayerGamesListIndex, {
                    "numLetters": this.numLetters
                });
            }
            else {
                if (RC.debug) {
                    RC.assert(typeof (this.currentRound) === "object", "currentRound is not an object");
                    RC.assert(typeof (this.currentRound.word) === "string", "word is not a string");
                    RC.assert(typeof (this.currentRound.secondsRemaining) === "number", "secondsRemaining is not a number");
                    RC.assert(typeof (this.currentRound.foundWords) === "object", "foundWords is not an object");
                    RC.assert(typeof (this.currentRound.subsetWords) === "object", "subsetWords is not an object");
                }

                // Update the single player games data source and list and Firebase
                RC.SinglePlayerGames.updateGame(this.singlePlayerGamesListIndex, {
                    "score": this.score,
                    "numLetters": this.numLetters,
                    "numRoundsCompleted": this.numRoundsCompleted,
                    "numWordsFound": this.numWordsFound,
                    "pastRoundWords": this.pastRoundWords,
                    "numConsecutivePerfectRounds": this.numConsecutivePerfectRounds,
                    "dateCreated": this.dateCreated,
                    "dateModified": RC.getCurrentDateAsString(),
                    "currentRound": {
                        "secondsRemaining": this.currentRound.secondsRemaining,
                        "word": this.currentRound.word,
                        "foundWords": this.currentRound.foundWords
                    },
                    // If there is no time remaining or we have found every word, we need to make sure we don't restart that same round
                    // TODO: make sure this works
                    "startNewRound": ((this.currentRound.secondsRemaining === 0) || (this.currentRound.foundWords.length === this.currentRound.subsetWords.length))
                });
            }

            // Update the single player games file
            // Note: this relies on RC.SinglePlayerGames.list already being updated
            RC.SinglePlayerGames.updateFile();
        };

        /* Ends the current single player game and updates the high scores and single player games files and Firebase */
        SinglePlayerGame.prototype.end = function (fSaveHighScore, callback) {
            // Add the single player game to the completed games list in Firebase and reset the corresponding active single player game
            this.save(/*fGameIsOver=*/ true);

            // Update the high scores dictionary
            // Note: if we are resuming from termination, we do not want to save the high score (to avoid
            // duplicates) and we also don't want to save high scores while the app is in trial mode
            // TODO: add assert validation
            if (fSaveHighScore) {
                RC.HighScores.insertNewScore({
                    score: this.score,
                    numLetters: this.numLetters,
                    numRoundsCompleted: this.numRoundsCompleted,
                    numWordsFound: this.numWordsFound,
                    dateCreated: RC.getCurrentDateAsString()
                });
            }

            if (callback) {
                callback();
            }
        };

        return SinglePlayerGame;
    })();


    /*********************/
    /*  MultiplayerGame  */
    /*********************/
    var MultiplayerGame = (function () {
        /* MultiplayerGame class constructor */
        function MultiplayerGame(papers, gameData) {
            if (RC.debug) {
                RC.assert(typeof (gameData) === "object", "gameData is not an object");
                RC.assert(typeof (gameData.gameId) === "string", "gameId is not a string");
                RC.assert(typeof (gameData.creatorId) === "string", "creatorId is not a string");
                RC.assert(typeof (gameData.opponentId) === "string", "opponentId is not a string");
                RC.assert(typeof (gameData.currentRound) === "object", "currentRound is not an object");
                RC.assert(typeof (gameData.currentRound.word) === "string", "word is not a string");
                RC.assert(typeof (gameData.currentRound.numLetters) === "number", "numLetters is not a number");
                RC.assert(typeof (gameData.currentRound.roundIndex) === "number", "roundIndex is not a number");
            }

            // Initialize the game data
            this.score = 0;
            this.papers = papers;
            this.gameType = "multiplayer";
            this.gameId = gameData.gameId;
            this.creatorId = gameData.creatorId;
            this.opponentId = gameData.opponentId;
            this.numLetters = gameData.currentRound.numLetters;
            this.numRoundsCompleted = gameData.currentRound.roundIndex;
        }
    
        /* Creates a new round for the current multiplayer game */
        MultiplayerGame.prototype.createRound = function (roundData) {
            this.currentRound = new RC.Classes.Round(this, roundData.numLetters, /*RC.defaultRoundLengthInSeconds*/10, {
                "word": roundData.word,
                "foundWords": [],
                "startRoundPaused": false,
                "startRoundDone": false
            });
        };

        /* Saves the current multiplayer game to Firebase */
        MultiplayerGame.prototype.saveToFirebase = function (fGameIsOver) {
            // TODO: add timestamps (dateCreated, dateModified, datePlayedThisRound) to multiplayer games
            if (RC.debug) {
                RC.assert(typeof (this.score) === "number", "score is not a number");
                RC.assert(typeof (this.gameId) === "string", "gameId is not a string");
                RC.assert(typeof (this.creatorId) === "string", "creatorId is not a string");
                RC.assert(typeof (this.opponentId) === "string", "opponentId is not a string");
                RC.assert(typeof (this.currentRound) === "object", "currentRound is not an object");
                RC.assert(typeof (this.currentRound.foundWords) === "object", "foundWords is not an object");
            }

            // TODO: Add the game to the completed list
            // TODO: Remove the single player game from the active games list in Firebase
            //RC.firebaseRoot.child("users/" + RC.loggedInUser.id + "/games/singlePlayer/active/" + (this.numLetters - 5)).set({
            //    "numLetters": this.numLetters
            //});

            // Update the logged-in user's Firebase game
            var loggedInUsersRole = (this.creatorId === RC.loggedInUser.id) ? "creator" : "opponent";
            var opponentId = (this.creatorId === RC.loggedInUser.id) ? this.opponentId : this.creatorId;
            var currentRoundIndex = this.numLetters - RC.smallestNumLetters;
            var firebaseLoggedInUserCurrentGamePath = RC.firebaseRoot.child("users/" + RC.loggedInUser.id + "/games/multiplayer/active/" + this.gameId + "/");
            if (this.numLetters == RC.smallestNumLetters) {
                firebaseLoggedInUserCurrentGamePath.child(loggedInUsersRole + "/scores/").set([this.score]);
                firebaseLoggedInUserCurrentGamePath.child(loggedInUsersRole + "/foundWords/").set([this.currentRound.foundWords.join(",")]);
            }
            else {
                firebaseLoggedInUserCurrentGamePath.child(loggedInUsersRole + "/scores/" + currentRoundIndex).set(this.score);
                firebaseLoggedInUserCurrentGamePath.child(loggedInUsersRole + "/foundWords/" + currentRoundIndex).set(this.currentRound.foundWords.join(","));
            }

            // TODO: add this to firebaseData.json so this won't error out and uncomment it
            // Update the opponent's Firebase game
            //var firebaseOpponentCurrentGamePath = RC.firebaseRoot.child("users/" + opponentId + "/games/multiplayer/active/" + this.gameId + "/");
            //firebaseOpponentCurrentGamePath.child(loggedInUsersRole + "/scores/").push(this.score);
            //firebaseOpponentCurrentGamePath.child(loggedInUsersRole + "/foundWords/").push(this.currentRound.foundWords.join(","));
        };

        /* Ends the current multiplayer game and updates Firebase */
        MultiplayerGame.prototype.end = function () {
            // Update the multiplayer game's data in Firebase
            this.saveToFirebase(/*fGameIsOver=*/ true);

            // Invalidate the multilayer games data sources so the list views is refreshed
            RC.MultiplayerGames.yourTurnDataSource.invalidateAll();
            RC.MultiplayerGames.theirTurnDataSource.invalidateAll();

            // TODO: make sure this cleans up everything properly
            // Clean up from the just-finished round and the navigate to the games list
            //cleanUpRound(function () {
                WinJS.Navigation.back(1);
            //});
        };

        return MultiplayerGame;
    })();


    // Add the SinglePlayerGame and MultiplayerGame classes to the RC namespace
    WinJS.Namespace.defineWithParent(RC, "Classes", {
        SinglePlayerGame: SinglePlayerGame,
        MultiplayerGame: MultiplayerGame
    });
})();