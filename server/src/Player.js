class Player {
  constructor(id, name, socketId) {
    this.id = id;
    this.name = name;
    this.socketId = socketId;
    this.score = 0;
    this.isReady = false;
    this.hasGuessedCorrectly = false;
    this.isHost = false;
    this.avatar = Math.floor(Math.random() * 20) + 1;
  }

  addScore(points) {
    this.score += points;
  }

  resetRound() {
    this.hasGuessedCorrectly = false;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      score: this.score,
      isReady: this.isReady,
      hasGuessedCorrectly: this.hasGuessedCorrectly,
      isHost: this.isHost,
      avatar: this.avatar
    };
  }
}

module.exports = Player;
