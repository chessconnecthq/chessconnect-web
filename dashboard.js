const { createClient } = supabase;
const sb = createClient(
  'https://ipslahlvworwgzbgxppc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlwc2xhaGx2d29yd2d6Ymd4cHBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MjU5NDQsImV4cCI6MjA4ODMwMTk0NH0.P-Fogs9AckDvlImncV_F2JS3UIxZFHg8rOy6HYBQ888',
  { auth: { storageKey: 'cc-auth', flowType: 'pkce' } }
);

// ── EmailJS config ──
const EMAILJS_SERVICE_ID  = 'service_7sh2a9t';
const EMAILJS_TEMPLATE_ID = 'template_89iorxh';
const EMAILJS_PUBLIC_KEY  = 'l0nVoYn8YbCGx87Nj';
let emailJsReady = false;

async function logSaveError(errorObj, context) {
  const entry = {
    source:     'dashboard',
    error_code: errorObj?.code    || 'UNKNOWN',
    error_msg:  errorObj?.message || String(errorObj) || 'Unknown error',
    coach_name: context.name    || null,
    fide_id:    context.fideId  || null,
    city:       context.city    || null,
    country:    context.country || null,
    email:      context.email   || null,
    step:       context.step    || null,
    user_agent: navigator.userAgent.substring(0, 200),
  };
  try { await sb.from('registration_errors').insert([entry]); } catch(e) {}
}

let currentUser = null;
let coachProfile = null;
let selectedMode = '';
let selectedLevels = [];
let selectedLanguages = [];

const COUNTRY_CODE_MAP = {
  'India': '+91', 'United States': '+1', 'United Kingdom': '+44',
  'United Arab Emirates': '+971', 'Canada': '+1', 'Australia': '+61',
  'Germany': '+49', 'Russia': '+7', 'China': '+86', 'France': '+33',
  'Spain': '+34', 'Netherlands': '+31', 'Norway': '+47',
  'Azerbaijan': '+994', 'Armenia': '+374', 'Georgia': '+995',
  'Ukraine': '+380', 'Poland': '+48', 'Hungary': '+36',
  'Romania': '+40', 'Bulgaria': '+359', 'Serbia': '+381',
  'Czech Republic': '+420', 'Turkey': '+90', 'Iran': '+98',
  'Israel': '+972', 'Egypt': '+20', 'South Africa': '+27',
  'Nigeria': '+234', 'Bangladesh': '+880', 'Sri Lanka': '+94',
  'Pakistan': '+92', 'Nepal': '+977', 'Singapore': '+65',
  'Malaysia': '+60', 'Indonesia': '+62', 'Philippines': '+63',
  'Vietnam': '+84', 'Japan': '+81', 'South Korea': '+82',
  'Brazil': '+55', 'Argentina': '+54', 'Mexico': '+52',
  'Colombia': '+57', 'Peru': '+51', 'Cuba': '+53'
};

function autoSelectWaCode(country) {
  const code = COUNTRY_CODE_MAP[country];
  if (!code) return;
  const sel = document.getElementById('dWaCode');
  for (let opt of sel.options) {
    if (opt.value === code) { sel.value = code; break; }
  }
}

sb.auth.onAuthStateChange(async (event, session) => {
  if (event === 'INITIAL_SESSION') {
    if (session?.user) {
      currentUser = session.user;
      await loadDashboard();
    } else {
      showScreen('authWall');
    }
  } else if (event === 'SIGNED_IN') {
    if (!currentUser) {
      currentUser = session.user;
      await loadDashboard();
    }
  } else if (event === 'SIGNED_OUT') {
    currentUser = null;
    showScreen('authWall');
  }
});

