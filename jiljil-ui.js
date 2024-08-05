(() => {
    class GameUI {
        /**
         * @param {HTMLCanvasElement} canvas 
         */
        constructor(canvas) {
            this.canvas = canvas;
            this.ctx = canvas.getContext("2d");
			this.ctx.scale(window.scale, window.scale); //zoom
			this.ctx.imageSmoothingEnabled = false;
            this.game = null;
            this.requested = false;

            this.canvas.addEventListener("wheel", this.onScroll.bind(this));
            if ("ontouchstart" in window) {
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
			
			
			const bgm1_url = new URL('https://raadshaikh.github.io/jiljil-js/WAVE/BGM1.wav');
			this.bgm1 = new Audio(bgm1_url);
			// this.bgm1.crossOrigin = "anonymous";
			this.bgm1_playing = false;
			this.bgm1.loop = true;
			this.bgm2 = new Audio('WAVE/BGM2.wav');
			this.bgm1.crossOrigin = "anonymous";
			this.bgm2.loop = true;
			
			
        }
        
        
        onTouchStart(e) {
            this.touching = true;
            this.touchX = e.touches[0].pageX;
            this.touchY = e.touches[0].pageY;
        }

        onTouchMove(e) {
            if (this.touching) {
                e.preventDefault();
                //const offX = this.touchX - e.touches[0].pageX;
                const offY = this.touchY - e.touches[0].pageY;
                this.touchX = e.touches[0].pageX;
                this.touchY = e.touches[0].pageY;

                this.onScroll({ deltaY: offY });
            }
        }

        onTouchEnd() {
            this.touching = false;
            this.touchX = 0;
            this.touchY = 0;
        }

        onScroll(e) {
            this.scrollY += e.deltaY;
            this.onUpdate();
        }
        

        onImageLoad() {
            if (this.bmp_jiljil.complete && this.bmp_escape.complete && this.bmp_charactor.complete) {
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
					this.ctx.drawImage(this.bmp_jiljil, (str.charCodeAt(i) - 0x30) * 8, 112, 8, 16, x + 8*i, y, 8, 16);
				}
			}
			else if(rtl==true) //right-to-left, for right-aligned numbers
				for (let i = str.length-1; i >= 0; i--) {
					this.ctx.drawImage(this.bmp_jiljil, (str.charCodeAt(i) - 0x30) * 8, 112, 8, 16, x - 8*(str.length-i), y, 8, 16);
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
			
			if(this.game.gameState == 'playing' || this.game.gameState == 'gameover'){
				for(let i=1; i<=14; i++){
					this.ctx.drawImage(this.bmp_jiljil, 64, 64, 20, 20, i*20, 0, 20, 20);
					this.ctx.drawImage(this.bmp_jiljil, 64, 64, 20, 20, i*20, 240-20, 20, 20);
				}
				this.ctx.drawImage(this.bmp_jiljil, 80, 16, 48, 8, 140, 223, 48, 8);
				this.ctx.drawImage(this.bmp_jiljil, 80, 120, 48, 8, 225, 211, 48, 8);
				this.ctx.drawImage(this.bmp_jiljil, 80, 120, 48, 8, 225, 20, 48, 8);
				this.ctx.drawImage(this.bmp_jiljil, 80, 112, 18, 8, 207, 21, 18, 8);
				this.drawNumber(275, 203, this.game.score, 3);
				this.drawNumber(275, 20, this.game.highscore, 3);
				
				this.ctx.drawImage(this.bmp_jiljil, 0, 48, 64, 64, this.game.lemonPos.x-64/2, this.game.lemonPos.y-64/2, 64, 64);
			}
			
			switch(this.game.gameState) {
				case 'loading':
					// code block
					break;
					
				case 'startscreen':
					this.ctx.drawImage(this.bmp_jiljil, 88, 64, 36, 20, 124, 50, 36, 20);
					this.ctx.drawImage(this.bmp_jiljil, 88, 64, 36, 20, 124+36, 50, 36, 20);
					break;
				
				case 'playing':	
					// this.bgm2.pause();
					// this.bgm2.currentTime=0;
					// this.bgm1.play();
					
					if(!this.audioContext){
						this.audioContext = new AudioContext();
					}
					if(!this.bgm1_node){
						this.bgm1_node = this.audioContext.createMediaElementSource(this.bgm1);
						this.bgm1_node.loop=true;
					}
					if(!this.bgm1_playing){
						this.bgm1_node.connect(this.audioContext.destination);
						this.bgm1_playing=true;
					}
					
					this.ctx.drawImage(this.bmp_jiljil, 0, 85, 2, 2, this.game.playerCurPos.x-2/2, this.game.playerCurPos.y-2/2, 2, 2);
					this.ctx.drawImage(this.bmp_jiljil, 0, 0, 16, 16, this.game.playerPos.x-16/2, this.game.playerPos.y-16/2, 16, 16);
					break;
				
				case 'gameover':
					// this.bgm1.pause();
					// this.bgm1.currentTime=0;
					// this.bgm2.play();
					this.ctx.drawImage(this.bmp_jiljil, 64, 16, 16, 16, this.game.playerPos.x-16/2, this.game.playerPos.y-16/2, 16, 16);
					this.ctx.drawImage(this.bmp_jiljil, 64, 36, 64, 12, 48, 48, 64, 12);					
					break;
					
				case 'escmenu':
					// this.bgm1.pause();
					// this.bgm2.pause();
					this.ctx.drawImage(this.bmp_escape, 0, 0, 80, 24, 8, 8, 80, 24);
					break;
					
				default:
					break;
			}

        }
    }

    window.GameUI = GameUI;
	
})();