class RockPaperScissorsGame {
    constructor() {
        this.p1Score = 0;
        this.p2Score = 0;
        this.currentPlayer = 1;
        this.p1Choice = null;
        this.p2Choice = null;
        this.gameStartTime = null;
        this.timerInterval = null;
        this.gameActive = true;
        this.gameMode = 'classic';
        this.roundNumber = 1;
        this.totalRounds = 0;
        this.p1Wins = 0;
        this.p2Wins = 0;
        this.p1Streak = 0;
        this.p2Streak = 0;
        this.maxStreak = 0;
        this.soundEnabled = true;
        this.achievements = {
            firstWin: false,
            hatTrick: false,
            speedDemon: false,
            comebackKing: false
        };
        this.powerUps = {
            shield: { p1: 1, p2: 1 },
            double: { p1: 1, p2: 1 },
            peek: { p1: 1, p2: 1 }
        };
        this.activePowerUps = { p1: null, p2: null };
        
        this.choiceEmojis = {
            'r': '🪨',
            'p': '📄',
            's': '✂️'
        };
        
        this.choiceNames = {
            'r': 'Rock',
            'p': 'Paper',
            's': 'Scissors'
        };
        
        this.initializeGame();
        this.bindEvents();
        this.createParticles();
    }
    
    initializeGame() {
        this.gameStartTime = Date.now();
        this.startTimer();
        this.updateDisplay();
        this.showPlayerSection(1);
        this.updateRoundCounter();
    }
    
    bindEvents() {
        // Choice buttons
        document.querySelectorAll('.choice-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleChoice(e));
        });
        
        // Reset button
        document.getElementById('reset-game').addEventListener('click', () => {
            this.resetGame();
        });
        
        // Play again button
        document.getElementById('play-again').addEventListener('click', () => {
            this.resetGame();
            this.hideChampionModal();
        });
        