async function loadDashboard() {
  showScreen('loadingScreen');
  const name = currentUser.user_metadata?.full_name || currentUser.email || 'Coach';
  const avatar = currentUser.user_metadata?.avatar_url;
  document.getElementById('dashUserName').textContent = name.split(' ')[0];
  const avatarEl = document.getElementById('dashAvatar');
  if (avatar) avatarEl.innerHTML = `<img src="${avatar}" alt="${name}"/>`;
  else avatarEl.textContent = name.charAt(0).toUpperCase();
  document.getElementById('dashUser').style.display = 'flex';

  const { data, error } = await sb.from('coaches').select('*').eq('auth_user_id', currentUser.id).maybeSingle();
  if (error) {
    console.error('Dashboard load error:', JSON.stringify(error));
    document.getElementById('loadingScreen').innerHTML = `
      <div style="text-align:center;padding:2rem;max-width:480px;">
        <p style="font-size:1.1rem;font-weight:700;color:#b91c1c;margin-bottom:0.75rem;">⚠️ Could not load profile</p>
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:1rem;font-size:0.85rem;color:#7f1d1d;line-height:1.7;margin-bottom:1rem;text-align:left;">
          <strong>Error:</strong> ${error.message || JSON.stringify(error)}<br/>
          <strong>Code:</strong> ${error.code || '—'}<br/><br/>
          Please share this with us at <a href="mailto:chessconnect.in@gmail.com" style="color:#1E73E8;">chessconnect.in@gmail.com</a>
        </div>
        <button onclick="window.location.reload()" style="padding:0.75rem 1.5rem;background:#1E73E8;color:#fff;border:none;border-radius:10px;font-size:0.9rem;font-weight:600;cursor:pointer;">Try Again</button>
      </div>`;
    return;
  }
  if (!data) { showScreen('noProfileWall'); return; }
  coachProfile = data;
  populateForm(data);
  showScreen('dashMain');
}

function populateForm(p) {
  const storedWa = p.whatsapp || '';
  let waCode = '+91', waNum = storedWa;
  const codeMatch = storedWa.match(/^(\+\d{1,4})(.*)/);
  if (codeMatch) { waCode = codeMatch[1]; waNum = codeMatch[2].trim(); }
  const codeSel = document.getElementById('dWaCode');
  for (let opt of codeSel.options) { if (opt.value === waCode) { codeSel.value = waCode; break; } }
  document.getElementById('dWhatsapp').value = waNum;

  document.getElementById('dCity').value       = p.city || '';
  document.getElementById('dCountry').value    = p.country || 'India';
  document.getElementById('dBio').value        = p.bio || '';
  updateBioCount();
  document.getElementById('dExperience').value = p.experience || '';
  document.getElementById('dFees').value       = p.fees || '';
  document.getElementById('dFeesCurrency').value = p.fees_currency || 'INR';
  document.getElementById('dTrial').value      = p.trial_available ? 'yes' : 'no';
  document.getElementById('dName').value       = p.full_name || '';
  document.getElementById('dFideId').value     = p.fide_id || '';
  document.getElementById('dTitle').value      = p.chess_title || '—';
  document.getElementById('dRating').value     = p.fide_rating ? `${p.fide_rating} (Classical)` : 'Unrated';

  selectedMode = (p.coaching_mode || '').replace('in-person','Offline');
  document.querySelectorAll('#dModeGroup .pill').forEach(pill => {
    pill.classList.toggle('active', pill.dataset.val.toLowerCase() === selectedMode.toLowerCase());
  });

  selectedLevels = p.levels_taught || [];
  document.querySelectorAll('#dLevelsGroup .pill').forEach(pill => {
    pill.classList.toggle('active', selectedLevels.includes(pill.dataset.val));
  });

  selectedLanguages = p.languages || [];
  document.querySelectorAll('#dLangsGroup .pill').forEach(pill => {
    pill.classList.toggle('active', selectedLanguages.includes(pill.dataset.val));
  });

  updateStatusBanner(p.is_live);
  document.getElementById('toggleLiveBtn').textContent = p.is_live ? 'Hide My Profile' : 'Make Profile Live';

  if (p.id) {
    const url = `${location.origin}${location.pathname.replace('dashboard.html','').replace(/\/$/, '')}/coach.html?id=${p.id}`;
    document.getElementById('profileLinkUrl').textContent = url;
    document.getElementById('profileLinkBar').style.display = 'flex';
    document.getElementById('btnViewProfile').dataset.url = url;
  }

  document.getElementById('dGoogleProfileUrl').value  = p.google_profile_url || '';
  document.getElementById('dWebsiteUrl').value        = p.website_url || '';
  document.getElementById('dChessComUrl').value       = p.chess_com_url || '';
  document.getElementById('dLichessUrl').value        = p.lichess_url || '';
  document.getElementById('dYoutubeUrl').value        = p.youtube_url || '';
  document.getElementById('dAchievements').value      = p.achievements || '';
  document.getElementById('dCertifications').value    = p.certifications || '';

  const displayPhoto = p.photo_pending_url || p.photo_url;
  if (displayPhoto) {
    renderPhotoPreview(displayPhoto);
    document.getElementById('btnRemovePhoto').style.display = 'inline-flex';
    if (p.photo_pending_url && !p.photo_reviewed) {
      document.getElementById('photoReviewBadge').style.display = 'flex';
    }
  } else {
    const name = p.full_name || '?';
    const initials = name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
    document.getElementById('photoPreview').textContent = initials;
  }

  livePreview();
  updateStrength();
}

