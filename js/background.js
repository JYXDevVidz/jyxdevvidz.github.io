
(function() {
    'use strict';
    
    // 防止重复加载
    if (window.MagneticBackground) {
        return;
    }
    
    // 全局配置
    const CONFIG = {
        // 基础参数（增大半径一倍）
        minSpeed: 0.3,
        maxSpeed: 0.8,
        attractRadius: 120,     // 从60增大到120
        captureRadius: 240,     // 从120增大到240
        attractSpeedMultiplier: 5,
        escapeThreshold: 15,
        connectionDistance: 300, // 从150增大到300
        pointCount: 20,
        
        // 引力系统参数
        gravity: 0.0001,        // 非常小的引力常数
        minDistance: 8,         // 最小距离，防止重叠
        collisionDamping: 0.8,  // 碰撞阻尼
        
        // 调试模式
        debugMode: false,
        showControlPanel: false,
        
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
    
    // 控制面板类
    class ControlPanel {
        constructor(magneticBackground) {
            this.mb = magneticBackground;
            this.panel = null;
            this.isVisible = false;
            this.createPanel();
        }
        
        createPanel() {
            this.panel = document.createElement('div');
            this.panel.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                width: 320px;
                max-height: 80vh;
                overflow-y: auto;
                background: rgba(255, 255, 255, 0.95);
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                z-index: 10000;
                display: none;
                padding: 20px;
                backdrop-filter: blur(10px);
            `;
            
            this.panel.innerHTML = `
                <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 15px;">
                    <h3 style="margin: 0; color: #333;">Magnetic Background Control</h3>
                    <button id="closePanel" style="background: none; border: none; font-size: 18px; cursor: pointer; color: #666;">×</button>
                </div>
                
                <div class="info-section" style="margin-bottom: 20px; padding: 10px; background: #f8f9fa; border-radius: 4px;">
                    <div>鼠标位置: <span id="mousePos">0, 0</span></div>
                    <div>鼠标速度: <span id="mouseSpeed">0</span> px/frame</div>
                    <div>总点数: <span id="pointCount">0</span></div>
                    <div>吸引中: <span id="attractedCount" style="color: #28a745; font-weight: bold;">0</span></div>
                    <div>向内移动: <span id="movingCount" style="color: #ffc107; font-weight: bold;">0</span></div>
                    <div>被甩掉: <span id="ejectedCount" style="color: #6f42c1; font-weight: bold;">0</span></div>
                    <div>自由状态: <span id="freeCount">0</span></div>
                </div>
                
                <div class="control-group" style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">点速度范围:</label>
                    <input type="range" id="minSpeed" min="0.1" max="1" step="0.1" value="${CONFIG.minSpeed}" style="width: 100%; margin-bottom: 5px;">
                    <div style="color: #666; font-size: 12px;">最小: <span id="minSpeedValue">${CONFIG.minSpeed}</span></div>
                    <input type="range" id="maxSpeed" min="0.5" max="2" step="0.1" value="${CONFIG.maxSpeed}" style="width: 100%; margin-bottom: 5px;">
                    <div style="color: #666; font-size: 12px;">最大: <span id="maxSpeedValue">${CONFIG.maxSpeed}</span></div>
                </div>
                
                <div class="control-group" style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">吸引半径:</label>
                    <input type="range" id="attractRadius" min="50" max="200" step="5" value="${CONFIG.attractRadius}" style="width: 100%; margin-bottom: 5px;">
                    <div style="color: #666; font-size: 12px;">当前: <span id="attractRadiusValue">${CONFIG.attractRadius}</span> px</div>
                </div>
                
                <div class="control-group" style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">捕获半径:</label>
                    <input type="range" id="captureRadius" min="100" max="400" step="10" value="${CONFIG.captureRadius}" style="width: 100%; margin-bottom: 5px;">
                    <div style="color: #666; font-size: 12px;">当前: <span id="captureRadiusValue">${CONFIG.captureRadius}</span> px</div>
                </div>
                
                <div class="control-group" style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">引力强度:</label>
                    <input type="range" id="gravity" min="0" max="0.001" step="0.0001" value="${CONFIG.gravity}" style="width: 100%; margin-bottom: 5px;">
                    <div style="color: #666; font-size: 12px;">当前: <span id="gravityValue">${CONFIG.gravity}</span></div>
                </div>
                
                <div class="control-group" style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">吸引速度倍数:</label>
                    <input type="range" id="attractSpeedMultiplier" min="2" max="10" step="0.5" value="${CONFIG.attractSpeedMultiplier}" style="width: 100%; margin-bottom: 5px;">
                    <div style="color: #666; font-size: 12px;">当前: <span id="attractSpeedMultiplierValue">${CONFIG.attractSpeedMultiplier}</span> 倍</div>
                </div>
                
                <div class="control-group" style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">甩掉速度阈值:</label>
                    <input type="range" id="escapeThreshold" min="5" max="30" step="1" value="${CONFIG.escapeThreshold}" style="width: 100%; margin-bottom: 5px;">
                    <div style="color: #666; font-size: 12px;">当前: <span id="escapeThresholdValue">${CONFIG.escapeThreshold}</span> px/frame</div>
                </div>
                
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button id="resetPoints" style="flex: 1; padding: 8px; border: none; border-radius: 4px; background: #007bff; color: white; cursor: pointer;">重置点</button>
                    <button id="toggleAnimation" style="flex: 1; padding: 8px; border: none; border-radius: 4px; background: #28a745; color: white; cursor: pointer;">切换动画</button>
                </div>
            `;
            
            document.body.appendChild(this.panel);
            this.setupEventListeners();
        }
        
        setupEventListeners() {
            // 关闭按钮
            this.panel.querySelector('#closePanel').addEventListener('click', () => {
                this.hide();
            });
            
            // 控制滑块
            const controls = [
                { id: 'minSpeed', setting: 'minSpeed', callback: () => this.mb.updatePointSpeeds() },
                { id: 'maxSpeed', setting: 'maxSpeed', callback: () => this.mb.updatePointSpeeds() },
                { id: 'attractRadius', setting: 'attractRadius' },
                { id: 'captureRadius', setting: 'captureRadius' },
                { id: 'gravity', setting: 'gravity' },
                { id: 'attractSpeedMultiplier', setting: 'attractSpeedMultiplier' },
                { id: 'escapeThreshold', setting: 'escapeThreshold' }
            ];
            
            controls.forEach(control => {
                const slider = this.panel.querySelector(`#${control.id}`);
                const valueSpan = this.panel.querySelector(`#${control.id}Value`);
                
                slider.addEventListener('input', (e) => {
                    const value = parseFloat(e.target.value);
                    CONFIG[control.setting] = value;
                    valueSpan.textContent = value;
                    
                    // 确保半径关系正确
                    if (control.id === 'attractRadius' && value >= CONFIG.captureRadius) {
                        CONFIG.captureRadius = value + 20;
                        this.panel.querySelector('#captureRadius').value = CONFIG.captureRadius;
                        this.panel.querySelector('#captureRadiusValue').textContent = CONFIG.captureRadius;
                    }
                    if (control.id === 'captureRadius' && value <= CONFIG.attractRadius) {
                        CONFIG.attractRadius = value - 20;
                        this.panel.querySelector('#attractRadius').value = CONFIG.attractRadius;
                        this.panel.querySelector('#attractRadiusValue').textContent = CONFIG.attractRadius;
                    }
                    
                    if (control.callback) {
                        control.callback();
                    }
                });
            });
            
            // 按钮
            this.panel.querySelector('#resetPoints').addEventListener('click', () => {
                this.mb.generatePoints();
            });
            
            this.panel.querySelector('#toggleAnimation').addEventListener('click', () => {
                if (this.mb.isAnimating) {
                    this.mb.stopAnimation();
                } else {
                    this.mb.startAnimation();
                }
            });
        }
        
        show() {
            this.isVisible = true;
            this.panel.style.display = 'block';
            CONFIG.showControlPanel = true;
        }
        
        hide() {
            this.isVisible = false;
            this.panel.style.display = 'none';
            CONFIG.showControlPanel = false;
        }
        
        toggle() {
            if (this.isVisible) {
                this.hide();
            } else {
                this.show();
            }
        }
        
        updateInfo() {
            if (!this.isVisible) return;
            
            const mousePos = this.panel.querySelector('#mousePos');
            const mouseSpeed = this.panel.querySelector('#mouseSpeed');
            const pointCount = this.panel.querySelector('#pointCount');
            const attractedCount = this.panel.querySelector('#attractedCount');
            const movingCount = this.panel.querySelector('#movingCount');
            const ejectedCount = this.panel.querySelector('#ejectedCount');
            const freeCount = this.panel.querySelector('#freeCount');
            
            if (mousePos) mousePos.textContent = `${Math.round(this.mb.mouse.x)}, ${Math.round(this.mb.mouse.y)}`;
            if (mouseSpeed) mouseSpeed.textContent = Math.round(this.mb.mouse.speed * 10) / 10;
            if (pointCount) pointCount.textContent = this.mb.points.length;
            
            const attracted = this.mb.points.filter(p => p.state === PointState.ATTRACTED).length;
            const moving = this.mb.points.filter(p => p.state === PointState.MOVING_TO_MOUSE).length;
            const ejected = this.mb.points.filter(p => p.state === PointState.EJECTED).length;
            const free = this.mb.points.filter(p => p.state === PointState.FREE).length;
            
            if (attractedCount) attractedCount.textContent = attracted;
            if (movingCount) movingCount.textContent = moving;
            if (ejectedCount) ejectedCount.textContent = ejected;
            if (freeCount) freeCount.textContent = free;
        }
        
        destroy() {
            if (this.panel && this.panel.parentNode) {
                this.panel.parentNode.removeChild(this.panel);
            }
        }
    }
    
    // 磁性背景类
    class MagneticBackground {
        constructor() {
            this.canvas = null;
            this.ctx = null;
            this.width = 0;
            this.height = 0;
            this.points = [];
            this.mouse = { x: 0, y: 0, prevX: 0, prevY: 0, speed: 0, inBounds: false };
            this.animationId = null;
            this.isAnimating = true;
            this.frameCount = 0;
            this.controlPanel = null;
            
            this.init();
        }
        
        init() {
            this.createCanvas();
            this.setupEventListeners();
            this.generatePoints();
            this.controlPanel = new ControlPanel(this);
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
                this.mouse.inBounds = true;
            });
            
            // 鼠标离开和进入
            document.addEventListener('mouseenter', () => {
                this.mouse.inBounds = true;
            });
            
            document.addEventListener('mouseleave', () => {
                this.mouse.inBounds = false;
            });
            
            // 调试模式和控制面板切换
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.shiftKey && e.code === 'F5') {
                    e.preventDefault();
                    this.toggleControlPanel();
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
        
        toggleControlPanel() {
            CONFIG.debugMode = !CONFIG.debugMode;
            this.controlPanel.toggle();
            console.log('Magnetic Background Control Panel:', CONFIG.debugMode ? 'ON' : 'OFF');
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
                    mass: 1, // 用于碰撞计算
                    radius: 3, // 碰撞半径
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
            
            // 鼠标不在界面内时，所有点都变为自由状态
            if (!this.mouse.inBounds) {
                if (point.state !== PointState.FREE) {
                    point.state = PointState.FREE;
                    point.vx = point.originalVx;
                    point.vy = point.originalVy;
                }
                return;
            }
            
            // 检查是否应该被甩掉
            if (this.mouse.speed > CONFIG.escapeThreshold && 
                (point.state === PointState.ATTRACTED || point.state === PointState.MOVING_TO_MOUSE)) {
                point.state = PointState.EJECTED;
                return;
            }
            
            // 被甩掉的点立即重新判断状态
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
        
        // 应用引力
        applyGravity(point) {
            if (CONFIG.gravity === 0) return;
            
            this.points.forEach(otherPoint => {
                if (point === otherPoint) return;
                
                const dx = otherPoint.x - point.x;
                const dy = otherPoint.y - point.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > CONFIG.minDistance) {
                    const force = CONFIG.gravity * point.mass * otherPoint.mass / (distance * distance);
                    const forceX = force * (dx / distance);
                    const forceY = force * (dy / distance);
                    
                    point.vx += forceX / point.mass;
                    point.vy += forceY / point.mass;
                }
            });
        }
        
        // 处理碰撞
        handleCollisions(point) {
            this.points.forEach(otherPoint => {
                if (point === otherPoint) return;
                
                const dx = otherPoint.x - point.x;
                const dy = otherPoint.y - point.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const minDistance = point.radius + otherPoint.radius;
                
                if (distance < minDistance) {
                    // 弹性碰撞
                    const overlap = minDistance - distance;
                    const separationX = (dx / distance) * overlap * 0.5;
                    const separationY = (dy / distance) * overlap * 0.5;
                    
                    // 分离点
                    point.x -= separationX;
                    point.y -= separationY;
                    otherPoint.x += separationX;
                    otherPoint.y += separationY;
                    
                    // 计算碰撞后的速度
                    const relativeVx = point.vx - otherPoint.vx;
                    const relativeVy = point.vy - otherPoint.vy;
                    const speed = relativeVx * (dx / distance) + relativeVy * (dy / distance);
                    
                    if (speed > 0) return; // 已经在分离
                    
                    const totalMass = point.mass + otherPoint.mass;
                    const impulse = 2 * speed / totalMass * CONFIG.collisionDamping;
                    
                    point.vx -= impulse * otherPoint.mass * (dx / distance);
                    point.vy -= impulse * otherPoint.mass * (dy / distance);
                    otherPoint.vx += impulse * point.mass * (dx / distance);
                    otherPoint.vy += impulse * point.mass * (dy / distance);
                    
                    // 更新原始速度
                    if (point.state === PointState.FREE) {
                        point.originalVx = point.vx;
                        point.originalVy = point.vy;
                    }
                    if (otherPoint.state === PointState.FREE) {
                        otherPoint.originalVx = otherPoint.vx;
                        otherPoint.originalVy = otherPoint.vy;
                    }
                }
            });
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
            // 应用引力
            this.applyGravity(point);
            
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
            
            // 处理碰撞
            this.handleCollisions(point);
        }
        
        updatePoints() {
            this.points.forEach(point => {
                this.updatePointState(point);
                this.updatePointPosition(point);
            });
        }
        
        updatePointSpeeds() {
            this.points.forEach(point => {
                const newSpeed = this.randomSpeed();
                const speedRatio = newSpeed / point.baseSpeed;
                point.baseSpeed = newSpeed;
                point.vx *= speedRatio;
                point.vy *= speedRatio;
                point.originalVx *= speedRatio;
                point.originalVy *= speedRatio;
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
            if (!CONFIG.debugMode || !this.mouse.inBounds) return;
            
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
            if (!CONFIG.debugMode || !this.mouse.inBounds) return;
            
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
            
            // 更新控制面板信息
            this.controlPanel.updateInfo();
            
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
            if (this.controlPanel) {
                this.controlPanel.destroy();
            }
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
    console.log('Enhanced Magnetic Background loaded! Press Ctrl+Shift+F5 to toggle control panel.');
})();
