(function () {
    "use strict";

    /******************************/
    /*  MULTIPLAYER PAGE CONTROL  */
    /******************************/
    WinJS.UI.Pages.define("/pages/multiplayerGameSummary/multiplayerGameSummary.html", {
        /* Responds to navigations to this page */
        ready: function (element, options) {
            // Get the current multiplayer game
            var game = options.game;

            // Validate the inputs
            if (RC.debug) {
                RC.assert(options.gameType === "multiplayer", "gameType is not multiplayer");
                RC.assert(typeof (options.isLoggedInUsersTurn) === "boolean", "isLoggedInUsersTurn is not a boolean");
                RC.assert(typeof (game) === "object", "game is not an object");
                RC.assert(typeof (game.creator) === "object", "creator is not an object");
                RC.assert(typeof (game.creator.firstName) === "string", "creator's first name is not a string");
                RC.assert(typeof (game.creator.lastName) === "string", "creator's last name is not a string");
                RC.assert(typeof (game.creator.facebookId) === "number", "creator's Facebook ID is not a number");
                RC.assert(typeof (game.creator.gender) === "string", "creator's gender is not a string");
                RC.assert(typeof (game.creator.imageUrl) === "string", "creator's image URL is not a string");
                RC.assert(typeof (game.creator.timezone) === "number", "creator's time zone is not a number");
                RC.assert(typeof (game.opponent) === "object", "opponent is not an object");
                RC.assert(typeof (game.opponent.firstName) === "string", "opponent's first name is not a string");
                RC.assert(typeof (game.opponent.lastName) === "string", "opponent's last name is not a string");
                RC.assert(typeof (game.opponent.facebookId) === "number", "opponent's Facebook ID is not a number");
                RC.assert(typeof (game.opponent.gender) === "string", "opponent's gender is not a string");
                RC.assert(typeof (game.opponent.imageUrl) === "string", "opponent's image URL is not a string");
                RC.assert(typeof (game.opponent.timezone) === "number", "opponent's time zone is not a number");
            }

            // If it is the logged-in user's turn, show the play button; otherwise, hide it
            if (options.isLoggedInUsersTurn) {
                $("#multiplayerGamePlayButton").show();
            }
            else {
                $("#multiplayerGamePlayButton").hide();
            }

            var loggedInUsersRole = (game.creator.id === RC.loggedInUser.id) ? "creator" : "opponent";
            var firebaseLoggedInUserCurrentGamePath = RC.firebaseRoot.child("users/" + RC.loggedInUser.id + "/games/multiplayer/active/" + game.gameId + "/");

            game.isLoggedInUsersTurn = options.isLoggedInUsersTurn;

            doRest(game);


            // Update any new scores for the logged-in user
            // TODO: I got rid of whoseTurnId; how will I figure out when the data has changed? can I just do it at the game root?
            //firebaseLoggedInUserCurrentGamePath.child("whoseTurnId").on("value", function (outerDataSnapshot) {
            //firebaseLoggedInUserCurrentGamePath.on("value", function (outerDataSnapshot) {
            //    // TODO: Set a breakpoint here and see how many times it gets hit; it is twice, but why??
            //    firebaseLoggedInUserCurrentGamePath.child(loggedInUsersRole).once("value", function (innerDataSnapshot) {
            //        var loggedInUserData = innerDataSnapshot.val();
            //        if (loggedInUsersRole === "creator") {
            //            game.creator = loggedInUserData;
            //        }
            //        else {
            //            game.opponent = loggedInUserData;
            //        }

            //        // TODO: Rename this!!
            //        doRest(game);
            //    });
            //});
        },

        /* Responds to navigations away from this page */
        unload: function () {
        },

        /* Responds to changes in the view state */
        updateLayout: function (element) {
        }
    });

    // TODO: rename this
    function doRest(game) {
        // Populate the game summary section
        var currentRoundIndex = populateGameSummarySection(game);

        // Populate the round sections
        populateRoundSections(game, currentRoundIndex);

        // TODO: move somewhere else
        // TODO: add matching off call
        $("#multiplayerGamePlayButton").on("click", function () {
            WinJS.Navigation.navigate("/pages/gameBoard/gameBoard.html", {
                "gameType": "multiplayer",
                "game": {
                    "gameId": game.gameId,
                    "creatorId": game.creator.id,
                    "opponentId": game.opponent.id,
                    "loggedInUsersRole": ((game.creator.id === RC.loggedInUser.id) ? "creator" : "opponent"),
                    "currentRound": {
                        "numLetters": currentRoundIndex + RC.smallestNumLetters,
                        "word": game.roundWords[currentRoundIndex],
                        "roundIndex": currentRoundIndex
                    }
                }
            });
        });
    }

    /**********************/
    /*  HELPER FUNCTIONS  */
    /**********************/
    // TODO: don't repeat this in this file
    // Map each character to a unique prime number
    var g_CHAR_MAP = { 'A': 2, 'B': 3, 'C': 5, 'D': 7, 'E': 11, 'F': 13, 'G': 17, 'H': 19, 'I': 23, 'J': 29, 'K': 31, 'L': 37, 'M': 41, 'N': 43, 'O': 47, 'P': 53, 'Q': 59, 'R': 61, 'S': 67, 'T': 71, 'U': 73, 'V': 79, 'W': 83, 'X': 89, 'Y': 97, 'Z': 101 };

    /***********************************/
    /*  POPULATE GAME SUMMARY SECTION  */
    /***********************************/
    /* Takes a string of characters and returns a unique hash (because each character is mapped to a unique prime number) */
    function hashString(string) {
        return string.split('').reduce(function (hashValue, currentChar) {
            return hashValue * g_CHAR_MAP[currentChar];
        }, 1);
    };

    /* Populates the data for the game summary section */
    function populateGameSummarySection(game) {
        // Get the inputted game's creator and opponent
        var creator = game.creator;
        var opponent = game.opponent;

        // Populate the player information
        populateGameSummaryPlayerInfo(creator, opponent);

        // Populate the scores
        var currentRoundIndex = populateGameSummaryScores(creator, opponent, game.isLoggedInUsersTurn)

        // Return the current round index
        return currentRoundIndex;
    }

    /* Populates the information for the two players in the game summary section */
    function populateGameSummaryPlayerInfo(creator, opponent) {
        $("#creatorInfo .playerImage").attr("src", creator.imageUrl);
        $("#creatorInfo .playerName").text(creator.firstName + " " + creator.lastName[0] + ".");
        $(".creatorRoundSectionImage").attr("src", creator.imageUrl);
        $("#opponentInfo .playerImage").attr("src", opponent.imageUrl);
        $("#opponentInfo .playerName").text(opponent.firstName + " " + opponent.lastName[0] + ".");
        $(".opponentRoundSectionImage").attr("src", opponent.imageUrl);
    };

    /* Populates the round scores in the game summary section */
    function populateGameSummaryScores(creator, opponent, isLoggedInUsersTurn) {
        // Get the current round index
        var numCreatorScores = creator.scores ? creator.scores.length : 0;
        var numOpponentScores = opponent.scores ? opponent.scores.length : 0;
        var currentRoundIndex = Math.min(numCreatorScores, numOpponentScores);

        // Round scores
        for (var i = 0; i <= currentRoundIndex; ++i) {
            // Create variables to hold the current round scores' text
            var creatorText = "";
            var opponentText = "";

            // If this round is already completed, simply get each player's score
            if (i < currentRoundIndex) {
                creatorText = creator.scores[i];
                opponentText = opponent.scores[i];
            }

            // If this is the current round, do some more complex logic
            else if (i === currentRoundIndex) {
                if (isLoggedInUsersTurn) {
                    if (creator.id === RC.loggedInUser.id) {
                        creatorText = "Your Turn";
                        if (opponent.scores !== undefined && opponent.scores[i] !== undefined) {
                            opponentText = "Hidden";
                        }
                    }
                    else {
                        if (creator.scores !== undefined && creator.scores[i] !== undefined) {
                            creatorText = "Hidden";
                        }
                        opponentText = "Your Turn";
                    }
                }
                else {
                    if (creator.id === RC.loggedInUser.id) {
                        if (creator.scores !== undefined && creator.scores[i] !== undefined) {
                            creatorText = creator.scores[i];
                        }
                        opponentText = "Their Turn";
                    }
                    else {
                        creatorText = "Their Turn";
                        if (opponent.scores !== undefined && opponent.scores[i] !== undefined) {
                            opponentText = opponent.scores[i];
                        }
                    }
                }
            }

            // If the creator text is defined, populate the current round's score with it
            if (creatorText) {
                var roundScoreDiv = $("#creatorRound" + (i + 1) + "Score");
                roundScoreDiv.text(creatorText);

                // Make the text smaller if it is a non-integer
                if (!parseInt(creatorText)) {
                    roundScoreDiv.addClass("whoseTurnScore");
                }
            }

            // If the opponent text is defined, populate the current round's score with it
            if (opponentText) {
                var roundScoreDiv = $("#opponentRound" + (i + 1) + "Score");
                roundScoreDiv.text(opponentText);

                // Make the text smaller if it is a non-integer
                if (!parseInt(opponentText)) {
                    roundScoreDiv.addClass("whoseTurnScore");
                }
            }
        }

        // Populate the total scores
        var creatorTotalScore = 0;
        var opponentTotalScore = 0;
        for (var i = 0; i < currentRoundIndex; ++i) {
            creatorTotalScore += creator.scores[i];
            opponentTotalScore += opponent.scores[i];
        }
        $("#creatorTotalScore").text(creatorTotalScore);
        $("#opponentTotalScore").text(opponentTotalScore);

        // Return the current round index
        return currentRoundIndex;
    };


    /****************************************/
    /*  POPULATE INDIVIDUAL ROUND SECTIONS  */
    /****************************************/
    // TODO: don't repeat this in this file
    // Map each character to a unique prime number
    var g_CHAR_MAP = { 'A': 2, 'B': 3, 'C': 5, 'D': 7, 'E': 11, 'F': 13, 'G': 17, 'H': 19, 'I': 23, 'J': 29, 'K': 31, 'L': 37, 'M': 41, 'N': 43, 'O': 47, 'P': 53, 'Q': 59, 'R': 61, 'S': 67, 'T': 71, 'U': 73, 'V': 79, 'W': 83, 'X': 89, 'Y': 97, 'Z': 101 };

    /* Takes a string of characters and returns a unique hash (because each character is mapped to a unique prime number) */
    function hashString(string) {
        return string.split('').reduce(function (hashValue, currentChar) {
            return hashValue * g_CHAR_MAP[currentChar];
        }, 1);
    };

    function generateSubsetWords(word) {

        var wordListKeys = Object.keys(RC.wordList);
        var numKeys = wordListKeys.length;
        for (var z = 0; z < 50; ++z) {
            word = "";
            while (word.length != 7) {
                var key = wordListKeys[Math.floor(Math.random() * numKeys)];
                var wordListEntry = RC.wordList[key].split(",");
                var wordEntry = wordListEntry[Math.floor(Math.random() * wordListEntry.length)].split("|");
                word = key + wordEntry[0];
                var wordHash = parseInt(wordEntry[1]);
            }

            var wordd = word;
            //var wordHash = hashString(word);

            // Get the list of unique three-letter permutations of the inputted word's letters
            var numLetters = word.length;
            var permutations = [];
            for (var i = 0; i < numLetters; ++i) {
                for (var j = 0; j < numLetters; ++j) {
                    for (var k = 0; k < numLetters; ++k) {
                        if (i != j && j != k && i != k) {
                            var currentPermutation = word[i] + word[j] + word[k];
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
                        if (word.length <= numLetters) {
                            // If the current word's hash is cleanly divisible by the hash for the round's word, add it to the subset words array
                            if (wordHash % hash == 0) {
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

            //console.log("\"" + wordd + "\": \"" + subsetWords + "\",");
            console.log("{");
            console.log("\"word\": \"" + wordd + "\",");
            console.log("\"subsetWords\": \"" + subsetWords + "\"");
            console.log("},");
        }

        // Create the subset words
        return subsetWords;
    };

    /* Populates the round sections with the words each player found in those sections */
    function populateRoundSections(game, currentRoundIndex) {
        // Wait until the word list is populated
        while (RC.wordList === undefined) { }

        // For each completed round, display the words each player found
        for (var i = 0; i < currentRoundIndex; ++i) {
            // Get the current round's subset words
            var subsetWords = generateSubsetWords(game.roundWords[i]);
            var numSubsetWords = subsetWords.length;

            // Get the words each player found in the current round
            var creatorFoundWords = game.creator.foundWords[i].split(",");
            var opponentFoundWords = game.opponent.foundWords[i].split(",");

            // Populate the round section
            var roundWordsHtml = "";
            var creatorFoundWordsHtml = "";
            var opponentFoundWordsHtml = "";
            for (var j = 0; j < numSubsetWords; ++j) {
                var currentSubsetWord = subsetWords[j];
                var creatorFoundCurrentWord = ($.inArray(currentSubsetWord, creatorFoundWords) != -1);
                var opponentFoundCurrentWord = ($.inArray(currentSubsetWord, opponentFoundWords) != -1);
                
                roundWordsHtml += "<div>" + currentSubsetWord + "</div>";

                if (creatorFoundCurrentWord) {
                    creatorFoundWordsHtml += "<div>&#x2714;</div>";
                }
                else {
                    creatorFoundWordsHtml += "<div>&nbsp;</div>";
                }

                if (opponentFoundCurrentWord) {
                    opponentFoundWordsHtml += "<div>&#x2714;</div>";
                }
                else {
                    opponentFoundWordsHtml += "<div>&nbsp;</div>";
                }
            }

            var roundSection = $("#round" + (i + 1) + "Section");
            roundSection.find(".creatorFoundWords").append(creatorFoundWordsHtml);
            roundSection.find(".roundWords").append(roundWordsHtml);
            roundSection.find(".opponentFoundWords").append(opponentFoundWordsHtml);

            // Populate the number of found words
            roundSection.find(".creatorTotalWordsFound").text(creatorFoundWords.length);
            roundSection.find(".opponentTotalWordsFound").text(opponentFoundWords.length);

            // Populate the rond score
            roundSection.find(".creatorRoundScore").text(game.creator.scores[i]);
            roundSection.find(".opponentRoundScore").text(game.opponent.scores[i]);
        }
    };
})();