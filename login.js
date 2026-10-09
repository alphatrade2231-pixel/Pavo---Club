import { isConfigured } from '../config.js';
import { signIn, signOut, getSession, checkIsAdmin, friendlyError } from '../api.js';
import { t, initLang, toggleLang, onLangChange, applyI18n } from '../i18n.js';
import { $ } from '../utils.js';
import { withBusy } from './ui.js';

initLang('ar');
$('#lang-btn').addEventListener('click', toggleLang);
onLangChange(() => { $('#lang-btn').textContent = t('lang.switch'); });
$('#lang-btn').textContent = t('lang.switch');
const msg = $('#msg');
const show = (text) => { msg.textContent = text; msg.hidden = !text; };

if (!isConfigured()) show(t('err.config'));
else {
  if (new URLSearchParams(location.search).get('denied')) show(t('err.notAdmin'));
  else getSession().then(async (s) => { if (s && await checkIsAdmin()) location.replace('dashboard.html'); }).catch(() => {});
}
$('#login-form').addEventListener('submit', (e) => {
  e.preventDefault(); show('');
  if (!isConfigured()) return show(t('err.config'));
  withBusy($('#login-btn'), async () => {
    try {
      await signIn($('#email').value.trim(), $('#password').value);
      if (!(await checkIsAdmin())) { await signOut(); return show(t('err.notAdmin')); }
      location.replace('dashboard.html');
    } catch (err) { show(/invalid login|credentials/i.test(err.message) ? t('err.auth') : friendlyError(err)); }
  });
});
