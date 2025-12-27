document.addEventListener('DOMContentLoaded', () => {
	
    const qrCanvas = document.getElementById('qr-canvas');
    const ctx = qrCanvas.getContext('2d');
    const qrText = document.getElementById('qr-text');
    const generateBtn = document.getElementById('generate-btn');
    const saveBtn = document.getElementById('save-btn');
    const statusMsg = document.getElementById('status-msg');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const inputCustom = document.getElementById('input-area-custom');
    const inputRandom = document.getElementById('input-area-random');
    const randomLengthInput = document.getElementById('random-length');
    const timerCheck = document.getElementById('timer-mode');
    const timerSeconds = document.getElementById('timer-seconds');
    const stopTimerBtn = document.getElementById('stop-timer-btn');
    let timerInterval = null;

    const logoInput = document.getElementById('logo-input');
    const removeLogoBtn = document.getElementById('remove-logo-btn');
    const footerInput = document.getElementById('footer-text');
    const frameColorSelect = document.getElementById('frame-color-select');
    const invertColorCheck = document.getElementById('invert-color'); 
    let currentLogoImg = null;

    const modal = document.getElementById('cropper-modal');
    const cropperImg = document.getElementById('cropper-img');
    const cropConfirmBtn = document.getElementById('crop-confirm');
    const cropCancelBtn = document.getElementById('crop-cancel');
    let cropper = null;

    const historyList = document.getElementById('history-list');
    let historyData = [];

    let currentMode = 'custom'; 
    const SCALE = 4;
    const BASE_SIZE = 300;

    qrCanvas.width = BASE_SIZE * SCALE;
    qrCanvas.height = BASE_SIZE * SCALE;

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMode = btn.dataset.mode;
            
            if (currentMode === 'custom') {
                inputCustom.style.display = 'flex';
                inputRandom.style.display = 'none';
            } else {
                inputCustom.style.display = 'none';
                inputRandom.style.display = 'flex';
            }
        });
    });

    timerCheck.addEventListener('change', (e) => {
        timerSeconds.disabled = !e.target.checked;
    });

    generateBtn.addEventListener('click', () => {
        if (currentMode === 'random' && timerCheck.checked) {
            startTimer();
        } else {
            createQR(true); 
        }
    });

    stopTimerBtn.addEventListener('click', stopTimer);

    logoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (evt) => {
                cropperImg.src = evt.target.result;
                modal.style.display = 'flex';
                if (cropper) cropper.destroy();
                cropper = new Cropper(cropperImg, {
                    aspectRatio: 1, 
                    viewMode: 1,
                    autoCropArea: 0.8,
                });
            };
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    });

    cropCancelBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        if (cropper) cropper.destroy();
    });

    cropConfirmBtn.addEventListener('click', () => {
        const canvas = cropper.getCroppedCanvas({
            width: 200, 
            height: 200
        });
        currentLogoImg = new Image();
        currentLogoImg.src = canvas.toDataURL();
        currentLogoImg.onload = () => {
            modal.style.display = 'none';
            if (cropper) cropper.destroy();
            removeLogoBtn.style.display = 'inline-block';
            if (statusMsg.textContent !== '未生成') createQR(false); 
        };
    });

    removeLogoBtn.addEventListener('click', () => {
        currentLogoImg = null;
        removeLogoBtn.style.display = 'none';
        if (statusMsg.textContent !== '未生成') createQR(false);
    });

    const updatePreview = () => {
        if (statusMsg.textContent !== '未生成') createQR(false);
    };

    footerInput.addEventListener('input', updatePreview);
    frameColorSelect.addEventListener('change', updatePreview);
    invertColorCheck.addEventListener('change', updatePreview);

    saveBtn.addEventListener('click', () => {
        const name = prompt('保存するファイル名を入力してください', 'qrcode');
        if (name) {
            const link = document.createElement('a');
            link.download = name + '.png';
            link.href = qrCanvas.toDataURL('image/png');
            link.click();
        }
    });

    function startTimer() {
        createQR(true);
        const sec = parseInt(timerSeconds.value, 10) * 1000;
        
        generateBtn.style.display = 'none';
        stopTimerBtn.style.display = 'inline-block';
        
        timerInterval = setInterval(() => {
            createQR(true);
        }, sec);
    }

    function stopTimer() {
        clearInterval(timerInterval);
        generateBtn.style.display = 'inline-block';
        stopTimerBtn.style.display = 'none';
    }

    function generateRandomString(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    function createQR(saveToHistory = true) {
        let text = '';
        
        if (currentMode === 'custom') {
            text = qrText.value || ' ';
        } else {
            if (!saveToHistory && qrText.dataset.lastRandom) {
                text = qrText.dataset.lastRandom;
            } else {
                const len = parseInt(randomLengthInput.value, 10);
                text = generateRandomString(len);
                qrText.dataset.lastRandom = text; 
            }
        }

        const qrContentSize = BASE_SIZE * SCALE; 
        const footerText = footerInput.value.trim();
        
        const PADDING_VAL = 10 * SCALE;
        const FRAME_VAL   = 15 * SCALE;
        const TEXT_H_VAL  = 25 * SCALE;
        const extraSpace = footerText ? TEXT_H_VAL : 0; 
        const frameColor = frameColorSelect.value;
        const hasFrame = frameColor !== 'none';
        const isInvert = invertColorCheck.checked;
        const bgColor = isInvert ? '#000000' : '#ffffff';
        const qrColor = isInvert ? '#ffffff' : '#000000';        
        const padding = PADDING_VAL; 
        const frameThickness = hasFrame ? FRAME_VAL : 0;
        const totalWidth = qrContentSize + (padding * 2) + (frameThickness * 2) + (extraSpace * 2);        
        const totalHeight = qrContentSize + (padding * 2) + (frameThickness * 2) + (extraSpace * 2);
        const qr = new QRious({
            value: text,
            size: qrContentSize,
            level: 'H',
            foreground: qrColor,
            backgroundAlpha: 0 
        });

        qrCanvas.width = totalWidth;
        qrCanvas.height = totalHeight;
        
        ctx.fillStyle = hasFrame ? frameColor : bgColor;
        ctx.fillRect(0, 0, totalWidth, totalHeight);

        ctx.fillStyle = bgColor;
        const innerX = frameThickness;
        const innerY = frameThickness;
        const innerW = totalWidth - (frameThickness * 2);
        const innerH = totalHeight - (frameThickness * 2);
        
        ctx.fillRect(innerX, innerY, innerW, innerH);

        const tempImg = new Image();
        tempImg.src = qr.toDataURL();
        tempImg.onload = () => {
            const qrX = frameThickness + padding + extraSpace;
            const qrY = frameThickness + padding + extraSpace;

            ctx.drawImage(tempImg, qrX, qrY);

            if (currentLogoImg) {
                const logoSize = qrContentSize * 0.25; 
                const logoPos = (qrContentSize - logoSize) / 2;
                const drawX = qrX + logoPos;
                const drawY = qrY + logoPos;
                
                const borderSize = 4 * SCALE;
                ctx.fillStyle = bgColor; 
                ctx.fillRect(
                    drawX - (borderSize/2), 
                    drawY - (borderSize/2), 
                    logoSize + borderSize, 
                    logoSize + borderSize
                );
                
                ctx.drawImage(currentLogoImg, drawX, drawY, logoSize, logoSize);
            }

            if (footerText) {
                const fontSize = 14 * SCALE;
                ctx.font = `${fontSize}px Arial`;
                ctx.fillStyle = qrColor;
                ctx.textAlign = 'right';
                ctx.textBaseline = 'middle';
                
                const textMarginRight = frameThickness + (10 * SCALE);
                
                const footerCenterY = totalHeight - frameThickness - (extraSpace / 2);

                ctx.fillText(footerText, totalWidth - textMarginRight, footerCenterY);
            }

            verifyQR(text);

            if (saveToHistory) {
                addToHistory(text, qrCanvas.toDataURL());
            }
        };
    }

    function verifyQR(expectedText) {
        const imageData = ctx.getImageData(0, 0, qrCanvas.width, qrCanvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "attemptBoth"
        });

        if (code) {
            if (code.data === expectedText) {
                statusMsg.textContent = '読み取り確認OK';
                statusMsg.className = 'status-box ok';
            } else {
                statusMsg.textContent = 'データ不一致';
                statusMsg.className = 'status-box error';
            }
        } else {
            statusMsg.textContent = '実機で確認してください';
            statusMsg.className = 'status-box waiting';
        }
    }

    function addToHistory(text, imgData) {
        const newItem = { text: text, img: imgData };
        historyData.unshift(newItem); 
        if (historyData.length > 5) historyData.pop(); 
        renderHistory();
    }

    function renderHistory() {
        historyList.innerHTML = '';
        if (historyData.length === 0) {
            historyList.innerHTML = '<p class="empty-msg">履歴はありません</p>';
            return;
        }

        historyData.forEach((item) => {
            const div = document.createElement('div');
            div.className = 'history-item';
            
            const img = document.createElement('img');
            img.src = item.img;
            img.className = 'history-thumb';
            img.style.background = '#ccc';

            const txt = document.createElement('span');
            txt.textContent = item.text.length > 15 ? item.text.substring(0, 15) + '...' : item.text;

            div.appendChild(img);
            div.appendChild(txt);

            div.addEventListener('click', () => {
                loadHistoryToCanvas(item);
            });

            historyList.appendChild(div);
        });
    }

    function loadHistoryToCanvas(item) {
        const img = new Image();
        img.src = item.img;
        img.onload = () => {
            qrCanvas.width = img.width;
            qrCanvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            statusMsg.textContent = '履歴から表示中';
            statusMsg.className = 'status-box waiting';
            
            if (currentMode === 'custom') {
                qrText.value = item.text;
            }
        };
    }
});
