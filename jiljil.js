(() => {
	
	//mod function
	function abs(x){
		return x>0 ? x : -1*x;
	}
	
	//utility function to force a number to within an allowed interval
	function clamp(number, min, max) {
		return Math.max(min, Math.min(number, max));
	}
	
	//pythagoras
	function dist2(dx, dy){
		return (dx**2 + dy**2)**0.5;
	}
	function dist4(x1, y1, x2, y2){
		return ((x1-x2)**2 + (y1-y2)**2)**0.5;
	}
	
	//dot product
	function dot(v1x, v1y, v2x, v2y){
		return v1x*v2x + v1y*v2y;
	}
	
	//angle between two vectors
	function angle(v1x, v1y, v2x, v2y){
		//return Math.acos(dot(v1x,v1y,v2x,v2y)/(dist2(v1x,v1y)*dist2(v2x,v2y)));
		return Math.atan2(v2y,v2x) - Math.atan2(v1y,v1x);
	}
	
    class Game {
        constructor() {
			this.gameState = 'loading'; //loading, startscreen, playing, escmenu, gameover
			this.help = false;
			this.previousGameState = 'startscreen';
			this.keyHasBeenPressed = {horizontal:0, vertical:0};
			
			this.score = 0;
			this.highscore = 0;
			if (typeof(Storage) !== "undefined") {this.highscore = localStorage.getItem('highscore');}
			
			this.justStartedPlaying = true; //for the 'are you ready' sound effect
			
			this.playerPos = {x:window.width/2, y:window.height-20-16/2};
			this.playerVel = {x:0, y:0};
			this.playerAcc = {x:0, y:0};
			// this.playerMaxVel = 2;
			// this.playerMaxAcc = 1;
			this.playerMass = 2.2;
			this.player_dt = 0.05;
			this.playerCurPos = {x:window.width/2, y:window.height-20-16/2};
			this.playerCurVel = {x:0, y:0};
			this.playerCurBaseVel = 3/this.player_dt;
			this.player_w0 = 5;
			this.playerSeg_dt = 0.05;
			this.playerSeg_zeta = 0.5; //the segments are a bit underdamped
			this.playerSeg_w0 = 5.5; //wonder if these parameters need to be unique to each segment
			this.sparkle_dt = 0.05;
			this.sparkle_w0 = 1.3;
			this.playerSegSize = [13, 12, 11, 10, 9, 8, 16];
			this.playerSegPos = [];
			this.playerSegVel = [];
			this.playerSegAcc = [];
			for(let i=0; i<7; i++){
				this.playerSegPos[i] = {x:window.width/2, y:window.height-20-16/2};
				this.playerSegVel[i] = {x:0, y:0};
				this.playerSegAcc[i] = {x:0, y:0};
			}
			this.sparklePos = {x:window.width/2, y:window.height-20-16/2};
			this.sparkleVel = {x:0, y:0};
			this.sparkleAcc = {x:0, y:0};
			this.sparkleFrame = 0;
			
			this.lemonPos = {x:72+48/2, y:16+48/2};
			this.lemonVel = {x:0.5, y:0};
			this.lemonMass = 1;
			this.lemon_dt = 0.05;
			
			this.paw0Pos = {x:146, y:211};
			this.paw1Pos = {x:186, y:216};
			this.pawPeriod = 16; //# of frames between pawprint movements
			this.respiteFrames = 64; //# of frames at beginning during initial upward movement where damage is not taken
			
			// this.friction = 0.05; //applies to player //didn't end up using this
			this.gravity = 3; //applies to lemon
			this.corLP = 1.1; //coefficient of restitution, applies to lemon-player interaction. energy appears to be created in these collisions
			this.corLW = 0.97; //coeff. of restt. (lemon-wall)
			this.corPW = 1.2; //coeff. of restt. (player-wall)
			this.collisionShock = 6; //frames after a collision where player is sent recoiling and is not in control
			this.lastCollision = -100; //frame # of last collision of player with wall/lemon. setting to 0 means the player's initialised position is treated as a collision, which causes problems
			this.lemonIdleTime = 0; //if the lemon is sitting at the bottom for too long gotta perk it back up on its own at some point
        
			this.debugInvulnerability = false;
		}
		
		resetStuff(){
			this.score = 0;
			this.playerPos = {x:window.width/2, y:window.height-20-16/2};
			this.playerCurPos = {x:window.width/2, y:window.height-20-16/2};
			this.playerVel = {x:0, y:0};
			this.playerAcc = {x:0, y:0};
			for(let i=0; i<7; i++){
				this.playerSegPos[i] = {x:window.width/2, y:window.height-20-16/2};
				this.playerSegVel[i] = {x:0, y:0};
				this.playerSegAcc[i] = {x:0, y:0};
			}
			this.sparklePos = {x:window.width/2, y:window.height-20-16/2};
			this.sparklePosPrev = {x:window.width/2, y:window.height-20-16/2};
			this.sparkleVel = {x:0, y:0};
			this.sparkleAcc = {x:0, y:0};
			this.lemonPos = {x:72+48/2, y:16+48/2};
			this.lemonVel = {x:10, y:0};
			this.paw0Pos = {x:146, y:211};
			this.paw1Pos = {x:186, y:216};
			ui.frameCount = 0;
			this.lastCollision = -100;
			this.lemonIdleTime = 0;
			
			window.keysBeingPressed = {
				'ArrowLeft': false,
				'ArrowRight': false,
				'ArrowUp': false,
				'ArrowDown': false,
				'Escape': false,
				' ': false,
				'f': false,
				'g': false,
				'k': false,
			};
		}
		
        update() {
			
			ui.hasSinceUpdated = true;
			
			this.keyHandling(window.keysBeingPressed);
			
			switch(this.gameState){
				
				case 'loading':
					break;
				
				case 'startscreen':
					this.justStartedPlaying = true;
					break;
				
				case 'playing':
					if(this.justStartedPlaying){
						ui.se[6].play();
						this.justStartedPlaying = false;
					}
					// console.log(this.playerPos, this.playerVel, this.playerAcc, this.keyHasBeenPressed);
					
					//initial upward movement
					if(ui.frameCount<this.respiteFrames && this.playerCurPos.y>20+16/2+28){
						this.playerCurPos.y -= this.player_dt*this.playerCurBaseVel;
					}
										
					
					//player input
						//old stuff
						// this.playerAcc.x += 0.1*this.keyHasBeenPressed.horizontal;
						// this.playerAcc.x *= Math.abs(this.keyHasBeenPressed.horizontal); //reset acceleration to 0 when no key is pressed
						// this.playerVel.x = clamp(this.playerVel.x, -this.playerMaxVel, this.playerMaxVel);
						// this.playerVel.x += this.playerAcc.x - this.friction*Math.sign(this.playerVel.x);
						// this.playerPos.x += this.playerVel.x;
					//A virtual 'cursor' controls the ultimate position of the player's head, which takes some time to catch up. Modeled as a critically damped harmonic oscillator.
					if(ui.frameCount-this.lastCollision > this.collisionShock){this.playerCurVel.x = this.playerCurBaseVel*this.keyHasBeenPressed.horizontal;}
					this.playerCurPos.x += this.player_dt*this.playerCurVel.x;
					this.playerAcc.x = -(this.player_w0**2)*(this.playerPos.x - this.playerCurPos.x) + -2*this.player_w0*(this.playerVel.x);
					this.playerVel.x += this.player_dt*this.playerAcc.x;
					this.playerPos.x += this.player_dt*this.playerVel.x;
					
					if(ui.frameCount-this.lastCollision > this.collisionShock){this.playerCurVel.y = this.playerCurBaseVel*this.keyHasBeenPressed.vertical;}
					this.playerCurPos.y += this.player_dt*this.playerCurVel.y;
					this.playerAcc.y = -(this.player_w0**2)*(this.playerPos.y - this.playerCurPos.y) + -2*this.player_w0*(this.playerVel.y);
					this.playerVel.y += this.player_dt*this.playerAcc.y;
					this.playerPos.y += this.player_dt*this.playerVel.y;
					
					this.playerSegAcc[0].x = -(this.playerSeg_w0**2)*(this.playerSegPos[0].x - this.playerPos.x) + -2*this.playerSeg_zeta*this.playerSeg_w0*(this.playerSegVel[0].x);
					for(let i=1; i<7; i++){
						this.playerSegAcc[i].x = -(this.playerSeg_w0**2)*(this.playerSegPos[i].x - this.playerSegPos[i-1].x) + -2*this.playerSeg_zeta*this.playerSeg_w0*(this.playerSegVel[i].x);
					}
					for(let i=0; i<7; i++){
					this.playerSegVel[i].x += this.playerSeg_dt*this.playerSegAcc[i].x;
					this.playerSegPos[i].x += this.playerSeg_dt*this.playerSegVel[i].x;
					}
					this.playerSegAcc[0].y = -(this.playerSeg_w0**2)*(this.playerSegPos[0].y - this.playerPos.y) + -2*this.playerSeg_zeta*this.playerSeg_w0*(this.playerSegVel[0].y);
					for(let i=1; i<7; i++){
						this.playerSegAcc[i].y = -(this.playerSeg_w0**2)*(this.playerSegPos[i].y - this.playerSegPos[i-1].y) + -2*this.playerSeg_zeta*this.playerSeg_w0*(this.playerSegVel[i].y);
					}
					for(let i=0; i<7; i++){
					this.playerSegVel[i].y += this.playerSeg_dt*this.playerSegAcc[i].y;
					this.playerSegPos[i].y += this.playerSeg_dt*this.playerSegVel[i].y;
					}
					
					this.sparkleAcc.x = -(this.sparkle_w0**2)*(this.sparklePos.x - this.playerSegPos[6].x) + -2*this.sparkle_w0*(this.sparkleVel.x);
					this.sparkleVel.x += this.sparkle_dt*this.sparkleAcc.x;
					this.sparklePos.x += this.sparkle_dt*this.sparkleVel.x;
					this.sparkleAcc.y = -(this.sparkle_w0**2)*(this.sparklePos.y - this.playerSegPos[6].y) + -2*this.sparkle_w0*(this.sparkleVel.y);
					this.sparkleVel.y += this.sparkle_dt*this.sparkleAcc.y;
					this.sparklePos.y += this.sparkle_dt*this.sparkleVel.y;
					this.sparkleFrame += 1;
					this.sparkleFrame %= 4;
					
					this.keyHasBeenPressed = {horizontal:0, vertical:0};
					
					//lemon bouncing
					if(this.lemonPos.y > 220-64/2){this.lemonIdleTime += 1;}
					if(this.lemonIdleTime > window.fps*8){this.lemonVel.y=-114;this.lemonIdleTime=0;}
					this.lemonPos.x += this.lemon_dt*this.lemonVel.x;
					this.lemonVel.y += this.gravity; //in computers, +y is downward
					this.lemonPos.y += this.lemon_dt*this.lemonVel.y;
					
					//pawprint movement
					//still not sure of the mechanics of this
					if(ui.frameCount>this.respiteFrames){//they're inactive for a bit at the beginning
						if(ui.frameCount % this.pawPeriod == 0){
							switch((ui.frameCount/this.pawPeriod)%4){
								case 0:
									this.paw0Pos = {x:window.width*2, y:window.height*2}; //move it off-screen so it 'disappears'
									ui.se[2].play();
									break;
								case 1:
									this.paw0Pos.x = this.sparklePos.x;
									this.paw0Pos.y = this.sparklePos.y;
									break;
								case 2:
									this.sparklePosPrev.x = this.sparklePos.x;
									this.sparklePosPrev.y = this.sparklePos.y;
									this.paw1Pos = {x:window.width*2, y:window.height*2};
									ui.se[2].play();
									break;
								case 3:
									this.paw1Pos.x = this.sparklePosPrev.x;
									this.paw1Pos.y = this.sparklePosPrev.y;
									break;
								default:
									break;
							}
						}
					}
					
					
					//collisions
					
					//playerTail-pawPrint
					if(!this.debugInvulnerability && ui.frameCount>this.respiteFrames){
						if((abs(this.playerSegPos[6].x-this.paw0Pos.x)<28/2 && abs(this.playerSegPos[6].y-this.paw0Pos.y)<28/2) || (abs(this.playerSegPos[6].x-this.paw1Pos.x)<28/2 && abs(this.playerSegPos[6].y-this.paw1Pos.y)<28/2)){
							ui.se[5].play();
							if(this.score > this.highscore){
								this.highscore = this.score;
								if (typeof(Storage) !== "undefined") {localStorage.setItem('highscore', this.highscore);}
								}
							this.gameState = 'gameover';
							this.previousGameState = 'gameover';
						}
					}
					
					//player-wall
					// if((this.playerCurPos.x < 20) || (this.playerCurPos.x > window.width-20)){
						// this.playerCurPos.x = clamp(this.playerCurPos.x, 20, window.width-20);
					// }
					// if((this.playerCurPos.y < 20) || (this.playerCurPos.y > window.height-20)){
						// this.playerCurPos.y = clamp(this.playerCurPos.y, 20, window.height-20);
					// }
					if((this.playerPos.x < 20+16/2 && this.playerVel.x<0) || (this.playerPos.x > window.width-20-16/2 && this.playerVel.x>0)){
						this.lastCollision = structuredClone(ui.frameCount);
						this.playerVel.x *= -1*this.corPW;
						this.playerCurVel.x = this.playerVel.x;
						this.playerPos.x = clamp(this.playerPos.x, 20+16/2, window.width-20-16/2);
						this.playerCurPos.x = clamp(this.playerPos.x, 20+16/2, window.width-20-16/2);
						ui.se[3].play();
					}
					if((this.playerPos.y < 20+16/2 && this.playerVel.y<0) || (this.playerPos.y > window.height-20-16/2 && this.playerVel.y>0)){
						this.lastCollision = structuredClone(ui.frameCount);
						this.playerVel.y *= -1*this.corPW;
						this.playerCurVel.y = this.playerVel.y;
						this.playerPos.y = clamp(this.playerPos.y, 20+16/2, window.height-20-16/2);
						this.playerCurPos.y = clamp(this.playerPos.y, 20+16/2, window.height-20-16/2);
						ui.se[3].play();
					}
					
					//lemon-wall
					if((this.lemonPos.y < 20+48/2 && this.lemonVel.y<0) || (this.lemonPos.y > window.height-20-48/2 && this.lemonVel.y>0)){
						this.lemonVel.y *= -1*this.corLW;
						this.lemonVel.y += 0.1*(this.lemonVel.y ? this.lemonVel.y < 0 ? -1 : 1 : 0) //same as above, so the lemon never really stops
						this.lemonPos.y = clamp(this.lemonPos.y, 20+48/2, window.height-20-48/2);
						ui.se[4].play();
					}
					if((this.lemonPos.x < 20+48/2 && this.lemonVel.x<0) || (this.lemonPos.x > window.width-20-48/2 && this.lemonVel.x>0)){
						this.lemonVel.x *= -1*this.corLW;
						this.lemonPos.x = clamp(this.lemonPos.x, 20+48/2, window.width-20-48/2);
						ui.se[4].play();
					}
					
					//player-lemon
					let dx = this.lemonPos.x-this.playerPos.x;
					let dy = this.lemonPos.y-this.playerPos.y;
					const r = dist2(dx, dy);
					const dvx = this.playerVel.x-this.lemonVel.x;
					const dvy = this.playerVel.y-this.lemonVel.y;
					
					if((r<(48/2 + 16/2)) && (dot(dx, dy, dvx, dvy)>0)){
						this.lastCollision = structuredClone(ui.frameCount);
						
						dx /= r;
						dy /= r; //now {dx, dy} = normalised displacement vector
						const k1 = (this.playerMass - this.lemonMass)/(this.playerMass + this.lemonMass);
						const k2 = 2*this.playerMass/(this.playerMass + this.lemonMass);
						const k3 = 2*this.lemonMass/(this.playerMass + this.lemonMass);
						const u1 = structuredClone(this.playerVel);
						const u2 = structuredClone(this.lemonVel);
						
						const u1h_x = dot(u1.x, u1.y, dx, dy)*dx; //h for head-on
						const u1h_y = dot(u1.x, u1.y, dx, dy)*dy;
						const u2h_x = dot(u2.x, u2.y, dx, dy)*dx;
						const u2h_y = dot(u2.x, u2.y, dx, dy)*dy;
						
						const v1h_x = this.corLP*(k1*u1h_x + k3*u2h_x);
						const v1h_y = this.corLP*(k1*u1h_y + k3*u2h_y);
						const v2h_x = this.corLP*(k2*u1h_x - k1*u2h_x);
						const v2h_y = this.corLP*(k2*u1h_y - k1*u2h_y);
						
						const v1g_x = u1.x-u1h_x; //g for glancing
						const v1g_y = u1.y-u1h_y;
						const v2g_x = u2.x-u2h_x;
						const v2g_y = u2.y-u2h_y;
						
						this.playerVel.x = (v1h_x + v1g_x);
						this.playerVel.y = (v1h_y + v1g_y);
						this.playerCurVel.x = (v1h_x + v1g_x);
						this.playerCurVel.y = (v1h_y + v1g_y);
						this.lemonVel.x = v2h_x + v2g_x;
						this.lemonVel.y = v2h_y + v2g_y;
						this.playerPos.x = this.lemonPos.x-(50/2+16/2)*dx;
						this.playerPos.y = this.lemonPos.y-(50/2+16/2)*dy;
						this.playerCurPos.x = this.lemonPos.x-(50/2+18/2)*dx;
						this.playerCurPos.y = this.lemonPos.y-(50/2+18/2)*dy;
						this.score += 1;
						ui.se[0].play();
					}
					
					//old stuff
					// if((this.playerPos.x+16/2 > this.lemonPos.x-48/2) && (Math.abs(this.playerPos.y-this.lemonPos.y) < 16/2+48/2) && (this.playerVel.x>0)){
						// this.score++;
						// this.playerVel.x *= -1;
						// this.playerPos.x = clamp(this.playerPos.x, 20+16/2, this.lemonPos.x-48/2);
					// }
					
					
					break;
				
				case 'gameover':
					this.justStartedPlaying = true;
					break;
				
				case 'escmenu':
					break;
			}
			if (this.onUpdate) this.onUpdate(this);
			
		}
		
		keyHandling(ekeys) {
			if(ekeys['z']){
				window.scale = window.scale==1?2:1;
				gameCanvas.width = window.scale*window.width;
				gameCanvas.height = window.scale*window.height;
				ui.ctx.imageSmoothingEnabled = false;
				ui.ctx.scale(window.scale, window.scale);
				if('ontouchstart' in window){
					touchCanvas.width = window.scale*window.width;
					touchCanvas.height = window.scale*window.height;
					ui.ctx2.imageSmoothingEnabled = false;
					ui.ctx2.scale(window.scale, window.scale);
				}
				ekeys['z'] = false;
			}
			if(ekeys['Escape']){
				if(this.gameState != 'escmenu'){
					window.audioContext.suspend();
					this.gameState = 'escmenu';
					ekeys['Escape'] = false;
				}
			}
			switch(this.gameState){
				case 'loading':
					if(ekeys[' ']){
						ekeys[' ']=false;
						this.gameState = 'startscreen';
					}
					break;
				case 'startscreen':
					if(ekeys[' ']){
						this.resetStuff();
						window.audioContext.resume();
						this.gameState = 'playing';
						this.previousGameState = 'playing';
					}
					break;
				
				case 'playing':
					if(ui.frameCount>this.respiteFrames*0.7){
						if(ekeys['ArrowLeft']){
							this.keyHasBeenPressed.horizontal = -1;
						}
						if(ekeys["ArrowRight"]){
							this.keyHasBeenPressed.horizontal = 1;
						}
						if(ekeys["ArrowUp"]){
							this.keyHasBeenPressed.vertical = -1;
						}
						if(ekeys["ArrowDown"]){
							this.keyHasBeenPressed.vertical = 1;
						}
					}
					if(ekeys['k']){
						ui.se[5].play(); //remember to move these lines to the actual 'pawprint hits worm' code
						if(this.score > this.highscore){this.highscore = this.score;}
						this.gameState = 'gameover';
						this.previousGameState = 'gameover';
					}
					
					break;
				
				case 'gameover':
					if(ekeys[' ']){
						this.resetStuff();
						this.gameState = 'playing';
						this.previousGameState = 'playing';
					}
					break;
				
				case 'escmenu':
					if(ekeys['f']){
						window.audioContext.resume();
						this.gameState = this.previousGameState;
					}
					if(ekeys['g']){
						ui.frameCount = 0;
						this.gameState = 'startscreen';
						this.previousGameState = 'startscreen';
					}
					if(ekeys['h']){
						this.help = !this.help;
						ekeys['h'] = false;
					}
					break;
			}
		}
		
	}
	
	window.Game = Game;
})();