
return {
    name: "游戏工具集",
    commands: {
        GAMES: function(args) {
            context.console.log("=== 可用游戏 ===");
            context.console.log("GUESS     - 猜数字游戏");
            context.console.log("RPS       - 石头剪刀布");
            context.console.log("ADVENTURE - 文字冒险游戏");
            context.console.log("TYPING    - 打字练习");
            context.console.log("PUZZLE    - 数字拼图");
            context.console.log("MAZE      - 迷宫游戏");
            context.console.log("");
            context.console.log("=== 实用工具 ===");
            context.console.log("CALC      - 计算器");
            context.console.log("PASSWD    - 密码生成器");
            context.console.log("BASE64    - Base64编码/解码");
            context.console.log("COLOR     - 颜色代码转换");
            context.console.log("TIMESTAMP - 时间戳转换");
            context.console.log("TODO      - 待办事项");
            context.console.log("RANDOM    - 随机数生成");
            context.console.log("TEXTSTAT  - 文本统计");
        },

        GUESS: function(args) {
            const target = Math.floor(Math.random() * 100) + 1;
            let attempts = 0;
            const maxAttempts = 7;
            
            context.console.log("=== 猜数字游戏 ===");
            context.console.log(`我想了一个1到100之间的数字，你有${maxAttempts}次机会猜中！`);
            context.console.log("输入你的猜测（或输入'quit'退出）：");
            
            context.input.start((keyInfo) => {
                if (keyInfo.key === 'Enter') {
                    const guess = keyInfo.currentLine.trim();
                    
                    if (guess.toLowerCase() === 'quit') {
                        context.console.log(`\n游戏结束！答案是${target}`);
                        return { exit: true };
                    }
                    
                    const num = parseInt(guess);
                    if (isNaN(num) || num < 1 || num > 100) {
                        context.console.log("\n请输入1到100之间的数字！");
                        context.input.prompt("继续猜测：");
                        return { line: "", cursorPos: 0 };
                    }
                    
                    attempts++;
                    
                    if (num === target) {
                        context.console.log(`\n🎉 恭喜！你用${attempts}次猜中了！答案就是${target}！`);
                        return { exit: true };
                    } else if (attempts >= maxAttempts) {
                        context.console.log(`\n😞 游戏结束！答案是${target}，你用完了所有机会！`);
                        return { exit: true };
                    } else {
                        const hint = num < target ? "太小了！" : "太大了！";
                        context.console.log(`\n${hint} 还有${maxAttempts - attempts}次机会。`);
                        context.input.prompt("继续猜测：");
                        return { line: "", cursorPos: 0 };
                    }
                }
                return false;
            });
        },

        RPS: function(args) {
            const choices = ['石头', '剪刀', '布'];
            const choiceMap = { '1': '石头', '2': '剪刀', '3': '布' };
            let playerScore = 0;
            let computerScore = 0;
            const maxRounds = 5;
            let round = 1;
            
            context.console.log("=== 石头剪刀布游戏 ===");
            context.console.log(`${maxRounds}局制，输入数字选择：`);
            context.console.log("1 - 石头  2 - 剪刀  3 - 布  quit - 退出");
            context.console.log(`\n第${round}轮，请选择：`);
            
            context.input.start((keyInfo) => {
                if (keyInfo.key === 'Enter') {
                    const choice = keyInfo.currentLine.trim();
                    
                    if (choice.toLowerCase() === 'quit') {
                        context.console.log("\n游戏结束！");
                        return { exit: true };
                    }
                    
                    if (!choiceMap[choice]) {
                        context.console.log("\n请输入1、2或3！");
                        context.input.prompt("请重新选择：");
                        return { line: "", cursorPos: 0 };
                    }
                    
                    const playerChoice = choiceMap[choice];
                    const computerChoice = choices[Math.floor(Math.random() * 3)];
                    
                    context.console.log(`\n你选择：${playerChoice}`);
                    context.console.log(`电脑选择：${computerChoice}`);
                    
                    let result;
                    if (playerChoice === computerChoice) {
                        result = "平局！";
                    } else if (
                        (playerChoice === '石头' && computerChoice === '剪刀') ||
                        (playerChoice === '剪刀' && computerChoice === '布') ||
                        (playerChoice === '布' && computerChoice === '石头')
                    ) {
                        result = "你赢了！";
                        playerScore++;
                    } else {
                        result = "你输了！";
                        computerScore++;
                    }
                    
                    context.console.log(result);
                    context.console.log(`当前比分 - 你：${playerScore}  电脑：${computerScore}\n`);
                    
                    round++;
                    if (round > maxRounds) {
                        const finalResult = playerScore > computerScore ? "🎉 你赢了整场比赛！" : 
                                          playerScore < computerScore ? "😞 你输了整场比赛！" : 
                                          "🤝 平局！";
                        context.console.log(finalResult);
                        return { exit: true };
                    }
                    
                    context.console.log(`第${round}轮，请选择：`);
                    return { line: "", cursorPos: 0 };
                }
                return false;
            });
        },

        ADVENTURE: function(args) {
            let currentRoom = 'start';
            let inventory = [];
            let hasKey = false;
            
            const rooms = {
                start: {
                    desc: "你站在一个神秘的房间里。北边有一扇门，东边有一条走廊。",
                    exits: { n: 'door', e: 'corridor' }
                },
                door: {
                    desc: hasKey ? "你用钥匙打开了门，看到了宝藏！🏆 你赢了！" : "这扇门被锁住了，需要钥匙才能打开。",
                    exits: hasKey ? {} : { s: 'start' }
                },
                corridor: {
                    desc: "一条长长的走廊，南边有一个房间。",
                    exits: { s: 'room', w: 'start' }
                },
                room: {
                    desc: "一个小房间，地上有一把钥匙。",
                    exits: { n: 'corridor' },
                    item: 'key'
                }
            };
            
            function showRoom() {
                const room = rooms[currentRoom];
                context.console.log(`\n${room.desc}`);
                
                if (room.item === 'key' && !hasKey) {
                    context.console.log("输入 'take key' 拿取钥匙");
                }
                
                if (Object.keys(room.exits).length > 0) {
                    const exitStr = Object.keys(room.exits).map(dir => {
                        const dirNames = { n: '北', s: '南', e: '东', w: '西' };
                        return `${dir}(${dirNames[dir]})`;
                    }).join(', ');
                    context.console.log(`可以去的方向: ${exitStr}`);
                }
                
                context.console.log("输入方向或 'quit' 退出：");
            }
            
            context.console.log("=== 文字冒险游戏 ===");
            context.console.log("你要找到钥匙并打开北边的门！");
            showRoom();
            
            context.input.start((keyInfo) => {
                if (keyInfo.key === 'Enter') {
                    const command = keyInfo.currentLine.trim().toLowerCase();
                    
                    if (command === 'quit') {
                        context.console.log("\n游戏结束！");
                        return { exit: true };
                    }
                    
                    if (command === 'take key' && currentRoom === 'room' && !hasKey) {
                        hasKey = true;
                        context.console.log("\n你拿起了钥匙！");
                        rooms.door.desc = "你用钥匙打开了门，看到了宝藏！🏆 你赢了！";
                        rooms.door.exits = {};
                        showRoom();
                        return { line: "", cursorPos: 0 };
                    }
                    
                    const room = rooms[currentRoom];
                    if (room.exits[command]) {
                        currentRoom = room.exits[command];
                        if (currentRoom === 'door' && hasKey) {
                            context.console.log("\n🎉 恭喜！你完成了冒险！");
                            return { exit: true };
                        }
                        showRoom();
                    } else {
                        context.console.log("\n无法理解的命令。");
                        showRoom();
                    }
                    
                    return { line: "", cursorPos: 0 };
                }
                return false;
            });
        },

        TYPING: function(args) {
            const sentences = [
                "The quick brown fox jumps over the lazy dog.",
                "Programming is the art of telling another human what one wants the computer to do.",
                "In the beginning was the Word, and the Word was with God, and the Word was God.",
                "To be or not to be, that is the question.",
                "A journey of a thousand miles begins with a single step."
            ];
            
            const sentence = sentences[Math.floor(Math.random() * sentences.length)];
            let startTime = Date.now();
            let errors = 0;
            
            context.console.log("=== 打字练习 ===");
            context.console.log("请输入以下文字：");
            context.console.log(`"${sentence}"`);
            context.console.log("\n开始输入：");
            
            context.input.start((keyInfo) => {
                if (keyInfo.key === 'Enter') {
                    const typed = keyInfo.currentLine;
                    const endTime = Date.now();
                    const timeSpent = (endTime - startTime) / 1000;
                    
                    // 计算错误数
                    errors = 0;
                    for (let i = 0; i < Math.max(typed.length, sentence.length); i++) {
                        if (typed[i] !== sentence[i]) {
                            errors++;
                        }
                    }
                    
                    const accuracy = Math.max(0, ((sentence.length - errors) / sentence.length * 100)).toFixed(1);
                    const wpm = Math.round((typed.length / 5) / (timeSpent / 60));
                    
                    context.console.log(`\n=== 结果 ===`);
                    context.console.log(`时间: ${timeSpent.toFixed(1)}秒`);
                    context.console.log(`准确率: ${accuracy}%`);
                    context.console.log(`速度: ${wpm} WPM`);
                    context.console.log(`错误数: ${errors}`);
                    
                    if (accuracy > 95) {
                        context.console.log("🎉 优秀！");
                    } else if (accuracy > 80) {
                        context.console.log("👍 不错！");
                    } else {
                        context.console.log("💪 继续练习！");
                    }
                    
                    return { exit: true };
                }
                
                // 实时显示进度
                const typed = keyInfo.currentLine;
                let progress = "";
                for (let i = 0; i < sentence.length; i++) {
                    if (i < typed.length) {
                        progress += typed[i] === sentence[i] ? "✓" : "✗";
                    } else {
                        progress += "_";
                    }
                }
                
                return false;
            });
        },

        CALC: function(args) {
            context.console.log("=== 计算器 ===");
            context.console.log("输入数学表达式（如：2+3*4）或 'quit' 退出");
            context.console.log("支持: +, -, *, /, (, ), sqrt(), sin(), cos(), tan(), log()");
            context.input.prompt("计算: ");
            
            context.input.start((keyInfo) => {
                if (keyInfo.key === 'Enter') {
                    const expr = keyInfo.currentLine.trim();
                    
                    if (expr.toLowerCase() === 'quit') {
                        return { exit: true };
                    }
                    
                    try {
                        // 安全的数学表达式求值
                        const sanitized = expr.replace(/[^0-9+\-*/.()sqrtsincotagl ]/g, '');
                        let result;
                        
                        if (sanitized.includes('sqrt')) {
                            const processed = sanitized.replace(/sqrt\(([^)]+)\)/g, 'Math.sqrt($1)');
                            result = eval(processed);
                        } else if (sanitized.includes('sin')) {
                            const processed = sanitized.replace(/sin\(([^)]+)\)/g, 'Math.sin($1)');
                            result = eval(processed);
                        } else if (sanitized.includes('cos')) {
                            const processed = sanitized.replace(/cos\(([^)]+)\)/g, 'Math.cos($1)');
                            result = eval(processed);
                        } else if (sanitized.includes('tan')) {
                            const processed = sanitized.replace(/tan\(([^)]+)\)/g, 'Math.tan($1)');
                            result = eval(processed);
                        } else if (sanitized.includes('log')) {
                            const processed = sanitized.replace(/log\(([^)]+)\)/g, 'Math.log($1)');
                            result = eval(processed);
                        } else {
                            result = eval(sanitized);
                        }
                        
                        context.console.log(`= ${result}`);
                    } catch (error) {
                        context.console.log("错误：无效的表达式");
                    }
                    
                    context.input.prompt("计算: ");
                    return { line: "", cursorPos: 0 };
                }
                return false;
            });
        },

        PASSWD: function(args) {
            context.console.log("=== 密码生成器 ===");
            context.console.log("输入密码长度（8-128）或 'quit' 退出：");
            
            context.input.start((keyInfo) => {
                if (keyInfo.key === 'Enter') {
                    const input = keyInfo.currentLine.trim();
                    
                    if (input.toLowerCase() === 'quit') {
                        return { exit: true };
                    }
                    
                    const length = parseInt(input);
                    if (isNaN(length) || length < 8 || length > 128) {
                        context.console.log("请输入8到128之间的数字！");
                        context.input.prompt("密码长度: ");
                        return { line: "", cursorPos: 0 };
                    }
                    
                    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
                    let password = "";
                    
                    for (let i = 0; i < length; i++) {
                        password += chars.charAt(Math.floor(Math.random() * chars.length));
                    }
                    
                    context.console.log(`\n生成的密码: ${password}\n`);
                    context.console.log("再次生成请输入长度，或 'quit' 退出：");
                    
                    return { line: "", cursorPos: 0 };
                }
                return false;
            });
        },

        BASE64: function(args) {
            context.console.log("=== Base64编码/解码 ===");
            context.console.log("输入 'e' 编码，'d' 解码，或 'quit' 退出：");
            
            context.input.start((keyInfo) => {
                if (keyInfo.key === 'Enter') {
                    const input = keyInfo.currentLine.trim().toLowerCase();
                    
                    if (input === 'quit') {
                        return { exit: true };
                    }
                    
                    if (input === 'e') {
                        context.console.log("输入要编码的文本：");
                        context.input.start((keyInfo2) => {
                            if (keyInfo2.key === 'Enter') {
                                const text = keyInfo2.currentLine;
                                const encoded = btoa(unescape(encodeURIComponent(text)));
                                context.console.log(`编码结果: ${encoded}\n`);
                                context.console.log("输入 'e' 编码，'d' 解码，或 'quit' 退出：");
                                return { exit: true };
                            }
                            return false;
                        });
                        return { line: "", cursorPos: 0 };
                    }
                    
                    if (input === 'd') {
                        context.console.log("输入要解码的Base64文本：");
                        context.input.start((keyInfo2) => {
                            if (keyInfo2.key === 'Enter') {
                                const text = keyInfo2.currentLine;
                                try {
                                    const decoded = decodeURIComponent(escape(atob(text)));
                                    context.console.log(`解码结果: ${decoded}\n`);
                                } catch (error) {
                                    context.console.log("错误：无效的Base64字符串\n");
                                }
                                context.console.log("输入 'e' 编码，'d' 解码，或 'quit' 退出：");
                                return { exit: true };
                            }
                            return false;
                        });
                        return { line: "", cursorPos: 0 };
                    }
                    
                    context.console.log("请输入 'e' 或 'd'！");
                    return { line: "", cursorPos: 0 };
                }
                return false;
            });
        },

        RANDOM: function(args) {
            if (args.length === 0) {
                context.console.log("用法：");
                context.console.log("RANDOM <max>        - 生成0到max之间的随机整数");
                context.console.log("RANDOM <min> <max>  - 生成min到max之间的随机整数");
                return;
            }
            
            if (args.length === 1) {
                const max = parseInt(args[0]);
                if (isNaN(max)) {
                    context.console.log("错误：请输入有效的数字");
                    return;
                }
                context.console.log(`随机数: ${Math.floor(Math.random() * (max + 1))}`);
            } else if (args.length === 2) {
                const min = parseInt(args[0]);
                const max = parseInt(args[1]);
                if (isNaN(min) || isNaN(max)) {
                    context.console.log("错误：请输入有效的数字");
                    return;
                }
                if (min > max) {
                    context.console.log("错误：最小值不能大于最大值");
                    return;
                }
                context.console.log(`随机数: ${Math.floor(Math.random() * (max - min + 1)) + min}`);
            }
        },

        TEXTSTAT: function(args) {
            context.console.log("=== 文本统计工具 ===");
            context.console.log("输入要统计的文本（或 'quit' 退出）：");
            
            context.input.start((keyInfo) => {
                if (keyInfo.key === 'Enter') {
                    const text = keyInfo.currentLine;
                    
                    if (text.toLowerCase() === 'quit') {
                        return { exit: true };
                    }
                    
                    const chars = text.length;
                    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
                    const lines = text.split('\n').length;
                    const sentences = text.split(/[.!?]+/).filter(s => s.trim()).length;
                    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim()).length;
                    
                    context.console.log(`\n=== 统计结果 ===`);
                    context.console.log(`字符数: ${chars}`);
                    context.console.log(`单词数: ${words}`);
                    context.console.log(`行数: ${lines}`);
                    context.console.log(`句子数: ${sentences}`);
                    context.console.log(`段落数: ${paragraphs}`);
                    
                    if (words > 0) {
                        context.console.log(`平均单词长度: ${(chars / words).toFixed(1)}`);
                    }
                    
                    context.console.log("\n输入新文本进行统计（或 'quit' 退出）：");
                    return { line: "", cursorPos: 0 };
                }
                return false;
            });
        },

        TODO: function(args) {
            let todos = JSON.parse(localStorage.getItem('dos_todos') || '[]');
            
            function saveTodos() {
                localStorage.setItem('dos_todos', JSON.stringify(todos));
            }
            
            function showTodos() {
                context.console.log("\n=== 待办事项 ===");
                if (todos.length === 0) {
                    context.console.log("暂无待办事项");
                } else {
                    todos.forEach((todo, index) => {
                        const status = todo.done ? "✓" : "○";
                        context.console.log(`${index + 1}. ${status} ${todo.text}`);
                    });
                }
                context.console.log("\n命令: add <内容> | done <编号> | del <编号> | list | quit");
            }
            
            showTodos();
            context.input.prompt("TODO> ");
            
            context.input.start((keyInfo) => {
                if (keyInfo.key === 'Enter') {
                    const input = keyInfo.currentLine.trim();
                    const [command, ...rest] = input.split(' ');
                    
                    switch (command.toLowerCase()) {
                        case 'quit':
                            return { exit: true };
                            
                        case 'add':
                            if (rest.length === 0) {
                                context.console.log("请输入待办事项内容");
                            } else {
                                todos.push({ text: rest.join(' '), done: false });
                                saveTodos();
                                context.console.log("添加成功！");
                            }
                            break;
                            
                        case 'done':
                            const doneIndex = parseInt(rest[0]) - 1;
                            if (isNaN(doneIndex) || doneIndex < 0 || doneIndex >= todos.length) {
                                context.console.log("无效的编号");
                            } else {
                                todos[doneIndex].done = true;
                                saveTodos();
                                context.console.log("标记完成！");
                            }
                            break;
                            
                        case 'del':
                            const delIndex = parseInt(rest[0]) - 1;
                            if (isNaN(delIndex) || delIndex < 0 || delIndex >= todos.length) {
                                context.console.log("无效的编号");
                            } else {
                                todos.splice(delIndex, 1);
                                saveTodos();
                                context.console.log("删除成功！");
                            }
                            break;
                            
                        case 'list':
                            showTodos();
                            context.input.prompt("TODO> ");
                            return { line: "", cursorPos: 0 };
                            
                        default:
                            context.console.log("未知命令");
                    }
                    
                    context.input.prompt("TODO> ");
                    return { line: "", cursorPos: 0 };
                }
                return false;
            });
        },

        MAZE: function(args) {
            const maze = [
                "##########",
                "#S.......#",
                "#.####.#.#",
                "#....#.#.#",
                "####.#.#.#",
                "#....#...#",
                "#.####.###",
                "#......#E#",
                "#.####...#",
                "##########"
            ];
            
            let playerX = 1, playerY = 1;
            let exitX = 8, exitY = 7;
            
            function drawMaze() {
                context.console.log("\n=== 迷宫游戏 ===");
                context.console.log("用 WASD 移动，到达 E 处获胜！\n");
                
                for (let y = 0; y < maze.length; y++) {
                    let line = "";
                    for (let x = 0; x < maze[y].length; x++) {
                        if (x === playerX && y === playerY) {
                            line += "@";
                        } else {
                            line += maze[y][x];
                        }
                    }
                    context.console.log(line);
                }
                context.console.log("\nWSAD移动, Q退出：");
            }
            
            drawMaze();
            
            context.input.start((keyInfo) => {
                if (keyInfo.key === 'Enter') {
                    const input = keyInfo.currentLine.trim().toLowerCase();
                    
                    if (input === 'q') {
                        return { exit: true };
                    }
                    
                    let newX = playerX, newY = playerY;
                    
                    switch (input) {
                        case 'w': newY--; break;
                        case 's': newY++; break;
                        case 'a': newX--; break;
                        case 'd': newX++; break;
                        default:
                            context.console.log("使用 WASD 移动！");
                            return { line: "", cursorPos: 0 };
                    }
                    
                    if (newX >= 0 && newX < maze[0].length && 
                        newY >= 0 && newY < maze.length && 
                        maze[newY][newX] !== '#') {
                        playerX = newX;
                        playerY = newY;
                        
                        if (playerX === exitX && playerY === exitY) {
                            context.console.log("\n🎉 恭喜！你成功走出了迷宫！");
                            return { exit: true };
                        }
                    }
                    
                    drawMaze();
                    return { line: "", cursorPos: 0 };
                }
                return false;
            });
        }
    }
};
