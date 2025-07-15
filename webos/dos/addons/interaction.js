return {
    name: "交互式工具",
    commands: {
        QUIZ: function(args) {
            // 简单的数学测验
            const num1 = Math.floor(Math.random() * 10) + 1;
            const num2 = Math.floor(Math.random() * 10) + 1;
            const correctAnswer = num1 + num2;
            
            const userAnswer = prompt(`数学题: ${num1} + ${num2} = ?`);
            
            if (userAnswer === null) {
                context.console.log("测验已取消");
                return;
            }
            
            const answer = parseInt(userAnswer);
            if (answer === correctAnswer) {
                context.console.log("🎉 答对了！");
            } else {
                context.console.log(`❌ 答错了，正确答案是 ${correctAnswer}`);
            }
        },
        
        GREET: function(args) {
            // 通过prompt获取用户名
            const name = prompt("请输入您的姓名:");
            if (name) {
                context.console.log(`Hello, ${name}! 欢迎使用DOS系统！`);
            } else {
                context.console.log("Hello, 匿名用户!");
            }
        },
        
        CALC2: function(args) {
            // 交互式计算器
            const num1 = prompt("输入第一个数字:");
            if (num1 === null) return;
            
            const operator = prompt("输入运算符 (+, -, *, /):");
            if (operator === null) return;
            
            const num2 = prompt("输入第二个数字:");
            if (num2 === null) return;
            
            const n1 = parseFloat(num1);
            const n2 = parseFloat(num2);
            
            if (isNaN(n1) || isNaN(n2)) {
                context.console.log("输入的不是有效数字");
                return;
            }
            
            let result;
            switch(operator) {
                case '+': result = n1 + n2; break;
                case '-': result = n1 - n2; break;
                case '*': result = n1 * n2; break;
                case '/': 
                    if (n2 === 0) {
                        context.console.log("除数不能为0");
                        return;
                    }
                    result = n1 / n2; 
                    break;
                default:
                    context.console.log("无效的运算符");
                    return;
            }
            
            context.console.log(`${n1} ${operator} ${n2} = ${result}`);
        },
        
        SURVEY: function(args) {
            // 多步骤调查问卷
            const name = prompt("1. 您的姓名:");
            if (!name) return;
            
            const age = prompt("2. 您的年龄:");
            if (!age) return;
            
            const favoriteColor = prompt("3. 您最喜欢的颜色:");
            if (!favoriteColor) return;
            
            const rating = prompt("4. 您对DOS系统的评分 (1-10):");
            if (!rating) return;
            
            context.console.log("=== 调查结果 ===");
            context.console.log(`姓名: ${name}`);
            context.console.log(`年龄: ${age}`);
            context.console.log(`最喜欢的颜色: ${favoriteColor}`);
            context.console.log(`评分: ${rating}/10`);
            context.console.log("感谢您的参与！");
        },
        
        GAME: function(args) {
            // 简单的猜数字游戏
            const target = Math.floor(Math.random() * 100) + 1;
            let attempts = 0;
            const maxAttempts = 7;
            
            context.console.log("=== 猜数字游戏 ===");
            context.console.log(`我想了一个1-100之间的数字，你有${maxAttempts}次机会猜中它！`);
            
            while (attempts < maxAttempts) {
                const guess = prompt(`第${attempts + 1}次猜测 (1-100):`);
                
                if (guess === null) {
                    context.console.log("游戏已退出");
                    return;
                }
                
                const number = parseInt(guess);
                attempts++;
                
                if (isNaN(number) || number < 1 || number > 100) {
                    context.console.log("请输入1-100之间的数字");
                    attempts--; // 不计入尝试次数
                    continue;
                }
                
                if (number === target) {
                    context.console.log(`🎉 恭喜你！答案就是 ${target}`);
                    context.console.log(`你用了 ${attempts} 次就猜中了！`);
                    return;
                } else if (number < target) {
                    context.console.log("太小了！");
                } else {
                    context.console.log("太大了！");
                }
                
                if (attempts < maxAttempts) {
                    context.console.log(`还有 ${maxAttempts - attempts} 次机会`);
                }
            }
            
            context.console.log(`😞 游戏结束！答案是 ${target}`);
        },
        
        MENU: function(args) {
            // 菜单选择系统
            while (true) {
                const choice = prompt(`请选择操作:
1. 查看系统信息
2. 计算器
3. 随机数生成器
4. 退出

输入选项 (1-4):`);
                
                if (choice === null || choice === '4') {
                    context.console.log("已退出菜单");
                    break;
                }
                
                switch(choice) {
                    case '1':
                        context.console.log("系统信息:");
                        context.console.log("- 操作系统: DOS 6.22");
                        context.console.log("- 当前时间: " + new Date().toLocaleString());
                        context.console.log("- 用户代理: " + navigator.userAgent);
                        break;
                        
                    case '2':
                        const expr = prompt("输入计算表达式 (如: 2+3*4):");
                        if (expr) {
                            try {
                                const result = eval(expr.replace(/[^0-9+\-*/().]/g, ''));
                                context.console.log(`${expr} = ${result}`);
                            } catch (e) {
                                context.console.log("无效的表达式");
                            }
                        }
                        break;
                        
                    case '3':
                        const min = prompt("输入最小值:");
                        const max = prompt("输入最大值:");
                        if (min && max) {
                            const minNum = parseInt(min);
                            const maxNum = parseInt(max);
                            if (!isNaN(minNum) && !isNaN(maxNum) && minNum < maxNum) {
                                const random = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
                                context.console.log(`随机数: ${random}`);
                            } else {
                                context.console.log("输入的数字无效");
                            }
                        }
                        break;
                        
                    default:
                        context.console.log("无效的选项，请重新选择");
                }
                
                // 询问是否继续
                const continueChoice = prompt("按Enter继续，或输入 'q' 退出:");
                if (continueChoice === 'q') {
                    break;
                }
            }
        },
        
        NOTEPAD: function(args) {
            // 简单的记事本功能
            const filename = args[0] || prompt("请输入文件名:");
            if (!filename) {
                context.console.log("需要指定文件名");
                return;
            }
            
            const content = prompt("请输入文件内容 (支持\\n换行):");
            if (content !== null) {
                const processedContent = content.replace(/\\n/g, '\n');
                if (context.fileSystem.createFile(filename, processedContent)) {
                    context.console.log(`文件 ${filename} 已保存`);
                } else {
                    context.console.log("保存失败");
                }
            }
        },
        
        CONFIG: function(args) {
            // 配置管理器
            const configKey = prompt("配置项名称:");
            if (!configKey) return;
            
            const action = prompt("操作 (get/set/del):");
            if (!action) return;
            
            switch(action.toLowerCase()) {
                case 'get':
                    const value = localStorage.getItem(`dos_config_${configKey}`);
                    context.console.log(`${configKey} = ${value || '(未设置)'}`);
                    break;
                    
                case 'set':
                    const newValue = prompt(`设置 ${configKey} 的值:`);
                    if (newValue !== null) {
                        localStorage.setItem(`dos_config_${configKey}`, newValue);
                        context.console.log(`${configKey} 已设置为: ${newValue}`);
                    }
                    break;
                    
                case 'del':
                    localStorage.removeItem(`dos_config_${configKey}`);
                    context.console.log(`${configKey} 已删除`);
                    break;
                    
                default:
                    context.console.log("无效的操作");
            }
        }
    }
};
