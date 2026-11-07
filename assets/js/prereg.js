/* 사전예약 — 휴대폰 번호를 Firestore preregistrations에 '새로 만들기'만 한다.
   읽기는 규칙이 막는다(firestore.rules). 문서 id = SHA-256("kites-and-wisps:" + 번호) → 같은 번호는 한 번만.
   Firebase SDK는 제출할 때만 불러온다. */
const FIREBASE = {
  apiKey: 'AIzaSyCMZczTMdaVD7JRFHTCMxikBSFhNDUJZFU',
  authDomain: 'kites-and-wisps.firebaseapp.com',
  projectId: 'kites-and-wisps',
  appId: '1:481592583020:web:59c67e8f140c07c23d0949',
};
const SDK = 'https://www.gstatic.com/firebasejs/11.0.2/';
const CONSENT_VERSION = 'ko-2026-11-07';

const form = document.getElementById('prereg-form');
if (form) init();

function init() {
  const phone = form.querySelector('#pf-phone');
  const err = document.getElementById('pf-error');
  const all = document.getElementById('ck-all');
  const items = [...form.querySelectorAll('.ck-item')];
  const btn = form.querySelector('.pf-submit');
  const btnText = btn.textContent;
  const done = document.getElementById('prereg-done');

  // 하이픈 자동: 010-1234-5678 / 011-123-4567
  phone.addEventListener('input', () => {
    const d = phone.value.replace(/\D/g, '').slice(0, 11);
    phone.value = d.length < 4 ? d : d.length < 8 ? `${d.slice(0, 3)}-${d.slice(3)}`
      : d.length === 10 ? `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}` : `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
    err.textContent = '';
  });
  all.addEventListener('change', () => { items.forEach(c => (c.checked = all.checked)); err.textContent = ''; });
  items.forEach(c => c.addEventListener('change', () => { all.checked = items.every(x => x.checked); err.textContent = ''; }));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    err.textContent = '';
    if (form.website.value) return; // 봇 함정 칸
    const platform = form.querySelector('input[name=platform]:checked');
    const num = phone.value.replace(/\D/g, '');
    if (!platform) return fail('플레이할 기기를 골라 주세요.', form.querySelector('input[name=platform]'));
    if (!/^01[016789]\d{7,8}$/.test(num)) return fail('휴대폰 번호를 다시 확인해 주세요. (예: 010-1234-5678)', phone);
    const miss = items.find(c => !c.checked);
    if (miss) return fail('필수 항목에 모두 동의해 주세요.', miss);

    btn.disabled = true; btn.textContent = '예약하는 중…';
    try {
      const [{ initializeApp, getApps }, fs] = await Promise.all([
        import(SDK + 'firebase-app.js'), import(SDK + 'firebase-firestore.js'),
      ]);
      const app = getApps()[0] || initializeApp(FIREBASE);
      const db = fs.getFirestore(app);
      const id = await sha256('kites-and-wisps:' + num);
      await fs.setDoc(fs.doc(db, 'preregistrations', id), {
        phone: num, platform: platform.value, age14: true, agreePrivacy: true, agreeAds: true,
        consentVersion: CONSENT_VERSION, lang: 'ko', createdAt: fs.serverTimestamp(),
      });
      show(false);
    } catch (x) {
      // 같은 번호가 이미 있으면 규칙상 '새로 만들기'가 아니라 거부된다 → 이미 예약된 번호로 안내
      if (x && x.code === 'permission-denied') show(true);
      else { console.error(x); fail('잠시 연결이 원활하지 않아요. 조금 뒤 다시 시도해 주세요.'); }
    } finally {
      btn.disabled = false; btn.textContent = btnText;
    }
  });

  function fail(msg, el) { err.textContent = msg; if (el) el.focus(); }
  function show(already) {
    form.hidden = true; done.hidden = false;
    if (already) {
      document.getElementById('prereg-done-title').textContent = '이미 사전예약된 번호예요';
      document.getElementById('prereg-done-msg').innerHTML = '이 번호로 이미 예약되어 있어요.<br>출시하는 날 문자로 알려 드릴게요.';
    }
    done.focus();
  }
}

async function sha256(s) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
}

/* 휴대폰 하단 고정 버튼: 히어로를 지나면 보이고, 사전예약 칸이 보이면 숨김 */
const sticky = document.getElementById('sticky-cta');
const sec = document.getElementById('prereg');
const hero = document.getElementById('top');
if (sticky && sec && hero && 'IntersectionObserver' in window) {
  let heroIn = true, secIn = false;
  const upd = () => sticky.classList.toggle('show', !heroIn && !secIn);
  new IntersectionObserver(([e]) => { heroIn = e.isIntersecting; upd(); }).observe(hero);
  new IntersectionObserver(([e]) => { secIn = e.isIntersecting; upd(); }, { threshold: 0.05 }).observe(sec);
}
