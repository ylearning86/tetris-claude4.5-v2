// ゲームボードの設定
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const BLOCK_SIZE = 30;

// ゲーム状態
let board = [];
let currentPiece = null;
let nextPiece = null;
let score = 0;
let level = 1;
let lines = 0;
let gameLoop = null;
let isPaused = false;
let isGameOver = false;
let dropSpeed = 1000;

// Canvas要素の取得
const canvas = document.getElementById('game-board');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-piece');
const nextCtx = nextCanvas.getContext('2d');

// Web Audio API - 効果音の生成
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();

// 効果音生成関数
function playMoveSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 200;
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.05);
}

function playRotateSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.05);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.05);
}

function playDropSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.1);
    oscillator.type = 'triangle';
    
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
}

function playClearLineSound() {
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator1.frequency.setValueAtTime(400, audioContext.currentTime);
    oscillator1.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.2);
    oscillator1.type = 'square';
    
    oscillator2.frequency.setValueAtTime(600, audioContext.currentTime);
    oscillator2.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.2);
    oscillator2.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator1.start(audioContext.currentTime);
    oscillator2.start(audioContext.currentTime);
    oscillator1.stop(audioContext.currentTime + 0.2);
    oscillator2.stop(audioContext.currentTime + 0.2);
}

function playGameOverSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.5);
    oscillator.type = 'sawtooth';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
}

function playLevelUpSound() {
    for (let i = 0; i < 3; i++) {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        const startTime = audioContext.currentTime + i * 0.1;
        oscillator.frequency.value = 500 + (i * 200);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.15, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.1);
    }
}

// テトロミノの形状定義
const TETROMINOS = {
    I: {
        shape: [[1, 1, 1, 1]],
        color: '#00f0f0'
    },
    O: {
        shape: [
            [1, 1],
            [1, 1]
        ],
        color: '#f0f000'
    },
    T: {
        shape: [
            [0, 1, 0],
            [1, 1, 1]
        ],
        color: '#a000f0'
    },
    S: {
        shape: [
            [0, 1, 1],
            [1, 1, 0]
        ],
        color: '#00f000'
    },
    Z: {
        shape: [
            [1, 1, 0],
            [0, 1, 1]
        ],
        color: '#f00000'
    },
    J: {
        shape: [
            [1, 0, 0],
            [1, 1, 1]
        ],
        color: '#0000f0'
    },
    L: {
        shape: [
            [0, 0, 1],
            [1, 1, 1]
        ],
        color: '#f0a000'
    }
};

// ゲームボードの初期化
function initBoard() {
    board = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0));
}

// ランダムなテトロミノを生成
function randomTetromino() {
    const keys = Object.keys(TETROMINOS);
    const key = keys[Math.floor(Math.random() * keys.length)];
    const tetromino = TETROMINOS[key];
    
    return {
        shape: tetromino.shape,
        color: tetromino.color,
        x: Math.floor(BOARD_WIDTH / 2) - Math.floor(tetromino.shape[0].length / 2),
        y: 0
    };
}

// ボードの描画
function drawBoard() {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // グリッド線の描画
    ctx.strokeStyle = '#2a2a3e';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= BOARD_HEIGHT; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * BLOCK_SIZE);
        ctx.lineTo(BOARD_WIDTH * BLOCK_SIZE, i * BLOCK_SIZE);
        ctx.stroke();
    }
    
    for (let i = 0; i <= BOARD_WIDTH; i++) {
        ctx.beginPath();
        ctx.moveTo(i * BLOCK_SIZE, 0);
        ctx.lineTo(i * BLOCK_SIZE, BOARD_HEIGHT * BLOCK_SIZE);
        ctx.stroke();
    }
    
    // 配置済みのブロックの描画
    for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
            if (board[y][x]) {
                drawBlock(ctx, x, y, board[y][x]);
            }
        }
    }
    
    // 現在のピースの描画
    if (currentPiece) {
        drawPiece(ctx, currentPiece);
    }
}

// ブロックの描画
function drawBlock(context, x, y, color) {
    context.fillStyle = color;
    context.fillRect(x * BLOCK_SIZE + 1, y * BLOCK_SIZE + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
    
    // ハイライト効果
    context.fillStyle = 'rgba(255, 255, 255, 0.3)';
    context.fillRect(x * BLOCK_SIZE + 1, y * BLOCK_SIZE + 1, BLOCK_SIZE - 2, BLOCK_SIZE / 3);
}

// ピースの描画
function drawPiece(context, piece) {
    for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
            if (piece.shape[y][x]) {
                drawBlock(context, piece.x + x, piece.y + y, piece.color);
            }
        }
    }
}

