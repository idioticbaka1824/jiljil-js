(() => {
	CanvasRenderingContext2D.prototype.drawImage2 = function(my_image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight){
		this.drawImage(my_image, Math.round(sx), Math.round(sy), Math.round(sWidth), Math.round(sHeight), Math.round(dx), Math.round(dy), Math.round(dWidth), Math.round(dHeight))
	} //there were some glitches in the image rendering around the edges that was apparently caused by subpixel rendering, this fixes that
	
	//mod function
	function abs(x){
		return x>0 ? x : -1*x;
	}
	//pythagoras
	function dist2(dx, dy){
		return (dx**2 + dy**2)**0.5;
	}
	
    class GameUI {
        /**
         * @param {HTMLCanvasElement} canvas 
         */
        constructor(canvas, canvas2) {
			if(Math.random()>0.8){document.getElementById('jiljilIcon').href="BITMAP/2.ico";}
            this.canvas = canvas;
            this.ctx = canvas.getContext("2d");
			this.ctx.scale(window.scale, window.scale); //zoom
			this.ctx.imageSmoothingEnabled = false;
            this.game = null;
            this.requested = false;
			
			if ("ontouchstart" in window) {
                this.canvas2 = canvas2;
				this.ctx2 = canvas2.getContext('2d');
				this.ctx.scale(window.scale, window.scale);
				this.ctx.imageSmoothingEnabled = false;
				
				this.bmp_touchUI = new Image();
				this.bmp_touchUI.src = "BITMAP/BMP_TOUCH.png";
				this.bmp_touchUI.addEventListener("load", this.onImageLoad.bind(this));
				
				this.canvas2.addEventListener('touchstart', this.onTouchStart.bind(this));
                this.canvas2.addEventListener('touchmove', this.onTouchMove.bind(this));
                this.canvas2.addEventListener('touchend', this.onTouchEnd.bind(this));
				this.canvas.addEventListener('touchstart', this.onTouchStart.bind(this));
                this.canvas.addEventListener('touchmove', this.onTouchMove.bind(this));
                this.canvas.addEventListener('touchend', this.onTouchEnd.bind(this));
            }
            
            this.bmp_jiljil = new Image();
            this.bmp_jiljil.src = "BITMAP/BMP_JILJIL.png";
            this.bmp_jiljil.addEventListener("load", this.onImageLoad.bind(this));
            this.bmp_escape = new Image();
            this.bmp_escape.src = "BITMAP/BMP_ESCAPE.png";
            this.bmp_escape.addEventListener("load", this.onImageLoad.bind(this));
            this.bmp_charactor = new Image();
            this.bmp_charactor.src = "BITMAP/BMP_CHARACTOR.png";
            this.bmp_charactor.addEventListener("load", this.onImageLoad.bind(this));
			
			this.frameCount = 0;
			
			this.bgm1_url = new URL('https://raadshaikh.github.io/jiljil-js/WAVE/BGM1.wav');
			this.bgm1 = new Audio(this.bgm1_url);
			this.bgm1.crossOrigin = "anonymous";
			this.bgm1_playing = false;
			this.bgm2_url = new URL('https://raadshaikh.github.io/jiljil-js/WAVE/BGM2.wav');
			this.bgm2 = new Audio(this.bgm2_url);
			this.bgm2.crossOrigin = "anonymous";
			this.bgm2_playing = false;
			this.se = [];
			for(let i=0; i<=11; i++){
				this.se[i] = new Audio(new URL('https://raadshaikh.github.io/jiljil-js/WAVE/SE'+String(i+1).padStart(2,'0')+'.wav'))
			}
			
			window.audioContext = new AudioContext();
			this.buffer = 0;
			this.source = 0;
        }
		
        async loadAudio(val) {
			  try {
				const response = await fetch(val==1?this.bgm1_url:this.bgm2_url);
				// Decode it
				this.buffer = await window.audioContext.decodeAudioData(await response.arrayBuffer());
			  } catch (err) {
				console.error(`Unable to fetch the audio file. Error: ${err.message}`);
			  }
		}
        async play_bgm(val){
				await this.loadAudio(val);
				this.source = window.audioContext.createBufferSource();
				this.source.loop = true;
				this.source.buffer = this.buffer;
				this.source.connect(window.audioContext.destination);
				this.source.start();
		}
		async stop_bgm(){
			if(this.source){
				this.bgm1_playing = false;
				this.bgm2_playing = false;
				this.source.stop();
				}
		}
		
        onTouchStart(e) {
			this.hasSinceUpdated = false;
            this.touching = true;
            this.touchX = e.touches[0].clientX - this.canvas2.getBoundingClientRect().x;
            this.touchY = e.touches[0].clientY - this.canvas2.getBoundingClientRect().y;
			this.touchX /= window.scale;
			this.touchY /= window.scale;
			var x = this.touchX - window.width/2;
			var y = -this.touchY + window.height/2;
			var r = dist2(x,y);
			window.keysBeingPressed[' '] = (r<52);
			window.keysBeingPressed['Escape'] = (this.touchX>32-10 && this.touchX<32+32+10 && this.touchY>8-10 && this.touchY<8+32+10); //\pm 10 grace pixels for fat fingering
			window.keysBeingPressed['z'] = (this.touchX>32-10 && this.touchX<32+32+10 && this.touchY>200-10 && this.touchY<200+32+10);
			window.keysBeingPressed['f'] = (e.touches[0].pageX/window.scale>80 && e.touches[0].pageX/window.scale<160 && e.touches[0].pageY/window.scale<100);
			window.keysBeingPressed['g'] = (e.touches[0].pageX/window.scale>160 && e.touches[0].pageX/window.scale<240 && e.touches[0].pageY/window.scale<100);
			window.keysBeingPressed['h'] = (e.touches[0].pageX/window.scale>240 && e.touches[0].pageY/window.scale<100);
        }

        onTouchMove(e) {
            if (this.touching) {
                e.preventDefault();
				window.keysBeingPressed[' '] = false;
                this.touchX = e.touches[0].clientX - this.canvas2.getBoundingClientRect().x;
                this.touchY = e.touches[0].clientY - this.canvas2.getBoundingClientRect().y;
				this.touchX /= window.scale;
				this.touchY /= window.scale;
				var x = this.touchX - window.width/2;
				var y = -this.touchY + window.height/2;
				var r = dist2(x,y);
				var theta = Math.atan2(y,x);
				// console.log(theta*180/Math.PI);
				window.keysBeingPressed['ArrowRight'] = (abs(theta-0)<2*Math.PI*1.5/8);
				window.keysBeingPressed['ArrowUp'] = (abs(theta-Math.PI/2)<2*Math.PI*1.5/8);
				window.keysBeingPressed['ArrowLeft'] = ((abs(theta-Math.PI)<2*Math.PI*1.5/8) || (abs(theta - -Math.PI)<2*Math.PI*1.5/8)); //branch cut at \pm\pi
				window.keysBeingPressed['ArrowDown'] = (abs(theta - -Math.PI/2)<2*Math.PI*1.5/8);
            }
        }

        onTouchEnd() {
            this.touching = false;
            this.touchX = 0;
            this.touchY = 0;
			if(this.hasSinceUpdated){
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
				'z': false,
				};
				this.hasSinceUpdated = false;
			}
        }
        

        onImageLoad() {
            if (this.bmp_jiljil.complete && this.bmp_escape.complete && this.bmp_charactor.complete && (!('ontouchstart' in window) || (('ontouchstart' in window)&&this.bmp_touchUI.complete))) {
                this.onUpdate();
            }
        }
		
        setGame(game) {
            this.game = game;
            this.game.onUpdate = this.draw.bind(this);
        }

        drawNumber(x, y, number, zeroPad = 0, rtl=false) {
            let str = number.toString();
            while (str.length < zeroPad) {
                str = "0" + str;
            }
			if (rtl==false) {
				for (let i = 0; i < str.length; i++) {
					this.ctx.drawImage2(this.bmp_jiljil, (str.charCodeAt(i) - 0x30) * 8, 112, 8, 16, x + 8*i, y, 8, 16);
				}
			}
			else if(rtl==true) //right-to-left, for right-aligned numbers
				for (let i = str.length-1; i >= 0; i--) {
					this.ctx.drawImage2(this.bmp_jiljil, (str.charCodeAt(i) - 0x30) * 8, 112, 8, 16, x - 8*(str.length-i), y, 8, 16);
				}
        }
		
		drawString(x, y, str, zoom=1){
			let newlines = [0];
			for(let i=0; i<str.length; i++){
				if(str[i]=='\n'){newlines.push(i);}
				if(str.charCodeAt(i)>=0x20){
					this.ctx.drawImage2(this.bmp_charactor, 8*((str.charCodeAt(i)-0x20)%10), 8*~~((str.charCodeAt(i)-0x20)/10), 8, 8, x+6*(i-newlines[newlines.length-1]-(newlines.length>1))*zoom, y+8*(newlines.length-1)*zoom, 8*zoom, 8*zoom); //~~ is shortcut for floor function somehow
				}
			}
		}

        onUpdate() {
            if (this.requested) return;
            this.requested = true;
            window.requestAnimationFrame(this.draw.bind(this));
        }

        draw() {
            this.requested = false;

            const { width, height } = this.canvas;
			this.ctx.fillStyle = 'black';
			this.ctx.fillRect(0, 0, width, height);
			
			//touchscreen ui
			if ('ontouchstart' in window) {
				this.ctx2.fillstyle = 'black';
				this.ctx2.fillRect(0, 0, width, height);
				for(let i=0; i<=15; i++){
					// this.ctx2.drawImage2(this.bmp_jiljil, 64, 64, 20, 20, i*20, 0, 20, 20); //ceiling
					// this.ctx2.drawImage2(this.bmp_jiljil, 64, 64, 20, 20, i*20, 240-20, 20, 20); //floor
					this.ctx2.drawImage2(this.bmp_jiljil, 64, 64, 20, 20, 0, i*20, 20, 20); //left wall
					this.ctx2.drawImage2(this.bmp_jiljil, 64, 64, 20, 20, 320-20, i*20, 20, 20); //left wall
				}
				// this.ctx2.drawImage2(this.bmp_touchUI, 0, 0, 320, 240, 0, 0, 320, 240);
				this.ctx2.drawImage2(this.bmp_touchUI, 0, 0, 32, 32, 32, 8, 32, 32); //esc button
				this.ctx2.drawImage2(this.bmp_touchUI, 0, 72, 32, 32, 32, 200, 32, 32); //z button
				this.ctx2.drawImage2(this.bmp_touchUI, 88, 0, 196, 196, 61, 21, 196, 196); //tan circle
				for(let i=0; i<8; i++){ //compass rose
					var x=160+88*Math.cos(i*2*Math.PI/8); //radius is nominally 90 but it was looking a little wonky so slight adjustments here
					var y=120-89*Math.sin(i*2*Math.PI/8);
					var size=i%2?6:9;
					this.ctx2.drawImage2(this.bmp_touchUI, 0, i%2?65:56, size, size, ~~(x-size/2), ~~(y-size/2), size, size);
				}
				if(this.game.gameState!='playing'){
					this.ctx2.drawImage2(this.bmp_touchUI, 32, 0, 56, 56, 132, 92, 56, 56); //space button
				}
				if(this.game.gameState=='playing'){
					this.ctx2.drawImage2(this.bmp_touchUI, 9, 56, 5, 5, 158, 117, 5, 5); //compass centre dot
					this.UIhead_x = 1*window.keysBeingPressed['ArrowRight'] + -1*window.keysBeingPressed['ArrowLeft'];
					this.UIhead_y = 1*window.keysBeingPressed['ArrowUp'] + -1*window.keysBeingPressed['ArrowDown'];
					this.UIhead_x *= 89/(this.UIhead_x&&this.UIhead_y?2**0.5:1);
					this.UIhead_y *= 89/(this.UIhead_x&&this.UIhead_y?2**0.5:1);
					this.UIhead_x = 160+this.UIhead_x-16/2;
					this.UIhead_y = 120-this.UIhead_y-16/2;
					// if(window.keysBeingPressed['ArrowRight']||window.keysBeingPressed['ArrowUp']||window.keysBeingPressed['ArrowLeft']||window.keysBeingPressed['ArrowDown']){
						this.ctx2.drawImage2(this.bmp_jiljil, 0, 0, 16, 16, ~~this.UIhead_x, ~~this.UIhead_y, 16, 16);
					// }
				}
				if(this.game.gameState=='gameover'){
					// if(!(window.keysBeingPressed['ArrowRight']||window.keysBeingPressed['ArrowUp']||window.keysBeingPressed['ArrowLeft']||window.keysBeingPressed['ArrowDown'])){
						// this.UIhead_x = 160-16/2;
						// this.UIhead_y = 120-16/2;
					// }
					if(this.UIhead_x==160-16/2 && this.UIhead_y==120-16/2){
						this.UIhead_y -= 16;
					}
					this.ctx2.drawImage2(this.bmp_jiljil, 64, 16, 16, 16, ~~this.UIhead_x, ~~this.UIhead_y, 16, 16);
				}
					
			}
			
			switch(this.game.gameState) {
				case 'loading':
					this.drawString(130,window.height/2-4,'...LOADED!');
					this.ctx.drawImage2(this.bmp_jiljil, 64, 36, 64, 12, 130, 164, 64, 12); //'Push Space'
					break;
					
				case 'startscreen':
					this.stop_bgm();
					if(this.frameCount==24){this.se[7].play();}
					if(this.frameCount>56){
						this.ctx.drawImage2(this.bmp_jiljil, 88, 64, 36, 20, 124, 50, 36, 20); //'JiL'
						this.ctx.drawImage2(this.bmp_jiljil, 88, 64, 36, 20, 124+36, 50, 36, 20); //'JiL'
					}
					if(this.frameCount==56){this.se[8].play();}
					if(this.frameCount>90){
						this.ctx.drawImage2(this.bmp_jiljil, 80, 24, 48, 8, 137, 119, 48, 8); //'1997-10-xx'
					}
					if(this.frameCount==90){this.se[9].play();}
					if(this.frameCount>125){
						this.ctx.drawImage2(this.bmp_jiljil, 64, 102, 56, 10, 132, 139, 56, 10); //'Tortoiseshell'
					}
					if(this.frameCount==125){this.se[10].play();}
					if(this.frameCount>172){
						this.ctx.drawImage2(this.bmp_jiljil, 64, 36, 64, 12, 130, 164, 64, 12); //'Push Space'
					}
					if(this.frameCount==172){this.se[11].play();}
					this.frameCount += 1;
					break;
				
				case 'playing':	
					if(!this.bgm1_playing){
						this.stop_bgm();
						this.play_bgm(1);
						this.bgm1_playing = true;
					}
					
					// this.ctx.drawImage2(this.bmp_jiljil, 0, 85, 2, 2, this.game.playerCurPos.x-2/2, this.game.playerCurPos.y-2/2, 2, 2); //dot that represents 'player cursor', see jiljil.js for details. comment out when finished
					
					this.frameCount += 1;
					break;
				
				case 'gameover':
					if(!this.bgm2_playing){
						this.stop_bgm();
						this.play_bgm(2);
						this.bgm2_playing = true;
					}
					
					this.ctx.drawImage2(this.bmp_jiljil, 64, 36, 64, 12, 48, 48, 64, 12); //'push space'
					break;
					
				case 'escmenu':
					// this.bgm1.pause();
					// this.bgm2.pause();
					// this.ctx.drawImage2(this.bmp_escape, 0, 0, 80, 16, 8, 8, 80, 16); //pause screen
					this.drawString(0,0,'CONTINUE:F');
					this.drawString(0,8,'RESET   :G');
					this.drawString(0,16,'HELP    :H');
					if ('ontouchstart' in window) {
						this.ctx.drawImage2(this.bmp_touchUI, 0, 104, 68, 68, 90, 14, 68, 68); //bubbles around F, G, H
						this.ctx.drawImage2(this.bmp_touchUI, 0, 104, 68, 68, 90+80*1+2, 14, 68, 68);
						this.ctx.drawImage2(this.bmp_touchUI, 0, 104, 68, 68, 90+80*2+1, 14, 68, 68);
						this.ctx.filter = 'brightness(50%)';
						this.drawString(104,28,'F', 5);
						this.drawString(104+80*1,28,'G', 5);
						this.drawString(104+80*2,28,'H', 5);
						this.ctx.filter = 'none';
					}
					if(this.game.help){
						this.drawString(0,window.height/2,"GOAL: Hit the lemon to earn points, while making\n      sure the pawprints following you don't catch\n      your tail!\n\nPress ESC for pause menu.\nPress Z to toggle 2x zoom.\n\nJiLJiL (c) 1997, Studio Pixel\nBrowser version by IdioticBaka1824");
					}
					break;
					
				default:
					break;
			}
			
			if(this.game.gameState == 'playing' || this.game.gameState == 'gameover'){
				for(let i=1; i<=14; i++){
					this.ctx.drawImage2(this.bmp_jiljil, 64, 64, 20, 20, i*20, 0, 20, 20); //ceiling
					this.ctx.drawImage2(this.bmp_jiljil, 64, 64, 20, 20, i*20, 240-20, 20, 20); //floor
				}
				this.ctx.drawImage2(this.bmp_jiljil, 0, 48, 64, 64, this.game.lemonPos.x-64/2, this.game.lemonPos.y-64/2, 64, 64); //lemon
				for(let i=6; i>=0; i--){ //worm segments
						this.ctx.drawImage2(this.bmp_jiljil, 16*(i+1), 0, 16, 16, this.game.playerSegPos[i].x-16/2, this.game.playerSegPos[i].y-16/2, 16, 16);
				}
				this.ctx.drawImage2(this.bmp_jiljil, 64*(this.game.gameState=='gameover'), 16*(this.game.gameState=='gameover'), 16, 16, this.game.playerPos.x-16/2, this.game.playerPos.y-16/2, 16, 16); //worm head (crying or not depending on gameover)
				this.ctx.drawImage2(this.bmp_jiljil, 0, 16, 32, 32, this.game.paw0Pos.x-32/2, this.game.paw0Pos.y-32/2, 32, 32); //pawprints
				this.ctx.drawImage2(this.bmp_jiljil, 32, 16, 32, 32, this.game.paw1Pos.x-32/2, this.game.paw1Pos.y-32/2, 32, 32); //pawprints
				if(this.game.gameState=='playing'){//sparkle
					this.ctx.drawImage2(this.bmp_jiljil, 64+16*(this.game.sparkleFrame), 48, 16, 16, this.game.sparklePos.x-16/2, this.game.sparklePos.y-16/2, 16, 16);
				}
				this.ctx.drawImage2(this.bmp_jiljil, 63, 94, 24, 8, 20, 211, 24, 8); //'teema:'
				this.ctx.drawImage2(this.bmp_jiljil, 64, 84, 64, 8, 48, 211, 64, 8); //'shippo ga abunai'
				this.ctx.drawImage2(this.bmp_jiljil, 80, 16, 48, 8, 140, 223, 48, 8); //'esc->exit'
				this.ctx.drawImage2(this.bmp_jiljil, 80, 120, 48, 8, 225, 211, 48, 8); //'score'
				this.ctx.drawImage2(this.bmp_jiljil, 80, 120, 48, 8, 225, 20, 48, 8); //'score'
				this.ctx.drawImage2(this.bmp_jiljil, 80, 112, 18, 8, 207, 21, 18, 8); //'hi'
				this.drawNumber(275, 203, this.game.score, 3); //score
				this.drawNumber(275, 20, this.game.highscore, 3); //high score
				
				//touchscreen ui
				if ('ontouchstart' in window) {
					var doNothing = 0;
				}
				
			}
			if(this.game.gameState == 'gameover'){this.ctx.drawImage2(this.bmp_jiljil, 64, 36, 64, 12, 48, 48, 64, 12);}
        }
    }

    window.GameUI = GameUI;
	
})();