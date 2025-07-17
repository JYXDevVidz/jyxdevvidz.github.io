
// 游戏难度配置
const DIFFICULTIES = {
    beginner: { rows: 9, cols: 9, mines: 10, name: "初级" },
    intermediate: { rows: 16, cols: 16, mines: 40, name: "中级" },
    expert: { rows: 16, cols: 30, mines: 99, name: "高级" }
};

// 游戏状态枚举
const GameState = {
    PLAYING: 'playing',
    WON: 'won',
    LOST: 'lost'
};

// 移动类型枚举
const MoveType = {
    REVEAL: 'reveal',
    FLAG: 'flag'
};

// AI策略类型枚举
const AIStrategy = {
    FIRST_CLICK: 'first_click',
    BASIC_LOGIC: 'basic_logic',
    WINDOW_ENUMERATION: 'window_enumeration',
    ENDGAME_ENUMERATION: 'endgame_enumeration',
    PROBABILITY_CALCULATION: 'probability_calculation',
    RANDOM_CHOICE: 'random_choice'
};

// 策略名称映射
const STRATEGY_NAMES = {
    [AIStrategy.FIRST_CLICK]: "首次点击",
    [AIStrategy.BASIC_LOGIC]: "基础逻辑",
    [AIStrategy.WINDOW_ENUMERATION]: "窗口枚举",
    [AIStrategy.ENDGAME_ENUMERATION]: "残局穷举",
    [AIStrategy.PROBABILITY_CALCULATION]: "概率计算",
    [AIStrategy.RANDOM_CHOICE]: "随机选择"
};

// 位置类
class Position {
    constructor(row, col) {
        this.row = row;
        this.col = col;
    }
    
    equals(other) {
        return this.row === other.row && this.col === other.col;
    }
    
    toString() {
        return `${this.row},${this.col}`;
    }
}

// AI移动结构
class AIMove {
    constructor(row, col, type, confidence, strategy) {
        this.row = row;
        this.col = col;
        this.type = type;
        this.confidence = confidence;
        this.strategy = strategy;
    }
}

// 约束结构
class Constraint {
    constructor(cells, requiredMines) {
        this.cells = cells; // Position数组
        this.requiredMines = requiredMines;
    }
}

// 扫雷游戏类
class MinesweeperGame {
    constructor(config) {
        this.rows = config.rows;
        this.cols = config.cols;
        this.mines = config.mines;
        this.state = GameState.PLAYING;
        this.firstClick = true;
        this.initializeBoard();
    }
    
    initializeBoard() {
        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
        this.revealed = Array(this.rows).fill().map(() => Array(this.cols).fill(false));
        this.flagged = Array(this.rows).fill().map(() => Array(this.cols).fill(false));
        this.state = GameState.PLAYING;
        this.firstClick = true;
    }
    