// 次のピースの描画
function drawNextPiece() {
    nextCtx.fillStyle = '#1a1a2e';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    
    if (nextPiece) {
        const offsetX = (4 - nextPiece.shape[0].length) / 2;
        const offsetY = (4 - nextPiece.shape.length) / 2;
        
        for (let y = 0; y < nextPiece.shape.length; y++) {
            for (let x = 0; x < nextPiece.shape[y].length; x++) {
                if (nextPiece.shape[y][x]) {
                    nextCtx.fillStyle = nextPiece.color;
                    nextCtx.fillRect(
                        (offsetX + x) * BLOCK_SIZE + 1,
                        (offsetY + y) * BLOCK_SIZE + 1,
                        BLOCK_SIZE - 2,
                        BLOCK_SIZE - 2
                    );
                }
            }
        }
    }
}

// 衝突判定
function isCollision(piece, offsetX = 0, offsetY = 0) {
    for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
            if (piece.shape[y][x]) {
                const newX = piece.x + x + offsetX;
                const newY = piece.y + y + offsetY;
                
                if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
                    return true;
                }
                
                if (newY >= 0 && board[newY][newX]) {
                    return true;
                }
            }
        }
    }
    return false;
}

// ピースの移動
function movePiece(dx, dy) {
    if (!isCollision(currentPiece, dx, dy)) {
        currentPiece.x += dx;
        currentPiece.y += dy;
        if (dx !== 0) {
            playMoveSound(); // 左右移動音
        }
        return true;
    }
    return false;
}

// ピースの回転
function rotatePiece() {
    const rotated = {
        ...currentPiece,
        shape: currentPiece.shape[0].map((_, i) =>
            currentPiece.shape.map(row => row[i]).reverse()
        )
    };
    
    if (!isCollision(rotated)) {
        currentPiece.shape = rotated.shape;
        playRotateSound(); // 回転音
    }
}

// ピースの固定
function lockPiece() {
    for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
            if (currentPiece.shape[y][x]) {
                const boardY = currentPiece.y + y;
                if (boardY >= 0) {
                    board[boardY][currentPiece.x + x] = currentPiece.color;
                }
            }
        }
    }
    playDropSound(); // ブロック着地音
}

// ラインのクリア
function clearLines() {
    let linesCleared = 0;
    
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
        if (board[y].every(cell => cell !== 0)) {
            board.splice(y, 1);
            board.unshift(Array(BOARD_WIDTH).fill(0));
            linesCleared++;
            y++; // 同じ行を再チェック
        }
    }
    
    if (linesCleared > 0) {
        playClearLineSound(); // ライン消去音
        
        lines += linesCleared;
        score += [0, 100, 300, 500, 800][linesCleared] * level;
        
        const oldLevel = level;
        level = Math.floor(lines / 10) + 1;
        
        // レベルアップ時に速度を更新
        if (level > oldLevel) {
            playLevelUpSound(); // レベルアップ音
        }
        
        const newDropSpeed = Math.max(100, 1000 - (level - 1) * 100);
        if (newDropSpeed !== dropSpeed) {
            dropSpeed = newDropSpeed;
            if (gameLoop) {
                clearInterval(gameLoop);
                gameLoop = setInterval(update, dropSpeed);
            }
        }
        
        updateScore();
    }
}

// スコアの更新
function updateScore() {
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
    document.getElementById('lines').textContent = lines;
}

// ゲームオーバーの判定
function checkGameOver() {
    return isCollision(currentPiece);
}

// ゲームオーバー処理
function gameOver() {
    isGameOver = true;
    clearInterval(gameLoop);
    playGameOverSound(); // ゲームオーバー音
    document.getElementById('final-score').textContent = score;
    document.getElementById('game-over').classList.remove('hidden');
    document.getElementById('pause-button').disabled = true;
}

// 新しいピースの生成
function spawnPiece() {
    currentPiece = nextPiece || randomTetromino();
    nextPiece = randomTetromino();
    
    if (checkGameOver()) {
        gameOver();
    }
    
    drawNextPiece();
}

// ゲームループ
function update() {
    if (isPaused || isGameOver) return;
    
    if (!movePiece(0, 1)) {
        lockPiece();
        clearLines();
        spawnPiece();
    }
    
    drawBoard();
}

// ゲームの開始
function startGame() {
    initBoard();
    score = 0;
    level = 1;
    lines = 0;
    isPaused = false;
    isGameOver = false;
    dropSpeed = 1000;
    
    updateScore();
    document.getElementById('game-over').classList.add('hidden');
    document.getElementById('start-button').disabled = true;
    document.getElementById('pause-button').disabled = false;
    
    nextPiece = randomTetromino();
    spawnPiece();
    drawBoard();
    
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(update, dropSpeed);
}

// 一時停止/再開
function togglePause() {
    isPaused = !isPaused;
    document.getElementById('pause-button').textContent = isPaused ? '再開' : '一時停止';
}

