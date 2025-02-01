const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Игровое состояние
const gameState = {
  players: new Map(),
  anomalies: new Map(),
  physicsRules: {
    gravity: 9.8,
    timeFactor: 1.0
  }
};

// Квантовые способности
class QuantumAbilities {
  static createGravityWell(position, power) {
    const id = uuidv4();
    gameState.anomalies.set(id, {
      type: 'gravity',
      position,
      power,
      createdAt: Date.now()
    });
    return id;
  }
}

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);
  
  // Инициализация игрока
  socket.on('spawn', (data) => {
    gameState.players.set(socket.id, {
      x: Math.random() * 800,
      y: Math.random() * 600,
      velocity: { x: 0, y: 0 },
      abilities: ['gravity'],
      health: 100
    });
  });

  // Обработка способностей
  socket.on('useAbility', (data) => {
    if(data.type === 'gravity') {
      const anomalyId = QuantumAbilities.createGravityWell(
        data.position,
        data.power
      );
      io.emit('anomalyCreated', { 
        id: anomalyId,
        ...data
      });
    }
  });

  // Физика (60 FPS)
  setInterval(() => {
    gameState.players.forEach((player, id) => {
      // Применяем гравитацию
      player.velocity.y += gameState.physicsRules.gravity * 0.1;
      
      // Обновляем позицию
      player.x += player.velocity.x * gameState.physicsRules.timeFactor;
      player.y += player.velocity.y * gameState.physicsRules.timeFactor;
    });

    // Рассылка состояния
    io.emit('gameUpdate', {
      players: Object.fromEntries(gameState.players),
      anomalies: Object.fromEntries(gameState.anomalies)
    });
  }, 1000/60);
});

server.listen(3000, () => {
  console.log('Quantum Server running on port 3000');
});
