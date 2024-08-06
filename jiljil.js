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
        constructor(data=null) {
			this.gameState = 'loading'; //loading, startscreen, playing, escmenu, gameover
			this.previousGameState = 'startscreen';
			this.keyHasBeenPressed = {horizontal:0, vertical:0};
			
			this.score = 0;
			this.highscore = 0;
			
			this.justStartedPlaying = true;
			
			this.playerPos = {x:window.width/2, y:window.height-20-16/2};
			this.playerVel = {x:0, y:0};
			this.playerAcc = {x:0, y:0};
			this.playerMaxVel = 2;
			this.playerMaxAcc = 1;
			this.playerMass = 1;
			this.playerCurPos = {x:window.width/2, y:window.height-20-16/2};
			this.playerCurVel = 3;
			this.player_dt = 0.05;
			this.player_w0 = 5;
			this.playerSeg_dt = 0.05;
			this.playerSeg_zeta = 0.5; //the segments are a bit underdamped
			this.playerSeg_w0 = 6; //wonder if these parameters need to be unique to each segment
			this.sparkle_dt = 0.05;
			this.sparkle_w0 = 1;
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
			this.lemonAcc = {x:0, y:0};
			this.lemonMass = 30;
			
			this.paw0Pos = {x:146, y:211};
			this.paw1Pos = {x:186, y:216};
			this.pawPeriod = 32; //in frames
			this.respiteFrames = 64;
			
			this.friction = 0.05; //applies to player
			this.gravity = 0.1; //applies to lemon
			this.corLP = 0.5; //coefficient of restitution, applies to lemon-player interaction
			this.corLW = 0.95; //coefficient of restitution, applies to lemon-wall interaction
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
			this.sparkleVel = {x:0, y:0};
			this.sparkleAcc = {x:0, y:0};
			this.lemonPos = {x:72+48/2, y:16+48/2};
			this.lemonVel = {x:0.5, y:0};
			this.lemonAcc = {x:0, y:0};
			this.paw0Pos = {x:146, y:211};
			this.paw1Pos = {x:186, y:216};
			ui.frameCount = 0;
		}
		
        update() {
			
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
						this.playerCurPos.y -= this.playerCurVel;
					}
					
					//collisions
					
					//playerTail-pawPrint
					if(ui.frameCount>this.respiteFrames){
						if((abs(this.playerSegPos[6].x-this.paw0Pos.x)<32/2 && abs(this.playerSegPos[6].y-this.paw0Pos.y)<32/2) || (abs(this.playerSegPos[6].x-this.paw1Pos.x)<32/2 && abs(this.playerSegPos[6].y-this.paw1Pos.y)<32/2)){
							ui.se[5].play();
							if(this.score > this.highscore){this.highscore = this.score;}
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
						this.playerVel.x *= -2;
						this.playerVel.x += 2*(this.playerVel.x ? this.playerVel.x < 0 ? -1 : 1 : 0) //stuff in brackets is signum function. basically add a bit to the velocity so that if it's nearly zero, there should still be some bounce
						this.playerPos.x = clamp(this.playerPos.x, 20+16/2, window.width-20-16/2);
						this.playerCurPos.x = clamp(this.playerPos.x, 20+16/2, window.width-20-16/2);
						ui.se[3].play();
					}
					if((this.playerPos.y < 20+16/2 && this.playerVel.y<0) || (this.playerPos.y > window.height-20-16/2 && this.playerVel.y>0)){
						this.playerVel.y *= -2;
						this.playerVel.y += 2*(this.playerVel.y ? this.playerVel.y < 0 ? -1 : 1 : 0)
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
					const dx = this.lemonPos.x-this.playerPos.x;
					const dy = this.lemonPos.y-this.playerPos.y;
					const dvx = this.playerVel.x-this.lemonVel.x;
					const dvy = this.playerVel.y-this.lemonVel.y;
					const r = dist2(dx, dy);
					const k1 = (this.playerMass - this.lemonMass)/(this.playerMass + this.lemonMass);
					const k2 = 2*this.playerMass/(this.playerMass + this.lemonMass);
					const v1 = structuredClone(this.playerVel);
					const v2 = structuredClone(this.lemonVel);
					const approachAngle = angle(dx, dy, dvx, dvy);
					const headonV1 = this.corLP*dist2(v1.x,v1.y)*Math.cos(approachAngle);
					const glanceV1 = dist2(v1.x,v1.y)*Math.sin(approachAngle);
					if((r<(48/2 + 16/2)) && (dot(dx, dy, dvx, dvy)>0)){
						this.playerVel.x = k1*headonV1*dx/r + glanceV1*dy/r + v2.x;
						this.playerVel.y = k1*headonV1*dy/r + glanceV1*dx/r + v2.y;
						this.lemonVel.x = k2*headonV1*dx/r - v2.x; //something's not right here??
						this.lemonVel.y = k2*headonV1*dy/r - v2.y;
						this.playerPos.x = this.lemonPos.x-(48/2+16/2)*dx/r;
						this.playerPos.y = this.lemonPos.y-(48/2+16/2)*dy/r;
						this.playerCurPos.x = this.lemonPos.x-(48/2+18/2)*dx/r;
						this.playerCurPos.y = this.lemonPos.y-(48/2+18/2)*dy/r;
						this.score += 1;
						ui.se[0].play();
					}
					
					//old stuff
					// if((this.playerPos.x+16/2 > this.lemonPos.x-48/2) && (Math.abs(this.playerPos.y-this.lemonPos.y) < 16/2+48/2) && (this.playerVel.x>0)){
						// this.score++;
						// this.playerVel.x *= -1;
						// this.playerPos.x = clamp(this.playerPos.x, 20+16/2, this.lemonPos.x-48/2);
					// }
					
					//player-pawprint
					//put code here
					
					
					//player input
						//old stuff
						// this.playerAcc.x += 0.1*this.keyHasBeenPressed.horizontal;
						// this.playerAcc.x *= Math.abs(this.keyHasBeenPressed.horizontal); //reset acceleration to 0 when no key is pressed
						// this.playerVel.x = clamp(this.playerVel.x, -this.playerMaxVel, this.playerMaxVel);
						// this.playerVel.x += this.playerAcc.x - this.friction*Math.sign(this.playerVel.x);
						// this.playerPos.x += this.playerVel.x;
					//A virtual 'cursor' controls the ultimate position of the player's head, which takes some time to catch up. Modeled as a critically damped oscillator.
					this.playerCurPos.x += this.playerCurVel*this.keyHasBeenPressed.horizontal;
					this.playerAcc.x = -(this.player_w0**2)*(this.playerPos.x - this.playerCurPos.x) + -2*this.player_w0*(this.playerVel.x);
					this.playerVel.x += this.player_dt*this.playerAcc.x;
					this.playerPos.x += this.player_dt*this.playerVel.x;
					
					this.playerCurPos.y += this.playerCurVel*this.keyHasBeenPressed.vertical;
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
					this.lemonVel.x += this.lemonAcc.x;
					this.lemonPos.x += this.lemonVel.x;
					this.lemonVel.y += this.gravity; //in computers, +y is downward
					this.lemonPos.y += this.lemonVel.y;
					
					//pawprint movement
					if(ui.frameCount>this.respiteFrames){//they're inactive for a bit at the beginning
						if(ui.frameCount % this.pawPeriod == 0){
					// console.log(ui.frameCount);
							switch((ui.frameCount/this.pawPeriod)%4){
								case 0:
									this.paw0Pos = {x:window.width*2, y:window.height*2}; //move it off-screen so it 'disappears'
									break;
								case 1:
									this.paw0Pos = {x:0, y:0};
									break;
								case 2:
									this.paw1Pos = {x:window.width*2, y:window.height*2};
									break;
								case 3:
									this.paw1Pos = {x:0, y:0};
									break;
								default:
									break;
							}
						}
					}
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
					break;
			}
		}
		
	}
	
	window.Game = Game;
})();