// One-record editor (club identity, settings) stored in club_settings row id=1.
import { saveClubSettings, uploadImage, removeImage, friendlyError } from '../api.js';
import { t } from '../i18n.js';
import { esc, toast } from '../utils.js';
import { buildForm, readForm, withBusy, setDirty } from './ui.js';

export function mountSingle(ctx, { fields, toForm, toPayload, validate, introKey }) {
  const { main, settings } = ctx;
  const form = buildForm(fields, toForm ? toForm(settings) : settings);
  main.innerHTML = introKey ? `<p class="note">${esc(t(introKey))}</p>` : '';
  const card = document.createElement('div'); card.className = 'card'; card.append(form); main.append(card);
  form.insertAdjacentHTML('beforeend', `<div class="dlg-actions span-2"><button type="submit" class="btn btn-primary">${esc(t('common.save'))}</button></div>`);
  form.addEventListener('input', () => setDirty(true)); form.addEventListener('change', () => setDirty(true));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    withBusy(form.querySelector('[type=submit]'), async () => {
      const uploaded = [], old = [];
      try {
        const v = readForm(form, fields);
        const err = validate?.(v); if (err) { toast(err, 'error'); return; }
        const cols = {};
        for (const f of fields.filter((x) => x.type === 'image')) {
          const st = form._imgs[f.name];
          if (st.file) { const p = await uploadImage(f.bucket, f.folder, st.file); uploaded.push([f.bucket, p]); cols[f.name] = p; if (st.current) old.push([f.bucket, st.current]); }
          else if (st.removed) { cols[f.name] = null; if (st.current) old.push([f.bucket, st.current]); }
        }
        let saved;
        try { saved = await saveClubSettings({ ...(toPayload ? toPayload(v) : v), ...cols }); }
        catch (e) { await Promise.all(uploaded.map(([b, p]) => removeImage(b, p))); throw e; }
        await Promise.all(old.map(([b, p]) => removeImage(b, p)));
        ctx.settings = saved; await ctx.refreshSettings();
        setDirty(false); toast(t('common.saved'));
        // rebuild so image fields show the stored state
        mountSingle(ctx, { fields, toForm, toPayload, validate, introKey });
      } catch (e) { toast(friendlyError(e), 'error'); }
    });
  });
}
