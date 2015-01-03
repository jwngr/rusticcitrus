#############
#  IMPORTS  #
#############
import json
import random
from faker import Factory

def getRandomSubsetOfSubsetWords(word):
    subsetWords = gamesJsonData[str(len(word))][word].split(",")
    numWordsToDelete = random.randint(0, len(subsetWords))
    for item in random.sample(subsetWords, numWordsToDelete):
        subsetWords.remove(item)
    return ",".join(subsetWords)

def getRandomRoundWord(numLetters):
    return random.choice([k for k in gamesJsonData[str(numLetters)] for x in gamesJsonData[str(numLetters)][k]])
    
def createActiveSinglePlayerGame(numLetters):
    # Generate random game data
    numRoundsCompleted = random.randint(0, 25)
    currentRoundWord = getRandomRoundWord(numLetters)
    pastRoundWords = []
    for j in range(0, numRoundsCompleted):
        pastRoundWords.append(getRandomRoundWord(numLetters))
        
    # Generate random creation and modification dates
    date1 = faker.iso8601()
    date2 = faker.iso8601()
    if (date1 > date2):
        dateCreated = date2
        dateModified = date1
    else:
        dateCreated = date1
        dateModified = date2
        
    # Return all the generated data for the single player game
    return {
        "score": numRoundsCompleted * 1230,
        "numLetters": numLetters,
        "numRoundsCompleted": numRoundsCompleted,
        "numWordsFound": numRoundsCompleted * 12,
        "pastRoundWords": pastRoundWords,
        "numConsecutivePerfectRounds": random.randint(0, 3),
        "dateCreated": dateCreated,
        "dateModified": dateModified,
        "currentRound": {
            "secondsRemaining": random.randint(1, 120),
            "word": currentRoundWord,
            "foundWords": getRandomSubsetOfSubsetWords(currentRoundWord)
        },
        "startNewRound": False
    }

def createCompletedSinglePlayerGame(numLetters):
    # Generate a random number of completed rounds
    numRoundsCompleted = random.randint(0, 25)
    
    # Generate random creation and modification dates
    date1 = faker.iso8601()
    date2 = faker.iso8601()
    if (date1 > date2):
        dateCreated = date2
        dateModified = date1
    else:
        dateCreated = date1
        dateModified = date2
    
    return {
        "numLetters": numLetters,
        "score": numRoundsCompleted * 1230,
        "numRoundsCompleted": numRoundsCompleted,
        "numWordsFound": numRoundsCompleted * 12,
        "dateCreated": dateCreated,
        "dateModified": dateModified
    }

def createActiveMultiplayerGame():
    # Get the round words
    roundWords = [
        getRandomRoundWord(5),
        getRandomRoundWord(6),
        getRandomRoundWord(7)
    ]
    
    # Get the IDs
    creatorId = random.randint(0, len(usersJsonData) - 1)
    opponentId = creatorId
    while (opponentId == creatorId):
        opponentId = random.randint(0, len(usersJsonData) - 1)
        
    # Get the found words
    randomRoundIndex = random.randint(1,3)
    creatorFoundWords = []
    for i in range(0, randomRoundIndex):
        if (i == randomRoundIndex - 1):
            if (random.choice([True, False])):
                creatorFoundWords.append(getRandomSubsetOfSubsetWords(roundWords[i]))
        else:
            creatorFoundWords.append(getRandomSubsetOfSubsetWords(roundWords[i]))
    
    opponentFoundWords = []
    for i in range(0, randomRoundIndex):
        if (i == randomRoundIndex - 1):
            if (random.choice([True, False]) and (i != 2 or len(creatorFoundWords) != 3)):
                opponentFoundWords.append(getRandomSubsetOfSubsetWords(roundWords[i]))
        else:
            opponentFoundWords.append(getRandomSubsetOfSubsetWords(roundWords[i]))
    
    # Get the scores
    creatorScores = []
    for i in range(0, len(creatorFoundWords)):
        creatorScores.append(len(creatorFoundWords[i]) * random.randint(5,8) * 10)
        
    opponentScores = []
    for i in range(0, len(opponentFoundWords)):
        opponentScores.append(len(opponentFoundWords[i]) * random.randint(5,8) * 10)
    
    return {
        "roundWords": roundWords,
        "creator": {
            "id": creatorId,
            "scores": creatorScores,
            "foundWords": creatorFoundWords
        },
        "opponent": {
            "id": opponentId,
            "scores": opponentScores,
            "foundWords": opponentFoundWords
        }
        
        # TODO: add date fields?
    }
  