    placeMines(firstRow, firstCol) {
        // Win7规则：首次点击9宫格无雷
        const safeCells = new Set();
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const r = firstRow + dr;
                const c = firstCol + dc;
                if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
                    safeCells.add(`${r},${c}`);
                }
            }
        }
        
        // 随机放置雷
        let minesPlaced = 0;
        while (minesPlaced < this.mines) {
            const row = Math.floor(Math.random() * this.rows);
            const col = Math.floor(Math.random() * this.cols);
            const cellKey = `${row},${col}`;
            
            if (this.board[row][col] !== -1 && !safeCells.has(cellKey)) {
                this.board[row][col] = -1;
                minesPlaced++;
            }
        }
        
        // 计算数字
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.board[row][col] !== -1) {
                    let count = 0;
                    for (let dr = -1; dr <= 1; dr++) {
                        for (let dc = -1; dc <= 1; dc++) {
                            const r = row + dr;
                            const c = col + dc;
                            if (r >= 0 && r < this.rows && c >= 0 && c < this.cols 
                                && this.board[r][c] === -1) {
                                count++;
                            }
                        }
                    }
                    this.board[row][col] = count;
                }
            }
        }
    }
    
    revealCell(row, col) {
        if (this.state !== GameState.PLAYING || this.revealed[row][col] || this.flagged[row][col]) {
            return false;
        }
        
        // 首次点击
        if (this.firstClick) {
            this.placeMines(row, col);
            this.firstClick = false;
        }
        
        this.revealed[row][col] = true;
        
        // 踩雷
        if (this.board[row][col] === -1) {
            this.state = GameState.LOST;
            return false;
        }
        
        // 如果是空格，展开周围
        if (this.board[row][col] === 0) {
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const r = row + dr;
                    const c = col + dc;
                    if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
                        this.revealCell(r, c);
                    }
                }
            }
        }
        
        // 检查胜利
        this.checkWin();
        return true;
    }
    
    toggleFlag(row, col) {
        if (this.state !== GameState.PLAYING || this.revealed[row][col]) {
            return;
        }
        this.flagged[row][col] = !this.flagged[row][col];
    }
    
    checkWin() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (!this.revealed[row][col] && this.board[row][col] !== -1) {
                    return false;
                }
            }
        }
        this.state = GameState.WON;
        return true;
    }
    
    getNeighbors(row, col) {
        const neighbors = [];
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const r = row + dr;
                const c = col + dc;
                if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
                    neighbors.push(new Position(r, c));
                }
            }
        }
        return neighbors;
    }
    
    getBestFirstClick() {
        return new Position(Math.floor(this.rows / 2), Math.floor(this.cols / 2));
    }
    
    getUnrevealedCells() {
        const unrevealed = [];
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (!this.revealed[row][col] && !this.flagged[row][col]) {
                    unrevealed.push(new Position(row, col));
                }
            }
        }
        return unrevealed;
    }
    
    getRemainingMines() {
        let flaggedCount = 0;
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.flagged[row][col]) flaggedCount++;
            }
        }
        return this.mines - flaggedCount;
    }
    
    // Getters
    getState() { return this.state; }
    getRows() { return this.rows; }
    getCols() { return this.cols; }
    getMines() { return this.mines; }
    isRevealed(row, col) { return this.revealed[row][col]; }
    isFlagged(row, col) { return this.flagged[row][col]; }
    getCell(row, col) { return this.board[row][col]; }
    isFirstClick() { return this.firstClick; }
}

// 扫雷AI类
class MinesweeperAI {
    constructor(game) {
        this.game = game;
        this.windowSize = 5;
        this.endgameThreshold = 30;
    }
    
    getNextMove() {
        if (this.game.getState() !== GameState.PLAYING) {
            return null;
        }
        
        // 首次点击选择中心
        if (this.game.isFirstClick()) {
            const pos = this.game.getBestFirstClick();
            return new AIMove(pos.row, pos.col, MoveType.REVEAL, 1.0, AIStrategy.FIRST_CLICK);
        }
        
        // 1. 纯逻辑推断（最高优先级）
        const logicMove = this.getLogicMove();
        if (logicMove) return logicMove;
        
        // 2. 窗口枚举
        const windowMove = this.getWindowMove();
        if (windowMove) return windowMove;
        
        // 3. 残局穷举（未打开格子≤30时）
        const endgameMove = this.getEndgameMove();
        if (endgameMove) return endgameMove;
        
        // 4. 概率计算
        const probMove = this.getProbabilityMove();
        if (probMove) return probMove;
        
        // 5. 随机选择
        const randomMove = this.getRandomMove();
        return randomMove;
    }
    
    getLogicMove() {
        // 基础逻辑推断
        const basicMoves = this.getBasicLogicMoves();
        if (basicMoves.length > 0) {
            const move = basicMoves[0];
            return new AIMove(move.row, move.col, move.type, move.confidence, AIStrategy.BASIC_LOGIC);
        }
        
        return null;
    }
    
    getBasicLogicMoves() {
        const moves = [];
        
        for (let row = 0; row < this.game.getRows(); row++) {
            for (let col = 0; col < this.game.getCols(); col++) {
                if (this.game.isRevealed(row, col) && this.game.getCell(row, col) > 0) {
                    const neighbors = this.game.getNeighbors(row, col);
                    
                    const unrevealedNeighbors = [];
                    let flaggedCount = 0;
                    
                    for (const pos of neighbors) {
                        if (this.game.isFlagged(pos.row, pos.col)) {
                            flaggedCount++;
                        } else if (!this.game.isRevealed(pos.row, pos.col)) {
                            unrevealedNeighbors.push(pos);
                        }
                    }
                    
                    const requiredMines = this.game.getCell(row, col) - flaggedCount;
                    
                    // 如果已标记的雷数等于要求数，剩余都是安全的
                    if (requiredMines === 0) {
                        for (const pos of unrevealedNeighbors) {
                            moves.push(new AIMove(pos.row, pos.col, MoveType.REVEAL, 1.0, AIStrategy.BASIC_LOGIC));
                        }
                    }
                    
                    // 如果未开格数等于剩余雷数，都是雷
                    if (requiredMines === unrevealedNeighbors.length && unrevealedNeighbors.length > 0) {
                        for (const pos of unrevealedNeighbors) {
                            moves.push(new AIMove(pos.row, pos.col, MoveType.FLAG, 1.0, AIStrategy.BASIC_LOGIC));
                        }
                    }
                }
            }
        }
        
        return moves;
    }
    