function updateStatusBanner(isLive) {
  const banner = document.getElementById('statusBanner');
  banner.className = 'status-banner ' + (isLive ? 'live' : 'hidden');
  document.getElementById('statusText').textContent = isLive
    ? 'Your profile is live. Students can find and contact you.'
    : 'Your profile is hidden. Students cannot see you until you make it live again.';
}

function updateBioCount() {
  const bio = document.getElementById('dBio').value.trim();
  const words = bio === '' ? 0 : bio.split(/\s+/).length;
  const el = document.getElementById('bioCount');
  el.textContent = `${words} words${words < 100 ? ' / 100 minimum' : ''}`;
  el.style.color = words >= 100 ? '#166534' : '#999';
}

function toggleMode(el) {
  document.querySelectorAll('#dModeGroup .pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  selectedMode = el.dataset.val;
  livePreview(); updateStrength();
}
function toggleLevel(el) {
  el.classList.toggle('active');
  const v = el.dataset.val;
  selectedLevels = selectedLevels.includes(v) ? selectedLevels.filter(x => x !== v) : [...selectedLevels, v];
  livePreview(); updateStrength();
}
function toggleLang(el) {
  el.classList.toggle('active');
  const v = el.dataset.val;
  selectedLanguages = selectedLanguages.includes(v) ? selectedLanguages.filter(x => x !== v) : [...selectedLanguages, v];
  updateStrength();
}

function livePreview() {
  if (!coachProfile) return;
  const name = coachProfile.full_name || 'Your Name';
  const pcPhoto = document.getElementById('pcPhoto');
  if (!pcPhoto.querySelector('img')) {
    const initials = name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
    pcPhoto.textContent = initials;
  }
  document.getElementById('pcName').textContent = name;
  const titleBadge = document.getElementById('pcTitleBadge');
  if (coachProfile.chess_title) { titleBadge.textContent = coachProfile.chess_title; titleBadge.style.display = 'block'; }
  else { titleBadge.style.display = 'none'; }
  const rating = coachProfile.fide_rating || coachProfile.fide_rapid || coachProfile.fide_blitz;
  document.getElementById('pcRating').textContent = rating ? `FIDE ${coachProfile.fide_rating_type || 'Classical'}: ${rating}` : '';
  const bio = document.getElementById('dBio').value.trim();
  const bioEl = document.getElementById('pcBio');
  if (bio) { bioEl.textContent = bio.length > 120 ? bio.substring(0,117) + '...' : bio; bioEl.style.display = 'block'; }
  else { bioEl.style.display = 'none'; }
  const tags = document.getElementById('pcTags');
  tags.innerHTML = '';
  if (selectedMode) tags.innerHTML += `<span class="pc-tag">${selectedMode}</span>`;
  selectedLevels.slice(0,3).forEach(l => tags.innerHTML += `<span class="pc-tag">${l}</span>`);
  const fees = document.getElementById('dFees').value;
  const curr = document.getElementById('dFeesCurrency').value;
  const sym = curr === 'INR' ? '₹' : curr === 'USD' ? '$' : '€';
  document.getElementById('pcFee').textContent = fees ? `${sym}${fees} / session` : '';
}

async function saveProfile() {
  const btn = document.getElementById('saveBtn');
  const text = document.getElementById('saveText');
  const spinner = document.getElementById('saveSpinner');
  btn.disabled = true; text.textContent = 'Saving...'; spinner.classList.add('show');

  const waCode = document.getElementById('dWaCode').value;
  const waNum  = document.getElementById('dWhatsapp').value.trim();

  const updates = {
    whatsapp:           waCode + waNum,
    city:               document.getElementById('dCity').value.trim(),
    country:            document.getElementById('dCountry').value,
    bio:                document.getElementById('dBio').value.trim(),
    experience:         document.getElementById('dExperience').value,
    coaching_mode:      selectedMode,
    levels_taught:      selectedLevels,
    languages:          selectedLanguages,
    fees:               document.getElementById('dFees').value ? parseInt(document.getElementById('dFees').value) : null,
    fees_currency:      document.getElementById('dFeesCurrency').value,
    trial_available:    document.getElementById('dTrial').value === 'yes',
    google_profile_url: document.getElementById('dGoogleProfileUrl').value.trim() || null,
    website_url:        document.getElementById('dWebsiteUrl').value.trim() || null,
    chess_com_url:      document.getElementById('dChessComUrl').value.trim() || null,
    lichess_url:        document.getElementById('dLichessUrl').value.trim() || null,
    youtube_url:        document.getElementById('dYoutubeUrl').value.trim() || null,
    achievements:       document.getElementById('dAchievements').value.trim() || null,
    certifications:     document.getElementById('dCertifications').value.trim() || null,
  };

  const { error } = await sb.from('coaches').update(updates).eq('id', coachProfile.id);
  btn.disabled = false; spinner.classList.remove('show');
  if (error) {
    text.textContent = 'Save Changes';
    const ctx = {
      name:    coachProfile.full_name,
      fideId:  coachProfile.fide_id,
      city:    document.getElementById('dCity').value,
      country: document.getElementById('dCountry').value,
      email:   currentUser?.email,
      step:    'Dashboard — profile save',
    };
    await logSaveError(error, ctx);
    showSaveError(error.message || 'Unknown error', error.code);
  } else {
    text.textContent = 'Save Changes';
    Object.assign(coachProfile, updates);
    showToast('Profile updated!', 'success');
  }
}

async function toggleLive() {
  const newState = !coachProfile.is_live;
  const { error } = await sb.from('coaches').update({ is_live: newState }).eq('id', coachProfile.id);
  if (!error) {
    coachProfile.is_live = newState;
    updateStatusBanner(newState);
    document.getElementById('toggleLiveBtn').textContent = newState ? 'Hide My Profile' : 'Make Profile Live';
    showToast(newState ? 'Profile is now live!' : 'Profile hidden.', 'success');
  }
}

function confirmDelete() { document.getElementById('confirmOverlay').classList.add('show'); }
function closeConfirm()  { document.getElementById('confirmOverlay').classList.remove('show'); }

async function deleteProfile() {
  closeConfirm();
  const { error } = await sb.from('coaches').update({ is_deleted: true, is_live: false }).eq('id', coachProfile.id);
  if (!error) { await sb.auth.signOut(); window.location.href = 'index.html'; }
  else { showToast('Error deleting profile. Please try again.', 'error'); }
}

async function signInWithGoogle() {
  await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: 'https://chessconnecthq.github.io/chessconnect-web/dashboard.html' } });
}
async function signOut() { try { await sb.auth.signOut(); } catch(e) {} finally { window.location.href = 'index.html'; } }

