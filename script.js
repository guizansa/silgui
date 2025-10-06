const video = document.querySelector('#webcam');
const canvas = document.querySelector('#tela');
const contexto = canvas.getContext('2d');
const botaoLigar = document.querySelector('#ligar');
const botaoCapturar = document.querySelector('#capturar');
const botaoDesligar = document.querySelector('#desligar');
const feedback = document.querySelector('#feedback');
const modo = document.querySelector('#modo');
const filtro = document.querySelector('#filtro');
const adesivos = document.querySelectorAll('.adesivo');
const botaoBaixar = document.querySelector('#baixar');
const videoGravado = document.querySelector('#gravado');
const downloadVideo = document.querySelector('#downloadVideo');

let stream;
let mediaRecorder;
let chunks = [];
let urlVideo;
let adesivosAtivos = [];

// Função para desenhar o vídeo + filtros + adesivos no canvas em tempo real
function atualizarCanvas() {
  if (!stream) return;
  contexto.clearRect(0, 0, canvas.width, canvas.height);
  contexto.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Aplicar adesivos ativos
  adesivosAtivos.forEach(sticker => {
    contexto.drawImage(sticker.img, sticker.x, sticker.y, 80, 80);
  });

  // Aplicar filtro CSS equivalente no canvas
  if (filtro.value === 'preto-e-branco') {
    contexto.fillStyle = 'rgba(0,0,0,0.3)';
    contexto.globalCompositeOperation = 'color';
    contexto.filter = 'grayscale(100%)';
  } else if (filtro.value === 'sepia') {
    contexto.filter = 'sepia(100%)';
  } else {
    contexto.filter = 'none';
  }

  requestAnimationFrame(atualizarCanvas);
}

// Ligar câmera
botaoLigar.addEventListener('click', async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: modo.value === 'video' });
    video.srcObject = stream;
    await video.play();
    feedback.textContent = 'Câmera ligada.';
    atualizarCanvas();
  } catch (erro) {
    feedback.textContent = 'Erro ao acessar a câmera.';
  }
});

// Adesivos clicáveis
adesivos.forEach(img => {
  img.addEventListener('click', () => {
    adesivosAtivos.push({ img: img, x: Math.random() * 400, y: Math.random() * 250 });
    feedback.textContent = 'Adesivo adicionado!';
  });
});

// Capturar foto ou iniciar/parar vídeo
botaoCapturar.addEventListener('click', () => {
  if (modo.value === 'foto') {
    // Foto já está no canvas ao vivo
    feedback.textContent = 'Foto capturada!';
  } else {
    // Vídeo: gravar a stream do canvas
    if (!mediaRecorder) {
      chunks = [];
      const canvasStream = canvas.captureStream(30); // 30fps
      if (modo.value === 'video') {
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length > 0) canvasStream.addTrack(audioTracks[0]);
      }

      mediaRecorder = new MediaRecorder(canvasStream);
      mediaRecorder.ondataavailable = e => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        urlVideo = URL.createObjectURL(blob);
        videoGravado.src = urlVideo;
        videoGravado.style.display = 'block';
        downloadVideo.style.display = 'inline-block';
      };
      mediaRecorder.start();
      feedback.textContent = 'Gravando vídeo...';
      botaoCapturar.textContent = 'Parar Gravação';
    } else {
      mediaRecorder.stop();
      feedback.textContent = 'Gravação finalizada.';
      botaoCapturar.textContent = 'Capturar';
      mediaRecorder = null;
    }
  }
});

// Desligar câmera
botaoDesligar.addEventListener('click', () => {
  if (stream) stream.getTracks().forEach(track => track.stop());
  stream = null;
  video.srcObject = null;
  videoGravado.style.display = 'none';
  canvas.style.display = 'block';
  contexto.clearRect(0, 0, canvas.width, canvas.height);
  adesivosAtivos = [];
  feedback.textContent = 'Câmera desligada.';
});

// Baixar foto
botaoBaixar.addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'foto_estudio.png';
  link.href = canvas.toDataURL();
  link.click();
});

// Baixar vídeo
downloadVideo.addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = urlVideo;
  a.download = 'video_estudio.webm';
  a.click();
});