    getWindowMove() {
        // 窗口枚举
        for (let row = 0; row < this.game.getRows(); row++) {
            for (let col = 0; col < this.game.getCols(); col++) {
                if (this.game.isRevealed(row, col) && this.game.getCell(row, col) > 0) {
                    const windowMoves = this.analyzeWindow(row, col);
                    if (windowMoves.length > 0) {
                        const move = windowMoves[0];
                        return new AIMove(move.row, move.col, move.type, move.confidence, AIStrategy.WINDOW_ENUMERATION);
                    }
                }
            }
        }
        
        return null;
    }
    
    getEndgameMove() {
        const unrevealedCells = this.game.getUnrevealedCells();
        
        // 只有在未打开格子数≤30时才进行残局穷举
        if (unrevealedCells.length > this.endgameThreshold) {
            return null;
        }
        
        // 获取所有约束
        const constraints = this.getAllConstraints();
        if (constraints.length === 0) {
            return null;
        }
        
        // 残局穷举所有可能的雷分布
        const endgameResult = this.enumerateEndgame(unrevealedCells, constraints);
        if (Object.keys(endgameResult).length > 0) {
            // 找出概率最低的安全格子
            let minProbability = 1.0;
            let bestMove = unrevealedCells[0];
            
            for (const cell of unrevealedCells) {
                const prob = endgameResult[cell.toString()] || 0.5;
                if (prob < minProbability) {
                    minProbability = prob;
                    bestMove = cell;
                }
            }
            
            // 如果找到了概率为0的格子（绝对安全），优先选择
            if (minProbability === 0.0) {
                return new AIMove(bestMove.row, bestMove.col, MoveType.REVEAL, 1.0, AIStrategy.ENDGAME_ENUMERATION);
            }
            
            // 如果没有绝对安全的格子，但有概率较低的格子
            if (minProbability < 0.5) {
                return new AIMove(bestMove.row, bestMove.col, MoveType.REVEAL, 1.0 - minProbability, AIStrategy.ENDGAME_ENUMERATION);
            }
        }
        
        return null;
    }
    
    enumerateEndgame(cells, constraints) {
        const probabilities = {};
        
        if (cells.length === 0) return probabilities;
        
        const remainingMines = this.game.getRemainingMines();
        if (remainingMines < 0 || remainingMines > cells.length) {
            return probabilities;
        }
        
        // 初始化概率统计
        for (const cell of cells) {
            probabilities[cell.toString()] = 0.0;
        }
        
        let totalValidConfigs = 0;
        const cellMineCount = {};
        
        for (const cell of cells) {
            cellMineCount[cell.toString()] = 0;
        }
        
        // 使用组合生成器进行高效枚举
        const generateCombinations = (start, minesLeft, config) => {
            if (minesLeft === 0) {
                // 检查是否满足所有约束
                if (this.satisfiesAllConstraints(config, cells, constraints)) {
                    totalValidConfigs++;
                    
                    // 统计每个格子的雷数
                    for (let i = 0; i < cells.length; i++) {
                        if (config[i]) {
                            cellMineCount[cells[i].toString()]++;
                        }
                    }
                }
                return;
            }
            
            if (start >= cells.length || minesLeft > cells.length - start) {
                return;
            }
            
            // 不选择当前格子
            generateCombinations(start + 1, minesLeft, config);
            
            // 选择当前格子
            config[start] = true;
            generateCombinations(start + 1, minesLeft - 1, config);
            config[start] = false;
        };
        
        const config = new Array(cells.length).fill(false);
        generateCombinations(0, remainingMines, config);
        
        // 计算每个格子的概率
        if (totalValidConfigs > 0) {
            for (const cell of cells) {
                const key = cell.toString();
                probabilities[key] = cellMineCount[key] / totalValidConfigs;
            }
        }
        
        return probabilities;
    }
    