function showScreen(id) {
  ['loadingScreen','authWall','noProfileWall','dashMain'].forEach(s => {
    const el = document.getElementById(s);
    if (s === 'dashMain') el.classList.toggle('visible', s === id);
    else el.style.display = s === id ? 'flex' : 'none';
  });
}
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = 'toast ' + type; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

function showSaveError(msg, code) {
  const codeStr = code ? `<strong>Error code:</strong> ${code}<br>` : '';
  let overlay = document.getElementById('dashErrorOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'dashErrorOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(10,20,40,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem;backdrop-filter:blur(4px);';
    overlay.innerHTML = `
      <div style="background:#fff;border-radius:16px;padding:2rem;max-width:480px;width:100%;box-shadow:0 24px 64px rgba(0,0,0,0.25);">
        <p style="font-size:1rem;font-weight:700;color:#b91c1c;margin-bottom:0.75rem;">⚠️ Save Failed</p>
        <div id="dashErrorBody" style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:1rem;font-size:0.85rem;color:#7f1d1d;line-height:1.7;margin-bottom:1rem;"></div>
        <button onclick="document.getElementById('dashErrorOverlay').style.display='none'"
          style="width:100%;padding:0.75rem;background:#1E73E8;color:#fff;border:none;border-radius:10px;font-size:0.95rem;font-weight:600;cursor:pointer;">
          OK, I'll contact support
        </button>
      </div>`;
    document.body.appendChild(overlay);
  }
  document.getElementById('dashErrorBody').innerHTML =
    `${codeStr}<strong>Error details:</strong> ${msg}<br><br>` +
    `Please email us at <a href="mailto:chessconnect.in@gmail.com" style="color:#1E73E8;font-weight:600;">chessconnect.in@gmail.com</a> with this error and we'll fix it within 24 hours.`;
  overlay.style.display = 'flex';
}

// ── Photo helpers ──
let cropper = null;

function renderPhotoPreview(url) {
  const prev = document.getElementById('photoPreview');
  prev.innerHTML = `<img src="${url}" alt="Profile photo" onerror="this.parentElement.textContent='?'"/>`;
  const pcPhoto = document.getElementById('pcPhoto');
  if (pcPhoto) pcPhoto.innerHTML = `<img src="${url}" alt="Profile photo" onerror="this.parentElement.textContent='?'"/>`;
}

function handlePhotoUpload(input) {
  const file = input.files[0];
  if (!file) return;
  const allowed = ['image/jpeg','image/jpg','image/png'];
  if (!allowed.includes(file.type)) {
    showToast('Please upload a JPG or PNG image.', 'error'); input.value = ''; return;
  }
  if (file.size > 400 * 1024) {
    showToast('Image must be under 400KB. Please compress and retry.', 'error'); input.value = ''; return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    const cropImg = document.getElementById('cropImage');
    cropImg.src = e.target.result;
    document.getElementById('cropOverlay').classList.add('show');
    if (cropper) { cropper.destroy(); cropper = null; }
    cropImg.onload = () => {
      cropper = new Cropper(cropImg, {
        aspectRatio: 1,
        viewMode: 1,
        dragMode: 'move',
        autoCropArea: 0.85,
        restore: false,
        guides: false,
        center: true,
        highlight: false,
        cropBoxMovable: true,
        cropBoxResizable: true,
        toggleDragModeOnDblclick: false,
      });
    };
  };
  reader.readAsDataURL(file);
  input.value = '';
}

function closeCropModal() {
  document.getElementById('cropOverlay').classList.remove('show');
  if (cropper) { cropper.destroy(); cropper = null; }
}

async function confirmCrop() {
  if (!cropper) return;
  const btn = document.querySelector('.btn-crop-confirm');
  btn.textContent = 'Uploading...'; btn.disabled = true;

  const canvas = cropper.getCroppedCanvas({ width: 400, height: 400, imageSmoothingQuality: 'high' });
  canvas.toBlob(async (blob) => {
    closeCropModal();
    const prog = document.getElementById('uploadProgress');
    const bar  = document.getElementById('uploadBar');
    const stat = document.getElementById('uploadStatus');
    prog.classList.add('show'); bar.style.width = '30%'; stat.textContent = 'Uploading...';

    const fileName = `coach_${coachProfile.id}_${Date.now()}.jpg`;
    const { data, error } = await sb.storage.from('coach-photos').upload(fileName, blob, {
      cacheControl: '3600', upsert: true, contentType: 'image/jpeg'
    });
    bar.style.width = '80%';
    if (error) {
      prog.classList.remove('show'); bar.style.width = '0%';
      showToast('Upload failed: ' + error.message, 'error');
      btn.textContent = 'Use This Photo'; btn.disabled = false;
      return;
    }
    const { data: urlData } = sb.storage.from('coach-photos').getPublicUrl(fileName);
    const publicUrl = urlData.publicUrl;
    bar.style.width = '100%'; stat.textContent = 'Done!';
    setTimeout(() => { prog.classList.remove('show'); bar.style.width = '0%'; }, 1200);

    await sb.from('coaches').update({
      photo_pending_url: publicUrl,
      photo_reviewed: false
    }).eq('id', coachProfile.id);

    coachProfile.photo_pending_url = publicUrl;
    coachProfile.photo_reviewed = false;

    renderPhotoPreview(publicUrl);
    document.getElementById('btnRemovePhoto').style.display = 'inline-flex';
    document.getElementById('photoReviewBadge').style.display = 'flex';

    btn.textContent = 'Use This Photo'; btn.disabled = false;
    updateStrength();
    showToast('Photo uploaded! It will appear publicly once reviewed.', 'success');
  }, 'image/jpeg', 0.9);
}

async function removePhoto() {
  await sb.from('coaches').update({
    photo_url: null,
    photo_pending_url: null,
    photo_reviewed: false
  }).eq('id', coachProfile.id);
  coachProfile.photo_url = null;
  coachProfile.photo_pending_url = null;

  const name = coachProfile?.full_name || '?';
  const initials = name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
  document.getElementById('photoPreview').textContent = initials;
  const pcPhoto = document.getElementById('pcPhoto');
  if (pcPhoto) pcPhoto.textContent = initials;
  document.getElementById('btnRemovePhoto').style.display = 'none';
  document.getElementById('photoReviewBadge').style.display = 'none';
  updateStrength();
  showToast('Photo removed.', 'success');
}

// ── Profile Strength Ring ──
function updateStrength() {
  if (!coachProfile) return;

  const photoUrl   = coachProfile.photo_pending_url || coachProfile.photo_url;
  const bio        = document.getElementById('dBio').value.trim();
  const bioWords   = bio === '' ? 0 : bio.split(/\s+/).length;
  const fees       = document.getElementById('dFees').value;
  const whatsapp   = document.getElementById('dWhatsapp').value.trim();
  const google     = document.getElementById('dGoogleProfileUrl').value.trim();
  const chesscom   = document.getElementById('dChessComUrl').value.trim();
  const lichess    = document.getElementById('dLichessUrl').value.trim();
  const website    = document.getElementById('dWebsiteUrl').value.trim();
  const achieve    = document.getElementById('dAchievements').value.trim();
  const certs      = document.getElementById('dCertifications').value.trim();
  const mode       = selectedMode;
  const trial      = document.getElementById('dTrial').value;
  const langs      = selectedLanguages;

  const checks = [
    { done: !!photoUrl,              pts: 15, label: 'Add a profile photo' },
    { done: bioWords >= 100,         pts: 10, label: 'Complete your bio (100+ words)' },
    { done: !!fees,                  pts: 10, label: 'Add your session fees' },
    { done: !!whatsapp,              pts: 10, label: 'Add your WhatsApp number' },
    { done: !!google,                pts: 10, label: 'Add your Google Business Profile link' },
    { done: !!(chesscom || lichess), pts: 8,  label: 'Add Chess.com or Lichess profile' },
    { done: !!website,               pts: 7,  label: 'Add your website' },
    { done: !!achieve,               pts: 7,  label: 'Add your achievements' },
    { done: !!certs,                 pts: 6,  label: 'Add certifications' },
    { done: !!mode,                  pts: 5,  label: 'Select coaching mode' },
    { done: trial === 'yes',         pts: 5,  label: 'Offer a trial class' },
    { done: langs.length >= 2,       pts: 4,  label: 'Add languages you teach in' },
  ];

  const total  = checks.reduce((s, c) => s + c.pts, 0);
  const earned = checks.filter(c => c.done).reduce((s, c) => s + c.pts, 0);
  const pct    = Math.min(100, Math.round((earned / total) * 100));

  const circumference = 238.76;
  const offset = circumference - (circumference * pct / 100);
  const fill   = document.getElementById('strengthRingFill');
  fill.style.strokeDashoffset = offset;
  fill.style.stroke = pct >= 80 ? '#22c55e' : pct >= 50 ? '#1E73E8' : '#f59e0b';

  document.getElementById('strengthPct').textContent = pct + '%';
  document.getElementById('strengthPct').style.color = pct >= 80 ? '#166534' : pct >= 50 ? '#1E73E8' : '#b45309';

  const titleEl = document.getElementById('strengthTitle');
  if (pct === 100) titleEl.textContent = '🏆 Profile complete!';
  else if (pct >= 80) titleEl.textContent = '🌟 Strong profile';
  else if (pct >= 50) titleEl.textContent = '👍 Good progress';
  else titleEl.textContent = '🚀 Build your profile';

  const tipsEl  = document.getElementById('strengthTips');
  const labelEl = document.getElementById('strengthLabel');
  const pending = checks.filter(c => !c.done);
  if (pending.length === 0) {
    labelEl.textContent = 'You have a complete profile — great work!';
    tipsEl.innerHTML = '';
  } else {
    labelEl.textContent = 'Complete these to attract more students:';
    tipsEl.innerHTML = pending.slice(0, 3).map(c =>
      `<li class="strength-tip">${c.label} <span style="font-size:0.72rem;color:#1E73E8;font-weight:700;margin-left:auto;">+${c.pts}pts</span></li>`
    ).join('');
  }
}

function getMyProfileUrl() { return document.getElementById('btnViewProfile')?.dataset.url || ''; }
function viewMyProfile() { const url = getMyProfileUrl(); if (url) window.open(url, '_blank'); }
function shareMyProfile() {
  const url = getMyProfileUrl();
  const name = coachProfile?.full_name || 'Coach';
  const msg = encodeURIComponent(`Hi! I'm ${name}, a FIDE-rated chess coach. Check out my profile on ChessConnect:\n${url}`);
  window.open(`https://wa.me/?text=${msg}`, '_blank');
}
function copyMyProfileLink() {
  const url = getMyProfileUrl();
  navigator.clipboard.writeText(url).then(() => {
    const btn = document.querySelector('.btn-link-copy');
    const orig = btn.innerHTML;
    btn.innerHTML = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Copied!`;
    btn.style.color = '#166534'; btn.style.borderColor = '#22c55e';
    setTimeout(() => { btn.innerHTML = orig; btn.style.color = ''; btn.style.borderColor = ''; }, 2000);
  });
}

// ── TAB SWITCHER ──
function switchTab(tab) {
  document.getElementById('panelProfile').classList.toggle('active', tab === 'profile');
  document.getElementById('panelAnalytics').classList.toggle('active', tab === 'analytics');
  document.getElementById('tabBtnProfile').classList.toggle('active', tab === 'profile');
  document.getElementById('tabBtnAnalytics').classList.toggle('active', tab === 'analytics');
  if (tab === 'analytics' && coachProfile && an_allEnquiries.length === 0 && !an_loaded) {
    an_loadEnquiries();
  }
}

// ── ANALYTICS ──
let an_allEnquiries = [];
let an_currentRange = 7;
let an_loaded = false;

async function an_loadEnquiries() {
  if (!coachProfile) return;
  an_loaded = true;
  const { data: enqs } = await sb.from('enquiries').select('*').eq('coach_id', coachProfile.id).order('created_at', { ascending: false });
  an_allEnquiries = enqs || [];
  an_renderAll();
}

function an_setRange(days, btn) {
  an_currentRange = days;
  document.querySelectorAll('.an-time-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  an_renderAll();
}

function an_getFiltered() {
  if (an_currentRange === 0) return an_allEnquiries;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - an_currentRange);
  return an_allEnquiries.filter(e => new Date(e.created_at) >= cutoff);
}

function an_renderAll() {
  const data = an_getFiltered();
  an_renderStats(data); an_renderChart(data); an_renderCities(data); an_renderRecent(data);
}

function an_renderStats(data) {
  const views = data.filter(e => e.type==='view').length;
  const wa    = data.filter(e => e.type==='whatsapp').length;
  const calls = data.filter(e => e.type==='call').length;
  document.getElementById('anStatViews').textContent = views;
  document.getElementById('anStatWa').textContent    = wa;
  document.getElementById('anStatCalls').textContent = calls;
  const total = views + wa + calls;
  const label = an_currentRange === 0 ? 'all time' : `last ${an_currentRange} days`;
  document.getElementById('anStatViewsSub').textContent  = total > 0 ? `${((views/total)*100).toFixed(0)}% of total · ${label}` : `No data · ${label}`;
  document.getElementById('anStatWaSub').textContent     = wa > 0 ? `${((wa/(views||1))*100).toFixed(0)}% view→tap rate` : `No taps · ${label}`;
  document.getElementById('anStatCallsSub').textContent  = calls > 0 ? `${((calls/(views||1))*100).toFixed(0)}% view→call rate` : `No calls · ${label}`;
}

function an_renderChart(data) {
  const canvas = document.getElementById('anChartCanvas');
  const empty  = document.getElementById('anChartEmpty');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const days = an_currentRange === 0 ? 30 : an_currentRange;
  const buckets = [];
  for (let i = days-1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate()-i);
    buckets.push({ label: d.toLocaleDateString('en-IN',{day:'numeric',month:'short'}), date: d.toDateString(), views:0, wa:0, calls:0 });
  }
  data.forEach(e => {
    const b = buckets.find(b => b.date === new Date(e.created_at).toDateString());
    if (!b) return;
    if (e.type==='view') b.views++; else if (e.type==='whatsapp') b.wa++; else if (e.type==='call') b.calls++;
  });
  const hasData = buckets.some(b => b.views+b.wa+b.calls > 0);
  if (!hasData) { canvas.style.display='none'; empty.style.display='flex'; return; }
  canvas.style.display='block'; empty.style.display='none';
  canvas.width = canvas.parentElement.clientWidth || 600; canvas.height = 180;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const W=canvas.width, H=canvas.height, padL=36, padR=16, padT=16, padB=32;
  const chartW=W-padL-padR, chartH=H-padT-padB;
  const maxVal = Math.max(...buckets.map(b=>b.views+b.wa+b.calls),1);
  const colW = chartW/buckets.length;
  ctx.strokeStyle='#E2E8F4'; ctx.lineWidth=1;
  for (let i=0;i<=4;i++) {
    const y=padT+(chartH/4)*i;
    ctx.beginPath(); ctx.moveTo(padL,y); ctx.lineTo(W-padR,y); ctx.stroke();
    ctx.fillStyle='#7A8AA0'; ctx.font='10px sans-serif'; ctx.textAlign='right';
    ctx.fillText(Math.round(maxVal-(maxVal/4)*i), padL-4, y+3);
  }
  buckets.forEach((b,i) => {
    const x=padL+i*colW+colW*0.15, bW=colW*0.7; let yB=padT+chartH;
    const bar = (val,color) => {
      if (!val) return; const bH=(val/maxVal)*chartH; ctx.fillStyle=color;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x,yB-bH,bW,bH,[3,3,0,0]); else ctx.rect(x,yB-bH,bW,bH);
      ctx.fill(); yB-=bH;
    };
    bar(b.calls,'#F59E0B'); bar(b.wa,'#25D366'); bar(b.views,'#1E73E8');
  });
  const every=Math.ceil(buckets.length/8);
  ctx.fillStyle='#7A8AA0'; ctx.font='10px sans-serif'; ctx.textAlign='center';
  buckets.forEach((b,i) => { if (i%every!==0) return; ctx.fillText(b.label, padL+i*colW+colW/2, H-6); });
}

function an_renderCities(data) {
  const el = document.getElementById('anCitiesList');
  const cc = {};
  data.forEach(e => { if (e.student_city) cc[e.student_city]=(cc[e.student_city]||0)+1; });
  const sorted = Object.entries(cc).sort((a,b)=>b[1]-a[1]).slice(0,6);
  if (!sorted.length) { el.innerHTML='<div class="an-empty">No city data yet</div>'; return; }
  const max = sorted[0][1];
  el.innerHTML = sorted.map(([city,count],i) => `
    <div class="an-city-row">
      <span class="an-city-rank">${i+1}</span>
      <span class="an-city-name">${city}</span>
      <div class="an-city-bar-wrap"><div class="an-city-bar" style="width:${(count/max*100).toFixed(0)}%"></div></div>
      <span class="an-city-count">${count}</span>
    </div>`).join('');
}

function an_renderRecent(data) {
  const el = document.getElementById('anRecentList');
  const recent = [...data].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,10);
  if (!recent.length) { el.innerHTML='<div class="an-empty">No activity yet</div>'; return; }
  el.innerHTML = recent.map(e => {
    const lbl = e.type==='view'?'View':e.type==='whatsapp'?'WhatsApp':'Call';
    const cls = e.type==='view'?'an-badge-view':e.type==='whatsapp'?'an-badge-wa':'an-badge-call';
    return `<div class="an-enquiry-row">
      <div class="an-enquiry-type">
        <span class="an-badge ${cls}">${lbl}</span>
        ${e.student_city?`<span style="font-size:0.8rem;color:var(--sub)">from ${e.student_city}</span>`:''}
      </div>
      <span class="an-enquiry-time">${an_timeAgo(new Date(e.created_at))}</span>
    </div>`;
  }).join('');
}

function an_timeAgo(date) {
  const diff = Math.floor((new Date() - date) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}