def createCompletedMultiplayerGame():
    # Get the round words
    roundWords = [
        getRandomRoundWord(5),
        getRandomRoundWord(6),
        getRandomRoundWord(7)
    ]
    
    # Get the IDs
    creatorId = random.randint(0, len(usersJsonData) - 1)
    opponentId = creatorId
    while (opponentId == creatorId):
        opponentId = random.randint(0, len(usersJsonData) - 1)

    # Get the found words
    creatorFoundWords = []
    for i in range(0, 3):
        creatorFoundWords.append(getRandomSubsetOfSubsetWords(roundWords[i]))
    
    opponentFoundWords = []
    for i in range(0, 3):
        opponentFoundWords.append(getRandomSubsetOfSubsetWords(roundWords[i]))
    
    # Get the scores
    creatorScores = []
    for i in range(0, 3):
        creatorScores.append(len(creatorFoundWords[i]) * random.randint(5,8) * 10)
        
    opponentScores = []
    for i in range(0, 3):
        opponentScores.append(len(opponentFoundWords[i]) * random.randint(5,8) * 10)
        
    return {
        "roundWords": roundWords,
        "creator": {
            "id": creatorId,
            "scores": creatorScores,
            "foundWords": creatorFoundWords
        },
        "opponent": {
            "id": opponentId,
            "scores": opponentScores,
            "foundWords": opponentFoundWords
        }
        
        # TODO: add date fields?
    }


if (__name__ == "__main__"):
    # Load the input data
    usersJsonData = json.load(open("../sampleData/users.json"))
    achievementsJsonData = json.load(open("../sampleData/achievements.json"))
    gamesJsonData = json.load(open("../sampleData/rounds.json"))

    # Create an instance of the fake data factory
    faker = Factory.create()
    
    # Create a bunch of active multiplayer games
    activeMultiplayerGames = []
    for i in range(0, 50):
        activeMultiplayerGames.append(createActiveMultiplayerGame())
        
    # Create a bunch of completed multiplayer games
    completedMultiplayerGames = []
    for i in range(0, 50):
        completedMultiplayerGames.append(createCompletedMultiplayerGame())

    userData = []
    for userId, user in enumerate(usersJsonData):
        # Add achievements to the current user (except for my user which has hard-coded achievements
        if ("achievements" not in user):
            user["achievements"] = {}
            for achievementCategory in achievementsJsonData:
                user["achievements"][achievementCategory] = {}
                for achievement in achievementsJsonData[achievementCategory]:
                    if (random.choice([True, False])):
                        user["achievements"][achievementCategory][achievement] = faker.iso8601()
                    else:
                        user["achievements"][achievementCategory][achievement] = ""

        
        # Create three active single player games
        activeSinglePlayerGames = []
        for i in range(0, 3):
            if (random.choice([True, False])):
                activeSinglePlayerGames.append(createActiveSinglePlayerGame(i + 5))
            else:
                activeSinglePlayerGames.append({"numLetters": i + 5})
        
        # Create a random number of completed single player games
        completedSinglePlayerGames = []
        for i in range(0, random.randint(0, 20)):
            completedSinglePlayerGames.append(createCompletedSinglePlayerGame(i + 5))
            
        # Get the active multiplayer games of which the current user is a part
        activeMultiplayerGameIds = []
        for gameId, activeMultiplayerGame in enumerate(activeMultiplayerGames):
            if (userId in [activeMultiplayerGame["creator"]["id"], activeMultiplayerGame["opponent"]["id"]]):
                activeMultiplayerGameIds.append(gameId)

        # Get the completed multiplayer games of which the current user was a part
        completedMultiplayerGameIds = []
        for gameId, completedMultiplayerGame in enumerate(completedMultiplayerGames):
            if (userId in [completedMultiplayerGame["creator"]["id"], completedMultiplayerGame["opponent"]["id"]]):
                completedMultiplayerGameIds.append(gameId + len(activeMultiplayerGames))
        
        # Add the created games to the user
        user["games"] = {
            "singlePlayer": {
                "active": activeSinglePlayerGames,
                "completed": completedSinglePlayerGames
            },
            "multiplayer": {
                "active": activeMultiplayerGameIds,
                "completed": completedMultiplayerGameIds
            }
        }
             
        userData.append(user)

    # Create the output data
    outputData = {
        "users": userData,
        "achievements": achievementsJsonData,
        "multiplayerGames": activeMultiplayerGames + completedMultiplayerGames
    }
        
    # Write to the output file
    outputFile = open("../sampleData/firebaseData.json", "w")
    outputFile.write(json.dumps(outputData))