    getAllConstraints() {
        const constraints = [];
        
        for (let row = 0; row < this.game.getRows(); row++) {
            for (let col = 0; col < this.game.getCols(); col++) {
                if (this.game.isRevealed(row, col) && this.game.getCell(row, col) > 0) {
                    const neighbors = this.game.getNeighbors(row, col);
                    
                    const unknownNeighbors = [];
                    let flaggedCount = 0;
                    
                    for (const pos of neighbors) {
                        if (this.game.isFlagged(pos.row, pos.col)) {
                            flaggedCount++;
                        } else if (!this.game.isRevealed(pos.row, pos.col)) {
                            unknownNeighbors.push(pos);
                        }
                    }
                    
                    if (unknownNeighbors.length > 0) {
                        const requiredMines = this.game.getCell(row, col) - flaggedCount;
                        constraints.push(new Constraint(unknownNeighbors, requiredMines));
                    }
                }
            }
        }
        
        return constraints;
    }
    
    satisfiesAllConstraints(config, cells, constraints) {
        for (const constraint of constraints) {
            let mineCount = 0;
            for (const cell of constraint.cells) {
                const index = cells.findIndex(c => c.equals(cell));
                if (index >= 0 && config[index]) {
                    mineCount++;
                }
            }
            
            if (mineCount !== constraint.requiredMines) {
                return false;
            }
        }
        
        return true;
    }
    
    analyzeWindow(centerRow, centerCol) {
        const moves = [];
        const halfSize = Math.floor(this.windowSize / 2);
        
        // 获取窗口内的约束
        const constraints = [];
        const unknownCells = new Set();
        
        for (let row = Math.max(0, centerRow - halfSize); 
             row <= Math.min(this.game.getRows() - 1, centerRow + halfSize); row++) {
            for (let col = Math.max(0, centerCol - halfSize); 
                 col <= Math.min(this.game.getCols() - 1, centerCol + halfSize); col++) {
                
                if (this.game.isRevealed(row, col) && this.game.getCell(row, col) > 0) {
                    const neighbors = this.game.getNeighbors(row, col);
                    
                    const unknownNeighbors = [];
                    let flaggedCount = 0;
                    
                    for (const pos of neighbors) {
                        if (this.game.isFlagged(pos.row, pos.col)) {
                            flaggedCount++;
                        } else if (!this.game.isRevealed(pos.row, pos.col)) {
                            unknownNeighbors.push(pos);
                            unknownCells.add(pos.toString());
                        }
                    }
                    
                    if (unknownNeighbors.length > 0) {
                        const requiredMines = this.game.getCell(row, col) - flaggedCount;
                        constraints.push(new Constraint(unknownNeighbors, requiredMines));
                    }
                }
            }
        }
        
        if (constraints.length === 0) return moves;
        
        // 枚举所有可能的雷分布
        const cellArray = Array.from(unknownCells).map(key => {
            const [row, col] = key.split(',').map(Number);
            return new Position(row, col);
        });
        
        const validConfigs = this.enumerateConfigurations(cellArray, constraints);
        
        if (validConfigs.length === 0) return moves;
        
        // 分析每个格子的概率
        const cellMineCount = {};
        for (const cell of cellArray) {
            cellMineCount[cell.toString()] = 0;
        }
        
        for (const config of validConfigs) {
            for (let i = 0; i < cellArray.length; i++) {
                if (config[i]) {
                    cellMineCount[cellArray[i].toString()]++;
                }
            }
        }
        
        // 找出确定的格子
        for (const cell of cellArray) {
            const probability = cellMineCount[cell.toString()] / validConfigs.length;
            
            if (probability === 0.0) {
                moves.push(new AIMove(cell.row, cell.col, MoveType.REVEAL, 1.0, AIStrategy.WINDOW_ENUMERATION));
            } else if (probability === 1.0) {
                moves.push(new AIMove(cell.row, cell.col, MoveType.FLAG, 1.0, AIStrategy.WINDOW_ENUMERATION));
            }
        }
        
        return moves;
    }
    
