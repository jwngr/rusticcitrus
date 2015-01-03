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

    // Map each character to a unique prime number
    var g_CHAR_MAP = { 'A': 2, 'B': 3, 'C': 5, 'D': 7, 'E': 11, 'F': 13, 'G': 17, 'H': 19, 'I': 23, 'J': 29, 'K': 31, 'L': 37, 'M': 41, 'N': 43, 'O': 47, 'P': 53, 'Q': 59, 'R': 61, 'S': 67, 'T': 71, 'U': 73, 'V': 79, 'W': 83, 'X': 89, 'Y': 97, 'Z': 101 };

    /**********************/
    /*  HELPER FUNCTIONS  */
    /**********************/
    /* Takes a string of characters and returns a unique hash (because each character is mapped to a unique prime number) */
    function hashString(string) {
        return string.split('').reduce(function (hashValue, currentChar) {
            return hashValue * g_CHAR_MAP[currentChar];
        }, 1);
    };

    /* Simulates the click animation for the inputted HTML button element */
    function simulateClickAnimationHTML(buttonElement) {
        buttonElement.transition({
            scale: 0.8,
            duration: 25
        }).transition({
            scale: 1.0,
            duration: 25
        });
    };

    /* Simulates the click animation for the inputted Raphael element */
    function simulateClickAnimationRaphael(element) {
        element.animate({
            transform: "s0.8"
        }, 25);
        window.setTimeout(function () {
            element.animate({
                transform: "s1.0"
            }, 25);
        }, 25)
    };


    /*****************/
    /*  SUBSET WORD  */
    /*****************/
    var SubsetWord = (function () {
        /* SubsetWord class constructor */
        function SubsetWord(word) {
            this.word = word;
            this.image = null;
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
            if (RC.Music.soundEffectsOn && playSoundEffect) {
                var sound = new Audio("/resources/sounds/soundEffects/guess.mp3");
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
            if (RC.Music.soundEffectsOn && playSoundEffect) {
                var sound = new Audio("/resources/sounds/soundEffects/guess.mp3");
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

        /* Guesses or unguess the current round letter when it is clicked */
        RoundLetter.prototype.onClick = function (roundLetter) {
            if (roundLetter.isGuessed()) {
                roundLetter.unguess(/* simulateClickAnimation */ true, /* playSoundEffect */ true);
            } else {
                roundLetter.guess(/* simulateClickAnimation = */ true, /* playSoundEffect */ true);
            }
        };

        ///* Makes the current round letter draggable and sortable */
        //RoundLetter.prototype.drag = function () {
        //    // Make the Raphael image element corresponding to this round letter draggable and sortable
        //    var _this = this;
        //    this.letterImage.drag(this.dragMove, this.dragStart, this.dragEnd, this, this, this).onDragOver(function(collidedLetterImage) {
        //        _this.dragOver(collidedLetterImage);
        //    });
        //};

        ///* Defines what happens when the round letter is moved by dragging */
        //RoundLetter.prototype.dragMove = function (xDelta, yDelta, x, y) {
        //    this.letterImage.attr({
        //        x: Math.max(0, Math.min((this.letterImage.dragXStart + xDelta), (g_AVAILABLE_LETTERS_PAPER_WIDTH - this.letterImage.attr("width")))),
        //        y: Math.max(this.unguessedYCoord - g_AVAILABLE_LETTER_VERTICAL_GUESS_DISTANCE - 50, Math.min((this.letterImage.dragYStart + yDelta), (this.unguessedYCoord + 50)))
        //    });
        //};

        ///* Defines what happens when the round letter starts to be dragged */
        //RoundLetter.prototype.dragStart = function (x, y) {
        //    this.letterImage.dragXStart = this.letterImage.attr("x");
        //    this.letterImage.dragYStart = this.letterImage.attr("y");
        //    this.round.draggingLetter = this;
        //};

        ///* Defines what happens when the round letter is stopped being dragged */
        //RoundLetter.prototype.dragEnd = function () {
        //    var xDelta = this.letterImage.dragXStart - this.letterImage.attr("x");
        //    var yDelta = this.letterImage.dragYStart - this.letterImage.attr("y");

        //    /* If this was a click, simply guess or unguess the current letter */
        //    if ((Math.abs(xDelta) <= 5) && (Math.abs(yDelta) <= 5)) {
        //        if (this.isGuessed()) {
        //            this.unguess();
        //        } else {
        //            this.guess();
        //        }
        //    }

        //    /* Otherwise, determine if we should guess or unguess the letter by how far the current round letter was dragged */
        //    else {
        //        // If the current round letter is currently guessed and it has been moved far enough down, unguess it
        //        if ((this.isGuessed()) && (-yDelta > (g_AVAILABLE_LETTER_VERTICAL_GUESS_DISTANCE - 75))) {
        //            this.unguess();
        //        }

        //        // Else if the current round letter is currently unguessed and it has been moved far enough up, guess it
        //        else if ((!this.isGuessed()) && (yDelta > (g_AVAILABLE_LETTER_VERTICAL_GUESS_DISTANCE - 75))) {
        //            this.guess();
        //        }

        //        // Otherwise if we are not changing the guess state, simply snap the current round letter to the proper guessed or unguessed position
        //        else {
        //            var animationLength = Math.max(xDelta, yDelta);
        //            if (this.isGuessed()) {
        //                this.letterImage.animate({
        //                    "x": this.round.getAvailableLetterXCoord(this.guessedIndex),
        //                    "y": this.unguessedYCoord - g_AVAILABLE_LETTER_VERTICAL_GUESS_DISTANCE
        //                }, animationLength);
        //            }
        //            else {
        //                this.letterImage.animate({
        //                    "x": this.round.getAvailableLetterXCoord(this.currentIndex),
        //                    "y": this.unguessedYCoord
        //                }, animationLength);
        //            }
        //        }
        //    }
        //};

        ///* Defines what happens when the current round letter gets dragged over and collides with another round letter */
        //RoundLetter.prototype.dragOver = function (collidedLetterImage) {
        //    if (this == this.round.draggingLetter) {
        //        // Get the round letter corresposponding to the letter image with which we collided
        //        var i = 0;
        //        do {
        //            var collidedRoundLetter = this.round.letters[i];
        //            i += 1;
        //        } while (collidedRoundLetter.letterImage != collidedLetterImage);

        //        // If the round letter with which we collided has been guessed and it is not animating, there are two possible cases
        //        if (collidedRoundLetter.isGuessed() && collidedLetterImage.attr("x") == this.round.getAvailableLetterXCoord(collidedRoundLetter.guessedIndex)) {
        //            // If we are also already guessed, simply swap guessed indices with it and updates its x-coordinate
        //            if (this.isGuessed()) {
        //                var temp = this.guessedIndex;
        //                this.guessedIndex = collidedRoundLetter.guessedIndex;
        //                collidedRoundLetter.guessedIndex = temp;
        //                (function (newIndex, round) {
        //                    collidedLetterImage.animate({
        //                        "x": round.getAvailableLetterXCoord(newIndex)
        //                    }, 100);
        //                })(collidedRoundLetter.guessedIndex, this.round);
        //            }

        //            // If we are not yet guessed, update the guessed indices for all round letters in front of which we are being inserted
        //            else {
        //                var temp = collidedRoundLetter.guessedIndex;
        //                for (var i = 0; i < this.round.numLetters; i++) {
        //                    var tempRoundLetter = this.round.letters[i];
        //                    if (tempRoundLetter.isGuessed() && (tempRoundLetter.guessedIndex >= temp)) {
        //                        tempRoundLetter.guessedIndex += 1;
        //                        tempRoundLetter.letterImage.animate({
        //                            "x": this.round.getAvailableLetterXCoord(tempRoundLetter.guessedIndex)
        //                        }, 100);
        //                    }
        //                }
        //                this.guessedIndex = temp;
        //            }
        //        }

        //        // If the round letter with which we collided is not guessed and it is not animating, simply swap current indices with it and update its x-coordinate
        //        else if (collidedLetterImage.attr("x") == this.round.getAvailableLetterXCoord(collidedRoundLetter.currentIndex)) {
        //            var temp = this.currentIndex;
        //            this.currentIndex = collidedRoundLetter.currentIndex;
        //            collidedRoundLetter.currentIndex = temp;
        //            collidedLetterImage.animate({
        //                "x": this.round.getAvailableLetterXCoord(collidedRoundLetter.currentIndex)
        //            }, 100);
        //        }
        //    }
        //};

        return RoundLetter;
    })();


    /***********/
    /*  ROUND  */
    /***********/
    var Round = (function () {
        /* Round class constructor */
        function Round(game, numLetters, secondsRemaining, loadRoundData) {
            if (RC.debug) {
                RC.assert(typeof (game) === "object", "game is not an object");
                RC.assert(game.gameType === "singlePlayer" || game.gameType === "multiplayer", "gameType has unexpecte value");
                RC.assert(typeof (numLetters) === "number", "numLetters is not an object");
                RC.assert(typeof (secondsRemaining) === "number", "secondsRemaining is not a number");
            }

            // Initialize the round data
            this.game = game;
            this.numLetters = numLetters;
            this.secondsRemaining = secondsRemaining;
            this.subsetWords = [];
            this.letters = [];
            this.previousGuess = [];
            this.successfullyCompleted = false;

            if (loadRoundData === undefined) {
                // If this is a new round, use the default values
                this.foundWords = [];
                this.isPaused = false;
                this.isDone = false;
            }
            else {
                // Otherwise, load the inputted data
                if (RC.debug) {
                    RC.assert(typeof (loadRoundData.word) === "string", "word is not a string");
                    RC.assert(typeof (loadRoundData.foundWords) === "object", "foundWords is not an object");
                    RC.assert(typeof (loadRoundData.startRoundPaused) === "boolean", "startRoundPaused is not a boolean");
                    RC.assert(typeof (loadRoundData.startRoundDone) === "boolean", "startRoundDone is not a boolean");
                }

                this.word = loadRoundData.word;
                this.foundWords = loadRoundData.foundWords;
                this.isPaused = loadRoundData.startRoundPaused;
                this.isDone = loadRoundData.startRoundDone;
            }

            // Initialize the current round
            this.initializeRound();
        };

        /* Initializes the current round */
        Round.prototype.initializeRound = function () {
            // Wait until the word list is populated
            while (RC.wordList === undefined) { }

            // Use the inputted word for this round if we are given one; otherwise, generate a random word
            if (this.word === undefined) {
                this.generateWord();
            }
            else {
                this.wordHash = hashString(this.word);
            }

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

            // Create the achievements dictionary if it is undefined
            if (RC.Achievements.dictionary === undefined) {
                if (RC.debug) {
                    RC.Achievements.deleteFile_DEBUG(RC.Achievements.load);
                }
                else {
                    RC.Achievements.load();
                }
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
            this.generateSubsetWords();

            // Draw the game board
            this.drawSubsetWords();
            this.drawLetters();
            this.drawMiscellaneous();

            // If our app was terminated at the end of a game, end the game
            if (this.isDone) {
                // Show the game board
                $("#gameBoard").show();
                
                // End the current round
                this.endRound(/* resumingFromTermination */ true);
            }
            
            // Else if our app was terminated during a game, start this game paused
            else if (this.isPaused) {
                // Pause the game
                this.pause();
            }

            // Otherwise, start this game as normal 
            else {
                // Show the game board
                $("#gameBoard").show();
                
                // Show the available letters, game board buttons, and guessed letters plank
                $("#availableLettersPaper, .gameBoardButton, #guessedLettersPlank").show();

                // Initialize the game board event listeners
                this.initializeGameBoardEventListeners();

                // Hide the pause button if this is a multiplayer game
                if (this.game.gameType === "multiplayer") {
                    $("#pauseGameButton").hide();
                    $("#endRoundButton").hide();
                }

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
            $("#endRoundButton").on("click", function () {
                if (currentRound.successfullyCompleted) {
                    $("#endRoundMenu .gameOverlayMenuTitle").text("Skip to next round?");
                }
                else {
                    $("#endRoundMenu .gameOverlayMenuTitle").text("End game?");
                }

                // Hide the available letters, game board buttons, and guessed letters plank and then fade in the give up menu
                $("#availableLettersPaper, .gameBoardButton, #guessedLettersPlank").not("#pauseGameButton").fadeOut(100, function () {
                    $("#endRoundMenu").fadeIn();
                });

                // Stop the current round's timer
                currentRound.stopTimer();

                // Remove event listeners
                currentRound.disposeGameBoardEventListeners();

                // Mark the round as paused
                currentRound.isPaused = true;
            });

            // Make the available letters draggable/clickable
            for (var i = 0; i < this.numLetters; i++) {
                /*this.letters[i].drag();*/
                (function (currentRoundLetter) {
                    currentRoundLetter.letterImage.click(function () {
                        currentRoundLetter.onClick(currentRoundLetter);
                    });
                })(this.letters[i]);
            }

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
            $("#endRoundButton").off("click");
            $(".gameBoardButton").unbind();

            // Remove all the event listeners on the available letters
            for (var i = 0; i < this.numLetters; i++) {
                var letterImage = this.letters[i].letterImage;
                if (letterImage.events) {
                    while (letterImage.events.length) {
                        var e = letterImage.events.pop();
                        e.unbind();
                    }
                }
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
        Round.prototype.generateWord = function () {
            // Keep looping until we get a word of the correct length that has not already been used in this game
            this.word = "";
            var wordListKeys = Object.keys(RC.wordList);
            var numKeys = wordListKeys.length;
            while ((this.word.length != this.numLetters) || ($.inArray(this.word, this.game.pastRoundWords) != -1)) {
                var key = wordListKeys[Math.floor(Math.random() * numKeys)];
                var wordListEntry = RC.wordList[key].split(",");
                var wordEntry = wordListEntry[Math.floor(Math.random() * wordListEntry.length)].split("|");
                this.word = key + wordEntry[0];
                this.wordHash = parseInt(wordEntry[1]);
            }

            // Add the new word to the past round words list
            this.game.pastRoundWords.push(this.word);
        };

        /* Finds all the words that can be made from the letters in this Round's word */
        Round.prototype.generateSubsetWords = function () {
            // Get the list of unique three-letter permutations of the current round word's letters
            var permutations = [];
            for (var i = 0; i < this.numLetters; ++i) {
                for (var j = 0; j < this.numLetters; ++j) {
                    for (var k = 0; k < this.numLetters; ++k) {
                        if (i != j && j != k && i != k) {
                            var currentPermutation = this.word[i] + this.word[j] + this.word[k];
                            if ($.inArray(currentPermutation, permutations) == -1) {
                                permutations.push(currentPermutation);
                            }
                        }
                    }
                }
            }

            // Loop through each permutation and figure out if any words which begin with it belong in the subset words list
            var subsetWords = []
            var numPermutations = permutations.length;
            for (var i = 0; i < numPermutations; ++i) {
                var permutation = permutations[i];
                var wordListEntry = RC.wordList[permutation];
                if (wordListEntry !== undefined) {
                    wordListEntry = wordListEntry.split(",");
                    var numWordsInEntry = wordListEntry.length;
                    for (var j = 0; j < numWordsInEntry; ++j) {
                        var data = wordListEntry[j].split("|");
                        var word = permutation + data[0];
                        var hash = parseInt(data[1]);

                        // Only add words which are of the correct length]
                        if (word.length <= this.numLetters) {
                            // If the current word's hash is cleanly divisible by the hash for the round's word, add it to the subset words array
                            if (this.wordHash % hash == 0) {
                                subsetWords.push(word);
                            }
                        }
                    }
                }
            }

            // Sort the subset words by length and lexicographical ordering
            subsetWords.sort(function (a, b) {
                var lengthDifference = a.length - b.length;
                if (lengthDifference != 0) {
                    return lengthDifference;
                }
                else {
                    return (a < b) ? -1 : 1;
                }
            });

            // Create the subset words
            var numSubsetWords = subsetWords.length;
            for (var i = 0; i < numSubsetWords; ++i) {
                this.subsetWords.push(new SubsetWord(subsetWords[i]));
            }
        };

        /* Draws this Round's subset words */
        Round.prototype.drawSubsetWords = function () {
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
                var found = $.inArray(subsetWord.word, this.foundWords) > -1;

                // Draw the letter square for each letter in the current subset word
                var subsetWordLength = subsetWord.word.length;
                if (found) {
                    for (var j = 0; j < subsetWordLength; j++) {
                        var letter = subsetWord.word[j];
                        subsetWordsPaper.image("/resources/images/letterSquares/letterSquare" + letter + ".png", xCoord, yCoord, g_LETTER_WIDTH, g_LETTER_HEIGHT);
                        xCoord += (g_LETTER_WIDTH + 1);
                    }
                }
                else {
                    var wordImage = subsetWordsPaper.image("/resources/images/letterSquares/" + subsetWordLength + "LetterBlankWord.png", xCoord, yCoord, subsetWordLength * (g_LETTER_WIDTH + 1), g_LETTER_HEIGHT);
                    subsetWord.image = wordImage;
                    xCoord += (g_LETTER_WIDTH + 1) * subsetWordLength;
                }

                // If the current subset word has already been found, mark it as found and see if we have already successfully completed this round
                if (found) {
                    // Mark the subset word as found
                    subsetWord.isFound = true;

                    // If the found word used all the available letters, set the round as successfully completed
                    if (subsetWordLength == this.numLetters) {
                        this.successfullyCompleted = true;

                        // Update the end round button's source
                        $("#endRoundButton").removeClass("endGameButton").addClass("nextRoundButton");
                    }
                }

                paperSize = xCoord + 50;

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

            // Hide the subset words mask if the subset words do not run over the paper
            if ((window.innerWidth + 25 - paperSize) > 900) {
                $("#subsetWordsMask").hide();
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
                var letterImage = this.game.papers["availableLetters"].image("/resources/images/letterOranges/letterOrange" + this.word[i] + ".png", 0, yCoord, g_AVAILABLE_LETTER_WIDTH, g_AVAILABLE_LETTER_HEIGHT);

                // Initially the letter image since it will fade in and slide over
                $(letterImage.node).css("opacity", 0);

                // Create the current RoundLetter object and add it to this Round's letters
                var roundLetter = new RoundLetter(this.word[i], i, letterImage, this, yCoord);
                this.letters.push(roundLetter);
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
            if (this.isDone) {
                $("#round").text(this.game.numRoundsCompleted);
            }
            else {
                $("#round").text(this.game.numRoundsCompleted + 1);
            }

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
                simulateClickAnimationHTML($("#pauseGameButton"));
            }

            // Hide the game board and then fade in the pause menu
            $("#gameBoard").fadeOut(100, function () {
                $("#pauseMenu").fadeIn();
            });

            // Dispose of all event listeners
            this.disposeGameBoardEventListeners();

            // Stop the current round's timer
            this.stopTimer();

            // Mark the round as paused
            this.isPaused = true;

            // Pause the game board music
            if (RC.Music.musicOn) {
                RC.Music.gameBoardMusic.pause();
            }
        };

        /* Hides the pause menu and resumes the current game */
        Round.prototype.resume = function (menuIdToFadeOut) {
            // Fade out the pause menu and show the game board
            $("#" + menuIdToFadeOut).fadeOut(function () {
                if (menuIdToFadeOut == "pauseMenu") {
                    $("#gameBoard").fadeIn(100);
                }
                else if (menuIdToFadeOut == "endRoundMenu") {
                    $("#availableLettersPaper, .gameBoardButton, #guessedLettersPlank").not("#pauseGameButton").fadeIn(100);
                }
            });

            // Reinitialize all event listeners
            this.initializeGameBoardEventListeners();

            // Restart the round timer
            this.startTimer();

            // Mark the game as unpaused
            this.isPaused = false;

            // Resume the game board music
            if (RC.Music.musicOn) {
                RC.Music.gameBoardMusic.play();
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

                // End the round early
                this.endRound();
            }

            // Keep track of the earned achievements which should be unlocked
            var achievementsToUnlock = [];

            // Game score achievements
            var achievementUnlocked = false;
            var achievementsDictionary = RC.Achievements.dictionary[this.numLetters.toString()];
            if (this.game.score >= 5000) {
                achievementsToUnlock.push({
                    achievement: achievementsDictionary[0],
                    expectedName: "High Scorer"
                });

                if (this.game.score >= 10000) {
                    achievementsToUnlock.push({
                        achievement: achievementsDictionary[1],
                        expectedName: "Allstar"
                    });

                    if (this.game.score >= 50000) {
                        achievementsToUnlock.push({
                            achievement: achievementsDictionary[2],
                            expectedName: "Champion"
                        });

                        if (this.game.score >= 100000) {
                            achievementsToUnlock.push({
                                achievement: achievementsDictionary[3],
                                expectedName: "El Presidente"
                            });

                            if (this.game.score >= 250000) {
                                achievementsToUnlock.push({
                                    achievement: achievementsDictionary[4],
                                    expectedName: "World Class"
                                });
                            }
                        }
                    }
                }
            }

            // Unlock all of the earned achievements
            RC.Achievements.unlock(achievementsToUnlock);

            // Increase the total score by 1 point every 1 ms up to the total score increase
            var totalScore = this.game.score;
            var scoreIncrease = totalScore - parseInt($("#score").text());
            var increaseInterval = (scoreIncrease > 1000) ? 10: ((scoreIncrease > 500) ? 5 : 1);
            var scoreIncreaseInterval = window.setInterval(function () {
                // Cancel the interval timer if the current game is no longer being played
                if (!RC.currentGame) {
                    window.clearInterval(scoreIncreaseInterval);
                }

                // Update the score
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
                // Only do the score increase animation if the current game is no longer being played
                if (RC.currentGame) {
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
                }
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
                        if (RC.Music.soundEffectsOn) {
                            var sound = new Audio("/resources/sounds/soundEffects/roundOver.mp3");
                            sound.volume = 0.2;
                            sound.play();
                        }
                    }
                    else {
                        // Play the running out of time sound
                        if (RC.Music.soundEffectsOn) {
                            var sound = new Audio("/resources/sounds/soundEffects/timeRunningOut.mp3");
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
        Round.prototype.endRound = function (resumingFromTermination) {
            // Stop the timer
            this.stopTimer();

            // Remove event listeners
            this.disposeGameBoardEventListeners();

            // Hide the available letters, game board buttons, and guessed letters plank
            $("#availableLettersPaper, .gameBoardButton, #guessedLettersPlank, #endRoundMenu").not("#pauseGameButton").fadeOut(100);

            // Reset the end round button's source
            $("#endRoundButton").removeClass("nextRoundButton").addClass("endGameButton");

            // Mark the round as over and paused
            this.isDone = true;
            this.isPaused = true;

            // Show the missed words
            var subsetWordsPaper = this.game.papers["subsetWords"];
            var numSubsetWords = this.subsetWords.length;
            this.subsetWords.forEach(function (subsetWord) {
                if (!subsetWord.isFound) {
                    var subsetWordLength = subsetWord.word.length;
                    var xCoord = subsetWord.image.attr("x");
                    var yCoord = subsetWord.image.attr("y");
                    for (var j = 0; j < subsetWordLength; j++) {
                        subsetWordsPaper.image("/resources/images/letterSquares/missedLetterSquare" + subsetWord.word[j] + ".png", xCoord, yCoord, g_LETTER_WIDTH, g_LETTER_HEIGHT);
                        xCoord = xCoord + g_LETTER_WIDTH + 1;
                    }
                    subsetWord.image.remove();
                    subsetWord.image = null;
                }
            });

            if (this.game.gameType === "multiplayer") {
                // If this is a multiplayer game, simply end the current game
                // TODO: don't just end the round, since the user may want to see what words they missed
                // COUNTER-TODO: they could just see that on the multiplayer game summary page...
                this.game.end();
            }
            else {
                // Otherwise, in the single player game case, three cases are possible

                // Case 1: the user found all the words
                if (this.foundWords.length == this.subsetWords.length) {
                    // Don't do double work if we are resuming from termination
                    if (!resumingFromTermination) {
                        // Increment the number of rounds complete
                        this.game.numRoundsCompleted += 1;

                        // Increment the number of consecutive perfect rounds
                        this.game.numConsecutivePerfectRounds += 1;

                        // Check for any end of round achievements
                        this.checkForEndOfRoundAchievements();
                    }

                    // Set the message for the next round menu
                    $("#nextRoundMenu > p").text("Perfect!");

                    // Show the next round menu
                    $("#nextRoundMenu").fadeIn();
                }

                // Case 2: the user succesfully completed the round but did not find all the words
                else if (this.successfullyCompleted) {
                    // Don't do double work if we are resuming from termination
                    if (!resumingFromTermination) {
                        // Increment the number of rounds complete
                        this.game.numRoundsCompleted += 1;

                        // Reset the number of consecutive perfect rounds
                        this.game.numConsecutivePerfectRounds = 0;

                        // Check for any end of round achievements
                        this.checkForEndOfRoundAchievements();
                    }

                    // Set the message for the next round menu
                    $("#nextRoundMenu > p").text("You got it!");

                    // Show the next round menu
                    $("#nextRoundMenu").fadeIn();
                }

                // Case 3: the user did not successfully complete the round and the game is over
                else {
                    // Don't do double work if we are resuming from termination
                    if (!resumingFromTermination) {
                        // Reset the number of consecutive perfect rounds
                        this.game.numConsecutivePerfectRounds = 0;
                    }

                    // If we are resuming from termination or the app is in trial mode, don't save the high score
                    var fSaveHighScore = !(resumingFromTermination || RC.licenseInformation.isTrial);

                    // Save the score
                    var round = this;
                    this.game.end(fSaveHighScore, function () {
                        // If the app is in trial mode, don't display any high scores information
                        if (RC.licenseInformation.isTrial) {
                            $("#gameOverMenuNoHighScore").show();
                            $("#gameOverMenuHighScore").hide();
                            $("#gameOverMenu").fadeIn();
                        }
                        else {
                            // TODO: re-enable high scores
                            /*
                            // Determine the position where the new score was entered in the high scores list
                            var scoresList = RC.HighScores.dictionary[round.numLetters.toString()];
                            for (var i = 0; i < scoresList.length; i++) {
                                var highScore = scoresList[i];
                                if ((round.game.score == highScore.score) && (round.game.numRoundsCompleted == highScore.numRoundsCompleted) && (round.game.numWordsFound == highScore.numWordsFound)) {
                                    break;
                                }
                            }

                            // If this is a new high score, tell the user where they placed
                            if (i < 10) {
                                // Convert from 0-based to 1-based number
                                i += 1;

                                // Convert to an ordinal number
                                var place = (i).toString();
                                if (i == 1) {
                                    place += "st";
                                }
                                else if (i == 2) {
                                    place += "nd";
                                }
                                else if (i == 3) {
                                    place += "rd";
                                }
                                else if (i == 4 || i == 5 || i == 6 || i == 7 || i == 8 || i == 9 || i == 10) {
                                    place += "th";
                                }
                                $("#highScorePlace").text(place);

                                // Show the game over high score menu
                                $("#gameOverMenuNoHighScore").hide();
                                $("#gameOverMenuHighScore").show();
                                $("#gameOverMenu").fadeIn();
                            }

                                // Otherwise, just show the no high score game over menu
                            else {*/
                                $("#gameOverMenuNoHighScore").show();
                                $("#gameOverMenuHighScore").hide();
                                $("#gameOverMenu").fadeIn();
                            //}
                        }
                    });
                }
            }
        };

        /* Checks for any newly completed achievements */
        Round.prototype.checkForEndOfRoundAchievements = function () {
            // Keep track of the earned achievements which should be unlocked
            // TODO: turn off some achievements in single player mode and some in multiplayer mode
            var achievementsToUnlock = [];

            // Get the correct achievements dictionary
            var achievementsDictionary = RC.Achievements.dictionary[this.numLetters.toString()];

            // Number of rounds completed achievements
            var numRoundsCompleted = this.game.numRoundsCompleted;
            if (numRoundsCompleted >= 5) {
                achievementsToUnlock.push({
                    achievement: achievementsDictionary[5],
                    expectedName: "Just A Spark"
                });

                if (numRoundsCompleted >= 10) {
                    achievementsToUnlock.push({
                        achievement: achievementsDictionary[6],
                        expectedName: "Heating Up"
                    });

                    if (numRoundsCompleted >= 15) {
                        achievementsToUnlock.push({
                            achievement: achievementsDictionary[7],
                            expectedName: "On Fire"
                        });

                        if (numRoundsCompleted >= 25) {
                            achievementsToUnlock.push({
                                achievement: achievementsDictionary[8],
                                expectedName: "Inferno"
                            });

                            if (numRoundsCompleted >= 50) {
                                achievementsToUnlock.push({
                                    achievement: achievementsDictionary[9],
                                    expectedName: "Supernova"
                                });
                            }
                        }
                    }
                }
            }

            // Round completion speed achievements
            if (this.foundWords.length == this.subsetWords.length) {
                var secondsToFinishRound = 120 - this.secondsRemaining;
                if (secondsToFinishRound <= 100) {
                    achievementsToUnlock.push({
                        achievement: achievementsDictionary[10],
                        expectedName: "Lazy Stroll"
                    });

                    if (secondsToFinishRound <= 80) {
                        achievementsToUnlock.push({
                            achievement: achievementsDictionary[11],
                            expectedName: "Pep In Your Step"
                        });

                        if (secondsToFinishRound <= 60) {
                            achievementsToUnlock.push({
                                achievement: achievementsDictionary[12],
                                expectedName: "Major Hustle"
                            });

                            if (secondsToFinishRound <= 45) {
                                achievementsToUnlock.push({
                                    achievement: achievementsDictionary[13],
                                    expectedName: "Speed Demon"
                                });

                                if (secondsToFinishRound <= 30) {
                                    achievementsToUnlock.push({
                                        achievement: achievementsDictionary[14],
                                        expectedName: "Seriously Slow Down"
                                    });
                                }
                            }
                        }
                    }
                }
            }

            // Get the miscellaneous achievements dictionary
            achievementsDictionary = RC.Achievements.dictionary["Miscellaneous"];

            // Check for several miscellaneous achievements
            if (this.foundWords.length == this.subsetWords.length) {
                if (this.numLetters == 5) {
                    achievementsToUnlock.push({
                        achievement: achievementsDictionary[0],
                        expectedName: "High Five"
                    });
                }
                else if (this.numLetters == 6) {
                    achievementsToUnlock.push({
                        achievement: achievementsDictionary[1],
                        expectedName: "Double Sixes"
                    });
                }
                else if (this.numLetters == 7) {
                    achievementsToUnlock.push({
                        achievement: achievementsDictionary[2],
                        expectedName: "Lucky Seven"
                    });
                }

                if (this.game.numConsecutivePerfectRounds == 2) {
                    achievementsToUnlock.push({
                        achievement: achievementsDictionary[3],
                        expectedName: "Double Perfecto"
                    });
                }
                else if (this.game.numConsecutivePerfectRounds == 3) {
                    achievementsToUnlock.push({
                        achievement: achievementsDictionary[4],
                        expectedName: "Triple Perfecto"
                    });
                }
            }

            // Going Solo achievement
            if (this.foundWords.length == 1) {
                achievementsToUnlock.push({
                    achievement: achievementsDictionary[5],
                    expectedName: "Going Solo"
                });
            }

            // Unlock all of the earned achievements
            RC.Achievements.unlock(achievementsToUnlock);
        };

        /* Moves all of the guess letters into the unguessed state */
        Round.prototype.clearGuess = function () {
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

                // Keep track of the earned achievements which should be unlocked
                var achievementsToUnlock = [];

                // If the guessed word is in this Round's word subset and has not already been found, set is as found and update the score
                var numSubsetWords = this.subsetWords.length;
                for (var i = 0; i < numSubsetWords; i++) {
                    var subsetWord = this.subsetWords[i];
                    if ((subsetWord.isFound == false) && (subsetWord.word == guess)) {
                        // Mark the word as found
                        subsetWord.isFound = true;

                        // Add the word to the found words list
                        this.foundWords.push(subsetWord.word);
                        
                        // Draw the image for each of the subset word's letters
                        var xCoord = subsetWord.image.attr("x");
                        var yCoord = subsetWord.image.attr("y");
                        var subsetWordsPaper = this.game.papers["subsetWords"];
                        var subsetWordLength = subsetWord.word.length;
                        for (var j = 0; j < subsetWordLength; j++) {
                            subsetWordsPaper.image("/resources/images/letterSquares/letterSquare" + subsetWord.word[j] + ".png", xCoord, yCoord, g_LETTER_WIDTH, g_LETTER_HEIGHT);
                            xCoord = xCoord + g_LETTER_WIDTH + 1;
                        }
                        subsetWord.image.remove();
                        subsetWord.image = null;
                        
                        // Update the score
                        this.updateScore(guess);

                        // Increment the number of words found in the current round and game
                        this.game.numWordsFound += 1;

                        // Check for the Bushel of Words achievment
                        if (this.foundWords.length == 30) {
                            achievementsToUnlock.push({
                                achievement: RC.Achievements.dictionary["Miscellaneous"][7],
                                expectedName: "Bushel of Words"
                            });
                        }

                        // If the found word used all the available letters, set the round as successfully completed
                        if (!this.successfullyCompleted && subsetWordLength == this.numLetters) {
                            this.successfullyCompleted = true;

                            // Update the end round button image
                            $("#endRoundButton").removeClass("endGameButton").addClass("nextRoundButton");

                            // Check for the Buzzer Beater achievement
                            if (this.secondsRemaining <= 3) {
                                achievementsToUnlock.push({
                                    achievement: RC.Achievements.dictionary["Miscellaneous"][6],
                                    expectedName: "Buzzer Beater"
                                });
                            }
                        }

                        // Play the correct sound
                        if (RC.Music.soundEffectsOn) {
                            var sound = new Audio("/resources/sounds/soundEffects/correctGuess.mp3");
                            sound.volume = 0.1;
                            sound.play();
                        }

                        // Check for the So Meta achievement
                        if (($.inArray("RUSTIC", this.foundWords) > -1) && ($.inArray("CITRUS", this.foundWords) > -1)) {
                            achievementsToUnlock.push({
                                achievement: RC.Achievements.dictionary["Miscellaneous"][8],
                                expectedName: "So Meta"
                            });
                        }

                        break;
                    }

                    // If we have been through every subset word and none are correct, play the incorrect sound
                    if (i == numSubsetWords - 1) {
                        if (RC.Music.soundEffectsOn) {
                            var sound = new Audio("/resources/sounds/soundEffects/incorrectGuess.mp3");
                            sound.volume = 0.8;
                            sound.play();
                        }
                    }
                }

                // Move the guessed letters to the unguessed state
                this.clearGuess();

                // Unlock all of the earned achievements
                RC.Achievements.unlock(achievementsToUnlock);
            }
        };

        /* Moves the letters in the previousGuess array into the guessed state */
        Round.prototype.setPreviousGuess = function (simulateClickAnimation) {
            // Play the guess sound effect
            if (RC.Music.soundEffectsOn) {
                var sound = new Audio("/resources/sounds/soundEffects/guess.mp3");
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
        Round.prototype.isShuffled = function () {
            // Get the letters' current ordering
            var sameAsPreviousOrdering = true;
            var currentOrderingWord = "";
            var currentOrdering = [];
            for (var i = 0; i < this.numLetters; i++) {
                var letter = this.letters[i];
                var letterIndex = letter.currentIndex;
                if (letterIndex != i) {
                    sameAsPreviousOrdering = false;
                }
                currentOrdering.push(letterIndex);
                currentOrderingWord += letter.letter;
            }

            // If the ordering has not changed, return false
            if (sameAsPreviousOrdering) {
                return false;
            }

            // If the current ordering of letters forms a word in the subset words, return false
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
            
            // If we've made it this far, the letters are properly shuffled
            return true;
        };

        /* Shuffles the ordering of this Round's letters */
        Round.prototype.shuffleLetters = function (simulateClickAnimation, initialShuffle) {
            // Play the shuffle sound
            if (RC.Music.soundEffectsOn && !initialShuffle) {
                var sound = new Audio("/resources/sounds/soundEffects/shuffle.mp3");
                sound.volume = 0.2;
                sound.play();
            }

            // Animate the shuffle button
            if (simulateClickAnimation) {
                simulateClickAnimationHTML($("#shuffleButton"));
            }

            // Randomly shuffle the current round's letters until the ordering has changed
            do {
                this.letters.sort(function () {
                    return 0.5 - Math.random();
                });
            } while (!this.isShuffled());

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
    WinJS.Namespace.defineWithParent(RC, "Classes", {
        SubsetWord: SubsetWord,
        RoundLetter: RoundLetter,
        Round: Round
    });
})();