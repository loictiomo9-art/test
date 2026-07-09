class ChessGame {
    constructor() {
        this.engine = new ChessEngine();
        this.ai = new ChessAI(this.engine, 1500);
        this.selectedSquare = null;
        this.validMoves = [];
        this.boardFlipped = false;
        
        this.initializeUI();
        this.renderBoard();
        this.setupEventListeners();
    }
    
    initializeUI() {
        this.boardElement = document.getElementById('chessboard');
        this.moveListElement = document.getElementById('move-list');
        this.gameStatusElement = document.getElementById('game-status');
        this.playerCapturedElement = document.getElementById('player-captured');
        this.aiCapturedElement = document.getElementById('ai-captured');
        this.difficultyLevelElement = document.getElementById('difficulty-level');
    }
    
    renderBoard() {
        this.boardElement.innerHTML = '';
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const displayRow = this.boardFlipped ? 7 - row : row;
                const displayCol = this.boardFlipped ? 7 - col : col;
                
                const square = document.createElement('div');
                square.className = 'square';
                square.classList.add((displayRow + displayCol) % 2 === 0 ? 'light' : 'dark');
                square.dataset.row = displayRow;
                square.dataset.col = displayCol;
                
                // Pièce sur la case
                const piece = this.engine.board[displayRow][displayCol];
                if (piece) {
                    const pieceElement = document.createElement('span');
                    pieceElement.className = 'piece';
                    pieceElement.textContent = this.getPieceSymbol(piece);
                    square.appendChild(pieceElement);
                }
                
                // Case sélectionnée
                if (this.selectedSquare && 
                    this.selectedSquare.row === displayRow && 
                    this.selectedSquare.col === displayCol) {
                    square.classList.add('selected');
                }
                
                // Mouvements valides
                if (this.validMoves.some(move => move.row === displayRow && move.col === displayCol)) {
                    square.classList.add('valid-move');
                }
                
                // Dernier coup joué
                if (this.engine.lastMove) {
                    const { fromRow, fromCol, toRow, toCol } = this.engine.lastMove;
                    if ((fromRow === displayRow && fromCol === displayCol) ||
                        (toRow === displayRow && toCol === displayCol)) {
                        square.classList.add('last-move');
                    }
                }
                
                // Roi en échec
                if (this.engine.isInCheck(this.engine.currentPlayer)) {
                    const kingPos = this.engine.kingPositions[this.engine.currentPlayer];
                    if (kingPos.row === displayRow && kingPos.col === displayCol) {
                        square.classList.add('king-check');
                    }
                }
                
                square.addEventListener('click', () => this.onSquareClick(displayRow, displayCol));
                this.boardElement.appendChild(square);
            }
        }
        
        this.updateGameInfo();
        this.updateMoveHistory();
    }
    
    getPieceSymbol(piece) {
        const symbols = {
            'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
            'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
        };
        return symbols[piece] || '';
    }
    
    onSquareClick(row, col) {
        if (this.engine.gameOver) return;
        if (this.engine.currentPlayer === 'black') return; // Tour de l'IA
        
        const clickedPiece = this.engine.board[row][col];
        const clickedColor = this.engine.getPieceColor(clickedPiece);
        
        // Si on clique sur une case de mouvement valide
        if (this.selectedSquare && this.validMoves.some(move => move.row === row && move.col === col)) {
            this.makeMove(this.selectedSquare.row, this.selectedSquare.col, row, col);
            this.selectedSquare = null;
            this.validMoves = [];
        }
        // Si on clique sur sa propre pièce
        else if (clickedPiece && clickedColor === 'white') {
            this.selectedSquare = { row, col };
            this.validMoves = this.engine.getValidMoves(row, col);
        }
        // Sinon, désélectionner
        else {
            this.selectedSquare = null;
            this.validMoves = [];
        }
        
        this.renderBoard();
    }
    
    makeMove(fromRow, fromCol, toRow, toCol) {
        this.engine.makeMove(fromRow, fromCol, toRow, toCol);
        this.renderBoard();
        
        // Vérifier si la partie est terminée
        if (this.engine.gameOver) {
            this.showGameResult();
            return;
        }
        
        // L'IA joue après un court délai
        setTimeout(() => this.aiMove(), 300);
    }
    
    aiMove() {
        const bestMove = this.ai.getBestMove();
        if (bestMove) {
            this.engine.makeMove(bestMove.fromRow, bestMove.fromCol, bestMove.toRow, bestMove.toCol);
            this.renderBoard();
            
            if (this.engine.gameOver) {
                this.showGameResult();
            }
        }
    }
    
    showGameResult() {
        let message = '';
        if (this.engine.gameResult === 'white') {
            message = '🎉 Vous avez gagné !';
        } else if (this.engine.gameResult === 'black') {
            message = '🤖 L\'IA a gagné !';
        } else {
            message = '🤝 Match nul !';
        }
        this.gameStatusElement.textContent = message;
    }
    
    updateGameInfo() {
        if (!this.engine.gameOver) {
            if (this.engine.currentPlayer === 'white') {
                this.gameStatusElement.textContent = 'C\'est votre tour';
            } else {
                this.gameStatusElement.textContent = 'L\'IA réfléchit...';
            }
        }
        
        // Pièces capturées
        this.playerCapturedElement.textContent = this.engine.capturedPieces.white
            .map(p => this.getPieceSymbol(p)).join(' ');
        this.aiCapturedElement.textContent = this.engine.capturedPieces.black
            .map(p => this.getPieceSymbol(p)).join(' ');
    }
    
    updateMoveHistory() {
        this.moveListElement.innerHTML = '';
        
        this.engine.moveHistory.forEach((move, index) => {
            if (index % 2 === 0) {
                const moveNumber = document.createElement('div');
                moveNumber.className = 'move-number';
                moveNumber.textContent = `${Math.floor(index / 2) + 1}.`;
                this.moveListElement.appendChild(moveNumber);
            }
            
            const moveElement = document.createElement('div');
            moveElement.className = index % 2 === 0 ? 'move-white' : 'move-black';
            moveElement.textContent = move.notation;
            this.moveListElement.appendChild(moveElement);
        });
        
        // Scroll to bottom
        this.moveListElement.parentElement.scrollTop = this.moveListElement.parentElement.scrollHeight;
    }
    
    setupEventListeners() {
        document.getElementById('new-game-btn').addEventListener('click', () => {
            this.engine.reset();
            this.selectedSquare = null;
            this.validMoves = [];
            this.renderBoard();
        });
        
        document.getElementById('flip-btn').addEventListener('click', () => {
            this.boardFlipped = !this.boardFlipped;
            this.renderBoard();
        });
        
        document.getElementById('undo-btn').addEventListener('click', () => {
            // Annuler le dernier coup de l'IA et du joueur
            if (this.engine.moveHistory.length >= 2) {
                this.engine.moveHistory.pop();
                this.engine.moveHistory.pop();
                // Reconstruire le plateau... (simplifié)
                this.engine.reset();
                // Rejouer tous les coups sauf les 2 derniers
                const movesToReplay = this.engine.moveHistory;
                this.engine.reset();
                movesToReplay.forEach(move => {
                    this.engine.makeMove(move.fromRow, move.fromCol, move.toRow, move.toCol);
                });
                this.renderBoard();
            }
        });
        
        // La gestion du double-tap est maintenant assurée par le CSS :
        // body { touch-action: manipulation; }
        // Aucun écouteur touchstart n'est nécessaire.
    }
}

// Initialisation du jeu
document.addEventListener('DOMContentLoaded', () => {
    new ChessGame();
    
    // Enregistrement du Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js')
            .then(reg => console.log('Service Worker enregistré'))
            .catch(err => console.log('Erreur Service Worker:', err));
    }
});

// Gestion de l'installation PWA
window.addEventListener('beforeinstallprompt', (e) => {
    // Afficher une bannière d'installation personnalisée si nécessaire
    // e.prompt();
});