    enumerateConfigurations(cells, constraints) {
        const validConfigs = [];
        const totalCells = cells.length;
        
        if (totalCells > 20) return validConfigs; // 限制复杂度
        
        const enumerate = (index, currentConfig) => {
            if (index === totalCells) {
                if (this.satisfiesConstraints(currentConfig, cells, constraints)) {
                    validConfigs.push([...currentConfig]);
                }
                return;
            }
            
            // 尝试当前格子是雷
            currentConfig[index] = true;
            enumerate(index + 1, currentConfig);
            
            // 尝试当前格子不是雷
            currentConfig[index] = false;
            enumerate(index + 1, currentConfig);
        };
        
        const initialConfig = new Array(totalCells).fill(false);
        enumerate(0, initialConfig);
        
        return validConfigs;
    }
    
    satisfiesConstraints(config, cells, constraints) {
        for (const constraint of constraints) {
            let mineCount = 0;
            for (const cell of constraint.cells) {
                const index = cells.findIndex(c => c.equals(cell));
                if (index >= 0 && config[index]) {
                    mineCount++;
                }
            }
            
            if (mineCount !== constraint.requiredMines) {
                return false;
            }
        }
        
        return true;
    }
    
    getProbabilityMove() {
        const probabilities = this.calculateProbabilities();
        
        if (Object.keys(probabilities).length === 0) {
            return null;
        }
        
        // 找出概率最低的格子
        let minProbability = 1.0;
        let bestMoves = [];
        
        for (const [key, prob] of Object.entries(probabilities)) {
            if (prob < minProbability) {
                minProbability = prob;
                bestMoves = [key];
            } else if (prob === minProbability) {
                bestMoves.push(key);
            }
        }
        
        if (bestMoves.length === 0) return null;
        
        // 选择信息增益最大的
        let bestMove = bestMoves[0];
        let maxInformationGain = 0;
        
        for (const moveKey of bestMoves) {
            const [row, col] = moveKey.split(',').map(Number);
            const informationGain = this.calculateInformationGain(row, col);
            if (informationGain > maxInformationGain) {
                maxInformationGain = informationGain;
                bestMove = moveKey;
            }
        }
        
        const [row, col] = bestMove.split(',').map(Number);
        return new AIMove(row, col, MoveType.REVEAL, 1.0 - minProbability, AIStrategy.PROBABILITY_CALCULATION);
    }
    
    calculateProbabilities() {
        const probabilities = {};
        
        // 获取所有约束组
        const constraintGroups = this.getConstraintGroups();
        
        // 计算半自由点概率
        for (const group of constraintGroups) {
            const groupProbabilities = this.calculateGroupProbabilities(group);
            Object.assign(probabilities, groupProbabilities);
        }
        
        // 计算全自由点概率
        const freeCells = this.getFreeCells();
        const remainingMines = this.game.getRemainingMines();
        
        if (freeCells.length > 0 && remainingMines > 0) {
            const freeProbability = Math.min(1.0, remainingMines / freeCells.length);
            for (const cell of freeCells) {
                probabilities[cell.toString()] = freeProbability;
            }
        }
        
        return probabilities;
    }
    
    getConstraintGroups() {
        const groups = [];
        const processed = new Set();
        
        for (let row = 0; row < this.game.getRows(); row++) {
            for (let col = 0; col < this.game.getCols(); col++) {
                if (this.game.isRevealed(row, col) && this.game.getCell(row, col) > 0) {
                    const neighbors = this.game.getNeighbors(row, col);
                    
                    const unknownNeighbors = [];
                    for (const pos of neighbors) {
                        if (!this.game.isRevealed(pos.row, pos.col) && !this.game.isFlagged(pos.row, pos.col)) {
                            unknownNeighbors.push(pos);
                        }
                    }
                    
                    if (unknownNeighbors.length > 0) {
                        const groupKey = unknownNeighbors.map(pos => pos.toString()).sort().join(';');
                        
                        if (!processed.has(groupKey)) {
                            processed.add(groupKey);
                            groups.push(unknownNeighbors);
                        }
                    }
                }
            }
        }
        
        return groups;
    }
    
