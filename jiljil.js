(() => {
	
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
			this.gameState = 'startscreen'; //loading, startscreen, playing, escmenu, gameover
			this.previousGameState = 'startscreen';
			this.keyHasBeenPressed = {horizontal:0, vertical:0};
			
			this.score = 0;
			this.highscore = 0;
			
			this.playerPos = {x:window.width/2, y:window.height-20-16/2};
			this.playerVel = {x:0, y:0};
			this.playerAcc = {x:0, y:0};
			this.playerMaxVel = 2;
			this.playerMaxAcc = 1;
			this.playerMass = 1;
			this.playerCurVel = 3;
			this.player_dt = 0.05;
			this.player_w0 = 5;
			
			this.lemonPos = {x:72+48/2, y:16+48/2};
			this.lemonVel = {x:0.5, y:0};
			this.lemonAcc = {x:0, y:0};
			this.lemonMass = 20;
			
			
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
			this.lemonPos = {x:72+48/2, y:16+48/2};
			this.lemonVel = {x:0.5, y:0};
			this.lemonAcc = {x:0, y:0};
		}
		
        update() {
			
			this.keyHandling(window.keysBeingPressed);
			
			switch(this.gameState){
				
				case 'loading':
					break;
				
				case 'startscreen':
					break;
				
				case 'playing':
					// console.log(this.playerPos, this.playerVel, this.playerAcc, this.keyHasBeenPressed);
					
					//collisions
					
					//player-wall
					if((this.playerCurPos.x < 20) || (this.playerCurPos.x > window.width-20)){
						this.playerCurPos.x = clamp(this.playerCurPos.x, 20, window.width-20);
					}
					if((this.playerCurPos.y < 20) || (this.playerCurPos.y > window.height-20)){
						this.playerCurPos.y = clamp(this.playerCurPos.y, 20, window.height-20);
					}
					if((this.playerPos.x < 20+16/2 && this.playerVel.x<0) || (this.playerPos.x > window.width-20-16/2 && this.playerVel.x>0)){
						this.playerVel.x *= -1;
						this.playerPos.x = clamp(this.playerPos.x, 20+16/2, window.width-20-16/2);
					}
					if((this.playerPos.y < 20+16/2 && this.playerVel.y<0) || (this.playerPos.y > window.height-20-16/2 && this.playerVel.y>0)){
						this.playerVel.y *= -1;
						this.playerPos.y = clamp(this.playerPos.y, 20+16/2, window.height-20-16/2);
					}
					
					//lemon-wall
					if((this.lemonPos.y < 20+48/2 && this.lemonVel.y<0) || (this.lemonPos.y > window.height-20-48/2 && this.lemonVel.y>0)){
						this.lemonVel.y *= -1*this.corLW;
						this.lemonPos.y = clamp(this.lemonPos.y, 20+48/2, window.height-20-48/2);
					}
					if((this.lemonPos.x < 20+48/2 && this.lemonVel.x<0) || (this.lemonPos.x > window.width-20-48/2 && this.lemonVel.x>0)){
						this.lemonVel.x *= -1*this.corLW;
						this.lemonPos.x = clamp(this.lemonPos.x, 20+48/2, window.width-20-48/2);
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
						this.score += 1;
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
					
					this.keyHasBeenPressed = {horizontal:0, vertical:0};
					
					//lemon bouncing
					this.lemonVel.x += this.lemonAcc.x;
					this.lemonPos.x += this.lemonVel.x;
					this.lemonVel.y += this.gravity; //in computers, +y is downward
					this.lemonPos.y += this.lemonVel.y;
					
					break;
				
				case 'gameover':
					break;
				
				case 'escmenu':
					break;
			}
			if (this.onUpdate) this.onUpdate(this);
			
		}
		
		keyHandling(ekeys) {
			if(ekeys['Escape']){
				if(this.gameState != 'escmenu'){
					this.gameState = 'escmenu';
					ekeys['Escape'] = false;
				}
			}
			switch(this.gameState){
				case 'startscreen':
					if(ekeys[' ']){
						this.resetStuff();
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
						this.gameState = 'gameover';
						this.previousGameState = 'gameover';
					}
					
					// if(ekeys['p']){
						// let ctx = new AudioContext();
						// let source = ctx.createMediaElementSource(ui.bgm1);
						// source.connect(ctx.destination);
					// }
					break;
				
				case 'gameover':
					if(ekeys[' ']){
						this.resetStuff();
						this.gameState = 'playing';
						this.previousGameState = 'playing';
					}
					break;
				
				case 'escmenu':
					if(ekeys['f']){ //temporary. change to F1 later
						this.gameState = this.previousGameState;
					}
					if(ekeys['g']){ //temporary. change to F2 later
						this.gameState = 'startscreen';
						this.previousGameState = 'startscreen';
					}
					if(ekeys['Escape']){ //can't really close the browser window, so replicate 'reset' behaviour
						this.gameState = 'startscreen';
						this.previousGameState = 'startscreen';
						ekeys['Escape'] = false;
					}
					break;
			}
		}
		
	}
	
	window.Game = Game;
})();