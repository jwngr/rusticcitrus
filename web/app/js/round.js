(function () {
    "use strict";

    /********************************/
    /*  PAGE-WIDE GLOBAL VARIABLES  */
    /********************************/
    // Padding at every edge of the game board
    var g_GAMEBOARD_PADDING = 30;

    // Subset word letter square dimensions
    var g_LETTER_WIDTH;
    var g_LETTER_HEIGHT;

    // Padding between subset words
    var g_HEIGHT_BETWEEN_SUBSET_WORDS;
    var g_WIDTH_BETWEEN_SUBSET_WORDS;

    // Available letter orange dimensions
    var g_AVAILABLE_LETTER_WIDTH = 80;
    var g_AVAILABLE_LETTER_HEIGHT = 80;

    // Vertical distance an available letter moves when guessed/unguessed
    var g_AVAILABLE_LETTER_VERTICAL_GUESS_DISTANCE = 150;

    // Padding between available letter oranges
    var g_WIDTH_BETWEEN_AVAILABLE_LETTERS;

    // Width of the available letters Raphael paper
    var g_AVAILABLE_LETTERS_PAPER_WIDTH = 900;

    /**********************/
    /*  HELPER FUNCTIONS  */
    /**********************/
    /* Simulates the click animation for the inputted HTML button element */
    function simulateClickAnimationHTML(buttonElement) {
       buttonElement.transition({
            scale: 0.8,
            duration: 25
        }).transition({
            scale: 1.0,
            duration: 25
        });
    }

    /* Simulates the click animation for the inputted Raphael element */
    function simulateClickAnimationRaphael(element) {
        element.animate({
            transform: "s0.8"
        }, 25);
        window.setTimeout(function () {
            element.animate({
                transform: "s1"
            }, 25);
        }, 25)
    }

    /* Adds animation event handlers (for both mouse and touch) for the inputted Raphael element */
    function addAnimationsToRaphaelElement(element, type) {
        // Mouse scale animations
        element.mouseover(function () {
            if (type == "button") {
                scaleRaphaelElement(element, "1.1", 100);
            }
            else if (type == "letter") {
                scaleRaphaelElement(element, "1.2", 100);
            }
        });

        element.mouseout(function () {
            scaleRaphaelElement(element, "1.0", 100);
        });

        element.mousedown(function () {
            scaleRaphaelElement(element, "0.9", 100);
        });

        element.mouseup(function () {
            scaleRaphaelElement(element, "1.0", 100);
        });

        // Touch scale animations
        element.touchstart(function () {
            scaleRaphaelElement(element, "0.9", 100);
        });

        element.touchend(function () {
            scaleRaphaelElement(element, "1.0", 100);
        });
    };

    /* Scales the inputted Raphael element to the inputted size */
    function scaleRaphaelElement(element, scale, duration) {
        element.animate({
            "transform": "s" + scale
        }, duration, "easeIn");
    };


    /*****************/
    /*  SUBSET WORD  */
    /*****************/
    var SubsetWord = (function () {
        /* SubsetWord class constructor */
        function SubsetWord(word) {
            this.word = word;
            this.letterImages = [];
            this.isFound = false;
        }

        return SubsetWord;
    })();


    /******************/
    /*  ROUND LETTER  */
    /******************/
    var RoundLetter = (function () {
        /* RoundLetter class constructor */
        function RoundLetter(letter, index, letterImage, round, unguessedYCoord) {
            this.letter = letter;
            this.currentIndex = index;
            this.guessedIndex = null;
            this.unguessedYCoord = unguessedYCoord;
            this.letterImage = letterImage;
            this.round = round;
        }

        /* Returns true if the current round letter is guessed; otherwise, returns false */
        RoundLetter.prototype.isGuessed = function () {
            return (this.guessedIndex != null);
        };

        /* Guesses the current round letter */
        RoundLetter.prototype.guess = function (simulateClickAnimation, playSoundEffect) {
            // Play the guess sound effect
            if ($.RC.Music.soundEffectsOn && playSoundEffect) {
                var sound = new Audio("./resources/sounds/soundEffects/guess.mp3");
                sound.volume = 1.0;
                sound.play();
            }

            // Update this letter's guessed index
            this.guessedIndex = this.round.getNumGuessedLetters();
            
            // If the source came from the keyboard, do a quick scale animation and then move the letter image to the guessed position
            var obj = this.letterImage;
            if (simulateClickAnimation) {
                // Scale animation
                simulateClickAnimationRaphael(obj);

                // Move to guessed position
                var _this = this;
                window.setTimeout(function () {
                    obj.animate({
                        x: _this.round.getAvailableLetterXCoord(_this.guessedIndex),
                        y: _this.unguessedYCoord - g_AVAILABLE_LETTER_VERTICAL_GUESS_DISTANCE
                    }, 250);
                }, 50);
            }

            // If the source came from a click, just move the letter image to the guessed position since the scale animation is handled elsewhere
            else {
                obj.animate({
                    x: this.round.getAvailableLetterXCoord(this.guessedIndex),
                    y: this.unguessedYCoord - g_AVAILABLE_LETTER_VERTICAL_GUESS_DISTANCE
                }, 250);
            }
        };

        /* Unguesses the current round letter */
        RoundLetter.prototype.unguess = function (simulateClickAnimation, playSoundEffect) {
            // Play the unguess sound effect
            if ($.RC.Music.soundEffectsOn && playSoundEffect) {
                var sound = new Audio("./resources/sounds/soundEffects/guess.mp3");
                sound.volume = 1.0;
                sound.play();
            }

            // If this is not the last guessed letter, move the guessed letters after it to the left
            var numGuessedLetters = this.round.getNumGuessedLetters();
            if ((this.guessedIndex + 1) != numGuessedLetters) {
                var numRoundLetters = this.round.letters.length;
                for (var i = 0; i < numRoundLetters; i++) {
                    var letter = this.round.letters[i];
                    if (letter.isGuessed() && letter.guessedIndex > this.guessedIndex) {
                        // Decrement the guessed index
                        letter.guessedIndex -= 1;

                        // Update this letter's coordinates
                        var obj = letter.letterImage;
                        obj.animate({
                            x: this.round.getAvailableLetterXCoord(letter.guessedIndex)
                        }, 100);
                    }
                }
            }

            // Reset this letter's guessed index
            this.guessedIndex = null;

            // If the source came from the keyboard, do a quick scale animation and then move the letter image to the guessed position
            var obj = this.letterImage;
            if (simulateClickAnimation) {
                // Scale animation
                simulateClickAnimationRaphael(obj);

                // Move to unguessed position
                var _this = this;
                window.setTimeout(function () {
                    obj.animate({
                        x: _this.round.getAvailableLetterXCoord(_this.currentIndex),
                        y: obj.attr("y") + (_this.unguessedYCoord - obj.attr("y"))
                    }, 250);
                }, 50);
            }

            // If the source came from a click, just move the letter image to the unguessed position since the scale animation is handled elsewhere
            else {
                obj.animate({
                    x: this.round.getAvailableLetterXCoord(this.currentIndex),
                    y: this.unguessedYCoord
                }, 250);
            }
        };

        return RoundLetter;
    })();


    /***********/
    /*  ROUND  */
    /***********/
    var Round = (function () {
        /* Round class constructor */
        function Round(game, numLetters, secondsRemaining, word, foundWords, startRoundPaused, startRoundDone) {
            this.game = game;
            this.numLetters = numLetters;
            this.secondsRemaining = secondsRemaining;
            this.isPaused = startRoundPaused;
            this.isOver = startRoundDone;

            this.word = null;
            this.wordHash = 0;
            this.subsetWords = [];
            this.letters = [];
            this.previousGuess = [];
            
            this.successfullyCompleted = false;
            this.foundAllWords = false;
            
            // wordList comes from wordList.js; loop until it is done parsing
            while (wordList === "undefined") {
            };
            this.initializeRound(wordList);
        };

        /* Initializes the current round */
        Round.prototype.initializeRound = function (wordList) {
            // Generate a random word to be used for the current round
            this.generateWord(wordList);

            // Update the subset words constants depending on the screen size
            // Note: 1366 is the screen width of the Microsoft Surface RT
            if (window.innerWidth > 1366) {
                g_LETTER_HEIGHT = 34;
                g_LETTER_WIDTH = 34;
                g_HEIGHT_BETWEEN_SUBSET_WORDS = 15;
                g_WIDTH_BETWEEN_SUBSET_WORDS = 40;
            }
            else {
                g_LETTER_HEIGHT = 28;
                g_LETTER_WIDTH = 28;
                g_HEIGHT_BETWEEN_SUBSET_WORDS = 6;
                g_WIDTH_BETWEEN_SUBSET_WORDS = 25;
            }

            // Update the width between available letters constant depending on how many letters are in the current round
            switch (this.numLetters) {
                case 5:
                    g_WIDTH_BETWEEN_AVAILABLE_LETTERS = 95;
                    break;
                case 6:
                    g_WIDTH_BETWEEN_AVAILABLE_LETTERS = 60;
                    break;
                case 7:
                    g_WIDTH_BETWEEN_AVAILABLE_LETTERS = 36;
                    break;
            }

            // Get the subset of words that can be made from this round's word
            this.generateSubsetWords(wordList);

            // Draw the game board
            this.drawSubsetWords([]);
            this.drawLetters();
            this.drawMiscellaneous();

            // If our app was terminated at the end of a game, end the game
            if (this.isOver) {
                // Show the game board
                $("#gameBoard").show(1);
                
                // End the current round
                this.endRound(/* dontSaveHighScore */ true);
            }
            
            // Else if our app was terminated during a game, start this game paused
            else if (this.isPaused) {
                // Pause the game
                this.pause();
            }

            // Othwerise, start this game as normal 
            else {
                // Show the game board
                $("#gameBoard").show(1);

                // Show the available letters, game board buttons, and guessed letters plank
                $(".roundLetter, .gameBoardButton, #guessedLettersPlank").show(1);

                // Initialize the game board event listeners
                this.initializeGameBoardEventListeners();

                // Start the round timer
                this.startTimer();
            }
        };

        /* Initializes the game board event listeners */
        Round.prototype.initializeGameBoardEventListeners = function () {
            // Add event listeners for the game board buttons
            var currentRound = this;
            $("#pauseGameButton").on("click", function () {
                currentRound.pause();
            });
            $("#submitButton").on("click", function () {
                currentRound.submitGuess();
            });
            $("#shuffleButton").on("click", function () {
                currentRound.shuffleLetters();
            });
            $("#lastButton").on("click", function () {
                currentRound.setPreviousGuess();
            });
            $("#clearButton").on("click", function () {
                currentRound.clearGuess(/* playSoundEffect */ true);
            });

            // Give the body focus so it accepts keyboard events
            $("body").focus();

            // Initialize the keyboard events
            var _this = this;
            $("body").on("keydown", function (event) {
                // Enter
                if (event.which == 13) {
                    _this.submitGuess(/* simulateClickAnimation = */ true);
                }

                // Backspace
                else if (event.which == 8) {
                    var numGuessedLetters = _this.getNumGuessedLetters();
                    var numLetters = _this.game.numLetters;
                    for (var i = 0; i < numLetters; i++) {
                        var letter = _this.letters[i];
                        if (letter.guessedIndex == (numGuessedLetters - 1)) {
                            letter.unguess(/* simulateClickAnimation = */ true, /* playSoundEffect */ true);
                        }
                    }

                    // Prevent the WinJS navigation from going back to the games list page
                    event.preventDefault();
                }

                // Spacebar
                else if (event.which == 32) {
                    _this.shuffleLetters(/* simulateClickAnimation = */ true);
                }

                // Up arrow
                else if (event.which == 38) {
                    _this.setPreviousGuess(/* simulateClickAnimation = */ true);
                }

                // Escape
                else if (event.which == 27) {
                    _this.pause(/* simulateClickAnimation = */ true);
                }

                // Alphabetic character
                else if (event.which >= 65 && event.which <= 90) {
                    for (var i = 0; i < _this.game.numLetters; i++) {
                        var letter = _this.letters[i];
                        if (!letter.isGuessed() && letter.letter == String.fromCharCode(event.which).toUpperCase()) {
                            letter.guess(/* simulateClickAnimation = */ true, /* playSoundEffect */ true);
                            break;
                        }
                    }
                }
            });
        };

        /* Disposes of the game board event listeners */
        Round.prototype.disposeGameBoardEventListeners = function () {
            // Remove event listeners for the game board buttons
            $("#pauseGameButton").off("click");
            $("#submitButton").off("click");
            $("#shuffleButton").off("click");
            $("#lastButton").off("click");
            $("#clearButton").off("click");
            $(".gameBoardButton").unbind();

            // Remove the mouse and touch event listeners on the available letters
            var numLetters = this.letters.length;
            for (var i = 0; i < numLetters; i++) {
                var letterImage = this.letters[i].letterImage;
                letterImage.unclick();
                letterImage.unmouseover();
                letterImage.unmouseout();
                letterImage.unmousedown();
                letterImage.unmouseup();
                letterImage.untouchstart();
                letterImage.untouchend();
            }

            // Remove the keyboard event listeners (but still prevent the backspace key from navigating back to the games list)
            $("body").off("keydown");
            $("body").on("keydown", function (event) {
                if (event.which == 8) {
                    event.preventDefault();
                }
            });
        };

        /* Starts the current round's timer */
        Round.prototype.startTimer = function () {
            var _this = this;
            this.timer = window.setInterval(function () {
                _this.updateTime();
            }, 1000);
        };

        /* Stops the current round's timer */
        Round.prototype.stopTimer = function () {
            window.clearTimeout(this.timer);
        };

        /* Sets this Round's word as a random word of length numLetters */
        Round.prototype.generateWord = function (wordList) {
            // Keep looping until we get a word of the correct length that has not already been used in this game
            this.word = ""
            var wordListLength = wordList.length;
            while ((this.word.length != this.numLetters) || ($.inArray(this.word, this.game.pastRoundWords) != -1)) {
                var wordEntry = wordList[Math.floor(Math.random() * wordListLength)].split("|");
                this.word = wordEntry[0];
                this.wordHash = parseInt(wordEntry[1]);
            }

            // Add the new word to the past round words list
            this.game.pastRoundWords.push(this.word);
        };

        /* Finds all the words that can be made from the letters in this Round's word */
        Round.prototype.generateSubsetWords = function (wordList) {
            var numWords = wordList.length;
            var numGameLetters = this.numLetters;
            for (var i = 0; i < numWords; i++) {
                // Get the current word and its hash
                var wordEntry = wordList[i].split("|");
                var word = wordEntry[0];
                var currentWordHash = parseInt(wordEntry[1]);

                // Stop looking at words if we have more letters than the round's word
                if (word.length > numGameLetters) {
                    break;
                }

                // If the current word's hash is cleanly divisible by the hash for the round's word, add it to the subset words array
                if (this.wordHash % currentWordHash == 0) {
                    this.subsetWords.push(new SubsetWord(word));
                }
            }
        };

        /* Draws this Round's subset words */
        Round.prototype.drawSubsetWords = function (foundWords) {
            // Set the x- and y-coordinates to the top left corner (including game board padding)
            var xCoord = g_GAMEBOARD_PADDING;
            var yCoord = g_GAMEBOARD_PADDING;

            // Determine the number of words to draw per column
            var wordsPerColumn, leftOverHeight;
            g_HEIGHT_BETWEEN_SUBSET_WORDS -= 1;
            do {
                // Try again with a different padding between subset words
                g_HEIGHT_BETWEEN_SUBSET_WORDS += 1;

                // equations below derived from: window height = [(n-1) * heightBetweenSubsetWords] + [n * subsetWordHeight] + [2 * gameBoardPadding]
                wordsPerColumn = Math.floor((window.innerHeight + g_HEIGHT_BETWEEN_SUBSET_WORDS - (2 * g_GAMEBOARD_PADDING)) / (g_LETTER_HEIGHT + g_HEIGHT_BETWEEN_SUBSET_WORDS));
                leftOverHeight = window.innerHeight - (g_LETTER_HEIGHT * wordsPerColumn) - (g_HEIGHT_BETWEEN_SUBSET_WORDS * (wordsPerColumn - 1)) - (2 * g_GAMEBOARD_PADDING);
            }
            while ((leftOverHeight > 11) && (g_HEIGHT_BETWEEN_SUBSET_WORDS < 25));

            // Draw the subset words
            var paperSize = 0;
            var numSubsetWordsInCurrentRow = 0;
            var numSubsetWords = this.subsetWords.length;
            var subsetWordsPaper = this.game.papers["subsetWords"];
            for (var i = 0; i < numSubsetWords; i++) {
                // Get the current subset word
                var subsetWord = this.subsetWords[i];

                // Store the xCoord for the beginning of the word
                var wordBeginXCoord = xCoord;

                // Determine if the word has already been found (if we are loading a previously saved game)
                var found = $.inArray(subsetWord.word, foundWords) > -1;

                // Draw the letter square for each letter in the current subset word
                var subsetWordLength = subsetWord.word.length;
                for (var j = 0; j < subsetWordLength; j++) {
                    var letter = subsetWord.word[j];
                    if (found) {
                        var letterImage = subsetWordsPaper.image("./resources/images/letterSquares/letterSquare" + letter + ".png", xCoord, yCoord, g_LETTER_WIDTH, g_LETTER_HEIGHT);
                    }
                    else if (this.isOver) {
                        var letterImage = subsetWordsPaper.image("./resources/images/letterSquares/missedletterSquare" + letter + ".png", xCoord, yCoord, g_LETTER_WIDTH, g_LETTER_HEIGHT);
                    }
                    else {
                        var letterImage = subsetWordsPaper.image("./resources/images/letterSquares/letterSquareBlank.png", xCoord, yCoord, g_LETTER_WIDTH, g_LETTER_HEIGHT);
                    }
                    subsetWord.letterImages.push(letterImage);
                    xCoord = xCoord + g_LETTER_WIDTH + 1;
                }

                // If the current subset word has already been found, mark it as found and see if we have already successfully completed this round
                if (found) {
                    // Mark the subset word as found
                    subsetWord.isFound = true;

                    // If the found word used all the available letters, set the round as successfully completed
                    if (subsetWordLength == this.numLetters) {
                        this.successfullyCompleted = true;
                    }
                }

                paperSize = xCoord + 20;

                numSubsetWordsInCurrentRow += 1;

                // Move to a new column if necessary
                if (numSubsetWordsInCurrentRow == wordsPerColumn) {
                    xCoord += g_WIDTH_BETWEEN_SUBSET_WORDS;
                    yCoord = g_GAMEBOARD_PADDING;
                    numSubsetWordsInCurrentRow = 0;
                }
                else {
                    xCoord = wordBeginXCoord;
                    yCoord += (g_LETTER_HEIGHT + g_HEIGHT_BETWEEN_SUBSET_WORDS);
                }
            }

            // Update the size of the subset words Raphael paper
            this.game.papers["subsetWords"].setSize(paperSize, window.innerHeight);
        };

        /* Returns the x-coordinate of the available letter at the given index */
        Round.prototype.getAvailableLetterXCoord = function (index) {
            return g_AVAILABLE_LETTERS_PAPER_WIDTH - g_GAMEBOARD_PADDING - 35 - (g_AVAILABLE_LETTER_WIDTH * (this.numLetters - index)) - (g_WIDTH_BETWEEN_AVAILABLE_LETTERS * (this.numLetters - 1 - index));
        };

        /* Draws the current round's letters */
        Round.prototype.drawLetters = function () {
            // Determine the coordinates for the leftmost letter
            // xCoord gets set in shuffleLetters()
            var yCoord = window.innerHeight - 360;

            for (var i = 0; i < this.numLetters; i++) {
                // Create the orange image for the current available letter
                var letterImage = this.game.papers["availableLetters"].image("./resources/images/letterOranges/letterOrange" + this.word[i] + ".png", 0, yCoord, g_AVAILABLE_LETTER_WIDTH, g_AVAILABLE_LETTER_HEIGHT);

                // Add a class to the current letter's image
                letterImage.node.setAttribute("class", "roundLetter");

                // Create the current RoundLetter object and add it to this Round's letters
                var roundLetter = new RoundLetter(this.word[i], i, letterImage, this, yCoord);
                this.letters.push(roundLetter);
                
                // Use a closure so that we don't always get the last value of roundLetter
                (function (roundLetter) {
                    // Guess or unguess the current RoundLetter when the letter image is clicked
                    letterImage.click(function (event) {
                        if (roundLetter.isGuessed()) {
                            roundLetter.unguess(/* simulateClickAnimation */ false, /* playSoundEffect */ true);
                        } else {
                            roundLetter.guess(/* simulateClickAnimation = */ false, /* playSoundEffect */ true);
                        }
                    });
                })(roundLetter);

                // Add animations to the letter image
                addAnimationsToRaphaelElement(letterImage, "letter");
            }

            // Shuffle the available letters
            this.shuffleLetters(/* simulateClickAnimation = */ false, /* initialShuffle = */ true);

            // Animate the available letters
            for (var i = 0; i < this.numLetters; i++) {
                var letter = this.letters[i];
                var anim = Raphael.animation([
                    {
                        opacity: 0
                    },
                    {
                        opacity: 1,
                        x: letter.letterImage.attr("x") - 50
                    }
                ], 200);
                letter.letterImage.animate(anim.delay(50));
            }
        };

        /* Draws miscellaneous objects */
        Round.prototype.drawMiscellaneous = function () {
            // Initialize the current round number
            $("#round").text(this.game.numRoundsCompleted + 1);

            // Initialize the current score
            $("#score").text(this.game.score);

            // Initialize the time remaining
            var minutesRemaining = Math.floor(this.secondsRemaining / 60);
            var secondsRemaining = this.secondsRemaining % 60;
            if (secondsRemaining >= 10) {
                $("#timeRemaining").text(minutesRemaining.toString() + ":" + secondsRemaining.toString());
            }
            else {
                $("#timeRemaining").text(minutesRemaining.toString() + ":0" + secondsRemaining.toString());
            }
        };

        /* Pauses the current game and shows the pause menu */
        Round.prototype.pause = function (simulateClickAnimation) {
            // Animate the pause button
            if (simulateClickAnimation) {
                simulateClickAnimationHTML($("#pauseButton"));
            }

            // Hide the game board and then fade in the pause menu
            $("#gameBoard").hide(100, function () {
                $("#pauseMenu").fadeIn();
            });

            // Dispose of all event listeners
            this.disposeGameBoardEventListeners();

            // Stop the current round's timer
            this.stopTimer();

            // Mark the round as paused
            this.isPaused = true;

            // Pause the game board music
            if ($.RC.Music.musicOn) {
                try {
                    $.RC.Music.gameBoardMusic.pause();
                }
                catch(error) {
                }
            }
        };

        /* Hides the pause menu and resumes the current game */
        Round.prototype.resume = function () {
            // Fade out the pause menu and show the game board
            $("#pauseMenu").fadeOut(function () {
                $("#gameBoard").show(100);
            });

            // Reinitialize all event listeners
            this.initializeGameBoardEventListeners();

            // Restart the round timer
            this.startTimer();

            // Mark the game as unpaused
            this.isPaused = false;

            // Resume the game board music
            if ($.RC.Music.musicOn) {
                try {
                    $.RC.Music.gameBoardMusic.play();
                }
                catch(error) {
                }
            }
        };

        /* Returns the number of letters currently in the guessed state */
        Round.prototype.getNumGuessedLetters = function () {
            var numGuessedLetters = 0;
            for (var i = 0; i < this.numLetters; i++) {
                if (this.letters[i].isGuessed()) {
                    numGuessedLetters++;
                }
            }
            return numGuessedLetters;
        };

        /* Updates the current game's score */
        Round.prototype.updateScore = function (foundWord) {
            // Increase the score by ten points for each letter in the found word
            var foundWordLength = foundWord.length;
            var scoreIncrease = (foundWordLength * 10);
            this.game.score += scoreIncrease;
            this.animateScoreIncrease(scoreIncrease);

            // Initially, set that all bonus will be given
            var giveFoundAllWordsOfThisLengthBonus = true;
            var giveFoundAllWordsBonus = true;

            // Determine if any bonuses should actually be given
            var numSubsetWords = this.subsetWords.length;
            for (var i = 0; i < numSubsetWords; i++) {
                // Get the current subset word
                var currentSubsetWord = this.subsetWords[i];

                // If the current subset word has not been found, cancel the appropriate bonus(es)
                if (currentSubsetWord.isFound == false) {
                    giveFoundAllWordsBonus = false;
                    if (currentSubsetWord.word.length == foundWordLength) {
                        giveFoundAllWordsOfThisLengthBonus = false;
                        break;
                    }
                }
            }

            // Bonus for finding all the words of a certain length
            if (giveFoundAllWordsOfThisLengthBonus) {
                var foundAllWordsOfThisLengthBonus = 100;
                this.game.score += foundAllWordsOfThisLengthBonus;
                this.animateScoreIncrease(foundAllWordsOfThisLengthBonus, 750);
            }

            // Bonus for finding every word in the current round
            if (giveFoundAllWordsBonus) {
                var foundAllWordsBonus = (this.secondsRemaining * 10);
                this.game.score += foundAllWordsBonus;
                this.animateScoreIncrease(foundAllWordsBonus, 1500);

                // Specify that every word has been found and end the current round early
                this.foundAllWords = true;
                this.endRound();
            }

            // Increase the total score by 1 point every 1 ms up to the total score increase
            var totalScore = this.game.score;
            var scoreIncrease = this.game.score - parseInt($("#score").text());
            var increaseInterval = 1;
            if (scoreIncrease > 1000) {
                increaseInterval = 10;
            }
            else if (scoreIncrease > 500) {
                increaseInterval = 5;
            }
            var scoreIncreaseInterval = window.setInterval(function () {
                $("#score").text(parseInt($("#score").text()) + increaseInterval);
                if (parseInt($("#score").text()) > totalScore) {
                    $("#score").text(totalScore);
                    window.clearInterval(scoreIncreaseInterval);
                }
            }, 1);
        };

        /* Animates the score increase */
        Round.prototype.animateScoreIncrease = function (scoreIncrease, animationDelay) {
            // Delay the score increase animation for the requested amount
            window.setTimeout(function () {
                // Create the score increase container and add it to the DOM
                var scoreIncreaseContainer = $("<p id='scoreIncreaseContainer'>+" + scoreIncrease + "</p>")
                $("#scoreContainer").after(scoreIncreaseContainer);

                // Set the starting position of the score increase container
                var score = $("#score");
                var scoreOffset = $("#score").offset();
                scoreIncreaseContainer.offset({
                    top: scoreOffset.top + 5,
                    left: scoreOffset.left + ($("#score").width() / 2) - 20
                });

                // Move and fade out the score increase container
                scoreIncreaseContainer.transition({
                    x: "25px",
                    y: "25px",
                    opacity: 0,
                    duration: 1500
                });

                // Remove the score increase container
                window.setTimeout(function () {
                    scoreIncreaseContainer.remove();
                }, 1500);
            }, animationDelay);
        };

        /* Decrements this game timer and deals with end of game logic */
        Round.prototype.updateTime = function () {
            // Decrement the time left
            this.secondsRemaining -= 1;

            // Convert the seconds remaining to a clock time
            var minutesRemaining = Math.floor(this.secondsRemaining / 60);
            var secondsRemaining = this.secondsRemaining % 60;
            if (secondsRemaining >= 10) {
                $("#timeRemaining").text(minutesRemaining.toString() + ":" + secondsRemaining.toString());
            }
            else {
                if (minutesRemaining == 0) {
                    if (secondsRemaining == 0) {
                        // Play the running out of time sound
                        if ($.RC.Music.soundEffectsOn) {
                            var sound = new Audio("./resources/sounds/soundEffects/roundOver.mp3");
                            sound.volume = 0.2;
                            sound.play();
                        }
                    }
                    else {
                        // Play the running out of time sound
                        if ($.RC.Music.soundEffectsOn) {
                            var sound = new Audio("./resources/sounds/soundEffects/timeRunningOut.mp3");
                            sound.volume = 0.3;
                            sound.play();
                        }
                    }
                }

                $("#timeRemaining").text(minutesRemaining.toString() + ":0" + secondsRemaining.toString());
            }

            // Round over logic
            if ((minutesRemaining == 0) && (secondsRemaining == 0)) {
                this.endRound();
            }
        };

        /* Ends the current round and allows the user to start a new round */
        Round.prototype.endRound = function (dontSaveHighScore) {
            // Stop the timer
            this.stopTimer();

            // Remove event listeners
            this.disposeGameBoardEventListeners();

            // Hide the available letters, game board buttons, and guessed letters plank
            $(".roundLetter, .gameBoardButton, #guessedLettersPlank").not("#pauseGameButton").hide();

            // Mark the round as over and paused
            this.isOver = true;
            this.isPaused = true;

            // Show the missed words
            var numSubsetWords = this.subsetWords.length;
            for (var i = 0; i < numSubsetWords; i++) {
                var subsetWord = this.subsetWords[i];
                if (!subsetWord.isFound) {
                    var subsetWordLength = subsetWord.word.length;
                    for (var j = 0; j < subsetWordLength; j++) {
                        subsetWord.letterImages[j].attr("src", "./resources/images/letterSquares/missedLetterSquare" + subsetWord.word[j] + ".png");
                    }
                }
            }

            // Case 1: the user found all the words
            if (this.foundAllWords) {
                // Set the message for the next round menu
                $("#nextRoundMenu > p").text("Perfect!");

                // Increment the number of rounds complete
                this.game.numRoundsCompleted += 1;

                // Show the next round menu
                $("#nextRoundMenu").fadeIn();
            }

            // Case 2: the user succesfully completed the round but did not find all the words
            else if (this.successfullyCompleted) {
                // Set the message for the next round menu
                $("#nextRoundMenu > p").text("You got it!");

                // Increment the number of rounds complete
                this.game.numRoundsCompleted += 1;

                // Show the next round menu
                $("#nextRoundMenu").fadeIn();
            }

            // Case 3: the user did not successfully complete the round and the game is over
            else {
                console.log("game over")
                $("#gameOverMenu").fadeIn();
            }
        };

        /* Moves all of the guess letters into the unguessed state */
        Round.prototype.clearGuess = function (playSoundEffect) {
            // Play the guess sound effect
            if ($.RC.Music.soundEffectsOn && playSoundEffect) {
                var sound = new Audio("./resources/sounds/soundEffects/guess.mp3");
                sound.volume = 1.0;
                sound.play();
            }

            // Get all the guessed letter's current indices
            var guessedLetterCurrentIndices = [];
            for (var i = 0; i < this.numLetters; i++) {
                var letter = this.letters[i];
                if (letter.isGuessed()) {
                    guessedLetterCurrentIndices.push(letter.currentIndex);
                }
            }
            guessedLetterCurrentIndices.sort();

            // For each guessed letter, update it's coordinates and guessed index
            for (var i = 0; i < this.numLetters; i++) {
                var letter = this.letters[i];
                if (letter.isGuessed()) {
                    letter.currentIndex = guessedLetterCurrentIndices[letter.guessedIndex];
                }
            }
            for (var i = 0; i < this.numLetters; i++) {
                var letter = this.letters[i];
                if (letter.isGuessed()) {
                    letter.unguess();
                }
            }
        };

        /* Submits this Round's currently guessed letters */
        Round.prototype.submitGuess = function (simulateClickAnimation) {
            // Animate the submit button
            if (simulateClickAnimation) {
                simulateClickAnimationHTML($("#submitButton"));
            }

            // Only submit a guess if there is one
            if (this.getNumGuessedLetters() != 0) {
                // Clear the last guess
                this.previousGuess = [];

                // Get the guessed word and populate the previous guess array
                var guess = "";
                while (guess.length != this.getNumGuessedLetters()) {
                    for (var i = 0; i < this.numLetters; i++) {
                        var letter = this.letters[i];
                        if (letter.guessedIndex == guess.length) {
                            guess = guess + letter.letter;
                            this.previousGuess.push(letter);
                            break;
                        }
                    }
                }

                // If the guessed word is in this Round's word subset and has not already been found, set is as found and update the score
                var numSubsetWords = this.subsetWords.length;
                for (var i = 0; i < numSubsetWords; i++) {
                    var subsetWord = this.subsetWords[i];
                    if ((subsetWord.isFound == false) && (subsetWord.word == guess)) {
                        subsetWord.isFound = true;
                        var subsetWordLength = subsetWord.word.length;
                        for (var j = 0; j < subsetWordLength; j++) {
                            subsetWord.letterImages[j].attr("src", "./resources/images/letterSquares/letterSquare" + subsetWord.word[j] + ".png");
                        }
                        this.updateScore(guess);

                        // Increment the number of words found in the current game
                        this.game.numWordsFound += 1;

                        // If the found word used all the available letters, set the round as successfully completed
                        if (subsetWordLength == this.numLetters) {
                            this.successfullyCompleted = true;
                        }

                        // Play the correct sound
                        if ($.RC.Music.soundEffectsOn) {
                            var sound = new Audio("./resources/sounds/soundEffects/correctGuess.mp3");
                            sound.volume = 0.1;
                            sound.play();
                        }

                        break;
                    }

                    // If we have been through every subset word and none are correct, play the incorrect sound
                    if (i == numSubsetWords - 1) {
                        if ($.RC.Music.soundEffectsOn) {
                            var sound = new Audio("./resources/sounds/soundEffects/incorrectGuess.mp3");
                            sound.volume = 0.8;
                            sound.play();
                        }
                    }
                }

                // Move the guessed letters to the unguessed state
                this.clearGuess();
            }
        };

        /* Moves the letters in the previousGuess array into the guessed state */
        Round.prototype.setPreviousGuess = function (simulateClickAnimation) {
            // Play the guess sound effect
            if ($.RC.Music.soundEffectsOn) {
                var sound = new Audio("./resources/sounds/soundEffects/guess.mp3");
                sound.volume = 1.0;
                sound.play();
            }

            // Animate the last button
            if (simulateClickAnimation) {
                simulateClickAnimationHTML($("#lastButton"));
            }

            // Clear the current guess
            this.clearGuess();

            // Guess each of the letters in the previous guess array
            var previousGuessLength = this.previousGuess.length;
            for (var i = 0; i < previousGuessLength; i++) {
                this.previousGuess[i].guess(/* simulateClickAnimation = */ false, /* playSoundEffect */ false);
            }
        };

        /* Returns true if this Round's letters are (a) in a different order than the previous ordering and (b) are not in the order of any word in subsetWords; otherwise, returns false */
        Round.prototype.isShuffled = function (previousOrdering) {
            // If the previous ordering is not given, return false (I added this as a convenience)
            if (previousOrdering.length == 0) {
                return false;
            }

            // Get the current order of this Round's letters
            var currentOrderingWord = "";
            var currentOrdering = [];
            for (var i = 0; i < this.numLetters; i++) {
                currentOrdering.push(this.letters[i].currentIndex);
                currentOrderingWord += this.letters[i].letter;
            }

            // If the previous and current orderings are the same, return false
            if (previousOrdering == currentOrdering) {
                return false;
            }

            // If any of the longest length words in subsetWords are equal to the current ordering's word, return false
            var numSubsetWords = this.subsetWords.length;
            for (var i = numSubsetWords - 1; i >= 0; i--) {
                var subsetWord = this.subsetWords[i];
                var subsetWordLength = subsetWord.word.length;
                if (subsetWordLength == this.numLetters) {
                    if (subsetWord.word == currentOrderingWord) {
                        return false;
                    }
                }

                // Break out once we no longer have any words of the longest length remaining
                else {
                    break;
                }
            }
            return true;
        };

        /* Shuffles the ordering of this Round's letters */
        Round.prototype.shuffleLetters = function (simulateClickAnimation, initialShuffle) {
            // Play the shuffle sound
            if ($.RC.Music.soundEffectsOn && !initialShuffle) {
                var sound = new Audio("./resources/sounds/soundEffects/shuffle.mp3");
                sound.volume = 0.2;
                sound.play();
            }

            // Animate the shuffle button
            if (simulateClickAnimation) {
                simulateClickAnimationHTML($("#shuffleButton"));
            }

            // Randomly shuffle the current round's letters
            var previousOrdering = [];
            while (!this.isShuffled(previousOrdering)) {
                // Get the previous ordering
                previousOrdering = [];
                for (var i = 0; i < this.numLetters; i++) {
                    previousOrdering.push(this.letters[i].currentIndex);
                }

                // Randomly sort the letters
                this.letters.sort(function () {
                    return 0.5 - Math.random();
                });
            }

            // Update the position of every unguessed letter
            for (var i = 0; i < this.numLetters; i++) {
                var letter = this.letters[i];
                letter.currentIndex = i;
                if (!letter.isGuessed()) {
                    var obj = letter.letterImage;

                    // If this is the inital shuffle, simply set the image's x-coord, accounting for the animation offset; otherwise, animate the image
                    if (initialShuffle) {
                        obj.attr("x", this.getAvailableLetterXCoord(letter.currentIndex) + 50);
                    }
                    else {
                        obj.animate({
                            x: this.getAvailableLetterXCoord(letter.currentIndex)
                        }, 100);
                    }
                }
            }
        };

        return Round;
    })();


    // Add the classes to the RC namespace
    if (!$.RC) {
        $.RC = {};
    }
    if (!$.RC.Classes) {
        $.RC.Classes = {};
    }
    $.RC.Classes["SubsetWord"] = SubsetWord;
    $.RC.Classes["RoundLetter"] = RoundLetter;
    $.RC.Classes["Round"] = Round;
})();