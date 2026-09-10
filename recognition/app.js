document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const video = document.getElementById('webcam');
  const canvas = document.getElementById('face-canvas');
  const btnCamera = document.getElementById('btn-camera');
  const btnRegister = document.getElementById('btn-register-face');
  const aiStatus = document.getElementById('ai-status');
  const faceFeedback = document.getElementById('face-feedback');
  const regMsg = document.getElementById('reg-msg');
  const scanLaser = document.querySelector('.scan-laser');

  const recoLabel = document.getElementById('reco-label');
  const recoName = document.getElementById('reco-name');

  const studentNameInput = document.getElementById('student-name');
  const studentsGallery = document.getElementById('students-gallery');
  const dbCountBadge = document.getElementById('db-count-badge');
  const liveClock = document.getElementById('live-clock');

  const galleryModal = document.getElementById('gallery-modal');
  const btnOpenGallery = document.getElementById('btn-open-gallery');
  const btnCloseGallery = document.getElementById('btn-close-gallery');

  // Inline SVG fallback avatar (No external image network requests required)
  const DEFAULT_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='%2338bdf8'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/></svg>";

  let isModelLoaded = false;
  let isCameraRunning = false;
  let faceMatcher = null;
  let registeredStudents = [];

  // 1. Live Clock
  setInterval(() => {
    const now = new Date();
    liveClock.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }, 1000);

  // 2. Modal Handlers
  btnOpenGallery.addEventListener('click', () => galleryModal.classList.add('active'));
  btnCloseGallery.addEventListener('click', () => galleryModal.classList.remove('active'));
  galleryModal.addEventListener('click', (e) => {
    if (e.target === galleryModal) galleryModal.classList.remove('active');
  });

  // 3. Load face-api.js Models
  async function initFaceApi() {
    aiStatus.textContent = 'Loading AI Models...';
    try {
      const MODEL_CDN = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_CDN),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_CDN),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_CDN)
      ]);
      isModelLoaded = true;
      aiStatus.textContent = 'AI Models Ready';
      aiStatus.style.background = 'rgba(16, 185, 129, 0.2)';
      aiStatus.style.color = '#10b981';

      loadStudentsFromDatabase();
    } catch (e) {
      console.warn('Error loading models, trying fallback...', e);
      try {
        const FALLBACK_CDN = 'https://raw.githubusercontent.com/vladmandic/face-api/master/model/';
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(FALLBACK_CDN),
          faceapi.nets.faceLandmark68Net.loadFromUri(FALLBACK_CDN),
          faceapi.nets.faceRecognitionNet.loadFromUri(FALLBACK_CDN)
        ]);
        isModelLoaded = true;
        aiStatus.textContent = 'AI Models Ready';
        aiStatus.style.background = 'rgba(16, 185, 129, 0.2)';
        aiStatus.style.color = '#10b981';
        loadStudentsFromDatabase();
      } catch (err2) {
        aiStatus.textContent = 'AI Model Load Error';
        aiStatus.style.color = '#ef4444';
      }
    }
  }

  initFaceApi();

  // 4. Load Registered Students & Face Descriptors directly from MySQL Database
  async function loadStudentsFromDatabase() {
    try {
      const res = await fetch('get_students.php');
      const data = await res.json();

      if (data.success) {
        registeredStudents = data.students || [];
        dbCountBadge.textContent = registeredStudents.length;

        renderStudentsGallery();
        buildFaceMatcher();
      }
    } catch (err) {
      studentsGallery.innerHTML = `<p style="color:#ef4444; font-size:0.8rem;">Database connection error. Ensure MySQL is running in XAMPP.</p>`;
    }
  }

  // Render photo gallery from MySQL Base64 Image Data with Inline SVG Fallback
  function renderStudentsGallery() {
    if (registeredStudents.length === 0) {
      studentsGallery.innerHTML = `<p style="color: var(--text-muted); font-size: 0.85rem; grid-column: 1 / -1;">No face records registered in MySQL yet.</p>`;
      return;
    }

    studentsGallery.innerHTML = registeredStudents.map(student => {
      const imgSrc = (student.image_data && student.image_data.trim() !== '') ? student.image_data : DEFAULT_AVATAR;
      return `
        <div class="student-card" data-id="${student.id}">
          <img src="${imgSrc}" alt="${student.student_name}" class="student-thumb" onerror="this.onerror=null; this.src='${DEFAULT_AVATAR}';">
          <div class="student-info">
            <div class="student-name-text">${student.student_name}</div>
          </div>
          <button class="btn-delete-student" data-id="${student.id}" data-name="${student.student_name}" title="Delete Profile">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      `;
    }).join('');

    // Attach click listeners to Delete buttons
    document.querySelectorAll('.btn-delete-student').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const name = e.currentTarget.getAttribute('data-name');
        deleteStudentProfile(id, name);
      });
    });
  }

  // Delete Student Profile Handler
  async function deleteStudentProfile(id, name) {
    if (!confirm(`Are you sure you want to delete the profile for "${name}"?`)) {
      return;
    }

    try {
      const res = await fetch('delete_student.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: parseInt(id) })
      });

      const data = await res.json();
      if (data.success) {
        alert(data.message);
        await loadStudentsFromDatabase();
      } else {
        alert('Failed to delete: ' + data.message);
      }
    } catch (err) {
      alert('Error deleting profile: ' + err.message);
    }
  }

  // Build face-api.js FaceMatcher from MySQL Descriptors
  function buildFaceMatcher() {
    const labeledDescriptors = [];

    registeredStudents.forEach(student => {
      if (student.face_descriptor && Array.isArray(student.face_descriptor) && student.face_descriptor.length > 0) {
        const floatArray = new Float32Array(student.face_descriptor);
        labeledDescriptors.push(new faceapi.LabeledFaceDescriptors(student.student_name, [floatArray]));
      }
    });

    if (labeledDescriptors.length > 0) {
      faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
    } else {
      faceMatcher = null;
    }
  }

  // 5. Start Webcam Feed
  btnCamera.addEventListener('click', async () => {
    if (!isModelLoaded) {
      alert('AI Models are still loading. Please wait a moment...');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;
      isCameraRunning = true;
      scanLaser.style.display = 'block';
      btnCamera.disabled = true;
      btnRegister.disabled = false;
      faceFeedback.innerHTML = '<span style="color: #38bdf8;">Camera active. Scanning for faces...</span>';
      
      recoName.textContent = 'Scanning...';
      recoLabel.className = 'reco-label-box status-scanning';

      startRecognitionLoop();
    } catch (err) {
      faceFeedback.innerHTML = `<span style="color: #ef4444;">Camera permission denied: ${err.message}</span>`;
    }
  });

  // 6. Real-Time Face Recognition Loop
  function startRecognitionLoop() {
    video.addEventListener('play', () => {
      const dims = { width: video.clientWidth || 700, height: video.clientHeight || 380 };
      faceapi.matchDimensions(canvas, dims);

      setInterval(async () => {
        if (!isCameraRunning || !isModelLoaded) return;
        try {
          const detections = await faceapi
            .detectAllFaces(video)
            .withFaceLandmarks()
            .withFaceDescriptors();

          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (detections.length === 0) {
            recoName.textContent = 'No Face Detected';
            recoLabel.className = 'reco-label-box status-none';
          } else {
            let matchedName = null;
            
            for (const detection of detections) {
              if (faceMatcher) {
                const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
                if (bestMatch.label !== 'unknown') {
                  matchedName = bestMatch.label;
                  break;
                }
              }
            }

            if (matchedName) {
              recoName.textContent = matchedName;
              recoLabel.className = 'reco-label-box status-matched';
            } else {
              recoName.textContent = 'Unknown Person';
              recoLabel.className = 'reco-label-box status-unknown';
            }
          }

        } catch (err) {
          // silent error catch
        }
      }, 250);
    });
  }

  // 7. Register Face Directly to MySQL Database
  btnRegister.addEventListener('click', async () => {
    if (!isModelLoaded) {
      alert('AI Models are still loading.');
      return;
    }

    const name = studentNameInput.value.trim();

    if (!name) {
      alert('Please enter your Name.');
      return;
    }

    if (!isCameraRunning) {
      alert('Please start the camera first!');
      return;
    }

    btnRegister.disabled = true;
    regMsg.innerHTML = '<span style="color:#38bdf8;">Scanning face and generating AI embedding...</span>';

    try {
      const singleDetection = await faceapi
        .detectSingleFace(video)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!singleDetection) {
        regMsg.innerHTML = '<span style="color:#ef4444;">No face detected in video frame! Please look directly at the camera.</span>';
        btnRegister.disabled = false;
        return;
      }

      // Snapshot video frame as Base64 JPEG
      const snapshotCanvas = document.createElement('canvas');
      snapshotCanvas.width = video.videoWidth || 640;
      snapshotCanvas.height = video.videoHeight || 480;
      const snapCtx = snapshotCanvas.getContext('2d');
      snapCtx.drawImage(video, 0, 0, snapshotCanvas.width, snapshotCanvas.height);
      const base64Image = snapshotCanvas.toDataURL('image/jpeg', 0.85);

      const payload = {
        student_name: name,
        image: base64Image,
        descriptor: Array.from(singleDetection.descriptor)
      };

      const res = await fetch('register_student.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const responseData = await res.json();

      if (responseData.success) {
        regMsg.innerHTML = `<span style="color:#10b981; font-weight:700;"><i class="fa-solid fa-circle-check"></i> ${responseData.message}</span>`;
        studentNameInput.value = '';
        
        await loadStudentsFromDatabase();
      } else {
        regMsg.innerHTML = `<span style="color:#ef4444;">Failed to save: ${responseData.message}</span>`;
      }
    } catch (err) {
      regMsg.innerHTML = `<span style="color:#ef4444;">Error registering face: ${err.message}</span>`;
    } finally {
      btnRegister.disabled = false;
    }
  });
});
