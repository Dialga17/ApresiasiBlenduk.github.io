// model-viewer.js — Three.js 3D Model Viewer (GLB) - Heritage Edition
// Fixed: Better error handling, faster fallback, timeout detection

class Model3DViewer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.scene    = null;
        this.camera   = null;
        this.renderer = null;
        this.model    = null;
        this.isLoaded = false;
        this.loadTimeout = null;

        this.autoRotate   = true;
        this.rotateSpeed  = 0.005;
        this.isDragging   = false;
        this.isZooming    = false;
        this.prevMouse    = { x: 0, y: 0 };
        this.prevPinchDist = 0;

        this._init();
    }

    _init() {
        const w = this.container.clientWidth  || 800;
        const h = this.container.clientHeight || 500;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0f0c09);
        this.scene.fog = new THREE.Fog(0x0f0c09, 8, 1000);

        this.camera = new THREE.PerspectiveCamera(50, w / h, 0.01, 2000);
        this.camera.position.set(0, 0, 5);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(w, h);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding    = THREE.sRGBEncoding;
        this.renderer.toneMapping       = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        this.container.appendChild(this.renderer.domElement);

        this._setupLights();
        
        // Set timeout - if model doesn't load in 5 seconds, show fallback
        this.loadTimeout = setTimeout(() => {
            if (!this.isLoaded) {
                console.warn('Model load timeout - showing fallback');
                this._createFallback();
                this._hideLoading();
            }
        }, 5000);

        this._loadModel();
        this._setupEvents();

        window.addEventListener('resize', () => this._onResize());
        this._animate();
    }

    _setupLights() {
        // Heritage lighting - warmer tones
        const ambient = new THREE.AmbientLight(0xfff4e6, 0.8);
        this.scene.add(ambient);

        const key = new THREE.DirectionalLight(0xffecd2, 1.2);
        key.position.set(5, 8, 5);
        key.castShadow = true;
        key.shadow.mapSize.set(2048, 2048);
        this.scene.add(key);

        const fill = new THREE.DirectionalLight(0xd4af37, 0.4);
        fill.position.set(-5, 3, -5);
        this.scene.add(fill);

        const rim = new THREE.DirectionalLight(0xc9a227, 0.3);
        rim.position.set(0, -5, 3);
        this.scene.add(rim);
    }

    _loadModel() {
        // Check if GLTFLoader is available
        if (typeof THREE.GLTFLoader === 'undefined') {
            console.error('GLTFLoader not available');
            this._setLoading('Error: GLTFLoader tidak tersedia', true);
            setTimeout(() => {
                this._createFallback();
                this._hideLoading();
            }, 1000);
            return;
        }

        const loader = new THREE.GLTFLoader();
        
        // Set loading text
        this._setLoading('Memuat model...');

        loader.load(
            'Model.glb',
            (gltf) => {
                clearTimeout(this.loadTimeout);
                this.isLoaded = true;
                
                const model = gltf.scene;

                // Auto-fit with heritage proportions
                const box    = new THREE.Box3().setFromObject(model);
                const size   = box.getSize(new THREE.Vector3());
                const center = box.getCenter(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                const sf     = 2.2 / maxDim;

                model.scale.setScalar(sf);
                model.position.set(-center.x * sf, -center.y * sf, -center.z * sf);

                const fov  = this.camera.fov * (Math.PI / 180);
                this.camera.position.set(0, 0, (2.2 / 2 / Math.tan(fov / 2)) * 1.6);

                // Heritage materials - no transparency issues
                model.traverse((child) => {
                    if (!child.isMesh) return;
                    child.castShadow    = true;
                    child.receiveShadow = true;
                    child.renderOrder   = 0;

                    const mats = Array.isArray(child.material) ? child.material : [child.material];
                    mats.forEach((mat) => {
                        if (!mat) return;
                        
                        // Force opaque for vintage look
                        mat.transparent = false;
                        mat.opacity     = 1.0;
                        mat.depthWrite  = true;
                        mat.depthTest   = true;
                        mat.side        = THREE.FrontSide;
                        
                        // Warm up the materials slightly
                        if (mat.color) {
                            mat.color.offsetHSL(0, 0, 0.02);
                        }

                        // Handle alpha textures
                        if (mat.alphaMap || (mat.map && mat.map.format === THREE.RGBAFormat)) {
                            mat.alphaTest   = 0.1;
                            mat.transparent = false;
                        }

                        mat.needsUpdate = true;
                    });
                });

                this.model = model;
                this.scene.add(this.model);
                this._hideLoading();
                console.log('✅ Model loaded successfully');
            },
            (xhr) => {
                // Progress callback
                if (xhr.total > 0) {
                    const percent = Math.round(xhr.loaded / xhr.total * 100);
                    this._setLoading(`Memuat model... ${percent}%`);
                } else {
                    this._setLoading('Memuat model...');
                }
            },
            (err) => {
                clearTimeout(this.loadTimeout);
                console.error('Error loading model:', err);
                this._setLoading('Gagal memuat model', true);
                
                setTimeout(() => {
                    this._createFallback();
                    this._hideLoading();
                }, 1500);
            }
        );
    }

    _createFallback() {
        // Create a heritage-style church representation
        const group = new THREE.Group();
        
        // Main dome (kubah) - copper color
        const domeGeo = new THREE.SphereGeometry(0.8, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
        const domeMat = new THREE.MeshStandardMaterial({ 
            color: 0x8b6239,  // copper
            metalness: 0.4, 
            roughness: 0.6 
        });
        const dome = new THREE.Mesh(domeGeo, domeMat);
        dome.position.y = 0.5;
        group.add(dome);

        // Base building - white/cream
        const baseGeo = new THREE.BoxGeometry(1.6, 0.8, 1.6);
        const baseMat = new THREE.MeshStandardMaterial({ 
            color: 0xe8dcc8,  // cream
            metalness: 0.1, 
            roughness: 0.8 
        });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = -0.4;
        group.add(base);

        // Two towers
        const towerGeo = new THREE.BoxGeometry(0.3, 1.2, 0.3);
        const towerMat = new THREE.MeshStandardMaterial({ 
            color: 0xd4c4b0,
            metalness: 0.1, 
            roughness: 0.7 
        });
        
        const tower1 = new THREE.Mesh(towerGeo, towerMat);
        tower1.position.set(-0.9, 0.2, 0.9);
        group.add(tower1);
        
        const tower2 = new THREE.Mesh(towerGeo, towerMat);
        tower2.position.set(0.9, 0.2, 0.9);
        group.add(tower2);

        // Cross on top
        const crossV = new THREE.Mesh(
            new THREE.BoxGeometry(0.06, 0.4, 0.06),
            new THREE.MeshStandardMaterial({ color: 0xc9a227 })
        );
        crossV.position.y = 1.4;
        group.add(crossV);
        
        const crossH = new THREE.Mesh(
            new THREE.BoxGeometry(0.25, 0.06, 0.06),
            new THREE.MeshStandardMaterial({ color: 0xc9a227 })
        );
        crossH.position.y = 1.4;
        group.add(crossH);

        this.model = group;
        this.scene.add(this.model);
        
        // Adjust camera for fallback
        this.camera.position.set(0, 0, 4);
        
        console.log('✅ Fallback model created');
    }

    _setupEvents() {
        const c = this.container;
        
        // Mouse events
        c.addEventListener('mousedown',  (e) => { 
            this.isDragging = true; 
            this.prevMouse = { x: e.clientX, y: e.clientY }; 
            this.autoRotate = false; 
        });
        c.addEventListener('mousemove',  (e) => this._onMouseMove(e));
        c.addEventListener('mouseup',    ()  => { 
            this.isDragging = false; 
            this.autoRotate = true; 
        });
        c.addEventListener('mouseleave', ()  => { 
            this.isDragging = false; 
            this.autoRotate = true; 
        });
        c.addEventListener('wheel',      (e) => { 
            e.preventDefault(); 
            this._zoom(e.deltaY > 0 ? 0.15 : -0.15); 
        }, { passive: false });
        
        // Touch events
        c.addEventListener('touchstart', (e) => this._onTouchStart(e), { passive: false });
        c.addEventListener('touchmove',  (e) => this._onTouchMove(e),  { passive: false });
        c.addEventListener('touchend',   (e) => this._onTouchEnd(e),   { passive: false });

        // Control buttons
        document.getElementById('resetBtn')?.addEventListener('click', () => this._resetRotation());
        document.getElementById('autoRotateBtn')?.addEventListener('click', () => this._toggleAutoRotate());
        document.getElementById('zoomInBtn')?.addEventListener('click', () => this._zoom(-0.6));
        document.getElementById('zoomOutBtn')?.addEventListener('click', () => this._zoom(0.6));
    }

    _onMouseMove(e) {
        if (!this.isDragging || !this.model) return;
        const dx = e.clientX - this.prevMouse.x;
        const dy = e.clientY - this.prevMouse.y;
        this.model.rotation.y += dx * 0.008;
        this.model.rotation.x += dy * 0.008;
        this.prevMouse = { x: e.clientX, y: e.clientY };
    }

    _onTouchStart(e) {
        if (e.touches.length === 1) {
            this.isDragging = true; 
            this.autoRotate = false;
            this.prevMouse  = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        } else if (e.touches.length === 2) {
            this.isZooming = true;
            this.prevPinchDist = this._pinchDist(e);
        }
        e.preventDefault();
    }

    _onTouchMove(e) {
        if (e.touches.length === 1 && this.isDragging && this.model) {
            const dx = e.touches[0].clientX - this.prevMouse.x;
            const dy = e.touches[0].clientY - this.prevMouse.y;
            this.model.rotation.y += dx * 0.008;
            this.model.rotation.x += dy * 0.008;
            this.prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        } else if (e.touches.length === 2 && this.isZooming) {
            const d = this._pinchDist(e);
            this._zoom((this.prevPinchDist - d) * 0.008);
            this.prevPinchDist = d;
        }
        e.preventDefault();
    }

    _onTouchEnd(e) {
        if (e.touches.length === 0) {
            this.isDragging = false; 
            this.isZooming = false; 
            this.autoRotate = true;
        }
    }

    _pinchDist(e) {
        return Math.hypot(
            e.touches[1].clientX - e.touches[0].clientX, 
            e.touches[1].clientY - e.touches[0].clientY
        );
    }

    _zoom(delta) {
        this.camera.position.z = Math.max(2, Math.min(15, this.camera.position.z + delta));
    }

    _resetRotation() {
        if (!this.model) return;
        const start = { x: this.model.rotation.x, y: this.model.rotation.y };
        const t0 = Date.now(), dur = 600;
        const tick = () => {
            const p = Math.min((Date.now() - t0) / dur, 1);
            const ease = p < 0.5 ? 2*p*p : -1+(4-2*p)*p;
            this.model.rotation.x = start.x * (1 - ease);
            this.model.rotation.y = start.y * (1 - ease);
            if (p < 1) requestAnimationFrame(tick);
            else { 
                this.model.rotation.x = 0; 
                this.model.rotation.y = 0; 
            }
        };
        tick();
    }

    _toggleAutoRotate() {
        this.autoRotate = !this.autoRotate;
        const btn = document.getElementById('autoRotateBtn');
        if (!btn) return;
        btn.classList.toggle('active-btn', this.autoRotate);
        btn.innerHTML = this.autoRotate
            ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg> Putar Otomatis`
            : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="10" y1="15" x2="10" y2="9"/><line x1="14" y1="15" x2="14" y2="9"/></svg> Jeda`;
    }

    _onResize() {
        const w = this.container.clientWidth, h = this.container.clientHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
    }

    _setLoading(msg, isError = false) {
        const el = document.getElementById('modelLoading');
        const txt = document.getElementById('loadingText');
        if (el) el.classList.remove('hidden');
        if (txt) { 
            txt.textContent = msg; 
            txt.style.color = isError ? '#c9a227' : ''; 
        }
    }

    _hideLoading() {
        const el = document.getElementById('modelLoading');
        if (el) {
            el.classList.add('hidden');
            setTimeout(() => {
                el.style.display = 'none';
            }, 400);
        }
    }

    _animate() {
        requestAnimationFrame(() => this._animate());
        if (this.autoRotate && this.model) {
            this.model.rotation.y += this.rotateSpeed;
        }
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (typeof THREE === 'undefined') {
        console.error('Three.js not loaded');
        return;
    }
    new Model3DViewer('modelViewer');
});