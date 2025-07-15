return {
    name: "示例扩展",
    commands: {
        HELLO: function(args) {
            const name = args[0] || "World";
            context.console.log(`Hello, ${name}!`);
        },
        CALC: function(args) {
            if (args.length < 3) {
                context.console.log("Usage: CALC <num1> <op> <num2>");
                return;
            }
            const num1 = parseFloat(args[0]);
            const op = args[1];
            const num2 = parseFloat(args[2]);
            
            let result;
            switch(op) {
                case '+': result = num1 + num2; break;
                case '-': result = num1 - num2; break;
                case '*': result = num1 * num2; break;
                case '/': result = num1 / num2; break;
                default: 
                    context.console.log("Invalid operator");
                    return;
            }
            context.console.log(`${num1} ${op} ${num2} = ${result}`);
        }
    }
};
