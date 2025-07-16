
(function() {
    'use strict';
    
    // 防止重复加载
    if (window.MagneticBackground) {
        return;
    }
    
    // 全局配置
    const CONFIG = {
        // 基础参数
        minSpeed: 0.3,
        maxSpeed: 0.8,
        attractRadius: 60,
        captureRadius: 120,
        attractSpeedMultiplier: 5,
        escapeThreshold: 15,
        connectionDistance: 150,
        pointCount: 20,
        
        // 调试模式
        debugMode: false,
        
        // 简化模式的颜色
        simple: {
            pointColor: '#cccccc',
            lineColor: '#e0e0e0',
            backgroundColor: 'transparent'
        },
        
        // 调试模式的颜色
        debug: {
            pointColor: '#6c757d',
            lineColor: '#adb5bd',
            mouseLineColor: '#007bff',
            attractedColor: '#28a745',
            movingColor: '#ffc107',
            ejectedColor: '#6f42c1',
            backgroundColor: 'rgba(248, 249, 250, 0.05)'
        }
    };
    
    // 点的状态
    const PointState = {
        FREE: 'free',
        ATTRACTED: 'attracted',
        MOVING_TO_MOUSE: 'movingToMouse',
        EJECTED: 'ejected'
    };
    
    // 磁性背景类
    class MagneticBackground {
        constructor() {
            this.canvas = null;
            this.ctx = null;
            this.width = 0;
            this.height = 0;
            this.points = [];
            this.mouse = { x: 0, y: 0, prevX: 0, prevY: 0, speed: 0 };
            this.animationId = null;
            this.isAnimating = true;
            this.frameCount = 0;
            
            this.init();
        }
        
        init() {
            this.createCanvas();
            this.setupEventListeners();
            this.generatePoints();
            this.animate();
        }
        
        createCanvas() {
            this.canvas = document.createElement('canvas');
            this.canvas.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: -1;
                background: transparent;
            `;
            
            this.ctx = this.canvas.getContext('2d');
            document.body.appendChild(this.canvas);
            
            this.resizeCanvas();
        }
        
        resizeCanvas() {
            this.width = this.canvas.width = window.innerWidth;
            this.height = this.canvas.height = window.innerHeight;
        }
        
        setupEventListeners() {
            // 窗口大小变化
            window.addEventListener('resize', () => {
                this.resizeCanvas();
            });
            
            // 鼠标移动
            document.addEventListener('mousemove', (e) => {
                this.mouse.x = e.clientX;
                this.mouse.y = e.clientY;
            });
            
            // 调试模式切换
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.shiftKey && e.code === 'F5') {
                    e.preventDefault();
                    this.toggleDebugMode();
                }
            });
            
            // 页面可见性变化
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.stopAnimation();
                } else {
                    this.startAnimation();
                }
            });
        }
        
        toggleDebugMode() {
            CONFIG.debugMode = !CONFIG.debugMode;
            console.log('Magnetic Background Debug Mode:', CONFIG.debugMode ? 'ON' : 'OFF');
        }
        
        randomSpeed() {
            return CONFIG.minSpeed + Math.random() * (CONFIG.maxSpeed - CONFIG.minSpeed);
        }
        
        generatePoints() {
            this.points = [];
            
            for (let i = 0; i < CONFIG.pointCount; i++) {
                const speed = this.randomSpeed();
                const angle = Math.random() * Math.PI * 2;
                
                const point = {
                    x: Math.random() * this.width,
                    y: Math.random() * this.height,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    originalVx: 0,
                    originalVy: 0,
                    baseSpeed: speed,
                    connections: [],
                    state: PointState.FREE,
                    distanceToMouse: 0
                };
                
                point.originalVx = point.vx;
                point.originalVy = point.vy;
                
                this.points.push(point);
            }
            
            this.generateConnections();
        }
        
        generateConnections() {
            this.points.forEach(point => point.connections = []);
            
            for (let i = 0; i < this.points.length; i++) {
                const point = this.points[i];
                const nearbyPoints = this.points
                    .map((p, index) => ({
                        distance: Math.sqrt((p.x - point.x) ** 2 + (p.y - point.y) ** 2),
                        index: index
                    }))
                    .filter(p => p.index !== i && p.distance < CONFIG.connectionDistance)
                    .sort((a, b) => a.distance - b.distance)
                    .slice(0, 4);
                
                point.connections = nearbyPoints.map(p => p.index);
            }
        }
        
        updateMouseSpeed() {
            const dx = this.mouse.x - this.mouse.prevX;
            const dy = this.mouse.y - this.mouse.prevY;
            this.mouse.speed = Math.sqrt(dx * dx + dy * dy);
            this.mouse.prevX = this.mouse.x;
            this.mouse.prevY = this.mouse.y;
        }
        
        updatePointState(point) {
            point.distanceToMouse = Math.sqrt(
                (point.x - this.mouse.x) ** 2 + (point.y - this.mouse.y) ** 2
            );
            
            // 检查是否应该被甩掉
            if (this.mouse.speed > CONFIG.escapeThreshold && 
                (point.state === PointState.ATTRACTED || point.state === PointState.MOVING_TO_MOUSE)) {
                point.state = PointState.EJECTED;
                return;
            }
            
            // 被甩掉的点立即重新判断状态（无冷却时间）
            if (point.state === PointState.EJECTED) {
                if (point.distanceToMouse <= CONFIG.attractRadius) {
                    point.state = PointState.ATTRACTED;
                } else if (point.distanceToMouse <= CONFIG.captureRadius) {
                    point.state = PointState.MOVING_TO_MOUSE;
                } else {
                    point.state = PointState.FREE;
                    point.vx = point.originalVx;
                    point.vy = point.originalVy;
                }
                return;
            }
            
            // 正常状态判断
            if (point.distanceToMouse <= CONFIG.attractRadius) {
                point.state = PointState.ATTRACTED;
            } else if (point.distanceToMouse <= CONFIG.captureRadius) {
                point.state = PointState.MOVING_TO_MOUSE;
            } else {
                point.state = PointState.FREE;
                point.vx = point.originalVx;
                point.vy = point.originalVy;
            }
        }
        
        applyBoundaryBounce(point) {
            let bounced = false;
            
            if (point.x < 0 || point.x > this.width) {
                point.vx *= -1;
                point.originalVx *= -1;
                point.x = Math.max(0, Math.min(this.width, point.x));
                bounced = true;
            }
            if (point.y < 0 || point.y > this.height) {
                point.vy *= -1;
                point.originalVy *= -1;
                point.y = Math.max(0, Math.min(this.height, point.y));
                bounced = true;
            }
            
            return bounced;
        }
        
        updatePointPosition(point) {
            switch (point.state) {
                case PointState.FREE:
                    point.x += point.vx;
                    point.y += point.vy;
                    this.applyBoundaryBounce(point);
                    break;
                    
                case PointState.MOVING_TO_MOUSE:
                    const dx = this.mouse.x - point.x;
                    const dy = this.mouse.y - point.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance > 0) {
                        const moveSpeed = point.baseSpeed * CONFIG.attractSpeedMultiplier;
                        point.vx = (dx / distance) * moveSpeed;
                        point.vy = (dy / distance) * moveSpeed;
                        
                        point.x += point.vx;
                        point.y += point.vy;
                        
                        this.applyBoundaryBounce(point);
                    }
                    break;
                    
                case PointState.ATTRACTED:
                    let newX = point.x + point.originalVx;
                    let newY = point.y + point.originalVy;
                    
                    // 检查屏幕边界
                    let hitScreenBoundary = false;
                    if (newX < 0 || newX > this.width) {
                        point.originalVx *= -1;
                        newX = Math.max(0, Math.min(this.width, newX));
                        hitScreenBoundary = true;
                    }
                    if (newY < 0 || newY > this.height) {
                        point.originalVy *= -1;
                        newY = Math.max(0, Math.min(this.height, newY));
                        hitScreenBoundary = true;
                    }
                    
                    if (hitScreenBoundary) {
                        point.x = newX;
                        point.y = newY;
                        point.vx = point.originalVx;
                        point.vy = point.originalVy;
                    } else {
                        let newDistance = Math.sqrt((newX - this.mouse.x) ** 2 + (newY - this.mouse.y) ** 2);
                        
                        if (newDistance <= CONFIG.attractRadius) {
                            point.x = newX;
                            point.y = newY;
                        } else {
                            // 切线运动
                            const centerToPoint = {
                                x: point.x - this.mouse.x,
                                y: point.y - this.mouse.y
                            };
                            const centerDistance = Math.sqrt(centerToPoint.x * centerToPoint.x + centerToPoint.y * centerToPoint.y);
                            
                            if (centerDistance > 0) {
                                const normal = {
                                    x: centerToPoint.x / centerDistance,
                                    y: centerToPoint.y / centerDistance
                                };
                                
                                const dot = point.originalVx * (-normal.y) + point.originalVy * normal.x;
                                point.vx = (-normal.y) * dot;
                                point.vy = normal.x * dot;
                                
                                let tangentX = point.x + point.vx;
                                let tangentY = point.y + point.vy;
                                
                                if (tangentX < 0 || tangentX > this.width || tangentY < 0 || tangentY > this.height) {
                                    if (tangentX < 0 || tangentX > this.width) {
                                        point.vx *= -1;
                                        point.originalVx *= -1;
                                        tangentX = Math.max(0, Math.min(this.width, tangentX));
                                    }
                                    if (tangentY < 0 || tangentY > this.height) {
                                        point.vy *= -1;
                                        point.originalVy *= -1;
                                        tangentY = Math.max(0, Math.min(this.height, tangentY));
                                    }
                                }
                                
                                point.x = tangentX;
                                point.y = tangentY;
                            }
                        }
                    }
                    break;
                    
                case PointState.EJECTED:
                    if (point.x < 0 || point.x > this.width || point.y < 0 || point.y > this.height) {
                        point.x = Math.max(0, Math.min(this.width, point.x));
                        point.y = Math.max(0, Math.min(this.height, point.y));
                    }
                    break;
            }
        }
        
        updatePoints() {
            this.points.forEach(point => {
                this.updatePointState(point);
                this.updatePointPosition(point);
            });
        }
        
        drawPoints() {
            const colors = CONFIG.debugMode ? CONFIG.debug : CONFIG.simple;
            
            this.points.forEach(point => {
                let color, size;
                
                if (CONFIG.debugMode) {
                    switch (point.state) {
                        case PointState.FREE:
                            color = colors.pointColor;
                            size = 3;
                            break;
                        case PointState.MOVING_TO_MOUSE:
                            color = colors.movingColor;
                            size = 4;
                            break;
                        case PointState.ATTRACTED:
                            color = colors.attractedColor;
                            size = 5;
                            break;
                        case PointState.EJECTED:
                            color = colors.ejectedColor;
                            size = 4;
                            break;
                    }
                } else {
                    color = colors.pointColor;
                    size = 2;
                }
                
                this.ctx.beginPath();
                this.ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
                this.ctx.fillStyle = color;
                this.ctx.fill();
                
                // 调试模式下绘制状态指示
                if (CONFIG.debugMode && point.state !== PointState.FREE) {
                    this.ctx.beginPath();
                    this.ctx.arc(point.x, point.y, size + 3, 0, Math.PI * 2);
                    this.ctx.strokeStyle = color + '40';
                    this.ctx.lineWidth = 2;
                    
                    if (point.state === PointState.EJECTED) {
                        this.ctx.setLineDash([5, 5]);
                    } else {
                        this.ctx.setLineDash([]);
                    }
                    
                    this.ctx.stroke();
                    this.ctx.setLineDash([]);
                }
            });
        }
        
        drawConnections() {
            const colors = CONFIG.debugMode ? CONFIG.debug : CONFIG.simple;
            
            this.points.forEach((point, index) => {
                point.connections.forEach(connectionIndex => {
                    if (connectionIndex > index) {
                        const connectedPoint = this.points[connectionIndex];
                        const distance = Math.sqrt(
                            (point.x - connectedPoint.x) ** 2 + 
                            (point.y - connectedPoint.y) ** 2
                        );
                        
                        if (distance < CONFIG.connectionDistance) {
                            this.ctx.beginPath();
                            this.ctx.moveTo(point.x, point.y);
                            this.ctx.lineTo(connectedPoint.x, connectedPoint.y);
                            
                            const opacity = 1 - (distance / CONFIG.connectionDistance);
                            const alpha = Math.floor(opacity * 255).toString(16).padStart(2, '0');
                            
                            let strokeColor, lineWidth;
                            
                            if (CONFIG.debugMode) {
                                if (point.state !== PointState.FREE || connectedPoint.state !== PointState.FREE) {
                                    if (point.state === PointState.ATTRACTED || connectedPoint.state === PointState.ATTRACTED) {
                                        strokeColor = colors.attractedColor + alpha;
                                    } else if (point.state === PointState.MOVING_TO_MOUSE || connectedPoint.state === PointState.MOVING_TO_MOUSE) {
                                        strokeColor = colors.movingColor + alpha;
                                    } else if (point.state === PointState.EJECTED || connectedPoint.state === PointState.EJECTED) {
                                        strokeColor = colors.ejectedColor + alpha;
                                    }
                                    lineWidth = 1.5;
                                } else {
                                    strokeColor = colors.lineColor + alpha;
                                    lineWidth = 1;
                                }
                                
                                if (point.state === PointState.EJECTED || connectedPoint.state === PointState.EJECTED) {
                                    this.ctx.setLineDash([3, 3]);
                                } else {
                                    this.ctx.setLineDash([]);
                                }
                            } else {
                                strokeColor = colors.lineColor + alpha;
                                lineWidth = 0.5;
                            }
                            
                            this.ctx.strokeStyle = strokeColor;
                            this.ctx.lineWidth = lineWidth;
                            this.ctx.stroke();
                            
                            this.ctx.setLineDash([]);
                        }
                    }
                });
            });
        }
        
        drawMouseConnections() {
            if (!CONFIG.debugMode) return;
            
            const colors = CONFIG.debug;
            
            this.points.forEach(point => {
                if (point.state === PointState.ATTRACTED || point.state === PointState.MOVING_TO_MOUSE) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(point.x, point.y);
                    this.ctx.lineTo(this.mouse.x, this.mouse.y);
                    
                    const maxDistance = point.state === PointState.ATTRACTED ? CONFIG.attractRadius : CONFIG.captureRadius;
                    const opacity = 1 - (point.distanceToMouse / maxDistance);
                    const alpha = Math.floor(opacity * 150).toString(16).padStart(2, '0');
                    
                    this.ctx.strokeStyle = colors.mouseLineColor + alpha;
                    this.ctx.lineWidth = point.state === PointState.ATTRACTED ? 2 : 1;
                    this.ctx.stroke();
                }
            });
        }
        
        drawRadiusCircles() {
            if (!CONFIG.debugMode) return;
            
            const colors = CONFIG.debug;
            
            // 绘制吸引半径
            this.ctx.beginPath();
            this.ctx.arc(this.mouse.x, this.mouse.y, CONFIG.attractRadius, 0, Math.PI * 2);
            this.ctx.strokeStyle = colors.attractedColor + '30';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // 绘制捕获半径
            this.ctx.beginPath();
            this.ctx.arc(this.mouse.x, this.mouse.y, CONFIG.captureRadius, 0, Math.PI * 2);
            this.ctx.strokeStyle = colors.mouseLineColor + '20';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        }
        
        animate() {
            if (!this.isAnimating) return;
            
            // 清除画布
            this.ctx.clearRect(0, 0, this.width, this.height);
            
            // 绘制背景
            if (CONFIG.debugMode && CONFIG.debug.backgroundColor !== 'transparent') {
                this.ctx.fillStyle = CONFIG.debug.backgroundColor;
                this.ctx.fillRect(0, 0, this.width, this.height);
            }
            
            this.updateMouseSpeed();
            this.frameCount++;
            
            this.updatePoints();
            
            // 绘制顺序
            this.drawRadiusCircles();
            this.drawConnections();
            this.drawMouseConnections();
            this.drawPoints();
            
            this.animationId = requestAnimationFrame(() => this.animate());
        }
        
        startAnimation() {
            if (!this.isAnimating) {
                this.isAnimating = true;
                this.animate();
            }
        }
        
        stopAnimation() {
            this.isAnimating = false;
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
                this.animationId = null;
            }
        }
        
        destroy() {
            this.stopAnimation();
            if (this.canvas && this.canvas.parentNode) {
                this.canvas.parentNode.removeChild(this.canvas);
            }
        }
    }
    
    // 自动初始化
    function initMagneticBackground() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                window.MagneticBackground = new MagneticBackground();
            });
        } else {
            window.MagneticBackground = new MagneticBackground();
        }
    }
    
    // 提供全局接口
    window.MagneticBackgroundConfig = CONFIG;
    window.initMagneticBackground = initMagneticBackground;
    
    // 自动初始化
    initMagneticBackground();
    
    // 控制台提示
    console.log('Magnetic Background loaded! Press Ctrl+Shift+F5 to toggle debug mode.');
})();
