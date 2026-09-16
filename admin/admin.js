/* ============================================================
   PHINEHAS GENERATION — Admin Panel Logic
   ============================================================ */

(function () {
  'use strict';

  // ============================================================
  // STATE
  // ============================================================
  let firebase = null;
  let currentUser = null;
  let currentPanel = 'welcomeSlides';
  let editingItem = null;
  let editingType = null;
  let pendingImageFile = null;
  let pendingImageUrl = '';

  const COLLECTIONS = {
    welcomeSlides: 'welcomeSlides',
    programs: 'programs',
    blogPosts: 'blogPosts',
    impactStats: 'impactStats',
    testimonials: 'testimonials'
  };

  // ============================================================
  // DOM REFS
  // ============================================================
  const loadingOverlay = document.getElementById('loadingOverlay');
  const loginScreen = document.getElementById('loginScreen');
  const dashboardScreen = document.getElementById('dashboardScreen');
  const loginForm = document.getElementById('loginForm');
  const loginEmail = document.getElementById('loginEmail');
  const loginPassword = document.getElementById('loginPassword');
  const loginError = document.getElementById('loginError');
  const loginBtn = document.getElementById('loginBtn');
  const togglePassword = document.getElementById('togglePassword');
  const forgotPasswordLink = document.getElementById('forgotPasswordLink');
  const logoutBtn = document.getElementById('logoutBtn');
  const adminUserEmail = document.getElementById('adminUserEmail');
  const sidebarBtns = document.querySelectorAll('.sidebar-btn');
  const panels = document.querySelectorAll('.panel');
  const modal = document.getElementById('editorModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');
  const modalClose = document.getElementById('modalClose');
  const modalCancel = document.getElementById('modalCancel');
  const modalSave = document.getElementById('modalSave');
  const toast = document.getElementById('toast');

  // ============================================================
  // WAIT FOR FIREBASE
  // ============================================================
  window.addEventListener('firebaseReady', function () {
    firebase = window._firebase;
    initAuth();
  });

  // ============================================================
  // AUTH
  // ============================================================
  function initAuth() {
    firebase.onAuthStateChanged(firebase.auth, function (user) {
      if (user) {
        currentUser = user;
        adminUserEmail.textContent = user.email;
        loginScreen.style.display = 'none';
        dashboardScreen.style.display = 'block';
        loadPanel(currentPanel);
      } else {
        currentUser = null;
        loginScreen.style.display = 'flex';
        dashboardScreen.style.display = 'none';
      }
      loadingOverlay.classList.add('hidden');
    });
  }

  loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    loginError.textContent = '';
    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    if (!email || !password) {
      loginError.textContent = 'Please enter your email and password.';
      return;
    }

    loginBtn.classList.add('btn-loading');
    try {
      await firebase.signInWithEmailAndPassword(firebase.auth, email, password);
    } catch (err) {
      loginBtn.classList.remove('btn-loading');
      let msg = 'Sign in failed. Please try again.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        msg = 'Incorrect email or password.';
      } else if (err.code === 'auth/user-not-found') {
        msg = 'No account with that email.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Too many attempts. Try again later.';
      }
      loginError.textContent = msg;
    }
  });

  togglePassword.addEventListener('click', function () {
    const type = loginPassword.type === 'password' ? 'text' : 'password';
    loginPassword.type = type;
    const icon = this.querySelector('i');
    icon.classList.toggle('fa-eye');
    icon.classList.toggle('fa-eye-slash');
  });

  forgotPasswordLink.addEventListener('click', async function (e) {
    e.preventDefault();
    const email = loginEmail.value.trim();
    if (!email) {
      loginError.textContent = 'Enter your email first.';
      return;
    }
    try {
      await firebase.sendPasswordResetEmail(firebase.auth, email);
      showToast('Password reset email sent.', 'success');
    } catch (err) {
      showToast('Could not send reset email.', 'error');
    }
  });

  logoutBtn.addEventListener('click', async function () {
    await firebase.signOut(firebase.auth);
    location.reload();
  });

  // ============================================================
  // SIDEBAR NAVIGATION
  // ============================================================
  sidebarBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const panelName = this.dataset.panel;
      sidebarBtns.forEach(function (b) { b.classList.remove('active'); });
      this.classList.add('active');
      panels.forEach(function (p) { p.classList.remove('active'); });
      const target = document.getElementById('panel-' + panelName);
      if (target) target.classList.add('active');
      currentPanel = panelName;
      loadPanel(panelName);
    });
  });

  // ============================================================
  // LOAD PANEL
  // ============================================================
  async function loadPanel(name) {
    try {
      if (name === 'welcomeSlides') await loadWelcomeSlides();
      else if (name === 'programs') await loadGenericList('programs', 'programsList');
      else if (name === 'blogPosts') await loadGenericList('blogPosts', 'blogList');
      else if (name === 'impactStats') await loadGenericList('impactStats', 'statsList');
      else if (name === 'testimonials') await loadGenericList('testimonials', 'testimonialsList');
    } catch (err) {
      console.error('Load panel error:', err);
      showToast('Could not load content. Check your permissions.', 'error');
    }
  }

  // ============================================================
  // WELCOME SLIDES
  // ============================================================
  async function loadWelcomeSlides() {
    const list = document.getElementById('slidesList');
    list.innerHTML = '<p style="text-align:center;padding:40px;color:var(--gray-500);">Loading...</p>';

    const q = firebase.query(
      firebase.collection(firebase.db, COLLECTIONS.welcomeSlides),
      firebase.orderBy('order', 'asc')
    );
    const snapshot = await firebase.getDocs(q);
    const slides = [];
    snapshot.forEach(function (docSnap) {
      slides.push({ id: docSnap.id, ...docSnap.data() });
    });

    if (slides.length === 0) {
      list.innerHTML = emptyState(
        'No slides yet',
        'Add your first welcome slide to get started.',
        'addSlideBtn'
      );
      document.getElementById('addSlideBtn').addEventListener('click', function () { openSlideEditor(null); });
      return;
    }

    list.innerHTML = slides.map(function (slide) {
      return `
        <div class="slide-card">
          <div class="slide-thumb">
            <img src="${slide.image || ''}" alt="" loading="lazy">
            <span class="slide-order-badge">${slide.order || 0}</span>
          </div>
          <div class="slide-body">
            <div class="slide-quote">"${escapeHtml(slide.quote || '')}"</div>
            <div class="slide-attribution">${escapeHtml(slide.attribution || '')}</div>
            <div class="slide-actions">
              <button class="btn-edit" data-action="edit" data-id="${slide.id}"><i class="fas fa-edit"></i> Edit</button>
              <button class="btn-delete" data-action="delete" data-id="${slide.id}"><i class="fas fa-trash"></i> Delete</button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    list.querySelectorAll('button[data-action]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const id = this.dataset.id;
        const slide = slides.find(function (s) { return s.id === id; });
        if (this.dataset.action === 'edit') openSlideEditor(slide);
        else if (this.dataset.action === 'delete') confirmDelete(COLLECTIONS.welcomeSlides, id, loadWelcomeSlides);
      });
    });
  }

  function openSlideEditor(slide) {
    editingType = 'welcomeSlides';
    editingItem = slide;
    pendingImageFile = null;
    pendingImageUrl = slide && slide.image ? slide.image : '';

    modalTitle.textContent = slide ? 'Edit Slide' : 'Add New Slide';

    modalBody.innerHTML = `
      <div class="form-group">
        <label>Image</label>
        <div class="image-upload">
          <input type="file" accept="image/*" id="slideImageInput">
          <div class="image-upload-preview" id="slideImagePreview">
            ${pendingImageUrl
              ? `<img src="${pendingImageUrl}" alt="">`
              : `<i class="fas fa-cloud-upload-alt"></i><span>Click to upload image</span>`}
          </div>
        </div>
        <div class="uploading-bar" id="uploadBar" style="display:none;">
          <div class="uploading-bar-fill" id="uploadBarFill"></div>
        </div>
        <div class="image-upload-hint">Recommended: 1920×1080 or larger, JPG/PNG</div>
      </div>

      <div class="form-group">
        <label>Quote</label>
        <textarea id="slideQuote" rows="3" placeholder="Raising tomorrow's leaders...">${slide ? escapeHtml(slide.quote || '') : ''}</textarea>
      </div>

      <div class="form-group">
        <label>Attribution</label>
        <input type="text" id="slideAttribution" placeholder="Our founding conviction" value="${slide ? escapeHtml(slide.attribution || '') : ''}">
      </div>

      <div class="form-group">
        <label>Display Order</label>
        <input type="number" id="slideOrder" placeholder="1" min="1" value="${slide ? (slide.order || 1) : ''}">
        <div class="image-upload-hint" style="text-align:left;">Lower numbers appear first</div>
      </div>
    `;

    setupImageUpload();
    openModal();
  }

  // ============================================================
  // GENERIC LIST (programs, blogPosts, impactStats, testimonials)
  // ============================================================
  async function loadGenericList(collectionName, targetId) {
    const list = document.getElementById(targetId);
    list.innerHTML = '<p style="text-align:center;padding:40px;color:var(--gray-500);">Loading...</p>';

    const snapshot = await firebase.getDocs(firebase.collection(firebase.db, collectionName));
    const items = [];
    snapshot.forEach(function (docSnap) {
      items.push({ id: docSnap.id, ...docSnap.data() });
    });

    if (items.length === 0) {
      const labels = {
        programs: 'program',
        blogPosts: 'blog post',
        impactStats: 'stat',
        testimonials: 'testimonial'
      };
      const label = labels[collectionName] || 'item';
      list.innerHTML = emptyState(
        'No ' + label + 's yet',
        'Add your first ' + label + ' to get started.',
        null
      );
      return;
    }

    list.innerHTML = items.map(function (item) {
      return renderItemRow(item, collectionName);
    }).join('');

    list.querySelectorAll('button[data-action]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const id = this.dataset.id;
        const item = items.find(function (i) { return i.id === id; });
        if (this.dataset.action === 'edit') openGenericEditor(collectionName, item);
        else if (this.dataset.action === 'delete') confirmDelete(collectionName, id, function () { loadGenericList(collectionName, targetId); });
      });
    });
  }

  function renderItemRow(item, collectionName) {
    const thumb = item.image || item.thumbnail || '';
    const title = item.title || item.name || item.quote || 'Untitled';
    const desc = item.description || item.excerpt || item.content || item.text || '';
    const meta = [];

    if (collectionName === 'blogPosts') {
      if (item.topic) meta.push(`<span><i class="fas fa-tag"></i> ${escapeHtml(item.topic)}</span>`);
      if (item.date) meta.push(`<span><i class="far fa-calendar"></i> ${escapeHtml(item.date)}</span>`);
    } else if (collectionName === 'impactStats') {
      if (item.value) meta.push(`<span><i class="fas fa-hashtag"></i> ${escapeHtml(String(item.value))}</span>`);
    } else if (collectionName === 'testimonials') {
      if (item.author) meta.push(`<span><i class="far fa-user"></i> ${escapeHtml(item.author)}</span>`);
      if (item.role) meta.push(`<span><i class="fas fa-briefcase"></i> ${escapeHtml(item.role)}</span>`);
    } else if (collectionName === 'programs') {
      if (item.category) meta.push(`<span><i class="fas fa-folder"></i> ${escapeHtml(item.category)}</span>`);
    }

    const plainDesc = typeof desc === 'string'
      ? desc.replace(/<[^>]*>/g, ' ').substring(0, 120)
      : '';

    return `
      <div class="item-row">
        ${thumb ? `<div class="item-thumb"><img src="${thumb}" alt="" loading="lazy"></div>` : ''}
        <div class="item-info">
          <h4>${escapeHtml(title)}</h4>
          ${plainDesc ? `<p>${escapeHtml(plainDesc)}</p>` : ''}
          ${meta.length ? `<div class="item-meta">${meta.join('')}</div>` : ''}
        </div>
        <div class="item-actions">
          <button class="edit" data-action="edit" data-id="${item.id}" title="Edit"><i class="fas fa-edit"></i></button>
          <button class="delete" data-action="delete" data-id="${item.id}" title="Delete"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    `;
  }

  function openGenericEditor(collectionName, item) {
    editingType = collectionName;
    editingItem = item;

    const fields = getFieldsForCollection(collectionName);
    const title = item ? 'Edit ' + humanize(collectionName) : 'Add ' + humanize(collectionName);
    modalTitle.textContent = title;

    modalBody.innerHTML = fields.map(function (field) {
      const value = item && item[field.key] !== undefined ? item[field.key] : (field.default || '');
      return renderField(field, value);
    }).join('');

    setupImageUpload();
    openModal();
  }

  function getFieldsForCollection(collectionName) {
    const map = {
      programs: [
        { key: 'title', label: 'Program Title', type: 'text', placeholder: 'Self-Esteem Development' },
        { key: 'category', label: 'Category', type: 'text', placeholder: 'Youth' },
        { key: 'image', label: 'Image', type: 'image' },
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Short description...' }
      ],
      blogPosts: [
        { key: 'title', label: 'Post Title', type: 'text' },
        { key: 'topic', label: 'Topic', type: 'text', placeholder: 'Mental Health' },
        { key: 'date', label: 'Date', type: 'date' },
        { key: 'author', label: 'Author', type: 'text', placeholder: 'PHINEHAS GENERATION' },
        { key: 'image', label: 'Featured Image', type: 'image' },
        { key: 'excerpt', label: 'Excerpt', type: 'textarea' },
        { key: 'content', label: 'Full Content (HTML allowed)', type: 'textarea', placeholder: '<p>Your content...</p>' }
      ],
      impactStats: [
        { key: 'label', label: 'Label', type: 'text', placeholder: 'Lives Touched' },
        { key: 'value', label: 'Value', type: 'number', placeholder: '1000' },
        { key: 'suffix', label: 'Suffix', type: 'text', placeholder: '+' }
      ],
      testimonials: [
        { key: 'quote', label: 'Quote', type: 'textarea', placeholder: 'They changed my life...' },
        { key: 'author', label: 'Author', type: 'text' },
        { key: 'role', label: 'Role', type: 'text', placeholder: 'Youth Participant' },
        { key: 'image', label: 'Photo (optional)', type: 'image' }
      ]
    };
    return map[collectionName] || [];
  }

  function renderField(field, value) {
    if (field.type === 'image') {
      return `
        <div class="form-group">
          <label>${field.label}</label>
          <div class="image-upload">
            <input type="file" accept="image/*" data-field-key="${field.key}">
            <div class="image-upload-preview" data-preview-key="${field.key}">
              ${value
                ? `<img src="${value}" alt="">`
                : `<i class="fas fa-cloud-upload-alt"></i><span>Click to upload image</span>`}
            </div>
          </div>
          <div class="uploading-bar" data-upload-key="${field.key}" style="display:none;">
            <div class="uploading-bar-fill"></div>
          </div>
        </div>
      `;
    }
    if (field.type === 'textarea') {
      return `
        <div class="form-group">
          <label>${field.label}</label>
          <textarea data-field-key="${field.key}" rows="4" placeholder="${field.placeholder || ''}">${escapeHtml(value)}</textarea>
        </div>
      `;
    }
    return `
      <div class="form-group">
        <label>${field.label}</label>
        <input type="${field.type}" data-field-key="${field.key}" placeholder="${field.placeholder || ''}" value="${escapeHtml(String(value))}">
      </div>
    `;
  }

  function setupImageUpload() {
    modalBody.querySelectorAll('input[type="file"][data-field-key], input[type="file"]#slideImageInput').forEach(function (input) {
      input.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (!file) return;
        const key = input.dataset.fieldKey || 'image';
        pendingImageFile = file;
        showImagePreview(file, key);
      });
    });
  }

  function showImagePreview(file, key) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const preview = key === 'image' && modalBody.querySelector('#slideImagePreview')
        ? modalBody.querySelector('#slideImagePreview')
        : modalBody.querySelector('[data-preview-key="' + key + '"]');
      if (preview) {
        preview.innerHTML = `<img src="${e.target.result}" alt="">`;
      }
      pendingImageUrl = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  // ============================================================
  // SAVE
  // ============================================================
  modalSave.addEventListener('click', async function () {
    modalSave.classList.add('btn-loading');

    try {
      // If there's a pending image file, upload it first
      let finalImageUrl = pendingImageUrl;
      if (pendingImageFile) {
        showToast('Uploading image...', 'info');
        finalImageUrl = await uploadImage(pendingImageFile);
      }

      const data = collectFormData();
      if (finalImageUrl) data.image = finalImageUrl;

      if (editingItem && editingItem.id) {
        await firebase.updateDoc(
          firebase.doc(firebase.db, editingType, editingItem.id),
          data
        );
        showToast('Saved changes.', 'success');
      } else {
        await firebase.addDoc(
          firebase.collection(firebase.db, editingType),
          data
        );
        showToast('Created successfully.', 'success');
      }

      closeModal();
      await loadPanel(currentPanel);
    } catch (err) {
      console.error('Save error:', err);
      showToast('Save failed: ' + (err.message || 'unknown error'), 'error');
    } finally {
      modalSave.classList.remove('btn-loading');
    }
  });

  function collectFormData() {
    const data = {};
    modalBody.querySelectorAll('[data-field-key]').forEach(function (el) {
      const key = el.dataset.fieldKey;
      if (el.type === 'file') return;
      if (el.type === 'number') {
        data[key] = Number(el.value) || 0;
      } else {
        data[key] = el.value.trim();
      }
    });

    if (editingType === 'welcomeSlides') {
      data.quote = (document.getElementById('slideQuote') || {}).value || '';
      data.attribution = (document.getElementById('slideAttribution') || {}).value || '';
      data.order = Number((document.getElementById('slideOrder') || {}).value) || 0;
    }

    return data;
  }

  async function uploadImage(file) {
    const fileName = Date.now() + '_' + file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storageRef = firebase.ref(firebase.storage, 'admin-uploads/' + fileName);
    await firebase.uploadBytes(storageRef, file);
    return await firebase.getDownloadURL(storageRef);
  }

  // ============================================================
  // DELETE
  // ============================================================
  function confirmDelete(collectionName, id, onSuccess) {
    if (!confirm('Delete this item permanently? This cannot be undone.')) return;

    firebase.deleteDoc(firebase.doc(firebase.db, collectionName, id))
      .then(function () {
        showToast('Deleted.', 'success');
        onSuccess();
      })
      .catch(function (err) {
        console.error('Delete error:', err);
        showToast('Delete failed.', 'error');
      });
  }

  // ============================================================
  // MODAL
  // ============================================================
  function openModal() {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
    editingItem = null;
    editingType = null;
    pendingImageFile = null;
    pendingImageUrl = '';
  }

  modalClose.addEventListener('click', closeModal);
  modalCancel.addEventListener('click', closeModal);
  modal.querySelector('.modal-backdrop').addEventListener('click', closeModal);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });

  // ============================================================
  // TOAST
  // ============================================================
  let toastTimer;
  function showToast(message, type) {
    type = type || 'info';
    const icons = {
      success: 'fa-check-circle',
      error: 'fa-exclamation-circle',
      info: 'fa-info-circle'
    };
    toast.className = 'toast ' + type;
    toast.innerHTML = '<i class="fas ' + (icons[type] || icons.info) + '"></i> ' + escapeHtml(message);
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove('show');
    }, 3000);
  }

  // ============================================================
  // HELPERS
  // ============================================================
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }

  function humanize(str) {
    const map = {
      welcomeSlides: 'Slide',
      programs: 'Program',
      blogPosts: 'Blog Post',
      impactStats: 'Stat',
      testimonials: 'Testimonial'
    };
    return map[str] || str;
  }

  function emptyState(title, subtitle, bindButtonId) {
    return `
      <div class="empty-state">
        <i class="fas fa-inbox"></i>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(subtitle)}</p>
      </div>
    `;
  }

  // ============================================================
  // ADD BUTTONS (top of panels)
  // ============================================================
  document.getElementById('addSlideBtn').addEventListener('click', function () { openSlideEditor(null); });
  document.getElementById('addProgramBtn').addEventListener('click', function () { openGenericEditor('programs', null); });
  document.getElementById('addBlogBtn').addEventListener('click', function () { openGenericEditor('blogPosts', null); });
  document.getElementById('addStatBtn').addEventListener('click', function () { openGenericEditor('impactStats', null); });
  document.getElementById('addTestimonialBtn').addEventListener('click', function () { openGenericEditor('testimonials', null); });

})();