    calculateGroupProbabilities(group) {
        const probabilities = {};
        
        // 简化版概率计算
        for (const cell of group) {
            let totalProbability = 0.0;
            let constraintCount = 0;
            
            const neighbors = this.game.getNeighbors(cell.row, cell.col);
            for (const neighbor of neighbors) {
                if (this.game.isRevealed(neighbor.row, neighbor.col) && 
                    this.game.getCell(neighbor.row, neighbor.col) > 0) {
                    
                    const neighborNeighbors = this.game.getNeighbors(neighbor.row, neighbor.col);
                    let flaggedCount = 0;
                    let unknownCount = 0;
                    
                    for (const nn of neighborNeighbors) {
                        if (this.game.isFlagged(nn.row, nn.col)) {
                            flaggedCount++;
                        } else if (!this.game.isRevealed(nn.row, nn.col)) {
                            unknownCount++;
                        }
                    }
                    
                    if (unknownCount > 0) {
                        const requiredMines = this.game.getCell(neighbor.row, neighbor.col) - flaggedCount;
                        totalProbability += requiredMines / unknownCount;
                        constraintCount++;
                    }
                }
            }
            
            probabilities[cell.toString()] = constraintCount > 0 ? 
                Math.max(0.0, Math.min(1.0, totalProbability / constraintCount)) : 0.5;
        }
        
        return probabilities;
    }
    
    getFreeCells() {
        const freeCells = [];
        
        for (let row = 0; row < this.game.getRows(); row++) {
            for (let col = 0; col < this.game.getCols(); col++) {
                if (!this.game.isRevealed(row, col) && !this.game.isFlagged(row, col)) {
                    // 检查是否被任何数字约束
                    const neighbors = this.game.getNeighbors(row, col);
                    let hasConstraint = false;
                    
                    for (const pos of neighbors) {
                        if (this.game.isRevealed(pos.row, pos.col) && this.game.getCell(pos.row, pos.col) > 0) {
                            hasConstraint = true;
                            break;
                        }
                    }
                    
                    if (!hasConstraint) {
                        freeCells.push(new Position(row, col));
                    }
                }
            }
        }
        
        return freeCells;
    }
    
    calculateInformationGain(row, col) {
        if (this.game.isRevealed(row, col) || this.game.isFlagged(row, col)) {
            return 0;
        }
        
        let potentialReveals = 1;
        
        // 如果周围数字格较少，可能翻开更大区域
        const neighbors = this.game.getNeighbors(row, col);
        let revealedNeighbors = 0;
        
        for (const pos of neighbors) {
            if (this.game.isRevealed(pos.row, pos.col)) {
                revealedNeighbors++;
            }
        }
        
        if (revealedNeighbors === 0) {
            potentialReveals += 8; // 可能是大空区域
        }
        
        // 边角位置加分
        if (row === 0 || row === this.game.getRows() - 1 || 
            col === 0 || col === this.game.getCols() - 1) {
            potentialReveals += 2;
        }
        
        return potentialReveals;
    }
    
    getRandomMove() {
        const unrevealedCells = [];
        
        for (let row = 0; row < this.game.getRows(); row++) {
            for (let col = 0; col < this.game.getCols(); col++) {
                if (!this.game.isRevealed(row, col) && !this.game.isFlagged(row, col)) {
                    unrevealedCells.push(new Position(row, col));
                }
            }
        }
        
        if (unrevealedCells.length === 0) return null;
        
        // 优先选择边角位置
        const edgeCells = [];
        for (const cell of unrevealedCells) {
            if (cell.row === 0 || cell.row === this.game.getRows() - 1 || 
                cell.col === 0 || cell.col === this.game.getCols() - 1) {
                edgeCells.push(cell);
            }
        }
        
        const candidates = edgeCells.length > 0 ? edgeCells : unrevealedCells;
        const randomIndex = Math.floor(Math.random() * candidates.length);
        const selectedCell = candidates[randomIndex];
        
        return new AIMove(selectedCell.row, selectedCell.col, MoveType.REVEAL, 0.1, AIStrategy.RANDOM_CHOICE);
    }
}

// 游戏结果统计
class GameResult {
    constructor(won, moves, duration) {
        this.won = won;
        this.moves = moves;
        this.duration = duration;
        this.strategyUsage = new Map();
    }
}

// 统计信息收集器
class StatisticsCollector {
    constructor() {
        this.totalGames = 0;
        this.winCount = 0;
        this.results = [];
        this.totalStrategyUsage = new Map();
    }
    
    addResult(result) {
        this.results.push(result);
        this.totalGames++;
        if (result.won) {
            this.winCount++;
        }
        
        // 统计策略使用情况
        for (const [strategy, count] of result.strategyUsage) {
            this.totalStrategyUsage.set(strategy, (this.totalStrategyUsage.get(strategy) || 0) + count);
        }
    }
    