        // Game mode buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.changeGameMode(e));
        });
        
        // Sound toggle
        document.getElementById('sound-toggle').addEventListener('click', () => {
            this.toggleSound();
        });
        
        // Power-up buttons
        document.querySelectorAll('.power-up-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.usePowerUp(e));
        });
    }
    
    handleChoice(e) {
        if (!this.gameActive) return;
        
        const choice = e.currentTarget.dataset.choice;
        const player = parseInt(e.currentTarget.dataset.player);
        
        // Check for peek power-up
        if (this.activePowerUps[`p${player}`] === 'peek') {
            this.revealOpponentChoice(player);
        }
        
        // Add selection visual feedback
        document.querySelectorAll(`[data-player="${player}"] .choice-btn`).forEach(btn => {
            btn.classList.remove('selected');
        });
        e.currentTarget.classList.add('selected');
        
        if (player === 1) {
            this.p1Choice = choice;
            this.updatePlayerChoice(1, choice);
            this.showWaitingMessage(1);
            
            if (this.gameMode === 'speed') {
                this.startSpeedMode(2);
            } else {
                this.showPlayerSection(2);
            }
        } else {
            this.p2Choice = choice;
            this.updatePlayerChoice(2, choice);
            this.showWaitingMessage(2);
            
            if (this.gameMode === 'speed') {
                this.stopSpeedMode();
            }
            
            this.processRound();
        }
    }
    
    updatePlayerChoice(player, choice) {
        const choiceElement = document.getElementById(`p${player}-choice`);
        choiceElement.textContent = this.choiceEmojis[choice];
        choiceElement.classList.add('choice-reveal');
        
        setTimeout(() => {
            choiceElement.classList.remove('choice-reveal');
        }, 500);
    }
    
    changeGameMode(e) {
        if (!this.gameActive) return;
        
        document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        
        this.gameMode = e.target.dataset.mode;
        this.resetGame();
    }
    
    startSpeedMode(player) {
        this.showPlayerSection(player);
        const pressureElement = document.getElementById(`p${player}-time-pressure`);
        pressureElement.style.display = 'block';
        
        // Auto-select random choice after 10 seconds
        this.speedTimeout = setTimeout(() => {
            const choices = ['r', 'p', 's'];
            const randomChoice = choices[Math.floor(Math.random() * choices.length)];
            
            if (player === 2 && !this.p2Choice) {
                this.p2Choice = randomChoice;
                this.updatePlayerChoice(2, randomChoice);
                this.processRound();
            }
        }, 10000);
    }
    
    stopSpeedMode() {
        if (this.speedTimeout) {
            clearTimeout(this.speedTimeout);
        }
        document.querySelectorAll('.time-pressure').forEach(el => {
            el.style.display = 'none';
        });
    }
    
    showPlayerSection(player) {
        document.getElementById('player1-section').style.display = player === 1 ? 'block' : 'none';
        document.getElementById('player2-section').style.display = player === 2 ? 'block' : 'none';
    }
    
    showWaitingMessage(player) {
        const section = document.getElementById(`player${player}-section`);
        const buttons = section.querySelector('.choice-buttons');
        const message = section.querySelector('.waiting-message');
        
        buttons.style.display = 'none';
        message.style.display = 'block';
    }
    
    processRound() {
        this.totalRounds++;
        
        // Show countdown for dramatic effect
        if (this.gameMode !== 'speed') {
            this.showCountdown();
        }
        
        setTimeout(() => {
            this.determineWinner();
            this.updateScoreboard();
            this.updateStats();
            this.checkGameEnd();
            
            if (this.gameActive) {
                setTimeout(() => {
                    this.prepareNextRound();
                }, 2000);
            }
        }, this.gameMode === 'speed' ? 500 : 1000);
    }
    
    determineWinner() {
        const resultElement = document.getElementById('round-result');
        
        if (this.p1Choice === this.p2Choice) {
            resultElement.textContent = "🤝 It's a tie!";
            resultElement.className = 'round-result tie';
            this.playSound('tie');
        } else if (
            (this.p1Choice === 'r' && this.p2Choice === 's') ||
            (this.p1Choice === 'p' && this.p2Choice === 'r') ||
            (this.p1Choice === 's' && this.p2Choice === 'p')
        ) {
            resultElement.textContent = "✅ Player 1 wins this round!";
            resultElement.className = 'round-result win';
            
            let points = 1;
            if (this.activePowerUps.p1 === 'double') {
                points = 2;
                this.activePowerUps.p1 = null;
            }
            
            this.p1Score += points;
            this.p1Wins++;
            this.p1Streak++;
            this.p2Streak = 0;
            this.animateScoreUpdate(1);
            this.playSound('win');
            this.checkAchievements(1);
        } else {
            // Check for shield power-up
            if (this.activePowerUps.p1 === 'shield') {
                resultElement.textContent = "🛡️ Player 1 blocked with Shield!";
                resultElement.className = 'round-result';
                this.activePowerUps.p1 = null;
                this.playSound('tie');
                return;
            }
            
            resultElement.textContent = "✅ Player 2 wins this round!";
            resultElement.className = 'round-result win';
            
            let points = 1;
            if (this.activePowerUps.p2 === 'double') {
                points = 2;
                this.activePowerUps.p2 = null;
            }
            
            this.p2Score += points;
            this.p2Wins++;
            this.p2Streak++;
            this.p1Streak = 0;
            this.animateScoreUpdate(2);
            this.playSound('win');
            this.checkAchievements(2);
        }
        
        this.updateStreakDisplay();
    }
    
    animateScoreUpdate(player) {
        const scoreElement = document.getElementById(`p${player}-score`);
        scoreElement.classList.add('score-update');
        
        setTimeout(() => {
            scoreElement.classList.remove('score-update');
        }, 600);
        
        // Add winner highlight to player section
        const playerSection = document.querySelector(`.player${player}`);
        playerSection.classList.add('winner');
        
        setTimeout(() => {
            playerSection.classList.remove('winner');
        }, 2000);
    }
    
    updateScoreboard() {
        document.getElementById('p1-score').textContent = this.p1Score;
        document.getElementById('p2-score').textContent = this.p2Score;
    }
    
    checkGameEnd() {
        const winCondition = this.gameMode === 'best-of-5' ? 3 : 3;
        
        if (this.p1Score >= winCondition || this.p2Score >= winCondition) {
            this.gameActive = false;
            this.stopTimer();
            this.stopSpeedMode();
            
            // Check for comeback achievement
            this.checkComebackAchievement();
            
            setTimeout(() => {
                this.showChampionModal();
            }, 2000);
        }
    }
    
    prepareNextRound() {
        this.roundNumber++;
        this.updateRoundCounter();
        
        // Reset choices
        this.p1Choice = null;
        this.p2Choice = null;
        
        // Reset UI
        document.getElementById('p1-choice').textContent = '?';
        document.getElementById('p2-choice').textContent = '?';
        document.getElementById('round-result').textContent = '';
        
        // Reset button selections
        document.querySelectorAll('.choice-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // Reset waiting messages
        document.querySelectorAll('.waiting-message').forEach(msg => {
            msg.style.display = 'none';
        });
        document.querySelectorAll('.choice-buttons').forEach(buttons => {
            buttons.style.display = 'flex';
        });
        
        // Show player 1 section
        this.showPlayerSection(1);
        
        // Reset speed mode elements
        this.stopSpeedMode();
    }
    
    showChampionModal() {
        const modal = document.getElementById('champion-modal');
        const championText = document.getElementById('champion-text');
        const finalScore = document.getElementById('final-score');
        const gameDuration = document.getElementById('game-duration');
        const totalRounds = document.getElementById('total-rounds');
        const winRate = document.getElementById('win-rate');
        
        const winner = this.p1Score === 3 ? 1 : 2;
        championText.textContent = `🎉 Player ${winner} is the Champion! 🏆`;
        finalScore.textContent = `${this.p1Score} - ${this.p2Score}`;
        
        const duration = Math.floor((Date.now() - this.gameStartTime) / 1000);
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        gameDuration.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        totalRounds.textContent = this.totalRounds;
        
        const winnerWins = winner === 1 ? this.p1Wins : this.p2Wins;
        const rate = Math.round((winnerWins / this.totalRounds) * 100);
        winRate.textContent = `${rate}%`;
        
        modal.style.display = 'flex';
    }
    
    hideChampionModal() {
        document.getElementById('champion-modal').style.display = 'none';
    }
    
    startTimer() {
        this.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.gameStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            document.querySelector('.timer-text').textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    resetGame() {
        // Stop current timer
        this.stopTimer();
        
        // Reset game state
        this.p1Score = 0;
        this.p2Score = 0;
        this.roundNumber = 1;
        this.currentPlayer = 1;
        this.p1Choice = null;
        this.p2Choice = null;
        this.gameActive = true;
        
        // Reset UI
        this.updateScoreboard();
        document.getElementById('p1-choice').textContent = '?';
        document.getElementById('p2-choice').textContent = '?';
        document.getElementById('round-result').textContent = '';
        
        // Reset button selections
        document.querySelectorAll('.choice-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // Reset waiting messages
        document.querySelectorAll('.waiting-message').forEach(msg => {
            msg.style.display = 'none';
        });
        document.querySelectorAll('.choice-buttons').forEach(buttons => {
            buttons.style.display = 'flex';
        });
        
        // Reset player sections
        document.querySelectorAll('.player-score').forEach(section => {
            section.classList.remove('winner');
        });
        
        // Restart game
        this.initializeGame();
        
        // Reset stats but keep achievements
        this.totalRounds = 0;
        this.p1Wins = 0;
        this.p2Wins = 0;
        this.p1Streak = 0;
        this.p2Streak = 0;
        this.updateStats();
        this.updateStreakDisplay();
        this.resetPowerUps();
    }
    
    updateDisplay() {
        this.updateScoreboard();
    }
    
    updateRoundCounter() {
        document.getElementById('current-round').textContent = this.roundNumber;
    }
    
    updateStats() {
        document.getElementById('p1-wins').textContent = this.p1Wins;
        document.getElementById('p2-wins').textContent = this.p2Wins;
        document.getElementById('p1-streak').textContent = this.p1Streak;
        document.getElementById('p2-streak').textContent = this.p2Streak;
    }
    
    updateStreakDisplay() {
        const streakIndicator = document.getElementById('streak-indicator');
        const streakCount = document.getElementById('streak-count');
        const maxStreak = Math.max(this.p1Streak, this.p2Streak);
        
        if (maxStreak >= 2) {
            streakIndicator.style.display = 'block';
            streakCount.textContent = maxStreak;
        } else {
            streakIndicator.style.display = 'none';
        }
    }
    
    showCountdown() {
        const countdown = document.getElementById('countdown');
        const countdownNumber = document.getElementById('countdown-number');
        
        countdown.style.display = 'block';
        
        let count = 3;
        const countdownInterval = setInterval(() => {
            countdownNumber.textContent = count;
            count--;
            
            if (count < 0) {
                clearInterval(countdownInterval);
                countdown.style.display = 'none';
            }
        }, 1000);
    }
    
    playSound(type) {
        if (!this.soundEnabled) return;
        
        const sound = document.getElementById(`${type}-sound`);
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(() => {}); // Ignore autoplay restrictions
        }
    }
    
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const btn = document.getElementById('sound-toggle');
        btn.textContent = this.soundEnabled ? '🔊 Sound' : '🔇 Muted';
        btn.classList.toggle('muted', !this.soundEnabled);
    }
    
    checkAchievements(winner) {
        // First Win
        if (!this.achievements.firstWin && (this.p1Wins === 1 || this.p2Wins === 1)) {
            this.unlockAchievement('first-win', 'First Victory');
            this.achievements.firstWin = true;
        }
        
        // Hat Trick (3 wins in a row)
        if (!this.achievements.hatTrick) {
            const streak = winner === 1 ? this.p1Streak : this.p2Streak;
            if (streak >= 3) {
                this.unlockAchievement('hat-trick', 'Hat Trick');
                this.achievements.hatTrick = true;
            }
        }
        
        // Speed Demon (win in speed mode under 30 seconds)
        if (!this.achievements.speedDemon && this.gameMode === 'speed') {
            const duration = (Date.now() - this.gameStartTime) / 1000;
            if (duration < 30 && (this.p1Score >= 3 || this.p2Score >= 3)) {
                this.unlockAchievement('speed-demon', 'Speed Demon');
                this.achievements.speedDemon = true;
            }
        }
    }
    
    checkComebackAchievement() {
        // Comeback King (win after being 0-2 down)
        if (!this.achievements.comebackKing) {
            if ((this.p1Score >= 3 && this.p2Score >= 2) || (this.p2Score >= 3 && this.p1Score >= 2)) {
                this.unlockAchievement('comeback-king', 'Comeback King');
                this.achievements.comebackKing = true;
            }
        }
    }
    
    unlockAchievement(id, name) {
        const achievement = document.getElementById(id);
        achievement.classList.remove('locked');
        achievement.classList.add('unlocked');
        
        // Show notification
        setTimeout(() => {
            alert(`🏆 Achievement Unlocked: ${name}!`);
        }, 1000);
    }
    
    usePowerUp(e) {
        const powerType = e.target.dataset.power;
        const currentPlayer = this.currentPlayer;
        
        if (this.powerUps[powerType][`p${currentPlayer}`] > 0) {
            this.powerUps[powerType][`p${currentPlayer}`]--;
            this.activePowerUps[`p${currentPlayer}`] = powerType;
            e.target.disabled = true;
            e.target.textContent = `${e.target.textContent} (Used)`;
        }
    }
    
    revealOpponentChoice(player) {
        const opponent = player === 1 ? 2 : 1;
        // In a real game, this would show the opponent's choice
        // For demo purposes, we'll show a hint
        setTimeout(() => {
            alert(`👁️ Peek activated! Opponent is thinking...`);
        }, 500);
    }
    
    resetPowerUps() {
        this.powerUps = {
            shield: { p1: 1, p2: 1 },
            double: { p1: 1, p2: 1 },
            peek: { p1: 1, p2: 1 }
        };
        this.activePowerUps = { p1: null, p2: null };
        
        document.querySelectorAll('.power-up-btn').forEach(btn => {
            btn.disabled = false;
            btn.textContent = btn.textContent.replace(' (Used)', '');
        });
    }
    
    createParticles() {
        const container = document.getElementById('particles');
        
        setInterval(() => {
            if (Math.random() < 0.1) { // 10% chance every interval
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.left = Math.random() * 100 + '%';
                particle.style.background = ['#667eea', '#764ba2', '#4ecdc4', '#ff6b6b'][Math.floor(Math.random() * 4)];
                
                container.appendChild(particle);
                
                setTimeout(() => {
                    particle.remove();
                }, 4000);
            }
        }, 2000);
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new RockPaperScissorsGame();
});