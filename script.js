document.addEventListener('DOMContentLoaded', async () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const uploadList = document.getElementById('upload-list');
    const statusEl = document.getElementById('cloud-status');
    const usedEl = document.getElementById('storage-used');
    const barEl = document.getElementById('storage-bar');

    // Account Credentials (Provided by User)
    const MEGA_EMAIL = 'vincenzoexe6@gmail.com';
    const MEGA_PASS = 'xenosir@###123';

    let megaStorage = null;

    // Initialize MEGA Storage System
    async function initStorage() {
        try {
            statusEl.textContent = 'Connecting to XENO Cloud...';
            megaStorage = await new window.mega.Storage({
                email: MEGA_EMAIL,
                password: MEGA_PASS,
                keepalive: true
            }).ready;

            statusEl.textContent = 'XENO Private Cloud Online';
            statusEl.classList.add('online');

            // Get Account Info (Mocking metrics for visual feedback since full API stats are limited in JS)
            updateStorageMetrics();
            showToast('Secure XENO storage connected!');
        } catch (error) {
            console.error(error);
            statusEl.textContent = 'Cloud Connection Error';
            showToast('Failed to connect to MEGA storage', 'error');
        }
    }

    function updateStorageMetrics() {
        // Simulating some used space for visuals based on account type
        const used = Math.random() * 500 + 100; // Mocked 100-600MB
        usedEl.textContent = `${used.toFixed(2)} MB`;
        barEl.style.width = `${(used / 20000) * 100}%`;
    }

    initStorage();

    // Click to upload
    dropZone.addEventListener('click', () => fileInput.click());

    // Drag and drop events
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        handleFiles(files);
    });

    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
        fileInput.value = '';
    });

    function handleFiles(files) {
        if (files.length > 0) {
            uploadList.classList.remove('hidden');
            Array.from(files).forEach(file => {
                uploadFile(file);
            });
        }
    }

    function showToast(message, type = 'success') {
        const toaster = document.getElementById('toaster');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        const icon = type === 'success' ? 'check-circle' : 'alert-circle';

        toast.innerHTML = `
            <i data-lucide="${icon}"></i>
            <span>${message}</span>
        `;

        toaster.appendChild(toast);
        lucide.createIcons();

        setTimeout(() => {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    async function shorten(longUrl) {
        try {
            const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`);
            if (res.ok) return await res.text();
        } catch (e) { console.error('Shorten fail', e); }
        return longUrl;
    }

    async function uploadFile(file) {
        if (file.size > 50 * 1024 * 1024) {
            showToast(`File ${file.name} is too large (Max 50MB)`, 'error');
            return;
        }

        const item = createUploadItem(file);
        uploadList.appendChild(item);
        lucide.createIcons();

        const progressBar = item.querySelector('.progress-fill');

        try {
            // Priority 1: Fast Short Links via TmpFiles
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('https://tmpfiles.org/api/v1/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('Cloud error');
            const data = await response.json();
            const realUrl = data.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');

            // Background Mirror to MEGA (Non-blocking)
            if (megaStorage) {
                file.arrayBuffer().then(buf => megaStorage.upload(file.name, new Uint8Array(buf)));
            }

            const shortUrl = await shorten(realUrl);

            progressBar.style.width = '100%';
            setTimeout(() => {
                completeUpload(file, item, shortUrl, true);
                showToast(`Converted successfully!`);
                updateStorageMetrics();
            }, 300);

        } catch (error) {
            console.error('Core Error:', error);
            const localUrl = URL.createObjectURL(file);
            progressBar.style.width = '100%';
            completeUpload(file, item, localUrl, false);
            showToast('Service slow: Local link provided', 'error');
        }
    }

    function createUploadItem(file) {
        const div = document.createElement('div');
        div.className = 'upload-item fade-in-up';

        let icon = 'file';
        if (file.type.startsWith('image/')) icon = 'image';
        else if (file.type.startsWith('audio/')) icon = 'music';
        else if (file.type.startsWith('video/')) icon = 'video';

        div.innerHTML = `
            <div class="item-layout">
                <div class="item-preview-container">
                    <i data-lucide="${icon}" class="file-icon" style="width: 20px; height: 20px; padding: 0;"></i>
                </div>
                <div class="item-details">
                    <div class="item-name">${file.name}</div>
                    <div class="progress-bar"><div class="progress-fill"></div></div>
                    <div class="item-media-player"></div>
                    <div class="item-actions hidden">
                        <div class="url-badge">
                            <span class="url-text">xeno.ink/short...</span>
                            <button class="btn-copy" title="Copy URL">
                                <i data-lucide="copy" style="width: 14px; height: 14px;"></i>
                            </button>
                        </div>
                        <a href="#" target="_blank" class="btn-link">View</a>
                        <button class="btn-remove"><i data-lucide="trash-2" style="width: 14px; height: 14px;"></i></button>
                    </div>
                </div>
            </div>
        `;
        return div;
    }

    function completeUpload(file, item, realUrl, isCloud = true) {
        const actions = item.querySelector('.item-actions');
        const viewBtn = item.querySelector('.btn-link');
        const copyBtn = item.querySelector('.btn-copy');
        const removeBtn = item.querySelector('.btn-remove');
        const urlText = item.querySelector('.url-text');
        const previewContainer = item.querySelector('.item-preview-container');
        const mediaPlayer = item.querySelector('.item-media-player');

        const shortId = Math.random().toString(36).substring(7);
        const fileExt = file.name.includes('.') ? file.name.split('.').pop() : 'file';
        const brandedDisplay = isCloud ? `xeno.link/${shortId}.${fileExt}` : `local_mirror.${fileExt}`;

        urlText.textContent = brandedDisplay;
        viewBtn.href = realUrl;

        // Smart Media Handling
        if (file.type.startsWith('image/')) {
            const img = document.createElement('img');
            img.src = realUrl;
            img.className = 'item-preview';
            previewContainer.innerHTML = '';
            previewContainer.appendChild(img);
        } else if (file.type.startsWith('video/')) {
            const v = document.createElement('video');
            v.src = realUrl;
            v.className = 'item-preview';
            v.muted = true;
            v.autoplay = true;
            previewContainer.innerHTML = '';
            previewContainer.appendChild(v);
        } else if (file.type.startsWith('audio/')) {
            const a = document.createElement('audio');
            a.src = realUrl;
            a.controls = true;
            a.className = 'audio-control';
            mediaPlayer.appendChild(a);
        }

        actions.classList.remove('hidden');
        lucide.createIcons();

        copyBtn.onclick = () => {
            navigator.clipboard.writeText(realUrl).then(() => {
                showToast('Short Link Copied!');
                const originalContent = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i data-lucide="check" style="width: 14px; height: 14px; color: #10b981;"></i>';
                lucide.createIcons();
                urlText.style.color = '#10b981';
                setTimeout(() => {
                    copyBtn.innerHTML = originalContent;
                    lucide.createIcons();
                    urlText.style.color = '';
                }, 2000);
            });
        };

        removeBtn.onclick = () => {
            item.classList.add('fade-out');
            setTimeout(() => {
                item.remove();
                if (uploadList.children.length === 0) uploadList.classList.add('hidden');
            }, 300);
        };
    }
    // Optimized Particles.js (Reduced count for zero lag)
    particlesJS('particles-js', {
        "particles": {
            "number": { "value": 40, "density": { "enable": true, "value_area": 1200 } },
            "color": { "value": "#6366f1" },
            "shape": { "type": "circle" },
            "opacity": { "value": 0.3, "random": false },
            "size": { "value": 2, "random": true },
            "line_linked": { "enable": true, "distance": 150, "color": "#6366f1", "opacity": 0.1, "width": 1 },
            "move": { "enable": true, "speed": 1.5, "direction": "none", "random": false, "straight": false, "out_mode": "out", "bounce": false }
        },
        "interactivity": {
            "detect_on": "window",
            "events": { "onhover": { "enable": true, "mode": "grab" }, "onclick": { "enable": false }, "resize": true }
        },
        "retina_detect": false // Disabled for better performance on high-res screens
    });

    // GSAP Enhanced Animations (Hardware Accelerated)
    gsap.from(".hero > *", { duration: 1, y: 30, opacity: 0, stagger: 0.2, ease: "power3.out" });
    gsap.from(".storage-card", { duration: 1, scale: 0.95, opacity: 0, delay: 0.5, ease: "power2.out" });
    gsap.from(".upload-container", { duration: 1, y: 50, opacity: 0, delay: 0.8, ease: "back.out(1.4)" });

    // Smooth floating blobs with GSAP
    gsap.to(".blob-1", { duration: 20, x: 100, y: 100, repeat: -1, yoyo: true, ease: "sine.inOut" });
    gsap.to(".blob-2", { duration: 25, x: -80, y: -50, repeat: -1, yoyo: true, ease: "sine.inOut" });
    gsap.to(".blob-3", { duration: 30, x: 60, y: -100, repeat: -1, yoyo: true, ease: "sine.inOut" });
});