// キーボード操作
document.addEventListener('keydown', (e) => {
    if (isGameOver || !currentPiece) return;
    
    if (isPaused && e.key !== 'p' && e.key !== 'P') return;
    
    switch (e.key) {
        case 'ArrowLeft':
            movePiece(-1, 0);
            break;
        case 'ArrowRight':
            movePiece(1, 0);
            break;
        case 'ArrowDown':
            if (movePiece(0, 1)) {
                score += 1;
                updateScore();
            }
            break;
        case 'ArrowUp':
        case ' ':
            rotatePiece();
            break;
        case 'p':
        case 'P':
            togglePause();
            break;
    }
    
    if (!isPaused) {
        drawBoard();
    }
});

// ボタンイベント
document.getElementById('start-button').addEventListener('click', startGame);
document.getElementById('pause-button').addEventListener('click', togglePause);
document.getElementById('restart-button').addEventListener('click', () => {
    document.getElementById('start-button').disabled = false;
    startGame();
});

// タッチデバイスの検出とタッチコントロールの表示
function isTouchDevice() {
    return (('ontouchstart' in window) ||
            (navigator.maxTouchPoints > 0) ||
            (navigator.msMaxTouchPoints > 0));
}

// タッチコントロールの表示/非表示
if (isTouchDevice()) {
    const touchControls = document.getElementById('touch-controls');
    if (touchControls) {
        touchControls.classList.remove('hidden');
    }
}

// タッチコントロールのボタンイベント
// タッチイベントとクリックイベントの二重実行を防ぐための定数
const TOUCH_DEBOUNCE_DELAY = 300; // iOS/iPadOSのクリック遅延を考慮

// タッチイベントとクリックイベントの二重実行を防ぐためのヘルパー関数
function createTouchButtonHandler(callback) {
    let lastTouchTime = 0;
    
    return {
        touchHandler: (e) => {
            e.preventDefault();
            lastTouchTime = Date.now();
            callback();
        },
        clickHandler: (e) => {
            e.preventDefault();
            // 最後のタッチから指定時間内の場合はクリックイベントをスキップ
            const timeSinceTouch = Date.now() - lastTouchTime;
            if (timeSinceTouch > TOUCH_DEBOUNCE_DELAY) {
                callback();
            }
        }
    };
}

// 左移動ボタン
const leftButton = document.getElementById('left-button');
if (leftButton) {
    const handlers = createTouchButtonHandler(() => {
        if (!isGameOver && currentPiece && !isPaused) {
            movePiece(-1, 0);
            drawBoard();
        }
    });
    leftButton.addEventListener('touchend', handlers.touchHandler, { passive: false });
    leftButton.addEventListener('click', handlers.clickHandler);
}

// 右移動ボタン
const rightButton = document.getElementById('right-button');
if (rightButton) {
    const handlers = createTouchButtonHandler(() => {
        if (!isGameOver && currentPiece && !isPaused) {
            movePiece(1, 0);
            drawBoard();
        }
    });
    rightButton.addEventListener('touchend', handlers.touchHandler, { passive: false });
    rightButton.addEventListener('click', handlers.clickHandler);
}

// 落下ボタン
const downButton = document.getElementById('down-button');
if (downButton) {
    const handlers = createTouchButtonHandler(() => {
        if (!isGameOver && currentPiece && !isPaused) {
            if (movePiece(0, 1)) {
                score += 1;
                updateScore();
            }
            drawBoard();
        }
    });
    downButton.addEventListener('touchend', handlers.touchHandler, { passive: false });
    downButton.addEventListener('click', handlers.clickHandler);
}

// 回転ボタン
const rotateButton = document.getElementById('rotate-button');
if (rotateButton) {
    const handlers = createTouchButtonHandler(() => {
        if (!isGameOver && currentPiece && !isPaused) {
            rotatePiece();
            drawBoard();
        }
    });
    rotateButton.addEventListener('touchend', handlers.touchHandler, { passive: false });
    rotateButton.addEventListener('click', handlers.clickHandler);
}

// スワイプジェスチャーのサポート
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

const gameBoard = document.getElementById('game-board');

gameBoard.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
    e.preventDefault();
}, { passive: false });

gameBoard.addEventListener('touchend', (e) => {
    if (isGameOver || !currentPiece || isPaused) return;
    
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
    e.preventDefault();
}, { passive: false });

function handleSwipe() {
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const minSwipeDistance = 30;
    
    // タップ（回転）
    if (Math.abs(deltaX) < minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) {
        rotatePiece();
        drawBoard();
        return;
    }
    
    // スワイプ方向の判定
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // 横方向のスワイプ
        if (deltaX > minSwipeDistance) {
            // 右スワイプ
            movePiece(1, 0);
        } else if (deltaX < -minSwipeDistance) {
            // 左スワイプ
            movePiece(-1, 0);
        }
    } else {
        // 縦方向のスワイプ
        if (deltaY > minSwipeDistance) {
            // 下スワイプ
            if (movePiece(0, 1)) {
                score += 1;
                updateScore();
            }
        }
    }
    
    drawBoard();
}

// 初期描画
initBoard();
drawBoard();
drawNextPiece();