    getStatistics() {
        if (this.totalGames === 0) {
            return {
                totalGames: 0,
                winCount: 0,
                winRate: 0,
                avgMoves: 0,
                avgDuration: 0,
                confidenceInterval: [0, 0],
                strategyUsage: {}
            };
        }
        
        const winRate = this.winCount / this.totalGames * 100.0;
        
        // 计算平均移动数
        let totalMoves = 0;
        let totalDuration = 0.0;
        
        for (const result of this.results) {
            totalMoves += result.moves;
            totalDuration += result.duration;
        }
        
        const avgMoves = totalMoves / this.totalGames;
        const avgDuration = totalDuration / this.totalGames;
        
        // 计算置信区间
        const stdError = Math.sqrt(winRate * (100 - winRate) / this.totalGames);
        const confidenceInterval = [
            Math.max(0.0, winRate - 1.96 * stdError),
            Math.min(100.0, winRate + 1.96 * stdError)
        ];
        
        // 策略使用统计
        const strategyUsage = {};
        let totalStrategyCount = 0;
        
        for (const count of this.totalStrategyUsage.values()) {
            totalStrategyCount += count;
        }
        
        if (totalStrategyCount > 0) {
            for (const [strategy, count] of this.totalStrategyUsage) {
                const percentage = count / totalStrategyCount * 100.0;
                strategyUsage[strategy] = {
                    count: count,
                    percentage: percentage,
                    name: STRATEGY_NAMES[strategy]
                };
            }
        }
        
        return {
            totalGames: this.totalGames,
            winCount: this.winCount,
            winRate: winRate,
            avgMoves: avgMoves,
            avgDuration: avgDuration,
            confidenceInterval: confidenceInterval,
            strategyUsage: strategyUsage
        };
    }
    
    reset() {
        this.totalGames = 0;
        this.winCount = 0;
        this.results = [];
        this.totalStrategyUsage.clear();
    }
}

// 单个游戏运行器
class GameRunner {
    constructor(config, stats) {
        this.config = config;
        this.stats = stats;
    }
    
    runGame() {
        const game = new MinesweeperGame(this.config);
        const ai = new MinesweeperAI(game);
        
        const startTime = performance.now();
        let moveCount = 0;
        const strategyUsage = new Map();
        
        while (game.getState() === GameState.PLAYING) {
            const move = ai.getNextMove();
            if (!move) break;
            
            // 统计策略使用
            strategyUsage.set(move.strategy, (strategyUsage.get(move.strategy) || 0) + 1);
            
            if (move.type === MoveType.REVEAL) {
                game.revealCell(move.row, move.col);
            } else {
                game.toggleFlag(move.row, move.col);
            }
            
            moveCount++;
            
            // 防止死循环
            if (moveCount > 10000) break;
        }
        
        const endTime = performance.now();
        const duration = (endTime - startTime) / 1000.0;
        
        const won = (game.getState() === GameState.WON);
        const result = new GameResult(won, moveCount, duration);
        result.strategyUsage = strategyUsage;
        
        this.stats.addResult(result);
        
        return {
            won: won,
            moves: moveCount,
            duration: duration,
            strategyUsage: strategyUsage
        };
    }
}

// 获取格子概率（用于显示）
function getCellProbability(game, row, col) {
    if (game.isRevealed(row, col) || game.isFlagged(row, col)) {
        return -1; // 不显示概率
    }
    
    const ai = new MinesweeperAI(game);
    const probabilities = ai.calculateProbabilities();
    const key = `${row},${col}`;
    
    return probabilities[key] || 0;
}

// 导出所有必要的类和函数
if (typeof module !== 'undefined' && module.exports) {
    // Node.js 环境
    module.exports = {
        DIFFICULTIES,
        GameState,
        MoveType,
        AIStrategy,
        STRATEGY_NAMES,
        Position,
        AIMove,
        Constraint,
        MinesweeperGame,
        MinesweeperAI,
        GameResult,
        StatisticsCollector,
        GameRunner,
        getCellProbability
    };
} else {
    // 浏览器环境
    window.MinesweeperEngine = {
        DIFFICULTIES,
        GameState,
        MoveType,
        AIStrategy,
        STRATEGY_NAMES,
        Position,
        AIMove,
        Constraint,
        MinesweeperGame,
        MinesweeperAI,
        GameResult,
        StatisticsCollector,
        GameRunner,
        getCellProbability
    };
}
