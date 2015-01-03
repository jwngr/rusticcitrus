(function () {
    "use strict";

    /**********/
    /*  GAME  */
    /**********/
    var Game = (function () {
        /* Game class constructor */
        function Game(papers, numLetters, score, numRoundsCompleted, numWordsFound, pastRoundWords) {
            this.papers = papers;
            this.numLetters = numLetters;
            if (score !== undefined) {
                this.score = score;
                this.numRoundsCompleted = numRoundsCompleted;
                this.numWordsFound = numWordsFound;
                this.pastRoundWords = pastRoundWords;
            }
            else {
                this.score = 0;
                this.numRoundsCompleted = 0;
                this.numWordsFound = 0;
                this.pastRoundWords = [];
            }
            this.currentRound = null;
        }
    
        /* Creates a new round for the current game */
        Game.prototype.createRound = function (secondsRemaining, word, foundWords, startRoundPaused, startRoundAtExit) {
            this.currentRound = new $.RC.Classes.Round(this, this.numLetters, secondsRemaining, word, foundWords, startRoundPaused, startRoundAtExit);
        };

        return Game;
    })();


    // Add the Game class to the RC namespace
    if (!$.RC) {
        $.RC = {};
    }
    if (!$.RC.Classes) {
        $.RC.Classes = {};
    }
    $.RC.Classes["Game"] = Game;
})();